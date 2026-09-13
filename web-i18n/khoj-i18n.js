/**
 * Khoj Web UI 运行时中文化覆盖层（零源码改动方案）
 * ------------------------------------------------------------------------
 * 原理：加载后翻译静态 DOM，再挂 MutationObserver 跟踪 React 渲染的新节点。
 *      只做「整文本精确匹配」——词典 key 必须等于文本节点/属性的完整英文串，
 *      因此聊天流式内容、AI 回复、用户输入永远不会被误翻（它们不会恰好等于 UI 短语）。
 * 安全：无任何外部依赖与网络请求；只改 textContent 与 placeholder/aria-label/title 属性。
 * 切换：右下角「中/EN」浮动按钮，选择存 localStorage(khoj-i18n-lang)；
 *      值为 "en" 时本脚本整体休眠，页面恢复纯英文。
 * 维护：上游升级后新 UI 字符串若未进词典，则显示英文原文，不影响功能。
 *      词典在下方 DICT 中按模块分区维护，key 必须与页面英文完全一致。
 */
(function () {
    "use strict";

    var LANG_KEY = "khoj-i18n-lang";
    var lang = "zh";
    try { lang = localStorage.getItem(LANG_KEY) || "zh"; } catch (e) {}
    if (lang === "en") return; // 用户显式选择英文：本脚本完全休眠

    /* ================= 词典：key = 英文原文（完整匹配），value = 中文 ================= */
    var DICT = {
        /* ---- 通用 / 导航 / 侧边栏 ---- */
        "Home": "主页",
        "Agents": "智能体",
        "Automations": "自动化",
        "Search": "搜索",
        "Settings": "设置",
        "Conversations": "对话",
        "Recent": "最近",
        "New": "新建",
        "Chat": "聊天",
        "Close": "关闭",
        "Cancel": "取消",
        "Save": "保存",
        "Saving": "保存中",
        "Delete": "删除",
        "Deleting...": "删除中…",
        "Done": "完成",
        "Edit": "编辑",
        "Retry": "重试",
        "Share": "分享",
        "Shared": "已分享",
        "Login": "登录",
        "Logout": "退出登录",
        "Previous": "上一条",
        "Next": "下一条",
        "More pages": "更多页",
        "Help": "帮助",
        "Learn more": "了解更多",
        "Free": "免费",
        "Profile": "个人资料",
        "Teams": "团队",
        "Releases": "版本发布",
        "Language": "语言",
        "Selected": "已选择",
        "Select all": "全选",
        "Clear all": "清空全部",
        "Dismiss": "忽略",
        "Dismiss banner": "关闭横幅",
        "Sorry": "抱歉",
        "Unknown": "未知",
        "Unknown error": "未知错误",
        "Network error": "网络错误",
        "Network issue": "网络问题",
        "Sign up to get started": "注册即可开始使用",
        "Get started with Khoj": "开始使用 Khoj",
        "Chat with us": "与我们聊天",
        "Alert": "提醒",
        "Loading": "加载中",
        "Booting...": "启动中…",
        "Search thorugh files": "搜索文件",

        /* ---- 聊天输入区 / 消息操作 ---- */
        "Ask Anything": "随便问",
        "How can I help?": "我能帮你什么？",
        "Type / to see a list of commands": "输入 / 查看命令列表",
        "Research Mode": "研究模式",
        "Click here to stop the streaming.": "点击此处停止生成。",
        "Click to transcribe your message with voice.": "点击使用语音输入。",
        "Listening...": "聆听中…",
        "Speak": "朗读",
        "Pause": "暂停",
        "Pause Speech": "暂停朗读",
        "Copy": "复制",
        "Copied to clipboard": "已复制到剪贴板",
        "Copy Message": "复制消息",
        "Copied Message": "已复制消息",
        "Like Message": "点赞消息",
        "Liked Message": "已点赞消息",
        "Dislike Message": "点踩消息",
        "Disliked Message": "已点踩消息",
        "Speak Message": "朗读消息",
        "Pause Message": "暂停朗读消息",
        "Retry Message": "重试消息",
        "Delete Message": "删除消息",
        "Delete Conversation": "删除对话",
        "Set a new title for the conversation": "为对话设置新标题",
        "Search conversations": "搜索对话",
        "All Conversations": "全部对话",
        "Scroll to bottom": "滚动到底部",
        "View all references for this response": "查看该回复的全部参考来源",
        "References": "参考来源",
        "Send sign in code": "发送登录验证码",
        "Check your email": "请查看你的邮箱",
        "Enter": "回车",
        "Escape": "退出键",
        "Invalid OTP.": "验证码无效。",
        "OTP expired. Please request a new one.": "验证码已过期，请重新获取。",
        "Just now": "刚刚",
        "Invalid Date": "无效日期",
        "Conversation Share URL": "对话分享链接",
        "Conversation with Khoj": "与 Khoj 的对话",
        "Drop files to upload": "拖放文件以上传",
        "Drag and drop files here": "拖放文件到此处",
        "Upload documents": "上传文档",
        "Please login to chat with your files": "请登录后与你的文件对话",
        "Interrupt acknowledged by server": "服务器已确认中断",
        "Interrupt message acknowledged by server": "服务器已确认中断消息",

        /* ---- 首页建议卡片 ---- */
        "Explain a trend": "解读趋势",
        "Explain concept": "解释概念",
        "Explain math": "讲解数学",
        "Explain finance": "讲解金融",
        "Get creative": "激发创意",
        "Create image": "生成图片",
        "Write code": "写代码",
        "Travel": "出行",
        "Food": "美食",
        "Health": "健康",
        "Learning": "学习",
        "Interviewing": "面试准备",
        "Suggest a fun activity": "推荐活动",
        "Find a place": "寻找地点",
        "Find a recipe": "找菜谱",
        "Write a program that": "写一个程序来",
        "Explain the concept of 'machine learning' in simple terms.": "用简单的话解释一下「机器学习」这个概念。",
        "Explain the difference between a stock and a bond.": "解释股票和债券的区别。",
        "Explain the key equations of general relativity.": "讲解广义相对论的关键方程。",
        "Explain the plot of the movie 'Doctor Zhivago' in detail.": "详细介绍电影《日瓦戈医生》的剧情。",
        "How can I improve my public speaking skills for an interview?": "如何提升面试中的公开表达能力？",
        "Create a simple calculator app using React.": "用 React 写一个简单的计算器应用。",
        "Paint a picture of": "画一幅",
        "Find the best empanada recipe from Colombia.": "找哥伦比亚最好吃的肉馅饼菜谱。",
        "Suggest fun activities for a group of friends on a rainy day.": "推荐几个雨天和朋友一起玩的活动。",
        "Recommend good exercises to improve my flexibility.": "推荐改善柔韧性的运动。",
        "Suggest healthy meal prep ideas for a busy work week.": "给忙碌的工作周推荐健康备餐思路。",
        "Help me improve my health": "帮我改善健康",
        "Help me improve my home": "帮我改善家居",
        "Find the best hidden gems in Nairobi.": "寻找内罗毕最好的隐藏景点。",
        "Find the best indie movies of the last year": "找出去年最好的独立电影",
        "Find the best-rated science fiction books of the last decade.": "找近十年评分最高的科幻小说。",
        "Find the top-rated coffee shops in Seattle.": "找西雅图评分最高的咖啡店。",
        "Research the best hiking trails in the Swiss Alps.": "调研瑞士阿尔卑斯山最好的徒步路线。",
        "Recommend plants that can grow well indoors.": "推荐适合室内养的植物。",
        "Suggest ways to make a small apartment feel more spacious.": "小户型如何布置显得更宽敞。",
        "Tell me more about this phenomenon": "给我讲讲这个现象",
        "Explain this meme to me": "给我解释这个梗",
        "Explain the significance of this image": "解释这张图片的意义",
        "Explain what is happening in this photograph": "说明这张照片里发生了什么",
        "Explain the significance of this historical painting": "解释这幅历史名画的意义",
        "Analyze document": "分析文档",
        "Analyze image": "分析图片",
        "Document": "文档",
        "Image": "图片",
        "Code": "代码",
        "Book": "书籍",
        "Paint": "绘画",
        "Translate": "翻译",
        "Translate text": "翻译文本",
        "Translate this text": "翻译这段文本",

        /* ---- Agents 页 ---- */
        "Create Agent": "创建智能体",
        "Create a New Agent": "创建新智能体",
        "How it works": "工作原理",
        "Explore": "探索",
        "Private": "私有",
        "Public": "公开",
        "Protected": "受保护",
        "Privacy Level": "隐私级别",
        "Privacy level is required": "隐私级别为必填项",
        "Private agents are only visible to you.": "私有智能体仅你自己可见。",
        "Public agents are visible to everyone.": "公开智能体对所有人可见。",
        "Agent Tools": "智能体工具",
        "Agent not found": "未找到智能体",
        "Error loading agents": "加载智能体失败",
        "A Khoj agent": "一个 Khoj 智能体",
        "Chat Model": "聊天模型",
        "Chat Options": "聊天选项",
        "Chat model is required": "聊天模型为必填项",
        "Select Agent": "选择智能体",
        "Select a model": "选择模型",
        "Select a model...": "选择模型…",
        "Search Models...": "搜索模型…",
        "Restrict Input Tools": "限制输入工具",
        "Restrict Output Modes": "限制输出模式",
        "Input Tools": "输入工具",
        "Output Modes": "输出模式",
        "All tools": "全部工具",
        "All modes": "全部模式",

        /* ---- Automations 页 ---- */
        "Automation": "自动化任务",
        "Create Automation": "创建自动化任务",
        "How often should this automation run?": "该自动化任务多久运行一次？",
        "Frequency": "执行频率",
        "Notify me when": "当…时通知我",
        "Query to Run is required": "执行查询为必填项",
        "Time Recurrence is required": "重复时间为必填项",
        "Every is required": "周期为必填项",
        "Subject": "主题",
        "Time": "时间",
        "Daily": "每天",
        "Weekly": "每周",
        "Month": "每月",
        "Quick": "快捷",
        "Create a newsletter of": "创建一个关于…的简报",
        "Generate a summary of": "生成…的摘要",
        "Make a picture of": "画一张…的图",
        "Digest of Healthcare AI trends": "医疗 AI 动态摘要",
        "Create a summary of the latest news about AI in healthcare.": "总结医疗 AI 领域的最新新闻。",
        "Market Crash Notification": "市场崩盘预警",
        "Market Summary": "市场摘要",
        "Weekly Newsletter": "每周简报",
        "Daily Bedtime Story": "每日睡前故事",
        "Round-up of research papers about AI in healthcare": "医疗 AI 论文周报",
        "Front Page of Hacker News": "Hacker News 首页",
        "Monday": "周一",
        "Tuesday": "周二",
        "Wednesday": "周三",
        "Thursday": "周四",
        "Friday": "周五",
        "Saturday": "周六",
        "Sunday": "周日",
        "Last Month": "上个月",
        "All Time": "全部时间",

        /* ---- 设置页 ---- */
        "Account Deleted": "账户已删除",
        "Manage data": "管理数据",
        "Manage Context": "管理上下文",
        "Manage files": "管理文件",
        "Your Memories": "你的记忆",
        "No memories found": "暂无记忆",
        "Fetching memories...": "正在获取记忆…",
        "Memory Deleted": "记忆已删除",
        "Memory Updated": "记忆已更新",
        "Memory enabled": "记忆已启用",
        "Memory disabled": "记忆已禁用",
        "Your memory has been successfully updated.": "你的记忆已成功更新。",
        "Your memory has been successfully deleted.": "你的记忆已成功删除。",
        "Failed to delete memory. Please try again.": "删除记忆失败，请重试。",
        "Failed to fetch memories. Please try again.": "获取记忆失败，请重试。",
        "Failed to update memory setting. Please try again.": "更新记忆设置失败，请重试。",
        "Failed to update memory. Please try again.": "更新记忆失败，请重试。",
        "Synced files": "已同步文件",
        "Shared files": "共享文件",
        "Configure files": "配置文件",
        "Knowledge Base": "知识库",
        "Build Your Knowledge Base": "构建你的知识库",
        "Search Your Knowledge Base": "搜索你的知识库",
        "Find file": "查找文件",
        "Find": "查找",
        "Select files...": "选择文件…",
        "Select files": "选择文件",
        "Select file": "选择文件",
        "Search files...": "搜索文件…",
        "Search Documents": "搜索文档",
        "Obsidian": "Obsidian",
        "Emacs": "Emacs",
        "Notion": "Notion",
        "Email": "邮箱",
        "Name": "名称",
        "Name is required": "名称为必填项",
        "Instructions": "指令",
        "Instructions are required": "指令为必填项",
        "Personality": "人设",
        "Personality is required": "人设为必填项",
        "Icon": "图标",
        "Icon is required": "图标为必填项",
        "Color": "颜色",
        "Color is required": "颜色为必填项",
        "Biologist": "生物学家",
        "Subscription": "订阅",
        "Current Plan": "当前方案",
        "Futurist": "Futurist 会员",
        "Futurist plan": "Futurist 方案",
        "Upgrade now": "立即升级",
        "Upgrade to Futurist": "升级到 Futurist",
        "Subscribe to switch model": "订阅后可切换模型",
        "Free models available": "有免费模型可用",
        "Models": "模型",
        "Which chat model would you like to use?": "你想用哪个聊天模型？",
        "Auto-track latest": "自动跟踪最新",
        "Terms of Service": "服务条款",
        "Privacy Policy": "隐私政策",
        "Your Second Brain.": "你的第二大脑。",
        "Simplify Deep Work": "简化深度工作",
        "Try advanced search": "试试高级搜索",
        "Dark Mode": "深色模式",
        "Light Mode": "浅色模式",
        "Toggle Sidebar": "切换侧边栏",
        "Toggle": "切换",
        "Phone number verified": "手机号已验证",
        "Phone number disconnected": "手机号已解绑",
        "Set API Key": "设置 API Key",
        "Update API Key": "更新 API Key",
        "Enter API Key of your Khoj integration on Notion": "输入你 Notion 集成的 Khoj API Key",
        "Failed to save Notion API key": "保存 Notion API Key 失败",
        "Download as plaintext": "下载为纯文本",
        "Export Chats": "导出聊天记录",
        "Export Complete": "导出完成",
        "Export Failed": "导出失败",
        "Exporting...": "导出中…",
        "Failed to export chats. Please try again.": "导出聊天记录失败，请重试。",
        "Failed to fetch conversations to export": "获取待导出对话失败",
        "Failed to fetch conversation count": "获取对话数量失败",
        "Unshare conversation": "取消分享对话",
        "Failed to unshare conversation": "取消分享失败",
        "Your account has been successfully deleted.": "你的账户已成功删除。",
        "Your synced documents have been deleted.": "你同步的文档已删除。",
        "Your Futurist subscription has been renewed": "你的 Futurist 订阅已续期",
        "Your subscription was cancelled": "你的订阅已取消",
        "Failed to change subscription": "变更订阅失败",
        "Failed to delete account": "删除账户失败",
        "Failed to disconnect phone number": "解绑手机号失败",
        "Failed to send OTP": "发送验证码失败",
        "Failed to verify OTP": "验证码校验失败",
        "Failed to send magic link via email.": "通过邮箱发送登录链接失败。",
        "Failed to start chat session": "启动聊天会话失败",
        "File deleted": "文件已删除",
        "Error deleting file": "删除文件出错",
        "Failed to delete file": "删除文件失败",
        "Failed to fetch file": "获取文件失败",
        "Failed to fetch files": "获取文件列表失败",
        "Failed to load files": "加载文件失败",

        /* ---- 页面标题 ---- */
        "Khoj AI - Ask Anything": "Khoj AI - 随便问",
        "Khoj AI - Your Second Brain": "Khoj AI - 你的第二大脑",
        "Khoj AI - Agents": "Khoj AI - 智能体",
        "Khoj AI - Automations": "Khoj AI - 自动化",
        "Khoj AI - Chat": "Khoj AI - 聊天",
        "Khoj AI - Search": "Khoj AI - 搜索",
        "Khoj AI - Settings": "Khoj AI - 设置",

        /* ---- 设置页分区/描述（长句）---- */
        "Clients": "客户端",
        "Account": "账户",
        "Delete Account": "删除账户",
        "Setup, configure, and personalize Khoj, your AI research assistant.": "安装、配置和个性化你的 AI 研究助手 Khoj。",
        "Configure Khoj to get personalized, deeper assistance.": "配置 Khoj 以获得更个性化的深度帮助。",
        "Khoj will learn and remember from your conversations.": "Khoj 会从你的对话中学习并记忆。",
        "Khoj will no longer learn or remember from your conversations.": "Khoj 将不再从你的对话中学习或记忆。",
        "Sync your Notion workspace.": "同步你的 Notion 工作区。"
    };

    /* ================= 引擎 ================= */

    var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, CODE: 1, PRE: 1, KBD: 1, TEXTAREA: 1, SVG: 1 };
    var TRANSLATABLE_ATTRS = ["placeholder", "aria-label", "title", "data-placeholder", "aria-placeholder"];

    function tr(text) {
        if (typeof text !== "string") return null;
        var t = text.trim();
        if (!t || t.length > 120) return null;
        return Object.prototype.hasOwnProperty.call(DICT, t) ? DICT[t] : null;
    }

    /* 保留首尾空白地替换文本节点内容 */
    function translateTextNode(node) {
        var raw = node.nodeValue;
        if (!raw) return;
        var hit = tr(raw);
        if (hit === null) return;
        var lead = raw.match(/^\s*/)[0];
        var tail = raw.match(/\s*$/)[0];
        node.nodeValue = lead + hit + tail;
    }

    function skipElement(el) {
        if (!el || el.nodeType !== 1) return false;
        if (el.id === "khoj-i18n-toggle") return true;
        if (SKIP_TAGS[el.tagName]) return true;
        if (el.isContentEditable) return true;
        return false;
    }

    function translateAttrs(el) {
        for (var i = 0; i < TRANSLATABLE_ATTRS.length; i++) {
            var attr = TRANSLATABLE_ATTRS[i];
            var val = el.getAttribute(attr);
            if (!val) continue;
            var hit = tr(val);
            if (hit !== null && hit !== val) el.setAttribute(attr, hit);
        }
    }

    function translateTree(root) {
        if (!root) return;
        if (root.nodeType === 3) { // 传入的就是文本节点
            if (!skipElement(root.parentElement)) translateTextNode(root);
            return;
        }
        if (root.nodeType !== 1 || skipElement(root)) return;
        translateAttrs(root);

        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
        var node;
        while ((node = walker.nextNode())) {
            if (!skipElement(node.parentElement)) translateTextNode(node);
        }
        var elems = root.querySelectorAll("[placeholder],[aria-label],[title],[data-placeholder],[aria-placeholder]");
        for (var i = 0; i < elems.length; i++) translateAttrs(elems[i]);
    }

    /* ================= 语言切换浮动按钮 ================= */

    function styleToggle(btn, dark) {
        if (dark) {
            btn.style.background = "rgba(15,23,42,.92)";
            btn.style.color = "#e2e8f0";
            btn.style.borderColor = "rgba(148,163,184,.4)";
        } else {
            btn.style.background = "rgba(255,255,255,.92)";
            btn.style.color = "#0f172a";
            btn.style.borderColor = "rgba(148,163,184,.5)";
        }
    }

    function createToggle() {
        if (document.getElementById("khoj-i18n-toggle")) return;
        if (!document.body) return;
        var btn = document.createElement("button");
        btn.id = "khoj-i18n-toggle";
        btn.type = "button";
        btn.textContent = "中";
        btn.title = "切换界面语言 / Toggle UI language";
        btn.style.cssText =
            "position:fixed;bottom:18px;right:18px;z-index:2147483000;padding:6px 14px;" +
            "border-radius:9999px;border:1px solid rgba(148,163,184,.5);font-size:12px;" +
            "line-height:1.4;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.12);" +
            "font-family:system-ui,sans-serif;backdrop-filter:blur(4px);user-select:none";
        styleToggle(btn, document.documentElement.classList.contains("dark"));
        btn.addEventListener("click", function () {
            try {
                localStorage.setItem(LANG_KEY, "en"); // 当前是中文，点击切到英文
            } catch (e) {}
            location.reload();
        });
        document.body.appendChild(btn);
        // 深浅色主题变化时同步按钮配色
        new MutationObserver(function () {
            styleToggle(btn, document.documentElement.classList.contains("dark"));
        }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    }

    /* ================= 启动与观察 ================= */

    var observer = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
            var m = mutations[i];
            if (m.type === "characterData") continue; // 流式内容、输入框等一律不碰
            for (var j = 0; j < m.addedNodes.length; j++) {
                translateTree(m.addedNodes[j]);
            }
        }
        // React 重渲染可能移除我们的按钮，补回
        createToggle();
    });

    function boot() {
        translateTree(document.body);
        // 页面标题
        var t = tr(document.title);
        if (t) document.title = t;
        createToggle();
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
