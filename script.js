/**
 * Ahmad Ali Portfolio — script.js  v2.0
 * ─────────────────────────────────────
 * Features:
 *   • Page loader with progress
 *   • Custom cursor with hover states
 *   • Navbar: scroll-aware + active section highlighting
 *   • Mobile menu
 *   • Hero parallax (requestAnimationFrame)
 *   • Scroll reveal (IntersectionObserver)
 *   • Animated stat counters
 *   • Skill bar fill animations
 *   • Smooth anchor scroll
 *   • Contact form with mailto
 *   • Image placeholder fallback
 */

'use strict';

/* ─── Helpers ──────────────────────────────────────────────── */

const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const raf = window.requestAnimationFrame.bind(window);

/**
 * Clamp a value between min and max.
 */
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/**
 * Ease-out cubic.
 */
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

/* ─── 1. PAGE LOADER ────────────────────────────────────────── */

(function initLoader () {
    const loader = $('#pageLoader');
    if (!loader) return;

    // Hide loader after CSS animation completes (≈1.9s) + small buffer
    const HIDE_DELAY = 2000;

    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('hidden');
            document.body.classList.add('loaded');
        }, HIDE_DELAY);
    });

    // Failsafe: hide after 3.5s regardless
    setTimeout(() => {
        loader.classList.add('hidden');
        document.body.classList.add('loaded');
    }, 3500);
}());

/* ─── 2. CUSTOM CURSOR ──────────────────────────────────────── */

(function initCursor () {
    const cursor   = $('#cursor');
    const follower = $('#cursorFollower');
    if (!cursor || !follower) return;

    // Skip on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let mx = 0, my = 0;   // mouse
    let fx = 0, fy = 0;   // follower (lerped)

    document.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
        cursor.style.left = mx + 'px';
        cursor.style.top  = my + 'px';
    });

    // Smooth follower via RAF
    (function loop () {
        fx += (mx - fx) * 0.12;
        fy += (my - fy) * 0.12;
        follower.style.left = fx + 'px';
        follower.style.top  = fy + 'px';
        raf(loop);
    }());

    // Hover state on interactive elements
    const hoverTargets = 'a, button, [data-cursor-hover], .prop-tile, .expertise-card, .ms-card, .tl-card, .decor-tile';

    document.addEventListener('mouseover', e => {
        if (e.target.closest(hoverTargets)) {
            cursor.classList.add('hover');
            follower.classList.add('hover');
        }
    });

    document.addEventListener('mouseout', e => {
        if (e.target.closest(hoverTargets)) {
            cursor.classList.remove('hover');
            follower.classList.remove('hover');
        }
    });

    // Hide when leaving window
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity   = '0';
        follower.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
        cursor.style.opacity   = '1';
        follower.style.opacity = '1';
    });
}());

/* ─── 3. NAVBAR ─────────────────────────────────────────────── */

(function initNavbar () {
    const navbar = $('#navbar');
    if (!navbar) return;

    const SCROLL_THRESHOLD = 80;

    function onScroll () {
        if (window.scrollY > SCROLL_THRESHOLD) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run on init

    /* Active nav link highlighting */
    const sections  = $$('section[id]');
    const navLinks  = $$('.nav-link');

    const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const id = entry.target.id;
            navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
            });
        });
    }, { rootMargin: '-40% 0px -55% 0px' });

    sections.forEach(s => sectionObserver.observe(s));
}());

/* ─── 4. MOBILE MENU ────────────────────────────────────────── */

(function initMobileMenu () {
    const hamburger    = $('#hamburger');
    const mobileOverlay = $('#mobileOverlay');
    if (!hamburger || !mobileOverlay) return;

    let isOpen = false;

    function open () {
        isOpen = true;
        hamburger.classList.add('open');
        hamburger.setAttribute('aria-expanded', 'true');
        mobileOverlay.classList.add('open');
        document.body.classList.add('menu-open');
    }

    function close () {
        isOpen = false;
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileOverlay.classList.remove('open');
        document.body.classList.remove('menu-open');
    }

    hamburger.addEventListener('click', () => isOpen ? close() : open());

    // Close on outside click
    document.addEventListener('click', e => {
        if (isOpen && !hamburger.contains(e.target) && !mobileOverlay.contains(e.target)) {
            close();
        }
    });

    // Expose for inline onclick
    window.closeMenu = close;
}());

/* ─── 5. SMOOTH ANCHOR SCROLL ───────────────────────────────── */

(function initSmoothScroll () {
    const navbar = $('#navbar');

    document.addEventListener('click', e => {
        const anchor = e.target.closest('a[href^="#"]');
        if (!anchor) return;

        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;

        const target = $(targetId);
        if (!target) return;

        e.preventDefault();

        const navH   = navbar ? navbar.offsetHeight : 0;
        const top    = target.getBoundingClientRect().top + window.scrollY - navH - 16;

        window.scrollTo({ top, behavior: 'smooth' });
    });
}());

/* ─── 6. HERO PARALLAX ──────────────────────────────────────── */

(function initHeroParallax () {
    const heroPhoto = $('.hero-photo');
    const heroPills = $$('.hero-pill');
    if (!heroPhoto) return;

    // Skip on touch / reduced-motion
    if (window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;

    function onScroll () {
        if (ticking) return;
        ticking = true;

        raf(() => {
            const scrollY = window.scrollY;
            const heroH   = (document.querySelector('.hero') || {}).offsetHeight || window.innerHeight;

            if (scrollY > heroH) {
                ticking = false;
                return;
            }

            const progress = scrollY / heroH;  // 0 → 1

            // Photo subtle upward drift
            heroPhoto.style.transform = `translateY(${progress * 24}px) scale(${1 + progress * 0.03})`;

            // Pills opposite drift
            heroPills.forEach((pill, i) => {
                const dir = i % 2 === 0 ? -1 : 1;
                pill.style.transform = `translateY(calc(${dir * progress * 14}px))`;
            });

            ticking = false;
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
}());

/* ─── 7. SCROLL REVEAL ──────────────────────────────────────── */

(function initScrollReveal () {
    const revealEls = $$('[data-reveal], .reveal-block');
    if (!revealEls.length) return;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const el    = entry.target;
            const delay = parseInt(el.dataset.delay || 0, 10);

            setTimeout(() => {
                el.classList.add('visible');
            }, delay);

            observer.unobserve(el);
        });
    }, {
        threshold:  0.1,
        rootMargin: '0px 0px -48px 0px',
    });

    revealEls.forEach(el => observer.observe(el));
}());

/* ─── 8. ANIMATED STAT COUNTERS ─────────────────────────────── */

(function initCounters () {
    const counterEls = $$('[data-count]');
    if (!counterEls.length) return;

    const DURATION = 1800;

    function animateCounter (el) {
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const start  = performance.now();

        function update (now) {
            const elapsed  = now - start;
            const progress = clamp(elapsed / DURATION, 0, 1);
            const eased    = easeOutCubic(progress);
            const current  = Math.round(target * eased);

            el.textContent = current + suffix;

            if (progress < 1) {
                raf(() => update(performance.now()));
            } else {
                el.textContent = target + suffix;
            }
        }

        raf(() => update(performance.now()));
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            animateCounter(entry.target);
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.5 });

    counterEls.forEach(el => observer.observe(el));
}());

/* ─── 9. SKILL BAR ANIMATIONS ───────────────────────────────── */

(function initSkillBars () {
    const fills = $$('.sbar__fill[data-w]');
    if (!fills.length) return;

    let animated = false;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting || animated) return;
            animated = true;

            fills.forEach((fill, i) => {
                const width = fill.dataset.w + '%';
                setTimeout(() => {
                    fill.style.width = width;
                    fill.classList.add('animated');
                }, i * 110);
            });

            observer.disconnect();
        });
    }, { threshold: 0.25 });

    const skillsSection = $('.skills');
    if (skillsSection) observer.observe(skillsSection);
}());

/* ─── 10. HEADING RULE EXPANSION ────────────────────────────── */

(function initHeadingRules () {
    const rules = $$('.heading-rule');
    if (!rules.length) return;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.style.width = '44px'; // re-trigger CSS transition
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.8 });

    rules.forEach(rule => {
        rule.style.width = '0px';
        observer.observe(rule);
    });
}());

/* ─── 11. CONTACT FORM ──────────────────────────────────────── */

(function initContactForm () {
    const form    = $('#contactForm');
    const success = $('#formSuccess');
    if (!form) return;

    form.addEventListener('submit', e => {
        e.preventDefault();

        const name    = (form.querySelector('[name="name"]')    || {}).value?.trim()  || '';
        const email   = (form.querySelector('[name="email"]')   || {}).value?.trim()  || '';
        const message = (form.querySelector('[name="message"]') || {}).value?.trim()  || '';

        if (!name || !email || !message) return;

        const subject = encodeURIComponent(`Portfolio Enquiry from ${name}`);
        const body    = encodeURIComponent(
            `Name:    ${name}\nEmail:   ${email}\n\nMessage:\n${message}`
        );

        window.location.href = `mailto:amdale9999@gmail.com?subject=${subject}&body=${body}`;

        // Visual feedback
        const btn      = form.querySelector('.btn--send');
        const btnLabel = btn?.querySelector('.btn-label');

        if (btnLabel) btnLabel.textContent = 'Message Sent ✓';
        if (btn)      btn.style.background = '#2B7A4B';

        if (success) success.classList.add('show');

        setTimeout(() => {
            if (btnLabel) btnLabel.textContent = 'Send Message';
            if (btn)      btn.style.background = '';
            if (success)  success.classList.remove('show');
            form.reset();
        }, 4000);
    });
}());

/* ─── 12. IMAGE FALLBACK PLACEHOLDERS ───────────────────────── */

(function initImageFallbacks () {
    function applyPlaceholder (img) {
        const parent = img.parentElement;
        if (!parent) return;

        img.style.display = 'none';

        if (parent.querySelector('.img-ph')) return; // already applied

        parent.style.position = 'relative';

        const ph = document.createElement('div');
        ph.className  = 'img-ph';
        ph.style.cssText = [
            'position: absolute',
            'inset: 0',
            'display: flex',
            'flex-direction: column',
            'align-items: center',
            'justify-content: center',
            'gap: 10px',
            'color: rgba(198,151,63,0.35)',
            'font-family: "DM Sans", sans-serif',
            'font-size: 10px',
            'font-weight: 600',
            'letter-spacing: 2px',
            'text-transform: uppercase',
            'text-align: center',
            'pointer-events: none',
            'user-select: none',
        ].join(';');

        const filename = (img.src || '').split('/').pop() || 'image';

        ph.innerHTML = `
            <span style="font-size:28px;opacity:.35">◈</span>
            <span>${filename}</span>
        `;

        parent.appendChild(ph);
    }

    // Attach to all images immediately + via error event
    $$('img').forEach(img => {
        if (img.complete && (img.naturalWidth === 0)) {
            applyPlaceholder(img);
        } else {
            img.addEventListener('error', () => applyPlaceholder(img), { once: true });
        }
    });
}());

/* ─── 13. MARQUEE PAUSE ON HOVER ────────────────────────────── */

(function initMarquee () {
    const track = $('.marquee-track');
    if (!track) return;

    const marquee = track.parentElement;

    marquee.addEventListener('mouseenter', () => {
        track.style.animationPlayState = 'paused';
    });

    marquee.addEventListener('mouseleave', () => {
        track.style.animationPlayState = 'running';
    });
}());

/* ─── 14. CARD TILT EFFECT (subtle, desktop only) ───────────── */

(function initCardTilt () {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tiltCards = $$('.expertise-card, .ms-card');

    tiltCards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect    = card.getBoundingClientRect();
            const cx      = rect.left + rect.width  / 2;
            const cy      = rect.top  + rect.height / 2;
            const dx      = (e.clientX - cx) / (rect.width  / 2);
            const dy      = (e.clientY - cy) / (rect.height / 2);

            const rotX = clamp(-dy * 4, -5, 5);
            const rotY = clamp( dx * 4, -5, 5);

            card.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}());

/* ─── 15. RESIZE OBSERVER — update on orientation change ───── */

(function initResize () {
    let resizeTimer;

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Re-trigger visible state on already-visible elements
            // (handles orientation change layout shifts)
            document.dispatchEvent(new CustomEvent('layoutUpdate'));
        }, 150);
    });
}());
