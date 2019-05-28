const app = getApp()
Component({
  properties: {
    navbarData: {   //navbarData   由父页面传递的数据，变量名字自命名
      type: Object,
      value: {},
      observer: function (newVal, oldVal) { }
    },
  },
  data: {
    height: '',
    //默认值  默认显示左上角
    shareDate: false,
    // 弹窗确认按钮文字
    centerDate: false,
    navbarData: {
      showCapsule: 1,
      i_back:false,
      i_center:true
    }
  },
  attached: function () {
    // 定义导航栏的高度   方便对齐
    this.setData({
      height: app.getGlobalData('tabHeight')
    })
  },
  methods: {
    // 返回上一页面
    _navback() {
      wx.navigateBack()
    },
    //返回到首页
    _showCenter() {
      app.NavigateTo({
        url: '/pages/center/center',
      })
    }
  }
})