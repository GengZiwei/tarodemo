// pages/wallet/wallet.js

let app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [
      {name: '优惠券', route: '/wallet/coupon/coupon'},
      {name: '我的发票', route: '/wallet/invoice/invoice'}      
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },
  _showorder(e){
    let {route} = e.currentTarget.dataset
    app.navigateTo({
      url: route,
    })
  }
})