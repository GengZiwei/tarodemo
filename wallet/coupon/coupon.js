// pages/coupon/coupon.js

let wechat = require("../../utils/wechat");
let {http} = require("../../utils/request")

const {wallet} = require("../../utils/api")
let app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    couponList: [],
    number: 1
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.options = options
    this.setData({
      payCoupon: options.coupon == 1
    })
    this.onPullDownRefresh()
  },
  onPullDownRefresh: function() {
    this.data.couponList = []
    this.httprequest = false
    this.getList({}, true)
  },
  onReachBottom(){
    if(this.data.number == this.totalPage) {
      return false;
    }
    this.data.number++
    this.getList({pageNumber: this.data.number})
  },
  getList({pageSize = 10, pageNumber=1}, refresh){
    let {id} = app.globalData.userInfo
    if(this.httprequest) {return false};
    this.httprequest = true
    http({
      isloade: true,
      api: wallet,
      path: 'coupon/getCouponListByPid/' + id,
      params: {
        pageSize: pageSize,
        pageNumber: pageNumber
      }
    }).then(res =>{
      let {list, totalPage} = res.value
      let couponList = [...this.data.couponList]
      this.totalPage = totalPage
      this.data.number = pageNumber
      this.httprequest = false
      if(refresh){
        wx.stopPullDownRefresh()
      }
      this.setData({
        couponList: [...couponList, ...list.map(val =>{
          return Object.assign(val,{
            couponTime: this.formData(new Date(+val.startDate)) + ' - ' +  this.formData(new Date(+val.endDate))
          })
        })]
      })
    })
  },
  tabDetail(e){
    let data = [...this.data.couponList];
    let {id} = e.currentTarget.dataset;
    data[id].display = !data[id].display;
    this.setData({
      couponList: data
    })
  },
  formData(date){
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    return [year, month, day].map(n => {
      n = n.toString();
      return n[1] ? n : '0' + n;
    }).join('-')
  },
  bindDetail(e){
    if(this.options.coupon == 1) {
      wechat.setStorage('coupon', e.currentTarget.dataset)
      .then(()=>{
        wx.navigateBack()
      })
    }
  },
  noCoupon(){
    wechat.removeStorage('coupon').then(()=>{}).catch(()=>{})
    wx.navigateBack()
  }
})