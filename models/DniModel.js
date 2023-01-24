const { requestDni, retrieveDni, cacheRCResult } = require("../services/RegistroCivil")
const { putObject, getObject } = require("../services/awsS3")

module.exports = class Dni {
  constructor (response) {
    this.message = response.message || "Cedula encontrada"
    this.result = response.result
    this.Nombre = response.Nombre
    this.FechaNacimiento = response.FechaNacimiento
    this.CodDactilar = response.CodDactilar
    this.Fotografia = response.Fotografia
    this.Domicilio = response.Domicilio
    // this.estadocivil = response.Estadocivil
    this.FechaExpedicion = response.FechaExpedicion
    this.FechaExpiracion = response.FechaExpiracion
    this.FechaCedulacion = response.FechaCedulacion
    // this.lugarNacimiento = response.lugarnacimiento
    this.Nacionalidad = response.Nacionalidad
    this.Profesion = response.Profesion
    this.tsc = response.tsc
    this.fotografiaPath = response.fotografiaPath
  }

  static async fetchDni (numero, codigoDactilar, cb) {
    // consultar en registro civil
    // const dni = registroCivil.send(numero, codigoDactilar);
    if (!numero) {
      throw new Error('DNI number required')
    }
    const matchedNumber = numero.match(/[0-9]{10}/)
    if (!matchedNumber) {
      throw new Error('DNI number invalid format')
    }
    if (!codigoDactilar) {
      throw new Error('codigoDactilar is required')
    }
    if (codigoDactilar.length != 10) {
      throw new Error('codigoDactilar invalid format')
    }
    const matchedCodigo = numero.match(/[0-9a-zA-Z]{10}/)
    if (!matchedCodigo) {
      throw new Error('codigoDactilar invalid format')
    }
    await retrieveDni(numero, (fbRCResponse) => {
      if(fbRCResponse) {
        fbRCResponse = Object.values(fbRCResponse)[0]
        getObject(fbRCResponse.fotografiaPath, (response) => {
          fbRCResponse.Fotografia = response.file.Body.toString()
          console.log('FB DNI: ', fbRCResponse)
          const dni = new Dni(fbRCResponse)
          cb(dni)
        })
      } else {
        console.log('Resquest form RC service $$$')
        requestDni(numero, codigoDactilar, (response) => {
          const dni = new Dni(response.data)
          const tmpFotografia = response.data.Fotografia
          if (dni.result === true) {
            // save fotografia to S3
            const fotografiaPath = `registro_civil/${numero}.txt`
            putObject(
              fotografiaPath,
              response.data.Fotografia,
              'text/plain',
              (response) => {
                console.log('put object rc fotografia', response)
                //save dni record to db
                dni.fotografiaPath = fotografiaPath
                dni.Fotografia = ""
                dni.tsc = Date.now()
                cacheRCResult(numero, dni)
                dni.Fotografia = tmpFotografia
                cb(dni)
                dni = null;
              }
            )
          } else {
            const BDni = new Dni(response.data)
            cb(dni)
          }
        })
      }
    })
  }
}
