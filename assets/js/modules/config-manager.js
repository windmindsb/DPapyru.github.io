/**
 * 配置管理模块 - 负责管理文档配置和元数据
 */
class ConfigManager {
    constructor(configPath = './docs/config.json') {
        this.configPath = configPath;
        this.config = null;
        this.allFiles = [];
        this.categories = {};
        this.topics = {};
        this.authors = {};
    }

    /**
     * 加载配置文件
     */
    async loadConfig() {
        try {
            const response = await fetch(this.configPath);
            if (response.ok) {
                this.config = await response.json();
                console.log('配置文件加载成功:', this.config);
                this.parseConfig();
                return this.config;
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('加载配置文件失败:', error);
            this.config = this.getDefaultConfig();
            this.parseConfig();
            return this.config;
        }
    }

    /**
     * 解析配置数据
     */
    parseConfig() {
        if (!this.config) return;

        // 提取分类
        this.categories = this.config.categories || {};

        // 提取主题
        this.topics = this.config.topics || {};

        // 提取作者
        this.authors = this.config.authors || {};

        // 提取所有文件
        this.allFiles = this.config.all_files || [];
    }

    /**
     * 获取默认配置
     */
    getDefaultConfig() {
        return {
            meta: {
                version: "2.0",
                generated_at: new Date().toISOString().split('T')[0],
                description: "默认配置文件",
                organization_mode: "auto",
                supported_languages: ["zh", "en"],
                default_language: "zh"
            },
            categories: {
                '入门': {
                    title: '入门',
                    description: '适合初学者的基础教程',
                    order: 1,
                    topics: {}
                }
            },
            topics: {
                'mod-basics': {
                    title: 'Mod基础',
                    description: 'Mod开发的基础概念和核心API',
                    icon: '📖',
                    order: 1
                }
            },
            authors: {},
            all_files: []
        };
    }

    /**
     * 获取所有分类
     */
    getCategories() {
        return this.categories;
    }

    /**
     * 获取指定分类
     */
    getCategory(categoryKey) {
        return this.categories[categoryKey] || null;
    }

    /**
     * 获取所有主题
     */
    getTopics() {
        return this.topics;
    }

    /**
     * 获取指定主题
     */
    getTopic(topicKey) {
        return this.topics[topicKey] || null;
    }

    /**
     * 获取所有作者
     */
    getAuthors() {
        return this.authors;
    }

    /**
     * 获取指定作者
     */
    getAuthor(authorKey) {
        return this.authors[authorKey] || null;
    }

    /**
     * 获取所有文件
     */
    getAllFiles() {
        return this.allFiles;
    }

    /**
     * 根据分类获取文件
     */
    getFilesByCategory(categoryKey) {
        return this.allFiles.filter(file => file.category === categoryKey);
    }

    /**
     * 根据主题获取文件
     */
    getFilesByTopic(topicKey) {
        return this.allFiles.filter(file => file.topic === topicKey);
    }

    /**
     * 根据作者获取文件
     */
    getFilesByAuthor(authorKey) {
        return this.allFiles.filter(file => file.author === authorKey);
    }

    /**
     * 搜索文件
     */
    searchFiles(query) {
        if (!query || query.trim() === '') {
            return this.allFiles;
        }

        const searchTerm = query.toLowerCase();
        return this.allFiles.filter(file => {
            return (
                (file.title && file.title.toLowerCase().includes(searchTerm)) ||
                (file.description && file.description.toLowerCase().includes(searchTerm)) ||
                (file.author && file.author.toLowerCase().includes(searchTerm)) ||
                (file.category && file.category.toLowerCase().includes(searchTerm)) ||
                (file.topic && file.topic.toLowerCase().includes(searchTerm)) ||
                (file.tags && file.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        });
    }

    /**
     * 获取分类排序后的列表
     */
    getSortedCategories() {
        return Object.keys(this.categories)
            .map(key => ({ key, ...this.categories[key] }))
            .sort((a, b) => (a.order || 999) - (b.order || 999));
    }

    /**
     * 获取主题排序后的列表
     */
    getSortedTopics() {
        return Object.keys(this.topics)
            .map(key => ({ key, ...this.topics[key] }))
            .sort((a, b) => (a.order || 999) - (b.order || 999));
    }

    /**
     * 获取文件排序后的列表
     */
    getSortedFiles(sortBy = 'order') {
        return [...this.allFiles].sort((a, b) => {
            if (sortBy === 'order') {
                return (a.order || 999) - (b.order || 999);
            } else if (sortBy === 'title') {
                return a.title.localeCompare(b.title);
            } else if (sortBy === 'date') {
                return new Date(b.last_updated || 0) - new Date(a.last_updated || 0);
            }
            return 0;
        });
    }

    /**
     * 获取学习路径
     */
    getLearningPaths() {
        if (!this.config || !this.config.learning_paths) {
            return this.getDefaultLearningPaths();
        }
        return this.config.learning_paths;
    }

    /**
     * 获取默认学习路径
     */
    getDefaultLearningPaths() {
        return {
            beginner: {
                title: '初学者路径',
                description: '适合完全没有经验的初学者',
                estimated_time: '2-4周',
                topics: ['mod-basics', 'env'],
                order: 1
            },
            intermediate: {
                title: '进阶路径',
                description: '适合有一定基础的开发者',
                estimated_time: '4-8周',
                topics: ['items', 'npcs'],
                prerequisites: ['beginner'],
                order: 2
            },
            advanced: {
                title: '高级路径',
                description: '适合有经验的开发者',
                estimated_time: '8-12周',
                topics: ['world-gen', 'ui', 'networking', 'advanced'],
                prerequisites: ['intermediate'],
                order: 3
            }
        };
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigManager;
} else if (typeof window !== 'undefined') {
    window.ConfigManager = ConfigManager;
}