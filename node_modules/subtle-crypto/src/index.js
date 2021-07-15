const isNode = typeof window === 'undefined'

if (isNode) {
  module.exports = {}
} else {
  module.exports = window.SubtleCrypto
}
