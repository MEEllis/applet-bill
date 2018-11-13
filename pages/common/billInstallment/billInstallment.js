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
    installmentDetailList: [], //集合

    installmentId: "", // 分期商(往来单位) id
    installmentName: "请选择", // 分期商(往来单位) 名称
    businessId: "", //  分期业务id
    businessName: "请选择", // 分期业务名称
    instalmentAmount: "0", //  分期金额
    downPaymentAmount: "0", //  首付金额
    loanAmount: "0", //  分期贷款金额
    commissionRate: "0", //  佣金比例
    estimatedCommissionAmount: "0", //  预估佣金金额
    feeRatio: "0",
    procedureFeeAmount: "0", //  手续费金额
    excludeProcedureFeeLoanAmount: "0", //  扣费后贷款金额
    contractNo: "", //  合同号
    phoneImei: "", //  手机串号
    installmentCount: "1", //  分期数
    monthlyPayAmount: "0", //  月供金额

    remark: '', //明细备注
    sectionId: '',

    installmentContactUnitList: [],
    businessNameList: [],
    lastInstallmentId: '', //最后一次运营商往来单位id
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
    this.getInstallmentContactUnitVoList();
    let barTitle = '添加分期业务'
    if (state !== '0') {
      barTitle = '修改分期业务'
      this.getInstallmentVoList()
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
      installmentId,
      lastInstallmentId,
      businessId,
      lastBusinessId,
    } = this.data;
    const that = this;
    //改变往来单位
    if (installmentId != lastInstallmentId) {
      this.setData({
        businessId: '',
        businessName: '请选择',
        commissionRate: '0',
        feeRatio: '0',
        lastInstallmentId: installmentId,
      })
      this.getInstallmentVoList()
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
      installmentId,
    } = this.data;
    //业务名称
    if (target === 'businessName') {
      if (installmentId === '') {
        this.showToptips({
          text: "请选择分期业务往来单位！"
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
      //分期金额 或者 首付金额
      if (target == 'instalmentAmount' || target=='downPaymentAmount') {
        setTimeout(()=>{
          this.sumPrice()
        },20)
      }
      //分期数
      else if (target == 'installmentCount') {
        /*
        更改“分期数”:
         月供 = 分期贷款金额 ÷ 分期数
        */
        const {
          loanAmount,
        } = this.data;
        const monthlyPayAmount = Number(util.accDiv(loanAmount, num)).toFixed(2)
        this.setData({
          monthlyPayAmount,
        })
      }
      //手续费金额
      else if (target == 'procedureFeeAmount') {
        /*
       更改“手续费金额”
       扣费后贷款金额 = 分期贷款金额 - 手续费金额
        */
        const {
          loanAmount,
        } = this.data;
        const excludeProcedureFeeLoanAmount = Number(util.accSub(loanAmount, num)).toFixed(2)
        this.setData({
          excludeProcedureFeeLoanAmount,
        })
      }
    
    }
  },
  sumPrice: function() {
    /*
    更改“分期金额” 或者更改 ‘首付金额’:
    分期贷款金额 = 分期金额 - 首付金额
    预计佣金 = 分期贷款金额 * 佣金比例
    手续费金额 = 分期贷款金额 * 手续费比例
    扣费后贷款金额 = 分期贷款金额 - 手续费金额
     月供 = 分期贷款金额 ÷ 分期数
     */
    const {
      instalmentAmount, //  分期金额
      downPaymentAmount, //  首付金额
      commissionRate, //  佣金比例
      feeRatio, //  手续费比例
      installmentCount, //  分期数
    } = this.data;
    const loanAmount = Number(util.accSub(instalmentAmount, downPaymentAmount)).toFixed(2); //  分期贷款金额
    const estimatedCommissionAmount = Number(util.accDiv(util.accMul(loanAmount, commissionRate), 100)).toFixed(2); //  预估佣金金额
    const procedureFeeAmount = Number(util.accDiv(util.accMul(loanAmount, feeRatio), 100)).toFixed(2); //  手续费金额
    const excludeProcedureFeeLoanAmount = Number(util.accSub(loanAmount, procedureFeeAmount)).toFixed(2); //  扣费后贷款金额
    const monthlyPayAmount = Number(util.accDiv(loanAmount, installmentCount)).toFixed(2); //  月供金额
    this.setData({
      loanAmount,
      estimatedCommissionAmount,
      procedureFeeAmount,
      excludeProcedureFeeLoanAmount,
      monthlyPayAmount,
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
      list: 'installmentDetailList',
      index: itemIndex,
    })
    wx.navigateBack({
      delta: Number(delta),
    })
  },
  // 确定
  tapOk: function() {
    let {
      installmentId,
      installmentName,
      businessId,
      businessName,
      instalmentAmount,
      downPaymentAmount,
      loanAmount,
      commissionRate,
      feeRatio,
      estimatedCommissionAmount,
      procedureFeeAmount,
      excludeProcedureFeeLoanAmount,
      contractNo,
      phoneImei,
      installmentCount,
      monthlyPayAmount,
      remark,
      totalAmount,
      state, //状态： 0：新增  1 查看（修改）
      itemIndex, //集合索引
      installmentDetailList, //集合
      addPage,
      delta,
    } = this.data;
    if (installmentId === '') {
      this.showToptips({
        text: "请选择分期业务往来单位"
      })
      return;
    }
    if (businessId === '') {
      this.showToptips({
        text: "请选择分期业务业务名称"
      })
      return;
    }

    if (Number(instalmentAmount) > Number(totalAmount)) {
      this.showToptips({
        text: "分期金额不能大于可供分期金额！"
      })
      return;
    }

    if (Number(downPaymentAmount) >= Number(instalmentAmount)) {
      this.showToptips({
        text: "首付金额必须小于分期金额！"
      })
      return;
    }

    //新增
    if (state === '0') {
      installmentDetailList.push({
        installmentId,
        installmentName,
        businessId,
        businessName,
        instalmentAmount,
        downPaymentAmount,
        loanAmount,
        commissionRate,
        feeRatio,
        estimatedCommissionAmount,
        procedureFeeAmount,
        excludeProcedureFeeLoanAmount,
        contractNo,
        phoneImei,
        installmentCount,
        monthlyPayAmount,
        remark,
      })
    }
    //修改
    else {
      if (itemIndex < 0) {
        this.showToptips({
          text: "分期业务索引小于0，参数有误！"
        })
        return;
      }
      installmentDetailList[itemIndex] = {
        installmentId,
        installmentName,
        businessId,
        businessName,
        instalmentAmount,
        downPaymentAmount,
        loanAmount,
        commissionRate,
        feeRatio,
        estimatedCommissionAmount,
        procedureFeeAmount,
        excludeProcedureFeeLoanAmount,
        contractNo,
        phoneImei,
        installmentCount,
        monthlyPayAmount,
        remark,
      };
    }
    addPage.setData({
      installmentDetailList,
    })
    wx.navigateBack({
      delta: Number(delta),
    })
  },
  //往来单位
  getInstallmentContactUnitVoList: function() {
    const that = this;
    util.request(api.getInstallmentContactUnitVoList).then(res => {
      that.setData({
        installmentContactUnitList: res.data.dataList
      })
    });
  },
  //业务名称
  getInstallmentVoList: function() {
    const that = this;
    const {
      installmentId,
    } = this.data;
    const postData = {
      contactUnitId: installmentId,
    };
    util.request(api.getInstallmentVoList, postData).then(res => {
      that.setData({
        businessNameList: res.data.dataList
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
          installmentDetailList,
          allTotalAmount,
          depositAmount,
        } = addPage.data;
        this.setData({
          sectionId,
          installmentDetailList,
          totalAmount: util.accSub(allTotalAmount, depositAmount),
        });

        if (state === '1' && itemIndex > -1) {
          const detailItem = installmentDetailList[itemIndex]

          const {
            installmentId,
            installmentName,
            businessId,
            businessName,
            instalmentAmount,
            downPaymentAmount,
            loanAmount,
            commissionRate,
            feeRatio,
            estimatedCommissionAmount,
            procedureFeeAmount,
            excludeProcedureFeeLoanAmount,
            contractNo,
            phoneImei,
            installmentCount,
            monthlyPayAmount,
            remark,

          } = detailItem
          this.setData({
            lastInstallmentId: installmentId,
            installmentId,
            installmentName: installmentName || '请选择',
            lastBusinessId: businessId,
            businessId,
            businessName: businessName || '请选择',
            instalmentAmount,
            downPaymentAmount,
            loanAmount,
            commissionRate,
            feeRatio,
            estimatedCommissionAmount,
            procedureFeeAmount,
            excludeProcedureFeeLoanAmount,
            contractNo,
            phoneImei,
            installmentCount,
            monthlyPayAmount,
            remark,
          });
        }
      }
    }

  },
})