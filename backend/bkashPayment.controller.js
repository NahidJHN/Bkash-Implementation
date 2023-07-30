const axios = require('axios').default
const {
  BKASH_CHECKOUT_BASE_URL,
  BKASH_API_KEY,
  BKASH_API_SECRET,
  BKASH_PASSWORD,
  BKASH_USERNAME,
} = require('../config/keys')
const ShunnoITinvoice = require('../models/ShunnoITInvoice')
const ApiError = require('../utils/ApiError')
const catchAsync = require('../utils/catchAsync')

/**
 * @desc Bkash GrantToken
 * @access private
 */
const grantToken = async () => {
  const url = `${BKASH_CHECKOUT_BASE_URL}/token/grant`
  try {
    const response = await axios({
      url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
        username: BKASH_USERNAME,
        password: BKASH_PASSWORD,
      },
      data: JSON.stringify({
        app_key: BKASH_API_KEY,
        app_secret: BKASH_API_SECRET,
      }),
    })

    return response.data
  } catch (error) {
    console.log(error)
  }
}

/**
 * @desc Bkash Create Payment
 * @access public
 * @route /api/v1/bkash/createPayment
 * @methud POST
 */
const createPayment = catchAsync(async (req, res) => {
  const { amount, merchantInvoiceNumber } = req.body

  if (!amount || !merchantInvoiceNumber) {
    throw new ApiError(400, 'Invalid Data')
  }

  const { id_token } = await grantToken()

  const url = `${BKASH_CHECKOUT_BASE_URL}/payment/create`

  const response = await axios({
    url,
    method: 'POST',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${id_token}`,
      'X-APP-Key': BKASH_API_KEY,
      'content-type': 'application/json',
    },
    data: JSON.stringify({
      amount: Number(amount),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber,
    }),
  })
  const data = response.data
  res.json(data)
})

/**
 * @desc Bkash Execute Payment
 * @access public
 * @route /api/v1/bkash/executePayment/:paymentID
 * @methud POST
 */
const executePayment = catchAsync(async (req, res) => {
  const paymentID = req.params.paymentID

  if (!paymentID) {
    throw new ApiError(400, 'Invalid Data')
  }
  const { id_token } = await grantToken()

  const url = `${BKASH_CHECKOUT_BASE_URL}/payment/execute/${paymentID}`
  const response = await axios({
    url,
    method: 'POST',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${id_token}`,
      'X-APP-Key': BKASH_API_KEY,
      'content-type': 'application/json',
    },
  })

  const data = response.data

  if (data.errorCode) {
    throw new ApiError(400, data.errorMessage)
  }

  const invoice = await ShunnoITinvoice.findByIdAndUpdate(
    req.body.invoiceID,
    {
      status: 'paid',
      paymentMethod: 'bkash',
      paidAt: new Date(),
      tran_id: data.trxID,
    },
    { new: true }
  )
  res.json({ message: 'Payment Successfull', data: { invoice, data } })
})

/**
 * @desc Bkash Query Payment
 * @access public
 * @route /api/v1/bkash/queryPayment/:paymentID
 * @methud GET
 */
const queryPayment = catchAsync(async (req, res, next) => {
  const paymentID = req.params.paymentID

  if (!paymentID) {
    throw new ApiError(400, 'Invalid Data')
  }

  const { id_token } = await grantToken()

  const url = `${BKASH_CHECKOUT_BASE_URL}/payment/query/${paymentID}`
  const response = await axios(url, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${id_token}`,
      'X-APP-Key': BKASH_API_KEY,
    },
  })
  const data = response.data

  if (data.errorCode) {
    throw new ApiError(400, data.errorMessage)
  }

  res.json({ data: data })
})

/**
 * @desc Bkash Void
 * @access public
 * @route /api/v1/bkash/void/:paymentID
 * @methud GET
 */
const queryVoid = catchAsync(async (req, res, next) => {
  const paymentID = req.params.paymentID

  try {
    if (!paymentID) {
      throw new ApiError(400, 'Invalid Data')
    }

    const { id_token } = await grantToken()

    const url = `${BKASH_CHECKOUT_BASE_URL}/payment/void/${paymentID}`
    const response = await axios(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${id_token}`,
        'X-APP-Key': BKASH_API_KEY,
      },
    })
    const data = response.data

    if (data.errorCode) {
      throw new ApiError(400, data.errorMessage)
    }

    res.json({ data: data })
  } catch (error) {
    console.log(error)
    next(error)
  }
})

/**
 * @desc Bkash Search Transaction
 * @access public
 * @route /api/v1/bkash/searchTransaction/:trxID
 * @methud GET
 */
const searchTransaction = catchAsync(async (req, res, next) => {
  const trxID = req.params.trxID

  try {
    if (!trxID) {
      throw new ApiError(400, 'Invalid Data')
    }

    const { id_token } = await grantToken()

    const url = `${BKASH_CHECKOUT_BASE_URL}/payment/query/${trxID}`
    const response = await axios(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${id_token}`,
        'X-APP-Key': BKASH_API_KEY,
      },
    })
    const data = response.data

    if (data.errorCode) {
      throw new ApiError(400, data.errorMessage)
    }

    res.json({ data: data })
  } catch (error) {
    next(error)
  }
})

/**
 * @desc Bkash Payment Refund
 * @access public
 * @route /api/v1/bkash/refundTransaction
 * @methud POST
 */
const refundTransaction = catchAsync(async (req, res, next) => {
  const { amount, paymentID, trxID, sku, reason } = req.body
  if (!paymentID || !trxID || !amount || !sku || !reason) {
    throw new ApiError(400, 'Invalid Data')
  }
  const { id_token } = await grantToken()

  const url = `${BKASH_CHECKOUT_BASE_URL}/payment/refund`
  const response = await axios(url, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${id_token}`,
      'content-type': 'application/json',
      'X-APP-Key': BKASH_API_KEY,
    },
    body: JSON.stringify({
      paymentID,
      trxID,
      amount,
      sku,
      reason,
    }),
  })
  const data = response.data

  if (data.errorCode) {
    throw new ApiError(400, data.errorMessage)
  }

  res.json({ message: 'Payment Refund Successfull', data: data })
})

/**
 * @desc Bkash Refund Status
 * @access public
 * @route /api/v1/bkash/refundStatus
 * @methud POST
 */
const refundStatus = catchAsync(async (req, res, next) => {
  const { paymentID, trxID } = req.body

  if (!paymentID || !trxID) {
    throw new ApiError(400, 'Invalid Data')
  }

  const { id_token } = await grantToken()

  const url = `${BKASH_CHECKOUT_BASE_URL}/payment/refund`
  const response = await axios(url, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${id_token}`,
      'content-type': 'application/json',
      'X-APP-Key': BKASH_API_KEY,
    },
    body: JSON.stringify({
      paymentID,
      trxID,
    }),
  })
  const data = response.data

  if (data.errorCode) {
    throw new ApiError(400, data.errorMessage)
  }

  res.json({ data: data })
})

module.exports = {
  createPayment,
  executePayment,
  queryPayment,
  queryVoid,
  searchTransaction,
  refundTransaction,
  refundStatus,
}
