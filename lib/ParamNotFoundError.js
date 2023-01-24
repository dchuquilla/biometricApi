module.exports = class ParamNotFoundError extends Error {
  constructor(param) {
    super(`409: Parámetro ${param} no encontrado`)
  }
}
