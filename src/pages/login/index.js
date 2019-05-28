import Taro , { Component } from '@tarojs/taro';
import { View, Form, Input,Text, OpenData } from '@tarojs/components';

import './index.less'

export default class Index extends Component {

   config = {
    navigationBarTitleText: '登陆'
  }

  constructor(){
    super()
    this.state = {
      codeSend: true, // 要发送验证码
      sendTime: ''
    }
    this.globalData = {
      userLogin: {
        phone: '',
        code: ''
      }
    }
  }

  componentWillMount () {}
  componentDidMount () {}
  componentWillUnmount () {} 
  componentDidShow () {} 
  componentDidHide () {} 
  componentDidCatchError () {} 
  componentDidNotFound () {}

  SetNumber = (e) => {
    let type = e.target.dataset.type
    let value = e.detail.value
    type == 'phone' ? this.globalData.userLogin.phone = value : this.globalData.userLogin.code = value
  }
  SendCode = () => {

  }
  Login = () => {
    app.event_mta({
      register: 'true'
    })
  }
  Protocol = () => {}
  render() {
    let { codeSend, sendTime } = this.state
    return (
      <View>
        <View class="loginTitlle">登录/注册</View>
        <View class='loginForm'>
          <Form>
            <View class="loginText">
              <Input
                placeholder-class='placeText'
                data-type='phone'
                maxlength="11"
                focus={true}
                onInput={this.SetNumber}
                placeholder='请输入您的手机号'
                type="number"
              />
            </View>
            <View class="loginText">
              <Input
                placeholder-class='placeText'
                data-type='code'
                placeholder='请输入验证码'
                type="number"
                maxlength='4'
                onInput={this.SetNumber}
              />
              {codeSend ? <Text onTap={this.SendCode}>发送验证码</Text> : <View class="reSend">{sendTime}秒后重新发送</View>}
            </View> 
            <View onTap={this.Login} lang="zh_CN" class="btn-submit">
              <OpenData id="name" type="userNickName" lang="zh_CN" class="userNickName">123</OpenData>
            </View>
            <View class="subText">点击登录即表示您已阅读并同意<text onTap={this.Protocol}>用户协议</text></View>
          </Form>
        </View>
      </View>
    );
  }
}