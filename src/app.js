import '@tarojs/async-await'
import '@/utils/window'
import Taro, { Component } from '@tarojs/taro'

import TaroPromise from '@/utils/taroPamise'
import { set as setGlobalData, get as getGlobalData } from './utils/global_data'
import utils from '@/utils/util';
import Index from './pages/index'

import HTTP_API from './api/index'
import './app.less'
let mta = require('mta-wechat-analysis')
if(process.env.TARO_ENV === 'weapp'){

}
// 如果需要在 h5 环境中开启 React Devtools
// 取消以下注释：
// if (process.env.NODE_ENV !== 'production' && process.env.TARO_ENV === 'h5')  {
//   require('nerv-devtools')
// }

class App extends Component {

  config = {
    "pages": [
      "pages/index/index",
      "pages/login/index"
    ],
    "permission": {
      "scope.userLocation": {
        "desc": "你的地理位置将用于地图展示"
      }
    },
    "window": {
      "backgroundTextStyle": "dark",
      "navigationBarBackgroundColor": "#fff",
      "navigationBarTitleText": "WeChat",
      "navigationBarTextStyle": "black"
    },
    "networkTimeout": {
      "request": 30000
    },
    "sitemapLocation": "sitemap.json"
  }
  constructor(){
    super()
    this.globalData = {
      stemInfo: null,
      city:'',
      openID: '', // wx用户的唯一标识id
      basicInformationList: [],
      starPoint:{}, // 用户起点位置信息
      endPoint:{}, // 用户终点位置信息
      starword: {}, // 起点站点
      endword: {}, // 终点站点
      starMarkers:[], // 起点站点列表
      endMarkers:[], // 终点站点列表
    }
}

  componentDidMount (options) {
    mta.App.init({
      "appID":"500684671",
      "eventID":"500684681",
      "lauchOpts":options,
      "autoReport": true,
      "statParam": true,
      "ignoreParams": ["id","time"]
    });
    TaroPromise.getSystemInfo().then(res => { //获取设备的设备信息 brand 手机品牌 model 手机型号 version 微信版本)
      this.globalData.stemInfo = res
      console.log('locationEnabled', res)
    })
    let BoundingClientRect = Taro.getMenuButtonBoundingClientRect()
    setGlobalData('tabHeight', BoundingClientRect.height + BoundingClientRect.top + 10)
    console.log(this.getGlobalData('tabHeight'))
  }

  componentDidShow () {}

  componentDidHide () {}

  componentDidCatchError (e) {
    console.log('触发error', e)
  }

  setGlobalData = (key, value) =>{
    setGlobalData(key, value)
  }
  getGlobalData = (key) => {
    return getGlobalData(key)
  }

  event_mta = (value) => {
    mta.Event.stat("on_click",value)
  }


  // 在 App 类中的 render() 函数没有实际作用
  // 请勿修改此函数
  render () {
    return (
      <Index />
      )
    }
  istoken = () => {
    return new Promise((resolve) => { // type 1 获取token成功
      TaroPromise.login().then(wxCode => {
        let code = wxCode.code;
        let openID = this.globalData.openID
        if(openID) {
          HTTP_API.AUTH_Login(openID).then(res => {
            resolve(res.value ? {type: 1, value: res.value} : {type: 0})
          })
        } else {
          HTTP_API.PROFILE_OpenId(code).then(open => {
            this.globalData.openID = openID = open.value;
            HTTP_API.AUTH_Login(openID).then(res => {
              setGlobalData('TOKEN', res.value || null)
              resolve(res.value ? {type: 1, value: res.value} : {type: 0})
            })
          })
        }
      })
    })
  }

  BasicInformationList = () =>{
    let basicInList = this.globalData.basicInformationList;
    basicInList.length == 0 && HTTP_API.SHUTTLE_BasicInformation().then(res => {
        let list = res.basicInformationList
        try {
          this.globalData.basicInformationList = {
            police: list.filter(item => (item.dictType == 5))[0].basicTypeList[0].itemText,
            service: list.filter(item => (item.dictType == 6))[0].basicTypeList[0].itemText,
            city: list.filter(item => (item.dictType == 13))[0].basicTypeList[0].itemText,
            arrivalTime: list.filter(item => (item.dictType == 8))[0].basicTypeList[0].itemText,
            cancelCost: list.filter(item => (item.dictType == 24))[0].basicTypeList[0].itemText, // 取消的钱
            compensation: list.filter(item => (item.dictType == 28))[0].basicTypeList[0].itemText, // 补偿的钱
            noResTime: list.filter(item => (item.dictType == 27))[0].basicTypeList[0].itemText, // 无责取消时间
            cancelTime: list.filter(item => (item.dictType == 25))[0].basicTypeList[0].itemText, // 取消等待时间
            relief: list.filter(item => (item.dictType == 29))[0].basicTypeList[0].itemText,
            cancelReason: list.filter(item => (item.dictType == 34))[0].basicTypeList, // 取消原因
            satisfaction: list.filter(item => (item.dictType == 35))[0].basicTypeList, // 服务满意
            nosatisfaction: list.filter(item => (item.dictType == 36))[0].basicTypeList, // 服务不满意
          }
          this.globalData.city = this.globalData.basicInformationList.city  
        } catch (error) {
          console.log('基础表设置失败')
        }
    })
  }
  IsUser = (callback) => {
    const that = this;
    let user = getGlobalData('Userinfo');
    user ? function(){
      callback && callback(true)
    }() : TaroPromise.getStorage('Userinfo').then(res =>{
        that.globalData.userInfo = res.data;
        setGlobalData('Userinfo', res.data)
        callback && callback(true)
      }).catch(() =>{
        that.globalData.userInfo = null
        callback && callback(false)
      })
  }
  NavigateTo = ({url = '', params = {}}, redirectTo= false) =>{
    url += utils.paramStr(params)
    this.IsUser((res => {
      if(res){
        redirectTo ? Taro.redirectTo({
          url: url
        }) : Taro.navigateTo({
          url: url
        })
      } else {
        Taro.navigateTo({
          url: '/pages/login/index'
        })
      }
    }))
  }
}

Taro.render(<App />, document.getElementById('app'))
