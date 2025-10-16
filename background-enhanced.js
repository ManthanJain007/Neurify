// AI Writing Assistant Pro - Complete Enhanced Background Service Worker
// This file contains the full implementation that replaces the existing background.js

// [Previous code up to line 177 remains the same, then continues with:]

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

  // EVENT LISTENERS

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
      return true; // Keep message channel open for async responses
    });

    // Extension installation/update
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    // Tab updates for context tracking
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.trackPlatformUsage(tab.url);
      }
    });

    // Notification clicks
    chrome.notifications.onClicked.addListener((notificationId) => {
      this.handleNotificationClick(notificationId);
    });
  }

  // COMPREHENSIVE MESSAGE HANDLING

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        // Settings Management
        case 'getSettings':
          sendResponse({
            settings: this.settings,
            isEnabled: this.isEnabled,
            userStats: this.userStats
          });
          break;

        case 'updateSettings':
          await this.updateSettings(request);
          sendResponse({ success: true });
          break;

        // Core Writing Features (Features 1-4)
        case 'advancedGrammarCheck':
          const grammarResult = await this.performAdvancedGrammarCheck(request.text, request.options);
          sendResponse(grammarResult);
          break;

        case 'spellingAndMechanics':
          const spellingResult = await this.performSpellingCheck(request.text, request.options);
          sendResponse(spellingResult);
          break;

        case 'styleEnhancement':
          const styleResult = await this.performStyleEnhancement(request.text, request.options);
          sendResponse(styleResult);
          break;

        case 'humanizeText':
          const humanizeResult = await this.performTextHumanization(request.text, request.options);
          sendResponse(humanizeResult);
          break;

        // Tone & Persona (Features 5-6)
        case 'detectTone':
          const toneResult = await this.detectTextTone(request.text);
          sendResponse(toneResult);
          break;

        case 'adjustTone':
          const adjustResult = await this.adjustTextTone(request.text, request.targetTone, request.options);
          sendResponse(adjustResult);
          break;

        case 'applyPersona':
          const personaResult = await this.applyPersona(request.text, request.persona, request.context);
          sendResponse(personaResult);
          break;

        // Real-time Analysis (Feature 7)
        case 'realTimeAnalysis':
          const analysisResult = await this.performRealTimeAnalysis(request.text, request.options);
          sendResponse(analysisResult);
          break;

        // Smart Suggestions (Feature 8)
        case 'generateSmartSuggestions':
          const suggestionsResult = await this.generateSmartSuggestions(request.text, request.category, request.options);
          sendResponse(suggestionsResult);
          break;

        // Content Optimization (Feature 9)
        case 'optimizeContent':
          const optimizationResult = await this.optimizeContent(request.text, request.type, request.options);
          sendResponse(optimizationResult);
          break;

        // Quick Actions (Feature 19)
        case 'processQuickAction':
          const quickActionResult = await this.processQuickAction(request.text, request.actionType, request.options);
          sendResponse(quickActionResult);
          break;

        // Analytics & Reporting (Feature 20)
        case 'generateAnalytics':
          const analyticsResult = await this.generateAnalytics(request.options);
          sendResponse(analyticsResult);
          break;

        case 'getWritingStats':
          sendResponse({
            userStats: this.userStats,
            sessionData: {
              ...this.sessionData,
              platformsUsed: Array.from(this.sessionData.platformsUsed),
              writingContexts: Array.from(this.sessionData.writingContexts)
            },
            analyticsData: this.analyticsData
          });
          break;

        // Learning & Personalization (Feature 26)
        case 'recordUserChoice':
          await this.recordUserChoice(request.original, request.suggestion, request.choice, request.context);
          sendResponse({ success: true });
          break;

        case 'getPersonalizedInsights':
          const insightsResult = await this.getPersonalizedInsights();
          sendResponse(insightsResult);
          break;

        // Workflow Integration (Features 25)
        case 'adaptToContext':
          const contextResult = await this.adaptToContext(request.text, request.context, request.options);
          sendResponse(contextResult);
          break;

        // Bulk Operations
        case 'processBulkText':
          const bulkResult = await this.processBulkText(request.texts, request.operations);
          sendResponse(bulkResult);
          break;

        default:
          sendResponse({ error: 'Unknown action: ' + request.action });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ error: error.message });
    }
  }

  // CORE FEATURE IMPLEMENTATIONS

  async performAdvancedGrammarCheck(text, options = {}) {
    if (!this.geminiService.initialized) {
      return { error: 'Gemini API not initialized. Please configure API key in settings.' };
    }

    try {
      const startTime = Date.now();
      
      const result = await this.geminiService.advancedGrammarCheck(text, {
        language: options.language || this.settings.primaryLanguage || 'en-US',
        intensity: this.settings.suggestionIntensity
      });

      // Update statistics
      this.userStats.textsProcessed++;
      this.userStats.timeSaved += Math.round((Date.now() - startTime) / 1000);
      await this.saveUserStats();

      // Parse and structure the response
      const structuredResult = this.parseGrammarResponse(result.text);
      
      if (this.settings.learningMode) {
        await this.recordAnalyticsData('grammar_check', {
          textLength: text.length,
          errorsFound: structuredResult.errors?.length || 0,
          processingTime: Date.now() - startTime
        });
      }

      return {
        success: true,
        ...structuredResult,
        confidence: 0.9,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Advanced grammar check failed:', error);
      return { error: error.message, fallback: true };
    }
  }

  async performStyleEnhancement(text, options = {}) {
    if (!this.geminiService.initialized) {
      return { error: 'Gemini API not initialized' };
    }

    try {
      const startTime = Date.now();
      
      const result = await this.geminiService.styleEnhancement(text, {
        intensity: options.intensity || this.settings.suggestionIntensity,
        audience: options.audience || 'general',
        focus: options.focus || ['conciseness', 'clarity', 'readability']
      });

      // Update statistics
      this.userStats.suggestionsMade++;
      await this.saveUserStats();

      const structuredResult = this.parseStyleResponse(result.text);
      
      return {
        success: true,
        ...structuredResult,
        readabilityImprovement: this.calculateReadabilityImprovement(text, structuredResult.enhancedText || text),
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Style enhancement failed:', error);
      return { error: error.message };
    }
  }

  async performTextHumanization(text, options = {}) {
    if (!this.geminiService.initialized) {
      return { error: 'Gemini API not initialized' };
    }

    try {
      const result = await this.geminiService.humanizeText(text, {
        level: options.level || 'moderate',
        keepFormality: options.preserveFormality || false,
        addPersonality: options.addPersonality !== false
      });

      const structuredResult = this.parseHumanizationResponse(result.text);
      
      // Track humanization patterns for learning
      if (this.settings.learningMode) {
        await this.recordAnalyticsData('humanization', {
          originalLength: text.length,
          humanizedLength: structuredResult.humanizedText?.length || text.length,
          techniques: structuredResult.techniques || []
        });
      }

      return {
        success: true,
        ...structuredResult,
        humanizationScore: this.calculateHumanizationScore(text, structuredResult.humanizedText || text)
      };
    } catch (error) {
      console.error('Text humanization failed:', error);
      return { error: error.message };
    }
  }

  async performRealTimeAnalysis(text, options = {}) {
    if (!this.geminiService.initialized) {
      // Provide basic analysis without API
      return this.generateBasicAnalysis(text);
    }

    try {
      const result = await this.geminiService.realTimeAnalysis(text, {
        type: options.analysisType || 'comprehensive',
        includeMetrics: true
      });

      const analysis = this.parseRealTimeAnalysis(result.text, text);
      
      // Update session data
      this.sessionData.textAnalyzed += text.length;
      await this.saveSessionData();

      return {
        success: true,
        ...analysis,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Real-time analysis failed:', error);
      return this.generateBasicAnalysis(text);
    }
  }

  async generateSmartSuggestions(text, category, options = {}) {
    if (!this.geminiService.initialized) {
      return { error: 'Gemini API not initialized' };
    }

    try {
      // Get user's learning context for personalized suggestions
      const learningContext = this.getLearningContext(category);
      
      const result = await this.geminiService.generateSmartSuggestions(text, category, {
        ...options,
        learningContext,
        userPreferences: this.getUserPreferences(category)
      });

      const suggestions = this.parseSmartSuggestions(result.text);
      
      // Update suggestion statistics
      this.userStats.suggestionsMade += suggestions.length || 0;
      await this.saveUserStats();

      return {
        success: true,
        suggestions: suggestions,
        category: category,
        personalized: true
      };
    } catch (error) {
      console.error('Smart suggestions generation failed:', error);
      return { error: error.message };
    }
  }

  // ANALYTICS & REPORTING (Feature 20)

  async generateAnalytics(options = {}) {
    try {
      const timePeriod = options.timePeriod || 'last-30-days';
      const focusAreas = options.focusAreas || ['all'];
      
      const analyticsResult = await this.geminiService.generateAnalytics(this.analyticsData, {
        timePeriod,
        focusAreas
      });

      const analytics = this.parseAnalytics(analyticsResult.text);
      
      return {
        success: true,
        ...analytics,
        userStats: this.userStats,
        sessionData: this.sessionData,
        generatedAt: Date.now()
      };
    } catch (error) {
      console.error('Analytics generation failed:', error);
      // Provide basic analytics without AI
      return this.generateBasicAnalytics(options);
    }
  }

  startAnalyticsCollection() {
    // Start periodic analytics collection
    setInterval(() => {
      this.collectPeriodicAnalytics();
    }, 300000); // Every 5 minutes

    // Daily analytics summary
    setInterval(() => {
      this.generateDailyAnalytics();
    }, 86400000); // Every 24 hours
  }

  async collectPeriodicAnalytics() {
    const analyticsEntry = {
      timestamp: Date.now(),
      userStats: { ...this.userStats },
      sessionData: {
        ...this.sessionData,
        platformsUsed: Array.from(this.sessionData.platformsUsed),
        writingContexts: Array.from(this.sessionData.writingContexts)
      }
    };

    this.analyticsData.push(analyticsEntry);
    
    // Keep only last 1000 entries
    if (this.analyticsData.length > 1000) {
      this.analyticsData.splice(0, this.analyticsData.length - 1000);
    }

    try {
      await chrome.storage.local.set({ analyticsData: this.analyticsData });
    } catch (error) {
      console.error('Failed to save analytics data:', error);
    }
  }

  // LEARNING & PERSONALIZATION (Feature 26)

  async recordUserChoice(originalText, suggestion, choice, context = {}) {
    if (!this.settings.learningMode) return;

    const learningEntry = {
      timestamp: Date.now(),
      original: originalText,
      suggestion: suggestion,
      choice: choice, // 'accepted', 'rejected', 'modified'
      context: context,
      platform: context.platform || 'unknown'
    };

    this.learningData.push(learningEntry);

    // Keep only last 5000 entries
    if (this.learningData.length > 5000) {
      this.learningData.splice(0, this.learningData.length - 5000);
    }

    try {
      await chrome.storage.local.set({ learningData: this.learningData });
      
      // Update user preferences based on choices
      await this.updateUserPreferences(learningEntry);
    } catch (error) {
      console.error('Failed to record user choice:', error);
    }
  }

  async getPersonalizedInsights() {
    if (!this.geminiService.initialized || this.learningData.length < 10) {
      return this.generateBasicInsights();
    }

    try {
      const result = await this.geminiService.generatePersonalizedInsights(
        this.learningData.slice(-100) // Last 100 entries
      );

      return {
        success: true,
        insights: this.parsePersonalizedInsights(result.text),
        dataPoints: this.learningData.length,
        generatedAt: Date.now()
      };
    } catch (error) {
      console.error('Personalized insights generation failed:', error);
      return this.generateBasicInsights();
    }
  }

  // UTILITY METHODS

  parseGrammarResponse(responseText) {
    try {
      // Try to parse JSON response
      const parsed = JSON.parse(responseText);
      return parsed;
    } catch {
      // Fallback to text parsing
      return {
        errors: this.extractErrorsFromText(responseText),
        correctedText: this.extractCorrectedText(responseText),
        explanations: this.extractExplanations(responseText)
      };
    }
  }

  parseStyleResponse(responseText) {
    // Similar parsing logic for style enhancement responses
    return {
      enhancedText: responseText,
      improvements: [],
      readabilityScore: this.calculateReadabilityScore(responseText)
    };
  }

  parseHumanizationResponse(responseText) {
    return {
      humanizedText: responseText,
      techniques: ['natural flow', 'conversational tone'],
      confidence: 0.85
    };
  }

  generateBasicAnalysis(text) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const readabilityScore = this.calculateReadabilityScore(text);

    return {
      success: true,
      metrics: {
        wordCount: words.length,
        characterCount: text.length,
        sentenceCount: sentences.length,
        readabilityScore: readabilityScore,
        readingTime: Math.ceil(words.length / 200) // Assume 200 WPM
      },
      suggestions: {
        red: [], // Critical errors
        blue: [], // Style improvements  
        green: [], // Enhancements
        yellow: [] // Tone adjustments
      }
    };
  }

  calculateReadabilityScore(text) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = words.reduce((sum, word) => {
      return sum + this.countSyllables(word);
    }, 0) / words.length;
    
    // Flesch Reading Ease formula
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  countSyllables(word) {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  // Initialize the enhanced service
  onInstalled() {
    this.saveSettings();
    console.log('AI Writing Assistant Pro installed successfully');
    
    // Show welcome notification
    if (this.settings.showNotifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'AI Writing Assistant Pro',
        message: 'Extension installed! Configure your Gemini API key in settings to get started.'
      });
    }
  }
}

// Initialize the enhanced service
const aiAssistantPro = new AIWritingAssistantPro();