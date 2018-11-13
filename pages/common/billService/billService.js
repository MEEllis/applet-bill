import util from '../../../utils/util.js';
import api from '../../../config/api.js';
import {
  $wuxToptips
} from '../../../component/index.js'
Page({
  /**
   * 页面的初始数据
   */
  data: {
    state: '0', //状态： 0：新增  1 查看（修改）
    itemIndex: -1, //集合索引
    addServiceDetailList: [], //集合
    cardTypeId: '', //会员卡类型id

    serviceId: '', //运营商增值服务名称id
    serviceName: '请选择', //运营商增值服务名称名称
    actualReceivedAmount: '0', //实际收款金额
    effectiveDateStr: '', //业务号
    goodsDetailNo: '请选择', //商品明细序号id
    goodsName: '', //商品明细序号
    imei: '', //主串
    auxiliaryImei: '', //辅串
    presetPrice: '0', //预设售价
    vipPrice: "0", //会员价
    usedTimes: "0", //使用次数
    limitedPeriod: "0", //有限期限
    remark: '', //明细备注

    sectionId: '',
    goodsNameList: [],
    addServiceVoList: [],

    lastserviceId: '', //最后一次运营商增值服务名称id
    scrollHeight: 0,
    route: '',
    delta: 1,
    addPage: null
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    let {
      route,
      state,
      itemIndex,
    } = options;
    route = route === undefined ? '' : route;
    state = state === undefined ? '0' : state;
    itemIndex = itemIndex === undefined ? '-1' : itemIndex;
    this.setData({
      route,
      state,
      itemIndex,
    });
    let barTitle = '添加增值服务'
    if (state !== '0') {
      barTitle = '修改增值服务'
    } else {
      const curTime = util.formatTime(new Date);
      this.setData({
        effectiveDateStr: curTime,
      });
    }
    wx.setNavigationBarTitle({
      title: barTitle,
    })
    this.setDelta();
    this.getAddServiceVoList();
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    const that = this;
    util.getScrollHeightByEle(['btn-wrap'], true).then((scrollHeight) => {
      // 计算主体部分高度,单位为px
      that.setData({
        scrollHeight: scrollHeight - 1,
      })
    })
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    const {
      serviceId,
      lastserviceId,
    } = this.data;
    //改变增值服务名称
    if (serviceId != lastserviceId) {
      this.setData({
        lastserviceId: serviceId,
      })
      this.getAddServiceInfoVo()
    }
  },
  tapShowDetail: function(e) {
    const {
      target,
    } = e.currentTarget.dataset;
    var pages = getCurrentPages() //获取加载的页面
    var currentPage = pages[pages.length - 1] //获取当前页面的对象
    const {
      sectionId,
      serviceId,
    } = this.data;
    wx.navigateTo({
      url: `/pages/common/${target}/${target}?route=${currentPage.route}`,
    })

  },
  bindDateStart: function(e) {
    this.setData({
      effectiveDateStr: e.detail.value
    })
  },
  bindInputPrice: function(e) {
    const {
      target,
    } = e.currentTarget.dataset;
    const {
      num
    } = e.detail;
    if (target !== undefined) {
      const setObj = {}
      setObj[target] = num
      this.setData(setObj)
    }
  },

  bindText: function(e) {
    const {
      target,
    } = e.currentTarget.dataset;
    const {
      value
    } = e.detail;
    if (target !== undefined) {
      const setObj = {}
      setObj[target] = value
      this.setData(setObj)

    }
  },
  // 取消
  tapCancle: function() {
    const {
      delta
    } = this.data;
    wx.navigateBack({
      delta: Number(delta),
    })
  },
  // 删除
  tapDel: function() {
    const {
      addPage,
      delta,
      itemIndex,
    } = this.data;
    addPage.delBusinessCon({
      list: 'addServiceDetailList',
      index: itemIndex,
    })
    wx.navigateBack({
      delta: Number(delta),
    })
  },
  // 确定
  tapOk: function() {
    let {
      serviceId,
      serviceName,
      actualReceivedAmount,
      effectiveDateStr,
      goodsDetailNo,
      goodsName,
      imei,
      auxiliaryImei,
      presetPrice,
      vipPrice,
      usedTimes,
      limitedPeriod,
      remark,
      state, //状态： 0：新增  1 查看（修改）
      itemIndex, //集合索引
      addServiceDetailList, //集合
      addPage,
      delta,
    } = this.data;
    if (serviceId === '') {
      this.showToptips({
        text: "请选择增值服务名称"
      })
      return;
    }
    goodsDetailNo = goodsDetailNo === '请选择' ? '' : goodsDetailNo;
    //新增
    if (state === '0') {
      addServiceDetailList.push({
        serviceId,
        serviceName,
        actualReceivedAmount,
        effectiveDateStr,
        goodsDetailNo,
        goodsName,
        imei,
        auxiliaryImei,
        presetPrice,
        vipPrice,
        usedTimes,
        limitedPeriod,
        remark,
      })
    }
    //修改
    else {
      if (itemIndex < 0) {
        this.showToptips({
          text: "增值服务索引小于0，参数有误！"
        })
        return;
      }
      addServiceDetailList[itemIndex] = {
        serviceId,
        serviceName,
        actualReceivedAmount,
        effectiveDateStr,
        goodsDetailNo,
        goodsName,
        imei,
        auxiliaryImei,
        presetPrice,
        vipPrice,
        usedTimes,
        limitedPeriod,
        remark,
      };
    }
    addPage.setData({
      addServiceDetailList,
    })
    wx.navigateBack({
      delta: Number(delta),
    })
  },
  //增值服务名称
  getAddServiceVoList: function() {
    const that = this;
    util.request(api.getAddServiceVoList).then(res => {
      that.setData({
        addServiceVoList: res.data.dataList
      })
    });
  },
  //增值服务详情
  getAddServiceInfoVo: function() {
    const that = this;
    const {
      serviceId,
      cardTypeId,
    } = this.data;
    const postData = {
      serviceId,
      cardTypeId,
    };
    util.request(api.getAddServiceInfoVo, postData).then(res => {
      const {
        defaultPrice, //预设价
        vipPrice, //会员价
        serviceDue, //有效期限
        usageCount, //使用次数
      } = res.data.addServiceInfoVo
      that.setData({
        presetPrice: defaultPrice,
        actualReceivedAmount: defaultPrice,
        vipPrice,
        limitedPeriod: serviceDue,
        usedTimes: usageCount,
      })
    });
  },

  showToptips: function({
    text,
    duration
  }) {
    $wuxToptips().error({
      hidden: false,
      text,
      duration: duration || 2000,
      success() {},
    })
  },
  setDelta: function() {
    const {
      route,
      state,
      itemIndex,
    } = this.data;
    if (route != '') {
      const mainPage = util.getMainPage({
        route,
      })
      const {
        delta,
        addPage
      } = mainPage
      this.setData({
        delta,
        addPage,
      });
      if (addPage != null) {
        const {
          sectionId,
          addServiceDetailList,
          goodsVo,
        } = addPage.data;
        const goodsNameList = [];
        for (let i = 0; i < goodsVo.length; i++) {
          goodsVo[i].index = i + 1;
          goodsNameList.push(goodsVo[i])
          if (goodsVo[i].giftList.length > 0) {
            for (let j = 0; j < goodsVo[i].giftList.length; j++) {
              goodsVo[i].giftList[j].index = Number(i + 1) + '.' + Number(j + 1);
              goodsNameList.push(goodsVo[i].giftList[j])
            }
          }

        }
        this.setData({
          sectionId,
          addServiceDetailList,
          goodsNameList: goodsNameList,
        });

        if (state === '1' && itemIndex > -1) {
          const detailItem = addServiceDetailList[itemIndex]
          const {
            serviceId,
            serviceName,
            actualReceivedAmount,
            effectiveDateStr,
            goodsDetailNo,
            goodsName,
            imei,
            auxiliaryImei,
            presetPrice,
            vipPrice,
            usedTimes,
            limitedPeriod,
            remark,
            vipCardTypeId
          } = detailItem
          this.setData({
            lastserviceId: serviceId,
            serviceId,
            serviceName: serviceName || '请选择',
            actualReceivedAmount,
            effectiveDateStr,
            goodsDetailNo: goodsDetailNo || '请选择',
            goodsName: goodsName,
            imei,
            auxiliaryImei,
            presetPrice,
            vipPrice,
            usedTimes,
            limitedPeriod,
            remark,
            cardTypeId:vipCardTypeId
          });
        }
      }
    }

  },
})