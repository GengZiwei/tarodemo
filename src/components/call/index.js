// components/call/index.js
const app = getApp()
Component({
  /**
   * 组件的属性列表
   */
  /* properties: {
    callData: {   //navbarData   由父页面传递的数据，变量名字自命名
      type: Object,
      value: {},
      observer: function (newVal, oldVal) { }
    },
  }, */

  /**
   * 组件的初始数据
   */
  data: {
    isCall: false,
    callData: {   //callData   由父页面传递的数据，变量名字自命名
      bottom:"540rpx"
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 点击安全中心
    takeCall() {
      this.setData({
        isCall: !this.data.isCall
      })
    },
    // 一键拨号
    callTel(e) {
      let _tel = e.currentTarget.dataset.tel;
      wx.makePhoneCall({
        phoneNumber: app.globalData.basicInformationList[_tel]
      })
    },
  }
})
