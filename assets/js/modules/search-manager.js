/**
 * 搜索管理模块 - 索责文档搜索功能
 */
class SearchManager {
    constructor(options = {}) {
        this.options = {
            minQueryLength: 2,
            maxResults: 20,
            highlightResults: true,
            searchFields: ['title', 'description', 'author', 'category', 'topic', 'tags'],
            ...options
        };
        
        this.searchIndex = [];
        this.isInitialized = false;
    }

    /**
     * 初始化搜索功能
     */
    async initialize(configManager) {
        try {
            this.configManager = configManager;
            await this.buildSearchIndex();
            this.isInitialized = true;
            console.log('搜索管理器初始化完成');
        } catch (error) {
            console.error('搜索管理器初始化失败:', error);
        }
    }

    /**
     * 构建搜索索引
     */
    async buildSearchIndex() {
        if (!this.configManager) {
            console.warn('配置管理器未初始化');
            return;
        }

        const allFiles = this.configManager.getAllFiles();
        const categories = this.configManager.getCategories();
        const topics = this.configManager.getTopics();

        this.searchIndex = allFiles.map(file => {
            const category = categories[file.category];
            const topic = topics[file.topic];

            // 构建搜索文本
            const searchText = [
                file.title || '',
                file.description || '',
                file.author || '',
                category ? category.title : '',
                topic ? topic.title : '',
                Array.isArray(file.tags) ? file.tags.join(' ') : (file.tags || '')
            ].join(' ').toLowerCase();

            return {
                ...file,
                categoryTitle: category ? category.title : file.category,
                topicTitle: topic ? topic.title : file.topic,
                searchText: searchText,
                categoryIcon: category ? category.icon : '📄',
                topicIcon: topic ? topic.icon : '📄'
            };
        });

        console.log(`搜索索引构建完成，共 ${this.searchIndex.length} 个文档`);
    }

    /**
     * 执行搜索
     */
    search(query) {
        if (!this.isInitialized) {
            console.warn('搜索管理器未初始化');
            return [];
        }

        if (!query || query.trim().length < this.options.minQueryLength) {
            return [];
        }

        const searchTerm = query.toLowerCase().trim();
        const results = [];

        // 遍历搜索索引
        for (const item of this.searchIndex) {
            if (results.length >= this.options.maxResults) {
                break;
            }

            // 计算相关性分数
            const score = this.calculateRelevance(item, searchTerm);
            
            if (score > 0) {
                results.push({
                    ...item,
                    relevanceScore: score,
                    highlightedTitle: this.options.highlightResults ? 
                        this.highlightText(item.title, searchTerm) : item.title,
                    highlightedDescription: this.options.highlightResults ? 
                        this.highlightText(item.description, searchTerm) : item.description
                });
            }
        }

        // 按相关性分数排序
        return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    /**
     * 计算相关性分数
     */
    calculateRelevance(item, searchTerm) {
        let score = 0;
        const terms = searchTerm.split(/\s+/);

        // 标题匹配（权重最高）
        if (item.title) {
            const titleLower = item.title.toLowerCase();
            for (const term of terms) {
                if (titleLower.includes(term)) {
                    if (titleLower === term) {
                        score += 100; // 完全匹配
                    } else if (titleLower.startsWith(term)) {
                        score += 80; // 开头匹配
                    } else {
                        score += 60; // 包含匹配
                    }
                }
            }
        }

        // 描述匹配
        if (item.description) {
            const descLower = item.description.toLowerCase();
            for (const term of terms) {
                if (descLower.includes(term)) {
                    score += 20;
                }
            }
        }

        // 作者匹配
        if (item.author) {
            const authorLower = item.author.toLowerCase();
            for (const term of terms) {
                if (authorLower.includes(term)) {
                    score += 30;
                }
            }
        }

        // 分类匹配
        if (item.categoryTitle) {
            const categoryLower = item.categoryTitle.toLowerCase();
            for (const term of terms) {
                if (categoryLower.includes(term)) {
                    score += 15;
                }
            }
        }

        // 主题匹配
        if (item.topicTitle) {
            const topicLower = item.topicTitle.toLowerCase();
            for (const term of terms) {
                if (topicLower.includes(term)) {
                    score += 15;
                }
            }
        }

        // 标签匹配
        if (item.tags && Array.isArray(item.tags)) {
            for (const term of terms) {
                for (const tag of item.tags) {
                    if (tag.toLowerCase().includes(term)) {
                        score += 10;
                        break;
                    }
                }
            }
        }

        return score;
    }

    /**
     * 高亮文本
     */
    highlightText(text, searchTerm) {
        if (!text || !searchTerm) return text;

        const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    /**
     * 转义正则表达式特殊字符
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * 获取搜索建议
     */
    getSuggestions(query, limit = 5) {
        if (!this.isInitialized || !query || query.length < 2) {
            return [];
        }

        const searchTerm = query.toLowerCase();
        const suggestions = new Set();

        // 从标题中提取建议
        for (const item of this.searchIndex) {
            if (suggestions.size >= limit) break;

            if (item.title) {
                const titleLower = item.title.toLowerCase();
                if (titleLower.includes(searchTerm) && titleLower !== searchTerm) {
                    suggestions.add(item.title);
                }
            }
        }

        // 从标签中提取建议
        for (const item of this.searchIndex) {
            if (suggestions.size >= limit) break;

            if (item.tags && Array.isArray(item.tags)) {
                for (const tag of item.tags) {
                    const tagLower = tag.toLowerCase();
                    if (tagLower.includes(searchTerm) && tagLower !== searchTerm) {
                        suggestions.add(tag);
                    }
                }
            }
        }

        return Array.from(suggestions).slice(0, limit);
    }

    /**
     * 获取热门搜索词
     */
    getPopularTerms(limit = 10) {
        if (!this.isInitialized) {
            return [];
        }

        // 统计词频
        const termFrequency = {};
        
        for (const item of this.searchIndex) {
            // 从标题中提取词汇
            if (item.title) {
                const words = this.extractWords(item.title);
                for (const word of words) {
                    if (word.length > 2) { // 忽略太短的词
                        termFrequency[word] = (termFrequency[word] || 0) + 1;
                    }
                }
            }

            // 从标签中提取词汇
            if (item.tags && Array.isArray(item.tags)) {
                for (const tag of item.tags) {
                    if (tag.length > 2) {
                        termFrequency[tag.toLowerCase()] = (termFrequency[tag.toLowerCase()] || 0) + 2; // 标签权重更高
                    }
                }
            }
        }

        // 按频率排序并返回
        return Object.entries(termFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([term]) => term);
    }

    /**
     * 提取词汇
     */
    extractWords(text) {
        return text.toLowerCase()
            .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ') // 保留字母、数字、空格和中文
            .split(/\s+/)
            .filter(word => word.length > 2);
    }

    /**
     * 重建搜索索引
     */
    async rebuildIndex() {
        console.log('重建搜索索引...');
        await this.buildSearchIndex();
    }

    /**
     * 获取搜索统计信息
     */
    getStats() {
        if (!this.isInitialized) {
            return null;
        }

        return {
            totalDocuments: this.searchIndex.length,
            categories: Object.keys(this.configManager ? this.configManager.getCategories() : {}).length,
            topics: Object.keys(this.configManager ? this.configManager.getTopics() : {}).length,
            authors: Object.keys(this.configManager ? this.configManager.getAuthors() : {}).length,
            lastUpdated: new Date().toISOString()
        };
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchManager;
} else if (typeof window !== 'undefined') {
    window.SearchManager = SearchManager;
}