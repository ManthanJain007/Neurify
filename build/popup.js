// AI Writing Assistant Pro - Enhanced Popup JavaScript
// Comprehensive Control Center Functionality with Auto-Write and Chatbot

class PopupController {
  constructor() {
    this.settings = {};
    this.stats = {};
    this.isInitialized = false;
    this.currentTab = 'features';
    this.conversationHistory = [];
    
    this.initializePopup();
  }

  async initializePopup() {
    try {
      // Show loading overlay
      this.showLoading();
      
      // Load settings and stats
      await this.loadSettings();
      await this.loadStats();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Update UI with loaded data
      this.updateUI();
      
      // Check API status
      await this.checkApiStatus();
      
      // Hide loading overlay
      this.hideLoading();
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Failed to initialize popup:', error);
      this.showError('Failed to load extension data');
    }
  }

  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      if (response && response.success) {
        this.settings = response.settings;
      } else {
        throw new Error('Failed to load settings');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use default settings
      this.settings = {
        enabled: true,
        mode: 'auto',
        tonePreference: 'professional',
        intensity: 'moderate',
        features: {
          realTimeAnalysis: true,
          autoWrite: true,
          smartSuggestions: true,
          chatbot: true
        }
      };
    }
  }

  async loadStats() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSessionStats' });
      if (response && response.success) {
        this.stats = response.stats;
      } else {
        throw new Error('Failed to load stats');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      this.stats = {
        corrections: 0,
        suggestions: 0,
        wordsAnalyzed: 0,
        autoWrites: 0
      };
    }
  }

  setupEventListeners() {
    // Master toggle
    const masterToggle = document.getElementById('master-toggle');
    if (masterToggle) {
      masterToggle.addEventListener('change', (e) => {
        this.updateSetting('enabled', e.target.checked);
      });
    }

    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Mode selection
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.selectMode(mode);
      });
    });

    // Tone selection
    const toneSelect = document.getElementById('tone-select');
    if (toneSelect) {
      toneSelect.addEventListener('change', (e) => {
        this.updateSetting('tonePreference', e.target.value);
      });
    }

    // Feature toggles
    const featureToggles = document.querySelectorAll('.feature-checkbox');
    featureToggles.forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const feature = e.target.dataset.feature;
        this.updateFeature(feature, e.target.checked);
      });
    });

    // Auto-Write features
    this.setupAutoWriteListeners();

    // Chatbot features
    this.setupChatbotListeners();

    // Quick action buttons
    const analyzePageBtn = document.getElementById('analyze-page');
    if (analyzePageBtn) {
      analyzePageBtn.addEventListener('click', () => {
        this.analyzeCurrentPage();
      });
    }

    const clearDataBtn = document.getElementById('clear-data');
    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', () => {
        this.clearSessionData();
      });
    }

    // Header settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.openAdvancedSettings();
      });
    }

    const chatbotBtn = document.getElementById('chatbot-btn');
    if (chatbotBtn) {
      chatbotBtn.addEventListener('click', () => {
        this.switchTab('chatbot');
      });
    }

    // Footer links
    const advancedSettingsBtn = document.getElementById('advanced-settings');
    if (advancedSettingsBtn) {
      advancedSettingsBtn.addEventListener('click', () => {
        this.openAdvancedSettings();
      });
    }

    const helpSupportBtn = document.getElementById('help-support');
    if (helpSupportBtn) {
      helpSupportBtn.addEventListener('click', () => {
        this.openHelpSupport();
      });
    }

    const feedbackBtn = document.getElementById('feedback');
    if (feedbackBtn) {
      feedbackBtn.addEventListener('click', () => {
        this.sendFeedback();
      });
    }
  }

  setupAutoWriteListeners() {
    // Prompt counter
    const promptInput = document.getElementById('autowrite-prompt');
    const promptCounter = document.getElementById('prompt-counter');
    
    if (promptInput && promptCounter) {
      promptInput.addEventListener('input', (e) => {
        promptCounter.textContent = e.target.value.length;
      });
    }

    // Generate content button
    const generateBtn = document.getElementById('generate-content');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        this.generateContent();
      });
    }

    // Get ideas button
    const ideasBtn = document.getElementById('get-ideas');
    if (ideasBtn) {
      ideasBtn.addEventListener('click', () => {
        this.generateIdeas();
      });
    }

    // Copy content button
    const copyBtn = document.getElementById('copy-content');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        this.copyGeneratedContent();
      });
    }

    // Refine content button
    const refineBtn = document.getElementById('refine-content');
    if (refineBtn) {
      refineBtn.addEventListener('click', () => {
        this.refineContent();
      });
    }
  }

  setupChatbotListeners() {
    // Chat input
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');

    if (chatInput) {
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendChatMessage();
        }
      });
    }

    if (chatSendBtn) {
      chatSendBtn.addEventListener('click', () => {
        this.sendChatMessage();
      });
    }

    // Suggestion buttons
    const suggestionBtns = document.querySelectorAll('.suggestion-btn');
    suggestionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const suggestion = e.target.dataset.suggestion;
        this.useChatSuggestion(suggestion);
      });
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    this.currentTab = tabName;
  }

  selectMode(mode) {
    // Update UI
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const selectedBtn = document.querySelector(`[data-mode="${mode}"]`);
    if (selectedBtn) {
      selectedBtn.classList.add('active');
    }

    // Update setting
    this.updateSetting('mode', mode);
  }

  updateUI() {
    // Update master toggle
    const masterToggle = document.getElementById('master-toggle');
    if (masterToggle) {
      masterToggle.checked = this.settings.enabled;
    }

    // Update mode selection
    this.selectMode(this.settings.mode);

    // Update tone selection
    const toneSelect = document.getElementById('tone-select');
    if (toneSelect) {
      toneSelect.value = this.settings.tonePreference;
    }

    // Update feature toggles
    Object.entries(this.settings.features || {}).forEach(([feature, enabled]) => {
      const toggle = document.querySelector(`[data-feature="${feature}"]`);
      if (toggle) {
        toggle.checked = enabled;
      }
    });

    // Update statistics
    this.updateStats();
  }

  async updateSetting(key, value) {
    try {
      this.settings[key] = value;
      await chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: { [key]: value }
      });
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  }

  async updateFeature(feature, enabled) {
    try {
      if (!this.settings.features) {
        this.settings.features = {};
      }
      this.settings.features[feature] = enabled;
      
      await chrome.runtime.sendMessage({
        action: 'updateSettings', 
        settings: { features: this.settings.features }
      });
    } catch (error) {
      console.error('Failed to update feature:', error);
    }
  }

  updateStats() {
    // Update correction count
    const correctionsCount = document.getElementById('corrections-count');
    if (correctionsCount) {
      correctionsCount.textContent = this.formatNumber(this.stats.corrections || 0);
    }

    // Update suggestions count
    const suggestionsCount = document.getElementById('suggestions-count');
    if (suggestionsCount) {
      suggestionsCount.textContent = this.formatNumber(this.stats.suggestions || 0);
    }

    // Update words analyzed
    const wordsAnalyzed = document.getElementById('words-analyzed');
    if (wordsAnalyzed) {
      wordsAnalyzed.textContent = this.formatNumber(this.stats.wordsAnalyzed || 0);
    }

    // Update auto-writes count
    const autoWrites = document.getElementById('auto-writes');
    if (autoWrites) {
      autoWrites.textContent = this.formatNumber(this.stats.autoWrites || 0);
    }
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // Auto-Write Functions
  async generateContent() {
    const promptInput = document.getElementById('autowrite-prompt');
    const generateBtn = document.getElementById('generate-content');
    const outputDiv = document.getElementById('autowrite-output');
    const outputText = document.getElementById('output-text');

    if (!promptInput || !promptInput.value.trim()) {
      this.showNotification('Please enter a prompt to generate content', 'warning');
      return;
    }

    const options = {
      contentType: document.getElementById('content-type').value,
      length: document.getElementById('content-length').value,
      style: document.getElementById('writing-style').value,
      tone: this.settings.tonePreference,
      audience: 'general'
    };

    try {
      // Show loading state
      generateBtn.disabled = true;
      generateBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Generating...</span>';

      // Send request to background script
      const response = await chrome.runtime.sendMessage({
        action: 'autoWrite',
        prompt: promptInput.value.trim(),
        options: options
      });

      if (response.success) {
        // Show generated content
        outputText.textContent = response.content;
        outputDiv.style.display = 'block';
        
        // Update stats
        this.stats.autoWrites = (this.stats.autoWrites || 0) + 1;
        this.updateStats();
        
        this.showNotification('Content generated successfully!', 'success');
      } else {
        throw new Error(response.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Content generation failed:', error);
      this.showNotification('Failed to generate content: ' + error.message, 'error');
    } finally {
      // Restore button state
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<span class="btn-icon">✨</span><span class="btn-text">Generate Content</span>';
    }
  }

  async generateIdeas() {
    const promptInput = document.getElementById('autowrite-prompt');
    const ideasBtn = document.getElementById('get-ideas');

    if (!promptInput || !promptInput.value.trim()) {
      this.showNotification('Please enter a topic to generate ideas', 'warning');
      return;
    }

    try {
      // Show loading state
      ideasBtn.disabled = true;
      ideasBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Getting Ideas...</span>';

      // Send request to background script
      const response = await chrome.runtime.sendMessage({
        action: 'generateIdeas',
        topic: promptInput.value.trim(),
        options: { count: 5, ideaType: 'content ideas' }
      });

      if (response.success) {
        // Show ideas in output
        const outputDiv = document.getElementById('autowrite-output');
        const outputText = document.getElementById('output-text');
        outputText.textContent = response.ideas;
        outputDiv.style.display = 'block';
        
        this.showNotification('Ideas generated successfully!', 'success');
      } else {
        throw new Error(response.error || 'Failed to generate ideas');
      }
    } catch (error) {
      console.error('Idea generation failed:', error);
      this.showNotification('Failed to generate ideas: ' + error.message, 'error');
    } finally {
      // Restore button state
      ideasBtn.disabled = false;
      ideasBtn.innerHTML = '<span class="btn-icon">💡</span><span class="btn-text">Get Ideas</span>';
    }
  }

  async copyGeneratedContent() {
    const outputText = document.getElementById('output-text');
    if (!outputText || !outputText.textContent) {
      this.showNotification('No content to copy', 'warning');
      return;
    }

    try {
      await navigator.clipboard.writeText(outputText.textContent);
      this.showNotification('Content copied to clipboard!', 'success');
    } catch (error) {
      console.error('Failed to copy content:', error);
      this.showNotification('Failed to copy content', 'error');
    }
  }

  async refineContent() {
    const outputText = document.getElementById('output-text');
    if (!outputText || !outputText.textContent) {
      this.showNotification('No content to refine', 'warning');
      return;
    }

    const refineBtn = document.getElementById('refine-content');
    
    try {
      refineBtn.disabled = true;
      refineBtn.innerHTML = '⏳';

      const response = await chrome.runtime.sendMessage({
        action: 'enhanceStyle',
        text: outputText.textContent,
        options: { 
          intensity: 'moderate',
          tone: this.settings.tonePreference
        }
      });

      if (response.success) {
        outputText.textContent = response.enhancedText;
        this.showNotification('Content refined!', 'success');
      } else {
        throw new Error(response.error || 'Failed to refine content');
      }
    } catch (error) {
      console.error('Content refinement failed:', error);
      this.showNotification('Failed to refine content: ' + error.message, 'error');
    } finally {
      refineBtn.disabled = false;
      refineBtn.innerHTML = '🔄';
    }
  }

  // Chatbot Functions
  async sendChatMessage() {
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    
    if (!chatInput || !chatInput.value.trim()) {
      return;
    }

    const userMessage = chatInput.value.trim();
    chatInput.value = '';

    // Add user message to chat
    this.addChatMessage(userMessage, 'user');

    try {
      // Send message to chatbot
      const response = await chrome.runtime.sendMessage({
        action: 'chatResponse',
        message: userMessage,
        conversationHistory: this.conversationHistory
      });

      if (response.success) {
        // Add bot response to chat
        this.addChatMessage(response.reply, 'bot');
        
        // Update conversation history
        this.conversationHistory.push(
          { role: 'user', content: userMessage },
          { role: 'assistant', content: response.reply }
        );
        
        // Keep only last 10 messages
        if (this.conversationHistory.length > 20) {
          this.conversationHistory = this.conversationHistory.slice(-20);
        }
      } else {
        throw new Error(response.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat request failed:', error);
      this.addChatMessage('Sorry, I encountered an error. Please try again.', 'bot');
    }
  }

  addChatMessage(message, sender) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'user' ? '👤' : '🤖';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const text = document.createElement('div');
    text.className = 'message-text';
    text.textContent = message;
    
    content.appendChild(text);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  useChatSuggestion(suggestion) {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.value = suggestion;
      chatInput.focus();
    }
  }

  // Utility Functions
  async checkApiStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'checkApiStatus' });
      if (response && response.success) {
        this.updateStatusIndicator(response.status);
      } else {
        this.updateStatusIndicator({ status: 'error', message: 'API check failed' });
      }
    } catch (error) {
      console.error('Failed to check API status:', error);
      this.updateStatusIndicator({ status: 'ready', message: 'Ready' });
    }
  }

  updateStatusIndicator(status) {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');

    if (!statusDot || !statusText) return;

    // Remove existing classes
    statusDot.className = 'status-dot';

    switch (status.status) {
      case 'ready':
        statusDot.classList.add('ready');
        statusText.textContent = 'AI Ready';
        break;
      case 'error':
        statusDot.classList.add('error');
        statusText.textContent = 'Connection Error';
        break;
      default:
        statusDot.classList.add('ready');
        statusText.textContent = 'Ready';
    }
  }

  async analyzeCurrentPage() {
    try {
      const loadingBtn = document.getElementById('analyze-page');
      const originalText = loadingBtn.innerHTML;
      
      // Show loading state
      loadingBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Analyzing...</span>';
      loadingBtn.disabled = true;

      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send analysis request
      await chrome.tabs.sendMessage(tab.id, { 
        action: 'analyzeCurrentPage'
      });

      // Show success message
      this.showNotification('Page analysis started', 'success');
      
      // Restore button
      setTimeout(() => {
        loadingBtn.innerHTML = originalText;
        loadingBtn.disabled = false;
      }, 2000);
      
    } catch (error) {
      console.error('Failed to analyze page:', error);
      this.showNotification('Failed to analyze page', 'error');
      
      // Restore button
      const loadingBtn = document.getElementById('analyze-page');
      if (loadingBtn) {
        loadingBtn.innerHTML = '<span class="btn-icon">🔍</span><span class="btn-text">Analyze Current Page</span>';
        loadingBtn.disabled = false;
      }
    }
  }

  async clearSessionData() {
    try {
      const confirmed = confirm('Are you sure you want to clear all session data?');
      if (!confirmed) return;

      await chrome.runtime.sendMessage({ action: 'clearSessionData' });
      
      // Reset stats
      this.stats = {
        corrections: 0,
        suggestions: 0,
        wordsAnalyzed: 0,
        autoWrites: 0
      };
      
      this.updateStats();
      this.showNotification('Session data cleared', 'success');
      
    } catch (error) {
      console.error('Failed to clear session data:', error);
      this.showNotification('Failed to clear data', 'error');
    }
  }

  openAdvancedSettings() {
    chrome.runtime.openOptionsPage();
  }

  openHelpSupport() {
    chrome.tabs.create({
      url: 'https://github.com/your-username/ai-writing-assistant/wiki'
    });
  }

  sendFeedback() {
    chrome.tabs.create({
      url: 'https://github.com/your-username/ai-writing-assistant/issues/new?template=feedback.md'
    });
  }

  showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('active');
    }
  }

  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 6px;
      color: white;
      font-size: 13px;
      font-weight: 500;
      z-index: 1001;
      animation: slideInRight 0.3s ease-out;
      max-width: 300px;
      word-wrap: break-word;
    `;

    // Set background color based on type
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    notification.style.background = colors[type] || colors.info;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  showError(message) {
    this.hideLoading();
    this.showNotification(message, 'error');
    
    // Update status indicator
    this.updateStatusIndicator({ status: 'error', message: 'Extension Error' });
  }
}

// Additional CSS animations for notifications
const additionalStyles = `
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOutRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}
`;

// Inject additional styles
const style = document.createElement('style');
style.textContent = additionalStyles;
document.head.appendChild(style);

// Initialize the popup controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PopupController;
} else if (typeof window !== 'undefined') {
  window.PopupController = PopupController;
}