import { Utils } from '../utils/index.js';
import { TASK_STATUS } from '../constants/index.js';

export class Task {
    constructor(data = {}) {
        this.id = data.id || Utils.generateId();
        this.text = Utils.sanitizeInput(data.text || '');
        this.completed = Boolean(data.completed);
        this.deadline = data.deadline || null;
        this.tags = Array.isArray(data.tags) ? 
            data.tags.map(tag => Utils.sanitizeInput(tag)) : [];
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    }

    update(updates) {
        Object.assign(this, updates);
        this.updatedAt = new Date();
        return this;
    }

    getStatus() {
        if (this.completed) return TASK_STATUS.COMPLETED;
        if (!this.deadline) return TASK_STATUS.NORMAL;

        const now = new Date();
        const deadline = new Date(this.deadline);
        if (!Utils.isValidDate(deadline)) return TASK_STATUS.NORMAL;
        
        const timeDiff = deadline.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (hoursDiff < 0) return TASK_STATUS.OVERDUE;
        if (hoursDiff <= 24) return TASK_STATUS.DUE_SOON;
        return TASK_STATUS.NORMAL;
    }

    formatDeadline() {
        if (!this.deadline) return '';
        
        const date = new Date(this.deadline);
        if (!Utils.isValidDate(date)) return '';
        
        const now = new Date();
        const timeDiff = date.getTime() - now.getTime();
        
        if (timeDiff < 0) {
            return `期限切れ (${Utils.formatDate(date)})`;
        } else if (timeDiff < 24 * 60 * 60 * 1000) {
            const hours = Math.floor(timeDiff / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}時間${minutes}分後 (${Utils.formatDate(date)})`;
        } else {
            return Utils.formatDate(date);
        }
    }

    toggle() {
        this.completed = !this.completed;
        this.updatedAt = new Date();
        return this;
    }

    isOverdue() {
        return this.getStatus() === TASK_STATUS.OVERDUE;
    }

    isDueSoon() {
        return this.getStatus() === TASK_STATUS.DUE_SOON;
    }

    matchesSearch(query) {
        if (!query) return true;
        const lowercaseQuery = query.toLowerCase();
        return (
            this.text.toLowerCase().includes(lowercaseQuery) ||
            this.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
        );
    }

    toJSON() {
        return {
            id: this.id,
            text: this.text,
            completed: this.completed,
            deadline: this.deadline,
            tags: this.tags,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }

    static fromJSON(data) {
        return new Task(data);
    }
}