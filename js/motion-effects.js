/**
 * Motion & Interaction Effects for Earthen Beauty
 * Powered by Motion.dev (Motion One) with resilient spring physics & fallbacks
 */

(function () {
  "use strict";

  // Check if Motion One library is loaded or load it
  function loadMotionLib(callback) {
    if (window.Motion) {
      if (callback) callback();
      return;
    }

    var script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/motion@latest/dist/motion.js";
    script.async = true;
    script.onload = function () {
      if (callback) callback();
    };
    script.onerror = function () {
      // Fallback to CSS animations if offline or CDN blocked
      if (callback) callback();
    };
    document.head.appendChild(script);
  }

  // Smooth Header Highlight on Minimal Scroll
  function initHeaderScrollEffect() {
    var header = document.getElementById("header");
    if (!header) return;

    function onScroll() {
      var scrollPos = window.pageYOffset || document.documentElement.scrollTop;
      // Minimal scroll threshold (15px) for instantaneous smooth highlight
      if (scrollPos > 15) {
        if (!header.classList.contains("scrolled")) {
          header.classList.add("scrolled");
        }
      } else {
        // On home page, remove scrolled at top; on subpages keep elegant bar
        var isHomePage = document.body.classList.contains("home-page") || (!document.querySelector(".shop-hero, .about-hero, .contact-hero, .custom-hero, .product-detail-section, .search-hero") && document.querySelector(".hero"));
        if (isHomePage) {
          header.classList.remove("scrolled");
        }
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // initial check
  }

  // Spring Stagger Animation for Cards (Home, Shop, Search, Gift Box)
  window.animateProductGrid = function (containerEl) {
    if (!containerEl) return;
    var cards = containerEl.querySelectorAll(".product-card, .gift-item, .category-card");
    if (!cards || cards.length === 0) return;

    if (window.Motion && typeof Motion.animate === "function") {
      Motion.animate(
        cards,
        {
          opacity: [0, 1],
          y: [24, 0],
          scale: [0.94, 1]
        },
        {
          delay: Motion.stagger ? Motion.stagger(0.045, { start: 0.05 }) : 0.05,
          duration: 0.45,
          easing: [0.16, 1, 0.3, 1] // Apple/Motion spring curve
        }
      );
    } else {
      // High-performance CSS Spring fallback
      cards.forEach(function (card, index) {
        card.style.opacity = "0";
        card.style.transform = "translateY(20px) scale(0.96)";
        card.style.transition = "opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
        
        setTimeout(function () {
          card.style.opacity = "1";
          card.style.transform = "translateY(0) scale(1)";
        }, index * 45);
      });
    }
  };

  // Subtle 3D Card Hover Interaction
  function initCardInteractivePhysics() {
    document.addEventListener("mousemove", function (e) {
      var target = e.target.closest(".product-card, .category-card, .value-card");
      if (!target) return;

      var rect = target.getBoundingClientRect();
      var x = e.clientX - rect.left - rect.width / 2;
      var y = e.clientY - rect.top - rect.height / 2;

      var rotateX = (-y / rect.height) * 6; // max 6deg
      var rotateY = (x / rect.width) * 6;

      target.style.transform = "perspective(800px) rotateX(" + rotateX.toFixed(2) + "deg) rotateY(" + rotateY.toFixed(2) + "deg) translateY(-6px)";
    });

    document.addEventListener("mouseout", function (e) {
      var target = e.target.closest(".product-card, .category-card, .value-card");
      if (target && !target.contains(e.relatedTarget)) {
        target.style.transform = "";
      }
    });
  }

  // Scroll In-View Reveal with Spring Easing
  function initInViewObserver() {
    var elements = document.querySelectorAll(".reveal, .section-title, .about-teaser-image, .about-teaser-content, .value-card, .custom-option-card");
    if (!elements || elements.length === 0) return;

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var el = entry.target;
              el.classList.add("revealed");

              if (window.Motion && typeof Motion.animate === "function") {
                Motion.animate(
                  el,
                  { opacity: [0, 1], y: [30, 0] },
                  { duration: 0.6, easing: [0.16, 1, 0.3, 1] }
                );
              }
              observer.unobserve(el);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
      );

      elements.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      // Fallback
      elements.forEach(function (el) {
        el.classList.add("revealed");
      });
    }
  }

  // Floating Candlelight & Botanical Particles effect in Hero
  function initHeroGlowParticles() {
    var hero = document.querySelector(".hero");
    if (!hero) return;

    var glow = hero.querySelector(".hero-glow");
    if (glow && window.Motion && typeof Motion.animate === "function") {
      Motion.animate(
        glow,
        {
          scale: [1, 1.15, 0.95, 1.08, 1],
          opacity: [0.55, 0.8, 0.45, 0.75, 0.55]
        },
        {
          duration: 6,
          repeat: Infinity,
          easing: "ease-in-out"
        }
      );
    }
  }

  // Button Spring Press Click Effect
  function initButtonPhysics() {
    document.addEventListener("mousedown", function (e) {
      var btn = e.target.closest(".add-to-cart-btn, .hero-btn, .checkout-btn, .search-trigger-btn, .about-btn, .whatsapp-btn");
      if (btn) {
        btn.style.transform = "scale(0.95)";
      }
    });

    document.addEventListener("mouseup", function (e) {
      var btn = e.target.closest(".add-to-cart-btn, .hero-btn, .checkout-btn, .search-trigger-btn, .about-btn, .whatsapp-btn");
      if (btn) {
        btn.style.transform = "";
      }
    });
  }

  // Initialize Everything on Load
  document.addEventListener("DOMContentLoaded", function () {
    initHeaderScrollEffect();
    initButtonPhysics();
    initInViewObserver();

    loadMotionLib(function () {
      initHeroGlowParticles();
      initCardInteractivePhysics();

      // Trigger initial grid stagger if products exist
      var homeGrid = document.getElementById("featured-grid") || document.getElementById("categories-grid");
      if (homeGrid) {
        setTimeout(function () {
          window.animateProductGrid(homeGrid);
        }, 150);
      }
    });
  });
})();
