<p align="center">
  <h3 align="center">
    subtle-crypto
  </h3>
</p>
<p align="center">
  Using Web Crypto's <em>SubtleCrypto</em> APIs<br/>
  in the browser and Node.js 
</p>
<br/>

<p align="center">
  <a href="https://www.npmjs.com/package/subtle-crypto"><strong>Installation</strong></a> ·
  <a href="https://github.com/usermirror/subtle-crypto/issues"><strong>Issues</strong></a> ·
  <a href="#usage"><strong>Usage</strong></a>
</p>

### Usage

```js
const SubtleCrypto = require('subtle-crypto/common')

// If running in the browser
SubtleCrypto === window.SubtleCrypto

// If running in node
SubtleCrypto = {
  encrypt,
  decrypt,
  sign,
  verify,
  digest,
  generateKey,
  deriveKey,
  deriveBits,
  importKey,
  exportKey,
  wrapKey,
  unwrapKey
}
```
