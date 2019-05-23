// pages/response/index.js
let app = getApp();
let util = require("../../utils/util")
let amaps = require("../../utils/amap");
let wechat = require("../../utils/wechat");

let {http} = require("../../utils/request");
let { websocket,passengerAccount,route, monitor } = require("../../utils/api");

let interval = '',
    timeoutCar ='',
    timeoutRouter = '',
    tt = 0,
    SocketTask=null;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 组件所需的参数
    nvabarData: {
      showCapsule: 1, //是否显示左上角图标
      title: '等待应答', //导航栏 中间的标题
      i_back: false,
      i_center: true
    },
    callData: {
      bottom: "390rpx"
    },
    subkey: app.globalData.subkey,
    height: app.globalData.height * 2 + 28, // 此页面 页面内容距最顶部的距离
    orderTaking: false,  //是否派单
    longitude: '',
    latitude: '',
    markers: [],
    polyline:[],
    starword: {}, // 上车站点
    times:"00:00",
    goCar: '', // 车辆高德计算时间
    carArrive: false, // 是否开启页面时间对应提示
    carDetail: {} // 车辆的信息
  },
  value: {
    options: {},
    navTime: '', // 下单的时间
    socketLimit: 0, // socket的连接次数
    navOrderID: '', // 去下单的orderid
    navOrderTime: 3 * 60, // 下单等到时间
  },
  onLoad: function(options){
    this.value.options = options;
    this.mapCtx = wx.createMapContext('myMap');
    options.number && this.stopOrder();
  },
  onShow(){
    let {options, navTime, navOrderTime} =  this.value
    !SocketTask && this.toSetSocket() // socket连接
    options.orderId && this.getorder(options.orderId)
    if(navTime && !options.orderId){
      let time = Math.floor((new Date().getTime()- navTime) / 1000)
      if(time < navOrderTime - 1) { // 是否小于等待时间
        tt = time
        this.getWaitTimes()
        interval = setInterval(this.getWaitTimes, 1000);
      } else {
        tt = navOrderTime
        this.value.navTime = ''
        this.getWaitTimes()
      }
    }
  },
  onHide(){
    console.log('进入后台');
    interval && clearInterval(interval)
    timeoutCar && clearInterval(timeoutCar)
    timeoutRouter && clearInterval(timeoutRouter)
    SocketTask && this.clearSocket()
    SocketTask = null
    interval = ''
    timeoutCar = ''
    timeoutRouter = ''
  },
  onUnload(){
    tt = 0
    this.onHide()
    console.log('退出页面', SocketTask)
  },
  makePhone: function(){
    wx.makePhoneCall({
      phoneNumber: this.driverPhone // 仅为示例，并非真实的电话号码
    })    
  },
  // 地图回到用户中心点
  moveToLocation: function () {
    this.mapCtx.moveToLocation()
  },
  /**
   * @description 去下单页面
   * @author shenzekun
   */
  stopOrder(){
    const that = this
    let { starword } = app.globalData;
    let _path = [
      Object.assign(
        starword,
        {
          id:1,
          iconPath: '/image/point_s.png',
          width: 24,
          height: 40
        }
      )
    ];
    this.setData({
      markers: _path,
      starword: starword
    });
    this.locatMy().then(res => {
      that.mapCtx.includePoints({points: [res, _path[0]], padding: [150,50,300,50]})
    })
    // 步行轨迹
    this.golocat(`${starword.longitude},${starword.latitude}`)
    // 去下单
    this.nav()
  },
  /**
   * @description 去进行下单
   * @author shenzekun
   */
  nav(){
    const that = this
    let {starPoint, endPoint, starword, endword, userInfo} = app.globalData;

    tt = 0
    that.value.navOrderID = ''

    http({
      method: 'POST',
      api: route,
      path: 'orderManager/batchOrder',
      params: {
        endGps: endPoint.location,
        endPlace: endPoint.keywords,
        endStationId: endword.typeID,
        expectStartTime: new Date().getTime(),
        orderTime: new Date().getTime(),
        passengerId: userInfo.id,
        phoneNumber: userInfo.phone,
        peopleNumber: +that.value.options.number,
        startGps: starPoint.location || `${starPoint.longitude},${starPoint.latitude}`,
        startPlace: starPoint.name || starPoint.keywords,
        startStationId: starword.typeID,
        userCompanyId: '1'
      }
    }).then(res => {
      that.getWaitTimes()
      interval = setInterval(that.getWaitTimes, 1000); // 开始进行下单时间
      that.value.navTime = new Date().getTime();
      that.value.navOrderID = res.value;
    }).catch(error => {
      console.log('下单接口报错', error)
      clearInterval(interval);
      wx.showToast({
        title: '下单失败,请稍后在试',
        icon: 'none',
        duration: 1500
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500);
    })
  },
  /**
   * @description 查询订单详情
   * @author shenzekun
   */
  getorder(orderid, tosoket){
    const that = this
    http({
      api: route,
      path: 'orderManager/OrderMsgByPassengerId',
      params: {
        orderId: orderid,
        istatus: '0',
        passengerId: app.globalData.userInfo.id
      }
    }).then(res => {
      let {orderInfo, gpsList} = res.value;
      let waypoints = '', waypoinList = []; // 途径点gps、图标
      let times = orderInfo.mayStartTime - new Date().getTime();
      
      times <= 0 ? times = 0  : times = parseInt(times / 1000)
      tt = times
      if(!this.data.carArrive) {
        console.log('开始触发了倒计时', times)
        that.countdown()
        if(tt > 0) {
          interval && clearInterval(interval)
          interval = setInterval(() => {
            that.countdown()
          }, 1000);
        }
      }
      if(orderInfo.status == 2) {
        if(gpsList && gpsList.length > 2) { // 清空两头的起终点
          gpsList.shift()
          gpsList.pop()
          gpsList.forEach(element => {
            waypoints += element.gps + ';' // 途径的
            waypoinList.push({ // 地图的途径的
              longitude: element.gps.split(',')[0],
              latitude: element.gps.split(',')[1],
              iconPath: '/image/radius.png',
              width: 14,
              height: 14
            })
          })
        }
        tosoket ? this.getcar(waypoints, false) : this.setNav(orderInfo, {waypoints, waypoinList})
      } else if(orderInfo.status == 3) {
        wx.redirectTo({
          url: `/order/order_pending/index?id=${orderid}&statusType=1`
        })
      } else {
        console.log('orderInfo.status', orderInfo.status)
        wx.showModal({
          showCancel: false,
          content: '您的订单已发生改变，请去订单中心查看。',
          success: function(){
            let url = '/pages/index/index'
            wx.reLaunch({url})
          }
        })
      }

    })
  },
  /**
   * @description 等待接驾逻辑
   * @author shenzekun
   */
  setNav(orderReturnValue, gpsList){
    const that = this
    let {
      color, vehicleLicense,driverName, startStationId,driverPhone, vehicleModel, stationEndGps,
      id, stationStartGps, stationStartPlace } = orderReturnValue
    /* 上车的信息 */
    let path = [
      {
        id: 1,
        width: 20,
        height: 32,
        longitude: +stationStartGps.split(',')[0],
        latitude: +stationStartGps.split(',')[1],
        iconPath: '/image/point_s.png',
      },
      {
        id: 2,
        width: 20,
        height: 32,
        longitude: +stationEndGps.split(',')[0],
        latitude: +stationEndGps.split(',')[1],
        iconPath: '/image/point_e.png'
      }
    ]

    that.driverPhone = driverPhone // 司机手机号
    that.value.options.orderId =  id // 订单id
    that.data.startStationId = startStationId // 步行上车的id
    if(!this.data.routeSetMap) {   
      that.locatMy().then(res =>{
        this.mapCtx.includePoints({points: [...res, ...path], padding: [150,50,300,50]})
        setTimeout(() => {
          this.mapCtx.includePoints({points: [...res, ...path[0]], padding: [150,50,300,50]})
        }, 3000);
      })
      // 上车到下车的 车辆行驶规划的路线
      that.amap({
        type: 'getDrivingRoute',
        startGps: stationStartGps,
        endGps: stationEndGps
      }).then(DrivingRoute =>{
        that.data.polyline.unshift({
          points: DrivingRoute.points,
          width: 6,
          color: "#48a93f"
        })
        that.setData({
          polyline: that.data.polyline
        });
      })
      that.setData({
        polyline: [],
        markers: path,
        'nvabarData.title':"等待接驾",
        carDetail: {
          driverName: driverName ? driverName.charAt(0) + '师傅' : '佚名',
          car_type: vehicleModel,
          car_color: color,
          license: vehicleLicense,
        },
        orderTaking: true,
        starword: {
          name: stationStartPlace,
          location: stationStartGps
        }
      })
      this.data.routeSetMap = true
    }
    that.getcar(gpsList.waypoints, true)
    timeoutCar = setInterval(()=>{that.getcar(gpsList.waypoints, false)}, 15000)
    that.golocat(`${path[0].longitude},${path[0].latitude}`, true) // 步行轨迹

    timeoutRouter = setInterval(() => {
      this.locatMy().then(res => {
        let endGps = this.workGPS
        let disance= util.getDisance({
          lat1: res.longitude,
          lng1: res.latitude,
          lat2: endGps.longitude,
          lng2: endGps.latitude
        })
        if(disance <= 5){ return false;}
        this.golocat(`${path[0].longitude},${path[0].latitude}`, true)
      })
    }, 5000)
  },
  /**
   * @description socket连接
   * @author shenzekun
   */
  toSetSocket(){
    const that = this
    if(that.value.socketLimit > 4) {
      SocketTask = null
      that.value.socketLimit = 0
      wx.showToast({
        title: '请检查网络连接',
        icon: 'none',
        duration: 3000,
        mask: false
      });
      return false;
    }
    console.log('开始连接等待接驾socket')
    SocketTask = wx.connectSocket({
      url: websocket + app.globalData.userInfo.id,
      header: app.globalData.headerToken
    })
    SocketTask.onOpen(()=>{
      that.value.socketLimit += 1
      console.log('sock打开')
    })
    SocketTask.onError(() => {
      console.log('等待接驾socket异常，在尝试连接')
      that.clearSocket()
    })
    SocketTask.onClose(() => {
      console.log('等待接驾socket监听到关闭')
      SocketTask && setTimeout(() => {
          that.toSetSocket()
          that.value.socketLimit += 1
        }, 3000);
    })
    SocketTask.onMessage((res) => {
      let data = JSON.parse(res.data)
      setTimeout(() => {
        console.log('接收到下单页面socket数据', data)
        clearInterval(interval)
        if(data.type == 'cancel') { // 取消订单
          wx.showModal({
            showCancel: false,
            content: '没有规定时间到达该地点，订单已取消',
            success: function(){
              wx.navigateBack({delta: 1})
            }
          })
        } else if(data.type == 'pickup') {
          this.data.pickup = true
          wx.redirectTo({
            url: `/order/order_pending/index?id=${that.value.options.orderId}&statusType=1`
          })
        } else if(data.type == 'falseOrder'){
          if(interval && data.value == that.value.navOrderID){
            clearInterval(interval);
            interval = ''
            tt = 0
            that.value.navTime = ''
            wx.showModal({
              title: '',
              content: '暂无司机接单,是否继续等待',
              success: function (res) {
                res.confirm ? that.nav() :  wx.navigateBack()
              }
            })
          }
        } else if(data.type == 'sureOrder' || data.type == 'cancelOrder' || data.type == 'OthersPeople'){
          if(this.data.pickup){return false};
          that.value.options.orderId ? that.getorder(that.value.options.orderId, true) : that.getorder(that.value.navOrderID)
        }
      }, 500);
    })
  },
  /**
   * @description socket关闭
   * @author shenzekun
   */
  clearSocket(){
    SocketTask.close({
      success: function(){
        console.log('已经手动关闭')
      }
    })
  },
  postwalkPGPS(GPS, startID){ // 上传个人位置的gps
    http({
      api: monitor,
      path: 'createPassengerMonitor',
      isloade: true,
      method: "POST",
      params: {
        "gps": GPS,
        "orderId": this.value.options.orderId,
        "passengerId": app.globalData.userInfo.id,
        "phoneNumber": app.globalData.userInfo.phone,
        "stationId": startID
      }
    })
  },
  // 取消订单
  closeOrder: function() {
    const that = this
    let content = '',
    orderId = that.value.options.orderId
    if(that.value.options.orderId) {
      content = '取消订单可能会对其他乘客造成影响，请慎重取消！'
    } else {
      orderId = that.value.navOrderID
      content = '再等等吧，快为您找到司机了'
    }
    wx.showModal({
      title: '',
      cancelText: '继续等待',
      cancelColor: '#003478',
      confirmText: '确定取消',
      confirmColor: '#003478',
      content: content,
      success(res) {
          res.confirm && http({
            api: route,
            method: "DELETE",
            path: `orderManager/cancelOrder?passengerId=${app.globalData.userInfo.id}&orderId=${orderId}`
          }).then(res => {
            if(!!res.error) {
              wx.showModal({
                showCancel: false,
                content: res.error.message
              })
              return false
            }
            wx.navigateBack({delta: 1})
          })
      }
    })
  },
  /**
   * @description 计算车辆的位置
   * @author shenzekun
   */
  getcar(waypoints, settime){
    const that = this
    console.log('小车获取位置', that.data.carDetail.license)
    http({
      api: passengerAccount,
      isloade: true,
      path: 'vehicleInfo',
      params: {
        vehicleLicence: that.data.carDetail.license
      }
    }).then(res => {
      if(res.value.length <= 0) {
        return false
      };
      settime && setTimeout(() => {
        that.carmap(res.value[0].location, that.data.starword.location, waypoints)
      }, 3000);

      let markers =[...that.data.markers]
      if(markers.some((item) => { return (item.id == -1) })) {
        markers[markers.length - 1].longitude = res.value[0].location.split(',')[0]
        markers[markers.length - 1].latitude = res.value[0].location.split(',')[1]
        markers[markers.length - 1].rotate = +res.value[0].busDirection
      } else {
        let mark = {
          id: -1,
          longitude: res.value[0].location.split(',')[0],
          latitude: res.value[0].location.split(',')[1],
          iconPath: "/image/car.png",
          rotate: +res.value[0].busDirection || 0,
          width: 20,
          height: 41,
        }
        markers = markers.concat(mark)
      }
      that.setData({
        markers: markers
      })
    })
  },
  /**
   * @description 进行查询车辆的路线规划获取路线时间
   * @param {*} startGps
   * @param {*} endGps
   * @param {*} time
   */
  carmap: function(startGps, endGps, waypoints){
    const that = this;
    that.amap({
      type: 'getDrivingRoute',
      startGps,
      endGps,
      waypoints
    }, true).then(data => {
      that.setData({
        goCar: Math.round(data.duration / 60)
      })
      let aMapPoints = data.points
      let dataaMapPoints = aMapPoints.concat(that.data.walking)
      this.data.aMapPoints = aMapPoints
      that.setData({
        polyline: dataaMapPoints
      });
    })
  },
  /**
   * @description 步行走路虚线
   * @create 是否进行上传gps
   * @author shenzekun
   */
  golocat(endGps, create){
    const that = this
    this.locatMy().then(res=> {
      let startGps = res.longitude + ',' + res.latitude
      this.workGPS = res
      create && this.postwalkPGPS(startGps, this.data.startStationId)
      this.amap({
        type: 'getWalkingRoute',
        startGps: startGps,
        endGps: endGps
      }).then(WalkingRoute => {
        let walkpoints = WalkingRoute.points
        walkpoints.unshift(res)
        walkpoints.push({
          longitude: endGps.split(',')[0],
          latitude: endGps.split(',')[1]
        })
        this.data.walking = [{
          points: walkpoints,
          width: 4,
          color: "#4d7ef3",
          dottedLine: true
        }]
        that.setData({
          polyline:  this.data.aMapPoints ? [...this.data.aMapPoints, ...this.data.walking] : [...that.data.polyline, ...this.data.walking]
        });
      })
    })
  },
  /**
   * @description 获取当前乘客的地理位置
   * @author shenzekun
   * @returns
   */
  locatMy(){
    return wechat.getLocation('gcj02')
  },
  /**
   * @description 路线规划
   * @author shenzekun
   */
  amap({type, startGps, endGps, waypoints}, color = false){
    return new Promise((resolve, reject) => {
      amaps.getRoute({
        type: type,
        origin: startGps,
        destination: endGps,
        waypoints: waypoints
      }).then(data => {
        let aMapPoints = [];
        if (data.paths && data.paths[0] && data.paths[0].steps) {
          let steps = data.paths[0].steps;
          if(color) {
            let status = {
              '未知': '#b4cbe9',
              '畅通': '#34b000',
              '缓行': '#fecb00',
              '拥堵': '#df0100',
              '严重拥堵': '#8e0e0b'
            };
            for(var i =0;i < steps.length;i++) {
              steps[i].tmcs.forEach(val => {
                var polyline = val.polyline.split(';'),
                polyList = [];
    
                for(var j = 0;j < polyline.length; j++){
                  polyList.push({
                    longitude: parseFloat(polyline[j].split(',')[0]),
                    latitude: parseFloat(polyline[j].split(',')[1])
                  })
                }
                aMapPoints.push({
                  points: polyList,
                  color: status[val.status],
                  arrowLine: true,
                  width: 6
                })
              });
              if(i+1 != steps.length && i > 0) {
                let ivalue = steps[i].polyline.split(';').pop();
                let jvalue = steps[i + 1].polyline.split(';')[0];
                aMapPoints.push({
                  points: [{
                    longitude: parseFloat(ivalue.split(',')[0]),
                    latitude: parseFloat(ivalue.split(',')[1])
                  },{
                    longitude: parseFloat(jvalue.split(',')[0]),
                    latitude: parseFloat(jvalue.split(',')[1])
                  }],
                  color: status[steps[i].tmcs[0].status],
                  arrowLine: true,
                  width: 6
                })
              }
            }

          } else {
            for(var i = 0; i < steps.length; i++){
              var poLen = steps[i].polyline.split(';');
              for(var j = 0;j < poLen.length; j++){
                aMapPoints.push({
                  longitude: parseFloat(poLen[j].split(',')[0]),
                  latitude: parseFloat(poLen[j].split(',')[1])
                })
              } 
            }
          }
        }
        resolve({
          duration: data.paths[0].duration,
          points: aMapPoints
        })
      }).catch(error=>{
        reject(error)
      })
    })
  },
  // 等待时间
  getWaitTimes() {
    const that = this
    tt++;
    let ms = this.checkTime(tt)
    this.setData({
      times: ms
    })
    if(tt > this.value.navOrderTime) {
      clearInterval(interval);
      interval = ''
      tt = 0
      wx.showModal({
        title: '',
        content: '暂无司机接单,是否继续等待',
        success: function (res) {
          res.confirm ? that.nav() :  wx.navigateBack()
        }
      })
    }
  },
  //计时进行到站
  countdown() {
    let ms = this.checkTime(tt);
    this.setData({
      times: ms
    })
    tt--;
    if(tt = 60){
      this.setData({
        oneMinute: true
      })
    }
    if(tt < 0) {
      console.log('需要清除时间了', ms)
      tt = 0
      this.setData({
        carArrive: true
      })
      clearInterval(interval)
    }
  },
  checkTime(i){
    let m = 0;
    let s = 0;
    if(i<60){
      s = i
    }else{
      s = i%60;
      m = parseInt(i/60);
    }
    if(m<10){
      m = "0"+m
    }
    if(s<10){
      s = "0"+s
    }
    return m+"'"+s + "''";
  },
})