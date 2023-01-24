const archiver = require('archiver')

//tools lib
module.exports = {
  transpileOb: function (source, target) {
    for (var key in target) {
      if (source.hasOwnProperty(key)) {
        target[key] = source[key]
      } else {
        delete target[key]
      }
    }
    return target
  },

  mod11: function (str) {
    var arr = [7, 6, 5, 4, 3, 2]
    var total = 0
    var pivot = 0

    //get sum total
    for (var i = 0; i < str.length; i++) {
      var dig = parseInt(str[i])
      var sub = dig * arr[pivot]
      total += sub
      pivot += 1
      if (pivot == 6) {
        pivot = 0
      }
    }
    //get remainder
    var rem = total % 11

    var verf = 11 - rem
    if (verf == 11) {
      verf = 0
    }
    if (verf == 10) {
      verf = 1
    }
    return verf
  },

  trimBlankLines: function (str) {
    return str.replace(/^\s*[\r\n]/gm, '')
  },

  isJsonString: function (str) {
    if (str.indexOf('[') == 0 || str.indexOf('{') == 0) {
      try {
        JSON.parse(str)
      } catch (e) {
        return false
      }
      return true
    } else {
      return false
    }
  },

  generateKey: function () {
    return Math.random().toString(36).slice(2)
  },

  isEmail: function (email) {
    var re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(String(email).toLowerCase())
  },

  stringSingleImage: string => {
    let src = string.split(',')
    let image = null
    if (src.length === 2 && src[0].indexOf('base64') >= 0) {
      image = src[1]
    } else {
      image = src[0]
    }
    return image
  },

  stringToBytes: string => {
    try {
      const single = tools.stringSingleImage(string)
      return awsBase64.fromBase64(single)
    } catch (error) {
      return error
    }
  },

  trailZeros: (num, digs) => {
    var str = num + ''
    var tr = ''
    for (var i = 0; i < digs - str.length; i++) {
      tr = tr + '0'
    }
    return tr + str
  },

  sendBootAlert: () => {
    //todo, will need an API for nexxit chatbot
    var body = 'Nexxit API Started ' + new Date()
    // send email with nexxit credentials
    // mailer.sendEmail("ops", "dario@nexxit.dev", "Nexxit API Status", body, null, function(res){});
  },

  stringToFile: (b64String, prefix, ext) => {
    ext ||= 'jpg'
    const imageUid = tools.generateKey()
    const imagePath = path.resolve(
      __dirname,
      `./../tmp/${prefix}_${imageUid}.${ext}`
    )
    const buffer = tools.stringToBytes(b64String)
    fs.writeFileSync(imagePath, buffer)
    return imagePath
  },

  stringToPublicFile: (b64String, prefix, ext) => {
    ext ||= 'jpg'
    const fileUid = tools.generateKey()
    const filePath = path.resolve(
      __dirname,
      `./../public/${prefix}_${fileUid}.${ext}`
    )
    const fileUri = `files/${prefix}_${fileUid}.${ext}`
    const fileBuffer = tools.stringToBytes(b64String)
    fs.writeFileSync(filePath, fileBuffer)
    return fileUri
  },

  stringToPDF: (pdfString, prefix) => {
    const fileUid = tools.generateKey()
    const filePath = path.resolve(
      __dirname,
      `./../tmp/${prefix}_${fileUid}.pdf`
    )
    fs.writeFileSync(filePath, pdfString, 'binary')
    return filePath
  },

  stringToPublicPDF: (pdfString, prefix) => {
    const fileUid = tools.generateKey()
    const filePath = path.resolve(
      __dirname,
      `./../public/${prefix}_${fileUid}.pdf`
    )
    const fileUri = `files/${prefix}_${fileUid}.pdf`
    const fileBuffer = Buffer.from(pdfString, 'binary')
    fs.writeFileSync(filePath, fileBuffer, { encoding: 'base64' })
    return fileUri
  },

  compressZip: async (imagePath, cb) => {
    const fileUid = tools.generateKey()
    const filePath = path.resolve(
      __dirname,
      `./../tmp/${fileUid}.zip`
    )

    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.file(imagePath, { name: path.basename(imagePath) })
    const writeStream = fs.createWriteStream(filePath)
    archive.pipe(writeStream)
    await new Promise((resolve, reject) => {
      archive.finalize()
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })

    console.log('The archive has been saved')
    cb(filePath)
  }
}
