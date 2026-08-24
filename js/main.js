/* ============================================
   KEYLIGHT — Main JavaScript
   ============================================ */
(function () {
  'use strict';

  /* ---------- Navigation ---------- */
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navOverlay = document.getElementById('navOverlay');
  const navLogo = nav.querySelector('.nav-logo');
  const heroSection = document.getElementById('hero');

  window.addEventListener('scroll', function () {
    var scrolled = window.scrollY > 60;
    nav.classList.toggle('scrolled', scrolled);
    // Hide nav logo when hero (with big logo) is visible
    var heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
    navLogo.classList.toggle('hidden', window.scrollY < heroBottom - 100);
  });

  navToggle.addEventListener('click', function () {
    navToggle.classList.toggle('active');
    navOverlay.classList.toggle('show');
    document.body.style.overflow = navOverlay.classList.contains('show') ? 'hidden' : '';
  });

  navOverlay.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navToggle.classList.remove('active');
      navOverlay.classList.remove('show');
      document.body.style.overflow = '';
    });
  });

  /* ---------- Hero Slideshow ---------- */
  (function () {
    var slides = document.querySelectorAll('.hero-slide');
    if (slides.length < 2) return;
    var current = 0;
    setInterval(function () {
      slides[current].classList.remove('active');
      // Brief black gap before next slide
      setTimeout(function () {
        current = (current + 1) % slides.length;
        slides[current].classList.add('active');
      }, 800);
    }, 5000);
  })();

  /* ---------- Scroll Reveal ---------- */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ---------- Relight Interactive Element ---------- */
  var keySlider = document.getElementById('keySlider');
  var backSlider = document.getElementById('backSlider');
  var relightKey = document.getElementById('relightKey');
  var relightBack = document.getElementById('relightBack');
  var keyValue = document.getElementById('keyValue');
  var backValue = document.getElementById('backValue');
  var relightWrapper = document.getElementById('relightWrapper');
  var relightAnimated = false;

  function padNum(n) { return String(n).padStart(3, '0'); }

  function updateKey(value) {
    if (value <= 70) {
      relightKey.style.opacity = value / 70;
      relightKey.style.filter = 'none';
    } else {
      relightKey.style.opacity = 1;
      relightKey.style.filter = 'brightness(' + (1 + (value - 70) / 30 * 0.8) + ')';
    }
    keyValue.textContent = padNum(value);
  }

  function updateBack(value) {
    if (value <= 60) {
      relightBack.style.opacity = value / 60;
      relightBack.style.filter = 'none';
    } else {
      relightBack.style.opacity = 1;
      relightBack.style.filter = 'brightness(' + (1 + (value - 60) / 40 * 0.8) + ')';
    }
    backValue.textContent = padNum(value);
  }

  if (keySlider) {
    // Set initial brightness from slider defaults
    updateKey(parseInt(keySlider.value, 10));
    updateBack(parseInt(backSlider.value, 10));

    keySlider.addEventListener('input', function () { updateKey(parseInt(this.value, 10)); });
    backSlider.addEventListener('input', function () { updateBack(parseInt(this.value, 10)); });

    var relightObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !relightAnimated) {
          relightAnimated = true;
          animateRelight();
          relightObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    relightObserver.observe(relightWrapper);
  }

  function animateRelight() {
    var duration = 1800;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);

      // Key: 0 → 70, Back: 0 → 60 (settle at natural defaults)
      var keyVal, backVal;
      if (progress < 0.5) {
        keyVal = 70 * (progress * 2);
        backVal = 60 * Math.max(0, (progress - 0.1) * 2.5);
      } else {
        keyVal = 70;
        backVal = 60;
      }

      keyVal = Math.round(Math.min(keyVal, 70));
      backVal = Math.round(Math.max(Math.min(backVal, 60), 0));

      keySlider.value = keyVal;
      backSlider.value = backVal;
      updateKey(keyVal);
      updateBack(backVal);

      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  /* ---------- Cookie Banner ---------- */
  var cookieBanner = document.getElementById('cookieBanner');
  var cookieAccept = document.getElementById('cookieAccept');
  var cookieDecline = document.getElementById('cookieDecline');

  if (!localStorage.getItem('kl_cookie_consent')) {
    cookieBanner.classList.add('show');
  }

  cookieAccept.addEventListener('click', function () {
    localStorage.setItem('kl_cookie_consent', 'accepted');
    cookieBanner.classList.remove('show');
    // Enable GTM tracking
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'cookie_consent_granted' });
  });

  cookieDecline.addEventListener('click', function () {
    localStorage.setItem('kl_cookie_consent', 'declined');
    cookieBanner.classList.remove('show');
  });

  /* ---------- Contact Form ---------- */
  var contactForm = document.getElementById('contactForm');
  var formSuccess = document.getElementById('formSuccess');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // GA4 event
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'form_submission',
        form_name: 'contact_form'
      });

      // Submit via FormSubmit
      var formData = new FormData(contactForm);
      fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      }).then(function (response) {
        if (response.ok) {
          contactForm.style.display = 'none';
          formSuccess.classList.add('show');
        }
      }).catch(function () {
        // Fallback: mailto
        var subject = encodeURIComponent('Poptávka z webu KEYLIGHT');
        var body = encodeURIComponent(
          'Jméno: ' + formData.get('name') +
          '\nFirma: ' + formData.get('company') +
          '\nE-mail: ' + formData.get('email') +
          '\nTelefon: ' + (formData.get('phone') || '—') +
          '\nTyp spolupráce: ' + formData.get('collaboration_type') +
          '\nRozpočet: ' + formData.get('budget') +
          '\n\nZpráva:\n' + formData.get('message')
        );
        window.location.href = 'mailto:info@klight.cz?subject=' + subject + '&body=' + body;
      });
    });
  }

  /* ---------- Content Loading from JSON ---------- */
  function loadContent() {
    var stored = localStorage.getItem('kl_content');
    if (stored) {
      try {
        applyContent(JSON.parse(stored));
        return;
      } catch (e) { /* fall through */ }
    }

    fetch('content.json')
      .then(function (r) { return r.json(); })
      .then(applyContent)
      .catch(function () { /* use HTML defaults */ });
  }

  function applyContent(data) {
    if (!data || !data.stats) return;

    // Stats
    document.querySelectorAll('[data-content]').forEach(function (el) {
      var key = el.getAttribute('data-content');
      if (data.stats[key] !== undefined) {
        el.textContent = data.stats[key];
      }
    });

    // Period
    if (data.meta && data.meta.period) {
      var periodEl = document.getElementById('statsPeriod');
      if (periodEl) periodEl.textContent = data.meta.period;
    }
  }

  loadContent();

  /* ---------- Admin Panel ---------- */
  var adminBtn = document.getElementById('adminBtn');
  var adminModal = document.getElementById('adminModal');
  var adminClose = document.getElementById('adminClose');
  var adminLoginBtn = document.getElementById('adminLoginBtn');
  var adminPassword = document.getElementById('adminPassword');
  var adminError = document.getElementById('adminError');
  var adminLogin = document.getElementById('adminLogin');
  var adminPanel = document.getElementById('adminPanel');
  var adminFields = document.getElementById('adminFields');
  var adminSave = document.getElementById('adminSave');
  var adminExport = document.getElementById('adminExport');
  var adminChangePassword = document.getElementById('adminChangePassword');
  var adminNewPassword = document.getElementById('adminNewPassword');
  var adminPasswordMsg = document.getElementById('adminPasswordMsg');

  var DEFAULT_PASSWORD = 'admin';
  var currentContent = null;

  function getPasswordHash() {
    return localStorage.getItem('kl_admin_pw') || DEFAULT_PASSWORD;
  }

  adminBtn.addEventListener('click', function () {
    adminModal.style.display = 'flex';
    adminLogin.style.display = 'block';
    adminPanel.style.display = 'none';
    adminError.style.display = 'none';
    adminPassword.value = '';
    adminPassword.focus();
  });

  adminClose.addEventListener('click', function () {
    adminModal.style.display = 'none';
  });

  adminModal.addEventListener('click', function (e) {
    if (e.target === adminModal) adminModal.style.display = 'none';
  });

  adminPassword.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') adminLoginBtn.click();
  });

  adminLoginBtn.addEventListener('click', function () {
    if (adminPassword.value === getPasswordHash()) {
      adminLogin.style.display = 'none';
      adminPanel.style.display = 'block';
      loadAdminFields();
    } else {
      adminError.style.display = 'block';
    }
  });

  function loadAdminFields() {
    var stored = localStorage.getItem('kl_content');
    if (stored) {
      try { currentContent = JSON.parse(stored); } catch (e) { currentContent = null; }
    }

    if (!currentContent) {
      fetch('content.json')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          currentContent = data;
          renderAdminFields();
        });
    } else {
      renderAdminFields();
    }
  }

  var fieldLabels = {
    viewsTotal: 'Zhlédnutí celkem',
    ig_views: 'Instagram — zhlédnutí',
    ig_reach: 'Instagram — oslovené účty',
    ig_interactions: 'Instagram — interakce',
    ig_nonFollowerReach: 'Instagram — zásah mimo sledující',
    yt_views: 'YouTube — zhlédnutí',
    yt_watchTime: 'YouTube — shlédnutý čas',
    live_attendance: 'Živé natáčení — návštěvnost',
    live_note: 'Živé natáčení — poznámka'
  };

  function renderAdminFields() {
    var html = '<div style="margin-bottom:1rem;"><label style="font-size:.85rem;font-weight:600;">Období</label>' +
      '<input type="text" data-field="meta.period" value="' + escHtml(currentContent.meta.period) + '" ' +
      'style="width:100%;padding:.5rem;border:1px solid #ddd;border-radius:6px;margin-top:.25rem;font-family:var(--font-body);"></div>';

    for (var key in fieldLabels) {
      var val = currentContent.stats[key] || '';
      html += '<div style="margin-bottom:.75rem;"><label style="font-size:.8rem;font-weight:600;color:#666;">' +
        fieldLabels[key] + '</label>' +
        '<input type="text" data-field="stats.' + key + '" value="' + escHtml(val) + '" ' +
        'style="width:100%;padding:.5rem;border:1px solid #ddd;border-radius:6px;margin-top:.2rem;font-family:var(--font-body);"></div>';
    }

    adminFields.innerHTML = html;
  }

  function escHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  adminSave.addEventListener('click', function () {
    adminFields.querySelectorAll('input[data-field]').forEach(function (input) {
      var path = input.getAttribute('data-field').split('.');
      var obj = currentContent;
      for (var i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = input.value;
    });

    currentContent.meta.lastUpdated = new Date().toISOString().slice(0, 10);
    localStorage.setItem('kl_content', JSON.stringify(currentContent));
    applyContent(currentContent);
    adminSave.textContent = 'Uloženo!';
    setTimeout(function () { adminSave.textContent = 'Uložit'; }, 2000);
  });

  adminExport.addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(currentContent, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'content.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  adminChangePassword.addEventListener('click', function () {
    var newPw = adminNewPassword.value.trim();
    if (newPw.length < 3) {
      adminPasswordMsg.textContent = 'Heslo musí mít alespoň 3 znaky.';
      adminPasswordMsg.style.display = 'block';
      return;
    }
    localStorage.setItem('kl_admin_pw', newPw);
    adminNewPassword.value = '';
    adminPasswordMsg.textContent = 'Heslo bylo změněno.';
    adminPasswordMsg.style.display = 'block';
    setTimeout(function () { adminPasswordMsg.style.display = 'none'; }, 3000);
  });

  /* ---------- Lazy load iframes ---------- */
  var iframeObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var iframe = entry.target;
        var src = iframe.getAttribute('data-src');
        if (src) {
          iframe.src = src;
          iframe.removeAttribute('data-src');
        }
        iframeObserver.unobserve(iframe);
      }
    });
  }, { rootMargin: '200px' });

  document.querySelectorAll('iframe[data-src]').forEach(function (iframe) {
    iframeObserver.observe(iframe);
  });

  /* ---------- Lightbox with navigation ---------- */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxClose = document.getElementById('lightboxClose');
  var lightboxPrev = document.getElementById('lightboxPrev');
  var lightboxNext = document.getElementById('lightboxNext');
  var lightboxImages = [];
  var lightboxIndex = 0;

  function openLightbox(src, alt, images, index) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightboxImages = images || [];
    lightboxIndex = index || 0;
    lightbox.classList.add('show');
    document.body.style.overflow = 'hidden';
    // Show/hide arrows
    var hasNav = lightboxImages.length > 1;
    lightboxPrev.style.display = hasNav ? 'flex' : 'none';
    lightboxNext.style.display = hasNav ? 'flex' : 'none';
  }

  function closeLightbox() {
    lightbox.classList.remove('show');
    document.body.style.overflow = '';
    lightboxImg.src = '';
    lightboxImages = [];
  }

  function lightboxGo(dir) {
    if (lightboxImages.length < 2) return;
    lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
    var img = lightboxImages[lightboxIndex];
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || '';
  }

  if (lightbox) {
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', function (e) { e.stopPropagation(); lightboxGo(-1); });
    lightboxNext.addEventListener('click', function (e) { e.stopPropagation(); lightboxGo(1); });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('show')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') lightboxGo(-1);
      if (e.key === 'ArrowRight') lightboxGo(1);
    });
  }

  // Team carousel photos — click to open lightbox with navigation (unique images only)
  (function () {
    var allTeamImgs = Array.from(document.querySelectorAll('.team-track img'));
    // Only use first half (originals, not duplicates)
    var uniqueCount = Math.ceil(allTeamImgs.length / 2);
    var teamImgs = allTeamImgs.slice(0, uniqueCount);
    allTeamImgs.forEach(function (img) {
      var idx = allTeamImgs.indexOf(img) % uniqueCount;
      img.addEventListener('click', function () {
        openLightbox(teamImgs[idx].src, teamImgs[idx].alt, teamImgs, idx);
      });
    });
  })();

  // Show gallery photos — click to open lightbox with navigation per gallery
  document.querySelectorAll('.show-gallery').forEach(function (gallery) {
    var imgs = Array.from(gallery.querySelectorAll('img'));
    imgs.forEach(function (img, i) {
      img.addEventListener('click', function () {
        openLightbox(this.src, this.alt, imgs, i);
      });
    });
  });

  /* ---------- Gallery Arrow Navigation ---------- */
  document.querySelectorAll('.show-gallery-wrap').forEach(function (wrap) {
    var gallery = wrap.querySelector('.show-gallery');
    var leftBtn = wrap.querySelector('.gallery-arrow-left');
    var rightBtn = wrap.querySelector('.gallery-arrow-right');
    var scrollAmount = 260;

    if (leftBtn && rightBtn && gallery) {
      // Hide arrows if all images fit without scrolling
      function checkArrows() {
        var needsScroll = gallery.scrollWidth > gallery.clientWidth + 10;
        leftBtn.style.display = needsScroll ? '' : 'none';
        rightBtn.style.display = needsScroll ? '' : 'none';
      }
      checkArrows();
      window.addEventListener('resize', checkArrows);

      leftBtn.addEventListener('click', function () {
        gallery.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      });
      rightBtn.addEventListener('click', function () {
        gallery.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      });
    }
  });

  /* ---------- Smooth scroll for anchor links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        var offset = 80;
        var y = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });

})();
