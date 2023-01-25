const { default: axios } = require('axios')
const { putObject } = require('./awsS3')
const qr = require('qr-image')

module.exports = {
  createRequest: (person, cb) => {
    const formData = new FormData()

    const docFrontPath = tools.stringToFile(person.document_front, 'oneshot')
    const docRearPath = tools.stringToFile(person.document_rear, 'oneshot')
    const docOwnerPath = tools.stringToFile(person.document_owner, 'oneshot')

    formData.append('mobile_phone_number', person.mobile_phone_number)
    formData.append('given_name', person.given_name)
    formData.append('surname_1', person.surname_1)
    if (person.surname_2) {
      formData.append('surname_2', person.surname_2)
    }
    formData.append('serial_number', person.serial_number)
    formData.append('email', person.email)
    formData.append(
      'document_front',
      fs.createReadStream(docFrontPath),
      path.basename(docFrontPath)
    )
    formData.append(
      'document_rear',
      fs.createReadStream(docRearPath),
      path.basename(docRearPath)
    )
    formData.append(
      'document_owner',
      fs.createReadStream(docOwnerPath),
      path.basename(docOwnerPath)
    )
    formData.append('id_document_type', env.OneShotIdDocumentType)
    formData.append('id_document_country', env.OneShotIdDocumentCountry)
    formData.append('registration_authority', env.OneShotRegistrationAuthority)
    formData.append('token', env.OneShotToken)
    formData.append('profile', env.OneShotProfile)
    formData.append('username', env.OneShotUsername)
    formData.append('password', env.OneShotPassword)
    formData.append('pin', env.OneShotPin)
    formData.append('env', env.OneShotEnv)
    if (env.OneShotEnv === 'test') {
      formData.append('billing_username', env.OneShotBillingUsername)
      formData.append('billing_password', env.OneShotBillingPassword)
    }

    const url = `${env.OneShotURL[env.OneShotEnv]}/request`
    const options = {
      method: 'POST',
      keepalive: true,
      timeout: 60000,
      body: formData
    }

    fetch(url, options)
      .then(res => res.json())
      .then(json => {
        cb(json)
      })
      .catch(err => {
        cb(err)
      })
      .finally(() => {
        fs.unlink(docFrontPath, err => {
          if (err) console.log('remove docFrontPath Error: ', err)
        })
        fs.unlink(docRearPath, err => {
          if (err) console.log('remove docRearPath Error: ', err)
        })
        fs.unlink(docOwnerPath, err => {
          if (err) console.log('remove docOwnerPath Error: ', err)
        })
      })
  },

  uploadDocuments: (signatureRequestId, documentB64, cb) => {
    const documentPath = tools.stringToFile(documentB64, 'osdocument', 'pdf')

    const formData = new FormData()
    formData.append(
      'file',
      fs.createReadStream(documentPath),
      path.basename(documentPath)
    )

    const url = `${
      env.OneShotURL[env.OneShotEnv]
    }/document/${signatureRequestId}`

    const options = {
      method: 'POST',
      keepalive: true,
      body: formData
    }

    fetch(url, options)
      .then(res => res.text())
      .then(text => {
        console.log(text)
        if(tools.isJsonString(text)) {
          cb(JSON.parse(text))
        } else {
          cb(text)
        }
      })
      .catch(err => {
        cb(err)
      })
      .finally(() => {
        fs.unlink(documentPath, err => {
          if (err) console.log('remove documentPath Error: ', err)
        })
      })
  },

  retrieveContract: (signatureRequestId, accountId, cb) => {
    fetch(`${env.OneShotURL[env.OneShotEnv]}/request/${signatureRequestId}`, {
      method: 'get'
    })
      .then(res => res.json())
      .then(json => {
        const url = `${
          env.OneShotURL[env.OneShotEnv]
        }/document/${signatureRequestId}/contract`

        fetch(url, { method: 'get' })
          .then(res => {
            return res.text()
          })
          .then(text => {
            putObject(
              `${accountId}/os-docs/${
                json.details.serial_number
              }/sa-${Date.now()}.pdf`,
              text,
              'application/pdf',
              response => {}
            )
            cb(text)
          })
          .catch(err => {
            cb(err)
          })
      })
      .catch(err => {
        cb({
          status: 400,
          details: `No se puede obtener informacion de firma digital -> ${err}`
        })
      })
  },

  generateOTP: (signatureRequestId, cb) => {
    const url = `${env.OneShotURL[env.OneShotEnv]}/otp/${signatureRequestId}`

    fetch(url, { method: 'POST' })
      .then(res => res.json())
      .then(json => {
        cb(json)
      })
      .catch(err => {
        cb(err)
      })
  },

  signDocumentOtp: (params, cb) => {
    // Create a QR code image for adding to PDF
    fetch(`${env.OneShotURL[env.OneShotEnv]}/request/${params.requestId}`, {
      method: 'get'
    })
      .then(res => res.json())
      .then(json => {
        const qr_code_stream = qr.image(
          `${json.given_name} ${json.surname_1}\n${json.serial_number}`,
          { type: 'png' }
        )
        // Upload image to sign request
        const formData = new FormData()
        formData.append('image', qr_code_stream, `qr-sign-${Date.now()}.png`)
        fetch(`${env.OneShotURL[env.OneShotEnv]}/image`, {
          method: 'POST',
          keepalive: true,
          body: formData
        })
          .then(res => res.json())
          .then(json1 => {
            console.log('upload qr image ', json1)
            if (parseInt(json1.status) === 200) {
              // Sign document with QR code
              const url = `${env.OneShotURL[env.OneShotEnv]}/sign/${
                params.requestId
              }`
              const document = params.documents[0]
              let documentOptions = {}
              const page = 0
              const x1 = 100
              const y1 = 100
              const width = 250
              const height = 60
              const position = [x1, y1, x1+width, y1+height]
              documentOptions[document] = {
                position: position.join(', '),
                page: page,
                image: json1.details
              }
              const options = {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  secret: params.secretOTP,
                  use_signature_text: true,
                  disable_ltv: true,
                  signature_format: {
                    text_format: [
                      'Firmado electrónicamente por: %(CN)s',
                      'Fecha: %(DATE)s UTC'
                    ],
                    date_format: '%Y/%m/%d %H:%M:%S',
                    timezone: 'America/Guayaquil'
                  },
                  options: documentOptions
                })
              }
              console.log('sign options: ', options)
              fetch(url, options)
                .then(res => res.json())
                .then(json2 => {
                  console.log(json2)
                  if (json2.details.status === 'Confirmation Code invalid') {
                    // resend OPT
                    const urlOtp = `${env.OneShotURL[env.OneShotEnv]}/otp/${
                      params.requestId
                    }`
                    fetch(urlOtp, { method: 'POST' })
                      .then(res => res.json())
                      .then(json => {
                        console.log('otpResponse', otpResponse)
                        cb({
                          status: 406,
                          details: 'Codigo enviado nuevamente'
                        })
                      })
                      .catch(err => {})
                  } else {
                    cb(json2)
                  }
                })
                .catch(err => {
                  console.log('sign doc err: ', err)
                  cb(err)
                })
            } else {
              cb({
                status: 400,
                details: `No se pudo cargar la imagen qr de la firma digital -> ${json1.details}`
              })
            }
          })
          .catch(err => {
            cb({
              status: 400,
              details: `No se pudo cargar la imagen qr de la firma digital -> ${err}`
            })
          })
      })
      .catch(err => {
        cb({
          status: 400,
          details: `No se pudo generar imagen QR de firma digital -> ${err}`
        })
      })
  },

  retrieveDocuments: async (
    signatureRequestId,
    documentsIds,
    accountId,
    cb
  ) => {
    fetch(`${env.OneShotURL[env.OneShotEnv]}/request/${signatureRequestId}`, {
      method: 'get'
    })
      .then(reqResponse => {
        const documentId = documentsIds.shift()
        const url = `${
          env.OneShotURL[env.OneShotEnv]
        }/document/${signatureRequestId}/signed/${documentId}`

        fetch(url, {
          method: 'get',
          headers: { }
        })
          .then(signedResponse => {
            if(signedResponse.status !== 200) {
              console.log(new Date(), 'Get PDF error', signedResponse.status)
              cb({ status: signedResponse.status, details: 'Get PDF error' })
            } else {
              const fileUid = tools.generateKey()
              const filePath = path.resolve(__dirname, `./../public/signed_${fileUid}.pdf`)
              const signedDocumentURI = `files/signed_${fileUid}.pdf`

              signedResponse.arrayBuffer().then(buffer => {
                fs.writeFile(filePath, Buffer.from(buffer), {}, (err, res) => {

                  if(err) {
                    cb({ status: signedResponse.status, details: err })
                  } else {
                    reqResponse.json().then(reqJson => {
                      const docKey = `${accountId}/os-docs/${reqJson.details.serial_number}/signed-${documentId}.pdf`
                      putObject(docKey, Buffer.from(buffer), 'application/pdf', s3Response => {
                      })
                    })
                    const signedDocURL = `${env.apiDomain}/${signedDocumentURI}`
                    cb({status: 200, details: signedDocURL})
                  }
                })
              })
            }
          })
          .catch(err => {
            console.error('Retrieve signed document Error: ', err)
            cb({ status: 409, details: err })
          })
      })
      .catch(err => {
        cb({
          status: 400,
          details: `No se pudo obtener la informacion de firma digital -> ${err}`
        })
      })
  },

  deleteDocuments: async (signatureRequestId, cb) => {
    fetch(`${env.OneShotURL[env.OneShotEnv]}/documents/${signatureRequestId}`, {
      method: 'DELETE'
    })
      .then(res => res.json())
      .then(json => {
        return json
      })
      .catch(err => {
        cb({
          status: 400,
          details: `No se borraron los documentos -> ${err}`
        })
      })
  }
}
