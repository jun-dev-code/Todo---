import { CONFIG } from '../constants/index.js';

export class Utils {
    static escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static sanitizeInput(input, maxLength = CONFIG.MAX_TASK_LENGTH) {
        if (typeof input !== 'string') return '';
        return input.trim().slice(0, maxLength);
    }

    static isValidDate(date) {
        return date instanceof Date && !isNaN(date);
    }

    static formatDate(date) {
        if (!this.isValidDate(date)) return '';
        return new Intl.DateTimeFormat('ja-JP', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    static createElement(tag, className = '', attributes = {}) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        return element;
    }

    static parseTagString(tagString) {
        if (!tagString) return [];
        return tagString
            .split(',')
            .map(tag => this.sanitizeInput(tag, CONFIG.MAX_TAG_LENGTH))
            .filter(tag => tag.length > 0);
    }
}

export class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        return () => this.off(event, callback);
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }

    once(event, callback) {
        const onceWrapper = (data) => {
            callback(data);
            this.off(event, onceWrapper);
        };
        this.on(event, onceWrapper);
    }
}

export class ErrorHandler {
    static showError(message, duration = CONFIG.ALERT_DURATION.ERROR) {
        this.showAlert('error', message, duration);
    }

    static showSuccess(message, duration = CONFIG.ALERT_DURATION.SUCCESS) {
        this.showAlert('success', message, duration);
    }

    static showAlert(type, message, duration) {
        const alertId = type === 'error' ? 'errorAlert' : 'successAlert';
        const messageId = type === 'error' ? 'errorMessage' : 'successMessage';
        
        const alertElement = document.getElementById(alertId);
        const messageElement = document.getElementById(messageId);
        
        if (!alertElement || !messageElement) {
            console.warn(`Alert elements not found: ${alertId}, ${messageId}`);
            return;
        }
        
        messageElement.textContent = message;
        alertElement.classList.remove('hidden');
        
        setTimeout(() => {
            alertElement.classList.add('hidden');
        }, duration);
    }

    static handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        this.showError(`エラーが発生しました: ${error.message || '不明なエラー'}`);
    }
}

export class FocusManager {
    static trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement?.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement?.focus();
                    }
                }
            }
        };

        element.addEventListener('keydown', handleKeyDown);
        firstElement?.focus();

        return () => {
            element.removeEventListener('keydown', handleKeyDown);
        };
    }

    static restoreFocus(element) {
        if (element && typeof element.focus === 'function') {
            element.focus();
        }
    }
}