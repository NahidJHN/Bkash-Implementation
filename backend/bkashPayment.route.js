const passport = require('passport')
// expressRouter
const router = require('express').Router()
//auth middleware
const { auth } = require('../../middlewares/auth')

//controllers
const bkashPaymentController = require('../../controller/bkashPayment.controller')

//Bkash Create Payment
router.post(
  '/createPayment',
  [passport.authenticate('jwt', { session: false }), auth(['proprietor', 'manager'])],
  bkashPaymentController.createPayment
)

//Bkash Cxecute Payment
router.post(
  '/executePayment/:paymentID',
  [passport.authenticate('jwt', { session: false }), auth(['proprietor', 'manager'])],
  bkashPaymentController.executePayment
)

//Bkash Query Payment
router.get('/queryPayment/:paymentID', bkashPaymentController.queryPayment)

//Bkash Void
router.get('/void/:paymentID', bkashPaymentController.queryVoid)

//Bkash Search Transaction
router.get('/searchTransaction/:trxID', bkashPaymentController.searchTransaction)

//Bkash Refund Transaction
router.post('/refundTransaction', bkashPaymentController.refundTransaction)

//Bkash Refund Status
router.post('/refundStatus', bkashPaymentController.refundStatus)

module.exports = router
