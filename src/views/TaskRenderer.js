import { Utils } from '../utils/index.js';
import { TASK_STATUS } from '../constants/index.js';

export class TaskRenderer {
    static getTagClass(tag) {
        const tagLower = tag.toLowerCase();
        const tagClassMap = {
            '仕事': 'work', 'work': 'work', '会社': 'work',
            '個人': 'personal', 'personal': 'personal', 'プライベート': 'personal',
            '緊急': 'urgent', 'urgent': 'urgent', '重要': 'urgent',
            '勉強': 'study', 'study': 'study', '学習': 'study',
            '健康': 'health', 'health': 'health', '運動': 'health',
            '買い物': 'shopping', 'shopping': 'shopping', '購入': 'shopping'
        };

        for (const [keyword, className] of Object.entries(tagClassMap)) {
            if (tagLower.includes(keyword)) {
                return className;
            }
        }
        return 'default';
    }

    static getStatusClasses(task) {
        const status = task.getStatus();
        const statusClassMap = {
            [TASK_STATUS.OVERDUE]: 'task-overdue border-l-red-500 bg-red-50 dark:bg-red-900/20',
            [TASK_STATUS.DUE_SOON]: 'task-due-soon border-l-orange-500 bg-orange-50 dark:bg-orange-900/20',
            [TASK_STATUS.COMPLETED]: 'task-completed opacity-75',
            [TASK_STATUS.NORMAL]: ''
        };
        return statusClassMap[status] || '';
    }

    static getDeadlineClasses(task) {
        const status = task.getStatus();
        const deadlineClassMap = {
            [TASK_STATUS.OVERDUE]: 'text-red-600 dark:text-red-400',
            [TASK_STATUS.DUE_SOON]: 'text-orange-600 dark:text-orange-400',
            [TASK_STATUS.COMPLETED]: 'text-gray-500 dark:text-gray-400',
            [TASK_STATUS.NORMAL]: 'text-gray-500 dark:text-gray-400'
        };
        return deadlineClassMap[status] || 'text-gray-500 dark:text-gray-400';
    }

    static createTaskElement(task, options = {}) {
        const {
            isEditing = false,
            onToggle = () => {},
            onEdit = () => {},
            onSave = () => {},
            onCancel = () => {},
            onDelete = () => {}
        } = options;

        const taskElement = Utils.createElement('div', 
            `task-item bg-gray-50 dark:bg-gray-800 rounded-lg p-4 transition-all duration-200 hover:shadow-md border-l-4 ${this.getStatusClasses(task)}`,
            {
                'data-task-id': task.id,
                'role': 'listitem',
                'aria-label': `タスク: ${task.text}`
            }
        );

        const mainContainer = Utils.createElement('div', 'flex items-start gap-3');
        
        // Checkbox
        const checkboxContainer = this.createCheckboxElement(task, onToggle);
        mainContainer.appendChild(checkboxContainer);

        // Content
        const contentContainer = Utils.createElement('div', 'flex-1 min-w-0');
        if (isEditing) {
            contentContainer.appendChild(this.createEditModeContent(task, onSave, onCancel));
        } else {
            contentContainer.appendChild(this.createViewModeContent(task));
        }
        mainContainer.appendChild(contentContainer);

        // Action buttons
        const actionsContainer = this.createActionButtons(task, isEditing, onEdit, onDelete);
        mainContainer.appendChild(actionsContainer);

        taskElement.appendChild(mainContainer);
        return taskElement;
    }

    static createCheckboxElement(task, onToggle) {
        const label = Utils.createElement('label', 'flex items-center cursor-pointer');
        const checkbox = Utils.createElement('input', 'checkbox-custom mt-1', {
            type: 'checkbox',
            'aria-label': `${task.text}を${task.completed ? '未完了' : '完了'}にする`
        });
        
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => onToggle(task.id));

        const srText = Utils.createElement('span', 'sr-only');
        srText.textContent = task.completed ? '完了済み' : '未完了';

        label.appendChild(checkbox);
        label.appendChild(srText);
        return label;
    }

    static createViewModeContent(task) {
        const container = Utils.createElement('div');
        
        // Task text
        const textElement = Utils.createElement('span', 
            `block text-base transition-all duration-200 ${
                task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
            }`
        );
        textElement.textContent = task.text;
        container.appendChild(textElement);

        // Tags
        if (task.tags.length > 0) {
            const tagsContainer = this.createTagsContainer(task.tags);
            container.appendChild(tagsContainer);
        }

        // Deadline
        const deadlineText = task.formatDeadline();
        if (deadlineText) {
            const deadlineContainer = this.createDeadlineContainer(task, deadlineText);
            container.appendChild(deadlineContainer);
        }

        return container;
    }

    static createTagsContainer(tags) {
        const container = Utils.createElement('div', 'mt-2 flex flex-wrap', {
            role: 'list',
            'aria-label': 'タグ'
        });

        tags.forEach(tag => {
            const tagElement = Utils.createElement('span', 
                `inline-flex items-center px-2 py-1 text-xs font-medium rounded-full mr-1 mb-1 tag-${this.getTagClass(tag)}`,
                {
                    role: 'listitem',
                    'aria-label': `タグ: ${tag}`
                }
            );
            tagElement.textContent = tag;
            container.appendChild(tagElement);
        });

        return container;
    }

    static createDeadlineContainer(task, deadlineText) {
        const container = Utils.createElement('div', 'mt-1 flex items-center gap-1');
        
        const icon = Utils.createElement('svg', `w-4 h-4 ${this.getDeadlineClasses(task)}`, {
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24',
            'aria-hidden': 'true'
        });
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>';

        const textElement = Utils.createElement('span', 
            `text-sm ${this.getDeadlineClasses(task)}`,
            { 'aria-label': `締切: ${deadlineText}` }
        );
        textElement.textContent = deadlineText;

        container.appendChild(icon);
        container.appendChild(textElement);
        return container;
    }

    static createEditModeContent(task, onSave, onCancel) {
        const container = Utils.createElement('div', 'edit-mode border-2 border-primary rounded p-3 -m-3', {
            role: 'form',
            'aria-label': 'タスクを編集'
        });

        // Text input
        const textLabel = Utils.createElement('label', 'sr-only', { for: `edit-text-${task.id}` });
        textLabel.textContent = 'タスク名';
        
        const textInput = Utils.createElement('input', 
            `w-full text-base font-normal border-none outline-none bg-transparent ${
                task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
            }`,
            {
                id: `edit-text-${task.id}`,
                type: 'text',
                value: task.text,
                maxlength: '200'
            }
        );

        // Tags input
        const tagsLabel = Utils.createElement('label', 'sr-only', { for: `edit-tags-${task.id}` });
        tagsLabel.textContent = 'タグ';
        
        const tagsInput = Utils.createElement('input',
            'w-full text-sm text-gray-600 dark:text-gray-400 mt-1 border-none outline-none bg-transparent',
            {
                id: `edit-tags-${task.id}`,
                type: 'text',
                placeholder: 'タグ（カンマ区切り）',
                value: task.tags.join(', '),
                maxlength: '100'
            }
        );

        // Deadline input
        const deadlineLabel = Utils.createElement('label', 'sr-only', { for: `edit-deadline-${task.id}` });
        deadlineLabel.textContent = '締切日時';
        
        const deadlineInput = Utils.createElement('input',
            'w-full text-sm text-gray-600 dark:text-gray-400 mt-1 border-none outline-none bg-transparent',
            {
                id: `edit-deadline-${task.id}`,
                type: 'datetime-local',
                value: task.deadline || ''
            }
        );

        // Buttons
        const buttonContainer = Utils.createElement('div', 'flex gap-2 mt-2');
        
        const saveBtn = Utils.createElement('button', 
            'px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors',
            { 'aria-label': '変更を保存' }
        );
        saveBtn.textContent = '保存';
        saveBtn.addEventListener('click', () => {
            const updates = {
                text: textInput.value.trim(),
                tags: Utils.parseTagString(tagsInput.value),
                deadline: deadlineInput.value || null
            };
            onSave(task.id, updates);
        });

        const cancelBtn = Utils.createElement('button',
            'px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors',
            { 'aria-label': '編集をキャンセル' }
        );
        cancelBtn.textContent = 'キャンセル';
        cancelBtn.addEventListener('click', onCancel);

        buttonContainer.appendChild(saveBtn);
        buttonContainer.appendChild(cancelBtn);

        container.appendChild(textLabel);
        container.appendChild(textInput);
        container.appendChild(tagsLabel);
        container.appendChild(tagsInput);
        container.appendChild(deadlineLabel);
        container.appendChild(deadlineInput);
        container.appendChild(buttonContainer);

        return container;
    }

    static createActionButtons(task, isEditing, onEdit, onDelete) {
        const container = Utils.createElement('div', 'flex gap-1 flex-shrink-0');
        
        if (!isEditing) {
            const editBtn = Utils.createElement('button',
                'text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded transition-colors duration-200',
                { 'aria-label': `${task.text}を編集` }
            );
            editBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>';
            editBtn.addEventListener('click', () => onEdit(task.id));
            container.appendChild(editBtn);
        }

        const deleteBtn = Utils.createElement('button',
            'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded transition-colors duration-200',
            { 'aria-label': `${task.text}を削除` }
        );
        deleteBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';
        deleteBtn.addEventListener('click', () => onDelete(task.id));
        container.appendChild(deleteBtn);

        return container;
    }

    static renderTaskList(tasks, container, options = {}) {
        if (!container) {
            throw new Error('Container element is required');
        }

        // Clear container
        container.innerHTML = '';

        if (tasks.length === 0) {
            const emptyState = this.createEmptyState();
            container.appendChild(emptyState);
            return;
        }

        // Render tasks
        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task, options);
            container.appendChild(taskElement);
        });
    }

    static createEmptyState() {
        const container = Utils.createElement('div', 'text-center py-12 text-gray-500 dark:text-gray-400', {
            role: 'status'
        });

        const icon = Utils.createElement('svg', 'w-16 h-16 mx-auto mb-4 opacity-50', {
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24',
            'aria-hidden': 'true'
        });
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>';

        const title = Utils.createElement('p', 'text-lg');
        title.textContent = 'タスクがありません';

        const subtitle = Utils.createElement('p', 'text-sm mt-1');
        subtitle.textContent = '上のフォームから新しいタスクを追加してください';

        container.appendChild(icon);
        container.appendChild(title);
        container.appendChild(subtitle);

        return container;
    }
}