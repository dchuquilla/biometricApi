const ErrorHandler = require('./lib/ErrorHandler')
const tools = require('./tools/tools')

global.express = require('express')
global.fs = require('fs')
global.path = require('path')
global.request = require('request')
global.crypto = require('crypto-js')
global.FormData = require('form-data')

global.env = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, './env.json'), 'utf8')
)
console.log('ENV Config Loaded')

// Data preloaded from db
global.firebase = require('firebase')
global.config = {}
global.productsDb = {}
global.accountsDb = {}
global.livenessService = require('./services/ozForensics')

global._ = require('underscore')

// AWS artifacts
global.awsBase64 = require('@aws-sdk/util-base64-node')

////tools
global.transactions = require('./services/transactions')
global.tools = require('./tools/tools')
global.mailer = {
  'mailgun': require('./tools/mailgun'),
  'sendgrid': require('./tools/mailgun')
}
global.fetch = require('node-fetch')
global.uid = 'na'

//init Firebase DB
global.fbAgent = require('./tools/firebase/initdb')
global.fbRef = firebase.database().ref()

global.app = express();
global.bodyParser = require('body-parser');



app.use('/', require('./routes/app-routes'))
app.use('/files', express.static(path.join(__dirname, 'public')))

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    uid = user.uid
    console.log(`Logged in to firebase uid: ${uid}`)
    setTimeout(function () {
      //load app config from db
      fbAgent.loadAppConfig()
      fbAgent.loadProducts()
      fbAgent.loadAccounts()
      setTimeout(function () {
        tools.sendBootAlert()
        app.listen(env.port, console.log('Server started at port: ' + env.port))
      }, 1000)
    }, 2000)
  } else {
    // User is signed out login again
    console.log('Session expired')
    fbAgent.loginTofirebase()
  }
})
