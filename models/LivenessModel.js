
module.exports = class Liveness {
  static async updateAccessToken(cb){
    livenessService.updateAccessToken(response => {
      cb(response)
    })
  }
  static async requestAnalize(image, type, cb) {
    livenessService.requestAnalyze(image, type, response => {
      if(response.status === 'requested'){
        cb({status: 200, data: response.details})
      } else {
        cb({status: 400, data: response.details})
      }
    })
  }

  static async checkAnalyze(analyse_id, cb) {
    livenessService.checkAnalyze(analyse_id, response => {
      if(response.status === 'ok') {
        cb({ status: 200, data: response.details })
      } else {
        console.log('check ERROR: ', response)
        cb({ status: response.status, data: response.details })
      }
    })
  }
}
