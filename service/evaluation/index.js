// service/evaluation/index.js
let app = getApp();
let { comments } = require("../../utils/api");
let RequestHttp = require("../../utils/request");
Page({

  /**
   * 页面的初始数据
   */
  data: {
    clickIndex: 0,
    imgStatue: true,
    tareaValue: '',
    selectList: []
  },
  value: {
    satisfaction: [],
    options: {},
    nosatisfaction: []
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let basicInformationList = app.globalData.basicInformationList;
    try {
      this.value.satisfaction = JSON.parse(JSON.stringify(basicInformationList.satisfaction));
      this.value.nosatisfaction = JSON.parse(JSON.stringify(basicInformationList.nosatisfaction));
      this.setData({
        selectList: this.value.satisfaction
      })
    } catch (error) {
      console.log('基础表值没有')
    }
    this.value.options = options
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

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
  clickImg: function(e){
    let {value} = e.currentTarget.dataset;
    let {satisfaction,nosatisfaction} = this.value;
    this.setData({
      imgStatue: value,
      selectList: value ? satisfaction : nosatisfaction
    })
  },
  inputtext: function(e){
    this.data.tareaValue = e.detail.value
  },
  clickSelect: function(e){
    let {key} = e.currentTarget.dataset;
    let selectList = this.data.selectList
    let selet = `selectList[${key}].click`
    this.setData({
      [selet]: !selectList[key].click
    })
  },
  onTap: function(){
    let {selectList, tareaValue, imgStatue} = this.data;
    let { options } = this.value;
    let { userInfo } = app.globalData
    let data = selectList.filter(res => res.click);
    if(data.length <= 0 && !tareaValue) {
      wx.showToast({
        title: '请提交内容',
        icon: 'none',
        duration: 1500,
        mask: false
      });
      return false
    }
    RequestHttp.http({
      api: comments,
      method: 'POST',
      path: 'serviceEvaluation/saveServiceEvaluation',
      params: {
        "evaluation": data.map(res => res.itemText).join('|') + '|' + tareaValue,
        "orderId": options.orderId,
        "partyId": userInfo && userInfo.id,
        "type": imgStatue ? '1' : '2'
      }
    }).then(() =>{
      wx.showToast({
        title: '评价成功',
        icon: 'none',
        duration: 1500,
        mask: false
      });
      setTimeout(() => {
        const url = '/pages/index/index'
        wx.reLaunch( {url} )
      }, 1500);
    })
  }
})