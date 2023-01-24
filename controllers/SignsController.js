const { match } = require('./../services/signatures')

module.exports = class SingsController {
  static async match (req, res, next, keyObject) {
    match(
      req.body.source,
      req.body.target
    ).then(
      resolve => {
        console.log("signs resolve", resolve)
        transactions.logTrans({
          status: 'new',
          user: keyObject.user,
          account: keyObject.account,
          productCode: 'p5',
          response: resolve,
          userRef: req.body.userRef,
          input: req.body.source
        })
        res.json({status: 200, msg: 'ok', details: {score: resolve}}).end()
      },
      reject => {
        transactions.logTrans({
          status: 'err',
          user: keyObject.user,
          account: keyObject.account,
          productCode: 'p5',
          response: resolve,
          userRef: req.body.userRef,
          input: req.body.source
        })
        res.status(400).json({status: 400, msg: reject}).end()
      }
    )
  }
}
