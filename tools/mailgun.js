// MAILGUN WRAPPER
const formData = require('form-data')
const Mailgun = require('mailgun.js')
const mailgun = new Mailgun(formData)
const mg = mailgun.client({ username: 'api', key: env.MAILGUN_API_KEY })
const DOMAIN = env.MAILGUN_DOMAIN

module.exports = {
  sendEmail: function (from, to, subject, body, attachments, cb) {
    console.log(new Date(), 'Sending mailgun', from, to, subject)
    var arr = to.split(',')
    if (arr.length > 1) {
      var sendTo = arr.join(',')
    } else {
      var sendTo = to
    }

    const data = {
      from: from,
      to: sendTo,
      subject: subject,
      html: body
    }
    if (attachments) {
      data.attachment = attachments
    }
    //console.log (data)
    mg.messages
      .create(DOMAIN, data)
      .then(function (msg) {
        console.log(msg)
        if (cb) {
          cb({ status: 'ok', msg: 'Email sent' })
        }
      })
      .catch(function (err) {
        console.log(err)
        if (cb) {
          cb({ status: 'err', msg: 'error' })
        }
      })
  }
}
