// wallet/invoiceDetail/invoiceDetail.js

const {wallet} = require("../../utils/api");
let { http } = require("../../utils/request");

let app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    detail: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.options = options
    this.getDtail(options.id)
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
  getDtail(id){
    http({
      api: wallet,
      path: 'elecInvoice/elecInvoiceInfor/' + id
    }).then(res => {
      let value = res.value
      this.setData({
        detail: Object.assign(value,{
          invoiceType: value.invoiceType == '0' ? '个人' : '企业',
          createTime: new Date(+value.createTime).Format(),
          time: new Date(+value.lastMotifyTime || +value.createTime).Format()})
      })
    })
  },
  seach: function(){
    app.navigateTo({
      url: '/wallet/invoiceOrderDetails/index?data=' + JSON.stringify(this.data.detail.elecOrderList)
    })
  },
  reopen: function(){
    let {id, email} = this.data.detail
    app.navigateTo({
      url: '/wallet/reopen/index?' +  `id=${id || this.options.id}&email=${email || ''}`
    })
  }
})