import util from '../../../utils/util.js';
import api from '../../../config/api.js';
import reg from '../../../config/reg.js';
import bill from '../../../services/bill.js';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    sectionIndex: 0,
    sectionName: '',
    sectionId: '',
    sectionList: [],
    contactUnitId: '',
    customerTelephone: '',
    customerName: '',
    totalSum: 0,
    totalAmount: 0, //应收金额
    allTotalAmount: 0, //总金额
    deductionAmount: 0, //抵现金额
    loanAmount: 0, //分期贷款金额
    depositAmount: 0, //定金金额
    ignoredAmount: 0, //抹零金额
    integralDeductionAmount: 0, //积分抵现金额
    goodsToggle: false,
    goodsVo: [],
    operatorToggle: false,
    operatorDetailList: [], //运营商业务
    addServiceToggle: false,
    addServiceDetailList: [],
    thirdPartyToggle: false,
    thirdPartyDetailList: [],
    installmentToggle: false,
    installmentDetailList: [],
    vipVo: {},
    depositDetailList: [],
    delBtnWidth: 80,
    curSelIndex: '',
    scrollHeight: 0,
    remark: '',
    billsId: '', //草稿单id
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    let {
      billsId
    } = options;
    billsId = billsId === undefined ? '' : billsId;
    this.setData({
      billsId,
    });
    if (billsId != '') {
      this.getRetailDraftOrderVo();
    } else {
      this.getysUserInfo();
    }

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    const that = this;
    util.getScrollHeightByEle(['banner-top', 'sum-wrap'],true).then((scrollHeight) => {
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
      goodsVo,
      operatorDetailList,
      addServiceDetailList,
      thirdPartyDetailList,
      installmentDetailList,
      depositDetailList,
      ignoredAmount,
      integralDeductionAmount,
    } = this.data
    let totalAmount = 0;
    let allTotalAmount = 0;
    let totalSum = 0;
    let deductionAmount = 0;
    let loanAmount = 0;
    let depositAmount = 0;
    // 商品价格  (控制：应付金额，和总金额)
    if (Array.isArray(goodsVo)) {
      for (let i = 0; i < goodsVo.length; i++) {
        const goodsItem = goodsVo[i];
        totalSum = util.accAdd(totalSum, goodsItem.goodsNumber)
        if (goodsItem.isGift != 1) {
          totalAmount = util.accAdd(totalAmount, goodsItem.discountedAmount)
        } else {
          goodsItem.discountedPrice = 0;
          goodsItem.discountedAmount = 0;
        }
        if (Array.isArray(goodsItem.giftList)) {
          for (let j = 0; j < goodsItem.giftList.length; j++) {
            const giftItem = goodsItem.giftList[j];
            totalSum = util.accAdd(totalSum, giftItem.goodsNumber);
            giftItem.discountedPrice = 0;
            giftItem.discountedAmount = 0;
          }
        }

      }
    }
    // 运营商业务 (控制：应付金额，和总金额)
    if (Array.isArray(operatorDetailList)) {
      for (let i = 0; i < operatorDetailList.length; i++) {
        const item = operatorDetailList[i];
        totalAmount = util.accAdd(totalAmount, item.receivedAmount)
      }
    }

    // 增值服务 (控制：应付金额，和总金额)
    if (Array.isArray(addServiceDetailList)) {
      for (let i = 0; i < addServiceDetailList.length; i++) {
        const item = addServiceDetailList[i];
        totalAmount = util.accAdd(totalAmount, item.actualReceivedAmount)
      }
    }
    allTotalAmount = totalAmount;
    // 第三方抵扣 (控制：应付金额)
    if (Array.isArray(thirdPartyDetailList)) {
      for (let i = 0; i < thirdPartyDetailList.length; i++) {
        const item = thirdPartyDetailList[i];
        totalAmount = util.accSub(totalAmount, item.deductionAmount)
        deductionAmount = util.accAdd(deductionAmount, item.deductionAmount)
      }
    }

    // 分期商业务  (控制：应付金额)
    if (Array.isArray(installmentDetailList)) {
      for (let i = 0; i < installmentDetailList.length; i++) {
        const item = installmentDetailList[i];
        totalAmount = util.accAdd(util.accSub(totalAmount, item.instalmentAmount), item.downPaymentAmount)
        loanAmount = util.accAdd(loanAmount, item.loanAmount)
      }
    }

    // 定金  (控制：应付金额)
    if (Array.isArray(depositDetailList)) {
      for (let i = 0; i < depositDetailList.length; i++) {
        const item = depositDetailList[i];
        depositAmount = util.accAdd(depositAmount, item.importdepositDetailListAmount)
      }
    }

    totalAmount = util.accSub(totalAmount, depositAmount) //减去定金
    totalAmount = util.accSub(totalAmount, ignoredAmount) //减去抹零金额
    totalAmount = util.accSub(totalAmount, integralDeductionAmount) //减去积分折扣
    this.setData({
      totalAmount,
      allTotalAmount,
      totalSum,
      deductionAmount,
      loanAmount,
      depositAmount,
      goodsVo,
    })
  },

  // 存草稿
  tapSaveDraft: function(e) {
    this.saveDraft((res) => {
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/billing/index/index'
        });
      }, 1500)
    })
  },
  saveDraft: function(callBack) {
    const {
      goodsVo,
      vipVo,
      depositDetailList,
      operatorDetailList,
      addServiceDetailList,
      thirdPartyDetailList,
      installmentDetailList,
      billsId,
      sectionId,
      contactUnitId,
      customerTelephone,
      totalAmount,
      allTotalAmount,
      ignoredAmount,
      integralDeductionAmount,
      remark
    } = this.data;
    if (customerTelephone.length < 11) {
      util.showErrorToast('请输入正确的手机号格式！');
      return;
    }
    if (vipVo.customerName == "") {
      util.showErrorToast('请输入客户姓名！');
      return;
    }
    const goodsDetailList = [];
    const addItemFun = function(item, goodIndex, giftIndex) {
      let orderNo = '';
      if (goodIndex >= 0) {
        orderNo += (goodIndex + 1)
      }

      if (giftIndex >= 0) {
        orderNo += '.' + (giftIndex + 1)
      }
      return {
        "orderNo": orderNo,
        "giftFlag": item.isGift == 1 ? 1 : 0,
        "storageId": item.storageId,
        "goodsId": item.goodsId,
        "imeiId": item.imeiId,
        "goodsNumber": item.goodsNumber,
        "retailPrice": item.retailPrice,
        "discountRate": item.discountRate,
        "discountedPrice": item.discountedPrice,
        "discountedAmount": item.discountedAmount,
        "remark": item.remark
      }
    }
    for (let i = 0; i < goodsVo.length; i++) {
      const goodsItem = goodsVo[i];
      goodsDetailList.push(addItemFun(goodsItem, i));
      if (Array.isArray(goodsItem.giftList)) {
        for (let j = 0; j < goodsItem.giftList.length; j++) {
          const giftItem = goodsItem.giftList[i];
          goodsDetailList.push(addItemFun(giftItem, i, j));
        }
      }
    }

    const order = JSON.stringify({
      "billsId": billsId,
      "sectionId": sectionId,
      "contactUnitId": contactUnitId,
      "customerId": vipVo.customerId,
      "customerName": vipVo.customerName,
      "customerTelephone": customerTelephone,
      "ignoredAmount": ignoredAmount,
      "totalAmount": allTotalAmount,
      "totalPayAmount": totalAmount,
      "shouldReceiveAmount": totalAmount,
      "integralDeductionAmount": integralDeductionAmount,
      "remark": remark,
      "goodsDetailList": goodsDetailList,
      "paymentReceivedOrderVo": {
        "detailList": []
      },
      depositDetailList,
      operatorDetailList,
      addServiceDetailList,
      thirdPartyDetailList,
      installmentDetailList,
    });

    util.request(
      api.saveDraftRetailVo, {
        order
      }
    ).then(res => {
      util.showErrorToast('保存草稿单成功！')
      if (callBack) {
        callBack(res)
      }
    })
  },
  // 删除本单
  tapDelDraft: function(e) {
    const {
      billsId,
    } = this.data;
    if (billsId != '') {
      util.request(
        api.deleteDraftRetailOrderVo, {
          billsId
        }
      ).then(res => {
        util.showErrorToast('删除草稿单成功！')
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/billing/index/index'
          });
        }, 1500)
      })
    } else {
      util.showErrorToast('当前单据不是草稿单！')
    }
  },
  tapNewDraft: function(e) {
    const that = this;
    wx.showModal({
      title: '提示',
      content: '您确定新开单吗？确定后，本单将存为草稿。',
      success: function(res) {
        if (res.confirm) {
          that.saveDraft(() => {
            setTimeout(() => {
              wx.switchTab({
                url: '/pages/billing/index/index'
              });
            }, 1500)
          })
        } else if (res.cancel) {

        }
      }
    })
  },
  // 收款
  tapPay: function(e) {
    wx.navigateTo({
      url: `/pages/billing/receiptMain/receiptMain`,
    })
  },
  // 扫码
  tapScanCode: function() {
    this.addShow(3, 0);
  },

  //录串号
  tapLuru: function() {
    this.addShow(1, 0);
  },
  //选商品
  tapSelGood: function() {
    this.addShow(2, 0);
  },
  //添加商品
  tapAddSheet: function() {
    this.showSheet({
      isGift: 0
    })
  },
  //删除商品
  delGood: function(e) {
    const {
      goodindex
    } = e.currentTarget.dataset;
    this.delGoodCon({
      goodIndex: goodindex
    });
    this.onShow()
  },
  delGoodCon: function({
    goodIndex,
    giftIndex
  }) {
    const {
      goodsVo
    } = this.data;
    if (Array.isArray(goodsVo)) {
      const curGoodinfo = goodsVo[goodIndex];
      if (curGoodinfo.isGift != 1 && giftIndex >= 0) {
        const giftList = goodsVo[goodIndex].giftList;
        if (Array.isArray(giftList)) {
          giftList.splice(giftList.findIndex((value, indexs, arr) => {
            return indexs == giftIndex;
          }), 1)
          goodsVo[goodIndex].giftList = giftList;
        }
      }
      //商品
      else {
        goodsVo.splice(goodsVo.findIndex((value, indexs, arr) => {
          return indexs == goodIndex;
        }), 1)
      }
    }
    this.setData({
      goodsVo,
      addServiceDetailList: [],
    });
  },
  //添加赠品
  tapAddGift: function(e) {
    const {
      index,
      isgift
    } = e.currentTarget.dataset;
    if (isgift != 1) {
      this.setData({
        curSelIndex: index,
      })
      this.showSheet({
        isGift: 1
      })
    }
  },
  //设置赠品
  tapSetGift: function(e) {
    const {
      index,
      isgift,
      len
    } = e.currentTarget.dataset;
    if (isgift != 1 && len == 0) {
      this.setData({
        curSelIndex: index,
      })
      wx.navigateTo({
        url: `/pages/billing/setGift/setGift`,
      })
    }
  },
  showSheet: function({
    isGift
  }) {
    var that = this;
    wx.showActionSheet({
      itemList: ['录串号', '选商品', '扫串号/条码'],
      success: function(res) {
        that.addShow(res.tapIndex + 1, isGift);
      }
    })
  },

  addShow: function(flag, isGift) {
    const {
      sectionId
    } = this.data;

    if (flag == 1) {
      //录串号
      wx.navigateTo({
        url: `/pages/billing/ruluImei/ruluImei?sectionId=${sectionId}&isGift=${isGift}`,
      })
    } else if (flag == 2) {
      //选商品
      wx.navigateTo({
        url: `/pages/billing/selGood/selGood?sectionId=${sectionId}&isGift=${isGift}`,
      })
    } else {
      //扫码
      wx.scanCode({
        success: (res) => {
          const {
            result
          } = res;
          util.request(
            api.getScanResultVo, {
              queryKey: result,
              sectionId,
            },
          ).then(ajaxData => {
            const {
              scanResultVo
            } = ajaxData.data;
            const modal = () => {
              wx.showModal({
                title: '提示',
                content: `无匹配库存串号或商品条码!扫码结果：${result}`,
                showCancel: false,
                confirmColor: '#476ec9',
                success: function(res) {

                }
              })
            }
            if (scanResultVo !== null) {

              if (scanResultVo.type == 1) {
                modal();
              } else if (scanResultVo.type == 2) {
                wx.navigateTo({
                  url: `/pages/billing/goodDetail/goodDetail?sectionId=${sectionId}&goodsId=${scanResultVo.goodsId}&imeiId=${scanResultVo.imeiId}&ifManageImei=1&isGift=${isGift}`,
                })
              } else if (scanResultVo.type == 3) {
                wx.navigateTo({
                  url: `/pages/billing/goodDetail/goodDetail?sectionId=${sectionId}&storageId=${scanResultVo.storageId}&goodsId=${scanResultVo.goodsId}&ifManageImei=0&isGift=${isGift}`,
                })
              } else {
                wx.navigateTo({
                  url: `/pages/billing/selCount/selCount?sectionId=${sectionId}&storageId=${scanResultVo.storageId}&goodsId=${scanResultVo.goodsId}&isGift=${isGift}`,
                })
              }
            } else {
              modal();
            }
          })
        }
      })
    }

  },

  getRetailDraftOrderVo: function() {
    const {
      billsId,
      sectionId,
      goodsVo,
      customerTelephone,
    } = this.data;
    const that = this;
    bill.getRetailDraftOrderVo(billsId).then(res => {
      const {
        orderVo
      } = res.data;
      const {
        goodsDetailList,
        depositDetailList,
        operatorDetailList,
        addServiceDetailList,
        thirdPartyDetailList,
        installmentDetailList,
        contactUnitId,
        ignoredAmount,
        integralDeductionAmount,
        remark,
        customerTelephone,
        customerName,
        sectionId,
        sectionName
      } = orderVo;
      if (Array.isArray(goodsDetailList)) {
        for (let i = 0; i < goodsDetailList.length; i++) {
          const goodsDetailItem = goodsDetailList[i];
          if ((goodsDetailItem.orderNo % 1) == 0) {
            goodsDetailItem.isGift = goodsDetailItem.giftFlag;
            goodsDetailItem.giftList = [];

            // if (!!customerTelephone != !!orderVo.customerTelephone) {
            //   goodsDetailItem.discountRate = that.getDiscountRateByGoodsClassId(goodsDetailItem)
            //   goodsDetailItem.discountedPrice = Number(util.accDiv(util.accMul(goodsDetailItem.retailPrice, goodsDetailItem.discountRate), 100).toFixed(2));
            //   goodsDetailItem.discountedAmount = Number(util.accMul(goodsDetailItem.discountedPrice, goodsDetailItem.goodsNumber));
            // }
            goodsVo.push(goodsDetailItem)
          }
        }
        for (let i = 0; i < goodsDetailList.length; i++) {
          const goodsDetailItem = goodsDetailList[i];
          if ((goodsDetailItem.orderNo % 1) != 0) {
            const orderNoArr = goodsDetailItem.orderNo.split(".");
            goodsDetailItem.isGift = goodsDetailItem.giftFlag;
            if (goodsVo[orderNoArr[0]]) {
              // if (!!customerTelephone != !!orderVo.customerTelephone) {
              //   goodsDetailItem.discountRate = that.getDiscountRateByGoodsClassId(goodsDetailItem)
              //   goodsDetailItem.discountedPrice = Number(util.accDiv(util.accMul(goodsDetailItem.retailPrice, goodsDetailItem.discountRate), 100).toFixed(2));
              //   goodsDetailItem.discountedAmount = Number(util.accMul(goodsDetailItem.discountedPrice, goodsDetailItem.goodsNumber));
              // }
              goodsVo[orderNoArr[0]].giftList.push(goodsDetailItem)
            }
          }
        }
      }
      that.setData({
        goodsVo,
        depositDetailList,
        operatorDetailList,
        addServiceDetailList,
        thirdPartyDetailList,
        installmentDetailList,
        contactUnitId: contactUnitId || '',
        ignoredAmount: ignoredAmount || '',
        integralDeductionAmount: integralDeductionAmount || '',
        remark: remark || '',
        customerTelephone,
        customerName,
        sectionId,
        sectionName
      });
      that.onShow();
      that.getVipVo()
      this.getCompanyList();
    })
  },
  // 获取会员信息
  getVipVo: function() {
    var that = this;
    const {
      customerTelephone,
      customerName
    } = this.data;
    if (customerTelephone) {
      util.request(
        api.getVipVo, {
          customerTelephone,
        },
      ).then(res => {
        const {
          vipVo
        } = res.data

        //非会员
        if (vipVo === null) {
          that.setData({
            vipVo: {
              "customerTelephone": customerTelephone,
              "customerName": customerName,
            },
          });
        }
        //会员
        else {
          // 禁用会员
          if (vipVo.status == 1) {
            // 清空折扣
            vipVo.defaultDiscountRate = 100;
            vipVo.goodsDiscountList = [];
            that.setData({
              vipVo: vipVo,
            });
          } else {
            that.setData({
              vipVo,
            });
          }

        }
        this.updateGoodDiscountRate()
      })
    } else {
      that.setData({
        vipVo: {
          "customerTelephone": customerTelephone,
          "customerName": customerName,
        },
      });
      this.updateGoodDiscountRate()
    }
  },

  //更新商品折扣率
  updateGoodDiscountRate: function() {
    const {
      goodsVo,
    } = this.data;
    const that = this;
    for (let i = 0; i < goodsVo.length; i++) {
      const goodsDetailItem = goodsVo[i];
      goodsDetailItem.discountRate = that.getDiscountRateByGoodsClassId(goodsDetailItem)
      goodsDetailItem.discountedPrice = Number(util.accDiv(util.accMul(goodsDetailItem.retailPrice, goodsDetailItem.discountRate), 100).toFixed(2));
      goodsDetailItem.discountedAmount = Number(util.accMul(goodsDetailItem.discountedPrice, goodsDetailItem.goodsNumber));
      for (let j = 0; i < goodsDetailItem.giftList.length; j++) {
        const goodsGiftItem = goodsDetailItem.giftList[j];
        goodsGiftItem.discountRate = that.getDiscountRateByGoodsClassId(goodsGiftItem)
        goodsGiftItem.discountedPrice = Number(util.accDiv(util.accMul(goodsGiftItem.retailPrice, goodsGiftItem.discountRate), 100).toFixed(2));
        goodsGiftItem.discountedAmount = Number(util.accMul(goodsGiftItem.discountedPrice, goodsGiftItem.goodsNumber));
      }


    }
  },
  //获取该商品的折扣率
  getDiscountRateByGoodsClassId: function({
    goodsClassId
  }) {
    const {
      vipVo
    } = this.data;
    if (vipVo === null) {
      return 100;
    } else {
      const {
        defaultDiscountRate,
        goodsDiscountList,
        status
      } = vipVo;
      if (status == 0) {
        if (Array.isArray(goodsDiscountList)) {
          let discountRate = -1;
          for (let i = 0; i < goodsDiscountList.length; i++) {
            if (goodsClassId == goodsDiscountList[i].goodsClassId) {
              discountRate = goodsDiscountList[i].discountRate;
              break;
            }
          }
          if (discountRate === -1) {
            return defaultDiscountRate;
          } else {
            return discountRate;
          }

        } else {
          return 100;
        }
      } else {
        return 100;
      }

    }

  },


  getCompanyList: function() {
    var that = this;
    const {
      sectionId
    } = this.data;
    util.request(
      api.getAccessSectionVoList,
    ).then(res => {
      let sectionIndex = 0;
      for (let i = 0; i < res.data.dataList.length; i++) {
        const dataItem = res.data.dataList[i];
        if (sectionId == dataItem.sectionId) {
          sectionIndex = i;
          break;
        }
        if (i == res.data.dataList.length - 1) {
          sectionIndex = i;
          that.setData({
            sectionName: dataItem.name,
            sectionId: dataItem.sectionId,
          });
        }
      }
      that.setData({
        sectionList: res.data.dataList,
        sectionIndex,
      });
    })

  },
  bindPickerChange: function(e) {
    const that = this
    const index = e.detail.value;
    const {
      name,
      sectionId,
    } = this.data.sectionList[index]; // 这个id就是选中项的id
    const {
      billsId,
    } = this.data;
    this.setData({
      sectionIndex: index,
      sectionName: name,
      sectionId,
      depositDetailList: [],
      operatorDetailList: [],
      addServiceDetailList: [],
      thirdPartyDetailList: [],
      installmentDetailList: [],
    });

    if (billsId != '') {
      util.showErrorToast('切换部门，会清空单据的明细信息！');
    }

  },
  inputTel: function(e) {
    const that = this;
    const tel = e.detail.value;
    const {
      customerTelephone
    } = this.data;
    if (tel.length >= 11) {
      if (reg.phone.test(tel)) {
        this.setData({
          customerTelephone: tel,
          addServiceDetailList: [],
        });
        this.getVipVo();
      } else {
        util.showErrorToast('请输入正确的手机号格式！');
      }
      return;
    }
    this.setData({
      vipVo: null,

      customerTelephone: tel,
      addServiceDetailList: [],
    });
  },
  inputName: function(e) {
    const that = this;
    const {
      vipVo
    } = this.data;
    vipVo.customerName = e.detail.value;
    const customerName = e.detail.value;
    this.setData({
      vipVo,
      customerName
    });
  },
  //删除业务
  delBusiness: function(e) {
    const {
      list,
      index,
      toggle
    } = e.target.dataset
    this.delBusinessCon({
      list,
      index,
      toggle
    })
  },
  //删除业务
  delBusinessCon: function({
    list,
    index,
    toggle
  }) {
    this.data[list].splice(index, 1);
    const setObj = {}
    setObj[list] = this.data[list]
    if (toggle !== undefined) {
      setObj[toggle] = !this.data[toggle];
    }
    this.setData(setObj);
  },
  getysUserInfo: function() {
    var that = this
    wx.getStorage({
      key: 'userInfo',
      success: function(res) {
        that.setData({
          sectionName: res.data.sectionName,
          sectionId: res.data.sectionId,
        });
        that.getCompanyList();
      }
    })
  },
  //业务
  tapBusiness: function(e) {
    this.goToBusiness(e.currentTarget.dataset)
  },
  tapAddSheetBusiness: function() {
    var that = this;
    wx.showActionSheet({
      itemList: ['运营商业务', '增值服务', '第三方抵扣', '分期业务'],
      success: function(res) {
        let target = '';
        if (res.tapIndex === 0) {
          target = 'billOperator'
        } else if (res.tapIndex === 1) {
          target = 'billService'
        } else if (res.tapIndex === 2) {
          target = 'billThirdParty'
        } else {
          target = 'billInstallment'
        }
        that.goToBusiness({
          state: 0,
          target: target,
          index: -1,
        });
      }
    })
  },
  goToBusiness: function(data) {
    const {
      state,
      target,
      index
    } = data;
    var pages = getCurrentPages() //获取加载的页面
    var currentPage = pages[pages.length - 1] //获取当前页面的对象

    wx.navigateTo({
      url: `/pages/common/${target}/${target}?route=${currentPage.route}&state=${state}&itemIndex=${index === undefined ? '-1' : index}`,
    })
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})