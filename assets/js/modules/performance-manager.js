/**
 * 性能管理模块 - 负责性能监控和优化
 */
class PerformanceManager {
    constructor(options = {}) {
        this.options = {
            enableMetrics: true,
            enableOptimization: true,
            enableCaching: true,
            enableLazyLoading: true,
            debounceDelay: 300,
            throttleDelay: 100,
            ...options
        };
        
        this.metrics = {
            pageLoadTime: 0,
            domContentLoaded: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            cumulativeLayoutShift: 0,
            firstInputDelay: 0,
            searchPerformance: [],
            navigationPerformance: []
        };
        
        this.cache = new Map();
        this.observers = [];
        this.isInitialized = false;
    }

    /**
     * 初始化性能管理器
     */
    async initialize() {
        try {
            if (this.options.enableMetrics) {
                this.setupPerformanceMetrics();
            }
            
            if (this.options.enableOptimization) {
                this.setupOptimizations();
            }
            
            if (this.options.enableCaching) {
                this.setupCaching();
            }
            
            if (this.options.enableLazyLoading) {
                this.setupLazyLoading();
            }
            
            this.isInitialized = true;
            console.log('性能管理器初始化完成');
        } catch (error) {
            console.error('性能管理器初始化失败:', error);
        }
    }

    /**
     * 设置性能指标监控
     */
    setupPerformanceMetrics() {
        // 页面加载性能
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.collectPageLoadMetrics();
            }, 0);
        });

        // Web Vitals 监控
        if ('PerformanceObserver' in window) {
            // Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.largestContentfulPaint = lastEntry.startTime;
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.push(lcpObserver);

            // First Input Delay
            const fidObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                this.metrics.firstInputDelay = entries[0].processingStart - entries[0].startTime;
            });
            fidObserver.observe({ entryTypes: ['first-input'] });
            this.observers.push(fidObserver);

            // Cumulative Layout Shift
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                this.metrics.cumulativeLayoutShift = clsValue;
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
            this.observers.push(clsObserver);
        }

        // 长任务监控
        if ('PerformanceObserver' in window) {
            const longTaskObserver = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    console.warn('长任务检测:', {
                        name: entry.name,
                        duration: entry.duration,
                        startTime: entry.startTime
                    });
                }
            });
            longTaskObserver.observe({ entryTypes: ['longtask'] });
            this.observers.push(longTaskObserver);
        }
    }

    /**
     * 收集页面加载指标
     */
    collectPageLoadMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.navigationStart;
            this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
            
            // First Contentful Paint
            const paintEntries = performance.getEntriesByType('paint');
            const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
            if (fcpEntry) {
                this.metrics.firstContentfulPaint = fcpEntry.startTime;
            }
            
            console.log('页面加载性能指标:', this.metrics);
            this.saveMetrics();
        }
    }

    /**
     * 设置性能优化
     */
    setupOptimizations() {
        // 事件委托优化
        this.setupEventDelegation();
        
        // DOM 操作优化
        this.setupDOMOptimizations();
        
        // 滚动优化
        this.setupScrollOptimizations();
        
        // 搜索优化
        this.setupSearchOptimizations();
    }

    /**
     * 设置事件委托
     */
    setupEventDelegation() {
        // 为文档添加点击事件委托
        document.addEventListener('click', (e) => {
            // 处理动态生成的元素点击事件
            this.handleDelegatedClick(e);
        }, true);

        // 为文档添加输入事件委托
        document.addEventListener('input', (e) => {
            // 处理动态生成的元素输入事件
            this.handleDelegatedInput(e);
        }, true);
    }

    /**
     * 处理委托的点击事件
     */
    handleDelegatedClick(e) {
        const target = e.target;
        
        // 搜索历史项点击
        if (target.closest('.search-history-item')) {
            e.preventDefault();
            const item = target.closest('.search-history-item');
            const query = item.dataset.query || item.textContent.trim();
            
            // 触发搜索事件
            const searchEvent = new CustomEvent('performSearch', { detail: { query } });
            document.dispatchEvent(searchEvent);
        }
        
        // 搜索建议项点击
        if (target.closest('.suggestion-item')) {
            e.preventDefault();
            const item = target.closest('.suggestion-item');
            const suggestion = item.dataset.suggestion || item.textContent.trim();
            
            // 触发搜索事件
            const searchEvent = new CustomEvent('performSearch', { detail: { query: suggestion } });
            document.dispatchEvent(searchEvent);
        }
        
        // 文档卡片点击
        if (target.closest('.doc-card')) {
            const card = target.closest('.doc-card');
            const link = card.querySelector('.doc-link');
            if (link && !target.closest('.doc-link')) {
                e.preventDefault();
                window.location.href = link.href;
            }
        }
    }

    /**
     * 处理委托的输入事件
     */
    handleDelegatedInput(e) {
        const target = e.target;
        
        // 搜索输入框
        if (target.matches('#doc-search, #advanced-search-input')) {
            // 使用防抖处理搜索输入
            this.debounce(() => {
                const searchEvent = new CustomEvent('searchInput', { 
                    detail: { query: target.value } 
                });
                document.dispatchEvent(searchEvent);
            }, this.options.debounceDelay)();
        }
    }

    /**
     * 设置DOM操作优化
     */
    setupDOMOptimizations() {
        // 批量DOM更新
        this.pendingUpdates = new Set();
        this.updateScheduled = false;
        
        // 使用 requestAnimationFrame 批量更新DOM
        this.scheduleDOMUpdate = (callback) => {
            this.pendingUpdates.add(callback);
            
            if (!this.updateScheduled) {
                this.updateScheduled = true;
                requestAnimationFrame(() => {
                    this.pendingUpdates.forEach(callback => callback());
                    this.pendingUpdates.clear();
                    this.updateScheduled = false;
                });
            }
        };
    }

    /**
     * 设置滚动优化
     */
    setupScrollOptimizations() {
        // 滚动事件节流
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (scrollTimeout) {
                cancelAnimationFrame(scrollTimeout);
            }
            
            scrollTimeout = requestAnimationFrame(() => {
                this.handleScroll();
            });
        }, { passive: true });
    }

    /**
     * 处理滚动事件
     */
    handleScroll() {
        // 返回顶部按钮显示/隐藏
        const backToTop = document.querySelector('.back-to-top');
        if (backToTop) {
            if (window.pageYOffset > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }
        
        // 懒加载图片
        if (this.options.enableLazyLoading) {
            this.lazyLoadImages();
        }
    }

    /**
     * 设置搜索优化
     */
    setupSearchOptimizations() {
        // 搜索性能监控
        document.addEventListener('searchStart', () => {
            this.searchStartTime = performance.now();
        });
        
        document.addEventListener('searchEnd', () => {
            if (this.searchStartTime) {
                const duration = performance.now() - this.searchStartTime;
                this.metrics.searchPerformance.push({
                    timestamp: Date.now(),
                    duration: duration
                });
                
                // 只保留最近50次搜索记录
                if (this.metrics.searchPerformance.length > 50) {
                    this.metrics.searchPerformance.shift();
                }
                
                console.log(`搜索完成，耗时: ${duration.toFixed(2)}ms`);
            }
        });
    }

    /**
     * 设置缓存
     */
    setupCaching() {
        // 内存缓存
        this.memoryCache = new Map();
        this.maxCacheSize = 100;
        
        // localStorage 缓存
        this.storageCache = {
            get: (key) => {
                try {
                    const item = localStorage.getItem(`cache_${key}`);
                    return item ? JSON.parse(item) : null;
                } catch (e) {
                    return null;
                }
            },
            set: (key, value, ttl = 3600000) => { // 默认1小时过期
                try {
                    const item = {
                        value: value,
                        timestamp: Date.now(),
                        ttl: ttl
                    };
                    localStorage.setItem(`cache_${key}`, JSON.stringify(item));
                } catch (e) {
                    console.warn('localStorage 缓存失败:', e);
                }
            },
            clear: () => {
                try {
                    const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
                    keys.forEach(key => localStorage.removeItem(key));
                } catch (e) {
                    console.warn('清除 localStorage 缓存失败:', e);
                }
            }
        };
    }

    /**
     * 设置懒加载
     */
    setupLazyLoading() {
        // 图片懒加载
        if ('IntersectionObserver' in window) {
            this.imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        this.imageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });
        }
    }

    /**
     * 懒加载图片
     */
    lazyLoadImages() {
        if (!this.imageObserver) return;
        
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            if (!img.loaded) {
                this.imageObserver.observe(img);
            }
        });
    }

    /**
     * 加载图片
     */
    loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;
        
        img.src = src;
        img.loaded = true;
        img.removeAttribute('data-src');
        
        // 图片加载完成后的处理
        img.onload = () => {
            img.classList.add('loaded');
        };
        
        img.onerror = () => {
            img.classList.add('error');
        };
    }

    /**
     * 缓存操作
     */
    cache(key, value, ttl) {
        if (!this.options.enableCaching) return;
        
        // 内存缓存
        if (this.memoryCache.size >= this.maxCacheSize) {
            const firstKey = this.memoryCache.keys().next().value;
            this.memoryCache.delete(firstKey);
        }
        this.memoryCache.set(key, {
            value: value,
            timestamp: Date.now(),
            ttl: ttl || 3600000
        });
        
        // localStorage 缓存
        this.storageCache.set(key, value, ttl);
    }

    /**
     * 获取缓存
     */
    getCache(key) {
        if (!this.options.enableCaching) return null;
        
        // 先检查内存缓存
        const memItem = this.memoryCache.get(key);
        if (memItem) {
            if (Date.now() - memItem.timestamp < memItem.ttl) {
                return memItem.value;
            } else {
                this.memoryCache.delete(key);
            }
        }
        
        // 检查 localStorage 缓存
        const storageItem = this.storageCache.get(key);
        if (storageItem) {
            if (Date.now() - storageItem.timestamp < storageItem.ttl) {
                // 重新加载到内存缓存
                this.memoryCache.set(key, storageItem);
                return storageItem.value;
            } else {
                this.storageCache.clear(key);
            }
        }
        
        return null;
    }

    /**
     * 防抖函数
     */
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * 节流函数
     */
    throttle(func, delay) {
        let lastCall = 0;
        return (...args) => {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                return func.apply(this, args);
            }
        };
    }

    /**
     * 批量DOM更新
     */
    batchDOMUpdate(callback) {
        if (this.scheduleDOMUpdate) {
            this.scheduleDOMUpdate(callback);
        } else {
            callback();
        }
    }

    /**
     * 保存性能指标
     */
    saveMetrics() {
        try {
            const metrics = {
                ...this.metrics,
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };
            
            // 保存到 localStorage
            const existingMetrics = JSON.parse(localStorage.getItem('performanceMetrics') || '[]');
            existingMetrics.push(metrics);
            
            // 只保留最近30条记录
            if (existingMetrics.length > 30) {
                existingMetrics.splice(0, existingMetrics.length - 30);
            }
            
            localStorage.setItem('performanceMetrics', JSON.stringify(existingMetrics));
        } catch (error) {
            console.warn('保存性能指标失败:', error);
        }
    }

    /**
     * 获取性能指标
     */
    getMetrics() {
        return {
            ...this.metrics,
            cacheSize: this.memoryCache.size,
            maxCacheSize: this.maxCacheSize
        };
    }

    /**
     * 清理缓存
     */
    clearCache() {
        this.memoryCache.clear();
        this.storageCache.clear();
        console.log('性能缓存已清理');
    }

    /**
     * 销毁性能管理器
     */
    destroy() {
        // 清理观察器
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers = [];
        
        // 清理图片观察器
        if (this.imageObserver) {
            this.imageObserver.disconnect();
        }
        
        // 清理缓存
        this.clearCache();
        
        this.isInitialized = false;
        console.log('性能管理器已销毁');
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceManager;
} else if (typeof window !== 'undefined') {
    window.PerformanceManager = PerformanceManager;
}