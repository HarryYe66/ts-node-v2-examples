import './dotenv'
import amqp, { Channel, Connection, Message } from 'amqplib'

class RabbitMQManager {
  private connection: Connection | null = null
  private channel: Channel | null = null
  private isConnected: boolean = false
  private connectRetryInterval: number = 1000 // 重连间隔时间，单位毫秒
  private reconnectTimeout: NodeJS.Timeout | null = null

  constructor(
    private queueName: string = process.env.SITE_NAME || 'default_queue', // 使用默认值
    private amqpUrl: string = process.env.RABBITMQ_URL ||
      'amqp://localhost:5672' // 使用默认值
  ) {}

  // 连接到 RabbitMQ
  public async connectQueue(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.amqpUrl)
      this.channel = await this.connection.createChannel()
      await this.channel.assertQueue(this.queueName, { durable: true })
      this.isConnected = true
      console.log('Connected to RabbitMQ')
    } catch (error: any) {
      console.error('Failed to connect to RabbitMQ:', error.message)
      this.isConnected = false
      this.scheduleReconnect()
    }
  }

  // 发送消息到队列
  public async sendToQueue(message: any): Promise<void> {
    await this.ensureConnected()
    try {
      if (!this.channel) throw new Error('Channel not available')
      this.channel.sendToQueue(
        this.queueName,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true,
        }
      )
      console.log('Message sent to RabbitMQ:', message)
    } catch (error: any) {
      console.error('Failed to send message to RabbitMQ:', error.message)
      throw error
    }
  }

  // 消费消息
  public async consumeQueue(callback: (msg: Message) => void): Promise<void> {
    await this.ensureConnected()
    try {
      if (!this.channel) throw new Error('Channel not available')
      await this.channel.consume(
        this.queueName,
        (msg) => {
          if (msg) {
            callback(msg)
          }
        },
        { noAck: false }
      )
      console.log('Started consuming messages from RabbitMQ')
    } catch (error: any) {
      console.error('Failed to consume messages from RabbitMQ:', error.message)
      throw error
    }
  }

  // 确保已连接
  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.connectQueue()
    }
  }

  // 处理重连逻辑
  public scheduleReconnect(): void {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout)
    this.reconnectTimeout = setTimeout(async () => {
      console.log('Attempting to reconnect to RabbitMQ...')
      try {
        await this.connectQueue()
      } catch (error: any) {
        console.error('Failed to reconnect to RabbitMQ:', error.message)
        this.scheduleReconnect()
      }
    }, this.connectRetryInterval)
  }

  // 关闭连接
  public async close(): Promise<void> {
    try {
      if (this.connection) {
        await this.connection.close()
        console.log('Closed RabbitMQ connection')
        this.isConnected = false
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout)
      }
    } catch (error: any) {
      console.error('Failed to close RabbitMQ connection:', error.message)
      throw error
    }
  }

  // 获取当前信道
  public getChannel(): Channel | null {
    return this.channel
  }
}

export default RabbitMQManager

// import { RabbitMessages } from '../../../types/user'

// class RabbitMQManager {
//   private connection: amqp.Connection | null = null
//   private channel: amqp.Channel | null = null
//   private isConnected: boolean = false
//   private connectRetryInterval: number = 1000 // 重连间隔时间，单位毫秒
//   private reconnectTimeout: NodeJS.Timeout | null = null

//   async connectQueue(): Promise<void> {
//     try {
//       this.connection = await amqp.connect(config.amqp.host)
//       this.channel = await this.connection.createChannel()
//       await this.channel.assertQueue(config.amqp.database, { durable: true })
//       this.isConnected = true
//       console.log('Connected to RabbitMQ')
//     } catch (error: any) {
//       console.error('Failed to connect to RabbitMQ:', error.message)
//       this.isConnected = false
//       this.scheduleReconnect()
//       throw error
//     }
//   }

//   async sendToQueue(operation: RabbitMessages): Promise<void> {
//     await this.ensureConnected()
//     try {
//       if (!this.channel) {
//         throw new Error('Channel not available')
//       }
//       await this.channel.sendToQueue(
//         config.amqp.database,
//         Buffer.from(JSON.stringify(operation)),
//         { persistent: true }
//       )
//       console.log('Message sent to RabbitMQ', operation)
//     } catch (error: any) {
//       console.error('Failed to send message to RabbitMQ:', error.message)
//       throw error
//     }
//   }

//   async consumeQueue(callback: (msg: amqp.Message) => void): Promise<void> {
//     await this.ensureConnected()
//     try {
//       if (!this.channel) {
//         throw new Error('Channel not available')
//       }
//       await this.channel.consume(
//         config.amqp.database,
//         (msg) => {
//           if (msg !== null) {
//             callback(msg)
//           }
//         },
//         { noAck: false }
//       )
//       console.log('Started consuming messages from RabbitMQ')
//     } catch (error: any) {
//       console.error('Failed to consume messages from RabbitMQ:', error.message)
//       throw error
//     }
//   }

//   async close(): Promise<void> {
//     try {
//       if (this.connection) {
//         await this.connection.close()
//         console.log('Closed RabbitMQ connection')
//         this.isConnected = false
//         if (this.reconnectTimeout) {
//           clearTimeout(this.reconnectTimeout)
//           this.reconnectTimeout = null
//         }
//       }
//     } catch (error: any) {
//       console.error('Failed to close RabbitMQ connection:', error.message)
//       throw error
//     }
//   }

//   private async ensureConnected(): Promise<void> {
//     if (!this.isConnected) {
//       await this.connectQueue()
//     }
//   }

//   public scheduleReconnect(): void {
//     if (this.reconnectTimeout) {
//       clearTimeout(this.reconnectTimeout)
//     }
//     this.reconnectTimeout = setTimeout(async () => {
//       console.log('Attempting to reconnect to RabbitMQ...')
//       try {
//         await this.connectQueue()
//       } catch (error: any) {
//         console.error('Failed to reconnect to RabbitMQ:', error.message)
//         this.scheduleReconnect()
//       }
//     }, this.connectRetryInterval)
//   }

//   public getChannel(): amqp.Channel | null {
//     return this.channel
//   }
// }

// export default RabbitMQManager
