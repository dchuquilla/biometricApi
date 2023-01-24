const ParamNotFoundError = require('../lib/ParamNotFoundError')
const Dni = require('../models/DniModel')
const { putObject } = require('../services/awsS3')
const { detectText } = require('./../services/awsTextract')


module.exports = class DniController {
  static async ocr (req, res, next, keyObject) {
    const {image, userRef} = req.body

    if(!image) return next(new ParamNotFoundError('imagen'))
    if(!userRef) return next(new ParamNotFoundError('userRef'))

    detectText(image, ocrResponse => {
      const fileUid = tools.generateKey()
      const inputPath = `${keyObject.user.account}/textract/input-${fileUid}.jpeg`
      putObject(
        inputPath,
        tools.stringSingleImage(image),
        'image/jpeg',
        response => {}
      )

      if (typeof ocrResponse.status !== 200) {
        const params = {
          status: 'err',
          user: keyObject.user,
          productCode: 'p1',
          response: ocrResponse,
          userRef: userRef,
          input: inputPath
        }
        transactions.logTrans(params)
        return res.status(400).json(ocrResponse).end()
      } else {
        const params = {
          status: 'new',
          user: keyObject.user,
          productCode: 'p1',
          response: ocrResponse,
          userRef: userRef,
          input: inputPath
        }
        transactions.logTrans(params)
        return res.json(ocrResponse).end()
      }
    })
  }

  static async validate (req, res, next, keyObject) {
    console.log(req.body)
    const cedula = req.body.cedula
    const codigoDactilar = req.body.codigoDactilar
    try {
      Dni.fetchDni(cedula, codigoDactilar, (dni) => {
        transactions.logTrans({
          status: 'new',
          user: keyObject.user,
          account: keyObject.user.account,
          productCode: 'p4',
          response: dni,
          userRef: cedula,
          input: `${req.body.cedula} | ${req.body.codigoDactilar}`
        })
        if(dni.result) {
          return res.json({ status: 200, msg: 'ok', details: dni}).end()
        } else {
          return res.json({ status: 409, msg: dni.message }).end()
        }
      })
    } catch (error) {
      return res.status(400).json({status: 400, msg: error.message}).end()
    }
  }
}
