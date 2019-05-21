module.exports =  {
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.onPullDownRefresh()
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function (e) { // 刷新
    this.data.pageNumber = 1
    this.data.tableList = []
    this.getList({pageNumber: 1, refresh: true})
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    // 总页数跟当前页数的对比
    console.log(this.totalPage, this.data.pageNumber)
    if(this.totalPage == this.data.pageNumber) return false
    this.data.pageNumber++
    this.getList({pageNumber: this.data.pageNumber})
  }
}