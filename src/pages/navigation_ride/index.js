// pages/getRoute/index.js
let app = getApp();
let amap = require('../../utils/amap');
let {http} = require('../../utils/request');
let wechat = require('../../utils/wechat');

const {route} = require("../../utils/api");
Page({

  /**
   * 页面的初始数据
   */
  data: {
    /* nvabarData: {
      showCapsule: 1, //是否显示左上角图标
      title: '选择出行人数', //导航栏 中间的标题
      i_back: true,
      i_center: false
    }, */
    callData: {
      bottom: "490rpx"
    },
    subkey: app.globalData.subkey,
    markers: [],
    includePoints: [],
    height: app.globalData.height,
    array: ['1', '2'],
    index:0,
    longitude:"",
    latitude:"",
    cost: 10,
    sCOST: 0,
    pNumber:1,
    polyline: []
  },
  bindPickerChange: function (e) {
    console.log('picker发送选择改变，携带值', e, this.price)
    this.data.pNumber = this.data.array[+(e.detail.value)]
    this.setData({
      index: e.detail.value,
      sCOST: e.detail.value == 0 ? this.price.oneprice : this.price.twoprice
    })
  },
  moveToLocation: function () {
    this.mapCtx.moveToLocation()
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (option) {
    let {starword, endword} = app.globalData
    let that = this,
        _path = [];
    this.mapCtx = wx.createMapContext('navi_map');

    _path[0] = Object.assign(starword, {
      iconPath: '/image/point_s.png',
      width: 24,
      height: 40,
      name: null
    });
    _path[1] = Object.assign(endword, {
      iconPath: '/image/point_e.png',
      width: 24,
      height: 40,
      name: null
    })
    that.getMoney(_path[0], _path[1])
    wechat.getLocation('gcj02')
    .then(val=> {
      let startGps = val.longitude + ',' + val.latitude
      this.setData({
        longitude: val.longitude,
        latitude: val.latitude,
        markers:_path,
        includePoints: [val, ..._path]
      });
      this.routerMao('getWalkingRoute', startGps , `${starword.longitude},${starword.latitude}`)
    })
  },
  routerMao(type, start, end){
    const that = this
    amap.getRoute({
      type: type,
      origin: start,
      destination: end,
    }).then(data => {
      var points = [];
      if (data.paths && data.paths[0] && data.paths[0].steps) {
        var steps = data.paths[0].steps;
        for (var i = 0; i < steps.length; i++) {
          var poLen = steps[i].polyline.split(';');
          for (var j = 0; j < poLen.length; j++) {
            points.push({
              longitude: parseFloat(poLen[j].split(',')[0]),
              latitude: parseFloat(poLen[j].split(',')[1])
            })
          }
        }
      }
      if(type == 'getWalkingRoute'){
        that.setData({
          polyline: [{
            points: points,
            width: 4,
            color: "#4f80f5DD",
            dottedLine: true
          }]
        });
      }
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.mapCtx = wx.createMapContext('navi_map');
  },
  // 获取金钱
  getMoney(start, end){
    http({
      api: route,
      path: 'orderManager/orderprice',
      params: {
        startGPSid: start.typeID,
        endGPSid: end.typeID
      }
    }).then(res => {
      if(res.priceMap) {
        this.price = res.priceMap
        this.setData({
          sCOST: res.priceMap.oneprice
        })
      }
    })
  },
  btnSubmit: function() {
    if(this.setbutt){return false}
    this.setbutt = true
    http({
      api: route,
      path: 'orderManager/selectstatusBypassengerId',
      params: {
        passengerId: app.globalData.userInfo.id
      }
    }).then(res => {
      this.setbutt = false
      if(!!res.error) return false;
      if(!res.orderInfo) { // 无其他订单 可以下单
        wx.redirectTo({
          url:'/pages/response/index?number=' + this.data.pNumber
        })
      } else {
        //提示并进行 判断类型（待支付， 进行中)
        wx.showModal({
          title: '',
          content: '您有一笔订单未完成',
          success: function (data) {
            if (data.confirm) {
              let url = ''
              console.log(res.orderInfo)
              if(res.orderInfo.status == '4') {
                url = `/order/order_progress/index?interrupt=1&id=${res.orderInfo.id}&statusType=4`
              } else if(['60', '8'].includes(res.orderInfo.status)){
                let {color:car_color, vehicleLicense:license,
                   peopleNumber:num, orderTime, id, vehicleModel,cancelReason, status} = res.orderInfo;
                let value = { car_color, license, num, date: new Date(orderTime).Format(),
                  money: app.globalData.basicInformationList.cancelCost, id, type: vehicleModel,
                }          
                app.globalData.payorderValue = value;
                url = '/order/order-payment/index?status=' + res.orderInfo.status
              } else if(res.orderInfo.status == '2') {
                url = `/pages/response/index?orderId=${res.orderInfo.id}&orderTaking=true`
              } else if(res.orderInfo.status == '1') {
                url = `/pages/response/index?orderId=${res.orderInfo.id}&time=${orderTime}`
              } else if(res.orderInfo.status == '3') {
                url = `/order/order_pending/index?interrupt=1&id=${res.orderInfo.id}&statusType=1`
              }
              app.navigateTo({url})
            }
          }
        });
      }
    }).catch(()=>{
      this.setbutt = false
    })
  }
})