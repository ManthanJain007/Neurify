// AI Writing Assistant Pro - Popup JavaScript
// Comprehensive Control Center Functionality

class PopupController {
  constructor() {
    this.settings = {};
    this.stats = {};
    this.isInitialized = false;
    
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
      if (response.success) {
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
          visualFeedback: true,
          floatingToolbar: true,
          smartSuggestions: true,
          contentOptimization: true,
          personalization: true
        }
      };
    }
  }

  async loadStats() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSessionStats' });
      if (response.success) {
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
        timesSaved: 0
      };
    }
  }

  setupEventListeners() {
    // Master toggle
    const masterToggle = document.getElementById('master-toggle');
    masterToggle.addEventListener('change', (e) => {
      this.updateSetting('enabled', e.target.checked);
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
    toneSelect.addEventListener('change', (e) => {
      this.updateSetting('tonePreference', e.target.value);
    });

    // Intensity slider
    const intensitySlider = document.getElementById('intensity-slider');
    intensitySlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      const intensityLabels = ['minimal', 'light', 'moderate', 'strong', 'maximum'];
      const intensity = intensityLabels[value - 1];
      this.updateIntensity(intensity, value);
    });

    // Feature toggles
    const featureToggles = document.querySelectorAll('.feature-checkbox');
    featureToggles.forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const feature = e.target.dataset.feature;
        this.updateFeature(feature, e.target.checked);
      });
    });

    // Quick action buttons
    const analyzePageBtn = document.getElementById('analyze-page');
    analyzePageBtn.addEventListener('click', () => {
      this.analyzeCurrentPage();
    });

    const clearDataBtn = document.getElementById('clear-data');
    clearDataBtn.addEventListener('click', () => {
      this.clearSessionData();
    });

    // Header settings button
    const settingsBtn = document.getElementById('settings-btn');
    settingsBtn.addEventListener('click', () => {
      this.openAdvancedSettings();
    });

    // Footer links
    const advancedSettingsBtn = document.getElementById('advanced-settings');
    advancedSettingsBtn.addEventListener('click', () => {
      this.openAdvancedSettings();
    });

    const helpSupportBtn = document.getElementById('help-support');
    helpSupportBtn.addEventListener('click', () => {
      this.openHelpSupport();
    });

    const feedbackBtn = document.getElementById('feedback');
    feedbackBtn.addEventListener('click', () => {
      this.sendFeedback();
    });
  }

  updateUI() {
    // Update master toggle
    const masterToggle = document.getElementById('master-toggle');
    masterToggle.checked = this.settings.enabled;

    // Update mode selection
    this.selectMode(this.settings.mode);

    // Update tone selection
    const toneSelect = document.getElementById('tone-select');
    toneSelect.value = this.settings.tonePreference;

    // Update intensity slider
    const intensitySlider = document.getElementById('intensity-slider');
    const intensityMap = { 'minimal': 1, 'light': 2, 'moderate': 3, 'strong': 4, 'maximum': 5 };
    const intensityValue = intensityMap[this.settings.intensity] || 3;
    intensitySlider.value = intensityValue;
    this.updateIntensityDisplay(this.settings.intensity);

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

  updateIntensity(intensity, value) {
    this.updateIntensityDisplay(intensity);
    this.updateSetting('intensity', intensity);
  }

  updateIntensityDisplay(intensity) {
    const intensityValue = document.getElementById('intensity-value');
    const displayNames = {
      'minimal': 'Minimal',
      'light': 'Light', 
      'moderate': 'Moderate',
      'strong': 'Strong',
      'maximum': 'Maximum'
    };
    intensityValue.textContent = displayNames[intensity] || 'Moderate';
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
    correctionsCount.textContent = this.formatNumber(this.stats.corrections || 0);

    // Update suggestions count
    const suggestionsCount = document.getElementById('suggestions-count');
    suggestionsCount.textContent = this.formatNumber(this.stats.suggestions || 0);

    // Update words analyzed
    const wordsAnalyzed = document.getElementById('words-analyzed');
    wordsAnalyzed.textContent = this.formatNumber(this.stats.wordsAnalyzed || 0);

    // Update time saved
    const timeSaved = document.getElementById('time-saved');
    timeSaved.textContent = this.formatTime(this.stats.timesSaved || 0);
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  formatTime(seconds) {
    if (seconds >= 3600) {
      return Math.floor(seconds / 3600) + 'h';
    } else if (seconds >= 60) {
      return Math.floor(seconds / 60) + 'm';
    }
    return seconds + 's';
  }

  async checkApiStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'checkApiStatus' });
      if (response.success) {
        this.updateStatusIndicator(response.status);
      } else {
        this.updateStatusIndicator({ status: 'error', message: 'API check failed' });
      }
    } catch (error) {
      console.error('Failed to check API status:', error);
      this.updateStatusIndicator({ status: 'error', message: 'Connection error' });
    }
  }

  updateStatusIndicator(status) {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');

    // Remove existing classes
    statusDot.className = 'status-dot';

    switch (status.status) {
      case 'ready':
        statusDot.classList.add('ready');
        statusText.textContent = 'AI Ready';
        break;
      case 'no-key':
        statusDot.classList.add('error');
        statusText.textContent = 'API Key Required';
        break;
      case 'error':
        statusDot.classList.add('error');
        statusText.textContent = 'API Error';
        break;
      default:
        statusDot.classList.add('checking');
        statusText.textContent = 'Checking...';
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
      loadingBtn.innerHTML = '<span class="btn-icon">🔍</span><span class="btn-text">Analyze Current Page</span>';
      loadingBtn.disabled = false;
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
        timesSaved: 0
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
    overlay.classList.add('active');
  }

  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('active');
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

  // Periodic updates
  startPeriodicUpdates() {
    // Update stats every 30 seconds
    setInterval(() => {
      if (this.isInitialized) {
        this.loadStats().then(() => {
          this.updateStats();
        }).catch(error => {
          console.error('Failed to update stats:', error);
        });
      }
    }, 30000);

    // Check API status every 60 seconds
    setInterval(() => {
      if (this.isInitialized) {
        this.checkApiStatus();
      }
    }, 60000);
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

.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1001;
  border-radius: 6px;
  padding: 12px 16px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  max-width: 300px;
  word-wrap: break-word;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
  });
} else {
  new PopupController();
}

// Handle popup visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Popup became visible, refresh data
    const popup = window.popupController;
    if (popup && popup.isInitialized) {
      popup.loadStats().then(() => {
        popup.updateStats();
      });
      popup.checkApiStatus();
    }
  }
});

// Export for global access
window.popupController = new PopupController();
if (window.popupController) {
  window.popupController.startPeriodicUpdates();
}

// AI Writing Assistant Popup Script

class AIWritingPopup {
  constructor() {
    this.settings = {};
    this.isEnabled = false;
    this.stats = {
      textsProcessed: 0,
      suggestionsMade: 0,
      improvementScore: 0,
      timesSaved: 0
    };

    this.initialize();
  }

  async initialize() {
    // Load current settings and status
    await this.loadSettings();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Update UI
    this.updateUI();
    
    // Check AI availability
    this.checkAIAvailability();
    
    // Load session stats
    this.loadSessionStats();
  }

  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      this.settings = response.settings || {};
      this.isEnabled = response.isEnabled !== false;
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Set default values
      this.settings = {
        grammarCheck: true,
        humanization: true,
        styleEnhancement: true,
        tone: 'professional',
        intensity: 0.7,
        mode: 'auto'
      };
      this.isEnabled = false;
    }
  }

  async saveSettings() {
    try {
      await chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: this.settings,
        isEnabled: this.isEnabled
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  setupEventListeners() {
    // Master toggle
    const masterToggle = document.getElementById('masterToggle');
    masterToggle.addEventListener('change', (e) => {
      this.isEnabled = e.target.checked;
      this.saveSettings();
      this.updateUI();
    });

    // Mode selection
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.setMode(mode);
      });
    });

    // Feature toggles
    const featureCheckboxes = ['grammarCheck', 'humanization', 'styleEnhancement'];
    featureCheckboxes.forEach(id => {
      const checkbox = document.getElementById(id);
      checkbox.addEventListener('change', (e) => {
        this.settings[id] = e.target.checked;
        this.saveSettings();
      });
    });

    // Tone selection
    const toneSelect = document.getElementById('toneSelect');
    toneSelect.addEventListener('change', (e) => {
      this.settings.tone = e.target.value;
      this.saveSettings();
    });

    // Intensity slider
    const intensitySlider = document.getElementById('intensitySlider');
    intensitySlider.addEventListener('input', (e) => {
      this.settings.intensity = parseFloat(e.target.value);
      this.updateIntensityDisplay();
      this.saveSettings();
    });

    // Footer buttons
    document.getElementById('optionsBtn').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    document.getElementById('helpBtn').addEventListener('click', () => {
      this.showHelp();
    });

    // Keyboard shortcut detection (for Mac users)
    if (navigator.platform.includes('Mac')) {
      document.querySelectorAll('.shortcut-keys').forEach(element => {
        element.textContent = element.textContent.replace('Ctrl', 'Cmd');
      });
    }
  }

  setMode(mode) {
    // Remove active class from all mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // Add active class to selected mode
    const selectedBtn = document.querySelector(`[data-mode="${mode}"]`);
    if (selectedBtn) {
      selectedBtn.classList.add('active');
      this.settings.mode = mode;
      this.saveSettings();
    }
  }

  updateUI() {
    // Update master toggle
    const masterToggle = document.getElementById('masterToggle');
    masterToggle.checked = this.isEnabled;

    // Update status
    this.updateStatus();

    // Show/hide content based on enabled state
    const popupContent = document.getElementById('popupContent');
    const disabledContent = document.getElementById('disabledContent');

    if (this.isEnabled) {
      popupContent.style.display = 'block';
      disabledContent.style.display = 'none';
    } else {
      popupContent.style.display = 'none';
      disabledContent.style.display = 'block';
    }

    // Update feature checkboxes
    const featureCheckboxes = ['grammarCheck', 'humanization', 'styleEnhancement'];
    featureCheckboxes.forEach(id => {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.checked = this.settings[id] !== false;
      }
    });

    // Update tone selection
    const toneSelect = document.getElementById('toneSelect');
    if (toneSelect) {
      toneSelect.value = this.settings.tone || 'professional';
    }

    // Update intensity slider
    const intensitySlider = document.getElementById('intensitySlider');
    if (intensitySlider) {
      intensitySlider.value = this.settings.intensity || 0.7;
      this.updateIntensityDisplay();
    }

    // Update mode selection
    if (this.settings.mode) {
      this.setMode(this.settings.mode);
    }
  }

  updateStatus() {
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');

    if (this.isEnabled) {
      statusIcon.textContent = '🟢';
      statusText.textContent = 'Active';
    } else {
      statusIcon.textContent = '🔴';
      statusText.textContent = 'Disabled';
    }
  }

  updateIntensityDisplay() {
    const intensityValue = document.getElementById('intensityValue');
    const slider = document.getElementById('intensitySlider');
    if (intensityValue && slider) {
      const percentage = Math.round(slider.value * 100);
      intensityValue.textContent = `${percentage}%`;
    }
  }

  async checkAIAvailability() {
    const apiIndicator = document.getElementById('apiIndicator');
    const apiText = document.getElementById('apiText');
    const aiStatus = document.getElementById('aiStatus');

    try {
      // Check if Chrome AI API is available
      if ('ai' in navigator && navigator.ai.languageModel) {
        // Try to create a session to verify AI is working
        const session = await navigator.ai.languageModel.create({
          systemPrompt: 'Test prompt for availability check.'
        });
        
        if (session) {
          apiIndicator.textContent = '✅';
          apiText.textContent = 'AI Available';
          aiStatus.textContent = 'AI Ready';
          
          // Clean up test session
          session.destroy?.();
        } else {
          throw new Error('Failed to create AI session');
        }
      } else {
        throw new Error('Chrome AI API not available');
      }
    } catch (error) {
      console.warn('AI availability check failed:', error);
      apiIndicator.textContent = '❌';
      apiText.textContent = 'AI Unavailable';
      aiStatus.textContent = 'AI Not Ready';
      
      // Show fallback message
      this.showAIUnavailableMessage();
    }
  }

  showAIUnavailableMessage() {
    // You could show a more detailed message about AI availability
    const helpMessage = document.createElement('div');
    helpMessage.className = 'ai-help-message';
    helpMessage.innerHTML = `
      <div style="padding: 8px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; margin: 8px 0; font-size: 12px;">
        <strong>Chrome AI API not available</strong><br>
        This extension requires Chrome 120+ with AI features enabled. Basic functionality may be limited.
      </div>
    `;
    
    const statusBar = document.querySelector('.status-bar');
    if (statusBar && !document.querySelector('.ai-help-message')) {
      statusBar.appendChild(helpMessage);
    }
  }

  async loadSessionStats() {
    try {
      // In a real implementation, you'd load these from storage
      const result = await chrome.storage.local.get(['sessionStats']);
      this.stats = { ...this.stats, ...(result.sessionStats || {}) };
      this.updateStatsDisplay();
    } catch (error) {
      console.error('Failed to load session stats:', error);
    }
  }

  updateStatsDisplay() {
    const elements = {
      textsProcessed: document.getElementById('textsProcessed'),
      suggestionsMade: document.getElementById('suggestionsMade'),
      improvementScore: document.getElementById('improvementScore'),
      timesSaved: document.getElementById('timesSaved')
    };

    if (elements.textsProcessed) {
      elements.textsProcessed.textContent = this.stats.textsProcessed.toString();
    }
    if (elements.suggestionsMade) {
      elements.suggestionsMade.textContent = this.stats.suggestionsMade.toString();
    }
    if (elements.improvementScore) {
      elements.improvementScore.textContent = `${this.stats.improvementScore}%`;
    }
    if (elements.timesSaved) {
      const minutes = Math.floor(this.stats.timesSaved / 60);
      const seconds = this.stats.timesSaved % 60;
      const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      elements.timesSaved.textContent = timeString;
    }
  }

  showHelp() {
    const helpContent = `
# AI Writing Assistant Help

## Getting Started
1. Toggle the extension on/off using the main switch
2. Select your preferred mode (Auto, Grammar, Humanize, or Enhance)
3. Customize features and tone settings
4. Start typing in any text field to see suggestions

## Modes
- **Auto**: Automatically detects and suggests all improvements
- **Grammar**: Focus on grammar and spelling corrections
- **Humanize**: Make AI-generated text sound more natural
- **Enhance**: Improve style, clarity, and engagement

## Features
- **Grammar Check**: Real-time grammar and spelling corrections
- **Text Humanization**: Makes robotic text sound more natural
- **Style Enhancement**: Improves clarity, conciseness, and flow

## Keyboard Shortcuts
- **Ctrl+Shift+A** (Cmd+Shift+A on Mac): Toggle assistant
- **Ctrl+Shift+G**: Quick grammar check
- **Ctrl+Shift+H**: Quick text humanization

## Troubleshooting
If the AI status shows "Not Ready":
1. Ensure you're using Chrome 120 or later
2. Check that Chrome's AI features are enabled
3. Restart Chrome and try again

For additional help, visit our support page.
    `;

    // Create a simple modal-like display
    const helpModal = document.createElement('div');
    helpModal.className = 'help-modal';
    helpModal.innerHTML = `
      <div class="help-modal-content">
        <div class="help-header">
          <h2>Help & Support</h2>
          <button class="close-help" onclick="this.parentElement.parentElement.parentElement.remove()">✕</button>
        </div>
        <div class="help-body">
          <pre style="white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.4;">${helpContent}</pre>
        </div>
      </div>
    `;

    helpModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    helpModal.querySelector('.help-modal-content').style.cssText = `
      background: white;
      border-radius: 8px;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    `;

    helpModal.querySelector('.help-header').style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
    `;

    helpModal.querySelector('.help-body').style.cssText = `
      padding: 20px;
    `;

    helpModal.querySelector('.close-help').style.cssText = `
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
    `;

    document.body.appendChild(helpModal);

    // Close on background click
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) {
        helpModal.remove();
      }
    });
  }

  showLoading(show = true) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = show ? 'flex' : 'none';
    }
  }

  async refreshData() {
    this.showLoading(true);
    try {
      await this.loadSettings();
      await this.loadSessionStats();
      this.updateUI();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      this.showLoading(false);
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new AIWritingPopup();
});

// Handle popup closing/opening
window.addEventListener('focus', () => {
  // Refresh data when popup gains focus
  if (window.popupInstance) {
    window.popupInstance.refreshData();
  }
});

// Store instance globally for debugging
window.addEventListener('load', () => {
  window.popupInstance = new AIWritingPopup();
});