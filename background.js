// background.js
importScripts('./config.js', './gemini-service.js');

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
      // Core Writing Features
      grammarCheck: true,
      spellingMechanics: true,
      styleEnhancement: true,
      textHumanization: true,
      
      // Tone & Persona Adaptation
      toneDetection: true,
      toneAdjustment: true,
      personaBasedWriting: true,
      
      // Advanced Features
      realTimeAnalysis: true,
      smartSuggestions: true,
      contentOptimization: true,
      
      // UI Features
      floatingToolbar: true,
      visualFeedback: true,
      contextualSuggestions: true,
      
      // Customization & Settings
      personalization: true,
      siteSpecificRules: true,
      crossPlatformSync: true,
      
      // Technical Features
      performanceOptimization: true,
      accessibility: true,
      privacyProtection: true,
      
      // Productivity Tools
      quickActions: true,
      analyticsReporting: true,
      
      // Platform Support
      websiteCompatibility: true,
      browserIntegration: true,
      
      // Workflow Integration
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