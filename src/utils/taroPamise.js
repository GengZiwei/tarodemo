import Taro from '@tarojs/taro'
/**
 * Promise化小程序接口
 */
class TaroPromise {
  /**
   * 登陆
   * @return {Promise} 
   */
  static login() {
    return new Promise((resolve, reject) => Taro.login({ success: resolve, fail: reject }));
  };

  /**
   * 获取用户信息
   * @return {Promise} 
   */
  static getUserInfo() {
    return new Promise((resolve, reject) => Taro.getUserInfo({ success: resolve, fail: reject }));
  };

  /**
   * 设置本地数据缓存
   * @param {string} key 
   * @param {string} value 
   * @return {Promise} 
   */
  static setStorage(key, value) {
    return new Promise((resolve, reject) => Taro.setStorage({ key: key, data: value, success: resolve, fail: reject }));
  };

  /**
   * 获取本地数据缓存
   * @param {string} key 
   * @return {Promise} 
   */
  static getStorage(key) {
    return new Promise((resolve, reject) => Taro.getStorage({ key: key, success: resolve, fail: reject }));
  };

  /**
   * @description 删除本地指定数据
   * @static
   * @param {*} key
   * @returns {Promise}
   * @memberof Wechat
   */
  static removeStorage(key) {
    return new Promise((resolve, reject) => {Taro.removeStorage({ key: key, success: resolve, fail: reject })})
  }

  /**
   * 获取当前位置
   * @param {string} type 
   * @return {Promise} 
   */
  static async getLocation(type) {
    let sett = await TaroPromise.getSetting()
    let authLocat = await TaroPromise.authorize('scope.userLocation');
    return new Promise((resolve, reject) => {
      sett.authSetting['scope.userLocation'] || authLocat ?
      Taro.getLocation({ type: type, success: resolve, fail: reject })
      : reject({auth: true, error: '未授权'})
    })
  };

  /**
   * 
   * @param {string} type 
   * @return {Promise} 
   */
  static getNetworkType(type) {
    return new Promise((resolve, reject) => Taro.getNetworkType({ type: type, success: resolve, fail: reject }));
  };

  /**
   * @description: 打开设置
   * @param {type} 
   * @return: 
   */
  static getSetting(){
    return new Promise((resolve, reject) => Taro.getSetting({success: resolve, fail: reject}))
  }

  /**
   * @description: 
   * @param {type} 
   * @return: 
   */
  static authorize(scope){
    return new Promise((resolve, reject) => Taro.authorize({scope:scope,success: resolve, fail: reject}))
  }

  static getSystemInfo(){
    return new Promise((resolve, reject) => Taro.getSystemInfo({success: resolve, fail: reject}))
  }
};

export default TaroPromise