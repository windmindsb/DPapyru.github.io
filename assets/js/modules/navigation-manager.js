/**
 * 导航管理模块 - 负责网站导航功能
 */
class NavigationManager {
    constructor(options = {}) {
        this.options = {
            enableSmoothScroll: true,
            enableKeyboardNavigation: true,
            enableMobileMenu: true,
            enableBreadcrumb: true,
            ...options
        };
        
        this.currentPath = '';
        this.navigationHistory = [];
        this.maxHistoryLength = 10;
    }

    /**
     * 初始化导航功能
     */
    initialize() {
        this.setupSmoothScrolling();
        this.setupKeyboardNavigation();
        this.setupMobileNavigation();
        this.setupBreadcrumbNavigation();
        this.setupNavigationHistory();
        
        console.log('导航管理器初始化完成');
    }

    /**
     * 设置平滑滚动
     */
    setupSmoothScrolling() {
        if (!this.options.enableSmoothScroll) return;

        // 为所有锚点链接添加平滑滚动
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;

            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }

    /**
     * 设置键盘导航
     */
    setupKeyboardNavigation() {
        if (!this.options.enableKeyboardNavigation) return;

        document.addEventListener('keydown', (e) => {
            // Alt + 左箭头：返回上一页
            if (e.altKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                this.goBack();
            }
            
            // Alt + 右箭头：前进下一页
            if (e.altKey && e.key === 'ArrowRight') {
                e.preventDefault();
                this.goForward();
            }

            // Alt + Home：回到首页
            if (e.altKey && e.key === 'Home') {
                e.preventDefault();
                this.goToHome();
            }

            // Alt + Up：向上滚动
            if (e.altKey && e.key === 'ArrowUp') {
                e.preventDefault();
                this.scrollUp();
            }

            // Alt + Down：向下滚动
            if (e.altKey && e.key === 'ArrowDown') {
                e.preventDefault();
                this.scrollDown();
            }
        });
    }

    /**
     * 设置移动端导航
     */
    setupMobileNavigation() {
        if (!this.options.enableMobileMenu) return;

        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const mainNav = document.querySelector('.main-nav');
        
        if (!mobileMenuToggle || !mainNav) return;

        mobileMenuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });

        // 点击外部关闭菜单
        document.addEventListener('click', (e) => {
            if (!mainNav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                mainNav.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            }
        });
    }

    /**
     * 设置面包屑导航
     */
    setupBreadcrumbNavigation() {
        if (!this.options.enableBreadcrumb) return;

        this.updateBreadcrumb();
    }

    /**
     * 设置导航历史
     */
    setupNavigationHistory() {
        // 监听页面加载
        window.addEventListener('load', () => {
            this.addToHistory(window.location.pathname);
        });

        // 监听页面卸载
        window.addEventListener('beforeunload', () => {
            this.addToHistory(window.location.pathname);
        });
    }

    /**
     * 返回上一页
     */
    goBack() {
        if (this.navigationHistory.length > 1) {
            // 移除当前页面
            this.navigationHistory.pop();
            // 获取上一页
            const previousPage = this.navigationHistory.pop();
            if (previousPage && previousPage !== window.location.pathname) {
                window.location.href = previousPage;
            }
        } else {
            // 如果没有历史记录，返回首页
            this.goToHome();
        }
    }

    /**
     * 前进到下一页
     */
    goForward() {
        // 这里可以实现前进功能，但需要更复杂的历史管理
        // 暂时返回首页
        this.goToHome();
    }

    /**
     * 回到首页
     */
    goToHome() {
        window.location.href = './index.html';
    }

    /**
     * 向上滚动
     */
    scrollUp() {
        window.scrollBy({
            top: -100,
            behavior: 'smooth'
        });
    }

    /**
     * 向下滚动
     */
    scrollDown() {
        window.scrollBy({
            top: 100,
            behavior: 'smooth'
        });
    }

    /**
     * 添加到导航历史
     */
    addToHistory(path) {
        // 避免重复添加相同路径
        if (this.currentPath === path) return;

        this.currentPath = path;
        this.navigationHistory.push(path);

        // 限制历史记录长度
        if (this.navigationHistory.length > this.maxHistoryLength) {
            this.navigationHistory.shift();
        }
    }

    /**
     * 更新面包屑导航
     */
    updateBreadcrumb() {
        const breadcrumbContainer = document.querySelector('.breadcrumb');
        if (!breadcrumbContainer) return;

        const path = window.location.pathname;
        const pathParts = path.split('/').filter(part => part);
        
        let breadcrumbHTML = '<a href="./index.html">首页</a>';
        
        if (pathParts.length > 0) {
            let currentPath = './';
            for (let i = 0; i < pathParts.length; i++) {
                currentPath += pathParts[i] + '/';
                const isLast = i === pathParts.length - 1;
                
                if (!isLast) {
                    breadcrumbHTML += ` > <a href="${currentPath}">${this.formatBreadcrumbTitle(pathParts[i])}</a>`;
                } else {
                    breadcrumbHTML += ` > <span class="current">${this.formatBreadcrumbTitle(pathParts[i])}</span>`;
                }
            }
        }

        breadcrumbContainer.innerHTML = breadcrumbHTML;
    }

    /**
     * 格式化面包屑标题
     */
    formatBreadcrumbTitle(title) {
        // 移除文件扩展名
        return title.replace(/\.(html|md)$/, '');
    }

    /**
     * 高亮当前导航项
     */
    highlightCurrentNavigation() {
        const currentPath = window.location.pathname;
        
        // 高亮主导航
        const navLinks = document.querySelectorAll('.main-nav .nav-link');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.endsWith(href)) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // 高亮侧边栏导航
        const sidebarLinks = document.querySelectorAll('.sidebar a');
        sidebarLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.includes(href)) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    /**
     * 设置返回顶部按钮
     */
    setupBackToTop() {
        const backToTopButton = document.createElement('button');
        backToTopButton.className = 'back-to-top';
        backToTopButton.innerHTML = '↑';
        backToTopButton.setAttribute('aria-label', '返回顶部');
        
        document.body.appendChild(backToTopButton);

        // 滚动事件
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        });

        // 点击事件
        backToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    /**
     * 设置侧边栏导航状态
     */
    setupSidebarNavigation() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        let isCollapsed = false;
        const toggleButton = document.createElement('button');
        toggleButton.className = 'sidebar-toggle';
        toggleButton.innerHTML = '◀';
        toggleButton.setAttribute('aria-label', '切换侧边栏');
        
        sidebar.appendChild(toggleButton);

        toggleButton.addEventListener('click', () => {
            isCollapsed = !isCollapsed;
            sidebar.classList.toggle('collapsed');
            toggleButton.innerHTML = isCollapsed ? '▶' : '◀';
            
            // 保存状态到localStorage
            localStorage.setItem('sidebar-collapsed', isCollapsed);
        });

        // 恢复侧边栏状态
        const savedState = localStorage.getItem('sidebar-collapsed');
        if (savedState === 'true') {
            isCollapsed = true;
            sidebar.classList.add('collapsed');
            toggleButton.innerHTML = '▶';
        }
    }

    /**
     * 设置移动端导航覆盖层
     */
    setupMobileNavOverlay() {
        const mobileNavToggle = document.getElementById('mobile-nav-toggle');
        const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
        const mobileNavClose = document.getElementById('mobile-nav-close');
        const mobileNavBack = document.getElementById('mobile-nav-back');

        if (!mobileNavToggle || !mobileNavOverlay) return;

        mobileNavToggle.addEventListener('click', () => {
            mobileNavOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        const closeMobileNav = () => {
            mobileNavOverlay.classList.remove('active');
            document.body.style.overflow = '';
        };

        if (mobileNavClose) {
            mobileNavClose.addEventListener('click', closeMobileNav);
        }

        if (mobileNavBack) {
            mobileNavBack.addEventListener('click', closeMobileNav);
        }

        // 点击覆盖层背景关闭
        mobileNavOverlay.addEventListener('click', (e) => {
            if (e.target === mobileNavOverlay) {
                closeMobileNav();
            }
        });
    }

    /**
     * 获取导航统计信息
     */
    getStats() {
        return {
            currentPath: this.currentPath,
            historyLength: this.navigationHistory.length,
            historyItems: [...this.navigationHistory]
        };
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationManager;
} else if (typeof window !== 'undefined') {
    window.NavigationManager = NavigationManager;
}