import crypto from 'crypto'

// 用于存储已生成的邀请码，确保唯一性
const generatedInviteCodes = new Set<string>()

// 生成指定长度的随机邀请码
export function generateRandomInviteCode(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''

  // 生成随机字符串
  while (code.length < length) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    code += characters[randomIndex]
  }

  return code
}

// 生成唯一的邀请码
export function generateUniqueInviteCode(length: number = 11): string {
  let inviteCode = generateRandomInviteCode(length)

  // 确保邀请码唯一性
  while (generatedInviteCodes.has(inviteCode)) {
    inviteCode = generateRandomInviteCode(length)
  }

  // 将生成的邀请码添加到集合中
  generatedInviteCodes.add(inviteCode)

  return inviteCode
}

// // 示例用法
// const length = 11 // 设置邀请码长度
// const uniqueInviteCode = generateUniqueInviteCode(length)

// console.log(`Unique invite code: ${uniqueInviteCode}`)
