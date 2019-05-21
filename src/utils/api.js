/* 路测 */
let api = process.env.HTTP_URL
let ws = process.env.SOCKET_URL
/* 开发 */
// let api = 'http://47.97.248.66:10080/'
// let ws = 'ws://47.97.248.66:10080/'
/* 本地联调 */
// let api = 'http://192.168.8.125:7078/'
// let ws = 'ws://192.168.8.125:7078/'

let websocket = ws + 'message/websocket/' /* 'ws://192.168.8.125:7089/websocket/' */

let route = api + 'route/api/v1'
let wallet = api + 'wallet/api/v1'
let profile = api + 'profile/api/v1'
let auth = api + 'auth/api/v1'
let comments = api + 'comments/api/v1'
let basicInformation = api + 'shuttle/api/v1/basicInformation'/*  'http://47.102.104.108:7076/api/v1/basicInformation' */

let monitor = api + 'track/monitor'
let nearbyPoiService = api + 'track/api/v1/nearbyPoiService' /* 'http://47.102.104.108:7077/api/v1/nearbyPoiService' */
let historyAddressService = api + 'track/api/v1/historyAddressService' /* 'http://47.102.104.108:7077/api/v1/historyAddressService' */

let passengerAccount = api + 'profile/api/v1/passengerAccount'/*  'http://106.14.125.132:7071/api/v1/passengerAccount' */
let accountService = api + 'account/api/v1/accountService' /* 'http://106.14.125.132:7073/api/v1/accountService' */



module.exports = {
  auth,
  comments,
  wallet,
  route,
  profile,
  monitor,
  accountService,
  passengerAccount,
  basicInformation,
  nearbyPoiService,
  historyAddressService,
  websocket
}
