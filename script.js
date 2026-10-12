(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const pad = n => String(n).padStart(2, '0');
  const md = d => `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;

  $('#year').textContent = new Date().getFullYear();

  /* ---------- split the name into letters ---------- */
  let i = 0;
  $$('.split').forEach(line => {
    const text = line.textContent;
    line.textContent = '';
    for (const ch of text) {
      const s = document.createElement('span');
      s.className = 'char';
      s.textContent = ch;
      s.style.setProperty('--i', i++);
      s.setAttribute('aria-hidden', 'true');
      s.addEventListener('mouseenter', () => {
        s.classList.remove('hop');
        void s.offsetWidth;
        s.classList.add('hop');
      });
      line.appendChild(s);
    }
  });

  /* ---------- intro loader: P3-style calendar ---------- */
  const loader = $('#loader');
  const today = new Date();
  $('#loaderDate').textContent = md(today);
  $('#loaderDay').textContent = DAYS[today.getDay()];
  document.body.classList.add('loading');

  const finishLoad = () => {
    loader.classList.add('done');
    document.body.classList.remove('loading');
    $('.name').classList.add('in');
    $$('.hero .reveal').forEach(el => el.classList.add('in'));
  };

  if (reduced) {
    finishLoad();
  } else {
    const bar = $('#loaderBar');
    const lines = ['Initialising profile', 'Loading experience', 'Summoning persona', 'Ready'];
    let p = 0;
    const tick = setInterval(() => {
      p = Math.min(100, p + 7 + Math.random() * 14);
      bar.style.width = p + '%';
      $('#loaderSub').textContent = lines[Math.min(lines.length - 1, Math.floor(p / 34))];
      if (p >= 100) {
        clearInterval(tick);
        setTimeout(finishLoad, 350);
      }
    }, 110);
  }

  /* ---------- scroll reveal ---------- */
  const revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            revealObserver.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    : null;
  $$('.reveal').forEach(el => {
    if (el.closest('.hero')) return;
    revealObserver ? revealObserver.observe(el) : el.classList.add('in');
  });

  /* ---------- custom cursor ---------- */
  if (finePointer && !reduced) {
    const dot = $('#cursorDot');
    const ring = $('#cursorRing');
    const label = $('#cursorLabel');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', e => {
      document.body.classList.add('has-cursor');
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    });
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    };
    loop();

    document.addEventListener('mouseover', e => {
      const t = e.target.closest('[data-cursor]');
      if (t) {
        label.innerHTML = t.dataset.cursor;
        ring.classList.add('big');
      }
    });
    document.addEventListener('mouseout', e => {
      const t = e.target.closest('[data-cursor]');
      if (t && !t.contains(e.relatedTarget)) ring.classList.remove('big');
    });
    addEventListener('mousedown', () => ring.classList.add('press'));
    addEventListener('mouseup', () => ring.classList.remove('press'));
    document.addEventListener('mouseleave', () => document.body.classList.remove('has-cursor'));
    document.addEventListener('mouseenter', () => document.body.classList.add('has-cursor'));
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduced) {
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.3;
        const y = (e.clientY - r.top - r.height / 2) * 0.4;
        btn.style.transform = `translate(${x}px, ${y}px) skewX(-10deg)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- portrait tilt + glare ---------- */
  const portrait = $('#portrait');
  if (portrait && finePointer && !reduced) {
    portrait.addEventListener('mousemove', e => {
      const r = portrait.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      portrait.style.transform = `rotateY(${(px - 0.5) * 18}deg) rotateX(${(0.5 - py) * 14}deg)`;
      portrait.style.setProperty('--gx', px * 100 + '%');
      portrait.style.setProperty('--gy', py * 100 + '%');
    });
    portrait.addEventListener('mouseleave', () => { portrait.style.transform = ''; });
  }

  /* ---------- marquee: speeds up with scroll ---------- */
  const track = $('#marquee');
  if (track && !reduced) {
    track.innerHTML += track.innerHTML; // duplicate for seamless loop
    let x = 0, lastY = scrollY, boost = 0;
    const run = () => {
      const dy = scrollY - lastY;
      lastY = scrollY;
      // always drift left; scrolling either way just speeds it up
      boost += (Math.min(Math.abs(dy), 80) * 0.25 - boost) * 0.1;
      x -= 0.6 + boost;
      const half = track.scrollWidth / 2;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.transform = `translateX(${x}px)`;
      requestAnimationFrame(run);
    };
    run();
  }

  /* ---------- scroll progress + active nav ---------- */
  const progress = $('#progress');
  const header = $('.top');
  const navLinks = $$('.nav a');
  const sections = $$('main section[id]');
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    progress.style.height = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
    header.classList.toggle('scrolled', scrollY > 40);
    let current = '';
    sections.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * 0.4) current = s.id; });
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- calendar transition between sections ---------- */
  const flip = $('#calFlip');
  let flipping = false;
  const calendarJump = (target, title) => {
    if (reduced || flipping) {
      target.scrollIntoView();
      return;
    }
    flipping = true;
    const d = new Date(); // always today's real date
    $('#flipDate').textContent = md(d);
    $('#flipDay').textContent = DAYS[d.getDay()];
    $('#flipTitle').textContent = title;
    flip.classList.remove('show');
    void flip.offsetWidth;
    flip.classList.add('show');
    setTimeout(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      target.scrollIntoView();
      document.documentElement.style.scrollBehavior = '';
    }, 480);
    setTimeout(() => { flip.classList.remove('show'); flipping = false; }, 1200);
  };

  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const target = id === 'top' ? document.body : document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      if (a.id === 'logo') return; // logo has its own handler
      calendarJump(target, target.dataset.title || 'Top');
    });
  });

  /* ---------- experience accordion ---------- */
  $$('.job-row').forEach(row => {
    row.addEventListener('click', () => {
      const job = row.closest('.job');
      const open = !job.classList.contains('open');
      $$('.job.open').forEach(j => { j.classList.remove('open'); $('.job-row', j).setAttribute('aria-expanded', 'false'); });
      job.classList.toggle('open', open);
      row.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- year tabs ---------- */
  const yearBtns = $$('.years button');
  yearBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      yearBtns.forEach(b => b.setAttribute('aria-selected', String(b === btn)));
      $$('.team-list').forEach(list => {
        const active = list.dataset.year === btn.dataset.year;
        list.classList.toggle('active', active);
        if (active) $$('li', list).forEach((li, n) => {
          li.style.setProperty('--i', n);
          li.style.animation = 'none';
          void li.offsetWidth;
          li.style.animation = '';
        });
      });
    });
  });
  $$('.team-list li').forEach((li, n) => li.style.setProperty('--i', n % 4));

  /* ---------- toast ---------- */
  const toast = $('#toast');
  let toastTimer;
  const showToast = msg => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  };

  /* ---------- copy email / phone ---------- */
  const copyText = async text => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback for browsers that block the clipboard API (e.g. opened from a file)
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch {}
      ta.remove();
      return ok;
    }
  };
  $$('[data-copy]').forEach(el => {
    el.addEventListener('click', async () => {
      const ok = await copyText(el.dataset.copy);
      showToast(ok ? (el.dataset.copied || 'Copied') : 'Copy failed - ' + el.dataset.copy);
    });
  });

  /* ---------- light / dark theme ---------- */
  const themeBtn = $('#themeBtn');
  const root = document.documentElement;
  const syncThemeBtn = () => {
    const light = root.dataset.theme === 'light';
    themeBtn.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
    themeBtn.dataset.cursor = light ? 'Dark' : 'Light';
  };
  themeBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch {}
    syncThemeBtn();
    $('#cursorLabel') && ($('#cursorLabel').textContent = themeBtn.dataset.cursor);
    showToast(next === 'light' ? 'Light mode' : 'Dark mode');
  });
  syncThemeBtn();

  /* ---------- Dark Hour ---------- */
  const dhBtn = $('#darkHourBtn');
  const clock = $('#clock');
  let darkHour = false;
  const renderClock = () => {
    const n = new Date();
    clock.textContent = darkHour ? '00:00' : `${pad(n.getHours())}:${pad(n.getMinutes())}`;
  };
  const setDarkHour = on => {
    darkHour = on;
    document.body.classList.toggle('dark-hour', on);
    dhBtn.setAttribute('aria-pressed', String(on));
    dhBtn.setAttribute('aria-label', on ? 'End the Dark Hour' : 'Start the Dark Hour');
    renderClock();
    showToast(on ? 'The Dark Hour has begun' : 'Welcome back');
    // cursor hint over the clock: "Enter..." in normal time, "Return..." during the Dark Hour
    dhBtn.dataset.cursor = on ? 'Return...' : 'Enter...';
    const label = $('#cursorLabel');
    if (label && dhBtn.matches(':hover')) label.textContent = dhBtn.dataset.cursor;
  };
  dhBtn.addEventListener('click', () => setDarkHour(!darkHour));
  addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === 'd' || e.key === 'D') setDarkHour(!darkHour);
  });
  renderClock();
  setInterval(renderClock, 10000);

  /* ---------- logo: back to top, triple-click = sword slash ---------- */
  const logo = $('#logo');
  const slash = $('#slash');
  let clicks = 0, clickTimer;

  // soft blue flames rising along the bottom of the screen, like summoning a Persona
  const summonFlame = () => {
    const burst = document.createElement('div');
    burst.className = 'flame-burst';
    burst.innerHTML = '<div class="aura"></div>';
    const rand = (a, b) => a + Math.random() * (b - a);
    const count = Math.round(Math.min(90, Math.max(30, innerWidth / 18)));
    for (let n = 0; n < count; n++) {
      const f = document.createElement('i');
      f.className = 'flame';
      // spread evenly across the width with a little jitter
      f.style.setProperty('--x', ((n + rand(0, 1)) / count) * 100 + '%');
      f.style.setProperty('--y', rand(-10, 14) + 'px');
      f.style.setProperty('--s', rand(16, 32) + 'px');
      f.style.setProperty('--dx', rand(-18, 18) + 'px');
      f.style.setProperty('--rise', rand(80, 150) + 'px');
      f.style.setProperty('--r', rand(-25, 25) + 'deg');
      f.style.setProperty('--d', rand(1.1, 1.8) + 's');
      f.style.setProperty('--delay', rand(0, 0.8) + 's');
      burst.appendChild(f);
    }
    document.body.appendChild(burst);
    logo.classList.add('awakened');
    setTimeout(() => logo.classList.remove('awakened'), 1600);
    setTimeout(() => burst.remove(), 2800);
  };
  logo.addEventListener('click', e => {
    e.preventDefault();
    clicks++;
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      if (clicks >= 3 && !reduced) {
        logo.classList.remove('spin'); void logo.offsetWidth; logo.classList.add('spin');
        slash.classList.remove('go'); void slash.offsetWidth; slash.classList.add('go');
        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 450);
        summonFlame();
        showToast('PERSONA!!');
        // the cursor over the logo shouts it too, then goes back to "Awaken"
        const label = $('#cursorLabel');
        logo.dataset.cursor = 'PERSONA!!';
        if (label) label.textContent = 'PERSONA!!';
        setTimeout(() => {
          logo.dataset.cursor = 'Awaken';
          if (label && label.textContent === 'PERSONA!!') label.textContent = 'Awaken';
        }, 1800);
      } else {
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      }
      clicks = 0;
    }, 320);
  });
})();
