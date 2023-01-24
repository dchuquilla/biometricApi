module.exports = class App {
  static async ping(req, res, keyObject) {
    res.status(200).send(`pong ${new Date()}`).end()
  }
}
