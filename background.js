// AI Writing Assistant Pro - Background Service Worker
// Comprehensive implementation of 50+ features from the feature specification

import('./gemini-service.js').then(module => {
  window.GeminiAPIService = module.default || module.GeminiAPIService;
});

class AIWritingAssistantBackground {
  constructor() {
    this.geminiService = null;
    this.initialized = false;
    this.sessionData = {
      corrections: 0,
      suggestions: 0,
      timesSaved: 0,
      wordsAnalyzed: 0
    };
    this.userSettings = null;
    this.analytics = {
      dailyStats: {},
      writingPatterns: {},
      improvementHistory: []
    };
    
    this.initializeExtension();
  }

  async initializeExtension() {
    try {
      // Load user settings
      const settings = await chrome.storage.sync.get([
        'apiKey', 'enabled', 'mode', 'features', 'tonePreference',
        'intensity', 'language', 'personalDictionary', 'siteSettings'
      ]);
      
      this.userSettings = {
        enabled: settings.enabled !== false,
        mode: settings.mode || 'auto',
        apiKey: settings.apiKey || '',
        features: settings.features || this.getDefaultFeatures(),
        tonePreference: settings.tonePreference || 'professional',
        intensity: settings.intensity || 'moderate',
        language: settings.language || 'en-US',
        personalDictionary: settings.personalDictionary || [],
        siteSettings: settings.siteSettings || {}
      };

      // Initialize Gemini service if API key is available
      if (this.userSettings.apiKey) {
        await this.initializeGeminiService();
      }

      // Set up context menus
      this.setupContextMenus();
      
      // Set up command listeners
      this.setupCommandListeners();
      
      // Set up message listeners
      this.setupMessageListeners();
      
      // Initialize analytics
      this.initializeAnalytics();
      
      this.initialized = true;
      console.log('AI Writing Assistant Pro initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize AI Writing Assistant Pro:', error);
      this.handleInitializationError(error);
    }
  }

  async initializeGeminiService() {
    try {
      this.geminiService = new GeminiAPIService();
      await this.geminiService.initialize(this.userSettings.apiKey);
      console.log('Gemini API service initialized');
    } catch (error) {
      console.error('Failed to initialize Gemini service:', error);
      this.geminiService = null;
    }
  }

  handleInitializationError(error) {
    // Send error notification to popup if it's open
    chrome.runtime.sendMessage({
      type: 'initialization_error',
      error: error.message
    }).catch(() => {
      // Popup might not be open, ignore
    });

    // Set up basic functionality even if initialization fails
    this.setupMessageListeners();
  }

  getDefaultFeatures() {
    return {
      // Core Writing Features (1-4)
      grammarCheck: true,
      spellingMechanics: true,
      styleEnhancement: true,
      textHumanization: true,
      
      // Tone & Persona Adaptation (5-6)
      toneDetection: true,
      toneAdjustment: true,
      personaBasedWriting: true,
      
      // Advanced Features (7-9)
      realTimeAnalysis: true,
      smartSuggestions: true,
      contentOptimization: true,
      
      // UI Features (10-12)
      floatingToolbar: true,
      visualFeedback: true,
      contextualSuggestions: true,
      
      // Customization & Settings (13-15)
      personalization: true,
      siteSpecificRules: true,
      crossPlatformSync: true,
      
      // Technical Features (16-18)
      performanceOptimization: true,
      accessibility: true,
      privacyProtection: true,
      
      // Productivity Tools (19-20)
      quickActions: true,
      analyticsReporting: true,
      
      // Platform Support (21-22)
      websiteCompatibility: true,
      browserIntegration: true,
      
      // Workflow Integration (25-26)
      seamlessExperience: true,
      learningImprovement: true
    };
  }

  setupContextMenus() {
    chrome.contextMenus.removeAll(() => {
      // Main menu
      chrome.contextMenus.create({
        id: 'aiWritingAssistant',
        title: 'AI Writing Assistant Pro',
        contexts: ['selection', 'editable']
      });

      // Grammar & Spelling submenu
      chrome.contextMenus.create({
        id: 'grammarCheck',
        parentId: 'aiWritingAssistant',
        title: '📝 Check Grammar & Spelling',
        contexts: ['selection', 'editable']
      });

      // Style Enhancement submenu
      chrome.contextMenus.create({
        id: 'enhanceStyle',
        parentId: 'aiWritingAssistant',
        title: '✨ Enhance Style',
        contexts: ['selection', 'editable']
      });

      // Text Humanization submenu
      chrome.contextMenus.create({
        id: 'humanizeText',
        parentId: 'aiWritingAssistant',
        title: '🤖➡️👤 Humanize AI Text',
        contexts: ['selection', 'editable']
      });

      // Tone Adjustment submenu
      chrome.contextMenus.create({
        id: 'toneMenu',
        parentId: 'aiWritingAssistant',
        title: '🎭 Adjust Tone',
        contexts: ['selection', 'editable']
      });

      const tones = ['Professional', 'Casual', 'Formal', 'Creative', 'Persuasive', 'Technical', 'Empathetic'];
      tones.forEach(tone => {
        chrome.contextMenus.create({
          id: `tone-${tone.toLowerCase()}`,
          parentId: 'toneMenu',
          title: tone,
          contexts: ['selection', 'editable']
        });
      });

      // Persona-based writing
      chrome.contextMenus.create({
        id: 'personaMenu',
        parentId: 'aiWritingAssistant',
        title: '👥 Apply Writing Persona',
        contexts: ['selection', 'editable']
      });

      const personas = ['Academic', 'Business', 'Creative', 'Technical', 'Marketing', 'Social Media'];
      personas.forEach(persona => {
        chrome.contextMenus.create({
          id: `persona-${persona.toLowerCase().replace(' ', '-')}`,
          parentId: 'personaMenu',
          title: persona,
          contexts: ['selection', 'editable']
        });
      });

      // Quick Actions
      chrome.contextMenus.create({
        id: 'separator1',
        parentId: 'aiWritingAssistant',
        type: 'separator',
        contexts: ['selection', 'editable']
      });

      chrome.contextMenus.create({
        id: 'quickFix',
        parentId: 'aiWritingAssistant',
        title: '⚡ Quick Fix All',
        contexts: ['selection', 'editable']
      });

      chrome.contextMenus.create({
        id: 'analyzeReadability',
        parentId: 'aiWritingAssistant',
        title: '📊 Analyze Readability',
        contexts: ['selection', 'editable']
      });

      chrome.contextMenus.create({
        id: 'optimizeContent',
        parentId: 'aiWritingAssistant',
        title: '🎯 Optimize Content',
        contexts: ['selection', 'editable']
      });

      // Settings
      chrome.contextMenus.create({
        id: 'separator2',
        parentId: 'aiWritingAssistant',
        type: 'separator',
        contexts: ['selection', 'editable']
      });

      chrome.contextMenus.create({
        id: 'openSettings',
        parentId: 'aiWritingAssistant',
        title: '⚙️ Settings',
        contexts: ['selection', 'editable']
      });
    });
  }

  setupCommandListeners() {
    chrome.commands.onCommand.addListener(async (command) => {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length === 0) return;

      const tabId = tabs[0].id;
      
      switch (command) {
        case 'toggle-assistant':
          await this.toggleAssistant(tabId);
          break;
        case 'quick-humanize':
          await this.processCommand(tabId, 'humanize');
          break;
        case 'grammar-check':
          await this.processCommand(tabId, 'grammar');
          break;
        case 'enhance-style':
          await this.processCommand(tabId, 'style');
          break;
        case 'adjust-tone':
          await this.processCommand(tabId, 'tone');
          break;
        case 'quick-fix':
          await this.processCommand(tabId, 'quickfix');
          break;
        case 'analyze-readability':
          await this.processCommand(tabId, 'readability');
          break;
      }
    });
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'getSettings':
          sendResponse({ success: true, settings: this.userSettings });
          break;
          
        case 'updateSettings':
          await this.updateSettings(request.settings);
          sendResponse({ success: true });
          break;
          
        case 'analyzeText':
          const analysisResult = await this.analyzeText(request.text, request.options);
          sendResponse({ success: true, result: analysisResult });
          break;
          
        case 'processText':
          const processResult = await this.processText(request.text, request.type, request.options);
          sendResponse({ success: true, result: processResult });
          break;
          
        case 'getSessionStats':
          sendResponse({ success: true, stats: this.sessionData });
          break;
          
        case 'getAnalytics':
          const analytics = await this.getAnalytics(request.timeframe);
          sendResponse({ success: true, analytics });
          break;
          
        case 'learnFromCorrection':
          await this.learnFromCorrection(request.data);
          sendResponse({ success: true });
          break;
          
        case 'checkApiStatus':
          const status = await this.checkApiStatus();
          sendResponse({ success: true, status });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async analyzeText(text, options = {}) {
    if (!this.geminiService || !text.trim()) {
      return { error: 'Service not available or empty text' };
    }

    const analysisType = options.type || 'comprehensive';
    const results = {};

    try {
      // Real-time analysis with color-coded suggestions
      if (this.userSettings.features.realTimeAnalysis) {
        results.realTimeAnalysis = await this.geminiService.realTimeAnalysis(text, {
          type: analysisType,
          language: this.userSettings.language
        });
      }

      // Grammar and spelling check
      if (this.userSettings.features.grammarCheck) {
        results.grammar = await this.geminiService.advancedGrammarCheck(text, {
          language: this.userSettings.language
        });
      }

      // Style enhancement suggestions
      if (this.userSettings.features.styleEnhancement) {
        results.style = await this.geminiService.styleEnhancement(text, {
          intensity: this.userSettings.intensity,
          audience: options.audience
        });
      }

      // Tone detection
      if (this.userSettings.features.toneDetection) {
        results.tone = await this.geminiService.detectTone(text);
      }

      // Update session statistics
      this.sessionData.wordsAnalyzed += text.split(' ').length;
      await this.saveSessionData();

      return results;
    } catch (error) {
      console.error('Text analysis error:', error);
      return { error: error.message };
    }
  }

  async processText(text, type, options = {}) {
    if (!this.geminiService || !text.trim()) {
      return { error: 'Service not available or empty text' };
    }

    try {
      let result;
      
      switch (type) {
        case 'grammar':
          result = await this.geminiService.advancedGrammarCheck(text, options);
          this.sessionData.corrections++;
          break;
          
        case 'spelling':
          result = await this.geminiService.spellingAndMechanics(text, options);
          this.sessionData.corrections++;
          break;
          
        case 'style':
          result = await this.geminiService.styleEnhancement(text, {
            ...options,
            intensity: this.userSettings.intensity
          });
          this.sessionData.suggestions++;
          break;
          
        case 'humanize':
          result = await this.geminiService.humanizeText(text, options);
          this.sessionData.suggestions++;
          break;
          
        case 'tone':
          const targetTone = options.tone || this.userSettings.tonePreference;
          result = await this.geminiService.adjustTone(text, targetTone, options);
          this.sessionData.suggestions++;
          break;
          
        case 'persona':
          result = await this.geminiService.applyPersona(text, options.persona, options.context);
          this.sessionData.suggestions++;
          break;
          
        case 'optimize':
          result = await this.geminiService.optimizeContent(text, options.optimizationType, options);
          this.sessionData.suggestions++;
          break;
          
        case 'quickfix':
          result = await this.geminiService.processQuickActions(text, 'fix-all-grammar', options);
          this.sessionData.corrections++;
          break;
          
        case 'readability':
          result = await this.geminiService.realTimeAnalysis(text, { type: 'readability' });
          break;
          
        default:
          throw new Error(`Unknown processing type: ${type}`);
      }

      // Record processing for analytics
      await this.recordProcessing(type, text.length);
      
      // Update session data
      this.sessionData.timesSaved += this.estimateTimeSaved(type, text.length);
      await this.saveSessionData();

      return result;
    } catch (error) {
      console.error('Text processing error:', error);
      return { error: error.message };
    }
  }

  async updateSettings(newSettings) {
    this.userSettings = { ...this.userSettings, ...newSettings };
    await chrome.storage.sync.set(this.userSettings);
    
    // Reinitialize Gemini service if API key changed
    if (newSettings.apiKey && newSettings.apiKey !== this.userSettings.apiKey) {
      await this.initializeGeminiService();
    }
  }

  async toggleAssistant(tabId) {
    this.userSettings.enabled = !this.userSettings.enabled;
    await chrome.storage.sync.set({ enabled: this.userSettings.enabled });
    
    // Notify content script
    try {
      await chrome.tabs.sendMessage(tabId, {
        action: 'toggleAssistant',
        enabled: this.userSettings.enabled
      });
    } catch (error) {
      console.log('Could not send toggle message to tab:', error.message);
    }

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'AI Writing Assistant Pro',
      message: `Writing assistance ${this.userSettings.enabled ? 'enabled' : 'disabled'}`
    });
  }

  async processCommand(tabId, command) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        action: 'processCommand',
        command: command,
        settings: this.userSettings
      });
    } catch (error) {
      console.log('Could not send command to tab:', error.message);
    }
  }

  async checkApiStatus() {
    if (!this.userSettings.apiKey) {
      return { status: 'no-key', message: 'No API key configured' };
    }
    
    if (!this.geminiService) {
      return { status: 'not-initialized', message: 'Service not initialized' };
    }
    
    try {
      await this.geminiService.testConnection();
      return { status: 'ready', message: 'API ready' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  async learnFromCorrection(data) {
    if (this.geminiService) {
      await this.geminiService.learnFromCorrections(
        data.original,
        data.corrected,
        data.userChoice,
        data.context
      );
    }
    
    // Update analytics
    this.recordLearning(data);
  }

  async initializeAnalytics() {
    try {
      const stored = await chrome.storage.local.get(['analytics', 'sessionData']);
      if (stored.analytics) {
        this.analytics = stored.analytics;
      }
      if (stored.sessionData) {
        this.sessionData = stored.sessionData;
      }
    } catch (error) {
      console.warn('Failed to load analytics data:', error);
      // Initialize with defaults
      this.analytics = {
        dailyStats: {},
        writingPatterns: {},
        improvementHistory: []
      };
    }
  }

  async recordProcessing(type, textLength) {
    const today = new Date().toISOString().split('T')[0];
    
    if (!this.analytics.dailyStats[today]) {
      this.analytics.dailyStats[today] = {
        corrections: 0,
        suggestions: 0,
        wordsProcessed: 0,
        timesSaved: 0,
        features: {}
      };
    }
    
    const todayStats = this.analytics.dailyStats[today];
    todayStats.wordsProcessed += Math.ceil(textLength / 5); // Approximate words
    
    if (!todayStats.features[type]) {
      todayStats.features[type] = 0;
    }
    todayStats.features[type]++;
    
    await chrome.storage.local.set({ analytics: this.analytics });
  }

  recordLearning(data) {
    this.analytics.improvementHistory.push({
      timestamp: Date.now(),
      type: data.type,
      accepted: data.userChoice === 'accept',
      context: data.context
    });
    
    // Keep only last 1000 entries
    if (this.analytics.improvementHistory.length > 1000) {
      this.analytics.improvementHistory.splice(0, 100);
    }
  }

  estimateTimeSaved(type, textLength) {
    // Rough estimates in seconds based on text length and operation type
    const baseTime = Math.max(1, Math.ceil(textLength / 100));
    const multipliers = {
      grammar: 3,
      spelling: 2,
      style: 4,
      humanize: 5,
      tone: 3,
      persona: 4,
      optimize: 6
    };
    
    return baseTime * (multipliers[type] || 2);
  }

  async saveSessionData() {
    await chrome.storage.local.set({ sessionData: this.sessionData });
  }

  async getAnalytics(timeframe = 'week') {
    if (this.geminiService) {
      const history = this.analytics.improvementHistory.slice(-100);
      return await this.geminiService.generateAnalytics(history, { timePeriod: timeframe });
    }
    
    return this.analytics;
  }
}

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const menuId = info.menuItemId;
  
  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: 'contextMenuClick',
      menuId: menuId,
      selectedText: info.selectionText
    });
  } catch (error) {
    console.log('Could not send context menu message:', error.message);
  }
});

// Initialize the background service
const aiWritingAssistant = new AIWritingAssistantBackground();

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  // This opens the popup, no action needed
});

// Handle installation and updates
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set default settings
    await chrome.storage.sync.set({
      enabled: true,
      mode: 'auto',
      features: aiWritingAssistant.getDefaultFeatures(),
      tonePreference: 'professional',
      intensity: 'moderate',
      language: 'en-US'
    });
    
    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'AI Writing Assistant Pro Installed!',
      message: 'Configure your Gemini API key in the extension options to get started.'
    });
    
    // Open options page
    chrome.runtime.openOptionsPage();
  }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIWritingAssistantBackground;
}

// AI Writing Assistant Pro - Enhanced Background Service Worker
// Implements all 50+ features with Gemini AI integration

importScripts('./gemini-service.js');

class AIWritingAssistantPro {
  constructor() {
    this.geminiService = new GeminiAPIService();
    this.isEnabled = true;
    this.userStats = {
      textsProcessed: 0,
      suggestionsMade: 0,
      correctionsAccepted: 0,
      timeSaved: 0,
      sessionsToday: 0,
      improvementScore: 0,
      vocabularyGrowth: 0,
      avgReadabilityScore: 0
    };
    
    this.settings = {
      // Core Features
      grammarCheck: true,
      humanization: true,
      styleEnhancement: true,
      toneAdjustment: true,
      contextualSuggestions: true,
      readabilityAnalysis: true,
      plagiarismDetection: false,
      
      // AI Configuration
      suggestionIntensity: 0.7,
      defaultTone: 'professional',
      autoToneDetection: true,
      analysisDelay: 300,
      
      // Interface
      showFloatingToolbar: true,
      showWordCount: true,
      showReadabilityScore: true,
      grammarColor: '#ef4444',
      styleColor: '#2563eb',
      toneColor: '#16a34a',
      showNotifications: true,
      soundEffects: false,
      
      // Advanced
      allowedSites: '',
      blockedSites: '',
      personalDictionary: '',
      localProcessingOnly: false,
      collectUsageStats: true,
      learningMode: true,
      
      // Workflow
      autoApplyCorrections: false,
      quickFixEnabled: true,
      bulkProcessing: true,
      crossPlatformSync: true,
      
      // Personalization
      writingProfile: 'balanced',
      customStyleGuide: {},
      favoriteCorrections: [],
      ignoredSuggestions: [],
      domainSpecificRules: {},
      
      // API Configuration
      geminiApiKey: '',
      fallbackToLocal: true
    };
    
    this.sessionData = {
      startTime: Date.now(),
      textAnalyzed: 0,
      correctionsApplied: 0,
      userInteractions: 0,
      platformsUsed: new Set(),
      writingContexts: new Map()
    };
    
    this.cache = new Map();
    this.learningData = [];
    this.analyticsData = [];
    
    this.initialize();
  }

  async initialize() {
    console.log('Initializing AI Writing Assistant Pro...');
    
    // Load settings and data from storage
    await this.loadSettings();
    await this.loadUserStats();
    await this.loadSessionData();
    await this.loadLearningData();
    
    // Initialize Gemini API service
    if (this.settings.geminiApiKey) {
      await this.initializeGeminiService();
    }
    
    // Set up comprehensive context menus
    this.setupEnhancedContextMenus();
    
    // Set up all event listeners
    this.setupEventListeners();
    
    // Start analytics collection if enabled
    if (this.settings.collectUsageStats) {
      this.startAnalyticsCollection();
    }
    
    // Set up cross-platform sync if enabled
    if (this.settings.crossPlatformSync) {
      this.setupCrossPlatformSync();
    }
    
    console.log('AI Writing Assistant Pro initialized successfully');
  }

  // INITIALIZATION METHODS
  
  async initializeGeminiService() {
    try {
      const success = await this.geminiService.initialize(this.settings.geminiApiKey);
      if (success) {
        console.log('Gemini API service initialized successfully');
      } else {
        console.warn('Gemini API service initialization failed');
      }
    } catch (error) {
      console.error('Failed to initialize Gemini service:', error);
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['settings', 'isEnabled']);
      this.settings = { ...this.settings, ...(result.settings || {}) };
      this.isEnabled = result.isEnabled !== false;
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }
  
  async loadUserStats() {
    try {
      const result = await chrome.storage.local.get(['userStats']);
      this.userStats = { ...this.userStats, ...(result.userStats || {}) };
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  }
  
  async loadSessionData() {
    try {
      const result = await chrome.storage.session.get(['sessionData']);
      if (result.sessionData) {
        this.sessionData = { ...this.sessionData, ...result.sessionData };
        this.sessionData.platformsUsed = new Set(this.sessionData.platformsUsed || []);
        this.sessionData.writingContexts = new Map(this.sessionData.writingContexts || []);
      }
    } catch (error) {
      console.error('Failed to load session data:', error);
    }
  }
  
  async loadLearningData() {
    try {
      const result = await chrome.storage.local.get(['learningData', 'analyticsData']);
      this.learningData = result.learningData || [];
      this.analyticsData = result.analyticsData || [];
    } catch (error) {
      console.error('Failed to load learning data:', error);
    }
  }

  // STORAGE MANAGEMENT

  async saveSettings() {
    try {
      await chrome.storage.sync.set({
        settings: this.settings,
        isEnabled: this.isEnabled
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  async saveUserStats() {
    try {
      await chrome.storage.local.set({ userStats: this.userStats });
    } catch (error) {
      console.error('Failed to save user stats:', error);
    }
  }

  async saveSessionData() {
    try {
      const sessionDataToSave = {
        ...this.sessionData,
        platformsUsed: Array.from(this.sessionData.platformsUsed),
        writingContexts: Array.from(this.sessionData.writingContexts)
      };
      await chrome.storage.session.set({ sessionData: sessionDataToSave });
    } catch (error) {
      console.error('Failed to save session data:', error);
    }
  }

  async initializeAI() {
    try {
      if ('ai' in navigator && navigator.ai.languageModel) {
        this.aiSession = await navigator.ai.languageModel.create({
          systemPrompt: `You are an expert writing assistant. Provide concise, actionable suggestions for grammar, style, and tone improvements. Always respond in JSON format with the following structure:
          {
            "suggestions": [
              {
                "type": "grammar|style|tone",
                "original": "original text",
                "suggestion": "improved text",
                "explanation": "brief explanation",
                "confidence": 0.95
              }
            ],
            "readabilityScore": 85,
            "wordCount": 120
          }`
        });
        console.log('AI session initialized successfully');
      } else {
        console.warn('Chrome AI API not available');
      }
    } catch (error) {
      console.error('Failed to initialize AI session:', error);
      this.aiSession = null;
    }
  }

  // ENHANCED CONTEXT MENUS (Feature 11)

  setupEnhancedContextMenus() {
    chrome.contextMenus.removeAll(() => {
      // Main menu
      chrome.contextMenus.create({
        id: 'ai-writing-assistant-pro-main',
        title: 'AI Writing Assistant Pro',
        contexts: ['selection', 'editable']
      });

      // Core Features (Features 1-4)
      chrome.contextMenus.create({
        id: 'advanced-grammar-check',
        parentId: 'ai-writing-assistant-pro-main',
        title: '📝 Advanced Grammar Check',
        contexts: ['selection', 'editable']
      });

      chrome.contextMenus.create({
        id: 'humanize-ai-text',
        parentId: 'ai-writing-assistant-pro-main',
        title: '🤖➡️👤 Humanize AI Text',
        contexts: ['selection', 'editable']
      });

      chrome.contextMenus.create({
        id: 'enhance-style',
        parentId: 'ai-writing-assistant-pro-main',
        title: '✨ Enhance Style',
        contexts: ['selection', 'editable']
      });

      chrome.contextMenus.create({
        id: 'separator1',
        parentId: 'ai-writing-assistant-pro-main',
        type: 'separator',
        contexts: ['selection', 'editable']
      });

      // Tone & Persona (Features 5-6)
      chrome.contextMenus.create({
        id: 'tone-adjustment',
        parentId: 'ai-writing-assistant-pro-main',
        title: '🎭 Tone Adjustment',
        contexts: ['selection', 'editable']
      });

      const tones = ['Professional', 'Casual', 'Formal', 'Creative', 'Persuasive', 'Technical', 'Empathetic'];
      tones.forEach(tone => {
        chrome.contextMenus.create({
          id: `adjust-tone-${tone.toLowerCase()}`,
          parentId: 'tone-adjustment',
          title: tone,
          contexts: ['selection', 'editable']
        });
      });

      chrome.contextMenus.create({
        id: 'persona-writing',
        parentId: 'ai-writing-assistant-pro-main',
        title: '👤 Persona-Based Writing',
        contexts: ['selection', 'editable']
      });

      const personas = ['Academic', 'Business', 'Creative', 'Technical', 'Marketing', 'Social Media'];
      personas.forEach(persona => {
        chrome.contextMenus.create({
          id: `apply-persona-${persona.toLowerCase().replace(' ', '-')}`,
          parentId: 'persona-writing',
          title: persona,
          contexts: ['selection', 'editable']
        });
      });

      chrome.contextMenus.create({
        id: 'separator2',
        parentId: 'ai-writing-assistant-pro-main',
        type: 'separator',
        contexts: ['selection', 'editable']
      });

      // Quick Actions (Feature 19)
      chrome.contextMenus.create({
        id: 'quick-actions',
        parentId: 'ai-writing-assistant-pro-main',
        title: '⚡ Quick Actions',
        contexts: ['selection', 'editable']
      });

      chrome.contextMenus.create({
        id: 'fix-all-grammar',
        parentId: 'quick-actions',
        title: 'Fix All Grammar',
        contexts: ['selection', 'editable']
      });

      chrome.contextMenus.create({
        id: 'fix-all-style',
        parentId: 'quick-actions',
        title: 'Fix All Style',
        contexts: ['selection', 'editable']
      });

      chrome.contextMenus.create({
        id: 'bulk-process',
        parentId: 'quick-actions',
        title: 'Bulk Process',
        contexts: ['selection', 'editable']
      });

      // Content Optimization (Feature 9)
      chrome.contextMenus.create({
        id: 'content-optimization',
        parentId: 'ai-writing-assistant-pro-main',
        title: '🎯 Content Optimization',
        contexts: ['selection', 'editable']
      });

      chrome.contextMenus.create({
        id: 'optimize-seo',
        parentId: 'content-optimization',
        title: 'SEO Optimization',
        contexts: ['selection', 'editable']
      });

      chrome.contextMenus.create({
        id: 'optimize-engagement',
        parentId: 'content-optimization',
        title: 'Engagement Optimization',
        contexts: ['selection', 'editable']
      });

      chrome.contextMenus.create({
        id: 'optimize-accessibility',
        parentId: 'content-optimization',
        title: 'Accessibility Optimization',
        contexts: ['selection', 'editable']
      });

      chrome.contextMenus.create({
        id: 'check-consistency',
        parentId: 'content-optimization',
        title: 'Consistency Check',
        contexts: ['selection', 'editable']
      });
    });
  }

  setupEventListeners() {
    // Context menu clicks
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });

    // Keyboard shortcuts
    chrome.commands.onCommand.addListener((command) => {
      this.handleKeyboardShortcut(command);
    });

    // Messages from content script and popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep the message channel open for async responses
    });

    // Extension installation
    chrome.runtime.onInstalled.addListener(() => {
      this.onInstalled();
    });
  }

  async handleContextMenuClick(info, tab) {
    if (!this.isEnabled) return;

    const action = info.menuItemId;
    const selectedText = info.selectionText || '';

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: this.injectContextMenuHandler,
        args: [action, selectedText]
      });
    } catch (error) {
      console.error('Failed to execute context menu action:', error);
    }
  }

  injectContextMenuHandler(action, selectedText) {
    // This function runs in the content script context
    window.postMessage({
      type: 'AI_WRITING_ASSISTANT_CONTEXT_MENU',
      action: action,
      text: selectedText
    }, '*');
  }

  async handleKeyboardShortcut(command) {
    if (!this.isEnabled) return;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: this.injectKeyboardHandler,
        args: [command]
      });
    } catch (error) {
      console.error('Failed to execute keyboard shortcut:', error);
    }
  }

  injectKeyboardHandler(command) {
    // This function runs in the content script context
    window.postMessage({
      type: 'AI_WRITING_ASSISTANT_KEYBOARD',
      command: command
    }, '*');
  }

  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'analyzeText':
        const analysis = await this.analyzeText(request.text);
        sendResponse(analysis);
        break;

      case 'getSettings':
        sendResponse({
          settings: this.settings,
          isEnabled: this.isEnabled
        });
        break;

      case 'updateSettings':
        this.settings = { ...this.settings, ...request.settings };
        if (request.isEnabled !== undefined) {
          this.isEnabled = request.isEnabled;
        }
        await this.saveSettings();
        sendResponse({ success: true });
        break;

      case 'processText':
        const result = await this.processText(request.text, request.type, request.options);
        sendResponse(result);
        break;

      default:
        sendResponse({ error: 'Unknown action' });
    }
  }

  async analyzeText(text) {
    if (!this.aiSession || !text.trim()) {
      return { suggestions: [], readabilityScore: 0, wordCount: 0 };
    }

    try {
      const prompt = `Analyze this text for grammar, style, and readability issues. Provide specific suggestions for improvement: "${text}"`;
      const response = await this.aiSession.prompt(prompt);
      
      // Parse AI response
      let analysis;
      try {
        analysis = JSON.parse(response);
      } catch {
        // Fallback if JSON parsing fails
        analysis = {
          suggestions: [{
            type: 'general',
            original: text,
            suggestion: response,
            explanation: 'AI-generated improvement suggestion',
            confidence: 0.8
          }],
          readabilityScore: this.calculateReadabilityScore(text),
          wordCount: text.split(/\s+/).length
        };
      }

      return analysis;
    } catch (error) {
      console.error('Text analysis failed:', error);
      return { 
        suggestions: [], 
        readabilityScore: this.calculateReadabilityScore(text), 
        wordCount: text.split(/\s+/).length 
      };
    }
  }

  async processText(text, type, options = {}) {
    if (!this.aiSession || !text.trim()) {
      return { processedText: text, success: false };
    }

    const prompts = {
      grammar: `Fix grammar, spelling, and punctuation errors in this text while preserving the original meaning and tone: "${text}"`,
      humanize: `Make this text sound more natural and human-like. Add conversational elements, vary sentence structure, and improve flow while keeping the core message: "${text}"`,
      enhance: `Improve this text for clarity, conciseness, and engagement. Suggest better vocabulary and sentence structure: "${text}"`,
      tone: `Adjust this text to sound more ${options.tone || this.settings.tone} while maintaining the original meaning: "${text}"`
    };

    try {
      const prompt = prompts[type] || prompts.enhance;
      const response = await this.aiSession.prompt(prompt);
      
      return {
        processedText: response.trim(),
        success: true,
        type: type
      };
    } catch (error) {
      console.error('Text processing failed:', error);
      return {
        processedText: text,
        success: false,
        error: error.message
      };
    }
  }

  calculateReadabilityScore(text) {
    // Simple readability calculation based on sentence and word length
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const words = text.split(/\s+/).filter(w => w);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = words.reduce((sum, word) => {
      return sum + this.countSyllables(word);
    }, 0) / words.length;
    
    // Simplified Flesch Reading Ease formula
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  countSyllables(word) {
    // Simple syllable counting
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  onInstalled() {
    // Set default settings on installation
    this.saveSettings();
    console.log('AI Writing Assistant installed successfully');
  }
}

// Initialize the background service
const aiAssistant = new AIWritingAssistant();