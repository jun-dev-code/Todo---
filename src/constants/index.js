export const CONFIG = {
    MAX_TASK_LENGTH: 200,
    MAX_TAG_LENGTH: 100,
    DEBOUNCE_DELAY: 300,
    NOTIFICATION_CHECK_INTERVAL: 60000,
    ALERT_DURATION: {
        ERROR: 5000,
        SUCCESS: 3000
    }
};

export const TASK_STATUS = {
    COMPLETED: 'completed',
    NORMAL: 'normal',
    OVERDUE: 'overdue',
    DUE_SOON: 'due-soon'
};

export const FILTER_TYPES = {
    ALL: 'all',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    OVERDUE: 'overdue'
};

export const SORT_TYPES = {
    CREATED_DESC: 'created-desc',
    CREATED_ASC: 'created-asc',
    DEADLINE_ASC: 'deadline-asc',
    DEADLINE_DESC: 'deadline-desc',
    NAME_ASC: 'name-asc',
    NAME_DESC: 'name-desc',
    STATUS_ASC: 'status-asc',
    STATUS_DESC: 'status-desc'
};

export const KEYBOARD_SHORTCUTS = {
    ADD_TASK: ['ctrl+n', 'cmd+n'],
    SEARCH: ['ctrl+f', 'cmd+f'],
    HELP: ['?'],
    ESCAPE: ['escape'],
    FILTER_ALL: ['ctrl+a', 'cmd+a'],
    FILTER_ACTIVE: ['ctrl+1', 'cmd+1'],
    FILTER_COMPLETED: ['ctrl+2', 'cmd+2'],
    FILTER_OVERDUE: ['ctrl+3', 'cmd+3']
};