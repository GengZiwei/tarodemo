// wallet/purchaser/purchaser.js
let wxchat = require('../../utils/wechat');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [
      {text: '注册地址', value: 'registAddress', placeholder:'请填写注册地址'},
      {text: '注册电话', value: 'registPhone', placeholder:'请填写注册电话'},
      {text: '开户银行', value: 'openBank', placeholder:'请填写开户银行'},
      {text: '银行账号', value: 'bankAccount', placeholder:'请填写银行账号'}
    ],
    purchaser: {
      registAddress: '',
      registPhone:'',
      openBank: '',
      bankAccount: ''
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.options = options
    wxchat.getStorage('purchaser').then(res =>{
      this.setData({
        purchaser: res.data
      })
    }).catch(error =>{})
  },
  valueBrue(e){
    let value = e.currentTarget.dataset.data
    this.data.purchaser[value] = e.detail.value
  },
  submit: function(){
    wxchat.setStorage('purchaser', this.data.purchaser).then(() => {
      wx.navigateBack()
    }).catch(error => {
      wx.showToast({
        title: error,
        icon: 'none',
        duration: 1500
      })
    })
  }
})