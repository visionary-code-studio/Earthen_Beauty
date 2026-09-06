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
async function proceedToRazorpayPayment(e) {
  e.preventDefault();
  var err = document.getElementById("address-error-msg");
  if (err) err.style.display = "none";

  var name = document.getElementById("addr-name").value.trim();
  var phone = document.getElementById("addr-phone").value.trim();
  var email = document.getElementById("addr-email").value.trim();
  var street = document.getElementById("addr-street").value.trim();
  var city = document.getElementById("addr-city").value.trim();
  var state = document.getElementById("addr-state").value.trim();
  var pincode = document.getElementById("addr-pincode").value.trim();

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
    // Custom Gift Box Checkout
    items = window.__customCheckoutData.items;
    subtotal = window.__customCheckoutData.subtotal;
    orderType = "custom_gift_box";
  } else {
    items = getCart();
    subtotal = getCartSubtotal();
  }

  var totalAmount = subtotal + SHIPPING_FEE;

  try {
    var submitBtn = e.target.querySelector("button[type='submit']");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Connecting to Secure Gateway...";
    }

    // 1. Create order on backend
    var authHeaders = { "Content-Type": "application/json" };
    var custToken = (typeof getCustomerToken === "function") ? getCustomerToken() : null;
    if (custToken) authHeaders["Authorization"] = "Bearer " + custToken;

    var apiBase = window.EB_API_BASE || (window.location.protocol === "file:" ? "http://127.0.0.1:8000" : "");
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
      })
    });

    var orderData = await res.json();
    if (!res.ok) throw new Error(orderData.detail || "Could not create payment order.");

    // 2. Launch Razorpay Checkout Modal
    if (typeof Razorpay !== "undefined" && !orderData.is_demo) {
      var options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Earthen Beauty by Nupur",
        description: "Handcrafted Luxury Candles & Aromatics",
        image: "images/categories/Candle.jpeg",
        order_id: orderData.razorpay_order_id,
        handler: async function(response) {
          await verifyAndCompleteOrder(orderData.order_number, response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
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
    } else {
      // Sandbox / Demo Simulation (When using test keys or demo environment)
      var fakePayId = "pay_demo_" + Math.random().toString(36).substring(2, 10);
      var fakeSig = "demo_sig_approved";
      await verifyAndCompleteOrder(orderData.order_number, orderData.razorpay_order_id, fakePayId, fakeSig);
    }
  } catch (ex) {
    if (err) {
      err.textContent = ex.message;
      err.style.display = "block";
    }
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Pay via Razorpay (UPI / Card / NetBanking) 🔒";
    }
  }
}

// Verify payment with backend & trigger Shiprocket dispatch
async function verifyAndCompleteOrder(orderNumber, razorpayOrderId, razorpayPaymentId, razorpaySignature) {
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
        razorpay_signature: razorpaySignature
      })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Payment verification failed");

    // Order Success!
    if (!window.__customCheckoutData) {
      clearCart();
    }
    window.__customCheckoutData = null;

    closeCustomerModal("checkout-address-modal");

    // Display confirmation
    var numEl = document.getElementById("success-order-num");
    var trkEl = document.getElementById("success-tracking-num");
    if (numEl) numEl.textContent = orderNumber;
    if (trkEl) trkEl.textContent = (data.shipment && data.shipment.tracking_number) ? data.shipment.tracking_number : "Assigned (Shiprocket)";

    var successModal = document.getElementById("order-success-modal");
    if (successModal) successModal.classList.add("active");
  } catch (e) {
    alert("Payment verification issue: " + e.message);
  }
}

// Initialize cart on page load
document.addEventListener("DOMContentLoaded", function() {
  updateCartCount();
});

