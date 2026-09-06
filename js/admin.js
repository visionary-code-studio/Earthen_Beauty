// ===================================================
// Earthen Beauty by Nupur - Studio Admin Portal Client Logic
// ===================================================

(function() {
  "use strict";

  // State
  var adminToken = localStorage.getItem("eb_admin_token") || null;
  var currentAdmin = null;
  try {
    currentAdmin = JSON.parse(localStorage.getItem("eb_admin_user") || "null");
  } catch (e) {
    currentAdmin = null;
  }

  var activeTab = "dashboard";
  var allProducts = [];
  var allOrders = [];
  var allAdmins = [];
  var currentEditProductId = null;
  var uploadedImageUrl = "";

  // Dynamic API Base URL resolution (handles file://, VS Code Live Server, local PHP server, and Netlify/static hosting)
  var API_BASE = (function() {
    if (window.location.protocol === "file:") {
      return "http://127.0.0.1:8000";
    }
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      if (window.location.port && window.location.port !== "8000") {
        return "http://127.0.0.1:8000";
      }
      return "";
    }
    var customBackend = localStorage.getItem("eb_backend_url");
    if (customBackend) {
      return customBackend.replace(/\/$/, "");
    }
    return "";
  })();

  function apiUrl(endpoint) {
    var p = endpoint.startsWith("/") ? endpoint : ("/" + endpoint);
    return API_BASE + p;
  }

  // Elements
  var loginView = document.getElementById("admin-login-view");
  var workspaceView = document.getElementById("admin-workspace-view");
  var loginForm = document.getElementById("admin-login-form");
  var loginError = document.getElementById("admin-login-error");

  // ==========================================
  // INITIALIZATION & AUTH CHECKS
  // ==========================================
  async function initAdmin() {
    if (adminToken) {
      // If running on static host with client session
      if (adminToken.indexOf("static_admin_token_") === 0 && currentAdmin) {
        showWorkspace();
        return;
      }

      // Verify token with backend
      try {
        var res = await fetch(apiUrl("/api/admin/me"), {
          headers: { "Authorization": "Bearer " + adminToken }
        });
        if (res.ok) {
          var data = await res.json();
          currentAdmin = data.admin;
          localStorage.setItem("eb_admin_user", JSON.stringify(currentAdmin));
          showWorkspace();
          return;
        }
      } catch (err) {
        console.warn("Auth check with backend failed, checking local session:", err);
        if (currentAdmin && currentAdmin.email) {
          showWorkspace();
          return;
        }
      }
      // If token expired or invalid
      logout();
    } else {
      showLogin();
    }
  }

  function showLogin() {
    if (loginView) loginView.style.display = "flex";
    if (workspaceView) workspaceView.style.display = "none";
  }

  function showWorkspace() {
    if (loginView) loginView.style.display = "none";
    if (workspaceView) workspaceView.style.display = "flex";
    updateAdminBadge();
    switchTab(activeTab);
    if (window.AdminMotions && window.AdminMotions.animateWorkspaceEntrance) {
      setTimeout(function() {
        window.AdminMotions.animateWorkspaceEntrance();
      }, 50);
    }
  }

  function updateAdminBadge() {
    var nameEl = document.getElementById("admin-profile-name");
    var roleEl = document.getElementById("admin-profile-role");
    var avatarEl = document.getElementById("admin-avatar-letter");
    if (currentAdmin) {
      if (nameEl) nameEl.textContent = currentAdmin.name || "Studio Admin";
      if (roleEl) roleEl.textContent = currentAdmin.email || "";
      if (avatarEl) avatarEl.textContent = (currentAdmin.name || "A").charAt(0).toUpperCase();
    }
  }

  // ==========================================
  // LOGIN FORM HANDLER
  // ==========================================
  if (loginForm) {
    loginForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      var email = document.getElementById("admin-email").value.trim();
      var password = document.getElementById("admin-password").value.trim();
      var btn = document.getElementById("admin-login-submit-btn");

      if (loginError) loginError.style.display = "none";
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = "Authenticating Studio Access...";
      }

      var isDefaultAdminCreds = (email.toLowerCase() === "earthenbeauty@gmail.com" && 
                                 (password.toUpperCase() === "EARTHENBEAUTY" || password.toLowerCase() === "admin"));

      try {
        var res = await fetch(apiUrl("/api/admin/login"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, password: password })
        });

        var data = null;
        try {
          data = await res.json();
        } catch (jsonErr) {}

        if (res.ok && data && data.success) {
          adminToken = data.token;
          currentAdmin = data.admin;
          localStorage.setItem("eb_admin_token", adminToken);
          localStorage.setItem("eb_admin_user", JSON.stringify(currentAdmin));
          showToast("Welcome back, " + currentAdmin.name + "! ✨", "success");
          showWorkspace();
          return;
        } else if (res.status === 404 || !res.ok) {
          // Check static hosting fallback (Netlify / GitHub Pages)
          if (isDefaultAdminCreds) {
            currentAdmin = {
              id: 1,
              name: "Nupur (Studio Owner)",
              email: "earthenbeauty@gmail.com",
              role: "Super Admin",
              is_admin: true
            };
            adminToken = "static_admin_token_" + Date.now();
            localStorage.setItem("eb_admin_token", adminToken);
            localStorage.setItem("eb_admin_user", JSON.stringify(currentAdmin));
            showToast("Welcome back, Nupur! (Studio Admin Mode) ✨", "success");
            showWorkspace();
            return;
          }
          if (loginError) {
            loginError.textContent = (data && data.detail) ? data.detail : "Invalid email or password. Please try again.";
            loginError.style.display = "block";
          }
        }
      } catch (err) {
        // Network failure fallback (e.g. static hosting Netlify, offline or backend starting)
        if (isDefaultAdminCreds) {
          currentAdmin = {
            id: 1,
            name: "Nupur (Studio Owner)",
            email: "earthenbeauty@gmail.com",
            role: "Super Admin",
            is_admin: true
          };
          adminToken = "static_admin_token_" + Date.now();
          localStorage.setItem("eb_admin_token", adminToken);
          localStorage.setItem("eb_admin_user", JSON.stringify(currentAdmin));
          showToast("Welcome back, Nupur! (Studio Admin Mode) ✨", "success");
          showWorkspace();
          return;
        }

        if (loginError) {
          loginError.innerHTML = "<strong>Unable to connect to backend server.</strong><br>1. If testing locally, make sure server is running:<br><code>backend\\php\\php.exe -S 127.0.0.1:8000 router.php</code> and open <a href='http://127.0.0.1:8000/admin.html' style='color:#fff;text-decoration:underline;'>http://127.0.0.1:8000/admin.html</a>.<br>2. On Netlify or offline, use default credentials (<code>earthenbeauty@gmail.com</code> / <code>EARTHENBEAUTY</code>).";
          loginError.style.display = "block";
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = "Enter Studio Portal <span>→</span>";
        }
      }
    });
  }

  // Quick autofill for convenience
  window.fillAdminDemo = function() {
    var e = document.getElementById("admin-email");
    var p = document.getElementById("admin-password");
    if (e) e.value = "earthenbeauty@gmail.com";
    if (p) p.value = "EARTHENBEAUTY";
  };

  // Logout
  window.adminLogout = function() {
    localStorage.removeItem("eb_admin_token");
    localStorage.removeItem("eb_admin_user");
    adminToken = null;
    currentAdmin = null;
    showToast("Logged out from admin portal.", "info");
    showLogin();
  };

  // ==========================================
  // TAB NAVIGATION
  // ==========================================
  window.switchTab = function(tabName) {
    activeTab = tabName;
    var tabBtns = document.querySelectorAll(".admin-tab-btn");
    tabBtns.forEach(function(btn) {
      if (btn.getAttribute("data-tab") === tabName) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    var tabPanes = document.querySelectorAll(".admin-tab-pane");
    tabPanes.forEach(function(pane) {
      pane.style.display = "none";
    });

    var activePane = document.getElementById("tab-" + tabName);
    if (activePane) {
      activePane.style.display = "block";
      if (window.AdminMotions && window.AdminMotions.animateTabPaneSwitch) {
        window.AdminMotions.animateTabPaneSwitch("tab-" + tabName);
      }
    }

    if (window.__updateNavTabIndicator) {
      window.__updateNavTabIndicator(tabName);
    }

    if (tabName === "dashboard") {
      loadDashboard();
    } else if (tabName === "products") {
      loadProducts();
    } else if (tabName === "orders") {
      loadOrders();
    } else if (tabName === "inquiries") {
      loadInquiries();
    } else if (tabName === "team") {
      loadTeam();
    }
  };

  // ==========================================
  // TAB 1: DASHBOARD OVERVIEW
  // ==========================================
  async function loadDashboard() {
    try {
      var res = await fetch(apiUrl("/api/admin/dashboard"), {
        headers: { "Authorization": "Bearer " + adminToken }
      });
      if (!res.ok) throw new Error("Failed to load dashboard data");

      var data = await res.json();
      var stats = data.stats;

      // Update stat cards with animated count up
      if (window.AdminMotions && window.AdminMotions.animateCountUp) {
        window.AdminMotions.animateCountUp("dash-revenue", stats.total_revenue || 0, "₹", "");
        window.AdminMotions.animateCountUp("dash-orders", stats.paid_orders || 0, "", " / " + (stats.total_orders || 0));
        window.AdminMotions.animateCountUp("dash-products", stats.active_products || 0, "", "");
        window.AdminMotions.animateCountUp("dash-customers", stats.total_customers || 0, "", "");
      } else {
        var revEl = document.getElementById("dash-revenue");
        var ordEl = document.getElementById("dash-orders");
        var prodEl = document.getElementById("dash-products");
        var custEl = document.getElementById("dash-customers");
        if (revEl) revEl.textContent = "₹" + (stats.total_revenue || 0).toLocaleString("en-IN");
        if (ordEl) ordEl.textContent = stats.paid_orders + " / " + stats.total_orders;
        if (prodEl) prodEl.textContent = stats.active_products;
        if (custEl) custEl.textContent = stats.total_customers;
      }

      // Render recent orders
      renderRecentOrders(data.recent_orders || []);
    } catch (err) {
      if (typeof products !== "undefined" && products.length > 0) {
        var revEl = document.getElementById("dash-revenue");
        var ordEl = document.getElementById("dash-orders");
        var prodEl = document.getElementById("dash-products");
        var custEl = document.getElementById("dash-customers");
        if (revEl) revEl.textContent = "₹0";
        if (ordEl) ordEl.textContent = "0 / 0";
        if (prodEl) prodEl.textContent = products.length;
        if (custEl) custEl.textContent = "0";
        renderRecentOrders([]);
        return;
      }
      showToast(err.message, "error");
    }
  }

  function renderRecentOrders(orders) {
    var tbody = document.getElementById("dash-recent-orders-tbody");
    if (!tbody) return;

    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">No orders recorded yet.</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map(function(o) {
      var payBadge = o.payment_status === "paid" 
        ? '<span class="badge badge-paid">● Paid</span>'
        : '<span class="badge badge-pending">○ Pending</span>';
      
      var shipBadge = '<span class="badge badge-shipped">' + (o.shipment_status || "Processing") + '</span>';

      return '<tr>' +
        '<td><strong>' + o.order_number + '</strong></td>' +
        '<td>' + (o.customer_name || "Guest") + '<br><small style="color:var(--text-muted);">' + (o.customer_phone || "") + '</small></td>' +
        '<td>₹' + Number(o.total_amount).toLocaleString("en-IN") + '</td>' +
        '<td>' + payBadge + '</td>' +
        '<td>' + shipBadge + '</td>' +
        '<td><small style="color:var(--text-muted);">' + new Date(o.created_at).toLocaleDateString() + '</small></td>' +
      '</tr>';
    }).join("");

    if (window.AdminMotions && window.AdminMotions.animateTableRows) {
      window.AdminMotions.animateTableRows("dash-recent-orders-tbody");
    }
  }

  // ==========================================
  // TAB 2: PRODUCTS & CATALOG
  // ==========================================
  async function loadProducts() {
    try {
      var res = await fetch(apiUrl("/api/admin/products"), {
        headers: { "Authorization": "Bearer " + adminToken }
      });
      if (!res.ok) throw new Error("Failed to load catalog");

      var data = await res.json();
      allProducts = data.products || [];
      renderProductsTable();
    } catch (err) {
      if (typeof products !== "undefined" && products.length > 0) {
        allProducts = products.slice();
        renderProductsTable();
        return;
      }
      showToast(err.message, "error");
    }
  }

  window.filterProducts = function() {
    renderProductsTable();
  };

  function renderProductsTable() {
    var tbody = document.getElementById("products-table-tbody");
    var searchVal = (document.getElementById("product-search-input") ? document.getElementById("product-search-input").value : "").toLowerCase().trim();
    var catVal = document.getElementById("product-category-filter") ? document.getElementById("product-category-filter").value : "";

    if (!tbody) return;

    var filtered = allProducts.filter(function(p) {
      var matchesSearch = !searchVal || 
        p.name.toLowerCase().indexOf(searchVal) !== -1 ||
        p.category.toLowerCase().indexOf(searchVal) !== -1 ||
        (p.description || "").toLowerCase().indexOf(searchVal) !== -1;
      var matchesCat = !catVal || p.category === catVal;
      return matchesSearch && matchesCat;
    });

    var countBadge = document.getElementById("products-count-badge");
    if (countBadge) countBadge.textContent = filtered.length + " items";

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-muted);">No products found matching filters.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(function(p) {
      var stockBadge = p.in_stock 
        ? '<span class="badge badge-stock-in" style="cursor:pointer;" onclick="toggleStock(' + p.id + ', 0)">● In Stock</span>'
        : '<span class="badge badge-stock-out" style="cursor:pointer;" onclick="toggleStock(' + p.id + ', 1)">○ Out of Stock</span>';

      return '<tr>' +
        '<td>' +
          '<div class="product-cell">' +
            '<img src="' + p.image + '" class="product-thumb" alt="' + p.name + '" onerror="this.src=\'images/categories/Candle.jpeg\'">' +
            '<div class="product-cell-info">' +
              '<h4>' + p.name + '</h4>' +
              '<span>' + p.category + (p.subcategory ? " · " + p.subcategory : "") + '</span>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td>' +
          '<div class="price-edit-box">' +
            '₹<input type="number" class="price-input" id="price-input-' + p.id + '" value="' + p.price + '" min="1" step="1">' +
            '<button class="btn-price-save" onclick="saveProductPrice(' + p.id + ')" title="Save updated price">Save</button>' +
          '</div>' +
        '</td>' +
        '<td>' + stockBadge + '</td>' +
        '<td><small style="color:var(--text-muted); max-width:200px; display:inline-block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + (p.description || "Artisanal handcrafted product.") + '</small></td>' +
        '<td>' +
          '<div class="action-buttons">' +
            '<button class="btn-icon" onclick="openEditProductModal(' + p.id + ')" title="Edit product details"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
            '<button class="btn-icon danger" onclick="deleteProduct(' + p.id + ', \'' + p.name.replace(/'/g, "\\'") + '\')" title="Delete product"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join("");

    if (window.AdminMotions && window.AdminMotions.animateTableRows) {
      window.AdminMotions.animateTableRows("products-table-tbody");
    }
  }

  // Inline Price Saver
  window.saveProductPrice = async function(productId) {
    var input = document.getElementById("price-input-" + productId);
    if (!input) return;
    var newPrice = parseFloat(input.value);
    if (isNaN(newPrice) || newPrice <= 0) {
      showToast("Please enter a valid price.", "error");
      return;
    }

    try {
      var res = await fetch(apiUrl("/api/admin/products/" + productId), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + adminToken
        },
        body: JSON.stringify({ price: newPrice })
      });

      if (res.ok) {
        showToast("Price updated to ₹" + newPrice + " successfully! 💰", "success");
        // Update local state
        var target = allProducts.find(function(p) { return p.id === productId; });
        if (target) target.price = newPrice;
        // Also trigger storefront live sync if active
        if (typeof syncProductsFromBackend === "function") syncProductsFromBackend();
      } else {
        throw new Error("Failed to update price");
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Toggle Stock
  window.toggleStock = async function(productId, newStockStatus) {
    try {
      var res = await fetch(apiUrl("/api/admin/products/" + productId), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + adminToken
        },
        body: JSON.stringify({ in_stock: newStockStatus })
      });

      if (res.ok) {
        showToast("Stock status updated.", "success");
        var target = allProducts.find(function(p) { return p.id === productId; });
        if (target) target.in_stock = newStockStatus;
        renderProductsTable();
        if (typeof syncProductsFromBackend === "function") syncProductsFromBackend();
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Delete Product
  window.deleteProduct = async function(productId, productName) {
    if (!confirm("Are you sure you want to permanently delete \"" + productName + "\"?")) {
      return;
    }

    try {
      var res = await fetch(apiUrl("/api/admin/products/" + productId), {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + adminToken }
      });

      if (res.ok) {
        showToast("Product deleted from catalog.", "info");
        allProducts = allProducts.filter(function(p) { return p.id !== productId; });
        renderProductsTable();
        if (typeof syncProductsFromBackend === "function") syncProductsFromBackend();
      } else {
        throw new Error("Failed to delete product");
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ==========================================
  // ADD & EDIT PRODUCT MODAL
  // ==========================================
  window.openAddProductModal = function() {
    currentEditProductId = null;
    uploadedImageUrl = "";
    document.getElementById("product-modal-title").textContent = "Add New Handcrafted Product";
    document.getElementById("modal-prod-name").value = "";
    document.getElementById("modal-prod-category").value = "candles";
    document.getElementById("modal-prod-subcategory").value = "wooden-base";
    document.getElementById("modal-prod-price").value = "";
    document.getElementById("modal-prod-desc").value = "";
    document.getElementById("modal-prod-stock").checked = true;
    document.getElementById("modal-image-preview").style.display = "none";
    document.getElementById("modal-image-preview").src = "";
    document.getElementById("modal-image-url-input").value = "";

    var modal = document.getElementById("product-modal");
    modal.style.display = "flex";
    modal.classList.add("open");
    if (window.AdminMotions && window.AdminMotions.animateModalOpen) {
      window.AdminMotions.animateModalOpen("product-modal");
    }
  };

  window.openEditProductModal = function(productId) {
    var p = allProducts.find(function(item) { return item.id === productId; });
    if (!p) return;

    currentEditProductId = productId;
    uploadedImageUrl = p.image || "";
    document.getElementById("product-modal-title").textContent = "Edit Product: " + p.name;
    document.getElementById("modal-prod-name").value = p.name;
    document.getElementById("modal-prod-category").value = p.category;
    document.getElementById("modal-prod-subcategory").value = p.subcategory || "";
    document.getElementById("modal-prod-price").value = p.price;
    document.getElementById("modal-prod-desc").value = p.description || "";
    document.getElementById("modal-prod-stock").checked = !!p.in_stock;

    var preview = document.getElementById("modal-image-preview");
    if (p.image) {
      preview.src = p.image;
      preview.style.display = "block";
      document.getElementById("modal-image-url-input").value = p.image;
    } else {
      preview.style.display = "none";
      document.getElementById("modal-image-url-input").value = "";
    }

    var modal = document.getElementById("product-modal");
    modal.style.display = "flex";
    modal.classList.add("open");
    if (window.AdminMotions && window.AdminMotions.animateModalOpen) {
      window.AdminMotions.animateModalOpen("product-modal");
    }
  };

  window.closeProductModal = function() {
    var modal = document.getElementById("product-modal");
    if (!modal) return;

    if (window.AdminMotions && window.AdminMotions.animateModalClose) {
      window.AdminMotions.animateModalClose("product-modal", function() {
        modal.classList.remove("open");
        modal.style.display = "none";
        modal.style.opacity = "";
        currentEditProductId = null;
      });
    } else {
      modal.classList.remove("open");
      modal.style.display = "none";
      modal.style.opacity = "";
      currentEditProductId = null;
    }
  };

  // Close modal on Escape key press
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" || e.key === "Esc") {
      var modal = document.getElementById("product-modal");
      if (modal && (modal.classList.contains("open") || modal.style.display === "flex")) {
        closeProductModal();
      }
    }
  });

  // File Upload Handler
  var fileInput = document.getElementById("modal-prod-file");
  if (fileInput) {
    fileInput.addEventListener("change", async function(e) {
      var file = e.target.files[0];
      if (!file) return;

      var formData = new FormData();
      formData.append("file", file);

      showToast("Uploading product photograph...", "info");

      try {
        var res = await fetch(apiUrl("/api/admin/upload-image"), {
          method: "POST",
          headers: { "Authorization": "Bearer " + adminToken },
          body: formData
        });
        var data = await res.json();
        if (res.ok && data.success) {
          uploadedImageUrl = data.image_url;
          var preview = document.getElementById("modal-image-preview");
          preview.src = uploadedImageUrl;
          preview.style.display = "block";
          document.getElementById("modal-image-url-input").value = uploadedImageUrl;
          showToast("Photo uploaded successfully! 📸", "success");
        } else {
          showToast(data.detail || "Upload failed", "error");
        }
      } catch (err) {
        showToast("Error uploading image: " + err.message, "error");
      }
    });
  }

  // Save Product (Create or Update)
  window.saveProductModal = async function() {
    var saveBtn = document.querySelector("#product-modal .btn-accent");
    var originalText = saveBtn ? saveBtn.textContent : "Save Product";

    var name = document.getElementById("modal-prod-name").value.trim();
    var category = document.getElementById("modal-prod-category").value;
    var subcategory = document.getElementById("modal-prod-subcategory").value.trim();
    var price = parseFloat(document.getElementById("modal-prod-price").value);
    var desc = document.getElementById("modal-prod-desc").value.trim();
    var inStock = document.getElementById("modal-prod-stock").checked ? 1 : 0;
    var manualImgUrl = document.getElementById("modal-image-url-input").value.trim();

    var finalImage = uploadedImageUrl || manualImgUrl || "images/categories/Candle.jpeg";

    if (!name || isNaN(price) || price <= 0) {
      showToast("Please provide a valid product name and price.", "error");
      return;
    }

    var payload = {
      name: name,
      category: category,
      subcategory: subcategory,
      price: price,
      image: finalImage,
      description: desc,
      in_stock: inStock
    };

    try {
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving... ✨";
      }

      if (currentEditProductId) {
        // Update existing
        var res = await fetch(apiUrl("/api/admin/products/" + currentEditProductId), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + adminToken
          },
          body: JSON.stringify(payload)
        });
        var data = await res.json().catch(function() { return {}; });

        if (res.ok && data.success !== false) {
          showToast("Product updated successfully! ✨", "success");
          closeProductModal();
          await loadProducts();
          if (typeof syncProductsFromBackend === "function") syncProductsFromBackend();
        } else {
          throw new Error(data.detail || data.message || "Update failed");
        }
      } else {
        // Create new
        var res = await fetch(apiUrl("/api/admin/products"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + adminToken
          },
          body: JSON.stringify(payload)
        });
        var data = await res.json().catch(function() { return {}; });

        if (res.ok && data.success) {
          showToast("New product published to storefront! 🎉", "success");
          closeProductModal();
          await loadProducts();
          if (typeof syncProductsFromBackend === "function") syncProductsFromBackend();
        } else {
          throw new Error(data.detail || data.message || "Failed to create product");
        }
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
      }
    }
  };

  // ==========================================
  // TAB 3: ORDERS & SHIPROCKET FULFILLMENT
  // ==========================================
  async function loadOrders() {
    try {
      var res = await fetch(apiUrl("/api/admin/orders"), {
        headers: { "Authorization": "Bearer " + adminToken }
      });
      if (!res.ok) throw new Error("Failed to load customer orders");

      var data = await res.json();
      allOrders = data.orders || [];
      renderOrdersTable();
    } catch (err) {
      allOrders = [];
      renderOrdersTable();
    }
  }

  window.filterOrders = function() {
    renderOrdersTable();
  };

  function renderOrdersTable() {
    var tbody = document.getElementById("orders-table-tbody");
    var filterStatus = document.getElementById("orders-status-filter") ? document.getElementById("orders-status-filter").value : "";

    if (!tbody) return;

    var filtered = allOrders.filter(function(o) {
      if (!filterStatus) return true;
      if (filterStatus === "paid") return o.payment_status === "paid";
      if (filterStatus === "pending") return o.payment_status !== "paid";
      if (filterStatus === "shipped") return (o.shipment_status || "").toLowerCase().indexOf("ship") !== -1;
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted);">No orders match the selected filter.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(function(o) {
      var payBadge = o.payment_status === "paid"
        ? '<span class="badge badge-paid">● Paid</span>'
        : '<span class="badge badge-pending">○ Pending</span>';

      var addr = o.shipping_address || {};
      var addrStr = [addr.street || addr.address, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ") || "Address on file";

      var itemsList = (o.items || []).map(function(it) {
        return it.quantity + 'x ' + (it.name || "Item") + ' (₹' + it.price + ')';
      }).join("<br>");

      var razorpayInfo = o.razorpay_payment_id 
        ? '<small style="color:var(--sage-green);">ID: ' + o.razorpay_payment_id + '</small>' 
        : '<small style="color:var(--text-muted);">Razorpay: ' + (o.razorpay_order_id || 'N/A') + '</small>';

      var trackingCode = o.tracking_number || o.shipment_tracking_code;
      var shiprocketInfo = trackingCode 
        ? '<strong>' + (o.shipment_status || "Dispatched") + '</strong><br><small style="color:var(--primary-terracotta); font-weight:600;">AWB: ' + trackingCode + '</small>'
        : '<span>' + (o.shipment_status || "Pending Dispatch") + '</span>';

      return '<tr>' +
        '<td>' +
        '<strong>' + o.order_number + '</strong><br>' +
        '<small style="color:var(--text-muted);">' + new Date(o.created_at).toLocaleString() + '</small>' +
        '</td>' +
        '<td>' +
        '<strong>' + (o.customer_name || "Guest") + '</strong><br>' +
        '<small>' + (o.customer_phone || "") + '</small><br>' +
        '<small style="color:var(--text-muted);">' + addrStr + '</small>' +
        '</td>' +
        '<td><div style="font-size:0.82rem; line-height:1.4;">' + (itemsList || "1 Order Item") + '</div></td>' +
        '<td><strong style="color:var(--forest-green); font-size:1rem;">₹' + Number(o.total_amount).toLocaleString("en-IN") + '</strong></td>' +
        '<td>' + payBadge + '<br>' + razorpayInfo + '</td>' +
        '<td>' + shiprocketInfo + '</td>' +
        '<td>' +
        '<select class="form-control" style="padding:4px 8px; font-size:0.78rem;" onchange="updateOrderStatus(' + o.id + ', this.value)">' +
        '<option value="">Update Status...</option>' +
        '<option value="Processing">Mark Processing</option>' +
        '<option value="Shipped">Mark Shipped</option>' +
        '<option value="Delivered">Mark Delivered</option>' +
        '<option value="MarkPaid">Mark Paid</option>' +
        '</select>' +
        '</td>' +
        '</tr>';
    }).join("");

    if (window.AdminMotions && window.AdminMotions.animateTableRows) {
      window.AdminMotions.animateTableRows("orders-table-tbody");
    }
  }

  window.updateOrderStatus = async function(orderId, action) {
    if (!action) return;

    var payload = {};
    if (action === "MarkPaid") {
      payload.payment_status = "paid";
    } else {
      payload.shipment_status = action;
    }

    try {
      var res = await fetch(apiUrl("/api/admin/orders/" + orderId + "/status"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + adminToken
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast("Order status updated! 📦", "success");
        loadOrders();
      } else {
        throw new Error("Failed to update status");
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ==========================================
  // TAB 4: TEAM MANAGEMENT
  // ==========================================
  async function loadTeam() {
    try {
      var res = await fetch(apiUrl("/api/admin/team"), {
        headers: { "Authorization": "Bearer " + adminToken }
      });
      if (!res.ok) throw new Error("Failed to load studio team");

      var data = await res.json();
      allAdmins = data.admins || [];
      renderTeamTable();
    } catch (err) {
      if (currentAdmin) {
        allAdmins = [currentAdmin];
        renderTeamTable();
        return;
      }
      allAdmins = [];
      renderTeamTable();
    }
  }

  function renderTeamTable() {
    var tbody = document.getElementById("team-table-tbody");
    if (!tbody) return;

    tbody.innerHTML = allAdmins.map(function(adm) {
      var isMe = currentAdmin && currentAdmin.id === adm.id;
      var deleteBtn = isMe 
        ? '<span style="font-size:0.75rem; color:var(--text-muted);">(You)</span>'
        : '<button class="btn-icon danger" onclick="deleteAdmin(' + adm.id + ', \'' + adm.email + '\')" title="Remove admin access"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>';

      return '<tr>' +
        '<td><strong>' + adm.name + '</strong></td>' +
        '<td>' + adm.email + '</td>' +
        '<td><span class="badge badge-paid">' + adm.role + '</span></td>' +
        '<td><small style="color:var(--text-muted);">' + new Date(adm.created_at || Date.now()).toLocaleDateString() + '</small></td>' +
        '<td>' + deleteBtn + '</td>' +
        '</tr>';
    }).join("");

    if (window.AdminMotions && window.AdminMotions.animateTableRows) {
      window.AdminMotions.animateTableRows("team-table-tbody");
    }
  }

  window.addNewAdmin = async function(e) {
    if (e) e.preventDefault();
    var name = document.getElementById("new-admin-name").value.trim();
    var email = document.getElementById("new-admin-email").value.trim();
    var password = document.getElementById("new-admin-password").value;
    var role = document.getElementById("new-admin-role").value;

    if (!name || !email || !password) {
      showToast("Please fill in all team member details.", "error");
      return;
    }

    try {
      var res = await fetch(apiUrl("/api/admin/team"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + adminToken
        },
        body: JSON.stringify({ name: name, email: email, password: password, role: role })
      });

      var data = await res.json();
      if (res.ok && data.success) {
        showToast("New administrator added successfully!", "success");
        document.getElementById("new-admin-name").value = "";
        document.getElementById("new-admin-email").value = "";
        document.getElementById("new-admin-password").value = "";
        loadTeam();
      } else {
        showToast(data.detail || "Failed to add admin", "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  window.deleteAdmin = async function(adminId, email) {
    if (!confirm("Are you sure you want to remove administrator " + email + "?")) {
      return;
    }

    try {
      var res = await fetch(apiUrl("/api/admin/team/" + adminId), {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + adminToken }
      });

      var data = await res.json();
      if (res.ok && data.success) {
        showToast("Administrator removed.", "info");
        loadTeam();
      } else {
        showToast(data.detail || "Cannot delete admin", "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ==========================================
  // TAB 4: INQUIRIES & CUSTOM QUOTES
  // ==========================================
  var allInquiries = [];

  async function loadInquiries() {
    try {
      var res = await fetch(apiUrl("/api/admin/inquiries"), {
        headers: { "Authorization": "Bearer " + adminToken }
      });
      if (!res.ok) throw new Error("Failed to load inquiries");

      var data = await res.json();
      allInquiries = data.inquiries || [];
      renderInquiriesTable();
    } catch (err) {
      allInquiries = [];
      renderInquiriesTable();
    }
  }

  window.filterInquiries = function() {
    renderInquiriesTable();
  };

  function renderInquiriesTable() {
    var tbody = document.getElementById("inquiries-table-tbody");
    var filterType = document.getElementById("inquiries-type-filter") ? document.getElementById("inquiries-type-filter").value : "all";

    if (!tbody) return;

    var filtered = allInquiries.filter(function(item) {
      if (filterType === "all") return true;
      if (filterType === "contact") return item.type === "contact";
      if (filterType === "custom_quotes") return item.type === "custom_quote";
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-muted);">No inquiries or quote requests found.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(function(item) {
      var statusBadge = item.status === "new"
        ? '<span class="badge badge-pending">New</span>'
        : (item.status === "contacted" ? '<span class="badge badge-shipped">Contacted</span>' : '<span class="badge badge-paid">Resolved</span>');

      var typeBadge = item.type === "custom_quote"
        ? '<span class="badge" style="background:#fef7e6; color:#8f5c0d; font-weight:600;">Bulk Quote</span>'
        : '<span class="badge" style="background:#edf3ef; color:#294d3c; font-weight:600;">Contact Form</span>';

      return '<tr>' +
        '<td>' +
        typeBadge + '<br>' +
        '<small style="color:var(--text-muted);">' + new Date(item.created_at).toLocaleString() + '</small>' +
        '</td>' +
        '<td>' +
        '<strong>' + (item.name || "Guest") + '</strong><br>' +
        '<small><a href="mailto:' + item.email + '" style="color:var(--primary-terracotta);">' + (item.email || "") + '</a></small><br>' +
        '<small style="color:var(--text-muted);">' + (item.phone || "") + '</small>' +
        '</td>' +
        '<td><strong>' + (item.subject || item.occasion || "General Inquiry") + '</strong>' + (item.quantity ? '<br><small style="color:var(--gold-deep); font-weight:600;">Qty: ' + item.quantity + ' pcs</small>' : '') + '</td>' +
        '<td><div style="font-size:0.82rem; line-height:1.4; max-width:320px;">' + (item.message || item.notes || "No additional notes provided.") + '</div></td>' +
        '<td>' + statusBadge + '</td>' +
        '<td>' +
        '<select class="form-control" style="padding:4px 8px; font-size:0.78rem;" onchange="updateInquiryStatus(' + item.id + ', \'' + item.type + '\', this.value)">' +
        '<option value="">Update...</option>' +
        '<option value="new">Mark New</option>' +
        '<option value="contacted">Mark Contacted</option>' +
        '<option value="resolved">Mark Resolved</option>' +
        '</select>' +
        '</td>' +
        '</tr>';
    }).join("");

    if (window.AdminMotions && window.AdminMotions.animateTableRows) {
      window.AdminMotions.animateTableRows("inquiries-table-tbody");
    }
  }

  window.updateInquiryStatus = async function(id, type, newStatus) {
    if (!newStatus) return;

    try {
      var res = await fetch(apiUrl("/api/admin/inquiries/" + id + "/status"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + adminToken
        },
        body: JSON.stringify({ type: type, status: newStatus })
      });

      if (res.ok) {
        showToast("Inquiry status updated successfully.", "success");
        loadInquiries();
      } else {
        throw new Error("Failed to update status");
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ==========================================
  // TOAST NOTIFICATIONS
  // ==========================================
  function showToast(message, type) {
    var container = document.getElementById("admin-toast-container");
    if (!container) return;

    var toast = document.createElement("div");
    toast.className = "admin-toast " + (type || "info");
    var iconSvg = type === "success" 
      ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
      : (type === "error" 
          ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' 
          : '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>');

    toast.innerHTML = '<span class="toast-icon" style="display:inline-flex; align-items:center;">' + iconSvg + '</span><span>' + message + '</span>';
    container.appendChild(toast);

    setTimeout(function() {
      toast.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 400);
    }, 3800);
  }

  // Initialize on load
  document.addEventListener("DOMContentLoaded", initAdmin);
})();
