import express, { Request, Response } from 'express'

import bcryptJs from 'bcrypt'
import jwt from 'jsonwebtoken'

import { verifyCaptcha } from '../../utils/cache/captchaUtils'
import { SuccessMsg, ErrorMsg } from '../../utils/lib/resMsg'

import {
  verifyToken,
  verifyAccess,
  jwtSecret,
} from '../../middlewares/verifyToken'

const router = express.Router()

export default router
