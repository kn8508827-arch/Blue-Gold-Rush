/* Cooler Bot floating mascot + in-Hub chat for the Cooler Hub.
 * - Small 3D head (transparent) that floats on the screen, draggable to any edge (left/right/top/bottom).
 * - The head always turns toward the middle of the screen (on the left → faces right, on the right → faces left).
 * - Sunglasses: scanning light, flicker, golden rays and twinkling stars ("charging" robot look).
 * - Moves close to a text box while the person types and speeds up its glow.
 * - Tap the face → a 3D glass chat window opens right inside the Hub (POST /hub/chat, same brain as Telegram).
 * Include with: <script src="cooler-mascot.js" defer></script>
 */
(function () {
  if (window.__coolerMascot) return;
  window.__coolerMascot = true;

  var SCRIPT = document.currentScript ? document.currentScript.src : location.href;
  var IMG = new URL("coolerbot-head.webp", SCRIPT).href;
  var API = (window.COOLER_API || "https://bot-smos-smea-production.up.railway.app").replace(/\/+$/, "");
  var S = 72, M = 10, KEY = "coolerMascotPos", HKEY = "coolerChatLog";

  var css = "" +
    /* face (shared by the floating button and the chat avatar) */
    ".cbf{position:absolute;inset:0;display:block}" +
    ".cbf .pv{position:absolute;inset:0;perspective:420px}" +
    ".cbf .turn{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .8s cubic-bezier(.45,0,.2,1)}" +
    ".flip .cbf .turn{transform:rotateY(180deg)}" +
    ".cbf .fl{position:absolute;inset:0;transform-style:preserve-3d;animation:cbmFloat 3.6s ease-in-out infinite}" +
    ".cbf .head{position:absolute;inset:0;animation:cbmSway 5s ease-in-out infinite}" +
    ".cbf img{width:100%;height:100%;display:block;-webkit-user-drag:none;user-select:none;pointer-events:none;" +
    "filter:drop-shadow(0 6px 8px rgba(0,0,0,.5)) drop-shadow(0 0 7px rgba(95,212,255,.5))}" +
    ".cbf .ln{position:absolute;overflow:hidden;border-radius:6% 6% 40% 40%;mix-blend-mode:screen}" +
    ".cbf .ln.l{left:25%;top:52%;width:25%;height:21%}" +
    ".cbf .ln.r{left:56.5%;top:54%;width:29.5%;height:21%}" +
    ".cbf .ln::before{content:'';position:absolute;inset:0;background:rgba(95,212,255,.25);animation:cbmFlicker 2.6s linear infinite}" +
    ".cbf .ln.r::before{animation-delay:-1.3s}" +
    ".cbf .ln::after{content:'';position:absolute;left:-10%;right:-10%;height:42%;top:-50%;" +
    "background:linear-gradient(180deg,rgba(95,212,255,0),rgba(95,212,255,.9) 42%,#fff 50%,rgba(95,212,255,.9) 58%,rgba(95,212,255,0));" +
    "animation:cbmScan 1.9s cubic-bezier(.45,0,.55,1) infinite alternate}" +
    ".cbf .ray{position:absolute;width:56%;height:56%;margin:-28% 0 0 -28%;border-radius:50%;pointer-events:none;mix-blend-mode:screen;" +
    "background:repeating-conic-gradient(from 0deg,rgba(255,220,120,.85) 0deg 3deg,rgba(255,220,120,0) 3deg 30deg);" +
    "-webkit-mask:radial-gradient(circle,#000 0 12%,rgba(0,0,0,.6) 30%,transparent 68%);mask:radial-gradient(circle,#000 0 12%,rgba(0,0,0,.6) 30%,transparent 68%);" +
    "animation:cbmRays 4s linear infinite,cbmPulse 1.6s ease-in-out infinite alternate}" +
    ".cbf .ray.a{left:36%;top:60%}" +
    ".cbf .ray.b{left:72%;top:58%;width:40%;height:40%;margin:-20% 0 0 -20%;animation-delay:-2s,-.8s;animation-direction:reverse,alternate}" +
    ".cbf .gl{position:absolute;width:22%;height:22%;margin:-11% 0 0 -11%;pointer-events:none;mix-blend-mode:screen;animation:cbmTwinkle 2.2s ease-in-out infinite}" +
    ".cbf .gl::before,.cbf .gl::after{content:'';position:absolute;left:50%;top:50%;width:100%;height:9%;margin:-4.5% 0 0 -50%;border-radius:50%;" +
    "background:radial-gradient(closest-side,#fff,rgba(255,240,180,.8) 40%,transparent)}" +
    ".cbf .gl::after{transform:rotate(90deg)}" +
    ".cbf .gl.a{left:33%;top:58%}" +
    ".cbf .gl.b{left:44%;top:66%;width:14%;height:14%;margin:-7% 0 0 -7%;animation-delay:-1.1s}" +
    ".cbf .gl.c{left:78%;top:57%;width:16%;height:16%;margin:-8% 0 0 -8%;animation-delay:-.5s}" +
    ".busy .cbf .ln::after{animation-duration:.5s}.busy .cbf .ln::before{animation-duration:.9s}.busy .cbf .ray{animation-duration:1.2s,.5s}" +
    /* floating button */
    ".cbm{position:fixed;left:0;top:0;width:" + S + "px;height:" + S + "px;padding:0;border:0;background:none;cursor:grab;z-index:40;" +
    "transition:transform .7s cubic-bezier(.22,1.25,.36,1),opacity .3s;will-change:transform;-webkit-tap-highlight-color:transparent;touch-action:none}" +
    ".cbm.drag{transition:none;cursor:grabbing}" +
    ".cbm.away{opacity:0;pointer-events:none}" +
    ".cbm-bb{position:fixed;left:0;top:0;z-index:41;background:#fff;color:#0C447C;font-size:13px;line-height:1.4;padding:7px 12px;border-radius:14px;white-space:nowrap;" +
    "box-shadow:0 4px 14px rgba(0,0,0,.25);opacity:0;transition:opacity .3s;pointer-events:none;font-family:inherit}" +
    ".cbm-bb.on{opacity:1}" +
    /* chat window */
    ".cbm-chat{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);width:min(600px,calc(100vw - 14px));height:max(320px,calc(100vh - 100px));" +
    "z-index:45;display:flex;flex-direction:column;border-radius:26px;overflow:hidden;font-family:inherit;color:#fff;touch-action:manipulation;-webkit-text-size-adjust:100%;text-size-adjust:100%;" +
    "background:linear-gradient(180deg,rgba(14,34,110,.98),rgba(6,16,58,.98));will-change:transform,opacity;contain:layout paint;" +
    "border:1.5px solid rgba(95,212,255,.55);box-shadow:0 24px 60px rgba(0,0,0,.55),0 0 0 1px rgba(255,200,61,.25),0 0 40px rgba(47,140,255,.45),inset 0 1px 0 rgba(255,255,255,.18);" +
    "transform-origin:var(--ox,90%) 100%;transform:translateX(-50%) perspective(900px) rotateX(14deg) rotateY(var(--ry,-14deg)) scale(.55);" +
    "opacity:0;visibility:hidden;transition:transform .32s cubic-bezier(.2,1.25,.4,1),opacity .2s,visibility 0s .32s}" +
    ".cbm-chat.open{transform:translateX(-50%) perspective(900px) rotateX(0) rotateY(0) scale(1);opacity:1;visibility:visible;transition:transform .32s cubic-bezier(.2,1.25,.4,1),opacity .2s}" +
    ".cbm-chat .top{display:flex;align-items:center;gap:12px;padding:12px 12px 12px 14px;border-bottom:1px solid rgba(95,212,255,.25);" +
    "background:linear-gradient(180deg,rgba(47,140,255,.28),rgba(47,140,255,0))}" +
    ".cbm-chat .av{position:relative;width:52px;height:52px;flex:none}" +
    ".cbm-chat .nm{flex:1;min-width:0}" +
    ".cbm-chat .nm b{display:block;font-size:17px;line-height:1.3;color:#fff}" +
    ".cbm-chat .nm b span{color:#FFC83D}" +
    ".cbm-chat .nm small{display:flex;align-items:center;gap:6px;font-size:12px;color:#9FE1CB}" +
    ".cbm-chat .nm small i{width:8px;height:8px;border-radius:50%;background:#3EE08F;box-shadow:0 0 8px #3EE08F;animation:cbmLive 1.6s ease-in-out infinite}" +
    ".cbm-chat .x{width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font-size:20px;line-height:1;cursor:pointer}" +
    ".cbm-chat .msgs{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding:14px 12px;display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain}" +
    ".cbm-chat .m{max-width:84%;padding:9px 13px;font-size:15px;line-height:1.55;word-wrap:break-word;white-space:normal;animation:cbmPop .35s cubic-bezier(.2,1.3,.35,1)}" +
    ".cbm-chat .m.b{align-self:flex-start;background:rgba(255,255,255,.1);border:1px solid rgba(95,212,255,.35);border-radius:18px 18px 18px 6px}" +
    ".cbm-chat .m.u{align-self:flex-end;background:#FFC83D;color:#2A1A00;border-radius:18px 18px 6px 18px;box-shadow:0 4px 14px rgba(255,200,61,.3)}" +
    ".cbm-chat .dots{display:inline-flex;gap:5px;padding:4px 2px}" +
    ".cbm-chat .dots i{width:8px;height:8px;border-radius:50%;background:#5FD4FF;animation:cbmDot 1s ease-in-out infinite}" +
    ".cbm-chat .dots i:nth-child(2){animation-delay:.15s}.cbm-chat .dots i:nth-child(3){animation-delay:.3s}" +
    ".cbm-chat form{display:flex;align-items:flex-end;gap:8px;padding:10px 10px 12px;border-top:1px solid rgba(95,212,255,.25);flex:none}" +
    ".cbm-chat textarea{flex:1;resize:none;height:44px;max-height:110px;border-radius:22px;border:1.5px solid rgba(95,212,255,.6);background:rgba(4,12,48,.7);" +
    "color:#fff;padding:11px 16px;font:inherit;font-size:16px;line-height:1.4;outline:none;box-sizing:border-box;min-width:0;-webkit-appearance:none;appearance:none}" +
    ".cbm-chat textarea::placeholder{color:#85B7EB}" +
    ".cbm-chat textarea:focus{border-color:#FFC83D}" +
    ".cbm-chat .send{width:46px;height:46px;flex:none;border-radius:50%;border:0;background:#FFC83D;color:#2A1A00;cursor:pointer;display:flex;align-items:center;justify-content:center;" +
    "box-shadow:0 0 18px rgba(255,200,61,.55);transition:transform .15s}" +
    ".cbm-chat .send:active,.cbm-chat .mic:active{transform:scale(.9)}" +
    ".cbm-chat .mic{position:relative;width:46px;height:46px;flex:none;border-radius:50%;border:1.5px solid rgba(95,212,255,.7);background:rgba(4,12,48,.7);color:#9fe7ff;" +
    "cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .15s,background .2s}" +
    ".cbm-chat .mic.rec{background:#ff3b5c;border-color:#ff9fb0;color:#fff;box-shadow:0 0 0 0 rgba(255,59,92,.6);animation:cbmRec 1.2s ease-out infinite}" +
    ".cbm-chat .recbar{display:none;flex:1;align-items:center;gap:10px;height:46px;padding:0 14px;border-radius:23px;background:rgba(255,59,92,.14);border:1.5px solid rgba(255,59,92,.6);" +
    "color:#ffd0d8;font-size:14px;font-weight:700}" +
    ".cbm-chat.recording textarea{display:none}.cbm-chat.recording .recbar{display:flex}" +
    ".cbm-chat .recbar i{width:10px;height:10px;border-radius:50%;background:#ff3b5c;animation:cbmLive .8s ease-in-out infinite}" +
    ".cbm-chat .recbar .lv{flex:1;height:18px;display:flex;align-items:center;gap:2px}" +
    ".cbm-chat .recbar .lv b{flex:1;min-width:2px;border-radius:2px;background:#ff8fa3;height:20%;transition:height .08s}" +
    ".cbm-chat .recbar .cx{border:0;background:none;color:#ffd0d8;font-size:18px;padding:4px;cursor:pointer}" +
    "@keyframes cbmRec{to{box-shadow:0 0 0 14px rgba(255,59,92,0)}}" +
    ".cbm-chat .send:disabled{opacity:.5}" +
    ".cbm-chat button{touch-action:manipulation;-webkit-tap-highlight-color:transparent}" +
    "html.cbm-lock,html.cbm-lock body{overflow:hidden!important;overscroll-behavior:none}" +
    "@keyframes cbmFloat{0%,100%{transform:translateY(0) rotateZ(-2deg)}50%{transform:translateY(-6px) rotateZ(2deg)}}" +
    "@keyframes cbmSway{0%,100%{transform:rotateY(-10deg) rotateX(3deg)}50%{transform:rotateY(12deg) rotateX(-3deg)}}" +
    "@keyframes cbmScan{from{top:-50%}to{top:105%}}" +
    "@keyframes cbmFlicker{0%,100%{opacity:.25}8%{opacity:.85}10%{opacity:.3}12%{opacity:.9}30%{opacity:.4}55%{opacity:.75}57%{opacity:.2}60%{opacity:.8}80%{opacity:.35}}" +
    "@keyframes cbmRays{to{rotate:360deg}}" +
    "@keyframes cbmPulse{from{opacity:.25;scale:.75}to{opacity:.95;scale:1.15}}" +
    "@keyframes cbmTwinkle{0%,100%{opacity:0;transform:scale(.3) rotate(0deg)}45%{opacity:1;transform:scale(1.15) rotate(45deg)}60%{opacity:.6;transform:scale(.8) rotate(60deg)}}" +
    "@keyframes cbmLive{50%{opacity:.4}}" +
    "@keyframes cbmDot{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(-5px);opacity:1}}" +
    "@keyframes cbmPop{from{opacity:0;transform:translateY(8px) scale(.94)}to{opacity:1;transform:none}}" +
    "@media (prefers-reduced-motion:reduce){.cbf *,.cbm-chat *{animation:none!important}.cbm-chat{transition:opacity .2s}}";

  var FACE = '<span class="cbf"><span class="pv"><span class="turn"><span class="fl"><span class="head">' +
    '<img alt="" draggable="false" src="' + IMG + '">' +
    '<span class="ln l"></span><span class="ln r"></span>' +
    '<span class="ray a"></span><span class="ray b"></span>' +
    '<span class="gl a"></span><span class="gl b"></span><span class="gl c"></span>' +
    '</span></span></span></span></span>';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmt(s) {
    return esc(s).replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
  }

  function noZoom() {
    var vp = document.querySelector('meta[name="viewport"]');
    if (vp && !/maximum-scale/.test(vp.content)) vp.content += ",maximum-scale=1";
  }

  function init() {
    noZoom();
    var st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);

    var tg = window.Telegram && window.Telegram.WebApp;
    var me = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || {};

    var cb = document.createElement("button");
    cb.className = "cbm";
    cb.type = "button";
    cb.setAttribute("aria-label", "ជជែកជាមួយ Cooler Bot");
    cb.innerHTML = FACE;
    var bb = document.createElement("div");
    bb.className = "cbm-bb";
    bb.setAttribute("role", "status");

    var chat = document.createElement("section");
    chat.className = "cbm-chat";
    chat.setAttribute("role", "dialog");
    chat.setAttribute("aria-label", "ជជែកជាមួយ Cooler Bot");
    chat.innerHTML = '<div class="top"><div class="av">' + FACE + '</div>' +
      '<div class="nm"><b>Cooler <span>Bot</span></b><small><i></i>កំពុងនៅជាមួយអ្នក</small></div>' +
      '<button type="button" class="x" aria-label="បិទ">×</button></div>' +
      '<div class="msgs" aria-live="polite"></div>' +
      '<form><textarea rows="1" maxlength="1500" aria-label="សរសេរសារ" placeholder="សរសេរ ឬចុច 🎤 និយាយ..."></textarea>' +
      '<div class="recbar" role="status"><i></i><span class="tm">0:00</span><span class="lv"></span><button type="button" class="cx" aria-label="បោះបង់">✕</button></div>' +
      '<button type="button" class="mic" aria-label="ថតសំឡេង"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
      '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg></button>' +
      '<button type="submit" class="send" aria-label="ផ្ញើ"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M21.6 3.2L2.9 10.4c-1 .4-1 1.7 0 2l4.7 1.5 1.8 5.6c.2.7 1.1.9 1.6.4l2.6-2.4 4.8 3.5c.6.4 1.4.1 1.6-.6L23 4.5c.2-.9-.6-1.6-1.4-1.3zM9.6 14.3l-.4 3.6-1.3-4.2 10.6-7.1z"/></svg></button></form>';

    document.body.appendChild(bb);
    document.body.appendChild(cb);
    document.body.appendChild(chat);

    var av = chat.querySelector(".av"), msgs = chat.querySelector(".msgs"), form = chat.querySelector("form");
    var ta = chat.querySelector("textarea"), sendBtn = chat.querySelector(".send");
    var pos = { x: 0, y: 0 }, home = null, drag = null, moved = false, sayT, busyT, sending = false, isOpen = false, lockY = 0;

    function W() { return window.innerWidth; }
    function H() { return window.innerHeight; }
    function haptic(kind) { try { tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred(kind || "light"); } catch (e) {} }
    function isRight() { return pos.x + S / 2 > W() / 2; }

    function place(x, y, anim) {
      pos.x = Math.max(M, Math.min(W() - S - M, x));
      pos.y = Math.max(M, Math.min(H() - S - M, y));
      cb.classList.toggle("drag", !anim);
      cb.style.transform = "translate(" + pos.x + "px," + pos.y + "px)";
      cb.classList.toggle("flip", isRight());
      bubble();
    }
    function snap() {
      var cx = pos.x + S / 2, cy = pos.y + S / 2;
      var d = [cx, W() - cx, cy, H() - cy], i = d.indexOf(Math.min.apply(null, d));
      var x = pos.x, y = pos.y;
      if (i === 0) x = M; else if (i === 1) x = W() - S - M; else if (i === 2) y = M; else y = H() - S - M;
      place(x, y, true);
      save();
      haptic();
    }
    function bubble() {
      var bw = bb.offsetWidth || 120, bh = bb.offsetHeight || 30;
      var bx = isRight() ? pos.x - bw - 6 : pos.x + S + 6;
      var by = pos.y + (S - bh) / 2;
      bb.style.transform = "translate(" + Math.max(6, Math.min(W() - bw - 6, bx)) + "px," + Math.max(6, by) + "px)";
    }
    function say(text, ms) {
      if (isOpen) return;
      bb.textContent = text;
      bb.classList.add("on");
      bubble();
      clearTimeout(sayT);
      if (ms) sayT = setTimeout(function () { bb.classList.remove("on"); }, ms);
    }
    function busy(ms) {
      cb.classList.add("busy");
      clearTimeout(busyT);
      busyT = setTimeout(function () { cb.classList.remove("busy"); }, ms);
    }
    function save() {
      try { localStorage.setItem(KEY, JSON.stringify({ x: pos.x / W(), y: pos.y / H() })); } catch (e) {}
    }

    /* ---------- chat ---------- */
    var log = [];
    try { log = JSON.parse(localStorage.getItem(HKEY)) || []; } catch (e) { log = []; }
    function keep() {
      log = log.slice(-40);
      try { localStorage.setItem(HKEY, JSON.stringify(log)); } catch (e) {}
    }
    function add(role, text, store) {
      var d = document.createElement("div");
      d.className = "m " + role;
      d.innerHTML = fmt(text);
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
      if (store) { log.push({ r: role, t: text }); keep(); }
      return d;
    }
    function render() {
      msgs.innerHTML = "";
      if (!log.length) {
        add("b", "សួស្តី" + (me.first_name ? " " + me.first_name : "") + "! 😎 ខ្ញុំ Cooler Bot — សួរអ្វីក៏បាន ខ្ញុំនៅទីនេះជាមួយអ្នក ❤️", false);
      }
      log.forEach(function (x) { add(x.r, x.t, false); });
    }
    function openChat() {
      if (isOpen) return;
      isOpen = true;
      bb.classList.remove("on");
      var cx = pos.x + S / 2;
      chat.style.setProperty("--ox", Math.round(cx / W() * 100) + "%");
      chat.style.setProperty("--ry", (isRight() ? -20 : 20) + "deg");
      av.classList.toggle("flip", false);
      render();
      cb.classList.add("away");
      lockY = window.scrollY || 0;
      document.documentElement.classList.add("cbm-lock");
      try { tg && tg.disableVerticalSwipes && tg.disableVerticalSwipes(); } catch (e) {}
      fit();
      chat.classList.add("open");
      haptic("medium");
      try { if (tg && tg.BackButton) { tg.BackButton.show(); tg.BackButton.onClick(closeChat); } } catch (e) {}
      msgs.scrollTop = msgs.scrollHeight;
      try { ta.focus({ preventScroll: true }); } catch (e) { ta.focus(); }   // keyboard opens at once (same tap)
    }
    function closeChat() {
      if (!isOpen) return;
      if (recording) stopRec(false);
      isOpen = false;
      chat.classList.remove("open");
      cb.classList.remove("away");
      ta.blur();
      document.documentElement.classList.remove("cbm-lock");
      try { tg && tg.enableVerticalSwipes && tg.enableVerticalSwipes(); } catch (e) {}
      setTimeout(function () { window.scrollTo(0, lockY); }, 50);
      try { if (tg && tg.BackButton) { tg.BackButton.offClick(closeChat); tg.BackButton.hide(); } } catch (e) {}
    }
    chat.querySelector(".x").addEventListener("click", closeChat);
    window.CoolerChat = { open: openChat, close: closeChat };
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && isOpen) closeChat(); });

    function grow() { ta.style.height = "44px"; ta.style.height = Math.min(110, ta.scrollHeight) + "px"; }
    ta.addEventListener("input", function () { grow(); av.classList.add("busy"); clearTimeout(busyT); busyT = setTimeout(function () { av.classList.remove("busy"); }, 900); });
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : send(); }
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); send(); });

    function send() {
      if (recording) { stopRec(true); return; }
      var text = ta.value.trim();
      if (!text || sending) return;
      ta.value = "";
      grow();
      add("u", text, true);
      haptic();
      post({ text: text }, null);
    }

    function post(payload, voiceBubble) {
      var initData = tg && tg.initData;
      if (!initData) {
        add("b", "🙏 សូមបើក Cooler Hub ពីក្នុង Telegram ដើម្បីជជែកជាមួយខ្ញុំ", false);
        return;
      }
      payload.initData = initData;
      sending = true;
      sendBtn.disabled = true;
      av.classList.add("busy");
      var typing = document.createElement("div");
      typing.className = "m b";
      typing.innerHTML = '<span class="dots" aria-label="Cooler Bot កំពុងវាយ"><i></i><i></i><i></i></span>';
      msgs.appendChild(typing);
      msgs.scrollTop = msgs.scrollHeight;
      fetch(API + "/hub/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; });
      }).then(function (res) {
        typing.remove();
        if (voiceBubble) {
          var said = res.j.heard ? "🎤 " + res.j.heard : "🎤 សារសំឡេង";
          voiceBubble.innerHTML = fmt(said);
          if (res.j.reply) { log.push({ r: "u", t: said }); keep(); }
        }
        add("b", res.j.reply || res.j.msg || "😅 ខ្ញុំរវល់បន្តិច — សាកម្ដងទៀតណា", !!res.j.reply);
        haptic("soft");
      }).catch(function () {
        typing.remove();
        add("b", "📶 អ៊ីនធឺណិតមិនស្រួល — សាកម្ដងទៀតណា", false);
      }).then(function () {
        sending = false;
        sendBtn.disabled = false;
        av.classList.remove("busy");
      });
    }

    /* ---------- voice: tap 🎤 to talk, tap again (or ➤) to send ---------- */
    var micBtn = chat.querySelector(".mic"), recbar = chat.querySelector(".recbar"), tmEl = recbar.querySelector(".tm"), lvEl = recbar.querySelector(".lv");
    var recording = false, mr = null, chunks = [], stream = null, t0 = 0, tick = null, actx = null, analyser = null, keepRec = false;
    for (var bi = 0; bi < 18; bi++) lvEl.appendChild(document.createElement("b"));
    var bars = lvEl.querySelectorAll("b");
    function startRec() {
      if (sending || recording) return;
      if (!navigator.mediaDevices || !window.MediaRecorder) { add("b", "🎤 ទូរស័ព្ទនេះមិនទាន់គាំទ្រការថតក្នុង Hub — សាកផ្ញើ Voice ក្នុង Telegram ណា", false); return; }
      navigator.mediaDevices.getUserMedia({ audio: { noiseSuppression: true, echoCancellation: true } }).then(function (st) {
        stream = st; chunks = []; recording = true; keepRec = false;
        mr = new MediaRecorder(st);
        mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        mr.onstop = finishRec;
        mr.start();
        t0 = Date.now();
        chat.classList.add("recording"); micBtn.classList.add("rec"); micBtn.setAttribute("aria-label", "ឈប់ ហើយផ្ញើ");
        av.classList.add("busy"); haptic("medium");
        try {
          var Ctx = window.AudioContext || window.webkitAudioContext; actx = new Ctx();
          analyser = actx.createAnalyser(); analyser.fftSize = 64; actx.createMediaStreamSource(st).connect(analyser);
        } catch (e) { analyser = null; }
        var data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
        tick = setInterval(function () {
          var sec = Math.floor((Date.now() - t0) / 1000);
          tmEl.textContent = Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
          if (analyser) { analyser.getByteFrequencyData(data); for (var i = 0; i < bars.length; i++) bars[i].style.height = Math.max(15, Math.min(100, data[i + 1] / 2.2)) + "%"; }
          if (sec >= 60) stopRec(true);
        }, 90);
      }).catch(function () {
        add("b", "🎤 សូមអនុញ្ញាតឲ្យប្រើ Microphone សិន ទើបនិយាយជាមួយខ្ញុំបាន 🙏", false);
      });
    }
    function stopRec(send) {
      if (!recording) return;
      keepRec = !!send; recording = false;
      clearInterval(tick);
      try { mr.state !== "inactive" && mr.stop(); } catch (e) { finishRec(); }
    }
    function cleanupRec() {
      try { stream && stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
      try { actx && actx.close(); } catch (e) {}
      actx = analyser = null;
      chat.classList.remove("recording"); micBtn.classList.remove("rec"); micBtn.setAttribute("aria-label", "ថតសំឡេង");
      av.classList.remove("busy"); tmEl.textContent = "0:00";
    }
    function finishRec() {
      cleanupRec();
      if (!keepRec || !chunks.length || Date.now() - t0 < 700) { if (keepRec) add("b", "🎤 ខ្លីពេក — ចុច 🎤 ហើយនិយាយម្ដងទៀត", false); return; }
      var bubble = add("u", "🎤 កំពុងផ្ញើសំឡេង...", false);
      haptic();
      new Blob(chunks).arrayBuffer().then(toWav).then(function (wav) {
        post({ audio: wav }, bubble);
      }).catch(function () {
        bubble.innerHTML = fmt("🎤 ថតមិនបាន — សាកម្ដងទៀត");
      });
    }
    function toWav(buf) {
      var Ctx = window.AudioContext || window.webkitAudioContext, ctx = new Ctx();
      return new Promise(function (ok, bad) { var p = ctx.decodeAudioData(buf, ok, bad); if (p && p.then) p.then(ok, bad); }).then(function (dec) {
        var sr = 16000, len = Math.max(1, Math.min(Math.ceil(dec.duration * sr), sr * 60));
        var off = new OfflineAudioContext(1, len, sr), src = off.createBufferSource();
        src.buffer = dec; src.connect(off.destination); src.start();
        return off.startRendering();
      }).then(function (rendered) {
        try { ctx.close(); } catch (e) {}
        var out = rendered.getChannelData(0), b = new ArrayBuffer(44 + out.length * 2), v = new DataView(b);
        function w(o, str) { for (var i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); }
        w(0, "RIFF"); v.setUint32(4, 36 + out.length * 2, true); w(8, "WAVEfmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
        v.setUint32(24, 16000, true); v.setUint32(28, 32000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, out.length * 2, true);
        for (var i = 0; i < out.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, out[i])) * 0x7fff, true);
        var bin = "", u8 = new Uint8Array(b);
        for (var j = 0; j < u8.length; j += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(j, j + 0x8000));
        return "data:audio/wav;base64," + btoa(bin);
      });
    }
    micBtn.addEventListener("click", function () { if (recording) stopRec(true); else startRec(); });
    recbar.querySelector(".cx").addEventListener("click", function () { stopRec(false); haptic(); });

    /* keep the window exactly in the visible area above the phone keyboard */
    var probe = document.createElement("div");
    probe.style.cssText = "position:fixed;left:0;bottom:0;width:0;height:0;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom,0px)";
    document.body.appendChild(probe);
    var fitRaf = 0, wasKb = false;
    function fit() {
      var vv = window.visualViewport;
      var top = vv ? vv.offsetTop : 0, vh = vv ? vv.height : H();
      var kb = H() - vh > 120;                                   // keyboard is up
      var safe = kb ? 0 : (parseFloat(getComputedStyle(probe).paddingBottom) || 0);
      var gapTop = kb ? 8 : Math.min(88, vh * 0.12), gapBot = kb ? 6 : 12 + safe;
      chat.style.bottom = "auto";
      chat.style.top = Math.round(top + gapTop) + "px";
      chat.style.height = Math.round(Math.max(220, vh - gapTop - gapBot)) + "px";
      if (kb !== wasKb) { wasKb = kb; msgs.scrollTop = msgs.scrollHeight; }
    }
    function fitSoon() { if (!isOpen) return; cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(fit); }
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", fitSoon);
      window.visualViewport.addEventListener("scroll", fitSoon);
    }
    window.addEventListener("resize", fitSoon);
    try { tg && tg.onEvent && tg.onEvent("viewportChanged", fitSoon); } catch (e) {}
    ta.addEventListener("focus", function () { setTimeout(fitSoon, 60); setTimeout(fitSoon, 350); });
    ta.addEventListener("blur", function () { setTimeout(fitSoon, 60); setTimeout(fitSoon, 350); });
    /* tapping ➤ / 🎤 must not close the keyboard (that made the window jump and the tap miss) */
    [sendBtn, micBtn].forEach(function (b) { b.addEventListener("mousedown", function (e) { e.preventDefault(); }); });
    /* tap the messages to hide the keyboard, like Telegram */
    msgs.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("a")) return;
      var sel = window.getSelection && String(window.getSelection());
      if (!sel && document.activeElement === ta) ta.blur();
    });
    /* page behind must not scroll while the chat is open */
    document.addEventListener("touchmove", function (e) {
      if (isOpen && !(e.target.closest && e.target.closest(".cbm-chat .msgs, .cbm-chat textarea"))) e.preventDefault();
    }, { passive: false });

    /* ---------- floating face ---------- */
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    place(saved ? saved.x * W() : W() - S - M, saved ? saved.y * H() : H() - S - 90, true);

    cb.addEventListener("pointerdown", function (e) {
      drag = { dx: e.clientX - pos.x, dy: e.clientY - pos.y, sx: e.clientX, sy: e.clientY };
      moved = false;
      try { cb.setPointerCapture(e.pointerId); } catch (err) {}
    });
    cb.addEventListener("pointermove", function (e) {
      if (!drag) return;
      if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 12) moved = true;
      if (moved) place(e.clientX - drag.dx, e.clientY - drag.dy, false);
    });
    function release() {
      if (!drag) return;
      drag = null;
      if (moved) {
        home = null;
        snap();
        say(isRight() ? "ខ្ញុំនៅខាងស្តាំ 👈" : "ខ្ញុំនៅខាងឆ្វេង 👉", 1500);
      } else {
        openChat();
      }
    }
    cb.addEventListener("pointerup", release);
    cb.addEventListener("pointercancel", function () { drag = null; });
    cb.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openChat(); } });

    function typingBox(el) {
      if (!el || !el.tagName || (el.closest && el.closest(".cbm-chat"))) return false;
      if (el.tagName === "TEXTAREA") return true;
      return el.tagName === "INPUT" && /^(text|search|email|url|tel|number|)$/.test(el.type || "");
    }
    document.addEventListener("focusin", function (e) {
      if (!typingBox(e.target)) return;
      if (!home) home = { x: pos.x, y: pos.y };
      var r = e.target.getBoundingClientRect();
      var y = r.top - S - 6 >= M ? r.top - S - 6 : r.bottom + 6;
      place(isRight() ? W() - S - M : M, y, true);
      say("ខ្ញុំកំពុងស្តាប់ 👂");
    });
    document.addEventListener("input", function (e) {
      if (!typingBox(e.target)) return;
      busy(900);
      say(e.target.value ? "កំពុងអាន... ⚡" : "ខ្ញុំកំពុងស្តាប់ 👂");
    });
    document.addEventListener("focusout", function (e) {
      if (!typingBox(e.target)) return;
      if (home) { place(home.x, home.y, true); home = null; }
      bb.classList.remove("on");
    });
    window.addEventListener("resize", function () { place(pos.x, pos.y, true); });

    setTimeout(function () { say("សួស្តី! ចុចខ្ញុំដើម្បីជជែក 😎", 2800); }, 900);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
