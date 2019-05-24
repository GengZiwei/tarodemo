import Taro, { Component } from '@tarojs/taro'
import { View, Map, CoverImage, CoverView } from '@tarojs/components'
import TaroPromise from '@/utils/taroPamise'

import './index.less'
import icoStart from '@/image/ico-start.png'
import iconSan from '@/image/iconsan.png'


const app = Taro.getApp()
export default class Index extends Component {
  config = {
    navigationBarTitleText: '首页',
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
      latitude: '30.294427',
      longitude: '120.343369',
      markers: [], // 当前的站点
      starword: {
        isName: '12'
      }, // 当前上车站点
      iconbuuble: '拖动地图更换上车点'
    }
    this.globalData = {
      subkey: app.globalData.subkey,
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
  componentDidMount(){ // onReder
    this.mapCtxs = Taro.createMapContext('myMap');
    this.moveToLocation()
  }
  componentDidShow(){ // onshow
  }
  componentDidHide(){ // onhide
  }
  componentWillUnmount(){ // onUnload
  }

  regionchange = (e) => { // 当地图视野发生变化进行的操作
    const that = this
    console.log(e)
    if(e.type == 'begin' && e.causedBy == '' && this.globalData.iconNumber != 0) {
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

  getMarker = () =>{}

  bindupdated = () =>{}

  moveToLocation = () => {
    this.getLocation()
  }

  render () {
    let {nvabarData, subkey, longitude, latitude, markers, starword, iconbuuble} = this.state
    return (
      <View>
        <nav-bar navbar-data={nvabarData}></nav-bar>
        <View className='map'>
          <Map
            id='myMap'
            style='width: 100%;height: 100%'
            subkey={subkey}
            onRegionchange={this.regionchange}
            latitude={latitude}
            longitude={longitude}
            markers={markers}
            onMarkertap={this.getMarker}
            onUpdated={this.bindupdated}
            show-location
          >
          </Map>
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
        </View>
      </View>
    )
  }

  setPointLocation = () => { // 或者周围的站点
    let starPoint =  this.globalData.starPoint;
    let location = `${starPoint.latitude},${starPoint.latitude}`;
    console.log(location)
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
      TaroPromise.showToast({
        title: '地理位置授权获取失败',
        icon: 'none'
      })
      console.log('error:'+ '经纬度获取失败', error)
    })
  }
}