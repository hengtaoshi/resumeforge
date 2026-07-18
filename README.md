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

## 🎯 主打功能：AI 引导生成简历

**AI 引导式对话**是 ResumeForge 的核心体验。不再面对空白模板无从下手——像跟一位职业顾问聊天一样，一步步完成简历。

### 🤖 多位 AI 职业顾问，风格随你挑

告别千篇一律的机械问答，从 5 位不同风格的 AI 顾问中选择你喜欢的：

| 顾问 | 背景 | 擅长 | 风格 |
|------|------|------|------|
| **林悦** 🧡 | 大厂 HR 总监 | 挖掘被忽视的经历亮点、把零散工作提炼为体系化成就 | 温和鼓励，像懂行的朋友 |
| **张哲** 🎯 | 资深猎头顾问 | 行业薪资定位、简历竞争力评估、量化成果包装 | 专业犀利，直奔市场竞争力 |
| **陈婉清** 📝 | 职业叙事顾问 | 职业故事线梳理、STAR 法则打磨、叙事逻辑优化 | 鲜活生动，让经历变成故事 |
| **王浩** 💪 | 实战型职业教练 | 技术岗简历优化、项目经历去水分、面试官视角 | 直爽务实，不玩虚的 |
| **苏芮** 🧠 | 职业发展顾问 | 职业路径规划、能力模型梳理、跨行业转型策略 | 理性系统，结构化梳理 |

每位顾问拥有独立的对话风格、追问方式和开场白，每次体验都不同。不满意可以随时切换顾问。

### 💬 对话式信息收集

- AI 一次只问一个问题，由浅入深
- 每个经历会追问 2-3 轮细节（具体做了什么、怎么做的、量化数据）
- 信息收集完毕自动生成完整简历 JSON
- 支持后续对话调整和修改

### 📋 一键生成多版本

生成基础简历后，可一键生成三个梯度版本：

| 版本 | 定位 | 匹配度 |
|------|------|--------|
| **大厂适用版** | 对标字节/阿里/腾讯等头部企业标准 | 94% |
| **中厂适用版** | 匹配垂类头部公司、上市企业需求 | 88% |
| **小厂适用版** | 适合创业公司、中小微企业 | 82% |

---

## ✨ 完整功能

| English | 中文 |
|---------|------|
| **🤖 AI Guided Resume Creation** — Multi-persona career advisors, step-by-step conversation, auto-generate resume JSON | **🤖 AI 引导生成简历** — 多位 AI 职业顾问，对话式引导，自动生成简历 |
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

### 🎯 AI 引导生成简历（主打）
5 位 AI 职业顾问对话式引导，收集信息后自动生成完整简历。支持多版本一键生成。

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
