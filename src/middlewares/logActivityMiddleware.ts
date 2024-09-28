// src/middleware/logActivityMiddleware.ts
import { Request, Response, NextFunction } from 'express'
import { logActivity } from '../utils/log/mysql-logger'

export function logActivityMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.logActivity = (
    message: string,
    meta: any = {},
    level: string = 'info'
  ) => {
    const userIdStr =
      new URLSearchParams(req.url.split('?')[1]).get('userId') || 'default_user'
    const userId = parseInt(userIdStr, 10) || 0 // 尝试将userId转换为number，如果无法解析则使用默认值0

    const ipAddress = req.clientIp || ''

    console.log(
      userId,
      message,
      meta,
      level,
      ipAddress,
      'logActivityMiddleware 执行'
    )
    const actionTime = Math.floor(Date.now() / 1000)

    logActivity({
      userId,
      message,
      meta,
      level,
      actionTime: actionTime,
      ipAddress,
    })
  }
  next()
}
