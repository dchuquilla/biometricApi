const { compareFaces } = require("../services/awsRekognition")

module.exports = class Faces {
  static async compare (req, res, next, keyObject) {
    compareFaces(req.body, response => {
      if (typeof response === 'string') {
        transactions.logTrans({
          status: 'err',
          user: keyObject.user,
          account: keyObject.account,
          productCode: 'p2',
          response: response,
          input: req.body.target,
          userRef: req.body.userRef
        })
        res.status(400).json({status: 400, msg: response}).end()
      } else {
        transactions.logTrans({
          status: 'new',
          user: keyObject.user,
          account: keyObject.account,
          productCode: 'p2',
          response: response,
          input: req.body.target,
          userRef: req.body.userRef
        })
        res.json({status: 200, msg: 'ok', details: response}).end()
      }
    })
  }
}
