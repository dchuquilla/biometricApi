module.exports = class OtpController {
  static async sendenOtp(req, res, next, keyObject) {
    const sendTo = req.body.to
    const sendFrom = req.body.from
    const subject = req.body.subject
    const body = req.body.body
    const channel = req.body.channel

    mailer[channel].sendEmail(sendFrom, sendTo, subject, body, null, (result) => {
      if(result.status === 'ok') {
        res.json({status: 200, msg: 'ok', details: {message: 'Email enviado'}}).end()
      } else {
        res.status(400).json({status: 400, msg: 'Email no envialdo'}).end()
      }
    })
  }
}
