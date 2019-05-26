//logs.js
let app = getApp();
let amap = require("../../utils/amap");
let utils = require("../../utils/util");

let {http} = require("../../utils/request");
const {route, historyAddressService, nearbyPoiService} = require("../../utils/api")
Page({
  data: {
    height: app.globalData.height,
    homeAddress: {},
    company: {},
    tips: [], // 高德搜索地址
    addressSeach:[], // api查询地址
    value: '',
    seach: false,
  },
  onLoad(e) {
    let { type } = e;
    let {homeAddress,company,userInfo, starPoint:lonlat, starword} = app.globalData
    if(lonlat && !lonlat.longitude){
      lonlat = {
        longitude: lonlat.split(',')[0],
        latitude: lonlat.split(',')[1]
      }
    }
    this.lonlat = lonlat
    this.data.type = type
    if(type == "start"){
      this.data.goUrl = '/pages/index/index'
      http({
        api: nearbyPoiService,
        isloade: true,
        path: 'getNearbyPoi',
        params: {
          gps: `${lonlat.longitude},${lonlat.latitude}`
        }
      }).then(res => {
        let data = res.value.filter(fit => fit.name && fit.pName && fit.adName && fit.address).map(item => {
          let distance = item.distance
          return {
            name: item.name,
            img: '../../image/text_address.png',
            district: item.pName + item.adName + item.address,
            location: item.location,
            distance: distance < 1000 ? distance.toFixed(1) + '米' : (distance / 1000).toFixed(1) + 'km'
          }
        })
        this.data.near = data // 保存搜索的po
        this.setData({
          tips: data
        })
      })
    }else{
      this.data.goUrl = '/pages/readyCommit/index'
      if((!homeAddress || !company) && userInfo) {
        http({
          api: route,
          isloade: true,
          path: 'passengerRS/getUsualAddressList/' + userInfo.id
        }).then(res => {
          let data = res.value
          let homeAdd = data.filter(home => home.type == '1');
          let companyadd = data.filter(home => home.type == '0');
          homeAdd[0] && this.setData({
            homeAddress: homeAdd[0]
          })
          companyadd[0] && this.setData({
            company: companyadd[0]
          })
        })
      }
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
          seach: true,
          tips: data,
        })
      })
    }

  },
  onShow(){
    let {homeAddress,company} = app.globalData
    homeAddress && this.setData({
      homeAddress: homeAddress
    })
    company && this.setData({
      company: company
    })
  },
  bindInput(e) {
    if(this.debounce) {
      clearInterval(this.Timeout)
    }
    this.debounce = true
    this.Timeout = setTimeout(() => {
      let { value } = e.detail;
      let {city, starword} = app.globalData;
      if(!value) {
        this.setData({
          tips: this.data.near,
          seach: this.data.type != 'start' &&  true
        })
        return false
      }
      amap.getInputtips(city, `${this.lonlat.longitude},${this.lonlat.latitude}`, value)
      .then(d => {
        if (d && d.tips) {
          let list = d.tips.filter(item => {
            return item.location.length>0&&item.name.length>0
          })
          this.setData({
            seach: false,
            tips: utils.bubbleSort(list.map(item => {
              let distance = utils.getDisance({
                lat1: starword ? starword.latitude : this.lonlat.latitude,
                lng1: starword ? starword.longitude : this.lonlat.longitude,
                lat2: item.location.split(',')[1],
                lng2: item.location.split(',')[0],
              })
              return Object.assign(item, {
                img: '../../image/text_address.png',
                sortValue: distance,
                distance: distance < 1000 ? distance.toFixed(1) + '米' : (distance / 1000).toFixed(1) + 'km'
              })
            }))
          });
        }
      })
    }, 600);
  },
  
  bindSearch(e) {
    // 用户位置信息
    let points = e.currentTarget.dataset;
    let {type, goUrl} = this.data;
    // 存储上车/终点信息
    app.savePoint(type, points, goUrl);
  },
  remove(){
    this.setData({
      tips: this.data.near,
      seach: this.data.type != 'start' &&  true,
      value: ''
    })
  },
  showAddress(e){
    let { start } = e.currentTarget.dataset
    let {homeAddress,company} = this.data
    if((start == '1' && homeAddress.address) || (start == '0' && company.address)) {
      let points = e.currentTarget.dataset;
      let {type, goUrl} = this.data;
      // 存储上车/下车信息
      app.savePoint(type, points, goUrl);
      return false
    }
    app.navigateTo({
      url: '/pages/inputAddress/inputAddress?status=' + start,
    })
  }
});
