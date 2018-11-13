//开单相关的服务
import util from '../utils/util.js'
import api from '../config/api.js'
import reg from '../config/reg.js';

// 查询草稿单
function getRetailDraftOrderVo(billsId) {
  return new Promise(function(resolve, reject) {
    util.request(
      api.getRetailDraftOrderVo, {
        billsId,
      },
    ).then(res => {
      resolve(res)
    }).catch((err) => {
      reject(err);
    })
  })
}

function saveAndPostDraftRetailVo(saveData,callback) {
  return new Promise(function(resolve, reject) {
    const {
      sectionId,
      addPage,
      remark,
      ignoredAmount,
      totalAmount,
      integralDeductionAmount,
      dataVo,
      onlinePayFlag,
      scanPayVo
    } = saveData;

    const {
      vipVo,
      goodsVo,
      billsId,
      contactUnitId,
      allTotalAmount,
      depositDetailList,
      operatorDetailList,
      addServiceDetailList,
      thirdPartyDetailList,
      installmentDetailList,
    } = addPage.data;


    const goodsDetailList = [];
    const paymentReceivedOrderVo = {
      "detailList": []
    };
    if (Array.isArray(goodsVo)) {
      const abc = (goodItem, goodIndex, giftIndex) => {
        let orderNo = '';
        if (goodIndex >= 0) {
          orderNo += (goodIndex + 1)
        }

        if (giftIndex >= 0) {
          orderNo += '.' + (giftIndex + 1)
        }
        return {
          "orderNo": orderNo,
          "giftFlag": goodItem.isGift == 1 ? 1 : 0,
          "storageId": goodItem.storageId,
          "goodsId": goodItem.goodsId,
          "imeiId": goodItem.imeiId,
          "goodsNumber": goodItem.goodsNumber,
          "retailPrice": goodItem.retailPrice,
          "discountRate": goodItem.discountRate,
          "discountedPrice": goodItem.discountedPrice,
          "discountedAmount": goodItem.discountedAmount,
          "remark": goodItem.remark,
        }
      };
      for (let i = 0; i < goodsVo.length; i++) {
        const goodItem = goodsVo[i];
        goodsDetailList.push(abc(goodItem, i));
        if (Array.isArray(goodItem.giftList)) {
          for (let j = 0; j < goodItem.giftList.length; j++) {
            const giftItem = goodItem.giftList[j];
            goodsDetailList.push(abc(giftItem, i, j));
          }
        }
      }
    }
    if (dataVo) {
      for (let keyItem in dataVo) {
        const dataList = dataVo[keyItem];
        for (let i = 0; i < dataList.length; i++) {
          const dataItem = dataList[i]
          if (dataItem.amount != undefined && dataItem.amount != "") {
            paymentReceivedOrderVo.detailList.push({
              "accountId": dataItem.accountId,
              "accountType": dataItem.accountType,
              "amount": dataItem.amount
            })
          }
        }
      }
    }
    const addData = {
      "sectionId": sectionId,
      "customerId": vipVo.customerId,
      "customerName": vipVo.customerName,
      "customerTelephone": vipVo.customerTelephone,
      "contactUnitId": contactUnitId,
      "scanPayVo": scanPayVo,
      "ignoredAmount": ignoredAmount,
      "totalAmount": totalAmount,
      "totalPayAmount": util.accSub(totalAmount, ignoredAmount),
      "shouldReceiveAmount": util.accSub(totalAmount, ignoredAmount),
      "integralDeductionAmount": integralDeductionAmount,
      "onlinePayFlag": onlinePayFlag,
      "remark": remark,
      "goodsDetailList": goodsDetailList,
      "paymentReceivedOrderVo": paymentReceivedOrderVo,
      depositDetailList,
      operatorDetailList,
      addServiceDetailList,
      thirdPartyDetailList,
      installmentDetailList,
      timestamp: new Date().getTime()
    };
    if (!!billsId) {
      addData.billsId = billsId;
    }
    const order = JSON.stringify(addData);
    //开单前的验证数据
    util.request(
      api.validateDraftRetailVoBeforePost, {
        order
      }
    ).then(res => {
      if (res.data.validateResult === 'Confirm') {
        wx.showModal({
          title: '提示',
          content: res.data.message,
          confirmColor: '#476EC9',
          success: function(res) {
            if (res.confirm) {
              if (callback){
                callback()
              }
              util.requestFly(
                api.saveAndPostDraftRetailVo, {
                  order
                 }).then(res => {
                   resolve(res)
                 }).catch(res => {
                   reject(false)
                 })
            } else if (res.cancel) {
              reject(false)
            }
          }
        })
      } else if (res.data.validateResult === 'Success') {
        if (callback) {
          callback()
        }
        util.requestFly(
          api.saveAndPostDraftRetailVo, {
            order
           }).then(res => {
             resolve(res)
           }).catch(res => {
             reject(false)
           })
      } else if (res.data.validateResult === 'Error') {
        wx.showModal({
          title: '提示',
          showCancel:false,
          confirmColor:'#476EC9',
          content: res.data.message,
          success: function (res) {
         
          }
        })
        reject(false)
      }
    }).catch(res => {
      reject(false)
    })
  })
}

module.exports = {
  getRetailDraftOrderVo,
  saveAndPostDraftRetailVo
};