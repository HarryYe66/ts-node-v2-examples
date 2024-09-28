// src/middleware/ipMiddleware.ts
import { Request, Response, NextFunction } from 'express'

export function ipMiddleware(req: Request, res: Response, next: NextFunction) {
  // 获取客户端 IP 地址
  const clientIp =
    req.headers['x-real-ip'] || // 尝试获取真实 IP
    req.headers['x-forwarded-for']?.toString().split(',')[0] || // 或获取转发的 IP
    req.connection.remoteAddress // 最后使用连接的远程地址

  req.clientIp = (clientIp as string) || ''
  console.log(req.clientIp, '已执行')
  console.log(req.headers, clientIp, 'ip已执行')

  next()
}
