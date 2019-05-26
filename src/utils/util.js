/**
 * 工具类
 */
class Util {
  /**
   * @description 传递组string 进行个数的换行 默认为6个字符
   * @author GengZiwei
   * @static
   * @param {string} [str='']
   * @param {number} [num=6]
   * @returns
   * @memberof Util
   */
  static strcharacter(str = '', num = 6){
    let leng = Math.ceil(str.length / num)
    let character = ''
    if(str.length < num) return str
    for(let i = 1; i <= leng;i++) {
      if(i == leng) return  character += str.slice((i-1) * 6, str.length);
      character += (str.slice((i-1) * 6, i*6) + ' \n ')
    }
    return character
  }
  /**
   * @description 传递两个 经纬度 进行计算直线距离
   * @author GengZiwei
   * @static
   * @param {*} {lat1, lng1, lat2, lng2}
   * @returns
   * @memberof Util
   */
  static getDisance({lat1, lng1, lat2, lng2}) { // lat为纬度, lng为经度
    let toRad = (d) => d * Math.PI / 180;
    let radLat1 = toRad(lat1);
    let radLat2 = toRad(lat2);
    let deltaLat = radLat1 - radLat2;
    let deltaLng = toRad(lng1) - toRad(lng2);
    let dis = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(deltaLat / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(deltaLng / 2), 2)));
    return dis * 6378137;
  
  }
  /**
   * @description 传递 对象生成url & 拼接
   * @author GengZiwei
   * @static
   * @param {*} data
   * @returns
   * @memberof Util
   */
  static paramStr (data) {
    let _result = []
    for (let key in data) {
      let value = data[key]
      if (['', undefined, null].includes(value)) { // 去掉为空的参数
        continue
      }
      if (value.constructor === Array) {
        value.forEach(_value => {
          _result.push(encodeURIComponent(key) + '[]=' + encodeURIComponent(_value))
        })
      } else {
        _result.push(encodeURIComponent(key) + '=' + encodeURIComponent(value))
      }
    }

    return _result.length ? '?' + _result.join('&') : ''
  }
  /**
   * @description 传递数组进行排序 或者 指定对象值 sortValue 进行排序
   * @author GengZiwei
   * @static
   * @param {*} arr
   * @returns
   * @memberof Util
   */
  static bubbleSort(arr){
    let len = arr.length - 1
    for (let j = 0; j < len; j++) {
      for (let i = 0; i < len - j; i++) {
        if(arr[i].sortValue ? arr[i].sortValue > arr[i + 1].sortValue : arr[i] > arr[i + 1]){
          [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
        } 
      }
    }
    return arr
  }
};

module.exports = Util;