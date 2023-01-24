const baseProducts = [
  {
    cap: 100000,
    count: 0,
    code: 'p1',
    prices: [
      {
        from: 0,
        pvp: 0.2,
        to: 100000
      }
    ]
  },
  {
    cap: 100000,
    count: 0,
    code: 'p2',
    prices: [
      {
        from: 0,
        pvp: 0.2,
        to: 100000
      }
    ]
  },
  {
    cap: 100000,
    count: 0,
    code: 'p3',
    prices: [
      {
        from: 0,
        to: 100000,
        valor: 0.3
      }
    ]
  },
  {
    cap: 100000,
    count: 0,
    code: 'p4',
    prices: [
      {
        from: 0,
        to: 100000,
        valor: 0.3
      }
    ]
  },
  {
    cap: 100000,
    count: 0,
    code: 'p5',
    prices: [
      {
        from: 0,
        to: 100000,
        valor: 0.3
      }
    ]
  }
]

module.exports = class ProductsModel {
  constructor (product) {
    this.cap = product.cap
    this.count = product.count
    this.code = product.code
    this.prices = product.prices
  }

  static getBaseProducts(){
    return baseProducts
  }
}
