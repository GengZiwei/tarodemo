// pages/center/center.js
const app= getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    nvabarData: {
      showCapsule: 1, //是否显示左上角图标
      title: '个人中心', //导航栏 中间的标题
      i_back: true,
      i_center: false
    },
    height: app.globalData.height,
    phone: '',
    // userInfo: {},
    // hasUserInfo: false
    //canIUse: wx.canIUse('button.open-type.getUserInfo')
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      phone: app.globalData.userInfo.phone.substr(0,3) + "****"+ app.globalData.userInfo.phone.substr(7)
    })
  },
  _showorder:function(e){
    let {route} = e.currentTarget.dataset;
    app.navigateTo({
      url: route,
    })
  }
})