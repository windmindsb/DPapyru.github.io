// generate-index-enhanced.js - 增强版自动生成教程索引和配置的脚本
// 结合主项目和LogSpiral项目的优点，支持更灵活的文档组织
const fs = require('fs');
const path = require('path');

// 项目配置
const projectConfig = {
    name: '主项目',
    docsDir: './docs',
    configFile: './docs/config.json',
    indexFile: './docs/tutorial-index.md',
    ignoreDirs: ['node_modules', '.git', '原文件名顺序-方便查找原文对比'],
    // 支持多种文档组织方式
    organizationMode: 'auto', // 'auto', 'category', 'topic', 'mixed'
    // 默认分类配置
    defaultCategories: {
        '入门': {
            title: '入门',
            description: '适合初学者的基础教程',
            order: 1,
            topics: {}
        },
        '进阶': {
            title: '进阶',
            description: '有一定基础后的进阶教程',
            order: 2,
            topics: {}
        },
        '高级': {
            title: '高级',
            description: '面向有经验开发者的高级教程',
            order: 3,
            topics: {}
        },
        '个人分享': {
            title: '个人分享',
            description: '社区成员的个人经验和技巧分享',
            order: 4,
            topics: {}
        },
        '怎么贡献': {
            title: '怎么贡献',
            description: '介绍贡献者应该怎么贡献文章',
            order: 5,
            topics: {}
        }
    },
    // 默认主题配置
    defaultTopics: {
        'env': {
            title: '环境配置',
            description: '开发环境搭建和配置',
            icon: '🛠️',
            order: 1
        },
        'mod-basics': {
            title: 'Mod基础',
            description: 'Mod开发的基础概念和核心API',
            icon: '📖',
            order: 2
        },
        'items': {
            title: '物品系统',
            description: '物品、武器和装备的开发',
            icon: '⚔️',
            order: 3
        },
        'npcs': {
            title: 'NPC系统',
            description: 'NPC的创建和行为定制',
            icon: '👥',
            order: 4
        },
        'world-gen': {
            title: '世界生成',
            description: '世界生成和地形修改',
            icon: '🌍',
            order: 5
        },
        'ui': {
            title: 'UI界面',
            description: '用户界面和交互设计',
            icon: '🎨',
            order: 6
        },
        'networking': {
            title: '网络功能',
            description: '多人游戏和网络通信',
            icon: '🌐',
            order: 7
        },
        'advanced': {
            title: '高级功能',
            description: '高级开发技巧和优化',
            icon: '🔧',
            order: 8
        }
    }
};

// 递归扫描目录获取所有Markdown文件
function scanDirectoryRecursively(dir, baseDir, fileList = []) {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // 检查是否为忽略的目录
            if (!projectConfig.ignoreDirs.includes(item)) {
                // 递归扫描子目录
                scanDirectoryRecursively(fullPath, baseDir, fileList);
            }
        } else if (item.endsWith('.md') && item !== 'tutorial-index.md' && item !== 'README.md') {
            // 计算相对于docs目录的路径，确保使用正斜杠
            const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
            fileList.push(relativePath);
        }
    });

    return fileList;
}

// 从文件路径提取类别和主题
function extractCategoryAndTopic(filePath) {
    const parts = filePath.split('/');
    
    // 如果文件在根目录，使用默认分类
    if (parts.length === 1) {
        return { category: '入门', topic: 'mod-basics' };
    }
    
    // 尝试从路径中提取分类
    const firstDir = parts[0];
    
    // 检查是否为预定义分类
    if (projectConfig.defaultCategories[firstDir]) {
        return { category: firstDir, topic: 'mod-basics' };
    }
    
    // 检查是否为数字前缀的分类（如LogSpiral的0-开始、1-基础等）
    const numericPrefixMatch = firstDir.match(/^(\d+)-(.+)/);
    if (numericPrefixMatch) {
        const categoryMap = {
            '0': '入门',
            '1': '基础',
            '2': '进阶',
            '3': '高级',
            '4': '专家'
        };
        const category = categoryMap[numericPrefixMatch[1]] || '杂项';
        return { category, topic: 'mod-basics' };
    }
    
    // 默认分类
    return { category: '杂项', topic: 'misc' };
}

// 处理主项目
function processMainProject() {
    console.log(`\n正在处理 ${projectConfig.name} 项目...`);

    const { docsDir, configFile, indexFile } = projectConfig;

    // 检查目录是否存在
    if (!fs.existsSync(docsDir)) {
        console.log(`警告: ${projectConfig.name} 的文档目录不存在: ${docsDir}`);
        return;
    }

    // 扫描所有Markdown文件
    const files = scanDirectoryRecursively(docsDir, docsDir);
    console.log(`找到 ${files.length} 个Markdown文件`);

    // 读取现有的config.json文件（如果存在）
    let configData = {};
    if (fs.existsSync(configFile)) {
        try {
            const configContent = fs.readFileSync(configFile, 'utf8');
            configData = JSON.parse(configContent);
        } catch (error) {
            console.error(`读取${projectConfig.name}的config.json时出错:`, error.message);
            // 如果读取失败，使用默认配置
            configData = {
                categories: {},
                topics: {},
                authors: {},
                all_files: []
            };
        }
    } else {
        // 如果config.json不存在，创建默认配置
        configData = {
            categories: {},
            topics: {},
            authors: {},
            all_files: []
        };
    }

    // 更新config.json数据
    updateConfigData(docsDir, files, configData);

    // 生成索引内容
    let indexContent = generateIndexContent(configData);

    // 写入索引文件
    fs.writeFileSync(indexFile, indexContent);
    console.log(`${projectConfig.name} 教程索引已更新！`);

    // 写入配置文件
    fs.writeFileSync(configFile, JSON.stringify(configData, null, 2));
    console.log(`${projectConfig.name} 配置文件已更新！`);
}

// 更新config.json数据的函数
function updateConfigData(docsDir, files, configData) {
    // 获取当前docs目录中所有实际存在的Markdown文件（包括子目录）
    const currentFiles = scanDirectoryRecursively(docsDir, docsDir);
    const existingFiles = new Set(currentFiles);

    // 创建文件到正确类别的映射表
    const fileToCorrectCategory = {};
    // 创建隐藏文件集合
    const hiddenFiles = new Set();

    // 首先解析所有文件的元数据，确定每个文件应该属于哪个类别
    currentFiles.forEach(file => {
        try {
            const fullPath = path.join(docsDir, file);
            const content = fs.readFileSync(fullPath, 'utf8');
            const metadata = parseMetadata(content);

            // 检查是否为隐藏文件
            if (metadata.hide === 'true' || metadata.hide === true) {
                hiddenFiles.add(file);
                return; // 跳过隐藏文件
            }

            // 从文件路径提取类别和主题
            let { category, topic } = extractCategoryAndTopic(file);

            // 如果元数据中有指定类别，使用元数据中的类别
            if (metadata.category) {
                category = metadata.category;
            }

            // 如果元数据中有指定主题，使用元数据中的主题
            if (metadata.topic) {
                topic = metadata.topic;
            }

            fileToCorrectCategory[file] = { category, topic };
        } catch (error) {
            console.error(`解析文件 ${file} 时出错:`, error.message);
            const { category, topic } = extractCategoryAndTopic(file);
            fileToCorrectCategory[file] = { category, topic };
        }
    });

    // 确保所有默认类别都存在
    Object.keys(projectConfig.defaultCategories).forEach(categoryKey => {
        if (!configData.categories[categoryKey]) {
            configData.categories[categoryKey] = JSON.parse(JSON.stringify(projectConfig.defaultCategories[categoryKey]));
        }
    });

    // 确保所有默认主题都存在
    Object.keys(projectConfig.defaultTopics).forEach(topicKey => {
        if (!configData.topics[topicKey]) {
            configData.topics[topicKey] = JSON.parse(JSON.stringify(projectConfig.defaultTopics[topicKey]));
        }
    });

    // 重置all_files数组
    configData.all_files = [];

    // 处理每个文件
    currentFiles.forEach(file => {
        // 跳过隐藏文件
        if (hiddenFiles.has(file)) {
            return;
        }

        const fullPath = path.join(docsDir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        const metadata = parseMetadata(content);

        // 获取类别和主题
        let { category, topic } = fileToCorrectCategory[file];

        // 确保类别存在
        if (!configData.categories[category]) {
            configData.categories[category] = {
                title: category,
                description: `${category}相关的教程`,
                topics: {}
            };
        }

        // 确保主题存在
        if (!configData.topics[topic]) {
            configData.topics[topic] = {
                title: topic,
                description: `${topic}相关教程`,
                icon: '📄',
                order: 999
            };
        }

        // 确保主题在类别中存在
        if (!configData.categories[category].topics[topic]) {
            const topicData = configData.topics[topic];
            configData.categories[category].topics[topic] = {
                title: topicData.title || topic,
                description: topicData.description || `${topic}相关教程`,
                files: []
            };
        }

        // 创建文件对象
        const fileObj = {
            filename: path.basename(file), // 仅文件名，向后兼容
            path: file, // 完整相对路径
            title: metadata.title || path.basename(file, '.md'),
            author: metadata.author || '未知',
            order: parseInt(metadata.order) || 999,
            description: metadata.description || '无描述',
            last_updated: metadata.last_updated || metadata.date || '未知',
            difficulty: metadata.difficulty || 'beginner',
            tags: metadata.tags ? (Array.isArray(metadata.tags) ? metadata.tags : metadata.tags.split(',').map(t => t.trim())) : [],
            category: category,
            topic: topic
        };

        // 检查文件是否已存在于主题的文件列表中
        const existingFileIndex = configData.categories[category].topics[topic].files.findIndex(
            f => f.filename === path.basename(file) || f.path === file
        );

        if (existingFileIndex >= 0) {
            // 更新现有文件
            configData.categories[category].topics[topic].files[existingFileIndex] = fileObj;
        } else {
            // 添加新文件
            configData.categories[category].topics[topic].files.push(fileObj);
        }

        // 按order排序
        configData.categories[category].topics[topic].files.sort((a, b) => a.order - b.order);

        // 添加到all_files
        configData.all_files.push(fileObj);

        // 更新作者信息
        if (metadata.author) {
            if (!configData.authors[metadata.author]) {
                configData.authors[metadata.author] = {
                    name: metadata.author,
                    files: []
                };
            }

            // 检查文件是否已存在于作者的文件列表中
            if (!configData.authors[metadata.author].files.includes(path.basename(file))) {
                configData.authors[metadata.author].files.push(path.basename(file));
            }

            // 从其他作者的文件列表中移除此文件，确保作者信息一致性
            Object.keys(configData.authors).forEach(author => {
                if (author !== metadata.author && configData.authors[author].files.includes(path.basename(file))) {
                    configData.authors[author].files = configData.authors[author].files.filter(f => f !== path.basename(file));

                    // 如果该作者没有其他文件了，移除该作者
                    if (configData.authors[author].files.length === 0) {
                        delete configData.authors[author];
                    }
                }
            });
        }
    });

    // 按order排序all_files
    configData.all_files.sort((a, b) => a.order - b.order);
}

// 生成索引内容的函数
function generateIndexContent(configData) {
    let indexContent = `# 教程索引\n\n`;

    indexContent += `这个文件是泰拉瑞亚Mod制作教程的索引，列出了所有可用的教程资源。索引是自动生成的，贡献者可以通过添加新的教程文件来更新此索引。\n\n`;
    indexContent += `## 如何添加新教程\n\n`;
    indexContent += `1. 在\`docs\`目录下创建新的Markdown文件\n`;
    indexContent += `2. 在文件开头添加以下元数据格式：\n\n`;
    indexContent += `\`\`\`markdown\n---\ntitle: 教程标题\ndifficulty: beginner|intermediate|advanced\ncategory: 入门|进阶|高级|个人分享|怎么贡献\ntopic: env|mod-basics|items|npcs|world-gen|ui|networking|advanced\ntime: 预计完成时间（分钟）\nauthor: 作者名称\ndate: 更新日期（YYYY-MM-DD）\ndescription: 简短描述\n---\n\`\`\`\n\n`;
    indexContent += `3. 运行\`node generate-index-enhanced.js\`脚本自动更新此索引文件\n\n`;

    // 按类别生成内容
    Object.keys(configData.categories).forEach(category => {
        const categoryData = configData.categories[category];
        if (categoryData.topics && Object.keys(categoryData.topics).length > 0) {
            indexContent += `## ${categoryData.title}\n\n`;
            indexContent += `${categoryData.description}\n\n`;

            // 获取该类别下的所有文件
            const categoryFiles = [];
            Object.keys(categoryData.topics).forEach(topic => {
                const topicData = categoryData.topics[topic];
                if (topicData.files) {
                    topicData.files.forEach(file => {
                        categoryFiles.push({ ...file, topic });
                    });
                }
            });

            // 按order排序
            categoryFiles.sort((a, b) => a.order - b.order);

            // 生成文件列表
            categoryFiles.forEach(file => {
                const topicData = configData.topics[file.topic] || {};
                const topicIcon = topicData.icon || '📄';
                const topicTitle = topicData.title || file.topic;

                indexContent += `### ${topicIcon} [${file.title}](${file.path})\n`;
                indexContent += `- **难度**: ${getDifficultyText(file.difficulty)}\n`;
                // 检查时间字段是否已经包含"分钟"，避免重复
                const timeText = file.time || '未知';
                const timeDisplay = timeText.includes('分钟') ? timeText : `${timeText}分钟`;
                indexContent += `- **预计时间**: ${timeDisplay}\n`;
                indexContent += `- **作者**: ${file.author || '未知'}\n`;
                indexContent += `- **更新日期**: ${file.last_updated || '未知'}\n`;
                indexContent += `- **描述**: ${file.description || '无描述'}\n`;
                if (file.tags && file.tags.length > 0) {
                    indexContent += `- **标签**: ${file.tags.join(', ')}\n`;
                }
                indexContent += `\n`;
            });
        }
    });

    // 添加自动生成脚本部分
    indexContent += `---\n\n`;
    indexContent += `## 自动生成脚本\n\n`;
    indexContent += `为了方便贡献者，我们提供了一个增强版Node.js脚本来自动生成教程索引：\n\n`;
    indexContent += `\`\`\`javascript\n// generate-index-enhanced.js\nconst fs = require('fs');\nconst path = require('path');\n\n// 读取所有Markdown文件\nconst docsDir = './docs';\nconst files = fs.readdirSync(docsDir).filter(file => file.endsWith('.md') && file !== 'tutorial-index.md');\n\n// 按类别分组\nconst categories = {\n    '入门': [],\n    '进阶': [],\n    '高级': [],\n    '个人分享': [],\n    '怎么贡献': []\n};\n\n// 解析每个文件的元数据\nfiles.forEach(file => {\n    const content = fs.readFileSync(path.join(docsDir, file), 'utf8');\n    const metadata = parseMetadata(content);\n    \n    if (metadata.category) {\n        categories[metadata.category].push({\n            file,\n            ...metadata\n        });\n    }\n});\n\n// 生成索引内容\nlet indexContent = \`# 教程索引\\\\n\\\\n\`;\n// ... 其余脚本内容\n\`\`\`\n\n`;
    indexContent += `要使用此脚本，请运行：\n\n`;
    indexContent += `\`\`\`bash\nnode generate-index-enhanced.js\n\`\`\`\n\n`;
    indexContent += `这将自动扫描\`docs\`目录中的所有Markdown文件，解析它们的元数据，并更新\`tutorial-index.md\`文件。\n`;

    return indexContent;
}

// 辅助函数
function parseMetadata(content) {
    try {
        // 移除可能的BOM字符
        content = content.replace(/^\uFEFF/, '');

        // 尝试多种正则表达式模式
        let metadataMatch = content.match(/---\r?\n(.*?)\r?\n---/s);
        if (!metadataMatch) {
            metadataMatch = content.match(/^---\s*\n(.*?)\n---/ms);
        }
        if (!metadataMatch) {
            return {};
        }

        const metadata = {};
        const lines = metadataMatch[1].split(/\r?\n/);

        lines.forEach(line => {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim();
                metadata[key] = value;
            }
        });

        return metadata;
    } catch (error) {
        console.error('解析元数据时出错:', error.message);
        return {};
    }
}

function getDifficultyText(difficulty) {
    const texts = {
        'beginner': '初级',
        'intermediate': '中级',
        'advanced': '高级'
    };
    return texts[difficulty] || difficulty;
}

// 主处理逻辑
console.log('开始生成增强版教程索引和配置文件...');
processMainProject();
console.log('\n增强版主项目处理完成！');