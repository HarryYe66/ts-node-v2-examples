import express, { Request, Response } from 'express'

import bcryptJs from 'bcrypt'
import jwt from 'jsonwebtoken'

import { verifyCaptcha } from '../../utils/cache/captchaUtils'
import Admin_Account from '../../utils/sql/Admin_Account'
import { SuccessMsg, ErrorMsg } from '../../utils/lib/resMsg'

import {
  verifyToken,
  verifyAccess,
  jwtSecret,
} from '../../middlewares/verifyToken'

const router = express.Router()
const AdminAccount = new Admin_Account()

// 扩展 Express 的 Request 接口，添加 userId 属性
declare global {
  namespace Express {
    interface Request {
      user?: any // 这里的 any 可以根据你的实际情况替换为你的用户信息接口类型
    }
  }
}

// 登录接口，验证验证码是否匹配
router.post('/login', async (req: Request, res: Response) => {
  const { username, password, captcha, deviceId, type } = req.body
  // const hashedPassword = await bcrypt.hash('123456', 10)
  // console.log(hashedPassword)

  try {
    // 验证验证码是否匹配
    const codeV = await verifyCaptcha(deviceId, captcha)
    if (!codeV) {
      return ErrorMsg(res, '', '验证码错误')
    }

    // 查询数据库，验证用户名和密码是否匹配
    const user: any = await AdminAccount.getByUsername(username)
    if (!user) {
      return ErrorMsg(res, '', '用户名错误')
    }

    // 检查用户状态是否为0
    if (user.status === 1) {
      return ErrorMsg(res, '', '账号已禁用')
    }

    // 检查密码是否匹配
    const passwordMatch = await bcryptJs.compare(password, user.password)
    if (!passwordMatch) {
      return ErrorMsg(res, '', '密码错误')
    }

    // 生成 JWT Token
    const accessToken = jwt.sign(
      {
        userid: user.userId,
        username: user.username,
        access: user.access,
        avatar: user.avatar,
        nickname: user.nickname,
      },
      jwtSecret,
      {
        expiresIn: '1h', // 设置 token 过期时间
      }
    )

    // 返回登录成功信息
    const accData = {
      accessToken,
      expiredTime: Date.now() + 3600 * 1000, // token 过期时间
    }
    return SuccessMsg(res, accData, '登录成功')
  } catch (error) {
    console.error('登录失败:', error)
    return ErrorMsg(res, '', '登录失败')
  }
})

// 获取后台表单
router.post(
  '/user-list',
  verifyToken,
  verifyAccess,
  async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        pageSize = 100,
        username = '',
        phone = '',
        nickname = '',
        status = 'ALL',
      } = req.body // 默认分页

      // 使用 Object.entries() 遍历参数，动态构建查询条件
      const filters = { username, phone, nickname, status }
      const query: { [key: string]: any } = {}

      for (const [key, value] of Object.entries(filters)) {
        if (value !== '' && value !== 'ALL') {
          query[key] = value
        }
      }

      // 调用查询方法，传入动态构建的query对象
      const rows = await AdminAccount.getList(page, pageSize, query)

      return SuccessMsg(res, rows, 'Success')
    } catch (error) {
      return ErrorMsg(res, error, 'Netword Error')
    }
  }
)
// 添加用户
router.post(
  '/create-user',
  verifyToken,
  verifyAccess,
  async (req: Request, res: Response) => {
    try {
      const { access, avatar, nickname, username, password, status, phone } =
        req.body

      // 如果传入了新密码，则使用传入的新密码进行哈希，否则使用默认密码
      const hashedPassword = await bcryptJs.hash(password || '88888888', 10)
      const upnewaccess = JSON.stringify(access)

      // 将用户信息插入到数据库
      const values = {
        access: upnewaccess,
        avatar,
        nickname,
        username,
        password: hashedPassword,
        status,
        phone,
      }

      const results = await AdminAccount.create(values)

      if (results > 0) {
        return SuccessMsg(res, results, '成功添加用户')
      } else {
        return ErrorMsg(res, '', '插入用户失败')
      }
    } catch (error) {
      console.error('Error adding user:', error)
      return ErrorMsg(res, error, '网络错误')
    }
  }
)

// 修改用户信息
// 修改用户信息
router.post(
  '/update-user',
  verifyToken,
  verifyAccess,
  async (req: Request, res: Response) => {
    try {
      const {
        userId,
        access,
        avatar,
        nickname,
        username,
        newPassword,
        status,
        phone,
      } = req.body

      // 初始化更新字段
      const updates: Partial<{
        username: string
        phone: string
        password: string
        nickname: string
        access: any
        status?: number
        avatar?: string
      }> = {}

      if (access) updates.access = JSON.stringify(access)
      if (avatar) updates.avatar = avatar
      if (nickname) updates.nickname = nickname
      if (username) updates.username = username
      if (status !== undefined) updates.status = status
      if (phone) updates.phone = phone

      // 如果有新密码传入，进行哈希
      if (newPassword && newPassword.trim() !== '') {
        updates.password = await bcryptJs.hash(newPassword, 10)
      }

      // 使用类型断言来满足方法参数的类型要求
      const isUpdated = await AdminAccount.edit(
        userId,
        updates as {
          username: string
          phone: string
          password: string
          nickname: string
          access: any
          status?: number
          avatar?: string
        }
      )

      if (isUpdated) {
        return SuccessMsg(res, '', '用户资料更新成功')
      } else {
        return ErrorMsg(res, '', '用户更新失败')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      return ErrorMsg(res, error, '网络错误')
    }
  }
)
// 删除用户
router.post(
  '/delete-user',
  verifyToken,
  verifyAccess,
  async (req: Request, res: Response) => {
    try {
      const { userIds } = req.body

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return ErrorMsg(res, '', '没有提供有效的用户ID')
      }

      // 过滤掉 userId = 1，防止删除超级管理员
      const filteredIds = userIds.filter((id) => id !== 1)

      if (filteredIds.length === 0) {
        return ErrorMsg(res, '', '不允许删除所有包含 ID 为 1 的用户')
      }

      // 调用 AdminAccount 类的删除方法
      const deletePromises = filteredIds.map((userId) =>
        AdminAccount.deleteById(userId)
      )
      const deleteResults = await Promise.all(deletePromises)

      // 统计删除成功的记录
      const deletedCount = deleteResults.filter((result) => result).length

      if (deletedCount > 0) {
        return SuccessMsg(
          res,
          { deletedCount },
          `${deletedCount} 个用户删除成功`
        )
      } else {
        return ErrorMsg(res, '', '未找到要删除的用户')
      }
    } catch (error) {
      console.error('Error deleting users:', error)
      return ErrorMsg(res, error, '网络错误')
    }
  }
)
// 路由：使用Token换取用户信息
router.get('/currentUser', verifyToken, (req: Request, res: Response) => {
  // 从请求对象中获取解码后的用户信息
  const user = req.user

  // 在这里可以根据用户信息从数据库或其他存储中获取用户详细信息

  // 返回用户信息
  res.json({
    code: 200,
    msg: '成功',
    data: user,
    success: true,
  })
})

export default router
