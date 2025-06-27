import { CONFIG } from '../constants/index.js';
import { Utils } from '../utils/index.js';

export class NotificationService {
    constructor() {
        this.notifiedTasks = new Set();
        this.intervalId = null;
        this.permission = this.getPermissionStatus();
    }

    getPermissionStatus() {
        if (!('Notification' in window)) {
            return 'not-supported';
        }
        return Notification.permission;
    }

    async requestPermission() {
        if (!('Notification' in window)) {
            throw new Error('このブラウザは通知をサポートしていません');
        }

        const permission = await Notification.requestPermission();
        this.permission = permission;
        
        if (permission === 'granted') {
            this.sendTestNotification();
        }
        
        return permission;
    }

    sendTestNotification() {
        try {
            new Notification('Todo App', {
                body: '通知が有効になりました！',
                icon: this.getNotificationIcon(),
                tag: 'todo-app-test'
            });
        } catch (error) {
            console.error('Test notification failed:', error);
        }
    }

    getNotificationIcon() {
        return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%235D5CDE"><path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>';
    }

    startChecking(getTasks) {
        if (this.intervalId) {
            this.stopChecking();
        }

        this.intervalId = setInterval(() => {
            try {
                const tasks = getTasks();
                this.checkTaskDeadlines(tasks);
            } catch (error) {
                console.error('Error checking task deadlines:', error);
            }
        }, CONFIG.NOTIFICATION_CHECK_INTERVAL);
    }

    stopChecking() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    checkTaskDeadlines(tasks) {
        if (this.permission !== 'granted') return;

        const now = new Date();
        const activeTasks = tasks.filter(t => !t.completed && t.deadline);

        activeTasks.forEach(task => {
            try {
                const deadline = new Date(task.deadline);
                if (!Utils.isValidDate(deadline)) return;
                
                const timeDiff = deadline.getTime() - now.getTime();
                const hoursDiff = timeDiff / (1000 * 60 * 60);

                // 1時間前に通知
                if (hoursDiff <= 1 && hoursDiff > 0 && !this.notifiedTasks.has(task.id)) {
                    this.sendTaskNotification(task, '1時間以内に締切です');
                    this.notifiedTasks.add(task.id);
                }
                // 期限切れ通知
                else if (hoursDiff <= 0 && hoursDiff > -1 && !this.notifiedTasks.has(`overdue_${task.id}`)) {
                    this.sendTaskNotification(task, '締切を過ぎました');
                    this.notifiedTasks.add(`overdue_${task.id}`);
                }
            } catch (error) {
                console.error('Error processing task notification:', error);
            }
        });
    }

    sendTaskNotification(task, message) {
        try {
            new Notification(`Todo App - ${message}`, {
                body: Utils.escapeHtml(task.text),
                icon: this.getNotificationIcon(),
                tag: `task_${task.id}`,
                requireInteraction: true,
                actions: [
                    {
                        action: 'complete',
                        title: '完了'
                    },
                    {
                        action: 'dismiss',
                        title: '閉じる'
                    }
                ]
            });
        } catch (error) {
            console.error('Failed to send task notification:', error);
        }
    }

    clearTaskNotifications(taskId) {
        this.notifiedTasks.delete(taskId);
        this.notifiedTasks.delete(`overdue_${taskId}`);
    }

    clearAllNotifications() {
        this.notifiedTasks.clear();
    }

    getNotificationStats() {
        return {
            permission: this.permission,
            isChecking: this.intervalId !== null,
            notifiedTasksCount: this.notifiedTasks.size
        };
    }
}