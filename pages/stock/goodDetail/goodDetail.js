import util from '../../../utils/util.js';
import api from '../../../config/api.js';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    goodsId: '',
    goodsVo: {},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.setData({
      goodsId: options.id,
    });
    this.getStockDetailGoodsVo()
  },
  /**
 * 生命周期函数--监听页面初次渲染完成
 */
  onReady: function () {

  },

  // 获取明细信息
  getStockDetailGoodsVo: function() {
    const _this = this;
    const {
      goodsId
    } = this.data;
    util.request(api.getStockDetailGoodsVo, {
        goodsId
      },
      'GET'
    ).then(res => {
      _this.setData({
        goodsVo: res.data.goodsVo,
      });
    });
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})