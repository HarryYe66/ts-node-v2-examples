import { Request, Response, NextFunction } from 'express'
import { getAsync, keyfix } from '../utils/cache/redisClient'
import { config } from '../../src/config/config'
export async function verifyAuthorization(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // console.log('验证授权', req.headers)
  // {
  //   8|dexccpiwar-app-server  |   host: 'piwar.dexcc.cc',
  //   8|dexccpiwar-app-server  |   'x-real-ip': '89.185.25.144',
  //   8|dexccpiwar-app-server  |   'x-forwarded-for': '89.185.25.144',
  //   8|dexccpiwar-app-server  |   'remote-host': '89.185.25.144',
  //   8|dexccpiwar-app-server  |   connection: 'upgrade',
  //   8|dexccpiwar-app-server  |   'x-forwarded-proto': 'https',
  //   8|dexccpiwar-app-server  |   'content-length': '0',
  //   8|dexccpiwar-app-server  |   accept: 'application/json, text/plain, */*',
  //   8|dexccpiwar-app-server  |   authorization: 'bbd9cecbee7012c78c7e2ac1ed69fe8c',
  //   8|dexccpiwar-app-server  |   'sec-fetch-site': 'cross-site',
  //   8|dexccpiwar-app-server  |   'accept-language': 'zh-CN,zh-Hans;q=0.9',
  //   8|dexccpiwar-app-server  |   'accept-encoding': 'gzip, deflate, br',
  //   8|dexccpiwar-app-server  |   'sec-fetch-mode': 'cors',
  //   8|dexccpiwar-app-server  |   origin: 'https://vite-pi-war-app-frontend.vercel.app',
  //   8|dexccpiwar-app-server  |   'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  //   8|dexccpiwar-app-server  |   referer: 'https://vite-pi-war-app-frontend.vercel.app/',
  //   8|dexccpiwar-app-server  |   'sec-fetch-dest': 'empty'
  //   8|dexccpiwar-app-server  | }

  const useragent = req.headers['user-agent']
  if (!useragent) {
    return res.status(401).json({ success: false, message: 'Login restricted' })
  }

  const authToken = req.headers['authorization']

  // 如果 Token 不存在，返回 401
  if (!authToken) {
    return res.status(401).send('Authorization token is required')
  }

  try {
    const userData = await getAsync(`${keyfix.Auth}${authToken}`)

    if (!userData) {
      return res
        .status(403)
        .send(
          `Invalid or expired authorization token [code:${req.headers['authorization']}]`
        )
    }

    req.user = JSON.parse(userData)
    next()
  } catch (error) {
    res.status(500).send('Internal server error')
  }
}
