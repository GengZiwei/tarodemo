// order/reopen/index.js

let { http } = require("../../utils/request");
const {wallet} = require("../../utils/api");
Page({

  /**
   * 页面的初始数据
   */
  data: {
    detail: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      'detail': options
    })
  },
  bindblur: function(e){
    let { value, data } = e.currentTarget.dataset
    this.data[value][data] = e.detail.value
  },
  reopen: function(){
    if(!this.data.detail.email) {
      wx.showToast({
        icon: 'none',
        title: '请输入电子邮箱'
      })
      return false
    }
    this.data.detail.id = +this.data.detail.id
    http({
      api: wallet,
      path: 'invoice/supplementalIncoive',
      method: 'POST',
      params: this.data.detail
    }).then(() => {
      wx.showToast({
        title: '提交成功',
        icon: 'success',
        duration: 1500,
        complete: function (){
          setTimeout(() => {
            wx.navigateBack({delta: 1})
          }, 1500);
        }
      })
    }).catch(()=>{})
  }
})