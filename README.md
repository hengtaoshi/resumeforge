<div align="center">
  <h1>ResumeForge</h1>
  <p><strong>AI 驱动的简历优化与求职辅助桌面应用</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Electron-33.x-47848F?logo=electron&logoColor=white" alt="Electron">
    <img src="https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=white" alt="React">
    <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white" alt="Vite">
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
    <img src="https://img.shields.io/github/v/release/hengtaoshi/resumeforge" alt="Version">
  </p>
</div>

## ✨ 特性

- **📝 简历编辑** — 直观的拖拽式版块管理，实时预览，支持 40+ 专业模板
- **🤖 AI 驱动** — 对接 DeepSeek、OpenAI、Anthropic、通义千问、Kimi、智谱 GLM 等多款 AI 模型
- **📊 ATS 评分** — 智能分析简历与岗位匹配度，针对性优化
- **🎯 JD 匹配** — 粘贴职位描述，AI 分析匹配度并定制简历
- **📈 求职看板** — 看板 + 漏斗视图追踪投递进度
- **💬 AI 助手** — 交互式职业咨询与简历建议
- **🛠 求职工具** — 薪资对比、公司收藏、面试日历、关键词优化
- **🎙 面试准备** — 模拟面试问题生成与回答建议
- **🌙 深色模式** — 支持亮/暗主题切换
- **🔒 本地优先** — 数据存储本地，支持云同步（需登录）
- **📤 导出** — 支持 PDF / HTML 格式导出简历


## 🚀 快速开始

### 环境要求

- Node.js >= 20
- npm >= 9

### 安装

```bash
git clone https://github.com/hengtaoshi/resumeforge.git
cd resumeforge
npm install
npm run dev
```

### 构建

```bash
npm run build
npm run build:electron
```

构建产物在 `release/` 目录。

## 📦 技术栈

| 层 | 技术 |
|---|------|
| **桌面框架** | Electron 33 |
| **前端框架** | React 19 + TypeScript |
| **构建工具** | Vite 6 |
| **样式** | Tailwind CSS 3.4 |
| **拖拽** | @dnd-kit |
| **状态管理** | Zustand |
| **AI 集成** | DeepSeek / OpenAI / Anthropic / 通义千问 / Kimi / 智谱 / MiniMax / 豆包 / OpenRouter |
| **PDF 处理** | pdfjs-dist |
| **数据库** | SQLite（sql.js） |
| **更新** | electron-updater（GitHub Releases） |

## 🧩 功能模块

### 📋 概览 (Dashboard)
简历统计、投递追踪、近期活动、快速创建简历。

### ✏️ 打造简历 (Editor)
拖拽排序版块管理，40+ 模板实时预览，版块显示/隐藏，AI 叙事分析。

### 🎨 模板系统
6 大分类、40+ 模板、实时切换、自定义字体。

### 🎯 JD 匹配
粘贴职位描述进行 AI 匹配分析，关键词提取，ATS 评估，定制简历。

### 🤖 AI 助手
多轮对话式职业咨询，简历优化建议，支持主流 AI 模型切换。

### 🛠 求职工具
薪资对比、公司收藏、面试日历、关键词优化、人脉推荐。

### 📈 求职看板
拖拽式投递状态管理，漏斗转化分析，面试记录追踪。

### 🔍 职位扫描
手动输入 / 链接解析 / 批量导入，多平台职位分析。

### ⚙️ 设置
9 家 AI 厂商配置，深色模式，自动保存，账户管理。

## 🔄 自动更新

通过 GitHub Releases 自动更新。推送 `v*` 标签触发 CI 构建：

```bash
git tag v1.0.0
git push origin v1.0.0
```

## 📄 协议

MIT © [hengtaoshi](https://github.com/hengtaoshi)

---

<div align="center">
  <sub>Built with Electron, React & TypeScript</sub>
</div>
