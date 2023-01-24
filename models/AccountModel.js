const { createAccount } = require("../services/accounts")

module.exports = class AccountsModel {
  constructor(account) {
    this.name = account.name
    this.status = account.status
    this.country = account.country
    this.tsc = Date.now()
    this.tsu = Date.now()
    this.products = account.products
  }

  static async create(account) {
    return new Promise((resolve, reject) => {
      const accountId = createAccount(account)
      if(accountId) {
        resolve(account)
      } else {
        reject("error")
      }
    })
  }
}
