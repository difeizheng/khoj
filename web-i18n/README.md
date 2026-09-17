# Khoj Web UI 中文化（web-i18n）

零源码改动的运行时翻译覆盖层：不改上游任何前端代码，通过「构建时注入 + 运行时 DOM 翻译」实现界面中文化，**与官方上游同步零冲突**。

## 为什么不是 next-intl / react-i18next？

Khoj 生产模式是 Next.js 静态导出（`output: 'export'`），页面由 FastAPI 直接伺服，没有服务端渲染；且上游活跃开发 Web UI，任何侵入式 i18n 改造（组件包 `t()`、改路由）都会在每次 merge 官方更新时产生大面积冲突。本方案在仓库新增独立目录，官方 merge 永远干净。

## 工作原理

```
官方镜像 ghcr.io/khoj-ai/khoj:latest
        │ docker cp 提取 /app/src/khoj/interface/built
        ▼
inject.py：给每个 HTML </head> 前注入
        <script src="/static/khoj-i18n.js?v=<hash>" defer></script>
        │
        ▼
dist/（构建产物，gitignore）
        │ compose 挂载（~/.khoj/docker-compose.yml）
        ├── dist/                 → /app/src/khoj/interface/built:ro   （HTML 覆盖）
        └── dist-khoj-i18n.js     → /app/src/khoj/static/khoj-i18n.js:ro（引擎脚本）
```

`khoj-i18n.js`（无依赖单文件）加载后翻译静态 DOM，再挂 MutationObserver 跟踪 React 渲染的新节点。**只做整文本精确匹配**：词典 key 必须等于文本节点/属性（placeholder/aria-label/title）的完整英文串——因此聊天流式内容、AI 回复、用户输入永远不会被误翻。

右下角浮动「中/EN」按钮可切换语言（存 localStorage `khoj-i18n-lang`）。英文模式下脚本不做翻译，但仍渲染「中」按钮供切回中文（不会锁死在英文）。

## 日常使用

### 词典更新（最常见：给新 UI 补翻译）

编辑 `khoj-i18n.js` 里的 `DICT` 对象（按页面分区），然后：

```bash
cd web-i18n && bash build.sh
cd ~/.khoj && docker compose restart server
```

浏览器强制刷新（Ctrl+F5）。

### 官方镜像升级后（同步上游）

```bash
# 1. 同步源码（与 fork 同步，不会冲突——本目录上游不存在）
git fetch origin && git merge origin/master && git push fork master

# 2. 拉新镜像（国内网络走南大镜像 retag，见知识库 pitfalls/khoj-docker-部署两坑）
docker pull ghcr.nju.edu.cn/khoj-ai/khoj:latest
docker tag ghcr.nju.edu.cn/khoj-ai/khoj:latest ghcr.io/khoj-ai/khoj:latest

# 3. 重建 i18n 产物（自动用新镜像的 built/，词典未覆盖的新英文串保持英文）
bash build.sh

# 4. 重启生效
cd ~/.khoj && docker compose up -d server
```

### 完全移除

compose 里删掉两行 web-i18n volume 挂载，`docker compose up -d server` 即恢复官方原版。

## 文件说明

| 文件 | 作用 |
|---|---|
| `khoj-i18n.js` | 翻译引擎 + 中英词典（唯一需要日常维护的文件） |
| `inject.py` | HTML 注入器（幂等，支持 `?v=hash` 缓存破坏） |
| `build.sh` | 一键构建：镜像提取 → 注入 → 产 dist/（Windows Git Bash 兼容） |
| `dist/`、`dist-khoj-i18n.js` | 构建产物（gitignore，可随时重建） |

## 已知限制

- 词典未命中的字符串显示英文原文（设计如此，保证升级安全）
- `<title>` 在部分内页由 React 动态设置，首次加载可能短暂显示英文（Flash）
- 动态拼接的句子（如 "5 new messages"）不翻译——精确匹配的设计取舍
- Windows Git Bash 下运行 build.sh 无需额外配置（已内置 MSYS 路径兼容处理）
