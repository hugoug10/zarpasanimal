/* ==========================================================
   ZARPASANIMAL THEME — theme.js
   ========================================================== */
'use strict';

const ZA = (() => {

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── SCROLL REVEAL ───────────────────────────────────────── */
  function initReveal() {
    if (reduced) {
      document.querySelectorAll('[data-reveal],[data-stagger]').forEach(el => {
        el.classList.add('visible');
      });
      return;
    }
    const els = document.querySelectorAll('[data-reveal],[data-stagger]');
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const delay = parseInt(e.target.dataset.delay || 0);
        setTimeout(() => e.target.classList.add('visible'), delay);
        io.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });
    els.forEach(el => io.observe(el));
  }

  /* ── PARALLAX HERO ───────────────────────────────────────── */
  function initParallax() {
    if (reduced || window.innerWidth < 768) return;
    const bg = document.querySelector('.hero__bg');
    if (!bg) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      requestAnimationFrame(() => {
        bg.style.transform = `translateY(${window.scrollY * 0.38}px)`;
        ticking = false;
      });
      ticking = true;
    }, { passive: true });
  }

  /* ── NAVBAR ──────────────────────────────────────────────── */
  function initNavbar() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  /* ── MOBILE MENU ─────────────────────────────────────────── */
  function initMobileMenu() {
    const burger = document.querySelector('.burger-btn');
    const menu   = document.querySelector('.mobile-menu');
    if (!burger || !menu) return;

    const links = menu.querySelectorAll('a');

    burger.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open);
      menu.setAttribute('aria-hidden', !open);
      document.body.style.overflow = open ? 'hidden' : '';
      links.forEach(l => l.setAttribute('tabindex', open ? '0' : '-1'));
    });

    links.forEach(l => l.addEventListener('click', () => {
      menu.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }));

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        burger.click();
        burger.focus();
      }
    });
  }

  /* ── CUSTOM CURSOR ───────────────────────────────────────── */
  function initCursor() {
    if (reduced || window.innerWidth < 1024) return;
    const dot  = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (!dot || !ring) return;

    let mx = 0, my = 0, rx = 0, ry = 0;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(calc(${mx}px - 50%), calc(${my}px - 50%))`;
    });

    (function animRing() {
      rx += (mx - rx) * 0.11;
      ry += (my - ry) * 0.11;
      ring.style.transform = `translate(calc(${rx}px - 50%), calc(${ry}px - 50%))`;
      requestAnimationFrame(animRing);
    })();

    document.querySelectorAll('a, button, [data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('hovering'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hovering'));
    });
  }

  /* ── CART DRAWER ─────────────────────────────────────────── */
  function initCartDrawer() {
    const drawer  = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (!drawer || !overlay) return;

    function open() {
      drawer.classList.add('open');
      overlay.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-cart-open]').forEach(b => b.addEventListener('click', open));
    document.querySelectorAll('[data-cart-close]').forEach(b => b.addEventListener('click', close));
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) close();
    });

    document.addEventListener('cart:open', open);
    document.addEventListener('cart:close', close);
  }

  /* ── CART AJAX ───────────────────────────────────────────── */
  async function fetchCart() {
    const res = await fetch('/cart.js');
    return res.json();
  }

  async function addToCart(variantId, qty = 1, properties = {}) {
    const res = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity: qty, properties })
    });
    if (!res.ok) throw new Error('Add to cart failed');
    return res.json();
  }

  async function changeCartItem(line, qty) {
    const res = await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line, quantity: qty })
    });
    return res.json();
  }

  function updateCartBadges(count) {
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = count;
      el.classList.toggle('has-items', count > 0);
    });
  }

  function fmtMoney(cents) {
    return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  }

  function renderCartItems(cart) {
    const wrap = document.getElementById('cart-items');
    const foot = document.getElementById('cart-foot');
    if (!wrap) return;

    updateCartBadges(cart.item_count);

    if (cart.item_count === 0) {
      wrap.innerHTML = `
        <div class="cart-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <p>Tu carrito está vacío.</p>
          <a href="/collections/all" class="btn btn-primary" data-cart-close>Ver la colección</a>
        </div>`;
      if (foot) foot.style.display = 'none';
      return;
    }

    if (foot) foot.style.display = '';

    wrap.innerHTML = cart.items.map((item, i) => `
      <div class="cart-item" data-line="${i + 1}">
        <a href="${item.url}">
          <img class="cart-item__img" src="${item.image}" alt="${item.title}" loading="lazy" width="80" height="80">
        </a>
        <div class="cart-item__info">
          <a href="${item.url}" class="cart-item__name">${item.product_title}</a>
          ${item.variant_title !== 'Default Title' ? `<p class="cart-item__variant">${item.variant_title}</p>` : ''}
          ${Object.entries(item.properties || {}).filter(([,v]) => v).map(([k,v]) => `<p class="cart-item__variant">${k}: ${v}</p>`).join('')}
          <div class="cart-item__row">
            <div class="qty-wrap" data-line="${i + 1}">
              <button class="qty-btn" data-action="minus" aria-label="Restar">−</button>
              <span class="qty-val">${item.quantity}</span>
              <button class="qty-btn" data-action="plus" aria-label="Sumar">+</button>
            </div>
            <div style="text-align:right">
              <p class="cart-item__price">${fmtMoney(item.line_price)}</p>
              <button class="cart-item__remove" data-line="${i + 1}">Eliminar</button>
            </div>
          </div>
        </div>
      </div>`).join('');

    // Update totals
    const totalEl = document.getElementById('cart-total');
    if (totalEl) totalEl.textContent = fmtMoney(cart.total_price);

    const shipEl = document.getElementById('cart-ship-msg');
    if (shipEl) {
      if (cart.total_price < 4900) {
        shipEl.textContent = `Te faltan ${fmtMoney(4900 - cart.total_price)} para envío gratis`;
        shipEl.style.color = 'var(--stone)';
      } else {
        shipEl.textContent = '✓ ¡Envío gratis aplicado!';
        shipEl.style.color = 'var(--sage)';
      }
    }

    // Rebind qty events
    wrap.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const qtyWrap = btn.closest('[data-line]');
        const line    = parseInt(qtyWrap.dataset.line);
        const valEl   = qtyWrap.querySelector('.qty-val');
        const current = parseInt(valEl.textContent);
        const newQty  = btn.dataset.action === 'plus' ? current + 1 : Math.max(0, current - 1);
        const updated = await changeCartItem(line, newQty);
        renderCartItems(updated);
      });
    });

    wrap.querySelectorAll('.cart-item__remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        const line    = parseInt(btn.dataset.line);
        const item    = btn.closest('.cart-item');
        item.style.transition = 'opacity .25s, transform .25s';
        item.style.opacity    = '0';
        item.style.transform  = 'translateX(16px)';
        setTimeout(async () => {
          const updated = await changeCartItem(line, 0);
          renderCartItems(updated);
        }, 250);
      });
    });
  }

  /* ── ADD TO CART FORMS ───────────────────────────────────── */
  function initProductForms() {
    document.querySelectorAll('[data-product-form]').forEach(form => {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const btn      = form.querySelector('[data-atc]');
        const idInput  = form.querySelector('[data-variant-id]');
        if (!btn || !idInput) return;

        const variantId = parseInt(idInput.value);
        if (!variantId) return;

        const origText = btn.textContent;
        btn.textContent = 'Añadiendo...';
        btn.classList.add('loading');

        try {
          await addToCart(variantId);
          btn.textContent = '✓ Añadido';
          btn.style.background = 'var(--sage)';

          const cart = await fetchCart();
          renderCartItems(cart);
          document.dispatchEvent(new CustomEvent('cart:open'));

          setTimeout(() => {
            btn.textContent    = origText;
            btn.style.background = '';
            btn.classList.remove('loading');
          }, 2200);
        } catch {
          btn.textContent = 'Error — inténtalo de nuevo';
          btn.classList.remove('loading');
          setTimeout(() => { btn.textContent = origText; }, 2500);
        }
      });
    });
  }

  /* ── VARIANT SELECTOR ────────────────────────────────────── */
  function initVariants() {
    document.querySelectorAll('[data-variants]').forEach(wrap => {
      const variants   = JSON.parse(wrap.dataset.variants);
      const formEl     = document.querySelector('[data-product-form]');
      const idInput    = formEl?.querySelector('[data-variant-id]');
      const priceEls   = document.querySelectorAll('[data-price]');
      const stickyPrice = document.querySelector('[data-sticky-price]');
      const atcBtn     = formEl?.querySelector('[data-atc]');
      const mainImg    = document.getElementById('pdp-main-img');

      let selectedOpts = wrap.dataset.currentOptions
        ? JSON.parse(wrap.dataset.currentOptions)
        : variants[0]?.options || [];

      function findVariant() {
        return variants.find(v => v.options.every((o, i) => o === selectedOpts[i]));
      }

      wrap.querySelectorAll('[data-option-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.optionIdx);
          const val = btn.dataset.optionVal;
          selectedOpts[idx] = val;

          wrap.querySelectorAll(`[data-option-idx="${idx}"]`).forEach(b => {
            const active = b.dataset.optionVal === val;
            b.classList.toggle('active', active);
            b.setAttribute('aria-pressed', active);
          });

          // Update value label
          const lbl = wrap.querySelector(`[data-option-val-label="${idx}"]`);
          if (lbl) lbl.textContent = val;

          const v = findVariant();
          if (!v) return;

          if (idInput) idInput.value = v.id;

          // Price
          const price = fmtMoney(v.price);
          priceEls.forEach(el => el.textContent = price);
          if (stickyPrice) stickyPrice.textContent = price;

          // ATC state
          if (atcBtn) {
            atcBtn.disabled    = !v.available;
            atcBtn.textContent = v.available ? 'Añadir al carrito' : 'Agotado';
          }

          // Image
          if (v.featured_image && mainImg) {
            mainImg.style.opacity   = '0';
            mainImg.style.transform = 'scale(.97)';
            setTimeout(() => {
              mainImg.src = v.featured_image.src;
              mainImg.style.opacity   = '1';
              mainImg.style.transform = 'scale(1)';
            }, 200);
          }
        });
      });
    });
  }

  /* ── PDP GALLERY ─────────────────────────────────────────── */
  function initGallery() {
    const thumbs  = document.querySelectorAll('.pdp-thumb');
    const mainImg = document.getElementById('pdp-main-img');
    if (!thumbs.length || !mainImg) return;

    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const src = thumb.dataset.src;
        mainImg.style.opacity   = '0';
        mainImg.style.transform = 'scale(.97)';
        setTimeout(() => {
          mainImg.src = src;
          mainImg.style.opacity   = '1';
          mainImg.style.transform = 'scale(1)';
        }, 200);
        thumbs.forEach(t => t.classList.toggle('active', t === thumb));
      });
    });
  }

  /* ── PDP TABS ────────────────────────────────────────────── */
  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(wrap => {
      const btns   = wrap.querySelectorAll('[data-tab-btn]');
      const panels = wrap.querySelectorAll('[data-tab-panel]');

      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.tabBtn;
          btns.forEach(b  => { b.classList.toggle('active', b === btn); b.setAttribute('aria-selected', b === btn); });
          panels.forEach(p => p.classList.toggle('active', p.dataset.tabPanel === target));
        });
      });
    });
  }

  /* ── STICKY ATC ──────────────────────────────────────────── */
  function initStickyATC() {
    const sticky = document.querySelector('.pdp-sticky');
    const atcBtn = document.querySelector('[data-atc]');
    if (!sticky || !atcBtn) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        sticky.classList.toggle('show', !e.isIntersecting);
        sticky.setAttribute('aria-hidden', e.isIntersecting);
      });
    }, { threshold: 0.5 });
    io.observe(atcBtn);
  }

  /* ── COUNT UP ────────────────────────────────────────────── */
  function initCountUp() {
    const els = document.querySelectorAll('[data-count]');
    if (!els.length) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el       = e.target;
        const target   = parseInt(el.dataset.count);
        const dur      = parseInt(el.dataset.countDur || 1600);
        const prefix   = el.dataset.countPrefix || '';
        const suffix   = el.dataset.countSuffix || '';
        let start = null;

        if (reduced) { el.textContent = prefix + target.toLocaleString('es-ES') + suffix; return; }

        function tick(ts) {
          if (!start) start = ts;
          const p = Math.min((ts - start) / dur, 1);
          const e = 1 - Math.pow(1 - p, 3);
          el.textContent = prefix + Math.floor(e * target).toLocaleString('es-ES') + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: .5 });

    els.forEach(el => io.observe(el));
  }

  /* ── FAQ ACCORDION ───────────────────────────────────────── */
  function initFAQ() {
    document.querySelectorAll('.faq-item').forEach(item => {
      const btn    = item.querySelector('.faq-btn');
      const answer = item.querySelector('.faq-answer');
      if (!btn || !answer) return;

      btn.addEventListener('click', () => {
        const open = item.classList.toggle('open');
        btn.setAttribute('aria-expanded', open);
        answer.setAttribute('aria-hidden', !open);
      });
    });
  }

  /* ── TOAST ───────────────────────────────────────────────── */
  function showToast(msg, dur = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), dur);
  }

  /* ── CONTACT FORM ────────────────────────────────────────── */
  function initContactForm() {
    const form = document.querySelector('[data-contact-form]');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn  = form.querySelector('[type=submit]');
      const orig = btn.textContent;
      btn.textContent = 'Enviando...';
      btn.disabled = true;
      try {
        await fetch(form.action, { method: 'POST', body: new FormData(form) });
        showToast('✓ Mensaje enviado. Te respondemos en menos de 2 horas.');
        form.reset();
      } catch {
        showToast('Error al enviar. Inténtalo de nuevo.');
      } finally {
        btn.textContent = orig;
        btn.disabled = false;
      }
    });
  }

  /* ── TESTIMONIAL DOTS ────────────────────────────────────── */
  function initCarouselDots() {
    const grid = document.querySelector('.testimonials-grid');
    const dots = document.querySelectorAll('.carousel-dot');
    if (!grid || !dots.length) return;

    grid.addEventListener('scroll', () => {
      const items     = grid.querySelectorAll('.testimonial-card');
      const itemWidth = (items[0]?.offsetWidth || 0) + 16;
      const idx       = Math.round(grid.scrollLeft / itemWidth);
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    }, { passive: true });

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        const items     = grid.querySelectorAll('.testimonial-card');
        const itemWidth = (items[0]?.offsetWidth || 0) + 16;
        grid.scrollTo({ left: i * itemWidth, behavior: 'smooth' });
      });
    });
  }

  /* ── NEWSLETTER ──────────────────────────────────────────── */
  function initNewsletter() {
    const form = document.querySelector('[data-newsletter]');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn  = form.querySelector('[type=submit]');
      const orig = btn.textContent;
      btn.textContent = '...';
      btn.disabled    = true;
      try {
        await fetch(form.action, { method: 'POST', body: new FormData(form) });
        showToast('✓ ¡Ya eres parte de ZarpasAnimal!');
        form.reset();
      } catch {
        showToast('Error. Inténtalo de nuevo.');
      } finally {
        btn.textContent = orig;
        btn.disabled    = false;
      }
    });
  }

  /* ── MAGNETIC BUTTONS ────────────────────────────────────── */
  function initMagnetic() {
    if (reduced || window.innerWidth < 1024) return;
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r  = el.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width  / 2) * 0.22;
        const dy = (e.clientY - r.top  - r.height / 2) * 0.22;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ── INIT ────────────────────────────────────────────────── */
  function init() {
    initReveal();
    initParallax();
    initNavbar();
    initMobileMenu();
    initCursor();
    initCartDrawer();
    initProductForms();
    initVariants();
    initGallery();
    initTabs();
    initStickyATC();
    initCountUp();
    initFAQ();
    initCarouselDots();
    initNewsletter();
    initContactForm();
    initMagnetic();

    // Load cart count on init
    fetchCart().then(cart => {
      updateCartBadges(cart.item_count);
      renderCartItems(cart);
    }).catch(() => {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { addToCart, fetchCart, showToast, fmtMoney };
})();

window.ZA = ZA;
