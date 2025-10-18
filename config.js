// config.js - Production Configuration
// This file contains the production-ready settings for AI Writing Assistant Pro
// Users don't need to configure anything - it works out of the box!

const PRODUCTION_CONFIG = {
  // Production API Key - Pre-configured for immediate use
  GEMINI_API_KEY: 'AIzaSyB6xR1anuTx-HTPv-EoFBjPPTyVdtf3sYQ',
  
  // API Configuration
  GEMINI_API_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta',
  GEMINI_MODEL: 'gemini-1.5-flash-latest',
  
  // Rate Limiting
  MAX_REQUESTS_PER_MINUTE: 60,
  REQUEST_TIMEOUT_MS: 30000,
  
  // Feature Flags
  FEATURES: {
    AUTO_WRITE: true,
    CHATBOT: true,
    REAL_TIME_ANALYSIS: true,
    SMART_SUGGESTIONS: true,
    TONE_ADJUSTMENT: true,
    STYLE_ENHANCEMENT: true,
    TEXT_HUMANIZATION: true,
    CONTENT_OPTIMIZATION: true,
    ANALYTICS: true
  },
  
  // Default Settings
  DEFAULT_SETTINGS: {
    enabled: true,
    mode: 'auto',
    tonePreference: 'professional',
    intensity: 'moderate',
    language: 'en-US',
    features: {
      realTimeAnalysis: true,
      autoWrite: true,
      smartSuggestions: true,
      chatbot: true,
      visualFeedback: true,
      floatingToolbar: true,
      contentOptimization: true,
      personalization: true
    }
  },
  
  // Version Information
  VERSION: '3.0.0',
  BUILD_DATE: '2024-10-18',
  
  // Support Information
  SUPPORT: {
    EMAIL: 'support@aiwritingassistant.com',
    DOCS_URL: 'https://docs.aiwritingassistant.com',
    GITHUB_URL: 'https://github.com/ai-writing-assistant/extension'
  }
};

// Make configuration available globally (works in windows, workers, and Node)
if (typeof globalThis !== 'undefined') {
  globalThis.PRODUCTION_CONFIG = PRODUCTION_CONFIG;
}
if (typeof window !== 'undefined') {
  window.PRODUCTION_CONFIG = PRODUCTION_CONFIG;
}

// Node.js/module export for background scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PRODUCTION_CONFIG;
}

// Initialize API service automatically
if (typeof window !== 'undefined' && window.GeminiAPIService) {
  // Auto-initialize the API service when this config loads
  window.addEventListener('load', () => {
    if (!window.aiWritingAssistantService) {
      window.aiWritingAssistantService = new window.GeminiAPIService();
      console.log('AI Writing Assistant Pro: Service initialized with production config');
    }
  });
}
