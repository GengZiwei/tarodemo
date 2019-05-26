import HTTP from '../request/axios'


const OpenId = (code) =>{ // wx 根据code 个人信息opid获取
  return HTTP({
    url: '/profile/api/v1/passengerAccount/openId/' + code,
  })
}
export default {
  OpenId
}