// AWS textract WRAPPERS
const {
  TextractClient,
  AnalyzeDocumentCommand,
  FeatureType
} = require('@aws-sdk/client-textract')

module.exports = {
  // Call to AWS textract service and returns what it found of it.
  // @params:
  //   image: String
  // @return: Object AWS analyzed blocks of text found.
  detectText: async (image, cb) => {
    try {
      const document = tools.stringToBytes(image)
      const input = {
        Document: { Bytes: document },
        FeatureTypes: [FeatureType.FORMS, FeatureType.SIGNATURES]
      }
      const command = new AnalyzeDocumentCommand(input)
      return await textractClient
        .send(command)
        .then(data => {
          const confidences = data.Blocks.map(x => x.Confidence)
            .slice(1, -1)
            .sort()
          let keyValueCount = data.Blocks.map(x =>
            x.BlockType === 'KEY_VALUE_SET' ? x.BlockType : null
          ).filter(i => i).length
          const total = confidences.reduce((acum, val) => acum + val)
          const avg = total / confidences.length
          const med = confidences[parseInt(confidences.length / 2)]
          if (keyValueCount < 9) {
            return cb({
              status: 409,
              msg: 'Imagen no corresponde con un documento de identidad'
            })
          }
          if (med < 90) {
            // We assume it is not readable
            return cb({ status: 409, msg: 'imagen oscura no se puede leer' })
          } else if (avg < med - 20) {
            // We assumer it id blur
            return cb({ status: 409, msg: 'imagen opaca no se puede leer' })
          } else {
            // We assume it is ok
            return cb({status: 200, msg: 'ok', details: data})
          }
        })
        .catch(error => {
          console.error(error)
          return cb({status: 400, msg: 'Error al procesar la imagen, posible archivo corrupto'})
        })
    } catch (error) {
      console.error(error)
      return cb({status: 400, msg: "Error al procesar la imagen, posible archivo corrupto"})
    }
  },

  // Generates an instance on AWSTextract client to use as global in api.
  getTextractClient: () => {
    const awsConfig = {
      region: 'us-east-1',
      credentials: {
        accessKeyId: config.AWSAPITEXTRACT_KEY_ID,
        secretAccessKey: config.AWSAPITEXTRACT_SECRET_KEY
      }
    }
    const client = new TextractClient(awsConfig)
    return client
  }
}
