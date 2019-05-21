// js toFixed 精准度
Number.prototype.toFixed = function(length) {
  var carry = 0; // 存放进位标志
  var num, multiple; // num为原浮点数放大multiple倍后的数，multiple为10的length次方
  var str = this + ''; // 将调用该方法的数字转为字符串
  var dot = str.indexOf('.'); // 找到小数点的位置
  if (str.substr(dot + length + 1, 1) >= 5) carry = 1; // 找到要进行舍入的数的位置，手动判断是否大于等于5，满足条件进位标志置为1
  multiple = Math.pow(10, length); // 设置浮点数要扩大的倍数
  num = Math.floor(this * multiple) + carry; // 去掉舍入位后的所有数，然后加上我们的手动进位数
  var result = num / multiple + ''; // 将进位后的整数再缩小为原浮点数
  /*
  * 处理进位后无小数
  */
  dot = result.indexOf('.');
  if (dot < 0) {
      result += '.';
      dot = result.indexOf('.');
  }
  /*
  * 处理多次进位
  */
  var len = result.length - (dot + 1);
  if (len < length) {
      for (var i = 0; i < length - len; i++) {
          result += 0;
      }
  }
  return result;
};

// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子：
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
// eslint-disable-next-line no-extend-native
Date.prototype.Format = function(fmt = 'YYYY-MM-dd hh:mm') { // author: meizz
  var o = {
    'M+': this.getMonth() + 1,               // 月份
    'd+': this.getDate(),                    // 日
    'h+': this.getHours(),                   // 小时
    'm+': this.getMinutes(),                 // 分
    's+': this.getSeconds(),                 // 秒
    'q+': Math.floor((this.getMonth() + 3) / 3), // 季度
    'S': this.getMilliseconds()             // 毫秒
  };
  if (/(y+)/i.test(fmt)) { fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length)); }
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
    }
  }
  return fmt;
}