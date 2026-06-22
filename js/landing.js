/* ═══════════════════════════════════════════════════════════════
   SISCAR — LANDING.JS — Landing Page Interactivity
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Navbar Scroll Effect ──────────────────────────────────── */
  const navbar = document.querySelector('.navbar');
  const scrollTop = document.querySelector('.scroll-top');

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (navbar) navbar.classList.toggle('scrolled', y > 60);
    if (scrollTop) scrollTop.classList.toggle('visible', y > 400);
  }, { passive: true });

  if (scrollTop) {
    scrollTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ── Mobile Menu ───────────────────────────────────────────── */
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      const spans = hamburger.querySelectorAll('span');
      const isOpen = mobileMenu.classList.contains('open');
      if (isOpen) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      }
    });

    // Close on nav link click
    mobileMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      });
    });
  }

  /* ── Smooth Scroll for anchor links ────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── Intersection Observer Animations ──────────────────────── */
  const observerOpts = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.dataset.delay || 0;
        setTimeout(() => {
          el.classList.add('in-view');
        }, parseInt(delay));
        observer.unobserve(el);
      }
    });
  }, observerOpts);

  document.querySelectorAll('[data-reveal]').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';
    el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    el.style.transitionDelay = (el.dataset.delay || '0') + 'ms';
    observer.observe(el);
  });

  document.querySelectorAll('.in-view').forEach = function() {};
  const style = document.createElement('style');
  style.textContent = `[data-reveal].in-view { opacity: 1 !important; transform: translateY(0) !important; }`;
  document.head.appendChild(style);

  /* ── Counter Animation (Stats Band) ────────────────────────── */
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const duration = 1800;
        const start = performance.now();

        const update = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.floor(eased * target);
          el.textContent = prefix + (target >= 1000 ? current.toLocaleString('pt-BR') : current) + suffix;
          if (progress < 1) requestAnimationFrame(update);
        };

        requestAnimationFrame(update);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => {
    counterObserver.observe(el);
  });

  /* ── FAQ Accordion ─────────────────────────────────────────── */
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const wasOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));

      // Toggle current
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* ── CTA Form Submission ───────────────────────────────────── */
  const ctaForms = document.querySelectorAll('.cta-form');
  ctaForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]');
      if (email && email.value) {
        Toast.success('Cadastro realizado!', 'Entraremos em contato em breve. 🚀');
        email.value = '';
      } else {
        Toast.error('Campo obrigatório', 'Por favor, informe seu email.');
      }
    });
  });

  const heroForm = document.getElementById('hero-form');
  if (heroForm) {
    heroForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = heroForm.querySelector('#hero-name')?.value;
      const phone = heroForm.querySelector('#hero-phone')?.value;
      if (name && phone) {
        Toast.success('Solicitação enviada!', 'Nossa equipe entrará em contato em até 24h! 🎉');
        heroForm.reset();
      } else {
        Toast.warning('Preencha todos os campos', 'Nome e telefone são obrigatórios.');
      }
    });
  }

  /* ── Portals Infinite Scroll ────────────────────────────────── */
  const portalsScroll = document.querySelector('.portals-scroll');
  if (portalsScroll) {
    const track = portalsScroll.querySelector('.portals-track');
    const clone = track?.cloneNode(true);
    if (clone) {
      clone.classList.add('portals-track-clone');
      portalsScroll.appendChild(clone);
    }
  }

  /* ── Pricing Toggle (Annual/Monthly) ───────────────────────── */
  const billingToggle = document.getElementById('billing-toggle');
  if (billingToggle) {
    billingToggle.addEventListener('change', () => {
      const isAnnual = billingToggle.checked;
      const prices = document.querySelectorAll('.pricing-amount');
      const monthlyPrices = [149, 249, 449];
      prices.forEach((el, i) => {
        const monthly = monthlyPrices[i];
        if (isAnnual) {
          el.textContent = Math.round(monthly * 0.8);
          el.closest('.pricing-card')?.querySelector('.pricing-period')
            ?.insertAdjacentHTML('afterend', '<div class="pricing-savings" style="color:var(--success);font-size:0.78rem;margin-top:4px;">Economize 20%</div>');
        } else {
          el.textContent = monthly;
          el.closest('.pricing-card')?.querySelector('.pricing-savings')?.remove();
        }
      });
    });
  }

  /* ── Hero Dashboard Preview Bars Animation ──────────────────── */
  const bars = document.querySelectorAll('.preview-bar');
  const barHeights = [40, 65, 50, 80, 60, 90, 70, 55, 85, 45];
  bars.forEach((bar, i) => {
    bar.style.height = (barHeights[i % barHeights.length] || 50) + '%';
    bar.style.transition = `height 1s ease ${i * 0.1}s`;
    setTimeout(() => {
      setInterval(() => {
        const h = Math.random() * 70 + 20;
        bar.style.height = h + '%';
      }, 2000 + i * 200);
    }, 1000);
  });

  /* ── Feature Cards Hover 3D Effect ─────────────────────────── */
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-8px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ── Testimonial Slider ─────────────────────────────────────── */
  let testimonialIdx = 0;
  const testimonials = document.querySelectorAll('.testimonial-card');
  if (testimonials.length > 3) {
    setInterval(() => {
      testimonials.forEach(t => t.classList.remove('featured-t'));
      testimonialIdx = (testimonialIdx + 1) % testimonials.length;
      testimonials[testimonialIdx].classList.add('featured-t');
    }, 4000);
  }

  /* ── WhatsApp Float Tooltip ─────────────────────────────────── */
  const waFloat = document.querySelector('.whatsapp-float');
  if (waFloat) {
    waFloat.setAttribute('data-tooltip', 'Fale conosco pelo WhatsApp!');
  }

});
