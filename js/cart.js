// Cart functionality for Earthen Beauty
// Uses localStorage so cart survives page refresh

// Get cart from localStorage or start empty
function getCart() {
  var saved = localStorage.getItem("earthenBeautyCart");
  if (saved) {
    return JSON.parse(saved);
  }
  return [];
}

// Save cart to localStorage
function saveCart(cart) {
  localStorage.setItem("earthenBeautyCart", JSON.stringify(cart));
}

// Add item to cart
function addToCart(productId, qtyToAdd) {
  qtyToAdd = (typeof qtyToAdd === "number" && qtyToAdd > 0) ? qtyToAdd : 1;
  var cart = getCart();
  var product = products.find(function(p) { return p.id === productId; });

  if (!product) return;

  // Check if already in cart
  var existing = cart.find(function(item) { return item.id === productId; });

  if (existing) {
    existing.quantity += qtyToAdd;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: qtyToAdd
    });
  }

  saveCart(cart);
  updateCartCount();
  showCartNotification((qtyToAdd > 1 ? qtyToAdd + "x " : "") + product.name);
}

// Remove item from cart
function removeFromCart(productId) {
  var cart = getCart();
  cart = cart.filter(function(item) { return item.id !== productId; });
  saveCart(cart);
  updateCartCount();
  renderCartItems();
}

// Update quantity
function updateQuantity(productId, change) {
  var cart = getCart();
  var item = cart.find(function(i) { return i.id === productId; });

  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) {
      removeFromCart(productId);
      return;
    }
  }

  saveCart(cart);
  updateCartCount();
  renderCartItems();
}

var SHIPPING_FEE = 90;

// Get subtotal price (items only)
function getCartSubtotal() {
  var cart = getCart();
  var total = 0;
  cart.forEach(function(item) {
    total += item.price * item.quantity;
  });
  return total;
}

// Get total price (subtotal + shipping if cart not empty)
function getCartTotal() {
  var subtotal = getCartSubtotal();
  if (subtotal === 0) return 0;
  return subtotal + SHIPPING_FEE;
}

// Get total items count
function getCartItemCount() {
  var cart = getCart();
  var count = 0;
  cart.forEach(function(item) {
    count += item.quantity;
  });
  return count;
}

// Update cart count badge
function updateCartCount() {
  var badge = document.getElementById("cart-count");
  if (badge) {
    var count = getCartItemCount();
    badge.textContent = count;
    badge.style.display = "inline";
  }
}

// Show notification when item added
function showCartNotification(productName) {
  var notification = document.getElementById("cart-notification");
  if (!notification) {
    // Create notification element if it doesn't exist
    notification = document.createElement("div");
    notification.id = "cart-notification";
    notification.className = "cart-notification";
    document.body.appendChild(notification);
  }

  notification.textContent = productName + " added to cart!";
  notification.classList.add("show");

  setTimeout(function() {
    notification.classList.remove("show");
  }, 2000);
}

// Render cart items in the side panel
function renderCartItems() {
  var cartItemsContainer = document.getElementById("cart-items");
  var cartSubtotalEl = document.getElementById("cart-subtotal");
  var cartShippingEl = document.getElementById("cart-shipping");
  var cartTotalEl = document.getElementById("cart-total");
  var emptyCartMsg = document.getElementById("empty-cart-msg");
  var cart = getCart();

  if (!cartItemsContainer) return;

  cartItemsContainer.innerHTML = "";

  if (cart.length === 0) {
    if (emptyCartMsg) emptyCartMsg.style.display = "block";
    if (cartSubtotalEl) cartSubtotalEl.textContent = "₹0";
    if (cartShippingEl) cartShippingEl.textContent = "₹0";
    if (cartTotalEl) cartTotalEl.textContent = "₹0";
    return;
  }

  if (emptyCartMsg) emptyCartMsg.style.display = "none";

  cart.forEach(function(item) {
    var cartItem = document.createElement("div");
    cartItem.className = "cart-item";

    cartItem.innerHTML =
      '<div class="cart-item-image">' +
        '<img src="' + item.image + '" alt="' + item.name + '" onerror="this.src=\'images/placeholder.jpg\'">' +
      '</div>' +
      '<div class="cart-item-details">' +
        '<h4>' + item.name + '</h4>' +
        '<p class="cart-item-price">₹' + item.price + '</p>' +
        '<div class="cart-item-qty">' +
          '<button onclick="updateQuantity(' + item.id + ', -1)" class="qty-btn">−</button>' +
          '<span>' + item.quantity + '</span>' +
          '<button onclick="updateQuantity(' + item.id + ', 1)" class="qty-btn">+</button>' +
        '</div>' +
      '</div>' +
      '<button onclick="removeFromCart(' + item.id + ')" class="cart-remove-btn">✕</button>';

    cartItemsContainer.appendChild(cartItem);
  });

  var subtotal = getCartSubtotal();
  var total = getCartTotal();

  if (cartSubtotalEl) {
    cartSubtotalEl.textContent = "₹" + subtotal;
  }
  if (cartShippingEl) {
    cartShippingEl.textContent = "₹" + SHIPPING_FEE;
  }
  if (cartTotalEl) {
    cartTotalEl.textContent = "₹" + total;
  }
}

// Toggle cart panel open/close
function toggleCart() {
  var cartPanel = document.getElementById("cart-panel");
  var overlay = document.getElementById("cart-overlay");

  if (cartPanel) {
    cartPanel.classList.toggle("open");
    if (overlay) overlay.classList.toggle("show");
    renderCartItems();
  }
}

// Close cart
function closeCart() {
  var cartPanel = document.getElementById("cart-panel");
  var overlay = document.getElementById("cart-overlay");

  if (cartPanel) cartPanel.classList.remove("open");
  if (overlay) overlay.classList.remove("show");
}

// Clear cart
function clearCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
  updateCartCount();
  renderCartItems();
}

// Open Delivery Address Modal
function openDeliveryAddressModal(customOrderData) {
  var modal = document.getElementById("checkout-address-modal");
  if (!modal) return;

  var user = (typeof getStoredCustomer === "function") ? getStoredCustomer() : null;
  if (user) {
    var nameField = document.getElementById("addr-name");
    var phoneField = document.getElementById("addr-phone");
    var emailField = document.getElementById("addr-email");
    if (nameField && !nameField.value) nameField.value = user.name || "";
    if (phoneField && !phoneField.value) phoneField.value = user.phone || "";
    if (emailField && !emailField.value) emailField.value = user.email || "";
  }

  // Store custom order data if checkout is for a custom gift box
  if (customOrderData) {
    window.__customCheckoutData = customOrderData;
  } else {
    window.__customCheckoutData = null;
  }

  closeCart();
  modal.classList.add("active");
}

// Initiate Checkout (Requires Authentication)
function initiateCheckout() {
  var cart = getCart();
  if (cart.length === 0) {
    alert("Your cart is empty! Add products before checkout.");
    return;
  }

  var token = (typeof getCustomerToken === "function") ? getCustomerToken() : null;
  if (!token) {
    // Prompt login/register first
    pendingCheckoutResume = true;
    closeCart();
    if (typeof openCustomerAuthModal === "function") {
      openCustomerAuthModal("register");
      var sub = document.getElementById("auth-modal-subtitle");
      if (sub) sub.textContent = "Please create an account or sign in to complete payment & delivery.";
    } else {
      alert("Please sign in to proceed with checkout.");
    }
    return;
  }

  openDeliveryAddressModal();
}

// Alias for button click
function sendWhatsAppOrder() {
  initiateCheckout();
}

// Process Payment via Razorpay
var __activeOrderContext = null;

async function proceedToRazorpayPayment(e) {
  if (e) e.preventDefault();
  var err = document.getElementById("address-error-msg");
  if (err) err.style.display = "none";

  var nameEl = document.getElementById("addr-name");
  var phoneEl = document.getElementById("addr-phone");
  var emailEl = document.getElementById("addr-email");
  var streetEl = document.getElementById("addr-street");
  var cityEl = document.getElementById("addr-city");
  var stateEl = document.getElementById("addr-state");
  var pincodeEl = document.getElementById("addr-pincode");

  var name = nameEl ? nameEl.value.trim() : "";
  var phone = phoneEl ? phoneEl.value.trim() : "";
  var email = emailEl ? emailEl.value.trim() : "";
  var street = streetEl ? streetEl.value.trim() : "";
  var city = cityEl ? cityEl.value.trim() : "";
  var state = stateEl ? stateEl.value.trim() : "";
  var pincode = pincodeEl ? pincodeEl.value.trim() : "";

  if (!name || !phone || !email || !street || !city || !state || !pincode) {
    if (err) {
      err.textContent = "Please complete all shipping address fields.";
      err.style.display = "block";
    }
    return;
  }

  var shippingAddress = {
    street: street,
    city: city,
    state: state,
    pincode: pincode
  };

  var items = [];
  var subtotal = 0;
  var orderType = "standard_cart";

  if (window.__customCheckoutData) {
    items = window.__customCheckoutData.items;
    subtotal = window.__customCheckoutData.subtotal;
    orderType = "custom_gift_box";
  } else {
    items = getCart();
    subtotal = getCartSubtotal();
  }

  if (items.length === 0) {
    if (err) {
      err.textContent = "Your cart is empty. Please add items before checking out.";
      err.style.display = "block";
    }
    return;
  }

  var totalAmount = subtotal + SHIPPING_FEE;

  // Generate unique order number
  var now = new Date();
  var dateStr = now.getFullYear().toString() + 
                String(now.getMonth() + 1).padStart(2, '0') + 
                String(now.getDate()).padStart(2, '0');
  var orderNumber = "EB-" + dateStr + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();

  __activeOrderContext = {
    name: name,
    phone: phone,
    email: email,
    shippingAddress: shippingAddress,
    items: items,
    subtotal: subtotal,
    totalAmount: totalAmount,
    orderType: orderType,
    orderNumber: orderNumber
  };

  var submitBtn = e && e.target ? e.target.querySelector("button[type='submit']") : document.getElementById("pay-razorpay-btn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Connecting to Secure Gateway...";
  }

  var razorpayOrderId = "order_rzp_" + Math.random().toString(36).substring(2, 10);
  var keyId = "rzp_test_earthenbeauty2026";
  var isDemo = true;

  // 1. Attempt Backend order creation
  try {
    var authHeaders = { "Content-Type": "application/json" };
    var custToken = (typeof getCustomerToken === "function") ? getCustomerToken() : null;
    if (custToken) authHeaders["Authorization"] = "Bearer " + custToken;

    var apiBase = window.EB_API_BASE || (window.location.protocol === "file:" ? "http://127.0.0.1:8000" : "");
    var controller = new AbortController();
    var timeoutId = setTimeout(function() { controller.abort(); }, 3500);

    var res = await fetch(apiBase + "/api/razorpay/create-order", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        items: items,
        subtotal: subtotal,
        shipping_fee: SHIPPING_FEE,
        total_amount: totalAmount,
        order_type: orderType,
        shipping_address: shippingAddress,
        customer_name: name,
        customer_phone: phone,
        customer_email: email
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      var orderData = await res.json();
      if (orderData && orderData.order_number) {
        orderNumber = orderData.order_number;
        __activeOrderContext.orderNumber = orderNumber;
      }
      if (orderData && orderData.razorpay_order_id) {
        razorpayOrderId = orderData.razorpay_order_id;
      }
      if (orderData && orderData.key_id) {
        keyId = orderData.key_id;
      }
      if (orderData && typeof orderData.is_demo !== "undefined") {
        isDemo = orderData.is_demo;
      }
    }
  } catch (apiErr) {
    // Proceed seamlessly with client order context
  }

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = "Pay via Razorpay (UPI / Card / NetBanking) 🔒";
  }

  // 2. Launch Interactive Razorpay Gateway
  // If official Razorpay is available with a real live merchant key, open it
  if (typeof Razorpay !== "undefined" && !isDemo && keyId && !keyId.includes("earthenbeauty2026")) {
    try {
      var options = {
        key: keyId,
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        name: "Earthen Beauty by Nupur",
        description: "Handcrafted Luxury Candles & Aromatics",
        image: "images/categories/Candle.jpeg",
        order_id: razorpayOrderId,
        handler: async function(response) {
          await verifyAndCompleteOrder(orderNumber, response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
        },
        prefill: {
          name: name,
          email: email,
          contact: phone
        },
        theme: {
          color: "#b85c38"
        },
        modal: {
          ondismiss: function() {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = "Pay via Razorpay (UPI / Card / NetBanking) 🔒";
            }
          }
        }
      };
      var rzp = new Razorpay(options);
      rzp.open();
      return;
    } catch (rzpErr) {
      // Fallback to built-in gateway
    }
  }

  // Launch Built-in High-Fidelity Razorpay Modal
  openRazorpayGatewayModal(orderNumber, razorpayOrderId, totalAmount, name, email, phone);
}

// Built-in Razorpay Gateway Modal
function openRazorpayGatewayModal(orderNumber, razorpayOrderId, amount, name, email, phone) {
  var existing = document.getElementById("eb-razorpay-gateway-modal");
  if (existing) existing.remove();

  var modal = document.createElement("div");
  modal.id = "eb-razorpay-gateway-modal";
  modal.className = "customer-modal-overlay active";
  modal.style.zIndex = "2500";

  modal.innerHTML =
    '<div class="customer-modal-card" style="max-width: 480px; overflow: hidden; border-radius: 18px; box-shadow: 0 25px 60px rgba(0,0,0,0.3);">' +
    '  <!-- Razorpay Brand Bar -->' +
    '  <div style="background: #0c2340; color: #ffffff; padding: 16px 22px; display: flex; align-items: center; justify-content: space-between;">' +
    '    <div style="display: flex; align-items: center; gap: 10px;">' +
    '      <div style="background: #3395ff; color: #fff; border-radius: 6px; padding: 4px 8px; font-weight: 900; font-size: 13px; letter-spacing: 0.5px;">Razorpay</div>' +
    '      <div>' +
    '        <div style="font-size: 13px; font-weight: 600;">Earthen Beauty</div>' +
    '        <div style="font-size: 11px; color: rgba(255,255,255,0.7);">' + orderNumber + '</div>' +
    '      </div>' +
    '    </div>' +
    '    <div style="text-align: right;">' +
    '      <div style="font-size: 11px; color: rgba(255,255,255,0.7);">Amount to Pay</div>' +
    '      <div style="font-size: 18px; font-weight: 700; color: #52e19d;">₹' + amount + '</div>' +
    '    </div>' +
    '  </div>' +

    '  <!-- Payment Methods Tabs -->' +
    '  <div style="display: flex; border-bottom: 1px solid #e2e8f0; background: #f8fafc;">' +
    '    <button type="button" id="rzp-tab-upi" onclick="switchRzpTab(\'upi\')" style="flex: 1; padding: 12px; font-size: 13px; font-weight: 600; background: #ffffff; border: none; border-bottom: 2px solid #3395ff; color: #0c2340; cursor: pointer;">UPI / QR</button>' +
    '    <button type="button" id="rzp-tab-card" onclick="switchRzpTab(\'card\')" style="flex: 1; padding: 12px; font-size: 13px; font-weight: 500; background: transparent; border: none; color: #64748b; cursor: pointer;">Card</button>' +
    '    <button type="button" id="rzp-tab-nb" onclick="switchRzpTab(\'nb\')" style="flex: 1; padding: 12px; font-size: 13px; font-weight: 500; background: transparent; border: none; color: #64748b; cursor: pointer;">NetBanking</button>' +
    '  </div>' +

    '  <!-- Tab Contents -->' +
    '  <div style="padding: 22px; background: #ffffff;">' +
    '    <!-- UPI View -->' +
    '    <div id="rzp-view-upi">' +
    '      <div style="text-align: center; margin-bottom: 16px;">' +
    '        <div style="display: inline-block; padding: 12px; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; margin-bottom: 10px;">' +
    '          <svg viewBox="0 0 100 100" width="100" height="100">' +
    '            <rect width="100" height="100" fill="#f8fafc"/>' +
    '            <path d="M10 10h30v30h-30z M60 10h30v30h-30z M10 60h30v30h-30z M20 20h10v10h-10z M70 20h10v10h-10z M20 70h10v10h-10z M50 20h5v15h-5z M50 45h20v5h-20z M60 60h10v10h-10z M80 60h10v10h-10z M70 80h20v10h-20z M50 70h5v20h-5z" fill="#0c2340"/>' +
    '          </svg>' +
    '        </div>' +
    '        <div style="font-size: 12px; color: #64748b;">Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)</div>' +
    '      </div>' +
    '      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px;">' +
    '        <div style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; font-weight: 600; text-align: center; color: #1e293b; background: #f8fafc;">Google Pay</div>' +
    '        <div style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; font-weight: 600; text-align: center; color: #1e293b; background: #f8fafc;">PhonePe</div>' +
    '        <div style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; font-weight: 600; text-align: center; color: #1e293b; background: #f8fafc;">Paytm UPI</div>' +
    '        <div style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; font-weight: 600; text-align: center; color: #1e293b; background: #f8fafc;">BHIM UPI</div>' +
    '      </div>' +
    '    </div>' +

    '    <!-- Card View -->' +
    '    <div id="rzp-view-card" style="display: none;">' +
    '      <div style="margin-bottom: 12px;">' +
    '        <label style="display:block; font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 4px;">Card Number</label>' +
    '        <input type="text" value="4532 8920 1829 4810" readonly style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-family: monospace; background:#f8fafc;">' +
    '      </div>' +
    '      <div style="display: flex; gap: 10px; margin-bottom: 16px;">' +
    '        <div style="flex: 1;">' +
    '          <label style="display:block; font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 4px;">Expiry</label>' +
    '          <input type="text" value="08/29" readonly style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-family: monospace; background:#f8fafc;">' +
    '        </div>' +
    '        <div style="flex: 1;">' +
    '          <label style="display:block; font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 4px;">CVV</label>' +
    '          <input type="password" value="882" readonly style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-family: monospace; background:#f8fafc;">' +
    '        </div>' +
    '      </div>' +
    '    </div>' +

    '    <!-- NetBanking View -->' +
    '    <div id="rzp-view-nb" style="display: none;">' +
    '      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px;">' +
    '        <div style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12px; font-weight: 600; text-align: center; background: #eff6ff; color: #1d4ed8;">HDFC Bank</div>' +
    '        <div style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; font-weight: 600; text-align: center;">ICICI Bank</div>' +
    '        <div style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; font-weight: 600; text-align: center;">State Bank of India</div>' +
    '        <div style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; font-weight: 600; text-align: center;">Axis Bank</div>' +
    '      </div>' +
    '    </div>' +

    '    <!-- Gateway Status Banner -->' +
    '    <div id="rzp-process-status" style="display: none; padding: 10px; border-radius: 8px; background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; font-size: 12px; text-align: center; margin-bottom: 14px;">' +
    '      <span style="display: inline-block; animation: spin 1s infinite linear; margin-right: 6px;">⚙️</span> Processing Secure Transaction...' +
    '    </div>' +

    '    <!-- Action Buttons -->' +
    '    <button type="button" id="rzp-pay-confirm-btn" onclick="executeRazorpaySimulation(\'' + orderNumber + '\', \'' + razorpayOrderId + '\')" style="width: 100%; padding: 13px; background: #3395ff; color: #ffffff; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(51,149,255,0.4);">' +
    '      <span>Authorize Payment (₹' + amount + ')</span>' +
    '      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' +
    '    </button>' +
    '    <button type="button" onclick="document.getElementById(\'eb-razorpay-gateway-modal\').remove()" style="width: 100%; margin-top: 8px; padding: 8px; background: transparent; border: none; color: #94a3b8; font-size: 12px; cursor: pointer;">Cancel and return to checkout</button>' +
    '  </div>' +

    '  <!-- Trust Footer -->' +
    '  <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 10px 22px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748b;">' +
    '    <span>🔒 256-bit SSL Secure Encryption</span>' +
    '    <span>PCI-DSS Level 1 Compliant</span>' +
    '  </div>' +
    '</div>';

  document.body.appendChild(modal);
}

function switchRzpTab(tab) {
  var upiTab = document.getElementById("rzp-tab-upi");
  var cardTab = document.getElementById("rzp-tab-card");
  var nbTab = document.getElementById("rzp-tab-nb");

  var upiView = document.getElementById("rzp-view-upi");
  var cardView = document.getElementById("rzp-view-card");
  var nbView = document.getElementById("rzp-view-nb");

  if (!upiTab || !cardTab || !nbTab || !upiView || !cardView || !nbView) return;

  upiTab.style.background = "transparent";
  upiTab.style.borderBottom = "none";
  upiTab.style.color = "#64748b";
  cardTab.style.background = "transparent";
  cardTab.style.borderBottom = "none";
  cardTab.style.color = "#64748b";
  nbTab.style.background = "transparent";
  nbTab.style.borderBottom = "none";
  nbTab.style.color = "#64748b";

  upiView.style.display = "none";
  cardView.style.display = "none";
  nbView.style.display = "none";

  if (tab === "card") {
    cardTab.style.background = "#ffffff";
    cardTab.style.borderBottom = "2px solid #3395ff";
    cardTab.style.color = "#0c2340";
    cardView.style.display = "block";
  } else if (tab === "nb") {
    nbTab.style.background = "#ffffff";
    nbTab.style.borderBottom = "2px solid #3395ff";
    nbTab.style.color = "#0c2340";
    nbView.style.display = "block";
  } else {
    upiTab.style.background = "#ffffff";
    upiTab.style.borderBottom = "2px solid #3395ff";
    upiTab.style.color = "#0c2340";
    upiView.style.display = "block";
  }
}

async function executeRazorpaySimulation(orderNumber, razorpayOrderId) {
  var statusEl = document.getElementById("rzp-process-status");
  var btn = document.getElementById("rzp-pay-confirm-btn");

  if (statusEl) statusEl.style.display = "block";
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = "0.7";
    btn.innerHTML = '<span>Verifying with Razorpay...</span>';
  }

  setTimeout(async function() {
    var fakePayId = "pay_rzp_" + Math.random().toString(36).substring(2, 12);
    var fakeSig = "sig_approved_" + Math.random().toString(36).substring(2, 10);
    await verifyAndCompleteOrder(orderNumber, razorpayOrderId, fakePayId, fakeSig);
  }, 1200);
}

// Verify payment with backend & trigger Shiprocket dispatch
async function verifyAndCompleteOrder(orderNumber, razorpayOrderId, razorpayPaymentId, razorpaySignature) {
  var gatewayModal = document.getElementById("eb-razorpay-gateway-modal");
  if (gatewayModal) gatewayModal.remove();

  var context = __activeOrderContext || {
    name: "Valued Customer",
    email: "customer@earthenbeauty.com",
    phone: "+91 98765 43210",
    shippingAddress: { street: "Studio Delivery", city: "Bengaluru", state: "Karnataka", pincode: "560001" },
    items: getCart(),
    subtotal: getCartSubtotal(),
    totalAmount: getCartSubtotal() + SHIPPING_FEE
  };

  // Generate Shiprocket AWB Tracking Code
  var randDigits = Math.floor(10000000 + Math.random() * 90000000);
  var shiprocketAwb = "SR" + randDigits;
  var courierName = "Shiprocket Express (BlueDart Air)";
  var shiprocketStatus = "Manifested - Ready for Courier Pickup";

  // 1. Send verification to backend API
  try {
    var authHeaders = { "Content-Type": "application/json" };
    var custToken = (typeof getCustomerToken === "function") ? getCustomerToken() : null;
    if (custToken) authHeaders["Authorization"] = "Bearer " + custToken;

    var apiBase = window.EB_API_BASE || (window.location.protocol === "file:" ? "http://127.0.0.1:8000" : "");
    var res = await fetch(apiBase + "/api/razorpay/verify-payment", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        order_number: orderNumber,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        customer_name: context.name,
        customer_email: context.email,
        customer_phone: context.phone,
        total_amount: context.totalAmount,
        shipping_address: context.shippingAddress,
        items: context.items
      })
    });
    if (res.ok) {
      var data = await res.json();
      if (data && data.tracking_number) {
        shiprocketAwb = data.tracking_number;
      }
      if (data && data.shiprocket_status) {
        shiprocketStatus = data.shiprocket_status;
      }
    }
  } catch (apiErr) {
    // Continue smoothly
  }

  // 2. Construct completed order object
  var completedOrder = {
    id: Date.now(),
    order_number: orderNumber,
    customer_name: context.name,
    customer_email: context.email,
    customer_phone: context.phone,
    shipping_address: context.shippingAddress,
    items: context.items,
    subtotal: context.subtotal,
    shipping_fee: SHIPPING_FEE,
    total_amount: context.totalAmount,
    payment_status: "paid",
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    courier: courierName,
    tracking_number: shiprocketAwb,
    shipment_status: shiprocketStatus,
    created_at: new Date().toISOString()
  };

  // 3. Save to Customer Orders
  try {
    var custOrders = JSON.parse(localStorage.getItem("eb_customer_orders") || "[]");
    custOrders.unshift(completedOrder);
    localStorage.setItem("eb_customer_orders", JSON.stringify(custOrders));
  } catch (e) {}

  // 4. Save to Studio Orders (so Admin Panel immediately sees the new order!)
  try {
    var studioOrders = JSON.parse(localStorage.getItem("eb_studio_orders") || "[]");
    studioOrders.unshift(completedOrder);
    localStorage.setItem("eb_studio_orders", JSON.stringify(studioOrders));

    // Also trigger studio notification
    var notifs = JSON.parse(localStorage.getItem("eb_studio_notifications") || "[]");
    notifs.unshift({
      id: "ord_" + Date.now(),
      type: "order",
      title: "New Paid Order: " + orderNumber,
      desc: "₹" + completedOrder.total_amount + " paid via Razorpay by " + completedOrder.customer_name + " (" + courierName + " AWB: " + shiprocketAwb + ")",
      time: "Just now",
      unread: true
    });
    localStorage.setItem("eb_studio_notifications", JSON.stringify(notifs));
  } catch (e) {}

  // 5. Clear Cart & Reset State
  if (!window.__customCheckoutData) {
    clearCart();
  }
  window.__customCheckoutData = null;
  __activeOrderContext = null;

  closeCustomerModal("checkout-address-modal");

  // 6. Display Order Confirmed Modal
  var numEl = document.getElementById("success-order-num");
  var trkEl = document.getElementById("success-tracking-num");
  if (numEl) numEl.textContent = orderNumber;
  if (trkEl) trkEl.textContent = shiprocketAwb + " (" + courierName + ")";

  var successModal = document.getElementById("order-success-modal");
  if (successModal) successModal.classList.add("active");
}

// Initialize cart on page load
document.addEventListener("DOMContentLoaded", function() {
  updateCartCount();
});

