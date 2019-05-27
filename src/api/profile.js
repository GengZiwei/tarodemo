import HTTP from '../request/axios'


const PROFILE_OpenId = (code) =>{ // wx 根据code 个人信息opid获取
  return HTTP({
    url: '/profile/api/v1/passengerAccount/openId/' + code,
  })
}

const QueryAround = (gps) =>{ // 根据gps获取周围站点
  return HTTP({
    url: '/profile/api/v1/passengerAccount/vehicleInfo',
    data: {
      vehicleGps: gps
    }
  })
}
export default {
  PROFILE_OpenId,
  QueryAround,
}