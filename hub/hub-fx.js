/* ⚡ Hub FX — makes the Cooler Hub feel alive: electric current around the important pictures.
 * - Cooler Bot card avatar: electric orb (running light back and forth, lightning bolts, orbiting sparks, 3D sway)
 * - ICOM mic, Cooler Voice logo, partner spotlight logos: electric running ring
 * - Picture tiles (partners, team app...): light running around the border; every tile gets a shine sweep
 * Animations run only while the element is on screen (saves battery, keeps scrolling smooth).
 * Include with: <script src="hub-fx.js" defer></script>
 */
(function () {
  if (window.__hubFx) return;
  window.__hubFx = true;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var css = "" +
    ".fx-orb{position:relative;flex:0 0 auto;width:58px;height:58px;display:block;border-radius:50%;cursor:pointer;" +
    "animation:fxSway 4.5s ease-in-out infinite;transform-style:preserve-3d}" +
    ".fx-orb img{position:relative;z-index:2;display:block;width:58px!important;height:58px!important;box-shadow:0 0 0 2px rgba(255,255,255,.85),0 0 16px #5FD4FF!important;" +
    "animation:fxGlow 1.8s ease-in-out infinite alternate}" +
    ".fx-arc{position:absolute;inset:-6px;border-radius:50%;pointer-events:none;z-index:3;overflow:hidden;" +
    "-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 3.5px),#000 calc(100% - 3px));mask:radial-gradient(farthest-side,transparent calc(100% - 3.5px),#000 calc(100% - 3px))}" +
    ".fx-arc::before{content:'';position:absolute;inset:-20%;background:conic-gradient(from 0deg,transparent 0 50%,rgba(95,212,255,.15) 56%,#5FD4FF 68%,#fff 72%,#FFC83D 77%,transparent 84%);" +
    "animation:fxRun 2.2s cubic-bezier(.6,0,.4,1) infinite alternate}" +
    ".fx-arc.b{inset:-11px;opacity:.75}" +
    ".fx-arc.b::before{background:conic-gradient(from 180deg,transparent 0 62%,#B26BFF 72%,#5FD4FF 78%,transparent 86%);animation-duration:3.1s;animation-direction:alternate-reverse}" +
    ".fx-bolt{position:absolute;inset:-14px;width:calc(100% + 28px);height:calc(100% + 28px);pointer-events:none;z-index:4;overflow:visible}" +
    ".fx-bolt path{fill:none;stroke:#bff3ff;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 3px #5FD4FF) drop-shadow(0 0 6px #5FD4FF);opacity:0;animation:fxZap 2.6s steps(1) infinite}" +
    ".fx-bolt path:nth-child(2){animation-delay:.9s;stroke:#ffe9a8;filter:drop-shadow(0 0 3px #FFC83D)}" +
    ".fx-bolt path:nth-child(3){animation-delay:1.7s}" +
    ".fx-sp{position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px;border-radius:50%;background:#fff;z-index:4;pointer-events:none;" +
    "box-shadow:0 0 6px #fff,0 0 12px #5FD4FF,0 0 18px #5FD4FF;animation:fxOrbit 2.4s linear infinite}" +
    ".fx-sp.s2{width:4px;height:4px;margin:-2px;animation-duration:3.3s;animation-direction:reverse;box-shadow:0 0 6px #fff,0 0 12px #FFC83D}" +
    ".fx-sp.s3{width:3px;height:3px;margin:-1.5px;animation-duration:1.9s;animation-delay:-.7s}" +
    /* ring around round icons (ICOM mic, partner logos) */
    ".fx-ring{position:absolute;inset:-5px;border-radius:inherit;pointer-events:none;z-index:3;overflow:hidden;" +
    "-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);padding:3px}" +
    ".fx-ring::before{content:'';position:absolute;left:50%;top:50%;width:170%;aspect-ratio:1;translate:-50% -50%;" +
    "background:conic-gradient(from 0deg,transparent 0 52%,rgba(95,212,255,.2) 58%,#5FD4FF 70%,#fff 74%,#FFC83D 79%,transparent 86%);" +
    "animation:fxRun 2.6s cubic-bezier(.6,0,.4,1) infinite alternate}" +
    ".fx-ring.gold::before{background:conic-gradient(from 0deg,transparent 0 52%,rgba(255,200,61,.2) 58%,#FFC83D 70%,#fff 74%,#ff7a2a 79%,transparent 86%)}" +
    /* tiles: running border inside the tile (tiles clip their content) + shine sweep */
    ".fx-run{position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:2;padding:2.5px;" +
    "-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}" +
    ".fx-run::before{content:'';position:absolute;left:50%;top:50%;width:170%;aspect-ratio:1;translate:-50% -50%;" +
    "background:conic-gradient(from 0deg,transparent 0 55%,#5FD4FF 70%,#fff 74%,#FFC83D 78%,transparent 85%);animation:fxRun 3s cubic-bezier(.6,0,.4,1) infinite alternate}" +
    ".fx-shine{position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:2;overflow:hidden}" +
    ".fx-shine::before{content:'';position:absolute;top:-20%;bottom:-20%;width:35%;left:-60%;" +
    "background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);animation:fxShine 5s ease-in-out infinite;animation-delay:var(--d,0s)}" +
    ".fx-pulse{animation:fxGlowBox 2s ease-in-out infinite alternate}" +
    /* pause everything that is off screen */
    ".fxoff,.fxoff *,.fxoff::before,.fxoff *::before{animation-play-state:paused!important}" +
    "@keyframes fxRun{from{rotate:0deg}to{rotate:360deg}}" +
    "@keyframes fxOrbit{from{transform:rotate(0deg) translateX(36px)}to{transform:rotate(360deg) translateX(36px)}}" +
    "@keyframes fxSway{0%,100%{transform:perspective(300px) rotateY(-14deg) translateY(0)}50%{transform:perspective(300px) rotateY(14deg) translateY(-3px)}}" +
    "@keyframes fxGlow{from{filter:brightness(1) saturate(1)}to{filter:brightness(1.12) saturate(1.2)}}" +
    "@keyframes fxGlowBox{from{box-shadow:0 0 0 2px rgba(255,255,255,.8),0 0 10px rgba(95,212,255,.5)}to{box-shadow:0 0 0 2px #fff,0 0 26px rgba(95,212,255,.95)}}" +
    "@keyframes fxZap{0%,100%{opacity:0}3%{opacity:1}6%{opacity:.2}9%{opacity:1}13%{opacity:0}}" +
    "@keyframes fxShine{0%,70%{left:-60%}100%{left:130%}}" +
    "@media (prefers-reduced-motion:reduce){.fx-orb,.fx-orb *,.fx-arc::before,.fx-ring::before,.fx-run::before,.fx-shine::before,.fx-sp,.fx-bolt path{animation:none!important}}";

  var BOLTS = '<svg class="fx-bolt" viewBox="0 0 86 86" aria-hidden="true">' +
    '<path d="M70 14l-5 9 6 2-7 10 4 1-6 8"/>' +
    '<path d="M12 62l7-6-5-3 8-6-4-2 6-7"/>' +
    '<path d="M60 78l-6-7 6-2-9-6 4-3-7-5"/></svg>';

  var seen = typeof WeakSet === "function" ? new WeakSet() : null;
  function once(el) {
    if (!el) return false;
    if (seen) { if (seen.has(el)) return false; seen.add(el); return true; }
    if (el.__fx) return false; el.__fx = 1; return true;
  }
  function add(parent, cls, html) {
    var s = document.createElement("span");
    s.className = cls;
    s.setAttribute("aria-hidden", "true");
    if (html) s.innerHTML = html;
    parent.appendChild(s);
    return s;
  }

  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle("fxoff", !e.isIntersecting); });
  }, { rootMargin: "60px" }) : null;
  function watch(el) { if (io) { el.classList.add("fxoff"); io.observe(el); } }

  function orb() {
    var img = document.querySelector(".cbot > img");
    if (!img || !once(img)) return;
    var o = document.createElement("span");
    o.className = "fx-orb";
    o.setAttribute("role", "button");
    o.setAttribute("tabindex", "0");
    o.setAttribute("aria-label", "ជជែកជាមួយ Cooler Bot");
    img.parentNode.insertBefore(o, img);
    o.appendChild(img);
    add(o, "fx-arc b"); add(o, "fx-arc");
    o.insertAdjacentHTML("beforeend", BOLTS);
    add(o, "fx-sp"); add(o, "fx-sp s2"); add(o, "fx-sp s3");
    function talk() {
      try { window.Telegram && Telegram.WebApp.HapticFeedback.impactOccurred("medium"); } catch (e) {}
      if (window.CoolerChat) window.CoolerChat.open();
    }
    o.addEventListener("click", talk);
    o.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); talk(); } });
    watch(o);
  }
  function ring(el, gold, radius) {
    if (!el || !once(el)) return;
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    var r = add(el, "fx-ring" + (gold ? " gold" : ""));
    if (radius) r.style.borderRadius = radius;
    watch(el);
  }
  function tiles(root) {
    (root || document).querySelectorAll(".app .ic").forEach(function (ic, i) {
      if (!once(ic)) return;
      if (ic.classList.contains("pic")) add(ic, "fx-run");
      var sh = add(ic, "fx-shine");
      sh.style.setProperty("--d", ((i * 0.37) % 5).toFixed(2) + "s");
      watch(ic);
    });
  }
  function run() {
    orb();
    ring(document.querySelector(".icom .mic"), true);
    ring(document.querySelector(".cv .logo"), true);
    document.querySelectorAll(".spot .lg").forEach(function (l) { ring(l, false, "20px"); });
    tiles();
  }

  function init() {
    if (reduce) return;
    var st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);
    run();
    var t;   // tiles and spotlights are drawn later by the Hub (search, membership, partner posts)
    new MutationObserver(function () { clearTimeout(t); t = setTimeout(run, 80); })
      .observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
