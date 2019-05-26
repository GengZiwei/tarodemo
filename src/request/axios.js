
import Taro from '@tarojs/taro'
import {NOT_FOUND, BAD_GATEWAY, FORBIDDEN, SUCCESS} from './config'
import logError from '@/utils/logError'
/* 路测 */
let api = process.env.HTTP_URL
/**
 * Promise化小程序接口
 */
let getToken = () =>{
  let token = {
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
          case NOT_FOUND:{
            logError('api', '请求资源不存在', params)
            break;
          }
          case BAD_GATEWAY:{
            logError('api', '服务端出现了问题', params)
            break;
          }
          case FORBIDDEN:{
            logError('api', '没有权限访问', params)
            break;
          }
          case SUCCESS:{
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