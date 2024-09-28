//src/middlewares/verifyTelegramLogin.ts
import { Request, Response, NextFunction } from 'express'
import { validateHash } from '../utils/telegram'
import { config } from '../../src/config/config'
import {
  setAsync,
  getAsync,
  delAsync,
  keyfix,
} from '../utils/cache/redisClient'
import { parseUserAgent } from '../utils/System'
import crypto from 'crypto'

const TELEGRAM_BOT_TOKEN = config.telegram.token

// 验证 Telegram 登录
export async function verifyTelegramLogin(
  req: Request,
  res: Response,
  next: Function
) {
  const { initData, initDataUnsafe } = req.body

  const userAgent = req.headers['user-agent']
  if (!userAgent) {
    return res.status(401).json({ success: false, message: 'Login restricted' })
  }

  const systemInfo = parseUserAgent(userAgent)
  if (systemInfo) {
    console.log(`Operating System: ${systemInfo.os}`)
    console.log(`Version: ${systemInfo.version}`)
    req.version = systemInfo.version
    req.os = systemInfo.os
  } else {
    console.log('Operating System not recognized')
  }

  if (!initData || !initDataUnsafe) {
    return res
      .status(401)
      .json({ success: false, message: 'Invalid login data' })
  }

  //验证签名是否被伪造
  if (validateHash(initData, TELEGRAM_BOT_TOKEN)) {
    //如果用户名为空，不允许登陆

    if (
      !initDataUnsafe.user.username ||
      initDataUnsafe.user.username == '' ||
      initDataUnsafe.user.username == null ||
      initDataUnsafe.user.username == undefined
    ) {
      res.status(403).send('Username is empty')
    }

    // 86400 seconds = 1 day
    req.user = initDataUnsafe
    // 获取客户端 IP 地址
    const clientIp =
      req.headers['x-real-ip'] || // 尝试获取真实 IP
      req.headers['x-forwarded-for']?.toString().split(',')[0] || // 或获取转发的 IP
      req.connection.remoteAddress // 最后使用连接的远程地址

    req.clientIp = (clientIp as string) || ''

    // 检查是否已有 authToken
    let authToken = await getAsync(
      `${keyfix.AuthToken}${initDataUnsafe.user.id}`
    )

    if (!authToken) {
      // 如果没有旧的 authToken，生成新的并存储
      authToken = crypto.randomBytes(16).toString('hex')
      await setAsync(
        `${keyfix.AuthToken}${initDataUnsafe.user.id}`,
        authToken,
        86400 // 设置过期时间为 1 年
      )
      await setAsync(
        `${keyfix.Auth}${authToken}`,
        JSON.stringify(initDataUnsafe),
        86400 // 设置过期时间为 1 年
      )
    }

    req.authToken = authToken

    next()
  } else {
    res.status(403).send('Unauthorized')
  }

  // if (!initDataUnsafe.user.username) {
  //   res.status(403).send('Username is empty')
  // }
  // req.user = initDataUnsafe
  // // 获取客户端 IP 地址
  // const clientIp =
  //   req.headers['x-real-ip'] || // 尝试获取真实 IP
  //   req.headers['x-forwarded-for']?.toString().split(',')[0] || // 或获取转发的 IP
  //   req.connection.remoteAddress // 最后使用连接的远程地址

  // req.clientIp = (clientIp as string) || ''
  // next()
}

// 测试验证 Telegram 登录
export async function t_verifyTelegramLogin(
  req: Request,
  res: Response,
  next: Function
) {
  const { initData, initDataUnsafe } = req.body

  const userAgent = req.headers['user-agent']
  if (!userAgent) {
    return res.status(401).json({ success: false, message: 'Login restricted' })
  }

  const systemInfo = parseUserAgent(userAgent)
  if (systemInfo) {
    console.log(`Operating System: ${systemInfo.os}`)
    console.log(`Version: ${systemInfo.version}`)
    req.version = systemInfo.version
    req.os = systemInfo.os
  } else {
    console.log('Operating System not recognized')
  }

  if (!initData || !initDataUnsafe) {
    return res
      .status(401)
      .json({ success: false, message: 'Invalid login data' })
  }

  if (
    !initDataUnsafe.user.username ||
    initDataUnsafe.user.username == '' ||
    initDataUnsafe.user.username == null ||
    initDataUnsafe.user.username == undefined
  ) {
    res.status(403).send('Username is empty')
  }

  // 86400 seconds = 1 day
  req.user = initDataUnsafe
  // 获取客户端 IP 地址
  const clientIp =
    req.headers['x-real-ip'] || // 尝试获取真实 IP
    req.headers['x-forwarded-for']?.toString().split(',')[0] || // 或获取转发的 IP
    req.connection.remoteAddress // 最后使用连接的远程地址

  req.clientIp = (clientIp as string) || ''

  // 检查是否已有 authToken
  let authToken = await getAsync(
    `${config.sitename}telegram-user:${initDataUnsafe.user.id}:authToken`
  )

  if (!authToken) {
    // 如果没有旧的 authToken，生成新的并存储
    authToken = crypto.randomBytes(16).toString('hex')
    await setAsync(
      `${config.sitename}telegram-user:${initDataUnsafe.user.id}:authToken`,
      authToken,
      86400 * 365 // 设置过期时间为 1 年
    )
    await setAsync(
      `${config.sitename}telegram-auth:${authToken}`,
      JSON.stringify(initDataUnsafe),
      86400 * 365 // 设置过期时间为 1 年
    )

    req.authToken = authToken

    next()
  } else {
    res.status(403).send('Unauthorized')
  }

  // if (!initDataUnsafe.user.username) {
  //   res.status(403).send('Username is empty')
  // }
  // req.user = initDataUnsafe
  // // 获取客户端 IP 地址
  // const clientIp =
  //   req.headers['x-real-ip'] || // 尝试获取真实 IP
  //   req.headers['x-forwarded-for']?.toString().split(',')[0] || // 或获取转发的 IP
  //   req.connection.remoteAddress // 最后使用连接的远程地址

  // req.clientIp = (clientIp as string) || ''
  // next()
}
