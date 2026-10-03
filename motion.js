/* ==========================================================================
   CINDER & CEDAR COFFEE ROASTERS — MOTION SYSTEM (motion.js)
   120Hz Inertia Scrolling, Parallax Headroom fromTo & Curtain Fail-Safe
   Complete Production Motion Script with Zero-Conflict Transforms
   ========================================================================== */

(function () {
  "use strict";

  /* --------------------------------------------------------------------------
     RULE 1: IMAGE_MOTION SWITCH ("full" | "lite" | "none")
     Change this value on Line 12 to test performance modes.
     -------------------------------------------------------------------------- */
  const IMAGE_MOTION = "full"; // "full" | "lite" | "none"

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isDesktop = window.matchMedia("(min-width: 992px)").matches;

  // Parallax is strictly enabled ONLY when mode is "full", on desktop (992px+), fine pointer (no touch), and reduced-motion is OFF
  const allowParallax = IMAGE_MOTION === "full" && !prefersReducedMotion && isFinePointer && isDesktop;

  /* --------------------------------------------------------------------------
     RULE 8: LENIS DRIVEN BY EXACTLY ONE LOOP (autoRaf: false + gsap.ticker)
     -------------------------------------------------------------------------- */
  let lenis = null;

  if (!prefersReducedMotion && typeof Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.0,
      autoRaf: false, // Rule 8: Prevents Lenis from running its own internal RAF loop
      infinite: false
    });

    window.lenisInstance = lenis;

    if (typeof ScrollTrigger !== "undefined") {
      // Rule 8: ScrollTrigger.update is called ONLY from lenis.on('scroll')
      lenis.on("scroll", ScrollTrigger.update);

      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });

      gsap.ticker.lagSmoothing(500, 33);
    }
  }

  /* --------------------------------------------------------------------------
     SMOOTH ANCHOR NAVIGATION (WITH NAVBAR OFFSET & JUMP REVEAL CATCH-UP)
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
            duration: 1.1,
            onComplete: () => {
              // Point 3d: Jumps past photos ensure curtains end at scaleY(0)
              document.querySelectorAll(".media-curtain").forEach((curtain) => {
                if (curtain.getBoundingClientRect().top < window.innerHeight) {
                  curtain.style.transform = "scaleY(0)";
                }
              });
            }
          });
        } else {
          targetEl.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     SCROLL PROGRESS LINE & SMART STICKY NAVBAR
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
     HERO SECTION CHOREOGRAPHY (POINTS 2 & 3)
     Curtain scaleY 1->0, img scale 1.12->1, hero parallax fromTo (-3% to +3%)
     -------------------------------------------------------------------------- */
  function setupHeroAnimation() {
    const heroCurtain = document.querySelector(".hero-curtain");
    const heroImg = document.getElementById("hero-img");

    if (IMAGE_MOTION === "none" || prefersReducedMotion || typeof gsap === "undefined") {
      if (heroCurtain) heroCurtain.style.transform = "scaleY(0)";
      return;
    }

    if (IMAGE_MOTION === "lite") {
      if (heroCurtain) heroCurtain.style.transform = "scaleY(0)";
      if (heroImg) {
        heroImg.style.willChange = "transform, opacity";
        gsap.fromTo(
          heroImg,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power2.out",
            onComplete: () => {
              heroImg.style.willChange = "auto";
            }
          }
        );
      }
    } else if (IMAGE_MOTION === "full") {
      if (heroCurtain && heroImg) {
        heroCurtain.style.willChange = "transform";
        heroImg.style.willChange = "transform";

        const heroTl = gsap.timeline({
          defaults: { ease: "expo.out", duration: 1.1 },
          onComplete: () => {
            heroCurtain.style.willChange = "auto";
            heroImg.style.willChange = "auto";
          }
        });

        heroTl.fromTo(
          heroCurtain,
          { scaleY: 1 },
          { scaleY: 0, duration: 1.1 },
          0
        );

        heroTl.fromTo(
          heroImg,
          { scale: 1.12 },
          { scale: 1.0, duration: 1.1 },
          0
        );
      }

      // Point 2: Hero Parallax fromTo (-3% to +3% = Total 6% delta, centered in top -7.5%)
      if (allowParallax && heroImg) {
        gsap.fromTo(
          heroImg,
          { yPercent: -3 },
          {
            yPercent: 3,
            ease: "none",
            scrollTrigger: {
              trigger: "#hero-section",
              start: "top top",
              end: "bottom top",
              scrub: true
            }
          }
        );
      }
    }

    // Hero Typography & CTAs Sequence
    const textTl = gsap.timeline({ defaults: { ease: "power4.out" } });
    textTl.from(".hero-badge", { opacity: 0, y: 20, duration: 0.8 }, 0.35);
    textTl.from("#hero-title", { opacity: 0, y: 35, duration: 0.9 }, 0.5);
    textTl.from("#hero-subtext", { opacity: 0, y: 25, duration: 0.8 }, 0.7);
    textTl.from("#hero-actions .btn", { opacity: 0, y: 20, stagger: 0.1, duration: 0.8 }, 0.85);
  }

  /* --------------------------------------------------------------------------
     SECTION IMAGE REVEALS & PARALLAX (POINTS 1, 2, 3d)
     -------------------------------------------------------------------------- */
  function setupImageRevealsAndParallax() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    const revealTargets = [
      {
        frame: document.querySelector(".subscribe-frame"),
        curtain: document.querySelector(".subscribe-curtain"),
        img: document.querySelector(".subscribe-img"),
        isParallax: false
      },
      {
        frame: document.querySelector(".roastery-main-frame"),
        curtain: document.querySelector(".roastery-main-frame .roastery-curtain"),
        img: document.querySelector(".roastery-photo-main"),
        isParallax: true,
        speed: 5 // Point 2: -2.5% to +2.5% (Total 5%)
      },
      {
        frame: document.querySelector(".roastery-accent-frame"),
        curtain: document.querySelector(".roastery-accent-frame .roastery-curtain"),
        img: document.querySelector(".roastery-photo-accent"),
        isParallax: true,
        speed: 9 // Point 2: -4.5% to +4.5% (Total 9%)
      }
    ];

    revealTargets.forEach((target) => {
      if (!target.frame || !target.img) return;

      // Point 3d: Handle page reloaded while already scrolled halfway past photo
      const rect = target.frame.getBoundingClientRect();
      const isAlreadyPast = rect.top < window.innerHeight * 0.8;

      if (IMAGE_MOTION === "none" || prefersReducedMotion) {
        if (target.curtain) target.curtain.style.transform = "scaleY(0)";
        if (!target.isParallax) target.frame.classList.add("is-revealed");
        return;
      }

      if (isAlreadyPast) {
        if (target.curtain) target.curtain.style.transform = "scaleY(0)";
        if (!target.isParallax) {
          target.frame.classList.add("is-revealed");
          gsap.set(target.img, { clearProps: "transform" });
        }
      }

      if (IMAGE_MOTION === "lite") {
        if (target.curtain) target.curtain.style.transform = "scaleY(0)";
        if (!isAlreadyPast) {
          target.img.style.willChange = "transform, opacity";
          gsap.fromTo(
            target.img,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.85,
              ease: "power2.out",
              scrollTrigger: {
                trigger: target.frame,
                start: "top 80%",
                once: true
              },
              onComplete: () => {
                target.img.style.willChange = "auto";
                if (!target.isParallax) {
                  gsap.set(target.img, { clearProps: "transform" });
                  target.frame.classList.add("is-revealed");
                }
              }
            }
          );
        }
        return;
      }

      // Mode "full": Curtain scaleY 1->0, img scale 1.12->1
      if (IMAGE_MOTION === "full" && target.curtain && !isAlreadyPast) {
        target.curtain.style.willChange = "transform";
        target.img.style.willChange = "transform";

        const revealTl = gsap.timeline({
          defaults: { ease: "expo.out", duration: 1.1 },
          scrollTrigger: {
            trigger: target.frame,
            start: "top 80%",
            once: true,
            fastScrollEnd: true
          },
          onComplete: () => {
            target.curtain.style.willChange = "auto";
            target.img.style.willChange = "auto";

            // Point 1: For non-parallax images (subscribe.jpg), clearProps transform & add is-revealed class
            if (!target.isParallax) {
              gsap.set(target.img, { clearProps: "transform" });
              target.frame.classList.add("is-revealed");
            }
          }
        });

        revealTl.fromTo(
          target.curtain,
          { scaleY: 1 },
          { scaleY: 0, duration: 1.1 },
          0
        );

        revealTl.fromTo(
          target.img,
          { scale: 1.12 },
          { scale: 1.0, duration: 1.1 },
          0
        );
      }

      // Point 2: Parallax fromTo (symmetric negative to positive yPercent)
      // Roastery (-2.5% to +2.5%), Beans (-4.5% to +4.5%)
      if (allowParallax && target.isParallax && target.img) {
        const halfSpeed = target.speed / 2;
        gsap.fromTo(
          target.img,
          { yPercent: -halfSpeed },
          {
            yPercent: halfSpeed,
            ease: "none",
            scrollTrigger: {
              trigger: target.frame,
              start: "top bottom",
              end: "bottom top",
              scrub: true
            }
          }
        );
      }
    });
  }

  /* --------------------------------------------------------------------------
     SECTION REVEALS (REVIEWS & STATS)
     -------------------------------------------------------------------------- */
  function setupSectionReveals() {
    if (prefersReducedMotion || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    const reviewCards = document.querySelectorAll(".review-card");
    if (reviewCards.length > 0) {
      gsap.from(reviewCards, {
        opacity: 0,
        y: 28,
        stagger: 0.1,
        duration: 0.75,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "#reviews-grid",
          start: "top 80%",
          once: true
        }
      });
    }

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
      duration: 1.2,
      ease: "power2.out",
      onUpdate: () => {
        const current = String(Math.floor(obj.val));
        if (el.textContent !== current) {
          el.textContent = current;
        }
      }
    });
  }

  /* --------------------------------------------------------------------------
     PRODUCT GRID RE-RENDER ANIMATION
     -------------------------------------------------------------------------- */
  function animateProductCards() {
    if (typeof gsap === "undefined") return;

    const cards = document.querySelectorAll(".product-card");
    if (cards.length === 0) return;

    gsap.fromTo(
      cards,
      { opacity: 0, y: 20, rotation: 0.5 },
      {
        opacity: 1,
        y: 0,
        rotation: 0,
        duration: 0.65,
        stagger: 0.05,
        ease: "power2.out"
      }
    );
  }

  /* --------------------------------------------------------------------------
     FROM FARM TO CUP (SOLID STAGGERED REVEAL)
     -------------------------------------------------------------------------- */
  function setupStorySectionAnimation() {
    if (prefersReducedMotion || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    const panels = document.querySelectorAll(".story-panel");
    if (panels.length === 0) return;

    gsap.from(panels, {
      opacity: 0,
      y: 28,
      duration: 0.7,
      stagger: 0.08,
      ease: "power2.out",
      scrollTrigger: {
        trigger: "#story-panels-track",
        start: "top 82%",
        once: true
      }
    });
  }

  /* --------------------------------------------------------------------------
     BEZIER FLY-TO-CART & BADGE BUMP ANIMATION
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
     MAGNETIC BUTTONS & HIGH-PERFORMANCE CURSOR (QUICKTO PIPELINE)
     -------------------------------------------------------------------------- */
  function setupMagneticAndCursor() {
    const isPointerFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!isPointerFine || prefersReducedMotion) return;

    const cursor = document.getElementById("custom-cursor");

    if (cursor) {
      const xTo = gsap.quickTo(cursor, "x", { duration: 0.12, ease: "power2.out" });
      const yTo = gsap.quickTo(cursor, "y", { duration: 0.12, ease: "power2.out" });

      window.addEventListener("mousemove", (e) => {
        cursor.style.opacity = "1";
        xTo(e.clientX);
        yTo(e.clientY);
      }, { passive: true });

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
      }, { passive: true });

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
     INITIALIZATION & POINT 3b/3c/9 LAYOUT & SAFETY HOOKS
     -------------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    try {
      setupSmoothAnchorLinks();
      setupScrollDynamics();
      setupHeroAnimation();
      setupImageRevealsAndParallax();
      setupSectionReveals();
      setupStorySectionAnimation();
      setupFlyToCartListener();
      setupMagneticAndCursor();

      // Point 3b: Set flag confirming motion initialized with zero errors
      window.__motionReady = true;
    } catch (err) {
      console.warn("Motion initialization error, uncovering photos fail-safe:", err);
      // Point 3b: Remove has-js so curtains immediately reveal photos if JS throws
      document.documentElement.classList.remove("has-js");
    }
  });

  // Rule 9: After window load and fonts ready, call ScrollTrigger.refresh() once
  let hasRefreshed = false;
  function triggerRefreshOnce() {
    if (!hasRefreshed && typeof ScrollTrigger !== "undefined") {
      hasRefreshed = true;
      ScrollTrigger.refresh();
    }
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (document.readyState === "complete") {
        triggerRefreshOnce();
      }
    });
  }

  window.addEventListener("load", () => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(triggerRefreshOnce);
    } else {
      triggerRefreshOnce();
    }
  });

  document.addEventListener("shop:rendered", () => {
    animateProductCards();
  });

})();
