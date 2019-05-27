import Taro , { Component } from '@tarojs/taro';
import { View} from '@tarojs/components';

export default class Index extends Component {

   config = {
    navigationBarTitleText: '登陆/注册'
  }

  componentWillMount () {}
  componentDidMount () {}
  componentWillUnmount () {} 
  componentDidShow () {} 
  componentDidHide () {} 
  componentDidCatchError () {} 
  componentDidNotFound () {} 
  render() {
    return (
      <View>
        进行注册
      </View>
    );
  }
}