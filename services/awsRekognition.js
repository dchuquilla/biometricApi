// AWS Rekognition WRAPPERS
const {
  RekognitionClient,
  CompareFacesCommand
} = require('@aws-sdk/client-rekognition')


module.exports = {
  // Call to AWS Rekognition service and returns what it found of it.
  // @params: Type object
  //   image: String
  // @return: Object AWS analyzed blocks of text found.
  compareFaces: async (params, cb) => {
    try {
      if (!params.source) {
        cb('Source image is required')
        return
      }
      if (!params.target) {
        cb('Target image is required')
        return
      }

      const source = tools.stringToBytes(params.source)
      const target = tools.stringToBytes(params.target)

      const input = {
        SourceImage: {Bytes: source},
        TargetImage: {Bytes: target},
      }
      const command = new CompareFacesCommand(input);
      console.log(command)

      return await rekognitionClient.send(command)
      .then((data) => {
        cb(data);
      })
      .catch((error) => {
        console.error(error)
        cb("Error al procesar las imágenes, posibles archivos curruptos");
      })
    } catch (error) {
      // TODO (Monitoring) Send error to WP or email
      console.error(error)
      cb(error.message.toString())
    }
  },

  // Generates an instance on AWSRekognition client to use as global in api.
  getRekognitionClient: () => {
    const awsConfig = {
      region: 'us-east-1',
      credentials: {
        accessKeyId: config.AWSAPIREKOGNITION_KEY_ID,
        secretAccessKey: config.AWSAPIREKOGNITION_SECRET_KEY
      }
    }
    const client = new RekognitionClient(awsConfig)
    return client
  },
}
