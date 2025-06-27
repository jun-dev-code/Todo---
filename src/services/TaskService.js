import { EventEmitter } from '../utils/index.js';
import { Task } from '../models/Task.js';

export class TaskService extends EventEmitter {
    constructor() {
        super();
        this.tasks = new Map();
        this.nextId = 1;
    }

    addTask(taskData) {
        const task = new Task({ ...taskData, id: this.nextId++ });
        this.tasks.set(task.id, task);
        this.emit('taskAdded', task);
        this.emit('tasksChanged');
        return task;
    }

    updateTask(id, updates) {
        const task = this.tasks.get(id);
        if (!task) {
            throw new Error(`Task with id ${id} not found`);
        }

        task.update(updates);
        this.emit('taskUpdated', task);
        this.emit('tasksChanged');
        return task;
    }

    deleteTask(id) {
        const task = this.tasks.get(id);
        if (!task) {
            throw new Error(`Task with id ${id} not found`);
        }

        this.tasks.delete(id);
        this.emit('taskDeleted', { id, task });
        this.emit('tasksChanged');
        return task;
    }

    toggleTask(id) {
        const task = this.tasks.get(id);
        if (!task) {
            throw new Error(`Task with id ${id} not found`);
        }

        task.toggle();
        this.emit('taskUpdated', task);
        this.emit('tasksChanged');
        return task;
    }

    getTasks() {
        return Array.from(this.tasks.values());
    }

    getTask(id) {
        return this.tasks.get(id);
    }

    clearCompleted() {
        const completedTasks = Array.from(this.tasks.values()).filter(task => task.completed);
        completedTasks.forEach(task => this.tasks.delete(task.id));
        
        if (completedTasks.length > 0) {
            this.emit('tasksCleared', completedTasks);
            this.emit('tasksChanged');
        }
        
        return completedTasks.length;
    }

    getAllTags() {
        const tags = new Set();
        this.tasks.forEach(task => {
            task.tags.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }

    getCompletedTasks() {
        return this.getTasks().filter(task => task.completed);
    }

    getActiveTasks() {
        return this.getTasks().filter(task => !task.completed);
    }

    getOverdueTasks() {
        return this.getTasks().filter(task => task.isOverdue());
    }

    getStats() {
        const tasks = this.getTasks();
        const completed = this.getCompletedTasks();
        const overdue = this.getOverdueTasks();
        
        return {
            total: tasks.length,
            completed: completed.length,
            active: tasks.length - completed.length,
            overdue: overdue.length,
            completionRate: tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0
        };
    }

    exportData() {
        return {
            tasks: this.getTasks().map(task => task.toJSON()),
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    importData(data) {
        try {
            if (!data.tasks || !Array.isArray(data.tasks)) {
                throw new Error('Invalid data format');
            }

            this.tasks.clear();
            this.nextId = 1;

            data.tasks.forEach(taskData => {
                const task = Task.fromJSON(taskData);
                this.tasks.set(task.id, task);
                this.nextId = Math.max(this.nextId, task.id + 1);
            });

            this.emit('tasksImported', data.tasks.length);
            this.emit('tasksChanged');
            return data.tasks.length;
        } catch (error) {
            throw new Error(`Import failed: ${error.message}`);
        }
    }
}