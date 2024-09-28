import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import path from 'path'
import http from 'http'
import consumeMessages from './src/RabbitMQ/sever'
import rateLimit from 'express-rate-limit'

const expressPort = 3011
const websocketPort = 3012

const app = express()
const server = http.createServer(app)

import adminRouter from './src/api/admin'
import skillRouter from './src/api/skill'
import telegramRouter from './src/api/telegram'
import apisRouter from './src/api/apis'
import accountRouter from './src/api/account'
import payRouter from './src/api/pay'
import miniapprouter from './src/Telegram/miniApp'
import bandingouter from './src/Telegram/wallet/banding'

import listenForSolana from './src/Pay/listenForSolana'
import listenForBscAndEth from './src/Pay/listenForERC20'

// import {
//   handleUpgrade,
//   websocketMiddleware,
//   broadcast,
//   sendToClient,
// } from './src/Socket/ClickGame'

app.set('trust proxy', 'loopback') // 信任环回地址
app.set('trust proxy', 1) // 信任1个代理

// 设置 CORS 中间件
app.use(
  cors({
    origin: (origin, callback) => {
      // 允许所有来源访问
      callback(null, origin)
    },
    credentials: true, // 允许请求携带凭证
  })
)

// // 配置 rate limit 中间件
// const limiter = rateLimit({
//   windowMs: 1 * 60 * 1000, // 1分钟
//   max: 100, // 每个 IP 限制 100 次请求
// });

// // 应用 rate limit 中间件
// app.use(limiter);

// // 添加 CORS 中间件
// app.use((req: Request, res: Response, next: NextFunction) => {
//   res.setHeader('Access-Control-Allow-Origin', '*') // 允许所有来源访问
//   res.setHeader(
//     'Access-Control-Allow-Methods',
//     'GET, POST, PUT, DELETE, OPTIONS'
//   ) // 允许的请求方法
//   res.setHeader(
//     'Access-Control-Allow-Headers',
//     'Origin, X-Requested-With, Content-Type, Accept, Authorization'
//   ) // 允许的请求头
//   if (req.method === 'OPTIONS') {
//     res.sendStatus(200) // 预检请求的响应
//   } else {
//     next() // 继续到下一个中间件
//   }
// })

// 解析请求体中的 JSON 数据
app.use(express.json())
app.use('/v2/admin', adminRouter)
app.use('/v2/skill', skillRouter)
app.use('/v2', apisRouter)
app.use('/v2/account', accountRouter)
app.use('/v2/telegram', telegramRouter)
app.use('/v2/pay', payRouter)

app.use('/botapp', miniapprouter)
app.use('/authorize-Bind', bandingouter)

// 捕获所有以 /authorize 开头的路径
app.get('/authorize/*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, './src/public/WalletSign/index.html'))
})

// 定义路由
app.get('/api/data', (req: Request, res: Response) => {
  const responseData = {
    message: 'Hello, World!',
    method: req.method,
    url: req.originalUrl,
    // 其他需要的信息
  }
  res.json(responseData)
})

// 设置静态文件目录
const publicDir = path.resolve(__dirname, './src/public/Pay/')
const distDir = path.resolve(__dirname, './dist')

// 使用 express.static 中间件提供静态文件服务
app.use('/dist', express.static(distDir))

// 捕获所有以 /pay/solana 开头的路径
app.get('/pay/solana/*', (req: Request, res: Response) => {
  res.sendFile('Solana/index.html', { root: publicDir })
})
// 捕获所有以 /pay/solana 开头的路径
app.get('/pay/bsc/*', (req: Request, res: Response) => {
  res.sendFile('Bsc/index.html', { root: publicDir })
})
// 捕获所有以 /pay/solana 开头的路径
app.get('/pay/eth/*', (req: Request, res: Response) => {
  res.sendFile('Eth/index.html', { root: publicDir })
})

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

// 启动 RabbitMQ 消息处理
consumeMessages()
  .then(() => {
    console.log('RabbitMQ consumer is running.')
    listenForSolana() // 监听 Solana 钱包支付
    listenForBscAndEth() // 监听 BSC 和 ETH 钱包支付

    // //WebSocket 服务器
    // server.on('upgrade', (request: Request, socket, head) => {
    //   // 应用 IP 中间件和日志记录中间件
    //   // ipMiddleware(request, null as unknown as Response, () => {
    //   //   logActivityMiddleware(request, null as unknown as Response, () => {
    //   //     // 处理 WebSocket 升级
    //   //     handleUpgrade(request, socket, head)
    //   //   })
    //   // })
    //   handleUpgrade(request, socket, head)
    //   // 使用中间件
    // })

    // 启动 Express 服务器
    app.listen(expressPort, () => {
      console.log(`Server is running on port http://localhost:${expressPort}`)
    })

    // server.listen(websocketPort, () => {
    //   console.log(`Server is running at ws://localhost:${websocketPort}/ws`)
    // })
  })
  .catch((error) => {
    console.error('Failed to start RabbitMQ:', error)
  })
