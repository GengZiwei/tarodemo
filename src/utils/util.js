/**
 * 工具类
 */
class Util {
  static formatTime(date, type) {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    let hour = date.getHours();
    let minute = date.getMinutes();
    let second = date.getSeconds();
    
    return [year, month, day].map(this.formatNumber).join(type || '/') + ' ' + [hour, minute, second].map(this.formatNumber).join(':');
  };
  static formatNumber(n) {
    n = n.toString();
    return n[1] ? n : '0' + n;
  };
  static status(params) { // status 数字对应的状态
    let arror = ['进行中', '进行中', '进行中', '待支付', '已完成', '已取消', '拒单', '已取消']
    for (const key in arror) {
      if(key.includes(params-1)) return arror[key]
    }
  }
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
  static toRad(d) { return d * Math.PI / 180; }
  static getDisance({lat1, lng1, lat2, lng2}) { // lat为纬度, lng为经度
    var dis = 0;
    var radLat1 = this.toRad(lat1);
    var radLat2 = this.toRad(lat2);
    var deltaLat = radLat1 - radLat2;
    var deltaLng = this.toRad(lng1) - this.toRad(lng2);
    var dis = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(deltaLat / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(deltaLng / 2), 2)));
    return dis * 6378137;
  
  }
  static paramStr (data, isPrefix) {
    let _result = []
    for (let key in data) {
      let value = data[key]
      // 去掉为空的参数
      if (['', undefined, null].includes(value)) {
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
  //利用射线法，计算射线与多边形各边的交点，如果是偶数，则点在多边形外，否则
  //在多边形内。还会考虑一些特殊情况，如点在多边形顶点上，点在多边形边上等特殊情况。
  /* static isPointInPolygon(point, polygon) {
    var N = polygon.length;
    var boundOrVertex = true; //如果点位于多边形的顶点或边上，也算做点在多边形内，直接返回true
    var intersectCount = 0; //cross points count of x 
    var precision = 2e-10; //浮点类型计算时候与0比较时候的容差
    var p1, p2; //neighbour bound vertices
    var p = point; //测试点

    p1 = polygon[0]; //left vertex        
    for (var i = 1; i <= N; ++i) { //check all rays            
      if (p.x == p1.x && p.y == p1.y) {
        return boundOrVertex; //p is an vertex
      }

      p2 = polygon[i % N]; //right vertex            
      if (p.y < Math.min(p1.y, p2.y) || p.y > Math.max(p1.y, p2.y)) { //ray is outside of our interests                
        p1 = p2;
        continue; //next ray left point
      }

      if (p.y > Math.min(p1.y, p2.y) && p.y < Math.max(p1.y, p2.y)) { //ray is crossing over by the algorithm (common part of)
        if (p.x <= Math.max(p1.x, p2.x)) { //x is before of ray                    
          if (p1.y == p2.y && p.x >= Math.min(p1.x, p2.x)) { //overlies on a horizontal ray
            return boundOrVertex;
          }

          if (p1.x == p2.x) { //ray is vertical                        
            if (p1.x == p.x) { //overlies on a vertical ray
              return boundOrVertex;
            } else { //before ray
              ++intersectCount;
            }
          } else { //cross point on the left side                        
            var xinters = (p.y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y) + p1.x; //cross point of x                        
            if (Math.abs(p.x - xinters) < precision) { //overlies on a ray
              return boundOrVertex;
            }

            if (p.x < xinters) { //before ray
              ++intersectCount;
            }
          }
        }
      } else { //special case when ray is crossing through the vertex                
        if (p.y == p2.y && p.x <= p2.x) { //p crossing over p2                    
          var p3 = polygon[(i + 1) % N]; //next vertex                    
          if (p.y >= Math.min(p1.y, p3.y) && p.y <= Math.max(p1.y, p3.y)) { //p.y lies between p1.y & p3.y
            ++intersectCount;
          } else {
            intersectCount += 2;
          }
        }
      }
      p1 = p2; //next ray left point
    }

    if (intersectCount % 2 == 0) { //偶数在多边形外
      return false;
    } else { //奇数在多边形内
      return true;
    }
  } */
  static bubbleSort(arr){ // 排序
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