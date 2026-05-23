/* ============================================
   BRAINCORE SOLUTIONS — INTERACTIONS
============================================ */

'use strict';

/* ---- CUSTOM CURSOR ---- */
const cursor = document.getElementById('cursor');
const cursorFollower = document.getElementById('cursorFollower');

let mouseX = 0, mouseY = 0;
let followerX = 0, followerY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top  = mouseY + 'px';
});

function animateFollower() {
  followerX += (mouseX - followerX) * 0.12;
  followerY += (mouseY - followerY) * 0.12;
  cursorFollower.style.left = followerX + 'px';
  cursorFollower.style.top  = followerY + 'px';
  requestAnimationFrame(animateFollower);
}
animateFollower();

/* ---- NAV SCROLL ---- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
});

/* ---- MOBILE MENU ---- */
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');
let menuOpen = false;

navToggle.addEventListener('click', () => {
  menuOpen = !menuOpen;
  mobileMenu.classList.toggle('open', menuOpen);
  document.body.style.overflow = menuOpen ? 'hidden' : '';

  const spans = navToggle.querySelectorAll('span');
  if (menuOpen) {
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
  } else {
    spans[0].style.transform = '';
    spans[1].style.opacity = '';
    spans[2].style.transform = '';
  }
});

document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    menuOpen = false;
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
    const spans = navToggle.querySelectorAll('span');
    spans[0].style.transform = '';
    spans[1].style.opacity = '';
    spans[2].style.transform = '';
  });
});

/* ---- SCROLL REVEAL ---- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const delay = entry.target.dataset.delay || 0;
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, parseInt(delay));
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ---- HERO LINE REVEAL ---- */
const heroLines = document.querySelectorAll('.hero-line');
heroLines.forEach((line, i) => {
  // Wrap text in span for animation
  const text = line.textContent;
  line.innerHTML = `<span>${text}</span>`;

  setTimeout(() => {
    line.classList.add('visible');
  }, 200 + i * 120);
});

/* ---- COUNTER ANIMATION ---- */
function animateCounter(el, target, duration = 1800) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) {
      el.textContent = target;
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(start);
    }
  }, 16);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const nums = entry.target.querySelectorAll('.stat-num[data-target]');
      nums.forEach(num => {
        animateCounter(num, parseInt(num.dataset.target));
      });
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);

/* ---- SMOOTH SCROLL ---- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ---- reCAPTCHA v3 (optional — never blocks Netlify submit) ---- */
(function initRecaptchaV3() {
  const siteKey = window.RECAPTCHA_SITE_KEY && String(window.RECAPTCHA_SITE_KEY).trim();
  const wrap = document.getElementById('recaptchaWrap');
  if (!siteKey) return;

  if (wrap) wrap.hidden = false;

  const script = document.createElement('script');
  script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
  script.async = true;
  document.head.appendChild(script);
})();

function getRecaptchaV3Token() {
  const siteKey = window.RECAPTCHA_SITE_KEY && String(window.RECAPTCHA_SITE_KEY).trim();
  if (!siteKey) return Promise.resolve(null);

  const action = window.RECAPTCHA_ACTION || 'contact_submit';
  const timeoutMs = 8000;

  return new Promise((resolve) => {
    let settled = false;
    const done = (token) => {
      if (settled) return;
      settled = true;
      resolve(token || null);
    };

    const timer = setTimeout(() => done(null), timeoutMs);

    const runExecute = () => {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(siteKey, { action })
          .then((token) => {
            clearTimeout(timer);
            done(token);
          })
          .catch(() => {
            clearTimeout(timer);
            done(null);
          });
      });
    };

    if (window.grecaptcha) {
      runExecute();
      return;
    }

    let waited = 0;
    const waitForScript = setInterval(() => {
      waited += 100;
      if (window.grecaptcha) {
        clearInterval(waitForScript);
        runExecute();
      } else if (waited >= timeoutMs) {
        clearInterval(waitForScript);
        clearTimeout(timer);
        done(null);
      }
    }, 100);
  });
}

function buildContactPayload(form) {
  const honeypot = form.querySelector('[name="contact-honeypot"]');
  if (honeypot && honeypot.value.trim() !== '') {
    throw new Error('spam');
  }

  const data = new FormData(form);
  data.delete('contact-honeypot');

  if (!data.get('form-name')) {
    data.set('form-name', form.getAttribute('name') || 'contact');
  }

  return new URLSearchParams(data).toString();
}

function isNetlifyFormSuccess(html) {
  return (
    html.includes('Your form submission has been received') ||
    html.includes('form-success')
  );
}

async function postContactToNetlify(form) {
  const res = await fetch(form.getAttribute('action') || '/thanks.html', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: buildContactPayload(form),
  });

  const text = await res.text();
  if (!isNetlifyFormSuccess(text)) {
    throw new Error('netlify');
  }
}

/* ---- CONTACT FORM: reCAPTCHA → Netlify → success on same page ---- */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const btn = this.querySelector('button[type="submit"]');
    const originalHTML = btn.innerHTML;
    const form = this;
    const siteKey = window.RECAPTCHA_SITE_KEY && String(window.RECAPTCHA_SITE_KEY).trim();

    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 0.8s linear infinite">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <span>${siteKey ? 'Verifying...' : 'Sending...'}</span>`;
    btn.disabled = true;

    try {
      if (siteKey) {
        const token = await getRecaptchaV3Token();
        if (!token) throw new Error('recaptcha');
        btn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 0.8s linear infinite">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <span>Sending...</span>`;
      }

      await postContactToNetlify(form);

      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>Message Sent!</span>`;
      btn.style.background = '#22c55e';
      form.reset();
    } catch (err) {
      const msg =
        err && err.message === 'recaptcha'
          ? 'reCAPTCHA failed — refresh & try'
          : 'Failed — try again';
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <span>${msg}</span>`;
      btn.style.background = '#ef4444';
    } finally {
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = '';
        btn.disabled = false;
      }, 3500);
    }
  });
}

/* ---- TILT EFFECT ON SERVICE CARDS ---- */
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = ((y - cy) / cy) * -4;
    const rotY = ((x - cx) / cx) * 4;
    card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(4px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

/* ---- PARALLAX HERO ORBS ---- */
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const orb1 = document.querySelector('.hero-orb-1');
  const orb2 = document.querySelector('.hero-orb-2');
  if (orb1) orb1.style.transform = `translateY(${scrollY * 0.15}px)`;
  if (orb2) orb2.style.transform = `translateY(${scrollY * -0.1}px)`;
});

/* ---- ACTIVE NAV LINK ON SCROLL ---- */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === '#' + entry.target.id) {
          link.style.color = 'var(--white)';
        }
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));

/* ---- SPIN KEYFRAME (for form loading) ---- */
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

/* ---- STAGGER REVEAL FOR GRID ITEMS ---- */
const gridObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const items = entry.target.querySelectorAll('.service-card, .project-item, .process-step');
      items.forEach((item, i) => {
        setTimeout(() => item.classList.add('visible'), i * 80);
      });
      gridObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.services-grid, .projects-list, .process-steps').forEach(el => {
  gridObserver.observe(el);
});

/* ---- MARQUEE PAUSE ON HOVER ---- */
const marqueeTrack = document.querySelector('.marquee-track');
if (marqueeTrack) {
  marqueeTrack.addEventListener('mouseenter', () => {
    marqueeTrack.style.animationPlayState = 'paused';
  });
  marqueeTrack.addEventListener('mouseleave', () => {
    marqueeTrack.style.animationPlayState = 'running';
  });
}

/* ---- PAGE LOAD ANIMATION ---- */
document.addEventListener('DOMContentLoaded', () => {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.5s ease';
  requestAnimationFrame(() => {
    document.body.style.opacity = '1';
  });
});