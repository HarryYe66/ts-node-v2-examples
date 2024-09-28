// baotaApi.ts
import CryptoJS from 'crypto-js'
import axios from 'axios'
import https from 'https'

import './dotenv'

const host = process.env.BTAPI_HOST || '' //地址
const port = process.env.BTAPI_PORT || '' //端口
const key = process.env.BTAPI_KEY || '' //密钥
const httpss = process.env.BTAPI_HTTPS || false //使用 https
const siteId = process.env.BTAPI_SITE_ID || '1' //使用 https
const siteName = process.env.BTAPI_SITE_NAME || '' //使用 https

const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // 不验证证书
})

/**
 * 获取密钥参数
 * @returns {{request_time: number, request_token: string}}
 */
export function getKyeData() {
  let now = String(Date.now())
  let md5key = String(CryptoJS.MD5(key))

  let request_token = CryptoJS.MD5(now + md5key)
  return {
    request_time: now,
    request_token: request_token.toString(),
  }
}

export async function request(url: string, data: any) {
  let config = {
    baseURL: (httpss ? 'https' : 'http') + '://' + host + ':' + port,
    params: getKyeData(),
    method: 'post',
    url: url,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    // data: qs.stringify({
    //   data: data,
    // }),
    data: data,
    httpsAgent,
  }
  return axios(config)
}

/**
 * 获取网站的域名列表
 * @param search 网站 ID [必传] 例如 66
 * @param list list true 请固定传 true [必传]
 * @returns
 */
export async function getdomain(search: string, list = true) {
  let url = '/data?action=getData&table=domain'
  let data = { list: list, search: search }
  return await request(url, JSON.stringify(data))
}

/**
 * 添加域名
 * @param id 网站 ID [必传] 例如 32 网站列表的 pid
 * @param webname 网站名[项目名称] [必传] 例如 finance.web
 * @param domain 要添加的域名 [必传] 例如 baidu.com
 * @returns {status:boolean,msg:string}
 */
export async function AddDomain(
  id: string = siteId,
  webname: string = siteName,
  domain: string
) {
  let url = '/site?action=AddDomain'
  var data = 'domain=' + domain + '&webname=' + webname + '&id=' + id

  const result = await request(url, data)
  return result.data.domains
}

/**
 * 删除域名
 * @param id 网站 ID [必传] 例如 32
 * @param webname 网站名[项目名称] [必传] 例如 finance.web.xdex.cc
 * @param domain 要被删除的域名 [必传] 例如 baidu.com
 * @param port 该域名的端口 [必传] 例如 80
 * @returns {status:boolean,msg:string}
 */
export async function DelDomain(
  id: string,
  webname: string,
  domain: string,
  port: string = '80'
) {
  let url = '/site?action=DelDomain'
  var data =
    'domain=' + domain + '&webname=' + webname + '&id=' + id + '&port=' + port

  const result = await request(url, data)
  return result.data
}

/**
 * 获取网站域名列表
 * @param search 搜索内容 [可选] 例如网站昵称：  baidu.com
 * @param p 第几页 [必填] 默认1  例如：1
 * @param limit 取多少条 [必填] 默认100  例如：20
 * @returns {{data: any, page: string,where:string}}
 */
export async function getProjectList(search: string = '', p = 1, limit = 100) {
  let url = '/data?action=getData&table=sites'
  let data = { p: p, limit: limit, search: search }
  return await request(url, JSON.stringify(data))
}

/**
 * 获取网站域名列表
 * @param id 站点ID [必传] 例如 66
 * @returns {{data: any, page: string,where:string}}
 */
export async function GetSiteDomains(id: string = '') {
  let url = '/site?action=GetSiteDomains'
  var data = 'id=' + id
  const res = await request(url, data)

  return res.data.domains
}

/**
 * 申请证书API
 * @param domains 域名组 例： ["ept.dexcc.cc","pop.kmlwxx.cn"]
 * @param auth_type 证书验证类型 例：http
 * @param auth_to 验证地址方式  例：3【文件验证】
 * @param auto_wildcard 是否自动添加泛解析证书 例：0【否】
 * @param id 站点ID 例：3
 * @param site_name 站点名称 例：ept.dexcc.cc
 * @returns
 */
export async function apply_cert_api(
  domains: string[],
  auth_type: string = 'http',
  auth_to: string = '3',
  auto_wildcard: string = '0',
  id: string,
  site_name: string
) {
  let url = '/mod/proxy/com/apply_cert_api'
  let data = `domains=${JSON.stringify(
    domains
  )}&auth_type=${auth_type}&auth_to=${auth_to}&auto_wildcard=${auto_wildcard}&id=${id}&site_name=${site_name}`

  const res = await request(url, data)

  return res.data
}

/**
 * 获取证书列表是否存在域名
 * @param domains 域名组 例： ["ept.dexcc.cc","pop.kmlwxx.cn"]
 * @returns 对应每个域名的布尔值数组 例如：[true, false]
 */
export async function get_cert_list(domains: string[]): Promise<boolean[]> {
  // 请求参数
  let url = '/ssl?action=get_cert_list'
  let data = `search_limit=0&search_name=&force_refresh=0`

  try {
    // 发起请求
    const res = await request(url, data)

    // 获取证书数据
    const certificates = res.data as {
      id: number
      group_id: number
      hash: string
      path: string
      dns: string[]
      subject: string
      // 其他字段
    }[]

    // 创建一个 Set 存储所有证书的 DNS 名称
    const certDnsSet = new Set<string>()
    certificates.forEach((cert) => {
      cert.dns.forEach((dns) => certDnsSet.add(dns))
    })

    // 检查每个域名是否在证书的 DNS 名称中
    const result = domains.map((domain) => certDnsSet.has(domain))

    return result
  } catch (error) {
    console.error('获取证书列表失败:', error)
    // 发生错误时返回相同长度的 false 数组
    return domains.map(() => false)
  }
}
/**
 * 宝塔设置SSL证书
 * @param site_name 网站名称 例：ept.dexcc.cc
 * @param key 证书key 可以通过方法apply_cert_api获取
 * @param csr 证书csr 可以通过方法apply_cert_api获取
 * @returns
 */
export async function set_ssl(site_name: string, key: string, csr: string) {
  let url = '/mod/proxy/com/set_ssl'
  let data = `site_name=${site_name}&key=${encodeURIComponent(
    key
  )}&csr=${encodeURIComponent(csr)}`

  const res = await request(url, data)

  return res.data
}

/**
 * 自动证书申请
 *@param id 站点ID 例：3
 */
export async function cert_ssl(id: string) {
  try {
    //获取网站域名列表
    const getSiteDomains = await GetSiteDomains('3')
    console.log(getSiteDomains, 'getSiteDomains')
    let siteDomains = await getSiteDomains.map((item: any) => item.name)
    // let newDomains = ['ept1.dexcc.cc']
    // console.log(newDomains, 'newDomains')

    const get_cert_listss = await get_cert_list(siteDomains)
    // console.log(get_cert_listss, 'get_cert_listss') //[ true, true ] get_cert_listss
    let newDomains: any = []
    for (let index = 0; index < get_cert_listss.length; index++) {
      const siteitem = siteDomains[index]
      const siteitemssl = get_cert_listss[index]
      if (!siteitemssl) {
        newDomains.push(siteitem)
      }
    }

    console.log(newDomains)
    for (let index = 0; index < newDomains.length; index++) {
      const newDomainsItem = [newDomains[index]]
      console.log(newDomainsItem, 'newDomainsItem')
      // 申请证书
      const apply_cert = await apply_cert_api(
        newDomainsItem,
        'http',
        '3',
        '0',
        id,
        'ept.dexcc.cc'
      )
      console.log(apply_cert, 'apply_cert\n\n')
      if (apply_cert.status == false) {
        console.log(apply_cert.msg[0], 'apply_cert.msg')
      } else {
        // 保存设置证书
        const set_ss = await set_ssl(
          'ept.dexcc.cc',
          apply_cert.private_key,
          apply_cert.cert
        )
      }
    }

    return 'ok'
  } catch (error) {
    console.log('cert_ssl error', error)
    return JSON.stringify(error)
  }
}

async function test() {
  console.log(
    '-----配置内容-------\n\n',
    `Host:${host}\nPort:${port}\nhttps:${https}\nkey:${key}\n`,
    '-----配置内容-------\n\n'
  )

  // 获取网站列表
  // const projectlist = await getProjectList()
  // console.log(projectlist.data, 'projectlist')
  // //获取网站的域名列表
  // const getdomains = await getdomain('3')
  // console.log(getdomains.data, 'getdomains')
  //添加域名
  // const adddomain = await AddDomain('3', 'ept.dexcc.cc', 'xxx.dexcc.cc')
  // console.log(adddomain, 'adddomain')
  //   删除域名
  // const delDomain = await DelDomain('3', 'ept.dexcc.cc', 'xxx.dexcc.cc')
  // console.log(delDomain, 'adddomain')

  //获取网站域名列表
  // const getSiteDomains = await GetSiteDomains('3')
  // console.log(getSiteDomains, 'getSiteDomains')

  // 自动帮网站申请ssl证书
  // const cert_ss = await cert_ssl('3')
  // console.log(cert_ss, 'cert_ss')

  //查找证书列表是否有这个域名
  // let newDomains = ['ept.dexcc.cc', 'pop.kmlwxx.cn']
  // const get_cert_listss = await get_cert_list(newDomains)
  // console.log(get_cert_listss, 'get_cert_listss') //[ true, true ] get_cert_listss
}
// test()
