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
    cursor.style.top = mouseY + 'px';
});

function animateFollower() {
    followerX += (mouseX - followerX) * 0.12;
    followerY += (mouseY - followerY) * 0.12;
    cursorFollower.style.left = followerX + 'px';
    cursorFollower.style.top = followerY + 'px';
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
    anchor.addEventListener('click', function (e) {
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
    const data = new FormData(form);
    data.delete('contact-honeypot');

    if (!data.get('form-name')) {
        data.set('form-name', form.getAttribute('name') || 'contact');
    }

    return new URLSearchParams(data).toString();
}

function isNetlifyFormSuccess(html) {
    const body = String(html).toLowerCase();
    return (
        body.includes('your form submission has been received') ||
        body.includes('form-success')
    );
}

function setFormStatus(type, message) {
    const el = document.getElementById('formStatus');
    if (!el) return;

    el.hidden = false;
    el.className = 'form-status';
    el.textContent = message;

    if (type === 'success') el.classList.add('is-success');
    else if (type === 'error') el.classList.add('is-error');
    else el.classList.add('is-info');
}

function clearFormStatus() {
    const el = document.getElementById('formStatus');
    if (!el) return;
    el.hidden = true;
    el.textContent = '';
    el.className = 'form-status';
}

async function postContactToNetlify(form) {
    const res = await fetch(form.getAttribute('action') || '/thanks.html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: buildContactPayload(form),
    });

    const text = await res.text();
    const saved = res.ok && isNetlifyFormSuccess(text);

    return { saved, status: res.status };
}

/* ---- CONTACT FORM: reCAPTCHA → Netlify → message from real response ---- */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    const honeypotField = contactForm.querySelector('[name="contact-honeypot"]');
    if (honeypotField) honeypotField.value = '';

    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const btn = this.querySelector('button[type="submit"]');
        const originalHTML = btn.innerHTML;
        const form = this;
        const siteKey = window.RECAPTCHA_SITE_KEY && String(window.RECAPTCHA_SITE_KEY).trim();

        clearFormStatus();
        btn.disabled = true;
        btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 0.8s linear infinite">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <span>Please wait...</span>`;

        try {
            const honeypot = form.querySelector('[name="contact-honeypot"]');
            if (honeypot) honeypot.value = '';

            if (siteKey) {
                setFormStatus('info', 'Step 1/2: Verifying reCAPTCHA...');
                const token = await getRecaptchaV3Token();
                if (!token) {
                    setFormStatus('error', 'reCAPTCHA verification failed. Refresh the page and try again.');
                    throw new Error('recaptcha');
                }
            }

            setFormStatus('info', siteKey ? 'Step 2/2: Sending to Netlify...' : 'Sending your message...');

            const { saved, status } = await postContactToNetlify(form);

            if (saved) {
                setFormStatus('success', 'Success! Your message was saved. We will get back to you soon.');
                btn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>Message Sent!</span>`;
                btn.style.background = '#22c55e';
                form.reset();
            } else {
                setFormStatus(
                    'error',
                    `Failed to save (server responded ${status}). Please try again in a moment.`
                );
                throw new Error('netlify');
            }
        } catch (err) {
            if (err && err.message !== 'recaptcha' && err.message !== 'netlify') {
                setFormStatus('error', 'Network error. Check your connection and try again.');
            }

            if (!btn.style.background || btn.style.background === '') {
                btn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span>Failed — try again</span>`;
                btn.style.background = '#ef4444';
            }
        } finally {
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = '';
                btn.disabled = false;
            }, 4000);
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

/* ---- HERO CODE CARD: rotate language snippets ---- */
(function initCodeSnippetRotation() {
  const codeCard = document.getElementById('codeCard');
  if (!codeCard) return;

  const titleEl = codeCard.querySelector('.card-title');
  const bodyEl  = codeCard.querySelector('.code-body');
  if (!titleEl || !bodyEl) return;

  // Color tokens already styled in CSS: kw, var, fn, op, pu, str
  const snippets = [
    // Vue.js
    { title: 'app.js', lines: [
      `<span class="kw">const</span> <span class="var">app</span> <span class="op">=</span> <span class="fn">createApp</span><span class="pu">()</span>`,
      `<span class="kw">app</span><span class="pu">.</span><span class="fn">use</span><span class="pu">(</span><span class="str">Router</span><span class="pu">)</span>`,
      `<span class="kw">app</span><span class="pu">.</span><span class="fn">use</span><span class="pu">(</span><span class="str">Pinia</span><span class="pu">)</span>`,
      `<span class="fn">app</span><span class="pu">.</span><span class="fn">mount</span><span class="pu">(</span><span class="str">'#app'</span><span class="pu">)</span>`,
    ]},
    // Laravel / PHP
    { title: 'web.php', lines: [
      `<span class="kw">use</span> <span class="var">App\\Route</span><span class="pu">;</span>`,
      `<span class="var">Route</span><span class="pu">::</span><span class="fn">get</span><span class="pu">(</span><span class="str">'/'</span><span class="pu">,</span> <span class="var">Home</span><span class="pu">)</span>`,
      `<span class="var">Route</span><span class="pu">::</span><span class="fn">resource</span><span class="pu">(</span><span class="str">'users'</span><span class="pu">)</span>`,
      `<span class="var">Route</span><span class="pu">::</span><span class="fn">middleware</span><span class="pu">(</span><span class="str">'auth'</span><span class="pu">)</span>`,
    ]},
    // React
    { title: 'App.jsx', lines: [
      `<span class="kw">const</span> <span class="fn">App</span> <span class="op">=</span> <span class="pu">() =&gt; {</span>`,
      `  <span class="kw">const</span> <span class="pu">[</span><span class="var">n</span><span class="pu">]</span> <span class="op">=</span> <span class="fn">useState</span><span class="pu">(</span><span class="str">0</span><span class="pu">)</span>`,
      `  <span class="kw">return</span> <span class="pu">&lt;</span><span class="fn">Hero</span> <span class="var">n</span><span class="op">=</span><span class="pu">{</span><span class="var">n</span><span class="pu">}/&gt;</span>`,
      `<span class="pu">}</span>`,
    ]},
    // Django / Python
    { title: 'views.py', lines: [
      `<span class="kw">def</span> <span class="fn">home</span><span class="pu">(</span><span class="var">request</span><span class="pu">):</span>`,
      `  <span class="var">posts</span> <span class="op">=</span> <span class="fn">Post</span><span class="pu">.</span><span class="fn">all</span><span class="pu">()</span>`,
      `  <span class="var">ctx</span> <span class="op">=</span> <span class="pu">{</span><span class="str">'posts'</span><span class="pu">:</span> <span class="var">posts</span><span class="pu">}</span>`,
      `  <span class="kw">return</span> <span class="fn">render</span><span class="pu">(</span><span class="var">ctx</span><span class="pu">)</span>`,
    ]},
    // Node / Express
    { title: 'server.js', lines: [
      `<span class="kw">const</span> <span class="var">app</span> <span class="op">=</span> <span class="fn">express</span><span class="pu">()</span>`,
      `<span class="var">app</span><span class="pu">.</span><span class="fn">use</span><span class="pu">(</span><span class="fn">cors</span><span class="pu">())</span>`,
      `<span class="var">app</span><span class="pu">.</span><span class="fn">use</span><span class="pu">(</span><span class="str">'/api'</span><span class="pu">,</span> <span class="var">router</span><span class="pu">)</span>`,
      `<span class="var">app</span><span class="pu">.</span><span class="fn">listen</span><span class="pu">(</span><span class="str">3000</span><span class="pu">)</span>`,
    ]},
    // Next.js / TypeScript
    { title: 'page.tsx', lines: [
      `<span class="kw">async function</span> <span class="fn">Page</span><span class="pu">() {</span>`,
      `  <span class="kw">const</span> <span class="var">d</span> <span class="op">=</span> <span class="kw">await</span> <span class="fn">getData</span><span class="pu">()</span>`,
      `  <span class="kw">return</span> <span class="pu">&lt;</span><span class="fn">Hero</span> <span class="var">data</span><span class="op">=</span><span class="pu">{</span><span class="var">d</span><span class="pu">}/&gt;</span>`,
      `<span class="pu">}</span>`,
    ]},
    // MySQL
    { title: 'query.sql', lines: [
      `<span class="kw">SELECT</span> <span class="op">*</span> <span class="kw">FROM</span> <span class="var">users</span>`,
      `<span class="kw">WHERE</span> <span class="var">status</span> <span class="op">=</span> <span class="str">'active'</span>`,
      `<span class="kw">ORDER BY</span> <span class="var">created</span> <span class="kw">DESC</span>`,
      `<span class="kw">LIMIT</span> <span class="str">10</span><span class="pu">;</span>`,
    ]},
    // ChatGPT / Python
    { title: 'bot.py', lines: [
      `<span class="kw">from</span> <span class="var">openai</span> <span class="kw">import</span> <span class="fn">OpenAI</span>`,
      `<span class="var">client</span> <span class="op">=</span> <span class="fn">OpenAI</span><span class="pu">(</span><span class="var">key</span><span class="pu">)</span>`,
      `<span class="var">res</span> <span class="op">=</span> <span class="var">client</span><span class="pu">.</span><span class="fn">chat</span><span class="pu">(</span><span class="var">msg</span><span class="pu">)</span>`,
      `<span class="fn">print</span><span class="pu">(</span><span class="var">res</span><span class="pu">.</span><span class="var">text</span><span class="pu">)</span>`,
    ]},
    // Nuxt / Vue
    { title: 'index.vue', lines: [
      `<span class="pu">&lt;</span><span class="kw">script setup</span><span class="pu">&gt;</span>`,
      `<span class="kw">const</span> <span class="pu">{</span> <span class="var">data</span> <span class="pu">} =</span> <span class="kw">await</span> <span class="fn">useFetch</span><span class="pu">()</span>`,
      `<span class="kw">const</span> <span class="var">user</span> <span class="op">=</span> <span class="fn">useUser</span><span class="pu">()</span>`,
      `<span class="pu">&lt;/</span><span class="kw">script</span><span class="pu">&gt;</span>`,
    ]},
    // Stripe / Node
    { title: 'pay.js', lines: [
      `<span class="kw">const</span> <span class="var">stripe</span> <span class="op">=</span> <span class="fn">Stripe</span><span class="pu">(</span><span class="var">KEY</span><span class="pu">)</span>`,
      `<span class="kw">await</span> <span class="var">stripe</span><span class="pu">.</span><span class="fn">charges</span><span class="pu">.</span><span class="fn">create</span><span class="pu">(</span>`,
      `  <span class="pu">{</span> <span class="var">amount</span><span class="pu">:</span> <span class="str">2000</span> <span class="pu">})</span>`,
      `<span class="fn">res</span><span class="pu">.</span><span class="fn">redirect</span><span class="pu">(</span><span class="str">'/thanks'</span><span class="pu">)</span>`,
    ]},
  ];

  let idx = Math.floor(Math.random() * snippets.length);
  let paused = false;

  function render(i) {
    const s = snippets[i];
    codeCard.classList.add('snippet-swapping');
    setTimeout(() => {
      titleEl.textContent = s.title;
      bodyEl.innerHTML = s.lines.map((line, j) => {
        const isLast = j === s.lines.length - 1;
        return `<div class="code-line${isLast ? ' typed-line' : ''}">${line}${isLast ? '<span class="cursor-blink">|</span>' : ''}</div>`;
      }).join('');
      codeCard.classList.remove('snippet-swapping');
    }, 280);
  }

  render(idx);

  codeCard.addEventListener('mouseenter', () => { paused = true;  });
  codeCard.addEventListener('mouseleave', () => { paused = false; });

  setInterval(() => {
    if (paused || document.hidden) return;
    idx = (idx + 1) % snippets.length;
    render(idx);
  }, 6000);
})();

/* ---- TESTIMONIAL SWAP (click-to-feature) ---- */
(function initTestimonialSwap() {
    const featured = document.querySelector('.featured-testi');
    if (!featured) return;

    const fQuote = featured.querySelector('.featured-quote');
    const fAvatar = featured.querySelector('.featured-avatar');
    const fName = featured.querySelector('.featured-info strong');
    const fRole = featured.querySelector('.featured-info span');

    if (!fQuote || !fAvatar || !fName || !fRole) return;

    // Snapshot the default state so the user can return to it
    const defaults = {
        quote: fQuote.innerHTML,
        initials: fAvatar.textContent,
        style: fAvatar.getAttribute('style') || '',
        name: fName.textContent,
        role: fRole.textContent,
    };

    const allCards = document.querySelectorAll('.testi-card');
    let activeKey = null;

    function stripQuotes(s) {
        return String(s).trim().replace(/^[“”"'`]+/, '').replace(/[“”"'`]+$/, '').trim();
    }

    function applyToFeatured(data) {
        featured.classList.add('swapping');
        setTimeout(() => {
            if (data.isDefault) {
                fQuote.innerHTML = data.quote;
            } else {
                fQuote.textContent = data.quote;
            }
            fAvatar.textContent = data.initials;
            fAvatar.setAttribute('style', data.style);
            fName.textContent = data.name;
            fRole.textContent = data.role;
            featured.classList.remove('swapping');
        }, 280);
    }

    function setActive(key) {
        activeKey = key;
        allCards.forEach(c => {
            const cKey = c.querySelector('.testi-avatar')?.textContent || '';
            c.classList.toggle('active', key !== null && cKey === key);
        });
    }

    function handleSelect(card) {
        const avatarEl = card.querySelector('.testi-avatar');
        if (!avatarEl) return;

        const key = avatarEl.textContent;

        // Clicking the active card again restores the default
        if (key === activeKey) {
            applyToFeatured({ ...defaults, isDefault: true });
            setActive(null);
            return;
        }

        const quote = stripQuotes(card.querySelector('.testi-text')?.textContent || '');
        applyToFeatured({
            quote,
            initials: avatarEl.textContent,
            style: avatarEl.getAttribute('style') || '',
            name: card.querySelector('.testi-meta strong')?.textContent || '',
            role: card.querySelector('.testi-meta span')?.textContent || '',
        });
        setActive(key);
    }

    allCards.forEach(card => {
        card.addEventListener('click', () => handleSelect(card));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelect(card);
            }
        });
    });
})();

/* ---- TAWK.TO LIVE CHAT (https://tawk.to) ---- */
(function initTawkTo() {
    const propertyId = window.TAWK_PROPERTY_ID && String(window.TAWK_PROPERTY_ID).trim();
    const widgetId = (window.TAWK_WIDGET_ID && String(window.TAWK_WIDGET_ID).trim()) || 'default';

    if (!propertyId) {
        console.info('tawk.to: Add your Property ID in config.js (from https://dashboard.tawk.to)');
        return;
    }

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    window.Tawk_API.onLoad = function onTawkLoad() {
        document.documentElement.classList.add('tawk-ready');
    };

    const s1 = document.createElement('script');
    s1.async = true;
    s1.src = `https://embed.tawk.to/${encodeURIComponent(propertyId)}/${encodeURIComponent(widgetId)}`;
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    document.body.appendChild(s1);
})();

/* ---- LINKEDIN POSTS (API auto-fetch or JSON fallback) ---- */
(function initLinkedInFeed() {
    const grid = document.getElementById('linkedinPostsGrid');
    const badge = document.getElementById('linkedinSyncBadge');
    const profileLink = document.getElementById('linkedinProfileLink');
    if (!grid) return;

    const postsFile = window.LINKEDIN_POSTS_FILE || 'linkedin-posts.json';
    const feedApi = window.LINKEDIN_FEED_API || '/.netlify/functions/linkedin-feed';
    const defaultProfile = window.LINKEDIN_PROFILE_URL || 'https://www.linkedin.com/in/braincore';

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatDate(isoDate) {
        if (!isoDate) return '';
        const d = new Date(isoDate);
        if (Number.isNaN(d.getTime())) return isoDate;
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function setBadge(type, text) {
        if (!badge) return;
        badge.textContent = text;
        badge.classList.remove('is-live', 'is-manual');
        if (type === 'live') badge.classList.add('is-live');
        if (type === 'manual') badge.classList.add('is-manual');
    }

    function renderPosts(posts, profileUrl) {
        if (profileLink && profileUrl) profileLink.href = profileUrl;

        if (!posts || !posts.length) {
            grid.innerHTML = '<p class="linkedin-empty reveal visible">No LinkedIn posts yet. Add posts in <code>linkedin-posts.json</code> or connect the LinkedIn API on Netlify.</p>';
            return;
        }

        grid.innerHTML = posts.map((post, i) => `
      <article class="linkedin-post-card reveal visible" data-delay="${i * 80}">
        <time class="linkedin-post-date" datetime="${escapeHtml(post.date || '')}">${formatDate(post.date)}</time>
        <p class="linkedin-post-text">${escapeHtml(post.text || '')}</p>
        <a class="linkedin-post-link" href="${escapeHtml(post.url || profileUrl)}" target="_blank" rel="noopener noreferrer">
          Read on LinkedIn
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M7 7h10v10"/></svg>
        </a>
      </article>
    `).join('');
    }

    async function loadJsonFallback() {
        const res = await fetch(postsFile, { cache: 'no-store' });
        if (!res.ok) throw new Error('Could not load linkedin-posts.json');
        return res.json();
    }

    async function loadFromApi() {
        const res = await fetch(feedApi, { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.posts && data.posts.length) {
            return { data, source: 'api' };
        }
        return null;
    }

    (async function loadLinkedInPosts() {
        try {
            const apiResult = await loadFromApi();
            if (apiResult) {
                setBadge('live', 'Live from LinkedIn');
                renderPosts(apiResult.data.posts, apiResult.data.profileUrl || defaultProfile);
                return;
            }

            const json = await loadJsonFallback();
            setBadge('manual', 'From posts list');
            renderPosts(json.posts, json.profileUrl || defaultProfile);
        } catch (err) {
            console.warn('LinkedIn feed:', err);
            setBadge('manual', 'Could not load posts');
            grid.innerHTML = '<p class="linkedin-empty reveal visible">Could not load LinkedIn posts. Check <code>linkedin-posts.json</code> or Netlify LinkedIn API settings.</p>';
        }
    })();
})();