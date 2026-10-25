/* SAL Digital concept demo: order basket and motion. No tracking, no network calls. */
(function () {
  var cfg = JSON.parse(document.getElementById("cfg").textContent);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (n) { return "£" + n.toFixed(2); };

  /* ---------- order state ---------- */
  var items = {};
  $$(".item").forEach(function (li) {
    items[li.dataset.id] = { id: li.dataset.id, name: li.dataset.name, price: parseFloat(li.dataset.price) };
  });
  var qty = {};
  var KEY = "demo-order-" + cfg.name;
  try { qty = JSON.parse(sessionStorage.getItem(KEY) || "{}"); } catch (e) { qty = {}; }
  Object.keys(qty).forEach(function (k) { if (!items[k]) delete qty[k]; });

  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(qty)); } catch (e) {} }
  function count() { return Object.keys(qty).reduce(function (n, k) { return n + qty[k]; }, 0); }
  function total() { return Object.keys(qty).reduce(function (n, k) { return n + qty[k] * items[k].price; }, 0); }

  function waLink() {
    var lines = Object.keys(qty).map(function (k) {
      return qty[k] + " x " + items[k].name + " (" + money(qty[k] * items[k].price) + ")";
    });
    var who = ($("#cust").value || "").trim();
    var msg = "Hi " + cfg.name + ", I'd like to order for collection:\n\n" + lines.join("\n") +
      "\n\nTotal: " + money(total()) + " (pay on collection)" + (who ? "\nName: " + who : "");
    return "https://wa.me/" + cfg.wa + "?text=" + encodeURIComponent(msg);
  }

  function render() {
    var n = count();
    $$("[data-count]").forEach(function (b) { b.textContent = n; });
    var ul = $("#lines");
    ul.innerHTML = "";
    Object.keys(qty).forEach(function (k) {
      var li = document.createElement("li");
      li.className = "line";
      li.innerHTML = '<div><div class="line-name"></div><div class="line-sub"></div></div>' +
        '<div class="qty"><button data-dec="' + k + '" aria-label="Remove one">−</button><span></span><button data-inc="' + k + '" aria-label="Add one">+</button></div>';
      $(".line-name", li).textContent = items[k].name;
      $(".line-sub", li).textContent = money(qty[k] * items[k].price);
      $("span", li).textContent = qty[k];
      ul.appendChild(li);
    });
    $("#empty").hidden = n > 0;
    $("#total").textContent = money(total());
    var send = $("#send");
    send.setAttribute("aria-disabled", n ? "false" : "true");
    send.href = n ? waLink() : "#";
    $(".bar").classList.toggle("on", n > 0);
    save();
  }

  function add(id, btn) {
    qty[id] = (qty[id] || 0) + 1;
    if (btn) { btn.classList.remove("pop"); void btn.offsetWidth; btn.classList.add("pop"); }
    render();
  }

  document.addEventListener("click", function (ev) {
    var t = ev.target.closest("button, a");
    if (!t) return;
    var li = t.closest(".item");
    if (t.classList.contains("add") && li) return add(li.dataset.id, t);
    if (t.dataset.add) { add(t.dataset.add); return openDrawer(); }
    if (t.dataset.inc) { qty[t.dataset.inc]++; return render(); }
    if (t.dataset.dec) { qty[t.dataset.dec]--; if (qty[t.dataset.dec] <= 0) delete qty[t.dataset.dec]; return render(); }
    if (t.hasAttribute("data-open")) return openDrawer();
    if (t.hasAttribute("data-close")) return closeDrawer();
  });
  $(".scrim").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });
  $("#cust").addEventListener("input", render);

  function openDrawer() { document.body.classList.add("open"); $("#drawer").setAttribute("aria-hidden", "false"); }
  function closeDrawer() { document.body.classList.remove("open"); $("#drawer").setAttribute("aria-hidden", "true"); }

  /* ---------- menu tabs ---------- */
  $$(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      $$(".tab").forEach(function (x) { x.setAttribute("aria-selected", x === tab ? "true" : "false"); });
      $$(".cat").forEach(function (c) { c.hidden = c.id !== "cat-" + tab.dataset.cat; });
    });
  });

  /* ---------- motion ---------- */
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hero = $("#hero");
  var lenis = null;

  function fitWord() {
    var span = $(".word span");
    if (!span) return;
    span.style.fontSize = "100px";
    var w = span.scrollWidth;
    var size = 100 * (window.innerWidth * 0.94) / w;
    span.style.fontSize = Math.min(size, window.innerHeight * 0.4) + "px";
  }
  fitWord();
  window.addEventListener("resize", fitWord);

  if (!calm && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    gsap.from(".hl span", { yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.12, delay: 0.15 });
    gsap.from(".hero .eyebrow, .hero .sub, .cta-row", { y: 22, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.1, delay: 0.5 });
    gsap.from(".subject", { y: 80, opacity: 0, duration: 1.3, ease: "power3.out", delay: 0.2 });

    var tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: hero, start: "top top", end: "bottom bottom", scrub: 0.6 } });
    tl.to(".plate", { yPercent: 6, scale: 1.08 }, 0)
      .to(".word", { yPercent: -26 }, 0)
      .to(".subject", { scale: 1.16, yPercent: -3, rotation: -4, transformOrigin: "50% 85%" }, 0)
      .to(".fx", { yPercent: -8 }, 0)
      .to([".hero-top", ".sub"], { yPercent: -30, opacity: 0, duration: 0.18 }, 0.28)
      .fromTo(".beat2", { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 0.2 }, 0.52)
      .to(".beat2", { opacity: 0, y: -20, duration: 0.14 }, 0.88);

    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      var mv = { plate: gsap.quickTo(".plate", "x", { duration: 0.9 }), word: gsap.quickTo(".word", "x", { duration: 0.9 }), dish: gsap.quickTo(".subject", "x", { duration: 0.9 }) };
      window.addEventListener("pointermove", function (ev) {
        var nx = ev.clientX / window.innerWidth - 0.5;
        mv.plate(nx * -10); mv.word(nx * -22); mv.dish(nx * 30);
      }, { passive: true });
    }
  }

  /* ---------- breakdown: the dish comes apart, holds, then rebuilds into the order button ---------- */
  var bd = $(".bd");
  if (bd) {
    var mode = bd.dataset.mode, pcs = $$(".pc", bd), n = pcs.length, mid = (n - 1) / 2;
    var labs = $$(".bd-lab", bd), caps = $$(".cap", bd), fls = $$(".fl", bd), stage = $(".bd-stage", bd);
    var cx = parseFloat(bd.dataset.cx || 0.5), cy = parseFloat(bd.dataset.cy || 0.5);
    if (mode === "radial") {
      pcs.forEach(function (pc, i) {
        var a0 = -Math.PI / 2 + i * 2 * Math.PI / n, a1 = a0 + 2 * Math.PI / n, pts = [cx * 100 + "% " + cy * 100 + "%"];
        for (var k = 0; k <= 6; k++) {
          var a = a0 + (a1 - a0) * k / 6;
          pts.push((cx * 100 + Math.cos(a) * 150) + "% " + (cy * 100 + Math.sin(a) * 150) + "%");
        }
        $("img", pc).style.clipPath = "polygon(" + pts.join(",") + ")";
        pc.dataset.ang = (a0 + a1) / 2;
      });
    }
    var spread = function () { return window.innerWidth < 761 ? Math.min(window.innerHeight * 0.068, 60) : Math.min(window.innerHeight * 0.075, 66); };
    var sw = function () { return stage.offsetWidth; };
    var ring = function (i, axis, k) {
      var a = -Math.PI / 2 + (i + 0.5) * 2 * Math.PI / fls.length, r = sw() * (window.innerWidth < 761 ? 0.56 : 0.66) * (k || 1);
      return axis === "x" ? Math.cos(a) * r : Math.sin(a) * r * 0.92;
    };
    var outX = function (pc, k) { return Math.cos(+pc.dataset.ang) * sw() * k; };
    var outY = function (pc, k) { return Math.sin(+pc.dataset.ang) * sw() * k; };

    /* on phones, captions and the spice line sit just under the dish, wherever the dish lands */
    var below = $$(".bd-caps, .bd-spices", bd);
    var placeBelow = function () {
      below.forEach(function (el) {
        if (window.innerWidth > 760) { el.style.top = ""; el.style.bottom = ""; return; }
        var extra = mode === "radial" ? sw() * 0.14 + 18 : spread() * (n - 1) / 2 + 26;
        el.style.top = stage.offsetTop + stage.offsetHeight + extra + "px";
        el.style.bottom = "auto";
      });
    };
    placeBelow();
    window.addEventListener("resize", placeBelow);

    if (!calm && window.gsap && window.ScrollTrigger) {
      gsap.set(fls, { xPercent: -50, yPercent: -50 });
      var t2 = gsap.timeline({ defaults: { ease: "power2.inOut" }, scrollTrigger: { trigger: bd, start: "top top", end: "bottom bottom", scrub: 0.7, invalidateOnRefresh: true } });
      t2.from(stage, { scale: 0.86, opacity: 0.3, duration: 0.1, ease: "none" }, 0);
      if (mode === "stack") {
        pcs.forEach(function (pc, i) {
          t2.to(pc, { y: function () { return (i - mid) * spread(); }, x: function () { return (i % 2 ? -1 : 1) * sw() * 0.03; }, rotation: (i % 2 ? -1 : 1) * 2.5, duration: 0.3 }, 0.1 + i * 0.025);
        });
        t2.to(labs, { opacity: 1, duration: 0.07, stagger: 0.035 }, 0.3);
        fls.forEach(function (f, i) {
          t2.fromTo(f, { x: function () { return ring(i, "x", 2.6); }, y: function () { return ring(i, "y", 2.6); }, rotation: -60 + i * 30, opacity: 0 },
            { x: function () { return ring(i, "x"); }, y: function () { return ring(i, "y"); }, rotation: i * 18, opacity: 1, duration: 0.3, ease: "power3.out" }, 0.12 + i * 0.03);
        });
        if (fls.length) t2.to(".bd-spices", { opacity: 1, duration: 0.07 }, 0.44).to(".bd-spices", { opacity: 0, duration: 0.05 }, 0.72);
        t2.to(labs, { opacity: 0, duration: 0.05 }, 0.72)
          .to(pcs, { y: 0, x: 0, rotation: 0, duration: 0.15 }, 0.74);
        if (fls.length) t2.to(fls, { x: function (i) { return ring(i, "x", 0.9); }, y: function (i) { return ring(i, "y", 0.9); }, scale: 0.8, duration: 0.15 }, 0.74);
      } else {
        pcs.forEach(function (pc) { t2.to(pc, { x: function () { return outX(pc, 0.035); }, y: function () { return outY(pc, 0.035); }, duration: 0.1 }, 0.1); });
        var step = 0.54 / n;
        pcs.forEach(function (pc, i) {
          var at = 0.2 + i * step;
          t2.to(pc, { x: function () { return outX(pc, 0.17); }, y: function () { return outY(pc, 0.17); }, scale: 1.06, duration: step * 0.5 }, at)
            .to(pc, { x: function () { return outX(pc, 0.035); }, y: function () { return outY(pc, 0.035); }, scale: 1, duration: step * 0.5 }, at + step * 0.5)
            .to(caps[i], { opacity: 1, duration: step * 0.3 }, at)
            .to(caps[i], { opacity: 0, duration: step * 0.3 }, at + step * 0.7);
        });
        t2.to(pcs, { x: 0, y: 0, duration: 0.1 }, 0.78);
      }
      t2.fromTo(".bd-out", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.86)
        .to({}, { duration: 0.01 }, 0.99);
    } else {
      /* reduced motion: a still, exploded view with every label showing */
      var place = function () {
        pcs.forEach(function (pc, i) {
          pc.style.transform = mode === "stack" ? "translateY(" + (i - mid) * spread() + "px)" : "translate(" + outX(pc, 0.05) + "px," + outY(pc, 0.05) + "px)";
        });
        fls.forEach(function (f, i) { f.style.transform = "translate(calc(-50% + " + ring(i, "x") + "px), calc(-50% + " + ring(i, "y") + "px))"; });
      };
      place();
      window.addEventListener("resize", place);
    }
  }

  /* anchors and the order drawer cooperate with smooth scroll */
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest('a[href^="#"]');
    if (!a || a.getAttribute("href") === "#") return;
    var t = document.querySelector(a.getAttribute("href"));
    if (!t) return;
    ev.preventDefault();
    if (lenis) lenis.scrollTo(t, { offset: -10 }); else t.scrollIntoView({ behavior: calm ? "auto" : "smooth" });
  });
  var drawerWatch = new MutationObserver(function () {
    if (!lenis) return;
    if (document.body.classList.contains("open")) lenis.stop(); else lenis.start();
  });
  drawerWatch.observe(document.body, { attributes: true, attributeFilter: ["class"] });

  /* steam and a few embers in the foreground plane, paused when off screen */
  (function fx() {
    var cv = $(".fx");
    if (!cv || calm) return;
    var ctx = cv.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, live = true, last = 0, puffs = [], sparks = [];
    var glow = getComputedStyle(document.documentElement).getPropertyValue("--glow").trim() || "#ff8a3d";
    function size() {
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function puff(initial) {
      return { x: W * (0.22 + Math.random() * 0.56), y: H * (initial ? 0.3 + Math.random() * 0.5 : 0.78), r: 50 + Math.random() * 70, vy: 10 + Math.random() * 18, life: 0, max: 7 + Math.random() * 5, d: (Math.random() - 0.5) * 8 };
    }
    function spark(initial) {
      return { x: W * (0.2 + Math.random() * 0.6), y: H * (initial ? 0.3 + Math.random() * 0.6 : 0.85), vy: 30 + Math.random() * 50, s: 1 + Math.random() * 1.8, life: 0, max: 4 + Math.random() * 4, ph: Math.random() * 6 };
    }
    size();
    for (var i = 0; i < 14; i++) puffs.push(puff(true));
    for (var j = 0; j < 12; j++) sparks.push(spark(true));
    window.addEventListener("resize", size);
    new IntersectionObserver(function (es) { live = es[0].isIntersecting; if (live) { last = 0; requestAnimationFrame(frame); } }).observe(hero);
    function frame(ts) {
      if (!live) return;
      var dt = last ? Math.min((ts - last) / 1000, 0.05) : 0.016;
      last = ts;
      ctx.clearRect(0, 0, W, H);
      puffs.forEach(function (p, k) {
        p.life += dt; p.y -= p.vy * dt; p.x += p.d * dt; p.r += 6 * dt;
        var u = p.life / p.max;
        if (u >= 1) { puffs[k] = puff(false); return; }
        var a = Math.sin(Math.PI * u) * 0.07;
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, "rgba(255,255,255," + a + ")");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      });
      ctx.fillStyle = glow;
      sparks.forEach(function (p, k) {
        p.life += dt; p.y -= p.vy * dt; p.x += Math.sin(p.life * 2 + p.ph) * 14 * dt;
        var u = p.life / p.max;
        if (u >= 1) { sparks[k] = spark(false); return; }
        ctx.globalAlpha = Math.sin(Math.PI * u) * 0.85;
        ctx.fillRect(p.x, p.y, p.s, p.s);
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  var targets = $$(".steps li, .feature-copy, .feature img, .item, .visit-grid > *, .menu .tabs");
  if (calm || !("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("in"); });
  } else {
    targets.forEach(function (el) { el.classList.add("rv"); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (el) { io.observe(el); });
  }

  render();
})();
