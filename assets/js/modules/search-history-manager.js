/**
 * 搜索历史管理模块 - 负责管理搜索历史和建议功能
 */
class SearchHistoryManager {
    constructor(options = {}) {
        this.options = {
            maxHistoryItems: 10,
            maxSuggestions: 5,
            storageKey: 'enhanced-search-history',
            enableSuggestions: true,
            enableHistory: true,
            ...options
        };
        
        this.searchManager = null;
        this.searchHistory = [];
        this.popularTerms = [];
        this.isInitialized = false;
    }

    /**
     * 初始化搜索历史管理器
     */
    async initialize(searchManager) {
        try {
            this.searchManager = searchManager;
            this.loadSearchHistory();
            this.loadPopularTerms();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('搜索历史管理器初始化完成');
        } catch (error) {
            console.error('搜索历史管理器初始化失败:', error);
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 清除历史按钮
        const clearHistoryBtn = document.getElementById('clear-history-btn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                this.clearSearchHistory();
            });
        }

        // 搜索输入框事件
        const searchInput = document.getElementById('advanced-search-input');
        if (searchInput) {
            searchInput.addEventListener('focus', () => {
                this.showSearchHistory();
                this.showPopularTerms();
            });

            searchInput.addEventListener('input', debounce((e) => {
                const query = e.target.value.trim();
                if (query) {
                    this.showSuggestions(query);
                } else {
                    this.hideSuggestions();
                    this.showSearchHistory();
                    this.showPopularTerms();
                }
            }, 300));
        }

        // 点击页面其他地方隐藏建议
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-input-group')) {
                this.hideSuggestions();
            }
        });
    }

    /**
     * 加载搜索历史
     */
    loadSearchHistory() {
        if (!this.options.enableHistory) return;

        try {
            const history = localStorage.getItem(this.options.storageKey);
            if (history) {
                this.searchHistory = JSON.parse(history);
                this.displaySearchHistory();
            }
        } catch (error) {
            console.warn('无法加载搜索历史:', error);
            this.searchHistory = [];
        }
    }

    /**
     * 保存搜索历史
     */
    saveSearchHistory() {
        if (!this.options.enableHistory) return;

        try {
            localStorage.setItem(this.options.storageKey, JSON.stringify(this.searchHistory));
        } catch (error) {
            console.warn('无法保存搜索历史:', error);
        }
    }

    /**
     * 添加到搜索历史
     */
    addToSearchHistory(query) {
        if (!this.options.enableHistory || !query || query.trim() === '') return;

        query = query.trim();
        
        // 移除重复项
        this.searchHistory = this.searchHistory.filter(item => item !== query);
        
        // 添加到开头
        this.searchHistory.unshift(query);
        
        // 限制历史记录数量
        if (this.searchHistory.length > this.options.maxHistoryItems) {
            this.searchHistory = this.searchHistory.slice(0, this.options.maxHistoryItems);
        }
        
        // 保存
        this.saveSearchHistory();
        this.displaySearchHistory();
    }

    /**
     * 清除搜索历史
     */
    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
        this.displaySearchHistory();
    }

    /**
     * 显示搜索历史
     */
    displaySearchHistory() {
        const historyContainer = document.getElementById('search-history-list');
        const historySection = document.getElementById('search-history-container');

        if (!historyContainer || !historySection) return;

        if (this.searchHistory.length === 0) {
            historySection.style.display = 'none';
            return;
        }

        historySection.style.display = 'block';
        historyContainer.innerHTML = this.searchHistory.map(query => `
            <div class="search-history-item" data-query="${this.escapeHtml(query)}">
                <span>${this.escapeHtml(query)}</span>
                <span class="remove">×</span>
            </div>
        `).join('');

        // 绑定点击事件
        historyContainer.querySelectorAll('.search-history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove')) {
                    // 移除历史项
                    const query = item.dataset.query;
                    this.searchHistory = this.searchHistory.filter(h => h !== query);
                    this.saveSearchHistory();
                    this.displaySearchHistory();
                } else {
                    // 执行搜索
                    const query = item.dataset.query;
                    const searchInput = document.getElementById('advanced-search-input');
                    if (searchInput) {
                        searchInput.value = query;
                        this.addToSearchHistory(query);
                        
                        // 触发搜索事件
                        const searchEvent = new CustomEvent('performSearch', { detail: { query } });
                        document.dispatchEvent(searchEvent);
                    }
                }
            });
        });
    }

    /**
     * 加载热门搜索词
     */
    loadPopularTerms() {
        if (!this.searchManager || !this.options.enableSuggestions) return;

        try {
            this.popularTerms = this.searchManager.getPopularTerms(this.options.maxSuggestions);
        } catch (error) {
            console.warn('无法加载热门搜索词:', error);
            this.popularTerms = [];
        }
    }

    /**
     * 显示热门搜索词
     */
    showPopularTerms() {
        const popularContainer = document.getElementById('popular-terms-container');
        if (!popularContainer || this.popularTerms.length === 0) return;

        popularContainer.style.display = 'block';
        popularContainer.innerHTML = `
            <h4>热门搜索</h4>
            <div class="popular-terms-list">
                ${this.popularTerms.map(term => `
                    <span class="popular-term" data-term="${this.escapeHtml(term)}">${this.escapeHtml(term)}</span>
                `).join('')}
            </div>
        `;

        // 绑定点击事件
        popularContainer.querySelectorAll('.popular-term').forEach(term => {
            term.addEventListener('click', () => {
                const searchTerm = term.dataset.term;
                const searchInput = document.getElementById('advanced-search-input');
                if (searchInput) {
                    searchInput.value = searchTerm;
                    this.addToSearchHistory(searchTerm);
                    
                    // 触发搜索事件
                    const searchEvent = new CustomEvent('performSearch', { detail: { query: searchTerm } });
                    document.dispatchEvent(searchEvent);
                }
            });
        });
    }

    /**
     * 显示搜索建议
     */
    showSuggestions(query) {
        if (!this.searchManager || !this.options.enableSuggestions) return;

        const suggestions = this.searchManager.getSuggestions(query, this.options.maxSuggestions);
        const suggestionsContainer = document.getElementById('advanced-search-suggestions');

        if (!suggestionsContainer) return;

        if (suggestions.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        suggestionsContainer.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item" data-suggestion="${this.escapeHtml(suggestion)}">
                ${this.highlightText(suggestion, query)}
            </div>
        `).join('');

        suggestionsContainer.style.display = 'block';

        // 绑定点击事件
        suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const suggestion = item.dataset.suggestion;
                const searchInput = document.getElementById('advanced-search-input');
                if (searchInput) {
                    searchInput.value = suggestion;
                    this.addToSearchHistory(suggestion);
                    this.hideSuggestions();
                    
                    // 触发搜索事件
                    const searchEvent = new CustomEvent('performSearch', { detail: { query: suggestion } });
                    document.dispatchEvent(searchEvent);
                }
            });
        });
    }

    /**
     * 隐藏搜索建议
     */
    hideSuggestions() {
        const suggestionsContainer = document.getElementById('advanced-search-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }

    /**
     * 显示搜索历史
     */
    showSearchHistory() {
        const historyContainer = document.getElementById('search-history-list');
        const historySection = document.getElementById('search-history-container');

        if (!historyContainer || !historySection || this.searchHistory.length === 0) {
            if (historySection) {
                historySection.style.display = 'none';
            }
            return;
        }

        historySection.style.display = 'block';
        historyContainer.innerHTML = this.searchHistory.map(query => `
            <div class="search-history-item" data-query="${this.escapeHtml(query)}">
                <span>${this.escapeHtml(query)}</span>
                <span class="remove">×</span>
            </div>
        `).join('');

        // 绑定点击事件
        historyContainer.querySelectorAll('.search-history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove')) {
                    // 移除历史项
                    const query = item.dataset.query;
                    this.searchHistory = this.searchHistory.filter(h => h !== query);
                    this.saveSearchHistory();
                    this.displaySearchHistory();
                } else {
                    // 执行搜索
                    const query = item.dataset.query;
                    const searchInput = document.getElementById('advanced-search-input');
                    if (searchInput) {
                        searchInput.value = query;
                        this.addToSearchHistory(query);
                        
                        // 触发搜索事件
                        const searchEvent = new CustomEvent('performSearch', { detail: { query } });
                        document.dispatchEvent(searchEvent);
                    }
                }
            });
        });
    }

    /**
     * 高亮文本
     */
    highlightText(text, query) {
        if (!query || !text) return text || '';

        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    /**
     * 转义正则表达式特殊字符
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * 转义HTML字符
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 获取搜索历史
     */
    getSearchHistory() {
        return [...this.searchHistory];
    }

    /**
     * 获取热门搜索词
     */
    getPopularTerms() {
        return [...this.popularTerms];
    }

    /**
     * 更新热门搜索词
     */
    updatePopularTerms() {
        if (this.searchManager) {
            this.popularTerms = this.searchManager.getPopularTerms(this.options.maxSuggestions);
            this.showPopularTerms();
        }
    }

    /**
     * 获取统计信息
     */
    getStats() {
        if (!this.isInitialized) {
            return null;
        }

        return {
            historyLength: this.searchHistory.length,
            popularTermsLength: this.popularTerms.length,
            maxHistoryItems: this.options.maxHistoryItems,
            maxSuggestions: this.options.maxSuggestions
        };
    }

    /**
     * 销毁搜索历史管理器
     */
    destroy() {
        // 清理事件监听器和资源
        this.searchHistory = [];
        this.popularTerms = [];
        this.isInitialized = false;
        console.log('搜索历史管理器已销毁');
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchHistoryManager;
} else if (typeof window !== 'undefined') {
    window.SearchHistoryManager = SearchHistoryManager;
}