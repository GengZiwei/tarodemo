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
