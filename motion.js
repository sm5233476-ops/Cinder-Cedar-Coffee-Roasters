/* ==========================================================================
   CINDER & CEDAR COFFEE ROASTERS — MOTION SYSTEM (motion.js)
   120Hz Inertia Scrolling, Hardware-Accelerated Reveals & Bezier Physics
   Complete Production Motion Script with 100% Lag-Free Smooth Performance
   ========================================================================== */

(function () {
  "use strict";

  // Check for Reduced Motion Preference
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --------------------------------------------------------------------------
     1. LENIS SMOOTH INERTIA SCROLL INITIALIZATION
     -------------------------------------------------------------------------- */
  let lenis = null;

  if (!prefersReducedMotion && typeof Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.0,
      infinite: false
    });

    window.lenisInstance = lenis;

    if (typeof ScrollTrigger !== "undefined") {
      lenis.on("scroll", ScrollTrigger.update);

      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });

      // Buffer frame pacing so scrolling never hitches
      gsap.ticker.lagSmoothing(500, 33);
    }
  }

  /* --------------------------------------------------------------------------
     2. SMOOTH ANCHOR NAVIGATION (WITH NAVBAR OFFSET)
     -------------------------------------------------------------------------- */
  function setupSmoothAnchorLinks() {
    const links = document.querySelectorAll("[data-scroll-to]");
    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        const targetId = link.getAttribute("data-scroll-to") || link.getAttribute("href");
        if (!targetId || !targetId.startsWith("#")) return;

        const targetEl = document.querySelector(targetId);
        if (!targetEl) return;

        e.preventDefault();

        const mobileDrawer = document.getElementById("mobile-nav-drawer");
        if (mobileDrawer && mobileDrawer.classList.contains("is-open")) {
          mobileDrawer.classList.remove("is-open");
          document.body.classList.remove("lenis-stopped");
        }

        if (lenis) {
          lenis.scrollTo(targetEl, {
            offset: -72,
            duration: 1.1
          });
        } else {
          targetEl.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     3. SCROLL PROGRESS LINE & SMART STICKY NAVBAR
     -------------------------------------------------------------------------- */
  function setupScrollDynamics() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    gsap.to("#scroll-progress", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.15
      }
    });

    const header = document.getElementById("site-header");
    if (!header) return;

    let lastScrollY = 0;
    ScrollTrigger.create({
      start: "top top",
      end: "max",
      onUpdate: (self) => {
        const currentY = self.scroll();
        if (currentY > 120 && currentY > lastScrollY && !header.classList.contains("nav-hidden")) {
          header.classList.add("nav-hidden");
        } else if (currentY < lastScrollY && header.classList.contains("nav-hidden")) {
          header.classList.remove("nav-hidden");
        }
        lastScrollY = currentY;
      }
    });
  }

  /* --------------------------------------------------------------------------
     4. HERO SECTION CHOREOGRAPHY
     -------------------------------------------------------------------------- */
  function setupHeroAnimation() {
    if (prefersReducedMotion || typeof gsap === "undefined") return;

    const heroTl = gsap.timeline({ defaults: { ease: "power4.out" } });

    heroTl.fromTo(
      ".hero-media-wrapper",
      { clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" },
      { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", duration: 1.2 }
    );

    heroTl.fromTo(
      "#hero-img",
      { scale: 1.12 },
      { scale: 1.0, duration: 1.6, ease: "power2.out" },
      0
    );

    heroTl.from(
      ".hero-badge",
      { opacity: 0, y: 20, duration: 0.8 },
      0.35
    );

    heroTl.from(
      "#hero-title",
      { opacity: 0, y: 35, duration: 0.9 },
      0.5
    );

    heroTl.from(
      "#hero-subtext",
      { opacity: 0, y: 25, duration: 0.8 },
      0.7
    );

    heroTl.from(
      "#hero-actions .btn",
      { opacity: 0, y: 20, stagger: 0.1, duration: 0.8 },
      0.85
    );
  }

  /* --------------------------------------------------------------------------
     5. SECTION ENTRANCE REVEALS (ZERO JANK / ZERO SCROLL CONFLICT)
     One-time GPU-accelerated reveals eliminate scroll stutter on laptops.
     -------------------------------------------------------------------------- */
  function setupSectionReveals() {
    if (prefersReducedMotion || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    // Smooth Entrance Reveal for Subscribe Photo
    const subscribeMedia = document.querySelector(".subscribe-media");
    if (subscribeMedia) {
      gsap.fromTo(
        subscribeMedia,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: subscribeMedia,
            start: "top 82%",
            once: true
          }
        }
      );
    }

    // Reviews Staggered Slide-In
    const reviewCards = document.querySelectorAll(".review-card");
    if (reviewCards.length > 0) {
      gsap.from(reviewCards, {
        opacity: 0,
        y: 35,
        stagger: 0.12,
        duration: 0.85,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "#reviews-grid",
          start: "top 80%",
          once: true
        }
      });
    }

    // Roastery Photos Smooth Entrance (No Continuous Scrubbing = Zero Lag)
    const photoMain = document.querySelector(".roastery-photo-main");
    const photoAccent = document.querySelector(".roastery-photo-accent");

    if (photoMain) {
      gsap.fromTo(
        photoMain,
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".roastery-images-composite",
            start: "top 80%",
            once: true
          }
        }
      );
    }

    if (photoAccent) {
      gsap.fromTo(
        photoAccent,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1.0,
          delay: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".roastery-images-composite",
            start: "top 80%",
            once: true
          }
        }
      );
    }

    // Dynamic Stats Count-Up
    const statsRow = document.querySelector(".roastery-stats-row");
    if (statsRow) {
      ScrollTrigger.create({
        trigger: statsRow,
        start: "top 85%",
        once: true,
        onEnter: () => {
          animateCounter("stat-coffees");
          animateCounter("stat-origins");
          animateCounter("stat-roasts");
        }
      });
    }
  }

  function animateCounter(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const target = parseInt(el.textContent, 10) || 0;
    const obj = { val: 0 };

    gsap.to(obj, {
      val: target,
      duration: 1.4,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = String(Math.floor(obj.val));
      }
    });
  }

  /* --------------------------------------------------------------------------
     6. PRODUCT GRID RE-RENDER ANIMATION
     -------------------------------------------------------------------------- */
  function animateProductCards() {
    if (typeof gsap === "undefined") return;

    const cards = document.querySelectorAll(".product-card");
    if (cards.length === 0) return;

    gsap.fromTo(
      cards,
      { opacity: 0, y: 24, rotation: 0.5 },
      {
        opacity: 1,
        y: 0,
        rotation: 0,
        duration: 0.7,
        stagger: 0.06,
        ease: "power2.out"
      }
    );
  }

  /* --------------------------------------------------------------------------
     7. FROM FARM TO CUP (SOLID STAGGERED REVEAL)
     -------------------------------------------------------------------------- */
  function setupStorySectionAnimation() {
    if (prefersReducedMotion || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    const panels = document.querySelectorAll(".story-panel");
    if (panels.length === 0) return;

    gsap.from(panels, {
      opacity: 0,
      y: 35,
      duration: 0.8,
      stagger: 0.1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: "#story-panels-track",
        start: "top 82%",
        once: true
      }
    });
  }

  /* --------------------------------------------------------------------------
     8. BEZIER FLY-TO-CART & BADGE BUMP ANIMATION
     -------------------------------------------------------------------------- */
  function setupFlyToCartListener() {
    document.addEventListener("cart:item-added", (e) => {
      if (prefersReducedMotion || typeof gsap === "undefined") return;

      const { startRect, product } = e.detail;
      const cartBtn = document.getElementById("nav-cart-btn");
      if (!startRect || !cartBtn) return;

      const cartRect = cartBtn.getBoundingClientRect();

      const flyer = document.createElement("div");
      flyer.className = "cart-flyer-clone";
      flyer.style.position = "fixed";
      flyer.style.left = `${startRect.left + startRect.width / 2 - 20}px`;
      flyer.style.top = `${startRect.top + startRect.height / 2 - 20}px`;
      flyer.style.width = "40px";
      flyer.style.height = "40px";
      flyer.style.borderRadius = "50%";
      flyer.style.backgroundColor = product.bagColor || "#C2512A";
      flyer.style.boxShadow = "0 8px 24px rgba(42, 26, 18, 0.35)";
      flyer.style.zIndex = "9999";
      flyer.style.pointerEvents = "none";
      flyer.style.display = "flex";
      flyer.style.alignItems = "center";
      flyer.style.justifyContent = "center";
      flyer.innerHTML = `<span style="color:#FFF; font-size:16px;">✦</span>`;

      document.body.appendChild(flyer);

      const destX = cartRect.left + cartRect.width / 2 - (startRect.left + startRect.width / 2);
      const destY = cartRect.top + cartRect.height / 2 - (startRect.top + startRect.height / 2);

      gsap.to(flyer, {
        duration: 0.65,
        ease: "power3.inOut",
        x: destX,
        y: destY,
        scale: 0.3,
        opacity: 0.7,
        onComplete: () => {
          flyer.remove();
          bumpCartBadge();
        }
      });
    });
  }

  function bumpCartBadge() {
    const badge = document.getElementById("cart-badge");
    if (!badge || typeof gsap === "undefined") return;

    gsap.fromTo(
      badge,
      { scale: 1.6 },
      { scale: 1, duration: 0.45, ease: "back.out(2.5)" }
    );
  }

  /* --------------------------------------------------------------------------
     9. MAGNETIC BUTTONS & SUBTLE CURSOR FOLLOWER
     -------------------------------------------------------------------------- */
  function setupMagneticAndCursor() {
    const isPointerFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!isPointerFine || prefersReducedMotion) return;

    const cursor = document.getElementById("custom-cursor");

    if (cursor) {
      window.addEventListener("mousemove", (e) => {
        cursor.style.opacity = "1";
        gsap.to(cursor, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.12,
          ease: "power2.out"
        });
      });

      document.addEventListener("mouseleave", () => {
        cursor.style.opacity = "0";
      });
    }

    document.querySelectorAll(".btn-magnetic").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(btn, {
          x: x * 0.28,
          y: y * 0.28,
          duration: 0.3,
          ease: "power2.out"
        });

        if (cursor) {
          gsap.to(cursor, { scale: 1.8, borderColor: "#C2512A", duration: 0.2 });
        }
      });

      btn.addEventListener("mouseleave", () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: "elastic.out(1, 0.4)"
        });

        if (cursor) {
          gsap.to(cursor, { scale: 1, borderColor: "var(--color-terracotta)", duration: 0.2 });
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     10. INITIALIZATION & REFRESH HOOKS
     -------------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    setupSmoothAnchorLinks();
    setupScrollDynamics();
    setupHeroAnimation();
    setupSectionReveals();
    setupStorySectionAnimation();
    setupFlyToCartListener();
    setupMagneticAndCursor();
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (typeof ScrollTrigger !== "undefined") {
        ScrollTrigger.refresh();
      }
    });
  }

  window.addEventListener("load", () => {
    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh();
    }
  });

  document.addEventListener("shop:rendered", () => {
    animateProductCards();
  });

})();
