//External Lib Import
const httpStatus = require('http-status')
const createPayment = require('../action/createPayment')
const executePayment = require('../action/executePayment')

//Internal Lib Import
const { ShunnoITinvoice, Store } = require('../models')
const ApiError = require('../utils/ApiError')

const monthlyServicesCharge = async (storeID) => {
  const findStore = await Store.findById(storeID)
  if (!findStore) throw new ApiError(httpStatus.NOT_FOUND, 'No store found')

  return await ShunnoITinvoice.findOne({
    $and: [{ store: storeID }, { status: 'unpaid' }, { type: 'monthlyServiceCharge' }],
  })
}

const listInvoice = async (storeID) => {
  const findStore = await Store.findById(storeID)
  if (!findStore) throw new ApiError(httpStatus.NOT_FOUND, 'No store found')

  return await ShunnoITinvoice.find({ store: storeID }).sort({ _id: -1 })
}

const invoiceDelete = async (storeID, invoiceID) => {
  const findStore = await Store.findById(storeID)
  if (!findStore) throw new ApiError(httpStatus.NOT_FOUND, 'No store found')

  const findInvoice = await ShunnoITinvoice.find({ _id: invoiceID, status: 'unpaid', store: storeID })
  if (!findInvoice.length > 0) throw new ApiError(httpStatus.NOT_FOUND, 'No invoice found')
  return await ShunnoITinvoice.findByIdAndDelete(invoiceID)
}

const invoiceCreatePayment = async (request) => {
  const { storeID, invoiceID } = request.params

  const findStore = await Store.findById(storeID)
  if (!findStore) throw new ApiError(httpStatus.NOT_FOUND, 'No store found')

  const createResult = await createPayment(request)

  if (createResult.transactionStatus === 'Initiated') {
    await ShunnoITinvoice.findByIdAndUpdate(invoiceID, {
      bkashPaymentID: createResult.paymentID,
      bkashTransactionStatus: createResult.transactionStatus,
      paymentMethod: 'bKashPG',
    })
  }

  return createResult
}

const invoicePaid = async (request) => {
  const { storeID, invoiceID, paymentID } = request.params
  request.query.paymentID = paymentID

  const findStore = await Store.findById(storeID)
  if (!findStore) throw new ApiError(httpStatus.NOT_FOUND, 'No store found')

  const bkashCallbackResult = await executePayment(request)

  if (bkashCallbackResult.transactionStatus === 'Completed') {
    const updatedShunnoITinvoice = await ShunnoITinvoice.findByIdAndUpdate(
      invoiceID,
      {
        transactionID: bkashCallbackResult.paymentID,
        bkashTransactionStatus: bkashCallbackResult.transactionStatus,
        bkashTransactionID: bkashCallbackResult.trxID,
        bkashCustomerMsisdn: bkashCallbackResult.customerMsisdn,
        status: 'paid',
        paidAt: new Date(),
      },
      { new: true }
    )

    if (updatedShunnoITinvoice.type === 'smsPurchase') {
      if (updatedShunnoITinvoice.smsPurchaseType === 'masking') {
        await Store.findByIdAndUpdate(storeID, {
          $inc: { 'HNSettings.sms.maskingSmsBalance': updatedShunnoITinvoice.numberOfSms },
        })
      } else if (updatedShunnoITinvoice.smsPurchaseType === 'nonMasking') {
        await Store.findByIdAndUpdate(storeID, {
          $inc: { 'HNSettings.sms.nonMaskingSmsBalance': updatedShunnoITinvoice.numberOfSms },
        })
      } else if (updatedShunnoITinvoice.smsPurchaseType === 'fixedNumber') {
        await Store.findByIdAndUpdate(storeID, {
          $inc: { 'HNSettings.sms.fixedNumberSmsBalance': updatedShunnoITinvoice.numberOfSms },
        })
      }
    }

    return updatedShunnoITinvoice
  }

  return bkashCallbackResult
}

module.exports = {
  monthlyServicesCharge,
  listInvoice,
  invoiceDelete,
  invoiceCreatePayment,
  invoicePaid,
}
