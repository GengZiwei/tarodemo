// service/cancelReason/index.js
const app= getApp();
let RequestHttp = require("../../utils/request");
const {route} = require("../../utils/api");
Page({

  /**
   * 页面的初始数据
   */
  data: {
    listKey: 0,
    disabled: false,
    tareaValue: '',
    cancelReason: []
  },
  value: {
    toNative: false
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.options = options
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    let data = app.globalData.basicInformationList;
    this.setData({
      cancelReason: data.cancelReason || []
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    if(this.options.status && !this.value.toNative){
      app.navigateTo({
        url:'/order/order-payment/index',
        params: {
          status: this.options.status
        }
      })
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  inputtext: function(e){
    this.data.tareaValue = e.detail.value
  },
  onTap: function(){
    let {cancelReason, listKey, tareaValue} = this.data;
    let userInfo = app.globalData.userInfo
    this.setData({
      disabled: true
    })
    RequestHttp.http({
      api: route,
      method: 'POST',
      path: 'orderManager/cancellationReasons',
      params: {
        "cancelReasonsStr": cancelReason[listKey].itemText + tareaValue,
        "orderId": this.options.openID || 0,
        "partyId": userInfo.id || 0
      }
    }).then(res =>{
      this.value.toNative = true
      this.options.status ? app.navigateTo({
        url:'/order/order-payment/index',
        params: {
          status: this.options.status
        }
      }, true) : wx.navigateBack()
    }).catch((error) =>{
      this.setData({
        disabled: false
      })
    })
  },
  onClickList: function(e){
    let {key} = e.currentTarget.dataset;
    this.setData({
      listKey: key
    })
  }
})