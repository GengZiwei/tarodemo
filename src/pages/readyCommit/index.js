// pages/readyCommit/index.js
let app = getApp();
let amap = require("../../utils/amap");
let utils = require('../../utils/util')
let preCheckNum = 0;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 组件所需的参数
    /* nvabarData: {
      showCapsule: 1, //是否显示左上角图标
      title: '确认站点', //导航栏 中间的标题
      i_back: true,
      i_center: false
    }, */
    callData:{
      bottom:"540rpx"
    },
    subkey: app.globalData.subkey,
    pickstart: [],
    picksend: [],
    isCall:false,
    isStart:false,
    // 此页面 页面内容距最顶部的距离
    height: app.globalData.height * 2 + 20,
    // 起始位置定位信息
    starPoint: {},
    // 终点位置定位信息
    endPoint: {},
    // 上车站点
    starword: {},
    // 下车站点
    endword: {},
    // 中心点坐标
    latitude: '',
    longitude: '',
    markers: [],
    includePoints: []
  },
  /**
 * 生命周期函数--监听页面初次渲染完成
 */
  onReady: function () {
    this.mapCtx = wx.createMapContext('myMap')
  },
  moveToLocation: function () {
    this.mapCtx.moveToLocation()
  },
  submitPath(){
    app.navigateTo({
      url: '/pages/navigation_ride/index',
    })
  },
  // 自定义下车位置信息
  changeEndtPoint() {
    let that = this;
    let _point = app.globalData.endPoint;
    // 获取地址描述
    // 获取当前位置信息
    that.data.endPoint = _point
    this.setData({
      latitude: _point.location.split(',')[1],
      longitude: _point.location.split(',')[0]
    })
    //获取周边站点
    app.getSiteAround("end", _point.location, that.getDate);
  },
  // 赋值下车信息 回调函数
  getDate(data) {
    let starword = app.globalData.starword;
    let starMarkers = [...app.globalData.starMarkers];
    !starword.label && (starword.label = {
      content: utils.strcharacter(this.data.starword.isName, 6),
      color: '#5db5a1',
      padding: 3,
      fontSize: 12,
      anchorX: 4,
      anchorY: -22
    })
    this.setData({
      picksend: data.markers,
      starword: starword,
      pickstart: starMarkers,
      includePoints: [{latitude: data.latitude, longitude: data.longitude}, starword],
      markers: data.markers.concat(Object.assign({},starword, {
        id: -1,
        iconPath: '/image/point_s.png',
        height: '38',
        width: '24'
      }))
    })
    if(data.markers[0]) {
      this.getMarker({ markerId: data.markers[0].id })
    } else {
      app.navigateTo({
        url: '/pages/range/index',
      })
    }
  },
  // 点击标记点
  getMarker(e) {
    let _mks = [...this.data.markers];
    let mId = e.markerId;
    if (mId < 0 || (e.details && mId==preCheckNum)) return false;
    app.globalData.endword = Object.assign({}, _mks[mId], {name: _mks[mId].isName});
    // 重绘地图标记
    _mks[preCheckNum].iconPath = "/image/11.png";
    _mks[preCheckNum].width = '10'
    _mks[preCheckNum].height = '10'
    _mks[preCheckNum].label && delete _mks[preCheckNum].label
    // 绘制当前选择的站点
    _mks[mId].iconPath = "/image/pick_e.png"
    _mks[mId].width = "24"
    _mks[mId].height = "40"
    _mks[mId].label = {
      content: utils.strcharacter(_mks[mId].isName, 6),
      color: '#5db5a1',
      padding: 3,
      fontSize: 12,
      anchorX: 4,
      anchorY: -22
    }
    this.setData({
      markers: _mks,
      includePoints: [app.globalData.endword, app.globalData.starword],
      endword: app.globalData.endword
    })
    preCheckNum = mId;

  },
  // 选择下车
  bindEndInput: function () {
    wx.navigateBack({delta:1})
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    app.watch(this);
    preCheckNum = 0
    this.changeEndtPoint();
  },
  bindPickerChange(e){
    let {pick} = e.currentTarget.dataset;
    let value = e.detail.value
    let markers = [...this.data.markers]
    if(pick) {
      let id = markers[+value].id;
      this.getMarker({markerId: id})
    } else {
      let starword =  this.data.pickstart[+value]
      app.globalData.starword = Object.assign({}, starword, {name: starword.isName})
      markers[this.data.markers.length - 1] = Object.assign({}, starword, {
        id: -1,
        iconPath:  '/image/point_s.png',
        height: '38',
        width: '24',
        label: {
          content: utils.strcharacter(starword.isName, 6),
          color: '#5db5a1',
          padding: 3,
          fontSize: 12,
          anchorX: 4,
          anchorY: -22
        }
      })
      this.setData({
        starword: app.globalData.starword,
        includePoints: [app.globalData.endword, starword],
        markers: markers
      })
      if(starword.typeID == app.globalData.endword.typeID){
        wx.showModal({
          showCancel: false,
          content: '站点选择不可一样'
        })
      }
    }
  },
  watch: {
    'endword': function(newVlue){
      if(newVlue.typeID == this.data.starword.typeID) {
        wx.showModal({
          showCancel: false,
          content: '站点选择不可一样'
        })
      }
    }
  }
})