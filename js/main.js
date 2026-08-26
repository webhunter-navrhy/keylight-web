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
      var prev = slides[current];
      // Freeze current zoom so it doesn't snap back during fade-out
      prev.style.transform = getComputedStyle(prev).transform;
      prev.classList.remove('active');
      // Clear inline transform after fade-out completes
      setTimeout(function () { prev.style.transform = ''; }, 1600);
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

  /* ---------- Contact Form ---------- */
  var contactForm = document.getElementById('contactForm');
  var formSuccess = document.getElementById('formSuccess');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

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

  /* ---------- Analytics — Tracking ---------- */
  var AN_KEY = 'kl_analytics';
  var AN_PW_KEY = 'kl_an_pw';

  function anGet() {
    try { return JSON.parse(localStorage.getItem(AN_KEY)) || { visits: [], sections: {}, clicks: {} }; }
    catch (e) { return { visits: [], sections: {}, clicks: {} }; }
  }

  function anSave(d) {
    if (d.visits.length > 10000) d.visits = d.visits.slice(-10000);
    localStorage.setItem(AN_KEY, JSON.stringify(d));
  }

  // Record this visit
  (function () {
    var d = anGet();
    var ua = navigator.userAgent;
    var mobile = /Mobi|Android/i.test(ua);
    var browser = ua.indexOf('Edg') > -1 ? 'Edge' : ua.indexOf('Chrome') > -1 ? 'Chrome' : ua.indexOf('Firefox') > -1 ? 'Firefox' : ua.indexOf('Safari') > -1 ? 'Safari' : 'Jiný';
    var ref = '';
    try { if (document.referrer) { var h = new URL(document.referrer).hostname; if (h !== location.hostname) ref = h; } } catch (e) {}
    d.visits.push({ t: Math.floor(Date.now() / 1000), r: ref, d: mobile ? 'm' : 'd', s: screen.width + 'x' + screen.height, b: browser });
    anSave(d);
  })();

  // Track section views
  var sectionObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && entry.target.id) {
        var d = anGet();
        d.sections[entry.target.id] = (d.sections[entry.target.id] || 0) + 1;
        anSave(d);
        sectionObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('section[id]').forEach(function (s) { sectionObs.observe(s); });

  // Track clicks on CTAs, social links, email, phone
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a, button[type="submit"]');
    if (!link) return;
    var label = '';
    var href = link.href || '';
    if (link.classList.contains('btn-primary') || link.type === 'submit') label = 'cta';
    else if (href.indexOf('instagram') > -1) label = 'social-ig';
    else if (href.indexOf('tiktok') > -1) label = 'social-tt';
    else if (href.indexOf('youtube') > -1) label = 'social-yt';
    else if (href.indexOf('mailto:') > -1) label = 'email';
    else if (href.indexOf('tel:') > -1) label = 'telefon';
    if (label) { var d = anGet(); d.clicks[label] = (d.clicks[label] || 0) + 1; anSave(d); }
  });

  /* ---------- Analytics — Dashboard ---------- */
  (function () {
    var btn = document.getElementById('analyticsBtn');
    var modal = document.getElementById('analyticsModal');
    var closeBtn = document.getElementById('analyticsClose');
    var content = document.getElementById('analyticsContent');
    if (!btn || !modal) return;

    function getPw() { return localStorage.getItem(AN_PW_KEY) || 'admin'; }

    btn.addEventListener('click', function () {
      modal.style.display = 'flex';
      showLogin();
    });

    closeBtn.addEventListener('click', function () { modal.style.display = 'none'; });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.style.display = 'none'; });

    function showLogin() {
      content.innerHTML =
        '<div class="an-login">' +
        '<h3>Analytika</h3>' +
        '<input type="password" id="anPwInput" placeholder="Heslo">' +
        '<button class="btn btn-primary" style="width:100%;justify-content:center;" id="anLoginBtn">Přihlásit</button>' +
        '<p class="an-error" id="anError">Nesprávné heslo.</p>' +
        '</div>';
      var inp = document.getElementById('anPwInput');
      var loginBtn = document.getElementById('anLoginBtn');
      var err = document.getElementById('anError');
      inp.focus();
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') loginBtn.click(); });
      loginBtn.addEventListener('click', function () {
        if (inp.value === getPw()) { showDashboard(); }
        else { err.style.display = 'block'; }
      });
    }

    var sectionNames = {
      'hero': 'Hero', 'kdo-jsme': 'Kdo jsme', 'cisla': 'Výsledky', 'porady': 'Pořady',
      'spoluprace': 'Spolupráce', 'klienti': 'Klienti', 'tym': 'Tým', 'kontakt': 'Kontakt'
    };
    var clickNames = {
      'cta': 'CTA tlačítko', 'social-ig': 'Instagram', 'social-tt': 'TikTok',
      'social-yt': 'YouTube', 'email': 'E-mail', 'telefon': 'Telefon'
    };

    function showDashboard() {
      var data = anGet();
      var now = Math.floor(Date.now() / 1000);
      var dayAgo = now - 86400;
      var weekAgo = now - 604800;
      var monthAgo = now - 2592000;

      var total = data.visits.length;
      var today = data.visits.filter(function (v) { return v.t >= dayAgo; }).length;
      var week = data.visits.filter(function (v) { return v.t >= weekAgo; }).length;
      var month = data.visits.filter(function (v) { return v.t >= monthAgo; }).length;
      var mobile = data.visits.filter(function (v) { return v.d === 'm'; }).length;
      var desktop = total - mobile;

      // Browser stats
      var browsers = {};
      data.visits.forEach(function (v) { browsers[v.b] = (browsers[v.b] || 0) + 1; });

      // Referrer stats
      var refs = {};
      data.visits.forEach(function (v) { if (v.r) refs[v.r] = (refs[v.r] || 0) + 1; });
      var topRefs = Object.keys(refs).sort(function (a, b) { return refs[b] - refs[a]; }).slice(0, 10);

      // Section bars
      var maxSection = 1;
      for (var k in data.sections) { if (data.sections[k] > maxSection) maxSection = data.sections[k]; }

      // Build HTML
      var html = '<h3>Analytika webu</h3>';

      // Summary cards
      html += '<div class="an-grid">';
      html += card(total, 'Celkem návštěv');
      html += card(today, 'Dnes');
      html += card(week, 'Tento týden');
      html += card(month, 'Tento měsíc');
      html += '</div>';

      // Devices
      html += '<h4>Zařízení</h4><div class="an-grid">';
      html += card(mobile, 'Mobil');
      html += card(desktop, 'Desktop');
      html += '</div>';

      // Browsers
      html += '<h4>Prohlížeče</h4><div class="an-grid">';
      for (var b in browsers) { html += card(browsers[b], b); }
      html += '</div>';

      // Sections
      html += '<h4>Zobrazení sekcí</h4>';
      for (var s in data.sections) {
        var name = sectionNames[s] || s;
        var pct = Math.round(data.sections[s] / maxSection * 100);
        html += '<div class="an-bar-wrap"><div class="an-bar-label"><span>' + name + '</span><span>' + data.sections[s] + '</span></div><div class="an-bar"><div class="an-bar-fill" style="width:' + pct + '%"></div></div></div>';
      }

      // Clicks
      html += '<h4>Kliknutí</h4>';
      var hasClicks = false;
      for (var c in data.clicks) {
        hasClicks = true;
        var cname = clickNames[c] || c;
        html += '<div class="an-bar-wrap"><div class="an-bar-label"><span>' + cname + '</span><span>' + data.clicks[c] + '</span></div></div>';
      }
      if (!hasClicks) html += '<p style="font-size:.85rem;color:#888;">Zatím žádná kliknutí.</p>';

      // Referrers
      html += '<h4>Zdroje návštěv</h4>';
      if (topRefs.length) {
        html += '<table class="an-table"><thead><tr><th>Doména</th><th>Návštěvy</th></tr></thead><tbody>';
        topRefs.forEach(function (r) { html += '<tr><td>' + r + '</td><td>' + refs[r] + '</td></tr>'; });
        html += '</tbody></table>';
      } else { html += '<p style="font-size:.85rem;color:#888;">Většina návštěv je přímých.</p>'; }

      // Recent visits
      html += '<h4>Posledních 20 návštěv</h4>';
      var recent = data.visits.slice(-20).reverse();
      html += '<table class="an-table"><thead><tr><th>Čas</th><th>Zařízení</th><th>Prohlížeč</th><th>Zdroj</th></tr></thead><tbody>';
      recent.forEach(function (v) {
        var date = new Date(v.t * 1000);
        var timeStr = date.getDate() + '.' + (date.getMonth() + 1) + '. ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
        html += '<tr><td>' + timeStr + '</td><td>' + (v.d === 'm' ? 'Mobil' : 'Desktop') + '</td><td>' + (v.b || '—') + '</td><td>' + (v.r || 'přímý') + '</td></tr>';
      });
      html += '</tbody></table>';

      // Actions
      html += '<div class="an-actions">';
      html += '<button id="anExport">Export JSON</button>';
      html += '<button id="anClear">Vymazat data</button>';
      html += '</div>';

      // Change password
      html += '<div class="an-pw-section">';
      html += '<h4 style="margin-top:0;">Změnit heslo</h4>';
      html += '<input type="password" id="anNewPw" placeholder="Nové heslo">';
      html += '<button id="anChangePw" style="padding:.4rem .8rem;border-radius:6px;font-size:.8rem;cursor:pointer;border:1px solid #ddd;background:#f5f5f6;font-family:var(--font-body);">Změnit heslo</button>';
      html += '<p class="an-msg" id="anPwMsg" style="display:none;"></p>';
      html += '</div>';

      content.innerHTML = html;

      // Actions handlers
      document.getElementById('anExport').addEventListener('click', function () {
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = 'kl-analytics.json'; a.click();
        URL.revokeObjectURL(url);
      });

      document.getElementById('anClear').addEventListener('click', function () {
        if (confirm('Opravdu vymazat všechna analytická data?')) {
          localStorage.removeItem(AN_KEY);
          showDashboard();
        }
      });

      document.getElementById('anChangePw').addEventListener('click', function () {
        var newPw = document.getElementById('anNewPw').value.trim();
        var msg = document.getElementById('anPwMsg');
        if (newPw.length < 3) { msg.textContent = 'Heslo musí mít alespoň 3 znaky.'; msg.style.display = 'block'; return; }
        localStorage.setItem(AN_PW_KEY, newPw);
        document.getElementById('anNewPw').value = '';
        msg.textContent = 'Heslo bylo změněno.'; msg.style.display = 'block';
        setTimeout(function () { msg.style.display = 'none'; }, 3000);
      });
    }

    function card(val, label) {
      return '<div class="an-card"><div class="an-val">' + val + '</div><div class="an-lbl">' + label + '</div></div>';
    }
  })();

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
    var src = iframe.getAttribute('data-src');
    // Only observe iframes with valid video URLs (not empty or stub embed URLs)
    if (src && src.length > 35) {
      iframeObserver.observe(iframe);
    } else {
      // No valid video — show placeholder and hide iframe
      iframe.style.display = 'none';
      iframe.parentElement.classList.add('no-video');
    }
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

  /* ---------- Client logos carousel (JS-driven) ---------- */
  (function () {
    var track = document.querySelector('.clients-track');
    if (!track) return;

    var items = track.children;
    var halfCount = items.length / 2;
    var gap = parseFloat(getComputedStyle(track).gap) || 80;

    // Measure width of first set (original logos + gaps)
    var firstSetWidth = 0;
    for (var i = 0; i < halfCount; i++) {
      firstSetWidth += items[i].offsetWidth;
    }
    firstSetWidth += halfCount * gap;

    var speed = firstSetWidth / (30 * 60); // match ~30s full cycle at 60fps
    var pos = 0;

    function animate() {
      pos -= speed;
      if (Math.abs(pos) >= firstSetWidth) {
        pos += firstSetWidth;
      }
      track.style.transform = 'translate3d(' + pos + 'px, 0, 0)';
      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  })();

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
