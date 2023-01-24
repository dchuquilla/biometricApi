const AccountsModel = require("../models/AccountModel")
const ProductsModel = require("../models/ProductsModel")

module.exports = class AccountsController {
  static async create(req, res) {
    let account = new AccountsModel(req.body)
    account.products = ProductsModel.getBaseProducts()

    const {status, response} = await AccountsModel.create(account)
      .then(
        (resolve) => {
          return {status: 200, response: resolve}
        },
        (reject) => {
          return { status: 400, response: reject }
        }
      )
    console.log(status)
    console.log(response)

    res.status(status).json(response).end()
  }
}
