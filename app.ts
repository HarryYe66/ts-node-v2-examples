import './src/utils/dotenv'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import path from 'path'
import http from 'http'
import consumeMessages from './src/RabbitMQ/sever'
import rateLimit from 'express-rate-limit'

const expressPort = process.env.PORT || 3011

const app = express()
const server = http.createServer(app)
// 设置静态文件目录
app.use('/public', express.static(path.join(__dirname, 'public')))

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

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

// 启动 RabbitMQ 消息处理
consumeMessages()
  .then(() => {
    // 启动 Express 服务器
    app.listen(expressPort, () => {
      console.log(`Server is running on port http://localhost:${expressPort}`)
    })
  })
  .catch((error) => {
    console.error('Failed to start RabbitMQ:', error)
  })
