/* NextGen Academy — حالة الطالب (XP، مستويات، شارات، سلسلة أيام، وقت الاستخدام، حماية الأهل)
   كل البيانات بتتخزن في localStorage على نفس الجهاز (نسخة MVP بدون سيرفر). */
(function () {
  const KEY = 'ng_state_v1';
  const todayStr = (d = new Date()) => {
    const z = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
  };
  const fresh = () => ({
    profile: null,            // { name, age, avatar, trackId, consent }
    xp: 0,
    streak: { last: null, count: 0, best: 0 },
    completed: {},            // lessonId -> { at, hints, solution, xp }
    drafts: {},               // lessonId -> { code, hints }
    quiz: {},                 // trackId -> { best, at }
    badges: {},               // badgeId -> timestamp
    activity: {},             // 'YYYY-MM-DD' -> seconds
    parent: { pin: null, limitMin: 0, extra: {} }
  });

  let state;
  function load() {
    try { state = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); }
    catch (e) { state = fresh(); }
    state.parent = Object.assign({ pin: null, limitMin: 0, extra: {} }, state.parent || {});
    return state;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  load();

  /* ---------- المستويات ---------- */
  const LEVELS = ['مبتدئ', 'مستكشف', 'مبرمج صغير', 'مبتكر', 'خبير', 'محترف', 'أسطورة'];
  const XP_PER_LEVEL = 250;
  const levelOf = (xp) => Math.floor(xp / XP_PER_LEVEL) + 1;
  const levelName = (lv) => LEVELS[Math.min(lv - 1, LEVELS.length - 1)];

  /* ---------- الشارات ---------- */
  const BADGES = [
    { id: 'first', icon: '🌟', name: 'أول خطوة', desc: 'أتممت أول درس' },
    { id: 'five', icon: '🔥', name: 'مثابر', desc: 'أتممت 5 دروس' },
    { id: 'ten', icon: '💎', name: 'محترف دروس', desc: 'أتممت 10 دروس' },
    { id: 'nohint', icon: '🧠', name: 'عقل ذكي', desc: 'حللت درساً دون أي تلميح' },
    { id: 'streak3', icon: '📅', name: '3 أيام متتالية', desc: 'تعلّمت 3 أيام متتالية' },
    { id: 'streak7', icon: '🏅', name: 'أسبوع كامل', desc: 'تعلّمت 7 أيام متتالية' },
    { id: 'quiz', icon: '🎯', name: 'بطل الاختبار', desc: 'حصلت على 5/5 في اختبار تدريبي' },
    { id: 'level3', icon: '⚡', name: 'مستوى 3', desc: 'وصلت إلى المستوى 3' },
    { id: 'track_c0', icon: '💻', name: 'عالم الحاسوب', desc: 'أتممت وحدة عالم الحاسوب' },
    { id: 'track_logic', icon: '🧩', name: 'عقل المبرمج', desc: 'أتممت وحدة تفكير المبرمج والخوارزميات' },
    { id: 'track_langs', icon: '🗣️', name: 'لغوي صغير', desc: 'أتممت وحدة لغات البرمجة' },
    { id: 'track_advanced', icon: '🧠', name: 'محلّل محترف', desc: 'أتممت وحدة حل المشكلات المتقدم' },
    { id: 'track_final', icon: '🎓', name: 'خريج الأكاديمية', desc: 'أتممت وحدة المشروع الختامي ومراجعة عامة' }
  ];

  function award(id, newly) {
    if (!state.badges[id]) { state.badges[id] = Date.now(); newly.push(BADGES.find((b) => b.id === id)); }
  }
  function evalBadges() {
    const newly = [];
    const n = Object.keys(state.completed).length;
    if (n >= 1) award('first', newly);
    if (n >= 5) award('five', newly);
    if (n >= 10) award('ten', newly);
    if (Object.values(state.completed).some((c) => c.hints === 0 && !c.solution)) award('nohint', newly);
    if (state.streak.count >= 3) award('streak3', newly);
    if (state.streak.count >= 7) award('streak7', newly);
    if (Object.values(state.quiz).some((q) => q.best >= 5)) award('quiz', newly);
    if (levelOf(state.xp) >= 3) award('level3', newly);
    (window.NG_TRACKS || []).forEach((t) => {
      if (t.lessons.every((l) => state.completed[l.id])) award('track_' + t.id, newly);
    });
    return newly.filter(Boolean);
  }

  /* ---------- سلسلة الأيام ---------- */
  function touchStreak() {
    const t = todayStr();
    if (state.streak.last === t) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    state.streak.count = state.streak.last === todayStr(y) ? state.streak.count + 1 : 1;
    state.streak.last = t;
    state.streak.best = Math.max(state.streak.best, state.streak.count);
  }
  function currentStreak() {
    const t = todayStr(); const y = new Date(); y.setDate(y.getDate() - 1);
    return state.streak.last === t || state.streak.last === todayStr(y) ? state.streak.count : 0;
  }

  /* ---------- الدروس ---------- */
  const allLessons = () => (window.NG_TRACKS || []).flatMap((t) => t.lessons.map((l) => Object.assign({ trackId: t.id }, l)));
  function findLesson(id) {
    for (const t of window.NG_TRACKS || []) {
      const i = t.lessons.findIndex((l) => l.id === id);
      if (i > -1) return { track: t, lesson: t.lessons[i], index: i };
    }
    return null;
  }
  function isUnlocked() { return true; } // كل الدروس مفتوحة من غير أي قفل
  function trackProgress(t) {
    const done = t.lessons.filter((l) => state.completed[l.id]).length;
    return { done, total: t.lessons.length, pct: Math.round((done / t.lessons.length) * 100) };
  }
  function completeLesson(id, hints, solution) {
    const f = findLesson(id); if (!f) return null;
    if (state.completed[id]) return { already: true, xp: 0, badges: [] };
    let xp = f.lesson.xp;
    if (solution) xp = Math.round(xp * 0.4);
    else xp = Math.max(Math.round(xp * 0.5), xp - hints * 10);
    const before = levelOf(state.xp);
    state.xp += xp;
    state.completed[id] = { at: Date.now(), hints, solution: !!solution, xp };
    touchStreak();
    const badges = evalBadges();
    save();
    return { xp, badges, levelUp: levelOf(state.xp) > before ? levelOf(state.xp) : 0 };
  }
  function nextLesson() {
    for (const t of NG_TRACKS) for (let i = 0; i < t.lessons.length; i++) if (!state.completed[t.lessons[i].id] && isUnlocked(t.id, i)) return { track: t, lesson: t.lessons[i], index: i };
    return null;
  }

  /* ---------- الاختبارات ---------- */
  function submitQuiz(trackId, score) {
    const prev = state.quiz[trackId] ? state.quiz[trackId].best : 0;
    const gain = Math.max(0, score - prev) * 10;
    state.quiz[trackId] = { best: Math.max(prev, score), at: Date.now() };
    state.xp += gain; touchStreak();
    const badges = evalBadges(); save();
    return { gain, badges };
  }

  /* ---------- الوقت ---------- */
  function addSeconds(s) {
    const t = todayStr();
    state.activity[t] = (state.activity[t] || 0) + s; save();
  }
  const todayMinutes = () => Math.floor((state.activity[todayStr()] || 0) / 60);
  function weekActivity() {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      out.push({ day: d, key: todayStr(d), min: Math.round((state.activity[todayStr(d)] || 0) / 60) });
    }
    return out;
  }

  /* ---------- أدوات واجهة ---------- */
  function toast(msg, kind) {
    let host = document.getElementById('toasts');
    if (!host) { host = document.createElement('div'); host.id = 'toasts'; document.body.appendChild(host); }
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.textContent = msg; host.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 3200);
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- حماية الأهل: حد الوقت اليومي ---------- */
  function guard() {
    if (!state.profile) return;
    let ticking = 0;
    const tick = () => {
      if (document.hidden) return;
      addSeconds(5); ticking += 5;
      checkLimit();
    };
    setInterval(tick, 5000);
    checkLimit();
  }
  function allowedMin() { return state.parent.limitMin ? state.parent.limitMin + ((state.parent.extra || {})[todayStr()] || 0) : 0; }
  function checkLimit() {
    const lim = allowedMin();
    if (!lim || todayMinutes() < lim || document.getElementById('limitOverlay')) return;
    const o = document.createElement('div');
    o.id = 'limitOverlay'; o.className = 'overlay';
    o.innerHTML = '<div class="modal"><div class="big-emoji">😴</div><h2>انتهى وقت اليوم!</h2>' +
      '<p>لقد تعلّمت ' + todayMinutes() + ' دقيقة اليوم. استرح وعد غداً بإذن الله 🌙</p>' +
      '<details><summary>أنا ولي الأمر</summary><p class="muted">اكتب الرقم السري لإضافة 15 دقيقة.</p>' +
      '<input id="limitPin" type="password" inputmode="numeric" maxlength="4" placeholder="••••" class="input" style="text-align:center;letter-spacing:.4em">' +
      '<button class="btn btn-primary" id="limitOk" style="margin-top:10px">تمديد</button></details>' +
      '<a class="btn btn-ghost" href="index.html" style="margin-top:12px">الرئيسية</a></div>';
    document.body.appendChild(o);
    o.querySelector('#limitOk').onclick = () => {
      if (o.querySelector('#limitPin').value === state.parent.pin) {
        const t = todayStr(); state.parent.extra[t] = (state.parent.extra[t] || 0) + 15; save(); o.remove();
      } else toast('الرقم السري غير صحيح', 'bad');
    };
  }

  /* ---------- كونفيتي ---------- */
  function confetti() {
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d'); const W = (cv.width = innerWidth), H = (cv.height = innerHeight);
    const cols = ['#ff9a1f', '#3b82f6', '#22d3ee', '#a78bfa', '#facc15', '#34d399'];
    const ps = Array.from({ length: 110 }, () => ({ x: Math.random() * W, y: -20 - Math.random() * H * 0.4, r: 4 + Math.random() * 6, c: cols[(Math.random() * cols.length) | 0], vx: -2 + Math.random() * 4, vy: 2 + Math.random() * 4, rot: Math.random() * 6 }));
    let f = 0;
    (function draw() {
      ctx.clearRect(0, 0, W, H);
      ps.forEach((p) => { p.x += p.vx; p.y += p.vy; p.rot += 0.1; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); });
      if (++f < 150) requestAnimationFrame(draw); else cv.remove();
    })();
  }

  /* ---------- السوشيال ميديا (من config.js) ---------- */
  const FB_PATH = 'M13.5 22v-8.2h2.8l.4-3.3h-3.2V8.4c0-.9.3-1.6 1.6-1.6h1.7V3.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.6H7.6v3.3h2.8V22h3.1z';
  const SOCIAL_META = {
    facebook: { label: 'فيسبوك (شخصي)', path: FB_PATH },
    facebookAcademy: { label: 'فيسبوك الأكاديمية', path: FB_PATH },
    youtube: { label: 'يوتيوب', path: 'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3L10 15z' },
    instagram: { label: 'إنستجرام', path: 'M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm5.3-3.3a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z' },
    tiktok: { label: 'تيك توك', path: 'M16.6 3c.3 2.3 1.6 3.7 3.9 3.9v3a7 7 0 0 1-3.8-1.2v6.2a5.9 5.9 0 1 1-5.9-5.9c.3 0 .6 0 .9.1v3.1a2.9 2.9 0 1 0 2 2.7V3h2.9z' },
    linkedin: { label: 'لينكدإن', path: 'M4.9 8.6H2V21h2.9V8.6zM3.5 3a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zM21.9 21v-6.8c0-3.3-1.8-4.9-4.1-4.9-1.9 0-2.7 1-3.2 1.8V8.6h-2.9V21h2.9v-6.9c0-1.8.9-2.7 2.1-2.7 1.2 0 1.9.8 1.9 2.7V21h3.3z' },
    github: { label: 'جيت هاب', path: 'M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2z' },
    whatsapp: { label: 'واتساب', path: 'M12 2a10 10 0 0 0-8.6 15L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.5 1 2.7.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.7 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.4-.3z' },
    telegram: { label: 'تيليجرام', path: 'M21.9 4.1 18.7 19c-.2 1-.9 1.3-1.7.8l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.4-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.6 13 1.9 11.5c-1-.3-1-1 .2-1.5l18.4-7.1c.9-.3 1.6.2 1.4 1.2z' }
  };
  function socialHTML(cls) {
    const s = (window.NG_CONFIG && NG_CONFIG.social) || {};
    const items = Object.keys(SOCIAL_META).filter((k) => s[k]).map((k) =>
      '<a class="social-link ' + (k === 'facebookAcademy' ? 'facebook' : k) + '" href="' + esc(s[k]) + '" target="_blank" rel="noopener noreferrer" aria-label="' + SOCIAL_META[k].label + '" title="' + SOCIAL_META[k].label + '"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="' + SOCIAL_META[k].path + '"/></svg></a>');
    return items.length ? '<div class="social ' + (cls || '') + '">' + items.join('') + '</div>' : '';
  }
  function mountSocial() {
    document.querySelectorAll('[data-social]').forEach((el) => {
      el.innerHTML = socialHTML(el.dataset.social);
      const f = el.closest('.follow'); if (f) f.hidden = !el.innerHTML.trim();
    });
  }
  document.addEventListener('DOMContentLoaded', mountSocial);

  window.NG = {
    get state() { return state; }, save, load, todayStr, levelOf, levelName, XP_PER_LEVEL, BADGES,
    findLesson, isUnlocked, trackProgress, completeLesson, nextLesson, allLessons, submitQuiz,
    todayMinutes, weekActivity, currentStreak, touchStreak, toast, esc, guard, confetti, socialHTML, mountSocial,
    reset() { state = fresh(); save(); }
  };
})();
