# Python Steps Lab 发布与回滚

正式网址：https://steveniotech.github.io/python-steps-lab/

已从仓库 Settings → Pages 实际核实：Source 为 Deploy from a branch，分支 main，目录 /(root)，Enforce HTTPS 开启。保留现有发布方式，不创建自定义 Actions workflow。页面中的 pages build and deployment 是 GitHub 分支发布生成的流程名称。

## 本次文件来源

根目录 index.html 是正式入口。它通过相对路径加载课程、运行器、样式及 cloud-config.js、python-cloud.js、python-account.js。本地品牌适配另外引用 brand.css 和 assets/io-tech-center-logo.png，仍待本次设计确认及发布授权。发布需要提交更新后的根目录资源；只生成 dist/ 不会更新本网站。

`node scripts/build-site.mjs` 用于本地校验和生成仅含11个静态资源的 dist/，不会自行推送或发布。白名单精确新增品牌 CSS 与 PNG，图片按二进制复制；拒绝意外文件、目录和符号链接，不扩大为整个项目目录。它核对 Supabase 项目、公开 key 格式、正式路径启用条件及凭证特征。不要把管理员密钥、密码、JWT 或 session 放进源码、构建产物或 Git。

前端仅在正式 origin 的 /python-steps-lab 路径下及 http://127.0.0.1:8000 启用云端。其他同域项目路径不启用。classroom-admin 允许上述两个精确 origin，所有管理请求仍验证 Auth 身份、数据库教师角色和学生归属；没有通配来源。

Auth Site URL 为 https://steveniotech.github.io/python-steps-lab/index.html。当前使用账号密码登录和服务端教师管理，没有自助注册、邮件恢复或 OAuth 回调代码，不为假设流程添加 Redirect URLs。

## 发布门槛

2026-11-04 03:17:50 UTC 的真实 HTTP 验证报告已核对：目标项目正确，23项检查全部通过，failure_reason=null。覆盖三账号签名登录、生产 Origin CORS、跨教师函数拒绝、跨学生读取隔离、提权/写表拒绝、并发 revision 冲突及重新登录恢复。账号特定报告保留本机，不提交到公开仓库；这不代替发布后的 Pages 部署和网页检查。

1. 本地课程、同步、教师接口回归和构建检查通过。
2. 真实 HTTP 检查通过，包括签名登录、保存/恢复、跨教师函数拒绝、跨学生读取拒绝、提权/写表拒绝及 revision 冲突。数据库模拟身份检查和 mock 不替代此项。
3. 只提交本项目发布所需源码、无账号数据的测试及说明。带实际账号引用的本地验证脚本、报告和历史记录不提交。
4. 推送 main 后，等待仓库 Pages 自动 build/deploy 成功，再核对正式页面、静态资源、启用配置和生产 origin 的接口请求。Git 推送成功不等于线上验收通过。

## 已核实的回滚基线

本次发布前的最后成功 Pages 部署：

- Run：https://github.com/steveniotech/python-steps-lab/actions/runs/38395978314
- SHA：328ff40e4f7fc40a83074c20ad05810f7f5fb801
- main，build/report-build-status/deploy 均 Success。

若本次新版前端发布异常，对本次发布可通过新的回滚提交恢复此前成功的三个前端文件：

```sh
git restore --source=328ff40e4f7fc40a83074c20ad05810f7f5fb801 -- index.html python-steps.css python-steps.js
git add -- index.html python-steps.css python-steps.js
git commit -m "Restore previous Python Steps frontend"
git push origin main
```

这会触发现有 main 根目录 Pages 发布。随后再次确认 Pages 部署成功及正式页面。保留 Supabase 数据库、Auth 用户、profile、学习进度和现有本地缓存，不回退迁移，不重置数据库。
