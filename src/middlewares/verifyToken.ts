import express, { Request, Response } from 'express'

import jwt from 'jsonwebtoken'
import { config } from '../config/config'

// 扩展 Express 的 Request 接口，添加 userId 属性
declare global {
  namespace Express {
    interface Request {
      user?: any // 这里的 any 可以根据你的实际情况替换为你的用户信息接口类型
    }
  }
}

export const jwtSecret = config.jwtSecret

// 中间件：验证Token
export const verifyToken = (req: Request, res: Response, next: Function) => {
  const accessToken = req.body.accessToken || req.query.accessToken
  // 从请求头中获取Token
  const token = req.headers.authorization?.split(' ')[1]
    ? req.headers.authorization?.split(' ')[1]
    : accessToken
  if (!token) {
    return res.status(401).json({ success: false, message: '未提供Token' })
  }

  // 验证Token
  jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
    if (err) {
      return res.status(401).json({ success: false, message: '无效的Token' })
    }
    // 将解码后的用户信息存储在请求对象中
    req.user = decoded
    next()
  })
}

// 中间件：验证Token
export const verifyAccess = (req: Request, res: Response, next: Function) => {
  // 从请求头中获取用户信息，包括权限列表
  const user = req.user

  // 如果用户不存在或者用户权限列表为空，则返回未授权状态
  if (!user || !user.access) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  // 解析用户权限列表
  let permissions: string[] = []
  try {
    permissions = JSON.parse(user.access)
  } catch (error) {
    console.error('Error parsing user access:', error)
  }

  // 如果用户的权限列表中包含 'admin'，则允许访问
  if (permissions.includes('admin')) {
    next() // 允许继续执行后续中间件或路由处理函数
  } else {
    // 否则，返回未授权状态
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
}
