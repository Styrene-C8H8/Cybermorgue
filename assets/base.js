/* ============================================================
   CYBERMORGUE 共享基底 · base.js（全局公共脚本）
   - 瞄准光标（四角锁定 + 点击公转动画）
   引用方式：
     OC 页：<script src="../assets/base.js"></script>
     根目录页：<script src="assets/base.js"></script>
   说明：
   - 立即设置 window.__CM_CURSOR__ = true，各页旧光标脚本看到该标记
     后自动跳过（各页 IIFE 顶部已加守卫），不会出现双光标。
   - 光标挂载到 <html>（documentElement），页面 body 抖动动画不影响它。
   - 触屏 / 减弱动效自动关闭。
   - 以后改光标只需改这一个文件，全站生效。
   ============================================================ */
window.__CM_CURSOR__ = true;
(function () {
  if (document.getElementById("cc-rt")) return; /* 防重复注入 */
  if (!window.matchMedia || matchMedia("(hover: none)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  /* 站点所有可交互元素（超集选择器：新增界面元素请加到这里） */
  var sel = window.CURSOR_SEL || ".gate,.mi,.cal-nav,.gnext,.tbtns button,.todo,.todo-add button,.logout,.step-next,.step-back,.zone-link,.chip,.more,.entry,.path,.logo,nav a,.back,.back2,.card,.thread,.rec,.rec-head,.sysdlg,.attach,.mailbtn,.recipe,.video,.mbtn,.mailcard,.music-ui,.fchip,.dict-link,.dept,.rule-head,.ow,.ow-item,.key,.np-trackbar,.volwheel,.spoiler,.expand,.anom-t,.trig-btn,.conf-err a,.sp-btn,.red-t,.fv-btn,.fvideo,.mz,.zone,.step-ind,.witem,.mnav button,.arc-item,.mailbox .mitem,.cs-fab,.cs-min,.cs-send,.cs-chips button,.hdr-reset,.cs-link,.gexit";

  function boot() {
    var w = document.createElement("div"); w.id = "cc-rt"; w.className = "cc";
    w.innerHTML = '<i class="cc-dot"></i><i class="cc-c cc-tl"></i><i class="cc-c cc-tr"></i><i class="cc-c cc-br"></i><i class="cc-c cc-bl"></i>';
    document.documentElement.appendChild(w);
    var dot = w.querySelector(".cc-dot"), cs = Array.from(w.querySelectorAll(".cc-c"));
    var free = [[-15,-15],[6,-15],[6,6],[-15,6]];
    var mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my, locked = null, clickT = -1;
    document.body.classList.add("has-cc");
    function frame() {
      cx += (mx - cx) * .2; cy += (my - cy) * .2;
      dot.style.left = cx + "px"; dot.style.top = cy + "px";
      if (clickT >= 0) {
        var p = (performance.now() - clickT) / 380;
        if (p >= 1) {
          clickT = -1;
          cs.forEach(function (c) { c.style.transition = ""; });
        } else {
          var ang = p * Math.PI * 2;
          var cos = Math.cos(ang), sin = Math.sin(ang);
          var cr = locked ? locked.getBoundingClientRect() : null;
          /* 轨道圆心 = 四角的视觉中心（准星自身中心），绕它转才不偏心 */
          var cxs, cys;
          if (cr) { cxs = (cr.left + cr.right) / 2; cys = (cr.top + cr.bottom) / 2; }
          else { cxs = cx - 4.5; cys = cy - 4.5; }
          cs.forEach(function (c, i) {
            var ox, oy;
            if (cr) {
              var cps = [[cr.left - 1, cr.top - 1], [cr.right - 7, cr.top - 1], [cr.right - 7, cr.bottom - 7], [cr.left - 1, cr.bottom - 7]];
              ox = cps[i][0] - cxs; oy = cps[i][1] - cys;
            } else { ox = free[i][0] + 4.5; oy = free[i][1] + 4.5; }
            c.style.left = (cxs + ox * cos - oy * sin) + "px";
            c.style.top = (cys + ox * sin + oy * cos) + "px";
          });
        }
      }
      if (clickT < 0 && !locked) { cs.forEach(function (c, i) { c.style.left = (cx + free[i][0]) + "px"; c.style.top = (cy + free[i][1]) + "px"; }); }
      requestAnimationFrame(frame);
    }
    function lock(t) {
      if (t === locked) return;
      var r = t.getBoundingClientRect();
      /* 目标比视口还高/还宽（如可滚动容器内的长帖）→ 不锁定，避免准星四角飞到屏幕外 */
      if (r.height > innerHeight - 10 || r.width > innerWidth - 10) {
        if (locked) { locked = null; w.classList.remove("locked"); }
        return;
      }
      locked = t; w.classList.add("locked");
      var p = [[r.left - 1, r.top - 1], [r.right - 7, r.top - 1], [r.right - 7, r.bottom - 7], [r.left - 1, r.bottom - 7]];
      cs.forEach(function (c, i) { c.style.left = p[i][0] + "px"; c.style.top = p[i][1] + "px"; });
    }
    function unlock(t) { if (t && t === locked) { locked = null; w.classList.remove("locked"); } }
    addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; });
    addEventListener("mousedown", function () { w.classList.add("cc-press"); w.classList.add("cc-click"); clickT = performance.now(); cs.forEach(function (c) { c.style.transition = "none"; }); });
    addEventListener("mouseup", function () { w.classList.remove("cc-press"); setTimeout(function () { w.classList.remove("cc-click"); }, 380); });
    document.addEventListener("mouseover", function (e) { var t = e.target.closest(sel); if (t) lock(t); });
    document.addEventListener("mouseout", function (e) { var t = e.target.closest(sel); unlock(t); });
    requestAnimationFrame(frame);
  }
  if (document.body) boot(); else document.addEventListener("DOMContentLoaded", boot);
})();

/* ============================================================
   CYBERMORGUE 全局音效（base.js 内置，全站生效）
   - 按钮点击：button1.ogg（所有可点元素）
   - 主界面音乐：thesentinal.mp3（循环，音量 15%，跨页续播）
   - 开场：startup.mp3（主页 boot 加载动画期间播放）
   音频文件位于 assets/sounds/
   ============================================================ */
(function () {
  if (window.__CM_SFX__) return;
  window.__CM_SFX__ = true;
  var BASE = "";
  try { BASE = new URL(".", document.currentScript.src).href; } catch (e) { BASE = "assets/"; }
  var SOUNDS = BASE + "sounds/";
  var MUSIC_VOL = 0.20;       /* 主音乐音量 15% */
  var MUSIC_KEY = "cm_music_t"; /* 跨页续播：记录播放位置 */
  var click = null, music = null, startup = null, hover = null;
  var musicStarted = false, lastHover = null, hoverTimer = null, ac = null;
  function canPlay(m) { try { var a = new Audio(); var c = a.canPlayType(m); return c === "probably" || c === "maybe"; } catch (e) { return true; } }
  function ensureCtx() { try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); return ac; } catch (e) { return null; } }
  /* Web Audio 合成 blip：ogg/mp3 都放不出来时的兜底（iOS 也能响） */
  function synthBlip() {
    try {
      var c = ensureCtx(); if (!c) return;
      if (c.state === "suspended") c.resume();
      var o = c.createOscillator(), g = c.createGain();
      o.type = "square"; o.frequency.value = 1150;
      g.gain.setValueAtTime(0.05, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.09);
      o.connect(g); g.connect(c.destination);
      o.start(); o.stop(c.currentTime + 0.1);
    } catch (e) {}
  }
  /* 点击音：真音频失败/缺失 → 合成兜底 */
  function clickFX() {
    if (click) {
      try {
        click.currentTime = 0;
        var p = click.play();
        if (p && p.catch) p.catch(function () { synthBlip(); });
        return;
      } catch (e2) {}
    }
    synthBlip();
  }

  function mk(path, loop, vol) {
    try {
      var a = new Audio(SOUNDS + path);
      a.loop = !!loop;
      a.volume = vol == null ? 1 : vol;
      a.preload = "auto";
      return a;
    } catch (e) { return null; }
  }
  function playSafe(a) {
    if (!a) return;
    try { var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
  }
  function stopSafe(a) {
    if (!a) return;
    try { a.pause(); a.currentTime = 0; } catch (e) {}
  }
  /* 主音乐：恢复上次播放位置 + 淡入（跨页切换听起来像没断） */
  function startMusic() {
    if (musicStarted || !music) return;
    musicStarted = true;
    try {
      var saved = parseFloat(sessionStorage.getItem(MUSIC_KEY) || "0");
      if (saved > 0 && music.duration && isFinite(music.duration)) music.currentTime = saved % music.duration;
      else if (saved > 0) music.currentTime = saved;
    } catch (e) {}
    music.volume = 0;
    playSafe(music);
    var t0 = Date.now(), dur = 1800;
    (function fade() {
      var p = Math.min((Date.now() - t0) / dur, 1);
      music.volume = MUSIC_VOL * p;
      if (p < 1) setTimeout(fade, 60);
    })();
  }
  function startStartup() { if (startup) { try { startup.currentTime = 0; playSafe(startup); } catch (e) {} } }
  /* startup 淡出后再停（避免戛然而止）；fade=false 时立即停 */
  function stopStartup(fade) {
    if (!startup) return;
    if (fade === false) { stopSafe(startup); return; }
    try {
      var v0 = startup.volume || 1, t0 = Date.now(), dur = 550;
      (function f() {
        var p = Math.min((Date.now() - t0) / dur, 1);
        startup.volume = v0 * (1 - p);
        if (p < 1) setTimeout(f, 40);
        else stopSafe(startup);
      })();
    } catch (e) { stopSafe(startup); }
  }

  /* 按钮音：捕获阶段委托，命中任何可点元素即播 */
  var CLICK_SEL = "#boot,button,a,[onclick],.opt,.aopt,.gate,.mi,.chip,.post,.todo,.pg,.cal-nav,.step-ind," +
    ".f-btn,.gnext,.backbtn,.sp-btn,.bigbtn,.nbtn,.mbtn,.more,.entry,.path,.card,.thread,.rec,.rec-head," +
    ".expand,.sysdlg,.attach,.mailbtn,.recipe,.video,.music-ui,.fchip,.dict-link,.dept,.rule-head,.ow,.ow-item," +
    ".key,.np-trackbar,.spoiler,.anom-t,.trig-btn,.red-t,.fv-btn,.fvideo,.mz,.zone,.witem,.arc-item," +
    ".mailbox .mitem,.cs-fab,.cs-min,.cs-send,.cs-chips button,.cs-link,.hdr-reset,.gexit,.tb-back,.locked";
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest(CLICK_SEL)) clickFX();
  }, true);

  /* 悬浮音：悬浮到可点元素时播放（只放前 3 秒；离开即停；再悬浮从头播） */
  if (window.matchMedia && !matchMedia("(hover: none)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.addEventListener("mouseover", function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var hit = t.closest(CLICK_SEL);
      if (!hit || hit === lastHover || !hover) return;
      lastHover = hit;
      try { hover.currentTime = 0; playSafe(hover); } catch (e2) {}
      if (hoverTimer) clearTimeout(hoverTimer);
      hoverTimer = setTimeout(function () { if (hover) hover.pause(); }, 3000);
    }, true);
    document.addEventListener("mouseout", function (e) {
      var t = e.target, rt = e.relatedTarget;
      if (!t || !t.closest) return;
      var hit = t.closest(CLICK_SEL);
      if (hit && hit === lastHover && !(rt && hit.contains(rt))) {
        lastHover = null;
        if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
        if (hover) hover.pause();
      }
    }, true);
  }

  function init() {
    /* 格式选择：浏览器支持 ogg 用 ogg（桌面 Chrome/Firefox）；不支持（iOS Safari）
       用 mp3——若 button1.mp3 不存在，play 会失败 → clickFX 自动走 Web Audio 合成兜底 */
    if (canPlay("audio/ogg")) click = mk("button1.ogg", false, 1);
    else if (canPlay("audio/mpeg")) click = mk("button1.mp3", false, 1);
    else click = null;
    hover = mk("musicholder-hover-button-287656.mp3", false, 0.30);
    music = mk("thesentinal.mp3", true, MUSIC_VOL);
    startup = mk("startup.mp3", false, 1);
    var boot = document.getElementById("boot");
    if (boot) {
      startStartup();   /* 加载动画期间播 startup */
      var done = false;
      function check() {
        if (done) return;
        if (!document.getElementById("boot")) {
          done = true;
          stopStartup(false);   /* 硬切：按键音在同刻播放，不淡出 */
          startMusic();
        }
      }
      try {
        var mo = new MutationObserver(check);
        mo.observe(document.body, { childList: true, subtree: true });
      } catch (e) {}
      setTimeout(check, 2500);
    } else {
      startMusic();
    }
    /* 定期记录播放位置（跨页续播用） */
    setInterval(function () {
      if (music && !music.paused && isFinite(music.currentTime)) {
        try { sessionStorage.setItem(MUSIC_KEY, String(music.currentTime)); } catch (e) {}
      }
    }, 4000);
    window.__CM_SFX_API__ = {
      playClick: clickFX,
      startMusic: startMusic,
      startStartup: startStartup,
      stopStartup: stopStartup
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
