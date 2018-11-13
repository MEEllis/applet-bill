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
    thirdPartyDetailList: [], //集合
    contactUnitId: '', //运营商往来单位id
    contactUnitName: '请选择', //运营商往来单位名称
    thirdPartyId: '', //第三方活动id
    thirdPartyName: '请选择', //第三方活动名称
    deductionAmount: '0', //抵扣金额
    settlementAmount: '0', //结算金额
    settlementAmountFirst: '0', // 选择第三方活动名称的结算金额
    businessNo: '', //业务号
    remark: '', //明细备注
    sectionId: '',
    thirdPartyContactUnitList: [],
    thirdPartyList: [],
    lastContactUnitId: '', //最后一次运营商往来单位id
    lastThirdPartyId: '', //最后一次业务名称id
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
    this.getThirdPartyContactUnitVoList();
    let barTitle = '添加第三方折扣'
    if (state !== '0') {
      barTitle = '修改第三方折扣'
      this.getThirdPartyVoList(()=>{
        const {
          thirdPartyList,
          thirdPartyId,
        } = this.data;
        //获取settlementAmount
        for (let i = 0; i < thirdPartyList.length;i++){
          const thirdPartyItem=thirdPartyList[i];
          if (thirdPartyItem.id == thirdPartyId){
            this.setData({
              settlementAmountFirst: settlementAmount
            })
          }
        }
      })
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
      contactUnitId,
      lastContactUnitId,
    } = this.data;
    const that = this;
    //改变往来单位
    if (contactUnitId != lastContactUnitId) {
      this.setData({
        thirdPartyId: '',
        lastThirdPartyId: '',
        thirdPartyName: '请选择',
        deductionAmount: '0',
        settlementAmount: '0',
        settlementAmountFirst: '0',
        lastContactUnitId: contactUnitId,
      })
      this.getThirdPartyVoList()

    }
  },
  tapShowDetail: function(e) {
    const {
      target,
    } = e.currentTarget.dataset;
    var pages = getCurrentPages() //获取加载的页面
    var currentPage = pages[pages.length - 1] //获取当前页面的对象
    const {
      contactUnitId,
    } = this.data;
    //业务名称
    if (target === 'thirdParty') {
      if (contactUnitId === '') {
        this.showToptips({
          text: "请选择第三方折扣往来单位！"
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
      //抵现金额
      if (target == 'deductionAmount') {
        //  若所选的“业务名称”对应的“结算金额是0”，则自动将“抵现金额”赋值给“结算金额”
        setTimeout(() => {
          const {
            settlementAmountFirst,
            deductionAmount,
          }=this.data
          if (Number(settlementAmountFirst)==0){
            this.setData({
              settlementAmount: deductionAmount
            })
          }
         
        }, 20)
      }
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
      list: 'thirdPartyDetailList',
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
      thirdPartyId,
      thirdPartyName,
      deductionAmount,
      settlementAmount,
      businessNo,
      remark,
      state, //状态： 0：新增  1 查看（修改）
      itemIndex, //集合索引
      thirdPartyDetailList, //集合
      addPage,
      delta,
    } = this.data;
    if (contactUnitId === '') {
      this.showToptips({
        text: "请选择第三方折扣往来单位"
      })
      return;
    }
    if (thirdPartyId === '') {
      this.showToptips({
        text: "请选择第三方折扣活动名称"
      })
      return;
    }

    //新增
    if (state === '0') {
      thirdPartyDetailList.push({
        contactUnitId,
        contactUnitName,
        thirdPartyId,
        thirdPartyName,
        deductionAmount,
        settlementAmount,
        businessNo,
        remark,
      })
    }
    //修改
    else {
      if (itemIndex < 0) {
        this.showToptips({
          text: "第三方折扣索引小于0，参数有误！"
        })
        return;
      }
      thirdPartyDetailList[itemIndex] = {
        contactUnitId,
        contactUnitName,
        thirdPartyId,
        thirdPartyName,
        deductionAmount,
        settlementAmount,
        businessNo,
        remark,
      };
    }
    addPage.setData({
      thirdPartyDetailList,
    })
    wx.navigateBack({
      delta: Number(delta),
    })
  },
  //往来单位
  getThirdPartyContactUnitVoList: function() {
    const that = this;
    util.request(api.getThirdPartyContactUnitVoList).then(res => {
      that.setData({
        thirdPartyContactUnitList: res.data.dataList
      })
    });
  },
  //业务名称
  getThirdPartyVoList: function(callback) {
    const that = this;
    const {
      contactUnitId,
    } = this.data;
    const postData = {
      contactUnitId,
    };
    util.request(api.getThirdPartyVoList, postData).then(res => {
      that.setData({
        thirdPartyList: res.data.dataList
      })
      if (callback){
        callback()
      }

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
          thirdPartyDetailList,
        } = addPage.data;
        this.setData({
          sectionId,
          thirdPartyDetailList,
        });

        if (state === '1' && itemIndex > -1) {
          const detailItem = thirdPartyDetailList[itemIndex]
          const {
            contactUnitId,
            contactUnitName,
            thirdPartyId,
            thirdPartyName,
            deductionAmount,
            settlementAmount,
            businessNo,
            remark,
          } = detailItem
          this.setData({
            lastContactUnitId: contactUnitId,
            contactUnitId,
            contactUnitName: contactUnitName || '请选择',
            lastThirdPartyId: thirdPartyId,
            thirdPartyId,
            thirdPartyName: thirdPartyName || '请选择',
            deductionAmount,
            settlementAmount,
            businessNo,
            remark,

          });
        }
      }
    }

  },
})