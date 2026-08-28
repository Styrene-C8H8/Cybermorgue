/* ================= 讯务科客服组件（全局） =================
   用法：各页在 base.js 后引入 <script src="assets/support.js"></script>（OC 页 ../assets/support.js）
   数据文件：同目录 support.data.json（回复/关键词/快捷指令/魔术师剧情全部可编辑）
   显隐规则：加载界面、死者问卷、可见的系统弹窗出现时自动隐藏
   防跳关：rules 支持 req/set/denied（见 data 的 _comment）
   分条回复：reply 可为字符串或数组（逐条发送）；[X|Y] 渲染注音；{name} 替换问卷姓名
   ★ 双形态：完成问卷后说「转人工」→ 变身 THE MAGICIAN（见 data.magician，含检查点/防刷/提示） */
(function () {
  if (window.__CM_SUPPORT__) return;
  window.__CM_SUPPORT__ = true;

  /* 开发/测试用：?reset=1 打开 → 彻底清空本站进度（旗标/聊天/问卷姓名/boot 标记），
     完成后自动移除地址栏参数。上线前可考虑移除或加密此入口。 */
  try {
    if ((location.search || "").indexOf("reset=1") > -1) {
      localStorage.removeItem("cm_sup_flags");
      localStorage.removeItem("cm_sup_chat");
      localStorage.removeItem("cm_quiz_name");
      localStorage.removeItem("cm_mg_state");
      sessionStorage.removeItem("cm-booted");
      sessionStorage.removeItem("cm-goto");
      history.replaceState(null, "", location.pathname + location.hash);
    }
  } catch (e) {}

  /* ---- 工具 ---- */
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  var BASE = "";
  try { BASE = new URL(".", document.currentScript.src).href; } catch (e) { BASE = "assets/"; }
  var D = null;

  var FLAG_KEY = "cm_sup_flags", CHAT_KEY = "cm_sup_chat";
  var store = {}; /* localStorage 不可用（沙箱 iframe）时降级为内存 */
  function lsGet(k) { try { var v = localStorage.getItem(k); return v !== null ? v : (store[k] || null); } catch (e) { return store[k] || null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} store[k] = v; }
  function flagGet() { var s = lsGet(FLAG_KEY); return s ? s.split(",") : []; }
  function flagHas(k) { return flagGet().indexOf(k) > -1; }
  function flagSet(k) { try { var f = flagGet(); if (f.indexOf(k) < 0) { f.push(k); lsSet(FLAG_KEY, f.join(",")); } } catch (e) {} }
  /* 全局旗标 API：其他页面（如主页问卷提交）通过它写旗标/姓名（自带 localStorage 降级） */
  window.__CM_SUPPORT_API__ = {
    flagSet: flagSet,
    flagHas: flagHas,
    saveName: function (n) { if (n) lsSet("cm_quiz_name", n); }
  };

  var rules = [], fallback = [], chips = [];
  var MG = null;
  var zoneRe = null;   /* 分区名关键词（魔术师甩链接用） */
  var busy = false, fi = 0;
  var pending = null, chat = [];

  /* ---- 魔术师状态 ---- */
  var magicMode = false;
  var mgTriggered = {};      /* 已触发过的规则/chip 名 -> 是否已触发 */
  var mgCount = {};          /* 同题提问次数 */
  var mgWarned = false;      /* 是否已触发"我不重复"警告 */
  var mgUnknown = 0;         /* 未知词计数 */
  var mgSilent = false;      /* 未知词沉默（到检查点重置） */
  var mgHintStep = 0;        /* 提示点击步进（每检查点重置） */
  var mgCp = 0;              /* 当前检查点序号 */
  var mgChipPending = false; /* chips 更新待关窗重开后生效 */
  var lastUnk = -1;          /* 上一条未知回复下标（防连续重复） */
  var tkDone = false;        /* ticker 追加完成 */
  var wasHidden = false;     /* 上一帧显隐状态 */

  function mgCpNow() {
    if (!MG || !MG.checkpoints) return 0;
    var n = 0;
    MG.checkpoints.forEach(function (cp) { if (flagHas(cp.flag)) n++; });
    return n;
  }
  function mgResetForCp() { /* 检查点刷新：重置未知词沉默与提示步进；chips 更新等重开窗口 */
    mgUnknown = 0; mgSilent = false; mgHintStep = 0;
    mgChipPending = true;
    mgSaveState();
  }

  /* 魔术师对话状态持久化（跨页面记住：问过几次/已触发哪些/是否不耐烦） */
  var MG_STATE_KEY = "cm_mg_state";
  function mgLoadState() {
    try {
      var s = lsGet(MG_STATE_KEY);
      if (!s) return;
      var o = JSON.parse(s);
      if (o.trig) mgTriggered = o.trig;
      if (o.count) mgCount = o.count;
      if (typeof o.warned === "boolean") mgWarned = o.warned;
      if (typeof o.unknown === "number") mgUnknown = o.unknown;
      if (typeof o.silent === "boolean") mgSilent = o.silent;
      if (typeof o.hintStep === "number") mgHintStep = o.hintStep;
    } catch (e) {}
  }
  function mgSaveState() {
    try {
      lsSet(MG_STATE_KEY, JSON.stringify({
        trig: mgTriggered, count: mgCount, warned: mgWarned,
        unknown: mgUnknown, silent: mgSilent, hintStep: mgHintStep
      }));
    } catch (e) {}
  }

  /* ---- 聊天记录 ---- */
  function loadChat() { try { chat = JSON.parse(lsGet(CHAT_KEY) || "[]") || []; } catch (e) { chat = []; } }
  function saveChat() { try { if (chat.length > 120) chat = chat.slice(chat.length - 120); lsSet(CHAT_KEY, JSON.stringify(chat)); } catch (e) {} }

  /* ---- 显隐检测 ---- */
  function elVisible(el) {
    while (el && el.nodeType === 1) {
      if (getComputedStyle(el).display === "none") return false;
      el = el.parentNode;
    }
    return true;
  }
  function isHiddenZone() {
    if (document.getElementById("boot")) return true;
    var vf = document.getElementById("view-form");
    if (vf && vf.style.display === "block") return true;
    if (document.querySelector(".idle-mask")) return true;
    var pops = document.querySelectorAll(".syspop, .whisper-pop.show");
    for (var i = 0; i < pops.length; i++) if (elVisible(pops[i])) return true;
    var ov = document.getElementById("overlay");
    if (ov && ov.classList.contains("show")) return true;
    return false;
  }

  /* ---- 红点：pending 非空 = 亮 ---- */
  function setDot() {
    var d = document.getElementById("cs-dot");
    if (d) d.classList.toggle("on", !!pending);
  }

  /* ---- 头部/快捷指令切换 ---- */
  function swapHeader(who, fabTip) {
    var head = document.querySelector("#cs-panel .cs-head .who b");
    if (head) head.textContent = who.name || "讯务科 · 自动应答";
    var sub = document.querySelector("#cs-panel .cs-head .who .sub");
    if (sub) sub.textContent = who.sub || "";
    var tip = document.querySelector("#cs-fab .fab-tip");
    if (tip) tip.textContent = fabTip || "讯务科 · 值班中";
  }
  function rebuildChips() {
    var box = document.getElementById("cs-chips");
    if (!box) return;
    var lab = box.querySelector(".ch-lab");
    box.innerHTML = "";
    var chipsNow = [];
    if (magicMode && MG) {
      chipsNow = (MG.chips || []).slice();
      if (mgCp >= 1) { /* 我在哪 → 提示 */
        chipsNow = chipsNow.filter(function (c) { return c.t !== "我在哪"; });
        chipsNow.push({ t: MG.hintChip || "提示", hint: true });
      }
      if (lab) lab.textContent = "QUICK CMD // 快捷讯息";
    } else {
      chipsNow = (D.chips || []).slice();
      if (lab) lab.textContent = D.chipsLabel || "QUICK CMD // 快捷讯息";
    }
    chipsNow.forEach(function (c) {
      var b = document.createElement("button");
      b.textContent = c.t;
      b.onclick = function () { if (!busy) sendChip(c); };
      box.appendChild(b);
    });
  }

  function buildUI() {
    if (document.getElementById("cs-fab")) return;
    var w = document.createElement("div");
    w.id = "cs-widget";
    w.innerHTML =
      '<button class="cs-fab" id="cs-fab" aria-label="讯务科">' +
        '<span class="ring"></span><span class="ring2"></span><span class="pulse"></span>' +
        '<span class="core"><svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4V5z"/><path d="M8 9h8M8 12h5"/></svg></span>' +
        '<span class="cs-rd" id="cs-dot"></span>' +
        '<span class="fab-tip">' + esc(D.fabTip || "讯务科 · 值班中") + '</span>' +
      '</button>' +
      '<div class="cs-panel" id="cs-panel" style="display:none">' +
        '<span class="cs-corner1"></span><span class="cs-corner2"></span>' +
        '<div class="cs-head">' +
          '<div class="avatar"><span>✉</span></div>' +
          '<div class="who"><b>' + esc(D.who.name || "讯务科 · 自动应答") + '</b>' +
          '<div class="sub">' + esc(D.who.sub || "值班员：● 在线（大概）") + '</div></div>' +
          '<div class="cs-wave"><i></i><i></i><i></i><i></i><i></i></div>' +
          '<button class="cs-min" id="cs-min">✕</button>' +
        '</div>' +
        '<div class="cs-body" id="cs-body"></div>' +
        '<div class="cs-chips" id="cs-chips"><span class="ch-lab">' + esc(D.chipsLabel || "QUICK CMD // 快捷讯息") + '</span></div>' +
        '<div class="cs-input">' +
          '<span class="pr">&gt;</span>' +
          '<input id="cs-inp" placeholder="' + esc(D.inputPh || "输入讯息…") + '" maxlength="120" autocomplete="off">' +
          '<button id="cs-send">发送</button>' +
        '</div>' +
      '</div>';
    /* 挂到 <html>：页面 body 随机故障抖动不影响组件 */
    document.documentElement.appendChild(w);

    /* 历史记录 */
    loadChat();
    var body = document.getElementById("cs-body");
    chat.forEach(function (m) { appendMsgEl(body, m.text, m.who, m.red, m.t); });

    /* 魔术师模式持久化 */
    magicMode = flagHas("magic_mode");
    mgCp = mgCpNow();
    if (magicMode && MG) swapHeader(MG.who, MG.fabTip);
    rebuildChips();

    /* 红点初始化 */
    var href = "";
    try { href = decodeURIComponent(location.href); } catch (e) { href = location.href; }
    (D.pagePushes || []).forEach(function (pp) {
      if (!pending && pp.match && href.indexOf(pp.match) > -1 && !flagHas(pp.flag)) {
        pending = { text: pp.msg, flag: pp.flag };
      }
    });
    if (!pending && !flagHas("first_seen")) pending = { first: true };
    setDot();

    /* 开关 */
    document.getElementById("cs-fab").onclick = function () {
      var p = document.getElementById("cs-panel");
      p.style.display = "flex";
      this.style.display = "none";
      /* 打开时定位到最新一条消息 */
      var csb = document.getElementById("cs-body");
      if (csb) csb.scrollTop = csb.scrollHeight;
      var msg = pending;
      pending = null;
      setDot();
      var first = !flagHas("first_seen");
      if (first) flagSet("first_seen");
      if (first) {
        botSay(D.welcome || "讯务科自动应答已连接。").then(function () {
          addSys(D.sessionLine || "SESSION // 讯务科频道已建立");
        });
        if (msg && msg.text) {
          setTimeout(function () {
            addSys("您有 1 条未读讯息");
            botSay(msg.text);
          }, 900);
        }
      } else if (msg && msg.text) {
        addSys("您有 1 条未读讯息");
        flagSet(msg.flag || "");
        botSay(msg.text);
      }
      if (mgChipPending) { /* 检查点后的 chips 更新：重开窗口才生效 */
        rebuildChips();
        mgChipPending = false;
      }
      setTimeout(function () { document.getElementById("cs-inp").focus(); }, 500);
    };
    document.getElementById("cs-min").onclick = function () {
      var p = document.getElementById("cs-panel");
      p.classList.add("closing");
      setTimeout(function () {
        p.style.display = "none";
        p.classList.remove("closing");
        document.getElementById("cs-fab").style.display = "flex";
      }, 280);
    };
    document.getElementById("cs-send").onclick = function () { send(); };
    document.getElementById("cs-inp").addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        var p = document.getElementById("cs-panel");
        if (p && p.style.display === "flex") {
          p.classList.add("closing");
          setTimeout(function () {
            p.style.display = "none";
            p.classList.remove("closing");
            document.getElementById("cs-fab").style.display = "flex";
          }, 280);
        }
      }
    });
  }

  /* ---- 消息渲染 ---- */
  function stamp() {
    var t = new Date();
    return String(t.getHours()).padStart(2, "0") + ":" + String(t.getMinutes()).padStart(2, "0");
  }
  function fmtText(s) { /* [X|Y] 注音渲染：英文小字在上、中文在下（同 OC 档案注音样式） */
    return esc(s).replace(/\[([^\]|]+)\|([^\]]+)\]/g, '<span class="cs-rb"><small>$2</small>$1</span>').replace(/\n/g, "<br>");
  }
  function appendMsgEl(body, text, who, red, t) {
    var d = document.createElement("div");
    d.className = "cs-msg " + who + (red ? " red" : "");
    d.innerHTML = fmtText(text) + '<span class="cs-stamp">' + (t || stamp()) + '</span>';
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
  }
  function addMsg(text, who, red) {
    var body = document.getElementById("cs-body");
    if (!body) return;
    var t = stamp();
    appendMsgEl(body, text, who, red, t);
    chat.push({ text: text, who: who, red: !!red, t: t });
    saveChat();
  }
  function addSys(t) {
    var body = document.getElementById("cs-body");
    if (!body) return;
    var d = document.createElement("div");
    d.className = "cs-sysline";
    d.textContent = t;
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
  }
  async function showTyping(ms) {
    var body = document.getElementById("cs-body");
    var tp = document.createElement("div");
    tp.className = "cs-typing on";
    var lab = (magicMode && MG && MG.typingLabelMagic) ? MG.typingLabelMagic : (D.typingLabel || "正在输入");
    tp.innerHTML = '<span class="t-lab">' + esc(lab) + '</span><i></i><i></i><i></i>';
    body.appendChild(tp);
    body.scrollTop = body.scrollHeight;
    await sleep(ms);
    tp.remove();
  }

  /* ---- 回复（数组=逐条；typing=double 打字两轮；{name} 注入） ---- */
  async function botSay(parts, opt) {
    busy = true;
    var arr = Array.isArray(parts) ? parts.slice() : [parts];
    var qname = lsGet("cm_quiz_name") || "";
    /* 姓名注入：{name} 行，没名字整行删掉 */
    arr = arr.filter(function (p) {
      var s = String(p == null ? "" : p);
      if (s.indexOf("{name}") > -1 && !qname) return false;
      return true;
    }).map(function (p) { return String(p).replace(/\{name\}/g, qname); });
    for (var i = 0; i < arr.length; i++) {
      var p = arr[i];
      if (opt && opt.double && i === 1) { /* typing → 消失 → 再 typing → 发送 */
        await showTyping(900);
        await sleep(700);
        await showTyping(900);
      } else {
        await showTyping(600 + Math.min(p.length * 10, 1200));
      }
      addMsg(p, "bot", opt && opt.red);
      if (i < arr.length - 1) await sleep(340);
    }
    busy = false;
  }

  /* ---- 转人工（问卷完成后触发）：直接进入魔术师，不再先播自动客服的话 ---- */
  async function doTransform() {
    magicMode = true;
    flagSet("magic_mode");
    var p = document.getElementById("cs-panel");
    addSys(MG.sysline || "■■■■加密频道已建立");
    await botSay(MG.first || "你好，客服00001很不高兴为您服务。");
    if (p) {
      p.classList.add("cs-glitch");
      await sleep(650);
      p.classList.remove("cs-glitch");
    }
    swapHeader(MG.who, MG.fabTip);
    mgCp = mgCpNow();
    rebuildChips();
  }

  /* ---- 魔术师：跑马灯按检查点同步（eternaldeath 在检查点1出现、检查点2消失） ---- */
  function syncTicker() {
    if (!MG) return;
    var tk = document.getElementById("ticker-track");
    if (!tk) return;
    var cp = mgCpNow();
    var items = [];
    tk.querySelectorAll("span").forEach(function (s) {
      var t = s.textContent;
      var managed = (MG.tickerAdd || []).some(function (x) { return x.t === t; });
      if (!managed && items.indexOf(t) < 0) items.push(t);
    });
    var want = (MG.tickerAdd || [])
      .filter(function (x) { return cp >= (x.at || 1) && cp < (x.delAt || 999); })
      .map(function (x) { return x.t; });
    var html = items.concat(want).concat(items.concat(want)).map(function (t) {
      var man = (MG.tickerAdd || []).filter(function (x) { return x.t === t; })[0];
      return man
        ? '<span style="color:var(--red,#c85a4a);opacity:.9;text-shadow:0 0 6px rgba(200,90,74,.5)">' + esc(t) + '</span>'
        : '<span>' + esc(t) + '</span>';
    }).join("");
    if (tk.innerHTML !== html) tk.innerHTML = html;
  }

  /* ---- 当前检查点的提示组（hints[0]=检查点1，hints[1]=检查点2 …） ---- */
  function mgHintSet() {
    if (MG && MG.hints && MG.hints.length) {
      return MG.hints[Math.max(0, Math.min(mgCp - 1, MG.hints.length - 1))] || [];
    }
    return (MG && MG.hintLines) ? MG.hintLines : ["……"];
  }

  /* ---- 收拢面板（遮挡恢复时） ---- */
  function closePanel() {
    var p = document.getElementById("cs-panel");
    var fab = document.getElementById("cs-fab");
    if (!p || !fab || p.style.display !== "flex") return;
    p.classList.add("closing");
    setTimeout(function () {
      p.style.display = "none";
      p.classList.remove("closing");
      fab.style.display = "flex";
    }, 260);
  }

  /* ---- 统一不耐烦守卫：任何关键词问题（现在/将来加的）都走这里 ----
     key = 规则正则 或 chip名+_chip 或固定名（如 zone_link）
     返回 "ok"=正常回复 / "warn"=触发不耐烦（≥2次）/ "silent"=已警告后该问题静默 */
  function mgGuard(key) {
    if (mgWarned && mgTriggered[key]) return "silent";
    mgTriggered[key] = true;
    mgCount[key] = (mgCount[key] || 0) + 1;
    mgSaveState();
    if (mgCount[key] >= 2) {  /* 反复问 ≥2 次 → 不耐烦 */
      mgWarned = true;
      mgSaveState();
      return "warn";
    }
    return "ok";
  }
  function mgWarnReply() {
    return MG.repeat || ["我不是人工智能，只会给你发一遍。"];
  }

  /* ---- 分区索引跳转：一律从 home 进入，backTo=home，无法借此抵达员工终端（防逃课） ---- */
  function openZoneIndex() {
    var inHome = (typeof show === "function") && document.getElementById("view-zones");
    if (inHome) { show("zones", "home"); return; }
    try { sessionStorage.setItem("cm-goto", "zones"); } catch (e) {}
    if (typeof spherse !== "undefined" && spherse.openFile) spherse.openFile("project/Cybermorgue-档案主页.html");
    else location.href = "Cybermorgue-档案主页.html#zones";
  }
  function addLink(label) {
    var body = document.getElementById("cs-body");
    if (!body) return;
    var b = document.createElement("button");
    b.className = "cs-link";
    b.textContent = label || "◈ 打开分区索引 ◈";
    b.onclick = function () { openZoneIndex(); };
    body.appendChild(b);
    body.scrollTop = body.scrollHeight;
  }

  /* ---- 提示回复：第1次全发，第2次末条，第3次不耐烦（之后静默） ---- */
  async function mgHintReply() {
    var hkey = "hint_chip";
    if (mgWarned && mgTriggered[hkey]) return;
    mgTriggered[hkey] = true;
    mgHintStep++;
    var hset = mgHintSet();
    if (mgHintStep === 1) {
      if (hset.length) await botSay(hset);
    } else if (mgHintStep === 2) {
      if (hset.length) await botSay(hset[hset.length - 1]);
    } else {
      mgWarned = true;
      mgSaveState();
      await botSay(MG.repeat || ["之前说过了，我不是自动回复程序，不会重复同一句话", "而且我是真的很忙", "如果之后我不回你，你可以反思一下自己的问题"]);
    }
    mgSaveState();
  }

  /* ---- 对话流 ---- */
  async function send(raw) {
    if (busy) return;
    var inp = document.getElementById("cs-inp");
    var text = (raw !== undefined ? raw : inp.value).trim();
    if (!text) return;
    inp.value = "";
    addMsg(text, "me");

    /* 检查点刷新检测（未知词沉默/提示步进重置） */
    var cpNow = mgCpNow();
    if (cpNow !== mgCp) { mgCp = cpNow; mgResetForCp(); }

    /* 转人工入口（仅问卷完成后，且未变身）：关键词正则触发 */
    if (!magicMode && MG && flagHas(MG.unlockFlag || "quiz_done") && MG.unlockKey &&
        new RegExp(MG.unlockKey, "i").test(text)) {
      await sleep(260);
      doTransform();
      return;
    }

    await sleep(220);

    if (magicMode && MG) {
      /* —— 魔术师模式 —— */
      /* 已是人工应答，再说触发词 → already（同样走不耐烦守卫） */
      if (MG.unlockKey && new RegExp(MG.unlockKey, "i").test(text)) {
        var ga = mgGuard("alrdy_key");
        if (ga === "silent") return;
        if (ga === "warn") { await botSay(mgWarnReply()); return; }
        await botSay(MG.already || "你已经转完人工了。这个席位现在是本人在看。");
        return;
      }

      var mhit = null;
      for (var i = 0; i < MG.rules.length; i++) {
        if (new RegExp(MG.rules[i].re, "i").test(text)) { mhit = MG.rules[i]; break; }
      }
      var chipHit = null;
      for (var ci = 0; ci < (MG.chips || []).length; ci++) {
        if (MG.chips[ci].t && text.indexOf(MG.chips[ci].t) > -1) { chipHit = MG.chips[ci]; break; }
      }
      if (mhit || chipHit) {
        var key = mhit ? mhit.re : (chipHit.t + "_chip");
        var g = mgGuard(key);
        if (g === "silent") return;                 /* 已警告后该问题静默 */
        if (g === "warn") { await botSay(mgWarnReply()); return; }  /* ≥2 次 → 不耐烦 */
        var opt = {};
        if (mhit && mhit.typing === "double") opt.double = true;
        var rep = mhit ? mhit.reply : chipHit.reply;
        await botSay(rep, opt);
        /* 检查点：密码规则 → 写旗标 + ticker + 换 chips */
        if (mhit && mhit.cp) {
          flagSet(mhit.cp);
          mgCp = mgCpNow();
          mgResetForCp();
          syncTicker();
        }
        return;
      }
      /* 分区名关键词：甩链接到分区索引（同样走不耐烦守卫） */
      if (zoneRe && zoneRe.test(text)) {
        var gz = mgGuard("zone_link");
        if (gz === "silent") return;
        if (gz === "warn") { await botSay(mgWarnReply()); return; }
        await botSay(MG.zoneLink.reply || ["我不是ai。介绍都在这，你自己看。"]);
        addLink(MG.zoneLink.linkLabel);
        return;
      }
      /* 提示（输入"提示"也触发同一状态机） */
      if (text.indexOf(MG.hintChip || "提示") > -1) {
        await mgHintReply();
        return;
      }
      /* 未知词：超限后仅不再回复无关键词内容（关键词/规则照常） */
      if (mgSilent) return;
      mgUnknown++;
      mgSaveState();
      if (mgUnknown > (MG.unknownLimit || 10)) {
        mgSilent = true;
        mgSaveState();
        await botSay(MG.unknownStop || ["我记得我们最开始的目的不是闲聊", "专心干你的事情去吧"]);
        return;
      }
      var unk = MG.unknown || ["？"];
      var ui = Math.floor(Math.random() * unk.length);
      while (unk.length > 1 && ui === lastUnk) ui = Math.floor(Math.random() * unk.length);
      lastUnk = ui;
      await botSay(unk[ui]);
      return;
    }

    /* —— 自动应答模式 —— */
    var hit = null;
    for (var j = 0; j < rules.length; j++) {
      if (rules[j].re.test(text)) { hit = rules[j]; break; }
    }
    if (hit) {
      var need = hit.req || [];
      var ok = true;
      for (var k = 0; k < need.length; k++) if (!flagHas(need[k])) { ok = false; break; }
      if (!ok) {
        botSay(hit.denied || D.deniedGeneric || "该条目需要先达成前置条件。", true);
        return;
      }
      (hit.set || []).forEach(flagSet);
      botSay(hit.reply, { red: !!hit.red });
      return;
    }
    for (var cj = 0; cj < chips.length; cj++) {
      if (chips[cj].t && text.indexOf(chips[cj].t) > -1) {
        botSay(chips[cj].reply || "……");
        return;
      }
    }
    botSay(fallback[fi++ % fallback.length].replace("{n}", 1000 + (Math.random() * 9000 | 0)));
  }
  async function sendChip(c) {
    if (busy) return;
    addMsg(c.t, "me");
    await sleep(220);
    if (magicMode && MG) {
      if (c.hint) { /* 提示 */
        await mgHintReply();
        return;
      }
      var gc = mgGuard(c.t + "_chip");
      if (gc === "silent") return;
      if (gc === "warn") { await botSay(mgWarnReply()); return; }
      await botSay(c.reply || "……");
      return;
    }
    await botSay(c.reply || "……");
  }

  /* ---- 启动 ---- */
  fetch(BASE + "support.data.json")
    .then(function (r) { return r.json(); })
    .then(function (d) {
      D = d;
      MG = d.magician || null;
      mgLoadState();
      if (MG && MG.zoneLink && MG.zoneLink.names && MG.zoneLink.names.length) {
        try { zoneRe = new RegExp(MG.zoneLink.names.join("|"), "i"); } catch (e) { zoneRe = null; }
      }
      rules = (d.rules || []).map(function (r) {
        return { re: new RegExp(r.re, "i"), reply: r.reply, red: r.red, req: r.req, set: r.set, denied: r.denied };
      });
      fallback = d.fallback || [];
      chips = d.chips || [];
      buildUI();
      var w = document.getElementById("cs-widget");
      wasHidden = isHiddenZone();
      if (w) setInterval(function () {
        var hz = isHiddenZone();
        if (hz && !wasHidden) { /* 诊断：新增隐藏时打原因 */
          var why = [];
          if (document.getElementById("boot")) why.push("boot");
          var vf = document.getElementById("view-form");
          if (vf && vf.style.display === "block") why.push("view-form");
          if (document.querySelector(".idle-mask")) why.push("idle-mask");
          var pops = document.querySelectorAll(".syspop, .whisper-pop.show");
          for (var i = 0; i < pops.length; i++) if (elVisible(pops[i])) why.push(pops[i].className + "@" + pops[i].parentElement.id);
          var ov = document.getElementById("overlay");
          if (ov && ov.classList.contains("show")) why.push("overlay");
          console.debug("[support] hide:", why.join(",") || "unknown");
        }
        w.classList.toggle("cm-hide", hz);
        if (wasHidden && !hz) closePanel();   /* 从遮挡(问卷/弹窗)恢复 → 面板收拢，需重新点开 */
        wasHidden = hz;
        /* 轮询：检查点变化 → 重置 + 追加 ticker */
        if (magicMode && MG) {
          var c2 = mgCpNow();
          if (c2 !== mgCp) { mgCp = c2; mgResetForCp(); }
          syncTicker();
        }
      }, 500);
    })
    .catch(function (e) { console.warn("[support] data load failed:", e); });
})();
