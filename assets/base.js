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
  var sel = window.CURSOR_SEL || ".gate,.mi,.cal-nav,.gnext,.tbtns button,.todo,.todo-add button,.logout,.step-next,.step-back,.zone-link,.chip,.more,.entry,.path,.logo,nav a,.back,.back2,.card,.thread,.rec,.rec-head,.sysdlg,.attach,.mailbtn,.recipe,.video,.mbtn,.mailcard,.music-ui,.fchip,.dict-link,.dept,.rule-head,.ow,.ow-item,.key,.np-trackbar,.volwheel,.spoiler,.expand,.anom-t,.trig-btn,.conf-err a,.sp-btn,.red-t,.fv-btn,.fvideo,.mz,.zone,.step-ind,.witem,.mnav button,.arc-item,.mailbox .mitem";

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
      locked = t; w.classList.add("locked");
      var r = t.getBoundingClientRect();
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
