# Cybermorgue 档案站 · 部署说明

本目录是一套**纯静态网页**（HTML + CSS + JS + 本地 JSON 数据），无后端依赖，任何静态托管平台都能直接部署。

- 入口页面：`Cybermorgue-档案主页.html`（根目录的 `index.html` 会自动跳转到它）
- 员工档案：`OC/` 文件夹，每个角色一个 `.html` + `.data.json`
- 数据改动只需要改对应的 `.data.json`，页面会自动读取，无需改 HTML

---

## 一、本地预览（推荐先做）

直接双击 HTML 打不开（浏览器会拦截本地 JSON 读取），需要用本地服务器：

```bash
# 在项目根目录打开终端，任选其一：
python3 -m http.server 8000
# 或
python -m http.server 8000
```

然后浏览器访问：`http://localhost:8000/`（会自动跳转主页）

---

## 二、部署到 GitHub Pages（免费）

1. **注册 GitHub 账号**（github.com），登录。
2. **新建仓库**：右上角 `+` → New repository → 仓库名随意（如 `cybermorgue`）→ 选 **Public**（免费 Pages 必须公开）→ Create。
3. **上传文件**（二选一）：
   - 网页端：仓库页面 → `Add file` → `Upload files` → 把整个项目文件夹里的**所有文件**拖进去（注意要把 `OC/` 文件夹里的文件也一起上传）→ Commit。
   - 命令行：`git init && git add . && git commit -m "first deploy" && git branch -M main && git remote add origin https://github.com/你的用户名/仓库名.git && git push -u origin main`
4. **开启 Pages**：仓库页面 → `Settings` → 左侧 `Pages` → Source 选 **Deploy from a branch** → Branch 选 `main` + `/ (root)` → Save。
5. 等 1–2 分钟，会显示你的网址：`https://你的用户名.github.io/仓库名/`

---

## 三、以后更新内容

**很方便**，因为是静态站，改完推上去就自动更新（约 1 分钟生效）：

```bash
git add .
git commit -m "更新了什么"
git push
```

如果不想用命令行，也可以在 GitHub 网页上直接编辑 `.data.json` 文件（打开文件 → 铅笔图标 → 改 → Commit changes），一样会自动更新。

---

## 四、常见问题

- **国内访问慢/打不开**：GitHub Pages 在国内偶尔不稳定。如果看的人都在国内，可以考虑改用 **Cloudflare Pages**（免费，部署方式类似）或腾讯云 EdgeOne Pages。
- **改了 JSON 页面没变**：GitHub Pages 有缓存，等 1–2 分钟强刷（Ctrl+Shift+R）即可。
- **首页大标题字体（Melete）**：那是本机安装的字体，别人浏览器里没有会自动回退到衬线体，不影响使用。
