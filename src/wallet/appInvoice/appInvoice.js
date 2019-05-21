// wallet/appInvoice/appInvoice.js
let wxchat = require('../../utils/wechat');
let { http } = require("../../utils/request");

const app = getApp();
const {wallet} = require("../../utils/api");
const pullDow = require('../../utils/pullDownRefresh');

Page( Object.assign({},pullDow,{
  /**
   * 页面的初始数据
   */
  data: {
    tableList: [],
    invoice: '1',
    number: 0,
    money: 0,
    filter: []
  },
  onLoad:function(){
    wxchat.removeStorage('purchaser').catch(() =>{})
    wxchat.removeStorage('orderIdList').catch(() =>{})
  },
  getList({pageSize = 10, pageNumber, refresh = false}){
    http({
      api: wallet,
      path: 'orderwxPay/validElecInvoice',
      params: {
        passengerId: app.globalData.userInfo.id,
        pageSize: pageSize,
        pageNumber: pageNumber
      }
    }).then(res => {
      let tableList = [...this.data.tableList];
      let {elecOrderList, totalPage} = res.value;
      this.totalPage = totalPage;
      this.data.pageNumber = pageNumber;
      if(refresh) {
        wx.stopPullDownRefresh()
        this.setData({
          invoice: elecOrderList.length > 0 ? '1' : '0'
        })
      }
      this.setData({
        seleDetermine: false,
        number: 0,
        money: 0,
        tableList: tableList.concat(elecOrderList.map(order => {
          return Object.assign(order,{
            time: new Date(+order.orderTime).Format()
          })
        }))
      })
    }).catch(error => {
      wx.stopPullDownRefresh()
    })
  },
  seleTab(){
    let seleDetermine = this.data.seleDetermine;
    if(!seleDetermine){
      this.data.tableList = this.data.tableList.map(val =>{
        return Object.assign(val,{
          tab: true
        })
      })
      this.data.filter = this.data.tableList
    }
    this.setData({
      tableList: this.data.filter,
      seleDetermine: !seleDetermine,
      number: this.data.filter.length,
      money: this.data.filter.reduce((sauce,item) => {
        let price = +sauce + (+item.price || 0)
        return new Number(price).toFixed(2)
      }, 0)
    })
  },
  tabStroke(e){
    let {index} = e.currentTarget.dataset;
    let data = [...this.data.tableList];
    data[index].tab = !data[index].tab
    // 计算点击行程选择数量跟价格
    let filter = data.filter(res => {
      return res.tab
    })
    this.data.filter = filter
    this.setData({
      tableList: data,
      seleDetermine: this.data.filter.length == data.length,
      number: filter.length,
      money: filter.reduce((sauce,item) => {
        let price = +sauce + (+item.price || 0)
        return new Number(price).toFixed(2)
      }, 0)
    })
  },
  tabSub(){ // 确定按钮
    if(this.data.number > 0) {
      let list = this.data.filter.map(res => {
        return res.id
      })
      app.navigateTo({
        url: '/wallet/setInvoice/setInvoice?money=' + this.data.money
      })
      wxchat.setStorage('orderIdList', list).then(() =>{
        console.log('设置list成功')
      })
    }
  }
}))