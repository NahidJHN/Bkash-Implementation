//External Import
const bkashRoutes = require('express').Router()
const passport = require('passport')

//Internal Lib Impot
const { auth } = require('../../middlewares/auth')
const { bkashController } = require('../../controller')
const bkashAuthorization = require('../../middlewares/bkashAuthorization')

//Bkash Create Payment
bkashRoutes.post(
  '/createPayment',
  bkashAuthorization,
  bkashController.checkout
)

//Bkash Cxecute Payment
bkashRoutes.post(
  '/executePayment',
  [passport.authenticate('jwt', { session: false }), auth(['proprietor', 'manager'])],
  bkashAuthorization,
  bkashController.bkashCallback
)

module.exports = bkashRoutes
