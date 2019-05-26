/*
 * @Author: setAnt 
 * @Date: 2019-05-26 11:36:42 
 * @Last Modified by: setAnt
 * @Last Modified time: 2019-05-26 11:39:00
 */

import wechat from "./taroPamise";
import websocketAPI from "./api";
import Taro from '@tarojs/taro'

// eslint-disable-next-line no-undef
let app = Taro.getApp();

// 是否进行一次refToken
let refToken = false
// socket已经连接成功
var socketOpen = false
// socket已经调用关闭function
var socketClose = false
// socket发送的消息队列
var socketMsgQueue = []
// 判断心跳变量
var heart = ''
// 心跳失败次数
var heartBeatFailCount = 0
// 终止心跳
var heartBeatTimeOut = null;
// 终止重新连接
var connectSocketTimeOut = null;
var webSocket = {
 
  /**
   * 创建一个 WebSocket 连接
   * @param {options} 
   *   url          String    是    开发者服务器接口地址，必须是 wss 协议，且域名必须是后台配置的合法域名
   *   header        Object    否    HTTP Header , header 中不能设置 Referer
   *   method        String    否    默认是GET，有效值：OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
   *   protocols    StringArray    否    子协议数组    1.4.0
   *   success      Function    否    接口调用成功的回调函数
   *   fail         Function    否    接口调用失败的回调函数
   *   complete      Function    否    接口调用结束的回调函数（调用成功、失败都会执行）
   */
  connectSocket: async function(options = {}) {
    let token = await wechat.getStorage('token');
    try {
      const str = token.data.tokenType.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
      let id = app.globalData.userInfo.id
      Taro.showLoading({
        title: '',
        mask: true,
      })
      socketOpen = false
      socketClose = false
      socketMsgQueue = []
      Taro.connectSocket(Object.assign({
        url: websocketAPI.websocket + id,
        tcpNoDelay: true,
        header: {
          Authorization: str + ' ' + token.data.accessToken,
          operateAccountId: token.data.accountId,
          ApplicationId: 'PASSENGER',
        },
        fail: function(e){
          console.log('错误信息',e)
        }
      },options))
    } catch (error) {
      console.log(error)
      Taro.navigateTo({
        url: '/pages/login/login'
      })
    }
  },
 
  /**
   * 通过 WebSocket 连接发送数据
   * @param {options} 
   *   data    String / ArrayBuffer    是    需要发送的内容
   *   success    Function    否    接口调用成功的回调函数
   *   fail    Function    否    接口调用失败的回调函数
   *   complete    Function    否    接口调用结束的回调函数（调用成功、失败都会执行）
   */
  sendSocketMessage: function(options) {
    if (socketOpen) {
      Taro.sendSocketMessage({
        data: options.msg,
        success: function(res) {
          if (options) {
            options.success && options.success(res);
          }
        },
        fail: function(res) {
          if (options) {
            options.fail && options.fail(res);
          }
        }
      })
    } else {
      socketMsgQueue.push(options.msg)
    }
  },
 
  /**
   * 关闭 WebSocket 连接。
   * @param {options} 
   *   code    Number    否    一个数字值表示关闭连接的状态号，表示连接被关闭的原因。如果这个参数没有被指定，默认的取值是1000 （表示正常连接关闭）
   *   reason    String    否    一个可读的字符串，表示连接被关闭的原因。这个字符串必须是不长于123字节的UTF-8 文本（不是字符）
   *   fail    Function    否    接口调用失败的回调函数
   *   complete    Function    否    接口调用结束的回调函数（调用成功、失败都会执行）
   */
  closeSocket: function(options) {
    if (connectSocketTimeOut) {
      clearTimeout(connectSocketTimeOut);
      connectSocketTimeOut = null;
    }
    socketClose = true;
    var self = this;
    self.stopHeartBeat();
    socketOpen && Taro.closeSocket({
      success: function(res) {
        console.log('WebSocket 已关闭！', new Date((new Date().getTime())).Format('yyyy-MM-dd hh:mm:ss.S'), res);
        if (options) {
          options.success && options.success(res);
        }
      },
      fail: function(res) {
        if (options) {
          options.fail && options.fail(res);
        }
      }
    })
  },
 
  // 收到消息回调
  onSocketMessageCallback: function() {
 
  },
 
  // 开始心跳
  startHeartBeat: function() {
    console.log('socket开始心跳')
    var self = this;
    heart = 'heart';
    self.heartBeat();
  },
 
  // 结束心跳
  stopHeartBeat: function() {
    console.log('socket结束心跳')
    heart = '';
    if (heartBeatTimeOut) {
      clearTimeout(heartBeatTimeOut);
      heartBeatTimeOut = null;
    }
    if (connectSocketTimeOut) {
      clearTimeout(connectSocketTimeOut);
      connectSocketTimeOut = null;
    }
  },
 
  // 心跳
  heartBeat: function() {
    var self = this;
    if (!heart) {
      return;
    }
    self.sendSocketMessage({
      msg: 'ping',
      success: function() {
        if (heart) { // socket心跳成功
          heartBeatTimeOut = setTimeout(() => {
            self.heartBeat();
          }, 1000 * 20);
        }
      },
      fail: function() {
        console.log('socket心跳失败');
        if (heartBeatFailCount > 2) {
          // 重连
          self.connectSocket();
        }
        if (heart) {
          heartBeatTimeOut = setTimeout(() => {
            self.heartBeat();
          }, 1000 * 20);
        }
        heartBeatFailCount++;
      },
    });
  }
}
 
// 监听WebSocket连接打开事件。callback 回调函数
Taro.onSocketOpen(function() {
  console.log('WebSocket连接已打开！', new Date((new Date().getTime())).Format('yyyy-MM-dd hh:mm:ss.S'))
  Taro.hideLoading();
  // 如果已经调用过关闭function
  if (socketClose) {
    webSocket.closeSocket();
  } else {
    socketOpen = true
    for (var i = 0; i < socketMsgQueue.length; i++) {
      webSocket.sendSocketMessage(socketMsgQueue[i])
    }
    socketMsgQueue = []
    webSocket.startHeartBeat();
  }
})
 
// 监听WebSocket错误。
Taro.onSocketError(function(res) {
  Taro.hideLoading();
  console.log('WebSocket连接打开失败，请检查！', new Date((new Date().getTime())).Format('yyyy-MM-dd hh:mm:ss.S'), res)
  if(res.errMsg == '未完成的操作'){
    if(refToken) {
      Taro.navigateTo({
        url: '/pages/login/login'
      })
      return false
    }
    refToken = true
    app.istoken().then(token => {
      if(token.type == 1){
        wechat.setStorage('token', token.value).then(() => {
          webSocket.connectSocket()
        }).catch(() => {
          return new Error() 
        })
      }
    }).catch(() => {
      Taro.navigateTo({
        url: '/pages/login/login'
      })
    })
  }
})
 
// 监听WebSocket接受到服务器的消息事件。
Taro.onSocketMessage(function(res) {
  let data = JSON.parse(res.data)
  if(data.type != "ping"){
    console.log('收到服务器内容：', data)
    webSocket.onSocketMessageCallback(res.data)
  }
})
 
// 监听WebSocket关闭。
Taro.onSocketClose(function(res) {
  console.log('WebSocket 监听真正已关闭！', new Date((new Date().getTime())).Format('yyyy-MM-dd hh:mm:ss.S'), res)
  if (socketOpen && !socketClose) {
    clearTimeout(connectSocketTimeOut)
    connectSocketTimeOut = setTimeout(() => {
      webSocket.connectSocket();
    }, 3000);
  }
})
 
module.exports = webSocket;