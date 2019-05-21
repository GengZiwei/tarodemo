// pages/login/login.js
let app = getApp();
let wechat = require("../../utils/wechat");
let RequestHttp = require("../../utils/request");
const {accountService, passengerAccount, profile, auth} = require('../../utils/api');
let interval;
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 组件所需的参数
    nvabarData: {
      showCapsule: 1, //是否显示左上角图标
      title: '', //导航栏 中间的标题
      i_back: true
    },
    codeSend:true,
    height: app.globalData.height,
    isDisabled:true,
    sendTime:60,
    mobile:"",
    code: ''
  },
  value: {
    promoter: {},
    userValue: null
  },
  // 输入电话号码
  getNumber(event) {
    console.log(event);
    this.setData({
      mobile: event.detail
    })
  },
  // 输入验证码
  getCodeNumber(event){
    this.setData({
      code: event.detail.value
    })
  },
  // 点击发送验证码
  sendCode() {
    let that = this;
    let {value: phone} = this.data.mobile;
    // let reg = /^1(3|4|5|7|8)\d{9}$/.test(+phone)
    // 判断手机号码是否填写
    if (phone && phone.length != 11){
      wx.showModal({
        title: '',
        showCancel: false,
        content: '请正确填写手机号'
      });
      return false;
    }
    // 登陆按钮状态可点击
    if(this.data.codeSend){
      RequestHttp.http({
        api: auth,
        path: `authService/obtainSMSCode?phoneNumber=${phone}&requestType=1&accountStatus=1`
      }).then(res => {
        this.setData({
          codeSend:false,
          isDisabled: false
        });
        // 60秒倒数计时
        interval = setInterval(function(){
          let times = that.data.sendTime-1;
          that.setData({
            sendTime: times
          })
          if(times<1){
            that.setData({
              codeSend: true,
              sendTime: 60
            })
            clearInterval(interval);
          }
        },1000);
      }).catch(error =>{
      })
    }
  },
  // 登陆注册
  submit(e) {
    const that = this
    let name = e._relatedInfo.anchorTargetText;
    let {value: phone} = that.data.mobile;
    let smsCode = this.data.code
    if(smsCode.length <4) return false;
    that.login(phone, name, this.value.openId)
  },
  // 注册接口
  login(phoneNumber,name = '未获取', openId){
    let that = this
    RequestHttp.http({
      method: 'POST',
      api: passengerAccount,
      path: 'passenger',
      params: {
        phoneNumber,
        code: this.data.code,
        recommendCode: this.value.promoter.value,
        recommendType: this.value.promoter.code,
        employeeId: openId,
        name: name
      }
    })
    .then(res => {
      if(!!res.error) return false;
      that.setTokenHeader(openId, {
        name: name,
        id: res.id,
        phone: phoneNumber,
        openId,
      })
    })
    .catch(error => {
      console.log(error)
    })

  },
  // 设置用户的token值保存，并跳转页面
  setToken(userInfo){
    app.globalData.userInfo = userInfo
    wechat.setStorage('userInfo', userInfo)
    .then(res => {
      console.log('保存用户信息', res)
      const url = '/pages/index/index'
      wx.redirectTo({url})
    })
  },
  setTokenHeader(openid, userInfo){
    let that = this
    RequestHttp.http({
      api: auth,
      method: 'POST',
      path: 'authService/wxLogin',
      header: {
        ApplicationId: 'WX'
      },
      params: {
        'client_id': 'client_auth_mode',
        'grant_type': 'password',
        'redirect_uri': 'www.baidu.com',
        'response_type': 'code',
        'scope': 'read write',
        'state': Math.random().toString(36).substr(2),
        'username': openid,
        'password': openid
      }
    }).then(res =>{
      wechat.removeStorage('refToken')
      userInfo.token = res.value;
      wechat.setStorage('token', res.value).then(res => {
        that.setToken(userInfo)
      }).catch(() => {
        console.log('保存用户token失败')
      })
    })
  },
  /**
   * 生命周期函数--监听页面加载
   * 权限失败
   * 重新登陆
   * 新用户
   */
  onLoad: function (options) {
    wechat.getStorage('promoter').then(res =>{
      this.value.promoter = res.data
    }).catch(()=>{
      console.log('无法查询推广码')
    })
    if(app.globalData.openID){
      this.value.openId = app.globalData.openID
    } else {
      wechat.login().then(res => {
        let code = res.code
        RequestHttp.http({
          api: profile,
          path: `passengerAccount/openId/${code}`
        }).then(res => {
          this.value.openId = res.value
        })
      })
    }
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

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    clearInterval(interval)
    interval = ''
  }
})