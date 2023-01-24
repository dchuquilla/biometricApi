module.exports = class ErrorHandler {
  constructor () {
    this.handleError = this.handleError.bind(this)
  }

  static handleError (err, req, res, next) {
    console.log(err.msg)
    res.status(409).json({ error: 'Internal server error' }).end()
    return next()
  }
}
