const { pushEvidence } = require('./../tools/evidences')
const { pushJob } = require('./../tools/jobs')
const { pushTrans } = require('./../tools/transactions')

module.exports = {
  logTrans: params => {
    const currentTime = Date.now()
    const newTrans = {
      account: params.user.account,
      prod: params.productCode,
      st: params.status,
      tsc: currentTime,
      userRef: params.userRef,
      price: 0.00,
      user: params.user.id
    }
    const transCreated = pushTrans(`/${params.user.account}`, newTrans)

    if(!transCreated) return null

    const newJob = {
      type: 'update-stats',
      trans: transCreated.key,
      prod: params.productCode,
      st: 'new',
      tsc: currentTime,
      account: params.user.account,
      user: params.user.id
    }
    const jobCreated = pushJob('', newJob)

    const newEvidence = {
      trans: transCreated.key,
      input: params.input,
      response: JSON.stringify(params.response),
      tsc: currentTime
    }
    const evidenceCreated = pushEvidence(
      `/${params.user.account}`,
      newEvidence
    )
    return {transaction: transCreated.key, job: jobCreated.key, evidence: evidenceCreated.key}
  }
}
