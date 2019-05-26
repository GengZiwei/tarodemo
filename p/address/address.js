const app= getApp();
let wechat = require("../../utils/wechat");
let {http} = require("../../utils/request")

const {route} = require("../../utils/api")
Page({
  data: {
    /* nvabarData: {
      showCapsule: 1, //是否显示左上角图标
      title: '常用地址', //导航栏 中间的标题
      i_back: true,
      i_center: false
    }, */
    array:[],
    width: 110,
    right: 0,
    height: app.globalData.height
  },
  onLoad(){
    let {homeAddress,company,userInfo} = app.globalData
    if((!homeAddress || !company) && userInfo) {
      http({
        api: route,
        path: 'passengerRS/getUsualAddressList/' + userInfo.id
      }).then(res => {
        let data = res.value
        let homeAddress = data.filter(home => home.type == '1');
        let company = data.filter(home => home.type == '0');

        homeAddress[0] && (app.globalData.homeAddress = {
          address: homeAddress[0].address,
          gps: homeAddress[0].gps
        });
        company[0] && (app.globalData.company = {
          address: company[0].address,
          gps: company[0].gps
        })

        wechat.setStorage('homeAddress', app.globalData.homeAddress)
        wechat.setStorage('company', app.globalData.company)
        this.setArr()
      })
    }
  },
  onShow:function(){
    this.setArr()
  },
  _showAddress(e){
    var {state, touch} = e.currentTarget.dataset
    if(touch) return false;
    app.navigateTo({
      url: '/pages/inputAddress/inputAddress?status=' + state,
    })
  },
  _showremove(e){
    var {state,value} = e.currentTarget.dataset
    let {userInfo} = app.globalData
    let arr = this.data.array
    if(!userInfo || !value) return false;
    wx.showToast({
      title: '删除中...',
      icon: 'loading',
      duration: 2000
    });
    http({
      api: route,
      method: "DELETE",
      path: 'passengerRS/deleteAddress/' + userInfo.id + '/' + state
    }).then(() =>{
      if(state == '1'){
        app.globalData.homeAddress = null
        wechat.removeStorage('homeAddress')
      } else {
        app.globalData.company = null
        wechat.removeStorage('company')
      }
      this.setArr()
      wx.showToast({
        title: '删除成功',
        duration: 1000
      });
    })
  },
  drawStart(e){
    var touch = e.touches[0]
    this.data.startX = touch.clientX
  },
  setArr(){
    this.setData({
      array: [
        {key: '家', value: app.globalData.homeAddress && app.globalData.homeAddress.address, class: 'listborder', plocathle: '设置家庭地址', src: '../../image/home.png', right: 0, state: '1', touch: false},
        {key: '公司', value: app.globalData.company && app.globalData.company.address, class: '', plocathle: '设置公司地址', src: '../../image/company.png', right: 0,state: '0', touch: false}
      ]
    })
  },
  drawMove(e){
    var index = e.currentTarget.dataset.index
    var data = this.data.array
    if(!data[index].value) {return false}
    var touch = e.touches[0]
    var disX = this.data.startX - touch.clientX
    if(disX >0 && disX < this.data.width && !data[index].touch ) { // 没删除时候
      data[index].right = disX
    }
    if(disX < 0 && disX > -this.data.width && data[index].touch){ // 有删除时候
      data[index].right = this.data.width + disX
    }
    this.setData({
      array: data
    })
  },
  drawEnd(e){
    var index = e.currentTarget.dataset.index
    var data = this.data.array
    if(Math.abs(data[index].right) < this.data.width / 2) {
      data[index].right = 0
      data[index].touch = false
    } else {
      data[index].right = this.data.width
      data[index].touch = true
    }
    this.setData({
      array: data
    })
  }
})