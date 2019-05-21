// pages/order_progress/index.js
let app = getApp();
// let amap = require('../../utils/amap');
const util = require('../../utils/util.js')

let { http } = require('../../utils/request')
const {route} = require("../../utils/api")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    nvabarData: {
      showCapsule: 1, //是否显示左上角图标
      title: '进行中订单', //导航栏 中间的标题
      i_back: true,
      i_center: false
    },
    subkey: app.globalData.subkey,
    bottom: 310,
    markers: [],
    includePoints: [],
    polyline: [],
    num: '',
    money:0,
    type:"",
    car_color:"",
    license:"",
    date:"",
    color:''
  }, 
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.mapCtx = wx.createMapContext('navi_map');
    let title = "nvabarData.title";// 先用一个变量，把(info[0].gMoney)用字符串拼接起来
    let { id, statusType, service } = options
    if (statusType == 3) {
      this.setData({
        display: "hide",
        reset: "hide",
        color: "",
        [title]: '已取消订单'
      })
    }
    this.data.id = id
  },
  onShow: function(){
    var that = this;
    let { userInfo } = app.globalData;
    let title = "nvabarData.title";// 先用一个变量，把(info[0].gMoney)用字符串拼接起来
    http({
      api: route,
      path: 'orderManager/OrderMsgByPassengerId',
      params: {
        orderId: this.data.id,
        istatus: '1',
        passengerId: userInfo.id
      }
    })
    .then(res => {
      if(!!res.error) {return false}
      let {status , evaluation} =  res.value.orderInfo
      if(status == '5') {
        this.setData({
          display: "", 
          pending: '',
          reset: "hide",
          bottom: evaluation ? 438 : 512,
          evaluation: evaluation ? '' : 'block',
          color: "#c8c8c8",
          [title]: '已完成订单'
        })
      } else if (status == '4') {
        this.setData({
          display: "",
          bottom: 512,
          reset: "hide",
          pending: "block",
          color: "#c8c8c8",
          [title]: '待支付订单'
        })
      }
      that.requires(res.value.orderInfo, res.value.gpsList)
    })
  },
  /**
   * @description 进行数据更新
   */
  requires: function(orderInfoById,gpsList){
    const that = this
    let { mayStartTime, status,stationEndGps,stationStartGps,
      vehicleLicense, peopleNumber, actualStartTime,expectStartTime,
      orderPrice, vehicleModel, color} = orderInfoById
    that.data.orderDetail = orderInfoById
      that.setData({
        money: orderPrice,
        late: (+actualStartTime) - (+mayStartTime),
        date: new Date(+actualStartTime || +expectStartTime).Format(),
        num: peopleNumber,
        car_color: color,
        license: vehicleLicense,
        type: vehicleModel
      })
      if(gpsList && gpsList.length > 0) {
        gpsList.shift()
        gpsList.pop()
      }
      console.log("处理数据",gpsList)
      that.amap({startGps: stationStartGps, endGps: stationEndGps, status, gpsList})
  },
  /**
   * @description 高德地图设置
   */
  amap: function({startGps, endGps, status, gpsList}){
    let waypoinList = [];
    let _path = [
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
        iconPath: '/image/point_e.png'
      }
    ]
    if((status != 6 || status != 8) && gpsList) {
      gpsList.forEach(element => {
        waypoinList.push({
          longitude: element.gps.split(',')[0],
          latitude: element.gps.split(',')[1],
          iconPath: '/image/radius.png',
          width: 14,
          height: 14
        })
      })
    }
    this.setData({
      markers: [6,8].includes(+status) ? _path : _path.concat(waypoinList),
      includePoints: _path
    });
    // this.mapCtx.includePoints({points: _path,padding: [150,50,300,50]})
    // 取消订单状态路线值为空
    if(status == 6 || status == 8){ return false};
    this.carMapRouter()
  },
  _showpayorder: function(){
    let {car_color, license, num, date, money, id, type, late} = this.data
    let {noResTime} = app.globalData.basicInformationList
    let value = {
      car_color,
      license,
      num,
      date,
      money,
      id,
      type
    }
    app.globalData.payorderValue = value
    let url = `/order/order-payment/index?status=${4}`
    if(late > +noResTime * 1000){
      url = `/order/order-payment/index?status=${4}&late=true`
    }
    app.navigateTo({url})
  },
  _showEvaluation: function(){
    let {id} = this.data
    app.navigateTo({
      url: '/service/evaluation/index',
      params: {
        orderId: id
      }
    }, true)
  },
  moveToLocation: function () {
    this.mapCtx.moveToLocation()
  },
  /**
   * @description 获取司机路线
   * @author shenzekun
   */
  carMapRouter(){
    const that = this
    let { actualEndTime, orderTime} = that.data.orderDetail
    http({
      isloade: true,
      api: route,
      path: 'orderManager/orderLocation',
      params: {
        orderId: this.data.id,
        startCreateTime: util.formatTime(new Date(+orderTime), '-'),
        endCreateTime: actualEndTime ? util.formatTime(new Date(+actualEndTime), '-') : util.formatTime(new Date(), '-')
      }
    }).then(res => {
      if(res.value && res.value.length <= 0) { // 路线获取失败
        return false;
      }
      that.data.polyline[0] = {
        points: res.value.map(val => {
          return {
            longitude: parseFloat(val.split(',')[0]),
            latitude: parseFloat(val.split(',')[1])
          }
        }),
        color: '#c8c8c8',
        width: 6
      }
      that.setData({
        polyline: that.data.polyline
      })
    })
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})