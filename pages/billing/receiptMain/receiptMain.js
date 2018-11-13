import util from '../../../utils/util.js';
import api from '../../../config/api.js';
import bill from '../../../services/bill.js';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    totalAmount: 0,
    ignoredAmount: 0,
    totalPayAmount: 0,
    shouldReceiveAmount: 0,
    vipCardScore: 0,
    integralDeductionAmount: 0,
    allTotalAmount: 0,
    depositAmount: 0,
    loanAmount: 0,
    deductionAmount: 0,
    remark: '',
    addPage: null,
    delta: 1,
    sectionId: '',
    vipVo: {},
    dataVo: null,
    isCover:true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.setDelta();
    this.getSectionAccountVoList()
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    this.summary();
  },

  inputIgnoredAmount: function(e) {
    this.setData({
      ignoredAmount: e.detail.num,
    });
    this.summary();
  },
  inputRemark: function(e) {
    this.setData({
      remark: e.detail.value,
    });
  },
  summary: function() {
    const {
      totalAmount,
      ignoredAmount,
      totalPayAmount,
      shouldReceiveAmount,
      integralDeductionAmount
    } = this.data;
    this.setData({
      totalPayAmount: util.accSub(util.accSub(totalAmount, ignoredAmount), integralDeductionAmount),
    });
  },
  // 仅存草稿
  tapdraft: function() {
    const {
      addPage,
      ignoredAmount,
      integralDeductionAmount,
      remark,
    } = this.data;
    if (addPage) {
      addPage.setData({
        ignoredAmount,
        integralDeductionAmount,
        remark,
      })
      addPage.onShow()
      addPage.tapSaveDraft();
    }
  },
  // 扫码收款
  tapScanCode: function(e) {
    const {
      paytype
    } = e.currentTarget.dataset;
    const that=this;
    const {
      sectionId,
      addPage,
      ignoredAmount,
      totalAmount,
      remark,
      totalPayAmount,
      integralDeductionAmount,
      dataVo
    } = this.data;
    if (addPage != null) {
      const {
        vipVo,
        goodsVo
      } = addPage.data;
      if (Number(totalPayAmount) === 0) {
        util.showErrorToast('应收为0，请点击线下收款结单！')
        return;
      }
      const itemVo = dataVo[8][0];
      itemVo.amount = totalPayAmount;
      //扫码
      wx.scanCode({
        success: (res) => {
          const saveData = {
            sectionId,
            ignoredAmount,
            totalAmount,
            integralDeductionAmount,
            remark,
            addPage,
            onlinePayFlag: 1,
            scanPayVo: {
              payType: paytype,
              authNo: res.result,
              amount: util.accMul(totalPayAmount, 100),
            },
            dataVo: {
              8: [itemVo]
            }
          }
         
          bill.saveAndPostDraftRetailVo(saveData,()=>{
            that.setData({
              isCover: false,
            });
          }).then((res) => {
            wx.reLaunch({
              url: `/pages/billing/paySuccess/paySuccess?totalPayAmount=${totalPayAmount}&billsId=${res.data.billsId}`
            })
          }).catch((err) => {
            this.setData({
              isCover: true,
            });
          });
              
        }
      })
    } else {
      util.showErrorToast('操作有误！')
    }

  },
  getSectionAccountVoList: function() {
    const {
      sectionId
    } = this.data;
    const that = this;
    util.request(
      api.getSectionAccountVoList, {
        sectionId
      },
    ).then(res => {

      const {
        dataList
      } = res.data;
      const returnObj = {};
      if (Array.isArray(dataList)) {
        for (let i = 0; i < dataList.length; i++) {
          const dataItem = dataList[i];
          if (dataItem.status == 0) {
            if (returnObj[dataItem.accountType] === undefined) {
              returnObj[dataItem.accountType] = [];
            }
            dataItem.amount = '';
            returnObj[dataItem.accountType].push(dataItem)
          }
        }
      }
      that.setData({
        dataVo: returnObj,
      })
    })
  },
  tapxianxia: function() {
    const {
      totalAmount,
      totalPayAmount,
      ignoredAmount,
      integralDeductionAmount
    } = this.data;
    wx.navigateTo({
      url: `/pages/billing/offlinePay/offlinePay?totalAmount=${totalAmount}&ignoredAmount=${ignoredAmount}&integralDeductionAmount=${integralDeductionAmount}&totalPayAmount=${totalPayAmount}`,
    })
  },
  setDelta: function() {
    const mainPage = util.getMainPage({
      route: 'pages/billing/addGood/addGood'
    })
    const {
      addPage
    } = mainPage;
    this.setData({
      delta: mainPage.delta,
      addPage: mainPage.addPage,
    });
    if (addPage != null) {
      const {
        sectionId,
        totalAmount,
        ignoredAmount,
        integralDeductionAmount,
        allTotalAmount,
        depositAmount,
        loanAmount,
        deductionAmount,
        vipVo,
        remark,
      } = addPage.data
      this.setData({
        sectionId,
        totalAmount,
        ignoredAmount,
        integralDeductionAmount,
        allTotalAmount,
        depositAmount,
        loanAmount,
        deductionAmount,
        vipVo,
        remark,
      });
    }
  }
})