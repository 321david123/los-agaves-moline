/* =========================================================
   LOS AGAVES MEXICAN GRILL — interactions
   Lenis smooth scroll + GSAP ScrollTrigger + Swiper
   ========================================================= */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Lenis smooth scroll (single rAF driver) ---------- */
  var lenis = null;
  if (!prefersReduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  /* ---------- GSAP + ScrollTrigger ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) { lenis.on("scroll", ScrollTrigger.update); }

    /* Reveal on scroll */
    gsap.utils.toArray("[data-reveal]").forEach(function (el) {
      ScrollTrigger.create({
        trigger: el,
        start: "top 86%",
        once: true,
        onEnter: function () { el.classList.add("is-visible"); }
      });
    });

    if (!prefersReduced) {
      /* Hero parallax (background drifts up) */
      var heroImg = document.getElementById("heroImg");
      if (heroImg) {
        gsap.to(heroImg, {
          yPercent: 12, ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
        });
      }

      /* Parallax on tagged media images */
      gsap.utils.toArray("[data-parallax]").forEach(function (img) {
        gsap.fromTo(img, { yPercent: -7 }, {
          yPercent: 7, ease: "none",
          scrollTrigger: { trigger: img.closest("[data-parallax-wrap]") || img, start: "top bottom", end: "bottom top", scrub: true }
        });
      });

      /* Letter stagger on signature titles */
      gsap.utils.toArray("[data-letters]").forEach(function (title) {
        var text = title.textContent;
        title.innerHTML = "";
        text.split("").forEach(function (ch) {
          var s = document.createElement("span");
          s.className = "ltr";
          s.textContent = ch === " " ? " " : ch;
          title.appendChild(s);
        });
        gsap.from(title.querySelectorAll(".ltr"), {
          yPercent: 110, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.022,
          scrollTrigger: { trigger: title, start: "top 85%", once: true }
        });
      });
    }
  } else {
    /* No GSAP — reveal everything */
    document.querySelectorAll("[data-reveal]").forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Stat counters ---------- */
  (function () {
    var stats = document.querySelectorAll(".stat__num[data-count]");
    if (!stats.length) return;
    function animate(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var suffix = el.getAttribute("data-suffix") || "";
      var isYear = target >= 1900 && decimals === 0 && !suffix;
      var dur = 1400, start = null;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = target * eased;
        el.textContent = (isYear ? Math.round(val).toString() : val.toFixed(decimals)) + (p === 1 ? suffix : (suffix ? suffix : ""));
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = (isYear ? Math.round(target).toString() : target.toFixed(decimals)) + suffix;
      }
      requestAnimationFrame(step);
    }
    if (window.ScrollTrigger) {
      stats.forEach(function (el) {
        ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: function () { animate(el); } });
      });
    } else {
      stats.forEach(animate);
    }
  })();

  /* ---------- Nav: transparent -> solid on scroll ---------- */
  (function () {
    var nav = document.getElementById("nav");
    if (!nav) return;
    function onScroll() {
      if (window.scrollY > 60) nav.classList.add("is-solid");
      else nav.classList.remove("is-solid");
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  })();

  /* ---------- Mobile overlay ---------- */
  (function () {
    var toggle = document.getElementById("navToggle");
    var overlay = document.getElementById("overlay");
    var close = document.getElementById("overlayClose");
    if (!toggle || !overlay) return;
    function open() {
      overlay.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      if (lenis) lenis.stop();
      document.body.style.overflow = "hidden";
    }
    function shut() {
      overlay.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      if (lenis) lenis.start();
      document.body.style.overflow = "";
    }
    toggle.addEventListener("click", open);
    if (close) close.addEventListener("click", shut);
    overlay.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", shut); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") shut(); });
  })();

  /* ---------- Smooth anchor scrolling (Lenis) ---------- */
  (function () {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id === "#" || id === "#top") {
          e.preventDefault();
          if (lenis) lenis.scrollTo(0); else window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        var target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          if (lenis) lenis.scrollTo(target, { offset: -70 });
          else target.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  })();

  /* ---------- Menu tabs ---------- */
  (function () {
    var tabs = document.querySelectorAll(".menu__tab");
    var panels = document.querySelectorAll(".menu__panel");
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var name = tab.getAttribute("data-tab");
        tabs.forEach(function (t) { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
        tab.classList.add("is-active"); tab.setAttribute("aria-selected", "true");
        panels.forEach(function (p) {
          p.classList.toggle("is-active", p.getAttribute("data-panel") === name);
        });
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      });
    });
  })();

  /* ---------- Highlight current day in hours ---------- */
  (function () {
    var rows = document.querySelectorAll("#hours tbody tr");
    if (!rows.length) return;
    var day = new Date().getDay(); // 0=Sun..6=Sat
    var idx = day === 0 ? 6 : day - 1; // table is Mon..Sun
    if (rows[idx]) rows[idx].classList.add("is-now");
  })();

  /* ---------- Swiper: gallery ---------- */
  if (window.Swiper) {
    new Swiper(".gallery__swiper", {
      slidesPerView: "auto",
      spaceBetween: 18,
      grabCursor: true,
      navigation: { prevEl: ".gallery__btn--prev", nextEl: ".gallery__btn--next" }
    });

    new Swiper(".reviews__swiper", {
      slidesPerView: 1,
      loop: true,
      autoplay: prefersReduced ? false : { delay: 5200, disableOnInteraction: false },
      pagination: { el: ".reviews__dots", clickable: true }
    });
  }
})();
