import Taro, { Component } from '@tarojs/taro';
import { View, Map, CoverImage } from '@tarojs/components';

import './index.less'
import iconReset from '@/image/ico-reset.png'

const app = Taro.getApp()

export default class Index extends Component {

  static defaultProps = {
    polyline: [],
    markers: [],
    longitude: '',
    latitude: '',
    onRegionchange: () => null, // 视野发生变化
    onMoveToLocation: () => null, // 移动地图到当前定位点
  }

  state = {
    height: ''
  }

  componentWillMount () {
    this.setState({
      height: app.getGlobalData('tabHeight')
    })
    this.mapCtxs = Taro.createMapContext('myMap', this.$scope);
    this.props.onMyMap(this.mapCtxs)
  }

  Regionchange = (e) => {
    this.props.onRegionchange(e)
  }

  moveToLocation = () => {
    this.mapCtxs.moveToLocation()
    this.props.onMoveToLocation()
  }

  render() {
    let { polyline, markers, longitude, latitude } = this.props
    return (
      <View className='map' style={{
        top: this.state.height + 'px'
      }}>
      <Map
        id='myMap'
        subkey='SB2BZ-MIRKF-VZUJT-JDALZ-ZWY7H-RKBHX'
        polyline={polyline}
        markers={markers}
        longitude={longitude}
        latitude={latitude}
        onRegionchange={this.Regionchange}
        style='width: 100%;height: 100%'
        show-location
      />
      <CoverImage className='reset' onTap={this.moveToLocation} src={iconReset} />
      {this.props.children}
      </View>
    );
  }
}