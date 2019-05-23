import HTTP from './request'
/* 路测 */
let api = process.env.HTTP_URL
let ws = process.env.SOCKET_URL

let websocket = ws + 'message/websocket/' /* 'ws://192.168.8.125:7089/websocket/' */

let route = api + 'route/api/v1'
let wallet = api + 'wallet/api/v1'
let profile = api + 'profile/api/v1'
let auth = api + 'auth/api/v1'
let comments = api + 'comments/api/v1'

let monitor = api + 'track/monitor'
let nearbyPoiService = api + 'track/api/v1/nearbyPoiService' /* 'http://47.102.104.108:7077/api/v1/nearbyPoiService' */
let historyAddressService = api + 'track/api/v1/historyAddressService' /* 'http://47.102.104.108:7077/api/v1/historyAddressService' */

let passengerAccount = api + 'profile/api/v1/passengerAccount'/*  'http://106.14.125.132:7071/api/v1/passengerAccount' */
let accountService = api + 'account/api/v1/accountService' /* 'http://106.14.125.132:7073/api/v1/accountService' */

export function BasicInformation(){ // 获取基础信息表
  return HTTP({
    path: '/shuttle/api/v1/basicInformation/basicInformation',
    data: {
      typeList: '5,6,8,13,24,25,28,29,34,35,36,27'
    }
  })
}

export function OpenId(code){ // wx 根据code 个人信息opid获取
  return HTTP({
    path: '/profile/api/v1/passengerAccount/openId/' + code,
  })
}

export function Login(openid) {
  let params = {
    'client_id': 'client_auth_mode',
    'grant_type': 'password',
    'redirect_uri': 'www.baidu.com',
    'response_type': 'code',
    'scope': 'read write',
    'state': Math.random().toString(36).substr(2),
    'username': openid,
    'password': openid
  }
  return HTTP({
    method: 'POST',
    path: '/auth/api/v1/authService/wxLogin',
    header: {
      ApplicationId: 'WX'
    },
    data: params
  })
}

export default {
  auth,
  comments,
  wallet,
  route,
  profile,
  monitor,
  accountService,
  passengerAccount,
  nearbyPoiService,
  historyAddressService,
  websocket
}
