// Main JavaScript for Earthen Beauty
// Handles navigation, scroll effects, and common interactions

// Mobile menu toggle
function toggleMenu() {
  var nav = document.getElementById("nav-links");
  var hamburger = document.getElementById("hamburger");

  nav.classList.toggle("active");
  hamburger.classList.toggle("active");
}

// Close mobile menu when a link is clicked
function closeMenu() {
  var nav = document.getElementById("nav-links");
  var hamburger = document.getElementById("hamburger");

  nav.classList.remove("active");
  hamburger.classList.remove("active");
}

// Sticky header on minimal scroll
window.addEventListener("scroll", function() {
  var header = document.getElementById("header");
  if (header) {
    if (window.scrollY > 15) {
      header.classList.add("scrolled");
    } else {
      var isHomePage = document.body.classList.contains("home-page") || (!document.querySelector(".shop-hero, .about-hero, .contact-hero, .custom-hero, .product-detail-section, .search-hero") && document.querySelector(".hero"));
      if (isHomePage) {
        header.classList.remove("scrolled");
      }
    }
  }
}, { passive: true });

// Scroll reveal animation
// Elements with class "reveal" will fade in when scrolled into view
function revealOnScroll() {
  var reveals = document.querySelectorAll(".reveal");

  reveals.forEach(function(el) {
    var windowHeight = window.innerHeight;
    var elementTop = el.getBoundingClientRect().top;
    var revealPoint = 120;

    if (elementTop < windowHeight - revealPoint) {
      el.classList.add("revealed");
    }
  });
}

window.addEventListener("scroll", revealOnScroll);

// Smooth scroll to section
function scrollToSection(sectionId) {
  var section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
}

// Current year for footer copyright
function setCurrentYear() {
  var yearEl = document.getElementById("current-year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

// Global Product Search Modal Logic
function openSearchModal() {
  var overlay = document.getElementById("search-overlay");
  if (!overlay) return;
  overlay.classList.add("active");
  var input = document.getElementById("global-search-input");
  if (input) {
    input.value = "";
    input.focus();
  }
  handleGlobalSearch("");
}

function closeSearchModal(event) {
  if (event && event.target && event.target.id !== "search-overlay" && !event.target.classList.contains("search-modal-close")) {
    return;
  }
  var overlay = document.getElementById("search-overlay");
  if (overlay) {
    overlay.classList.remove("active");
  }
}

// Handle search from home hero section
function handleHeroSearch(event) {
  if (event) event.preventDefault();
  var input = document.getElementById("hero-search-input");
  var q = input ? input.value.trim() : "";
  if (q) {
    window.location.href = "search.html?q=" + encodeURIComponent(q);
  } else {
    window.location.href = "search.html";
  }
}

// Handle global search input
function handleGlobalSearch(query) {
  var container = document.getElementById("search-modal-results");
  if (!container || typeof products === "undefined") return;

  var q = (query || "").toLowerCase().trim();
  var matches = [];

  if (q === "") {
    // Show 6 popular items when empty
    var popularIds = [6, 14, 21, 46, 54, 63, 72];
    matches = products.filter(function(p) { return popularIds.indexOf(p.id) !== -1; });
    if (matches.length === 0) matches = products.slice(0, 6);
  } else {
    matches = products.filter(function(p) {
      var nameMatch = p.name.toLowerCase().indexOf(q) !== -1;
      var catMatch = p.category.toLowerCase().indexOf(q) !== -1;
      var subMatch = (p.subcategory || "").toLowerCase().indexOf(q) !== -1;
      var descMatch = (p.description || "").toLowerCase().indexOf(q) !== -1;
      return nameMatch || catMatch || subMatch || descMatch;
    });
  }

  container.innerHTML = "";

  if (matches.length === 0) {
    container.innerHTML = '<div class="search-no-results"><p style="font-size:1.5rem; margin-bottom:8px;">🕯️</p><p>No products found matching "' + query + '"</p><p style="font-size:0.85rem; color:#aaa;">Try searching for lavender, urli, rose, soap, mist...</p></div>';
    return;
  }

  if (q === "") {
    var heading = document.createElement("div");
    heading.style.padding = "8px 14px 4px";
    heading.style.fontSize = "0.8rem";
    heading.style.fontWeight = "600";
    heading.style.color = "var(--text-light)";
    heading.textContent = "POPULAR PRODUCTS";
    container.appendChild(heading);
  } else {
    var viewAllLink = document.createElement("a");
    viewAllLink.href = "search.html?q=" + encodeURIComponent(query);
    viewAllLink.style.display = "block";
    viewAllLink.style.padding = "10px 14px";
    viewAllLink.style.background = "var(--warm-cream)";
    viewAllLink.style.color = "var(--terracotta)";
    viewAllLink.style.fontWeight = "600";
    viewAllLink.style.fontSize = "0.85rem";
    viewAllLink.style.borderRadius = "6px";
    viewAllLink.style.marginBottom = "8px";
    viewAllLink.style.textAlign = "center";
    viewAllLink.style.textDecoration = "none";
    viewAllLink.innerHTML = "View all " + matches.length + ' results on Search page &rarr;';
    container.appendChild(viewAllLink);
  }

  matches.slice(0, 8).forEach(function(p) {
    var catObj = typeof categories !== "undefined" ? categories.find(function(c) { return c.id === p.category; }) : null;
    var catName = catObj ? catObj.name : p.category;

    var item = document.createElement("a");
    item.className = "search-result-item";
    item.href = "product.html?id=" + p.id;
    item.innerHTML =
      '<div class="search-result-img">' +
        '<img src="' + p.image + '" alt="' + p.name + '">' +
      '</div>' +
      '<div class="search-result-info">' +
        '<h4>' + p.name + '</h4>' +
        '<p>' + catName + '</p>' +
      '</div>' +
      '<div class="search-result-price">₹' + p.price + '</div>';

    container.appendChild(item);
  });
}

// Close search modal on Escape key
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") {
    var overlay = document.getElementById("search-overlay");
    if (overlay && overlay.classList.contains("active")) {
      overlay.classList.remove("active");
    }
  }
});

// Floating WhatsApp Assistance Widget
function initFloatingWhatsApp() {
  if (document.getElementById("floating-whatsapp")) return;

  var wrap = document.createElement("div");
  wrap.id = "floating-whatsapp";
  wrap.className = "floating-whatsapp-wrap";
  wrap.innerHTML =
    '<div class="floating-whatsapp-tooltip">Chat with Nupur 🕯️</div>' +
    '<a href="https://wa.me/918296891802?text=Hello%20Nupur!%20I%20have%20an%20inquiry%20regarding%20Earthen%20Beauty%20products." target="_blank" class="floating-whatsapp-btn" aria-label="Chat on WhatsApp" title="Chat on WhatsApp">' +
      '<span class="floating-whatsapp-online-dot"></span>' +
      '<svg viewBox="0 0 24 24">' +
        '<path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.97.53 1.777.82 2.796.82 3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.768-5.766zm9.969 5.766c0 5.514-4.486 10-10 10-1.808 0-3.5-.483-4.962-1.326l-5.038 1.326 1.35-4.921c-.958-1.526-1.52-3.328-1.52-5.079 0-5.514 4.486-10 10-10s10 4.486 10 10z"/>' +
      '</svg>' +
    '</a>';

  document.body.appendChild(wrap);
}

// Close mobile menu if clicked outside
document.addEventListener("click", function(e) {
  var nav = document.getElementById("nav-links");
  var hamburger = document.getElementById("hamburger");
  if (nav && nav.classList.contains("active") && !nav.contains(e.target) && !hamburger.contains(e.target)) {
    closeMenu();
  }
});

// Initialize everything on page load
document.addEventListener("DOMContentLoaded", function() {
  setCurrentYear();
  revealOnScroll();
  initFloatingWhatsApp();
  initCustomerAuthUI();
  injectCustomerModals();
  injectRazorpayScript();

  // Close menu when clicking nav links
  var navLinks = document.querySelectorAll("#nav-links a:not(.dropdown-link)");
  navLinks.forEach(function(link) {
    link.addEventListener("click", closeMenu);
  });
});

// ==========================================
// CUSTOMER AUTHENTICATION & PROFILE SYSTEM
// ==========================================
var currentCustomer = null;

function getCustomerToken() {
  return localStorage.getItem("eb_customer_token");
}

function getStoredCustomer() {
  try {
    return JSON.parse(localStorage.getItem("eb_customer_user"));
  } catch (e) {
    return null;
  }
}

function initCustomerAuthUI() {
  // Remove any injected auth item inside center nav capsule if present
  var nav = document.getElementById("nav-links");
  if (nav) {
    var navAuthItem = nav.querySelector(".nav-auth-item");
    if (navAuthItem) navAuthItem.remove();
  }

  var btn = document.getElementById("header-profile-btn");
  if (btn && !document.getElementById("profile-dropdown-menu")) {
    var parent = btn.parentElement || btn.parentNode;
    if (parent) {
      parent.style.position = "relative";
      var menuDiv = document.createElement("div");
      menuDiv.className = "profile-dropdown-menu";
      menuDiv.id = "profile-dropdown-menu";
      menuDiv.style.display = "none";
      menuDiv.innerHTML =
        '<div class="profile-dropdown-header">' +
          '<span class="dropdown-greeting">Signed in as</span>' +
          '<span class="dropdown-user-name" id="dropdown-user-name">Customer</span>' +
        '</div>' +
        '<a href="#" class="dropdown-link" onclick="openMyOrdersModal(event)">' +
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>' +
          '<span>My Orders</span>' +
        '</a>' +
        '<a href="#" class="dropdown-link dropdown-logout-link" onclick="customerLogout(event)">' +
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
          '<span>Sign Out</span>' +
        '</a>';
      parent.appendChild(menuDiv);
    }
  }

  updateProfileNavDisplay();

  // Close dropdown if clicked outside
  document.addEventListener("click", function(e) {
    var menu = document.getElementById("profile-dropdown-menu");
    var profileBtn = document.getElementById("header-profile-btn");
    if (menu && menu.style.display !== "none" && !menu.contains(e.target) && profileBtn && !profileBtn.contains(e.target)) {
      menu.style.display = "none";
    }
  });
}

function updateProfileNavDisplay() {
  var token = getCustomerToken();
  var user = getStoredCustomer();
  var adminToken = localStorage.getItem("eb_admin_token");
  var label = document.getElementById("nav-profile-label");
  var nameEl = document.getElementById("dropdown-user-name");
  var menu = document.getElementById("profile-dropdown-menu");

  if (token && user && user.name) {
    currentCustomer = user;
    var firstName = user.name.split(" ")[0];

    if (label) {
      label.textContent = firstName;
    }

    if (nameEl) {
      nameEl.textContent = user.name;
    }

    // Ensure customer menu never has admin portal links
    var existingAdminLink = document.getElementById("dropdown-admin-portal-link");
    if (existingAdminLink) {
      existingAdminLink.remove();
    }
  } else {
    currentCustomer = null;
    if (label) label.textContent = "Sign In";
    if (nameEl) nameEl.textContent = "Customer";
    var oldLink = document.getElementById("dropdown-admin-portal-link");
    if (oldLink) oldLink.remove();
  }
}

function handleProfileBtnClick(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  var token = getCustomerToken();
  if (token) {
    // Toggle dropdown
    var menu = document.getElementById("profile-dropdown-menu");
    if (menu) {
      menu.style.display = (menu.style.display === "none" || !menu.style.display) ? "block" : "none";
    }
  } else {
    openCustomerAuthModal("signin");
  }
}

function customerLogout(e) {
  if (e) e.preventDefault();
  localStorage.removeItem("eb_customer_token");
  localStorage.removeItem("eb_customer_user");
  localStorage.removeItem("eb_admin_token");
  localStorage.removeItem("eb_admin_user");
  currentCustomer = null;
  updateProfileNavDisplay();
  var menu = document.getElementById("profile-dropdown-menu");
  if (menu) menu.style.display = "none";
  alert("You have been signed out.");
}

// Inject Razorpay checkout script
function injectRazorpayScript() {
  if (!document.getElementById("razorpay-checkout-script")) {
    var s = document.createElement("script");
    s.id = "razorpay-checkout-script";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    document.head.appendChild(s);
  }
}

// Dynamically inject all modals
function injectCustomerModals() {
  if (document.getElementById("customer-auth-modal")) return;

  var div = document.createElement("div");
  div.innerHTML =
    '<!-- Customer Auth Modal -->' +
    '<div class="customer-modal-overlay" id="customer-auth-modal" onclick="closeModalOnOverlay(event, \'customer-auth-modal\')">' +
      '<div class="customer-modal-card">' +
        '<div class="customer-modal-header">' +
          '<div class="auth-brand-emblem-wrap">' +
            '<div class="auth-brand-logo" style="background-image: url(\'images/hero/hero-bg.png\');"></div>' +
          '</div>' +
          '<h3 id="auth-modal-title">Earthen Beauty</h3>' +
          '<p id="auth-modal-subtitle">Sign in to track your artisanal orders & manage your collection</p>' +
          '<button type="button" class="customer-modal-close" onclick="closeCustomerModal(\'customer-auth-modal\')" aria-label="Close">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="auth-tabs">' +
          '<button type="button" class="auth-tab-btn active" id="tab-btn-signin" onclick="switchAuthTab(\'signin\')">Sign In</button>' +
          '<button type="button" class="auth-tab-btn" id="tab-btn-register" onclick="switchAuthTab(\'register\')">Create Account</button>' +
        '</div>' +
        '<div class="customer-modal-body">' +
          '<div class="auth-error-msg" id="auth-error-msg"></div>' +
          '<!-- Sign In Form -->' +
          '<form id="customer-signin-form" onsubmit="submitCustomerSignIn(event)">' +
            '<div class="auth-form-group">' +
              '<label>Email Address</label>' +
              '<input type="email" id="signin-email" required placeholder="your.name@example.com" autocomplete="email">' +
            '</div>' +
            '<div class="auth-form-group">' +
              '<label>Password</label>' +
              '<input type="password" id="signin-password" required placeholder="Enter your password" autocomplete="current-password">' +
            '</div>' +
            '<button type="submit" class="auth-submit-btn">Sign In to Continue</button>' +
          '</form>' +
          '<!-- Register Form -->' +
          '<form id="customer-register-form" style="display:none;" onsubmit="submitCustomerRegister(event)">' +
            '<div class="auth-form-group">' +
              '<label>Full Name</label>' +
              '<input type="text" id="reg-name" required placeholder="e.g. Priya Sharma" autocomplete="name">' +
            '</div>' +
            '<div class="auth-form-group">' +
              '<label>Email Address</label>' +
              '<input type="email" id="reg-email" required placeholder="e.g. priya@example.com" autocomplete="email">' +
            '</div>' +
            '<div class="auth-form-group">' +
              '<label>Phone / WhatsApp Number</label>' +
              '<input type="tel" id="reg-phone" required placeholder="e.g. +91 98765 43210" autocomplete="tel">' +
            '</div>' +
            '<div class="auth-form-group">' +
              '<label>Create Password</label>' +
              '<input type="password" id="reg-password" required minlength="6" placeholder="At least 6 characters" autocomplete="new-password">' +
            '</div>' +
            '<button type="submit" class="auth-submit-btn">Create Account & Continue</button>' +
          '</form>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- Delivery Address & Razorpay Checkout Modal -->' +
    '<div class="customer-modal-overlay" id="checkout-address-modal" onclick="closeModalOnOverlay(event, \'checkout-address-modal\')">' +
      '<div class="customer-modal-card" style="max-width: 520px;">' +
        '<div class="customer-modal-header">' +
          '<h3>Shipping & Delivery Address</h3>' +
          '<p>Orders are shipped securely across India via Shiprocket</p>' +
          '<button type="button" class="customer-modal-close" onclick="closeCustomerModal(\'checkout-address-modal\')" aria-label="Close">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="customer-modal-body">' +
          '<div class="auth-error-msg" id="address-error-msg"></div>' +
          '<form id="delivery-address-form" onsubmit="proceedToRazorpayPayment(event)">' +
            '<div class="auth-form-group">' +
              '<label>Recipient Full Name</label>' +
              '<input type="text" id="addr-name" required placeholder="Name for delivery">' +
            '</div>' +
            '<div class="checkout-address-grid">' +
              '<div class="auth-form-group">' +
                '<label>Contact Phone</label>' +
                '<input type="tel" id="addr-phone" required placeholder="10-digit mobile number">' +
              '</div>' +
              '<div class="auth-form-group">' +
                '<label>Email</label>' +
                '<input type="email" id="addr-email" required placeholder="Order confirmation email">' +
              '</div>' +
            '</div>' +
            '<div class="auth-form-group">' +
              '<label>Flat / House No. & Street Address</label>' +
              '<textarea id="addr-street" rows="2" required placeholder="House/Flat number, Building, Street name, Landmark"></textarea>' +
            '</div>' +
            '<div class="checkout-address-grid">' +
              '<div class="auth-form-group">' +
                '<label>City</label>' +
                '<input type="text" id="addr-city" required placeholder="e.g. Mumbai, Bengaluru">' +
              '</div>' +
              '<div class="auth-form-group">' +
                '<label>State</label>' +
                '<input type="text" id="addr-state" required placeholder="e.g. Maharashtra, Karnataka">' +
              '</div>' +
            '</div>' +
            '<div class="auth-form-group">' +
              '<label>Pincode</label>' +
              '<input type="text" id="addr-pincode" required pattern="[0-9]{6}" placeholder="6-digit postal pincode">' +
            '</div>' +
            '<button type="submit" class="auth-submit-btn">' +
              'Pay via Razorpay (UPI / Card / NetBanking)' +
            '</button>' +
          '</form>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- Order Success Modal -->' +
    '<div class="customer-modal-overlay" id="order-success-modal">' +
      '<div class="customer-modal-card order-success-card">' +
        '<div class="success-check-circle">' +
          '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
        '</div>' +
        '<h3 style="font-family: \'Cinzel\', serif; font-size: 1.6rem; color: #ffffff;">Order Confirmed!</h3>' +
        '<p style="color: rgba(255,255,255,0.75); margin-top: 6px;">Thank you for supporting handcrafted artisanal beauty.</p>' +
        '<div style="margin: 18px 0;">' +
          '<div style="font-size: 0.95rem; font-weight: 600; color: #ffffff;">Order Number: <span id="success-order-num" style="color: var(--honey-yellow);">-</span></div>' +
          '<div class="tracking-pill">Shiprocket Tracking: <span id="success-tracking-num">Manifested</span></div>' +
        '</div>' +
        '<p style="font-size: 0.85rem; color: rgba(255,255,255,0.7); margin-bottom: 20px;">We have received your payment via Razorpay. Your package is being packed with care for pickup.</p>' +
        '<button type="button" class="auth-submit-btn" onclick="closeCustomerModal(\'order-success-modal\'); window.location.href=\'index.html\';">Continue Shopping</button>' +
      '</div>' +
    '</div>' +

    '<!-- My Orders Modal -->' +
    '<div class="customer-modal-overlay" id="customer-orders-modal" onclick="closeModalOnOverlay(event, \'customer-orders-modal\')">' +
      '<div class="customer-modal-card" style="max-width: 580px;">' +
        '<div class="customer-modal-header">' +
          '<h3>Your Past Orders</h3>' +
          '<p>Track order history, payments, and Shiprocket delivery status</p>' +
          '<button type="button" class="customer-modal-close" onclick="closeCustomerModal(\'customer-orders-modal\')" aria-label="Close">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="customer-modal-body">' +
          '<div id="orders-history-content" class="orders-history-list">' +
            '<p style="text-align: center; color: rgba(255,255,255,0.6); padding: 20px;">Loading your orders...</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.body.appendChild(div);
}

function openCustomerAuthModal(tab) {
  var modal = document.getElementById("customer-auth-modal");
  if (!modal) return;
  modal.classList.add("active");
  switchAuthTab(tab || "signin");
}

function closeCustomerModal(id) {
  var modal = document.getElementById(id);
  if (modal) modal.classList.remove("active");
}

function closeModalOnOverlay(e, id) {
  if (e.target.id === id) {
    closeCustomerModal(id);
  }
}

function switchAuthTab(tab) {
  var signinBtn = document.getElementById("tab-btn-signin");
  var regBtn = document.getElementById("tab-btn-register");
  var signinForm = document.getElementById("customer-signin-form");
  var regForm = document.getElementById("customer-register-form");
  var err = document.getElementById("auth-error-msg");
  if (err) err.style.display = "none";

  if (tab === "register") {
    if (signinBtn) signinBtn.classList.remove("active");
    if (regBtn) regBtn.classList.add("active");
    if (signinForm) signinForm.style.display = "none";
    if (regForm) regForm.style.display = "block";
  } else {
    if (signinBtn) signinBtn.classList.add("active");
    if (regBtn) regBtn.classList.remove("active");
    if (signinForm) signinForm.style.display = "block";
    if (regForm) regForm.style.display = "none";
  }
}

// Authentication Submission Handlers
var pendingCheckoutResume = false;

function getEbApiUrl(endpoint) {
  var base = window.EB_API_BASE || (window.location.protocol === "file:" ? "http://127.0.0.1:8000" : "");
  var p = endpoint.startsWith("/") ? endpoint : ("/" + endpoint);
  return base + p;
}

// Sign In & Registration Submit
async function submitCustomerSignIn(e) {
  e.preventDefault();
  var err = document.getElementById("auth-error-msg");
  err.style.display = "none";

  var email = document.getElementById("signin-email").value.trim();
  var password = document.getElementById("signin-password").value;

  try {
    var res = await fetch(getEbApiUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Sign in failed");

    localStorage.setItem("eb_customer_token", data.token);
    localStorage.setItem("eb_customer_user", JSON.stringify(data.user));

    updateProfileNavDisplay();
    closeCustomerModal("customer-auth-modal");

    if (pendingCheckoutResume) {
      pendingCheckoutResume = false;
      openDeliveryAddressModal();
    }
  } catch (ex) {
    err.textContent = ex.message;
    err.style.display = "block";
  }
}

async function submitCustomerRegister(e) {
  e.preventDefault();
  var err = document.getElementById("auth-error-msg");
  err.style.display = "none";

  var name = document.getElementById("reg-name").value.trim();
  var email = document.getElementById("reg-email").value.trim();
  var phone = document.getElementById("reg-phone").value.trim();
  var password = document.getElementById("reg-password").value;

  try {
    var res = await fetch(getEbApiUrl("/api/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, email: email, phone: phone, password: password })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Registration failed");

    localStorage.setItem("eb_customer_token", data.token);
    localStorage.setItem("eb_customer_user", JSON.stringify(data.user));
    updateProfileNavDisplay();
    closeCustomerModal("customer-auth-modal");

    if (pendingCheckoutResume) {
      pendingCheckoutResume = false;
      openDeliveryAddressModal();
    }
  } catch (ex) {
    err.textContent = ex.message;
    err.style.display = "block";
  }
}

// My Orders Modal
async function openMyOrdersModal(e) {
  if (e) e.preventDefault();
  var menu = document.getElementById("profile-dropdown-menu");
  if (menu) menu.style.display = "none";

  var modal = document.getElementById("customer-orders-modal");
  var content = document.getElementById("orders-history-content");
  if (!modal || !content) return;

  modal.classList.add("active");
  content.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 20px;">Fetching your orders...</p>';

  var token = getCustomerToken();
  if (!token) {
    content.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 20px;">Please sign in to view your orders.</p>';
    return;
  }

  try {
    var res = await fetch(getEbApiUrl("/api/orders/my-orders"), {
      headers: { "Authorization": "Bearer " + token }
    });
    var data = await res.json();
    if (!res.ok || !data.orders || data.orders.length === 0) {
      content.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 30px;">You have not placed any orders yet. Start shopping handcrafted candles! 🕯️</p>';
      return;
    }

    content.innerHTML = "";
    data.orders.forEach(function(o) {
      var itemNames = (o.items || []).map(function(i) { return i.name + " (x" + (i.quantity || 1) + ")"; }).join(", ");
      var card = document.createElement("div");
      card.className = "order-history-card";
      card.innerHTML =
        '<div class="order-history-header">' +
          '<span class="order-num">' + o.order_number + '</span>' +
          '<span class="order-status-badge ' + (o.payment_status === 'paid' ? 'paid' : 'pending') + '">' + o.payment_status + '</span>' +
        '</div>' +
        '<p style="font-size: 0.85rem; color: var(--charcoal); margin-bottom: 4px;"><strong>Items:</strong> ' + itemNames + '</p>' +
        '<p style="font-size: 0.85rem; color: var(--charcoal); margin-bottom: 4px;"><strong>Total:</strong> ₹' + o.total_amount + '</p>' +
        '<p style="font-size: 0.82rem; color: var(--sage-green); font-weight: 500;"><strong>📦 Shiprocket Tracking:</strong> ' + (o.tracking_number || 'Processing') + '</p>';
      content.appendChild(card);
    });
  } catch (ex) {
    content.innerHTML = '<p style="text-align: center; color: #c53030; padding: 20px;">Could not load orders: ' + ex.message + '</p>';
  }
}

// ==========================================
// NEWSLETTER SIGNUP (The "Scent Club")
// ==========================================
function handleScentClubSubmit(e) {
  if (e) e.preventDefault();
  var form = e.target;
  var input = form.querySelector("#scent-club-email") || document.getElementById("scent-club-email");
  var msg = form.querySelector("#scent-club-msg") || document.getElementById("scent-club-msg");
  var btn = form.querySelector("#scent-club-submit-btn") || document.getElementById("scent-club-submit-btn");

  if (!input || !msg) return;

  var email = input.value.trim().toLowerCase();
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    msg.className = "scent-club-msg error";
    msg.innerHTML = "⚠️ Please enter a valid email address.";
    return;
  }

  // Visual loading feedback
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>Joining...</span>';
  }

  // Save to localStorage for instant client state
  try {
    var stored = JSON.parse(localStorage.getItem("eb_scent_club_subscribers") || "[]");
    if (stored.indexOf(email) === -1) {
      stored.push(email);
      localStorage.setItem("eb_scent_club_subscribers", JSON.stringify(stored));
    }
  } catch (err) {}

  // Sync with backend API
  fetch(getEbApiUrl("/api/newsletter"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email, club_tier: "Scent Club Member" })
  }).then(function(res) {
    return res.json();
  }).catch(function() {
    return { success: true };
  }).then(function(data) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>Joined!</span> <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    }
    input.value = "";
    msg.className = "scent-club-msg success";
    msg.innerHTML = '🕯️ <strong>Welcome to The Scent Club!</strong> Use code <span style="letter-spacing:1px; color:#ffffff; background:rgba(229,184,105,0.3); padding:2px 8px; border-radius:4px; font-weight:700;">SCENTCLUB10</span> for 10% off your first handcrafted order.';
  });
}

