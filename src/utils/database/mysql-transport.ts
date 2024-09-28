import winston from 'winston'
import { MySQLTransport } from '../database/mySql2'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new MySQLTransport({
      table: 'logs', // 可以使用固定的表名，或者根据需要使用动态表名
    }),
  ],
})

export default logger

// 使用示例
// logger.info('这是一条info日志')
// logger.error('这是一条error日志')
// logger.info('User logged in', { userId: 123 })
// logger.error('Error connecting to service', { serviceName: 'PaymentGateway' })
