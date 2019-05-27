
import Taro from '@tarojs/taro'
import config from './config'
import logError from '@/utils/logError'
/* 路测 */
let api = process.env.HTTP_URL
/**
 * Promise化小程序接口
 */
let getToken = () =>{
  let token = {
    Authorization: '',
    operateAccountId: '',
    ApplicationId: 'PASSENGER',
  }
  return token
}

export default function(params, method = 'GET') {
  let {url, data, header = {}} = params;
  let token = getToken();
  let option = {
    url : api + url,
    method: method,
    data: data,
    header: { ...token, ...header },
  }
  return new Promise((resolve, reject) => {
    Taro.request({
      ...option,
      success(res){
        switch (res.statusCode) {
          case config.NOT_FOUND:{
            logError('api', '请求资源不存在', params)
            break;
          }
          case config.BAD_GATEWAY:{
            logError('api', '服务端出现了问题', params)
            break;
          }
          case config.FORBIDDEN:{
            logError('api', '没有权限访问', params)
            break;
          }
          case config.SUCCESS:{
            resolve(res.data)
            break;
          }
        }
      },
      fail: function(error){
        params.error = error
        logError('api', '服务端请求出现问题', params)
        reject(error)
      },
      complete(){}
    })
    
  })
}