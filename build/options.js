// AI Writing Assistant Pro - Complete Options Controller
// Manages all 50+ features and settings

class AIWritingOptions {
    constructor() {
        this.settings = {};
        this.defaultSettings = this.getDefaultSettings();
        this.currentSection = 'core';
        this.unsavedChanges = false;
        this.isLoading = false;
        
        this.initialize();
    }

    getDefaultSettings() {
        return {
            // Core Features
            'master-enable': true,
            'grammar-check': true,
            'spelling-mechanics': true,
            'style-enhancement': true,
            'text-humanization': true,
            'real-time-analysis': true,
            'smart-suggestions': true,
            'default-mode': 'auto',
            'primary-language': 'en-US',

            // Tone & Persona
            'default-tone': 'professional',
            'auto-tone-detection': true,
            'tone-adjustment': true,
            'persona-writing': true,
            'persona-academic': true,
            'persona-business': true,
            'persona-creative': true,
            'persona-technical': true,
            'persona-marketing': true,
            'persona-social': true,

            // Personalization
            'learn-from-corrections': true,
            'adaptive-suggestions': true,
            'writing-profile': true,
            'personal-dictionary': '',
            'content-optimization': true,
            'seo-optimization': false,
            'engagement-optimization': true,
            'readability-analysis': true,

            // Interface
            'show-floating-toolbar': true,
            'show-word-count': true,
            'show-readability-score': true,
            'contextual-suggestions': true,
            'grammar-color': '#ef4444',
            'style-color': '#2563eb',
            'tone-color': '#16a34a',
            'humanization-color': '#8b5cf6',
            'show-notifications': true,
            'sound-effects': false,

            // Site Settings
            'allowed-sites': '',
            'blocked-sites': '',
            'site-specific-rules': true,
            'auto-context-detection': true,

            // Privacy & Data
            'local-processing': true,
            'anonymous-analytics': false,
            'cross-platform-sync': true,

            // Advanced
            'analysis-delay': '300',
            'suggestion-intensity': 0.7,
            'quick-fix': true,
            'bulk-processing': true,
            'auto-apply': true
        };
    }

    async initialize() {
        try {
            this.showLoading(true);
            await this.loadSettings();
            this.setupNavigation();
            this.setupEventListeners();
            this.populateAllFields();
            this.updateSaveStatus('All changes saved');
            this.showLoading(false);
        } catch (error) {
            console.error('Failed to initialize options:', error);
            this.showNotification('Failed to load settings', 'error');
            this.showLoading(false);
        }
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(null);
            this.settings = { ...this.defaultSettings, ...result };
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = { ...this.defaultSettings };
        }
    }

    async saveSettings() {
        try {
            this.showLoading(true);
            await chrome.storage.sync.set(this.settings);
            
            // Notify background script
            chrome.runtime.sendMessage({
                action: 'updateSettings',
                settings: this.settings
            });
            
            this.unsavedChanges = false;
            this.updateSaveStatus('All changes saved');
            this.showNotification('Settings saved successfully!', 'success');
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showNotification('Failed to save settings. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });
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

    setupEventListeners() {
        // Save and reset buttons
        document.getElementById('save-settings').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('reset-defaults').addEventListener('click', () => {
            this.showConfirm('Reset all settings to defaults?', () => {
                this.resetToDefaults();
            });
        });

        // Export/Import
        document.getElementById('export-settings').addEventListener('click', () => {
            this.exportSettings();
        });

        document.getElementById('import-settings').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importSettings(e.target.files[0]);
        });

        // Data management
        document.getElementById('clear-all-data').addEventListener('click', () => {
            this.showConfirm('Clear all extension data? This cannot be undone.', () => {
                this.clearAllData();
            });
        });

        // About section buttons
        document.getElementById('help-btn').addEventListener('click', () => {
            this.openHelp();
        });

        document.getElementById('feedback-btn').addEventListener('click', () => {
            this.openFeedback();
        });

        document.getElementById('privacy-btn').addEventListener('click', () => {
            this.showPrivacyPolicy();
        });

        document.getElementById('license-btn').addEventListener('click', () => {
            this.showLicense();
        });

        // Setup all input listeners
        this.setupInputListeners();

        // Window beforeunload for unsaved changes
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
            'master-enable', 'grammar-check', 'spelling-mechanics', 'style-enhancement',
            'text-humanization', 'real-time-analysis', 'smart-suggestions', 'auto-tone-detection',
            'tone-adjustment', 'persona-writing', 'persona-academic', 'persona-business',
            'persona-creative', 'persona-technical', 'persona-marketing', 'persona-social',
            'learn-from-corrections', 'adaptive-suggestions', 'writing-profile', 'content-optimization',
            'seo-optimization', 'engagement-optimization', 'readability-analysis',
            'show-floating-toolbar', 'show-word-count', 'show-readability-score', 'contextual-suggestions',
            'show-notifications', 'sound-effects', 'site-specific-rules', 'auto-context-detection',
            'local-processing', 'anonymous-analytics', 'cross-platform-sync', 'quick-fix',
            'bulk-processing', 'auto-apply'
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
            'default-mode', 'primary-language', 'default-tone', 'analysis-delay'
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
        const ranges = ['suggestion-intensity'];

        ranges.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', (e) => {
                    this.settings[id] = parseFloat(e.target.value);
                    this.updateIntensityDisplay(e.target.value);
                    this.markUnsaved();
                });
            }
        });

        // Color pickers
        const colors = ['grammar-color', 'style-color', 'tone-color', 'humanization-color'];

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
        const textareas = ['personal-dictionary', 'allowed-sites', 'blocked-sites'];

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

    populateAllFields() {
        // Populate all form fields with current settings
        Object.keys(this.settings).forEach(key => {
            const element = document.getElementById(key);
            if (!element) return;

            if (element.type === 'checkbox') {
                element.checked = this.settings[key];
            } else if (element.type === 'range') {
                element.value = this.settings[key];
                if (key === 'suggestion-intensity') {
                    this.updateIntensityDisplay(this.settings[key]);
                }
            } else if (element.type === 'color') {
                element.value = this.settings[key];
            } else if (element.tagName === 'SELECT') {
                element.value = this.settings[key];
            } else if (element.tagName === 'TEXTAREA') {
                element.value = this.settings[key] || '';
            }
        });
    }

    updateIntensityDisplay(value) {
        const display = document.getElementById('intensity-display');
        if (display) {
            display.textContent = `${Math.round(value * 100)}%`;
        }
    }

    markUnsaved() {
        if (!this.unsavedChanges) {
            this.unsavedChanges = true;
            this.updateSaveStatus('Unsaved changes ●');
        }
    }

    updateSaveStatus(message) {
        const statusElement = document.getElementById('save-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = this.unsavedChanges ? 'unsaved' : 'saved';
        }

        // Update save button
        const saveBtn = document.getElementById('save-settings');
        if (saveBtn) {
            if (this.unsavedChanges) {
                saveBtn.classList.add('btn-warning');
            } else {
                saveBtn.classList.remove('btn-warning');
            }
        }
    }

    async resetToDefaults() {
        this.settings = { ...this.defaultSettings };
        this.populateAllFields();
        this.markUnsaved();
        this.showNotification('Settings reset to defaults', 'info');
    }

    exportSettings() {
        const exportData = {
            version: '3.0.0',
            timestamp: new Date().toISOString(),
            settings: this.settings
        };

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
    }

    async importSettings(file) {
        if (!file) return;

        try {
            this.showLoading(true);
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!data.settings) {
                throw new Error('Invalid settings file format');
            }

            // Validate and merge settings
            const validSettings = {};
            Object.keys(this.defaultSettings).forEach(key => {
                if (data.settings.hasOwnProperty(key)) {
                    validSettings[key] = data.settings[key];
                }
            });

            this.settings = { ...this.defaultSettings, ...validSettings };
            this.populateAllFields();
            this.markUnsaved();
            this.showNotification('Settings imported successfully', 'success');
        } catch (error) {
            console.error('Failed to import settings:', error);
            this.showNotification('Failed to import settings. Invalid file format.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async clearAllData() {
        try {
            this.showLoading(true);
            await chrome.storage.sync.clear();
            await chrome.storage.local.clear();
            
            // Notify background script
            chrome.runtime.sendMessage({ action: 'clearAllData' });
            
            this.settings = { ...this.defaultSettings };
            this.populateAllFields();
            this.unsavedChanges = false;
            this.updateSaveStatus('All data cleared');
            this.showNotification('All extension data cleared', 'info');
        } catch (error) {
            console.error('Failed to clear data:', error);
            this.showNotification('Failed to clear data', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showConfirm(message, onConfirm) {
        const modal = document.getElementById('confirm-modal');
        const messageElement = document.getElementById('confirm-message');
        const cancelBtn = document.getElementById('confirm-cancel');
        const okBtn = document.getElementById('confirm-ok');

        messageElement.textContent = message;
        modal.style.display = 'flex';

        const cleanup = () => {
            modal.style.display = 'none';
            cancelBtn.removeEventListener('click', handleCancel);
            okBtn.removeEventListener('click', handleOk);
            modal.removeEventListener('click', handleBackdrop);
        };

        const handleCancel = () => cleanup();
        const handleOk = () => {
            cleanup();
            onConfirm();
        };
        const handleBackdrop = (e) => {
            if (e.target === modal) handleCancel();
        };

        cancelBtn.addEventListener('click', handleCancel);
        okBtn.addEventListener('click', handleOk);
        modal.addEventListener('click', handleBackdrop);
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">×</button>
        `;

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
            padding: 16px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            min-width: 300px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            animation: slideInRight 0.3s ease-out;
            background: ${colors[type] || colors.info};
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
        `;

        document.body.appendChild(notification);

        const removeNotification = () => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        };

        notification.querySelector('.notification-close').addEventListener('click', removeNotification);
        setTimeout(removeNotification, 4000);
    }

    showLoading(show) {
        this.isLoading = show;
        if (show) {
            document.body.style.opacity = '0.7';
            document.body.style.pointerEvents = 'none';
        } else {
            document.body.style.opacity = '1';
            document.body.style.pointerEvents = 'auto';
        }
    }

    openHelp() {
        chrome.tabs.create({ 
            url: 'https://github.com/ai-writing-assistant/docs' 
        });
    }

    openFeedback() {
        const subject = encodeURIComponent('AI Writing Assistant Pro Feedback');
        const body = encodeURIComponent(`\n\n---\nVersion: 3.0.0\nBrowser: ${navigator.userAgent}`);
        chrome.tabs.create({ 
            url: `mailto:support@aiwritingassistant.com?subject=${subject}&body=${body}` 
        });
    }

    showPrivacyPolicy() {
        const privacyText = `
# Privacy Policy

## Data Collection
- We do not collect personal information
- Writing analysis happens locally when possible
- Anonymous usage data is optional and helps improve the extension
- No text content is stored on our servers

## Data Storage
- Settings are stored locally in your browser
- Personal dictionary and preferences are synced across your devices
- You can clear all data at any time

## Third-Party Services
- Google Gemini API for advanced features (your API key)
- No data sharing with other third parties
        `;

        this.showModal('Privacy Policy', privacyText);
    }

    showLicense() {
        const licenseText = `
MIT License

Copyright (c) 2024 AI Writing Assistant Pro

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

        this.showModal('License', licenseText);
    }

    showModal(title, content) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
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
            padding: 20px;
        `;

        overlay.innerHTML = `
            <div class="modal-content" style="
                background: white;
                border-radius: 12px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                width: 100%;
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 24px;
                    border-bottom: 1px solid #e5e7eb;
                    position: sticky;
                    top: 0;
                    background: white;
                    border-radius: 12px 12px 0 0;
                ">
                    <h2 style="margin: 0; font-size: 20px; font-weight: 600;">${title}</h2>
                    <button class="modal-close" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        padding: 4px;
                        color: #6b7280;
                        border-radius: 4px;
                    ">×</button>
                </div>
                <div style="padding: 24px;">
                    <pre style="
                        white-space: pre-wrap;
                        font-family: system-ui, -apple-system, sans-serif;
                        font-size: 14px;
                        line-height: 1.6;
                        color: #374151;
                        margin: 0;
                    ">${content}</pre>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const closeModal = () => overlay.remove();
        
        overlay.querySelector('.modal-close').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }
}

// Add CSS animations
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
    background: #f59e0b !important;
    border-color: #f59e0b !important;
    color: white !important;
}

#save-status.unsaved {
    color: #f59e0b;
    font-weight: 600;
}

#save-status.saved {
    color: #10b981;
}
`;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AIWritingOptions();
});