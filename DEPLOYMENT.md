# GitHub Pages 部署指南

本文档详细说明如何将泰拉瑞亚Mod制作教程网站部署到GitHub Pages。

## 自动部署（推荐）

### 前置条件

1. 确保代码已推送到GitHub仓库
2. 仓库必须是公开的（私有仓库需要GitHub Pro账户）
3. 仓库名称格式：`username.github.io` 或者在其他仓库中启用GitHub Pages

### 启用GitHub Pages

1. 进入GitHub仓库页面
2. 点击 "Settings" 选项卡
3. 在左侧菜单中找到 "Pages" 选项
4. 在 "Source" 部分，选择 "GitHub Actions"

### 自动部署流程

当您推送代码到 `main` 分支时，GitHub Actions会自动：

1. 构建网站（包括生成教程索引）
2. 部署到GitHub Pages
3. 网站将在几分钟后通过 `https://username.github.io` 访问

## 手动部署

### 方法一：使用GitHub CLI

```bash
# 安装GitHub CLI（如果尚未安装）
# Windows: winget install GitHub.cli
# macOS: brew install gh
# Linux: sudo apt install gh

# 登录GitHub
gh auth login

# 部署到GitHub Pages
gh workflow run deploy.yml
```

### 方法二：手动构建和上传

```bash
# 1. 生成教程索引（如果需要）
node generate-index.js

# 2. 上传文件到GitHub Pages分支
git add .
git commit -m "Update website for deployment"
git push origin main
```

## 本地开发和测试

### 启动本地服务器

```bash
# 使用Python（推荐）
python -m http.server 8000

# 使用Node.js（需要安装http-server）
npx http-server . -p 8000

# 使用PHP（如果已安装）
php -S localhost:8000
```

然后在浏览器中访问 `http://localhost:8000`

### 测试网站功能

1. **基本功能测试**：
   - 检查所有页面是否正常加载
   - 测试导航菜单
   - 验证响应式设计

2. **Markdown渲染测试**：
   - 访问教程页面（如 `getting-started.html`）
   - 确认Markdown内容正确渲染
   - 检查代码高亮是否正常

3. **搜索功能测试**：
   - 使用搜索框搜索教程
   - 验证搜索结果
   - 测试搜索结果点击

4. **路径测试**：
   - 测试所有内部链接
   - 验证面包屑导航
   - 检查浏览器前进/后退功能

## 故障排除

### 常见问题

1. **网站无法访问**
   - 检查GitHub Pages设置是否正确
   - 确认仓库是公开的
   - 查看GitHub Actions构建日志

2. **样式或脚本不加载**
   - 检查文件路径是否正确
   - 确认文件已正确上传
   - 查看浏览器控制台错误信息

3. **Markdown内容不显示**
   - 检查JavaScript控制台错误
   - 确认marked.js和prism.js已正确加载
   - 验证Markdown文件路径

4. **搜索功能不工作**
   - 检查search.js是否正确加载
   - 确认搜索索引文件存在
   - 查看网络请求是否成功

### 调试技巧

1. **查看GitHub Actions日志**：
   - 进入仓库的 "Actions" 选项卡
   - 点击失败的构建任务
   - 查看详细错误信息

2. **浏览器开发者工具**：
   - 使用F12打开开发者工具
   - 查看 "Console" 选项卡中的错误
   - 检查 "Network" 选项卡中的请求

3. **本地测试**：
   - 在本地环境中复现问题
   - 使用相同的浏览器和设备
   - 逐步排查问题原因

## 维护和更新

### 添加新教程

1. 在 `docs/` 目录下创建新的Markdown文件
2. 按照格式添加元数据：
   ```markdown
   ---
   title: 教程标题
   difficulty: beginner|intermediate|advanced
   category: getting-started|basic-concepts|mod-development|advanced-topics|resources
   time: 预计完成时间（分钟）
   author: 作者名称
   date: 更新日期（YYYY-MM-DD）
   description: 简短描述
   ---
   ```

3. 运行索引生成脚本：
   ```bash
   node generate-index.js
   ```

4. 提交并推送更改：
   ```bash
   git add .
   git commit -m "Add new tutorial: [教程标题]"
   git push origin main
   ```

### 更新现有内容

1. 修改相应的Markdown文件
2. 更新相关元数据
3. 提交并推送更改

### 更新网站样式

1. 修改 `assets/css/style.css` 文件
2. 测试在不同设备上的显示效果
3. 提交并推送更改

## 性能优化

### 图片优化

1. 使用适当的图片格式（WebP、JPEG、PNG）
2. 压缩图片文件大小
3. 使用响应式图片

### 代码优化

1. 压缩CSS和JavaScript文件
2. 使用CDN加速静态资源
3. 启用浏览器缓存

### 加载优化

1. 预加载关键资源
2. 使用懒加载技术
3. 优化关键渲染路径

## 安全考虑

1. **HTTPS**：GitHub Pages自动提供HTTPS
2. **内容安全策略**：考虑添加CSP头部
3. **依赖安全**：定期更新第三方库
4. **输入验证**：确保用户输入安全处理

## 备份策略

1. **Git版本控制**：所有更改都保存在Git历史中
2. **定期备份**：定期克隆仓库到本地
3. **分支管理**：使用功能分支进行开发
4. **发布标记**：为重要版本创建标记

## 联系和支持

如果在部署过程中遇到问题，请：

1. 查看GitHub Issues页面
2. 搜索现有问题和解决方案
3. 创建新的Issue并提供详细信息
4. 参考GitHub Pages官方文档

---

*最后更新：2023-11-25*