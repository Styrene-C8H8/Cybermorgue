/* ============================================================
   CYBERMORGUE OC 档案 · 公共模板 JS（oc-base.js）
   标准档案页（FILE VIEWER）的公共函数。
   引用方式（放在页面脚本之前，head 里）：
     OC 页：<script src="../assets/oc-base.js"></script>
   说明：
   - 页面脚本在本文件之后运行；需要定制 sp/paras/render 的页面
     （如 Nyxstr 异象、Hax 金斜体、Marcus 双版本）在自身脚本里
     重定义同名函数即可，后定义者胜出。
   - SELF_IDS / DATA 由各页面脚本声明，调用时已存在。
   - 以后改档案模板渲染逻辑只需改本文件。
   ============================================================ */

function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
/* 标准文本渲染：## 标红 / // 斜体 / ++ 黑条（特殊页可重定义） */
function sp(t){return esc(t)
  .replace(/##([\s\S]+?)##/g,'<span class="rednote">$1</span>')
  .replace(/\/\/([\s\S]+?)\/\//g,'<i>$1</i>')
  .replace(/\+\+([\s\S]+?)\+\+/g,'<span class="spoiler" tabindex="0">$1</span>');}
function paras(t){return String(t||"").split(/\n{2,}/)
  .map(function(p){return "<p>"+sp(p.replace(/\n/g,"<br>"))+"</p>";}).join("");}

var CLMAP={yellow:"cl-yellow",white:"cl-white",red:"cl-red",black:"cl-black",rainbow:"cl-rainbow"};
var DOTMAP={yellow:"cl-dot-y",white:"cl-dot-w",red:"cl-dot-r",black:"cl-dot-b",rainbow:"cl-dot-rainbow"};
/* 员工状态（data.json 加 "status": "quit/unknown/garbled" 即可，默认在职） */
var STATUS={active:{label:"在职",cls:"st st-active"},quit:{label:"离职",cls:"st st-quit"},unknown:{label:"未记录",cls:"st st-unknown"},garbled:{label:"▓▓▓▓",cls:"st st-garbled"}};
function lvTag(tag){
  if(!tag)return "";
  var cls="lvtag";
  if(tag==="管理员"||tag==="官方")cls+=" op";
  else if(!/^lv\d+$/.test(tag))cls+=" custom";
  return '<span class="'+cls+'">'+esc(tag)+'</span>';
}

/* ===== 渲染部件（标准档案） ===== */
function fheadHtml(d){
  var sm=STATUS[d.status]||STATUS.active;
  var mood=(d.status==="quit"?" is-quit":d.status==="garbled"?" is-garbled":d.status==="unknown"?" is-unknown":"");
  var tags=(d.tags?[d.tags.gender,d.tags.zone,d.tags.department]:[]).filter(Boolean);
  if(d.faction)tags.push(d.faction);
  return '<div class="fhead'+mood+'">'+
     '<div class="fmeta">'+
       '<span>FILE NO : <b>'+esc(d.fileNo)+'</b></span>'+
       '<span>CLEARANCE : <i class="cldot '+(DOTMAP[d.clearance]||DOTMAP.yellow)+'"></i><b>'+esc(d.level)+'</b></span>'+
       '<span>ARCHIVED : <b>'+esc(d.date||"＿＿＿＿")+'</b></span>'+
     '</div>'+
     '<h1 id="bigname">'+esc(d.name)+'</h1>'+
     '<div class="alias">AKA · '+esc(d.alias)+'</div>'+
     '<div class="ftags">'+tags.map(function(t){return '<span class="ftag">'+esc(t)+'</span>';}).join("")+
       '<span class="'+sm.cls+'">'+sm.label+'</span>'+
     '</div>'+
   '</div>';
}
function barcodeHtml(){
  var out="";
  for(var i=0;i<42;i++){
    var w=Math.random()<.3?2:(Math.random()<.5?2:1);
    var h=12+Math.random()*8;
    if(Math.random()<.12)out+='<i style="width:'+w+'px;height:'+h+'px;background:transparent"></i>';
    else out+='<i style="width:'+w+'px;height:'+h+'px"></i>';
  }
  return out;
}
function badgeHtml(d){
  return '<div class="idcard-wrap"><div class="idcard">'+
     '<div class="hole"></div>'+
     '<div class="ic-head"><span>CYBERMORGUE</span><span>STAFF ID CARD</span></div>'+
     '<div class="ic-body">'+
       '<div class="ic-left">'+
       '<div class="ic-photo">'+(d.portrait?'<img src="'+esc(d.portrait)+'" alt="">':'IMAGE<br>PENDING')+'</div>'+
       '<div class="barcode">'+barcodeHtml()+'</div>'+
       '<div class="bcno">'+esc(d.fileNo)+'</div>'+
       '</div>'+
       '<div class="ic-info">'+
         d.badge.map(function(r){return '<div class="ic-row"><span class="k">'+esc(r.k)+'</span><span class="v">'+sp(r.v)+'</span></div>';}).join("")+
       '</div>'+
     '</div>'+
   '</div></div>';
}
function postHtml(p,isMain){
  if(p.expand)return '<div class="expand" style="--d:'+(p.depth||0)+'">'+esc(p.content)+' ▾</div>';
  if(p.system)return '<div class="sysdel">'+esc(p.content)+'</div>';
  var isMe=!isMain&&(typeof SELF_IDS!=="undefined"&&SELF_IDS.indexOf(p.author)>-1);
  return '<div class="post" style="--d:'+(p.depth||0)+'"'+(p.depth?' data-d="'+p.depth+'"':"")+'>'+
    '<div class="p-head2">'+
      '<span class="uname">'+esc(p.author)+'</span>'+
      lvTag(p.tag)+
      (isMe?'<span class="me-flag">◆ 本档案关联者</span>':"")+
      '<span class="pmeta"><span class="ipx">IP:'+esc(p.ip||"--")+'</span><span>'+esc(p.time||"")+'</span></span>'+
    '</div>'+
    '<div class="p-body2">'+paras(p.content)+'</div>'+
  '</div>';
}
function threadHtml(f){
  return '<div class="thread">'+
    '<div class="t-head"><span class="t-board">亡语之声 · '+esc(f.board)+'</span>'+
    '<div class="t-title">'+esc(f.title)+'</div></div>'+
    postHtml(f.main,true)+
    f.replies.map(function(p){return postHtml(p,false);}).join("")+
  '</div>';
}
/* 正文 sections（items + forums → 面板）；特殊页可重定义 */
function sectionsHtml(d){
  return d.sections.map(function(s,idx){
    var items=(s.items||[]).filter(function(i){return i.text;}).map(function(i){
      return '<div class="item">'+(i.label?'<div class="ilabel">'+esc(i.label)+'</div>':"")+
        '<div class="itext">'+paras(i.text)+'</div></div>';
    }).join("");
    var forums=(s.forum||[]).map(threadHtml).join("");
    if(!items&&!forums)return "";
    return '<section class="panel"><div class="p-head">'+
      '<span>'+esc(s.title).replace(/^[一二三四五六七八九十]+、?/,"")+'</span>'+
      '<small>SEC.'+String(idx+1).padStart(2,"0")+' // ENCRYPTED-OK</small>'+
      '</div><div class="p-body">'+items+forums+'</div></section>';
  }).join("");
}
function galleryHtml(d){
  return (d.gallery||[]).length?
    '<section class="panel"><div class="p-head"><span>视觉记录</span><small>VISUAL LOG</small></div>'+
    '<div class="p-body"><div class="gallery">'+d.gallery.map(function(g){
      return '<div class="gitem"><img src="'+esc(g)+'" alt=""></div>';}).join("")+
    '</div></div></section>':"";
}

/* ===== 动画 ===== */
function decodeName(){
  var h=document.getElementById("bigname");
  if(!h)return;
  var txt=h.textContent,chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/\\<>_";
  h.textContent="";
  var spans=[];
  for(var i=0;i<txt.length;i++){
    var s=document.createElement("span");s.className="ch";
    s.style.transitionDelay=(i*40)+"ms";
    s.textContent=txt[i]===" "?"\u00A0":txt[i];
    h.appendChild(s);spans.push(s);
  }
  requestAnimationFrame(function(){requestAnimationFrame(function(){
    spans.forEach(function(s){s.style.opacity=1;s.style.transition="opacity .3s";});
  });});
  var iv=setInterval(function(){
    var prog=Math.floor(performance.now()/40)-2;
    var all=true;
    spans.forEach(function(s,i){
      if(i>=prog)return;
      if(Math.random()<.25&&s.dataset.locked!="1"){s.textContent=chars[Math.floor(Math.random()*chars.length)];all=false;}
      else{s.dataset.locked="1";s.textContent=txt[i];}
    });
    if(all&&prog>txt.length){clearInterval(iv);
      spans.forEach(function(s,i){s.textContent=txt[i];});}
  },50);
}
function revealPanels(){
  var els=document.querySelectorAll(".panel");
  if(!("IntersectionObserver" in window)){
    els.forEach(function(e){e.classList.add("in");});return;}
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}});
  },{threshold:.05});
  els.forEach(function(e){io.observe(e);});
}

/* ===== 导航 ===== */
function goBack(){
  if(typeof spherse!=="undefined"&&spherse.openFile)spherse.openFile("project/OC/索引.html");
  else location.href="索引.html";
}
