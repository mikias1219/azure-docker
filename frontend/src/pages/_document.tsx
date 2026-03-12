import Document, { Head, Html, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    // Polyfill randomUUID as early as possible (before any third-party scripts run).
    const randomUUIDPolyfill = `
(function () {
  try {
    var c = globalThis.crypto;
    if (!c) return;
    if (typeof c.randomUUID === 'function') return;
    c.randomUUID = function () {
      var bytes = new Uint8Array(16);
      if (typeof c.getRandomValues === 'function') c.getRandomValues(bytes);
      else for (var i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      var hex = Array.prototype.map.call(bytes, function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join('');
      return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
    };
  } catch (e) {}
})();`.trim();

    return (
      <Html lang="en">
        <Head>
          <script dangerouslySetInnerHTML={{ __html: randomUUIDPolyfill }} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

