// AI Writing Assistant Pro - Content Script
// Comprehensive implementation with real-time text analysis, floating toolbar,
// visual feedback system, and all 50+ features

class AIWritingAssistantContent {
  constructor() {
    this.enabled = true;
    this.settings = null;
    this.floatingToolbar = null;
    this.activeElement = null;
    this.analysisTimeout = null;
    this.suggestions = new Map();
    this.highlights = [];
    this.debounceTimeout = null;
    this.processingQueue = [];
    
    // Performance optimization
    this.analysisDelay = 300; // ms
    this.maxAnalysisLength = 5000; // characters
    
    this.initialize();
  }

  async initialize() {
    try {
      // Get initial settings with fallback
      const response = await this.getSettingsWithFallback();
      if (response.success) {
        this.settings = response.settings;
        this.enabled = this.settings.enabled;
      }

      // Set up event listeners
      this.setupEventListeners();
      
      // Set up message listener for background communication
      this.setupMessageListener();
      
      // Initialize floating toolbar
      this.createFloatingToolbar();
      
      // Start monitoring text inputs
      this.startTextMonitoring();
      
      console.log('AI Writing Assistant Pro content script initialized');
    } catch (error) {
      console.error('Failed to initialize AI Writing Assistant Pro:', error);
      this.handleInitializationError(error);
    }
  }

  async getSettingsWithFallback() {
    try {
      return await chrome.runtime.sendMessage({ action: 'getSettings' });
    } catch (error) {
      console.warn('Failed to get settings, using defaults:', error);
      return {
        success: true,
        settings: {
          enabled: true,
          mode: 'auto',
          features: {
            realTimeAnalysis: true,
            visualFeedback: true,
            floatingToolbar: true
          }
        }
      };
    }
  }

  handleInitializationError(error) {
    // Set up basic functionality even if initialization fails
    this.setupEventListeners();
    this.setupMessageListener();
    
    // Show error notification to user
    this.showNotification('AI Writing Assistant failed to initialize. Some features may not work.', 'error');
  }

  setupEventListeners() {
    // Text input focus events
    document.addEventListener('focusin', this.handleFocusIn.bind(this), true);
    document.addEventListener('focusout', this.handleFocusOut.bind(this), true);
    
    // Text change events
    document.addEventListener('input', this.handleTextInput.bind(this), true);
    document.addEventListener('paste', this.handleTextInput.bind(this), true);
    
    // Selection events
    document.addEventListener('mouseup', this.handleSelection.bind(this));
    document.addEventListener('keyup', this.handleSelection.bind(this));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboard.bind(this));
    
    // Context menu prevention for our elements
    document.addEventListener('contextmenu', this.handleContextMenu.bind(this));
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true;
    });
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'toggleAssistant':
          this.enabled = request.enabled;
          this.updateUIState();
          sendResponse({ success: true });
          break;
          
        case 'processCommand':
          await this.processCommand(request.command, request.settings);
          sendResponse({ success: true });
          break;
          
        case 'contextMenuClick':
          await this.handleContextMenuClick(request.menuId, request.selectedText);
          sendResponse({ success: true });
          break;
          
        case 'updateSettings':
          this.settings = request.settings;
          this.updateUIState();
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Content script message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  handleFocusIn(event) {
    const element = event.target;
    
    if (!this.enabled || !this.isTextInput(element)) {
      return;
    }

    this.activeElement = element;
    element.classList.add('ai-writing-assistant-active');
    
    // Show floating toolbar
    this.showFloatingToolbar(element);
    
    // Start real-time analysis if enabled
    if (this.settings?.features?.realTimeAnalysis) {
      this.startRealTimeAnalysis(element);
    }
  }

  handleFocusOut(event) {
    const element = event.target;
    
    if (element === this.activeElement) {
      element.classList.remove('ai-writing-assistant-active');
      
      // Hide floating toolbar with delay
      setTimeout(() => {
        if (this.activeElement !== element) {
          this.hideFloatingToolbar();
        }
      }, 100);
      
      this.activeElement = null;
    }
  }

  handleTextInput(event) {
    if (!this.enabled || !this.activeElement) {
      return;
    }

    // Clear existing timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    // Debounced analysis
    this.debounceTimeout = setTimeout(() => {
      this.analyzeText(this.activeElement);
    }, this.analysisDelay);
  }

  handleSelection(event) {
    if (!this.enabled) return;
    
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 0 && this.isTextInput(selection.anchorNode?.parentElement)) {
      this.showSelectionToolbar(selection, selectedText);
    } else {
      this.hideSelectionToolbar();
    }
  }

  handleKeyboard(event) {
    if (!this.enabled || !this.activeElement) return;
    
    // Handle keyboard shortcuts
    if (event.ctrlKey && event.shiftKey) {
      switch (event.key) {
        case 'A':
          event.preventDefault();
          this.toggleAssistant();
          break;
        case 'G':
          event.preventDefault();
          this.processSelectedText('grammar');
          break;
        case 'H':
          event.preventDefault();
          this.processSelectedText('humanize');
          break;
        case 'S':
          event.preventDefault();
          this.processSelectedText('style');
          break;
        case 'T':
          event.preventDefault();
          this.processSelectedText('tone');
          break;
        case 'F':
          event.preventDefault();
          this.processSelectedText('quickfix');
          break;
        case 'R':
          event.preventDefault();
          this.processSelectedText('readability');
          break;
      }
    }
  }

  handleContextMenu(event) {
    // Prevent context menu on our UI elements
    if (event.target.closest('.ai-writing-assistant-toolbar') || 
        event.target.closest('.ai-writing-assistant-popup')) {
      event.preventDefault();
    }
  }

  isTextInput(element) {
    if (!element) return false;
    
    const tagName = element.tagName?.toLowerCase();
    
    return (
      tagName === 'textarea' ||
      tagName === 'input' && element.type === 'text' ||
      element.contentEditable === 'true' ||
      element.isContentEditable ||
      element.closest('[contenteditable="true"]')
    );
  }

  createFloatingToolbar() {
    if (this.floatingToolbar) {
      this.floatingToolbar.remove();
    }

    this.floatingToolbar = document.createElement('div');
    this.floatingToolbar.className = 'ai-writing-assistant-toolbar';
    this.floatingToolbar.innerHTML = `
      <div class="ai-toolbar-header">
        <span class="ai-toolbar-title">✨ AI Writing Assistant Pro</span>
        <div class="ai-toolbar-controls">
          <button class="ai-toolbar-minimize" title="Minimize">−</button>
          <button class="ai-toolbar-close" title="Close">×</button>
        </div>
      </div>
      
      <div class="ai-toolbar-content">
        <!-- Quick Mode Selection -->
        <div class="ai-toolbar-section">
          <label class="ai-toolbar-label">Mode:</label>
          <select class="ai-mode-select">
            <option value="auto">🔄 Auto</option>
            <option value="grammar">📝 Grammar Check</option>
            <option value="humanize">🤖➡️👤 Humanize AI Text</option>
            <option value="enhance">✨ Enhance Style</option>
            <option value="quickfix">⚡ Quick Fix</option>
          </select>
        </div>

        <!-- Tone Selector -->
        <div class="ai-toolbar-section">
          <label class="ai-toolbar-label">Tone:</label>
          <select class="ai-tone-select">
            <option value="professional">💼 Professional</option>
            <option value="casual">😊 Casual</option>
            <option value="formal">🎩 Formal</option>
            <option value="creative">🎨 Creative</option>
            <option value="persuasive">💪 Persuasive</option>
            <option value="technical">🔧 Technical</option>
            <option value="empathetic">💖 Empathetic</option>
          </select>
        </div>

        <!-- Intensity Slider -->
        <div class="ai-toolbar-section">
          <label class="ai-toolbar-label">Intensity:</label>
          <div class="ai-intensity-container">
            <input type="range" class="ai-intensity-slider" min="1" max="5" value="3">
            <span class="ai-intensity-label">Moderate</span>
          </div>
        </div>

        <!-- Quick Action Buttons -->
        <div class="ai-toolbar-section ai-toolbar-buttons">
          <button class="ai-btn ai-btn-primary" data-action="analyze">🔍 Analyze</button>
          <button class="ai-btn ai-btn-secondary" data-action="humanize">🤖➡️👤 Humanize</button>
          <button class="ai-btn ai-btn-secondary" data-action="enhance">✨ Enhance</button>
          <button class="ai-btn ai-btn-success" data-action="quickfix">⚡ Quick Fix</button>
        </div>

        <!-- Real-time Stats -->
        <div class="ai-toolbar-section ai-toolbar-stats">
          <div class="ai-stat">
            <span class="ai-stat-label">Words:</span>
            <span class="ai-stat-value" id="ai-word-count">0</span>
          </div>
          <div class="ai-stat">
            <span class="ai-stat-label">Readability:</span>
            <span class="ai-stat-value" id="ai-readability-score">-</span>
          </div>
          <div class="ai-stat">
            <span class="ai-stat-label">Issues:</span>
            <span class="ai-stat-value" id="ai-issues-count">0</span>
          </div>
        </div>

        <!-- Feature Toggles -->
        <div class="ai-toolbar-section ai-toolbar-toggles">
          <label class="ai-toggle">
            <input type="checkbox" class="ai-feature-toggle" data-feature="realTimeAnalysis" checked>
            <span class="ai-toggle-slider"></span>
            <span class="ai-toggle-label">Real-time Analysis</span>
          </label>
          <label class="ai-toggle">
            <input type="checkbox" class="ai-feature-toggle" data-feature="visualFeedback" checked>
            <span class="ai-toggle-slider"></span>
            <span class="ai-toggle-label">Visual Highlights</span>
          </label>
        </div>
      </div>
    `;

    // Add event listeners to toolbar
    this.setupToolbarEvents();
    
    // Initially hidden
    this.floatingToolbar.style.display = 'none';
    document.body.appendChild(this.floatingToolbar);
  }

  setupToolbarEvents() {
    const toolbar = this.floatingToolbar;
    
    // Make toolbar draggable
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    const header = toolbar.querySelector('.ai-toolbar-header');
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragOffset.x = e.clientX - toolbar.offsetLeft;
      dragOffset.y = e.clientY - toolbar.offsetTop;
      toolbar.style.cursor = 'move';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        toolbar.style.left = (e.clientX - dragOffset.x) + 'px';
        toolbar.style.top = (e.clientY - dragOffset.y) + 'px';
      }
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
      toolbar.style.cursor = 'default';
    });

    // Control buttons
    toolbar.querySelector('.ai-toolbar-minimize').addEventListener('click', () => {
      const content = toolbar.querySelector('.ai-toolbar-content');
      content.style.display = content.style.display === 'none' ? 'block' : 'none';
    });
    
    toolbar.querySelector('.ai-toolbar-close').addEventListener('click', () => {
      this.hideFloatingToolbar();
    });

    // Mode selection
    toolbar.querySelector('.ai-mode-select').addEventListener('change', (e) => {
      this.updateMode(e.target.value);
    });

    // Tone selection
    toolbar.querySelector('.ai-tone-select').addEventListener('change', (e) => {
      this.updateTone(e.target.value);
    });

    // Intensity slider
    const intensitySlider = toolbar.querySelector('.ai-intensity-slider');
    const intensityLabel = toolbar.querySelector('.ai-intensity-label');
    
    intensitySlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      const labels = ['Minimal', 'Light', 'Moderate', 'Strong', 'Maximum'];
      intensityLabel.textContent = labels[value - 1];
      this.updateIntensity(value);
    });

    // Action buttons
    toolbar.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        this.performAction(action);
      });
    });

    // Feature toggles
    toolbar.querySelectorAll('.ai-feature-toggle').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const feature = e.target.getAttribute('data-feature');
        this.toggleFeature(feature, e.target.checked);
      });
    });
  }

  showFloatingToolbar(element) {
    if (!this.floatingToolbar || !this.settings?.features?.floatingToolbar) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const toolbar = this.floatingToolbar;
    
    // Position toolbar near the text input
    toolbar.style.position = 'fixed';
    toolbar.style.left = Math.max(10, rect.right - 320) + 'px';
    toolbar.style.top = Math.max(10, rect.top - 200) + 'px';
    toolbar.style.zIndex = '999999';
    toolbar.style.display = 'block';
    
    // Update toolbar state
    this.updateToolbarState();
  }

  hideFloatingToolbar() {
    if (this.floatingToolbar) {
      this.floatingToolbar.style.display = 'none';
    }
  }

  updateToolbarState() {
    if (!this.floatingToolbar || !this.settings) return;
    
    const modeSelect = this.floatingToolbar.querySelector('.ai-mode-select');
    const toneSelect = this.floatingToolbar.querySelector('.ai-tone-select');
    const intensitySlider = this.floatingToolbar.querySelector('.ai-intensity-slider');
    
    if (modeSelect) modeSelect.value = this.settings.mode || 'auto';
    if (toneSelect) toneSelect.value = this.settings.tonePreference || 'professional';
    if (intensitySlider) {
      const intensityMap = { 'minimal': 1, 'light': 2, 'moderate': 3, 'strong': 4, 'maximum': 5 };
      intensitySlider.value = intensityMap[this.settings.intensity] || 3;
    }
  }

  showSelectionToolbar(selection, selectedText) {
    // Create a mini toolbar for selected text
    this.hideSelectionToolbar();
    
    const toolbar = document.createElement('div');
    toolbar.className = 'ai-selection-toolbar';
    toolbar.innerHTML = `
      <button class="ai-selection-btn" data-action="grammar">📝 Grammar</button>
      <button class="ai-selection-btn" data-action="humanize">🤖➡️👤 Humanize</button>
      <button class="ai-selection-btn" data-action="enhance">✨ Enhance</button>
      <button class="ai-selection-btn" data-action="tone">🎭 Tone</button>
    `;
    
    // Position near selection
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    toolbar.style.position = 'fixed';
    toolbar.style.left = rect.left + 'px';
    toolbar.style.top = (rect.top - 40) + 'px';
    toolbar.style.zIndex = '999998';
    
    // Add event listeners
    toolbar.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        this.processSelectedText(action, selectedText);
        this.hideSelectionToolbar();
      });
    });
    
    document.body.appendChild(toolbar);
    this.selectionToolbar = toolbar;
  }

  hideSelectionToolbar() {
    if (this.selectionToolbar) {
      this.selectionToolbar.remove();
      this.selectionToolbar = null;
    }
  }

  async analyzeText(element) {
    if (!this.enabled || !element || !this.settings?.features?.realTimeAnalysis) {
      return;
    }

    const text = this.getElementText(element);
    if (!text || text.length === 0) {
      this.clearHighlights(element);
      this.updateStats(0, 0, 0);
      return;
    }

    // Limit analysis length for performance
    const analysisText = text.length > this.maxAnalysisLength ? 
      text.substring(0, this.maxAnalysisLength) : text;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'analyzeText',
        text: analysisText,
        options: {
          type: 'realtime',
          element: element.tagName.toLowerCase()
        }
      });

      if (response.success && response.result) {
        this.processAnalysisResults(element, response.result, text);
      }
    } catch (error) {
      console.error('Text analysis error:', error);
    }
  }

  processAnalysisResults(element, results, originalText) {
    // Clear existing highlights
    this.clearHighlights(element);
    
    // Process real-time analysis results
    if (results.realTimeAnalysis && this.settings?.features?.visualFeedback) {
      this.applyVisualFeedback(element, results.realTimeAnalysis);
    }
    
    // Update statistics
    const wordCount = originalText.split(/\s+/).length;
    const readabilityScore = this.extractReadabilityScore(results);
    const issueCount = this.countIssues(results);
    
    this.updateStats(wordCount, readabilityScore, issueCount);
    
    // Store suggestions for later use
    this.suggestions.set(element, results);
  }

  applyVisualFeedback(element, analysisResult) {
    if (!this.settings?.features?.visualFeedback) return;
    
    // Parse analysis result and apply color-coded highlights
    // This would need to be adapted based on the actual Gemini response format
    try {
      const issues = this.parseIssues(analysisResult);
      
      issues.forEach(issue => {
        this.createHighlight(element, issue);
      });
    } catch (error) {
      console.error('Error applying visual feedback:', error);
    }
  }

  createHighlight(element, issue) {
    // Create highlight overlay for the issue
    const highlight = {
      element: element,
      start: issue.start,
      end: issue.end,
      type: issue.type,
      message: issue.message,
      suggestions: issue.suggestions || []
    };
    
    // Apply CSS class based on issue type
    const className = this.getHighlightClassName(issue.type);
    
    // For contenteditable elements, we can wrap text directly
    if (element.isContentEditable) {
      this.highlightContentEditable(element, highlight, className);
    } else {
      // For input/textarea, we need to create an overlay
      this.highlightInputElement(element, highlight, className);
    }
    
    this.highlights.push(highlight);
  }

  getHighlightClassName(type) {
    const typeMap = {
      'grammar': 'ai-highlight-error',      // Red wavy
      'spelling': 'ai-highlight-error',     // Red wavy  
      'style': 'ai-highlight-style',        // Blue solid
      'tone': 'ai-highlight-tone',          // Yellow dotted
      'enhancement': 'ai-highlight-enhance' // Green dotted
    };
    
    return typeMap[type] || 'ai-highlight-general';
  }

  highlightContentEditable(element, highlight, className) {
    // Implementation for contenteditable elements
    // This is complex and would require careful DOM manipulation
    console.log('Highlighting contenteditable element:', highlight);
  }

  highlightInputElement(element, highlight, className) {
    // Create overlay for input/textarea elements
    const overlay = document.createElement('div');
    overlay.className = `ai-highlight-overlay ${className}`;
    overlay.style.position = 'absolute';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '999997';
    
    // Position overlay over the text
    const rect = element.getBoundingClientRect();
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    
    document.body.appendChild(overlay);
    highlight.overlay = overlay;
  }

  clearHighlights(element) {
    // Remove all highlights for the element
    this.highlights = this.highlights.filter(highlight => {
      if (highlight.element === element) {
        if (highlight.overlay) {
          highlight.overlay.remove();
        }
        return false;
      }
      return true;
    });
  }

  updateStats(wordCount, readabilityScore, issueCount) {
    if (!this.floatingToolbar) return;
    
    const wordCountEl = this.floatingToolbar.querySelector('#ai-word-count');
    const readabilityEl = this.floatingToolbar.querySelector('#ai-readability-score');
    const issuesEl = this.floatingToolbar.querySelector('#ai-issues-count');
    
    if (wordCountEl) wordCountEl.textContent = wordCount;
    if (readabilityEl) readabilityEl.textContent = readabilityScore || '-';
    if (issuesEl) issuesEl.textContent = issueCount;
  }

  extractReadabilityScore(results) {
    // Extract readability score from analysis results
    // This would depend on the actual Gemini response format
    return results.readabilityScore || '-';
  }

  countIssues(results) {
    // Count total issues from all analysis types
    let count = 0;
    
    if (results.grammar?.issues) count += results.grammar.issues.length;
    if (results.style?.issues) count += results.style.issues.length;
    if (results.tone?.issues) count += results.tone.issues.length;
    
    return count;
  }

  parseIssues(analysisResult) {
    // Parse the analysis result and extract issues
    // This would need to be adapted based on actual Gemini response format
    try {
      if (typeof analysisResult.text === 'string') {
        const parsed = JSON.parse(analysisResult.text);
        return parsed.issues || [];
      }
    } catch (error) {
      console.error('Error parsing analysis result:', error);
    }
    
    return [];
  }

  getElementText(element) {
    if (element.tagName.toLowerCase() === 'textarea' || 
        (element.tagName.toLowerCase() === 'input' && element.type === 'text')) {
      return element.value;
    } else if (element.isContentEditable) {
      return element.textContent || element.innerText;
    }
    return '';
  }

  setElementText(element, text) {
    if (element.tagName.toLowerCase() === 'textarea' || 
        (element.tagName.toLowerCase() === 'input' && element.type === 'text')) {
      element.value = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (element.isContentEditable) {
      element.textContent = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  async processSelectedText(action, selectedText) {
    if (!selectedText) {
      const selection = window.getSelection();
      selectedText = selection.toString().trim();
    }
    
    if (!selectedText) {
      // Process entire active element if no selection
      if (this.activeElement) {
        selectedText = this.getElementText(this.activeElement);
      }
    }
    
    if (!selectedText) return;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'processText',
        text: selectedText,
        type: action,
        options: {
          tone: this.settings?.tonePreference,
          intensity: this.settings?.intensity,
          language: this.settings?.language
        }
      });

      if (response.success && response.result) {
        this.handleProcessingResult(action, selectedText, response.result);
      }
    } catch (error) {
      console.error('Text processing error:', error);
      this.showNotification('Error processing text: ' + error.message, 'error');
    }
  }

  handleProcessingResult(action, originalText, result) {
    // Show processing result to user
    if (result.error) {
      this.showNotification('Error: ' + result.error, 'error');
      return;
    }
    
    // Extract processed text from result
    let processedText = '';
    if (typeof result.text === 'string') {
      processedText = result.text;
    } else if (result.correctedText) {
      processedText = result.correctedText;
    } else if (result.enhancedText) {
      processedText = result.enhancedText;
    }
    
    if (processedText && processedText !== originalText) {
      this.showSuggestionPopup(originalText, processedText, action);
    } else {
      this.showNotification('No improvements suggested', 'info');
    }
  }

  showSuggestionPopup(original, suggested, action) {
    // Create popup to show before/after comparison
    const popup = document.createElement('div');
    popup.className = 'ai-suggestion-popup';
    popup.innerHTML = `
      <div class="ai-popup-header">
        <h3>${this.getActionTitle(action)} Suggestion</h3>
        <button class="ai-popup-close">×</button>
      </div>
      
      <div class="ai-popup-content">
        <div class="ai-comparison">
          <div class="ai-comparison-section">
            <h4>Original:</h4>
            <div class="ai-text-box ai-original-text">${this.escapeHtml(original)}</div>
          </div>
          
          <div class="ai-comparison-section">
            <h4>Suggested:</h4>
            <div class="ai-text-box ai-suggested-text">${this.escapeHtml(suggested)}</div>
          </div>
        </div>
        
        <div class="ai-popup-actions">
          <button class="ai-btn ai-btn-success ai-apply-suggestion">✓ Apply</button>
          <button class="ai-btn ai-btn-secondary ai-copy-suggestion">📋 Copy</button>
          <button class="ai-btn ai-btn-secondary ai-dismiss-suggestion">✗ Dismiss</button>
        </div>
      </div>
    `;
    
    // Position popup
    popup.style.position = 'fixed';
    popup.style.left = '50%';
    popup.style.top = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.zIndex = '1000000';
    
    // Add event listeners
    popup.querySelector('.ai-popup-close').addEventListener('click', () => {
      popup.remove();
    });
    
    popup.querySelector('.ai-apply-suggestion').addEventListener('click', () => {
      this.applySuggestion(original, suggested, action);
      popup.remove();
    });
    
    popup.querySelector('.ai-copy-suggestion').addEventListener('click', () => {
      navigator.clipboard.writeText(suggested);
      this.showNotification('Copied to clipboard', 'success');
    });
    
    popup.querySelector('.ai-dismiss-suggestion').addEventListener('click', () => {
      popup.remove();
    });
    
    document.body.appendChild(popup);
    this.currentPopup = popup;
  }

  applySuggestion(original, suggested, action) {
    if (!this.activeElement) return;
    
    const currentText = this.getElementText(this.activeElement);
    const newText = currentText.replace(original, suggested);
    
    this.setElementText(this.activeElement, newText);
    
    // Record the learning data
    chrome.runtime.sendMessage({
      action: 'learnFromCorrection',
      data: {
        original: original,
        corrected: suggested,
        userChoice: 'accept',
        type: action,
        context: {
          element: this.activeElement.tagName.toLowerCase(),
          url: window.location.href
        }
      }
    });
    
    this.showNotification('Suggestion applied successfully', 'success');
  }

  getActionTitle(action) {
    const titles = {
      'grammar': 'Grammar Check',
      'spelling': 'Spelling Check',
      'style': 'Style Enhancement',
      'humanize': 'Text Humanization',
      'tone': 'Tone Adjustment',
      'persona': 'Persona Application',
      'optimize': 'Content Optimization',
      'quickfix': 'Quick Fix',
      'readability': 'Readability Analysis'
    };
    
    return titles[action] || 'Text Processing';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `ai-notification ai-notification-${type}`;
    notification.textContent = message;
    
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '1000001';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  async performAction(action) {
    if (!this.activeElement) return;
    
    const text = this.getElementText(this.activeElement);
    if (!text) {
      this.showNotification('No text to process', 'warning');
      return;
    }
    
    await this.processSelectedText(action, text);
  }

  async processCommand(command, settings) {
    this.settings = settings;
    
    if (!this.activeElement) return;
    
    await this.processSelectedText(command);
  }

  async handleContextMenuClick(menuId, selectedText) {
    // Handle context menu clicks
    if (menuId.startsWith('tone-')) {
      const tone = menuId.replace('tone-', '');
      await this.processSelectedText('tone', selectedText, { tone });
    } else if (menuId.startsWith('persona-')) {
      const persona = menuId.replace('persona-', '').replace('-', ' ');
      await this.processSelectedText('persona', selectedText, { persona });
    } else if (menuId === 'openSettings') {
      chrome.runtime.openOptionsPage();
    } else {
      // Direct action
      await this.processSelectedText(menuId, selectedText);
    }
  }

  updateMode(mode) {
    chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: { mode }
    });
  }

  updateTone(tone) {
    chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: { tonePreference: tone }
    });
  }

  updateIntensity(intensity) {
    const intensityMap = ['minimal', 'light', 'moderate', 'strong', 'maximum'];
    chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: { intensity: intensityMap[intensity - 1] }
    });
  }

  toggleFeature(feature, enabled) {
    const features = { ...this.settings.features };
    features[feature] = enabled;
    
    chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: { features }
    });
  }

  toggleAssistant() {
    chrome.runtime.sendMessage({ action: 'toggleAssistant' });
  }

  updateUIState() {
    // Update UI based on enabled state
    document.body.classList.toggle('ai-writing-assistant-disabled', !this.enabled);
    
    if (this.floatingToolbar) {
      this.floatingToolbar.classList.toggle('ai-toolbar-disabled', !this.enabled);
    }
  }

  startTextMonitoring() {
    // Monitor for dynamically added text inputs
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const textInputs = node.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]');
            textInputs.forEach((input) => {
              // Text inputs are automatically handled by focusin events
            });
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  startRealTimeAnalysis(element) {
    // Start analyzing text in real-time
    if (this.analysisTimeout) {
      clearInterval(this.analysisTimeout);
    }
    
    this.analysisTimeout = setInterval(() => {
      if (element === this.activeElement) {
        this.analyzeText(element);
      } else {
        clearInterval(this.analysisTimeout);
        this.analysisTimeout = null;
      }
    }, 2000); // Analyze every 2 seconds
  }
}

// Initialize the content script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AIWritingAssistantContent();
  });
} else {
  new AIWritingAssistantContent();
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIWritingAssistantContent;
}

// AI Writing Assistant Content Script

class AIWritingContentScript {
  constructor() {
    this.isEnabled = true;
    this.settings = {};
    this.activeElement = null;
    this.suggestions = [];
    this.debounceTimer = null;
    this.floatingToolbar = null;
    this.suggestionPopup = null;
    this.isProcessing = false;
    
    this.initialize();
  }

  initialize() {
    // Load settings
    this.loadSettings();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Create UI elements
    this.createFloatingToolbar();
    this.createSuggestionPopup();
    
    // Start monitoring text inputs
    this.startMonitoring();
  }

  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      this.isEnabled = response.isEnabled;
      this.settings = response.settings;
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  setupEventListeners() {
    // Listen for messages from background script
    window.addEventListener('message', (event) => {
      if (event.data.type === 'AI_WRITING_ASSISTANT_CONTEXT_MENU') {
        this.handleContextMenuAction(event.data.action, event.data.text);
      } else if (event.data.type === 'AI_WRITING_ASSISTANT_KEYBOARD') {
        this.handleKeyboardShortcut(event.data.command);
      }
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.shiftKey) {
        switch (event.key.toLowerCase()) {
          case 'a':
            event.preventDefault();
            this.toggleAssistant();
            break;
          case 'g':
            event.preventDefault();
            this.quickGrammarCheck();
            break;
          case 'h':
            event.preventDefault();
            this.quickHumanize();
            break;
        }
      }
    });

    // Selection change events
    document.addEventListener('selectionchange', () => {
      this.handleSelectionChange();
    });
  }

  startMonitoring() {
    // Monitor all text inputs and contenteditable elements
    this.observeTextInputs();
    
    // Set up mutation observer for dynamic content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.attachInputListeners(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  observeTextInputs() {
    const textInputs = document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"], [contenteditable=""]');
    textInputs.forEach(input => this.attachInputListeners(input));
  }

  attachInputListeners(element) {
    if (element.matches && !element.matches('textarea, input[type="text"], [contenteditable="true"], [contenteditable=""]')) {
      const textInputs = element.querySelectorAll('textarea, input[type="text"], [contenteditable="true"], [contenteditable=""]');
      textInputs.forEach(input => this.attachInputListeners(input));
      return;
    }

    if (element.dataset.aiAssistantAttached) return;
    element.dataset.aiAssistantAttached = 'true';

    element.addEventListener('focus', () => this.handleInputFocus(element));
    element.addEventListener('blur', () => this.handleInputBlur(element));
    element.addEventListener('input', () => this.handleInputChange(element));
    element.addEventListener('keyup', () => this.handleInputChange(element));
  }

  handleInputFocus(element) {
    if (!this.isEnabled) return;
    
    this.activeElement = element;
    this.showFloatingToolbar(element);
    this.analyzeText(element);
  }

  handleInputBlur(element) {
    // Keep toolbar visible for a short time to allow interactions
    setTimeout(() => {
      if (this.activeElement === element && !this.floatingToolbar.matches(':hover')) {
        this.hideFloatingToolbar();
        this.hideSuggestionPopup();
      }
    }, 200);
  }

  handleInputChange(element) {
    if (!this.isEnabled || this.isProcessing) return;
    
    // Debounce analysis to avoid excessive API calls
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.analyzeText(element);
    }, 300);
  }

  handleSelectionChange() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      if (this.isEditableElement(range.commonAncestorContainer)) {
        this.showQuickActions(range);
      }
    }
  }

  isEditableElement(element) {
    if (!element) return false;
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement;
    }
    return element.matches && element.matches('textarea, input[type="text"], [contenteditable="true"], [contenteditable=""]');
  }

  async analyzeText(element) {
    const text = this.getElementText(element);
    if (!text || text.length < 10) return;

    this.isProcessing = true;
    
    try {
      const analysis = await chrome.runtime.sendMessage({
        action: 'analyzeText',
        text: text
      });

      this.suggestions = analysis.suggestions || [];
      this.highlightSuggestions(element, this.suggestions);
      this.updateToolbarStats(analysis);
    } catch (error) {
      console.error('Text analysis failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  getElementText(element) {
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      return element.value;
    } else {
      return element.textContent || element.innerText || '';
    }
  }

  setElementText(element, text) {
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      element.value = text;
    } else {
      element.textContent = text;
    }
    
    // Trigger input event
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  highlightSuggestions(element, suggestions) {
    // Remove existing highlights
    this.clearHighlights(element);
    
    if (!suggestions.length) return;

    // For contenteditable elements, we can add highlighting
    if (element.isContentEditable) {
      this.addContentEditableHighlights(element, suggestions);
    } else {
      // For textarea/input, we'll show indicators in the toolbar
      this.showInputIndicators(suggestions);
    }
  }

  addContentEditableHighlights(element, suggestions) {
    const text = element.textContent;
    let highlightedHTML = text;
    
    suggestions.forEach((suggestion, index) => {
      const original = suggestion.original;
      if (text.includes(original)) {
        const className = `ai-suggestion-${suggestion.type}`;
        const spanStart = `<span class="${className}" data-suggestion-id="${index}">`;
        const spanEnd = '</span>';
        highlightedHTML = highlightedHTML.replace(original, spanStart + original + spanEnd);
      }
    });
    
    if (highlightedHTML !== text) {
      element.innerHTML = highlightedHTML;
      this.attachHighlightListeners(element);
    }
  }

  attachHighlightListeners(element) {
    const highlights = element.querySelectorAll('[data-suggestion-id]');
    highlights.forEach(highlight => {
      highlight.addEventListener('click', (e) => {
        e.preventDefault();
        const suggestionId = parseInt(highlight.dataset.suggestionId);
        this.showSuggestionPopup(this.suggestions[suggestionId], highlight);
      });
    });
  }

  clearHighlights(element) {
    if (element.isContentEditable) {
      const highlights = element.querySelectorAll('[data-suggestion-id]');
      highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
      });
    }
  }

  showInputIndicators(suggestions) {
    // Update toolbar to show number of suggestions by type
    const grammarCount = suggestions.filter(s => s.type === 'grammar').length;
    const styleCount = suggestions.filter(s => s.type === 'style').length;
    const toneCount = suggestions.filter(s => s.type === 'tone').length;
    
    this.updateToolbarIndicators(grammarCount, styleCount, toneCount);
  }

  createFloatingToolbar() {
    this.floatingToolbar = document.createElement('div');
    this.floatingToolbar.className = 'ai-writing-toolbar';
    this.floatingToolbar.innerHTML = `
      <div class="toolbar-content">
        <div class="toolbar-header">
          <span class="toolbar-title">AI Assistant</span>
          <button class="toolbar-toggle" title="Toggle Assistant">⚡</button>
        </div>
        <div class="toolbar-stats">
          <span class="word-count">0 words</span>
          <span class="readability-score">Score: 0</span>
        </div>
        <div class="toolbar-indicators">
          <span class="grammar-indicator" title="Grammar issues">G: 0</span>
          <span class="style-indicator" title="Style suggestions">S: 0</span>
          <span class="tone-indicator" title="Tone adjustments">T: 0</span>
        </div>
        <div class="toolbar-actions">
          <button class="action-btn grammar-btn" title="Check Grammar">📝</button>
          <button class="action-btn humanize-btn" title="Humanize Text">🤖➡️👤</button>
          <button class="action-btn enhance-btn" title="Enhance Style">✨</button>
          <button class="action-btn tone-btn" title="Adjust Tone">🎭</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.floatingToolbar);
    this.setupToolbarListeners();
  }

  setupToolbarListeners() {
    const toolbar = this.floatingToolbar;
    
    toolbar.querySelector('.toolbar-toggle').addEventListener('click', () => {
      this.toggleAssistant();
    });

    toolbar.querySelector('.grammar-btn').addEventListener('click', () => {
      this.processActiveText('grammar');
    });

    toolbar.querySelector('.humanize-btn').addEventListener('click', () => {
      this.processActiveText('humanize');
    });

    toolbar.querySelector('.enhance-btn').addEventListener('click', () => {
      this.processActiveText('enhance');
    });

    toolbar.querySelector('.tone-btn').addEventListener('click', () => {
      this.showToneMenu();
    });
  }

  showFloatingToolbar(element) {
    if (!this.floatingToolbar) return;
    
    const rect = element.getBoundingClientRect();
    const toolbar = this.floatingToolbar;
    
    toolbar.style.display = 'block';
    toolbar.style.position = 'fixed';
    toolbar.style.top = Math.max(10, rect.bottom + 10) + 'px';
    toolbar.style.left = Math.min(window.innerWidth - 320, rect.left) + 'px';
    toolbar.style.zIndex = '10000';
    
    // Add active class
    toolbar.classList.add('active');
  }

  hideFloatingToolbar() {
    if (this.floatingToolbar) {
      this.floatingToolbar.classList.remove('active');
      setTimeout(() => {
        this.floatingToolbar.style.display = 'none';
      }, 200);
    }
  }

  updateToolbarStats(analysis) {
    if (!this.floatingToolbar) return;
    
    const wordCount = this.floatingToolbar.querySelector('.word-count');
    const readabilityScore = this.floatingToolbar.querySelector('.readability-score');
    
    if (wordCount) wordCount.textContent = `${analysis.wordCount || 0} words`;
    if (readabilityScore) readabilityScore.textContent = `Score: ${analysis.readabilityScore || 0}`;
  }

  updateToolbarIndicators(grammar, style, tone) {
    if (!this.floatingToolbar) return;
    
    const grammarInd = this.floatingToolbar.querySelector('.grammar-indicator');
    const styleInd = this.floatingToolbar.querySelector('.style-indicator');
    const toneInd = this.floatingToolbar.querySelector('.tone-indicator');
    
    if (grammarInd) grammarInd.textContent = `G: ${grammar}`;
    if (styleInd) styleInd.textContent = `S: ${style}`;
    if (toneInd) toneInd.textContent = `T: ${tone}`;
  }

  createSuggestionPopup() {
    this.suggestionPopup = document.createElement('div');
    this.suggestionPopup.className = 'ai-suggestion-popup';
    this.suggestionPopup.style.display = 'none';
    document.body.appendChild(this.suggestionPopup);
  }

  showSuggestionPopup(suggestion, element) {
    if (!this.suggestionPopup || !suggestion) return;
    
    const rect = element.getBoundingClientRect();
    this.suggestionPopup.innerHTML = `
      <div class="suggestion-content">
        <div class="suggestion-type">${suggestion.type.toUpperCase()}</div>
        <div class="suggestion-original">Original: "${suggestion.original}"</div>
        <div class="suggestion-improved">Suggestion: "${suggestion.suggestion}"</div>
        <div class="suggestion-explanation">${suggestion.explanation}</div>
        <div class="suggestion-actions">
          <button class="accept-suggestion">Accept</button>
          <button class="dismiss-suggestion">Dismiss</button>
        </div>
      </div>
    `;
    
    this.suggestionPopup.style.position = 'fixed';
    this.suggestionPopup.style.top = rect.bottom + 5 + 'px';
    this.suggestionPopup.style.left = rect.left + 'px';
    this.suggestionPopup.style.display = 'block';
    this.suggestionPopup.style.zIndex = '10001';
    
    // Add event listeners
    this.suggestionPopup.querySelector('.accept-suggestion').addEventListener('click', () => {
      this.applySuggestion(suggestion);
      this.hideSuggestionPopup();
    });
    
    this.suggestionPopup.querySelector('.dismiss-suggestion').addEventListener('click', () => {
      this.hideSuggestionPopup();
    });
  }

  hideSuggestionPopup() {
    if (this.suggestionPopup) {
      this.suggestionPopup.style.display = 'none';
    }
  }

  applySuggestion(suggestion) {
    if (!this.activeElement) return;
    
    const currentText = this.getElementText(this.activeElement);
    const newText = currentText.replace(suggestion.original, suggestion.suggestion);
    this.setElementText(this.activeElement, newText);
    
    // Re-analyze after applying suggestion
    setTimeout(() => this.analyzeText(this.activeElement), 100);
  }

  async processActiveText(type) {
    if (!this.activeElement) return;
    
    const text = this.getElementText(this.activeElement);
    if (!text.trim()) return;
    
    this.isProcessing = true;
    this.showProcessingIndicator();
    
    try {
      const result = await chrome.runtime.sendMessage({
        action: 'processText',
        text: text,
        type: type
      });
      
      if (result.success) {
        this.setElementText(this.activeElement, result.processedText);
        this.showSuccessIndicator(`Text ${type}d successfully!`);
        // Re-analyze the processed text
        setTimeout(() => this.analyzeText(this.activeElement), 100);
      } else {
        this.showErrorIndicator('Processing failed. Please try again.');
      }
    } catch (error) {
      console.error('Text processing failed:', error);
      this.showErrorIndicator('Processing failed. Please try again.');
    } finally {
      this.isProcessing = false;
      this.hideProcessingIndicator();
    }
  }

  showProcessingIndicator() {
    if (this.floatingToolbar) {
      this.floatingToolbar.classList.add('processing');
    }
  }

  hideProcessingIndicator() {
    if (this.floatingToolbar) {
      this.floatingToolbar.classList.remove('processing');
    }
  }

  showSuccessIndicator(message) {
    this.showNotification(message, 'success');
  }

  showErrorIndicator(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `ai-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 10002;
      animation: slideIn 0.3s ease-out;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  toggleAssistant() {
    this.isEnabled = !this.isEnabled;
    chrome.runtime.sendMessage({
      action: 'updateSettings',
      isEnabled: this.isEnabled
    });
    
    if (this.isEnabled) {
      this.showSuccessIndicator('AI Writing Assistant enabled');
      if (this.activeElement) {
        this.showFloatingToolbar(this.activeElement);
      }
    } else {
      this.showSuccessIndicator('AI Writing Assistant disabled');
      this.hideFloatingToolbar();
      this.hideSuggestionPopup();
    }
  }

  quickGrammarCheck() {
    if (this.activeElement) {
      this.processActiveText('grammar');
    }
  }

  quickHumanize() {
    if (this.activeElement) {
      this.processActiveText('humanize');
    }
  }

  handleContextMenuAction(action, text) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (this.isEditableElement(range.commonAncestorContainer)) {
        this.activeElement = range.commonAncestorContainer;
        
        switch (action) {
          case 'check-grammar':
            this.processSelectedText('grammar', range);
            break;
          case 'humanize-text':
            this.processSelectedText('humanize', range);
            break;
          case 'enhance-style':
            this.processSelectedText('enhance', range);
            break;
          case 'adjust-tone':
            this.processSelectedText('tone', range);
            break;
        }
      }
    }
  }

  async processSelectedText(type, range) {
    const selectedText = range.toString();
    if (!selectedText.trim()) return;
    
    this.isProcessing = true;
    this.showProcessingIndicator();
    
    try {
      const result = await chrome.runtime.sendMessage({
        action: 'processText',
        text: selectedText,
        type: type
      });
      
      if (result.success) {
        range.deleteContents();
        range.insertNode(document.createTextNode(result.processedText));
        this.showSuccessIndicator(`Selected text ${type}d successfully!`);
      } else {
        this.showErrorIndicator('Processing failed. Please try again.');
      }
    } catch (error) {
      console.error('Selected text processing failed:', error);
      this.showErrorIndicator('Processing failed. Please try again.');
    } finally {
      this.isProcessing = false;
      this.hideProcessingIndicator();
    }
  }

  handleKeyboardShortcut(command) {
    switch (command) {
      case 'toggle-assistant':
        this.toggleAssistant();
        break;
      case 'quick-humanize':
        this.quickHumanize();
        break;
      case 'grammar-check':
        this.quickGrammarCheck();
        break;
    }
  }

  showToneMenu() {
    // Create a simple tone selection menu
    const toneMenu = document.createElement('div');
    toneMenu.className = 'ai-tone-menu';
    toneMenu.innerHTML = `
      <div class="tone-options">
        <button class="tone-option" data-tone="professional">Professional</button>
        <button class="tone-option" data-tone="casual">Casual</button>
        <button class="tone-option" data-tone="formal">Formal</button>
        <button class="tone-option" data-tone="creative">Creative</button>
        <button class="tone-option" data-tone="friendly">Friendly</button>
      </div>
    `;
    
    const rect = this.floatingToolbar.getBoundingClientRect();
    toneMenu.style.cssText = `
      position: fixed;
      top: ${rect.top - 150}px;
      left: ${rect.left}px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10001;
      padding: 8px;
    `;
    
    document.body.appendChild(toneMenu);
    
    toneMenu.addEventListener('click', (e) => {
      if (e.target.classList.contains('tone-option')) {
        const tone = e.target.dataset.tone;
        this.processActiveTextWithTone(tone);
        toneMenu.remove();
      }
    });
    
    // Remove menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!toneMenu.contains(e.target)) {
          toneMenu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 100);
  }

  async processActiveTextWithTone(tone) {
    if (!this.activeElement) return;
    
    const text = this.getElementText(this.activeElement);
    if (!text.trim()) return;
    
    this.isProcessing = true;
    this.showProcessingIndicator();
    
    try {
      const result = await chrome.runtime.sendMessage({
        action: 'processText',
        text: text,
        type: 'tone',
        options: { tone: tone }
      });
      
      if (result.success) {
        this.setElementText(this.activeElement, result.processedText);
        this.showSuccessIndicator(`Text adjusted to ${tone} tone!`);
        setTimeout(() => this.analyzeText(this.activeElement), 100);
      } else {
        this.showErrorIndicator('Tone adjustment failed. Please try again.');
      }
    } catch (error) {
      console.error('Tone adjustment failed:', error);
      this.showErrorIndicator('Tone adjustment failed. Please try again.');
    } finally {
      this.isProcessing = false;
      this.hideProcessingIndicator();
    }
  }
}

// Initialize content script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AIWritingContentScript();
  });
} else {
  new AIWritingContentScript();
}