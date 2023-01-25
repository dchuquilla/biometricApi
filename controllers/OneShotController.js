const { rest } = require('underscore')
const oneShot = require('./../services/one_shot')
const axios = require('axios')

module.exports = class OneShotController {
  static async createSingRequest (req, res, next, keyObject) {
    res
      .json({status: 200, msg: 'ok', details: {message: 'La información se está procesando para generar la firma digital.'}})
      .end()

    let webHookOptions = {}
    oneShot.createRequest(req.body, response => {
      console.log('response: ', response)
      const responseStatus = parseInt(response.status)
      const responseDetails = response.details
      if (responseStatus === 201) {
        // go to next step
        oneShot.uploadDocuments(
          responseDetails,
          req.body.document,
          documentsResponse => {
            console.log('documentsResponse: ', documentsResponse)
            const documentStatus = documentsResponse.status
              ? parseInt(documentsResponse.status)
              : 400
            const documentDetails = documentsResponse.details
            if (documentStatus === 200) {
              // go to next step
              oneShot.retrieveContract(
                responseDetails,
                keyObject.user.account,
                contractResponse => {
                  oneShot.generateOTP(responseDetails, otpResponse => {
                    const otpStatus = otpResponse.status
                      ? parseInt(otpResponse.status)
                      : 400
                    const otpDetails = otpResponse.details

                    if (otpStatus === 200) {
                      // go to next step
                      webHookOptions = JSON.stringify({
                        op: 'os-request-completed',
                        requestId: responseDetails,
                        documentId: documentDetails,
                        line: req.body.line,
                        ref: req.body.ref,
                        apiToken: req.body.apiToken
                      })
                      console.log('webHookOptions: ', webHookOptions)
                      return axios({
                        method: 'post',
                        url: req.body.webhook,
                        headers: { 'Content-Type': 'application/json' },
                        data: webHookOptions
                      })
                        .then(response => console.log('bot hook response: [1]', response.data))
                        .catch(err => console.log('Bot hook error [1]: ', err))
                    } else {
                      webHookOptions = JSOPN.stringify({
                        op: 'os-error',
                        errorCode: otpStatus,
                        errorMsg: otpDetails,
                        line: req.body.line,
                        ref: req.body.ref,
                        apiToken: req.body.apiToken
                      })
                      return axios({
                        method: 'post',
                        url: req.body.webhook,
                        headers: { 'Content-Type': 'application/json' },
                        data: webHookOptions
                      })
                        .then(response => console.log('bot hook response: [2]', response.data))
                        .catch(err => console.log('Bot hook error [2]: ', err))
                    }
                  })
                  // go to next step
                }
              )
            } else {
              webHookOptions = JSON.stringify({
                op: 'os-error',
                errorCode: documentStatus,
                errorMsg: documentDetails,
                line: req.body.line,
                ref: req.body.ref,
                apiToken: req.body.apiToken
              })
              return axios({
                method: 'post',
                url: req.body.webhook,
                headers: { 'Content-Type': 'application/json' },
                data: webHookOptions
              })
                .then(response => console.log('bot hook response: [3]', response.data))
                .catch(err => console.log('Bot hook error [3]: ', err))
            }
          }
        )
      } else {
        webHookOptions = JSON.stringify({
          op: 'os-error',
          errorCode: responseStatus,
          errorMsg: responseDetails,
          line: req.body.line,
          ref: req.body.ref,
          apiToken: req.body.apiToken
        })
        console.log(responseDetails)
        return axios({
          method: 'post',
          url: req.body.webhook,
          headers: { 'Content-Type': 'application/json' },
          data: webHookOptions
        })
          .then(response => console.log('bot hook response: [4]', response.data))
          .catch(err => console.log('Bot hook error [4]: ', err))
      }
    })
  }

  static async signDocumentOtp (req, res, next, keyObject) {
    res.json({status: 200, msg: 'ok', details: {message: 'Estamos generando el documento firmado'}}).end()
    let webHookOptions = {}
    oneShot.signDocumentOtp(req.body, signResponse => {
      const signStatus = signResponse.status
        ? parseInt(signResponse.status)
        : 400
      const signDetails = signResponse.details

      if (signStatus === 200) {
        // go to retrieve signed document
        oneShot.retrieveDocuments(
          req.body.requestId,
          req.body.documents,
          keyObject.user.account,
          documentsResponse => {
            const documentsStatus = documentsResponse.status
              ? parseInt(documentsResponse.status)
              : 400
            const documentsDetails = documentsResponse.details
            if (documentsStatus === 200) {
              // Delete generated documents
              oneShot.deleteDocuments(req.body.requestId, deleteResponse => {
                console.log('deleteResponse: ', deleteResponse)
              })
              webHookOptions = JSON.stringify({
                op: 'os-signed-pdf',
                pdfURL: documentsDetails,
                line: req.body.line,
                ref: req.body.ref,
                apiToken: req.body.apiToken
              })
              console.log('webHookOptions', webHookOptions)
              return axios({
                method: 'post',
                url: req.body.webhook,
                headers: { 'Content-Type': 'application/json' },
                data: webHookOptions
              })
                .then(response => console.log('bot hook response: [5]', response.data))
                .catch(err => console.log('Bot hook error [5]: ', err))
            } else {
              webHookOptions = JSON.stringify({
                op: 'os-error',
                errorCode: documentsStatus,
                errorMsg: documentsDetails,
                line: req.body.line,
                ref: req.body.ref,
                apiToken: req.body.apiToken
              })
              console.log('webHookOptions', webHookOptions)
              return axios({
                method: 'post',
                url: req.body.webhook,
                headers: { 'Content-Type': 'application/json' },
                data: webHookOptions
              })
                .then(response => console.log('bot hook response: [6]', response.data))
                .catch(err => console.log('Bot hook error [6]: ', err))
            }
          }
        )
      } else {
        webHookOptions = JSON.stringify({
          op: 'os-error',
          errorCode: signStatus,
          errorMsg: signDetails,
          line: req.body.line,
          ref: req.body.ref,
          apiToken: req.body.apiToken
        })
        console.log('webHookOptions', webHookOptions)
        return axios({
          method: 'post',
          url: req.body.webhook,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webHookOptions)
        })
          .then(response => console.log('bot hook response: [7]', response.data))
          .catch(err => console.log('Bot hook error [7]: ', err))
      }
    })
  }

  static async retrieveDocument (req, res, next, keyObject) {
    oneShot.retrieveDocuments(
      req.body.requestId,
      req.body.documents,
      keyObject.user.account,
      documentsResponse => {
        const documentsStatus = documentsResponse.status
          ? parseInt(documentsResponse.status)
          : 400
        const documentsDetails = documentsResponse.details
        if (documentsStatus === 200) {
          res.json(documentsDetails).end()

        } else {
          res.status(documentsStatus).json({ errorMsg: documentsDetails })
        }
      }
    )
  }
}
