# 二手书电子档案管理系统

一个用于管理和展示二手书信息的电子档案系统，支持通过AI图像识别自动提取图书信息。

## 功能特性

- 📚 图书信息管理：添加、编辑、删除和查询图书信息
- 📱 响应式设计：适配桌面和移动设备
- 🤖 AI图像识别：使用豆包大模型识别图书封面，自动提取图书信息
- 🏪 位置管理：管理图书存放位置
- 📊 数据可视化：展示图书统计信息
- 📋 操作日志：记录系统操作历史

## 技术栈

- **前端框架**：React + Vite
- **UI组件库**：Ant Design
- **状态管理**：Zustand
- **路由管理**：React Router
- **网络请求**：Axios
- **AI集成**：豆包大模型 API
- **部署**：GitHub Pages

## 安装和运行

### 前提条件

- Node.js 16.0 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. 克隆仓库
   ```bash
   git clone https://github.com/dcv-cell/oldbookname.git
   cd oldbookname
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 配置AI API密钥
   - 编辑 `src/config/apiConfig.js` 文件
   - 填写豆包大模型 API 密钥

4. 启动开发服务器
   ```bash
   npm run dev
   ```

5. 构建生产版本
   ```bash
   npm run build
   ```

## AI集成说明

系统使用豆包大模型 API 进行图书封面识别，主要功能包括：

- 自动识别图书封面图像
- 提取书名、作者、出版社、ISBN等信息
- 支持多种图像格式
- 错误处理和重试机制

### API配置

在 `src/config/apiConfig.js` 中配置：

```javascript
doubao: {
  apiKey: 'YOUR_API_KEY', // 豆包API密钥
  apiUrl: 'https://ark.cn-beijing.volces.com/api/v3/responses',
  model: 'doubao-seed-1-6-flash-250828',
  enabled: true
}
```

## 部署信息

- **GitHub Pages 地址**：https://dcv-cell.github.io/oldbookname/
- **GitHub 仓库**：https://github.com/dcv-cell/oldbookname

## 项目结构

```
src/
├── components/         # 组件目录
├── config/             # 配置文件
├── pages/              # 页面组件
├── services/           # 服务层
├── store/              # 状态管理
├── App.jsx             # 应用入口
└── main.jsx            # 渲染入口
```

## 主要页面

- **首页**：系统概览和统计信息
- **添加图书**：上传图书封面，AI识别图书信息
- **管理图书**：编辑和删除图书信息
- **图书列表**：查看所有图书
- **位置管理**：管理图书存放位置
- **操作日志**：查看系统操作历史

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 许可证

MIT License
