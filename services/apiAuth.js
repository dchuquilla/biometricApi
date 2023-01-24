module.exports = {
  validateKey: action => {
    return (req, res, next) => {
      let keyObject = {
        isValid: false,
        msg: 'api key not supplied',
        user: null
      }
      const ref = firebase.database().ref()
      const token = req.get('x-nexxit-key')

      console.log(`Validate token: ${token}`)
      if (typeof token === 'undefined') {
        sendInvalidKey(next, error)
        return
      }

      const refToken = ref.child('/tokens/' + token)
      refToken
        .once('value', function (respToken) {
          var token = respToken.val()
          if (token) {
            if (token.status == 'valid') {
              const refUser = ref.child('/users/' + token.user)
              refUser
                .once('value', function (respUser) {
                  const user = respUser.val()
                  if (user) {
                    if (user.status == 'active') {
                      const refAccount = ref.child('/accounts/' + user.account)
                      refAccount.once('value', function(respAccount){
                        const account = respAccount.val()
                        if(account) {
                          keyObject.msg = 'apikey-user-ok'
                          keyObject.isValid = true
                          user.id = token.user
                          keyObject.user = user
                          keyObject.account = account
                          action(req, res, next, keyObject)
                        } else {
                          error = {code: 403, msg: 'user account not defined'}
                          sendInvalidKey(next, error)
                        }
                      })
                    } else {
                      error = {code: 403, msg: 'user-inactive'}
                      sendInvalidKey(next, error)
                    }
                  } else {
                    error = {code: 403, msg: 'user-not-found'}
                    sendInvalidKey(next, error)
                  }
                })
                .catch(function (err) {
                  console.error(JSON.stringify(err, null, 2))
                  error = {code: 403, msg: 'db-error'}
                  sendInvalidKey(next, error)
                })
            } else {
              error = {code: 403, msg: 'invalid-apikey'}
              sendInvalidKey(next, error)
            }
          } else {
            error = {code: 403, msg: 'invalid-apikey'}
            sendInvalidKey(next, error)
          }
        })
        .catch(function (err) {
          console.error(JSON.stringify(err, null, 2))
          error = {code: 403, msg: 'db-error'}
          sendInvalidKey(next, error)
        })
    }
  }
}

// Response for invalid keys
const sendInvalidKey = (res, error) => {
  res.status(error.code).send(error.msg).end()
}
