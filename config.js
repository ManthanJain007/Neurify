// config.js
const PRODUCTION_CONFIG = {
  GEMINI_API_KEY: 'AIzaSyB6xR1anuTx-HTPv-EoFBjPPTyVdtf3sYQ'
};

if (typeof window !== 'undefined') {
  window.PRODUCTION_CONFIG = PRODUCTION_CONFIG;
}