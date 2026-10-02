/* ==========================================================================
   CINDER & CEDAR COFFEE ROASTERS — APPLICATION CORE (script.js)
   Shop, Cart, Quick View, Checkout & Accessibility Logic
   Complete Production Script with Round 2 Polish & Safety Checks
   ========================================================================== */

(function () {
  "use strict";

  /* --------------------------------------------------------------------------
     1. GLOBAL APPLICATION STATE
     -------------------------------------------------------------------------- */
  const state = {
    cart: [],
    appliedPromo: null,
    activeCategory: "all",
    searchQuery: "",
    sortOption: "featured",
    customerInfo: null,
    lastActiveElement: null
  };

  /* --------------------------------------------------------------------------
     2. LOCAL STORAGE CART PERSISTENCE (cc_cart_v1 ONLY)
     Strict Privacy: No user personal data is ever saved to localStorage.
     -------------------------------------------------------------------------- */
  function loadCartFromStorage() {
    try {
      const raw = localStorage.getItem(BRAND.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      // Validate against catalog data
      return parsed.filter(item => {
        const prod = PRODUCTS.find(p => p.id === item.productId);
        if (!prod) return false;
        if (!prod.prices[item.size]) return false;
        item.quantity = Math.max(1, Math.min(10, Math.floor(Number(item.quantity) || 1)));
        return true;
      });
    } catch (err) {
      console.warn("Could not read cart from localStorage:", err);
      return [];
    }
  }

  function saveCartToStorage() {
    try {
      localStorage.setItem(BRAND.storageKey, JSON.stringify(state.cart));
    } catch (err) {
      console.warn("Could not write cart to localStorage:", err);
    }
  }

  /* --------------------------------------------------------------------------
     3. FINANCIAL MATH CALCULATIONS (INTEGER CENTS)
     -------------------------------------------------------------------------- */
  function calculateCartTotals() {
    let subtotalCents = 0;
    let totalItemCount = 0;

    state.cart.forEach(item => {
      const product = PRODUCTS.find(p => p.id === item.productId);
      if (!product) return;

      const basePrice = product.prices[item.size] || 0;
      let unitPrice = basePrice;

      if (item.isSubscription) {
        const subDiscount = Math.round(basePrice * (BRAND.subscriptionDiscountPercent / 100));
        unitPrice = basePrice - subDiscount;
      }

      subtotalCents += unitPrice * item.quantity;
      totalItemCount += item.quantity;
    });

    let promoDiscountCents = 0;
    if (state.appliedPromo === BRAND.promoCode) {
      promoDiscountCents = Math.round(subtotalCents * (BRAND.promoDiscountPercent / 100));
    }

    const netSubtotalCents = Math.max(0, subtotalCents - promoDiscountCents);

    let shippingCents = 0;
    if (netSubtotalCents > 0) {
      if (netSubtotalCents >= BRAND.freeShippingThresholdCents) {
        shippingCents = 0;
      } else {
        shippingCents = BRAND.standardShippingFeeCents;
      }
    }

    const grandTotalCents = netSubtotalCents + shippingCents;

    return {
      subtotalCents,
      promoDiscountCents,
      netSubtotalCents,
      shippingCents,
      grandTotalCents,
      totalItemCount
    };
  }

  /* --------------------------------------------------------------------------
     4. ACCESSIBLE TOAST NOTIFICATIONS (BOTTOM-CENTER ONLY)
     -------------------------------------------------------------------------- */
  function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast-message toast--${type}`;
    toast.setAttribute("role", "status");
    toast.textContent = message;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("is-visible");
    });

    setTimeout(() => {
      toast.classList.remove("is-visible");
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  /* --------------------------------------------------------------------------
     5. CART DRAWER & UI UPDATES
     -------------------------------------------------------------------------- */
  function updateCartBadge() {
    const badge = document.getElementById("cart-badge");
    const { totalItemCount } = calculateCartTotals();
    if (badge) {
      badge.textContent = String(totalItemCount);
    }
  }

  function renderCartDrawer() {
    const itemsContainer = document.getElementById("cart-items-container");
    const emptyView = document.getElementById("cart-empty-view");
    const footer = document.getElementById("cart-footer");
    const subtotalEl = document.getElementById("cart-subtotal-val");
    const discountRow = document.getElementById("cart-discount-row");
    const discountLabel = document.getElementById("cart-discount-label");
    const discountVal = document.getElementById("cart-discount-val");
    const shippingEl = document.getElementById("cart-shipping-val");
    const totalEl = document.getElementById("cart-total-val");
    const progressText = document.getElementById("shipping-progress-text");
    const progressFill = document.getElementById("shipping-progress-fill");

    if (!itemsContainer || !emptyView || !footer) return;

    const totals = calculateCartTotals();
    updateCartBadge();

    if (state.cart.length === 0) {
      itemsContainer.innerHTML = "";
      itemsContainer.style.display = "none";
      emptyView.classList.remove("is-hidden");
      footer.style.display = "none";

      if (progressText && progressFill) {
        progressText.textContent = `Add ${formatMoney(BRAND.freeShippingThresholdCents)} to unlock free shipping`;
        progressFill.style.transform = "scaleX(0)";
      }
      return;
    }

    itemsContainer.style.display = "flex";
    emptyView.classList.add("is-hidden");
    footer.style.display = "block";

    // Free Shipping Progress Fill
    if (progressText && progressFill) {
      if (totals.netSubtotalCents >= BRAND.freeShippingThresholdCents) {
        progressText.textContent = "You've unlocked free shipping";
        progressFill.style.transform = "scaleX(1)";
        progressFill.classList.add("shipping-unlocked");
      } else {
        const remaining = BRAND.freeShippingThresholdCents - totals.netSubtotalCents;
        progressText.textContent = `You're ${formatMoney(remaining)} away from free shipping`;
        const ratio = Math.max(0, Math.min(1, totals.netSubtotalCents / BRAND.freeShippingThresholdCents));
        progressFill.style.transform = `scaleX(${ratio})`;
        progressFill.classList.remove("shipping-unlocked");
      }
    }

    // Line Items Render
    itemsContainer.innerHTML = state.cart.map((item, index) => {
      const product = PRODUCTS.find(p => p.id === item.productId);
      if (!product) return "";

      const basePrice = product.prices[item.size] || 0;
      let unitPrice = basePrice;
      if (item.isSubscription) {
        unitPrice = basePrice - Math.round(basePrice * (BRAND.subscriptionDiscountPercent / 100));
      }
      const lineTotal = unitPrice * item.quantity;
      const thumbSvg = generateBagSvg(product, { width: 44, height: 60 });

      return `
        <div class="cart-item-row" data-line-index="${index}">
          <div class="cart-item__bag-thumb" aria-hidden="true">${thumbSvg}</div>
          <div class="cart-item__details">
            <h4>${product.name}</h4>
            <div class="cart-item__spec">${item.size} &bull; ${item.grind}</div>
            ${item.isSubscription ? `<div class="cart-item__sub-tag">Subscribed (Every ${item.frequency} wks - 10% off)</div>` : ""}
            <div class="cart-item__stepper">
              <button class="cart-qty-btn" type="button" data-cart-action="decrement" data-index="${index}" aria-label="Decrease quantity for ${product.name}">−</button>
              <span class="cart-qty-val" aria-label="Quantity">${item.quantity}</span>
              <button class="cart-qty-btn" type="button" data-cart-action="increment" data-index="${index}" aria-label="Increase quantity for ${product.name}">+</button>
            </div>
          </div>
          <div class="cart-item__end">
            <div class="cart-item__price">${formatMoney(lineTotal)}</div>
            <button class="cart-item__remove-btn" type="button" data-cart-action="remove" data-index="${index}">Remove</button>
          </div>
        </div>
      `;
    }).join("");

    if (subtotalEl) subtotalEl.textContent = formatMoney(totals.subtotalCents);
    
    if (discountRow && discountVal && discountLabel) {
      if (totals.promoDiscountCents > 0) {
        discountRow.style.display = "flex";
        discountLabel.textContent = `Promo (${BRAND.promoCode})`;
        discountVal.textContent = `-${formatMoney(totals.promoDiscountCents)}`;
      } else {
        discountRow.style.display = "none";
      }
    }

    if (shippingEl) {
      shippingEl.textContent = totals.shippingCents === 0 ? "Free" : formatMoney(totals.shippingCents);
    }

    if (totalEl) totalEl.textContent = formatMoney(totals.grandTotalCents);

    document.dispatchEvent(new CustomEvent("cart:updated", { detail: totals }));
  }

  function openCartDrawer() {
    const drawer = document.getElementById("cart-drawer");
    const overlay = document.getElementById("cart-drawer-overlay");
    if (!drawer || !overlay) return;

    state.lastActiveElement = document.activeElement;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    overlay.classList.add("is-active");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("lenis-stopped");

    if (window.lenisInstance) window.lenisInstance.stop();

    renderCartDrawer();

    const closeBtn = document.getElementById("cart-close-btn");
    if (closeBtn) closeBtn.focus();
  }

  function closeCartDrawer() {
    const drawer = document.getElementById("cart-drawer");
    const overlay = document.getElementById("cart-drawer-overlay");
    if (!drawer || !overlay) return;

    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    overlay.classList.remove("is-active");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lenis-stopped");

    if (window.lenisInstance) window.lenisInstance.start();

    if (state.lastActiveElement && typeof state.lastActiveElement.focus === "function") {
      state.lastActiveElement.focus();
    }
  }

  /* --------------------------------------------------------------------------
     6. ADD TO CART HANDLER
     -------------------------------------------------------------------------- */
  function addItemToCart(productId, size, grind, isSubscription, frequency, quantity = 1, sourceElement = null) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = state.cart.findIndex(
      item => item.productId === productId &&
              item.size === size &&
              item.grind === grind &&
              item.isSubscription === isSubscription &&
              (isSubscription ? item.frequency === frequency : true)
    );

    if (existingIndex > -1) {
      state.cart[existingIndex].quantity = Math.min(10, state.cart[existingIndex].quantity + quantity);
    } else {
      state.cart.push({
        productId,
        size,
        grind,
        isSubscription,
        frequency,
        quantity: Math.min(10, quantity)
      });
    }

    saveCartToStorage();
    renderCartDrawer();

    if (sourceElement) {
      const rect = sourceElement.getBoundingClientRect();
      document.dispatchEvent(new CustomEvent("cart:item-added", {
        detail: {
          productId,
          startRect: rect,
          product
        }
      }));
    }

    showToast(`Added ${product.name} to cart`, "success");

    setTimeout(() => {
      openCartDrawer();
    }, 450);
  }

  /* --------------------------------------------------------------------------
     7. PRODUCT CATALOG RENDERING & FILTERING
     -------------------------------------------------------------------------- */
  function getFilteredProducts() {
    return PRODUCTS.filter(prod => {
      if (state.activeCategory !== "all" && prod.categorySlug !== state.activeCategory) {
        return false;
      }
      if (state.searchQuery.trim() !== "") {
        const q = state.searchQuery.toLowerCase().trim();
        const matchesName = prod.name.toLowerCase().includes(q);
        const matchesOrigin = prod.origin.toLowerCase().includes(q);
        const matchesNotes = prod.tastingNotes.some(note => note.toLowerCase().includes(q));
        const matchesCategory = prod.category.toLowerCase().includes(q);
        if (!matchesName && !matchesOrigin && !matchesNotes && !matchesCategory) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      const getMinPrice = p => Object.values(p.prices)[0] || 0;
      if (state.sortOption === "price-asc") {
        return getMinPrice(a) - getMinPrice(b);
      }
      if (state.sortOption === "price-desc") {
        return getMinPrice(b) - getMinPrice(a);
      }
      if (state.sortOption === "name") {
        return a.name.localeCompare(b.name);
      }
      return a.id - b.id;
    });
  }

  function renderProductGrid() {
    const grid = document.getElementById("product-grid");
    const emptyState = document.getElementById("shop-empty-state");
    const countLabel = document.getElementById("shop-result-count");
    if (!grid) return;

    const filtered = getFilteredProducts();

    if (countLabel) {
      countLabel.textContent = `Showing ${filtered.length} of ${PRODUCTS.length} coffees`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = "";
      if (emptyState) emptyState.classList.remove("is-hidden");
      return;
    }

    if (emptyState) emptyState.classList.add("is-hidden");

    grid.innerHTML = filtered.map(product => {
      const bagSvg = generateBagSvg(product, { width: 180, height: 240 });
      const firstSize = Object.keys(product.prices)[0];
      const startingPrice = product.prices[firstSize];

      const notesTags = product.tastingNotes
        .map(note => `<span class="note-tag">${note}</span>`)
        .join("");

      return `
        <article class="product-card" data-product-id="${product.id}">
          <div class="product-card__visual">
            ${bagSvg}
            <button class="product-card__quick-btn" type="button" data-action="quick-view" data-product-id="${product.id}" aria-haspopup="dialog">Quick View</button>
          </div>
          <div class="product-card__body">
            <span class="product-card__category">${product.category}</span>
            <h3 class="product-card__name">${product.name}</h3>
            <div class="product-card__notes">${notesTags}</div>
            <div class="product-card__footer">
              <div class="product-card__price">
                <span>From </span>${formatMoney(startingPrice)}
              </div>
              <button class="product-card__add-btn btn-magnetic" type="button" data-action="quick-add" data-product-id="${product.id}">Add to Cart</button>
            </div>
          </div>
        </article>
      `;
    }).join("");

    document.dispatchEvent(new CustomEvent("shop:rendered"));
  }

  /* --------------------------------------------------------------------------
     8. QUICK VIEW ACCESSIBLE DIALOG
     -------------------------------------------------------------------------- */
  function openQuickView(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    const dialog = document.getElementById("quick-view-dialog");
    const body = document.getElementById("quick-view-body");
    if (!product || !dialog || !body) return;

    state.lastActiveElement = document.activeElement;

    const availableSizes = Object.keys(product.prices);
    let selectedSize = availableSizes[0];
    let selectedGrind = GRIND_OPTIONS[0];
    let isSubscribed = false;
    let selectedFrequency = 4;
    let quantity = 1;

    function renderModalContent() {
      const basePrice = product.prices[selectedSize] || 0;
      let effectiveUnitPrice = basePrice;
      if (isSubscribed) {
        effectiveUnitPrice = basePrice - Math.round(basePrice * (BRAND.subscriptionDiscountPercent / 100));
      }
      const totalDisplay = effectiveUnitPrice * quantity;
      const bagSvg = generateBagSvg(product, { width: 220, height: 290 });

      body.innerHTML = `
        <div class="quick-view-grid">
          <div class="quick-view-visual" aria-hidden="true">
            ${bagSvg}
          </div>
          <div class="quick-view-info">
            <span class="product-card__category">${product.category}</span>
            <h2 id="quick-view-title" class="section-title" style="font-size: var(--text-2xl); margin-bottom: 6px;">${product.name}</h2>
            <div style="font-size: var(--text-xs); color: var(--color-espresso-subtle); margin-bottom: 12px;">
              ${product.origin} &bull; ${product.elevation}
            </div>
            <p style="font-size: var(--text-sm); color: var(--color-espresso-subtle); line-height: 1.5; margin-bottom: 16px;">
              ${product.description}
            </p>

            <!-- Size Selection -->
            <div class="quick-view-options-group">
              <span class="quick-view-option-label">Bag Size</span>
              <div class="radio-pill-group" role="radiogroup" aria-label="Select bag size">
                ${availableSizes.map(sz => `
                  <button type="button" class="radio-pill ${sz === selectedSize ? "is-selected" : ""}" data-option="size" data-value="${sz}" role="radio" aria-checked="${sz === selectedSize}">
                    ${sz} — ${formatMoney(product.prices[sz])}
                  </button>
                `).join("")}
              </div>
            </div>

            <!-- Grind Selection -->
            <div class="quick-view-options-group">
              <span class="quick-view-option-label">Grind Option</span>
              <div class="radio-pill-group" role="radiogroup" aria-label="Select grind option">
                ${GRIND_OPTIONS.map(gr => `
                  <button type="button" class="radio-pill ${gr === selectedGrind ? "is-selected" : ""}" data-option="grind" data-value="${gr}" role="radio" aria-checked="${gr === selectedGrind}">
                    ${gr}
                  </button>
                `).join("")}
              </div>
            </div>

            <!-- Subscribe & Save 10% Card -->
            <div class="sub-toggle-card">
              <div class="sub-toggle-header">
                <label for="qv-sub-checkbox" class="sub-toggle-title">
                  Subscribe &amp; Save <span>10%</span>
                </label>
                <input type="checkbox" id="qv-sub-checkbox" ${isSubscribed ? "checked" : ""} style="width: 18px; height: 18px; cursor: pointer;">
              </div>
              ${isSubscribed ? `
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: var(--text-xs);">
                  <span>Delivery frequency:</span>
                  <select id="qv-freq-select" class="sort-select" style="height: 34px; padding: 0 28px 0 10px; font-size: var(--text-xs);">
                    <option value="2" ${selectedFrequency === 2 ? "selected" : ""}>Every 2 weeks</option>
                    <option value="4" ${selectedFrequency === 4 ? "selected" : ""}>Every 4 weeks</option>
                    <option value="6" ${selectedFrequency === 6 ? "selected" : ""}>Every 6 weeks</option>
                  </select>
                </div>
              ` : `
                <p style="font-size: 11px; color: var(--color-espresso-subtle); margin: 0;">Scheduled small-batch roasting delivered automatically. Cancel or pause anytime.</p>
              `}
            </div>

            <!-- Quantity & Add Action -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 20px; gap: 16px;">
              <div class="cart-item__stepper" style="margin: 0;">
                <button class="cart-qty-btn" type="button" id="qv-qty-minus" aria-label="Decrease quantity">−</button>
                <span class="cart-qty-val" id="qv-qty-val">${quantity}</span>
                <button class="cart-qty-btn" type="button" id="qv-qty-plus" aria-label="Increase quantity">+</button>
              </div>

              <button id="qv-add-btn" class="btn btn-primary btn-magnetic" type="button" style="flex-grow: 1;">
                Add &bull; ${formatMoney(totalDisplay)}
              </button>
            </div>
          </div>
        </div>
      `;

      body.querySelectorAll('[data-option="size"]').forEach(btn => {
        btn.addEventListener("click", () => {
          selectedSize = btn.dataset.value;
          renderModalContent();
        });
      });

      body.querySelectorAll('[data-option="grind"]').forEach(btn => {
        btn.addEventListener("click", () => {
          selectedGrind = btn.dataset.value;
          renderModalContent();
        });
      });

      const subCheckbox = body.querySelector("#qv-sub-checkbox");
      if (subCheckbox) {
        subCheckbox.addEventListener("change", (e) => {
          isSubscribed = e.target.checked;
          renderModalContent();
        });
      }

      const freqSelect = body.querySelector("#qv-freq-select");
      if (freqSelect) {
        freqSelect.addEventListener("change", (e) => {
          selectedFrequency = Number(e.target.value);
        });
      }

      const minusBtn = body.querySelector("#qv-qty-minus");
      const plusBtn = body.querySelector("#qv-qty-plus");
      if (minusBtn) {
        minusBtn.addEventListener("click", () => {
          if (quantity > 1) {
            quantity--;
            renderModalContent();
          }
        });
      }
      if (plusBtn) {
        plusBtn.addEventListener("click", () => {
          if (quantity < 10) {
            quantity++;
            renderModalContent();
          }
        });
      }

      const addBtn = body.querySelector("#qv-add-btn");
      if (addBtn) {
        addBtn.addEventListener("click", () => {
          dialog.close();
          document.body.classList.remove("lenis-stopped");
          if (window.lenisInstance) window.lenisInstance.start();

          addItemToCart(
            product.id,
            selectedSize,
            selectedGrind,
            isSubscribed,
            selectedFrequency,
            quantity,
            dialog
          );
        });
      }
    }

    renderModalContent();

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }

    document.body.classList.add("lenis-stopped");
    if (window.lenisInstance) window.lenisInstance.stop();

    const closeBtn = document.getElementById("quick-view-close-btn");
    if (closeBtn) closeBtn.focus();
  }

  function closeQuickView() {
    const dialog = document.getElementById("quick-view-dialog");
    if (!dialog) return;

    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }

    document.body.classList.remove("lenis-stopped");
    if (window.lenisInstance) window.lenisInstance.start();

    if (state.lastActiveElement && typeof state.lastActiveElement.focus === "function") {
      state.lastActiveElement.focus();
    }
  }

  /* --------------------------------------------------------------------------
     9. 2-STEP DEMO CHECKOUT LOGIC
     -------------------------------------------------------------------------- */
  function openCheckoutDialog() {
    const totals = calculateCartTotals();
    if (totals.totalItemCount === 0) {
      showToast("Your cart is empty", "error");
      return;
    }

    closeCartDrawer();

    const dialog = document.getElementById("checkout-dialog");
    const step1 = document.getElementById("checkout-step-1");
    const step2 = document.getElementById("checkout-step-2");
    const step3 = document.getElementById("checkout-step-3");
    if (!dialog || !step1 || !step2 || !step3) return;

    state.lastActiveElement = document.activeElement;

    step1.classList.add("is-active");
    step2.classList.remove("is-active");
    step3.classList.remove("is-active");

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }

    document.body.classList.add("lenis-stopped");
    if (window.lenisInstance) window.lenisInstance.stop();

    const firstInput = document.getElementById("checkout-name");
    if (firstInput) firstInput.focus();
  }

  function closeCheckoutDialog() {
    const dialog = document.getElementById("checkout-dialog");
    if (!dialog) return;

    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }

    document.body.classList.remove("lenis-stopped");
    if (window.lenisInstance) window.lenisInstance.start();

    if (state.lastActiveElement && typeof state.lastActiveElement.focus === "function") {
      state.lastActiveElement.focus();
    }
  }

  function setupCheckoutHandlers() {
    const form = document.getElementById("checkout-shipping-form");
    const step1 = document.getElementById("checkout-step-1");
    const step2 = document.getElementById("checkout-step-2");
    const step3 = document.getElementById("checkout-step-3");
    const backBtn = document.getElementById("checkout-back-btn");
    const submitBtn = document.getElementById("checkout-submit-btn");
    const finishBtn = document.getElementById("checkout-finish-btn");
    const summaryBox = document.getElementById("checkout-summary-box");
    const successBox = document.getElementById("checkout-success-details");

    if (!form || !step1 || !step2 || !step3) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("checkout-name")?.value.trim();
      const email = document.getElementById("checkout-email")?.value.trim();
      const phone = document.getElementById("checkout-phone")?.value.trim();
      const address = document.getElementById("checkout-address")?.value.trim();
      const city = document.getElementById("checkout-city")?.value.trim();
      const stateVal = document.getElementById("checkout-state")?.value.trim().toUpperCase();
      const zip = document.getElementById("checkout-zip")?.value.trim();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const zipRegex = /^\d{5}$/;

      if (!name || !email || !phone || !address || !city || !stateVal || !zip) {
        showToast("Please fill in all shipping fields", "error");
        return;
      }

      if (!emailRegex.test(email)) {
        showToast("Please enter a valid email address", "error");
        return;
      }

      if (stateVal.length !== 2) {
        showToast("Please enter a 2-letter state code (e.g. OR)", "error");
        return;
      }

      if (!zipRegex.test(zip)) {
        showToast("Please enter a valid 5-digit ZIP code", "error");
        return;
      }

      state.customerInfo = { name, email, phone, address, city, state: stateVal, zip };

      const totals = calculateCartTotals();
      if (summaryBox) {
        summaryBox.innerHTML = `
          <div style="border-bottom: 1px solid var(--color-border-subtle); padding-bottom: 10px; margin-bottom: 10px;">
            <strong>Dispatch to:</strong><br>
            <span id="summary-name"></span><br>
            <span id="summary-address"></span><br>
            <span id="summary-contact"></span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Items (${totals.totalItemCount}):</span>
            <span>${formatMoney(totals.subtotalCents)}</span>
          </div>
          ${totals.promoDiscountCents > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: var(--color-terracotta);">
              <span>Promo Discount:</span>
              <span>-${formatMoney(totals.promoDiscountCents)}</span>
            </div>
          ` : ""}
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Shipping:</span>
            <span>${totals.shippingCents === 0 ? "Free" : formatMoney(totals.shippingCents)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: var(--text-base); border-top: 1px solid var(--color-border-subtle); padding-top: 8px; margin-top: 6px;">
            <span>Total:</span>
            <span>${formatMoney(totals.grandTotalCents)}</span>
          </div>
        `;

        const sName = summaryBox.querySelector("#summary-name");
        const sAddr = summaryBox.querySelector("#summary-address");
        const sContact = summaryBox.querySelector("#summary-contact");
        if (sName) sName.textContent = name;
        if (sAddr) sAddr.textContent = `${address}, ${city}, ${stateVal} ${zip}`;
        if (sContact) sContact.textContent = `${email} • ${phone}`;
      }

      step1.classList.remove("is-active");
      step2.classList.add("is-active");
      if (submitBtn) submitBtn.focus();
    });

    if (backBtn) {
      backBtn.addEventListener("click", () => {
        step2.classList.remove("is-active");
        step1.classList.add("is-active");
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        const totals = calculateCartTotals();
        submitBtn.disabled = true;
        submitBtn.textContent = "Processing Demo Order...";

        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = "Place Demo Order";

          const orderNumber = `CC-${Math.floor(100000 + Math.random() * 900000)}`;

          if (successBox && state.customerInfo) {
            successBox.innerHTML = `
              <p><strong>Order ID:</strong> <span id="conf-order-id"></span></p>
              <p><strong>Recipient:</strong> <span id="conf-name"></span></p>
              <p><strong>Email on file (demo):</strong> <span id="conf-email"></span></p>
              <p><strong>Items:</strong> ${totals.totalItemCount} &bull; <strong>Total:</strong> ${formatMoney(totals.grandTotalCents)}</p>
            `;

            successBox.querySelector("#conf-order-id").textContent = orderNumber;
            successBox.querySelector("#conf-name").textContent = state.customerInfo.name;
            successBox.querySelector("#conf-email").textContent = state.customerInfo.email;
          }

          state.cart = [];
          state.appliedPromo = null;
          saveCartToStorage();
          renderCartDrawer();

          step2.classList.remove("is-active");
          step3.classList.add("is-active");
          if (finishBtn) finishBtn.focus();
        }, 1200);
      });
    }

    if (finishBtn) {
      finishBtn.addEventListener("click", () => {
        closeCheckoutDialog();
      });
    }
  }

  /* --------------------------------------------------------------------------
     10. STATIC DATA DOM INJECTIONS
     -------------------------------------------------------------------------- */
  function populateMarquee() {
    const track1 = document.getElementById("marquee-track-1");
    const track2 = document.getElementById("marquee-track-2");
    if (!track1 || !track2) return;

    const buildTrackHtml = (items) => {
      const repeated = [...items, ...items];
      return repeated
        .map(note => `<span class="marquee-item">${note}</span>`)
        .join("");
    };

    track1.innerHTML = buildTrackHtml(TASTING_NOTES_ROW_1);
    track2.innerHTML = buildTrackHtml(TASTING_NOTES_ROW_2);
  }

  function populateFarmToCup() {
    const track = document.getElementById("story-panels-track");
    // If panels are already present in static index.html, preserve them!
    if (!track || track.children.length > 0) return;

    track.innerHTML = FARM_TO_CUP_STEPS.map(step => `
      <div class="story-panel" data-step="${step.number}">
        <div class="story-panel-inner">
          <div class="story-panel__number">${step.number}</div>
          <div class="story-panel__icon">${step.iconSvg}</div>
          <h3 class="story-panel__title">${step.title}</h3>
          <div class="story-panel__tagline">${step.tagline}</div>
          <p class="story-panel__desc">${step.description}</p>
        </div>
      </div>
    `).join("");
  }

  function populateReviews() {
    const grid = document.getElementById("reviews-grid");
    if (!grid) return;

    grid.innerHTML = SAMPLE_REVIEWS.map(rev => {
      const stars = "★".repeat(rev.rating);
      return `
        <article class="review-card">
          <div class="review-stars" aria-label="${rev.rating} out of 5 stars">${stars}</div>
          <blockquote class="review-quote">"${rev.text}"</blockquote>
          <div class="review-author">
            <h4>${rev.author}</h4>
            <div class="review-meta">${rev.location} &bull; ${rev.coffee} (${rev.size})</div>
          </div>
        </article>
      `;
    }).join("");
  }

  function populateFaqs() {
    const accordion = document.getElementById("faq-accordion");
    if (!accordion) return;

    accordion.innerHTML = FAQS.map((faq, index) => {
      const isOpen = index === 0;
      return `
        <div class="faq-item ${isOpen ? "is-open" : ""}" data-faq-id="${faq.id}">
          <button class="faq-trigger" type="button" aria-expanded="${isOpen}" aria-controls="panel-${faq.id}" id="trigger-${faq.id}">
            <span>${faq.question}</span>
            <span class="faq-trigger-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </button>
          <div id="panel-${faq.id}" class="faq-panel" role="region" aria-labelledby="trigger-${faq.id}" ${isOpen ? "" : 'aria-hidden="true"'}>
            <div class="faq-panel-inner">
              <div class="faq-panel-content">
                <p>${faq.answer}</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    accordion.addEventListener("click", (e) => {
      const trigger = e.target.closest(".faq-trigger");
      if (!trigger) return;

      const item = trigger.closest(".faq-item");
      const isCurrentlyOpen = item.classList.contains("is-open");

      accordion.querySelectorAll(".faq-item").forEach(other => {
        other.classList.remove("is-open");
        const btn = other.querySelector(".faq-trigger");
        const pnl = other.querySelector(".faq-panel");
        if (btn) btn.setAttribute("aria-expanded", "false");
        if (pnl) pnl.setAttribute("aria-hidden", "true");
      });

      if (!isCurrentlyOpen) {
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        const panel = item.querySelector(".faq-panel");
        if (panel) panel.removeAttribute("aria-hidden");
      }
    });
  }

  function populateStats() {
    const stats = getRoasteryStats();
    const statCoffees = document.getElementById("stat-coffees");
    const statOrigins = document.getElementById("stat-origins");
    const statRoasts = document.getElementById("stat-roasts");

    if (statCoffees) statCoffees.textContent = String(stats.coffeesCount);
    if (statOrigins) statOrigins.textContent = String(stats.originsCount);
    if (statRoasts) statRoasts.textContent = String(stats.roastSpectrumCount);
  }

  /* --------------------------------------------------------------------------
     11. NEWSLETTER CAPTURE
     -------------------------------------------------------------------------- */
  function setupNewsletter() {
    const form = document.getElementById("newsletter-form");
    const emailInput = document.getElementById("newsletter-email");
    const feedback = document.getElementById("newsletter-feedback");
    if (!form || !emailInput || !feedback) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        feedback.className = "newsletter-status newsletter-status--error";
        feedback.textContent = "Please provide a valid email address.";
        return;
      }

      feedback.className = "newsletter-status";
      feedback.textContent = "Connecting to dispatch...";

      setTimeout(() => {
        feedback.className = "newsletter-status newsletter-status--success";
        feedback.textContent = "Thank you for subscribing to our Portland roastery dispatch.";
        emailInput.value = "";
      }, 600);
    });
  }

  /* --------------------------------------------------------------------------
     12. EVENT LISTENERS & DELEGATION
     -------------------------------------------------------------------------- */
  function setupGlobalListeners() {
    const navCartBtn = document.getElementById("nav-cart-btn");
    const cartCloseBtn = document.getElementById("cart-close-btn");
    const cartOverlay = document.getElementById("cart-drawer-overlay");
    const continueShoppingBtn = document.getElementById("cart-continue-shopping-btn");

    if (navCartBtn) navCartBtn.addEventListener("click", openCartDrawer);
    if (cartCloseBtn) cartCloseBtn.addEventListener("click", closeCartDrawer);
    if (cartOverlay) cartOverlay.addEventListener("click", closeCartDrawer);
    if (continueShoppingBtn) continueShoppingBtn.addEventListener("click", closeCartDrawer);

    const mobileToggle = document.getElementById("mobile-menu-toggle");
    const mobileNav = document.getElementById("mobile-nav-drawer");
    const mobileClose = document.getElementById("mobile-nav-close-btn");

    if (mobileToggle && mobileNav) {
      mobileToggle.addEventListener("click", () => {
        mobileNav.classList.add("is-open");
        mobileToggle.setAttribute("aria-expanded", "true");
        mobileNav.setAttribute("aria-hidden", "false");
        document.body.classList.add("lenis-stopped");
      });
    }

    if (mobileClose && mobileNav && mobileToggle) {
      mobileClose.addEventListener("click", () => {
        mobileNav.classList.remove("is-open");
        mobileToggle.setAttribute("aria-expanded", "false");
        mobileNav.setAttribute("aria-hidden", "true");
        document.body.classList.remove("lenis-stopped");
      });
    }

    document.querySelectorAll(".mobile-link").forEach(link => {
      link.addEventListener("click", () => {
        if (mobileNav && mobileToggle) {
          mobileNav.classList.remove("is-open");
          mobileToggle.setAttribute("aria-expanded", "false");
          mobileNav.setAttribute("aria-hidden", "true");
          document.body.classList.remove("lenis-stopped");
        }
      });
    });

    const cartItems = document.getElementById("cart-items-container");
    if (cartItems) {
      cartItems.addEventListener("click", (e) => {
        const actionBtn = e.target.closest("[data-cart-action]");
        if (!actionBtn) return;

        const action = actionBtn.dataset.cartAction;
        const index = Number(actionBtn.dataset.index);
        if (isNaN(index) || !state.cart[index]) return;

        if (action === "increment") {
          if (state.cart[index].quantity < 10) {
            state.cart[index].quantity++;
          }
        } else if (action === "decrement") {
          if (state.cart[index].quantity > 1) {
            state.cart[index].quantity--;
          } else {
            state.cart.splice(index, 1);
          }
        } else if (action === "remove") {
          state.cart.splice(index, 1);
        }

        saveCartToStorage();
        renderCartDrawer();
      });
    }

    const promoBtn = document.getElementById("promo-apply-btn");
    const promoInput = document.getElementById("promo-input");
    const promoStatus = document.getElementById("promo-status");

    if (promoBtn && promoInput && promoStatus) {
      promoBtn.addEventListener("click", () => {
        const code = promoInput.value.trim().toUpperCase();
        if (code === BRAND.promoCode) {
          state.appliedPromo = BRAND.promoCode;
          promoStatus.className = "promo-status promo-status--valid";
          promoStatus.textContent = `Promo code applied: ${BRAND.promoDiscountPercent}% off!`;
          renderCartDrawer();
        } else {
          promoStatus.className = "promo-status promo-status--invalid";
          promoStatus.textContent = "Invalid promotional code.";
        }
      });
    }

    const checkoutBtn = document.getElementById("open-checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", openCheckoutDialog);
    }

    const qvCloseBtn = document.getElementById("quick-view-close-btn");
    if (qvCloseBtn) qvCloseBtn.addEventListener("click", closeQuickView);

    const chkCloseBtn = document.getElementById("checkout-close-btn");
    if (chkCloseBtn) chkCloseBtn.addEventListener("click", closeCheckoutDialog);

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const qvDialog = document.getElementById("quick-view-dialog");
        const chkDialog = document.getElementById("checkout-dialog");
        const cartDrawer = document.getElementById("cart-drawer");

        if (qvDialog && qvDialog.hasAttribute("open")) {
          closeQuickView();
        } else if (chkDialog && chkDialog.hasAttribute("open")) {
          closeCheckoutDialog();
        } else if (cartDrawer && cartDrawer.classList.contains("is-open")) {
          closeCartDrawer();
        }
      }
    });

    const searchInput = document.getElementById("shop-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        state.searchQuery = e.target.value;
        renderProductGrid();
      });
    }

    const chipsContainer = document.getElementById("filter-chips-container");
    if (chipsContainer) {
      chipsContainer.addEventListener("click", (e) => {
        const chip = e.target.closest(".filter-chip");
        if (!chip) return;

        chipsContainer.querySelectorAll(".filter-chip").forEach(c => {
          c.setAttribute("aria-pressed", "false");
        });

        chip.setAttribute("aria-pressed", "true");
        state.activeCategory = chip.dataset.category;
        renderProductGrid();
      });
    }

    const sortSelect = document.getElementById("sort-select");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        state.sortOption = e.target.value;
        renderProductGrid();
      });
    }

    const resetBtn = document.getElementById("reset-filters-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        state.searchQuery = "";
        state.activeCategory = "all";
        if (searchInput) searchInput.value = "";
        if (chipsContainer) {
          chipsContainer.querySelectorAll(".filter-chip").forEach(c => {
            c.setAttribute("aria-pressed", c.dataset.category === "all" ? "true" : "false");
          });
        }
        renderProductGrid();
      });
    }

    const productGrid = document.getElementById("product-grid");
    if (productGrid) {
      productGrid.addEventListener("click", (e) => {
        const target = e.target;
        const qvBtn = target.closest('[data-action="quick-view"]');
        const addBtn = target.closest('[data-action="quick-add"]');

        if (qvBtn) {
          const pid = Number(qvBtn.dataset.productId);
          openQuickView(pid);
        } else if (addBtn) {
          const pid = Number(addBtn.dataset.productId);
          const product = PRODUCTS.find(p => p.id === pid);
          if (product) {
            const defaultSize = Object.keys(product.prices)[0];
            const defaultGrind = GRIND_OPTIONS[0];
            addItemToCart(pid, defaultSize, defaultGrind, false, 0, 1, addBtn);
          }
        }
      });
    }
  }

  /* --------------------------------------------------------------------------
     13. MOBILE VIEWPORT OVERFLOW DETECTION HELPER
     -------------------------------------------------------------------------- */
  function debugOverflow() {
    const docWidth = document.documentElement.clientWidth;
    const elements = document.querySelectorAll("*");
    const offenders = [];

    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > docWidth + 1) {
        offenders.push({
          element: el,
          tag: el.tagName,
          id: el.id,
          class: el.className,
          right: rect.right,
          overflow: rect.right - docWidth
        });
      }
    });

    if (offenders.length > 0) {
      console.warn(`[Overflow Debugger] Found ${offenders.length} overflowing elements:`, offenders);
    } else {
      console.log("[Overflow Debugger] Clean viewport: zero horizontal overflow.");
    }
  }
  window.debugOverflow = debugOverflow;

  /* --------------------------------------------------------------------------
     14. INITIALIZATION SEQUENCE
     -------------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    state.cart = loadCartFromStorage();

    populateMarquee();
    populateFarmToCup();
    populateReviews();
    populateFaqs();
    populateStats();

    renderProductGrid();
    renderCartDrawer();
    setupCheckoutHandlers();
    setupNewsletter();
    setupGlobalListeners();

    setTimeout(debugOverflow, 800);
  });

  window.cartState = state;
  window.openCartDrawer = openCartDrawer;
  window.closeCartDrawer = closeCartDrawer;
  window.showToast = showToast;

})();
