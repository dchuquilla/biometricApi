const Liveness = require('./../models/LivenessModel')

module.exports = class LivenessController {

  static async updateAccessToken (req, res, next, keyObject) {
    Liveness.updateAccessToken((response) => {
      // console.log("update Response", response)
      if(response.status === 200){
        res.json(response).end()
      } else {
        res.status(response.status).json(response).end()
      }
    })
  }

  static async request (req, res, next, keyObject) {
    let {image, userRef, type} = req.body
    type ||= 'selfie'
    Liveness.requestAnalize(image, type, (response) => {
      if(response.status === 200){
        const transaction = transactions.logTrans({
          status: 'new',
          user: keyObject.user,
          account: keyObject.user.account,
          productCode: 'p3',
          response: "pending",
          userRef: userRef,
          input: image
        })
        response.data["api_evidence"] = transaction.evidence
        res.json({status: 200, msg: 'ok', details: response.data})
      } else {
        res.status(response.status).json({status: response.status, msg: response.data.message})
      }
    })
  }

  static async check (req, res, next, keyObject) {
    Liveness.checkAnalyze(req.body.analyze_id, response => {
      if (response.status === 200) {
        if(response.data.state === 'FINISHED') {
          fbRef.child(`/evidences/${keyObject.user.account}/${req.body.api_evidence}/response`)
          .set(JSON.stringify(response.data))
          .then(() => {
            console.log(`Successfully updated input in transaction`)
          })
          .catch(error => {
            console.error('Error updating record input in transaction: ', error)
          })
        }
        res.json({ status: 200, msg: 'ok', details: response })
      } else {
        res
          .status(response.status)
          .json({ status: response.status, msg: response.data.error_message })
      }

    })
  }
}
