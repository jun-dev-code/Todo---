import { TodoController } from './controllers/TodoController.js';
import { ErrorHandler } from './utils/index.js';
import './assets/styles/main.css';

// Dark mode handling
(() => {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
        document.documentElement.classList.add('dark');
    }
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        document.documentElement.classList.toggle('dark', event.matches);
    });
})();

// App template
const APP_TEMPLATE = `
    <!-- Error Alert -->
    <div id="errorAlert" class="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50 hidden" role="alert">
        <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
            <span id="errorMessage">エラーが発生しました</span>
        </div>
    </div>

    <!-- Success Alert -->
    <div id="successAlert" class="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50 hidden" role="alert">
        <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            <span id="successMessage">操作が完了しました</span>
        </div>
    </div>

    <!-- Notification Permission Banner -->
    <div id="notificationBanner" class="fixed top-20 right-4 max-w-sm bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 shadow-lg z-40 transform translate-x-full transition-transform duration-300" role="banner">
        <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM12 13a3 3 0 100-6 3 3 0 000 6zm0 0v6a9 9 0 009-9H12z"></path>
            </svg>
            <div class="flex-1">
                <p class="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">通知を許可</p>
                <p class="text-xs text-blue-700 dark:text-blue-300 mb-3">締切が近づいたタスクの通知を受け取るには、ブラウザの通知を許可してください。</p>
                <div class="flex gap-2">
                    <button id="allowNotifications" class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors" aria-label="通知を許可">許可</button>
                    <button id="denyNotifications" class="px-3 py-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 text-xs rounded transition-colors" aria-label="通知を後で設定">後で</button>
                </div>
            </div>
        </div>
    </div>

    <div class="min-h-screen p-4 md:p-8">
        <div class="max-w-md mx-auto">
            <!-- Header -->
            <header class="text-center mb-8">
                <h1 class="text-3xl md:text-4xl font-bold text-primary mb-2">Todo App</h1>
                <p class="text-gray-600 dark:text-gray-400">タスクを管理して生産性を向上させましょう</p>
            </header>

            <!-- Add Task Form -->
            <form id="addTaskForm" class="mb-8" role="form" aria-labelledby="add-task-heading">
                <h2 id="add-task-heading" class="sr-only">新しいタスクを追加</h2>
                <div class="space-y-3">
                    <div>
                        <label for="taskInput" class="sr-only">タスク名</label>
                        <input 
                            type="text" 
                            id="taskInput" 
                            placeholder="新しいタスクを入力... (Ctrl+N)"
                            class="w-full text-base px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 transition-colors duration-300"
                            required
                            aria-describedby="task-help"
                            maxlength="200"
                        >
                        <div id="task-help" class="sr-only">タスクの名前を入力してください。最大200文字まで。</div>
                        <div id="taskInputError" class="error-message hidden"></div>
                    </div>
                    <div>
                        <label for="tagInput" class="sr-only">タグ</label>
                        <input 
                            type="text" 
                            id="tagInput" 
                            placeholder="タグを入力（カンマ区切りで複数可）例: 仕事, 緊急"
                            class="w-full text-base px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 transition-colors duration-300"
                            aria-describedby="tag-help"
                            maxlength="100"
                        >
                        <div id="tag-help" class="sr-only">タスクのタグをカンマ区切りで入力してください。</div>
                    </div>
                    <div class="flex gap-2">
                        <div class="flex-1">
                            <label for="deadlineInput" class="sr-only">締切日時</label>
                            <input 
                                type="datetime-local" 
                                id="deadlineInput" 
                                class="w-full text-base px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 transition-colors duration-300"
                                aria-describedby="deadline-help"
                            >
                            <div id="deadline-help" class="sr-only">タスクの締切日時を設定してください。</div>
                        </div>
                        <button 
                            type="submit"
                            id="addTaskBtn"
                            class="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="タスクを追加"
                        >
                            追加
                        </button>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">締切日時とタグは任意です</p>
                </div>
            </form>

            <!-- Search Box -->
            <div class="mb-4">
                <div class="relative">
                    <label for="searchInput" class="sr-only">タスクを検索</label>
                    <input 
                        type="text" 
                        id="searchInput" 
                        placeholder="タスクを検索... (Ctrl+F)"
                        class="w-full text-base px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 transition-colors duration-300"
                        aria-describedby="search-help"
                    >
                    <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <div id="search-help" class="sr-only">タスク名やタグで検索できます。</div>
                </div>
            </div>

            <!-- Sort Options -->
            <div class="mb-4">
                <label for="sortSelect" class="sr-only">並び順を選択</label>
                <select id="sortSelect" class="text-base px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 transition-colors duration-300" aria-label="タスクの並び順">
                    <option value="created-desc">作成日時 (新しい順)</option>
                    <option value="created-asc">作成日時 (古い順)</option>
                    <option value="deadline-asc">締切日時 (近い順)</option>
                    <option value="deadline-desc">締切日時 (遠い順)</option>
                    <option value="name-asc">タスク名 (A-Z)</option>
                    <option value="name-desc">タスク名 (Z-A)</option>
                    <option value="status-asc">完了状況 (未完了→完了)</option>
                    <option value="status-desc">完了状況 (完了→未完了)</option>
                </select>
            </div>

            <!-- Filter Buttons -->
            <div class="flex flex-wrap gap-2 mb-4" role="group" aria-label="タスクフィルター">
                <button class="filter-btn" aria-pressed="true" data-filter="all">すべて</button>
                <button class="filter-btn" aria-pressed="false" data-filter="active">未完了</button>
                <button class="filter-btn" aria-pressed="false" data-filter="completed">完了済み</button>
                <button class="filter-btn" aria-pressed="false" data-filter="overdue">期限切れ</button>
            </div>

            <!-- Tag Filters -->
            <div id="tagFilters" class="flex flex-wrap gap-2 mb-6" role="group" aria-label="タグフィルター">
                <!-- Tag filter buttons will be dynamically added here -->
            </div>

            <!-- Task Count -->
            <div class="mb-4" role="status" aria-live="polite">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    <span id="taskCount">0</span> 個のタスク
                    (<span id="completedCount">0</span> 完了, <span id="overdueCount">0</span> 期限切れ)
                </p>
            </div>

            <!-- Task List -->
            <div id="taskList" class="space-y-3" role="list" aria-label="タスク一覧">
                <!-- Tasks will be dynamically added here -->
            </div>

            <!-- Clear Completed Button -->
            <div class="mt-6 text-center">
                <button 
                    id="clearCompleted" 
                    class="px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors duration-200 hidden"
                    aria-label="完了済みタスクを削除"
                >
                    完了済みタスクを削除
                </button>
            </div>

            <!-- Keyboard Shortcuts Help -->
            <div class="mt-6 text-center">
                <button id="helpBtn" class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" aria-label="キーボードショートカットを表示">
                    ⌨️ キーボードショートカット (?)
                </button>
            </div>
        </div>
    </div>

    <!-- Help Modal -->
    <div id="helpModal" class="modal" role="dialog" aria-labelledby="helpModalTitle" aria-modal="true">
        <div class="modal-content">
            <div class="flex justify-between items-center mb-4">
                <h2 id="helpModalTitle" class="text-xl font-bold">⌨️ キーボードショートカット</h2>
                <button id="closeHelpModal" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="ヘルプを閉じる">✕</button>
            </div>
            <dl class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div class="flex justify-between py-1">
                    <dt class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">Ctrl + N</dt>
                    <dd class="ml-2">新しいタスクを追加</dd>
                </div>
                <div class="flex justify-between py-1">
                    <dt class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">Ctrl + F</dt>
                    <dd class="ml-2">検索にフォーカス</dd>
                </div>
                <div class="flex justify-between py-1">
                    <dt class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">Ctrl + A</dt>
                    <dd class="ml-2">すべてのタスクを表示</dd>
                </div>
                <div class="flex justify-between py-1">
                    <dt class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">Ctrl + 1</dt>
                    <dd class="ml-2">未完了タスクを表示</dd>
                </div>
                <div class="flex justify-between py-1">
                    <dt class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">Ctrl + 2</dt>
                    <dd class="ml-2">完了済みタスクを表示</dd>
                </div>
                <div class="flex justify-between py-1">
                    <dt class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">Ctrl + 3</dt>
                    <dd class="ml-2">期限切れタスクを表示</dd>
                </div>
                <div class="flex justify-between py-1">
                    <dt class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">?</dt>
                    <dd class="ml-2">このヘルプを表示</dd>
                </div>
                <div class="flex justify-between py-1">
                    <dt class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">Esc</dt>
                    <dd class="ml-2">モーダルを閉じる</dd>
                </div>
            </dl>
            <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p class="font-semibold mb-2 text-sm">💡 使い方のヒント:</p>
                <ul class="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <li>• 数字キーでフィルターを素早く切り替え</li>
                    <li>• Ctrl+Nでいつでも新規タスク作成</li>
                    <li>• Ctrl+Fで検索してタスクを素早く発見</li>
                    <li>• Escキーで入力をキャンセル</li>
                </ul>
            </div>
        </div>
    </div>
`;

// Initialize the app
let todoController;

try {
    // Inject app template
    const appContainer = document.getElementById('app');
    if (!appContainer) {
        throw new Error('App container not found');
    }
    
    appContainer.innerHTML = APP_TEMPLATE;
    
    // Initialize controller
    todoController = new TodoController();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (todoController) {
            todoController.destroy();
        }
    });
    
    // Add show class to notification banner for animation
    const notificationBanner = document.getElementById('notificationBanner');
    if (notificationBanner) {
        notificationBanner.classList.add('show');
    }
    
} catch (error) {
    ErrorHandler.handleError(error, 'App initialization');
    const appContainer = document.getElementById('app');
    if (appContainer) {
        appContainer.innerHTML = `
            <div class="flex items-center justify-center min-h-screen">
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-red-600 mb-4">アプリケーションエラー</h1>
                    <p class="text-gray-600 mb-4">アプリの初期化に失敗しました。</p>
                    <button onclick="window.location.reload()" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
                        ページを再読み込み
                    </button>
                </div>
            </div>
        `;
    }
}