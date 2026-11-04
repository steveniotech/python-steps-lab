# Python Steps Lab

## 学生账号与教师管理

云端功能面向正式网站 `https://steveniotech.github.io/python-steps-lab/` 和本机开发地址 `http://127.0.0.1:8000`。同域其他项目路径不会启用本项目云端配置。

新增老师分配学生编号/密码、按账号保存及恢复进度、教师班级进度列表、创建学生和重置密码。原匿名浏览器记录保留，导入账号需学生明确选择。云端同步包含断网重试、账号缓存隔离及多窗口 revision 冲突保护。教师预览草稿不再改写学生记录。

教师角色与学生归属由数据库和服务端鉴权决定。前端只包含公开 publishable key；管理凭证只由托管函数读取。没有自助注册、邮件找回密码或 OAuth 登录界面。

发布来源、检查门槛和回滚方式见 [PUBLISHING.md](docs/PUBLISHING.md)。运行 `node test-cloud.js` 验证本地账号/同步适配器；运行 `node scripts/build-site.mjs` 校验并生成仅包含9个网页资源的 `dist/`。现有 Pages 使用 main 的根目录，发布时必须提交根目录资源。下方“不需要账号/不上传”说明适用于匿名模式；登录学生的练习状态会发送至指定 Supabase 项目。实际账号验证报告保留在本机，不包含在公开发布中。

An independent Python playground for first-time coders aged 10–12. Open **`index.html`** directly, or use Live Server / the static-server command below and open the server root. No build, installation, account, or API key is needed.

- Follow **Learn → Type → Run → Fix → Build** through 29 tasks across five units and two projects. The map unlocks each stop in order. Type real Python, use **Run Code**, then **Check**. A three-level hint ladder never deducts stars.
- **Python’s first load requires internet**: a pinned Pyodide runtime loads from its official documented distribution at jsDelivr. Code then runs locally in a terminable worker; student code, replies, and progress are not sent to a server. No external UI libraries, audio, fonts, packages, or analytics load. See [Pyodide’s loading documentation](https://pyodide.org/en/0.28.0/usage/index.html).
- If loading fails, lessons, drafts, hints, and JavaScript structure checks remain available. Offline checks are explicitly provisional: they do not invent output or award completion stars. Use **Try Loading Python**, then Check after a successful real run.
- **Test Inputs** gives `input()` its next reply and shows both questions and answers in Output. Robot Interview uses a name and animal. Guess the Number’s **Run Code** uses a random secret; **Check Project** uses secret 12 with the default replies `5, 17, 12`. Add or remove replies to test other paths. **Add Replies 1–20** appends a full set of guesses for a random-run test.
- Drafts, current step, completion counts, stars, badges, test replies, hint usage, latest error type, and finished output are saved in this browser’s **localStorage**, key `python-steps-lab:v1`. Refresh restores them. File URLs and different localhost ports may have separate storage. Browser privacy settings may block saving; the page then explains how to export your work.
- Use **Teacher View** (also `index.html#teacher`) to inspect progress, preview any task without rewards, or **Export JSON**. **Reset Progress** requires two confirmations and clears only Python Lab progress. **Reset Code** confirms replacement of the current draft and keeps earned stars. Use nicknames; shared devices retain drafts until reset.
- Ordinary steps award 5 stars, challenges 10, Robot Interview 20, Guess the Number 30, once per task: **210 stars and 7 badges** in this edition. Bonus ideas are optional, with no extra stars in version 1. Hints, mistakes, and retries never subtract stars. Successful repeated checks are counted but never scored twice.
- Keyboard: Tab in the editor inserts four spaces; Escape leaves it. Ctrl/Cmd+Enter runs; Ctrl/Cmd+S confirms automatic saving. All controls have visible focus. Reduced motion keeps the completion card and disables its brief star animation.

The runner permits print, basic values, input simulation, arithmetic, decisions, loops, functions, lists, and a constrained random module. It rejects file/network/system/package tools, introspection, unsupported syntax, and oversized operations. Line/output limits and a worker timeout stop runaway loops. This is a restricted educational subset, **not a general Python IDE or a hardened hostile-code service**. Some task output words are part of explicit checklists; creative open-ended meanings still need a teacher’s review. Turtle is Coming Soon.

Files: `index.html`, `python-steps.css`, `python-steps.js`, `python-lessons.js`, `python-core.js`, `python-runner.js`, and `test-python.js`. Run `node test-python.js` with local `python3` for curriculum, checker, safety, persistence, and worker-lifecycle tests. See **TESTING.md** for actual browser results and remaining manual checks.

## 本地运行

浏览器运行无需构建或安装依赖。推荐在项目根目录启动静态服务器：

```sh
cd /path/to/python-steps-lab
python3 -m http.server 8000 --bind 127.0.0.1
```

打开 http://127.0.0.1:8000/ 。结束时按 Control+C。

## 检查

自动测试需要 Node.js 和本地 `python3`，不需要第三方包。

```sh
node --check python-lessons.js
node --check python-core.js
node --check python-runner.js
node --check python-steps.js
node --check test-python.js
node test-python.js
```

## 部署

首页为根目录 `index.html`，资源使用相对路径，适合 GitHub Pages 项目子路径部署。仓库：`steveniotech/python-steps-lab`。本地准备完成不代表已经上传或发布。

进度按浏览器源保存，同一域名下其他 Python Lab 页面使用相同存储键时会共享进度；换域名或从本地文件迁出不会自动恢复进度。当前支持 JSON 导出，不支持 JSON 导入。
