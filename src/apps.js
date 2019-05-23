import Taro, { Component } from '@tarojs/taro'
import Index from './pages/index'
// eslint-disable-next-line import/first
import '@tarojs/async-await'
import './utils/window'

import {passengerAccount, basicInformation, historyAddressService, profile, auth} from './utils/api'
import RequestHttp from './utils/request.js';
import utils from './utils/util';
import wechat from './utils/wechat.js';

import './app.less'

// 如果需要在 h5 环境中开启 React Devtools
// 取消以下注释：
// if (process.env.NODE_ENV !== 'production' && process.env.TARO_ENV === 'h5')  {
//   require('nerv-devtools')
// }

class App extends Component {

  config = {
    "pages": [
      "pages/index/index"
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
      subkey: 'SB2BZ-MIRKF-VZUJT-JDALZ-ZWY7H-RKBHX',
      stemInfo: null,
      city:'',
      openID: '',
      userInfo: null,
      basicInformationList: null,
      starPoint:{}, // 用户起点位置信息
      endPoint:{}, // 用户终点位置信息
      starword: {}, // 起点站点
      endword: {}, // 终点站点
      starMarkers:[], // 起点站点列表
      endMarkers:[], // 终点站点列表
    }
}

  componentDidMount () {
    Taro.getSystemInfo({ //获取设备的设备信息 brand 手机品牌 model 手机型号 version 微信版本
      success: (res) => {
        console.log(res)
        this.globalData.stemInfo = res
      }
    })
  }

  componentDidShow () {}

  componentDidHide () {}

  componentDidCatchError () {}

  // 在 App 类中的 render() 函数没有实际作用
  // 请勿修改此函数
  render () {
    return (
      <Index />
    )
  }
  savePoint = (type,point, url) => {
    // this.globalData.type = type;
    if(type == 'start'){
      this.globalData.starPoint = point
      Taro.reLaunch({
        url: url + '?type=' + type + "&city=" + this.globalData.city
      })
    }else{
      this.globalData.endPoint = point
      this.navigateTo({
        url: url + '?type=' + type + "&city=" + this.globalData.city
      })
    }
    RequestHttp.http({
      isloade: true,
      method: 'POST',
      api: historyAddressService,
      path: 'saveHistoryAddress',
      params: {
        "gps": point.location,
        "orderId": 0,
        "passengerId": this.globalData.userInfo && this.globalData.userInfo.id,
        "searchAdress": point.district,
        "searchName": point.keywords
      }
    })
  }
  // 获取周围站点信息(调用接口后用这个)
  getSiteAround = (pointType, keyWord,callback) => {
    RequestHttp.http({
      api: passengerAccount,
      isloade: true,
      path: 'queryAround',
      params: {
        vehicleGps: keyWord
      }
    }).then(res => {
      let that = this;
      let { gdReturnStationList } = res;
      let _pointMarker = keyWord;
      let _location = [];
      // 设置起始站点图标
      let markers = gdReturnStationList.map((item, key) => {
        return {
          id: key,
          width: 10,
          height: 10,
          zIndex: 2,
          typeID: item.id,
          isName: item.name,
          longitude: +(item.location.split(',')[0]),
          latitude: +(item.location.split(',')[1]),
          iconPath: "../../image/11.png"
        }
      })
      if(pointType == "start"){
        // 存储起始站点信息
        that.globalData.starword = markers[0];
        // 起点站点的list
        that.globalData.starMarkers = markers || []
      }else{
        // 存储终点站点信息
        that.globalData.endword = markers[0];
        // 终点站点的list
        that.globalData.endMarkers = markers || []
      }

      _location = markers[0] ? [
        markers[0].longitude,
        markers[0].latitude
      ] : _pointMarker.split(",");
      callback({
        latitude: _location[1],
        longitude: _location[0],
        markers: markers
      })
    }).catch(() => {
      callback({
        latitude: keyWord.split(",")[1],
        longitude: keyWord.split(',')[0],
        markers: []
      })
    })
  }

  istoken = async () => {
    try {
      let getsetting = await wechat.getSetting();
      if( !getsetting.authSetting['scope.userLocation']){
        return new Error('无授权')
      }
      let wxCode = await wechat.login();
      let code = wxCode.code;
      let openid = this.globalData.openID
      if(!openid) {
        let id = await RequestHttp.http({
          api: profile,
          path: 'passengerAccount/openId/' + code,
        })
        openid = id.value
        this.globalData.openID = id.value
      }
      let params = {
        'client_id': 'client_auth_mode',
        'grant_type': 'password',
        'redirect_uri': 'www.baidu.com',
        'response_type': 'code',
        'scope': 'read write',
        'state': Math.random().toString(36).substr(2),
        'username': openid,
        'password': openid
      }
      let token = await RequestHttp.http({
        api: auth,
        method: 'POST',
        path: 'authService/wxLogin',
        header: {
          ApplicationId: 'WX'
        },
        params: params
      })
      return new Promise((resolve) => {
        if(token.error){
          resolve({type: 0});
          Taro.clearStorage()
        } else {
          resolve( {type: 1, value: token.value})
        }
      })
    } catch (error) {
        return new Error('获取token出错')
    }
  }

  isUser = (callback) => {
    let user = this.globalData.userInfo;
    let that = this;
    if(user) {
      callback && callback(true)
    } else {
      wechat.getStorage('userInfo').then(res =>{
        that.globalData.userInfo = res.data;
        callback && callback(true)
      }).catch(() =>{
        that.globalData.userInfo = null
        callback && callback(false)
      })
    }
  }

  basicInformationList = () =>{
    !this.globalData.basicInformationList && RequestHttp.http({
        api: basicInformation,
        isloade: true,
        path: 'basicInformation',
        params: {
          typeList: '5,6,8,13,24,25,28,29,34,35,36,27'
        }
      }).then(res => {
        if(res.basicInformationList.length == 0) return false;
        try {
          this.globalData.basicInformationList = {
            police: res.basicInformationList.filter(item => (item.dictType == 5))[0].basicTypeList[0].itemText,
            service: res.basicInformationList.filter(item => (item.dictType == 6))[0].basicTypeList[0].itemText,
            city: res.basicInformationList.filter(item => (item.dictType == 13))[0].basicTypeList[0].itemText,
            arrivalTime: res.basicInformationList.filter(item => (item.dictType == 8))[0].basicTypeList[0].itemText,
            cancelCost: res.basicInformationList.filter(item => (item.dictType == 24))[0].basicTypeList[0].itemText, // 取消的钱
            compensation: res.basicInformationList.filter(item => (item.dictType == 28))[0].basicTypeList[0].itemText, // 补偿的钱
            noResTime: res.basicInformationList.filter(item => (item.dictType == 27))[0].basicTypeList[0].itemText, // 无责取消时间
            cancelTime: res.basicInformationList.filter(item => (item.dictType == 25))[0].basicTypeList[0].itemText, // 取消等待时间
            relief: res.basicInformationList.filter(item => (item.dictType == 29))[0].basicTypeList[0].itemText,
            cancelReason: res.basicInformationList.filter(item => (item.dictType == 34))[0].basicTypeList, // 取消原因
            satisfaction: res.basicInformationList.filter(item => (item.dictType == 35))[0].basicTypeList, // 服务满意
            nosatisfaction: res.basicInformationList.filter(item => (item.dictType == 36))[0].basicTypeList, // 服务不满意
          }
          this.globalData.city = this.globalData.basicInformationList.city  
        } catch (error) {
          console.log('基础表设置失败')
        }
    })
  }

  navigateTo = ({url = '', params = {}}, redirectTo= false) =>{
    let query = utils.paramStr(params)
    url += query
    this.basicInformationList()
    this.isUser((res => {
      if(res){
        redirectTo ? Taro.redirectTo({
          url: url
        }) : Taro.navigateTo({
          url: url
        })
      } else {
        Taro.navigateTo({
          url: '/pages/login/login'
        })
      }
    }))
  }
}

Taro.render(<App />, document.getElementById('app'))
