const router = express.Router()
const cors = require('cors')

const apiAuth = require('./../services/apiAuth')
const appController = require('./../controllers/AppController')
const dniController = require('./../controllers/DniController')
const facesController = require('./../controllers/FacesController')
const livenessController = require('./../controllers/LivenessController')
const SingsController = require('../controllers/SignsController')
const AccountsController = require('../controllers/AccountsController')
const OtpController = require('../controllers/otpController')
const OneShotController = require('../controllers/OneShotController')

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  )
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET')
    return res.status(200).json({})
  }
  next()
})

router.get('/ping', appController.ping)

router.post('/dni-ocr', apiAuth.validateKey(dniController.ocr))
router.post('/dni-validate', apiAuth.validateKey(dniController.validate))
router.post('/compare-faces', apiAuth.validateKey(facesController.compare))
router.post('/liveness/request', apiAuth.validateKey(livenessController.request))
router.post('/liveness/check', apiAuth.validateKey(livenessController.check))
router.post('/liveness/update-token', apiAuth.validateKey(livenessController.updateAccessToken))
router.post('/signatures-match', apiAuth.validateKey(SingsController.match))
router.post('/account', apiAuth.validateKey(AccountsController.create))
router.post('/send-otp', apiAuth.validateKey(OtpController.sendenOtp))
router.post(
  '/create-sign-request',
  apiAuth.validateKey(OneShotController.createSingRequest)
)
router.post(
  '/sign-document-otp',
  apiAuth.validateKey(OneShotController.signDocumentOtp)
)
router.get(
  '/retrieve-document',
  apiAuth.validateKey(OneShotController.retrieveDocument)
)


module.exports = router
