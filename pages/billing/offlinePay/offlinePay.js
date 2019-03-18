import util from '../../../utils/util.js';
import api from '../../../config/api.js';
import bill from '../../../services/bill.js';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    totalAmount: 0,
    totalPayAmount: 0,
    ignoredAmount: 0,
    integralDeductionAmount: 0,
    debtAmount: 0,
    sectionId: '',
    delta: 1,
    addPage: null,
    receiptMainPage: null,
    dataVo: null,
    scrollHeight: 0,
    isCover: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    let {
      totalPayAmount,
      ignoredAmount,
      integralDeductionAmount,
      totalAmount
    } = options;
    totalPayAmount = totalPayAmount === undefined ? 0 : totalPayAmount;
    ignoredAmount = ignoredAmount === undefined ? 0 : ignoredAmount;
    integralDeductionAmount = integralDeductionAmount === undefined ? 0 : integralDeductionAmount;
    totalAmount = totalAmount === undefined ? 0 : totalAmount;

    this.setData({
      totalPayAmount,
      debtAmount: totalPayAmount,
      ignoredAmount,
      integralDeductionAmount,
      totalAmount,
    });
    this.setDelta();
    this.getSectionAccountVoList();

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    this.setHeight()
  },

  inputAmount: function(e) {
    const {
      key,
      index
    } = e.currentTarget.dataset;
    const {
      dataVo,
      totalPayAmount
    } = this.data;
    const amount = e.detail.num;

    if (dataVo != null) {
      dataVo[key][index].amount = amount;

      let sumAmount = 0;
      for (let keyItem in dataVo) {
        const dataList = dataVo[keyItem];
        for (let i = 0; i < dataList.length; i++) {
          const dataItem = dataList[i]
          if (dataItem.amount != undefined) {
            sumAmount = Number(util.accAdd(sumAmount, dataItem.amount))
          }
        }
      }
      this.setData({
        dataVo,
        debtAmount: Number(util.accSub(totalPayAmount, sumAmount))
      });
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
      this.setHeight()
    })
  },
  setDelta: function() {
    const mainPage = util.getMainPage({
      route: 'pages/billing/addGood/addGood'
    })
    const receiptMainPage = util.getMainPage({
      route: 'pages/billing/receiptMain/receiptMain'
    })
    const {
      addPage
    } = mainPage;
    this.setData({
      delta: mainPage.delta,
      addPage: addPage,
    });
    if (addPage != null) {
      this.setData({
        sectionId: addPage.data.sectionId,
      });
    }
    if (receiptMainPage.addPage != null) {
      this.setData({
        receiptMainPage: receiptMainPage.addPage,
      });
    }
  },
  tapOk: function (e) {
    const {
      paytype
    } = e.currentTarget.dataset;
    const that = this;
    const {
      sectionId,
      addPage,
      receiptMainPage,
      ignoredAmount,
      totalAmount,
      totalPayAmount,
      dataVo,
      integralDeductionAmount,
      debtAmount
    } = this.data;

    if (addPage != null && receiptMainPage != null) {
      const {
        remark
      } = receiptMainPage.data;
      //扫码支付
      if (paytype==='auto_discern'){
        if (Number(totalPayAmount) === 0) {
          util.showErrorToast('应收为0，请点击线下收款结单！')
          return;
        }
        dataVo[8][0].amount = debtAmount;
        //扫码
        wx.scanCode({
          success: (res) => {
            let saveData = {
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
                amount: util.accMul(debtAmount, 100),
              },
              dataVo: {
                8: [dataVo[8][0]]
              }
            }
            //现金支付+网上支付
            if (Number(totalPayAmount) !== Number(debtAmount)){
              saveData.onlinePayFlag=2;
              saveData.dataVo = dataVo;
            }

            bill.saveAndPostDraftRetailVo(saveData, () => {
              that.setData({
                isCover: false,
              });
            }).then((res) => {
              wx.showModal({
                title: '提示',
                showCancel: false,
                confirmColor: '#476EC9',
                content: res.desc || "收款成功",
                success: function () {
                  wx.reLaunch({
                    url: `/pages/billing/paySuccess/paySuccess?totalPayAmount=${totalPayAmount}&billsId=${res.data.billsId}`
                  })
                }
              })

            }).catch((err) => {
              this.setData({
                isCover: true,
              });
            });

          }
        })
      }
      //现金支付
      else{
        const saveData = {
          sectionId,
          ignoredAmount,
          totalAmount,
          integralDeductionAmount,
          remark,
          addPage,
          dataVo,
          onlinePayFlag: 0,
        }
        bill.saveAndPostDraftRetailVo(saveData).then((res) => {
          wx.showModal({
            title: '提示',
            showCancel: false,
            confirmColor: '#476EC9',
            content: res.desc || "收款成功",
            success: function () {
              wx.reLaunch({
                url: `/pages/billing/paySuccess/paySuccess?totalPayAmount=${totalPayAmount}&billsId=${res.data.billsId}`
              })
            }
          })
        })
      }

     
    } else {
      util.showErrorToast('操作有误！')
    }
  },
  
  setHeight:function(){
    const that = this;
    util.getScrollHeightByEle(['btnBlue', 'bottom-wrap', 'top-wrap', 'pay']).then((scrollHeight) => {
      // 计算主体部分高度,单位为px
      that.setData({
        scrollHeight: scrollHeight - 1,
      })
    })
  }

})