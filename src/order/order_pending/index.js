// pages/order_pending/index.js
let app = getApp();
let amap = require('../../utils/amap');
let util = require('../../utils/util.js');
let { http } = require('../../utils/request');
const  webSocket = require('../../utils/socket');

const { passengerAccount, route } = require("../../utils/api");

let timeoutCar;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    nvabarData: {
      showCapsule: 1, //是否显示左上角图标
      title: '', //导航栏 中间的标题
      i_back: true,
      i_center: false
    },
    callData:{
      bottom:"540rpx"
    },
    subkey: app.globalData.subkey,
    orderId: '',
    markers: [],
    polyline: [],
    num: '',
    type: "",
    car_color: "",
    license: "",
    status: '',
    date:"",
    socketLimit: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const that = this;
    let title = "nvabarData.title";// 先用一个变量，把(info[0].gMoney)用字符串拼接起来
    let { id, statusType } = options
    if(statusType == 1){
      this.setData({
        [title]: '进行中订单'
      })
    } else {
      this.setData({ 
        [title]: '订单行程'
      })
    }
    this.mapCtx = wx.createMapContext('navi_map');
    this.data.orderId = id
  },
  onShow(){
    console.log('开始显示')
    this.getOrderDetail(this.data.orderId)
    webSocket.connectSocket({
      success: function(){
        console.log('开始', new Date((new Date().getTime())).Format('yyyy-MM-dd hh:mm:ss.S'))
      }
    });
    // 设置接收消息回调
    webSocket.onSocketMessageCallback = this.onSocketMessageCallback;
  },
  onHide: function(){
    webSocket.closeSocket();
  },
  getOrderDetail(id){
    const that = this
    let { userInfo } = app.globalData
    http({
      api: route,
      path: 'orderManager/OrderMsgByPassengerId',
      params: {
        orderId: id,
        istatus: '1',
        passengerId: userInfo.id
      }
    })
    .then(res => {
      if(!!res.error) return false;
      let {orderInfo:val, gpsList} = res.value;
      console.log("------------->" + val.status + '--------->')
      if(val.status == 3) {
        if(gpsList && gpsList.length > 0) {
          gpsList.shift()
          gpsList.pop()
        };
        console.log('用户站点途径详情', gpsList)
        that.requires(val, gpsList)
      } else if(val.status == 4) {
        wx.redirectTo({
          url:  `/order/order_progress/index?id=${val.id}&statusType=4`
        })
      }
    })
  },
  /**
   * @description 得到车辆的信息,进行页面数据更新
   */
  requires: function(orderInfoById, gpsList){
    const that = this
    let {id, mayEndTime,stationEndGps,stationStartGps, vehicleLicense, peopleNumber,mayEndUpdateTime, actualStartTime, vehicleModel, color} = orderInfoById
    let waypoinList = [];
    this.data.orderDetail = orderInfoById
    that.setData({
      date: util.formatTime(new Date(+actualStartTime), '-'),
      num: peopleNumber,
      car_color: color,
      license: vehicleLicense,
      type: vehicleModel
    })
    // 地图站点
    gpsList.forEach(element => {
      waypoinList.push({
        longitude: element.gps.split(',')[0],
        latitude: element.gps.split(',')[1],
        iconPath: '/image/radius.png',
        width: 14,
        height: 14
      })
    })
    that.wayPath({startGps:stationStartGps,endGps:stationEndGps,time: new Date(mayEndUpdateTime || mayEndTime), waypoinList})

    let gpsWay = {
      start: gpsList.filter(item => item.status == 1 ), // 未经过
      end: gpsList.filter(item => item.status != 1), // 经过
    }
    that.getcar({endGPS: stationEndGps,waypoints:gpsWay})
    timeoutCar && clearInterval(timeoutCar)
    timeoutCar = setInterval(()=> {
      that.getcar({endGPS: stationEndGps,waypoints:gpsWay, setTime: true})
    }, 15000); // 刷新车辆的位置
  },
  wayPath: function({startGps,endGps,time, waypoinList}){
    let _points = [
      {
        width: 20,
        height: 32,
        longitude: +startGps.split(',')[0],
        latitude: +startGps.split(',')[1],
        iconPath: '/image/point_s.png',
      },
      {
        width: 20,
        height: 32,
        longitude: +endGps.split(',')[0],
        latitude: +endGps.split(',')[1],
        iconPath: '/image/point_e.png',
        callout:{
          content: `预计 ${util.formatNumber(time.getHours())}:${util.formatNumber(time.getMinutes())} 到达下车`,
          textAlign: 'center',
          color: '#212121',
          fontSize: 14,
          padding: 6,
          borderRadius: 16,
          bgColor: '#ffffff',
          display: 'ALWAYS'
        }
      }
    ]
    let points = _points.concat(waypoinList)
    this.setData({
      markers: points
    });
    this.mapCtx.includePoints({points: points,padding: [100,70,200,50]})
  },
  /**
   * @description 获取起始点高德地图设置
   */
  amaps: function({startGps, endGps, waypoints}){
    const that = this;
    let wayStr = ''
    waypoints.forEach(element => {
      wayStr+= element.gps + ';'
    })
    amap.getRoute({
      type: 'getDrivingRoute',
      origin: startGps,
      destination: endGps,
      waypoints: wayStr
    })
    .then(data => {
      new Promise((resolve) => {
        let points = [];
        if (data.paths && data.paths[0] && data.paths[0].steps) {
          var steps = data.paths[0].steps;
          for(var i = 0; i < steps.length; i++){
            var poLen = steps[i].polyline.split(';');
            for(var j = 0;j < poLen.length; j++){
              points.push({
                longitude: parseFloat(poLen[j].split(',')[0]),
                latitude: parseFloat(poLen[j].split(',')[1])
              })
            } 
          }
          resolve(points)
        }
      }).then(value => {
        let polyline = [...that.data.polyline];
        if(polyline.length > 1) {
          polyline.pop()
        }
        polyline.push({
          points: value,
          color: '#48a93f',
          arrowLine: true,
          width: 6
        })
        that.setData({
          polyline: polyline
        });
      })
    })
  },
  /**
   * @description 获取司机路线
   * @author shenzekun
   */
  carMapRouter(){
    const that = this
    let { actualEndTime, mayEndTime} = that.data.orderDetail
    let endTime = new Date(+mayEndTime)
    let endCreateTime = util.formatTime(new Date(), '-')
    if(new Date().getTime() > endTime.getTime()) {
      let time = `${endTime.getFullYear()}/${endTime.getMonth() + 1}/${endTime.getDate()} 23:00:00`;
      endCreateTime = util.formatTime(new Date(time), '-')
    }
    if(actualEndTime){
      endCreateTime = util.formatTime(new Date(+actualEndTime), '-')
    }
    http({
      api: route,
      isloade: true,
      path: 'orderManager/orderLocation',
      params: {
        orderId: this.data.orderId,
        startCreateTime: this.data.date,
        endCreateTime: endCreateTime
      }
    }).then(res => {
      if(res.value.length <= 0) {return false;}
      let polyline = [...that.data.polyline];
        if(polyline.length > 1) {
          polyline.shift()
        }
      that.data.polyline.unshift({
        points: res.value.map(val => {
          return {
            longitude: parseFloat(val.split(',')[0]),
            latitude: parseFloat(val.split(',')[1])
          }
        }),
        color: '#c8c8c8',
        arrowLine: true,
        width: 6
      })
      that.setData({
        polyline: that.data.polyline
      })
    })
  },
  // 刷新车的位置
  getcar: function({endGPS,waypoints}){
    http({
      api: passengerAccount,
      isloade: true,
      path: 'vehicleInfo',
      params: {
        vehicleLicence: this.data.license
      }
    }).then(res => {
      if(res.value.length <=0) {
        return false
      };
      let markers = [...this.data.markers],
      that = this;
      // !setTime && that.getDetail() // 是否15s刷新一次到达点
      that.carMapRouter()
      that.amaps({startGps: res.value[0].location, endGps: endGPS, waypoints: waypoints.start})
      if(markers.some((item) => { return (item.id == -1) })) { // 不是第一加载小车 直接修改坐标地点
        markers[markers.length - 1].longitude = res.value[0].location.split(',')[0]
        markers[markers.length - 1].latitude = res.value[0].location.split(',')[1]
        markers[markers.length - 1].rotate = +res.value[0].busDirection
      } else { // 第一次加载小车浅拷贝赋值
        res.value[0] = Object.assign(res.value[0], {
          id: -1,
          longitude: res.value[0].location.split(',')[0],
          latitude: res.value[0].location.split(',')[1],
          iconPath: "/image/car.png",
          rotate: +res.value[0].busDirection || 0,
          width: 20,
          height: 41,
        })
        markers = markers.concat(res.value)
      }
      this.setData({
        markers: markers
      })

    })
  },
  getDetail(){
    const that = this
    let { userInfo } = app.globalData
    http({
      api: route,
      isloade: true,
      path: 'orderManager/OrderMsgByPassengerId',
      params: {
        orderId: this.data.orderId,
        istatus: '1',
        passengerId: userInfo.id
      }
    }).then(res => {
      that.data.orderDetail = res.value.orderInfo
      let time = new Date(res.value.orderInfo.mayEndUpdateTime || res.value.orderInfo.mayEndTime)
      let markers = [...this.data.markers];
      markers[1].callout.content = `预计 ${util.formatNumber(time.getHours())}:${util.formatNumber(time.getMinutes())} 到达下车`
      this.setData({
        markers: markers
      })
    })
  },
  onSocketMessageCallback: function(res){
    let data = JSON.parse(res)
    if(data.type == 'dropdown') { // 下车
      wx.redirectTo({
        url:  `/order/order_progress/index?id=${this.data.orderId}&statusType=4`
      })
    } else if(data.type == 'OthersPeople' || data.type == 'cancelOrder' || data.type == 'sureOrder'){
      console.log('应该重新获取路线')
      this.getOrderDetail(this.data.orderId)
    }
  },
  moveToLocation: function () {
    this.mapCtx.includePoints({points: this.data.markers,padding: [100,70,200,50]})
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log('页面进行退出')
    this.onHide()
    timeoutCar&& clearInterval(timeoutCar)
    timeoutCar = ''
  }
})