import Taro, { Component } from '@tarojs/taro'
import { View, CoverImage, CoverView, Text } from '@tarojs/components'
import TaroPromise from '@/utils/taroPamise'
import CompaniesMap from '@/components/map/index'

import './index.less'
import icoStart from '@/image/ico-start.png'
import iconSan from '@/image/iconsan.png'

import PROFILE from '@/api/profile'

const app = Taro.getApp()
export default class Index extends Component {
  config = {
    "navigationStyle": "custom",
    "usingComponents": {
      "nav-bar": "../../components/navbar/index"
    }
  }
  constructor () {
    super()
    this.state = {
      nvabarData: {
        showCapsule: 1, //是否显示左上角图标
        title: '', //导航栏 中间的标题
        i_back: false,
        i_center: true
      },
      latitude: '',
      longitude: '',
      markers: [], // 当前的站点
      starword: {
        isName: '12'
      }, // 当前上车站点
      iconbuuble: '拖动地图更换上车点'
    }
    this.globalData = {
      iconNumber: 0, // 进行
      starPoint: {}, // 当前上车定位
      log: '', // 移动后保存的位置
    }
  }
  componentWillMount(){ // onLaunch
    app.istoken().then(res => {
      if(res.type == 1) {}
    })
  }
  async componentDidMount(){ // onReder
    let self = this
    let sett = await TaroPromise.getSetting()
    if(!sett.authSetting['scope.userLocation']) {
      TaroPromise.authorize('scope.userLocation').then(() =>{ // 提前发起通知授权
        self.getLocation()
        }).catch(() => {
          Taro.showModal({
            title: '授权当前位置',
            content: '需要获取您的地理位置，请确认授权，否则地图功能将无法使用',
            success: function(modal){
              if(modal.confirm){
                Taro.openSetting({
                  success: function(data){
                    if (data.authSetting["scope.userLocation"]){
                      Taro.showToast({
                        title: '授权成功',
                        icon: 'success',
                        duration: 1500
                      })
                      self.getLocation()
                    } else {
                      Taro.showToast({
                        title: '授权失败',
                        icon: 'none',
                        duration: 1500
                      })
                    }
                  }
                })
              } else {
                Taro.showToast({
                  title: '授权失败',
                  icon: 'none',
                  duration: 1500
                })
              }
            }
          })
        })
    } else {
      self.getLocation()
    }
  }
  componentDidShow(){ // onshow
  }
  componentDidHide(){ // onhide
  }
  componentWillUnmount(){ // onUnload
  }

  regionchange = (e) => { // 当地图视野发生变化进行的操作
    const that = this
    console.log(this.globalData.iconNumber)
    if(e.type == 'begin' && e.causedBy == '' && this.globalData.iconNumber > 0) {
      this.setState({
        iconbuuble: '在此上车'
      })
    }
    if(e.type == 'end' && e.causedBy == 'drag') {
      that.mapCtxs.getCenterLocation({
        success: function(res) {
          let log = `${new Number(res.longitude).toFixed(8)},${new Number(res.latitude).toFixed(8)}`
          if(log == that.globalData.log) {return false};
          // 保存这次的记录位置比较值，当前的位置，更新页面提示语并进行更新站点。
          that.globalData.starPoint = res
          that.globalData.log = log
          that.globalData.iconNumber++
          that.setState({
            iconbuuble: '步行到此站点上车'
          })
          that.setPointLocation()
        },
        fail:function(){
          console.log('地理位置失败')
        }
      })
    }
  }

  moveToLocation = () => {
    this.globalData.iconNumber = 0
    this.getLocation()
  }

  onMyMap = (value) => {
    this.mapCtxs = value
  }

  render () {
    let {nvabarData, longitude, latitude, markers, starword, iconbuuble} = this.state
    return (
      <view>
        <nav-bar navbar-data={nvabarData}></nav-bar>
        <CompaniesMap
          onMyMap={this.onMyMap}
          longitude={longitude}
          latitude={latitude}
          markers={markers}
          onMoveToLocation={this.moveToLocation}
          onRegionchange={this.regionchange}
        >
          {starword.isName &&
            <CoverView className='text-font'>
              <CoverView
                className='text-bubble'
                style={{
                  width: iconbuuble.length + 'em'
                }}
              >
              {iconbuuble}
              </CoverView>
              <CoverImage src={iconSan} className='icon' />
            </CoverView>
          }
          {latitude && <CoverImage className='icon-start' src={icoStart} />}
        </CompaniesMap>
        <View className='address'>
          <View className='address-input address-start' onTap={this.startTap}>
            {starword.isName || <Text className='address-placeholder'>上车站点</Text>}
          </View>
          <View className='address-text'>
           {starword.isName && '已为您推荐最佳上车点'}
          </View>
          <View className='address-input address-end address-placeholder' onTap={this.endTap}>
            下车站点
          </View>
        </View>
      </view>
    )
  }

  setPointLocation = () => { // 或者周围的站点
    let starPoint =  this.globalData.starPoint;
    let location = `${starPoint.latitude},${starPoint.latitude}`;
    PROFILE.QueryAround(location).then(() => {

    })
  }

  getLocation = () => { // 获取当前位置
    const that = this
    TaroPromise.getLocation('gcj02').then(res => {
      that.globalData.starPoint = res
      that.setState({
        latitude: res.latitude,
        longitude: res.longitude
      })
      console.log('经纬度获取成功')
      that.setPointLocation()
    }).catch((error) => {
      Taro.showToast({
        title: '地理位置授权获取失败',
        icon: 'none'
      })
      console.log('error:'+ '经纬度获取失败', error)
    })
  }
}