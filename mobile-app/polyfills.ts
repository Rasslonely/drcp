import 'react-native-get-random-values';
import '@ethersproject/shims';
import { Buffer } from 'buffer';
import 'fast-text-encoding';

// Polyfill Buffer for environments where it's missing (Native & Web safety)
if (typeof globalThis !== 'undefined') {
  globalThis.Buffer = Buffer;
} else if (typeof global !== 'undefined') {
  global.Buffer = Buffer;
} else if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}
