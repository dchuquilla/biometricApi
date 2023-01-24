const axios = require('axios')

module.exports = {
  updateAccessToken: cb => {
    const options = {
      method: 'post',
      url: `${env.ozUrl}/authorize/auth`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        credentials: {
          email: `${env.ozUser}`,
          password: `${env.ozPassword}`
        }
      })
    }

    axios(options)
      .then(response => {
        fbRef
          .child(`/config/OZ_ACCESS_TOKEN`)
          .set(response.data.access_token)
          .then(() => {
            console.log(`Successfully updated input in transaction`)
            cb({
              status: response.status,
              msg: 'Token updated',
              details: response.data
            })
          })
          .catch(error => {
            console.log('Error updating record input in transaction: ', error)
            cb({
              status: 400,
              msg: error.toString()
            })
          })
      })
      .catch(error => {
        console.log('getToken ERROR', error)
        cb({
          status: error.response.status,
          msg: error.response.data.error_message
        })
      })
  },

  requestAnalyze: (image, cb) => {
    const imagePath = tools.stringToFile(image, 'liveness', 'jpeg')
    tools.compressZip(imagePath, filePath => {
      const data = new FormData()
      data.append('payload', '{"media:tags":{"photo1":["video_selfie_blank"]}}')
      data.append(
        'photo1',
        fs.createReadStream(filePath),
        path.basename(filePath)
      )

      const options = {
        method: 'post',
        url: `${env.ozUrl}/folders`,
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Forensic-Access-Token': config.OZ_ACCESS_TOKEN,
          ...data.getHeaders()
        },
        data: data
      }

      axios(options)
        .then(uploadResponse => {
          console.log('uploadResponse: ', uploadResponse.data)
          // Upload completed, request analyze.
          analyzeOptions = {
            method: 'post',
            url: `${env.ozUrl}/folders/${uploadResponse.data.folder_id}/analyses`,
            headers: {
              'Content-Type': 'application/json',
              'X-Forensic-Access-Token': config.OZ_ACCESS_TOKEN
            },
            data: JSON.stringify({
              analyses: [
                {
                  type: 'QUALITY',
                  source_media: [uploadResponse.data.media[0].media_id]
                }
              ],
              params: {
                extract_best_shot: true,
                threshold_max: 0,
                threshold_min: 0,
                threshold_spoofing: 0
              }
            })
          }
          axios(analyzeOptions)
            .then(requestResponse => {
              console.log('requestResponse: ', requestResponse.data)
              cb({ status: 'requested', details: requestResponse.data[0] })
            })
            .catch(error => {
              console.log('requestError: ', error)
              cb({ status: 'error', details: error })
            })
        })
        .catch(error => {
          console.log('upload Error: ', error)
          cb({ status: 'error', details: error })
        })
    })
  },

  checkAnalyze: (analyze_id, cb) => {
    options = {
      method: 'get',
      url: `${env.ozUrl}/analyses/${analyze_id}`,
      headers: {
        'X-Forensic-Access-Token': config.OZ_ACCESS_TOKEN
      }
    }
    axios(options)
      .then(response => {
        console.log('Check response: ', response.data)
        cb({ status: 'ok', details: response.data })
      })
      .catch(error => {
        console.log('Chek ERROR: ', error)
        cb({ status: error.response.status, details: error.response.data })
      })
  }
}
