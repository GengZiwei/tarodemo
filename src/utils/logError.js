import Taro from '@tarojs/taro'
/**
 * @description 对错误信息的收集
 * @param {*} type 错误的类型
 * @param {*} action 错误的描述
 * @param {*} info 错误失败的值
 */
const logError  = (type, action = '', info = '') =>{
  let time = new Date(Date.now()).Format('yyyy-MM-dd hh:mm:ss.S');
  if (typeof info === 'object') {
    info = JSON.stringify(info)
  }
  /* console.error(`
  类型：${type};
  时间：${time};
  描述：${action};
  结果：${info}
  `) */
}
export default logError