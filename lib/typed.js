/** 
 * true - little endian
 * false - big endian
 */
const systemEndianness = (() => {
  const buffer = new ArrayBuffer(2);
  new DataView(buffer).setInt16(0, 256, true /* littleEndian */);
  // Int16Array uses the platform's endianness.
  return new Int16Array(buffer)[0] === 256;
})();

const buf = new ArrayBuffer(32)
const view = new DataView(buf)
view.getBigInt64
class U8 {
  /** @type {Uint8Array | Uint8ClampedArray} */
  #data

  constructor(/** @type {number} */ num, opt = {clamped: false}) {
    if (!opt.clamped && !(num >= 0 && num < 256)) {
      throw new Error(`Invalid u8: ${num}`)
    }
    this.#data = opt.clamped ? new Uint8ClampedArray(1) : new Uint8Array(1)
    this.#data[0] = num
  }
}

export function u8(/** @type {number} */ num, opt = {clamped: false}) {
  return new U8(num, opt)
}

class I8 {
  /** @type {Int8Array} */
  #data

  constructor(/** @type {number} */ num) {
    if (!(num >= -128 && num < 127)) throw new Error(`Invalid i8: ${num}`)
    this.#data = Int8Array(1)
    this.#data[0] = num
  }
}

export function i8(/** @type {number} */ num, opt = {clamped: false}) {
  return new I8(num, opt)
}

class StructBuilder {
  /** @type {Array<{name: string, type: object}>} */
  #fields = []
  field(name, type) {
    this.#fields.push({ name, type })
  }
}
