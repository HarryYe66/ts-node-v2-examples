import './dotenv'
import RabbitMQManager from '../utils/database/rabbitMQ'

const RabbitMQ = new RabbitMQManager(
  process.env.SITE_NAME,
  process.env.RABBITMQ_URL
)

async function consumeMessages() {
  try {
    await RabbitMQ.connectQueue()
    console.log('RabbitMQ is ready!')
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error)
    RabbitMQ.scheduleReconnect() // 重新尝试连接
    return
  }

  RabbitMQ.consumeQueue(async (msg) => {
    try {
      const operation = JSON.parse(msg.content.toString())

      switch (operation.action) {
        case 'pay_update':
          break
        default:
          console.log('Unhandled operation:', operation)
          break
      }

      const channel = RabbitMQ.getChannel()
      if (channel) {
        channel.ack(msg) // 成功处理后确认消息
      } else {
        console.error('Channel is not available')
      }
    } catch (error) {
      console.error('Error processing message:', error)
      const channel = RabbitMQ.getChannel()
      if (channel) {
        channel.nack(msg, false, true) // 处理失败时重新排队
      } else {
        console.error('Channel is not available')
      }
    }
  })
}

export default consumeMessages
