import HTTP from '../request/axios'

const AUTH_Login = (openid) => {
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
    url: '/auth/api/v1/authService/wxLogin',
    header: {
      ApplicationId: 'WX'
    },
    data: params
  }, 'POST')
}

export default {
  AUTH_Login
}