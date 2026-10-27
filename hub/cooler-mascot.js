/* Cooler Bot floating mascot for the Cooler Hub.
 * - Small 3D head (transparent) that floats on the screen, draggable to any edge (left/right/top/bottom).
 * - The head always turns toward the middle of the screen (on the left → faces right, on the right → faces left).
 * - Sunglasses: scanning light, flicker, golden rays and twinkling stars ("charging" robot look).
 * - Moves close to a text box while the person types and speeds up its glow.
 * Include with: <script src="cooler-mascot.js" defer></script>
 */
(function () {
  if (window.__coolerMascot) return;
  window.__coolerMascot = true;

  var IMG = new URL("coolerbot-head.webp", document.currentScript ? document.currentScript.src : location.href).href;
  var S = 72, M = 10, KEY = "coolerMascotPos";

  var css = "" +
    ".cbm{position:fixed;left:0;top:0;width:" + S + "px;height:" + S + "px;padding:0;border:0;background:none;cursor:grab;z-index:40;" +
    "transition:transform .7s cubic-bezier(.22,1.25,.36,1),opacity .3s;will-change:transform;-webkit-tap-highlight-color:transparent;touch-action:none}" +
    ".cbm.drag{transition:none;cursor:grabbing}" +
    ".cbm .pv{position:absolute;inset:0;perspective:420px}" +
    ".cbm .turn{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .8s cubic-bezier(.45,0,.2,1)}" +
    ".cbm.flip .turn{transform:rotateY(180deg)}" +
    ".cbm .fl{position:absolute;inset:0;transform-style:preserve-3d;animation:cbmFloat 3.6s ease-in-out infinite}" +
    ".cbm .head{position:absolute;inset:0;animation:cbmSway 5s ease-in-out infinite}" +
    ".cbm img{width:100%;height:100%;display:block;-webkit-user-drag:none;user-select:none;pointer-events:none;" +
    "filter:drop-shadow(0 6px 8px rgba(0,0,0,.5)) drop-shadow(0 0 7px rgba(95,212,255,.5))}" +
    ".cbm .ln{position:absolute;overflow:hidden;border-radius:6% 6% 40% 40%;mix-blend-mode:screen}" +
    ".cbm .ln.l{left:25%;top:52%;width:25%;height:21%}" +
    ".cbm .ln.r{left:56.5%;top:54%;width:29.5%;height:21%}" +
    ".cbm .ln::before{content:'';position:absolute;inset:0;background:rgba(95,212,255,.25);animation:cbmFlicker 2.6s linear infinite}" +
    ".cbm .ln.r::before{animation-delay:-1.3s}" +
    ".cbm .ln::after{content:'';position:absolute;left:-10%;right:-10%;height:42%;top:-50%;" +
    "background:linear-gradient(180deg,rgba(95,212,255,0),rgba(95,212,255,.9) 42%,#fff 50%,rgba(95,212,255,.9) 58%,rgba(95,212,255,0));" +
    "animation:cbmScan 1.9s cubic-bezier(.45,0,.55,1) infinite alternate}" +
    ".cbm .ray{position:absolute;width:56%;height:56%;margin:-28% 0 0 -28%;border-radius:50%;pointer-events:none;mix-blend-mode:screen;" +
    "background:repeating-conic-gradient(from 0deg,rgba(255,220,120,.85) 0deg 3deg,rgba(255,220,120,0) 3deg 30deg);" +
    "-webkit-mask:radial-gradient(circle,#000 0 12%,rgba(0,0,0,.6) 30%,transparent 68%);mask:radial-gradient(circle,#000 0 12%,rgba(0,0,0,.6) 30%,transparent 68%);" +
    "animation:cbmRays 4s linear infinite,cbmPulse 1.6s ease-in-out infinite alternate}" +
    ".cbm .ray.a{left:36%;top:60%}" +
    ".cbm .ray.b{left:72%;top:58%;width:40%;height:40%;margin:-20% 0 0 -20%;animation-delay:-2s,-.8s;animation-direction:reverse,alternate}" +
    ".cbm .gl{position:absolute;width:22%;height:22%;margin:-11% 0 0 -11%;pointer-events:none;mix-blend-mode:screen;animation:cbmTwinkle 2.2s ease-in-out infinite}" +
    ".cbm .gl::before,.cbm .gl::after{content:'';position:absolute;left:50%;top:50%;width:100%;height:9%;margin:-4.5% 0 0 -50%;border-radius:50%;" +
    "background:radial-gradient(closest-side,#fff,rgba(255,240,180,.8) 40%,transparent)}" +
    ".cbm .gl::after{transform:rotate(90deg)}" +
    ".cbm .gl.a{left:33%;top:58%}" +
    ".cbm .gl.b{left:44%;top:66%;width:14%;height:14%;margin:-7% 0 0 -7%;animation-delay:-1.1s}" +
    ".cbm .gl.c{left:78%;top:57%;width:16%;height:16%;margin:-8% 0 0 -8%;animation-delay:-.5s}" +
    ".cbm.busy .ln::after{animation-duration:.5s}.cbm.busy .ln::before{animation-duration:.9s}.cbm.busy .ray{animation-duration:1.2s,.5s}" +
    "@keyframes cbmFloat{0%,100%{transform:translateY(0) rotateZ(-2deg)}50%{transform:translateY(-6px) rotateZ(2deg)}}" +
    "@keyframes cbmSway{0%,100%{transform:rotateY(-10deg) rotateX(3deg)}50%{transform:rotateY(12deg) rotateX(-3deg)}}" +
    "@keyframes cbmScan{from{top:-50%}to{top:105%}}" +
    "@keyframes cbmFlicker{0%,100%{opacity:.25}8%{opacity:.85}10%{opacity:.3}12%{opacity:.9}30%{opacity:.4}55%{opacity:.75}57%{opacity:.2}60%{opacity:.8}80%{opacity:.35}}" +
    "@keyframes cbmRays{to{rotate:360deg}}" +
    "@keyframes cbmPulse{from{opacity:.25;scale:.75}to{opacity:.95;scale:1.15}}" +
    "@keyframes cbmTwinkle{0%,100%{opacity:0;transform:scale(.3) rotate(0deg)}45%{opacity:1;transform:scale(1.15) rotate(45deg)}60%{opacity:.6;transform:scale(.8) rotate(60deg)}}" +
    ".cbm-bb{position:fixed;left:0;top:0;z-index:41;background:#fff;color:#0C447C;font-size:13px;line-height:1.4;padding:7px 12px;border-radius:14px;white-space:nowrap;" +
    "box-shadow:0 4px 14px rgba(0,0,0,.25);opacity:0;transition:opacity .3s;pointer-events:none;font-family:inherit}" +
    ".cbm-bb.on{opacity:1}" +
    "@media (prefers-reduced-motion:reduce){.cbm *{animation:none!important}}";

  function init() {
    var st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);

    var cb = document.createElement("button");
    cb.className = "cbm";
    cb.type = "button";
    cb.setAttribute("aria-label", "Cooler Bot");
    cb.innerHTML = '<span class="pv"><span class="turn"><span class="fl"><span class="head">' +
      '<img alt="" draggable="false" src="' + IMG + '">' +
      '<span class="ln l"></span><span class="ln r"></span>' +
      '<span class="ray a"></span><span class="ray b"></span>' +
      '<span class="gl a"></span><span class="gl b"></span><span class="gl c"></span>' +
      '</span></span></span></span>';
    var bb = document.createElement("div");
    bb.className = "cbm-bb";
    bb.setAttribute("role", "status");
    document.body.appendChild(bb);
    document.body.appendChild(cb);

    var pos = { x: 0, y: 0 }, home = null, drag = null, moved = false, sayT, busyT;
    var tg = window.Telegram && window.Telegram.WebApp;

    function W() { return window.innerWidth; }
    function H() { return window.innerHeight; }
    function haptic() { try { tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred("light"); } catch (e) {} }
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
        busy(1200);
        haptic();
        var lines = ["ហៅខ្ញុំមែនទេ? 😄", "Cooler Bot នៅជាមួយអ្នក ❤️", "ចង់លេងហ្គេមទេ? 🎮", "ថាមពលពេញ 100% ⚡"];
        say(lines[Math.floor(Math.random() * lines.length)], 2200);
      }
    }
    cb.addEventListener("pointerup", release);
    cb.addEventListener("pointercancel", release);

    function typingBox(el) {
      if (!el || !el.tagName) return false;
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

    setTimeout(function () { say("សួស្តី! Cooler Bot នៅទីនេះ 😎", 2600); }, 900);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
