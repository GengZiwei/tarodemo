// pages/response/index.js
let app = getApp();
let util = require("../../utils/util")
let amaps = require("../../utils/amap");
let wechat = require("../../utils/wechat");
const  webSocket = require('../../utils/socket');

let {http} = require("../../utils/request");
let { passengerAccount,route, monitor } = require("../../utils/api");

let interval = '',
    timeoutCar ='',
    timeoutRouter = '',
    tt = 0

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
    height: '', // 此页面 页面内容距最顶部的距离
    orderTaking: false,  //是否派单
    goCarArriveTitle: '',
    longitude: '',
    latitude: '',
    markers: [],
    polyline:[],
    starwordName: {}, // 起点站点名字
    times:"00:00",
    goCar: '', // 车辆高德计算时间
    carArrive: false, // 是否开启页面时间对应提示
    carDetail: {}, // 车辆的信息
    oneMinute: false
  },
  value: {
    options: {},
    websocket: false,
    tt: 0, // 计数的秒数
    navTime: '', // 下单的时间
    navOrderTime: 3 * 60, // 下单等待时间秒数
  },
  onLoad: function(options){
    this.value.options = options;
    this.mapCtx = wx.createMapContext('myMap');
    this.optionsOrder(options) // 展现是否需要下单
  },
  onReady: function(){
    this.setData({
      height: (app.globalData.height || 20) * 2 + 28
    })
  },
  onShow(){
    let {options, navTime, navOrderID} =  this.value
    webSocket.connectSocket({
      success: function(){
        console.log('接驾soket开始', new Date((Date.now())).Format('yyyy-MM-dd hh:mm:ss.S'))
      }
    });
    webSocket.onSocketMessageCallback = this.onSocketMessageCallback;
    if(this.data.orderTaking) {
      this.getorder(options.orderId)
    } else {
      (navTime || options.time) && this.getorder(options.orderId || navOrderID, false)
    }
  },
  onHide(){
    console.log('进入后台');
    webSocket.closeSocket();
    interval && clearInterval(interval)
    timeoutCar && clearInterval(timeoutCar)
    timeoutRouter && clearInterval(timeoutRouter)
    this.threeMinutes && clearTimeout(this.threeMinutes)
    this.threeMinutes = ''
    interval = ''
    timeoutCar = ''
    timeoutRouter = ''
  },
  onUnload(){
    tt = 0
    this.onHide()
  },
  makePhone: function(){
    wx.makePhoneCall({
      phoneNumber: this.driverPhone // 仅为示例，并非真实的电话号码
    })    
  },
  optionsOrder(options){
    options.orderTaking && this.getorder(options.orderId);
    options.number&& this.stopOrder();
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
    let starword = app.globalData.starword || {}
    let _path = [Object.assign(
        starword,
        {
          id:1,
          iconPath: '/image/point_s.png',
          width: 24,
          height: 40,
        }
      )
    ];
    this.setData({
      markers: _path
    });
    // 获取当前位置进行步行轨迹
    this.locatMy().then(res => {
      that.mapCtx.includePoints({points: [res, _path[0]], padding: [150,50,300,50]})
      this.golocat(`${starword.longitude},${starword.latitude}`)
    })

    this.nav()

/*     // 去下单
    if(navTime) {
      let time = Math.floor((Date.now() - navTime) / 1000);
      let navOrderTime = that.value.navOrderTime
      if(time < navOrderTime - 1) { // 是否小于等待时间
        tt = time
        that.value.navTime = navTime;
        this.getWaitTimes()
        interval = setInterval(() => {
          this.getWaitTimes()
        }, 1000);
      } else {
        tt = navOrderTime
        this.value.navTime = ''
        this.getWaitTimes()
      }
    } else {
      this.nav()
    } */
  },
  /**
   * @description 去进行下单
   * @author shenzekun
   */
  nav(){
    const that = this
    let {starPoint, endPoint, starword, endword, userInfo} = this.globalData;

    this.value.tt = 0

    http({
      method: 'POST',
      api: route,
      path: 'orderManager/batchOrder',
      params: {
        endGps: endPoint.location,
        endPlace: endPoint.name ||  endPoint.keywords,
        endStationId: endword.typeID,
        expectStartTime: Date.now(),
        orderTime: Date.now(),
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
      interval = setInterval(() => {that.getWaitTimes()}, 1000); // 开始进行下单时间
      that.value.navTime = Date.now();
      that.value.options.orderId = res.value;
    }).catch(error => {
      console.log('下单接口报错', error)
      clearInterval(interval);
      wx.showToast({
        title: '下单失败,请稍后在试',
        icon: 'none',
        duration: 1000
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1000);
    })
  },
  /**
   * @description 查询订单详情
   * @author shenzekun
   */
  getorder(tosoket){
    const that = this
    let {orderId} = that.value.options
    http({
      api: route,
      path: 'orderManager/OrderMsgByPassengerId',
      params: {
        orderId: orderId,
        istatus: '0',
        passengerId: app.globalData.userInfo.id
      }
    }).then(res => {
      let {orderInfo, gpsList} = res.value;
      let waypoints = '', waypoinList = []; // 途径点gps、图标
      if(orderInfo.status == 2) {
        let mayStartTime = orderInfo.mayStartTime - Date.now();
        that.value.tt = mayStartTime <= 0 ? 0 : parseInt(mayStartTime / 1000);
        that.countdown()
        if(that.value.tt > 0) {
          interval && clearInterval(interval)
          interval = setInterval(() => {that.countdown()}, 1000);
        } else {
          if(Date.now() - orderInfo.mayStartTime >= +app.globalData.basicInformationList.noResTime * 1000) {
            that.setData({
              carArrive: true,
              goCarArriveTitle: '已为您开启晚点补偿'
            })
          } else {
            that.threeMinutes = setTimeout(() => { // 定时器开始提示晚点补偿
              that.setData({
                carArrive: true,
                goCarArriveTitle: '已为您开启晚点补偿'
              })
            }, (+app.globalData.basicInformationList.noResTime * 1000) - (Date.now() - orderInfo.mayStartTime));
          }
        }
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
      }else if(orderInfo.status == 1) {
        that.value.tt = Date.nav() - res.orderTime
        that.getWaitTimes()
        interval = setInterval(() => {that.getWaitTimes()}, 1000); // 开始进行下单时间
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
      id, stationStartGps, stationStartPlace, peopleNumber } = orderReturnValue
    /* 起点的信息 */
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
    that.data.startStationId = startStationId // 步行起点的id
    if(!this.data.routeSetMap) {   
      that.locatMy().then(res =>{
        this.mapCtx.includePoints({points: [res, ...path], padding: [150,50,300,50]})
        setTimeout(() => {
          this.mapCtx.includePoints({points: [res, path[0]], padding: [150,50,300,50]})
        }, 3000);
      })
      that.setData({
        markers: path,
        'nvabarData.title':"等待接驾",
        carDetail: {
          driverName: driverName ? driverName.charAt(0) + '师傅' : '佚名',
          car_type: vehicleModel,
          car_color: color,
          license: vehicleLicense,
          peopleNumber: peopleNumber
        },
        orderTaking: true,
        starword: {
          name: stationStartPlace,
          location: stationStartGps
        }
      })
      this.data.routeSetMap = true
    }
    // 起点到终点的 车辆行驶规划的路线
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
  onSocketMessageCallback(res){
    const that = this;
    let data = JSON.parse(res)
      setTimeout(() => {
        if(data.type == 'cancel') { // 取消订单
          wx.showModal({
            showCancel: false,
            title: '支付提醒',
            showCancel: false,
            confirmText: '前往支付',
            confirmColor: '#003478',
            content: '为避免影响后续行程，小巴已发车，此行程您需要支付调度费',
            success: function(pay){
              let {peopleNumber, car_color, car_type, license} = that.data.carDetail,
              {cancelCost} = app.globalData.basicInformationList;
              let value = {
                car_color: car_color,
                num: peopleNumber,
                date : new Date(that.value.mayStartTime).Format(),
                money: cancelCost,
                id: that.value.options.orderId,
                license: license,
                type: car_type
              }
              app.globalData.payorderValue = value
              pay.confirm && app.navigateTo({
                url: '/order/order-payment/index',
                params: {
                  status: '8'
                }
              }, true)
            }
          })
        } else if(data.type == 'pickup') {
          this.data.pickup = true
          wx.redirectTo({
            url: `/order/order_pending/index?id=${that.value.options.orderId || that.value.navOrderID}&statusType=1`
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
          if(data.value && data.value != that.value.options.orderId) {return false};
          if(this.data.pickup){return false};
          that.getorder(that.value.options.orderId, true)
        } else if(data.type == 'acceptOrder'){
          that.getorder(that.value.navOrderID)
        }
      }, 500);
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
    title = '',
    payState = false,
    navOrder = false,
    orderId = that.value.options.orderId,
    {peopleNumber, car_color, car_type, license} = that.data.carDetail,
    {cancelCost, compensation, noResTime} = app.globalData.basicInformationList;
    if(orderId) {
      let time = Date.now() - that.value.mayStartTime;
      if(time > +noResTime * 1000){
        title = '已为您开启晚点补偿'
        content = `已为您开启晚点补偿，请您耐心等待小巴到站，继续等待此单可立减${compensation}元`
      } else {
        content = `现在取消须支付调度费${cancelCost}元，是否继续等待`
        payState = true
        let value = {
          car_color: car_color,
          num: peopleNumber,
          date : new Date(that.value.mayStartTime).Format(),
          money: cancelCost,
          id: orderId,
          license: license,
          type: car_type
        }
        app.globalData.payorderValue = value
      }
    } else {
      navOrder = true
      orderId = that.value.navOrderID
      content = '再等等吧，快为您找到司机了'
    }
    wx.showModal({
      title: title,
      cancelText: '继续等待',
      cancelColor: '#003478',
      confirmText: '确定取消',
      confirmColor: '#003478',
      content: content,
      success(res) {
        if(res.confirm && that.value.options.orderId && navOrder){
          wx.showToast({
            title: '已为您接到司机了',
            icon: 'none',
            duration: 1500
          })
          return false
        }
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
            app.navigateTo({
              url: '/service/cancelReason/index',
              params: {
                openID: orderId,
                status: payState ? '60' : ''
              }
            }, true)
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
      that.carmap(res.value[0].location, that.data.starword.location, waypoints, settime)

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
  carmap: function(startGps, endGps, waypoints, settime){
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
      if(settime) {
        setTimeout(() => {
          this.data.aMapPoints = aMapPoints
          that.setData({
            polyline: aMapPoints.concat(that.data.walking || [])
          });
        }, 3000);
      } else {
        this.data.aMapPoints = aMapPoints
        that.setData({
          polyline: aMapPoints.concat(that.data.walking || [])
        });
      }
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
        if(!this.data.orderTaking) {
          that.setData({
            polyline:  this.data.walking
          });
        } else {
          that.setData({
            polyline:  this.data.aMapPoints ? [...this.data.aMapPoints, ...this.data.walking] : [...this.data.polyline,...this.data.walking]
          });
        }
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
    if(tt == 60){
      this.setData({
        oneMinute: true,
        goCarArriveTitle: '您即将迟到，最多为您延迟60秒，请加快脚步'
      })
    }
    tt--;
    if(tt < 0) {
      tt = 0
      this.setData({
        carArrive: true,
        goCarArriveTitle: '若您未上车，司机可取消订单，您需支付取消费用'
      })
      this.threeMinutes = setTimeout(() => {
        this.setData({
          carArrive: true,
          goCarArriveTitle: '已为您开启晚点补偿'
        })
      }, +app.globalData.basicInformationList.noResTime * 1000);
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