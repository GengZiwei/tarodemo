// wallet/setInvoice/setInvoice.js
let app = getApp();
const {wallet} = require("../../utils/api");
let { http } = require("../../utils/request");
let wxchat = require('../../utils/wechat');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    headerTap: true,
    electronicSwitchImg: true,
    paperSwitchImg: true,
    current: 0,
    setinvioce: {},
    electronicPersonal: [
      {text: '发票抬头', value: 'invoiceTitle', placeholder:'请填写发票抬头'},
      {text: '发票内容', value: 'invoiceContent',title: true, placeholder:'客运服务费'},
      {text: '发票金额', value: '', title: true, placeholder: ''},
      {text: '购买方信息', value: '',title: true, arrow: true, placeholder:''},
      {text: '电子邮箱', value: 'email', placeholder:'请填写电子邮箱地址'},
      {text: '联系电话', value: 'phoneNumber', placeholder:'请填写常用电话'}
    ],
    electronicPersonalDate: {
      invoiceTitle: '',
      invoiceContent: '客运服务费',
      email: '',
      phoneNumber: ''
    },
    electronicEnterprise: [
      {text: '发票抬头', value: 'invoiceTitle', placeholder:'请填写发票抬头'},
      {text: '纳税人识别号', value: 'buyerTaxNo', placeholder:'请填写纳税人识别号'},
      {text: '发票内容', value: 'invoiceContent', title: true, placeholder:'客运服务费'},
      {text: '发票金额', value: '', title: true, placeholder:''},
      {text: '购买方信息', value: '',title:true, arrow: true, placeholder:''},
      {text: '电子邮箱', value: 'email', placeholder:'请填写邮件地址'},
      {text: '联系电话', value: 'phoneNumber', placeholder:'请填写常用电话'}
    ],
    electronicEnterpriseDate:{
      invoiceContent: '客运服务费'
    },
    /* paperPersonal:[
      {text: '发票抬头', value: 'look', placeholder:'请填写发票抬头'},
      {text: '发票内容', value: 'look', placeholder:'请填写发票内容'},
      {text: '购买方信息', value: 'look', placeholder:'（选填）'},
      {text: '收件人', value: 'look', placeholder:'速递联系人'},
      {text: '联系电话', value: 'look', placeholder:'请填写常用电话'},
      {text: '所在地区', value: 'look', placeholder:'请填写所在地区'},
      {text: '详细地址', value: 'look', placeholder:'请填写详细地址'},
      {text: '邮编', value: 'look', placeholder:'请填写邮编'}
    ],
    paperPersonalDate: {},
    paperEnterprise:[
      {text: '发票抬头', value: 'look', placeholder:'请填写发票抬头'},
      {text: '发纳税人识别号', value: 'look', placeholder:'请填写纳税人识别号（选填）'},
      {text: '发票内容', value: 'look', placeholder:'请填写发票内容'},
      {text: '购买方信息', value: 'look', placeholder:'（选填）'},
      {text: '收件人', value: 'look', placeholder:'速递联系人'},
      {text: '联系电话', value: 'look', placeholder:'请填写常用电话'},
      {text: '所在地区', value: 'look', placeholder:'请填写所在地区'},
      {text: '详细地址', value: 'look', placeholder:'请填写详细地址'},
      {text: '邮编', value: 'look', placeholder:'请填写邮编'}
    ],
    paperEnterpriseDate:{} */
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.options = options
    let money = (options.money || 0) + '元'
    this.setData({
      'electronicPersonal[2].placeholder': money,
      'electronicEnterprise[3].placeholder' : money
    })
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
    wxchat.getStorage('purchaser').then(res =>{
      this.data.setinvioce = Object.assign({},this.data.setinvioce,res.data)
    }).catch(()=>{})
    wxchat.getStorage('orderIdList').then(res =>{
      this.data.setinvioce.orderIdList = res.data
    }).catch(()=>{})
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
    wxchat.removeStorage('purchaser').catch(() =>{})
    wxchat.removeStorage('orderIdList').catch(() =>{})
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  /* html的方法 */
  showToast(title){
    wx.showToast({
      title,
      icon: 'none',
      duration: 1500
    })
  },
  submit(){
    let {electronicPersonalDate, electronicEnterpriseDate,setinvioce} = this.data
    if(this.data.electronicSwitchImg){ // 个人
      if(!electronicPersonalDate.invoiceTitle) return this.showToast('请填写发票抬头')
      if(!electronicPersonalDate.email) return this.showToast('请填写电子邮箱')
      if(!electronicPersonalDate.phoneNumber) return this.showToast('请填写联系手机号')
      let data =  {
        partyId: app.globalData.userInfo.id,
        invoiceType: "0"
      }
      this.requestHttp( Object.assign(
        electronicPersonalDate,
        setinvioce,
        data
      ))
    } else {
      if(!electronicEnterpriseDate.invoiceTitle) return this.showToast('请填写发票抬头')
      if(!electronicEnterpriseDate.buyerTaxNo) return this.showToast('请填写纳税人识别号')
      if(!electronicEnterpriseDate.email) return this.showToast('请填写电子邮箱')
      if(!electronicEnterpriseDate.phoneNumber) return this.showToast('请填写联系手机号')
      if(!setinvioce.registAddress) return this.showToast('请填写注册地址')
      if(!setinvioce.registPhone) return this.showToast('请填写注册电话')
      if(!setinvioce.openBank) return this.showToast('请填写注册开户银行')
      if(!setinvioce.bankAccount) return this.showToast('请填写银行账号')
      let data =  {
        partyId: app.globalData.userInfo.id,
        invoiceType: "1"
      }
      debugger;
      this.requestHttp(Object.assign(
        electronicEnterpriseDate,
        setinvioce,
        data
      ))
    }
  },
  requestHttp(value){
    http({
      method: 'POST',
      api: wallet,
      path: 'elecInvoice/elecInvoice',
      params: value
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
    })
  },
  setHeaderTap(e){ // 根据html data值进行改变页面显示
    let { tap } = e.currentTarget.dataset
    this.setData({
      headerTap: tap,
      current: tap ? 0 : 1
    })
  },
  swiperChang(e){
    let {current} = e.detail;
    this.setData({
      headerTap: current == 0
    })
  },
  bindblur(e) {
    let { value, data } = e.currentTarget.dataset
    this.data[value][data] = e.detail.value
  },
  electronicSwitch(e) {
    let {switchdata} = e.currentTarget.dataset
    this.setData({
      electronicSwitchImg: switchdata
    })
  },
  paperSwitch(e){
    let {switchdata} = e.currentTarget.dataset
    this.setData({
      paperSwitchImg: switchdata
    })
  },
  purchaser(e){
    app.navigateTo({
      url: '/wallet/purchaser/purchaser?purchaser=' + (this.data.electronicSwitchImg ? '1' : '0')
    })
  }
})