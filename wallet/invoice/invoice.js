// pages/invoice/invoice.js

let app = getApp();
Page({

 /**
   * 页面的初始数据
   */
  data: {
    list: [
      {name: '开具发票', route: '/wallet/appInvoice/appInvoice'},
      {name: '开票记录', route: '/wallet/invoiceList/invoiceList'}      
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