//index.js
//获取应用实例
let app = getApp();
let amap = require("../../utils/amap")
let utils = require('../../utils/util')
let RequestHttp = require("../../utils/request")
let wechat = require('../../utils/wechat')
const {passengerAccount, route} = require("../../utils/api")
// 微信地图api
Page({
  data: {
    // 组件所需的参数
    nvabarData: {
      showCapsule: 1, //是否显示左上角图标
      title: '', //导航栏 中间的标题
      i_back: false,
      i_center: true
    },
    subkey: app.globalData.subkey,
    iconbuuble: '',
    height: app.globalData.height,
    // 是否有订单进行中
    showDialog: false,
    orderPay:false,
    // 选择的上车站点
    starword: null,
    latitude: '30.294427',
    longitude: '120.343369',
    pupuns: false,
    markers:[],
    setSite: -1
  },
  value: {
    mokeMarkers: [],
    mokeCars: [],
    getHTTP: 0,
    region: false
  },
  moveToLocation: function () {
    const that = this
    let location = this.data.longitude + ',' + this.data.latitude
    wechat.authorize('scope.userLocation').then(() => {
      wechat.getLocation('gcj02').then(res => {
        console.log('经纬度获取成功')
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude
        })
        that.setPointLocation(res)
      }).catch(error => {
      app.globalData.starPoint = location
        wx.showModal({
          title: '地理位置获取失败',
          showCancel: false,
          content: '请点击右下角按钮重新获取地理位置'
        })
      })
    }).catch(error => {
      app.globalData.starPoint = location
      wx.showModal({
        title: '地理位置授权失败',
        showCancel: false,
        content: '请在设置里面开始授权，方便为您派车。'
      })
    })
  },
  // 页面加载
  onLoad: function (option) {
    this.option = option
    console.log('推广人员', option)
    if(option.scene) {
      const scene = decodeURIComponent(option.scene)
      let sceneMap = {}
      scene.split('#').forEach(res =>{ sceneMap[res.split(':')[0]] = { 
        code: res.split(':')[0],
        value: res.split(':')[1]
      } })
      sceneMap.promoter && wechat.setStorage('promoter', sceneMap.promoter) // 推广员推荐
    }
  },
  onShow: function(){
    this.mapCtxs = wx.createMapContext('myMap');
    app.isUser((res) => {
      res && this.bypassenger()
    })
  },
  onReady: function(){
    app.istoken().then(res =>{
      if(res.type == 0) {
        this.setData({
          pupuns: true
        })
      } else if(res.type == 1) {
        wechat.setStorage('token', res.value).then(res =>{
          app.basicInformationList()
          this.bypassenger()
        })
      }
    })
    let starPoint =  app.globalData.starPoint
    if(this.option.type) {
      this.setPointLocation({
        latitude: starPoint.location.split(',')[1],
        longitude: starPoint.location.split(',')[0]
      })
    } else {
      this.moveToLocation()
    }
  },
  // 移动中心点坐标位置
  regionchange(e){
    const that = this
    if(this.value.region) {return false}
    if(e.type == 'begin' && e.causedBy == '' && this.value.getHTTP > 1) {
      this.setData({
        iconbuuble: '在此上车'
      })
    }
    if(e.type == 'end' && e.causedBy == 'drag') {
      that.mapCtxs.getCenterLocation({
        success: function(res) {
          console.log(res)
          let log = new Number(res.longitude).toFixed(8)  + ',' + new Number(res.latitude).toFixed(8); // 保存当前的第一次获取值用于对比下一次的值
          console.log(log, that.log)
          if(log == that.log) {return false}
          that.log = log
          that.setPointLocation(res)
        },
        fail:function(){
          console.log('地理位置失败')
        }
      })
    }
  },
  bindupdated(){
    if(this.value.getHTTP > 0) {
      this.value.region = false
    }
  },
  // 点击标记点
  getMarker(e){
    let mId = e.markerId;
    let _mks = [...this.value.mokeMarkers];
    if(mId < 0){ return false}; // 当点击点是车（id<0）的时候取消操作
    app.globalData.starword = _mks[mId]
    // 绘制当前选择的站点
    this.pointLocationStart = true
    this.setData({
      markers: _mks.concat(this.value.mokeCars),
      starword: _mks[mId],
      iconbuuble: '步行到此站点上车',
      latitude: _mks[mId].latitude,
      longitude: _mks[mId].longitude,
    })
  },
  // 获取坐标信息，进行站点查询
  setPointLocation(option) {
    const that = this;
    let locat = option.longitude + ',' + option.latitude // 是否是自己移动的点
    // 清空临时的mark的站点跟车
    that.value.mokeMarkers = [];
    that.value.mokeCars = [];
    that.value.region = true
    // 重新获取mark的站点跟车
    that.getCar(locat)
    that.value.getHTTP++
    app.getSiteAround("start", locat, that.getDate)
  },
  getDate(data){ // 赋值上车信息 回调函数
    let markers = [...data.markers]
    this.value.mokeMarkers = markers
    amap.getRegeo({location: `${data.longitude},${data.latitude}`})
    .then(res => {
      app.globalData.starPoint = {
        longitude: data.longitude,
        latitude: data.latitude,
        name: res[0].name
      }
    })
    if(markers.length > 0){
      this.disance()
    } else {
      app.globalData.starword = null;
      this.setData({
        starword: null,
        latitude: data.latitude,
        longitude: data.longitude,
        markers: this.value.mokeCars.length > 0 ? this.value.mokeCars : []
      })
      wx.navigateTo({
        url: '/pages/range/index',
      })
    }
  },
  disance(){ // 计算位置
    let disanceVlue = [...this.value.mokeMarkers]
      disanceVlue[0].label = {
        content: utils.strcharacter(disanceVlue[0].isName, 6),
        color: '#5db5a1',
        padding: 3,
        fontSize: 12,
        anchorX: 4,
        anchorY: -22
      }
      this.setData({
        markers: disanceVlue.concat(this.value.mokeCars),
        starword: disanceVlue[0],
        iconbuuble: this.value.getHTTP > 1 ? '步行到此站点上车' : '拖动地图更换上车点',
        latitude: disanceVlue[0].latitude,
        longitude: disanceVlue[0].longitude,
      })
  },
  // 获取周围车辆
  getCar(Gps){
    const that = this
    RequestHttp.http({
      isloade: true,
      api: passengerAccount,
      path: 'vehicleInfo',
      params: {
        vehicleGps: Gps
      }
    }).then(res => {
      that.value.mokeCars = res.value.map((value,index) => {
        return {
          id: -(index + 10),
          longitude: value.location.split(',')[0],
          latitude: value.location.split(',')[1],
          iconPath: "/image/car.png",
          rotate: value.busDirection || Math.floor(Math.random()*360),
          width: 20,
          height: 41,
          zIndex: 0
        }
      })
    })
  },
  // 查询是否有订单
  bypassenger(){
    const that = this
    if(this.data.showDialog || !app.globalData.basicInformationList || app.globalData.userInfo) { return false;}
    RequestHttp.http({
      api: route,
      path: 'orderManager/selectstatusBypassengerId',
      params: {
        passengerId: app.globalData.userInfo.id
      }
    }).then(res => {
      if(res.orderInfo) {
        let url = '';
        let {color:car_color, vehicleLicense:license, peopleNumber:num, orderTime, id, vehicleModel, status} = res.orderInfo
        switch (status) {
          case '4':
            url = {
              url: '/order/order_progress/index',
              params: {
                interrupt: '1',
                id: id,
                statusType: status
              }
            }
            that.setData({
              showDialog: true,
              orderPay: true
            });
          break;
          case '60':
          case '8':
            let value = { car_color, license, num, date: new Date(orderTime).Format(),
              money: app.globalData.basicInformationList.cancelCost, id, type: vehicleModel,
            }
            app.globalData.payorderValue = value;
            url = {
              url: '/order/order-payment/index',
              params: {
                status: status
              }
            }
            that.setData({
              showDialog: true,
              orderPay: true
            })
          break;
          case '2':
            url={
              url: '/pages/response/index',
              params: {
              orderId: id,
              orderTaking: 'true'
             }
           }
          that.setData({
            showDialog: true
          })
          break;
          case '1':
            url = {
              url: '/pages/response/index',
              params: {
                orderId: id,
                time: orderTime
              }
            }
            that.setData({
              showDialog: true
            })
          break;
          case '3':
            url = {
              url: '/order/order_pending/index',
              params: {
                interrupt:1,
                id: id,
                statusType:1
              }
            }
            that.setData({
              showDialog: true
            })
          break;
        }
        that.orderURL = url
      }
    })
  },
  // 查看订单
  toCheck(){
    let {orderURL} = this;
    this.closeDialog()
    app.navigateTo(orderURL)
  },
  // 关闭显示订单的提示
  closeDialog(){
    this.setData({
      showDialog: false
    })
  },
  // 设置起始点
  bindStartInput:function(){
    let url = `/pages/inputTip/inputtip?type=start`;
    app.navigateTo({ url });
  },
  // 选择终点
  bindEndInput:function(){
    if(this.data.starword) {
      let url = `/pages/inputTip/inputtip?type=end`;
      app.navigateTo({ url });
    } else {
      wx.showToast({
        title: '请选择上车站点',
        icon: 'none',
        duration: 1500,
        mask: false
      })
    }
  },
  closecoupon(){
    this.setData({
      pupuns: false
    })
  }
})
