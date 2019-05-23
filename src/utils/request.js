
import Taro from '@tarojs/taro'
/* 路测 */
let api = process.env.HTTP_URL
/**
 * Promise化小程序接口
 */

export default function({path, ...value}) {
  return new Promise((resolve, reject) => {
    Taro.request({
      url: api + path,
      ...value,
      success: function(res){
        switch(+res.statusCode) {
          case 200: {
            resolve(res.data)
            break
          };
          case 403: { // 拒绝访问

          }
        }
      },
      fail: function(error){
        reject(error)
      },
      complete(){}
    })
    
  })
}