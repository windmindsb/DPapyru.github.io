/**
 * 资源管理模块 - 负责优化资源加载和缓存
 */
class ResourceManager {
    constructor(options = {}) {
        this.options = {
            enableCaching: true,
            enablePreloading: true,
            enableCompression: true,
            cacheExpiration: 3600000, // 1小时
            maxCacheSize: 50, // 最大缓存项数
            preloadCriticalResources: true,
            lazyLoadImages: true,
            ...options
        };
        
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.preloadedResources = new Set();
        this.criticalResources = new Set();
        this.observers = [];
        this.isInitialized = false;
    }

    /**
     * 初始化资源管理器
     */
    async initialize() {
        try {
            // 从localStorage恢复缓存
            this.restoreCacheFromStorage();
            
            // 设置资源预加载
            if (this.options.enablePreloading) {
                this.setupResourcePreloading();
            }
            
            // 设置懒加载
            if (this.options.lazyLoadImages) {
                this.setupLazyLoading();
            }
            
            // 设置资源监控
            this.setupResourceMonitoring();
            
            this.isInitialized = true;
            console.log('资源管理器初始化完成');
        } catch (error) {
            console.error('资源管理器初始化失败:', error);
        }
    }

    /**
     * 从localStorage恢复缓存
     */
    restoreCacheFromStorage() {
        if (!this.options.enableCaching) return;
        
        try {
            const cachedData = localStorage.getItem('resourceCache');
            if (cachedData) {
                const { items, timestamp } = JSON.parse(cachedData);
                
                // 检查缓存是否过期
                if (Date.now() - timestamp < this.options.cacheExpiration) {
                    this.cache = new Map(Object.entries(items));
                    console.log(`从localStorage恢复缓存，共 ${this.cache.size} 项`);
                } else {
                    console.log('缓存已过期，清除旧缓存');
                    localStorage.removeItem('resourceCache');
                }
            }
        } catch (error) {
            console.warn('恢复缓存失败:', error);
        }
    }

    /**
     * 保存缓存到localStorage
     */
    saveCacheToStorage() {
        if (!this.options.enableCaching) return;
        
        try {
            const items = Object.fromEntries(this.cache);
            const cacheData = {
                items,
                timestamp: Date.now()
            };
            
            localStorage.setItem('resourceCache', JSON.stringify(cacheData));
        } catch (error) {
            console.warn('保存缓存失败:', error);
        }
    }

    /**
     * 设置资源预加载
     */
    setupResourcePreloading() {
        // 预加载关键CSS文件
        this.preloadStylesheets();
        
        // 预加载关键JavaScript文件
        this.preloadScripts();
        
        // 预加载关键图片
        if (this.options.preloadCriticalResources) {
            this.preloadCriticalImages();
        }
    }

    /**
     * 预加载样式表
     */
    preloadStylesheets() {
        const stylesheets = [
            'assets/css/style.css',
            'assets/css/prism.min.css',
            'assets/css/vs2022-theme.css'
        ];
        
        stylesheets.forEach(href => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = href;
            document.head.appendChild(link);
        });
    }

    /**
     * 预加载脚本
     */
    preloadScripts() {
        const scripts = [
            'assets/js/theme-toggle.js',
            'assets/js/main.js',
            'assets/js/search.js',
            'assets/js/navigation.js'
        ];
        
        scripts.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'script';
            link.href = src;
            document.head.appendChild(link);
        });
    }

    /**
     * 预加载关键图片
     */
    preloadCriticalImages() {
        const images = [
            'assets/imgs/Green_tModLoader.png'
        ];
        
        images.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
    }

    /**
     * 设置懒加载
     */
    setupLazyLoading() {
        // 图片懒加载观察器
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
            
            this.observers.push(this.imageObserver);
        }
    }

    /**
     * 设置资源监控
     */
    setupResourceMonitoring() {
        // 监控资源加载性能
        if ('PerformanceObserver' in window) {
            const resourceObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.entryType === 'resource') {
                        this.logResourcePerformance(entry);
                    }
                });
            });
            
            resourceObserver.observe({ entryTypes: ['resource'] });
            this.observers.push(resourceObserver);
        }
    }

    /**
     * 记录资源性能
     */
    logResourcePerformance(entry) {
        const resource = {
            name: entry.name,
            type: this.getResourceType(entry.name),
            size: entry.transferSize || 0,
            duration: entry.duration || 0,
            timestamp: Date.now()
        };
        
        // 只记录较大的资源
        if (resource.size > 10240 || resource.duration > 100) { // 大于10KB或加载时间超过100ms
            console.log('资源加载性能:', resource);
        }
    }

    /**
     * 获取资源类型
     */
    getResourceType(url) {
        const extension = url.split('.').pop().split('?')[0].toLowerCase();
        
        if (['css', 'scss', 'sass'].includes(extension)) return 'stylesheet';
        if (['js', 'mjs'].includes(extension)) return 'script';
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) return 'image';
        if (['woff', 'woff2', 'ttf', 'eot'].includes(extension)) return 'font';
        
        return 'other';
    }

    /**
     * 加载资源
     */
    async loadResource(url, options = {}) {
        const {
            type = 'auto',
            priority = 'normal',
            cache = this.options.enableCaching,
            timeout = 10000
        } = options;
        
        // 检查缓存
        if (cache && this.cache.has(url)) {
            const cached = this.cache.get(url);
            if (Date.now() - cached.timestamp < this.options.cacheExpiration) {
                console.log(`从缓存加载资源: ${url}`);
                return cached.data;
            } else {
                this.cache.delete(url);
            }
        }
        
        // 检查是否已在加载中
        if (this.loadingPromises.has(url)) {
            console.log(`等待资源加载: ${url}`);
            return this.loadingPromises.get(url);
        }
        
        // 开始加载
        const loadingPromise = this.fetchResource(url, type, timeout);
        this.loadingPromises.set(url, loadingPromise);
        
        try {
            const data = await loadingPromise;
            
            // 缓存结果
            if (cache) {
                this.setCache(url, data);
            }
            
            return data;
        } finally {
            this.loadingPromises.delete(url);
        }
    }

    /**
     * 获取资源
     */
    async fetchResource(url, type, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            let response;
            
            switch (type) {
                case 'text':
                    response = await fetch(url, { signal: controller.signal });
                    return await response.text();
                    
                case 'json':
                    response = await fetch(url, { signal: controller.signal });
                    return await response.json();
                    
                case 'blob':
                    response = await fetch(url, { signal: controller.signal });
                    return await response.blob();
                    
                case 'image':
                    return this.loadImageAsBlob(url, controller.signal);
                    
                default:
                    response = await fetch(url, { signal: controller.signal });
                    return response;
            }
        } catch (error) {
            console.error(`资源加载失败: ${url}`, error);
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * 加载图片为Blob
     */
    loadImageAsBlob(url, signal) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob(blob => {
                    resolve(blob);
                }, 'image/jpeg', 0.8);
            };
            
            img.onerror = () => {
                reject(new Error(`图片加载失败: ${url}`));
            };
            
            // 检查是否已中止
            if (signal) {
                signal.addEventListener('abort', () => {
                    img.src = '';
                    reject(new DOMException('图片加载已中止', 'AbortError'));
                });
            }
            
            img.src = url;
        });
    }

    /**
     * 加载图片
     */
    loadImage(img) {
        const src = img.dataset.src;
        if (!src || img.loaded) return;
        
        img.src = src;
        img.loaded = true;
        img.removeAttribute('data-src');
        
        img.onload = () => {
            img.classList.add('loaded');
        };
        
        img.onerror = () => {
            img.classList.add('error');
        };
    }

    /**
     * 设置缓存
     */
    setCache(url, data) {
        if (!this.options.enableCaching) return;
        
        // 检查缓存大小限制
        if (this.cache.size >= this.options.maxCacheSize) {
            // 删除最旧的缓存项
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(url, {
            data,
            timestamp: Date.now()
        });
        
        // 保存到localStorage
        this.saveCacheToStorage();
    }

    /**
     * 获取缓存
     */
    getCache(url) {
        if (!this.options.enableCaching) return null;
        
        const cached = this.cache.get(url);
        if (cached && Date.now() - cached.timestamp < this.options.cacheExpiration) {
            return cached.data;
        }
        
        return null;
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.cache.clear();
        
        if (this.options.enableCaching) {
            localStorage.removeItem('resourceCache');
        }
        
        console.log('资源缓存已清除');
    }

    /**
     * 预加载资源
     */
    async preloadResources(resources) {
        if (!this.options.enablePreloading) return;
        
        const preloadPromises = resources.map(resource => {
            return this.loadResource(resource.url, {
                type: resource.type,
                priority: 'low',
                cache: true
            }).catch(error => {
                console.warn(`预加载资源失败: ${resource.url}`, error);
            });
        });
        
        try {
            await Promise.allSettled(preloadPromises);
            console.log(`预加载完成，共处理 ${resources.length} 个资源`);
        } catch (error) {
            console.error('预加载资源失败:', error);
        }
    }

    /**
     * 批量加载资源
     */
    async loadResources(resources) {
        const results = [];
        
        for (const resource of resources) {
            try {
                const data = await this.loadResource(resource.url, {
                    type: resource.type,
                    priority: resource.priority || 'normal',
                    cache: resource.cache !== false
                });
                
                results.push({
                    url: resource.url,
                    data,
                    success: true
                });
            } catch (error) {
                console.error(`资源加载失败: ${resource.url}`, error);
                results.push({
                    url: resource.url,
                    error,
                    success: false
                });
            }
        }
        
        return results;
    }

    /**
     * 获取资源统计
     */
    getStats() {
        return {
            cacheSize: this.cache.size,
            maxCacheSize: this.options.maxCacheSize,
            loadingCount: this.loadingPromises.size,
            preloadedCount: this.preloadedResources.size,
            criticalResourceCount: this.criticalResources.size,
            cacheEnabled: this.options.enableCaching,
            preloadingEnabled: this.options.enablePreloading,
            lazyLoadingEnabled: this.options.lazyLoadImages
        };
    }

    /**
     * 销毁资源管理器
     */
    destroy() {
        // 清理观察器
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers = [];
        
        // 清理缓存
        this.clearCache();
        
        // 清理加载中的Promise
        this.loadingPromises.clear();
        
        this.isInitialized = false;
        console.log('资源管理器已销毁');
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResourceManager;
} else if (typeof window !== 'undefined') {
    window.ResourceManager = ResourceManager;
}