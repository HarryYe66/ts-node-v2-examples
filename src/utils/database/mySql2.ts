import TransportStream, { TransportStreamOptions } from 'winston-transport'
import mysql from 'mysql2/promise'
import { config } from '../../config/config'

// MySQL 连接池配置
const mysqlConfig = {
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 5000,
  queueLimit: 0,
}

// 创建连接池
const pool = mysql.createPool(mysqlConfig)

// 批量插入函数
async function bulkInsert(operations: any) {
  if (operations.length === 0) return

  const sql =
    'INSERT INTO user_operations (user_id, clicks, timestamp) VALUES ?'
  const values = operations.map((op: any) => [
    op.userId,
    op.clicks,
    op.timestamp,
  ])

  try {
    await pool.query(sql, [values])
  } catch (err) {
    console.error('Database bulk insert error:', err)
  }
}

interface MySQLTransportOptions extends TransportStreamOptions {
  table: string
}

// MySQL Transport 类
class MySQLTransport extends TransportStream {
  private pool: mysql.Pool
  private table: string

  constructor(opts: MySQLTransportOptions) {
    super(opts)
    this.pool = pool
    this.table = config.db.transportname
    this.createTableIfNeeded()
  }

  private async createTableIfNeeded() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.table} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        level VARCHAR(255),
        message TEXT,
        meta JSON,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    try {
      await this.pool.execute(createTableQuery)
    } catch (err) {
      console.error('Error creating table:', err)
    }
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info)
    })

    const { level, message, ...meta } = info
    const insertQuery = `INSERT INTO ${this.table} (level, message, meta) VALUES (?, ?, ?)`

    this.pool
      .execute(insertQuery, [level, message, JSON.stringify(meta)])
      .then(() => callback())
      .catch((err) => {
        console.error('Error inserting log into MySQL:', err)
        callback()
      })
  }
}

export { pool, bulkInsert, MySQLTransport }
