import svgCaptcha from 'svg-captcha'

// 验证码存储对象，用于存储验证码和设备对应关系
const captchaStore: { [key: string]: string } = {}

// 生成验证码
export function generateCaptcha(deviceId: string): string {
  // 配置验证码选项
  const options = {
    width: 100, // 设置验证码图片的宽度
    height: 28, // 设置验证码图片的高度
    fontSize: 42, // 字体大小
    noise: 1, // 干扰线条的数量
    ignoreChars: '0o1ipql', // 忽略容易混淆的字符，比如数字0和字母o，数字1和字母i
    color: true, // 使用彩色字符，增强对比度
    // background: '#ccf2ff', // 设置背景色，字符更加显眼
  }

  const captcha = svgCaptcha.create(options)
  captchaStore[deviceId] = captcha.text

  return captcha.data
}

// 验证验证码
export function verifyCaptcha(deviceId: string, captchaText: string): boolean {
  if (!captchaStore[deviceId]) {
    return false
  }

  const storedCaptcha = captchaStore[deviceId].toLowerCase()
  if (!storedCaptcha) {
    return false
  }
  delete captchaStore[deviceId]
  return storedCaptcha === captchaText.toLowerCase()
}
