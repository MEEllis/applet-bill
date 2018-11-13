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
    operatorDetailList: [], //集合
    contactUnitId: '', //运营商往来单位id
    contactUnitName: '请选择', //运营商往来单位名称
    businessId: '', //业务名称id
    businessName: '请选择', //业务名称
    systemNoId: '', //系统工号id
    systemNo: '请选择', //系统工号
    receivedAmount: '0', //收款金额
    businessCount: '1', //业务数量
    commission: '', //预估佣金
    commissionAmount: '0', //佣金金额
    commissionIntegral: '0', //代办积分(笔)
    totalCommissionIntegral: '0', //代办总积分
    businessNo: '', //业务号
    telephone: '', //电话号码
    phoneImei: '', //手机串号
    reductionMarginAmount: '0', //减扣保证金金额
    remark: '', //明细备注
    sectionId: '',
    systemNoList: [],
    operatorContactUnitList: [],
    businessArchivesList: [],
    lastContactUnitId: '', //最后一次运营商往来单位id
    lastBusinessId: '', //最后一次业务名称id
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

    this.setDelta();
    this.getOperatorContactUnitVoList();
    let barTitle = '添加运营商业务'
    if (state !== '0') {
      barTitle = '修改运营商业务'
      this.getBusinessArchivesVoList();
      this.getSystemNoVoList();
    }
    wx.setNavigationBarTitle({
      title: barTitle,
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    const that = this;
    util.getScrollHeightByEle(['btn-wrap'],true).then((scrollHeight) => {
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
      contactUnitId,
      lastContactUnitId,
      businessId,
      lastBusinessId,
    } = this.data;
    const that = this;
    //改变往来单位
    if (contactUnitId != lastContactUnitId) {
      this.setData({
        businessId: '',
        businessName: '请选择',
        systemNoId: '',
        systemNo: '请选择',
        lastContactUnitId: contactUnitId,
      })
      this.getBusinessArchivesVoList()
      this.getSystemNoVoList()
    }
    //更改业务名称
    if (businessId != lastBusinessId) {
      this.setData({
        lastBusinessId: businessId,
      })
      this.sumPrice()
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
      contactUnitId,
    } = this.data;
    //业务名称
    if (target === 'businessArchives') {
      if (contactUnitId === '') {
        this.showToptips({
          text: "请选择运营商往来单位！"
        })
        return;
      }
    } else if (target === 'systemNo') {
      if (contactUnitId === '') {
        this.showToptips({
          text: "请选择运营商往来单位！"
        })
        return;
      }
      if (sectionId === '') {
        this.showToptips({
          text: "请选择部门！"
        })
        return;
      }
    }
    wx.navigateTo({
      url: `/pages/common/${target}/${target}?route=${currentPage.route}`,
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
      if (target === 'businessCount') {
        this.sumPrice()
      } else if (target === 'receivedAmount') {
        this.setData({
          'reductionMarginAmount': num,
        })
      }
    }
  },
  sumPrice: function() {
    const {
      commission,
      commissionIntegral,
      businessCount,
    } = this.data;
    this.setData({
      commissionAmount: util.accMul(commission, businessCount),
      totalCommissionIntegral: util.accMul(commissionIntegral, businessCount),
    })
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
      list: 'operatorDetailList',
      index: itemIndex,
    })
    wx.navigateBack({
      delta: Number(delta),
    })
  },
  // 确定
  tapOk: function() {
    let {
      contactUnitId,
      contactUnitName,
      businessId,
      businessName,
      systemNoId,
      systemNo,
      receivedAmount,
      businessCount,
      commission,
      commissionAmount,
      commissionIntegral,
      totalCommissionIntegral,
      businessNo,
      telephone,
      phoneImei,
      reductionMarginAmount,
      remark,
      state, //状态： 0：新增  1 查看（修改）
      itemIndex, //集合索引
      operatorDetailList, //集合
      addPage,
      delta,
    } = this.data;
    if (contactUnitId === '') {
      this.showToptips({
        text: "请选择运营商往来单位"
      })
      return;
    }
    if (businessId === '') {
      this.showToptips({
        text: "请选择运营商业务名称"
      })
      return;
    }
    systemNo = systemNo === '请选择' ? '' : systemNo;
    //新增
    if (state === '0') {
      operatorDetailList.push({
        contactUnitId,
        contactUnitName,
        businessId,
        businessName,
        systemNoId,
        systemNo,
        receivedAmount,
        businessCount,
        commission,
        commissionAmount,
        commissionIntegral,
        totalCommissionIntegral,
        businessNo,
        telephone,
        phoneImei,
        reductionMarginAmount,
        remark,
      })
    }
    //修改
    else {
      if (itemIndex < 0) {
        this.showToptips({
          text: "运营商索引小于0，参数有误！"
        })
        return;
      }
      operatorDetailList[itemIndex] = {
        contactUnitId,
        contactUnitName,
        businessId,
        businessName,
        systemNoId,
        systemNo,
        receivedAmount,
        businessCount,
        commission,
        commissionAmount,
        commissionIntegral,
        totalCommissionIntegral,
        businessNo,
        telephone,
        phoneImei,
        reductionMarginAmount,
        remark,
      };
    }
    addPage.setData({
      operatorDetailList,
    })
    wx.navigateBack({
      delta: Number(delta),
    })
  },
  //往来单位
  getOperatorContactUnitVoList: function() {
    const that = this;
    util.request(api.getOperatorContactUnitVoList).then(res => {
      that.setData({
        operatorContactUnitList: res.data.dataList
      })
    });
  },
  //业务名称
  getBusinessArchivesVoList: function() {
    const that = this;
    const {
      contactUnitId,
    } = this.data;
    const postData = {
      contactUnitId,
    };
    util.request(api.getBusinessArchivesVoList, postData).then(res => {
      that.setData({
        businessArchivesList: res.data.dataList
      })
    });
  },
  //系统工号
  getSystemNoVoList: function() {
    const that = this;
    const {
      sectionId,
      contactUnitId,
    } = this.data;
    const postData = {
      sectionId,
      contactUnitId,
    };
    util.request(api.getSystemNoVoList, postData).then(res => {
      that.setData({
        systemNoList: res.data.dataList
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
          operatorDetailList,
        } = addPage.data;
        this.setData({
          sectionId,
          operatorDetailList,
        });

        if (state === '1' && itemIndex > -1) {
          const detailItem = operatorDetailList[itemIndex]
          const {
            contactUnitId,
            contactUnitName,
            businessId,
            businessName,
            systemNoId,
            systemNo,
            receivedAmount,
            businessCount,
            commission,
            commissionAmount,
            commissionIntegral,
            totalCommissionIntegral,
            businessNo,
            telephone,
            phoneImei,
            reductionMarginAmount,
            remark,
          } = detailItem
          this.setData({
            lastContactUnitId: contactUnitId,
            contactUnitId,
            contactUnitName: contactUnitName || '请选择',
            lastBusinessId: businessId,
            businessId,
            businessName: businessName || '请选择',
            systemNoId,
            systemNo: systemNo || '请选择',
            receivedAmount,
            businessCount,
            commission,
            commissionAmount,
            commissionIntegral,
            totalCommissionIntegral,
            businessNo,
            telephone,
            phoneImei,
            reductionMarginAmount,
            remark,
          });
        }
      }
    }

  },
})