# Cybermorgue · 网站页面交接文档

> 本文件供接手本项目的其他 AI agent 使用。读完即可理解：网站有哪些页面、每个页面怎么工作、怎么加新内容、遵循什么设计规范。
> 世界观原文见 `Cybermorgue-企划设定.md` 与 `Texts/` 下各「无排版」文档。

---

## 一、项目是什么

**Cybermorgue（赛博停尸间）**：一个双人世界观企划。所有虚构作品里死掉的角色会来到这里。居民是「复现体」（死人，无法被伤害、也无法伤害别人）；工作人员（staff）是唯一会受伤、会死的存在，死后会立即被接替。企划内容主要围绕 staff 们展开，半论坛向、带规则怪谈气质。

**网站形态**：纯静态站（HTML + CSS + 原生 JS + 本地 JSON），**无框架、无构建、无外部 CDN 依赖**（离线可用）。部署在 GitHub Pages。所有页面共用同一套设计系统与交互脚本。

---

## 二、文件结构

```
project/                      ← 站点根目录（部署时即仓库根目录）
├── index.html                ← 入口跳转页（自动跳转到 Cybermorgue-档案主页.html）
├── Cybermorgue-档案主页.html  ← 主入口页（首页/申请表单/员工通道，多视图单页）
├── Cybermorgue-档案主页.data.json
├── 员工手册.html / 员工手册.data.json
├── 专有名词库.html / 专有名词库.data.json
├── assets/                  ← 全局共享资源（见第五节）
│   ├── base.css             ← 光标 + 滚动条（全站 14 页通用）
│   ├── base.js              ← 光标脚本
│   ├── oc-base.css          ← OC 档案模板 CSS（FILE VIEWER 公共样式）
│   └── oc-base.js           ← OC 档案模板 JS（渲染函数/动画/返回）
├── README.md                 ← 部署说明
├── OC/                       ← 员工档案目录
│   ├── 索引.html             ← 员工档案索引（搜索/筛选页）
│   ├── <名字>.html + <名字>.data.json   ← 每个 OC 一个页面 + 一个数据文件
│   ├── img/                  ← 证件照（KK.jpg / Val.jpg）
│   └── otherresources/       ← 音频等资源（Merrie 的 mp3 在这）
└── Texts/                    ← 世界观文档（无排版源稿，agent 据此写数据）
```

---

## 三、页面清单

| 页面 | 性质 | 数据源 | 功能 |
|---|---|---|---|
| `index.html` | 跳转页 | — | meta refresh + JS 跳转到主页 |
| `Cybermorgue-档案主页.html` | 主入口（单页多视图） | 主页 data.json | 首屏大标题（滚动进入）→ 欢迎区 → 「申请入驻 / 员工」双入口 |
| 主页·申请入驻 | 子视图 | form 段 | **Stepper 十步问卷**（一题一步） |
| 主页·员工通道 | 子视图 | login / staffHome | 工号密码自动输入动画 → 员工主页（手册入口+区域介绍+员工档案） |
| 主页·区域介绍 | 子视图 | zones 段 | 12 个区域网格 |
| `OC/索引.html` | 档案索引 | 动态读所有 OC data.json | 搜索（含真实姓名/别名/阵营）+ 性别/区域/部门筛选 + 密级圆点 |
| `OC/<名字>.html` ×10 | 员工档案页 | 各自 data.json | 工牌 + 分节内容 + 论坛 + 录音 + 特殊机制 |
| `员工手册.html` | 手册页 | 手册 data.json | 左侧索引侧栏 + 前言/词库/岗位(弧形菜单)/规则条例 |
| `专有名词库.html` | 词库页 | 词库 data.json | 字母导航 + 词条卡片 |

**现有 10 个 OC**（见 OC/ 目录）：DyeOxide / Kameron / Valentina / Nyxstr / ZakeVacuma / TatyanaCrimson / MarcusVacarcel / BellerophusDessner / HowarSterling / MerrofayeColotis。

---

## 四、路径与导航规则（重要）

每个页面内有两套跳转逻辑，靠 `typeof spherse !== "undefined"` 判断：

```js
// 在 Spherse App 内：用项目根路径（当前根是 project/ 的上一级，所以带 project/ 前缀）
spherse.openFile("project/OC/索引.html");

// 在普通浏览器：用页面相对路径
else location.href = "索引.html";
```

- 主页 `openFile(p)` 的浏览器兜底为 `location.href = p.replace(/^project\//, "")`（站点根 = project 内容）。
- 索引页卡片打开档案传两个路径：`openFile("project/OC/xxx.html", "xxx.html")`（app 路径, 浏览器相对路径）。
- 数据读取全部用相对当前页的 `fetch("./xxx.data.json")`，浏览器下自动正确。

**改动路径时务必两套都改。**

---

## 五、设计系统

### 配色（当前生效值，已在各页 style 内以 `:root` 覆盖声明，后声明者胜出）

| 变量 | 浅色 | 深色 |
|---|---|---|
| `--bg` | `#e8ece5` | `#0a0e0b` |
| `--fg` | `#1f2620` | `#e6ece2` |
| `--card` | `#f7f9f4` | `#131813` |
| `--card2` | `#dce4d6` | `#1b221c` |
| `--border` | `#b8c4b2` | `#3a4438` |
| `--primary` | `#2f6b45`（森林绿） | `#9fd3a0` |
| `--primary-fg` | `#f2f7f2` | `#0e140e` |
| `--muted` | `#64705f` | `#96a292` |
| `--danger` | `#b03a26` | `#e06a4e` |
| `--gold` | `#b08a3f` | `#d6b060` |
| `--grad` | `linear-gradient(135deg, #3f7d53, #2a5c3a)` | `linear-gradient(135deg, #7cb87f, #5a8a5c)` |

风格基调：**复古未来的森林绿档案站**。克制、冷调、纸张质感；不炫技、动效必须有动机。

### 字体
- 正文：`"Helvetica Neue", Helvetica, Arial, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif`
- 主页大标题：`"Melete-Bold", "Melete", serif`（本机字体，无则回退衬线）
- 录音/等宽：`Courier New, "Sarasa Mono SC", "FangSong", "STFangsong", monospace`
- 特殊 quote/异常文字：`"Times New Roman", "Noto Serif SC", "STKaiti", serif`
- 数字用 `font-variant-numeric: tabular-nums`

### 形状与阴影
- 圆角体系：卡片 4px、输入框 8px、胶囊按钮 999px（规则一致）
- 阴影一律带橄榄色调：`color-mix(in srgb, var(--primary) 10%, transparent)`
- 全站固定一层 4.5% 纸噪点（body::after，pointer-events:none）

### OC 档案模板（共享，重要）

档案页的公共模板也已抽成共享文件（`assets/oc-base.css` + `assets/oc-base.js`）：
- **加载顺序（安全保证）**：`oc-base.css` 放在页面 `<style>` **之前** → 页面自身的特殊样式永远优先，**特殊效果页（Nyxstr 异象 / Marcus 双版本 / Merrie 随身听 / Hax 金斜体 / Belle 视频 / Tatyana 邮件等）零风险**；特殊页只需在自身 `<style>` 里覆盖或新增即可。
- **oc-base.js** 放在页面脚本之前（head 里），提供 `esc/sp/paras/lvTag/CLMAP/DOTMAP/fheadHtml/badgeHtml/sectionsHtml/threadHtml/galleryHtml/decodeName/revealPanels/goBack`；需要定制渲染的页面（如 Nyxstr 的 `bodyText`、Hax 的 `%%` 处理）在自身脚本里重定义同名函数，**后定义者胜出**。
- **纯标准页 = 壳**：Dye / Kameron / Valentina 已瘦身为极薄页面（只有 `DATA` + `SELF_IDS` + `render()` 三行核心，全页不到 2KB），任何模板改动只需改 oc-base 两个文件即可全量生效。
- 特殊页内仍内嵌着模板 CSS/JS 的历史副本（被页面样式优先覆盖/被重定义覆盖），功能不受影响；如需彻底瘦身可后续清理。

### 交互层（全局共享，已内置）

**公共资源架构（重要）**：光标与滚动条已抽成共享文件，全站 14 页统一引用，**以后改光标/滚动条只需改这两个文件，全站生效，不要逐页改**：
- `assets/base.css`：全局滚动条（复古终端风：12px 网格轨道 + 琥珀切角滑块 + hover 辉光 + 按住变红彩蛋 + Firefox 简配 + `.thin-scroll` 迷你版；触屏 `hover:none`/`pointer:coarse` 自动隐藏恢复原生手势）+ 瞄准光标 CSS。颜色走各页 `:root` 变量（`var(--ph, var(--am, var(--primary)))` 兜底链）。
- `assets/base.js`：瞄准光标脚本。**立即设置 `window.__CM_CURSOR__ = true`**，各页旧光标 IIFE 顶部已有守卫（`if (window.__CM_CURSOR__) return;`）自动跳过，不会双光标。光标挂 `<html>`（body 抖动动画不影响）。事件委托选择器 `sel` 是**全站超集**，新增可交互界面元素请加进 base.js 的 `sel` 列表。
- 引用方式：OC 页（`OC/` 下）用 `../assets/base.css` + `../assets/base.js`；根目录页用 `assets/base.css` + `assets/base.js`（放在页面 `<style>` 之后）。**新增页面只需引用这两个文件**，不再需要复制光标/滚动条代码。
- 各页残留的旧光标/滚动条 CSS 与旧光标 IIFE 属于历史冗余（被共享文件覆盖/守卫跳过），可留可清，不影响功能。
- 光标行为：桌面端方框+圆点（琥珀色），锁定可点元素时四角张开变金色/绿色；**点击时四角以准星自身中心为圆心公转一圈**（380ms，无自转）；文本框恢复 I-beam；触屏/减弱动效自动关闭。
- **3D 倾斜卡片**（`.tilt`）：鼠标跟随 rotateX/Y，**角度 4°、透视 1200px**（保持文字清晰，勿加大角度）。
- 所有动画遵循 `prefers-reduced-motion`（跑马灯通告除外——它是信息通告，减弱动效下也保持滚动）。

---

## 六、文本标记规范（写 OC 文本时用）

| 标记 | 含义 | 渲染 |
|---|---|---|
| `++文本++` | 官方隐藏信息 | 黑条，悬停显示 |
| `%%文本%%` | 特殊人物语音（如 Hax 的左手先生） | 金色斜体（直接可见） |
| `〔汉字\|英文〕` 或 `[汉字\|英文]` | 注音 | 英文显示在汉字正上方 |
| `//文本//` | 斜体 | 斜体 |
| `##文本##` | 标红 | 红色加粗（员工手册页面用） |
| `--文本--` | 表面内容（Marcus 档案用） | 首次显示表面版，点"恢复"显示真实版 |
| `-点击查看录音记录/点击收起录音记录-` | 折叠标记 | 数据里写 `"recToggle": {"open": "＋点击查看录音记录", "close": "－点击收起录音记录"}` |

---

## 七、数据格式

### 主页 data.json（节选结构）
```json
{
  "splash": { "title": "Cybermorgue", "titleEn": "赛博停尸间", "slogan": "把尸体全部推进来…" },
  "home": { "sentence": "欢迎来到…", "paths": [{ "label": "申请入驻", "desc": "…" }, { "label": "员工", "desc": "…" }], "manualTitle": "《赛博停尸间入驻手册》", "manualRest": ["…段落…"], "copyright": "版权声明" },
  "zonesTitle": "区域划分",
  "zones": [{ "name": "方格厢门", "en": "Check Entrance", "desc": "…", "selectable": false }],
  "form": { "title": "申请入驻表格", "checks": [{ "q": "您是否知悉您已经死了？" }], "fields": [{ "label": "姓名", "type": "text", "required": true, "placeholder": "…" }], "zonesTitle": "…", "noneOption": "我没有特别想去的区域", "viewZones": "查看区域介绍", "knowsDead": "…", "knowsDeadPlaceholder": "…", "confirm": "…", "signPlaceholder": "…", "submit": "提交申请", "after": "感谢您的提交，稍后会有员工前来接应您。" },
  "login": { "id": "00002", "password": "eternaldeath", "greeting": "欢迎您，", "maskName": "议会01" },
  "staffHome": { "zonesLabel": "区域介绍", "archiveLabel": "员工档案", "more": "查看更多员工 →", "indexPath": "project/OC/索引.html", "manualPath": "project/员工手册.html", "ocs": [{ "name": "…", "alias": "…", "role": "…", "path": "project/OC/xxx.html" }], "files": [] }
}
```
> Stepper 的步骤由 `checks + fields + 区域 + knowsDead + confirm` 动态生成，**加新题只需改 data.json**。

### OC data.json 结构（标准模板）
```json
{
  "name": "英文名", "alias": "中文名 / 昵称",
  "fileNo": "CM/xxx-0000X0", "level": "内部（Internal）", "clearance": "yellow",
  "date": "＿＿＿＿＿＿", "portrait": "", "tags": { "gender": "…", "zone": "…", "department": "…" },
  "faction": "Wildcard",          // 可选，只有阵营成员才写
  "music": { "title": "…", "src": "otherresources/xxx.mp3" },  // 可选（Merrie）
  "gallery": [],
  "badge": [{ "k": "姓名", "v": "…" }, { "k": "工号", "v": "…" }, { "k": "性别", "v": "…" }, { "k": "所属分区／部门", "v": "…" }, { "k": "职位", "v": "…" }, { "k": "任职时长", "v": "…" }, { "k": "武器许可", "v": "…" }],
  "sections": [
    { "title": "外貌特征", "items": [{ "label": "", "text": "…" }] },
    { "title": "二、任职情况", "items": [{ "label": "岗位职责", "text": "…" }] },
    { "title": "三、性格与行为观测", "items": [{ "label": "性格描述", "text": "…" }] },
    { "title": "四、备注", "forum": [ { "board": "灌水区", "title": "…", "main": { "author": "…", "tag": "lv3", "ip": "…", "time": "3天前", "content": "…" }, "replies": [{ "author": "…", "tag": "lv4", "ip": "…", "time": "…", "content": "…", "depth": 0 }, { "expand": true, "content": "查看12条回复" }, { "system": true, "content": "此帖已被管理员删除" }] } ],
      "recordings": [{ "title": "【录音记录 xxx】", "lines": ["…"] }],
      "recToggle": { "open": "＋点击查看录音记录", "close": "－点击收起录音记录" },
      "quote": ["…居中衬线特殊quote…"] }
  ],
  "notes": "本档案由 Cybermorgue 内部档案系统统一归档，所有关联行为记录均已留存备查。\n档案内容如需更正，请以书面形式提交至档案管理部门。"
}
```
- `tag`：`lv1`~`lv6` 显示等级徽章；`管理员` 显示金色管理 tag；其他字符串（如 `bot`、`官方`、`OAM`）显示青色自定义 tag。
- `clearance`：`yellow`(内部) / `red`(机密) / `white`(公开) / `black`(绝密) / `rainbow`(彩虹，Marcus 用)。
- `depth`：回复缩进层级（0=楼，1=楼中楼，2=再下一级）。
- 帖子正文可用 `++…++`、`[汉字|英文]`、`//…//` 等标记（论坛渲染器已支持）。

---

## 八、特殊 OC 档案机制（各有专属 HTML 逻辑）

| OC | 特殊机制 |
|---|---|
| **Nyxstr** | 三态档案：正常版（黄签+结尾「文档有新版本」弹窗）→ `#anom` 异象版（红签、密级悬停扭曲、隐藏文字悬停/点击乱码揭示、忏悔按钮、录音、报错）→ `#restored` 修正版（干净+结尾气泡诗句）。隐藏文字机制：正常文字 → 抖动乱码 → 解码成红色衬线隐藏文字。 |
| **Marcus** | 表面/真实双版本：`--…--` 内容为首次显示，结尾系统弹窗「检测到本档案上一次的改动未经官方证书授权。是否恢复到旧版本？」点"是"变真实版（密级变"机密"+黄条、工号 00001→17203 等）；密级彩虹流动；观测备注表面含**食谱卡片**；quote 注音。 |
| **Hax** | 左手先生 `%%…%%` 金色斜体；结尾弹窗「该档案中部分内容已隐藏」→ 显示「时隙之间」段落，结尾红字"因为我是你。"（正常黑字+红线提示，悬停/点击乱码揭示为 LEFT is for "what's left".）。 |
| **Merrie** | 顶部无播放器（已移入录音折叠区底部）；音乐播放器（▶/↺/进度条/时间/音量）播放 `otherresources` 的 mp3，`preload="auto"` + 缓冲提示。 |
| **Tatyana** | 论坛主楼含**引用诉求块**（.bq）、**附件卡片**（📄 RAM年度汇报.pdf）、**邮件卡片**（点击"查看已发送的邮件"展开/收起，邮件卡片独立在帖外居中）。 |
| **Belle** | 论坛主楼含**视频卡片**（16:9 + ▶ 按钮 + 描述）；三段录音可折叠。 |
| **Zake** | 论坛帖 + 语音记录（Nyx 录音格式）。 |
| 通用 | 凡有 `recordings` 都按"＋点击查看录音记录/－点击收起"折叠；`quote` 渲染为居中衬线；`music` 渲染播放器。 |

---

## 九、新增一个 OC 的标准流程

1. 从 `Texts/CMOC列表x（无排版）` 读取用户写的 OC 原文。
2. 建 `OC/<名字>.data.json`（按第七节格式；`++`/`%%`/注音/`//` 标记照原文写进数据，渲染器自动处理）。
3. 复制一个**标准壳页**（推荐 `OC/DyeOxide.html`）改名为 `<名字>.html`，改：`<title>`、`DATA` 路径、`SELF_IDS`（该 OC 在论坛的 id，命中显示 ◆ 本档案关联者）；如需特殊机制（播放器/弹窗/引用/视频/双版本/异象等）参照第八节对应页面的写法，在壳页里**追加**自己的 `<style>` 块和脚本（oc-base 模板在前，你的特殊样式永远生效）。
4. 把新 OC 加入：`OC/索引.html` 的 `OC_FILES` 数组、主页 data.json 的 `staffHome.ocs`。
5. 如果有图片，放 `OC/img/`，在 data.json `portrait` 填相对路径（如 `img/xxx.png`，页面在 OC/ 下所以不用带 OC/）。
6. 有 mp3 等资源放 `OC/otherresources/`，`music.src` 用编码后的相对路径（空格用 %20、`'` 用 %27）。

**已确立的标记约定一定要沿用**（第六节），新 agent 不要另起炉灶。

---

## 十、部署

- GitHub Pages（仓库公开，`.nojekyll` 已建，`index.html` 跳转入口已就位）。
- 站点根 = `project/` 内容。更新 = 改文件 → `git add . && git commit && git push` → 约 1 分钟自动部署。
- 详情见 `README.md`。

---

## 十一、注意事项（踩过的坑）

- **不要修改用户已有文本内容**；改动前先确认。
- 路径有 app（`project/…`）与浏览器（相对路径）两套，改一个必须同步另一个。
- 3D 倾斜角度勿加大（会糊）；CRT 效果（外壳/扫描线/色差）用户已要求移除，**不要重新加**。
- 配色以第五节为准（多次覆盖后的最终值）；若用户再调色，改 `:root` 覆盖块即可。
- **公共资源走共享文件**：光标与滚动条一律改 `assets/base.css` / `assets/base.js`（全站生效），不要逐页改。新增页面只需引用这两个文件（见第五节「交互层」）。
- **瞄准光标（桌面端方框+圆点，琥珀色）是所有页面的必备元素**：由 `assets/base.js` 统一注入（事件委托，选择器覆盖全站所有可点元素）。新增任何界面（员工终端、闸门、表单、弹窗等）都要把新交互元素加进 `assets/base.js` 的 `sel` 选择器列表，否则鼠标没有反馈。
- **系统弹窗统一格式**（参考 `Code/系统弹窗格式参考.html`）：**作为页内块放在文档末尾**（不要做成全局遮罩/自动弹出）——`.syspop` 四角框（sp-head 圆点标题 / sp-body 正文带 `.hl` 高亮词 / sp-code 小字代码行 / sp-btns 忽略+查看按钮 / done 反馈态）。**弹窗内所有文案（标题/英文/正文/按钮/反馈）都必须放进对应 data.json 的 `sysdlg` 字段，页面从数据渲染**，方便用户随时改文案。
- **Wildcard 相关判词/语录统一用「档案附页·诗框」格式**（参考 `Code/一些特殊quote参考.html` 最下面的诗框）：`.poem-zone` > `.poem-title`（如「—《 判 词 》—」）+ `.poem`（顶部光晕 + 34px 间隔横线稿纸底 + `◈` 徽记 + 衬线）+ `.pl` 逐行浮现 + `.poem-sign` 签名。注音（`〔汉字|英文〕`）照常压在汉字上方。
- 新页面（员工手册/索引等）统一走「VT323 + Noto Sans SC + 琥珀/绿/红」终端视觉语言，与主页一致。
