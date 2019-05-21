// pages/order-payment/index.js\
let app = getApp();
let wechat = require("../../utils/wechat");
let { http } = require('../../utils/request');
const {wallet} = require("../../utils/api");
Page({
  //  4待支付  60 取消  8司机调取
  /**
   * 页面的初始数据
   */
  data: {
    /* nvabarData: {
      showCapsule: 1, //是否显示左上角图标
      title: '支付订单', //导航栏 中间的标题
      i_back: true,
      i_center: false
    }, */
    id: '',
    color: '',
    license: '',
    dataTime: '',
    number: '',
    late: '',
    money: 0,
    coupon: 0,
    lateStatus: false,
    paidmoney: null
  },
  value: {
    option:{}
  },
  pay: function(){
    let { id ,couponid, statusOrder} = this.data
    if(this.getToPay) {return false;}
    this.getToPay = true
    http({
      method: 'POST',
      api: wallet,
      path: 'orderwxPay/wxPayOrder',
      params: {
        status: statusOrder,
        orderId: id,
        customerCouponId: couponid,
        passengerId: app.globalData.userInfo.id
      }
    }).then(res => {
      if(!!res.error) return false
      if(res.value.flag == '0') {
        this.getToPay = false
        wx.showToast({
          title: '支付成功',
          icon: 'success',
          duration: 1500
        })
        setTimeout(() => {
          this.data.status ? wx.reLaunch({
            url: '/pages/index/index'
          }) : app.navigateTo({
            url: '/service/evaluation/index?orderId=' + id
          }, true)
        }, 1500)
        return false;
      }
      this.payMapData(JSON.parse(res.value.data))
    }).catch(() =>{
      this.getToPay = false
    })
  },
  payMapData(data){
    const that = this
    let dataMap = data.wxMap
    wx.requestPayment(Object.assign(dataMap,{
      success: function(){
        that.getToPay = false
        wx.showToast({
          title: '支付成功',
          icon: 'success',
          duration: 1500
        })
        setTimeout(() => {
          that.data.status ? wx.reLaunch({
            url: '/pages/index/index'
          }) : app.navigateTo({
            url: '/service/evaluation/index?orderId=' + that.data.id
          }, true)
        }, 1500);
      },
      fail: function(){
        that.getToPay = false
        wx.showToast({
          title: '支付失败',
          icon: 'none',
          duration: 1500
        })
      }
    }))
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (option) {
    this.value.option = option
    let {car_color, license, num, date, money, id, type} = app.globalData.payorderValue;
    this.setData({
      color: car_color,
      relief: app.globalData.basicInformationList.relief,
      type: type,
      license: license,
      dataTime: date,
      number: num,
      money: money,
      id: id,
      lateStatus: !!option.late,
      statusOrder: option.status,
      status: option.status != '4'
    })
    if(option.status == '4') {
      this.getCoupon()
    }
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if(!this.data.status) {
      let {money} = this.data
      let compensation =  +app.globalData.basicInformationList.compensation
      wechat.getStorage('coupon').then((res)=>{
        let {id, money: coupon} = res.data
        let paidmoney = money - coupon > 0 ? money - coupon : '0'
        if(this.value.option.late){
          paidmoney = paidmoney - compensation > 0 ? paidmoney - compensation : '0'
        }
        this.setData({
          couponid: id,
          late: compensation,
          paidmoney: new Number(+paidmoney).toFixed(2),
          coupon: coupon
        })
      }).catch(error =>{
        if(this.value.option.late){
          let paidmoney = money - compensation > 0 ? money - compensation : '0'
          this.setData({
            couponid: '',
            coupon: '',
            late: compensation,
            paidmoney: new Number(+paidmoney).toFixed(2)
          })
        } else {
          this.setData({
            couponid: '',
            paidmoney: '',
            coupon: ''
          })
        }
      })
    }
  },
  
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    wechat.removeStorage('coupon')
  },
  toCoupon(){
    app.navigateTo({
      url: '/wallet/coupon/coupon?coupon=1',
    })
  },
  getCoupon(){
    let {money} = this.data
    http({
      isloade: true,
      api: wallet,
      path: 'coupon/getCouponListByPid/' + app.globalData.userInfo.id,
      params: {
        pageSize: 1,
        pageNumber: 1
      }
    }).then(res => {
      if(res.value.list.length > 0) { // 有优惠券
        let {id, money: coupon} = res.value.list[0]
        let compensation =  +app.globalData.basicInformationList.compensation
        let paidmoney = money - coupon > 0 ? money - coupon : '0'
        if(this.value.option.late){
          paidmoney = paidmoney - compensation > 0 ? paidmoney - compensation : '0'
        }
        this.setData({
          couponid: id,
          late: compensation,
          paidmoney: new Number(+paidmoney).toFixed(2),
          coupon: coupon
        })
        wechat.setStorage('coupon', res.value.list[0])
      }
    })
  }
})