// pages/orderlist/orderlist.js
const app = getApp();
const util = require('../../utils/util.js');

let { http } = require("../../utils/request");
const {route} = require("../../utils/api");
Page({
  /**
   * 页面的初始数据
   */
  data: {
    /* nvabarData: {
      showCapsule: 1, //是否显示左上角图标
      title: '订单中心', //导航栏 中间的标题
      i_back: true,
      i_center: false
    }, */
    order: -1,
    pageNumber: 1,
    height: app.globalData.height,
    orderlist:[]
  },
  value: {
    id: '',
    key: '',
    orderStatus: new Map([
      ['1',{
        statusTitle: '派单中',
        className: 'conduct'
      }],
      ['2', {
        statusTitle : '进行中',
        className: 'conduct'
      }],
      ['3', {
        statusTitle : '进行中',
        className: 'conduct'
      }],
      ['4', {
        statusTitle: '待支付',
        className: 'pay'
      }],
      ['5', {
        statusTitle : '已完成',
        className: 'complete'
      }],
      ['6',{
        statusTitle: '已取消',
        className: 'cancel'
      }],
      ['60',{
        statusTitle: '待支付',
        className: 'pay'
      }],
      ['65',{
        statusTitle: '已支付',
        className: 'complete'
      }],
      ['7', {
        statusTitle : '拒单',
        className: 'pay'
      }],
      ['8', {
        statusTitle : '待支付',
        className: 'pay'
      }],
      ['85', {
        statusTitle : '已支付',
        className: 'complete'
      }]
    ])
  },
  getOrderList({pageSize = 10, pageNumber, refresh= false}){
    http({
      api: route,
      path: 'orderManager/OrderListByPassengerId',
      params: {
        passengerId: app.globalData.userInfo.id,
        pageSize: pageSize,
        pageNumber: pageNumber
      }
    }).then(res => {
      if(!!res.err) return false
      this.totalPage = res.orderForPage.totalPage
      this.data.pageNumber = pageNumber
      let dataList = res.orderForPage.orderByValueList.map(val => {
        let {status, orderTime, startStation, endStation, peopleNumber,evaluation} = val;
        let time = new Date(orderTime).Format();
        let orderStatus = this.value.orderStatus.get(status);
        !orderStatus && (orderStatus = {
          className: 'cancel',
          statusTitle: '已关闭'
        })
        status == '5' && !evaluation && (
          orderStatus = {
            statusTitle: '待评价',
            className: 'pay'
          }
        );
        return Object.assign(val, {
          statusType: status,
          stateclass: orderStatus.className,
          state: orderStatus.statusTitle,
          date: time,
          num: peopleNumber,
          start_point: startStation,
          end_point: endStation,
        })
      })
      if(refresh) {
        wx.stopPullDownRefresh()
        this.setData({
          order: dataList.length >0 ? '1' : '0'
        })
      }
      this.setData({
        orderlist: this.data.orderlist.concat(dataList)
      })
    })
  },
  getListDetail(id, key){
    let { userInfo } = app.globalData
    http({
      api: route,
      path: 'orderManager/OrderMsgByPassengerId',
      params: {
        orderId: id,
        istatus: '1',
        passengerId: userInfo.id
      }
    }).then(res => {
      let val = res.value.orderInfo;
      let {status, orderTime, stationEndPlace,evaluation, stationStartPlace, peopleNumber} = val
      let time = new Date(orderTime).Format();
        let orderStatus = this.value.orderStatus.get(status);
        !orderStatus && (orderStatus = {
          className: 'cancel',
          statusTitle: '已关闭'
        })
        status == '5' && !evaluation && (
          orderStatus = {
            statusTitle: '待评价',
            className: 'pay'
          }
        );
      let data = Object.assign(val, {
        statusType: status,
        stateclass: orderStatus.className,
        state: orderStatus.statusTitle,
        date: time,
        num: peopleNumber,
        start_point: stationStartPlace,
        end_point: stationEndPlace
      })
      this.setData({
        [`orderlist[${key}]`]: data
      })
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // this.getOrderList({pageNumber: 1, refresh: true})
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  },
  // 前往详情
  _showorderinfo:function(e){
    let {id, type, time, item, key} = e.currentTarget.dataset
    this.value.id = id
    this.value.key = key
    if(['4', '5', '6'].includes(type)) {
      let statusType = '',service = '';
      switch (+type) {
        case 4:{
          statusType = 4
            break;}
        case 5:{
          item.evaluation && (service = 'true')
          statusType = 2
          break;}
          case 6:{
          statusType = 3
          break;}
      }
      app.navigateTo({
        url: `/order/order_progress/index?id=${id}&statusType=${statusType}&service=${service}`,
      })
    } else if(['60', '8'].includes(type)){
      http({
        api: route,
        path: 'orderManager/OrderMsgByPassengerId',
        params: {
          orderId: id,
          istatus: '1',
          passengerId: app.globalData.userInfo.id
        }
      }).then(res => {
        let {color:car_color, vehicleLicense:license, peopleNumber:num, orderTime, id, vehicleModel} = res.value.orderInfo
        let value = {
          car_color,
          license,
          num,
          date: new Date(orderTime).Format(),
          money: app.globalData.basicInformationList.cancelCost,
          id,
          type: vehicleModel
        }
        app.globalData.payorderValue = value
        app.navigateTo({
          url:'/order/order-payment/index',
          params: {
            status: type
          }
        })
      })
    } else if(type == '3' ) {
      app.navigateTo({
        url: `/order/order_pending/index?id=${id}&statusType=1`,
      })
    } else if(['2', '1'].includes(type)) {
      let url = getCurrentPages().filter(item => item.route == "pages/response/index")
      if(url.length > 0) {
        wx.navigateBack({delta: 2})
      } else {
        if(type == '1'){
          app.navigateTo({
            url: `/pages/response/index?orderId=${id}&time=${time}`,
          })
        } else {
          app.navigateTo({
            url: `/pages/response/index?orderId=${id}&orderTaking=true`,
          })
        }
      }
    }
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if(this.value.id) {
      this.getListDetail(this.value.id, this.value.key)
    } else {
      this.onPullDownRefresh()
    }
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function (e) { // 刷新
    this.data.pageNumber = 1
    this.data.orderlist = []
    this.getOrderList({pageNumber: 1, refresh: true})
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log('到底啦')
    // 总页数跟当前页数的对比
    console.log(this.totalPage, this.data.pageNumber)
    if(this.totalPage == this.data.pageNumber) return false
    this.data.pageNumber++
    this.getOrderList({pageNumber: this.data.pageNumber})
  }
})