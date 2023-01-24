module.exports = {
  createAccount: params => {
    //console.log(`evidence: ${JSON.stringify(evidence, null, 2)}`)
    return fbRef.child('/accounts/').push(params, function (error) {
      if (error) {
        //todo notify via email or wsp of push error
        //save to file
        fs.writeFileSync(
          path.resolve(__dirname, './../accounts/') +
            '/' +
            Date.now() +
            '.json',
          JSON.stringify(evidence)
        )
        return null
      }
    })
  },

  updateProductCount: (account, productCode) => {
    fbRef
      .child('/accounts/' + account.uid + '/products/').orderByChild("code").equalTo(productCode)
      .once('value', function (resp) {
        console.log('updateProductCount', resp)
      })
  }
}
