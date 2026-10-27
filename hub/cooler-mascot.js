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
    ".cbm-chat{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);width:min(390px,calc(100vw - 20px));height:min(560px,calc(100vh - 90px));" +
    "z-index:45;display:flex;flex-direction:column;border-radius:26px;overflow:hidden;font-family:inherit;color:#fff;" +
    "background:rgba(8,22,78,.86);-webkit-backdrop-filter:blur(18px) saturate(1.4);backdrop-filter:blur(18px) saturate(1.4);" +
    "border:1.5px solid rgba(95,212,255,.55);box-shadow:0 24px 60px rgba(0,0,0,.55),0 0 0 1px rgba(255,200,61,.25),0 0 40px rgba(47,140,255,.45),inset 0 1px 0 rgba(255,255,255,.18);" +
    "transform-origin:var(--ox,90%) 100%;transform:translateX(-50%) perspective(900px) rotateX(22deg) rotateY(var(--ry,-20deg)) scale(.35);" +
    "opacity:0;visibility:hidden;transition:transform .6s cubic-bezier(.2,1.3,.35,1),opacity .3s,visibility 0s .6s}" +
    ".cbm-chat.open{transform:translateX(-50%) perspective(900px) rotateX(0) rotateY(0) scale(1);opacity:1;visibility:visible;transition:transform .6s cubic-bezier(.2,1.3,.35,1),opacity .3s}" +
    ".cbm-chat .top{display:flex;align-items:center;gap:12px;padding:12px 12px 12px 14px;border-bottom:1px solid rgba(95,212,255,.25);" +
    "background:linear-gradient(180deg,rgba(47,140,255,.28),rgba(47,140,255,0))}" +
    ".cbm-chat .av{position:relative;width:52px;height:52px;flex:none}" +
    ".cbm-chat .nm{flex:1;min-width:0}" +
    ".cbm-chat .nm b{display:block;font-size:17px;line-height:1.3;color:#fff}" +
    ".cbm-chat .nm b span{color:#FFC83D}" +
    ".cbm-chat .nm small{display:flex;align-items:center;gap:6px;font-size:12px;color:#9FE1CB}" +
    ".cbm-chat .nm small i{width:8px;height:8px;border-radius:50%;background:#3EE08F;box-shadow:0 0 8px #3EE08F;animation:cbmLive 1.6s ease-in-out infinite}" +
    ".cbm-chat .x{width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font-size:20px;line-height:1;cursor:pointer}" +
    ".cbm-chat .msgs{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain}" +
    ".cbm-chat .m{max-width:84%;padding:9px 13px;font-size:15px;line-height:1.55;word-wrap:break-word;white-space:normal;animation:cbmPop .35s cubic-bezier(.2,1.3,.35,1)}" +
    ".cbm-chat .m.b{align-self:flex-start;background:rgba(255,255,255,.1);border:1px solid rgba(95,212,255,.35);border-radius:18px 18px 18px 6px}" +
    ".cbm-chat .m.u{align-self:flex-end;background:#FFC83D;color:#2A1A00;border-radius:18px 18px 6px 18px;box-shadow:0 4px 14px rgba(255,200,61,.3)}" +
    ".cbm-chat .dots{display:inline-flex;gap:5px;padding:4px 2px}" +
    ".cbm-chat .dots i{width:8px;height:8px;border-radius:50%;background:#5FD4FF;animation:cbmDot 1s ease-in-out infinite}" +
    ".cbm-chat .dots i:nth-child(2){animation-delay:.15s}.cbm-chat .dots i:nth-child(3){animation-delay:.3s}" +
    ".cbm-chat form{display:flex;gap:8px;padding:10px 10px 12px;border-top:1px solid rgba(95,212,255,.25)}" +
    ".cbm-chat textarea{flex:1;resize:none;height:44px;max-height:110px;border-radius:22px;border:1.5px solid rgba(95,212,255,.6);background:rgba(4,12,48,.7);" +
    "color:#fff;padding:11px 16px;font:inherit;font-size:15px;line-height:1.4;outline:none;box-sizing:border-box}" +
    ".cbm-chat textarea::placeholder{color:#85B7EB}" +
    ".cbm-chat textarea:focus{border-color:#FFC83D}" +
    ".cbm-chat .send{width:46px;height:46px;flex:none;border-radius:50%;border:0;background:#FFC83D;color:#2A1A00;cursor:pointer;display:flex;align-items:center;justify-content:center;" +
    "box-shadow:0 0 18px rgba(255,200,61,.55);transition:transform .15s}" +
    ".cbm-chat .send:active{transform:scale(.9)}" +
    ".cbm-chat .send:disabled{opacity:.5}" +
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

  function init() {
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
      '<form><textarea rows="1" maxlength="1500" aria-label="សរសេរសារ" placeholder="សរសេរទៅ Cooler Bot..."></textarea>' +
      '<button type="submit" class="send" aria-label="ផ្ញើ"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M21.6 3.2L2.9 10.4c-1 .4-1 1.7 0 2l4.7 1.5 1.8 5.6c.2.7 1.1.9 1.6.4l2.6-2.4 4.8 3.5c.6.4 1.4.1 1.6-.6L23 4.5c.2-.9-.6-1.6-1.4-1.3zM9.6 14.3l-.4 3.6-1.3-4.2 10.6-7.1z"/></svg></button></form>';

    document.body.appendChild(bb);
    document.body.appendChild(cb);
    document.body.appendChild(chat);

    var av = chat.querySelector(".av"), msgs = chat.querySelector(".msgs"), form = chat.querySelector("form");
    var ta = chat.querySelector("textarea"), sendBtn = chat.querySelector(".send");
    var pos = { x: 0, y: 0 }, home = null, drag = null, moved = false, sayT, busyT, sending = false, isOpen = false;

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
      chat.classList.add("open");
      haptic("medium");
      try { if (tg && tg.BackButton) { tg.BackButton.show(); tg.BackButton.onClick(closeChat); } } catch (e) {}
      setTimeout(function () { msgs.scrollTop = msgs.scrollHeight; }, 50);
    }
    function closeChat() {
      if (!isOpen) return;
      isOpen = false;
      chat.classList.remove("open");
      cb.classList.remove("away");
      ta.blur();
      try { if (tg && tg.BackButton) { tg.BackButton.offClick(closeChat); tg.BackButton.hide(); } } catch (e) {}
    }
    chat.querySelector(".x").addEventListener("click", closeChat);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && isOpen) closeChat(); });

    function grow() { ta.style.height = "44px"; ta.style.height = Math.min(110, ta.scrollHeight) + "px"; }
    ta.addEventListener("input", function () { grow(); av.classList.add("busy"); clearTimeout(busyT); busyT = setTimeout(function () { av.classList.remove("busy"); }, 900); });
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : send(); }
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); send(); });

    function send() {
      var text = ta.value.trim();
      if (!text || sending) return;
      ta.value = "";
      grow();
      add("u", text, true);
      haptic();
      var initData = tg && tg.initData;
      if (!initData) {
        add("b", "🙏 សូមបើក Cooler Hub ពីក្នុង Telegram ដើម្បីជជែកជាមួយខ្ញុំ", false);
        return;
      }
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
        body: JSON.stringify({ initData: initData, text: text })
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; });
      }).then(function (res) {
        typing.remove();
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

    /* keep the window above the phone keyboard */
    if (window.visualViewport) {
      var fit = function () {
        var vv = window.visualViewport;
        var kb = Math.max(0, H() - vv.height - vv.offsetTop);
        chat.style.bottom = "calc(env(safe-area-inset-bottom,0px) + " + (12 + kb) + "px)";
        chat.style.height = "min(560px," + Math.max(260, vv.height - 90) + "px)";
      };
      window.visualViewport.addEventListener("resize", fit);
      window.visualViewport.addEventListener("scroll", fit);
    }

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
      if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 6) moved = true;
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
