global.fs = require('fs')
global.path = require('path')
global.env = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, './env.json'), 'utf8')
)
console.log('ENV Config Loaded')
// Data preloaded fron db
global.firebase = require('firebase')
global.config = {}
global.productsDb = {}
global.accountsDb = {}
// END data preloaded
global._ = require('underscore')
var http = require('http')
var https = require('https')
var qs = require('querystring')
var HttpCors = require('http-cors')
var cors = new HttpCors()

// AWS artifacts
global.awsBase64 = require('@aws-sdk/util-base64-node')
const awsTextract = require('./services/awsTextract')
const awsRekognition = require('./services/awsRekognition')

////tools
global.tools = require('./tools/tools')
global.mailer = require('./tools/mailgun')
global.jobs = require('./tools/jobs')
global.textract = require('./services/awsTextract')
global.rekognition = require('./services/awsRekognition')
global.fetch = require('node-fetch')

global.uid = 'na'
var booted = false

//init DB
const fbInit = require('./tools/firebase/initdb');
global.fbRef = firebase.database().ref();

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    uid = user.uid
    console.log('Logged in to firebase')
    setTimeout(function () {
      bootBot()
    }, 2000)
  } else {
    // User is signed out login again
    console.log('Session expired')
    fbInit.loginTofirebase()
  }
})


function bootBot () {
  if (!booted) {
    booted = true

    //load app config from db
    loadAppConfig();
    loadProducts();
    loadAccounts();

    //start HTTP Server
    setTimeout(function () {
      sendBootAlert()
      if (!env.ssl) {
        http.createServer(app).listen(env.port)
        console.log('Nexxit API started on port', env.port)
      } else {
        var httpsOptions = {
          cert: fs.readFileSync(
            '/etc/letsencrypt/live/' + env.apiDomain + '/fullchain.pem'
          ),
          ca: fs.readFileSync(
            '/etc/letsencrypt/live/' + env.apiDomain + '/chain.pem'
          ),
          key: fs.readFileSync(
            '/etc/letsencrypt/live/' + env.apiDomain + '/privkey.pem'
          ),
          requestCert: false,
          rejectUnauthorized: false
        }

        // https.createServer(httpsOptions, app).listen(env.port);
        console.log('Nexxit SSL API Server started on env.port', env.port)
      }
    }, 1000)
  }
}

function sendBootAlert () {
  //todo, will need an API for nexxit chatbot
  var body = 'Nexxit API Started ' + new Date()
  // send email with nexxit credentials
  // mailer.sendEmail("ops", "dario@nexxit.dev", "Nexxit OPS Status", body, null, function(res){});
}

function loadAppConfig () {
  const refConfig = fbRef.child('/config/')
  refConfig.on('value', function (resp) {
      if (resp.val()) {
        config = resp.val()
        console.log(new Date(), 'App config loaded');
        global.textractClient = awsTextract.getTextractClient();
        global.rekognitionClient = awsRekognition.getRekognitionClient()
      }
    })
}

function loadProducts(){
  const refProducts = fbRef.child('/products/');
  refProducts.on('value', (respProducts) => {
    let products = respProducts.val();
    if (products) {
      console.log(new Date(), 'productsDB loaded');
      productsDb = products;
    }
  });
}

function loadAccounts(){
  const refAccounts = fbRef.child('/accounts/');
  refAccounts.on('value', (respAccounts) => {
    let accounts = respAccounts.val();
    if (accounts) {
      console.log(new Date(), 'accountsDB loaded');
      accountsDb = accounts;
    }
  });
}

//API
function processRequest (req, res, callback) {
  var queryData = ''
  if (typeof callback !== 'function') return null

  req.on('data', function (data) {
    queryData += data
    if (queryData.length > 1000000) {
      queryData = ''
      res.writeHead(413, { 'Content-Type': 'text/plain' }).end()
      req.connection.destroy()
    }
  })

  req.on('end', function () {
    if (req.method == 'GET') {
      req.post = qs.parse(req.url.replace(/^.*\?/, ''))
    } else {
      req.post = queryData
    }
    callback()
  })
}

var app = function (req, res) {
  if (cors.apply(req, res)) {
    res.end()
  }

  if (req.method == 'GET' || req.method == 'POST') {
    processRequest(req, res, function () {
      console.log(`req.url: ${req.url}`);
      var parts = req.url.split('/')
      console.log(`URL Parts: ${JSON.stringify(parts, null, 2)}`)
      if (parts[1] == 'ping') {
        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.write('pong ' + new Date())
        res.end()
      } else {
        //validate api key
        if (!req.headers['x-nexxit-key']) {
          //400 - Bad Request
          console.log(new Date(), '400 - Bad Request ' + req.url)
          res.writeHead(400, { 'Content-Type': 'text/plain' })
          res.write('no-apikey')
          res.end()
          return
        }
        validateApiKey(req.headers['x-nexxit-key'], function (keyOb) {
          if (!keyOb.isValid) {
            res.writeHead(401, { 'Content-Type': 'text/plain' })
            res.write(keyOb.msg)
            res.end()
            return
          }
          //router
          switch (parts[1]) {

            case 'dni-ocr':
              if (req.method == 'POST') {
                params = JSON.parse(req.post);
                textract.detectText(params, (response) => {

                  // TODO save transaction.
                  if(typeof response === 'string') {
                    logTrans({status: "err", user: keyOb.user, productCode: "p1", response})
                    res.writeHead(400, { 'Content-Type': 'text/plain' })
                    res.write(response)
                    res.end()
                  } else {
                    logTrans({status: "new", user: keyOb.user, productCode: "p1"})
                    res.writeHead(200, { 'Content-Type': 'text/plain' })
                    res.write(`TTR: ${JSON.stringify(response)}`)
                    res.end()
                  }
                });
              } else {
                //method not allowed
                console.log(
                  new Date(),
                  'method not allowed ' + req.url,
                  req.method
                )
                res.writeHead(405, { 'Content-Type': 'text/plain' })
                res.write('Method not allowed ' + req.method)
                res.end()
              }

              break

            case 'compare-faces':
              if (req.method == 'POST') {
                params = JSON.parse(req.post);
                rekognition.compareFaces(params, (response) => {

                  if(typeof response === 'string') {
                    logTrans({status: "err", user: keyOb.user, productCode: "p2", response})
                    res.writeHead(400, { 'Content-Type': 'text/plain' })
                    res.write(response)
                    res.end()
                  } else {
                    logTrans({status: "new", user: keyOb.user, productCode: "p2"})
                    res.writeHead(200, { 'Content-Type': 'text/plain' })
                    res.write(`CFR: ${JSON.stringify(response)}`)
                    res.end()
                  }
                });
              } else {
                //method not allowed
                console.log(
                  new Date(),
                  'method not allowed ' + req.url,
                  req.method
                )
                res.writeHead(405, { 'Content-Type': 'text/plain' })
                res.write('Method not allowed ' + req.method)
                res.end()
              }

              break

            default:
              console.log(new Date(), 'unknown path ' + req.url, req.method)
              res.writeHead(404, { 'Content-Type': 'text/plain' })
              res.write('Unknown Path ' + req.url)
              res.end()
          }
          //end router
        }) //end validate api key
      } // end ping
    }) //end process post
  }
}

const logTrans = (params) => {

  const trans = {
    "account": params["user"]["account"],
    "prod": params["productCode"],
    "pvp": 0.25,
    "st": params["status"],
    "tsc": Date.now(),
    "user": params["user"]["id"]
  }
  const newJob = {
    type: 'push-trans',
    trans: trans,
    st: 'new',
    tsc: Date.now()
  }
  jobs.pushJob('transOPs', newJob)
}

//token validation
