//Internal Lib Import
const catchAsync = require('../utils/catchAsync')
const createPayment = require('../action/createPayment')
const executePayment = require('../action/executePayment')

/**
 * @desc bkash create payment
 * @access private
 * @route /api/v1/bkash/createPayment
 * @method POST
 */
const checkout = catchAsync(async (req, res) => {
  const createResult = await createPayment(req)
  res.json(createResult)
})

/**
 * @desc bkash execute payment
 * @access private
 * @route /api/v1/bkash/executePayment
 * @method GET
 */
const bkashCallback = catchAsync(async (req, res) => {
  const bkashCallbackResult = await executePayment(req)
  return res.json({ message: 'Payment Successfull', bkashCallbackResult })
})

module.exports = {
  checkout,
  bkashCallback,
}
