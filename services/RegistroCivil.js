const { default: axios } = require('axios')

module.exports = {
  requestDni: async (number, dactilarCode, cb) => {
    const url = `${env.rcUrl}request`

    const data = JSON.stringify({
      apikey: env.rcApiKey,
      uid: env.rcUid,
      cedula: number,
      coddact: dactilarCode
    })

    const config = {
      method: 'POST',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip,deflate,compress'
      },
      data: data
    }

    axios(config)
      .then(rcResponse => {
        // console.log(rcResponse)
        cb(rcResponse)
      })
      .catch(err => {
        console.log('rcError', err)
        cb(err)
      })
  },

  retrieveDni: async (numero, cb)=> {
    console.log('retrieving DN from DB')
    try {
      fbRef
        .child(`/registro_civil/${numero}`)
        .once('value', (rcResponse) => {
          cb(rcResponse.val())
        })
    } catch (error) {
      cb(null)
    }
  },

  cacheRCResult: async (numero, dni) => {
    console.log('DNI to save', dni)
    return fbRef
    .child(`/registro_civil/${numero}`)
    .push(dni, function (error) {
      if (error) {
        //todo notify via email or wsp of push error
        //save to file
        console.error(error)
        fs.writeFileSync(
          path.resolve(__dirname, './../registro_civil/') +
            '/' +
            Date.now() +
            '.json',
          JSON.stringify(dni)
        )
      }
    })
  }
}
