//logs.js
let app = getApp();
let amap = require("../../utils/amap");
let watch = require("../../utils/wechat");
let {http} = require("../../utils/request");
let utils = require("../../utils/util");

const {route, historyAddressService} = require("../../utils/api")

Page({
  data: {
    /* nvabarData: {
      showCapsule: 1, //是否显示左上角图标
      title: '', //导航栏 中间的标题
      i_back: true,
      i_center: false
    }, */
    height: app.globalData.height,
    tips: []
  },
  onLoad(e) {
    let { status } = e;
    let { userInfo,starword,starPoint:lonlat } = app.globalData
    if(lonlat && !lonlat.longitude){
      lonlat = {
        longitude: lonlat.split(',')[0],
        latitude: lonlat.split(',')[1]
      }
    }
    this.data.status = status
    this.lonlat = lonlat
    http({
      api: historyAddressService,
      isloade: true,
      path: 'selectHistoryAddress/' + userInfo.id
    }).then(res => {
      let data = res.value.map(item => {
        let distance = utils.getDisance({
          lat1: starword ? starword.latitude : this.lonlat.latitude,
          lng1: starword ? starword.longitude : this.lonlat.longitude,
          lat2: item.gps.split(',')[1],
          lng2: item.gps.split(',')[0],
        })
        return {
          name: item.name,
          state: item.type,
          img: item.type == '1' ? '../../image/history.png' : '../../image/site.png',
          district: item.address || item.name,
          location: item.gps,
          distance: distance < 1000 ? distance.toFixed(1) + '米' : (distance / 1000).toFixed(1) + 'km'
        }
      })
      this.data.near = data
      this.setData({
        tips: data
      })
    })
  },
  bindInput(e) {
    if(this.debounce) {
      clearInterval(this.Timeout)
    }
    this.debounce = true
    this.Timeout = setTimeout(() => {
      let { value } = e.detail;
      if(!value) {
        this.setData({
          tips: this.data.near
        })
        return false
      }
      amap.getInputtips('', `${this.lonlat.longitude},${this.lonlat.latitude}`, value)
      .then(d => {
        if (d && d.tips) {
          let { starword } = app.globalData
          let list = d.tips.filter(item => {
            return item.location.length>0&&item.name.length>0
          })
          
          this.setData({
            tips: list.map(item => {
              let distance = utils.getDisance({
                lat1: starword ? starword.latitude : this.lonlat.latitude,
                lng1: starword ? starword.longitude : this.lonlat.longitude,
                lat2: item.location.split(',')[1],
                lng2: item.location.split(',')[0],
              })
              return Object.assign(item, {
                img: '../../image/text_address.png',
                distance: distance < 1000 ? distance.toFixed(1) + '米' : (distance / 1000).toFixed(1) + 'km'
              })
            })
          });
        }
      })
    }, 600);
  },
  
  bindSearch(e) {
    let data = e.currentTarget.dataset
    let userInfo = app.globalData.userInfo
    if(userInfo) {
      let keywords = data.keywords
      if(this.data.status == '1'){
        app.globalData.homeAddress = {
          address: keywords,
          gps: data.location
        }
        watch.setStorage('homeAddress', app.globalData.homeAddress)
      } else {
        app.globalData.company = {
          address: keywords,
          gps: data.location
        }
        watch.setStorage('company', app.globalData.company)
      }
      http({
        api: route,
        method: 'POST',
        isloade: true,
        path: 'passengerRS/savePassengerAddress',
        params: {
          "address": keywords,
          "gps": data.location,
          "passengerId": userInfo.id,
          "type": this.data.status
        }
      }).then(()=>{
        wx.showToast({
          title: '常用地址设置成功',
          duration: 1000,
          complete:()=>{
            setTimeout(() => {
              wx.navigateBack()
            }, 1000);
          }
        });
      })
    }
  }
});
