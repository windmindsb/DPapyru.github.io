# 教程索引

这个文件是泰拉瑞亚Mod制作教程的索引，列出了所有可用的教程资源。索引是自动生成的，贡献者可以通过添加新的教程文件来更新此索引。

## 如何添加新教程

1. 在`docs`目录下创建新的Markdown文件
2. 在文件开头添加以下元数据格式：

```markdown
---
title: 教程标题
difficulty: beginner|intermediate|advanced
category: getting-started|basic-concepts|mod-development|advanced-topics
time: 预计完成时间（分钟）
author: 作者名称
date: 更新日期（YYYY-MM-DD）
description: 简短描述
---
```

3. 运行`generate-index.js`脚本自动更新此索引文件

## 入门指南

### [入门指南](getting-started.md)
- **难度**: 初级
- **预计时间**: 30分钟
- **作者**: 泰拉瑞亚Mod社区
- **更新日期**: 2023-11-25
- **描述**: 欢迎来到泰拉瑞亚Mod制作教程！本指南将帮助你了解如何开始制作自己的泰拉瑞亚Mod。

## 基础概念

### [基础概念](basic-concepts.md)
- **难度**: 初级
- **预计时间**: 60分钟
- **作者**: 泰拉瑞亚Mod社区
- **更新日期**: 2023-11-25
- **描述**: 本教程将介绍泰拉瑞亚Mod开发中的基础概念和核心知识。

## Mod开发

### [物品创建](item-creation.md)
- **难度**: 中级
- **预计时间**: 90分钟
- **作者**: 泰拉瑞亚Mod社区
- **更新日期**: 2023-11-25
- **描述**: 学习如何创建自定义物品，包括属性设置、纹理添加和功能实现。

## 高级主题

### [高级主题](advanced-topics.md)
- **难度**: 高级
- **预计时间**: 120分钟
- **作者**: 泰拉瑞亚Mod社区
- **更新日期**: 2023-11-25
- **描述**: 掌握高级Mod开发技术，包括复杂的游戏机制和性能优化技巧。

## 资源参考

### [API参考](api-reference.md)
- **难度**: 所有级别
- **预计时间**: 参考文档
- **作者**: 泰拉瑞亚Mod社区
- **更新日期**: 2023-11-25
- **描述**: 完整的tModLoader API参考文档。

### [常见问题](faq.md)
- **难度**: 所有级别
- **预计时间**: 参考文档
- **作者**: 泰拉瑞亚Mod社区
- **更新日期**: 2023-11-25
- **描述**: 泰拉瑞亚Mod开发中的常见问题和解答。

---

## 自动生成脚本

为了方便贡献者，我们提供了一个Node.js脚本来自动生成教程索引：

```javascript
// generate-index.js
const fs = require('fs');
const path = require('path');

// 读取所有Markdown文件
const docsDir = './docs';
const files = fs.readdirSync(docsDir).filter(file => file.endsWith('.md') && file !== 'tutorial-index.md');

// 按类别分组
const categories = {
    'getting-started': [],
    'basic-concepts': [],
    'mod-development': [],
    'advanced-topics': [],
    'resources': []
};

// 解析每个文件的元数据
files.forEach(file => {
    const content = fs.readFileSync(path.join(docsDir, file), 'utf8');
    const metadata = parseMetadata(content);
    
    if (metadata.category) {
        categories[metadata.category].push({
            file,
            ...metadata
        });
    }
});

// 生成索引内容
let indexContent = `# 教程索引\n\n`;
indexContent += `这个文件是泰拉瑞亚Mod制作教程的索引，列出了所有可用的教程资源。索引是自动生成的，贡献者可以通过添加新的教程文件来更新此索引。\n\n`;
indexContent += `## 如何添加新教程\n\n`;
indexContent += `1. 在\`docs\`目录下创建新的Markdown文件\n`;
indexContent += `2. 在文件开头添加以下元数据格式：\n\n`;
indexContent += `\`\`\`markdown\n---\ntitle: 教程标题\ndifficulty: beginner|intermediate|advanced\ncategory: getting-started|basic-concepts|mod-development|advanced-topics\ntime: 预计完成时间（分钟）\nauthor: 作者名称\ndate: 更新日期（YYYY-MM-DD）\ndescription: 简短描述\n---\n\`\`\`\n\n`;
indexContent += `3. 运行\`generate-index.js\`脚本自动更新此索引文件\n\n`;

// 按类别生成内容
Object.keys(categories).forEach(category => {
    if (categories[category].length > 0) {
        const categoryTitle = getCategoryTitle(category);
        indexContent += `## ${categoryTitle}\n\n`;
        
        categories[category].sort((a, b) => a.title.localeCompare(b.title));
        
        categories[category].forEach(tutorial => {
            indexContent += `### [${tutorial.title}](${tutorial.file})\n`;
            indexContent += `- **难度**: ${getDifficultyText(tutorial.difficulty)}\n`;
            indexContent += `- **预计时间**: ${tutorial.time}分钟\n`;
            indexContent += `- **作者**: ${tutorial.author}\n`;
            indexContent += `- **更新日期**: ${tutorial.date}\n`;
            indexContent += `- **描述**: ${tutorial.description}\n\n`;
        });
    }
});

// 写入索引文件
fs.writeFileSync(path.join(docsDir, 'tutorial-index.md'), indexContent);
console.log('教程索引已更新！');

// 辅助函数
function parseMetadata(content) {
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

function getCategoryTitle(category) {
    const titles = {
        'getting-started': '入门指南',
        'basic-concepts': '基础概念',
        'mod-development': 'Mod开发',
        'advanced-topics': '高级主题',
        'resources': '资源参考'
    };
    return titles[category] || category;
}

function getDifficultyText(difficulty) {
    const texts = {
        'beginner': '初级',
        'intermediate': '中级',
        'advanced': '高级'
    };
    return texts[difficulty] || difficulty;
}
```

要使用此脚本，请运行：

```bash
node generate-index.js
```

这将自动扫描`docs`目录中的所有Markdown文件，解析它们的元数据，并更新`tutorial-index.md`文件。