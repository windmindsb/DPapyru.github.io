// 搜索功能实现
class TutorialSearch {
    constructor() {
        this.searchIndex = [];
        this.searchResults = [];
        this.isSearchVisible = false;
        this.currentQuery = '';
        this.init();
    }

    // 初始化搜索功能
    init() {
        this.createSearchElements();
        this.bindEvents();
        this.loadSearchIndex();
    }

    // 创建搜索相关的DOM元素
    createSearchElements() {
        // 创建搜索容器
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        
        // 创建搜索框
        const searchBox = document.createElement('div');
        searchBox.className = 'search-box';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'search-input';
        searchInput.placeholder = '搜索教程...';
        searchInput.id = 'search-input';
        
        const searchButton = document.createElement('button');
        searchButton.className = 'search-button';
        searchButton.innerHTML = '<i class="icon-search"></i>';
        searchButton.id = 'search-button';
        
        const clearButton = document.createElement('button');
        clearButton.className = 'search-clear';
        clearButton.innerHTML = '<i class="icon-clear"></i>';
        clearButton.id = 'search-clear';
        clearButton.style.display = 'none';
        
        searchBox.appendChild(searchInput);
        searchBox.appendChild(searchButton);
        searchBox.appendChild(clearButton);
        
        // 创建搜索建议下拉框
        const searchSuggestions = document.createElement('div');
        searchSuggestions.className = 'search-suggestions';
        searchSuggestions.id = 'search-suggestions';
        
        // 创建搜索结果容器
        const searchResults = document.createElement('div');
        searchResults.className = 'search-results';
        searchResults.id = 'search-results';
        searchResults.style.display = 'none';
        
        searchContainer.appendChild(searchBox);
        searchContainer.appendChild(searchSuggestions);
        searchContainer.appendChild(searchResults);
        
        // 将搜索容器添加到导航栏
        const mainNav = document.querySelector('.main-nav');
        if (mainNav) {
            mainNav.appendChild(searchContainer);
        }
    }

    // 绑定事件
    bindEvents() {
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        const clearButton = document.getElementById('search-clear');
        
        // 搜索输入事件
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                this.handleSearchInput(e.target.value);
            }, 300));
            
            searchInput.addEventListener('focus', () => {
                this.showSearchSuggestions();
            });
            
            searchInput.addEventListener('keydown', (e) => {
                this.handleKeydown(e);
            });
        }
        
        // 搜索按钮点击事件
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                this.performSearch();
            });
        }
        
        // 清除按钮点击事件
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearSearch();
            });
        }
        
        // 点击页面其他地方关闭搜索结果
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideSearchResults();
                this.hideSearchSuggestions();
            }
        });
        
        // ESC键关闭搜索
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isSearchVisible) {
                this.hideSearchResults();
                document.getElementById('search-input').blur();
            }
        });
        
        // Ctrl+K 或 Cmd+K 聚焦搜索框
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        });
    }

    // 加载搜索索引
    async loadSearchIndex() {
        try {
            // 显示加载状态
            this.showLoadingState();
            
            // 获取所有教程文件
            const tutorialFiles = await this.getTutorialFiles();
            
            // 为每个文件创建索引
            for (const file of tutorialFiles) {
                try {
                    const response = await fetch(file);
                    if (!response.ok) continue;
                    
                    const content = await response.text();
                    const metadata = this.parseMetadata(content);
                    const plainText = this.stripMarkdown(content);
                    
                    this.searchIndex.push({
                        title: metadata.title || this.extractTitle(content),
                        url: file,
                        content: plainText,
                        description: metadata.description || this.extractDescription(plainText),
                        category: metadata.category || '未分类',
                        difficulty: metadata.difficulty || '未知',
                        time: metadata.time || '未知',
                        author: metadata.author || '未知',
                        date: metadata.date || '未知'
                    });
                } catch (error) {
                    console.warn(`无法加载文件 ${file}:`, error);
                }
            }
            
            console.log(`搜索索引加载完成，共 ${this.searchIndex.length} 个教程`);
            this.hideLoadingState();
        } catch (error) {
            console.error('加载搜索索引失败:', error);
            this.hideLoadingState();
        }
    }

    // 获取所有教程文件
    async getTutorialFiles() {
        // 这里应该返回所有教程文件的路径
        // 由于我们无法直接读取目录，我们手动列出所有已知的教程文件
        return [
            'docs/tutorial-index.md',
            'docs/getting-started.md',
            'docs/basic-concepts.md'
        ];
    }

    // 解析文件元数据
    parseMetadata(content) {
        const metadataMatch = content.match(/^---\n(.*?)\n---/s);
        if (!metadataMatch) return {};
        
        const metadata = {};
        const lines = metadataMatch[1].split('\n');
        
        lines.forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
                metadata[key.trim()] = valueParts.join(':').trim();
            }
        });
        
        return metadata;
    }

    // 提取标题
    extractTitle(content) {
        const titleMatch = content.match(/^#\s+(.+)$/m);
        return titleMatch ? titleMatch[1] : '无标题';
    }

    // 提取描述
    extractDescription(plainText) {
        // 取前100个字符作为描述
        return plainText.substring(0, 100).trim() + '...';
    }

    // 去除Markdown标记
    stripMarkdown(content) {
        // 移除元数据
        content = content.replace(/^---\n.*?\n---\n/s, '');
        
        // 移除代码块
        content = content.replace(/```[\s\S]*?```/g, '');
        
        // 移除行内代码
        content = content.replace(/`[^`]*`/g, '');
        
        // 移除链接
        content = content.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
        
        // 移除图片
        content = content.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
        
        // 移除标题标记
        content = content.replace(/^#{1,6}\s+/gm, '');
        
        // 移除加粗和斜体标记
        content = content.replace(/\*\*([^*]*)\*\*/g, '$1');
        content = content.replace(/\*([^*]*)\*/g, '$1');
        content = content.replace(/__([^_]*)__/g, '$1');
        content = content.replace(/_([^_]*)_/g, '$1');
        
        // 移除列表标记
        content = content.replace(/^[-*+]\s+/gm, '');
        content = content.replace(/^\d+\.\s+/gm, '');
        
        // 移除引用标记
        content = content.replace(/^>\s+/gm, '');
        
        // 移除多余的换行符
        content = content.replace(/\n+/g, ' ');
        
        return content.trim();
    }

    // 处理搜索输入
    handleSearchInput(query) {
        this.currentQuery = query.trim();
        const clearButton = document.getElementById('search-clear');
        
        if (this.currentQuery) {
            clearButton.style.display = 'block';
            this.showSearchSuggestions();
        } else {
            clearButton.style.display = 'none';
            this.hideSearchSuggestions();
        }
    }

    // 显示搜索建议
    showSearchSuggestions() {
        if (!this.currentQuery) return;
        
        const suggestions = this.getSuggestions(this.currentQuery);
        const suggestionsContainer = document.getElementById('search-suggestions');
        
        if (suggestions.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        suggestionsContainer.innerHTML = '';
        
        suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.innerHTML = this.highlightText(suggestion.title, this.currentQuery);
            
            item.addEventListener('click', () => {
                document.getElementById('search-input').value = suggestion.title;
                this.currentQuery = suggestion.title;
                this.performSearch();
            });
            
            suggestionsContainer.appendChild(item);
        });
        
        suggestionsContainer.style.display = 'block';
    }

    // 隐藏搜索建议
    hideSearchSuggestions() {
        document.getElementById('search-suggestions').style.display = 'none';
    }

    // 获取搜索建议
    getSuggestions(query) {
        if (!query) return [];
        
        const lowerQuery = query.toLowerCase();
        return this.searchIndex
            .filter(item => item.title.toLowerCase().includes(lowerQuery))
            .slice(0, 5); // 最多显示5个建议
    }

    // 执行搜索
    performSearch() {
        if (!this.currentQuery) return;
        
        this.hideSearchSuggestions();
        this.searchResults = this.search(this.currentQuery);
        this.displaySearchResults();
    }

    // 搜索功能
    search(query) {
        if (!query) return [];
        
        const lowerQuery = query.toLowerCase();
        const results = [];
        
        this.searchIndex.forEach(item => {
            const titleMatch = item.title.toLowerCase().includes(lowerQuery);
            const contentMatch = item.content.toLowerCase().includes(lowerQuery);
            const descriptionMatch = item.description.toLowerCase().includes(lowerQuery);
            
            if (titleMatch || contentMatch || descriptionMatch) {
                let score = 0;
                
                // 标题匹配得分最高
                if (titleMatch) score += 10;
                
                // 描述匹配得分中等
                if (descriptionMatch) score += 5;
                
                // 内容匹配得分较低
                if (contentMatch) score += 1;
                
                // 完全匹配得分更高
                if (item.title.toLowerCase() === lowerQuery) score += 20;
                
                results.push({
                    ...item,
                    score
                });
            }
        });
        
        // 按得分排序
        return results.sort((a, b) => b.score - a.score);
    }

    // 显示搜索结果
    displaySearchResults() {
        const resultsContainer = document.getElementById('search-results');
        
        if (this.searchResults.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-no-results">
                    <p>没有找到与 "${this.currentQuery}" 相关的教程</p>
                </div>
            `;
        } else {
            resultsContainer.innerHTML = `
                <div class="search-results-header">
                    <h3>搜索结果 (${this.searchResults.length})</h3>
                    <button class="search-close" id="search-close">×</button>
                </div>
                <div class="search-results-list">
                    ${this.searchResults.map(result => this.createResultItem(result)).join('')}
                </div>
            `;
            
            // 绑定关闭按钮事件
            document.getElementById('search-close').addEventListener('click', () => {
                this.hideSearchResults();
            });
        }
        
        resultsContainer.style.display = 'block';
        this.isSearchVisible = true;
    }

    // 创建搜索结果项
    createResultItem(result) {
        const highlightedTitle = this.highlightText(result.title, this.currentQuery);
        const highlightedDescription = this.highlightText(result.description, this.currentQuery);
        
        return `
            <div class="search-result-item" data-url="${result.url}">
                <h4 class="search-result-title">${highlightedTitle}</h4>
                <p class="search-result-description">${highlightedDescription}</p>
                <div class="search-result-meta">
                    <span class="search-result-category">${this.getCategoryText(result.category)}</span>
                    <span class="search-result-difficulty ${result.difficulty}">${this.getDifficultyText(result.difficulty)}</span>
                    <span class="search-result-time">${result.time}分钟</span>
                </div>
            </div>
        `;
    }

    // 高亮文本
    highlightText(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    // 转义正则表达式特殊字符
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // 隐藏搜索结果
    hideSearchResults() {
        document.getElementById('search-results').style.display = 'none';
        this.isSearchVisible = false;
    }

    // 清除搜索
    clearSearch() {
        document.getElementById('search-input').value = '';
        document.getElementById('search-clear').style.display = 'none';
        this.currentQuery = '';
        this.hideSearchResults();
        this.hideSearchSuggestions();
    }

    // 处理键盘事件
    handleKeydown(e) {
        const suggestionsContainer = document.getElementById('search-suggestions');
        const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            // 实现向下导航建议
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            // 实现向上导航建议
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (suggestions.length > 0) {
                // 选择第一个建议
                suggestions[0].click();
            } else {
                this.performSearch();
            }
        } else if (e.key === 'Escape') {
            this.hideSearchSuggestions();
            this.hideSearchResults();
        }
    }

    // 显示加载状态
    showLoadingState() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.placeholder = '正在加载搜索索引...';
            searchInput.disabled = true;
        }
    }

    // 隐藏加载状态
    hideLoadingState() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.placeholder = '搜索教程...';
            searchInput.disabled = false;
        }
    }

    // 获取类别文本
    getCategoryText(category) {
        const categories = {
            'getting-started': '入门指南',
            'basic-concepts': '基础概念',
            'mod-development': 'Mod开发',
            'advanced-topics': '高级主题',
            'resources': '资源参考'
        };
        return categories[category] || category;
    }

    // 获取难度文本
    getDifficultyText(difficulty) {
        const difficulties = {
            'beginner': '初级',
            'intermediate': '中级',
            'advanced': '高级'
        };
        return difficulties[difficulty] || difficulty;
    }
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// 初始化搜索功能
document.addEventListener('DOMContentLoaded', function() {
    // 确保在主脚本之后初始化搜索
    setTimeout(() => {
        window.tutorialSearch = new TutorialSearch();
    }, 100);
});