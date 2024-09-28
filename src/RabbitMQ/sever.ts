import './dotenv'
import RabbitMQManager from '../utils/database/rabbitMQ'

const RabbitMQ = new RabbitMQManager(config.sitename, config.amqp.host)

async function consumeMessages() {
  try {
    await RabbitMQ.connectQueue()
    console.log('Successfully connected to RabbitMQ')
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error)
    RabbitMQ.scheduleReconnect() // 重新尝试连接
    return
  }

  RabbitMQ.consumeQueue(async (msg) => {
    console.log('Received a message from queue')

    try {
      const operation: RabbitMessages = JSON.parse(msg.content.toString())
      // console.log('Received message:', operation.action)

      switch (operation.action) {
        case 'creation_user':
          //创建用户
          await UserInvitation(operation.data)
          break
        case 'wallet_binding':
          await rewardWalletBinding(operation.data)
          break
        case 'pid_binding':
          await rewardPidBinding(operation.data)
          break
        case 'user_click':
          console.log('User clicked:', operation.data)
          await userClickAddReward(operation.data)
          break
        case 'pay_update':
          //支付更新
          await pay_update(operation.data)
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
