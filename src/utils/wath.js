function setWatcher(that){
  let data = that.data,
      watch = that.watch;
  Object.keys(watch).forEach(v => { // 将watch对象内的key遍历
    observe(data, v,watch[v], that); // 监听data内的v属性，传入watch内对应函数以调用
  })
}
function observe(obj, key, watchFun, that){
  var val = obj[key];
  Object.defineProperty(obj, key, {
    configurable: true, // 否可以被delete和再次设置
    enumerable: true, // 是否可以被枚举
    set: function(value) {
      watchFun.call(that, value, val);
      val = value
    },
    get: function(value){
      return value
    }
  })
}

module.exports = setWatcher