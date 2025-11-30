/**
 * 事件总线模块 - 负责模块间的事件通信和解耦
 */
class EventBus {
    constructor() {
        this.events = new Map();
        this.onceEvents = new Map();
        this.middlewares = [];
        this.history = [];
        this.maxHistorySize = 100;
        this.debugMode = false;
    }

    /**
     * 订阅事件
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     * @param {Object} options - 选项
     * @returns {Function} 取消订阅函数
     */
    on(eventName, callback, options = {}) {
        if (typeof eventName !== 'string' || typeof callback !== 'function') {
            throw new Error('事件名称必须是字符串，回调必须是函数');
        }

        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        const listener = {
            callback,
            context: options.context || null,
            priority: options.priority || 0,
            once: options.once || false,
            id: this.generateId()
        };

        const listeners = this.events.get(eventName);
        listeners.push(listener);
        
        // 按优先级排序
        listeners.sort((a, b) => b.priority - a.priority);

        if (this.debugMode) {
            console.log(`[EventBus] 订阅事件: ${eventName}`, listener);
        }

        // 返回取消订阅函数
        return () => this.off(eventName, listener.id);
    }

    /**
     * 订阅事件（仅触发一次）
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     * @param {Object} options - 选项
     * @returns {Function} 取消订阅函数
     */
    once(eventName, callback, options = {}) {
        return this.on(eventName, callback, { ...options, once: true });
    }

    /**
     * 取消订阅事件
     * @param {string} eventName - 事件名称
     * @param {string|Function} listenerIdOrCallback - 监听器ID或回调函数
     */
    off(eventName, listenerIdOrCallback) {
        if (!this.events.has(eventName)) return false;

        const listeners = this.events.get(eventName);
        let removed = false;

        for (let i = listeners.length - 1; i >= 0; i--) {
            const listener = listeners[i];
            if (
                listener.id === listenerIdOrCallback || 
                listener.callback === listenerIdOrCallback
            ) {
                listeners.splice(i, 1);
                removed = true;
                
                if (this.debugMode) {
                    console.log(`[EventBus] 取消订阅事件: ${eventName}`, listener);
                }
            }
        }

        // 如果没有监听器了，删除事件
        if (listeners.length === 0) {
            this.events.delete(eventName);
        }

        return removed;
    }

    /**
     * 触发事件
     * @param {string} eventName - 事件名称
     * @param {*} data - 事件数据
     * @param {Object} options - 选项
     */
    emit(eventName, data, options = {}) {
        const event = {
            name: eventName,
            data: data,
            timestamp: Date.now(),
            cancelable: options.cancelable || false,
            canceled: false,
            preventDefault: function() {
                this.canceled = true;
            }
        };

        // 记录事件历史
        this.addToHistory(event);

        if (this.debugMode) {
            console.log(`[EventBus] 触发事件: ${eventName}`, data);
        }

        // 应用中间件
        let shouldContinue = true;
        for (const middleware of this.middlewares) {
            const result = middleware(event);
            if (result === false) {
                shouldContinue = false;
                break;
            }
        }

        if (!shouldContinue) return event;

        // 触发监听器
        const listeners = this.events.get(eventName);
        if (listeners) {
            const listenersToRemove = [];
            
            for (const listener of listeners) {
                try {
                    const result = listener.callback.call(
                        listener.context, 
                        event.data, 
                        event
                    );
                    
                    // 如果是once事件，标记为待删除
                    if (listener.once) {
                        listenersToRemove.push(listener.id);
                    }
                    
                    // 如果事件是可取消的且被取消，停止后续监听器
                    if (event.cancelable && event.canceled) {
                        break;
                    }
                } catch (error) {
                    console.error(`[EventBus] 事件监听器错误 (${eventName}):`, error);
                }
            }
            
            // 删除once监听器
            for (const id of listenersToRemove) {
                this.off(eventName, id);
            }
        }

        return event;
    }

    /**
     * 异步触发事件
     * @param {string} eventName - 事件名称
     * @param {*} data - 事件数据
     * @param {Object} options - 选项
     * @returns {Promise} 事件Promise
     */
    async emitAsync(eventName, data, options = {}) {
        const event = this.emit(eventName, data, options);
        
        // 等待所有异步监听器完成
        if (event && event.waitForAsync) {
            await Promise.all(event.waitForAsync || []);
        }
        
        return event;
    }

    /**
     * 添加中间件
     * @param {Function} middleware - 中间件函数
     */
    use(middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('中间件必须是函数');
        }
        
        this.middlewares.push(middleware);
        
        if (this.debugMode) {
            console.log('[EventBus] 添加中间件');
        }
    }

    /**
     * 清除所有事件监听器
     * @param {string} eventName - 可选，指定事件名称
     */
    clear(eventName) {
        if (eventName) {
            this.events.delete(eventName);
            if (this.debugMode) {
                console.log(`[EventBus] 清除事件监听器: ${eventName}`);
            }
        } else {
            this.events.clear();
            if (this.debugMode) {
                console.log('[EventBus] 清除所有事件监听器');
            }
        }
    }

    /**
     * 获取事件监听器数量
     * @param {string} eventName - 可选，指定事件名称
     * @returns {number|Object} 监听器数量或事件对象
     */
    listenerCount(eventName) {
        if (eventName) {
            const listeners = this.events.get(eventName);
            return listeners ? listeners.length : 0;
        }
        
        const counts = {};
        for (const [name, listeners] of this.events) {
            counts[name] = listeners.length;
        }
        return counts;
    }

    /**
     * 获取事件名称列表
     * @returns {string[]} 事件名称数组
     */
    eventNames() {
        return Array.from(this.events.keys());
    }

    /**
     * 获取事件历史
     * @param {string} eventName - 可选，指定事件名称
     * @param {number} limit - 可选，限制返回数量
     * @returns {Array} 事件历史数组
     */
    getHistory(eventName, limit) {
        let history = this.history;
        
        if (eventName) {
            history = history.filter(event => event.name === eventName);
        }
        
        if (limit && limit > 0) {
            history = history.slice(-limit);
        }
        
        return history;
    }

    /**
     * 清除事件历史
     */
    clearHistory() {
        this.history = [];
        if (this.debugMode) {
            console.log('[EventBus] 清除事件历史');
        }
    }

    /**
     * 设置调试模式
     * @param {boolean} enabled - 是否启用调试模式
     */
    setDebugMode(enabled) {
        this.debugMode = !!enabled;
        console.log(`[EventBus] 调试模式: ${enabled ? '启用' : '禁用'}`);
    }

    /**
     * 创建命名空间事件总线
     * @param {string} namespace - 命名空间
     * @returns {Object} 命名空间事件总线
     */
    namespace(namespace) {
        if (typeof namespace !== 'string') {
            throw new Error('命名空间必须是字符串');
        }
        
        return {
            on: (eventName, callback, options) => {
                return this.on(`${namespace}:${eventName}`, callback, options);
            },
            once: (eventName, callback, options) => {
                return this.once(`${namespace}:${eventName}`, callback, options);
            },
            off: (eventName, listenerIdOrCallback) => {
                return this.off(`${namespace}:${eventName}`, listenerIdOrCallback);
            },
            emit: (eventName, data, options) => {
                return this.emit(`${namespace}:${eventName}`, data, options);
            },
            emitAsync: (eventName, data, options) => {
                return this.emitAsync(`${namespace}:${eventName}`, data, options);
            }
        };
    }

    /**
     * 添加到事件历史
     * @param {Object} event - 事件对象
     */
    addToHistory(event) {
        this.history.push(event);
        
        // 限制历史记录大小
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    generateId() {
        return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 销毁事件总线
     */
    destroy() {
        this.clear();
        this.middlewares = [];
        this.clearHistory();
        
        if (this.debugMode) {
            console.log('[EventBus] 事件总线已销毁');
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventBus;
} else if (typeof window !== 'undefined') {
    window.EventBus = EventBus;
}