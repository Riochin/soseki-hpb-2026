declare module 'particles.js';

interface Window {
  particlesJS?: (tagId: string, params: unknown) => void;
  pJSDom?: Array<{
    pJS: {
      fn: {
        vendors: {
          destroypJS: () => void;
        };
      };
    };
  }>;
}
