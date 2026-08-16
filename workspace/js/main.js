/* ============================================================
   URBAN GUJJAR™ — main.js
   preloader, cursor, magnetic, tilt, reveal, parallax,
   count-up, nav, booking flow, confirmation
   ============================================================ */

(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- helpers ---------- */
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const qs = (sel, ctx) => (ctx || document).querySelector(sel);
  const qsa = (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  const rAF = (fn) => (prefersReduced ? fn() : requestAnimationFrame(fn));

  /* ============================================================
     PRELOADER
     ============================================================ */
  const preloader = qs("#preloader");
  const preloaderCount = qs("#preloaderCount");
  const preloaderFill = qs(".preloader__bar-fill");

  function runPreloader() {
    const steps = [
      "calling chai wala…",
      "locating nearest bhai…",
      "warming up dialogue…",
      "checking biradari…",
    ];
    let progress = 0;
    let step = 0;
    const statusEl = qs(".preloader__tag");

    function tick() {
      progress += Math.random() * 16 + 8;
      if (progress >= 100) progress = 100;
      if (preloaderCount) preloaderCount.textContent = Math.floor(progress) + "%";
      if (preloaderFill) preloaderFill.style.width = progress + "%";
      if (statusEl && Math.floor(progress) >= (step + 1) * 25 && step < steps.length - 1) {
        step++;
        statusEl.textContent = steps[step];
      }
      if (progress < 100) {
        setTimeout(tick, prefersReduced ? 0 : 60 + Math.random() * 140);
      } else {
        setTimeout(finishPreloader, 350);
      }
    }

    function finishPreloader() {
      preloader.classList.add("preloader--done");
      document.body.classList.add("is-loaded");
      setTimeout(() => {
        preloader.style.display = "none";
      }, 900);
    }

    tick();
  }

  /* ============================================================
     CUSTOM CURSOR
     ============================================================ */
  function initCursor() {
    if (!finePointer || prefersReduced) return;
    document.body.classList.add("cursor-on");

    const dot = qs("#cursorDot");
    const ring = qs("#cursorRing");
    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my;
    let visible = false;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) {
        visible = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });

    function loop() {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    }
    loop();

    const hoverables = "a, button, input, label, .char-opt__tile, .card__tilt";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(hoverables)) ring.classList.add("is-hover");
      if (e.target.closest('[data-cursor="book"], .btn--solid')) ring.classList.add("is-book");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(hoverables)) ring.classList.remove("is-hover");
      if (e.target.closest('[data-cursor="book"], .btn--solid')) ring.classList.remove("is-book");
    });

    document.addEventListener("mousedown", () => ring.classList.add("is-down"));
    document.addEventListener("mouseup", () => ring.classList.remove("is-down"));
  }

  /* ============================================================
     MAGNETIC BUTTONS
     ============================================================ */
  function initMagnetic() {
    if (prefersReduced) return;
    const items = qsa("[data-magnetic]");
    items.forEach((el) => {
      const strength = el.classList.contains("btn--lg") ? 0.35 : 0.25;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "translate(0, 0)";
      });
    });
  }

  /* ============================================================
     SCROLL REVEAL
     ============================================================ */
  function initReveal() {
    const els = qsa(".reveal-up");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = entry.target.dataset.delay ? parseInt(entry.target.dataset.delay, 10) : 0;
            setTimeout(() => entry.target.classList.add("is-in"), delay);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el, i) => {
      el.style.transitionDelay = (el.dataset.delay ? parseInt(el.dataset.delay, 10) : i % 3 * 60) + "ms";
      io.observe(el);
    });
  }

  /* ============================================================
     PARALLAX (hero lines + general [data-parallax])
     ============================================================ */
  function initParallax() {
    if (prefersReduced) return;
    const items = qsa("[data-parallax]");
    let ticking = false;

    function update() {
      const sy = window.scrollY;
      items.forEach((el) => {
        const depth = parseInt(el.dataset.parallax, 10) || 8;
        const speed = depth * 0.35;
        el.style.transform = `translateY(${sy * speed}px)`;
      });
      ticking = false;
    }

    window.addEventListener("scroll", () => {
      if (!ticking) {
        rAF(update);
        ticking = true;
      }
    });
    update();
  }

  /* ============================================================
     3D TILT CARDS
     ============================================================ */
  function initTilt() {
    if (prefersReduced) return;
    const cards = qsa("[data-tilt]");
    cards.forEach((card) => {
      const max = 10;
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rotX = (0.5 - py) * max;
        const rotY = (px - 0.5) * max;
        card.style.transform = `perspective(1200px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg)";
      });
    });
  }

  /* ============================================================
     COUNT-UP STATS
     ============================================================ */
  function initCountUp() {
    const els = qsa(".count");
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = parseFloat(el.dataset.count);
          const decimals = parseInt(el.dataset.decimals || "0", 10);
          const suffix = el.dataset.suffix || "";
          const prefix = el.dataset.prefix || "";
          const duration = prefersReduced ? 0 : 1600;
          const start = performance.now();
          io.unobserve(el);

          function frame(now) {
            const t = clamp((now - start) / duration, 0, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            const val = target * eased;
            el.textContent = prefix + val.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + suffix;
            if (t < 1) requestAnimationFrame(frame);
            else el.textContent = prefix + target.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + suffix;
          }
          requestAnimationFrame(frame);
        });
      },
      { threshold: 0.5 }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ============================================================
     NAV
     ============================================================ */
  function initNav() {
    const nav = qs("#nav");
    const burger = qs("#navBurger");
    const menu = qs("#mobileMenu");
    let lastY = window.scrollY;

    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      nav.classList.toggle("is-scrolled", y > 40);
      if (y > lastY && y > 300 && !menu.classList.contains("is-open")) nav.classList.add("is-hidden");
      else nav.classList.remove("is-hidden");
      lastY = y;
    });

    burger.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-hidden", String(!open));
    });

    menu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        menu.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ============================================================
     BOOKING
     ============================================================ */
  const JOKES = [
    "Did you know: 4 out of 5 arguments end before the chai cools down. The 5th one was about chai.",
    "Fun fact: our Settlement Specialists once ended a 20-year property feud. With biryani.",
    "Statistics say 100% of Gujjars believe in baat. The other 0% is a typo.",
    "Our negotiators can say 'Bhai, sun toh' in 16 dialects. Aunty-ji's angry voice is reserved for emergencies.",
    "Warning: prolonged exposure to Golu Karhana's entry may cause involuntary mic-dropping.",
  ];

  const ETA_MESSAGES = [
    "Gujjar assigned… finding the nearest bhai",
    "Chai order placed (Gujjar ki taraf se)",
    "Gujjar on the way… warming up dialogue",
    "Gujjar is 2 exits away… rehearsing entry",
  ];

  function initBooking() {
    const card = qs("#bookCard");
    if (!card) return;

    const charInputs = qsa('input[name="char"]', card);
    const quote = qs("#charQuote");
    const bookBtn = qs("#bookNow");
    const etaText = qs("#etaText");
    const etaBadge = qs("#etaBadge");
    const dateInput = qs("#bkDate");
    const today = new Date();

    // default date = today, min = today
    const iso = (d) => d.toISOString().split("T")[0];
    dateInput.min = iso(today);
    if (!dateInput.value) dateInput.value = iso(today);

    // character select micro-interaction
    charInputs.forEach((input) => {
      input.addEventListener("change", () => {
        if (!input.checked) return;
        quote.textContent = "“" + (input.dataset.quote || "") + "”";
        quote.style.opacity = 0;
        setTimeout(() => (quote.style.opacity = 0.9), 200);
        rotateEta();
      });
    });

    let etaRotations = 0;
    function rotateEta() {
      etaRotations++;
      const msg = ETA_MESSAGES[etaRotations % ETA_MESSAGES.length];
      etaText.style.opacity = 0;
      setTimeout(() => {
        etaText.textContent = msg;
        etaText.style.opacity = 1;
      }, 250);
      const mins = 1 + (Math.random() * 3);
      etaBadge.textContent = mins.toFixed(1) + " min";
    }
    setInterval(rotateEta, 4200);

    // magnetic-ish press feedback
    bookBtn.addEventListener("mousedown", () => (bookBtn.style.transform = "scale(0.97)"));
    bookBtn.addEventListener("mouseup", () => (bookBtn.style.transform = "scale(1)"));
    bookBtn.addEventListener("mouseleave", () => (bookBtn.style.transform = "scale(1)"));

    // BOOK NOW
    bookBtn.addEventListener("click", () => {
      const char = qsa('input[name="char"]:checked', card)[0];
      if (!char) return;
      const name = char.value;
      const date = dateInput.value || "today";
      const time = qs("#bkTime").value || "abhi";
      const loc = qs("#bkLoc").value.trim() || "Chai point (aapka risk)";
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      openConfirm(name, date, time, loc, otp);
    });
  }

  function openConfirm(name, date, time, loc, otp) {
    const overlay = qs("#confirm");
    if (!overlay) return;

    qs("#confirmSub").textContent = `${name} abhi aake matter khatam karega.`;
    qs("#ticketChar").textContent = name;
    qs("#ticketWhen").textContent = `${formatDate(date)}, ${time}`;
    qs("#ticketWhere").textContent = loc;
    qs("#ticketOtp").textContent = otp;

    overlay.classList.add("confirm--open");
    document.body.classList.add("modal-lock");

    runEta();
    cycleJokes();
  }

  function formatDate(isoStr) {
    if (!isoStr) return "aaj";
    const d = new Date(isoStr + "T00:00:00");
    if (isNaN(d)) return isoStr;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" });
  }

  function runEta() {
    const fill = qs("#etaFill");
    const count = qs("#etaCountdown");
    if (!fill || !count) return;
    let elapsed = 0;
    const total = 6;

    fill.style.width = "0%";
    const iv = setInterval(() => {
      elapsed += 1;
      const frac = elapsed / total;
      fill.style.width = (frac * 100) + "%";
      const remain = total - elapsed;
      count.textContent = remain > 0
        ? `Your Gujjar arriving in 0:0${remain}`
        : "Gujjar has arrived. Baat shuru. 🎬";
      if (elapsed >= total) {
        clearInterval(iv);
        setTimeout(() => {
          count.textContent = "Settlement: COMPLETE (theatrically)";
          fill.style.width = "100%";
        }, 600);
      }
    }, 1000);
  }

  let jokeTimer = null;
  function cycleJokes() {
    const el = qs("#confirmJoke");
    if (!el) return;
    if (jokeTimer) clearInterval(jokeTimer);
    let idx = Math.floor(Math.random() * JOKES.length);
    el.textContent = JOKES[idx];
    jokeTimer = setInterval(() => {
      idx = (idx + 1) % JOKES.length;
      el.style.opacity = 0;
      setTimeout(() => {
        el.textContent = JOKES[idx];
        el.style.opacity = 1;
      }, 300);
    }, 3500);
  }

  function initConfirmClose() {
    const overlay = qs("#confirm");
    const closeBtn = qs("#confirmClose");
    if (!overlay || !closeBtn) return;
    const close = () => {
      overlay.classList.remove("confirm--open");
      document.body.classList.remove("modal-lock");
      if (jokeTimer) clearInterval(jokeTimer);
    };
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === qs(".confirm__backdrop")) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("confirm--open")) close();
    });
  }

  /* ============================================================
     BOOT
     ============================================================ */
  document.addEventListener("DOMContentLoaded", () => {
    initCursor();
    initMagnetic();
    initReveal();
    initParallax();
    initTilt();
    initCountUp();
    initNav();
    initBooking();
    initConfirmClose();
    runPreloader();
  });
})();
