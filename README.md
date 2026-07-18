<div align="center">
  <h1>ResumeForge</h1>
  <p><strong>AI-Powered Resume Optimization & Job Hunting Desktop App</strong><br>AI 驱动的简历优化与求职辅助桌面应用</p>
  <p>
    <img src="https://img.shields.io/badge/Electron-33.x-47848F?logo=electron&logoColor=white" alt="Electron">
    <img src="https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=white" alt="React">
    <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white" alt="Vite">
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
    <img src="https://img.shields.io/github/v/release/hengtaoshi/resumeforge" alt="Version">
  </p>
</div>

## ✨ Features / 特性

| English | 中文 |
|---------|------|
| **📝 Resume Editor** — Drag-and-drop section management, live preview, 40+ templates | **📝 简历编辑** — 拖拽式版块管理，实时预览，40+ 专业模板 |
| **🤖 AI Powered** — DeepSeek, OpenAI, Anthropic, Qwen, Kimi, GLM and more | **🤖 AI 驱动** — 对接 DeepSeek、OpenAI、Anthropic 等多款 AI 模型 |
| **📊 ATS Scoring** — Smart resume-job match analysis | **📊 ATS 评分** — 智能分析简历与岗位匹配度 |
| **🎯 JD Matching** — Paste JD, AI analyzes fit and tailors resume | **🎯 JD 匹配** — 粘贴职位描述，AI 分析匹配度并定制简历 |
| **📈 Job Kanban** — Track applications with board + funnel views | **📈 求职看板** — 看板 + 漏斗视图追踪投递进度 |
| **💬 AI Chat** — Interactive career advice | **💬 AI 助手** — 交互式职业咨询与简历建议 |
| **🛠 Career Tools** — Salary compare, company watchlist, interview calendar | **🛠 求职工具** — 薪资对比、公司收藏、面试日历 |
| **🌙 Dark Mode** — Light/dark theme toggle | **🌙 深色模式** — 亮/暗主题切换 |
| **🔒 Local First** — Local storage, optional cloud sync | **🔒 本地优先** — 数据本地存储，可选云同步 |
| **📤 Export** — PDF / HTML format | **📤 导出** — 支持 PDF / HTML 格式 |

## 🚀 Quick Start / 快速开始

### Prerequisites / 环境要求

- Node.js >= 20
- npm >= 9

### Install / 安装

```bash
git clone https://github.com/hengtaoshi/resumeforge.git
cd resumeforge
npm install
npm run dev
```

### Build / 构建

```bash
npm run build
npm run build:electron
```

Artifacts in `release/` directory. / 构建产物在 `release/` 目录。

## 🖥 Screenshots / 截图

> TODO: Add screenshots here

## 📦 Tech Stack / 技术栈

| Layer / 层 | Technology / 技术 |
|-----------|------------------|
| **Desktop Framework** | Electron 33 |
| **Frontend** | React 19 + TypeScript |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS 3.4 |
| **Drag & Drop** | @dnd-kit |
| **State Management** | Zustand |
| **AI Integration** | DeepSeek / OpenAI / Anthropic / Qwen / Kimi / GLM / MiniMax / Doubao / OpenRouter |
| **PDF** | pdfjs-dist |
| **Database** | SQLite (sql.js) |
| **Updates** | electron-updater (GitHub Releases) |

## 🧩 Modules / 功能模块

### 📋 Dashboard / 概览
Resume statistics, delivery tracking, recent activity, quick resume creation.
简历统计、投递追踪、近期活动、快速创建简历。

### ✏️ Editor / 打造简历
Drag-and-drop section management, 40+ templates with live preview, section visibility toggle, AI narrative audit.
拖拽排序版块管理，40+ 模板实时预览，版块显示/隐藏，AI 叙事分析。

### 🎨 Template System / 模板系统
6 categories, 40+ templates, real-time switching, custom fonts.
6 大分类、40+ 模板、实时切换、自定义字体。

### 🎯 JD Match / JD 匹配
Paste JD for AI match analysis, keyword extraction, ATS evaluation, resume tailoring.
粘贴职位描述进行 AI 匹配分析，关键词提取，ATS 评估，定制简历。

### 🤖 AI Chat / AI 助手
Multi-turn career consultation, resume improvement suggestions, multi-model support.
多轮对话式职业咨询，简历优化建议，支持主流 AI 模型切换。

### 🛠 Career Tools / 求职工具
Salary comparison, company watchlist, interview calendar, keyword optimization, network recommendations.
薪资对比、公司收藏、面试日历、关键词优化、人脉推荐。

### 📈 Kanban / 求职看板
Drag-and-drop application status management, funnel conversion analysis, interview tracking.
拖拽式投递状态管理，漏斗转化分析，面试记录追踪。

### 🔍 Job Scanner / 职位扫描
Manual input, URL parsing, batch import, multi-platform job analysis.
手动输入 / 链接解析 / 批量导入，多平台职位分析。

### ⚙️ Settings / 设置
9 AI provider configs, dark mode, auto-save, account management.
9 家 AI 厂商配置，深色模式，自动保存，账户管理。

## 🔄 Auto Updates / 自动更新

Updates via GitHub Releases. Push a `v*` tag to trigger CI build:
通过 GitHub Releases 自动更新。推送 `v*` 标签触发 CI 构建：

```bash
git tag v1.0.0
git push origin v1.0.0
```

## 📄 License / 协议

MIT © [hengtaoshi](https://github.com/hengtaoshi)

---

<div align="center">
  <sub>Built with Electron, React & TypeScript</sub>
</div>
