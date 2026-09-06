/**
 * ===================================================================
 * Earthen Beauty by Nupur - Studio Admin Portal Motion Effects
 * Powered by motion.dev (Motion One) & High-End Micro-Interactions
 * ===================================================================
 */

(function() {
  "use strict";

  // Check if Motion is available, else provide smooth fallbacks
  var M = window.Motion || null;

  // Initialize once DOM is ready
  document.addEventListener("DOMContentLoaded", function() {
    initAmbientOrbs();
    initNavTabIndicator();
    initCard3DTilt();
    initButtonPressEffects();
    animateLoginCardEntrance();
  });

  // 1. Ambient Background Glow Orbs Animation
  function initAmbientOrbs() {
    var orbTerracotta = document.getElementById("orb-terracotta");
    var orbForest = document.getElementById("orb-forest");
    var orbGold = document.getElementById("orb-gold");

    if (M && orbTerracotta && orbForest) {
      M.animate(orbTerracotta, {
        transform: [
          "translate(0px, 0px) scale(1)",
          "translate(40px, -30px) scale(1.15)",
          "translate(-30px, 40px) scale(0.95)",
          "translate(0px, 0px) scale(1)"
        ],
        opacity: [0.35, 0.55, 0.4, 0.35]
      }, {
        duration: 18,
        repeat: Infinity,
        easing: "ease-in-out"
      });

      M.animate(orbForest, {
        transform: [
          "translate(0px, 0px) scale(1)",
          "translate(-45px, 35px) scale(1.12)",
          "translate(35px, -25px) scale(0.92)",
          "translate(0px, 0px) scale(1)"
        ],
        opacity: [0.3, 0.5, 0.35, 0.3]
      }, {
        duration: 22,
        repeat: Infinity,
        easing: "ease-in-out"
      });

      if (orbGold) {
        M.animate(orbGold, {
          transform: [
            "translate(0px, 0px) scale(1)",
            "translate(25px, 30px) scale(1.2)",
            "translate(-20px, -20px) scale(0.9)",
            "translate(0px, 0px) scale(1)"
          ],
          opacity: [0.25, 0.45, 0.3, 0.25]
        }, {
          duration: 15,
          repeat: Infinity,
          easing: "ease-in-out"
        });
      }
    }
  }

  // 2. Login Card Entrance
  function animateLoginCardEntrance() {
    var card = document.querySelector(".admin-login-card");
    if (!card) return;
    if (M) {
      M.animate(card, {
        opacity: [0, 1],
        transform: ["translateY(28px) scale(0.96)", "translateY(0px) scale(1)"]
      }, {
        duration: 0.7,
        easing: [0.16, 1, 0.3, 1]
      });
    }
  }

  // 3. Workspace Entrance Animation (When Admin logs in)
  function animateWorkspaceEntrance() {
    if (!M) return;

    // Navbar entrance
    M.animate(".admin-navbar", {
      opacity: [0, 1],
      transform: ["translateY(-20px)", "translateY(0px)"]
    }, {
      duration: 0.5,
      easing: [0.16, 1, 0.3, 1]
    });

    // Page header
    M.animate(".page-header", {
      opacity: [0, 1],
      transform: ["translateY(18px)", "translateY(0px)"]
    }, {
      duration: 0.55,
      delay: 0.08,
      easing: [0.16, 1, 0.3, 1]
    });

    // Stat cards staggered reveal
    var statCards = document.querySelectorAll(".stat-card");
    if (statCards.length > 0) {
      M.animate(statCards, {
        opacity: [0, 1],
        transform: ["translateY(24px) scale(0.94)", "translateY(0px) scale(1)"]
      }, {
        delay: M.stagger(0.08, { startDelay: 0.15 }),
        duration: 0.65,
        easing: [0.16, 1, 0.3, 1]
      });
    }

    // Main card entrance
    M.animate(".admin-card", {
      opacity: [0, 1],
      transform: ["translateY(20px)", "translateY(0px)"]
    }, {
      duration: 0.6,
      delay: 0.3,
      easing: [0.16, 1, 0.3, 1]
    });
  }

  // 4. Sliding Pill Nav Tab Indicator
  function initNavTabIndicator() {
    var nav = document.querySelector(".admin-nav-tabs");
    if (!nav) return;

    var indicator = document.getElementById("nav-tab-indicator");
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = "nav-tab-indicator";
      indicator.className = "nav-tab-indicator";
      nav.appendChild(indicator);
    }

    function updateIndicatorPosition(activeBtn, animate) {
      if (!activeBtn || !indicator) return;
      var navRect = nav.getBoundingClientRect();
      var btnRect = activeBtn.getBoundingClientRect();
      var left = btnRect.left - navRect.left;
      var width = btnRect.width;

      if (animate && M) {
        M.animate(indicator, {
          transform: ["translateX(" + (indicator.__currentLeft || left) + "px)", "translateX(" + left + "px)"],
          width: [(indicator.__currentWidth || width) + "px", width + "px"]
        }, {
          duration: 0.35,
          easing: [0.25, 1, 0.5, 1]
        });
      } else {
        indicator.style.transform = "translateX(" + left + "px)";
        indicator.style.width = width + "px";
      }

      indicator.__currentLeft = left;
      indicator.__currentWidth = width;
    }

    var currentActive = nav.querySelector(".admin-tab-btn.active");
    if (currentActive) {
      setTimeout(function() { updateIndicatorPosition(currentActive, false); }, 50);
    }

    // Listen for tab clicks
    var tabBtns = nav.querySelectorAll(".admin-tab-btn");
    tabBtns.forEach(function(btn) {
      btn.addEventListener("click", function() {
        updateIndicatorPosition(this, true);
      });
    });

    window.addEventListener("resize", function() {
      var act = nav.querySelector(".admin-tab-btn.active");
      if (act) updateIndicatorPosition(act, false);
    });

    window.__updateNavTabIndicator = function(tabName) {
      var btn = nav.querySelector('.admin-tab-btn[data-tab="' + tabName + '"]');
      if (btn) updateIndicatorPosition(btn, true);
    };
  }

  // 5. Tab Pane Switch Animation
  function animateTabPaneSwitch(paneId) {
    var pane = document.getElementById(paneId);
    if (!pane) return;

    if (M) {
      M.animate(pane, {
        opacity: [0, 1],
        transform: ["translateY(14px) scale(0.99)", "translateY(0px) scale(1)"]
      }, {
        duration: 0.4,
        easing: [0.16, 1, 0.3, 1]
      });
    }
  }

  // 6. Interactive 3D Perspective Tilt on Stat Cards & Highlights
  function initCard3DTilt() {
    var cards = document.querySelectorAll(".stat-card, .admin-card-header");
    cards.forEach(function(card) {
      card.addEventListener("mousemove", function(e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var midX = rect.width / 2;
        var midY = rect.height / 2;
        var rotateX = ((y - midY) / midY) * -7;
        var rotateY = ((x - midX) / midX) * 7;

        card.style.transform = "perspective(900px) rotateX(" + rotateX.toFixed(2) + "deg) rotateY(" + rotateY.toFixed(2) + "deg) translateY(-4px) translateZ(8px)";
        card.style.transition = "transform 0.08s ease-out";
      });

      card.addEventListener("mouseleave", function() {
        if (M) {
          M.animate(card, {
            transform: ["perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px) translateZ(0px)"]
          }, {
            duration: 0.5,
            easing: [0.16, 1, 0.3, 1]
          });
        } else {
          card.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px) translateZ(0px)";
          card.style.transition = "transform 0.4s ease-out";
        }
      });
    });
  }

  // 7. Dynamic Count-Up Statistics Animation
  function animateCountUp(elementId, endValue, prefix, suffix, duration) {
    var el = document.getElementById(elementId);
    if (!el) return;

    prefix = prefix || "";
    suffix = suffix || "";
    duration = duration || 1000;

    var startValue = 0;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease Out Quart: 1 - pow(1 - x, 4)
      var ease = 1 - Math.pow(1 - progress, 4);
      var current = Math.floor(startValue + (endValue - startValue) * ease);

      el.textContent = prefix + current.toLocaleString("en-IN") + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = prefix + endValue.toLocaleString("en-IN") + suffix;
        // Subtle pop animation at end
        if (M) {
          M.animate(el, { transform: ["scale(1.08)", "scale(1)"] }, { duration: 0.25, easing: "ease-out" });
        }
      }
    }

    requestAnimationFrame(step);
  }

  // 8. Staggered Table Rows Reveal
  function animateTableRows(tbodyId) {
    var tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    var rows = tbody.querySelectorAll("tr");
    if (rows.length === 0) return;

    if (M) {
      M.animate(rows, {
        opacity: [0, 1],
        transform: ["translateY(10px)", "translateY(0px)"]
      }, {
        delay: M.stagger(0.025, { startDelay: 0.05 }),
        duration: 0.4,
        easing: [0.16, 1, 0.3, 1]
      });
    }
  }

  // 9. Modal Spring Animation
  function animateModalOpen(modalId) {
    var modal = document.getElementById(modalId);
    if (!modal) return;
    var card = modal.querySelector(".admin-modal-card");
    if (!card) return;

    modal.style.display = "flex";
    modal.style.pointerEvents = "auto";

    if (M) {
      M.animate(modal, { opacity: [0, 1] }, { duration: 0.25 });
      M.animate(card, {
        opacity: [0, 1],
        transform: ["translateY(30px) scale(0.92)", "translateY(0px) scale(1)"]
      }, {
        duration: 0.45,
        easing: [0.16, 1, 0.3, 1]
      });
    } else {
      modal.style.opacity = "1";
      card.style.opacity = "1";
      card.style.transform = "translateY(0px) scale(1)";
    }
  }

  function animateModalClose(modalId, callback) {
    var modal = document.getElementById(modalId);
    if (!modal) {
      if (typeof callback === "function") callback();
      return;
    }
    var card = modal.querySelector(".admin-modal-card");

    if (M && card) {
      var a1 = M.animate(modal, { opacity: [1, 0] }, { duration: 0.2 });
      var a2 = M.animate(card, {
        opacity: [1, 0],
        transform: ["translateY(0px) scale(1)", "translateY(20px) scale(0.94)"]
      }, {
        duration: 0.2,
        easing: [0.16, 1, 0.3, 1]
      });

      Promise.all([a1.finished, a2.finished]).then(function() {
        modal.classList.remove("open");
        modal.style.display = "none";
        modal.style.opacity = "";
        modal.style.pointerEvents = "none";
        card.style.opacity = "";
        card.style.transform = "";
        if (typeof callback === "function") callback();
      }).catch(function() {
        modal.classList.remove("open");
        modal.style.display = "none";
        modal.style.opacity = "";
        modal.style.pointerEvents = "none";
        if (typeof callback === "function") callback();
      });
    } else {
      modal.classList.remove("open");
      modal.style.display = "none";
      modal.style.opacity = "";
      modal.style.pointerEvents = "none";
      if (typeof callback === "function") callback();
    }
  }

  // 10. Button Micro-Press Springs
  function initButtonPressEffects() {
    var buttons = document.querySelectorAll(".btn-primary, .btn-accent, .btn-secondary, .admin-tab-btn, .btn-logout");
    buttons.forEach(function(btn) {
      btn.addEventListener("mousedown", function() {
        btn.style.transform = "scale(0.96)";
        btn.style.transition = "transform 0.1s ease";
      });
      btn.addEventListener("mouseup", function() {
        btn.style.transform = "scale(1)";
        btn.style.transition = "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)";
      });
      btn.addEventListener("mouseleave", function() {
        btn.style.transform = "scale(1)";
      });
    });
  }

  // Expose to window for admin.js integration
  window.AdminMotions = {
    animateWorkspaceEntrance: animateWorkspaceEntrance,
    animateTabPaneSwitch: animateTabPaneSwitch,
    animateCountUp: animateCountUp,
    animateTableRows: animateTableRows,
    animateModalOpen: animateModalOpen,
    animateModalClose: animateModalClose,
    reInitTilt: initCard3DTilt
  };

})();
