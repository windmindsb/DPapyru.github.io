// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化移动端菜单
    initMobileMenu();
    
    // 初始化侧边栏导航
    initSidebarNavigation();
    
    // 初始化平滑滚动
    initSmoothScroll();
    
    // 初始化教程筛选功能
    initTutorialFilters();
    
    // 初始化路由系统
    initRouter();
    
    // 初始化Markdown渲染
    initMarkdownRenderer();
    
    // 初始化代码高亮
    initCodeHighlight();
    
    // 初始化搜索结果点击事件
    initSearchResultClickEvents();
});

// 移动端菜单切换
function initMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            
            // 切换汉堡菜单图标
            const bars = mobileMenuToggle.querySelectorAll('.bar');
            bars.forEach((bar, index) => {
                if (mainNav.classList.contains('active')) {
                    if (index === 0) bar.style.transform = 'rotate(-45deg) translate(-5px, 6px)';
                    if (index === 1) bar.style.opacity = '0';
                    if (index === 2) bar.style.transform = 'rotate(45deg) translate(-5px, -6px)';
                } else {
                    bar.style.transform = 'none';
                    bar.style.opacity = '1';
                }
            });
        });
        
        // 点击页面其他地方关闭菜单
        document.addEventListener('click', function(event) {
            if (!mobileMenuToggle.contains(event.target) && !mainNav.contains(event.target)) {
                mainNav.classList.remove('active');
                
                // 重置汉堡菜单图标
                const bars = mobileMenuToggle.querySelectorAll('.bar');
                bars.forEach(bar => {
                    bar.style.transform = 'none';
                    bar.style.opacity = '1';
                });
            }
        });
    }
}

// 侧边栏导航功能
function initSidebarNavigation() {
    // 获取所有侧边栏链接
    const sidebarLinks = document.querySelectorAll('.sidebar-list a');
    
    // 为每个链接添加点击事件
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // 如果是锚点链接，使用平滑滚动
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    // 计算目标位置，考虑固定头部的高度
                    const headerHeight = document.querySelector('.site-header').offsetHeight;
                    const targetPosition = targetElement.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // 更新活动状态
                    updateActiveNavLink(this);
                }
            }
        });
    });
    
    // 滚动时更新活动导航链接
    window.addEventListener('scroll', function() {
        updateActiveNavOnScroll();
    });
}

// 平滑滚动功能
function initSmoothScroll() {
    // 获取所有锚点链接
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // 计算目标位置，考虑固定头部的高度
                const headerHeight = document.querySelector('.site-header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// 教程筛选功能
function initTutorialFilters() {
    const difficultyFilter = document.getElementById('difficulty-filter');
    const timeFilter = document.getElementById('time-filter');
    
    if (difficultyFilter) {
        difficultyFilter.addEventListener('change', filterTutorials);
    }
    
    if (timeFilter) {
        timeFilter.addEventListener('change', filterTutorials);
    }
}

// 筛选教程函数
function filterTutorials() {
    const difficultyFilter = document.getElementById('difficulty-filter');
    const timeFilter = document.getElementById('time-filter');
    const tutorialItems = document.querySelectorAll('.tutorial-item');
    
    const selectedDifficulty = difficultyFilter ? difficultyFilter.value : 'all';
    const selectedTime = timeFilter ? timeFilter.value : 'all';
    
    tutorialItems.forEach(item => {
        let showItem = true;
        
        // 检查难度筛选
        if (selectedDifficulty !== 'all') {
            const difficultyBadge = item.querySelector('.difficulty-badge');
            if (difficultyBadge && !difficultyBadge.classList.contains(selectedDifficulty)) {
                showItem = false;
            }
        }
        
        // 检查时间筛选
        if (selectedTime !== 'all' && showItem) {
            const timeElement = item.querySelector('.time');
            if (timeElement) {
                const timeText = timeElement.textContent;
                const timeValue = parseInt(timeText);
                
                if (selectedTime === 'short' && timeValue >= 30) {
                    showItem = false;
                } else if (selectedTime === 'medium' && (timeValue < 30 || timeValue > 60)) {
                    showItem = false;
                } else if (selectedTime === 'long' && timeValue <= 60) {
                    showItem = false;
                }
            }
        }
        
        // 显示或隐藏项目
        item.style.display = showItem ? 'flex' : 'none';
    });
}

// 更新活动导航链接
function updateActiveNavLink(activeLink) {
    // 移除所有活动状态
    const sidebarLinks = document.querySelectorAll('.sidebar-list a');
    sidebarLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // 添加活动状态到当前链接
    activeLink.classList.add('active');
}

// 滚动时更新活动导航链接
function updateActiveNavOnScroll() {
    const sections = document.querySelectorAll('.content-section, .category-section');
    const sidebarLinks = document.querySelectorAll('.sidebar-list a[href^="#"]');
    
    if (sections.length === 0 || sidebarLinks.length === 0) return;
    
    // 获取当前滚动位置
    const scrollPosition = window.scrollY + 100; // 添加一些偏移量
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });
    
    // 更新活动链接
    sidebarLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// 路由系统
function initRouter() {
    console.log('初始化路由系统...');
    
    // 检查当前页面是否需要加载Markdown内容
    const currentPath = window.location.pathname;
    console.log(`当前路径: ${currentPath}`);
    
    // 如果是教程页面，加载对应的Markdown文件
    if (currentPath.includes('/docs/') || currentPath.includes('.md')) {
        console.log('检测到Markdown页面，准备加载内容...');
        
        // 从URL中提取Markdown文件路径
        let markdownPath = currentPath;
        
        // 处理GitHub Pages特殊情况
        if (currentPath === '/' || currentPath === '/index.html') {
            // 首页不需要加载Markdown
            console.log('首页，跳过Markdown加载');
            return;
        }
        
        // 处理特殊情况
        if (currentPath.endsWith('/')) {
            markdownPath += 'index.md';
        } else if (!currentPath.endsWith('.md')) {
            markdownPath += '.md';
        }
        
        // 移除开头的斜杠，确保相对路径正确
        if (markdownPath.startsWith('/')) {
            markdownPath = markdownPath.substring(1);
        }
        
        console.log(`将要加载的Markdown文件: ${markdownPath}`);
        // 加载Markdown内容
        loadMarkdownContent(markdownPath);
    } else {
        console.log('当前页面不是Markdown页面，跳过加载');
        
        // 检查是否有markdown-content元素但没有加载内容
        const markdownContent = document.getElementById('markdown-content');
        if (markdownContent && window.location.pathname.includes('docs/')) {
            console.log('检测到docs页面但没有触发Markdown加载，尝试手动加载...');
            // 尝试加载默认的getting-started.md
            loadMarkdownContent('docs/getting-started.md');
        }
    }
    
    // 监听内部链接点击
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.href && link.getAttribute('href').endsWith('.md')) {
            e.preventDefault();
            let href = link.getAttribute('href');
            
            // 确保相对路径正确
            if (href.startsWith('/')) {
                href = href.substring(1);
            }
            
            console.log(`点击了Markdown链接: ${href}`);
            loadMarkdownContent(href);
            
            // 更新浏览器历史记录
            history.pushState({}, '', href);
        }
    });
    
    // 监听浏览器前进后退
    window.addEventListener('popstate', function() {
        const currentPath = window.location.pathname;
        console.log(`浏览器前进后退，当前路径: ${currentPath}`);
        if (currentPath.includes('/docs/') || currentPath.includes('.md')) {
            // 处理路径，确保相对路径正确
            let pathToLoad = currentPath;
            if (pathToLoad.startsWith('/')) {
                pathToLoad = pathToLoad.substring(1);
            }
            loadMarkdownContent(pathToLoad);
        }
    });
}

// Markdown渲染功能
function initMarkdownRenderer() {
    // 配置marked.js选项
    if (typeof marked !== 'undefined') {
        console.log('Marked.js已加载，正在配置...');
        marked.setOptions({
            highlight: function(code, lang) {
                if (typeof Prism !== 'undefined' && Prism.languages[lang]) {
                    return Prism.highlight(code, Prism.languages[lang], lang);
                }
                return code;
            },
            breaks: true,
            gfm: true,
            tables: true,
            sanitize: false
        });
        console.log('Marked.js配置完成');
    } else {
        console.error('Marked.js未加载，请检查库文件是否正确引入');
    }
}

// 代码高亮功能
function initCodeHighlight() {
    // 初始化Prism.js代码高亮
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    }
}

// 加载Markdown内容
function loadMarkdownContent(filePath) {
    console.log(`尝试加载Markdown文件: ${filePath}`);
    
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');
    const markdownContent = document.getElementById('markdown-content');
    const tableOfContents = document.getElementById('table-of-contents');
    const defaultContent = document.getElementById('default-content');
    
    // 检查必要元素是否存在
    if (!markdownContent) {
        console.error('找不到markdown-content元素');
        return;
    }
    
    // 显示加载状态
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    if (errorMessage) errorMessage.style.display = 'none';
    if (markdownContent) markdownContent.style.display = 'none';
    if (tableOfContents) tableOfContents.style.display = 'none';
    if (defaultContent) defaultContent.style.display = 'none';
    
    // 获取Markdown文件
    fetch(filePath)
        .then(response => {
            console.log(`获取文件响应状态: ${response.status}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // 确保以UTF-8编码读取文本
            return response.text();
        })
        .then(markdownText => {
            console.log(`成功获取Markdown内容，长度: ${markdownText.length}`);
            console.log(`marked库状态: ${typeof marked !== 'undefined' ? '已加载' : '未加载'}`);
            
            // 渲染Markdown内容
            if (typeof marked !== 'undefined' && markdownContent) {
                try {
                    const renderedHTML = marked.parse(markdownText);
                    console.log('Markdown渲染成功');
                    markdownContent.innerHTML = renderedHTML;
                    
                    // 重新初始化代码高亮
                    if (typeof Prism !== 'undefined') {
                        console.log('正在应用代码高亮...');
                        Prism.highlightAllUnder(markdownContent);
                    } else {
                        console.warn('Prism.js未加载，跳过代码高亮');
                    }
                    
                    // 生成目录
                    generateTableOfContents(markdownContent);
                    
                    // 显示内容
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                    if (markdownContent) markdownContent.style.display = 'block';
                    if (tableOfContents) tableOfContents.style.display = 'block';
                    
                    // 更新页面标题
                    updatePageTitle(markdownContent);
                    
                    // 更新侧边栏导航
                    updateSidebarNavigation(markdownContent);
                    
                    // 初始化平滑滚动
                    initSmoothScroll();
                } catch (error) {
                    console.error('Markdown渲染错误:', error);
                    throw error;
                }
            } else {
                console.error('marked库未加载或markdown-content元素不存在');
            }
        })
        .catch(error => {
            console.error('Error loading markdown:', error);
            
            // 显示错误信息
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            if (errorMessage) {
                errorMessage.style.display = 'block';
                const errorText = document.getElementById('error-text');
                if (errorText) {
                    errorText.textContent = `无法加载文件 "${filePath}": ${error.message}`;
                }
            }
        });
}

// 生成目录
function generateTableOfContents(contentElement) {
    console.log('开始生成目录...');
    
    const tableOfContents = document.getElementById('table-of-contents');
    const tocList = document.getElementById('toc-list');
    
    if (!tableOfContents || !tocList || !contentElement) {
        console.error('目录元素或内容元素不存在');
        return;
    }
    
    // 获取所有标题
    const headings = contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
    console.log(`找到 ${headings.length} 个标题`);
    
    if (headings.length === 0) {
        tableOfContents.style.display = 'none';
        console.log('没有找到标题，隐藏目录');
        return;
    }
    
    // 清空目录
    tocList.innerHTML = '';
    
    // 生成目录项
    headings.forEach((heading, index) => {
        console.log(`处理标题 ${index + 1}: ${heading.tagName} - ${heading.textContent}`);
        
        // 为标题添加ID（如果没有）
        if (!heading.id) {
            heading.id = `heading-${index}`;
        }
        
        // 创建目录项
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${heading.id}`;
        a.textContent = heading.textContent;
        
        // 根据标题级别添加缩进
        const level = parseInt(heading.tagName.substring(1));
        a.style.paddingLeft = `${(level - 1) * 15}px`;
        
        li.appendChild(a);
        tocList.appendChild(li);
        
        // 添加点击事件
        a.addEventListener('click', function(e) {
            e.preventDefault();
            const targetElement = document.getElementById(heading.id);
            if (targetElement) {
                const headerHeight = document.querySelector('.site-header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // 显示目录
    tableOfContents.style.display = 'block';
    console.log('目录生成完成');
}

// 更新页面标题
function updatePageTitle(contentElement) {
    if (!contentElement) return;
    
    const firstHeading = contentElement.querySelector('h1, h2');
    if (firstHeading) {
        const title = firstHeading.textContent;
        document.title = `${title} - 泰拉瑞亚Mod制作教程`;
        
        // 更新面包屑导航
        const breadcrumbCurrent = document.querySelector('.breadcrumb .current');
        if (breadcrumbCurrent) {
            breadcrumbCurrent.textContent = title;
        }
        
        // 更新页面标题
        const pageTitle = document.querySelector('.tutorial-title, .category-title');
        if (pageTitle) {
            pageTitle.textContent = title;
        }
    }
}

// 更新侧边栏导航
function updateSidebarNavigation(contentElement) {
    if (!contentElement) return;
    
    const headings = contentElement.querySelectorAll('h2, h3');
    const sidebarList = document.querySelector('.sidebar-list');
    
    if (!sidebarList || headings.length === 0) return;
    
    // 清空侧边栏导航
    sidebarList.innerHTML = '';
    
    // 生成导航项
    headings.forEach((heading, index) => {
        // 为标题添加ID（如果没有）
        if (!heading.id) {
            heading.id = `heading-${index}`;
        }
        
        // 创建导航项
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${heading.id}`;
        a.textContent = heading.textContent;
        
        li.appendChild(a);
        sidebarList.appendChild(li);
    });
}

// 工具函数：防抖
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

// 工具函数：节流
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const context = this;
        const args = arguments;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 优化滚动事件
window.addEventListener('scroll', throttle(function() {
    // 这里可以添加滚动相关的优化逻辑
}, 100));

// 优化窗口大小调整事件
window.addEventListener('resize', debounce(function() {
    // 这里可以添加窗口大小调整相关的逻辑
    // 例如重新计算布局等
}, 250));

// 页面加载完成后的额外初始化
window.addEventListener('load', function() {
    // 添加加载完成的类，可以用于CSS过渡效果
    document.body.classList.add('loaded');
    
    // 预加载关键资源
    preloadCriticalResources();
});

// 预加载关键资源
function preloadCriticalResources() {
    // 这里可以添加预加载关键资源的逻辑
    // 例如预加载下一页的图片等
}

// 错误处理
window.addEventListener('error', function(e) {
    console.error('JavaScript错误:', e.error);
    // 这里可以添加错误上报逻辑
});

// 导出函数供其他脚本使用（如果需要）
window.TerrariaModTutorial = {
    initMobileMenu,
    initSidebarNavigation,
    initSmoothScroll,
    initTutorialFilters,
    debounce,
    throttle
};

// 初始化搜索结果点击事件
function initSearchResultClickEvents() {
    // 使用事件委托处理搜索结果点击
    document.addEventListener('click', function(e) {
        const searchResultItem = e.target.closest('.search-result-item');
        if (searchResultItem) {
            let url = searchResultItem.getAttribute('data-url');
            if (url) {
                // 确保相对路径正确
                if (url.startsWith('/')) {
                    url = url.substring(1);
                }
                
                // 如果是Markdown文件，使用现有的加载机制
                if (url.endsWith('.md')) {
                    e.preventDefault();
                    
                    // 隐藏搜索结果
                    const searchResults = document.getElementById('search-results');
                    if (searchResults) {
                        searchResults.style.display = 'none';
                    }
                    
                    // 加载Markdown内容
                    if (typeof loadMarkdownContent === 'function') {
                        loadMarkdownContent(url);
                    }
                    
                    // 更新浏览器历史记录
                    history.pushState({}, '', url);
                } else {
                    // 普通链接，正常跳转
                    window.location.href = url;
                }
            }
        }
    });
}

// 增强Markdown内容加载功能，添加搜索索引更新
const originalLoadMarkdownContent = loadMarkdownContent;
if (typeof originalLoadMarkdownContent === 'function') {
    window.loadMarkdownContent = function(filePath) {
        // 调用原始函数
        originalLoadMarkdownContent(filePath);
        
        // 如果搜索功能已初始化，更新搜索索引
        if (window.tutorialSearch && window.tutorialSearch.searchIndex.length > 0) {
            // 检查当前文件是否已在搜索索引中
            const isInIndex = window.tutorialSearch.searchIndex.some(item => item.url === filePath);
            
            if (!isInIndex) {
                // 如果不在索引中，添加当前页面到搜索索引
                fetch(filePath)
                    .then(response => {
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                        return response.text();
                    })
                    .then(content => {
                        const metadata = window.tutorialSearch.parseMetadata(content);
                        const plainText = window.tutorialSearch.stripMarkdown(content);
                        
                        window.tutorialSearch.searchIndex.push({
                            title: metadata.title || window.tutorialSearch.extractTitle(content),
                            url: filePath,
                            content: plainText,
                            description: metadata.description || window.tutorialSearch.extractDescription(plainText),
                            category: metadata.category || '未分类',
                            difficulty: metadata.difficulty || '未知',
                            time: metadata.time || '未知',
                            author: metadata.author || '未知',
                            date: metadata.date || '未知'
                        });
                        
                        console.log(`已将 ${filePath} 添加到搜索索引`);
                    })
                    .catch(error => {
                        console.warn(`无法将 ${filePath} 添加到搜索索引:`, error);
                    });
            }
        }
    };
}