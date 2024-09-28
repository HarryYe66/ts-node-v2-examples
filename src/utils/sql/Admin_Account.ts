import { pool } from '../database/mySql2'

export const tableName = 'Admin_Account'
export const tableKey = 'userId'

export default class Admin_Account {
  /**
   * 获取表总数
   * @returns Promise<number> 总数
   */
  async getCount(
    filterCondition: string,
    filterValues: any[]
  ): Promise<number> {
    const client = await pool.getConnection()
    try {
      const countSql = `SELECT COUNT(*) AS total FROM ${tableName} ${filterCondition}`
      const [rows]: any = await client.query(countSql, filterValues)
      return rows[0].total
    } finally {
      client.release()
    }
  }

  /**
   * Id查询
   * @param Id Id
   * @returns
   */
  getById = async (Id: number) => {
    const client = await pool.getConnection()
    try {
      const [rows] = await client.query(
        `SELECT * FROM ${tableName} WHERE ${tableKey} = ?`,
        [Id]
      )
      const result = rows as any
      return result.length ? result[0] : null
    } finally {
      client.release()
    }
  }
  /**
   * usernmae查询
   * @param username 用户名
   * @returns
   */
  getByUsername = async (usernmae: string) => {
    const client = await pool.getConnection()
    try {
      const [rows] = await client.query(
        `SELECT * FROM ${tableName} WHERE username = ?`,
        [usernmae]
      )
      const result = rows as any
      return result.length ? result[0] : null
    } finally {
      client.release()
    }
  }

  /**
   * 获取列表（带分页和筛选）
   * @param page 页码
   * @param pageSize 每页大小
   * @param filters 筛选条件
   * @returns Promise<{total: number, goods: any[]}> 商品列表和总数
   */
  getList = async (
    page: number = 1,
    pageSize: number = 10,
    filters: {
      username?: number
      phone?: string
      nickname?: string
      status?: number
    } = {}
  ) => {
    const client = await pool.getConnection()

    try {
      const conditions: string[] = [] // 存储条件
      const values: any[] = [] // 存储查询的绑定值

      // 使用 for...in 循环遍历 filters 中的属性
      for (const key in filters) {
        if (filters[key as keyof typeof filters] !== undefined) {
          conditions.push(`${key} = ?`)
          values.push(filters[key as keyof typeof filters])
        }
      }

      const filterCondition =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      // 查询总数
      const [countRows]: any = await client.query(
        `SELECT COUNT(*) AS total FROM ${tableName} ${filterCondition}`,
        values
      )
      const total = countRows[0].total

      // 添加分页参数
      values.push((page - 1) * pageSize, pageSize) // 分页

      // 查询商品列表
      const [rows] = await client.query(
        `SELECT * FROM ${tableName} ${filterCondition} ORDER BY createtime DESC LIMIT ?, ?`,
        values
      )

      return {
        total,
        goods: rows as any[],
      }
    } finally {
      client.release()
    }
  }
  /**
   * 增加商品
   * @param goodsData 商品数据
   * @returns Promise<number> 创建的商品ID
   */
  create = async (FormData: {
    username: string
    phone: string
    password: string
    nickname: string
    access: any
    status?: number
    avatar?: string
  }) => {
    const client = await pool.getConnection()

    try {
      const { username, phone, password, nickname, access, status, avatar } =
        FormData

      const createtime = Math.floor(Date.now() / 1000) // 创建时间使用 UNIX 时间戳

      const [result]: any = await client.query(
        `INSERT INTO ${tableName} (username, phone, password, nickname, access, status, avatar, createtime) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          username,
          phone,
          password,
          nickname,
          access,
          status,
          avatar,
          createtime,
        ]
      )

      return result.insertId
    } finally {
      client.release()
    }
  }

  /**
   * 删除
   * @param Id Id
   * @returns Promise<boolean> 是否删除成功
   */
  deleteById = async (Id: number) => {
    const client = await pool.getConnection()

    try {
      const [result]: any = await client.query(
        `DELETE FROM ${tableName} WHERE ${tableKey} = ?`,
        [Id]
      )
      return result.affectedRows > 0
    } finally {
      client.release()
    }
  }

  /**
   * 编辑商品
   * @param Id 商品Id
   * @param goodsData 更新的数据
   * @returns Promise<boolean> 是否更新成功
   */
  edit = async (
    Id: number,
    filters: {
      username: string
      phone: string
      password: string
      nickname: string
      access: any
      status?: number
      avatar?: string
    }
  ) => {
    const client = await pool.getConnection()

    try {
      const updates = []
      const values = []
      // 使用 for...in 循环遍历 filters 中的属性
      for (const key in filters) {
        if (filters[key as keyof typeof filters] !== undefined) {
          updates.push(`${key} = ?`)
          values.push(filters[key as keyof typeof filters])
        }
      }
      values.push(Id)

      const [result]: any = await client.query(
        `UPDATE ${tableName} SET ${updates.join(', ')} WHERE ${tableKey} = ?`,
        values
      )

      return result.affectedRows > 0
    } finally {
      client.release()
    }
  }

  /**
   * 设置状态
   * @param Id Id
   * @param status 新的状态
   * @returns Promise<boolean> 是否更新成功
   */
  setStatus = async (Id: number, status: number) => {
    const client = await pool.getConnection()

    try {
      const [result]: any = await client.query(
        `UPDATE ${tableName} SET status = ? WHERE ${tableKey} = ?`,
        [status, Id]
      )
      return result.affectedRows > 0
    } finally {
      client.release()
    }
  }
}
