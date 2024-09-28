import { createClient, RedisClientType } from 'redis'
import { config } from '../../config/config'
import { promisify } from 'util'
const redisConfig = {
  url: config.redis.host,
  password: config.redis.password,
}

const client: RedisClientType = createClient(redisConfig)

client.on('error', (err) => {
  console.error('Redis error:', err)
})

const zrevrangeAsync = promisify(client.xRevRange).bind(client)
const getAsync = promisify(client.get).bind(client)
const zincrbyAsync = promisify(client.zIncrBy).bind(client)
const incrAsync = promisify(client.incr).bind(client)
const zrankAsync = promisify(client.zRank).bind(client)

async function connectRedis() {
  if (!client.isOpen) {
    await client.connect()
  }
}
/**
 * 给用户设置能量缓存
 * @param userId 用户Id
 * @param energy 能量值
 */
async function setUserEnergy(userId: string, energy: number): Promise<void> {
  await connectRedis()
  try {
    await client.set(
      `${config.sitename}user_energy_${userId}`,
      energy.toString()
    )
  } catch (err) {
    console.error('Redis set error:', err)
  }
}

/**
 * 获取用户能量值
 * @param userId 用户Id
 * @returns energy 能量值
 */
async function getUserEnergy(userId: string): Promise<number> {
  await connectRedis()
  try {
    const energy = await client.get(`${config.sitename}user_energy_${userId}`)
    return energy ? parseInt(energy, 10) : 0
  } catch (err) {
    console.error('Redis get error:', err)
    return 0
  }
}

async function incrementUserEnergy(
  userId: string,
  increment: number,
  maxEnergy: number
): Promise<void> {
  await connectRedis()
  try {
    const energy = await client.get(`${config.sitename}user_energy_${userId}`)
    const newEnergy = Math.min(
      (energy ? parseInt(energy, 10) : 0) + increment,
      maxEnergy
    )
    await client.set(
      `${config.sitename}user_energy_${userId}`,
      newEnergy.toString()
    )
  } catch (err) {
    console.error('Redis increment error:', err)
  }
}

/**
 * 设置Telegram 用户数据缓存
 * @param userId Telegram 用户Id
 * @param userData
 */
async function setTelegramUserData(
  userId: string,
  userData: any
): Promise<void> {
  await connectRedis()
  try {
    await client.set(
      `${config.sitename}telegram_user_${userId}`,
      JSON.stringify(userData)
    )
  } catch (err) {
    console.error('Redis set telegram user data error:', err)
  }
}

/**
 *
 * @param userId  Telegram 用户Id
 * @returns userData
 */
async function getTelegramUserData(userId: string): Promise<any | null> {
  await connectRedis()
  try {
    const userDataStr = await client.get(
      `${config.sitename}telegram_user_${userId}`
    )
    return userDataStr ? JSON.parse(userDataStr) : null
  } catch (err) {
    console.error('Redis get telegram user data error:', err)
    return null
  }
}

/**
 * 获取邀请排行榜
 * @param page 当前页码
 * @param pageSize 每页记录数
 * @returns 排行榜信息
 */
async function getInvitationLeaderboard(
  page: number = 1,
  pageSize: number = 10
): Promise<any[]> {
  await connectRedis()
  try {
    const start = (page - 1) * pageSize
    const stop = start + pageSize - 1

    // 使用 zrevrangeAsync 获取有序集合的成员列表和分数（即奖励总数）
    const leaderboard = await zrevrangeAsync(
      `${config.sitename}inviters`,
      start,
      stop,
      'WITHSCORES'
    )

    const formattedLeaderboard = []
    let rank = start + 1

    for (let i = 0; i < leaderboard.length; i += 2) {
      const userId = leaderboard[i]
      const totalRewardStr = leaderboard[i + 1] // 获取字符串形式的奖励总数

      const totalReward = totalRewardStr ? parseInt(totalRewardStr, 10) : 0 // 解析为整数

      const username = await getAsync(
        `${config.sitename}inviter_${userId}_username`
      )
      const inviteCount = await getAsync(
        `${config.sitename}inviter_${userId}_count`
      )

      formattedLeaderboard.push({
        userId,
        username: username || '未知',
        inviteCount: inviteCount ? parseInt(inviteCount, 10) : 0,
        totalReward: totalReward || 0, // 确保总奖励是数字类型
        rank: rank++,
      })
    }

    return formattedLeaderboard
  } catch (err) {
    console.error('Redis get leaderboard error:', err)
    return []
  }
}

/**
 * 获取用户的排名
 * @param userId 用户Id
 * @returns 用户的排名信息
 */
async function getUserRank(userId: string): Promise<any> {
  await connectRedis()
  try {
    const rank = await zrankAsync(`${config.sitename}inviters`, userId)
    const totalRewardStr = await getAsync(`inviter_${userId}_reward`)
    const totalReward = totalRewardStr ? parseInt(totalRewardStr, 10) : 0
    const inviteCountStr = await getAsync(`inviter_${userId}_count`)
    const inviteCount = inviteCountStr ? parseInt(inviteCountStr, 10) : 0

    return {
      userId,
      rank: rank !== null ? rank + 1 : null, // 如果用户存在于排行榜中，rank从0开始，因此需要加1
      totalReward,
      inviteCount,
    }
  } catch (err) {
    console.error('Redis get user rank error:', err)
    return null
  }
}

/**
 * 增加邀请人数和奖励
 * @param userId 邀请者的用户Id
 * @param rewardAmount 奖励数量
 */
async function increaseInvitationStats(
  userId: string,
  rewardAmount: number
): Promise<void> {
  await connectRedis()
  try {
    // 使用 Redis 原子操作增加邀请者的奖励总数和邀请人数
    await zincrbyAsync(`${config.sitename}inviters`, rewardAmount, userId)
    await incrAsync(`${config.sitename}inviter_${userId}_count`)
    await zincrbyAsync(
      `${config.sitename}inviter_${userId}_reward`,
      rewardAmount,
      userId
    )
  } catch (err) {
    console.error('Redis increase invitation stats error:', err)
  }
}

export {
  setUserEnergy,
  getUserEnergy,
  incrementUserEnergy,
  setTelegramUserData,
  getTelegramUserData,
  getInvitationLeaderboard,
  getUserRank,
  increaseInvitationStats,
}
