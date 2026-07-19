/* ============================================================
   Zuo-Liang Zhu — Homepage interactions
   - partial loading
   - sticky nav state / mobile menu
   - scroll reveal animations
   - active nav highlighting
   - copy email toast
   ============================================================ */

function copyEmail() {
  var email = 'nkuzhuzl@gmail.com';
  var done = function () { showToast('Email copied: ' + email); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(email).then(done, function () { showToast(email); });
  } else {
    showToast(email);
  }
}

var toastTimer = null;
function showToast(msg) {
  var $toast = $('#toast');
  $('#toastMsg').text(msg);
  $toast.addClass('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { $toast.removeClass('show'); }, 2600);
}

$(function () {
  var $nav = $('#siteNav');
  var $toggle = $('#navToggle');

  /* ---------- Mobile menu ---------- */
  $toggle.on('click', function () {
    $nav.toggleClass('menu-open');
    var open = $nav.hasClass('menu-open');
    $(this).find('i').attr('class', open ? 'fas fa-xmark' : 'fas fa-bars');
  });
  $('.nav-link, .nav-logo').on('click', function () {
    $nav.removeClass('menu-open');
    $toggle.find('i').attr('class', 'fas fa-bars');
  });

  /* ---------- Nav background on scroll ---------- */
  function onScroll() {
    $nav.toggleClass('scrolled', $(window).scrollTop() > 24);
  }
  $(window).on('scroll', onScroll);
  onScroll();

  /* ---------- Scroll reveal ---------- */
  var revealObserver = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })
    : null;

  function initReveal(scope) {
    var els = (scope || document).querySelectorAll('.reveal:not(.visible)');
    els.forEach(function (el, i) {
      // small stagger for groups of cards
      el.style.transitionDelay = Math.min(i % 6, 5) * 70 + 'ms';
      if (revealObserver) {
        revealObserver.observe(el);
      } else {
        el.classList.add('visible');
      }
    });
  }
  initReveal(document);

  /* ---------- Active nav link ---------- */
  var sectionIds = ['selected-pubs', 'internship', 'contributions', 'co-authors'];
  function setActive(id) {
    $('.nav-link').removeClass('active');
    $('.nav-link[data-section="' + id + '"]').addClass('active');
  }
  function initSectionSpy() {
    if (!('IntersectionObserver' in window)) return;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-30% 0px -55% 0px' });
    sectionIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* ---------- Load partials ---------- */
  // NOTE: $.fn.load() does NOT return a Deferred — wrap it so $.when
  // actually waits until the HTML has been inserted into the DOM.
  function loadPartial(selector, url) {
    var d = $.Deferred();
    $(selector).load(url, function () { d.resolve(); });
    return d.promise();
  }

  $.when(
    loadPartial('#selected-pubs', 'partials/selected_pubs.html'),
    loadPartial('#internship', 'partials/internship.html'),
    loadPartial('#contributions', 'partials/contributions.html'),
    loadPartial('#co-authors', 'partials/co_authors.html')
  ).done(function () {
    // GitHub stats are optional — never let them break the reveal.
    if (typeof initGitHubButtons === 'function') {
      try { initGitHubButtons(); } catch (e) { /* ignore API errors */ }
    }
    initReveal(document);
    initSectionSpy();
    // safety net: anything still hidden after 3s becomes visible anyway
    setTimeout(function () {
      $('.reveal:not(.visible)').addClass('visible');
    }, 3000);
    // re-anchor: partials change layout after the browser's initial hash jump
    if (window.location.hash) {
      var anchor = document.getElementById(window.location.hash.slice(1));
      if (anchor) setTimeout(function () { anchor.scrollIntoView(); }, 60);
    }
  });
});
