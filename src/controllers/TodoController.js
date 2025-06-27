import { TaskService } from '../services/TaskService.js';
import { FilterService } from '../services/FilterService.js';
import { NotificationService } from '../services/NotificationService.js';
import { TaskRenderer } from '../views/TaskRenderer.js';
import { Utils, ErrorHandler, FocusManager } from '../utils/index.js';
import { CONFIG, FILTER_TYPES, KEYBOARD_SHORTCUTS } from '../constants/index.js';

export class TodoController {
    constructor() {
        this.taskService = new TaskService();
        this.filterService = new FilterService();
        this.notificationService = new NotificationService();
        this.editingTaskId = null;
        this.previousFocus = null;
        this.isLoading = false;
        this.cleanupFunctions = [];

        this.initializeElements();
        this.bindEvents();
        this.setupKeyboardShortcuts();
        this.setupNotifications();
        this.render();
        this.startNotificationChecking();
    }

    initializeElements() {
        try {
            this.elements = {
                // Form elements
                taskInput: document.getElementById('taskInput'),
                tagInput: document.getElementById('tagInput'),
                deadlineInput: document.getElementById('deadlineInput'),
                addTaskBtn: document.getElementById('addTaskBtn'),
                
                // Filter and search elements
                searchInput: document.getElementById('searchInput'),
                sortSelect: document.getElementById('sortSelect'),
                filterBtns: document.querySelectorAll('[data-filter]'),
                tagFilters: document.getElementById('tagFilters'),
                
                // Display elements
                taskList: document.getElementById('taskList'),
                emptyState: document.getElementById('emptyState'),
                taskCount: document.getElementById('taskCount'),
                completedCount: document.getElementById('completedCount'),
                overdueCount: document.getElementById('overdueCount'),
                
                // Action elements
                clearCompletedBtn: document.getElementById('clearCompleted'),
                
                // Modal elements
                helpModal: document.getElementById('helpModal'),
                
                // Notification elements
                notificationBanner: document.getElementById('notificationBanner')
            };

            // Validate required elements
            const requiredElements = ['taskInput', 'taskList'];
            const missingElements = requiredElements.filter(key => !this.elements[key]);
            
            if (missingElements.length > 0) {
                throw new Error(`必要なHTML要素が見つかりません: ${missingElements.join(', ')}`);
            }
        } catch (error) {
            ErrorHandler.handleError(error, 'initializeElements');
            throw error;
        }
    }

    bindEvents() {
        try {
            // Task service events
            this.taskService.on('tasksChanged', () => this.render());
            this.taskService.on('taskAdded', (task) => {
                ErrorHandler.showSuccess('タスクを追加しました');
                this.clearForm();
                this.elements.taskInput?.focus();
            });
            this.taskService.on('taskUpdated', (task) => {
                if (task.completed) {
                    this.notificationService.clearTaskNotifications(task.id);
                    ErrorHandler.showSuccess('タスクを完了しました');
                } else {
                    ErrorHandler.showSuccess('タスクを更新しました');
                }
            });
            this.taskService.on('taskDeleted', ({ task }) => {
                this.notificationService.clearTaskNotifications(task.id);
                ErrorHandler.showSuccess('タスクを削除しました');
            });

            // Form submission
            const form = document.getElementById('addTaskForm');
            form?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddTask();
            });

            // Filter buttons
            this.elements.filterBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const filter = e.target.dataset.filter;
                    this.handleFilterChange(filter);
                });
            });

            // Search and sort
            this.elements.searchInput?.addEventListener('input', 
                Utils.debounce((e) => this.handleSearchChange(e.target.value), CONFIG.DEBOUNCE_DELAY)
            );
            this.elements.sortSelect?.addEventListener('change', (e) => this.handleSortChange(e.target.value));

            // Actions
            this.elements.clearCompletedBtn?.addEventListener('click', () => this.handleClearCompleted());

            // Notification controls
            document.getElementById('allowNotifications')?.addEventListener('click', () => this.handleAllowNotifications());
            document.getElementById('denyNotifications')?.addEventListener('click', () => this.hideNotificationBanner());

            // Modal controls
            document.getElementById('helpBtn')?.addEventListener('click', () => this.showHelpModal());
            document.getElementById('closeHelpModal')?.addEventListener('click', () => this.hideHelpModal());
            this.elements.helpModal?.addEventListener('click', (e) => {
                if (e.target === this.elements.helpModal) this.hideHelpModal();
            });

            // Input validation
            this.elements.taskInput?.addEventListener('input', (e) => this.validateTaskInput(e.target));

        } catch (error) {
            ErrorHandler.handleError(error, 'bindEvents');
        }
    }

    setupKeyboardShortcuts() {
        const handleKeyDown = (e) => {
            try {
                // Ignore shortcuts when typing in inputs (except Escape)
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    if (e.key === 'Escape') {
                        e.target.blur();
                        e.preventDefault();
                    }
                    return;
                }

                const key = e.key.toLowerCase();
                const isCtrl = e.ctrlKey || e.metaKey;

                if (isCtrl) {
                    switch (key) {
                        case 'n':
                            e.preventDefault();
                            this.elements.taskInput?.focus();
                            break;
                        case 'f':
                            e.preventDefault();
                            this.elements.searchInput?.focus();
                            break;
                        case 'a':
                            e.preventDefault();
                            this.handleFilterChange(FILTER_TYPES.ALL);
                            break;
                        case '1':
                            e.preventDefault();
                            this.handleFilterChange(FILTER_TYPES.ACTIVE);
                            break;
                        case '2':
                            e.preventDefault();
                            this.handleFilterChange(FILTER_TYPES.COMPLETED);
                            break;
                        case '3':
                            e.preventDefault();
                            this.handleFilterChange(FILTER_TYPES.OVERDUE);
                            break;
                    }
                } else {
                    switch (key) {
                        case '?':
                            e.preventDefault();
                            this.showHelpModal();
                            break;
                        case 'escape':
                            this.hideHelpModal();
                            if (this.editingTaskId) {
                                this.handleCancelEdit();
                            }
                            break;
                    }
                }
            } catch (error) {
                ErrorHandler.handleError(error, 'keyboard shortcuts');
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        this.cleanupFunctions.push(() => {
            document.removeEventListener('keydown', handleKeyDown);
        });
    }

    setupNotifications() {
        try {
            if ('Notification' in window) {
                if (Notification.permission === 'default') {
                    this.showNotificationBanner();
                }
            }
        } catch (error) {
            ErrorHandler.handleError(error, 'setupNotifications');
        }
    }

    showNotificationBanner() {
        setTimeout(() => {
            this.elements.notificationBanner?.classList.add('show');
        }, 1000);
    }

    hideNotificationBanner() {
        this.elements.notificationBanner?.classList.remove('show');
    }

    async handleAllowNotifications() {
        try {
            const permission = await this.notificationService.requestPermission();
            if (permission === 'granted') {
                this.hideNotificationBanner();
                ErrorHandler.showSuccess('通知が有効になりました！');
            } else {
                this.hideNotificationBanner();
                ErrorHandler.showError('通知が拒否されました');
            }
        } catch (error) {
            ErrorHandler.handleError(error, 'handleAllowNotifications');
            this.hideNotificationBanner();
        }
    }

    startNotificationChecking() {
        this.notificationService.startChecking(() => this.taskService.getTasks());
    }

    showHelpModal() {
        try {
            this.previousFocus = document.activeElement;
            this.elements.helpModal.classList.add('show');
            document.body.style.overflow = 'hidden';
            const cleanup = FocusManager.trapFocus(this.elements.helpModal);
            this.cleanupFunctions.push(cleanup);
        } catch (error) {
            ErrorHandler.handleError(error, 'showHelpModal');
        }
    }

    hideHelpModal() {
        try {
            this.elements.helpModal.classList.remove('show');
            document.body.style.overflow = '';
            FocusManager.restoreFocus(this.previousFocus);
        } catch (error) {
            ErrorHandler.handleError(error, 'hideHelpModal');
        }
    }

    validateTaskInput(input) {
        const errorDiv = document.getElementById('taskInputError');
        const value = input.value.trim();
        
        if (value.length > CONFIG.MAX_TASK_LENGTH) {
            errorDiv.textContent = `タスク名は${CONFIG.MAX_TASK_LENGTH}文字以内で入力してください`;
            errorDiv.classList.remove('hidden');
            this.elements.addTaskBtn.disabled = true;
            return false;
        } else {
            errorDiv.classList.add('hidden');
            this.elements.addTaskBtn.disabled = false;
            return true;
        }
    }

    setLoading(loading) {
        this.isLoading = loading;
        if (this.elements.addTaskBtn) {
            this.elements.addTaskBtn.disabled = loading;
            this.elements.addTaskBtn.classList.toggle('loading', loading);
        }
    }

    clearForm() {
        if (this.elements.taskInput) this.elements.taskInput.value = '';
        if (this.elements.tagInput) this.elements.tagInput.value = '';
        if (this.elements.deadlineInput) this.elements.deadlineInput.value = '';
    }

    handleAddTask() {
        if (this.isLoading) return;

        try {
            const text = Utils.sanitizeInput(this.elements.taskInput.value);
            if (!text) {
                ErrorHandler.showError('タスク名を入力してください');
                this.elements.taskInput.focus();
                return;
            }

            if (!this.validateTaskInput(this.elements.taskInput)) return;

            this.setLoading(true);

            const deadline = this.elements.deadlineInput.value || null;
            const tags = Utils.parseTagString(this.elements.tagInput.value);

            // 未来の日付のみ許可
            if (deadline) {
                const deadlineDate = new Date(deadline);
                if (deadlineDate <= new Date()) {
                    ErrorHandler.showError('締切日時は未来の日時を指定してください');
                    return;
                }
            }

            this.taskService.addTask({ text, deadline, tags });
        } catch (error) {
            ErrorHandler.handleError(error, 'handleAddTask');
        } finally {
            this.setLoading(false);
        }
    }

    handleToggleTask(id) {
        try {
            this.taskService.toggleTask(id);
        } catch (error) {
            ErrorHandler.handleError(error, 'handleToggleTask');
        }
    }

    handleEditTask(id) {
        this.editingTaskId = id;
        this.render();
    }

    handleSaveEdit(id, updates) {
        try {
            const text = Utils.sanitizeInput(updates.text);
            if (!text) {
                ErrorHandler.showError('タスク名を入力してください');
                return;
            }

            this.taskService.updateTask(id, {
                text,
                tags: updates.tags,
                deadline: updates.deadline
            });

            this.editingTaskId = null;
        } catch (error) {
            ErrorHandler.handleError(error, 'handleSaveEdit');
        }
    }

    handleCancelEdit() {
        this.editingTaskId = null;
        this.render();
    }

    handleDeleteTask(id) {
        try {
            const taskElement = document.querySelector(`[data-task-id="${id}"]`);
            if (taskElement) {
                taskElement.classList.add('task-exit');
                setTimeout(() => {
                    this.taskService.deleteTask(id);
                }, 300);
            }
        } catch (error) {
            ErrorHandler.handleError(error, 'handleDeleteTask');
        }
    }

    handleFilterChange(filter) {
        try {
            this.filterService.setFilter(filter);
            this.updateFilterButtons();
            this.render();
        } catch (error) {
            ErrorHandler.handleError(error, 'handleFilterChange');
        }
    }

    handleSortChange(sortBy) {
        try {
            this.filterService.setSortBy(sortBy);
            this.render();
        } catch (error) {
            ErrorHandler.handleError(error, 'handleSortChange');
        }
    }

    handleSearchChange(query) {
        try {
            this.filterService.setSearchQuery(query);
            this.render();
        } catch (error) {
            ErrorHandler.handleError(error, 'handleSearchChange');
        }
    }

    handleTagFilterChange(tag) {
        try {
            this.filterService.setTagFilter(tag);
            this.render();
        } catch (error) {
            ErrorHandler.handleError(error, 'handleTagFilterChange');
        }
    }

    handleClearCompleted() {
        try {
            const count = this.taskService.clearCompleted();
            if (count === 0) {
                ErrorHandler.showError('完了済みタスクがありません');
            }
        } catch (error) {
            ErrorHandler.handleError(error, 'handleClearCompleted');
        }
    }

    updateFilterButtons() {
        this.elements.filterBtns.forEach(btn => {
            const filter = btn.dataset.filter;
            const isActive = filter === this.filterService.currentFilter;
            btn.setAttribute('aria-pressed', isActive.toString());
        });
    }

    render() {
        try {
            const tasks = this.taskService.getTasks();
            const filteredTasks = this.filterService.filterTasks(tasks);
            
            this.renderStats(tasks);
            this.renderTagFilters();
            this.renderTaskList(filteredTasks);
            this.updateSortSelect();
        } catch (error) {
            ErrorHandler.handleError(error, 'render');
        }
    }

    renderStats(tasks) {
        const stats = this.taskService.getStats();
        
        if (this.elements.taskCount) this.elements.taskCount.textContent = stats.total;
        if (this.elements.completedCount) this.elements.completedCount.textContent = stats.completed;
        if (this.elements.overdueCount) this.elements.overdueCount.textContent = stats.overdue;

        // Show/hide clear completed button
        if (this.elements.clearCompletedBtn) {
            this.elements.clearCompletedBtn.classList.toggle('hidden', stats.completed === 0);
        }
    }

    renderTagFilters() {
        if (!this.elements.tagFilters) return;

        const tags = this.taskService.getAllTags();
        
        this.elements.tagFilters.innerHTML = tags.map(tag => {
            const safeTag = Utils.escapeHtml(tag);
            const isActive = this.filterService.currentTagFilter === tag;
            return `
                <button 
                    class="tag tag-${TaskRenderer.getTagClass(tag)} ${isActive ? 'ring-2 ring-primary' : ''} cursor-pointer transition-all duration-200 hover:scale-105"
                    data-tag="${safeTag}"
                    aria-pressed="${isActive}"
                    aria-label="タグ ${safeTag} でフィルター"
                >
                    ${safeTag}
                    ${isActive ? '✕' : ''}
                </button>
            `;
        }).join('');

        // Add event listeners to tag filter buttons
        this.elements.tagFilters.querySelectorAll('[data-tag]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tag = e.target.dataset.tag;
                this.handleTagFilterChange(tag);
            });
        });
    }

    renderTaskList(tasks) {
        if (!this.elements.taskList) return;

        const options = {
            onToggle: (id) => this.handleToggleTask(id),
            onEdit: (id) => this.handleEditTask(id),
            onSave: (id, updates) => this.handleSaveEdit(id, updates),
            onCancel: () => this.handleCancelEdit(),
            onDelete: (id) => this.handleDeleteTask(id)
        };

        // Clear and render tasks
        this.elements.taskList.innerHTML = '';

        if (tasks.length === 0) {
            const emptyState = TaskRenderer.createEmptyState();
            this.elements.taskList.appendChild(emptyState);
            return;
        }

        tasks.forEach(task => {
            const isEditing = this.editingTaskId === task.id;
            const taskElement = TaskRenderer.createTaskElement(task, { ...options, isEditing });
            this.elements.taskList.appendChild(taskElement);
        });
    }

    updateSortSelect() {
        if (this.elements.sortSelect) {
            this.elements.sortSelect.value = this.filterService.sortBy;
        }
    }

    destroy() {
        try {
            this.notificationService.stopChecking();
            this.cleanupFunctions.forEach(cleanup => cleanup());
            this.cleanupFunctions = [];
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }
}