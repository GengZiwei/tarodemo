const app = getApp();
const util = require('../../utils/util.js');
let { http } = require("../../utils/request");
const {wallet} = require("../../utils/api");

const pullDow = require('../../utils/pullDownRefresh')

Page(Object.assign({},pullDow,{
  /**
   * 页面的初始数据
   */
  data: {
    invoice: -1,
    pageNumber: 1,
    height: app.globalData.height,
    tableList:[]
  },
  getList({pageSize = 10, pageNumber, refresh= false}){
    http({
      api: wallet,
      path: 'elecInvoice/validElecInvoiceList',
      params: {
        partyId: app.globalData.userInfo.id,
        pageSize: pageSize,
        pageNumber: pageNumber
      }
    }).then(res => {
      if(!!res.err) return false
      let {elecInvoValue, totalPage} = res.value
      this.totalPage = totalPage
      this.data.pageNumber = pageNumber
      if(refresh) {
        wx.stopPullDownRefresh()
        this.setData({
          invoice: elecInvoValue.length > 0 ? '1' : '0'
        })
      }
      this.setData({
        tableList: this.data.tableList.concat(elecInvoValue.map(elecinvo => {
          return Object.assign(elecinvo,{time: util.formatTime(new Date(+elecinvo.createTime))})
        }))
      })
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  },
  // 前往详情
  bindDetail(e){
    let {id} = e.currentTarget.dataset
    app.navigateTo({
      url: '/wallet/invoiceDetail/invoiceDetail?id=' + id
    })
  }
}))