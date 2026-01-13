/**
 * Type declaration for jszip module
 * This is a minimal declaration for the functionality used in the codebase
 */
declare module 'jszip' {
  interface JSZipGeneratorOptions {
    type: 'nodebuffer' | 'blob' | 'arraybuffer' | 'uint8array' | 'base64' | 'string';
  }

  class JSZip {
    file(name: string, data: string | ArrayBuffer | Uint8Array | Buffer): this;
    generateAsync(options: JSZipGeneratorOptions): Promise<Buffer>;
  }

  export default JSZip;
}
