(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return b64.length * 3 / 4 - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],2:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('Invalid typed array length')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (value instanceof ArrayBuffer) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  return fromObject(value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj) {
    if (isArrayBufferView(obj) || 'length' in obj) {
      if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
        return createBuffer(0)
      }
      return fromArrayLike(obj)
    }

    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return fromArrayLike(obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (isArrayBufferView(string) || string instanceof ArrayBuffer) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : new Buffer(val, encoding)
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// Node 0.10 supports `ArrayBuffer` but lacks `ArrayBuffer.isView`
function isArrayBufferView (obj) {
  return (typeof ArrayBuffer.isView === 'function') && ArrayBuffer.isView(obj)
}

function numberIsNaN (obj) {
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":1,"ieee754":3}],3:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){
/**
 * Created by koqiui on 2017-04-08.
 */
var moduleName = 'Utils';
//----------------------------------------------

var isInBrowser = (typeof window !== "undefined") && typeof (window.location !== "undefined");

function toStr(obj) {
    return "" + obj;
}

function isNull(obj, strict) {
    strict = strict === true;
    return strict ? obj === null : obj == null;
}

function isInstanceOf(obj, chkClass) {
    return obj != null && obj.constructor === chkClass;
}

function isString(obj) {
    return obj != null && (typeof obj === "string" || obj instanceof String);
}

function isNumber(obj) {
    return obj != null && (typeof obj === "number" || obj instanceof Number);
}

function isNum(obj) {
    return isNumber(obj) && isFinite(obj);
}

function isBoolean(obj) {
    return obj != null && (typeof obj === "boolean" || obj instanceof Boolean);
}

function isFunction(obj) {
    return obj != null && (typeof obj === "function" || obj instanceof Function);
}

function isPrimitive(obj) {
    return obj != null && (isString(obj) || isNumber(obj) || isBoolean(obj));
}

function isDate(obj) {
    return obj != null && Object.prototype.toString.apply(obj) === "[object Date]";
}

function isArray(obj) {
    return obj != null && Object.prototype.toString.apply(obj) === "[object Array]";
}

function isRegExp(obj) {
    return obj != null && Object.prototype.toString.apply(obj) === "[object RegExp]";
}

function isPlainObject(obj, bLooseCheck) {
    if (!obj || Object.prototype.toString.call(obj) !== "[object Object]" || obj.nodeType || obj.setInterval) {
        return false;
    }

    var hasOwnProperty = Object.prototype.hasOwnProperty;
    //
    if (obj.constructor && !hasOwnProperty.call(obj, "constructor") && !hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
        return false;
    }

    if (bLooseCheck === true) {
        return true;
    } else {
        var key;
        for (key in obj) {
            // just pass
        }
        return key === undefined || hasOwnProperty.call(obj, key);
    }
}

function isEmptyObject(obj, ignorePropertyPrefix) {
    ignorePropertyPrefix = ignorePropertyPrefix || "";
    //
    if (ignorePropertyPrefix) {
        for (var name in obj) {
            if (!name.indexOf(ignorePropertyPrefix) == 0) {
                return false;
            }
        }
    } else {
        for (var name in obj) {
            return false;
        }
    }
    return true;
}

// ------------------------------------------
var ___STRING_LTRIM_REG = /^(\s)+/i;
var ___STRING_RTRIM_REG = /(\s)+$/i;

function trimLeft(str) {
    return str.replace(___STRING_LTRIM_REG, "");
}

function trimRight(str) {
    return str.replace(___STRING_RTRIM_REG, "");
}

function trim(str) {
    return str.replace(___STRING_LTRIM_REG, "").replace(___STRING_RTRIM_REG, "");
}

//
function __strEql(valX, valY) {
    if (valX == null) {
        return valY == null;
    } else if (valY == null) {
        return valX == null;
    } else {
        return toStr(valX) === toStr(valY);
    }
}

function strEql(val /* , chkVal1, chkVal2,... */) {
    var chkCount = arguments.length - 1;
    if (chkCount <= 0) {
        return false;
    }
    var i;
    if (isArray(arguments[1])) {
        var chkArray = arguments[1];
        chkCount = chkArray.length;
        for (i = 0; i < chkCount; i++) {
            if (__strEql(val, chkArray[i])) {
                return true;
            }
        }
    } else {
        chkCount++;
        for (i = 1; i < chkCount; i++) {
            if (__strEql(val, arguments[i])) {
                return true;
            }
        }
    }
    return false;
}

String.prototype.trimLeft = function () {
    return trimLeft(this);
};

String.prototype.trimRight = function () {
    return trimRight(this);
};

String.prototype.trim = function () {
    return trim(this);
};

String.prototype.isEmpty = function () {
    return this === "";
};

String.prototype.isBlank = function () {
    return trim(this) === "";
};

function isNullOrEmpty(chkStr) {
    return chkStr == null || toStr(chkStr).isEmpty();
}

function isNullOrBlank(chkStr) {
    return chkStr == null || toStr(chkStr).isBlank();
}

var isNoE = isNullOrEmpty;
var isNoB = isNullOrBlank;

function replace(srcStr, what, byWhat) {
    if (byWhat == null) {
        byWhat = "";
    }
    var tmpStr = srcStr.split(what);
    return tmpStr.join(byWhat);
}

function left(str, length) {
    if (!isString(str)) {
        return null;
    }
    var strLen = str.length;
    if (length >= strLen) {
        return str;
    } else {
        return str.substring(0, length);
    }
}

function right(str, length) {
    if (!isString(str)) {
        return null;
    }
    var strLen = str.length;
    if (length >= strLen) {
        return str;
    } else {
        return str.substring(strLen - length);
    }
}

function __strPad(srcStr, len, isRight, padStr) {
    srcStr = "" + srcStr;
    var needLen = len - srcStr.length;
    if (needLen <= 0) {
        return srcStr;
    }
    if (padStr == null) {
        padStr = " ";
    }
    if (padStr.length <= 0) {
        throw "padStr 's length must be great than 0 !";
    }
    var appendStr = "";
    do {
        appendStr += padStr;
        if (appendStr.length >= needLen) {
            appendStr = left(appendStr, needLen);
            break;
        }
    } while (true);
    //
    return isRight === true ? srcStr + appendStr : appendStr + srcStr;
}

function padLeft(_srcStr, len, padStr) {
    return __strPad(_srcStr, len, false, padStr);
}

function padRight(_srcStr, len, padStr) {
    return __strPad(_srcStr, len, true, padStr);
}

String.prototype.left = function (length) {
    return left(this, length);
};

String.prototype.right = function (length) {
    return right(this, length);
};

function duplicate(refStr, count) {
    if (!isNum(count)) {
        return null;
    }
    count = Math.floor(count);
    var resultStr = "";
    if (count <= 0) {
        return resultStr;
    }
    resultStr = refStr;
    for (var i = 1; i < count; i++) {
        resultStr += refStr;
    }
    return resultStr;
}

String.prototype.duplicate = function (count) {
    return duplicate(this, count);
};

function startsWith(srcStr, chkStr, bIgnoreCase) {
    if (!isString(srcStr) || !isString(chkStr)) {
        return false;
    }
    bIgnoreCase = bIgnoreCase === true;
    if (bIgnoreCase) {
        srcStr = srcStr.toLowerCase();
        chkStr = chkStr.toLowerCase();
    }
    return (srcStr.indexOf(chkStr) === 0);
}

function endsWith(srcStr, chkStr, bIgnoreCase) {
    if (!isString(srcStr) || !isString(chkStr)) {
        return false;
    }
    bIgnoreCase = bIgnoreCase === true;
    if (bIgnoreCase) {
        srcStr = srcStr.toLowerCase();
        chkStr = chkStr.toLowerCase();
    }
    var lastIndex = srcStr.lastIndexOf(chkStr);
    return (lastIndex != -1) && (lastIndex == srcStr.length - chkStr.length);
}

String.prototype.startsWith = function (chkStr, bIgnoreCase) {
    return startsWith(this, chkStr, bIgnoreCase);
};

String.prototype.endsWith = function (chkStr, bIgnoreCase) {
    return endsWith(this, chkStr, bIgnoreCase);
};

function __strContains(srcStr, chkStr, bIgnoreCase) {
    if (!isString(srcStr) || !isString(chkStr)) {
        return false;
    }
    bIgnoreCase = bIgnoreCase === true;
    if (bIgnoreCase) {
        srcStr = srcStr.toLowerCase();
        chkStr = chkStr.toLowerCase();
    }
    return (srcStr.indexOf(chkStr) != -1);
}

String.prototype.contains = function (chkStr, bIgnoreCase) {
    return __strContains(this, chkStr, bIgnoreCase);
};

// 形如{abc.dedss[0].zzz.(aaa.xxx).aaa}的字符串key路径
// [abc , dedss[0], zzz, aaa.xxx, aaa]
function __extractTemplateHolderParts(holderStr) {
    var holder = holderStr.substring(1, holderStr.length - 1).trim();
    var holderLen = holder.length;
    var holderParts = [];
    var tmpIndex = 0;
    var tmpPart = "";
    var inKh = false;
    while (tmpIndex < holderLen) {
        var tmpChar = holder.charAt(tmpIndex);
        if (tmpChar == '(') {
            if (!inKh) {
                inKh = true;
                tmpPart = tmpPart.trim();
                if (tmpPart !== "") {
                    holderParts.add(tmpPart);
                    tmpPart = "";
                }
            } else {
                tmpPart += tmpChar;
            }
        } else if (tmpChar == ")") {
            if (inKh) {
                tmpPart = tmpPart.trim();
                if (tmpPart !== "") {
                    holderParts.add(tmpPart);
                    tmpPart = "";
                }
                inKh = false;
            } else {
                tmpPart += tmpChar;
            }
        } else if (tmpChar == ".") {
            if (inKh) {
                tmpPart += tmpChar;
            } else {
                tmpPart = tmpPart.trim();
                if (tmpPart !== "") {
                    holderParts.add(tmpPart);
                    tmpPart = "";
                }
            }
        } else {
            tmpPart += tmpChar;
        }
        tmpIndex++;
    }
    tmpPart = tmpPart.trim();
    if (tmpPart !== "") {
        holderParts.add(tmpPart);
        tmpPart = "";
    }
    return holderParts;
}

/**
 * 格式化字符串，形如： {0},{1}..的索引位置，或形如 {pro1}, {prop2.subprop.(a.b).c}, {prop3[0]}的对象式<br/> 对于带key为形如 "a.b"的，可以使用(a.b)标记为原子key
 */
function format(template) {
    if (!isString(template)) {
        return template;
    }
    var params = Array.prototype.slice.call(arguments, 1);
    var paramCount = params.length;
    if (paramCount === 0) {
        return template;
    }
    var nullAs = template.nullAs || "null";
    var resultStr = "";
    var asObject = isPlainObject(params[0]);
    var xReg = null;
    if (asObject) {
        params = params[0];
        xReg = /\{(\(?[a-zA-Z_]+(\.[a-zA-Z_]+)*\)?)+(\.(\(?[a-zA-Z_]+(\.[a-zA-Z_]+)*\)?)|\[\d+\])*\}?/mg;
        resultStr = template.replace(xReg, function (match) {
            var holderParts = __extractTemplateHolderParts(match);
            var param = null;
            var curKey = "";
            for (var i = 0, len = holderParts.length; i < len; i++) {
                var tmpPart = holderParts[i];
                if (tmpPart.indexOf(".") != -1) {
                    curKey += "[\"" + tmpPart + "\"]";
                } else {
                    curKey += "." + tmpPart;
                }
                param = eval("params" + curKey);
                if (param == null) {
                    break;
                }
            }
            // alert(match +" : "+param);
            return "" + (param == null ? nullAs : param);
        });
    } else {
        xReg = /\{\d+}?/mg;
        resultStr = template.replace(xReg, function (m) {
            var holder = m.substring(1, m.length - 1).trim();
            var index = parseInt(holder, 10);
            if (index >= 0 && index < paramCount) {
                var param = params[index];
                // alert(holder +" : "+param);
                return "" + (param == null ? nullAs : param);
            } else {
                return m;
            }
        });
    }
    return resultStr;
}

String.prototype.format = function () {
    var args = [this].concat(Array.prototype.slice.call(arguments, 0));
    return format.apply(window, args);
};

String.prototype.isIn = function () {
    var args = [this].concat(Array.prototype.slice.call(arguments, 0));
    return strEql.apply(window, args);
};
/**
 * @private
 */
var __escapeStrReg = {
    backslash: /\\/ig,
    quote: /'/ig,
    dblquote: /"/ig,
    newline: /\n/ig,
    carriage: /\r/ig,
    carriage2: /\r\n/ig,
    formfeed: /\f/ig,
    hrtab: /\t/ig,
    foreslash: /\//ig
    // not used for json escape
};

/**
 * Escape string by filter special chars(\, ', ", \n, \r, \t etc.)
 *
 * @param {String}
 *            src original string
 * @param {Boolean}
 *            [useSingleQutoe=false] whether to use Single Qutoe
 * @returns {String} escaped string
 * @example __escapeJsonStr("aaaaaa'bbb/ccc\t'ddd",true) => aaaaaa\'bbb/ccc\t\'ddd
 */
function __escapeJsonStr(src, useSingleQutoe) {
    if (src == null || src === "") {
        return src;
    } else {
        useSingleQutoe = useSingleQutoe === true;
        // backslash
        __escapeStrReg.backslash.lastIndex = -1;
        src = src.replace(__escapeStrReg.backslash, "\\\\");
        if (useSingleQutoe) {
            // quote
            __escapeStrReg.quote.lastIndex = -1;
            src = src.replace(__escapeStrReg.quote, "\\'");
        } else {
            // dblquote
            __escapeStrReg.dblquote.lastIndex = -1;
            src = src.replace(__escapeStrReg.dblquote, '\\"');
        }
        // newline
        __escapeStrReg.newline.lastIndex = -1;
        src = src.replace(__escapeStrReg.newline, '\\n');
        // carriage
        __escapeStrReg.carriage.lastIndex = -1;
        src = src.replace(__escapeStrReg.carriage, '\\r');
        // carriage2
        __escapeStrReg.carriage2.lastIndex = -1;
        src = src.replace(__escapeStrReg.carriage2, '\\r\\n');
        // formfeed
        __escapeStrReg.formfeed.lastIndex = -1;
        src = src.replace(__escapeStrReg.formfeed, '\\f');
        // hrtab
        __escapeStrReg.hrtab.lastIndex = -1;
        src = src.replace(__escapeStrReg.hrtab, '\\t');
        return src;
    }
}

function StringBuilder() {
    this.value = "";
    //
    this.append = function () {
        for (var i = 0, c = arguments.length; i < c; i++) {
            this.value = this.value + arguments[i];
        }
        //
        return this;
    };
    this.appendln = function () {
        this.append.apply(this, arguments);
        this.append("\n");
        //
        return this;
    };
    this.prepend = function () {
        for (var i = 0, c = arguments.length; i < c; i++) {
            this.value = arguments[i] + this.value;
        }
        //
        return this;
    };
    this.clear = function () {
        this.value = "";
        //
        return this;
    };

    //初始参数
    if (arguments.length > 0) {
        this.append.apply(this, arguments)
    }
    //
    return this;
}

// 公开方法
String.builder = function () {
    var obj = new StringBuilder();
    obj.append.apply(obj, arguments);
    return obj;
};

/**
 * 解析大小及单位
 *
 * @param dim
 * @returns
 */
function parseDimen(dim) {
    if (dim == null) {
        return null;
    }
    var ret = {};
    if (isNum(dim)) {
        ret.value = dim;
        ret.unit = "px";
    } else if (isString(dim)) {
        var rawNum = ParseFloat(dim);
        if (isNum(rawNum)) {
            ret.value = rawNum;
            var numStr = toStr(ret.value);
            var rawUnit = dim.substring(numStr.length).trim();
            ret.unit = rawUnit === "" ? "px" : rawUnit;
        }
    }
    return ret;
}

//
function ParseInt(x) {
    if (isString(x)) {
        if (x.isBlank()) {
            return null;
        }
    }
    var val = parseInt(x, 10);
    return isNaN(val) ? null : val;
}

function ParseFloat(x) {
    if (isString(x)) {
        if (x.isBlank()) {
            return null;
        }
    }
    var val = parseFloat(x);
    return isNaN(val) ? null : val;
}

Number.prototype.round = function (frgs) {
    if (!isNum(frgs) || frgs < 0) {
        frgs = 0;
    }
    if (frgs === 0) {
        return Math.round(this);
    }
    var numStr = this + "";
    var dotIndex = numStr.indexOf(".");
    if (dotIndex != -1) {
        var intPart = numStr.substring(0, dotIndex);
        var frgPart = dotIndex == numStr.length - 1 ? "" : numStr.substring(dotIndex + 1);
        if (frgPart.length > frgs) {
            var nextDigit = parseInt(frgPart.charAt(frgs), 10);
            frgPart = frgPart.substring(0, frgs);
            if (nextDigit >= 5) {
                var lastDigit = parseInt(frgPart.charAt(frgs - 1), 10);
                frgPart = frgPart.substring(0, frgs - 1) + (lastDigit + 1);
            }
        }
        numStr = frgPart === "" ? intPart : intPart + "." + frgPart;
        return parseFloat(numStr);
    } else {
        return this;
    }
};

/**
 * clear all of the array elements
 */
Array.prototype.clear = function () {
    this.length = 0;
};

/**
 * Appends any number of items onto the end of the array.
 */
Array.prototype.append = function () {
    for (var i = 0, c = arguments.length, len = this.length; i < c; i++) {
        var tmpItem = arguments[i];
        if (isArray(tmpItem)) {
            var tmpItems = tmpItem;
            for (var j = 0, k = tmpItems.length; j < k; j++) {
                this[len++] = tmpItems[j];
            }
        } else {
            this[len++] = tmpItem;
        }
    }
};

/**
 * add one or many at the end of the array
 */
Array.prototype.add = function () {
    Array.prototype.append.apply(this, arguments);
};

/**
 * Prepend any number of items onto the start of the array.
 */
Array.prototype.prepend = function () {
    for (var i = 0, c = arguments.length; i < c; i++) {
        var tmpItem = arguments[i];
        if (isArray(tmpItem)) {
            var tmpItems = tmpItem;
            for (var j = 0, k = tmpItems.length; j < k; j++) {
                this.splice(0, 0, tmpItems[j]);
            }
        } else {
            this.splice(0, 0, tmpItem);
        }
    }
};

/**
 * 循环返回给定元素的下一个元素
 */
Array.prototype.nextCycleElement = function (vItem) {
    if (this.length === 0) {
        return undefined;
    }
    var index = this.indexOf(vItem);
    if (index == -1) {
        index = 0;
    } else {
        index++;
    }
    return this[index % this.length];
};

Array.prototype.first = function () {
    if (this.length > 0) {
        return this[0];
    } else {
        return undefined;
    }
};

Array.prototype.last = function () {
    if (this.length > 0) {
        return this[this.length - 1];
    } else {
        return undefined;
    }
};

// 找到最接近的元素
Array.prototype.nearest = function (vItem, compFunc) {
    var lastMatch = null;
    //
    if (this.length > 0) {
        if (compFunc == null) {
            compFunc = function (elA, elB) {
                return elA == elB ? 0 : (elA < elB ? -1 : 1);
            };
        }
        var tmpArray = this.sort(compFunc);
        for (var i = 0; i < tmpArray.length; i++) {
            var tmpItem = tmpArray[i];
            if (compFunc(vItem, tmpItem) >= 0) {
                lastMatch = tmpItem;
            } else {
                break;
            }
        }
        if (lastMatch == null) {
            lastMatch = tmpArray[0];
        }
    }
    return lastMatch;
};

/*------------------------------------------------------------------------------
 * JavaScript zArray Library
 * Version 1.1
 * by Nicholas C. Zakas, http://www.nczonline.net/
 * Copyright (c) 2004-2005 Nicholas C. Zakas. All Rights Reserved.
 */
var __arrayMethodsToCheck = ["slice", "splice", "shift", "unshift"];

/**
 * Creates a copy of the array and returns it.
 *
 * @return A copy of the array.
 */
if (typeof Array.prototype.clone != "function") {
    Array.prototype.clone = function () /* :Array */ {
        return this.concat();
    };
}

/**
 * Determines if a given item is in the array.
 *
 * @param vItem
 *            The item to insert.
 * @return True if found, false if not.
 */
Array.prototype.contains = function (vItem /* :variant */, isFunc /* : function */) /* :boolean */ {
    return this.indexOf(vItem, null, isFunc) > -1;
};
/**
 * Runs a function on each item in the array and returns a boolean result.
 *
 * @param {Function}
 *            fnTest The function to run on each value.
 * @param {Object}
 *            [context] The object that the function belongs to or null for a global function.
 * @return {Boolean} True if the function evaluates to true for each item in the array, false if even one returns false.
 */
Array.prototype.every = function (fnTest, context) {
    context = context || isInBrowser ? window : null;
    var bResult = true;
    for (var i = 0, len = this.length; i < len && bResult; i++) {
        bResult = bResult && fnTest.call(context, this[i], i, this);
        if (!bResult) {
            break;
        }
    }
    return bResult;
};
/**
 * Runs a function on each item and returns an array.
 *
 * @param {Function}
 *            fnTest The function to run on each item.
 * @param {Object}
 *            context The object that the function belongs to or null for a global function.
 * @return {Array} An array made up of all the items that returned true for the function.
 */
Array.prototype.filter = function (fnTest, context) {
    context = context || isInBrowser ? window : null;
    var aResult = [];
    for (var i = 0, len = this.length; i < len; i++) {
        if (fnTest.call(context, this[i], i, this)) {
            aResult.push(this[i]);
        }
    }
    return aResult;
};
/**
 * Runs a function on each item and returns an array.
 *
 * @param {Function}
 *            fnTest The function to run on each item.
 * @param {Object}
 *            context The object that the function belongs to or null for a global function.
 * @return {Array} An array made up of all the items that returned false for the function.
 */
Array.prototype.reject = function (fnTest, context) {
    context = context || isInBrowser ? window : null;
    var aResult = [];
    for (var i = 0, len = this.length; i < len; i++) {
        if (!fnTest.call(context, this[i], i, this)) {
            aResult.push(this[i]);
        }
    }
    return aResult;
};
/**
 * Runs a function on each item in the array.
 *
 * @param {Function}
 *            fnExec The function to run on each value.
 * @param {Object}
 *            context The object that the function belongs to or null for a global function.
 */
Array.prototype.forEach = function (fnExec, context) {
    context = context || isInBrowser ? window : null;
    for (var i = 0, len = this.length; i < len; i++) {
        fnExec.call(context, this[i], i, this);
    }
};
/**
 * Returns the index of the first occurrance in the array.
 *
 * @param {Object}
 *            vItem The item to locate in the array.
 * @param {Integer}
 *            [iStart] The item to start looking from (optional).
 * @param {Function}
 *            [isFunc] Function used to just the index of vItem.
 * @return {Integer} The index of the item in the array if found or -1 if not found.
 */
Array.prototype.indexOf = function (vItem, iStart, isFunc) {
    if (iStart == null) {
        iStart = 0;
    }
    var i;
    if (typeof isFunc == "function") {
        for (i = iStart, len = this.length; i < len; i++) {
            if (isFunc(this[i], vItem, i)) {
                return i;
            }
        }
    } else {
        for (i = iStart, len = this.length; i < len; i++) {
            if (this[i] == vItem) {
                return i;
            }
        }
    }
    return -1;
};
/**
 * 根据提供的函数的判别结果返回第一个符合条件的元素
 */
Array.prototype.find = function (isFunc) {
    if (typeof isFunc == "function") {
        for (var i = 0, len = this.length; i < len; i++) {
            var elem = this[i];
            if (isFunc(elem, i)) {
                return elem;
            }
        }
    }
    return null;
};
/**
 * Inserts an item into the array at the given position.
 *
 * @param {Object}
 *            vItem The item to insert.
 * @param {Integer}
 *            iIndex The index to insert the item into.
 * @return {Object} inserted
 */
Array.prototype.insertAt = function (vItem, iIndex) {
    this.splice(iIndex, 0, vItem);
    return vItem;
};
/**
 * Inserts an item into the array before the given item.
 *
 * @param {Object}
 *            vItem The item to insert.
 * @param {Object}
 *            vBeforeItem The item to insert before.
 * @return {Object} inserted
 */
Array.prototype.insertBefore = function (vItem, vBeforeItem) {
    return this.insertAt(vItem, this.indexOf(vBeforeItem));
};
/**
 * Returns the last index of the first occurrance in the array.
 *
 * @param {Object}
 *            vItem The item to locate in the array.
 * @param {Integer}
 *            [iStart] The index of the item to start at.
 * @param {Function}
 *            [isFunc] Function used to just the index of vItem.
 * @return {Integer} The last index of the item in the array if found or -1 if not found.
 */
Array.prototype.lastIndexOf = function (vItem, iStart, isFunc) {
    if (iStart == null || iStart >= this.length) {
        iStart = this.length - 1;
    }
    var i;
    if (typeof(isFunc) == "function") {
        for (i = iStart; i >= 0; i--) {
            if (isFunc(this[i], vItem, i)) {
                return i;
            }
        }
    } else {
        for (i = iStart; i >= 0; i--) {
            if (this[i] == vItem) {
                return i;
            }
        }
    }
    return -1;
};
/**
 * Runs a function on each item and returns an array.
 *
 * @param {Function}
 *            fnExec The function to run on each item.
 * @param {Object}
 *            [context] The object that the function belongs to or null for a global function.
 * @return {Array} An array made up of all the items that returned true for the function.
 */
Array.prototype.map = function (fnExec, context) {
    context = context || isInBrowser ? window : null;
    var aResult = [];
    for (var i = 0, len = this.length; i < len; i++) {
        aResult.push(fnExec.call(context, this[i], i, this));
    }
    return aResult;
};
/**
 * 对数组中所有对象提取给定的属性并组成一个数组
 *
 * @param {String}
 *            propName 要提取的属性名称
 * @return {Array}
 */
Array.prototype.pluck = function (propName) {
    var fnExec = function (vItem) {
        return vItem == null ? undefined : vItem[propName];
    };
    return this.map(fnExec);
};
/**
 * Removes the array item matching the given item.
 *
 * @param {Object}
 *            vItem the item to remove.
 * @param {Function}
 *            [isFunc] Function used to just the index of vItem.
 * @return {Object} The removed item.
 */
Array.prototype.remove = function (vItem, isFunc) {
    return this.removeAt(this.indexOf(vItem, null, isFunc));
};
/**
 * Removes the array item in the given position.
 *
 * @param {Integer}
 *            iIndex The index of the item to remove.
 * @return {Object} The removed item.
 */
Array.prototype.removeAt = function (iIndex) {
    var vItem;
    if (iIndex >= 0 && iIndex < this.length) {
        vItem = this[iIndex];
        this.splice(iIndex, 1);
    }
    return vItem;
};
/**
 * Runs a function on each item in the array and returns a result.
 *
 * @param {Function}
 *            fnTest The function to run on each value.
 * @param {Object}
 *            [context] The object that the function belongs to or null for a global function.
 * @param {Integer}
 *            [minCount] min count that returns true.
 * @return {Boolean} True if the function evaluates to true for some items(as minCount), false if not.
 */
Array.prototype.some = function (fnTest, context, minCount) {
    if (typeof context == "number") {
        minCount = context || 1;
        context = isInBrowser ? window : null;
    } else {
        minCount = minCount || 1;
        context = context || isInBrowser ? window : null;
    }
    var found = 0;
    for (var i = 0, len = this.length; i < len; i++) {
        if (fnTest.call(context, this[i], i, this)) {
            found++;
            if (found >= minCount) {
                return true;
            }
        }
    }
    return false;
};
/**
 * Runs a function on each item in the array and returns a result if any true.
 *
 * @param {Function}
 *            fnTest The function to run on each value.
 * @param {Object}
 *            [context] The object that the function belongs to or null for a global function.
 * @return {Boolean} True if the function evaluates to true for any one item, false if not.
 */
Array.prototype.any = function (fnTest, context) {
    return this.some(fnTest, context, 1);
};
/**
 * Creates an array composed of the indicated items in the current array.
 *
 * @param {Integer}
 *            iStart The first item to copy.
 * @param {Integer}
 *            [iStop] The index after the last item to copy.
 * @return {Array} An array containing all items in the original array between the given indices.
 */
Array.prototype._slice = function (iStart, iStop) {
    iStop = iStop || this.length;
    var aResult = [];
    for (var i = iStart; i < iStop; i++) {
        aResult.push(this[i]);
    }
    return aResult;
};
/**
 * Removes the first item in the array and returns it.
 *
 * @return {Object} The first item in the array.
 */
Array.prototype._shift = function () {
    var vItem;
    if (this.length > 0) {
        vItem = this[0];
        this.splice(0, 1);
    }
    return vItem;
};
/**
 * Alters the array by removing specified items and inserting others.
 *
 * @param {Integer}
 *            iIndex The index at which to begin altering the array.
 * @param {Integer}
 *            iLength The number of items to remove.
 * @param {args...} []
 *            The items to insert in place of the removed items.
 * @return {Array} An array containing all removed items.
 */
Array.prototype._splice = function (iIndex, iLength) {
    var aResult = [];
    var aRemoved = [];
    //
    var i;
    //
    for (i = 0; i < iIndex; i++) {
        aResult.push(this[i]);
    }
    for (i = iIndex; i < iIndex + iLength; i++) {
        aRemoved.push(this[i]);
    }
    if (arguments.length > 2) {
        for (i = 2; i < arguments.length; i++) {
            aResult.push(arguments[i]);
        }
    }
    for (i = iIndex + iLength, len = this.length; i < len; i++) {
        aResult.push(this[i]);
    }
    for (i = 0, len = aResult.length; i < len; i++) {
        this[i] = aResult[i];
    }
    this.length = aResult.length;
    //
    return aRemoved;
};

/**
 * Places the given items at the beginning of the array.
 *
 * @param [args...]
 *            vItem[] Items to add into the
 */
Array.prototype._unshift = function () {
    var aArgs = [];
    for (var i = 0, len = arguments.length; i < len; i++) {
        aArgs.push("arguments[" + i + "]");
    }
    eval("this.splice(0,0," + aArgs.join(",") + ")");
};
/*
 * Assign the necessary methods.
 */
for (var i = 0, len = __arrayMethodsToCheck.length; i < len; i++) {
    var method = __arrayMethodsToCheck[i];
    if (Array.prototype[method] == null) {
        Array.prototype[method] = Array.prototype["_" + method];
    }
}

/**
 * 以数组中的各元素的指定的属性值为key，元素为value形成一个json对象
 *
 * @author koqiui
 * @date 2016年12月13日 下午2:27:37
 *
 * @param keyProp
 * @returns {___anonymous34084_34085}
 */
Array.prototype.toMap = function (keyProp) {
    var retMap = {};
    for (var i = 0; i < this.length; i++) {
        var vItem = this[i];
        var keyVal = vItem[keyProp];
        retMap[keyVal] = vItem;
    }
    return retMap;
};
// JavaScript zArray Library end----------------------------------------------
/**
 * Adds all the items in the array and returns the result.
 *
 * @param {Function}
 *            fnEval An optional function to run value on each item before adding.
 * @param {Object}
 *            context The object that the function belongs to or null for a global function.
 * @return {Object} The result of adding all of the array items together.
 */
Array.prototype.sum = function (fnEval, context) {
    context = context || isInBrowser ? window : null;
    var initVal = null;
    if (typeof fnEval != "function") {
        fnEval = function (vItem) {
            return vItem;
        };
    } else {
        initVal = fnEval();
    }
    var result = initVal;
    var len = this.length;
    if (len > 0) {
        result = fnEval.call(context, this[0], 0, this);
        for (var i = 1; i < len; i++) {
            result += fnEval.call(context, this[i], i, this);
        }
    }
    return result;
};

/**
 * 返回数组中对象的属性和给定的条件对象的属性相等的元素列表
 *
 * @param {Object}
 *            filterProps 条件对象
 * @return {Array} 符合条件的元素数组
 */
Array.prototype.where = function (filterProps) {
    var proxyProps = filterProps;
    var proxyKeys = [];
    var keyCount = proxyKeys.length;
    if (proxyProps != null) {
        for (var key in proxyProps) {
            proxyKeys[keyCount++] = key;
        }
        keyCount = proxyKeys.length;
    }
    var fnTest = function (vItem) {
        // 按列值完全比较
        if (vItem == proxyProps) {
            return true;
        } else if (proxyProps != null && vItem != null) {
            for (var i = 0; i < keyCount; i++) {
                var key = proxyKeys[i];
                if (proxyProps[key] != vItem[key]) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    };
    return this.filter(fnTest);
};

/**
 * 对数组进行排序（可指定是否降序及比较函数） srcArray, compFunc(elA, elB), bDesc
 */
function sortArray() {
    var args = arguments;
    var xArray = args[0];
    if (!isArray(xArray)) {
        return xArray;
    }
    try {
        xArray = xArray.clone();
    } catch (ex) {
        //
    }
    var compFunc = null;
    var bDesc = false;
    if (args.length > 1) {
        if (typeof args[1] == "boolean") {
            bDesc = args[1] === true;
            if (args.length > 2 && typeof args[2] == "function") {
                compFunc = args[2];
            }
        } else if (typeof args[1] == "function") {
            compFunc = args[1];
            if (args.length > 2 && typeof args[2] == "boolean") {
                bDesc = args[2];
            }
        }
    }
    if (compFunc == null) {
        compFunc = function (elA, elB) {
            return elA == elB ? 0 : (elA < elB ? -1 : 1);
        };
    }
    var len = xArray.length;
    for (var i = 0; i < len - 1; i++) {
        var tmp = xArray[i];
        var indx = i;
        var tmp2;
        for (var j = i + 1; j < len; j++) {
            tmp2 = xArray[j];
            var result = compFunc(tmp2, tmp);
            result = bDesc ? result > 0 : result < 0;
            if (result) {
                tmp = tmp2;
                indx = j;
            }
        }
        if (indx > i) {
            tmp2 = xArray[i];
            xArray[i] = tmp;
            xArray[indx] = tmp2;
        }
    }
    return xArray;
}

/**
 * 对数组进行排序（可指定是否降序及比较函数） compFunc(elA, elB), bDesc
 */
if (typeof Array.prototype.sort != "function") {
    Array.prototype.sort = function () {
        var args = [this].concat(Array.prototype.slice.call(arguments, 0));
        return sortArray.apply(isInBrowser ? window : null, args);
    };
}

/**
 * 按指定的方向（where）移动指定数组(xArray)中指定索引位置(index or indices数组) 的元素 where : first, prev, next, last 返回索引位置信息数组[{old : x, new : y}, ...]
 */
function moveArrayElementsAt(xArray, indices, where) {
    xArray = xArray || [];
    var len = xArray.length;
    if (len <= 1) {
        return null;
    }
    indices = indices || [];
    // console.log(">> 1 :: " + indices);
    if (isNum(indices)) {
        indices = [indices];
    }
    indices = indices.sort();
    // console.log(">> 2 :: " + indices);
    if (indices.length === 0) {
        return null;
    }
    var minIndex = indices[0];
    if (minIndex === 0 && (where === "first" || where === "prev")) {
        return null;
    }
    var maxIndex = indices[indices.length - 1];
    if (maxIndex === (len - 1) && (where === "last" || where === "next")) {
        return null;
    }
    var offset = -1;
    if (where === "first") {
        offset = 0 - minIndex;
    } else if (where === "prev") {
        offset = -1;
    } else if (where === "next") {
        offset = 1;
    } else if (where === "last") {
        offset = (len - 1) - maxIndex;
    } else {
        return null;
    }
    //
    var tmpArray = [];
    for (var i = 0; i < len; i++) {
        tmpArray[i] = xArray[i];
    }
    //
    xArray.clear();
    //
    var indexChanges = [];
    for (var i = 0; i < indices.length; i++) {
        var index = indices[i];
        var indexNew = index + offset;
        xArray[indexNew] = tmpArray[index];
        indexChanges[i] = {
            "old": index,
            "new": indexNew
        };
    }
    //
    for (var i = 0, j = 0; i < len; i++) {
        var newElem = xArray[i];
        if (typeof newElem === "undefined") {
            while (true) {
                if (indices.indexOf(j) == -1) {
                    break;
                }
                j++;
            }
            xArray[i] = tmpArray[j++];
        }
    }
    return indexChanges;
}

// 改变当前数组，where : first, prev, next, last
Array.prototype.move = function (indices, where) {
    return moveArrayElementsAt(this, indices, where);
};

// 不改变当前数组，返回元素不重复的新数组
Array.prototype.unique = function (eqlFunc) {
    var retArray = [];
    if (typeof(eqlFunc) != "function") {
        eqlFunc = function (A, B) {
            return A == B;
        };
    }
    var k = 0;
    for (var i = 0, j = this.length; i < j; i++) {
        var tmpItem = this[i];
        if (retArray.indexOf(tmpItem, 0, eqlFunc) == -1) {
            retArray[k++] = tmpItem;
        }
    }
    return retArray;
};

// 查找重复的元素，返回重复元素组成的新数组
Array.prototype.findDuplicated = function (eqlFunc) {
    var retArray = [];
    if (typeof(eqlFunc) != "function") {
        eqlFunc = function (A, B) {
            return A == B;
        };
    }
    var k = 0,
        m = 0;
    var uniqueOnes = [];
    for (var i = 0, j = this.length; i < j; i++) {
        var tmpItem = this[i];
        if (uniqueOnes.indexOf(tmpItem, 0, eqlFunc) == -1) {
            uniqueOnes[k++] = tmpItem;
        } else {
            retArray[m++] = tmpItem;
        }
    }
    return retArray;
}

/**
 * 复制元素值或引用（从而返回一个新数组）
 */
function copyAsArray(srcArray) {
    srcArray = srcArray || [];
    var retArray = [];
    var len = srcArray.length;
    for (var i = 0; i < len; i++) {
        retArray[i] = srcArray[i];
    }
    return retArray;
}

// 声明名字空间
function declare(namespace) {
    if (typeof namespace != "string") {
        return null;
    }
    namespace = namespace.trim();
    if (namespace === "") {
        return null;
    }
    var names = namespace.split(".");
    var ns = [];
    var nsName = "";
    for (var i = 0; i < names.length; i++) {
        ns[i] = names[i];
        nsName = ns.join(".");
        if (eval('(typeof ' + nsName + ' == "undefined")')) {
            if (i === 0) {
                eval("var " + nsName + " = window." + nsName + " = {};");
            } else {
                eval(nsName + " = {};");
            }
        }
    }
    return eval(nsName);
}

// 返回绑定后的代理（主要用于事件处理）
function makeProxy(fn, context) {
    if (typeof context === "string") {
        var tmp = fn[context];
        context = fn;
        fn = tmp;
    }
    if (context == null) {
        context = isInBrowser ? window : null;
    }
    if (!isFunction(fn)) {
        return undefined;
    }
    var args = Array.prototype.slice.call(arguments, 2);
    var binded = function () {
        return fn.apply(context, args);
    };
    return binded;
}

// 判断某年是否为闰年
function isLeapYear(chkYear) {
    var theYear = null;
    if (isDate(chkYear)) {
        chkYear = chkYear.getFullYear();
    } else {
        theYear = ParseInt(chkYear);
    }
    if (!isNum(theYear)) {
        return false;
    }
    return (theYear % 4 === 0 && ((theYear % 100 !== 0) || (theYear % 400 === 0)));
}

// var __monthDaysAlgn = [01,02,03,04,05,06,07,08,09,10,11,12];
var __monthDaysNorm = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var __monthDaysLeap = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var __weekDayChsNames = ["日", "一", "二", "三", "四", "五", "六"];
// 按逻辑月份算
function getYearMonthDays(year, month) {
    var leap = isLeapYear(year);
    var mnth = ParseInt(month);
    var monthDays = leap ? __monthDaysLeap : __monthDaysNorm;
    return monthDays[mnth - 1];
}

Date.prototype.format = function (format) {
    /* yyyy-MM-dd HH:mm:ss.SSS */
    if (format == null) {
        format = "yyyy-MM-dd";
    }
    var result = format.replace(/yyyy/, this.getFullYear());
    result = result.replace(/yy/, padLeft(this.getYear(), 2, "0"));
    //
    result = result.replace(/MM/, padLeft(this.getMonth() + 1, 2, "0"));
    result = result.replace(/M/, this.getMonth() + 1);
    //
    result = result.replace(/dd/, padLeft(this.getDate(), 2, "0"));
    result = result.replace(/d/, this.getDate());
    //
    result = result.replace(/HH/, padLeft(this.getHours(), 2, "0"));
    result = result.replace(/H/, this.getHours());
    //
    result = result.replace(/mm/, padLeft(this.getMinutes(), 2, "0"));
    result = result.replace(/m/, this.getMinutes());
    //
    result = result.replace(/ss/, padLeft(this.getSeconds(), 2, "0"));
    result = result.replace(/s/, this.getSeconds());
    //
    result = result.replace(/SSS/, padLeft(this.getMilliseconds(), 3, "0"));
    result = result.replace(/S/, this.getMilliseconds());
    //
    return result;
};

if (Date._parse == null) {
    Date._parse = Date.parse;
    //
    Date.parse = function (dateStr, strictMode) {
        if (!dateStr) {
            return null;
        }
        if (isDate(dateStr)) {
            return dateStr;
        }
        strictMode = strictMode === true;
        if (strictMode) {
            dateStr = dateStr.replace(/-/g, "/");
            return Date._parse(dateStr);
        } else {
            dateStr = dateStr.replace(/年/g, '-');
            dateStr = dateStr.replace(/月/g, '-');
            dateStr = dateStr.replace(/日/g, '');
            dateStr = dateStr.replace(/时/g, ':');
            dateStr = dateStr.replace(/点/g, ':');
            dateStr = dateStr.replace(/分/g, ':');
            dateStr = dateStr.replace(/秒/g, '');
            dateStr = dateStr.replace(/毫秒/g, '');
            dateStr = dateStr.replace(/\s{2,}/g, " ");
            dateStr = dateStr.replace(/-/g, "/");
            // 解析毫秒
            var msIndex = dateStr.indexOf(".");
            if (msIndex != -1) {
                var ms = parseInt(dateStr.substring(msIndex + 1), 10);
                dateStr = dateStr.substring(0, msIndex);
                if (isNum(ms) && ms > 0) {
                    return Date._parse(dateStr) + ms;
                } else {
                    return Date._parse(dateStr);
                }
            } else {
                return Date._parse(dateStr);
            }
        }
    };
}

//
Date.parseAsDate = function (dateStr) {
    if (!dateStr) {
        return null;
    } else if (isDate(dateStr)) {
        return dateStr;
    } else if (isNum(dateStr)) {
        return new Date(dateStr);
    } else {
        return new Date(Date.parse(dateStr));
    }
};
//
Date.isValidDate = function (dateStr) {
    if (isDate(dateStr)) {
        return true;
    }
    var result = Date.parse(dateStr, true);
    return result != null && !isNaN(result);
};

Date.format = function (dateOrStr, format) {
    var date = Date.parseAsDate(dateOrStr);
    if (date) {
        return date.format(format || "yyyy-MM-dd");
    } else {
        return null;
    }
};

Date.prototype.isLeapYear = function () {
    return isLeapYear(this.getFullYear());
};

Date.prototype.getMonthDays = function () {
    return getYearMonthDays(this.getFullYear(), this.getMonth() + 1);
};
// toStdDateStr
if (Date.prototype._toString == null) {
    Date.prototype._toString = Date.prototype.toString;
    Date.prototype.toString = function (format) {
        if (typeof format == "undefined") {
            return this._toString();
        } else {
            return this.format(format);
        }
    };
}
//
Date.prototype.diff = function (that, part) {
    if (part == null) {
        part = "milliSecond";
    }
    var diffMs = this - that;
    switch (part.toLowerCase()) {
        case 'year':
            return this.getFullYear() - that.getFullYear();
        case 'month':
            return (this.getFullYear() - that.getFullYear()) * 12 + (this.getMonth() - that.getMonth());
        case 'day':
            return Math.floor(diffMs / 86400000);
        case 'hour':
            return Math.floor(diffMs / 3600000);
        case 'minute':
            return Math.floor(diffMs / 60000);
        case 'second':
            return Math.floor(diffMs / 1000);
        case 'week':
            return Math.floor(diffMs / 604800000);
        case 'quarter':
            return Math.ceil(this.diff(that, 'month') / 3);
        case 'millisecond':
            return diffMs;
        default:
            return null;
    }
};
// 返回某天是一年中的第几周(weekOfYear)
Date.prototype.getWeek = function () {
    var year1stDate = new Date(this.getFullYear(), 0, 1);
    var year1stDayOfWeek = year1stDate.getDay();
    var base = new Date(this.getFullYear(), this.getMonth(), this.getDate());
    var diffDays = base.diff(year1stDate, 'day');
    var diffWeeks = Math.floor(diffDays / 7);
    var leftDays = diffDays - diffWeeks * 7;
    return 1 + diffWeeks + Math.floor((year1stDayOfWeek + leftDays) / 7);
};
//
Date.prototype.asJSON = function () {
    var dt = {};
    dt.year = this.getFullYear();
    dt.month = this.getMonth() + 1;
    dt.day = this.getDate();
    dt.hour = this.getHours();
    dt.minute = this.getMinutes();
    dt.second = this.getSeconds();
    dt.milliSecond = this.getMilliseconds();
    dt.dayOfWeek = this.getDay();
    dt.weekOfYear = this.getWeek();
    dt.quarter = Math.ceil((this.getMonth() + 1) / 3);
    return dt;
};
//
Date.prototype.beginTime = function () {
    return new Date(this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0, 0);
};
Date.prototype.endTime = function () {
    var tomorrow0 = this.addDays(1).beginTime();
    return new Date(tomorrow0.getTime() - 1);
};
//
Date.prototype.add = function (count, part) {
    if (part == null) {
        part = "milliSecond";
    }
    switch (part.toLowerCase()) {
        case 'year':
            var base = this.asJSON();
            base.year += count;
            return new Date(base.year, base.month - 1, base.day, base.hour, base.minute, base.second, base.milliSecond);
        case 'month':
            var base = this.asJSON();
            var sign = Math.sign(count);
            var year = sign * Math.floor(Math.abs(count) / 12);
            var month = count % 12;
            base.year += year;
            base.month += month;
            return new Date(base.year, base.month - 1, base.day, base.hour, base.minute, base.second, base.milliSecond);
        case 'day':
            return new Date(this.getTime() + 86400000 * count);
        case 'hour':
            return new Date(this.getTime() + 3600000 * count);
        case 'minute':
            return new Date(this.getTime() + 60000 * count);
        case 'second':
            return new Date(this.getTime() + 1000 * count);
        case 'week':
            return new Date(this.getTime() + 604800000 * count);
        case 'quarter':
            return this.add(count * 3, 'month');
        case 'millisecond':
            return new Date(this.getTime() + count);
        default:
            return null;
    }
};

Date.prototype.addYears = function (count) {
    return this.add(count, 'year');
};
Date.prototype.addMonths = function (count) {
    return this.add(count, 'month');
};
Date.prototype.addDays = function (count) {
    return this.add(count, 'day');
};
Date.prototype.addHours = function (count) {
    return this.add(count, 'hour');
};
Date.prototype.addMinutes = function (count) {
    return this.add(count, 'minute');
};
Date.prototype.addSeconds = function (count) {
    return this.add(count, 'second');
};
Date.prototype.addWeeks = function (count) {
    return this.add(count, 'week');
};
Date.prototype.addQuarters = function (count) {
    return this.add(count, 'quarter');
};
Date.prototype.getPart = function (part) {
    if (part == null) {
        part = "milliSecond";
    }
    switch (part.toLowerCase()) {
        case 'year':
            return this.getFullYear();
        case 'month':
            return this.getMonth() + 1;
        case 'day':
            return this.getDate();
        case 'hour':
            return this.getHours();
        case 'minute':
            return this.getMinutes();
        case 'second':
            return this.getSeconds();
        case 'millisecond':
            return this.getMilliseconds();
        case 'dayofweek':
            return this.getDay();
        case 'weekofyear':
            return this.getWeek();
        case 'quarter':
            return Math.ceil((this.getMonth() + 1) / 3);
        default:
            return null;
    }
};

// => { days : , hours : }
function calcDiffHours(dtFrom, dtTo, dayValve) {
    if (!isNum(dayValve) || dayValve < 0) {
        dayValve = 1;
    }
    var fromDate = Date.parseAsDate(dtFrom);
    var toDate = Date.parseAsDate(dtTo);
    //
    var diffDays = toDate.diff(fromDate, 'day');
    // console.log("diffDays :" + diffDays);
    var diffHours = toDate.diff(fromDate, 'hour');
    // console.log("diffHours :" + diffHours);
    if (toDate >= fromDate) {
        if (diffDays >= dayValve) {
            diffHours = diffHours - diffDays * 24;
        } else {
            diffDays = 0;
        }
    } else {
        diffDays = diffHours = 0;
    }
    //
    return {
        days: diffDays,
        hours: diffHours
    }
}

// makeDiffHoursStr('2016-10-31 16:32', '2016-11-02 14:31') => 1天21小时
function makeDiffHoursStr(dtFrom, dtTo, dayValve) {
    var diff = calcDiffHours(dtFrom, dtTo, dayValve);
    console.log(diff.days + " days , " + diff.hours + " hours");
    var diffHoursStr;
    if (diff.days != 0 && diff.hours != 0) {
        diffHoursStr = (diff.days > 0) ? diff.days + "天" : diff.hours + "小时";
    } else {
        diffHoursStr = "0天"
    }
    return diffHoursStr;
}

//
function getObjAttr(_objToEval, attrName) {
    var tmpAttrName = __escapeJsonStr(attrName);
    var evalStr = '( _objToEval["' + trim(tmpAttrName) + '"] )';
    // alert(evalStr);
    return eval(evalStr);
}

// ------------
function __parseJson(jsonStr) {
    try {
        return eval('(' + jsonStr + ')');
    } catch (exp) {
        throw new TypeError("JSON parse error !");
    }
}

function __stringifyJson(obj) {
    var dblQuote = '"';
    var Callee = arguments.callee;
    if (obj == null) {
        return 'null';
    } else if (isBoolean(obj)) {
        return obj.toString();
    } else if (isNumber(obj)) {
        return isFinite(obj) ? obj.toString() : 'null';
    } else if (isString(obj)) {
        return dblQuote + __escapeJsonStr(obj) + dblQuote;
    } else if (isDate(obj)) {
        return dblQuote + obj.format('yyyy-MM-dd HH:mm:ss') + dblQuote;
    } else if (isArray(obj)) {
        var count = obj.length;
        var elemStrs = [];
        for (var i = 0; i < count; i++) {
            elemStrs[i] = Callee(obj[i]);
        }
        return "[" + elemStrs.join(",") + "]";
    } else if (typeof(obj.toJSON) == "function") {
        return obj.toJSON();
    } else // if(isPlainObject(obj)) //Strict Check ...
    {
        var attrStrs = [];
        var index = 0;
        var hasOwnProperty = Object.hasOwnProperty;
        for (var attr in obj) {
            if (hasOwnProperty.call(obj, attr)) {
                var value = obj[attr];
                attrStrs[index++] = Callee(attr) + ":" + Callee(value);
            }
        }
        return "{" + attrStrs.join(",") + "}";
    }
}

//
var __isJSONDefined = typeof(JSON) !== "undefined" && (isFunction(JSON.parse) || isFunction(JSON.stringify));
// alert("JSON already defined ? "+__isJSONDefined);

function isJSONDefined() {
    //__isJSONDefined = false;
    // force to use simple JSON object.(IGNORE browser built-in JSON)
    return __isJSONDefined;
}

//
if (!isJSONDefined()) {
    JSON = {};
    JSON.parse = __parseJson;
    JSON.stringify = __stringifyJson;
}

if (isFunction(JSON.parse)) {
    JSON.decode = JSON.parse;
    //
    JSON.decodeStr = function (str) {
        return str == null ? null : decodeURIComponent(str);
    };
}

if (isFunction(JSON.stringify)) {
    JSON.encode = JSON.stringify;
    //
    JSON.encodeStr = function (str) {
        return str == null ? null : encodeURIComponent(str);
    };
}

//
function merge(original, overwrite, includeFunc) {
    original = original || {};
    includeFunc = includeFunc !== false;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    //
    if (overwrite == null) {
        original = null;
    } else if (isPlainObject(overwrite)) {
        for (var key in overwrite) {
            if (hasOwnProperty.call(overwrite, key)) {
                var orgVal = original[key];
                var value = overwrite[key];
                original[key] = merge(orgVal, value);
            }
        }
    } else if (isArray(overwrite)) {
        original = [];
        var items = overwrite;
        for (var i = 0; i < items.length; i++) {
            original[i] = merge({}, items[i]);
        }
    } else if (typeof overwrite == "function" && includeFunc) {
        original = overwrite;
    } else {
        original = overwrite;
    }
    //
    return original;
}

/**
 * @class convenient hashmap for key/value pair operations
 * @param {String}
 *            [name] keymap name (for debug usage)
 * @constructor
 */
function KeyMap(name) {
    this.name = "";
    if (name != null) {
        this.name = "" + name;
    }
    /**
     * @private inner store object
     */
    var __data = {};
    /**
     * clear all key/value pairs
     */
    this.clear = function () {
        for (var xKey in __data) {
            delete __data[xKey];
        }
        //
        return this;
    };
    //
    this.merge = function (json) {
        merge(__data, json);
        //
        return this;
    };
    //
    this.from = function (json) {
        if (json == null) {
            json = {};
        }
        __data = json;
        //
        return this;
    };
    /**
     * save key/value pair
     *
     * @param {String}
     *            key (NOTE, key string will be trimmed before saving)
     * @param {Object}
     *            value
     */
    this.set = function (key, value) {
        __data[key] = value;
        //
        return this;
    };
    /**
     * 同 set
     */
    this.put = function (key, value) {
        return this.set(key, value);
    };
    /**
     * return value by given key
     *
     * @param {String}
     *            key the key of the key/value pair of which the value is to be retrieve
     * @returns {Object} the value
     */
    this.get = function (key) {
        return __data[key];
    };
    //
    this.data = function (key, value) {
        var argCount = arguments.length;
        if (argCount == 0) {
            return __data;
        } else if (argCount == 1) {
            return this.get(key);
        } else if (argCount == 2) {
            this.set(key, value);
        }
    };
    /**
     * check whether contains the given key
     *
     * @param {String}
     *            key
     * @returns {Boolean}
     */
    this.contains = function (key) {
        return typeof __data[key] != "undefined";
    };
    /**
     * like {@link KeyMap#set} except that will not overwrite existing key/value pair with the same key
     *
     * @param {String}
     *            key
     * @param {Object}
     *            value
     * @returns {Boolean} whether added successfully
     */
    this.add = function (key, value) {
        if (!this.contains(key)) {
            __data[key] = value;
            return true;
        }
        return false;
    };
    /**
     * remove the key/value pair by given key
     *
     * @param {String}
     *            key
     * @returns {Object} the removed value (or null if not exist)
     */
    this.remove = function (key) {
        var retValue = __data[key];
        delete __data[key];
        return retValue;
    };
    /**
     * return all the current keys
     *
     * @returns {Array} all the current keys
     */
    this.keys = function () {
        var retKeys = [];
        var keyCount = retKeys.length;
        for (var xKey in __data) {
            retKeys[keyCount++] = xKey;
        }
        return retKeys;
    };
    /**
     * return all the current values
     *
     * @returns {Array} all the current values
     */
    this.values = function () {
        var retValues = [];
        var valCount = retValues.length;
        for (var xKey in __data) {
            retValues[valCount++] = __data[xKey];
        }
        return retValues;
    };
    /**
     * return the count of current items
     *
     * @returns {Number}
     */
    this.size = function () {
        var retSize = 0;
        for (var xKey in __data) {
            retSize++;
        }
        return retSize;
    };
    //
    this.isEmpty = function () {
        return this.size() == 0;
    };
    /**
     * clone current key/value pairs to a newly created {@link #KeyMap } object
     *
     * @param {String}
     *            [newName] new keymap name
     */
    this.clone = function (newName) {
        var newKeyMap = new KeyMap(newName);
        var data = merge({}, __data);
        newKeyMap.from(data);
        return newKeyMap;
    };
    //
    this.reverse = function () {
        var _keys = this.keys();
        var tmpData = merge({}, __data);
        this.clear();
        //
        for (var i = _keys.length - 1; i >= 0; i--) {
            var key = _keys[i];
            __data[key] = tmpData[key];
        }
        //
        return this;
    };
    //
    this.toObject = function () {
        return merge({}, __data);
    };
    /**
     * json-style toString
     *
     * @param {Boolean}
     *            outputNull whether to output null value items
     * @returns {String} json string representing current key/value info
     */
    this.toJSON = function () {
        var _keys = this.keys();
        var _keysCount = _keys.length;
        var itemStrArray = [];
        var itemStrCount = 0;
        for (var i = 0; i < _keysCount; i++) {
            var tmpKey = _keys[i];
            var tmpValue = this.get(tmpKey);
            itemStrArray[itemStrCount++] = JSON.stringify(tmpKey + "") + ":" + JSON.stringify(tmpValue);
        }
        return "{" + itemStrArray.join(",") + "}";
    };
    //
    this.toString = this.toJSON;
}

KeyMap.newOne = function () {
    return new KeyMap();
};
// 静态方法，从给定的json对象包装出一个KeyMap对象
KeyMap.from = function (json) {
    var keyMap = KeyMap.newOne();
    keyMap.from(json);
    return keyMap;
};

//
function sortByKey(json, compFunc) {
    var retJson = null;
    //
    json = json || null;
    //
    if (json != null) {
        if (typeof compFunc !== "function") {
            compFunc = function (elA, elB) {
                return elA == elB ? 0 : (elA < elB ? -1 : 1);
            };
        }
        //
        retJson = {};
        var tmpMap = KeyMap.from(json);
        //
        var tmpKeys = tmpMap.keys();
        tmpKeys = tmpKeys.sort(compFunc);
        for (var i = 0; i < tmpKeys.length; i++) {
            var tmpKey = tmpKeys[i];
            var tmpValue = tmpMap.get(tmpKey);
            retJson[tmpKey] = tmpValue;
        }
    }
    //
    return retJson;
}
// [], key, [value1,value2,...]
function makeCrossCombsWith(srcCombs, key, values) {
    if (srcCombs == null) {
        srcCombs = [];
    }
    values = values || [];
    //
    var retCombs = [];
    var srcLen = srcCombs.length;
    if (srcLen == 0) {
        for (var j = 0; j < values.length; j++) {
            var json = {};
            json[key + ""] = values[j];
            retCombs.add(json);
        }
    } else {
        for (var i = 0; i < srcLen; i++) {
            var srcJson = srcCombs[i];
            for (var j = 0; j < values.length; j++) {
                var json = merge({}, srcJson);
                json[key + ""] = values[j];
                retCombs.add(json);
            }
        }
    }
    return retCombs;
}
// 生成 交叉组合项
// key2ValuesMap :: key => [value1,value2,...]
function makeCrossCombsFor(key2ValuesMap) {
    var retCombs = [];
    //
    var tmpMap = KeyMap.from(key2ValuesMap);
    var tmpKeys = tmpMap.keys();
    for (var i = 0; i < tmpKeys.length; i++) {
        var tmpKey = tmpKeys[i];
        var values = tmpMap.get(tmpKey);
        if (values != null && values.length > 0) {
            // 只考虑有效的
            retCombs = makeCrossCombsWith(retCombs, tmpKey, values);
        }
    }
    //
    return retCombs;
}
// limitSize 最大元素数
function LimitedQueue(limitSize) {
    var dataSize = limitSize;
    var dataList = [];
    // 相同元素判断函数
    var sameJudger = function (eA, eB) {
        return eA == eB;
    };
    // 设置相同元素判断函数
    this.setJudger = function (theJudger) {
        if (typeof theJudger == "function") {
            sameJudger = theJudger;
        }
        //
        return this;
    };
    //
    this.add = function (el) {
        var curIndex = dataList.indexOf(el, 0, sameJudger);
        if (curIndex != -1) {
            var tmpArray = [];
            for (var i = curIndex; i > 0; i--) {
                dataList[i] = dataList[i - 1];
            }
            dataList[0] = el;
        } else {
            dataList.unshift(el);
            if (dataList.length > dataSize) {
                dataList.length = dataSize;
            }
        }
        // console.log(JSON.encode(dataList));
        return this;
    };
    // 输出为数组
    this.toArray = function () {
        return dataList.clone();
    };
}

// 把json数据拆分成(key, value, jsonData)对传递给 keyValSetter 回调函数供其使用
function syncDataBy(jsonData, keyValSetter) {
    if (jsonData == null || typeof keyValSetter != "function") {
        return;
    }
    var hasOwnProperty = Object.hasOwnProperty;
    for (var key in jsonData) {
        if (hasOwnProperty.call(jsonData, key)) {
            try {
                keyValSetter(key, jsonData[key], jsonData);
            } catch (ex) {
                //
            }
        }
    }
}

/**
 * 比较两个数组，得到 theArray 相对于 refArray 的变化结果：</br> more : 多出的元素列表</br> less : 减少的元素列表</br> same : 一样的的元素列表（根据eqlFunc判断）</br> diff : 不同的元素列表（根据eqlFunc判断）</br>
 * ========================================================== 参数中的eqlFunc主要用于判断两个元素是否一样（如判断两条记录是否一样：无变化）</br> 参数中的isFunc主要用于判断两个数组中的对等元素（如判断两条记录的id值是否相等）</br>
 */
function compareArrays(theArray, refArray, eqlFunc, isFunc) {
    var result = {
        more: [],
        less: [],
        same: [],
        diff: []
    };
    if (refArray == null) {
        refArray = [];
    }
    if (theArray == null) {
        theArray = [];
    }
    var refCount = refArray.length;
    var theCount = theArray.length;
    if (refCount === 0) {
        result.more = theArray;
    } else if (theCount === 0) {
        result.less = refArray;
    } else {
        if (typeof(eqlFunc) != "function") {
            eqlFunc = function (A, B) {
                return A == B;
            };
        }
        //
        theArray = theArray.clone();
        refArray = refArray.clone();
        var more = result.more;
        var less = result.less;
        var same = result.same;
        var diff = result.diff;
        for (var i = refCount - 1, j = theCount - 1; i >= 0 || j >= 0;) {
            var refObj = i >= 0 ? refArray[i] : undefined;
            var theObj = j >= 0 ? theArray[j] : undefined;
            if (i >= 0) {
                var theIndex = theArray.indexOf(refObj, null, isFunc);
                if (theIndex != -1) {
                    theObj = theArray[theIndex];
                    if (eqlFunc(theObj, refObj)) {
                        same[same.length] = theObj;
                    } else {
                        diff[diff.length] = theObj;
                    }
                    theArray.removeAt(theIndex);
                    refArray.removeAt(i);
                    i--;
                    j--;
                } else {
                    less[less.length] = refObj;
                    refArray.removeAt(i);
                    i--;
                }
            } else {
                more[more.length] = theObj;
                theArray.removeAt(j);
                j--;
            }
        }
    }
    result.more = result.more.reverse();
    result.less = result.less.reverse();
    result.same = result.same.reverse();
    result.diff = result.diff.reverse();
    return result;
}

/**
 * 比较两个记录组成的（数组）列表，得到 newRecords 相对于 oldRecords 的变化结果：</br> added : 新添加 的记录列表</br> deleted : 新删除 的记录列表</br> modified : 新修改 的记录列表（根据recEqlFunc判断）</br>
 * ======================================================================== idColNameOrIdEqlFunc : id列名称 或 判断两条记录是否相等的函数（对复合键比较有用），<br/> 已经提供了默认的根据给定的id列名称进行比较的函数）<br/> recEqlFunc :
 * 判断两条记录是否相等（无变化）的函数，<br/> 已经提供了默认的判断两条记录相等比较的函数）<br/>
 */
function compareRecordsById(newRecords, oldRecords, idColNameOrIdEqlFunc, recEqlFunc) {
    var idEqlFunc = null;
    if (typeof(idColNameOrIdEqlFunc) == "function") {
        idEqlFunc = idColNameOrIdEqlFunc;
    } else {
        var idColName = idColNameOrIdEqlFunc;
        if (typeof(idColName) == "string") {
            if ((idColName = idColName.trim()) === "") {
                idColName = "id";
            }
        } else {
            idColName = "id";
        }
        idEqlFunc = function (record1, record2) {
            // 按 idColName 标识两个列表中的同一条记录
            if (record1 == record2) {
                return true;
            } else if (record1 != null && record2 != null) {
                return record1[idColName] == record2[idColName];
            } else {
                return false;
            }
        };
    }
    //
    // var hasOwnProperty = Object.hasOwnProperty;
    if (typeof(recEqlFunc) != "function") {
        recEqlFunc = function (record1, record2) {
            // 按列值完全比较
            if (record1 == record2) {
                return true;
            } else if (record1 != null && record2 != null) {
                var colName;
                for (colName in record1) {
                    // if(hasOwnProperty.call(record1, colName)) {
                    if (record1[colName] != record2[colName]) {
                        return false;
                    }
                    // }
                }
                for (colName in record2) {
                    // if(hasOwnProperty.call(record2, colName)) {
                    if (record1[colName] != record2[colName]) {
                        return false;
                    }
                    // }
                }
                return true;
            } else {
                return false;
            }
        };
    }
    //
    var _result = compareArrays(newRecords, oldRecords, recEqlFunc, idEqlFunc);
    //
    delete _result["same"];
    var result = {
        added: _result.more,
        deleted: _result.less,
        modified: _result.diff
    };
    return result;
}

//
function getClassOf(obj) {
    if (obj == null) {
        return null;
    }
    if (isFunction(obj)) {
        return Function;
    } else {
        return obj.constructor;
    }
}

function getFuncName(func) {
    if (!isFunction(func)) {
        return null;
    }
    var funcDeclRegExp = /^function(\s)+([\w\$]+?(\s)*\()/i;
    var funcStr = func.toString().trim();
    var funcDeclParts = funcStr.match(funcDeclRegExp);
    if (funcDeclParts != null && funcDeclParts.length > 0) {
        // alert(funcDeclParts.join("\n---\n"));
        var funcDecl = funcDeclParts[0].trim();
        var funcName = funcDecl.substring(8, funcDecl.length - 1);
        funcName = funcName.trim();
        // alert('"'+funcName+'"');
        return funcName;
    }
    return null;
}

function getClassNameOf(obj) {
    var objClass = getClassOf(obj);
    return objClass == null ? null : getFuncName(objClass);
}

/**
 * 是否金额数字
 *
 * @param numStr
 * @param allowSign
 * @return
 */
function isMoneyStr(numStr, allowSign) {
    if (numStr == null) {
        return false;
    }
    numStr = "" + numStr;
    allowSign = allowSign === true;
    var moneyRegexp = allowSign ? /^(\+|-)?([0-9]|[1-9][0-9]*)(\.\d+)?$/ : /^([0-9]|[1-9][0-9]*)(\.\d+)?$/;
    return moneyRegexp.test(numStr);
}
// 是否整数
function isIntStr(numStr) {
    if (numStr == null) {
        return false;
    }
    numStr = "" + numStr;
    var numRegexp = /^\-?\d+$/;
    return numRegexp.test(numStr);
}

// 是否自然数
function isNatualStr(numStr) {
    if (numStr == null) {
        return false;
    }
    numStr = "" + numStr;
    var numRegexp = /^([0-9]|[1-9][0-9]*)$/;
    return numRegexp.test(numStr);
}

//
function isValidEmail(checkStr) {
    var regExp = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
    return regExp.test(checkStr);
}

function isDigitsStr(checkStr) {
    var regExp = /^(\d)+$/;
    return regExp.test(checkStr);
}

function isDigitsOrHyphenStr(checkStr) {
    var regExp = /^(\d|-)+$/;
    return regExp.test(checkStr);
}

function isMobile(checkStr) {
    if (checkStr == null || checkStr.length != 11) {
        return false;
    }
    var regExp = /^1[3|4|5|7|8]\d{9}$/;
    return regExp.test(checkStr);
}

function isTelNo(checkStr) {
    if (checkStr == null || checkStr.length < 7) {
        return false;
    }
    var regExp = /(^([0][1-9][0-9]-?)?[0-9]{8}$)|(^([0][1-9]{3}-?)?[0-9]{7}$)/;
    return regExp.test(checkStr);
}

function isPhoneNumber(checkStr) {
    return isMobile(checkStr) || isTelNo(checkStr);
}

function isHexColor(checkStr) {
    if (checkStr == null || checkStr.length < 4) {
        return false;
    }
    var regExp = /^#[0-9a-fA-F]{3,6}$/;
    return regExp.test(checkStr);
}

//
var __cityCodeForIdentity = {
    11: "北京",
    12: "天津",
    13: "河北",
    14: "山西",
    15: "内蒙古",
    21: "辽宁",
    22: "吉林",
    23: "黑龙江 ",
    31: "上海",
    32: "江苏",
    33: "浙江",
    34: "安徽",
    35: "福建",
    36: "江西",
    37: "山东",
    41: "河南",
    42: "湖北 ",
    43: "湖南",
    44: "广东",
    45: "广西",
    46: "海南",
    50: "重庆",
    51: "四川",
    52: "贵州",
    53: "云南",
    54: "西藏 ",
    61: "陕西",
    62: "甘肃",
    63: "青海",
    64: "宁夏",
    65: "新疆",
    71: "台湾",
    81: "香港",
    82: "澳门",
    91: "国外 "
};

function isIdentity(code) {
    if (!code || !/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[12])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(code)) {
        console.log("身份证号格式错误");
        return false;
    } else if (!__cityCodeForIdentity[code.substr(0, 2)]) {
        console.log("省份编码错误");
        return false;
    } else {
        // 18位身份证需要验证最后一位校验位
        if (code.length == 18) {
            code = code.split('');
            // ∑(ai×Wi)(mod 11)
            // 加权因子
            var factor = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
            // 校验位
            var parity = [1, 0, 'X', 9, 8, 7, 6, 5, 4, 3, 2];
            var sum = 0;
            var ai = 0;
            var wi = 0;
            for (var i = 0; i < 17; i++) {
                ai = code[i];
                wi = factor[i];
                sum += ai * wi;
            }
            var last = parity[sum % 11];
            if (parity[sum % 11] != code[17]) {
                console.log("校验位错误");
                return false;
            }
        }
    }
    return true;
}

//
function checkPassword(chkStr, strict) {
    if (typeof chkStr != "string") {
        return "密码必须为字符串";
    }
    if (!/^[a-zA-Z_0-9]{6,16}$/ig.test(chkStr)) {
        return "密码必须为6~16位由字母、数字和下划线组成的字符串";
    }
    //
    strict = strict === true;
    if (strict) {
        if (/^[a-zA-Z]+$/ig.test(chkStr) || /^[0-9]+$/ig.test(chkStr)) {
            return "密码不能为纯字母或纯数字";
        }
    }
    return null;
}

// ------------------------- 浏览器页面专用 -------------------------
console = console || {
        // 防止浏览器不支持时报错
        log: function () {
        },
        trace: function () {
        },
        debug: function () {
        },
        info: function () {
        },
        warn: function () {
        },
        error: function () {
        },
        assert: function () {
        },
        clear: function () {
        },
        count: function () {
        },
        goup: function () {
        },
        goupEnd: function () {
        },
        dir: function () {
        },
        time: function () {
        },
        timeEnd: function () {
        },
        table: function () {
        }
    };

//
function getDomById(id) {
    return document.getElementById(id);
}

//
function getPageInfo() {
    return {
        title: window.document.title,
        href: window.location.href,
        hash: window.location.hash,
        protocol: window.location.protocol,
        host: window.location.host,
        port: window.location.port,
        hostname: window.location.hostname,
        origin: window.location.origin,
        pathname: window.location.pathname,
        search: window.location.search
    };
}

//
function getServerBase(docLoc) {
    if (typeof docLoc == "undefined") {
        docLoc = window.location.href;
    }
    var slashIndex = docLoc.indexOf("://") + 3;
    slashIndex = docLoc.indexOf("/", slashIndex);
    return docLoc.substring(0, slashIndex);
}

// 获取带有 protocol :// hostname[:port] 的全路径url
function getServerBasedUrl(appBasedUrl, refServerUrl) {
    if (appBasedUrl == null) {
        appBasedUrl = "/";
    }
    //
    if (appBasedUrl.indexOf("://") == -1) {
        // 处理serverBase问题
        if (typeof refServerUrl == "undefined") {
            refServerUrl = window.location.href;
        }
        //
        var serverBase = getServerBase(refServerUrl);
        appBasedUrl = serverBase + appBasedUrl;
    }
    //
    return appBasedUrl;
}

// WebSocket
function getWebSocket() {
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    return window.WebSocket;
}

// 合成Base64DataURL
function base64StrToDataURL(mimeType, base64Str) {
    var tpl = "data:{0};base64,{1}";
    return tpl.format(mimeType, base64Str);
}

// 播放音频文件
function playAudio(dataOrUrl, useProxy) {
    if (dataOrUrl == null) {
        return;
    }
    //
    useProxy = useProxy === true;
    //
    var tmpAudio = null;
    if (useProxy || !window.Audio) {
        tmpAudio = document.createElement("audio");
        tmpAudio = document.body.appendChild(tmpAudio);
        tmpAudio.onended = function () {
            tmpAudio.remove();
        };
    } else {
        tmpAudio = new Audio();
    }
    tmpAudio.src = dataOrUrl;
    try {
        tmpAudio.play();
    } catch (ex) {
        console.error(ex);
    }
}

// 语音朗读文本（=> makeTextAudioUrl）
function speakText(text, useProxy, failToDefaultAudio) {
    if (!useProxy && !(window.SpeechSynthesisUtterance && window.speechSynthesis)) {
        useProxy = true;
    }
    if (useProxy) {
        if (typeof makeTextAudioUrl == "function") {
            var textAudioUrl = makeTextAudioUrl(text, true);
            playAudio(textAudioUrl, true);
        } else {
            console.warn("没有找到 function makeTextAudioUrl(text, failToDefaultAudio) 的实现");
        }
    } else {
        // 创建一个 SpeechSynthesisUtterance的实例
        var newUtterance = new SpeechSynthesisUtterance();
        // 设置文本
        newUtterance.text = text;
        // 添加到队列
        window.speechSynthesis.speak(newUtterance);
    }
}

// 设置页面标题
function setPageTitle(docTitle, domId) {
    document.title = docTitle;
    //
    if (typeof domId == "string") {
        var dom = getDomById(domId);
        if (dom != null) {
            dom.innerText = docTitle;
        }
    }
}

// 更换页面url
var __hidden_link_id_for_page = genUniqueStr();
// beforeOpen 指定打开目标frame时作为打开前的回调函数
// target 在当前窗口打开时作为是否替换标记参数（替换当前页面而不保留历史）
function setPageUrl(url, target, beforeOpen) {
    if (typeof target == "string") {
        if (target == "_self") {
            window.location.href = url;
            return;
        }
        var dom = getDomById(__hidden_link_id_for_page);
        if (dom == null) {
            dom = document.createElement("A");
            dom.id = __hidden_link_id_for_page;
            dom.style.display = "none";
            dom = document.body.appendChild(dom);
        }
        dom.target = target;
        dom.href = url;
        if (typeof beforeOpen == "function") {
            dom.onclick = function () {
                return beforeOpen();
            };
        }
        dom.click();
    } else {
        if (target === true) {
            window.location.replace(url);
        } else {
            window.location.assign(url);
        }
    }
}

/**
 * 重复（事件）检查类 __RepeatChecker.isValidFor("log") <br/> __RepeatChecker.isValidFor("log", 1000)
 */
function __RepeatChecker() {
    var defaultInterval = 1000;
    var cachedCodeTimeMap = {};
    /**
     * @Param {String}
     *            uniqueCode 事件表示码
     * @Param {int}
     *            [interval=1000] 最小毫秒间隔
     */
    this.isValidFor = function (uniqueCode, interval) {
        var curTime = new Date().getTime();
        var lastTime = cachedCodeTimeMap[uniqueCode];
        cachedCodeTimeMap[uniqueCode] = curTime;
        if (lastTime == null) {
            return true;
        } else {
            if (typeof interval == "undefined") {
                interval = defaultInterval;
            }
            return curTime - lastTime >= interval;
        }
    };
}

// 全局预定义对象
var repeatChecker = new __RepeatChecker();
//
// 任务延迟器（防止任务频繁执行）
function TaskDelayer() {
    var _taskTimer = null;
    this.delay = function (taskFunc, delayTime) {
        clearTimeout(_taskTimer);
        //
        _taskTimer = setTimeout(taskFunc, delayTime);
    };
    this.cancel = function () {
        clearTimeout(_taskTimer);
    };
}

TaskDelayer.newOne = function () {
    return new TaskDelayer();
};

// ------------------------------------------------------------------
//
/**
 * 获取iframe所在的宿主窗口，如果没有宿主窗口将返回null
 */
var __cachedHostWin;

function getHostWindow() {
    if (typeof __cachedHostWin == "undefined") {
        var hostWin = window.parent;
        if (hostWin != null && hostWin != window) {
            __cachedHostWin = hostWin.window;
        } else {
            __cachedHostWin = null;
        }
    }
    return __cachedHostWin;
}

/**
 * 判断当前页面是否有（内嵌在）宿主窗口
 *
 * @return {Boolean}
 */
function hasHostWindow() {
    return getHostWindow() !== null;
}

// 是否是iframe页面
function isIframePage() {
    return getHostWindow() !== null;
}

function getWindowFrame() {
    if (hasHostWindow()) {
        return window.frameElement;
    } else {
        return null;
    }
}

/**
 * 调用宿主窗口的函数，可传递参数<br>
 * 如：callHostFunc('test', a,b)，将执行宿主窗口的 test(a,b)
 *
 * @param {String}
 *            callback function
 */
function callHostFunc(callback) {
    var hostWin = getHostWindow();
    if (hostWin != null) {
        var callbackFunc = callback;
        if (typeof callback == "string") {
            callbackFunc = hostWin[callback];
        }
        if (typeof callbackFunc == "function") {
            var argCount = arguments.length;
            var args = argCount > 1 ? Array.prototype.slice.call(arguments, 1) : [];
            return callbackFunc.apply(hostWin, args);
        }
    }
    return undefined;
}

/**
 * 显馈窗口信息
 */
function __echoWindowInfo() {
    var pageInfo = getPageInfo();
    alert(pageInfo.title + " => " + pageInfo.href);
}

/**
 * 显示宿主窗口信息（供调试用）
 */
function echoHostWindow() {
    callHostFunc(__echoWindowInfo);
}

/**
 * @param url
 * @returns {json: scheme, host, port, url, hash, uri, params}
 */
function parseUrl(url, toDecode) {
    toDecode = toDecode === true;
    if (typeof url == "undefined") {
        url = window.location.href;
    } else if (typeof url == "boolean") {
        toDecode = url;
        url = window.location.href;
    }
    //
    url = decodeURI(url);
    //
    var result = {};
    var colonIndex = url.indexOf("://");
    var remainUrl = null;
    if (colonIndex != -1) {
        result.scheme = url.substring(0, colonIndex);
        var slashIndex1 = colonIndex + 3;
        var slashIndex2 = url.indexOf("/", slashIndex1);
        var serverPart = url.substring(slashIndex1, slashIndex2);
        var portIndex = serverPart.indexOf(":");
        result.host = portIndex != -1 ? serverPart.substring(0, portIndex) : serverPart;
        result.port = portIndex != -1 ? parseInt(serverPart.substring(portIndex + 1), 10) : 80;
        remainUrl = url.substring(slashIndex2);
    } else {
        remainUrl = url;
    }
    //
    var fragIndex = remainUrl.indexOf("#");
    if (fragIndex != -1) {
        result.url = remainUrl.substring(0, fragIndex);
        var fragStr = remainUrl.substring(fragIndex).replace(/^[^#]*#?(.*)$/, '$1').trim();
        result.hash = fragStr;
        result.frags = {};
        if (fragStr !== "") {
            var frags = fragStr.split("&");
            for (var i = 0, j = frags.length; i < j; i++) {
                var nameValue = frags[i].split("=");
                var xName = toDecode ? decodeURIComponent(nameValue[0]) : nameValue[0];
                var xValue = toDecode ? decodeURIComponent(nameValue[1]) : nameValue[1];
                result.frags[xName] = xValue;
            }
        }
        //
        remainUrl = remainUrl.substring(0, fragIndex);
    } else {
        result.url = remainUrl;
    }
    //
    var flagStart = remainUrl.indexOf("?");
    result.uri = flagStart == -1 ? remainUrl : remainUrl.substring(0, flagStart);
    var paramStart = flagStart == -1 ? -1 : flagStart + 1;
    //
    result.params = {};
    if (paramStart != -1) {
        var paramStr = remainUrl.substring(paramStart).trim();
        var params = paramStr.length > 0 ? paramStr.split("&") : [];

        for (var i = 0, j = params.length; i < j; i++) {
            var nameValue = params[i].split("=");
            var xName = toDecode ? decodeURIComponent(nameValue[0]) : nameValue[0];
            var xValue = toDecode ? decodeURIComponent(nameValue[1]) : nameValue[1];
            result.params[xName] = xValue;
        }
    }
    // alert(JSON.encode(result));
    return result;
}

// extractUrlParams("url") => {json};
function extractUrlParams(url, toDecode) {
    return parseUrl(url, toDecode).params;
}

/**
 * 把参数map对象追加到baseUrl后，形成新的url
 */
function concatUrlParams(baseUrl, params, toEncode) {
    if (params == null) {
        return baseUrl;
    }
    var fragStr = null;
    var fragIndex = baseUrl.indexOf("#");
    if (fragIndex != -1) {
        fragStr = baseUrl.substring(fragIndex).replace(/^[^#]*#?(.*)$/, '$1').trim();
        fragStr = fragStr === "" ? null : fragStr;
        baseUrl = baseUrl.substring(0, fragIndex);
    }
    toEncode = toEncode === true;
    var appendStr = "";
    if (typeof params == "string") {
        appendStr = params;
    } else {
        var hasOwnProperty = Object.hasOwnProperty;
        var paramStrs = [];
        var index = 0;
        for (var attr in params) {
            if (hasOwnProperty.call(params, attr)) {
                var value = params[attr];
                if (typeof value == "function") {
                    value = value();
                }
                if (value == null) {
                    continue;
                }
                if (isArray(value)) {
                    var len = value.length;
                    for (var i = 0; i < len; i++) {
                        if (toEncode) {
                            paramStrs[index++] = encodeURIComponent(attr) + "=" + encodeURIComponent(value[i]);
                        } else {
                            paramStrs[index++] = attr + "=" + value[i];
                        }
                    }
                } else {
                    if (isDate(value)) {
                        value = value.format('yyyy-MM-dd HH:mm:ss');
                    } else if (isPlainObject(value)) {
                        value = JSON.encode(value);
                    }
                    if (toEncode) {
                        paramStrs[index++] = encodeURIComponent(attr) + "=" + encodeURIComponent(value);
                    } else {
                        paramStrs[index++] = attr + "=" + value;
                    }
                }
            }
        }
        appendStr = paramStrs.join("&");
    }
    var cntStr = "";
    if (baseUrl == null) {
        baseUrl = "";
    } else if (baseUrl.indexOf("?") == -1) {
        cntStr = "?";
    } else if (!baseUrl.endsWith("?")) {
        cntStr = "&";
    }
    return baseUrl + cntStr + appendStr + (fragStr == null ? "" : "#" + fragStr);
}

function makeUrl() {
    return concatUrlParams.apply(window, arguments);
}

// json参数转成url参数
function jsonToUrlParams(jsonParams, toEncode) {
    return concatUrlParams(null, jsonParams, toEncode);
}

// 生成唯一的请求字符串参数（不慎严密）
var __uniqueRequestName = "__Unique_Request_Id";
//
function genUniqueStr() {
    var ts = new Date().getTime();
    var randomSuffix = Math.round(Math.random() * 10000) + "_" + Math.round(Math.random() * 10000);
    return ts + "_" + randomSuffix;
}

// 给url附加唯一的参数（防止对话框缓存）
function makeUniqueRequest(url) {
    return concatUrlParams(url, __uniqueRequestName + "=" + genUniqueStr());
}

// 生成函数调用脚本（函数名称，参数数组）
// demox("x", {"x" : 5, "y" : 6})
function makeFuncCallScript(funcName, args) {
    var sb = String.builder();
    sb.append(funcName);
    sb.append("(");
    //
    if (args == null) {
        args = [];
    } else if (isPlainObject(args)) {
        args = [args];
    }
    for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        var argStr = isFunction(arg) ? __stringifyJson(getFuncName(arg)) : __stringifyJson(arg);
        if (i > 0) {
            sb.append(", ");
        }
        sb.append(argStr);
    }
    sb.append(");");
    //
    // console.log(sb.value);
    return sb.value;
}

// =================================== {{ iframe 对话框传值
// ===================================
// 对话框页面参数名称（预定义）
var __dlgArgParamName = "__dlgArgName";
// ====================== 宿主页面所需代码
// 对话框（页面）参数对象
var __dlgPageArgs = {};
// 获取对话框（页面）参数（供对话框页面回调的接口）
function getDlgPageArg(argName) {
    return __dlgPageArgs[argName];
}

// 设置对话框（页面）参数（本宿主页面调用）
function setDlgPageArg(argName, argValue) {
    __dlgPageArgs[argName] = argValue || null;
}

// 组成对话框页面url（页面url + argName）
function makeDlgPageUrl(pageUrl, argName, extParams) {
    if (pageUrl.charAt(0) == "/" && typeof getAppUrl == "function") {
        pageUrl = getAppUrl(pageUrl);
    }
    var theParams = extParams == null ? {} : merge({}, extParams);
    theParams[__dlgArgParamName] = argName;
    //
    return makeUrl(pageUrl, theParams);
}

// ====================== 对话框页面所需代码
// 从宿主窗口获取参数（argName 可以忽略）
function getDlgArgForMe() {
    var hostWin = getHostWindow();
    if (hostWin == null) { // 不在iframe中
        // 返回的值为 undefined
        return;
    }
    //
    var urlParams = extractUrlParams(true);
    argName = urlParams[__dlgArgParamName];
    return hostWin.getDlgPageArg(argName);
}

// =================================== }} iframe 对话框传值
// ===================================
/**
 * Javascript open window http://www.webtoolkit.info/
 */
function openWindow(pageUrl, options) {
    var args = '';
    if (typeof(options) == 'undefined') {
        options = {};
    }
    if (typeof(options.name) == 'undefined') {
        options.name = 'win' + Math.round(Math.random() * 100000);
    }
    if (typeof(options.height) != 'undefined' && typeof(options.fullscreen) == 'undefined') {
        args += "height=" + options.height + ",";
    }
    if (typeof(options.width) != 'undefined' && typeof(options.fullscreen) == 'undefined') {
        args += "width=" + options.width + ",";
    }
    if (typeof(options.fullscreen) != 'undefined') {
        args += "width=" + screen.availWidth + ",";
        args += "height=" + screen.availHeight + ",";
    }
    if (typeof(options.center) == 'undefined') {
        options.x = 0;
        options.y = 0;
        args += "screenx=" + options.x + ",";
        args += "screeny=" + options.y + ",";
        args += "left=" + options.x + ",";
        args += "top=" + options.y + ",";
    }
    if (typeof(options.center) != 'undefined' && typeof(options.fullscreen) == 'undefined') {
        options.y = Math.floor((screen.availHeight - (options.height || screen.height)) / 2) - (screen.height - screen.availHeight);
        options.x = Math.floor((screen.availWidth - (options.width || screen.width)) / 2) - (screen.width - screen.availWidth);
        args += "screenx=" + options.x + ",";
        args += "screeny=" + options.y + ",";
        args += "left=" + options.x + ",";
        args += "top=" + options.y + ",";
    }
    if (typeof(options.scrollbars) != 'undefined') {
        args += "scrollbars=1,";
    }
    if (typeof(options.menubar) != 'undefined') {
        args += "menubar=1,";
    }
    if (typeof(options.locationbar) != 'undefined') {
        args += "location=1,";
    }
    if (typeof(options.resizable) != 'undefined') {
        args += "resizable=1,";
    }

    return window.open(pageUrl, options.name, args);
}

// ----------
// 打开html预览窗口
function openWindowForHtml(htmlStr, winName) {
    winName = winName || "html-preview";
    htmlStr = htmlStr || "";
    //
    var win = openWindow("", {
        name: winName
    });
    //
    winDoc = win.document;
    winDoc.open();
    winDoc.write(htmlStr);
    winDoc.close();
}

// 关闭当前页面窗口
function closePageWindow() {
    window.opener = null;
    window.open("", "_self");
    window.close();
}


// 简单的html转换
function escapeHtmlStr(srcStr) {
    if (srcStr == null) {
        return null;
    }
    var htmlStr = "" + srcStr;
    htmlStr = replace(htmlStr, " ", "&nbsp;");
    htmlStr = replace(htmlStr, "<", "&lt;");
    htmlStr = replace(htmlStr, ">", "&gt;");
    htmlStr = replace(htmlStr, "\n", "<br>");
    return htmlStr;
}

// 加载js文件（具有防止重复加载功能）
function loadJs(jsSrc, parent, id) {
    //loadCallback(newlyLoaded, jsUrl)
    var loadCallback = null;
    if (typeof parent == "function") {
        loadCallback = parent;
        parent = null;
    }
    //
    if (typeof parent == "string") {
        var tmpParents = document.getElementsByTagName(parent);
        if (tmpParents.length > 0) {
            parent = tmpParents[0];
        } else {
            parent = null;
        }
    }
    if (parent == null) {
        parent = document.body;
    }
    //
    if (typeof id == "function") {
        loadCallback = id;
        id = null;
    }
    //
    if (id == null) {
        // 自动生成id;
        var lastSlashIndex = jsSrc.lastIndexOf("/");
        if (lastSlashIndex == -1) {
            lastSlashIndex = jsSrc.lastIndexOf("\\");
        }
        var dotIndex = -1;
        if (lastSlashIndex == -1) {
            dotIndex = jsSrc.indexOf(".js", 0);
            if (dotIndex == -1) {
                dotIndex = jsSrc.indexOf("?", 0);
            }
        } else {
            dotIndex = jsSrc.indexOf(".js", lastSlashIndex + 1);
            if (dotIndex == -1) {
                dotIndex = jsSrc.indexOf("?", lastSlashIndex + 1);
            }
        }
        id = jsSrc;
        if (dotIndex != -1) {
            id = jsSrc.substring(0, dotIndex) + ".js";
        }
        // id = replace(id, "\" );
    }
    // console.log("script id : " + id);
    var allScripts = document.getElementsByTagName("script");
    var existedJs = null;
    for (var i = 0, c = allScripts.length; i < c; i++) {
        var tmpScript = allScripts[i];
        if (tmpScript.id == id) {
            existedJs = tmpScript;
            break;
        }
    }
    if (existedJs != null) {
        if (existedJs.src == null || existedJs.src == "") {
            if (loadCallback != null) {
                existedJs.onload = function () {
                    loadCallback(true, jsSrc);
                };
            }
            existedJs.src = jsSrc;
        } else {
            //console.log("已经加载过：" + jsSrc);
            if (loadCallback != null) {
                loadCallback(false, jsSrc);
            }
        }
        return;
    }
    //
    var script = document.createElement('script');
    script.type = 'text/javascript';
    //script.charset = 'utf-8';
    script.src = jsSrc;
    script.id = id;
    if (loadCallback != null) {
        script.onload = function () {
            loadCallback(true, jsSrc);
        };
    }
    parent.appendChild(script);
}

// 加载css文件（具有防止重复加载功能）
function loadCss(cssSrc, parent, id) {
    //loadCallback(newlyLoaded, cssUrl)
    var loadCallback = null;
    if (typeof parent == "function") {
        loadCallback = parent;
        parent = null;
    }
    //
    if (typeof parent == "string") {
        var tmpParents = document.getElementsByTagName(parent);
        if (tmpParents.length > 0) {
            parent = tmpParents[0];
        } else {
            parent = null;
        }
    }
    if (parent == null) {
        parent = document.head;
    }
    //
    if (typeof id == "function") {
        loadCallback = id;
        id = null;
    }
    //
    if (id == null) {
        // 自动生成id;
        var lastSlashIndex = cssSrc.lastIndexOf("/");
        if (lastSlashIndex == -1) {
            lastSlashIndex = cssSrc.lastIndexOf("\\");
        }
        var dotIndex = -1;
        if (lastSlashIndex == -1) {
            dotIndex = cssSrc.indexOf(".css", 0);
            if (dotIndex == -1) {
                dotIndex = cssSrc.indexOf("?", 0);
            }
        } else {
            dotIndex = cssSrc.indexOf(".css", lastSlashIndex + 1);
            if (dotIndex == -1) {
                dotIndex = cssSrc.indexOf("?", lastSlashIndex + 1);
            }
        }
        id = cssSrc;
        if (dotIndex != -1) {
            id = cssSrc.substring(0, dotIndex) + ".css";
        }
        // id = replace(id, "\" );
    }
    // console.log("link css id : " + id);
    var allLinks = document.getElementsByTagName("link");
    var existedCss = null;
    for (var i = 0, c = allLinks.length; i < c; i++) {
        var tmpLink = allLinks[i];
        if (tmpLink.id == id) {
            existedCss = tmpLink;
            break;
        }
    }
    if (existedCss != null) {
        if (existedCss.href == null || existedCss.href == "") {
            if (loadCallback != null) {
                existedCss.onload = function () {
                    loadCallback(true, cssSrc);
                };
            }
            existedCss.href = cssSrc;
        } else {
            //console.log("已经加载过：" + cssSrc);
            if (loadCallback != null) {
                loadCallback(false, cssSrc);
            }
        }
        return;
    }
    //
    var link = document.createElement('link');
    link.type = "text/css";
    //link.charset = 'utf-8';
    link.rel = 'stylesheet';
    link.id = id;
    link.href = cssSrc;
    if (loadCallback != null) {
        link.onload = function () {
            loadCallback(true, cssSrc);
        };
    }
    parent.appendChild(link);
}

// 提取文件名部分
// /opt/data/aaa-bbb.jpg >> aaa-bbb.jpg
function extractShortFileName(filePath) {
    if (isNoB(filePath)) {
        return "";
    }
    // check for Unix-style path
    var pos = filePath.lastIndexOf("/");
    if (pos == -1) {
        // check for Windows-style path
        pos = filePath.lastIndexOf("\\");
    }
    if (pos != -1) {
        // any sort of path separator found
        return filePath.substring(pos + 1);
    } else {
        // plain name
        return filePath;
    }
}

// 提取文件扩展名
// /opt/data/aaa-bbb.jpg >> .jpg
function extractFileNameExt(fileName) {
    if (isNoB(fileName)) {
        return "";
    }
    var dotIndex = fileName.lastIndexOf('.');
    return dotIndex == -1 ? "" : fileName.substring(dotIndex);
}

// 判断给定的文件名是否图片文件
function isImageFile(fileName) {
    var suffix = extractFileNameExt(fileName).toLowerCase();
    return suffix.isIn(".gif", ".png", ".jpg", ".jpeg", ".bmp", ".ico");
}

function isImageType(fileType) {
    return fileType.startsWith("image/");
}

// 给文件名追加字符串
// (/opt/data/aaa-bbb.jpg , -m ) >> /opt/data/aaa-bbb-m.jpg
function addFileNamePart(orgFileName, partToAdd) {
    var parentPath = null;
    var pathSep = "/";
    var pos = orgFileName.lastIndexOf(pathSep);
    if (pos == -1) {
        pathSep = "\\";
        // check for Windows-style path
        pos = orgFileName.lastIndexOf(pathSep);
    }
    if (pos != -1) {
        parentPath = orgFileName.substring(0, pos);
    }
    //
    var shortFileName = extractShortFileName(orgFileName);
    var fileNameExt = extractFileNameExt(shortFileName);
    if (fileNameExt == "") {
        return (parentPath == null ? "" : parentPath + pathSep) + shortFileName + partToAdd;
    }
    //
    var extIndex = shortFileName.lastIndexOf(fileNameExt);
    var noExtFileName = shortFileName.substring(0, extIndex);
    return (parentPath == null ? "" : parentPath + pathSep) + noExtFileName + partToAdd + fileNameExt;
}

// 常见邮箱登录url
var __mailboxHomeUrls = {
    // 网易邮箱
    "@163.com": "http://mail.163.com/",
    "@126.com": "http://mail.126.com/",
    "@yeah.net": "http://mail.yeah.net/",
    "@vip.163.com": "http://vip.163.com/",
    // 腾讯邮箱
    "@qq.com": "https://mail.qq.com/cgi-bin/loginpage",
    // 新浪邮箱
    "@sina.com": "http://mail.sina.com.cn/",
    "@sina.cn": "http://mail.sina.com.cn/",
    "@vip.sina.com": "http://vip.sina.com.cn/",
    // 搜狐邮箱
    "@sohu.com": "http://mail.sohu.com/",
    // 微软邮箱
    "@hotmail.com": "https://login.live.com/",
    "@live.com": "https://login.live.com/",
    "@live.cn": "https://login.live.com/",
    "@msn.com": "https://login.live.com/",
    // 189邮箱(电信)
    "@189.cn": "http://webmail30.189.cn/w2/",
    // 139邮箱（移动）
    "@139.com": "http://mail.10086.cn/",
    // tom邮箱
    "@tom.com": "http://web.mail.tom.com/webmail/login/index.action",
    // 21cn邮箱
    "@21cn.com": "http://mail.21cn.com/w2/"
};
// 获取邮箱的登录url
function getMailHomeUrl(email) {
    if (!isValidEmail(email)) {
        return null;
    }
    var mailBox = email.substring(email.indexOf("@"));
    return __mailboxHomeUrls[mailBox];
}

/**
 * 获取密码文本的强度 返回 => W : weak 弱, M : middle 中, S : strong 强
 */
function getPasswordStrength(password) {
    if (isNoB(password)) {
        return null;
    }
    if (password.length >= 6) {
        if (/[a-zA-Z]+/.test(password) && /[0-9]+/.test(password) && /\W+\D+/.test(password)) {
            return "S";
        } else if (/[a-zA-Z]+/.test(password) || /[0-9]+/.test(password) || /\W+\D+/.test(password)) {
            if (/[a-zA-Z]+/.test(password) && /[0-9]+/.test(password)) {
                return "M";
            } else if (/\[a-zA-Z]+/.test(password) && /\W+\D+/.test(password)) {
                return "M";
            } else if (/[0-9]+/.test(password) && /\W+\D+/.test(password)) {
                return "M";
            } else {
                return "W";
            }
        }
    }
    return null;
}

/**
 * var initTrackInfo = { id : "hotspot-1", //初始相对于图片的位置(rect，类似于 image-map) left : 210, top : 1010, width : 236, height : 78, //图片大小信息（像素） refId : "image-1", refWidth :640, refHeight : 1138 };
 * 自动计算（跟踪）图片中原来的(rect)位置在图片缩放后的新位置
 *
 * @param initTrackInfo
 * @returns {json: {left, top, width, height}}
 */
function calcTrackerDim(initTrackInfo) {
    var xLeft, xTop, xWidth, xHeight;
    var refObj = $("#" + initTrackInfo.refId);
    var left = refObj.offset().left;
    var top = refObj.offset().top;
    var width = refObj.width();
    var height = refObj.height();
    //
    xTop = height / initTrackInfo.refHeight * initTrackInfo.top + top;
    xLeft = width / initTrackInfo.refWidth * initTrackInfo.left + left;
    xWidth = width / initTrackInfo.refWidth * (initTrackInfo.left + initTrackInfo.width) + left - xLeft;
    xHeight = height / initTrackInfo.refHeight * (initTrackInfo.top + initTrackInfo.height) + top - xTop;
    return {
        left: Math.round(xLeft),
        top: Math.round(xTop),
        width: Math.round(xWidth),
        height: Math.round(xHeight)
    };
}
// 条件监视器（定时检查给定的条件，然后执行指定的函数）
function CondMonitor(name) {
    var _name = name || "CondMonitor" + genUniqueStr();
    var _interval = 10;
    var _evalExpr = null;
    var _execFunc = null;
    var _timeout = -1;
    var _timeoutHandler = null;
    //
    var _timer = null;
    var _startTime = 0;
    var _times = 0;
    //
    this.interval = function (interval) {
        if (typeof interval == "number" && interval > 0) {
            _interval = interval;
        }
        //
        return this;
    };
    //
    this.timeout = function (timeout, timeoutHandler) {
        if (typeof timeout == "number" && timeout > 0) {
            _timeout = timeout;
        }
        if (typeof timeoutHandler == "function") {
            _timeoutHandler = timeoutHandler;
        }
        //
        return this;
    };
    //
    this.when = function (evalExpr) {
        if (evalExpr != null) {
            _evalExpr = evalExpr;
        }
        //
        return this;
    };
    //
    this.then = function (execFunc) {
        if (typeof execFunc == "function") {
            _execFunc = execFunc;
        }
        //
        return this;
    };
    //
    this.start = function () {
        if (_timer != null) {
            clearInterval(_timer);
        }
        _times = 0;
        //
        if (_evalExpr == null || _execFunc == null) {
            console.error(_name + ">> 请先设置when(...)条件 和 执行then(...)函数");
            //
            return this;
        }
        //
        var proxyFunc = _evalExpr;
        if (typeof _evalExpr != "function") {
            proxyFunc = function () {
                return eval(_evalExpr) == true;
            };
        }
        //
        _timer = setTimeout(function () {
            _times++;
            //
            // console.log(_name + ">> 正在执行第 " + _times + "次条件检查...");
            if (proxyFunc() == true) {
                // console.log(_name + ">> 条件已满足");
                _execFunc();
                //
                return;
            }
            if (_timeout > 0) {
                var curTime = new Date().getTime();
                if (curTime - _startTime >= _timeout) {
                    if (_timeoutHandler != null) {
                        _timeoutHandler();
                    } else {
                        console.warn(_name + ">> 超时已取消执行");
                    }
                    //
                    return;
                }
            }
            //
            _timer = setTimeout(arguments.callee, _interval);
        }, _interval);
        //
        _startTime = new Date().getTime();
        //
        return this;
    };
}
//
CondMonitor.newOne = function (name) {
    return new CondMonitor(name);
};

// 解决部分刷新问题
function asTimeout(func, timeout) {
    if (typeof timeout !== "number") {
        timeout = 0;
    }
    //
    setTimeout(func, timeout);
}

// 浏览器信息
var Browser = {};
(function () {

    if (isInBrowser) {
        Browser.appName = navigator.appName;
        Browser.name = Browser.appName;
        var userAgent = navigator.userAgent;
        Browser.userAgent = userAgent;
        Browser.mozilla = false;
        Browser.webkit = false;
        Browser.opera = false;
        Browser.safari = false;
        Browser.chrome = false;
        Browser.msie = false;
        Browser.android = false;
        Browser.blackberry = false;
        Browser.ios = false;
        Browser.operaMobile = false;
        Browser.windowsMobile = false;
        Browser.mobile = false;
        Browser.envName = "";
        //
        Browser.fullVersion = '' + parseFloat(navigator.appVersion);
        Browser.majorVersion = parseInt(navigator.appVersion, 10);
        var nameOffset, verOffset, ix;
        // In Opera, the true version is after "Opera" or after "Version"
        if ((verOffset = userAgent.indexOf("Opera")) != -1) {
            Browser.opera = true;
            Browser.name = "Opera";
            Browser.fullVersion = userAgent.substring(verOffset + 6);
            if ((verOffset = userAgent.indexOf("Version")) != -1) {
                Browser.fullVersion = userAgent.substring(verOffset + 8);
            }
        }
        // In MSIE < 11, the true version is after "MSIE" in userAgent
        else if ((verOffset = userAgent.indexOf("MSIE")) != -1) {
            Browser.msie = true;
            Browser.name = "Microsoft Internet Explorer";
            Browser.fullVersion = userAgent.substring(verOffset + 5);
        }
        // In TRIDENT (IE11) => 11, the true version is after "rv:" in userAgent
        else if (userAgent.indexOf("Trident") != -1) {
            Browser.msie = true;
            Browser.name = "Microsoft Internet Explorer";
            var start = userAgent.indexOf("rv:") + 3;
            var end = start + 4;
            Browser.fullVersion = userAgent.substring(start, end);
        }
        // In Chrome, the true version is after "Chrome"
        else if ((verOffset = userAgent.indexOf("Chrome")) != -1) {
            Browser.webkit = true;
            Browser.chrome = true;
            Browser.name = "Chrome";
            Browser.fullVersion = userAgent.substring(verOffset + 7);
        }
        // In Safari, the true version is after "Safari" or after "Version"
        else if ((verOffset = userAgent.indexOf("Safari")) != -1) {
            Browser.webkit = true;
            Browser.safari = true;
            Browser.name = "Safari";
            Browser.fullVersion = userAgent.substring(verOffset + 7);
            if ((verOffset = userAgent.indexOf("Version")) != -1) {
                Browser.fullVersion = userAgent.substring(verOffset + 8);
            }
        }
        // In Safari, the true version is after "Safari" or after "Version"
        else if ((verOffset = userAgent.indexOf("AppleWebKit")) != -1) {
            Browser.webkit = true;
            Browser.name = "Safari";
            Browser.fullVersion = userAgent.substring(verOffset + 7);
            if ((verOffset = userAgent.indexOf("Version")) != -1) {
                Browser.fullVersion = userAgent.substring(verOffset + 8);
            }
        }
        // In Firefox, the true version is after "Firefox"
        else if ((verOffset = userAgent.indexOf("Firefox")) != -1) {
            Browser.mozilla = true;
            Browser.name = "Firefox";
            Browser.fullVersion = userAgent.substring(verOffset + 8);
        }
        // In most other browsers, "name/version" is at the end of userAgent
        else if ((nameOffset = userAgent.lastIndexOf(' ') + 1) < (verOffset = userAgent.lastIndexOf('/'))) {
            Browser.name = userAgent.substring(nameOffset, verOffset);
            Browser.fullVersion = userAgent.substring(verOffset + 1);
            if (Browser.name.toLowerCase() == Browser.name.toUpperCase()) {
                Browser.name = navigator.appName;
            }
        }
        /* Check all mobile environments */
        Browser.android = (/Android/i).test(userAgent);
        Browser.blackberry = (/BlackBerry/i).test(userAgent);
        Browser.ios = (/iPhone|iPad|iPod/i).test(userAgent);
        Browser.operaMobile = (/Opera Mini/i).test(userAgent);
        Browser.windowsMobile = (/IEMobile/i).test(userAgent);
        Browser.mobile = Browser.android || Browser.blackberry || Browser.ios || Browser.windowsMobile || Browser.operaMobile;
        // trim the fullVersion string at semicolon/space if present
        if ((ix = Browser.fullVersion.indexOf(";")) != -1) {
            Browser.fullVersion = Browser.fullVersion.substring(0, ix);
        }
        if ((ix = Browser.fullVersion.indexOf(" ")) != -1) {
            Browser.fullVersion = Browser.fullVersion.substring(0, ix);
        }
        Browser.majorVersion = parseInt('' + Browser.fullVersion, 10);
        if (isNaN(Browser.majorVersion)) {
            Browser.fullVersion = '' + parseFloat(navigator.appVersion);
            Browser.majorVersion = parseInt(navigator.appVersion, 10);
        }
        Browser.version = Browser.majorVersion;
        //
        if (userAgent.indexOf("QQ/") != -1) {
            Browser.envName = "QQ";
        } else if (userAgent.indexOf("MicroMessenger/") != -1) {
            Browser.envName = "WX";
        }
    }

})();

/**
 * 判断是否在微信浏览器中
 */
function isWeiXinEnv() {
    return Browser.envName === "WX";
}

module.exports = {
    moduleName: moduleName,
    //
    StringBuilder: StringBuilder,
    //
    isString: isString,
    isNumber: isNumber,
    isBoolean: isBoolean,
    isFunction: isFunction,
    isDate: isDate,

    genUniqueStr: genUniqueStr,
    makeUniqueRequest: makeUniqueRequest,
    makeUrl: makeUrl,
    parseUrl: parseUrl,
    extractUrlParams: extractUrlParams,

    //
    Browser: Browser
};
},{}],5:[function(require,module,exports){
/*!
 * assertion-error
 * Copyright(c) 2013 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Return a function that will copy properties from
 * one object to another excluding any originally
 * listed. Returned function will create a new `{}`.
 *
 * @param {String} excluded properties ...
 * @return {Function}
 */

function exclude () {
  var excludes = [].slice.call(arguments);

  function excludeProps (res, obj) {
    Object.keys(obj).forEach(function (key) {
      if (!~excludes.indexOf(key)) res[key] = obj[key];
    });
  }

  return function extendExclude () {
    var args = [].slice.call(arguments)
      , i = 0
      , res = {};

    for (; i < args.length; i++) {
      excludeProps(res, args[i]);
    }

    return res;
  };
};

/*!
 * Primary Exports
 */

module.exports = AssertionError;

/**
 * ### AssertionError
 *
 * An extension of the JavaScript `Error` constructor for
 * assertion and validation scenarios.
 *
 * @param {String} message
 * @param {Object} properties to include (optional)
 * @param {callee} start stack function (optional)
 */

function AssertionError (message, _props, ssf) {
  var extend = exclude('name', 'message', 'stack', 'constructor', 'toJSON')
    , props = extend(_props || {});

  // default values
  this.message = message || 'Unspecified AssertionError';
  this.showDiff = false;

  // copy from properties
  for (var key in props) {
    this[key] = props[key];
  }

  // capture stack trace
  ssf = ssf || arguments.callee;
  if (ssf && Error.captureStackTrace) {
    Error.captureStackTrace(this, ssf);
  } else {
    try {
      throw new Error();
    } catch(e) {
      this.stack = e.stack;
    }
  }
}

/*!
 * Inherit from Error.prototype
 */

AssertionError.prototype = Object.create(Error.prototype);

/*!
 * Statically set name
 */

AssertionError.prototype.name = 'AssertionError';

/*!
 * Ensure correct constructor
 */

AssertionError.prototype.constructor = AssertionError;

/**
 * Allow errors to be converted to JSON for static transfer.
 *
 * @param {Boolean} include stack (default: `true`)
 * @return {Object} object that can be `JSON.stringify`
 */

AssertionError.prototype.toJSON = function (stack) {
  var extend = exclude('constructor', 'toJSON', 'stack')
    , props = extend({ name: this.name }, this);

  // include stack if exists and not turned off
  if (false !== stack && this.stack) {
    props.stack = this.stack;
  }

  return props;
};

},{}],6:[function(require,module,exports){
module.exports = require('./lib/chai');

},{"./lib/chai":7}],7:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var used = []
  , exports = module.exports = {};

/*!
 * Chai version
 */

exports.version = '3.5.0';

/*!
 * Assertion Error
 */

exports.AssertionError = require('assertion-error');

/*!
 * Utils for plugins (not exported)
 */

var util = require('./chai/utils');

/**
 * # .use(function)
 *
 * Provides a way to extend the internals of Chai
 *
 * @param {Function}
 * @returns {this} for chaining
 * @api public
 */

exports.use = function (fn) {
  if (!~used.indexOf(fn)) {
    fn(this, util);
    used.push(fn);
  }

  return this;
};

/*!
 * Utility Functions
 */

exports.util = util;

/*!
 * Configuration
 */

var config = require('./chai/config');
exports.config = config;

/*!
 * Primary `Assertion` prototype
 */

var assertion = require('./chai/assertion');
exports.use(assertion);

/*!
 * Core Assertions
 */

var core = require('./chai/core/assertions');
exports.use(core);

/*!
 * Expect interface
 */

var expect = require('./chai/interface/expect');
exports.use(expect);

/*!
 * Should interface
 */

var should = require('./chai/interface/should');
exports.use(should);

/*!
 * Assert interface
 */

var assert = require('./chai/interface/assert');
exports.use(assert);

},{"./chai/assertion":8,"./chai/config":9,"./chai/core/assertions":10,"./chai/interface/assert":11,"./chai/interface/expect":12,"./chai/interface/should":13,"./chai/utils":27,"assertion-error":5}],8:[function(require,module,exports){
/*!
 * chai
 * http://chaijs.com
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var config = require('./config');

module.exports = function (_chai, util) {
  /*!
   * Module dependencies.
   */

  var AssertionError = _chai.AssertionError
    , flag = util.flag;

  /*!
   * Module export.
   */

  _chai.Assertion = Assertion;

  /*!
   * Assertion Constructor
   *
   * Creates object for chaining.
   *
   * @api private
   */

  function Assertion (obj, msg, stack) {
    flag(this, 'ssfi', stack || arguments.callee);
    flag(this, 'object', obj);
    flag(this, 'message', msg);
  }

  Object.defineProperty(Assertion, 'includeStack', {
    get: function() {
      console.warn('Assertion.includeStack is deprecated, use chai.config.includeStack instead.');
      return config.includeStack;
    },
    set: function(value) {
      console.warn('Assertion.includeStack is deprecated, use chai.config.includeStack instead.');
      config.includeStack = value;
    }
  });

  Object.defineProperty(Assertion, 'showDiff', {
    get: function() {
      console.warn('Assertion.showDiff is deprecated, use chai.config.showDiff instead.');
      return config.showDiff;
    },
    set: function(value) {
      console.warn('Assertion.showDiff is deprecated, use chai.config.showDiff instead.');
      config.showDiff = value;
    }
  });

  Assertion.addProperty = function (name, fn) {
    util.addProperty(this.prototype, name, fn);
  };

  Assertion.addMethod = function (name, fn) {
    util.addMethod(this.prototype, name, fn);
  };

  Assertion.addChainableMethod = function (name, fn, chainingBehavior) {
    util.addChainableMethod(this.prototype, name, fn, chainingBehavior);
  };

  Assertion.overwriteProperty = function (name, fn) {
    util.overwriteProperty(this.prototype, name, fn);
  };

  Assertion.overwriteMethod = function (name, fn) {
    util.overwriteMethod(this.prototype, name, fn);
  };

  Assertion.overwriteChainableMethod = function (name, fn, chainingBehavior) {
    util.overwriteChainableMethod(this.prototype, name, fn, chainingBehavior);
  };

  /**
   * ### .assert(expression, message, negateMessage, expected, actual, showDiff)
   *
   * Executes an expression and check expectations. Throws AssertionError for reporting if test doesn't pass.
   *
   * @name assert
   * @param {Philosophical} expression to be tested
   * @param {String|Function} message or function that returns message to display if expression fails
   * @param {String|Function} negatedMessage or function that returns negatedMessage to display if negated expression fails
   * @param {Mixed} expected value (remember to check for negation)
   * @param {Mixed} actual (optional) will default to `this.obj`
   * @param {Boolean} showDiff (optional) when set to `true`, assert will display a diff in addition to the message if expression fails
   * @api private
   */

  Assertion.prototype.assert = function (expr, msg, negateMsg, expected, _actual, showDiff) {
    var ok = util.test(this, arguments);
    if (true !== showDiff) showDiff = false;
    if (true !== config.showDiff) showDiff = false;

    if (!ok) {
      var msg = util.getMessage(this, arguments)
        , actual = util.getActual(this, arguments);
      throw new AssertionError(msg, {
          actual: actual
        , expected: expected
        , showDiff: showDiff
      }, (config.includeStack) ? this.assert : flag(this, 'ssfi'));
    }
  };

  /*!
   * ### ._obj
   *
   * Quick reference to stored `actual` value for plugin developers.
   *
   * @api private
   */

  Object.defineProperty(Assertion.prototype, '_obj',
    { get: function () {
        return flag(this, 'object');
      }
    , set: function (val) {
        flag(this, 'object', val);
      }
  });
};

},{"./config":9}],9:[function(require,module,exports){
module.exports = {

  /**
   * ### config.includeStack
   *
   * User configurable property, influences whether stack trace
   * is included in Assertion error message. Default of false
   * suppresses stack trace in the error message.
   *
   *     chai.config.includeStack = true;  // enable stack on error
   *
   * @param {Boolean}
   * @api public
   */

   includeStack: false,

  /**
   * ### config.showDiff
   *
   * User configurable property, influences whether or not
   * the `showDiff` flag should be included in the thrown
   * AssertionErrors. `false` will always be `false`; `true`
   * will be true when the assertion has requested a diff
   * be shown.
   *
   * @param {Boolean}
   * @api public
   */

  showDiff: true,

  /**
   * ### config.truncateThreshold
   *
   * User configurable property, sets length threshold for actual and
   * expected values in assertion errors. If this threshold is exceeded, for
   * example for large data structures, the value is replaced with something
   * like `[ Array(3) ]` or `{ Object (prop1, prop2) }`.
   *
   * Set it to zero if you want to disable truncating altogether.
   *
   * This is especially userful when doing assertions on arrays: having this
   * set to a reasonable large value makes the failure messages readily
   * inspectable.
   *
   *     chai.config.truncateThreshold = 0;  // disable truncating
   *
   * @param {Number}
   * @api public
   */

  truncateThreshold: 40

};

},{}],10:[function(require,module,exports){
/*!
 * chai
 * http://chaijs.com
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, _) {
  var Assertion = chai.Assertion
    , toString = Object.prototype.toString
    , flag = _.flag;

  /**
   * ### Language Chains
   *
   * The following are provided as chainable getters to
   * improve the readability of your assertions. They
   * do not provide testing capabilities unless they
   * have been overwritten by a plugin.
   *
   * **Chains**
   *
   * - to
   * - be
   * - been
   * - is
   * - that
   * - which
   * - and
   * - has
   * - have
   * - with
   * - at
   * - of
   * - same
   *
   * @name language chains
   * @namespace BDD
   * @api public
   */

  [ 'to', 'be', 'been'
  , 'is', 'and', 'has', 'have'
  , 'with', 'that', 'which', 'at'
  , 'of', 'same' ].forEach(function (chain) {
    Assertion.addProperty(chain, function () {
      return this;
    });
  });

  /**
   * ### .not
   *
   * Negates any of assertions following in the chain.
   *
   *     expect(foo).to.not.equal('bar');
   *     expect(goodFn).to.not.throw(Error);
   *     expect({ foo: 'baz' }).to.have.property('foo')
   *       .and.not.equal('bar');
   *
   * @name not
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('not', function () {
    flag(this, 'negate', true);
  });

  /**
   * ### .deep
   *
   * Sets the `deep` flag, later used by the `equal` and
   * `property` assertions.
   *
   *     expect(foo).to.deep.equal({ bar: 'baz' });
   *     expect({ foo: { bar: { baz: 'quux' } } })
   *       .to.have.deep.property('foo.bar.baz', 'quux');
   *
   * `.deep.property` special characters can be escaped
   * by adding two slashes before the `.` or `[]`.
   *
   *     var deepCss = { '.link': { '[target]': 42 }};
   *     expect(deepCss).to.have.deep.property('\\.link.\\[target\\]', 42);
   *
   * @name deep
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('deep', function () {
    flag(this, 'deep', true);
  });

  /**
   * ### .any
   *
   * Sets the `any` flag, (opposite of the `all` flag)
   * later used in the `keys` assertion.
   *
   *     expect(foo).to.have.any.keys('bar', 'baz');
   *
   * @name any
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('any', function () {
    flag(this, 'any', true);
    flag(this, 'all', false)
  });


  /**
   * ### .all
   *
   * Sets the `all` flag (opposite of the `any` flag)
   * later used by the `keys` assertion.
   *
   *     expect(foo).to.have.all.keys('bar', 'baz');
   *
   * @name all
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('all', function () {
    flag(this, 'all', true);
    flag(this, 'any', false);
  });

  /**
   * ### .a(type)
   *
   * The `a` and `an` assertions are aliases that can be
   * used either as language chains or to assert a value's
   * type.
   *
   *     // typeof
   *     expect('test').to.be.a('string');
   *     expect({ foo: 'bar' }).to.be.an('object');
   *     expect(null).to.be.a('null');
   *     expect(undefined).to.be.an('undefined');
   *     expect(new Error).to.be.an('error');
   *     expect(new Promise).to.be.a('promise');
   *     expect(new Float32Array()).to.be.a('float32array');
   *     expect(Symbol()).to.be.a('symbol');
   *
   *     // es6 overrides
   *     expect({[Symbol.toStringTag]:()=>'foo'}).to.be.a('foo');
   *
   *     // language chain
   *     expect(foo).to.be.an.instanceof(Foo);
   *
   * @name a
   * @alias an
   * @param {String} type
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function an (type, msg) {
    if (msg) flag(this, 'message', msg);
    type = type.toLowerCase();
    var obj = flag(this, 'object')
      , article = ~[ 'a', 'e', 'i', 'o', 'u' ].indexOf(type.charAt(0)) ? 'an ' : 'a ';

    this.assert(
        type === _.type(obj)
      , 'expected #{this} to be ' + article + type
      , 'expected #{this} not to be ' + article + type
    );
  }

  Assertion.addChainableMethod('an', an);
  Assertion.addChainableMethod('a', an);

  /**
   * ### .include(value)
   *
   * The `include` and `contain` assertions can be used as either property
   * based language chains or as methods to assert the inclusion of an object
   * in an array or a substring in a string. When used as language chains,
   * they toggle the `contains` flag for the `keys` assertion.
   *
   *     expect([1,2,3]).to.include(2);
   *     expect('foobar').to.contain('foo');
   *     expect({ foo: 'bar', hello: 'universe' }).to.include.keys('foo');
   *
   * @name include
   * @alias contain
   * @alias includes
   * @alias contains
   * @param {Object|String|Number} obj
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function includeChainingBehavior () {
    flag(this, 'contains', true);
  }

  function include (val, msg) {
    _.expectTypes(this, ['array', 'object', 'string']);

    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    var expected = false;

    if (_.type(obj) === 'array' && _.type(val) === 'object') {
      for (var i in obj) {
        if (_.eql(obj[i], val)) {
          expected = true;
          break;
        }
      }
    } else if (_.type(val) === 'object') {
      if (!flag(this, 'negate')) {
        for (var k in val) new Assertion(obj).property(k, val[k]);
        return;
      }
      var subset = {};
      for (var k in val) subset[k] = obj[k];
      expected = _.eql(subset, val);
    } else {
      expected = (obj != undefined) && ~obj.indexOf(val);
    }
    this.assert(
        expected
      , 'expected #{this} to include ' + _.inspect(val)
      , 'expected #{this} to not include ' + _.inspect(val));
  }

  Assertion.addChainableMethod('include', include, includeChainingBehavior);
  Assertion.addChainableMethod('contain', include, includeChainingBehavior);
  Assertion.addChainableMethod('contains', include, includeChainingBehavior);
  Assertion.addChainableMethod('includes', include, includeChainingBehavior);

  /**
   * ### .ok
   *
   * Asserts that the target is truthy.
   *
   *     expect('everything').to.be.ok;
   *     expect(1).to.be.ok;
   *     expect(false).to.not.be.ok;
   *     expect(undefined).to.not.be.ok;
   *     expect(null).to.not.be.ok;
   *
   * @name ok
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('ok', function () {
    this.assert(
        flag(this, 'object')
      , 'expected #{this} to be truthy'
      , 'expected #{this} to be falsy');
  });

  /**
   * ### .true
   *
   * Asserts that the target is `true`.
   *
   *     expect(true).to.be.true;
   *     expect(1).to.not.be.true;
   *
   * @name true
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('true', function () {
    this.assert(
        true === flag(this, 'object')
      , 'expected #{this} to be true'
      , 'expected #{this} to be false'
      , this.negate ? false : true
    );
  });

  /**
   * ### .false
   *
   * Asserts that the target is `false`.
   *
   *     expect(false).to.be.false;
   *     expect(0).to.not.be.false;
   *
   * @name false
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('false', function () {
    this.assert(
        false === flag(this, 'object')
      , 'expected #{this} to be false'
      , 'expected #{this} to be true'
      , this.negate ? true : false
    );
  });

  /**
   * ### .null
   *
   * Asserts that the target is `null`.
   *
   *     expect(null).to.be.null;
   *     expect(undefined).to.not.be.null;
   *
   * @name null
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('null', function () {
    this.assert(
        null === flag(this, 'object')
      , 'expected #{this} to be null'
      , 'expected #{this} not to be null'
    );
  });

  /**
   * ### .undefined
   *
   * Asserts that the target is `undefined`.
   *
   *     expect(undefined).to.be.undefined;
   *     expect(null).to.not.be.undefined;
   *
   * @name undefined
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('undefined', function () {
    this.assert(
        undefined === flag(this, 'object')
      , 'expected #{this} to be undefined'
      , 'expected #{this} not to be undefined'
    );
  });

  /**
   * ### .NaN
   * Asserts that the target is `NaN`.
   *
   *     expect('foo').to.be.NaN;
   *     expect(4).not.to.be.NaN;
   *
   * @name NaN
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('NaN', function () {
    this.assert(
        isNaN(flag(this, 'object'))
        , 'expected #{this} to be NaN'
        , 'expected #{this} not to be NaN'
    );
  });

  /**
   * ### .exist
   *
   * Asserts that the target is neither `null` nor `undefined`.
   *
   *     var foo = 'hi'
   *       , bar = null
   *       , baz;
   *
   *     expect(foo).to.exist;
   *     expect(bar).to.not.exist;
   *     expect(baz).to.not.exist;
   *
   * @name exist
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('exist', function () {
    this.assert(
        null != flag(this, 'object')
      , 'expected #{this} to exist'
      , 'expected #{this} to not exist'
    );
  });


  /**
   * ### .empty
   *
   * Asserts that the target's length is `0`. For arrays and strings, it checks
   * the `length` property. For objects, it gets the count of
   * enumerable keys.
   *
   *     expect([]).to.be.empty;
   *     expect('').to.be.empty;
   *     expect({}).to.be.empty;
   *
   * @name empty
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('empty', function () {
    var obj = flag(this, 'object')
      , expected = obj;

    if (Array.isArray(obj) || 'string' === typeof object) {
      expected = obj.length;
    } else if (typeof obj === 'object') {
      expected = Object.keys(obj).length;
    }

    this.assert(
        !expected
      , 'expected #{this} to be empty'
      , 'expected #{this} not to be empty'
    );
  });

  /**
   * ### .arguments
   *
   * Asserts that the target is an arguments object.
   *
   *     function test () {
   *       expect(arguments).to.be.arguments;
   *     }
   *
   * @name arguments
   * @alias Arguments
   * @namespace BDD
   * @api public
   */

  function checkArguments () {
    var obj = flag(this, 'object')
      , type = Object.prototype.toString.call(obj);
    this.assert(
        '[object Arguments]' === type
      , 'expected #{this} to be arguments but got ' + type
      , 'expected #{this} to not be arguments'
    );
  }

  Assertion.addProperty('arguments', checkArguments);
  Assertion.addProperty('Arguments', checkArguments);

  /**
   * ### .equal(value)
   *
   * Asserts that the target is strictly equal (`===`) to `value`.
   * Alternately, if the `deep` flag is set, asserts that
   * the target is deeply equal to `value`.
   *
   *     expect('hello').to.equal('hello');
   *     expect(42).to.equal(42);
   *     expect(1).to.not.equal(true);
   *     expect({ foo: 'bar' }).to.not.equal({ foo: 'bar' });
   *     expect({ foo: 'bar' }).to.deep.equal({ foo: 'bar' });
   *
   * @name equal
   * @alias equals
   * @alias eq
   * @alias deep.equal
   * @param {Mixed} value
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertEqual (val, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'deep')) {
      return this.eql(val);
    } else {
      this.assert(
          val === obj
        , 'expected #{this} to equal #{exp}'
        , 'expected #{this} to not equal #{exp}'
        , val
        , this._obj
        , true
      );
    }
  }

  Assertion.addMethod('equal', assertEqual);
  Assertion.addMethod('equals', assertEqual);
  Assertion.addMethod('eq', assertEqual);

  /**
   * ### .eql(value)
   *
   * Asserts that the target is deeply equal to `value`.
   *
   *     expect({ foo: 'bar' }).to.eql({ foo: 'bar' });
   *     expect([ 1, 2, 3 ]).to.eql([ 1, 2, 3 ]);
   *
   * @name eql
   * @alias eqls
   * @param {Mixed} value
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertEql(obj, msg) {
    if (msg) flag(this, 'message', msg);
    this.assert(
        _.eql(obj, flag(this, 'object'))
      , 'expected #{this} to deeply equal #{exp}'
      , 'expected #{this} to not deeply equal #{exp}'
      , obj
      , this._obj
      , true
    );
  }

  Assertion.addMethod('eql', assertEql);
  Assertion.addMethod('eqls', assertEql);

  /**
   * ### .above(value)
   *
   * Asserts that the target is greater than `value`.
   *
   *     expect(10).to.be.above(5);
   *
   * Can also be used in conjunction with `length` to
   * assert a minimum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.above(2);
   *     expect([ 1, 2, 3 ]).to.have.length.above(2);
   *
   * @name above
   * @alias gt
   * @alias greaterThan
   * @param {Number} value
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertAbove (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len > n
        , 'expected #{this} to have a length above #{exp} but got #{act}'
        , 'expected #{this} to not have a length above #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj > n
        , 'expected #{this} to be above ' + n
        , 'expected #{this} to be at most ' + n
      );
    }
  }

  Assertion.addMethod('above', assertAbove);
  Assertion.addMethod('gt', assertAbove);
  Assertion.addMethod('greaterThan', assertAbove);

  /**
   * ### .least(value)
   *
   * Asserts that the target is greater than or equal to `value`.
   *
   *     expect(10).to.be.at.least(10);
   *
   * Can also be used in conjunction with `length` to
   * assert a minimum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.of.at.least(2);
   *     expect([ 1, 2, 3 ]).to.have.length.of.at.least(3);
   *
   * @name least
   * @alias gte
   * @param {Number} value
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertLeast (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len >= n
        , 'expected #{this} to have a length at least #{exp} but got #{act}'
        , 'expected #{this} to have a length below #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj >= n
        , 'expected #{this} to be at least ' + n
        , 'expected #{this} to be below ' + n
      );
    }
  }

  Assertion.addMethod('least', assertLeast);
  Assertion.addMethod('gte', assertLeast);

  /**
   * ### .below(value)
   *
   * Asserts that the target is less than `value`.
   *
   *     expect(5).to.be.below(10);
   *
   * Can also be used in conjunction with `length` to
   * assert a maximum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.below(4);
   *     expect([ 1, 2, 3 ]).to.have.length.below(4);
   *
   * @name below
   * @alias lt
   * @alias lessThan
   * @param {Number} value
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertBelow (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len < n
        , 'expected #{this} to have a length below #{exp} but got #{act}'
        , 'expected #{this} to not have a length below #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj < n
        , 'expected #{this} to be below ' + n
        , 'expected #{this} to be at least ' + n
      );
    }
  }

  Assertion.addMethod('below', assertBelow);
  Assertion.addMethod('lt', assertBelow);
  Assertion.addMethod('lessThan', assertBelow);

  /**
   * ### .most(value)
   *
   * Asserts that the target is less than or equal to `value`.
   *
   *     expect(5).to.be.at.most(5);
   *
   * Can also be used in conjunction with `length` to
   * assert a maximum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.of.at.most(4);
   *     expect([ 1, 2, 3 ]).to.have.length.of.at.most(3);
   *
   * @name most
   * @alias lte
   * @param {Number} value
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertMost (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len <= n
        , 'expected #{this} to have a length at most #{exp} but got #{act}'
        , 'expected #{this} to have a length above #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj <= n
        , 'expected #{this} to be at most ' + n
        , 'expected #{this} to be above ' + n
      );
    }
  }

  Assertion.addMethod('most', assertMost);
  Assertion.addMethod('lte', assertMost);

  /**
   * ### .within(start, finish)
   *
   * Asserts that the target is within a range.
   *
   *     expect(7).to.be.within(5,10);
   *
   * Can also be used in conjunction with `length` to
   * assert a length range. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.within(2,4);
   *     expect([ 1, 2, 3 ]).to.have.length.within(2,4);
   *
   * @name within
   * @param {Number} start lowerbound inclusive
   * @param {Number} finish upperbound inclusive
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  Assertion.addMethod('within', function (start, finish, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , range = start + '..' + finish;
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len >= start && len <= finish
        , 'expected #{this} to have a length within ' + range
        , 'expected #{this} to not have a length within ' + range
      );
    } else {
      this.assert(
          obj >= start && obj <= finish
        , 'expected #{this} to be within ' + range
        , 'expected #{this} to not be within ' + range
      );
    }
  });

  /**
   * ### .instanceof(constructor)
   *
   * Asserts that the target is an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , Chai = new Tea('chai');
   *
   *     expect(Chai).to.be.an.instanceof(Tea);
   *     expect([ 1, 2, 3 ]).to.be.instanceof(Array);
   *
   * @name instanceof
   * @param {Constructor} constructor
   * @param {String} message _optional_
   * @alias instanceOf
   * @namespace BDD
   * @api public
   */

  function assertInstanceOf (constructor, msg) {
    if (msg) flag(this, 'message', msg);
    var name = _.getName(constructor);
    this.assert(
        flag(this, 'object') instanceof constructor
      , 'expected #{this} to be an instance of ' + name
      , 'expected #{this} to not be an instance of ' + name
    );
  };

  Assertion.addMethod('instanceof', assertInstanceOf);
  Assertion.addMethod('instanceOf', assertInstanceOf);

  /**
   * ### .property(name, [value])
   *
   * Asserts that the target has a property `name`, optionally asserting that
   * the value of that property is strictly equal to  `value`.
   * If the `deep` flag is set, you can use dot- and bracket-notation for deep
   * references into objects and arrays.
   *
   *     // simple referencing
   *     var obj = { foo: 'bar' };
   *     expect(obj).to.have.property('foo');
   *     expect(obj).to.have.property('foo', 'bar');
   *
   *     // deep referencing
   *     var deepObj = {
   *         green: { tea: 'matcha' }
   *       , teas: [ 'chai', 'matcha', { tea: 'konacha' } ]
   *     };
   *
   *     expect(deepObj).to.have.deep.property('green.tea', 'matcha');
   *     expect(deepObj).to.have.deep.property('teas[1]', 'matcha');
   *     expect(deepObj).to.have.deep.property('teas[2].tea', 'konacha');
   *
   * You can also use an array as the starting point of a `deep.property`
   * assertion, or traverse nested arrays.
   *
   *     var arr = [
   *         [ 'chai', 'matcha', 'konacha' ]
   *       , [ { tea: 'chai' }
   *         , { tea: 'matcha' }
   *         , { tea: 'konacha' } ]
   *     ];
   *
   *     expect(arr).to.have.deep.property('[0][1]', 'matcha');
   *     expect(arr).to.have.deep.property('[1][2].tea', 'konacha');
   *
   * Furthermore, `property` changes the subject of the assertion
   * to be the value of that property from the original object. This
   * permits for further chainable assertions on that property.
   *
   *     expect(obj).to.have.property('foo')
   *       .that.is.a('string');
   *     expect(deepObj).to.have.property('green')
   *       .that.is.an('object')
   *       .that.deep.equals({ tea: 'matcha' });
   *     expect(deepObj).to.have.property('teas')
   *       .that.is.an('array')
   *       .with.deep.property('[2]')
   *         .that.deep.equals({ tea: 'konacha' });
   *
   * Note that dots and bracket in `name` must be backslash-escaped when
   * the `deep` flag is set, while they must NOT be escaped when the `deep`
   * flag is not set.
   *
   *     // simple referencing
   *     var css = { '.link[target]': 42 };
   *     expect(css).to.have.property('.link[target]', 42);
   *
   *     // deep referencing
   *     var deepCss = { '.link': { '[target]': 42 }};
   *     expect(deepCss).to.have.deep.property('\\.link.\\[target\\]', 42);
   *
   * @name property
   * @alias deep.property
   * @param {String} name
   * @param {Mixed} value (optional)
   * @param {String} message _optional_
   * @returns value of property for chaining
   * @namespace BDD
   * @api public
   */

  Assertion.addMethod('property', function (name, val, msg) {
    if (msg) flag(this, 'message', msg);

    var isDeep = !!flag(this, 'deep')
      , descriptor = isDeep ? 'deep property ' : 'property '
      , negate = flag(this, 'negate')
      , obj = flag(this, 'object')
      , pathInfo = isDeep ? _.getPathInfo(name, obj) : null
      , hasProperty = isDeep
        ? pathInfo.exists
        : _.hasProperty(name, obj)
      , value = isDeep
        ? pathInfo.value
        : obj[name];

    if (negate && arguments.length > 1) {
      if (undefined === value) {
        msg = (msg != null) ? msg + ': ' : '';
        throw new Error(msg + _.inspect(obj) + ' has no ' + descriptor + _.inspect(name));
      }
    } else {
      this.assert(
          hasProperty
        , 'expected #{this} to have a ' + descriptor + _.inspect(name)
        , 'expected #{this} to not have ' + descriptor + _.inspect(name));
    }

    if (arguments.length > 1) {
      this.assert(
          val === value
        , 'expected #{this} to have a ' + descriptor + _.inspect(name) + ' of #{exp}, but got #{act}'
        , 'expected #{this} to not have a ' + descriptor + _.inspect(name) + ' of #{act}'
        , val
        , value
      );
    }

    flag(this, 'object', value);
  });


  /**
   * ### .ownProperty(name)
   *
   * Asserts that the target has an own property `name`.
   *
   *     expect('test').to.have.ownProperty('length');
   *
   * @name ownProperty
   * @alias haveOwnProperty
   * @param {String} name
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertOwnProperty (name, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    this.assert(
        obj.hasOwnProperty(name)
      , 'expected #{this} to have own property ' + _.inspect(name)
      , 'expected #{this} to not have own property ' + _.inspect(name)
    );
  }

  Assertion.addMethod('ownProperty', assertOwnProperty);
  Assertion.addMethod('haveOwnProperty', assertOwnProperty);

  /**
   * ### .ownPropertyDescriptor(name[, descriptor[, message]])
   *
   * Asserts that the target has an own property descriptor `name`, that optionally matches `descriptor`.
   *
   *     expect('test').to.have.ownPropertyDescriptor('length');
   *     expect('test').to.have.ownPropertyDescriptor('length', { enumerable: false, configurable: false, writable: false, value: 4 });
   *     expect('test').not.to.have.ownPropertyDescriptor('length', { enumerable: false, configurable: false, writable: false, value: 3 });
   *     expect('test').ownPropertyDescriptor('length').to.have.property('enumerable', false);
   *     expect('test').ownPropertyDescriptor('length').to.have.keys('value');
   *
   * @name ownPropertyDescriptor
   * @alias haveOwnPropertyDescriptor
   * @param {String} name
   * @param {Object} descriptor _optional_
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertOwnPropertyDescriptor (name, descriptor, msg) {
    if (typeof descriptor === 'string') {
      msg = descriptor;
      descriptor = null;
    }
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    var actualDescriptor = Object.getOwnPropertyDescriptor(Object(obj), name);
    if (actualDescriptor && descriptor) {
      this.assert(
          _.eql(descriptor, actualDescriptor)
        , 'expected the own property descriptor for ' + _.inspect(name) + ' on #{this} to match ' + _.inspect(descriptor) + ', got ' + _.inspect(actualDescriptor)
        , 'expected the own property descriptor for ' + _.inspect(name) + ' on #{this} to not match ' + _.inspect(descriptor)
        , descriptor
        , actualDescriptor
        , true
      );
    } else {
      this.assert(
          actualDescriptor
        , 'expected #{this} to have an own property descriptor for ' + _.inspect(name)
        , 'expected #{this} to not have an own property descriptor for ' + _.inspect(name)
      );
    }
    flag(this, 'object', actualDescriptor);
  }

  Assertion.addMethod('ownPropertyDescriptor', assertOwnPropertyDescriptor);
  Assertion.addMethod('haveOwnPropertyDescriptor', assertOwnPropertyDescriptor);

  /**
   * ### .length
   *
   * Sets the `doLength` flag later used as a chain precursor to a value
   * comparison for the `length` property.
   *
   *     expect('foo').to.have.length.above(2);
   *     expect([ 1, 2, 3 ]).to.have.length.above(2);
   *     expect('foo').to.have.length.below(4);
   *     expect([ 1, 2, 3 ]).to.have.length.below(4);
   *     expect('foo').to.have.length.within(2,4);
   *     expect([ 1, 2, 3 ]).to.have.length.within(2,4);
   *
   * *Deprecation notice:* Using `length` as an assertion will be deprecated
   * in version 2.4.0 and removed in 3.0.0. Code using the old style of
   * asserting for `length` property value using `length(value)` should be
   * switched to use `lengthOf(value)` instead.
   *
   * @name length
   * @namespace BDD
   * @api public
   */

  /**
   * ### .lengthOf(value[, message])
   *
   * Asserts that the target's `length` property has
   * the expected value.
   *
   *     expect([ 1, 2, 3]).to.have.lengthOf(3);
   *     expect('foobar').to.have.lengthOf(6);
   *
   * @name lengthOf
   * @param {Number} length
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertLengthChain () {
    flag(this, 'doLength', true);
  }

  function assertLength (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    new Assertion(obj, msg).to.have.property('length');
    var len = obj.length;

    this.assert(
        len == n
      , 'expected #{this} to have a length of #{exp} but got #{act}'
      , 'expected #{this} to not have a length of #{act}'
      , n
      , len
    );
  }

  Assertion.addChainableMethod('length', assertLength, assertLengthChain);
  Assertion.addMethod('lengthOf', assertLength);

  /**
   * ### .match(regexp)
   *
   * Asserts that the target matches a regular expression.
   *
   *     expect('foobar').to.match(/^foo/);
   *
   * @name match
   * @alias matches
   * @param {RegExp} RegularExpression
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */
  function assertMatch(re, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    this.assert(
        re.exec(obj)
      , 'expected #{this} to match ' + re
      , 'expected #{this} not to match ' + re
    );
  }

  Assertion.addMethod('match', assertMatch);
  Assertion.addMethod('matches', assertMatch);

  /**
   * ### .string(string)
   *
   * Asserts that the string target contains another string.
   *
   *     expect('foobar').to.have.string('bar');
   *
   * @name string
   * @param {String} string
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  Assertion.addMethod('string', function (str, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    new Assertion(obj, msg).is.a('string');

    this.assert(
        ~obj.indexOf(str)
      , 'expected #{this} to contain ' + _.inspect(str)
      , 'expected #{this} to not contain ' + _.inspect(str)
    );
  });


  /**
   * ### .keys(key1, [key2], [...])
   *
   * Asserts that the target contains any or all of the passed-in keys.
   * Use in combination with `any`, `all`, `contains`, or `have` will affect
   * what will pass.
   *
   * When used in conjunction with `any`, at least one key that is passed
   * in must exist in the target object. This is regardless whether or not
   * the `have` or `contain` qualifiers are used. Note, either `any` or `all`
   * should be used in the assertion. If neither are used, the assertion is
   * defaulted to `all`.
   *
   * When both `all` and `contain` are used, the target object must have at
   * least all of the passed-in keys but may have more keys not listed.
   *
   * When both `all` and `have` are used, the target object must both contain
   * all of the passed-in keys AND the number of keys in the target object must
   * match the number of keys passed in (in other words, a target object must
   * have all and only all of the passed-in keys).
   *
   *     expect({ foo: 1, bar: 2 }).to.have.any.keys('foo', 'baz');
   *     expect({ foo: 1, bar: 2 }).to.have.any.keys('foo');
   *     expect({ foo: 1, bar: 2 }).to.contain.any.keys('bar', 'baz');
   *     expect({ foo: 1, bar: 2 }).to.contain.any.keys(['foo']);
   *     expect({ foo: 1, bar: 2 }).to.contain.any.keys({'foo': 6});
   *     expect({ foo: 1, bar: 2 }).to.have.all.keys(['bar', 'foo']);
   *     expect({ foo: 1, bar: 2 }).to.have.all.keys({'bar': 6, 'foo': 7});
   *     expect({ foo: 1, bar: 2, baz: 3 }).to.contain.all.keys(['bar', 'foo']);
   *     expect({ foo: 1, bar: 2, baz: 3 }).to.contain.all.keys({'bar': 6});
   *
   *
   * @name keys
   * @alias key
   * @param {...String|Array|Object} keys
   * @namespace BDD
   * @api public
   */

  function assertKeys (keys) {
    var obj = flag(this, 'object')
      , str
      , ok = true
      , mixedArgsMsg = 'keys must be given single argument of Array|Object|String, or multiple String arguments';

    switch (_.type(keys)) {
      case "array":
        if (arguments.length > 1) throw (new Error(mixedArgsMsg));
        break;
      case "object":
        if (arguments.length > 1) throw (new Error(mixedArgsMsg));
        keys = Object.keys(keys);
        break;
      default:
        keys = Array.prototype.slice.call(arguments);
    }

    if (!keys.length) throw new Error('keys required');

    var actual = Object.keys(obj)
      , expected = keys
      , len = keys.length
      , any = flag(this, 'any')
      , all = flag(this, 'all');

    if (!any && !all) {
      all = true;
    }

    // Has any
    if (any) {
      var intersection = expected.filter(function(key) {
        return ~actual.indexOf(key);
      });
      ok = intersection.length > 0;
    }

    // Has all
    if (all) {
      ok = keys.every(function(key){
        return ~actual.indexOf(key);
      });
      if (!flag(this, 'negate') && !flag(this, 'contains')) {
        ok = ok && keys.length == actual.length;
      }
    }

    // Key string
    if (len > 1) {
      keys = keys.map(function(key){
        return _.inspect(key);
      });
      var last = keys.pop();
      if (all) {
        str = keys.join(', ') + ', and ' + last;
      }
      if (any) {
        str = keys.join(', ') + ', or ' + last;
      }
    } else {
      str = _.inspect(keys[0]);
    }

    // Form
    str = (len > 1 ? 'keys ' : 'key ') + str;

    // Have / include
    str = (flag(this, 'contains') ? 'contain ' : 'have ') + str;

    // Assertion
    this.assert(
        ok
      , 'expected #{this} to ' + str
      , 'expected #{this} to not ' + str
      , expected.slice(0).sort()
      , actual.sort()
      , true
    );
  }

  Assertion.addMethod('keys', assertKeys);
  Assertion.addMethod('key', assertKeys);

  /**
   * ### .throw(constructor)
   *
   * Asserts that the function target will throw a specific error, or specific type of error
   * (as determined using `instanceof`), optionally with a RegExp or string inclusion test
   * for the error's message.
   *
   *     var err = new ReferenceError('This is a bad function.');
   *     var fn = function () { throw err; }
   *     expect(fn).to.throw(ReferenceError);
   *     expect(fn).to.throw(Error);
   *     expect(fn).to.throw(/bad function/);
   *     expect(fn).to.not.throw('good function');
   *     expect(fn).to.throw(ReferenceError, /bad function/);
   *     expect(fn).to.throw(err);
   *
   * Please note that when a throw expectation is negated, it will check each
   * parameter independently, starting with error constructor type. The appropriate way
   * to check for the existence of a type of error but for a message that does not match
   * is to use `and`.
   *
   *     expect(fn).to.throw(ReferenceError)
   *        .and.not.throw(/good function/);
   *
   * @name throw
   * @alias throws
   * @alias Throw
   * @param {ErrorConstructor} constructor
   * @param {String|RegExp} expected error message
   * @param {String} message _optional_
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @returns error for chaining (null if no error)
   * @namespace BDD
   * @api public
   */

  function assertThrows (constructor, errMsg, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    new Assertion(obj, msg).is.a('function');

    var thrown = false
      , desiredError = null
      , name = null
      , thrownError = null;

    if (arguments.length === 0) {
      errMsg = null;
      constructor = null;
    } else if (constructor && (constructor instanceof RegExp || 'string' === typeof constructor)) {
      errMsg = constructor;
      constructor = null;
    } else if (constructor && constructor instanceof Error) {
      desiredError = constructor;
      constructor = null;
      errMsg = null;
    } else if (typeof constructor === 'function') {
      name = constructor.prototype.name;
      if (!name || (name === 'Error' && constructor !== Error)) {
        name = constructor.name || (new constructor()).name;
      }
    } else {
      constructor = null;
    }

    try {
      obj();
    } catch (err) {
      // first, check desired error
      if (desiredError) {
        this.assert(
            err === desiredError
          , 'expected #{this} to throw #{exp} but #{act} was thrown'
          , 'expected #{this} to not throw #{exp}'
          , (desiredError instanceof Error ? desiredError.toString() : desiredError)
          , (err instanceof Error ? err.toString() : err)
        );

        flag(this, 'object', err);
        return this;
      }

      // next, check constructor
      if (constructor) {
        this.assert(
            err instanceof constructor
          , 'expected #{this} to throw #{exp} but #{act} was thrown'
          , 'expected #{this} to not throw #{exp} but #{act} was thrown'
          , name
          , (err instanceof Error ? err.toString() : err)
        );

        if (!errMsg) {
          flag(this, 'object', err);
          return this;
        }
      }

      // next, check message
      var message = 'error' === _.type(err) && "message" in err
        ? err.message
        : '' + err;

      if ((message != null) && errMsg && errMsg instanceof RegExp) {
        this.assert(
            errMsg.exec(message)
          , 'expected #{this} to throw error matching #{exp} but got #{act}'
          , 'expected #{this} to throw error not matching #{exp}'
          , errMsg
          , message
        );

        flag(this, 'object', err);
        return this;
      } else if ((message != null) && errMsg && 'string' === typeof errMsg) {
        this.assert(
            ~message.indexOf(errMsg)
          , 'expected #{this} to throw error including #{exp} but got #{act}'
          , 'expected #{this} to throw error not including #{act}'
          , errMsg
          , message
        );

        flag(this, 'object', err);
        return this;
      } else {
        thrown = true;
        thrownError = err;
      }
    }

    var actuallyGot = ''
      , expectedThrown = name !== null
        ? name
        : desiredError
          ? '#{exp}' //_.inspect(desiredError)
          : 'an error';

    if (thrown) {
      actuallyGot = ' but #{act} was thrown'
    }

    this.assert(
        thrown === true
      , 'expected #{this} to throw ' + expectedThrown + actuallyGot
      , 'expected #{this} to not throw ' + expectedThrown + actuallyGot
      , (desiredError instanceof Error ? desiredError.toString() : desiredError)
      , (thrownError instanceof Error ? thrownError.toString() : thrownError)
    );

    flag(this, 'object', thrownError);
  };

  Assertion.addMethod('throw', assertThrows);
  Assertion.addMethod('throws', assertThrows);
  Assertion.addMethod('Throw', assertThrows);

  /**
   * ### .respondTo(method)
   *
   * Asserts that the object or class target will respond to a method.
   *
   *     Klass.prototype.bar = function(){};
   *     expect(Klass).to.respondTo('bar');
   *     expect(obj).to.respondTo('bar');
   *
   * To check if a constructor will respond to a static function,
   * set the `itself` flag.
   *
   *     Klass.baz = function(){};
   *     expect(Klass).itself.to.respondTo('baz');
   *
   * @name respondTo
   * @alias respondsTo
   * @param {String} method
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function respondTo (method, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , itself = flag(this, 'itself')
      , context = ('function' === _.type(obj) && !itself)
        ? obj.prototype[method]
        : obj[method];

    this.assert(
        'function' === typeof context
      , 'expected #{this} to respond to ' + _.inspect(method)
      , 'expected #{this} to not respond to ' + _.inspect(method)
    );
  }

  Assertion.addMethod('respondTo', respondTo);
  Assertion.addMethod('respondsTo', respondTo);

  /**
   * ### .itself
   *
   * Sets the `itself` flag, later used by the `respondTo` assertion.
   *
   *     function Foo() {}
   *     Foo.bar = function() {}
   *     Foo.prototype.baz = function() {}
   *
   *     expect(Foo).itself.to.respondTo('bar');
   *     expect(Foo).itself.not.to.respondTo('baz');
   *
   * @name itself
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('itself', function () {
    flag(this, 'itself', true);
  });

  /**
   * ### .satisfy(method)
   *
   * Asserts that the target passes a given truth test.
   *
   *     expect(1).to.satisfy(function(num) { return num > 0; });
   *
   * @name satisfy
   * @alias satisfies
   * @param {Function} matcher
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function satisfy (matcher, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    var result = matcher(obj);
    this.assert(
        result
      , 'expected #{this} to satisfy ' + _.objDisplay(matcher)
      , 'expected #{this} to not satisfy' + _.objDisplay(matcher)
      , this.negate ? false : true
      , result
    );
  }

  Assertion.addMethod('satisfy', satisfy);
  Assertion.addMethod('satisfies', satisfy);

  /**
   * ### .closeTo(expected, delta)
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     expect(1.5).to.be.closeTo(1, 0.5);
   *
   * @name closeTo
   * @alias approximately
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function closeTo(expected, delta, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');

    new Assertion(obj, msg).is.a('number');
    if (_.type(expected) !== 'number' || _.type(delta) !== 'number') {
      throw new Error('the arguments to closeTo or approximately must be numbers');
    }

    this.assert(
        Math.abs(obj - expected) <= delta
      , 'expected #{this} to be close to ' + expected + ' +/- ' + delta
      , 'expected #{this} not to be close to ' + expected + ' +/- ' + delta
    );
  }

  Assertion.addMethod('closeTo', closeTo);
  Assertion.addMethod('approximately', closeTo);

  function isSubsetOf(subset, superset, cmp) {
    return subset.every(function(elem) {
      if (!cmp) return superset.indexOf(elem) !== -1;

      return superset.some(function(elem2) {
        return cmp(elem, elem2);
      });
    })
  }

  /**
   * ### .members(set)
   *
   * Asserts that the target is a superset of `set`,
   * or that the target and `set` have the same strictly-equal (===) members.
   * Alternately, if the `deep` flag is set, set members are compared for deep
   * equality.
   *
   *     expect([1, 2, 3]).to.include.members([3, 2]);
   *     expect([1, 2, 3]).to.not.include.members([3, 2, 8]);
   *
   *     expect([4, 2]).to.have.members([2, 4]);
   *     expect([5, 2]).to.not.have.members([5, 2, 1]);
   *
   *     expect([{ id: 1 }]).to.deep.include.members([{ id: 1 }]);
   *
   * @name members
   * @param {Array} set
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  Assertion.addMethod('members', function (subset, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');

    new Assertion(obj).to.be.an('array');
    new Assertion(subset).to.be.an('array');

    var cmp = flag(this, 'deep') ? _.eql : undefined;

    if (flag(this, 'contains')) {
      return this.assert(
          isSubsetOf(subset, obj, cmp)
        , 'expected #{this} to be a superset of #{act}'
        , 'expected #{this} to not be a superset of #{act}'
        , obj
        , subset
      );
    }

    this.assert(
        isSubsetOf(obj, subset, cmp) && isSubsetOf(subset, obj, cmp)
        , 'expected #{this} to have the same members as #{act}'
        , 'expected #{this} to not have the same members as #{act}'
        , obj
        , subset
    );
  });

  /**
   * ### .oneOf(list)
   *
   * Assert that a value appears somewhere in the top level of array `list`.
   *
   *     expect('a').to.be.oneOf(['a', 'b', 'c']);
   *     expect(9).to.not.be.oneOf(['z']);
   *     expect([3]).to.not.be.oneOf([1, 2, [3]]);
   *
   *     var three = [3];
   *     // for object-types, contents are not compared
   *     expect(three).to.not.be.oneOf([1, 2, [3]]);
   *     // comparing references works
   *     expect(three).to.be.oneOf([1, 2, three]);
   *
   * @name oneOf
   * @param {Array<*>} list
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function oneOf (list, msg) {
    if (msg) flag(this, 'message', msg);
    var expected = flag(this, 'object');
    new Assertion(list).to.be.an('array');

    this.assert(
        list.indexOf(expected) > -1
      , 'expected #{this} to be one of #{exp}'
      , 'expected #{this} to not be one of #{exp}'
      , list
      , expected
    );
  }

  Assertion.addMethod('oneOf', oneOf);


  /**
   * ### .change(function)
   *
   * Asserts that a function changes an object property
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val += 3 };
   *     var noChangeFn = function() { return 'foo' + 'bar'; }
   *     expect(fn).to.change(obj, 'val');
   *     expect(noChangeFn).to.not.change(obj, 'val')
   *
   * @name change
   * @alias changes
   * @alias Change
   * @param {String} object
   * @param {String} property name
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertChanges (object, prop, msg) {
    if (msg) flag(this, 'message', msg);
    var fn = flag(this, 'object');
    new Assertion(object, msg).to.have.property(prop);
    new Assertion(fn).is.a('function');

    var initial = object[prop];
    fn();

    this.assert(
      initial !== object[prop]
      , 'expected .' + prop + ' to change'
      , 'expected .' + prop + ' to not change'
    );
  }

  Assertion.addChainableMethod('change', assertChanges);
  Assertion.addChainableMethod('changes', assertChanges);

  /**
   * ### .increase(function)
   *
   * Asserts that a function increases an object property
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 15 };
   *     expect(fn).to.increase(obj, 'val');
   *
   * @name increase
   * @alias increases
   * @alias Increase
   * @param {String} object
   * @param {String} property name
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertIncreases (object, prop, msg) {
    if (msg) flag(this, 'message', msg);
    var fn = flag(this, 'object');
    new Assertion(object, msg).to.have.property(prop);
    new Assertion(fn).is.a('function');

    var initial = object[prop];
    fn();

    this.assert(
      object[prop] - initial > 0
      , 'expected .' + prop + ' to increase'
      , 'expected .' + prop + ' to not increase'
    );
  }

  Assertion.addChainableMethod('increase', assertIncreases);
  Assertion.addChainableMethod('increases', assertIncreases);

  /**
   * ### .decrease(function)
   *
   * Asserts that a function decreases an object property
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 5 };
   *     expect(fn).to.decrease(obj, 'val');
   *
   * @name decrease
   * @alias decreases
   * @alias Decrease
   * @param {String} object
   * @param {String} property name
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertDecreases (object, prop, msg) {
    if (msg) flag(this, 'message', msg);
    var fn = flag(this, 'object');
    new Assertion(object, msg).to.have.property(prop);
    new Assertion(fn).is.a('function');

    var initial = object[prop];
    fn();

    this.assert(
      object[prop] - initial < 0
      , 'expected .' + prop + ' to decrease'
      , 'expected .' + prop + ' to not decrease'
    );
  }

  Assertion.addChainableMethod('decrease', assertDecreases);
  Assertion.addChainableMethod('decreases', assertDecreases);

  /**
   * ### .extensible
   *
   * Asserts that the target is extensible (can have new properties added to
   * it).
   *
   *     var nonExtensibleObject = Object.preventExtensions({});
   *     var sealedObject = Object.seal({});
   *     var frozenObject = Object.freeze({});
   *
   *     expect({}).to.be.extensible;
   *     expect(nonExtensibleObject).to.not.be.extensible;
   *     expect(sealedObject).to.not.be.extensible;
   *     expect(frozenObject).to.not.be.extensible;
   *
   * @name extensible
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('extensible', function() {
    var obj = flag(this, 'object');

    // In ES5, if the argument to this method is not an object (a primitive), then it will cause a TypeError.
    // In ES6, a non-object argument will be treated as if it was a non-extensible ordinary object, simply return false.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isExtensible
    // The following provides ES6 behavior when a TypeError is thrown under ES5.

    var isExtensible;

    try {
      isExtensible = Object.isExtensible(obj);
    } catch (err) {
      if (err instanceof TypeError) isExtensible = false;
      else throw err;
    }

    this.assert(
      isExtensible
      , 'expected #{this} to be extensible'
      , 'expected #{this} to not be extensible'
    );
  });

  /**
   * ### .sealed
   *
   * Asserts that the target is sealed (cannot have new properties added to it
   * and its existing properties cannot be removed).
   *
   *     var sealedObject = Object.seal({});
   *     var frozenObject = Object.freeze({});
   *
   *     expect(sealedObject).to.be.sealed;
   *     expect(frozenObject).to.be.sealed;
   *     expect({}).to.not.be.sealed;
   *
   * @name sealed
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('sealed', function() {
    var obj = flag(this, 'object');

    // In ES5, if the argument to this method is not an object (a primitive), then it will cause a TypeError.
    // In ES6, a non-object argument will be treated as if it was a sealed ordinary object, simply return true.
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isSealed
    // The following provides ES6 behavior when a TypeError is thrown under ES5.

    var isSealed;

    try {
      isSealed = Object.isSealed(obj);
    } catch (err) {
      if (err instanceof TypeError) isSealed = true;
      else throw err;
    }

    this.assert(
      isSealed
      , 'expected #{this} to be sealed'
      , 'expected #{this} to not be sealed'
    );
  });

  /**
   * ### .frozen
   *
   * Asserts that the target is frozen (cannot have new properties added to it
   * and its existing properties cannot be modified).
   *
   *     var frozenObject = Object.freeze({});
   *
   *     expect(frozenObject).to.be.frozen;
   *     expect({}).to.not.be.frozen;
   *
   * @name frozen
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('frozen', function() {
    var obj = flag(this, 'object');

    // In ES5, if the argument to this method is not an object (a primitive), then it will cause a TypeError.
    // In ES6, a non-object argument will be treated as if it was a frozen ordinary object, simply return true.
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isFrozen
    // The following provides ES6 behavior when a TypeError is thrown under ES5.

    var isFrozen;

    try {
      isFrozen = Object.isFrozen(obj);
    } catch (err) {
      if (err instanceof TypeError) isFrozen = true;
      else throw err;
    }

    this.assert(
      isFrozen
      , 'expected #{this} to be frozen'
      , 'expected #{this} to not be frozen'
    );
  });
};

},{}],11:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */


module.exports = function (chai, util) {

  /*!
   * Chai dependencies.
   */

  var Assertion = chai.Assertion
    , flag = util.flag;

  /*!
   * Module export.
   */

  /**
   * ### assert(expression, message)
   *
   * Write your own test expressions.
   *
   *     assert('foo' !== 'bar', 'foo is not bar');
   *     assert(Array.isArray([]), 'empty arrays are arrays');
   *
   * @param {Mixed} expression to test for truthiness
   * @param {String} message to display on error
   * @name assert
   * @namespace Assert
   * @api public
   */

  var assert = chai.assert = function (express, errmsg) {
    var test = new Assertion(null, null, chai.assert);
    test.assert(
        express
      , errmsg
      , '[ negation message unavailable ]'
    );
  };

  /**
   * ### .fail(actual, expected, [message], [operator])
   *
   * Throw a failure. Node.js `assert` module-compatible.
   *
   * @name fail
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @param {String} operator
   * @namespace Assert
   * @api public
   */

  assert.fail = function (actual, expected, message, operator) {
    message = message || 'assert.fail()';
    throw new chai.AssertionError(message, {
        actual: actual
      , expected: expected
      , operator: operator
    }, assert.fail);
  };

  /**
   * ### .isOk(object, [message])
   *
   * Asserts that `object` is truthy.
   *
   *     assert.isOk('everything', 'everything is ok');
   *     assert.isOk(false, 'this will fail');
   *
   * @name isOk
   * @alias ok
   * @param {Mixed} object to test
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isOk = function (val, msg) {
    new Assertion(val, msg).is.ok;
  };

  /**
   * ### .isNotOk(object, [message])
   *
   * Asserts that `object` is falsy.
   *
   *     assert.isNotOk('everything', 'this will fail');
   *     assert.isNotOk(false, 'this will pass');
   *
   * @name isNotOk
   * @alias notOk
   * @param {Mixed} object to test
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotOk = function (val, msg) {
    new Assertion(val, msg).is.not.ok;
  };

  /**
   * ### .equal(actual, expected, [message])
   *
   * Asserts non-strict equality (`==`) of `actual` and `expected`.
   *
   *     assert.equal(3, '3', '== coerces values to strings');
   *
   * @name equal
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.equal = function (act, exp, msg) {
    var test = new Assertion(act, msg, assert.equal);

    test.assert(
        exp == flag(test, 'object')
      , 'expected #{this} to equal #{exp}'
      , 'expected #{this} to not equal #{act}'
      , exp
      , act
    );
  };

  /**
   * ### .notEqual(actual, expected, [message])
   *
   * Asserts non-strict inequality (`!=`) of `actual` and `expected`.
   *
   *     assert.notEqual(3, 4, 'these numbers are not equal');
   *
   * @name notEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notEqual = function (act, exp, msg) {
    var test = new Assertion(act, msg, assert.notEqual);

    test.assert(
        exp != flag(test, 'object')
      , 'expected #{this} to not equal #{exp}'
      , 'expected #{this} to equal #{act}'
      , exp
      , act
    );
  };

  /**
   * ### .strictEqual(actual, expected, [message])
   *
   * Asserts strict equality (`===`) of `actual` and `expected`.
   *
   *     assert.strictEqual(true, true, 'these booleans are strictly equal');
   *
   * @name strictEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.strictEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.equal(exp);
  };

  /**
   * ### .notStrictEqual(actual, expected, [message])
   *
   * Asserts strict inequality (`!==`) of `actual` and `expected`.
   *
   *     assert.notStrictEqual(3, '3', 'no coercion for strict equality');
   *
   * @name notStrictEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notStrictEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.not.equal(exp);
  };

  /**
   * ### .deepEqual(actual, expected, [message])
   *
   * Asserts that `actual` is deeply equal to `expected`.
   *
   *     assert.deepEqual({ tea: 'green' }, { tea: 'green' });
   *
   * @name deepEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.eql(exp);
  };

  /**
   * ### .notDeepEqual(actual, expected, [message])
   *
   * Assert that `actual` is not deeply equal to `expected`.
   *
   *     assert.notDeepEqual({ tea: 'green' }, { tea: 'jasmine' });
   *
   * @name notDeepEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notDeepEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.not.eql(exp);
  };

   /**
   * ### .isAbove(valueToCheck, valueToBeAbove, [message])
   *
   * Asserts `valueToCheck` is strictly greater than (>) `valueToBeAbove`
   *
   *     assert.isAbove(5, 2, '5 is strictly greater than 2');
   *
   * @name isAbove
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeAbove
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isAbove = function (val, abv, msg) {
    new Assertion(val, msg).to.be.above(abv);
  };

   /**
   * ### .isAtLeast(valueToCheck, valueToBeAtLeast, [message])
   *
   * Asserts `valueToCheck` is greater than or equal to (>=) `valueToBeAtLeast`
   *
   *     assert.isAtLeast(5, 2, '5 is greater or equal to 2');
   *     assert.isAtLeast(3, 3, '3 is greater or equal to 3');
   *
   * @name isAtLeast
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeAtLeast
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isAtLeast = function (val, atlst, msg) {
    new Assertion(val, msg).to.be.least(atlst);
  };

   /**
   * ### .isBelow(valueToCheck, valueToBeBelow, [message])
   *
   * Asserts `valueToCheck` is strictly less than (<) `valueToBeBelow`
   *
   *     assert.isBelow(3, 6, '3 is strictly less than 6');
   *
   * @name isBelow
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeBelow
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isBelow = function (val, blw, msg) {
    new Assertion(val, msg).to.be.below(blw);
  };

   /**
   * ### .isAtMost(valueToCheck, valueToBeAtMost, [message])
   *
   * Asserts `valueToCheck` is less than or equal to (<=) `valueToBeAtMost`
   *
   *     assert.isAtMost(3, 6, '3 is less than or equal to 6');
   *     assert.isAtMost(4, 4, '4 is less than or equal to 4');
   *
   * @name isAtMost
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeAtMost
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isAtMost = function (val, atmst, msg) {
    new Assertion(val, msg).to.be.most(atmst);
  };

  /**
   * ### .isTrue(value, [message])
   *
   * Asserts that `value` is true.
   *
   *     var teaServed = true;
   *     assert.isTrue(teaServed, 'the tea has been served');
   *
   * @name isTrue
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isTrue = function (val, msg) {
    new Assertion(val, msg).is['true'];
  };

  /**
   * ### .isNotTrue(value, [message])
   *
   * Asserts that `value` is not true.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotTrue(tea, 'great, time for tea!');
   *
   * @name isNotTrue
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotTrue = function (val, msg) {
    new Assertion(val, msg).to.not.equal(true);
  };

  /**
   * ### .isFalse(value, [message])
   *
   * Asserts that `value` is false.
   *
   *     var teaServed = false;
   *     assert.isFalse(teaServed, 'no tea yet? hmm...');
   *
   * @name isFalse
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isFalse = function (val, msg) {
    new Assertion(val, msg).is['false'];
  };

  /**
   * ### .isNotFalse(value, [message])
   *
   * Asserts that `value` is not false.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotFalse(tea, 'great, time for tea!');
   *
   * @name isNotFalse
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotFalse = function (val, msg) {
    new Assertion(val, msg).to.not.equal(false);
  };

  /**
   * ### .isNull(value, [message])
   *
   * Asserts that `value` is null.
   *
   *     assert.isNull(err, 'there was no error');
   *
   * @name isNull
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNull = function (val, msg) {
    new Assertion(val, msg).to.equal(null);
  };

  /**
   * ### .isNotNull(value, [message])
   *
   * Asserts that `value` is not null.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotNull(tea, 'great, time for tea!');
   *
   * @name isNotNull
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotNull = function (val, msg) {
    new Assertion(val, msg).to.not.equal(null);
  };

  /**
   * ### .isNaN
   * Asserts that value is NaN
   *
   *    assert.isNaN('foo', 'foo is NaN');
   *
   * @name isNaN
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNaN = function (val, msg) {
    new Assertion(val, msg).to.be.NaN;
  };

  /**
   * ### .isNotNaN
   * Asserts that value is not NaN
   *
   *    assert.isNotNaN(4, '4 is not NaN');
   *
   * @name isNotNaN
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */
  assert.isNotNaN = function (val, msg) {
    new Assertion(val, msg).not.to.be.NaN;
  };

  /**
   * ### .isUndefined(value, [message])
   *
   * Asserts that `value` is `undefined`.
   *
   *     var tea;
   *     assert.isUndefined(tea, 'no tea defined');
   *
   * @name isUndefined
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isUndefined = function (val, msg) {
    new Assertion(val, msg).to.equal(undefined);
  };

  /**
   * ### .isDefined(value, [message])
   *
   * Asserts that `value` is not `undefined`.
   *
   *     var tea = 'cup of chai';
   *     assert.isDefined(tea, 'tea has been defined');
   *
   * @name isDefined
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isDefined = function (val, msg) {
    new Assertion(val, msg).to.not.equal(undefined);
  };

  /**
   * ### .isFunction(value, [message])
   *
   * Asserts that `value` is a function.
   *
   *     function serveTea() { return 'cup of tea'; };
   *     assert.isFunction(serveTea, 'great, we can have tea now');
   *
   * @name isFunction
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isFunction = function (val, msg) {
    new Assertion(val, msg).to.be.a('function');
  };

  /**
   * ### .isNotFunction(value, [message])
   *
   * Asserts that `value` is _not_ a function.
   *
   *     var serveTea = [ 'heat', 'pour', 'sip' ];
   *     assert.isNotFunction(serveTea, 'great, we have listed the steps');
   *
   * @name isNotFunction
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotFunction = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('function');
  };

  /**
   * ### .isObject(value, [message])
   *
   * Asserts that `value` is an object of type 'Object' (as revealed by `Object.prototype.toString`).
   * _The assertion does not match subclassed objects._
   *
   *     var selection = { name: 'Chai', serve: 'with spices' };
   *     assert.isObject(selection, 'tea selection is an object');
   *
   * @name isObject
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isObject = function (val, msg) {
    new Assertion(val, msg).to.be.a('object');
  };

  /**
   * ### .isNotObject(value, [message])
   *
   * Asserts that `value` is _not_ an object of type 'Object' (as revealed by `Object.prototype.toString`).
   *
   *     var selection = 'chai'
   *     assert.isNotObject(selection, 'tea selection is not an object');
   *     assert.isNotObject(null, 'null is not an object');
   *
   * @name isNotObject
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotObject = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('object');
  };

  /**
   * ### .isArray(value, [message])
   *
   * Asserts that `value` is an array.
   *
   *     var menu = [ 'green', 'chai', 'oolong' ];
   *     assert.isArray(menu, 'what kind of tea do we want?');
   *
   * @name isArray
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isArray = function (val, msg) {
    new Assertion(val, msg).to.be.an('array');
  };

  /**
   * ### .isNotArray(value, [message])
   *
   * Asserts that `value` is _not_ an array.
   *
   *     var menu = 'green|chai|oolong';
   *     assert.isNotArray(menu, 'what kind of tea do we want?');
   *
   * @name isNotArray
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotArray = function (val, msg) {
    new Assertion(val, msg).to.not.be.an('array');
  };

  /**
   * ### .isString(value, [message])
   *
   * Asserts that `value` is a string.
   *
   *     var teaOrder = 'chai';
   *     assert.isString(teaOrder, 'order placed');
   *
   * @name isString
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isString = function (val, msg) {
    new Assertion(val, msg).to.be.a('string');
  };

  /**
   * ### .isNotString(value, [message])
   *
   * Asserts that `value` is _not_ a string.
   *
   *     var teaOrder = 4;
   *     assert.isNotString(teaOrder, 'order placed');
   *
   * @name isNotString
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotString = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('string');
  };

  /**
   * ### .isNumber(value, [message])
   *
   * Asserts that `value` is a number.
   *
   *     var cups = 2;
   *     assert.isNumber(cups, 'how many cups');
   *
   * @name isNumber
   * @param {Number} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNumber = function (val, msg) {
    new Assertion(val, msg).to.be.a('number');
  };

  /**
   * ### .isNotNumber(value, [message])
   *
   * Asserts that `value` is _not_ a number.
   *
   *     var cups = '2 cups please';
   *     assert.isNotNumber(cups, 'how many cups');
   *
   * @name isNotNumber
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotNumber = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('number');
  };

  /**
   * ### .isBoolean(value, [message])
   *
   * Asserts that `value` is a boolean.
   *
   *     var teaReady = true
   *       , teaServed = false;
   *
   *     assert.isBoolean(teaReady, 'is the tea ready');
   *     assert.isBoolean(teaServed, 'has tea been served');
   *
   * @name isBoolean
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isBoolean = function (val, msg) {
    new Assertion(val, msg).to.be.a('boolean');
  };

  /**
   * ### .isNotBoolean(value, [message])
   *
   * Asserts that `value` is _not_ a boolean.
   *
   *     var teaReady = 'yep'
   *       , teaServed = 'nope';
   *
   *     assert.isNotBoolean(teaReady, 'is the tea ready');
   *     assert.isNotBoolean(teaServed, 'has tea been served');
   *
   * @name isNotBoolean
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotBoolean = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('boolean');
  };

  /**
   * ### .typeOf(value, name, [message])
   *
   * Asserts that `value`'s type is `name`, as determined by
   * `Object.prototype.toString`.
   *
   *     assert.typeOf({ tea: 'chai' }, 'object', 'we have an object');
   *     assert.typeOf(['chai', 'jasmine'], 'array', 'we have an array');
   *     assert.typeOf('tea', 'string', 'we have a string');
   *     assert.typeOf(/tea/, 'regexp', 'we have a regular expression');
   *     assert.typeOf(null, 'null', 'we have a null');
   *     assert.typeOf(undefined, 'undefined', 'we have an undefined');
   *
   * @name typeOf
   * @param {Mixed} value
   * @param {String} name
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.typeOf = function (val, type, msg) {
    new Assertion(val, msg).to.be.a(type);
  };

  /**
   * ### .notTypeOf(value, name, [message])
   *
   * Asserts that `value`'s type is _not_ `name`, as determined by
   * `Object.prototype.toString`.
   *
   *     assert.notTypeOf('tea', 'number', 'strings are not numbers');
   *
   * @name notTypeOf
   * @param {Mixed} value
   * @param {String} typeof name
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notTypeOf = function (val, type, msg) {
    new Assertion(val, msg).to.not.be.a(type);
  };

  /**
   * ### .instanceOf(object, constructor, [message])
   *
   * Asserts that `value` is an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , chai = new Tea('chai');
   *
   *     assert.instanceOf(chai, Tea, 'chai is an instance of tea');
   *
   * @name instanceOf
   * @param {Object} object
   * @param {Constructor} constructor
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.instanceOf = function (val, type, msg) {
    new Assertion(val, msg).to.be.instanceOf(type);
  };

  /**
   * ### .notInstanceOf(object, constructor, [message])
   *
   * Asserts `value` is not an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , chai = new String('chai');
   *
   *     assert.notInstanceOf(chai, Tea, 'chai is not an instance of tea');
   *
   * @name notInstanceOf
   * @param {Object} object
   * @param {Constructor} constructor
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notInstanceOf = function (val, type, msg) {
    new Assertion(val, msg).to.not.be.instanceOf(type);
  };

  /**
   * ### .include(haystack, needle, [message])
   *
   * Asserts that `haystack` includes `needle`. Works
   * for strings and arrays.
   *
   *     assert.include('foobar', 'bar', 'foobar contains string "bar"');
   *     assert.include([ 1, 2, 3 ], 3, 'array contains value');
   *
   * @name include
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.include = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.include).include(inc);
  };

  /**
   * ### .notInclude(haystack, needle, [message])
   *
   * Asserts that `haystack` does not include `needle`. Works
   * for strings and arrays.
   *
   *     assert.notInclude('foobar', 'baz', 'string not include substring');
   *     assert.notInclude([ 1, 2, 3 ], 4, 'array not include contain value');
   *
   * @name notInclude
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.notInclude).not.include(inc);
  };

  /**
   * ### .match(value, regexp, [message])
   *
   * Asserts that `value` matches the regular expression `regexp`.
   *
   *     assert.match('foobar', /^foo/, 'regexp matches');
   *
   * @name match
   * @param {Mixed} value
   * @param {RegExp} regexp
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.match = function (exp, re, msg) {
    new Assertion(exp, msg).to.match(re);
  };

  /**
   * ### .notMatch(value, regexp, [message])
   *
   * Asserts that `value` does not match the regular expression `regexp`.
   *
   *     assert.notMatch('foobar', /^foo/, 'regexp does not match');
   *
   * @name notMatch
   * @param {Mixed} value
   * @param {RegExp} regexp
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notMatch = function (exp, re, msg) {
    new Assertion(exp, msg).to.not.match(re);
  };

  /**
   * ### .property(object, property, [message])
   *
   * Asserts that `object` has a property named by `property`.
   *
   *     assert.property({ tea: { green: 'matcha' }}, 'tea');
   *
   * @name property
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.property = function (obj, prop, msg) {
    new Assertion(obj, msg).to.have.property(prop);
  };

  /**
   * ### .notProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property`.
   *
   *     assert.notProperty({ tea: { green: 'matcha' }}, 'coffee');
   *
   * @name notProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notProperty = function (obj, prop, msg) {
    new Assertion(obj, msg).to.not.have.property(prop);
  };

  /**
   * ### .deepProperty(object, property, [message])
   *
   * Asserts that `object` has a property named by `property`, which can be a
   * string using dot- and bracket-notation for deep reference.
   *
   *     assert.deepProperty({ tea: { green: 'matcha' }}, 'tea.green');
   *
   * @name deepProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepProperty = function (obj, prop, msg) {
    new Assertion(obj, msg).to.have.deep.property(prop);
  };

  /**
   * ### .notDeepProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property`, which
   * can be a string using dot- and bracket-notation for deep reference.
   *
   *     assert.notDeepProperty({ tea: { green: 'matcha' }}, 'tea.oolong');
   *
   * @name notDeepProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notDeepProperty = function (obj, prop, msg) {
    new Assertion(obj, msg).to.not.have.deep.property(prop);
  };

  /**
   * ### .propertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property` with value given
   * by `value`.
   *
   *     assert.propertyVal({ tea: 'is good' }, 'tea', 'is good');
   *
   * @name propertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.propertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.have.property(prop, val);
  };

  /**
   * ### .propertyNotVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property`, but with a value
   * different from that given by `value`.
   *
   *     assert.propertyNotVal({ tea: 'is good' }, 'tea', 'is bad');
   *
   * @name propertyNotVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.propertyNotVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.not.have.property(prop, val);
  };

  /**
   * ### .deepPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property` with value given
   * by `value`. `property` can use dot- and bracket-notation for deep
   * reference.
   *
   *     assert.deepPropertyVal({ tea: { green: 'matcha' }}, 'tea.green', 'matcha');
   *
   * @name deepPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.have.deep.property(prop, val);
  };

  /**
   * ### .deepPropertyNotVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property`, but with a value
   * different from that given by `value`. `property` can use dot- and
   * bracket-notation for deep reference.
   *
   *     assert.deepPropertyNotVal({ tea: { green: 'matcha' }}, 'tea.green', 'konacha');
   *
   * @name deepPropertyNotVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepPropertyNotVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.not.have.deep.property(prop, val);
  };

  /**
   * ### .lengthOf(object, length, [message])
   *
   * Asserts that `object` has a `length` property with the expected value.
   *
   *     assert.lengthOf([1,2,3], 3, 'array has length of 3');
   *     assert.lengthOf('foobar', 6, 'string has length of 6');
   *
   * @name lengthOf
   * @param {Mixed} object
   * @param {Number} length
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.lengthOf = function (exp, len, msg) {
    new Assertion(exp, msg).to.have.length(len);
  };

  /**
   * ### .throws(function, [constructor/string/regexp], [string/regexp], [message])
   *
   * Asserts that `function` will throw an error that is an instance of
   * `constructor`, or alternately that it will throw an error with message
   * matching `regexp`.
   *
   *     assert.throws(fn, 'function throws a reference error');
   *     assert.throws(fn, /function throws a reference error/);
   *     assert.throws(fn, ReferenceError);
   *     assert.throws(fn, ReferenceError, 'function throws a reference error');
   *     assert.throws(fn, ReferenceError, /function throws a reference error/);
   *
   * @name throws
   * @alias throw
   * @alias Throw
   * @param {Function} function
   * @param {ErrorConstructor} constructor
   * @param {RegExp} regexp
   * @param {String} message
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @namespace Assert
   * @api public
   */

  assert.throws = function (fn, errt, errs, msg) {
    if ('string' === typeof errt || errt instanceof RegExp) {
      errs = errt;
      errt = null;
    }

    var assertErr = new Assertion(fn, msg).to.throw(errt, errs);
    return flag(assertErr, 'object');
  };

  /**
   * ### .doesNotThrow(function, [constructor/regexp], [message])
   *
   * Asserts that `function` will _not_ throw an error that is an instance of
   * `constructor`, or alternately that it will not throw an error with message
   * matching `regexp`.
   *
   *     assert.doesNotThrow(fn, Error, 'function does not throw');
   *
   * @name doesNotThrow
   * @param {Function} function
   * @param {ErrorConstructor} constructor
   * @param {RegExp} regexp
   * @param {String} message
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @namespace Assert
   * @api public
   */

  assert.doesNotThrow = function (fn, type, msg) {
    if ('string' === typeof type) {
      msg = type;
      type = null;
    }

    new Assertion(fn, msg).to.not.Throw(type);
  };

  /**
   * ### .operator(val1, operator, val2, [message])
   *
   * Compares two values using `operator`.
   *
   *     assert.operator(1, '<', 2, 'everything is ok');
   *     assert.operator(1, '>', 2, 'this will fail');
   *
   * @name operator
   * @param {Mixed} val1
   * @param {String} operator
   * @param {Mixed} val2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.operator = function (val, operator, val2, msg) {
    var ok;
    switch(operator) {
      case '==':
        ok = val == val2;
        break;
      case '===':
        ok = val === val2;
        break;
      case '>':
        ok = val > val2;
        break;
      case '>=':
        ok = val >= val2;
        break;
      case '<':
        ok = val < val2;
        break;
      case '<=':
        ok = val <= val2;
        break;
      case '!=':
        ok = val != val2;
        break;
      case '!==':
        ok = val !== val2;
        break;
      default:
        throw new Error('Invalid operator "' + operator + '"');
    }
    var test = new Assertion(ok, msg);
    test.assert(
        true === flag(test, 'object')
      , 'expected ' + util.inspect(val) + ' to be ' + operator + ' ' + util.inspect(val2)
      , 'expected ' + util.inspect(val) + ' to not be ' + operator + ' ' + util.inspect(val2) );
  };

  /**
   * ### .closeTo(actual, expected, delta, [message])
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     assert.closeTo(1.5, 1, 0.5, 'numbers are close');
   *
   * @name closeTo
   * @param {Number} actual
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.closeTo = function (act, exp, delta, msg) {
    new Assertion(act, msg).to.be.closeTo(exp, delta);
  };

  /**
   * ### .approximately(actual, expected, delta, [message])
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     assert.approximately(1.5, 1, 0.5, 'numbers are close');
   *
   * @name approximately
   * @param {Number} actual
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.approximately = function (act, exp, delta, msg) {
    new Assertion(act, msg).to.be.approximately(exp, delta);
  };

  /**
   * ### .sameMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members.
   * Order is not taken into account.
   *
   *     assert.sameMembers([ 1, 2, 3 ], [ 2, 1, 3 ], 'same members');
   *
   * @name sameMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.sameMembers = function (set1, set2, msg) {
    new Assertion(set1, msg).to.have.same.members(set2);
  }

  /**
   * ### .sameDeepMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members - using a deep equality checking.
   * Order is not taken into account.
   *
   *     assert.sameDeepMembers([ {b: 3}, {a: 2}, {c: 5} ], [ {c: 5}, {b: 3}, {a: 2} ], 'same deep members');
   *
   * @name sameDeepMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.sameDeepMembers = function (set1, set2, msg) {
    new Assertion(set1, msg).to.have.same.deep.members(set2);
  }

  /**
   * ### .includeMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset`.
   * Order is not taken into account.
   *
   *     assert.includeMembers([ 1, 2, 3 ], [ 2, 1 ], 'include members');
   *
   * @name includeMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.includeMembers = function (superset, subset, msg) {
    new Assertion(superset, msg).to.include.members(subset);
  }

  /**
   * ### .includeDeepMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset` - using deep equality checking.
   * Order is not taken into account.
   * Duplicates are ignored.
   *
   *     assert.includeDeepMembers([ {a: 1}, {b: 2}, {c: 3} ], [ {b: 2}, {a: 1}, {b: 2} ], 'include deep members');
   *
   * @name includeDeepMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.includeDeepMembers = function (superset, subset, msg) {
    new Assertion(superset, msg).to.include.deep.members(subset);
  }

  /**
   * ### .oneOf(inList, list, [message])
   *
   * Asserts that non-object, non-array value `inList` appears in the flat array `list`.
   *
   *     assert.oneOf(1, [ 2, 1 ], 'Not found in list');
   *
   * @name oneOf
   * @param {*} inList
   * @param {Array<*>} list
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.oneOf = function (inList, list, msg) {
    new Assertion(inList, msg).to.be.oneOf(list);
  }

   /**
   * ### .changes(function, object, property)
   *
   * Asserts that a function changes the value of a property
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 22 };
   *     assert.changes(fn, obj, 'val');
   *
   * @name changes
   * @param {Function} modifier function
   * @param {Object} object
   * @param {String} property name
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.changes = function (fn, obj, prop) {
    new Assertion(fn).to.change(obj, prop);
  }

   /**
   * ### .doesNotChange(function, object, property)
   *
   * Asserts that a function does not changes the value of a property
   *
   *     var obj = { val: 10 };
   *     var fn = function() { console.log('foo'); };
   *     assert.doesNotChange(fn, obj, 'val');
   *
   * @name doesNotChange
   * @param {Function} modifier function
   * @param {Object} object
   * @param {String} property name
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.doesNotChange = function (fn, obj, prop) {
    new Assertion(fn).to.not.change(obj, prop);
  }

   /**
   * ### .increases(function, object, property)
   *
   * Asserts that a function increases an object property
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 13 };
   *     assert.increases(fn, obj, 'val');
   *
   * @name increases
   * @param {Function} modifier function
   * @param {Object} object
   * @param {String} property name
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.increases = function (fn, obj, prop) {
    new Assertion(fn).to.increase(obj, prop);
  }

   /**
   * ### .doesNotIncrease(function, object, property)
   *
   * Asserts that a function does not increase object property
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 8 };
   *     assert.doesNotIncrease(fn, obj, 'val');
   *
   * @name doesNotIncrease
   * @param {Function} modifier function
   * @param {Object} object
   * @param {String} property name
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.doesNotIncrease = function (fn, obj, prop) {
    new Assertion(fn).to.not.increase(obj, prop);
  }

   /**
   * ### .decreases(function, object, property)
   *
   * Asserts that a function decreases an object property
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 5 };
   *     assert.decreases(fn, obj, 'val');
   *
   * @name decreases
   * @param {Function} modifier function
   * @param {Object} object
   * @param {String} property name
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.decreases = function (fn, obj, prop) {
    new Assertion(fn).to.decrease(obj, prop);
  }

   /**
   * ### .doesNotDecrease(function, object, property)
   *
   * Asserts that a function does not decreases an object property
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 15 };
   *     assert.doesNotDecrease(fn, obj, 'val');
   *
   * @name doesNotDecrease
   * @param {Function} modifier function
   * @param {Object} object
   * @param {String} property name
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.doesNotDecrease = function (fn, obj, prop) {
    new Assertion(fn).to.not.decrease(obj, prop);
  }

  /*!
   * ### .ifError(object)
   *
   * Asserts if value is not a false value, and throws if it is a true value.
   * This is added to allow for chai to be a drop-in replacement for Node's
   * assert class.
   *
   *     var err = new Error('I am a custom error');
   *     assert.ifError(err); // Rethrows err!
   *
   * @name ifError
   * @param {Object} object
   * @namespace Assert
   * @api public
   */

  assert.ifError = function (val) {
    if (val) {
      throw(val);
    }
  };

  /**
   * ### .isExtensible(object)
   *
   * Asserts that `object` is extensible (can have new properties added to it).
   *
   *     assert.isExtensible({});
   *
   * @name isExtensible
   * @alias extensible
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isExtensible = function (obj, msg) {
    new Assertion(obj, msg).to.be.extensible;
  };

  /**
   * ### .isNotExtensible(object)
   *
   * Asserts that `object` is _not_ extensible.
   *
   *     var nonExtensibleObject = Object.preventExtensions({});
   *     var sealedObject = Object.seal({});
   *     var frozenObject = Object.freese({});
   *
   *     assert.isNotExtensible(nonExtensibleObject);
   *     assert.isNotExtensible(sealedObject);
   *     assert.isNotExtensible(frozenObject);
   *
   * @name isNotExtensible
   * @alias notExtensible
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isNotExtensible = function (obj, msg) {
    new Assertion(obj, msg).to.not.be.extensible;
  };

  /**
   * ### .isSealed(object)
   *
   * Asserts that `object` is sealed (cannot have new properties added to it
   * and its existing properties cannot be removed).
   *
   *     var sealedObject = Object.seal({});
   *     var frozenObject = Object.seal({});
   *
   *     assert.isSealed(sealedObject);
   *     assert.isSealed(frozenObject);
   *
   * @name isSealed
   * @alias sealed
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isSealed = function (obj, msg) {
    new Assertion(obj, msg).to.be.sealed;
  };

  /**
   * ### .isNotSealed(object)
   *
   * Asserts that `object` is _not_ sealed.
   *
   *     assert.isNotSealed({});
   *
   * @name isNotSealed
   * @alias notSealed
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isNotSealed = function (obj, msg) {
    new Assertion(obj, msg).to.not.be.sealed;
  };

  /**
   * ### .isFrozen(object)
   *
   * Asserts that `object` is frozen (cannot have new properties added to it
   * and its existing properties cannot be modified).
   *
   *     var frozenObject = Object.freeze({});
   *     assert.frozen(frozenObject);
   *
   * @name isFrozen
   * @alias frozen
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isFrozen = function (obj, msg) {
    new Assertion(obj, msg).to.be.frozen;
  };

  /**
   * ### .isNotFrozen(object)
   *
   * Asserts that `object` is _not_ frozen.
   *
   *     assert.isNotFrozen({});
   *
   * @name isNotFrozen
   * @alias notFrozen
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isNotFrozen = function (obj, msg) {
    new Assertion(obj, msg).to.not.be.frozen;
  };

  /*!
   * Aliases.
   */

  (function alias(name, as){
    assert[as] = assert[name];
    return alias;
  })
  ('isOk', 'ok')
  ('isNotOk', 'notOk')
  ('throws', 'throw')
  ('throws', 'Throw')
  ('isExtensible', 'extensible')
  ('isNotExtensible', 'notExtensible')
  ('isSealed', 'sealed')
  ('isNotSealed', 'notSealed')
  ('isFrozen', 'frozen')
  ('isNotFrozen', 'notFrozen');
};

},{}],12:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, util) {
  chai.expect = function (val, message) {
    return new chai.Assertion(val, message);
  };

  /**
   * ### .fail(actual, expected, [message], [operator])
   *
   * Throw a failure.
   *
   * @name fail
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @param {String} operator
   * @namespace Expect
   * @api public
   */

  chai.expect.fail = function (actual, expected, message, operator) {
    message = message || 'expect.fail()';
    throw new chai.AssertionError(message, {
        actual: actual
      , expected: expected
      , operator: operator
    }, chai.expect.fail);
  };
};

},{}],13:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, util) {
  var Assertion = chai.Assertion;

  function loadShould () {
    // explicitly define this method as function as to have it's name to include as `ssfi`
    function shouldGetter() {
      if (this instanceof String || this instanceof Number || this instanceof Boolean ) {
        return new Assertion(this.valueOf(), null, shouldGetter);
      }
      return new Assertion(this, null, shouldGetter);
    }
    function shouldSetter(value) {
      // See https://github.com/chaijs/chai/issues/86: this makes
      // `whatever.should = someValue` actually set `someValue`, which is
      // especially useful for `global.should = require('chai').should()`.
      //
      // Note that we have to use [[DefineProperty]] instead of [[Put]]
      // since otherwise we would trigger this very setter!
      Object.defineProperty(this, 'should', {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
    // modify Object.prototype to have `should`
    Object.defineProperty(Object.prototype, 'should', {
      set: shouldSetter
      , get: shouldGetter
      , configurable: true
    });

    var should = {};

    /**
     * ### .fail(actual, expected, [message], [operator])
     *
     * Throw a failure.
     *
     * @name fail
     * @param {Mixed} actual
     * @param {Mixed} expected
     * @param {String} message
     * @param {String} operator
     * @namespace Should
     * @api public
     */

    should.fail = function (actual, expected, message, operator) {
      message = message || 'should.fail()';
      throw new chai.AssertionError(message, {
          actual: actual
        , expected: expected
        , operator: operator
      }, should.fail);
    };

    /**
     * ### .equal(actual, expected, [message])
     *
     * Asserts non-strict equality (`==`) of `actual` and `expected`.
     *
     *     should.equal(3, '3', '== coerces values to strings');
     *
     * @name equal
     * @param {Mixed} actual
     * @param {Mixed} expected
     * @param {String} message
     * @namespace Should
     * @api public
     */

    should.equal = function (val1, val2, msg) {
      new Assertion(val1, msg).to.equal(val2);
    };

    /**
     * ### .throw(function, [constructor/string/regexp], [string/regexp], [message])
     *
     * Asserts that `function` will throw an error that is an instance of
     * `constructor`, or alternately that it will throw an error with message
     * matching `regexp`.
     *
     *     should.throw(fn, 'function throws a reference error');
     *     should.throw(fn, /function throws a reference error/);
     *     should.throw(fn, ReferenceError);
     *     should.throw(fn, ReferenceError, 'function throws a reference error');
     *     should.throw(fn, ReferenceError, /function throws a reference error/);
     *
     * @name throw
     * @alias Throw
     * @param {Function} function
     * @param {ErrorConstructor} constructor
     * @param {RegExp} regexp
     * @param {String} message
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
     * @namespace Should
     * @api public
     */

    should.Throw = function (fn, errt, errs, msg) {
      new Assertion(fn, msg).to.Throw(errt, errs);
    };

    /**
     * ### .exist
     *
     * Asserts that the target is neither `null` nor `undefined`.
     *
     *     var foo = 'hi';
     *
     *     should.exist(foo, 'foo exists');
     *
     * @name exist
     * @namespace Should
     * @api public
     */

    should.exist = function (val, msg) {
      new Assertion(val, msg).to.exist;
    }

    // negation
    should.not = {}

    /**
     * ### .not.equal(actual, expected, [message])
     *
     * Asserts non-strict inequality (`!=`) of `actual` and `expected`.
     *
     *     should.not.equal(3, 4, 'these numbers are not equal');
     *
     * @name not.equal
     * @param {Mixed} actual
     * @param {Mixed} expected
     * @param {String} message
     * @namespace Should
     * @api public
     */

    should.not.equal = function (val1, val2, msg) {
      new Assertion(val1, msg).to.not.equal(val2);
    };

    /**
     * ### .throw(function, [constructor/regexp], [message])
     *
     * Asserts that `function` will _not_ throw an error that is an instance of
     * `constructor`, or alternately that it will not throw an error with message
     * matching `regexp`.
     *
     *     should.not.throw(fn, Error, 'function does not throw');
     *
     * @name not.throw
     * @alias not.Throw
     * @param {Function} function
     * @param {ErrorConstructor} constructor
     * @param {RegExp} regexp
     * @param {String} message
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
     * @namespace Should
     * @api public
     */

    should.not.Throw = function (fn, errt, errs, msg) {
      new Assertion(fn, msg).to.not.Throw(errt, errs);
    };

    /**
     * ### .not.exist
     *
     * Asserts that the target is neither `null` nor `undefined`.
     *
     *     var bar = null;
     *
     *     should.not.exist(bar, 'bar does not exist');
     *
     * @name not.exist
     * @namespace Should
     * @api public
     */

    should.not.exist = function (val, msg) {
      new Assertion(val, msg).to.not.exist;
    }

    should['throw'] = should['Throw'];
    should.not['throw'] = should.not['Throw'];

    return should;
  };

  chai.should = loadShould;
  chai.Should = loadShould;
};

},{}],14:[function(require,module,exports){
/*!
 * Chai - addChainingMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var transferFlags = require('./transferFlags');
var flag = require('./flag');
var config = require('../config');

/*!
 * Module variables
 */

// Check whether `__proto__` is supported
var hasProtoSupport = '__proto__' in Object;

// Without `__proto__` support, this module will need to add properties to a function.
// However, some Function.prototype methods cannot be overwritten,
// and there seems no easy cross-platform way to detect them (@see chaijs/chai/issues/69).
var excludeNames = /^(?:length|name|arguments|caller)$/;

// Cache `Function` properties
var call  = Function.prototype.call,
    apply = Function.prototype.apply;

/**
 * ### addChainableMethod (ctx, name, method, chainingBehavior)
 *
 * Adds a method to an object, such that the method can also be chained.
 *
 *     utils.addChainableMethod(chai.Assertion.prototype, 'foo', function (str) {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.equal(str);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addChainableMethod('foo', fn, chainingBehavior);
 *
 * The result can then be used as both a method assertion, executing both `method` and
 * `chainingBehavior`, or as a language chain, which only executes `chainingBehavior`.
 *
 *     expect(fooStr).to.be.foo('bar');
 *     expect(fooStr).to.be.foo.equal('foo');
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Function} method function to be used for `name`, when called
 * @param {Function} chainingBehavior function to be called every time the property is accessed
 * @namespace Utils
 * @name addChainableMethod
 * @api public
 */

module.exports = function (ctx, name, method, chainingBehavior) {
  if (typeof chainingBehavior !== 'function') {
    chainingBehavior = function () { };
  }

  var chainableBehavior = {
      method: method
    , chainingBehavior: chainingBehavior
  };

  // save the methods so we can overwrite them later, if we need to.
  if (!ctx.__methods) {
    ctx.__methods = {};
  }
  ctx.__methods[name] = chainableBehavior;

  Object.defineProperty(ctx, name,
    { get: function () {
        chainableBehavior.chainingBehavior.call(this);

        var assert = function assert() {
          var old_ssfi = flag(this, 'ssfi');
          if (old_ssfi && config.includeStack === false)
            flag(this, 'ssfi', assert);
          var result = chainableBehavior.method.apply(this, arguments);
          return result === undefined ? this : result;
        };

        // Use `__proto__` if available
        if (hasProtoSupport) {
          // Inherit all properties from the object by replacing the `Function` prototype
          var prototype = assert.__proto__ = Object.create(this);
          // Restore the `call` and `apply` methods from `Function`
          prototype.call = call;
          prototype.apply = apply;
        }
        // Otherwise, redefine all properties (slow!)
        else {
          var asserterNames = Object.getOwnPropertyNames(ctx);
          asserterNames.forEach(function (asserterName) {
            if (!excludeNames.test(asserterName)) {
              var pd = Object.getOwnPropertyDescriptor(ctx, asserterName);
              Object.defineProperty(assert, asserterName, pd);
            }
          });
        }

        transferFlags(this, assert);
        return assert;
      }
    , configurable: true
  });
};

},{"../config":9,"./flag":18,"./transferFlags":34}],15:[function(require,module,exports){
/*!
 * Chai - addMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var config = require('../config');

/**
 * ### .addMethod (ctx, name, method)
 *
 * Adds a method to the prototype of an object.
 *
 *     utils.addMethod(chai.Assertion.prototype, 'foo', function (str) {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.equal(str);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addMethod('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(fooStr).to.be.foo('bar');
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Function} method function to be used for name
 * @namespace Utils
 * @name addMethod
 * @api public
 */
var flag = require('./flag');

module.exports = function (ctx, name, method) {
  ctx[name] = function () {
    var old_ssfi = flag(this, 'ssfi');
    if (old_ssfi && config.includeStack === false)
      flag(this, 'ssfi', ctx[name]);
    var result = method.apply(this, arguments);
    return result === undefined ? this : result;
  };
};

},{"../config":9,"./flag":18}],16:[function(require,module,exports){
/*!
 * Chai - addProperty utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var config = require('../config');
var flag = require('./flag');

/**
 * ### addProperty (ctx, name, getter)
 *
 * Adds a property to the prototype of an object.
 *
 *     utils.addProperty(chai.Assertion.prototype, 'foo', function () {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.instanceof(Foo);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addProperty('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.be.foo;
 *
 * @param {Object} ctx object to which the property is added
 * @param {String} name of property to add
 * @param {Function} getter function to be used for name
 * @namespace Utils
 * @name addProperty
 * @api public
 */

module.exports = function (ctx, name, getter) {
  Object.defineProperty(ctx, name,
    { get: function addProperty() {
        var old_ssfi = flag(this, 'ssfi');
        if (old_ssfi && config.includeStack === false)
          flag(this, 'ssfi', addProperty);

        var result = getter.call(this);
        return result === undefined ? this : result;
      }
    , configurable: true
  });
};

},{"../config":9,"./flag":18}],17:[function(require,module,exports){
/*!
 * Chai - expectTypes utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### expectTypes(obj, types)
 *
 * Ensures that the object being tested against is of a valid type.
 *
 *     utils.expectTypes(this, ['array', 'object', 'string']);
 *
 * @param {Mixed} obj constructed Assertion
 * @param {Array} type A list of allowed types for this assertion
 * @namespace Utils
 * @name expectTypes
 * @api public
 */

var AssertionError = require('assertion-error');
var flag = require('./flag');
var type = require('type-detect');

module.exports = function (obj, types) {
  var obj = flag(obj, 'object');
  types = types.map(function (t) { return t.toLowerCase(); });
  types.sort();

  // Transforms ['lorem', 'ipsum'] into 'a lirum, or an ipsum'
  var str = types.map(function (t, index) {
    var art = ~[ 'a', 'e', 'i', 'o', 'u' ].indexOf(t.charAt(0)) ? 'an' : 'a';
    var or = types.length > 1 && index === types.length - 1 ? 'or ' : '';
    return or + art + ' ' + t;
  }).join(', ');

  if (!types.some(function (expected) { return type(obj) === expected; })) {
    throw new AssertionError(
      'object tested must be ' + str + ', but ' + type(obj) + ' given'
    );
  }
};

},{"./flag":18,"assertion-error":5,"type-detect":39}],18:[function(require,module,exports){
/*!
 * Chai - flag utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### flag(object, key, [value])
 *
 * Get or set a flag value on an object. If a
 * value is provided it will be set, else it will
 * return the currently set value or `undefined` if
 * the value is not set.
 *
 *     utils.flag(this, 'foo', 'bar'); // setter
 *     utils.flag(this, 'foo'); // getter, returns `bar`
 *
 * @param {Object} object constructed Assertion
 * @param {String} key
 * @param {Mixed} value (optional)
 * @namespace Utils
 * @name flag
 * @api private
 */

module.exports = function (obj, key, value) {
  var flags = obj.__flags || (obj.__flags = Object.create(null));
  if (arguments.length === 3) {
    flags[key] = value;
  } else {
    return flags[key];
  }
};

},{}],19:[function(require,module,exports){
/*!
 * Chai - getActual utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * # getActual(object, [actual])
 *
 * Returns the `actual` value for an Assertion
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @namespace Utils
 * @name getActual
 */

module.exports = function (obj, args) {
  return args.length > 4 ? args[4] : obj._obj;
};

},{}],20:[function(require,module,exports){
/*!
 * Chai - getEnumerableProperties utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getEnumerableProperties(object)
 *
 * This allows the retrieval of enumerable property names of an object,
 * inherited or not.
 *
 * @param {Object} object
 * @returns {Array}
 * @namespace Utils
 * @name getEnumerableProperties
 * @api public
 */

module.exports = function getEnumerableProperties(object) {
  var result = [];
  for (var name in object) {
    result.push(name);
  }
  return result;
};

},{}],21:[function(require,module,exports){
/*!
 * Chai - message composition utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var flag = require('./flag')
  , getActual = require('./getActual')
  , inspect = require('./inspect')
  , objDisplay = require('./objDisplay');

/**
 * ### .getMessage(object, message, negateMessage)
 *
 * Construct the error message based on flags
 * and template tags. Template tags will return
 * a stringified inspection of the object referenced.
 *
 * Message template tags:
 * - `#{this}` current asserted object
 * - `#{act}` actual value
 * - `#{exp}` expected value
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @namespace Utils
 * @name getMessage
 * @api public
 */

module.exports = function (obj, args) {
  var negate = flag(obj, 'negate')
    , val = flag(obj, 'object')
    , expected = args[3]
    , actual = getActual(obj, args)
    , msg = negate ? args[2] : args[1]
    , flagMsg = flag(obj, 'message');

  if(typeof msg === "function") msg = msg();
  msg = msg || '';
  msg = msg
    .replace(/#\{this\}/g, function () { return objDisplay(val); })
    .replace(/#\{act\}/g, function () { return objDisplay(actual); })
    .replace(/#\{exp\}/g, function () { return objDisplay(expected); });

  return flagMsg ? flagMsg + ': ' + msg : msg;
};

},{"./flag":18,"./getActual":19,"./inspect":28,"./objDisplay":29}],22:[function(require,module,exports){
/*!
 * Chai - getName utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * # getName(func)
 *
 * Gets the name of a function, in a cross-browser way.
 *
 * @param {Function} a function (usually a constructor)
 * @namespace Utils
 * @name getName
 */

module.exports = function (func) {
  if (func.name) return func.name;

  var match = /^\s?function ([^(]*)\(/.exec(func);
  return match && match[1] ? match[1] : "";
};

},{}],23:[function(require,module,exports){
/*!
 * Chai - getPathInfo utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var hasProperty = require('./hasProperty');

/**
 * ### .getPathInfo(path, object)
 *
 * This allows the retrieval of property info in an
 * object given a string path.
 *
 * The path info consists of an object with the
 * following properties:
 *
 * * parent - The parent object of the property referenced by `path`
 * * name - The name of the final property, a number if it was an array indexer
 * * value - The value of the property, if it exists, otherwise `undefined`
 * * exists - Whether the property exists or not
 *
 * @param {String} path
 * @param {Object} object
 * @returns {Object} info
 * @namespace Utils
 * @name getPathInfo
 * @api public
 */

module.exports = function getPathInfo(path, obj) {
  var parsed = parsePath(path),
      last = parsed[parsed.length - 1];

  var info = {
    parent: parsed.length > 1 ? _getPathValue(parsed, obj, parsed.length - 1) : obj,
    name: last.p || last.i,
    value: _getPathValue(parsed, obj)
  };
  info.exists = hasProperty(info.name, info.parent);

  return info;
};


/*!
 * ## parsePath(path)
 *
 * Helper function used to parse string object
 * paths. Use in conjunction with `_getPathValue`.
 *
 *      var parsed = parsePath('myobject.property.subprop');
 *
 * ### Paths:
 *
 * * Can be as near infinitely deep and nested
 * * Arrays are also valid using the formal `myobject.document[3].property`.
 * * Literal dots and brackets (not delimiter) must be backslash-escaped.
 *
 * @param {String} path
 * @returns {Object} parsed
 * @api private
 */

function parsePath (path) {
  var str = path.replace(/([^\\])\[/g, '$1.[')
    , parts = str.match(/(\\\.|[^.]+?)+/g);
  return parts.map(function (value) {
    var re = /^\[(\d+)\]$/
      , mArr = re.exec(value);
    if (mArr) return { i: parseFloat(mArr[1]) };
    else return { p: value.replace(/\\([.\[\]])/g, '$1') };
  });
}


/*!
 * ## _getPathValue(parsed, obj)
 *
 * Helper companion function for `.parsePath` that returns
 * the value located at the parsed address.
 *
 *      var value = getPathValue(parsed, obj);
 *
 * @param {Object} parsed definition from `parsePath`.
 * @param {Object} object to search against
 * @param {Number} object to search against
 * @returns {Object|Undefined} value
 * @api private
 */

function _getPathValue (parsed, obj, index) {
  var tmp = obj
    , res;

  index = (index === undefined ? parsed.length : index);

  for (var i = 0, l = index; i < l; i++) {
    var part = parsed[i];
    if (tmp) {
      if ('undefined' !== typeof part.p)
        tmp = tmp[part.p];
      else if ('undefined' !== typeof part.i)
        tmp = tmp[part.i];
      if (i == (l - 1)) res = tmp;
    } else {
      res = undefined;
    }
  }
  return res;
}

},{"./hasProperty":26}],24:[function(require,module,exports){
/*!
 * Chai - getPathValue utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * @see https://github.com/logicalparadox/filtr
 * MIT Licensed
 */

var getPathInfo = require('./getPathInfo');

/**
 * ### .getPathValue(path, object)
 *
 * This allows the retrieval of values in an
 * object given a string path.
 *
 *     var obj = {
 *         prop1: {
 *             arr: ['a', 'b', 'c']
 *           , str: 'Hello'
 *         }
 *       , prop2: {
 *             arr: [ { nested: 'Universe' } ]
 *           , str: 'Hello again!'
 *         }
 *     }
 *
 * The following would be the results.
 *
 *     getPathValue('prop1.str', obj); // Hello
 *     getPathValue('prop1.att[2]', obj); // b
 *     getPathValue('prop2.arr[0].nested', obj); // Universe
 *
 * @param {String} path
 * @param {Object} object
 * @returns {Object} value or `undefined`
 * @namespace Utils
 * @name getPathValue
 * @api public
 */
module.exports = function(path, obj) {
  var info = getPathInfo(path, obj);
  return info.value;
};

},{"./getPathInfo":23}],25:[function(require,module,exports){
/*!
 * Chai - getProperties utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getProperties(object)
 *
 * This allows the retrieval of property names of an object, enumerable or not,
 * inherited or not.
 *
 * @param {Object} object
 * @returns {Array}
 * @namespace Utils
 * @name getProperties
 * @api public
 */

module.exports = function getProperties(object) {
  var result = Object.getOwnPropertyNames(object);

  function addProperty(property) {
    if (result.indexOf(property) === -1) {
      result.push(property);
    }
  }

  var proto = Object.getPrototypeOf(object);
  while (proto !== null) {
    Object.getOwnPropertyNames(proto).forEach(addProperty);
    proto = Object.getPrototypeOf(proto);
  }

  return result;
};

},{}],26:[function(require,module,exports){
/*!
 * Chai - hasProperty utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var type = require('type-detect');

/**
 * ### .hasProperty(object, name)
 *
 * This allows checking whether an object has
 * named property or numeric array index.
 *
 * Basically does the same thing as the `in`
 * operator but works properly with natives
 * and null/undefined values.
 *
 *     var obj = {
 *         arr: ['a', 'b', 'c']
 *       , str: 'Hello'
 *     }
 *
 * The following would be the results.
 *
 *     hasProperty('str', obj);  // true
 *     hasProperty('constructor', obj);  // true
 *     hasProperty('bar', obj);  // false
 *
 *     hasProperty('length', obj.str); // true
 *     hasProperty(1, obj.str);  // true
 *     hasProperty(5, obj.str);  // false
 *
 *     hasProperty('length', obj.arr);  // true
 *     hasProperty(2, obj.arr);  // true
 *     hasProperty(3, obj.arr);  // false
 *
 * @param {Objuect} object
 * @param {String|Number} name
 * @returns {Boolean} whether it exists
 * @namespace Utils
 * @name getPathInfo
 * @api public
 */

var literals = {
    'number': Number
  , 'string': String
};

module.exports = function hasProperty(name, obj) {
  var ot = type(obj);

  // Bad Object, obviously no props at all
  if(ot === 'null' || ot === 'undefined')
    return false;

  // The `in` operator does not work with certain literals
  // box these before the check
  if(literals[ot] && typeof obj !== 'object')
    obj = new literals[ot](obj);

  return name in obj;
};

},{"type-detect":39}],27:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Main exports
 */

var exports = module.exports = {};

/*!
 * test utility
 */

exports.test = require('./test');

/*!
 * type utility
 */

exports.type = require('type-detect');

/*!
 * expectTypes utility
 */
exports.expectTypes = require('./expectTypes');

/*!
 * message utility
 */

exports.getMessage = require('./getMessage');

/*!
 * actual utility
 */

exports.getActual = require('./getActual');

/*!
 * Inspect util
 */

exports.inspect = require('./inspect');

/*!
 * Object Display util
 */

exports.objDisplay = require('./objDisplay');

/*!
 * Flag utility
 */

exports.flag = require('./flag');

/*!
 * Flag transferring utility
 */

exports.transferFlags = require('./transferFlags');

/*!
 * Deep equal utility
 */

exports.eql = require('deep-eql');

/*!
 * Deep path value
 */

exports.getPathValue = require('./getPathValue');

/*!
 * Deep path info
 */

exports.getPathInfo = require('./getPathInfo');

/*!
 * Check if a property exists
 */

exports.hasProperty = require('./hasProperty');

/*!
 * Function name
 */

exports.getName = require('./getName');

/*!
 * add Property
 */

exports.addProperty = require('./addProperty');

/*!
 * add Method
 */

exports.addMethod = require('./addMethod');

/*!
 * overwrite Property
 */

exports.overwriteProperty = require('./overwriteProperty');

/*!
 * overwrite Method
 */

exports.overwriteMethod = require('./overwriteMethod');

/*!
 * Add a chainable method
 */

exports.addChainableMethod = require('./addChainableMethod');

/*!
 * Overwrite chainable method
 */

exports.overwriteChainableMethod = require('./overwriteChainableMethod');

},{"./addChainableMethod":14,"./addMethod":15,"./addProperty":16,"./expectTypes":17,"./flag":18,"./getActual":19,"./getMessage":21,"./getName":22,"./getPathInfo":23,"./getPathValue":24,"./hasProperty":26,"./inspect":28,"./objDisplay":29,"./overwriteChainableMethod":30,"./overwriteMethod":31,"./overwriteProperty":32,"./test":33,"./transferFlags":34,"deep-eql":35,"type-detect":39}],28:[function(require,module,exports){
// This is (almost) directly from Node.js utils
// https://github.com/joyent/node/blob/f8c335d0caf47f16d31413f89aa28eda3878e3aa/lib/util.js

var getName = require('./getName');
var getProperties = require('./getProperties');
var getEnumerableProperties = require('./getEnumerableProperties');

module.exports = inspect;

/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Boolean} showHidden Flag that shows hidden (not enumerable)
 *    properties of objects.
 * @param {Number} depth Depth in which to descend in object. Default is 2.
 * @param {Boolean} colors Flag to turn on ANSI escape codes to color the
 *    output. Default is false (no coloring).
 * @namespace Utils
 * @name inspect
 */
function inspect(obj, showHidden, depth, colors) {
  var ctx = {
    showHidden: showHidden,
    seen: [],
    stylize: function (str) { return str; }
  };
  return formatValue(ctx, obj, (typeof depth === 'undefined' ? 2 : depth));
}

// Returns true if object is a DOM element.
var isDOMElement = function (object) {
  if (typeof HTMLElement === 'object') {
    return object instanceof HTMLElement;
  } else {
    return object &&
      typeof object === 'object' &&
      object.nodeType === 1 &&
      typeof object.nodeName === 'string';
  }
};

function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (value && typeof value.inspect === 'function' &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes);
    if (typeof ret !== 'string') {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // If this is a DOM element, try to get the outer HTML.
  if (isDOMElement(value)) {
    if ('outerHTML' in value) {
      return value.outerHTML;
      // This value does not have an outerHTML attribute,
      //   it could still be an XML element
    } else {
      // Attempt to serialize it
      try {
        if (document.xmlVersion) {
          var xmlSerializer = new XMLSerializer();
          return xmlSerializer.serializeToString(value);
        } else {
          // Firefox 11- do not support outerHTML
          //   It does, however, support innerHTML
          //   Use the following to render the element
          var ns = "http://www.w3.org/1999/xhtml";
          var container = document.createElementNS(ns, '_');

          container.appendChild(value.cloneNode(false));
          html = container.innerHTML
            .replace('><', '>' + value.innerHTML + '<');
          container.innerHTML = '';
          return html;
        }
      } catch (err) {
        // This could be a non-native DOM implementation,
        //   continue with the normal flow:
        //   printing the element as if it is an object.
      }
    }
  }

  // Look up the keys of the object.
  var visibleKeys = getEnumerableProperties(value);
  var keys = ctx.showHidden ? getProperties(value) : visibleKeys;

  // Some type of object without properties can be shortcutted.
  // In IE, errors have a single `stack` property, or if they are vanilla `Error`,
  // a `stack` plus `description` property; ignore those for consistency.
  if (keys.length === 0 || (isError(value) && (
      (keys.length === 1 && keys[0] === 'stack') ||
      (keys.length === 2 && keys[0] === 'description' && keys[1] === 'stack')
     ))) {
    if (typeof value === 'function') {
      var name = getName(value);
      var nameSuffix = name ? ': ' + name : '';
      return ctx.stylize('[Function' + nameSuffix + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toUTCString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (typeof value === 'function') {
    var name = getName(value);
    var nameSuffix = name ? ': ' + name : '';
    base = ' [Function' + nameSuffix + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    return formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  switch (typeof value) {
    case 'undefined':
      return ctx.stylize('undefined', 'undefined');

    case 'string':
      var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                               .replace(/'/g, "\\'")
                                               .replace(/\\"/g, '"') + '\'';
      return ctx.stylize(simple, 'string');

    case 'number':
      if (value === 0 && (1/value) === -Infinity) {
        return ctx.stylize('-0', 'number');
      }
      return ctx.stylize('' + value, 'number');

    case 'boolean':
      return ctx.stylize('' + value, 'boolean');
  }
  // For some reason typeof null is "object", so special case here.
  if (value === null) {
    return ctx.stylize('null', 'null');
  }
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (Object.prototype.hasOwnProperty.call(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str;
  if (value.__lookupGetter__) {
    if (value.__lookupGetter__(key)) {
      if (value.__lookupSetter__(key)) {
        str = ctx.stylize('[Getter/Setter]', 'special');
      } else {
        str = ctx.stylize('[Getter]', 'special');
      }
    } else {
      if (value.__lookupSetter__(key)) {
        str = ctx.stylize('[Setter]', 'special');
      }
    }
  }
  if (visibleKeys.indexOf(key) < 0) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(value[key]) < 0) {
      if (recurseTimes === null) {
        str = formatValue(ctx, value[key], null);
      } else {
        str = formatValue(ctx, value[key], recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (typeof name === 'undefined') {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}

function isArray(ar) {
  return Array.isArray(ar) ||
         (typeof ar === 'object' && objectToString(ar) === '[object Array]');
}

function isRegExp(re) {
  return typeof re === 'object' && objectToString(re) === '[object RegExp]';
}

function isDate(d) {
  return typeof d === 'object' && objectToString(d) === '[object Date]';
}

function isError(e) {
  return typeof e === 'object' && objectToString(e) === '[object Error]';
}

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

},{"./getEnumerableProperties":20,"./getName":22,"./getProperties":25}],29:[function(require,module,exports){
/*!
 * Chai - flag utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var inspect = require('./inspect');
var config = require('../config');

/**
 * ### .objDisplay (object)
 *
 * Determines if an object or an array matches
 * criteria to be inspected in-line for error
 * messages or should be truncated.
 *
 * @param {Mixed} javascript object to inspect
 * @name objDisplay
 * @namespace Utils
 * @api public
 */

module.exports = function (obj) {
  var str = inspect(obj)
    , type = Object.prototype.toString.call(obj);

  if (config.truncateThreshold && str.length >= config.truncateThreshold) {
    if (type === '[object Function]') {
      return !obj.name || obj.name === ''
        ? '[Function]'
        : '[Function: ' + obj.name + ']';
    } else if (type === '[object Array]') {
      return '[ Array(' + obj.length + ') ]';
    } else if (type === '[object Object]') {
      var keys = Object.keys(obj)
        , kstr = keys.length > 2
          ? keys.splice(0, 2).join(', ') + ', ...'
          : keys.join(', ');
      return '{ Object (' + kstr + ') }';
    } else {
      return str;
    }
  } else {
    return str;
  }
};

},{"../config":9,"./inspect":28}],30:[function(require,module,exports){
/*!
 * Chai - overwriteChainableMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### overwriteChainableMethod (ctx, name, method, chainingBehavior)
 *
 * Overwites an already existing chainable method
 * and provides access to the previous function or
 * property.  Must return functions to be used for
 * name.
 *
 *     utils.overwriteChainableMethod(chai.Assertion.prototype, 'length',
 *       function (_super) {
 *       }
 *     , function (_super) {
 *       }
 *     );
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteChainableMethod('foo', fn, fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.have.length(3);
 *     expect(myFoo).to.have.length.above(3);
 *
 * @param {Object} ctx object whose method / property is to be overwritten
 * @param {String} name of method / property to overwrite
 * @param {Function} method function that returns a function to be used for name
 * @param {Function} chainingBehavior function that returns a function to be used for property
 * @namespace Utils
 * @name overwriteChainableMethod
 * @api public
 */

module.exports = function (ctx, name, method, chainingBehavior) {
  var chainableBehavior = ctx.__methods[name];

  var _chainingBehavior = chainableBehavior.chainingBehavior;
  chainableBehavior.chainingBehavior = function () {
    var result = chainingBehavior(_chainingBehavior).call(this);
    return result === undefined ? this : result;
  };

  var _method = chainableBehavior.method;
  chainableBehavior.method = function () {
    var result = method(_method).apply(this, arguments);
    return result === undefined ? this : result;
  };
};

},{}],31:[function(require,module,exports){
/*!
 * Chai - overwriteMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### overwriteMethod (ctx, name, fn)
 *
 * Overwites an already existing method and provides
 * access to previous function. Must return function
 * to be used for name.
 *
 *     utils.overwriteMethod(chai.Assertion.prototype, 'equal', function (_super) {
 *       return function (str) {
 *         var obj = utils.flag(this, 'object');
 *         if (obj instanceof Foo) {
 *           new chai.Assertion(obj.value).to.equal(str);
 *         } else {
 *           _super.apply(this, arguments);
 *         }
 *       }
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteMethod('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.equal('bar');
 *
 * @param {Object} ctx object whose method is to be overwritten
 * @param {String} name of method to overwrite
 * @param {Function} method function that returns a function to be used for name
 * @namespace Utils
 * @name overwriteMethod
 * @api public
 */

module.exports = function (ctx, name, method) {
  var _method = ctx[name]
    , _super = function () { return this; };

  if (_method && 'function' === typeof _method)
    _super = _method;

  ctx[name] = function () {
    var result = method(_super).apply(this, arguments);
    return result === undefined ? this : result;
  }
};

},{}],32:[function(require,module,exports){
/*!
 * Chai - overwriteProperty utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### overwriteProperty (ctx, name, fn)
 *
 * Overwites an already existing property getter and provides
 * access to previous value. Must return function to use as getter.
 *
 *     utils.overwriteProperty(chai.Assertion.prototype, 'ok', function (_super) {
 *       return function () {
 *         var obj = utils.flag(this, 'object');
 *         if (obj instanceof Foo) {
 *           new chai.Assertion(obj.name).to.equal('bar');
 *         } else {
 *           _super.call(this);
 *         }
 *       }
 *     });
 *
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteProperty('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.be.ok;
 *
 * @param {Object} ctx object whose property is to be overwritten
 * @param {String} name of property to overwrite
 * @param {Function} getter function that returns a getter function to be used for name
 * @namespace Utils
 * @name overwriteProperty
 * @api public
 */

module.exports = function (ctx, name, getter) {
  var _get = Object.getOwnPropertyDescriptor(ctx, name)
    , _super = function () {};

  if (_get && 'function' === typeof _get.get)
    _super = _get.get

  Object.defineProperty(ctx, name,
    { get: function () {
        var result = getter(_super).call(this);
        return result === undefined ? this : result;
      }
    , configurable: true
  });
};

},{}],33:[function(require,module,exports){
/*!
 * Chai - test utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var flag = require('./flag');

/**
 * # test(object, expression)
 *
 * Test and object for expression.
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @namespace Utils
 * @name test
 */

module.exports = function (obj, args) {
  var negate = flag(obj, 'negate')
    , expr = args[0];
  return negate ? !expr : expr;
};

},{"./flag":18}],34:[function(require,module,exports){
/*!
 * Chai - transferFlags utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### transferFlags(assertion, object, includeAll = true)
 *
 * Transfer all the flags for `assertion` to `object`. If
 * `includeAll` is set to `false`, then the base Chai
 * assertion flags (namely `object`, `ssfi`, and `message`)
 * will not be transferred.
 *
 *
 *     var newAssertion = new Assertion();
 *     utils.transferFlags(assertion, newAssertion);
 *
 *     var anotherAsseriton = new Assertion(myObj);
 *     utils.transferFlags(assertion, anotherAssertion, false);
 *
 * @param {Assertion} assertion the assertion to transfer the flags from
 * @param {Object} object the object to transfer the flags to; usually a new assertion
 * @param {Boolean} includeAll
 * @namespace Utils
 * @name transferFlags
 * @api private
 */

module.exports = function (assertion, object, includeAll) {
  var flags = assertion.__flags || (assertion.__flags = Object.create(null));

  if (!object.__flags) {
    object.__flags = Object.create(null);
  }

  includeAll = arguments.length === 3 ? includeAll : true;

  for (var flag in flags) {
    if (includeAll ||
        (flag !== 'object' && flag !== 'ssfi' && flag != 'message')) {
      object.__flags[flag] = flags[flag];
    }
  }
};

},{}],35:[function(require,module,exports){
module.exports = require('./lib/eql');

},{"./lib/eql":36}],36:[function(require,module,exports){
/*!
 * deep-eql
 * Copyright(c) 2013 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var type = require('type-detect');

/*!
 * Buffer.isBuffer browser shim
 */

var Buffer;
try { Buffer = require('buffer').Buffer; }
catch(ex) {
  Buffer = {};
  Buffer.isBuffer = function() { return false; }
}

/*!
 * Primary Export
 */

module.exports = deepEqual;

/**
 * Assert super-strict (egal) equality between
 * two objects of any type.
 *
 * @param {Mixed} a
 * @param {Mixed} b
 * @param {Array} memoised (optional)
 * @return {Boolean} equal match
 */

function deepEqual(a, b, m) {
  if (sameValue(a, b)) {
    return true;
  } else if ('date' === type(a)) {
    return dateEqual(a, b);
  } else if ('regexp' === type(a)) {
    return regexpEqual(a, b);
  } else if (Buffer.isBuffer(a)) {
    return bufferEqual(a, b);
  } else if ('arguments' === type(a)) {
    return argumentsEqual(a, b, m);
  } else if (!typeEqual(a, b)) {
    return false;
  } else if (('object' !== type(a) && 'object' !== type(b))
  && ('array' !== type(a) && 'array' !== type(b))) {
    return sameValue(a, b);
  } else {
    return objectEqual(a, b, m);
  }
}

/*!
 * Strict (egal) equality test. Ensures that NaN always
 * equals NaN and `-0` does not equal `+0`.
 *
 * @param {Mixed} a
 * @param {Mixed} b
 * @return {Boolean} equal match
 */

function sameValue(a, b) {
  if (a === b) return a !== 0 || 1 / a === 1 / b;
  return a !== a && b !== b;
}

/*!
 * Compare the types of two given objects and
 * return if they are equal. Note that an Array
 * has a type of `array` (not `object`) and arguments
 * have a type of `arguments` (not `array`/`object`).
 *
 * @param {Mixed} a
 * @param {Mixed} b
 * @return {Boolean} result
 */

function typeEqual(a, b) {
  return type(a) === type(b);
}

/*!
 * Compare two Date objects by asserting that
 * the time values are equal using `saveValue`.
 *
 * @param {Date} a
 * @param {Date} b
 * @return {Boolean} result
 */

function dateEqual(a, b) {
  if ('date' !== type(b)) return false;
  return sameValue(a.getTime(), b.getTime());
}

/*!
 * Compare two regular expressions by converting them
 * to string and checking for `sameValue`.
 *
 * @param {RegExp} a
 * @param {RegExp} b
 * @return {Boolean} result
 */

function regexpEqual(a, b) {
  if ('regexp' !== type(b)) return false;
  return sameValue(a.toString(), b.toString());
}

/*!
 * Assert deep equality of two `arguments` objects.
 * Unfortunately, these must be sliced to arrays
 * prior to test to ensure no bad behavior.
 *
 * @param {Arguments} a
 * @param {Arguments} b
 * @param {Array} memoize (optional)
 * @return {Boolean} result
 */

function argumentsEqual(a, b, m) {
  if ('arguments' !== type(b)) return false;
  a = [].slice.call(a);
  b = [].slice.call(b);
  return deepEqual(a, b, m);
}

/*!
 * Get enumerable properties of a given object.
 *
 * @param {Object} a
 * @return {Array} property names
 */

function enumerable(a) {
  var res = [];
  for (var key in a) res.push(key);
  return res;
}

/*!
 * Simple equality for flat iterable objects
 * such as Arrays or Node.js buffers.
 *
 * @param {Iterable} a
 * @param {Iterable} b
 * @return {Boolean} result
 */

function iterableEqual(a, b) {
  if (a.length !==  b.length) return false;

  var i = 0;
  var match = true;

  for (; i < a.length; i++) {
    if (a[i] !== b[i]) {
      match = false;
      break;
    }
  }

  return match;
}

/*!
 * Extension to `iterableEqual` specifically
 * for Node.js Buffers.
 *
 * @param {Buffer} a
 * @param {Mixed} b
 * @return {Boolean} result
 */

function bufferEqual(a, b) {
  if (!Buffer.isBuffer(b)) return false;
  return iterableEqual(a, b);
}

/*!
 * Block for `objectEqual` ensuring non-existing
 * values don't get in.
 *
 * @param {Mixed} object
 * @return {Boolean} result
 */

function isValue(a) {
  return a !== null && a !== undefined;
}

/*!
 * Recursively check the equality of two objects.
 * Once basic sameness has been established it will
 * defer to `deepEqual` for each enumerable key
 * in the object.
 *
 * @param {Mixed} a
 * @param {Mixed} b
 * @return {Boolean} result
 */

function objectEqual(a, b, m) {
  if (!isValue(a) || !isValue(b)) {
    return false;
  }

  if (a.prototype !== b.prototype) {
    return false;
  }

  var i;
  if (m) {
    for (i = 0; i < m.length; i++) {
      if ((m[i][0] === a && m[i][1] === b)
      ||  (m[i][0] === b && m[i][1] === a)) {
        return true;
      }
    }
  } else {
    m = [];
  }

  try {
    var ka = enumerable(a);
    var kb = enumerable(b);
  } catch (ex) {
    return false;
  }

  ka.sort();
  kb.sort();

  if (!iterableEqual(ka, kb)) {
    return false;
  }

  m.push([ a, b ]);

  var key;
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key], m)) {
      return false;
    }
  }

  return true;
}

},{"buffer":2,"type-detect":37}],37:[function(require,module,exports){
module.exports = require('./lib/type');

},{"./lib/type":38}],38:[function(require,module,exports){
/*!
 * type-detect
 * Copyright(c) 2013 jake luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Primary Exports
 */

var exports = module.exports = getType;

/*!
 * Detectable javascript natives
 */

var natives = {
    '[object Array]': 'array'
  , '[object RegExp]': 'regexp'
  , '[object Function]': 'function'
  , '[object Arguments]': 'arguments'
  , '[object Date]': 'date'
};

/**
 * ### typeOf (obj)
 *
 * Use several different techniques to determine
 * the type of object being tested.
 *
 *
 * @param {Mixed} object
 * @return {String} object type
 * @api public
 */

function getType (obj) {
  var str = Object.prototype.toString.call(obj);
  if (natives[str]) return natives[str];
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (obj === Object(obj)) return 'object';
  return typeof obj;
}

exports.Library = Library;

/**
 * ### Library
 *
 * Create a repository for custom type detection.
 *
 * ```js
 * var lib = new type.Library;
 * ```
 *
 */

function Library () {
  this.tests = {};
}

/**
 * #### .of (obj)
 *
 * Expose replacement `typeof` detection to the library.
 *
 * ```js
 * if ('string' === lib.of('hello world')) {
 *   // ...
 * }
 * ```
 *
 * @param {Mixed} object to test
 * @return {String} type
 */

Library.prototype.of = getType;

/**
 * #### .define (type, test)
 *
 * Add a test to for the `.test()` assertion.
 *
 * Can be defined as a regular expression:
 *
 * ```js
 * lib.define('int', /^[0-9]+$/);
 * ```
 *
 * ... or as a function:
 *
 * ```js
 * lib.define('bln', function (obj) {
 *   if ('boolean' === lib.of(obj)) return true;
 *   var blns = [ 'yes', 'no', 'true', 'false', 1, 0 ];
 *   if ('string' === lib.of(obj)) obj = obj.toLowerCase();
 *   return !! ~blns.indexOf(obj);
 * });
 * ```
 *
 * @param {String} type
 * @param {RegExp|Function} test
 * @api public
 */

Library.prototype.define = function (type, test) {
  if (arguments.length === 1) return this.tests[type];
  this.tests[type] = test;
  return this;
};

/**
 * #### .test (obj, test)
 *
 * Assert that an object is of type. Will first
 * check natives, and if that does not pass it will
 * use the user defined custom tests.
 *
 * ```js
 * assert(lib.test('1', 'int'));
 * assert(lib.test('yes', 'bln'));
 * ```
 *
 * @param {Mixed} object
 * @param {String} type
 * @return {Boolean} result
 * @api public
 */

Library.prototype.test = function (obj, type) {
  if (type === getType(obj)) return true;
  var test = this.tests[type];

  if (test && 'regexp' === getType(test)) {
    return test.test(obj);
  } else if (test && 'function' === getType(test)) {
    return test(obj);
  } else {
    throw new ReferenceError('Type test "' + type + '" not defined or invalid.');
  }
};

},{}],39:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"./lib/type":40,"dup":37}],40:[function(require,module,exports){
/*!
 * type-detect
 * Copyright(c) 2013 jake luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Primary Exports
 */

var exports = module.exports = getType;

/**
 * ### typeOf (obj)
 *
 * Use several different techniques to determine
 * the type of object being tested.
 *
 *
 * @param {Mixed} object
 * @return {String} object type
 * @api public
 */
var objectTypeRegexp = /^\[object (.*)\]$/;

function getType(obj) {
  var type = Object.prototype.toString.call(obj).match(objectTypeRegexp)[1].toLowerCase();
  // Let "new String('')" return 'object'
  if (typeof Promise === 'function' && obj instanceof Promise) return 'promise';
  // PhantomJS has type "DOMWindow" for null
  if (obj === null) return 'null';
  // PhantomJS has type "DOMWindow" for undefined
  if (obj === undefined) return 'undefined';
  return type;
}

exports.Library = Library;

/**
 * ### Library
 *
 * Create a repository for custom type detection.
 *
 * ```js
 * var lib = new type.Library;
 * ```
 *
 */

function Library() {
  if (!(this instanceof Library)) return new Library();
  this.tests = {};
}

/**
 * #### .of (obj)
 *
 * Expose replacement `typeof` detection to the library.
 *
 * ```js
 * if ('string' === lib.of('hello world')) {
 *   // ...
 * }
 * ```
 *
 * @param {Mixed} object to test
 * @return {String} type
 */

Library.prototype.of = getType;

/**
 * #### .define (type, test)
 *
 * Add a test to for the `.test()` assertion.
 *
 * Can be defined as a regular expression:
 *
 * ```js
 * lib.define('int', /^[0-9]+$/);
 * ```
 *
 * ... or as a function:
 *
 * ```js
 * lib.define('bln', function (obj) {
 *   if ('boolean' === lib.of(obj)) return true;
 *   var blns = [ 'yes', 'no', 'true', 'false', 1, 0 ];
 *   if ('string' === lib.of(obj)) obj = obj.toLowerCase();
 *   return !! ~blns.indexOf(obj);
 * });
 * ```
 *
 * @param {String} type
 * @param {RegExp|Function} test
 * @api public
 */

Library.prototype.define = function(type, test) {
  if (arguments.length === 1) return this.tests[type];
  this.tests[type] = test;
  return this;
};

/**
 * #### .test (obj, test)
 *
 * Assert that an object is of type. Will first
 * check natives, and if that does not pass it will
 * use the user defined custom tests.
 *
 * ```js
 * assert(lib.test('1', 'int'));
 * assert(lib.test('yes', 'bln'));
 * ```
 *
 * @param {Mixed} object
 * @param {String} type
 * @return {Boolean} result
 * @api public
 */

Library.prototype.test = function(obj, type) {
  if (type === getType(obj)) return true;
  var test = this.tests[type];

  if (test && 'regexp' === getType(test)) {
    return test.test(obj);
  } else if (test && 'function' === getType(test)) {
    return test(obj);
  } else {
    throw new ReferenceError('Type test "' + type + '" not defined or invalid.');
  }
};

},{}],41:[function(require,module,exports){
/**
 * Created by koqiui on 2017-04-09.
 */
var expect = require('chai').expect;
//

var Utils = require('../dist/utils');

console.log(JSON.stringify(Utils));

var StringBuilder = Utils.StringBuilder;

describe('utils>[class] StringBuilder', function () {
        it('moduleName', function () {
            expect(Utils.moduleName).to.equal('Utils');
        });

        it('ctor', function () {
            var sb = new StringBuilder();
            expect(sb.value).to.equal('');
        });

        it('ctor + args', function () {
            var sb = new StringBuilder('x', ' ', 'y');
            expect(sb.value).to.equal('x y');
        });

        it('append', function () {
            var sb = new StringBuilder();
            sb.append('x');
            sb.append(' ');
            sb.append('y');
            expect(sb.value).to.equal('x y');
        });

        it('prepend', function () {
            var sb = new StringBuilder();
            sb.prepend('x');
            sb.prepend(' ');
            sb.prepend('y');
            expect(sb.value).to.equal('y x');
        });

        it('clear', function () {
            var sb = new StringBuilder('x', ' ', 'y');
            expect(sb.value).to.equal('x y');
            sb.clear();
            expect(sb.value).to.equal('');
        });
    }
);

describe('String.[method] builder', function () {
        it('ctor', function () {
            var sb = String.builder();
            console.log(sb);
            expect(sb.value).to.equal('');
        });

        it('ctor + args', function () {
            var sb = String.builder('x', ' ', 'y');
            expect(sb.value).to.equal('x y');
        });

        it('append', function () {
            var sb = String.builder();
            sb.append('x');
            sb.append(' ');
            sb.append('y');
            expect(sb.value).to.equal('x y');
        });

        it('prepend', function () {
            var sb = String.builder();
            sb.prepend('x');
            sb.prepend(' ');
            sb.prepend('y');
            expect(sb.value).to.equal('y x');
        });

        it('clear', function () {
            var sb = String.builder('x', ' ', 'y');
            expect(sb.value).to.equal('x y');
            sb.clear();
            expect(sb.value).to.equal('');
        });
    }
);









},{"../dist/utils":4,"chai":6}]},{},[41]);
