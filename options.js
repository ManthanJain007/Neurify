// AI Writing Assistant Pro - Options Page JavaScript
// Comprehensive settings management with API key configuration

class OptionsController {
  constructor() {
    this.settings = {};
    this.originalSettings = {};
    this.isLoading = false;
    this.hasUnsavedChanges = false;
    
    this.initialize();
  }

  async initialize() {
    try {
      this.showLoading(true);
      
      // Load current settings
      await this.loadSettings();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Update UI with loaded settings
      this.updateUI();
      
      // Test API if key exists
      if (this.settings.apiKey) {
        await this.testApiKey(this.settings.apiKey);
      }
      
      this.showLoading(false);
      
    } catch (error) {
      console.error('Failed to initialize options:', error);
      this.showNotification('Failed to load settings', 'error');
      this.showLoading(false);
    }
  }

  async loadSettingsWithFallback() {
    try {
      return await chrome.storage.sync.get(null);
    } catch (error) {
      console.warn('Failed to load settings from sync storage:', error);
      // Return empty object to use defaults
      return {};
    }
  }

  async loadSettings() {
    try {
      // Load from Chrome storage with error handling
      const result = await this.loadSettingsWithFallback();
      
      // Set defaults for missing values
      this.settings = {
        // API Configuration
        apiKey: result.apiKey || '',
        
        // Core Features
        grammarCheck: result.grammarCheck !== false,
        spellingMechanics: result.spellingMechanics !== false,
        styleEnhancement: result.styleEnhancement !== false,
        textHumanization: result.textHumanization !== false,
        
        // Tone & Persona
        defaultTone: result.defaultTone || 'professional',
        autoToneDetection: result.autoToneDetection !== false,
        
        // Personalization
        personalDictionary: result.personalDictionary || '',
        learnFromCorrections: result.learnFromCorrections !== false,
        adaptiveSuggestions: result.adaptiveSuggestions !== false,
        
        // Site Configuration
        allowedSites: result.allowedSites || '',
        blockedSites: result.blockedSites || '',
        
        // Privacy
        localProcessing: result.localProcessing !== false,
        anonymousAnalytics: result.anonymousAnalytics || false
      };
      
      // Keep a copy of original settings for change detection
      this.originalSettings = JSON.parse(JSON.stringify(this.settings));
      
    } catch (error) {
      console.error('Error loading settings:', error);
      throw error;
    }
  }

  setupEventListeners() {
    // API Key input and toggle
    const apiKeyInput = document.getElementById('gemini-api-key');
    const toggleApiKey = document.getElementById('toggle-api-key');
    
    apiKeyInput.addEventListener('input', (e) => {
      this.updateSetting('apiKey', e.target.value);
      this.debounceApiTest(e.target.value);
    });
    
    toggleApiKey.addEventListener('click', () => {
      const type = apiKeyInput.type === 'password' ? 'text' : 'password';
      apiKeyInput.type = type;
      toggleApiKey.textContent = type === 'password' ? '👁️' : '🙈';
    });

    // Core feature checkboxes
    const coreFeatures = ['grammarCheck', 'spellingMechanics', 'styleEnhancement', 'textHumanization'];
    coreFeatures.forEach(feature => {
      const checkbox = document.getElementById(feature);
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          this.updateSetting(feature, e.target.checked);
        });
      }
    });

    // Tone settings
    const defaultToneSelect = document.getElementById('default-tone');
    const autoToneDetection = document.getElementById('auto-tone-detection');
    
    defaultToneSelect.addEventListener('change', (e) => {
      this.updateSetting('defaultTone', e.target.value);
    });
    
    autoToneDetection.addEventListener('change', (e) => {
      this.updateSetting('autoToneDetection', e.target.checked);
    });

    // Personalization
    const personalDictionary = document.getElementById('personal-dictionary');
    const learnFromCorrections = document.getElementById('learn-from-corrections');
    const adaptiveSuggestions = document.getElementById('adaptive-suggestions');
    
    personalDictionary.addEventListener('input', (e) => {
      this.updateSetting('personalDictionary', e.target.value);
    });
    
    learnFromCorrections.addEventListener('change', (e) => {
      this.updateSetting('learnFromCorrections', e.target.checked);
    });
    
    adaptiveSuggestions.addEventListener('change', (e) => {
      this.updateSetting('adaptiveSuggestions', e.target.checked);
    });

    // Site configuration
    const allowedSites = document.getElementById('allowed-sites');
    const blockedSites = document.getElementById('blocked-sites');
    
    allowedSites.addEventListener('input', (e) => {
      this.updateSetting('allowedSites', e.target.value);
    });
    
    blockedSites.addEventListener('input', (e) => {
      this.updateSetting('blockedSites', e.target.value);
    });

    // Privacy settings
    const localProcessing = document.getElementById('local-processing');
    const anonymousAnalytics = document.getElementById('anonymous-analytics');
    
    localProcessing.addEventListener('change', (e) => {
      this.updateSetting('localProcessing', e.target.checked);
    });
    
    anonymousAnalytics.addEventListener('change', (e) => {
      this.updateSetting('anonymousAnalytics', e.target.checked);
    });

    // Action buttons
    document.getElementById('save-settings').addEventListener('click', () => {
      this.saveSettings();
    });
    
    document.getElementById('reset-defaults').addEventListener('click', () => {
      this.resetToDefaults();
    });
    
    document.getElementById('export-settings').addEventListener('click', () => {
      this.exportSettings();
    });
    
    document.getElementById('import-settings').addEventListener('click', () => {
      this.importSettings();
    });
    
    document.getElementById('clear-all-data').addEventListener('click', () => {
      this.clearAllData();
    });

    // Warning before leaving with unsaved changes
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    });
  }

  updateUI() {
    // API Key
    document.getElementById('gemini-api-key').value = this.settings.apiKey;
    
    // Core Features
    document.getElementById('grammarCheck').checked = this.settings.grammarCheck;
    document.getElementById('spellingMechanics').checked = this.settings.spellingMechanics;
    document.getElementById('styleEnhancement').checked = this.settings.styleEnhancement;
    document.getElementById('textHumanization').checked = this.settings.textHumanization;
    
    // Tone Settings
    document.getElementById('default-tone').value = this.settings.defaultTone;
    document.getElementById('auto-tone-detection').checked = this.settings.autoToneDetection;
    
    // Personalization
    document.getElementById('personal-dictionary').value = this.settings.personalDictionary;
    document.getElementById('learn-from-corrections').checked = this.settings.learnFromCorrections;
    document.getElementById('adaptive-suggestions').checked = this.settings.adaptiveSuggestions;
    
    // Site Configuration
    document.getElementById('allowed-sites').value = this.settings.allowedSites;
    document.getElementById('blocked-sites').value = this.settings.blockedSites;
    
    // Privacy Settings
    document.getElementById('local-processing').checked = this.settings.localProcessing;
    document.getElementById('anonymous-analytics').checked = this.settings.anonymousAnalytics;
  }

  updateSetting(key, value) {
    this.settings[key] = value;
    this.checkForChanges();
  }

  checkForChanges() {
    const hasChanges = JSON.stringify(this.settings) !== JSON.stringify(this.originalSettings);
    
    if (hasChanges !== this.hasUnsavedChanges) {
      this.hasUnsavedChanges = hasChanges;
      this.updateSaveButtonState();
    }
  }

  updateSaveButtonState() {
    const saveBtn = document.getElementById('save-settings');
    if (this.hasUnsavedChanges) {
      saveBtn.textContent = 'Save Changes ●';
      saveBtn.classList.add('btn-warning');
    } else {
      saveBtn.textContent = 'Save All Settings';
      saveBtn.classList.remove('btn-warning');
    }
  }

  // API Key Testing
  debounceApiTest(apiKey) {
    if (this.apiTestTimeout) {
      clearTimeout(this.apiTestTimeout);
    }
    
    if (apiKey.trim()) {
      this.apiTestTimeout = setTimeout(() => {
        this.testApiKey(apiKey);
      }, 1000);
    } else {
      this.updateApiStatus('not-configured', 'Not configured');
    }
  }

  async testApiKey(apiKey) {
    if (!apiKey.trim()) {
      this.updateApiStatus('not-configured', 'Not configured');
      return;
    }

    this.updateApiStatus('testing', 'Testing API key...');
    
    try {
      // Test the API key with a simple request
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Test' }]
          }],
          generationConfig: {
            maxOutputTokens: 10,
            temperature: 0.1
          }
        })
      });

      if (response.ok) {
        this.updateApiStatus('ready', 'API key is valid');
      } else {
        const errorData = await response.json();
        this.updateApiStatus('error', `API Error: ${errorData.error?.message || 'Invalid key'}`);
      }
    } catch (error) {
      console.error('API test failed:', error);
      this.updateApiStatus('error', 'Connection failed');
    }
  }

  updateApiStatus(status, message) {
    const statusDot = document.getElementById('api-status-dot');
    const statusText = document.getElementById('api-status-text');
    
    statusDot.className = `status-indicator ${status}`;
    statusText.textContent = message;
  }

  async saveSettings() {
    try {
      this.showLoading(true);
      
      // Validate API key if provided
      if (this.settings.apiKey && this.settings.apiKey.trim()) {
        await this.testApiKey(this.settings.apiKey);
      }
      
      // Save to Chrome storage
      await chrome.storage.sync.set(this.settings);
      
      // Update original settings
      this.originalSettings = JSON.parse(JSON.stringify(this.settings));
      this.hasUnsavedChanges = false;
      this.updateSaveButtonState();
      
      // Notify background script of changes
      chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: this.settings
      });
      
      this.showNotification('Settings saved successfully', 'success');
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showNotification('Failed to save settings', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async resetToDefaults() {
    const confirmed = confirm('Are you sure you want to reset all settings to defaults? This will clear your API key and all customizations.');
    
    if (!confirmed) return;
    
    try {
      this.showLoading(true);
      
      // Clear all storage
      await chrome.storage.sync.clear();
      
      // Reset to defaults
      this.settings = {
        apiKey: '',
        grammarCheck: true,
        spellingMechanics: true,
        styleEnhancement: true,
        textHumanization: true,
        defaultTone: 'professional',
        autoToneDetection: true,
        personalDictionary: '',
        learnFromCorrections: true,
        adaptiveSuggestions: true,
        allowedSites: '',
        blockedSites: '',
        localProcessing: true,
        anonymousAnalytics: false
      };
      
      this.originalSettings = JSON.parse(JSON.stringify(this.settings));
      this.hasUnsavedChanges = false;
      
      // Update UI
      this.updateUI();
      this.updateSaveButtonState();
      this.updateApiStatus('not-configured', 'Not configured');
      
      this.showNotification('Settings reset to defaults', 'success');
      
    } catch (error) {
      console.error('Failed to reset settings:', error);
      this.showNotification('Failed to reset settings', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  exportSettings() {
    try {
      // Create exportable data (exclude sensitive info like API key)
      const exportData = {
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        settings: {
          ...this.settings,
          apiKey: '' // Don't export API key for security
        }
      };
      
      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-writing-assistant-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showNotification('Settings exported successfully', 'success');
      
    } catch (error) {
      console.error('Export failed:', error);
      this.showNotification('Failed to export settings', 'error');
    }
  }

  importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        this.showLoading(true);
        
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Validate import data
        if (!data.settings) {
          throw new Error('Invalid settings file format');
        }
        
        // Merge imported settings (preserve current API key)
        const importedSettings = {
          ...data.settings,
          apiKey: this.settings.apiKey // Keep current API key
        };
        
        // Update current settings
        Object.assign(this.settings, importedSettings);
        
        // Update UI
        this.updateUI();
        this.checkForChanges();
        
        this.showNotification('Settings imported successfully', 'success');
        
      } catch (error) {
        console.error('Import failed:', error);
        this.showNotification('Failed to import settings: ' + error.message, 'error');
      } finally {
        this.showLoading(false);
      }
    });
    
    input.click();
  }

  async clearAllData() {
    const confirmed = confirm('Are you sure you want to clear ALL data? This will:
• Remove all settings
• Clear API key
• Delete personal dictionary
• Clear learning data
• Reset analytics

This action cannot be undone.');
    
    if (!confirmed) return;
    
    try {
      this.showLoading(true);
      
      // Clear all storage
      await chrome.storage.sync.clear();
      await chrome.storage.local.clear();
      
      // Notify background script
      chrome.runtime.sendMessage({ action: 'clearAllData' });
      
      this.showNotification('All data cleared successfully', 'success');
      
      // Reload page to reset state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Failed to clear data:', error);
      this.showNotification('Failed to clear data', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  showLoading(show) {
    this.isLoading = show;
    document.body.style.pointerEvents = show ? 'none' : 'auto';
    document.body.style.opacity = show ? '0.6' : '1';
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      background: ${colors[type] || colors.info};
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideInRight 0.3s ease-out;
      max-width: 400px;
      word-wrap: break-word;
    `;

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
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
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

.btn-warning {
  background: var(--warning-color) !important;
  border-color: var(--warning-color) !important;
  color: white !important;
}
`;
document.head.appendChild(style);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new OptionsController();
  });
} else {
  new OptionsController();
}

// AI Writing Assistant Options Page

class AIWritingOptions {
  constructor() {
    this.settings = {};
    this.defaultSettings = {
      // General
      masterEnable: true,
      defaultMode: 'auto',
      primaryLanguage: 'en-US',
      
      // Features
      grammarCheckFeature: true,
      humanizationFeature: true,
      styleEnhancementFeature: true,
      toneAdjustment: true,
      contextualSuggestions: true,
      readabilityAnalysis: true,
      plagiarismDetection: false,
      
      // AI Settings
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
      localProcessingOnly: true,
      collectUsageStats: false
    };

    this.currentSection = 'general';
    this.unsavedChanges = false;
    this.initialize();
  }

  async initialize() {
    await this.loadSettings();
    this.setupEventListeners();
    this.populateFields();
    this.updateSaveStatus('All changes saved');
  }

  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      this.settings = { ...this.defaultSettings, ...(response.settings || {}) };
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = { ...this.defaultSettings };
    }
  }

  async saveSettings() {
    try {
      await chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: this.settings,
        isEnabled: this.settings.masterEnable
      });
      
      this.unsavedChanges = false;
      this.updateSaveStatus('All changes saved');
      this.showNotification('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showNotification('Failed to save settings. Please try again.', 'error');
    }
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        this.switchSection(e.target.dataset.section);
      });
    });

    // Form inputs
    this.setupInputListeners();

    // Buttons
    document.getElementById('saveBtn').addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      this.showConfirm('Reset all settings to defaults?', () => {
        this.resetToDefaults();
      });
    });

    document.getElementById('exportBtn').addEventListener('click', () => {
      this.exportSettings();
    });

    document.getElementById('importBtn').addEventListener('click', () => {
      document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', (e) => {
      this.importSettings(e.target.files[0]);
    });

    document.getElementById('clearDataBtn').addEventListener('click', () => {
      this.showConfirm('Clear all extension data? This cannot be undone.', () => {
        this.clearAllData();
      });
    });

    // About section buttons
    document.getElementById('helpBtn').addEventListener('click', () => {
      this.openHelp();
    });

    document.getElementById('feedbackBtn').addEventListener('click', () => {
      this.openFeedback();
    });

    document.getElementById('licenseBtn').addEventListener('click', () => {
      this.showLicense();
    });

    // Special handlers
    document.getElementById('suggestionIntensity').addEventListener('input', (e) => {
      this.updateIntensityDisplay(e.target.value);
    });

    // Window beforeunload
    window.addEventListener('beforeunload', (e) => {
      if (this.unsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    });
  }

  setupInputListeners() {
    // Checkboxes
    const checkboxes = [
      'masterEnable', 'grammarCheckFeature', 'humanizationFeature', 
      'styleEnhancementFeature', 'toneAdjustment', 'contextualSuggestions',
      'readabilityAnalysis', 'plagiarismDetection', 'autoToneDetection',
      'showFloatingToolbar', 'showWordCount', 'showReadabilityScore',
      'showNotifications', 'soundEffects', 'localProcessingOnly',
      'collectUsageStats'
    ];

    checkboxes.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', (e) => {
          this.settings[id] = e.target.checked;
          this.markUnsaved();
        });
      }
    });

    // Select dropdowns
    const selects = [
      'defaultMode', 'primaryLanguage', 'defaultTone', 'analysisDelay'
    ];

    selects.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', (e) => {
          this.settings[id] = e.target.value;
          this.markUnsaved();
        });
      }
    });

    // Range sliders
    const ranges = ['suggestionIntensity'];

    ranges.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('input', (e) => {
          this.settings[id] = parseFloat(e.target.value);
          this.markUnsaved();
        });
      }
    });

    // Color pickers
    const colors = ['grammarColor', 'styleColor', 'toneColor'];

    colors.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', (e) => {
          this.settings[id] = e.target.value;
          this.markUnsaved();
        });
      }
    });

    // Textareas
    const textareas = ['allowedSites', 'blockedSites', 'personalDictionary'];

    textareas.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('input', (e) => {
          this.settings[id] = e.target.value;
          this.markUnsaved();
        });
      }
    });
  }

  populateFields() {
    // Checkboxes
    Object.keys(this.settings).forEach(key => {
      const element = document.getElementById(key);
      if (element && element.type === 'checkbox') {
        element.checked = this.settings[key];
      } else if (element && (element.tagName === 'SELECT' || element.type === 'range' || element.type === 'color')) {
        element.value = this.settings[key];
      } else if (element && element.tagName === 'TEXTAREA') {
        element.value = this.settings[key] || '';
      }
    });

    this.updateIntensityDisplay(this.settings.suggestionIntensity);
  }

  switchSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.settings-section').forEach(section => {
      section.classList.remove('active');
    });

    // Remove active from nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(sectionName);
    const navItem = document.querySelector(`[data-section="${sectionName}"]`);

    if (targetSection && navItem) {
      targetSection.classList.add('active');
      navItem.classList.add('active');
      this.currentSection = sectionName;
    }
  }

  updateIntensityDisplay(value) {
    const display = document.getElementById('intensityDisplay');
    if (display) {
      display.textContent = `${Math.round(value * 100)}%`;
    }
  }

  markUnsaved() {
    this.unsavedChanges = true;
    this.updateSaveStatus('Unsaved changes');
  }

  updateSaveStatus(message) {
    const statusElement = document.getElementById('saveStatus');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = this.unsavedChanges ? 'unsaved' : 'saved';
    }
  }

  resetToDefaults() {
    this.settings = { ...this.defaultSettings };
    this.populateFields();
    this.markUnsaved();
    this.showNotification('Settings reset to defaults', 'info');
  }

  exportSettings() {
    const settingsJson = JSON.stringify(this.settings, null, 2);
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-writing-assistant-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showNotification('Settings exported successfully', 'success');
  }

  async importSettings(file) {
    if (!file) return;

    try {
      const text = await file.text();
      const importedSettings = JSON.parse(text);
      
      // Validate imported settings
      const validSettings = {};
      Object.keys(this.defaultSettings).forEach(key => {
        if (importedSettings.hasOwnProperty(key)) {
          validSettings[key] = importedSettings[key];
        }
      });

      this.settings = { ...this.defaultSettings, ...validSettings };
      this.populateFields();
      this.markUnsaved();
      this.showNotification('Settings imported successfully', 'success');
    } catch (error) {
      console.error('Failed to import settings:', error);
      this.showNotification('Failed to import settings. Invalid file format.', 'error');
    }
  }

  async clearAllData() {
    try {
      await chrome.storage.sync.clear();
      await chrome.storage.local.clear();
      
      this.settings = { ...this.defaultSettings };
      this.populateFields();
      this.unsavedChanges = false;
      this.updateSaveStatus('All data cleared');
      this.showNotification('All extension data cleared', 'info');
    } catch (error) {
      console.error('Failed to clear data:', error);
      this.showNotification('Failed to clear data', 'error');
    }
  }

  showConfirm(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const messageElement = document.getElementById('confirmMessage');
    const cancelBtn = document.getElementById('confirmCancel');
    const okBtn = document.getElementById('confirmOk');

    messageElement.textContent = message;
    modal.style.display = 'flex';

    const handleCancel = () => {
      modal.style.display = 'none';
      cancelBtn.removeEventListener('click', handleCancel);
      okBtn.removeEventListener('click', handleOk);
    };

    const handleOk = () => {
      modal.style.display = 'none';
      onConfirm();
      cancelBtn.removeEventListener('click', handleCancel);
      okBtn.removeEventListener('click', handleOk);
    };

    cancelBtn.addEventListener('click', handleCancel);
    okBtn.addEventListener('click', handleOk);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        handleCancel();
      }
    });
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <span class="notification-message">${message}</span>
      <button class="notification-close">×</button>
    `;

    // Style the notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      min-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    document.body.appendChild(notification);

    // Auto remove after 4 seconds
    const removeNotification = () => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    };

    // Close button
    notification.querySelector('.notification-close').addEventListener('click', removeNotification);
    
    setTimeout(removeNotification, 4000);
  }

  openHelp() {
    const helpUrl = 'https://example.com/help'; // Replace with actual help URL
    chrome.tabs.create({ url: helpUrl });
  }

  openFeedback() {
    const feedbackUrl = 'mailto:support@example.com?subject=AI Writing Assistant Feedback';
    chrome.tabs.create({ url: feedbackUrl });
  }

  showLicense() {
    const licenseText = `
MIT License

Copyright (c) 2024 AI Writing Assistant

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
    `;

    // Show license in a modal-like overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    overlay.innerHTML = `
      <div style="
        background: white;
        border-radius: 8px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        ">
          <h2 style="margin: 0; font-size: 18px;">License</h2>
          <button style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            padding: 4px;
          " onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
        </div>
        <div style="padding: 20px;">
          <pre style="
            white-space: pre-wrap;
            font-family: Monaco, monospace;
            font-size: 12px;
            line-height: 1.4;
            color: #374151;
          ">${licenseText}</pre>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }
}

// Initialize options page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new AIWritingOptions();
});