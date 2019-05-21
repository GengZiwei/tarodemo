import amapFile from "./amap-wx";
// 高德开发者key
let key = 'c3496637ae4c10a045bb506355888d34';
let myAmapFun = new amapFile.AMapWX({ key });

class Amap {
  /**
   * 获取POI数据
   * @param {string} querykeywords 
   */
  static getPoiAround(querykeywords = '') {
    return new Promise((resolve, reject) => myAmapFun.getPoiAround({ querykeywords, success: resolve, fail: reject }));
  }

  /**
   * 获取地理描述数据
   */
  static getRegeo({iconPath, location}) {
    return new Promise((resolve, reject) => myAmapFun.getRegeo({ iconPath, location, success: resolve, fail: reject }));
  }
  /**
   * 获取天气数据
   *
   */
  static getWeather() {
    return new Promise((resolve, reject) => myAmapFun.getWeather({ success: resolve, fail: reject }));
  }

  /**
   * 获取输入提示词
   * @param {string} keywords 
   * @param {string} location 
   */
  static getInputtips(city, location = '', keywords = '') {
    return new Promise((resolve, reject) => myAmapFun.getInputtips({ keywords, location, city, citylimit: true, success: resolve, fail: reject }));
  }

  /**
   * 获取路线规划
   * type : getDrivingRoute --驾车
   * type : getWalkingRoute --步行
   * type : getTransitRoute --公交
   * type : getRidingRoute --骑行
   * @param {string} origin 
   * @param {string} destination 
   */
  static getRoute({ origin, destination, type, waypoints=""}) {
    return new Promise((resolve, reject) => myAmapFun[type]({ origin, strategy: 9, destination,waypoints, success: resolve, fail: reject }));
  }
}

module.exports = Amap;