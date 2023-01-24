const admin = require('firebase-admin')
const { getRekognitionClient } = require('./../../services/awsRekognition')
const { getTextractClient } = require('./../../services/awsTextract')
const serviceAccount = require('./../../nexxit-92dd5-firebase-adminsdk-64imw-d59cce6829.json')

const firebaseConfig = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, './../../firebase-config.json'),
    'utf8'
  )
)
firebase.initializeApp(firebaseConfig)

// JOBS MODULE
module.exports = {
  initFirebase: () => {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://nexxit-92dd5-default-rtdb.firebaseio.com'
    })
  },

  loginTofirebase: () => {
    console.log('Login to firebase')
    firebase
      .auth()
      .signInWithEmailAndPassword(env.fbuser, env.fbpwd)
      .catch(function (error) {
        const errorCode = error.code
        const errorMessage = error.message
        console.log(`${errorCode}: ${errorMessage}`)
      })
  },

  loadAppConfig: () => {
    const refConfig = fbRef.child('/config/')
    refConfig.on('value', function (resp) {
      if (resp.val()) {
        global.config = resp.val()
        console.log(new Date(), 'App config loaded')
        global.textractClient = getTextractClient()
        global.rekognitionClient = getRekognitionClient()
      }
    })
  },

  loadProducts: () => {
    const refProducts = fbRef.child('/products/')
    refProducts.on('value', respProducts => {
      let products = respProducts.val()
      if (products) {
        console.log(new Date(), 'productsDB loaded')
        productsDb = products
      }
    })
  },

  loadAccounts: () => {
    const refAccounts = fbRef.child('/accounts/')
    refAccounts.on('value', respAccounts => {
      let accounts = respAccounts.val()
      if (accounts) {
        console.log(new Date(), 'accountsDB loaded')
        accountsDb = accounts
      }
    })
  },

  validateApiKey: (token, cb) => {
    const refToken = fbRef.child('/tokens/' + token)
    let keyOb = { isValid: false, msg: '', user: null }

    refToken
      .once('value', function (respToken) {
        var token = respToken.val()
        if (!token) {
          keyOb.msg = 'invalid-apikey'
          cb(keyOb)
        }

        if (token.status != 'valid') {
          keyOb.msg = 'invalid-apikey'
          cb(keyOb)
        }

        const refUser = fbRef.child('/users/' + token.user)
        refUser
          .once('value', function (respUser) {
            const user = respUser.val()
            if (!user) {
              keyOb.msg = 'user-not-found'
              cb(keyOb)
            }

            if (user.status != 'active') {
              keyOb.msg = 'user-inactive'
              cb(keyOb)
            }

            keyOb.msg = 'apikey-user-ok'
            keyOb.isValid = true
            user.id = respUser.key
            keyOb.user = user
            cb(keyOb)
          })
          .catch(function (err) {
            console.error(err)
            keyOb.msg = 'db-error'
            cb(keyOb)
          })
      })
      .catch(function (err) {
        console.log(err)
        keyOb.msg = 'db-error'
        cb(keyOb)
      })
  }
}
