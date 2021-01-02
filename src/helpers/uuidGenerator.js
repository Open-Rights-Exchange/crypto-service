/* eslint-disable no-bitwise */
/* eslint-disable no-param-reassign */
/* eslint-disable eqeqeq */
/* eslint-disable no-plusplus */
// based on https://github.com/broofa/node-uuid
let rb = require('crypto').randomBytes

if (!rb && window && window.crypto) {
  rb = bytes => {
    const array = new Uint16Array(bytes)
    return window.crypto.getRandomValues(array)
  }
}

function rng() {
  return rb(16)
}

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
const byteToHex = []
for (let i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1)
}

function bytesToUuid(buf, offset) {
  let i = offset || 0
  const bth = byteToHex
  return `${bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]]}-${bth[buf[i++]]}${bth[buf[i++]]}-${
    bth[buf[i++]]
  }${bth[buf[i++]]}-${bth[buf[i++]]}${bth[buf[i++]]}-${bth[buf[i++]]}${bth[buf[i++]]}${bth[buf[i++]]}${bth[buf[i++]]}${
    bth[buf[i++]]
  }${bth[buf[i++]]}`
}

export function generateUuidV4(options, buf, offset) {
  const i = (buf && offset) || 0

  if (typeof options === 'string') {
    buf = options == 'binary' ? new Array(16) : null
    options = null
  }
  options = options || {}

  const rnds = options.random || (options.rng || rng)()

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40
  rnds[8] = (rnds[8] & 0x3f) | 0x80

  // Copy bytes to buffer, if provided
  if (buf) {
    for (let ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii]
    }
  }

  return buf || bytesToUuid(rnds)
}

export function createGuid() {
  return generateUuidV4()
}

export function createGuidWithoutDashes() {
  return generateUuidV4().replace(/-/g, '')
}
