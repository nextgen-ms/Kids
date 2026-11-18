/* صفحة الدرس: محرر الأكواد (type=code) أو درس نظري + أسئلة فهم (type=quiz) */
(function () {
  const $ = (id) => document.getElementById(id);
  const id = new URLSearchParams(location.search).get('id');
  const found = NG.findLesson(id);
  if (!NG.state.profile) { location.replace('app.html'); return; }
  if (!found) { location.replace('app.html'); return; }
  const { track, lesson, index } = found;
  NG.guard();
  document.title = lesson.title + ' — NextGen Academy';

  const st = NG.state;
  const already = !!st.completed[id];
  const refreshXp = () => ($('xpChip').textContent = '⭐ ' + st.xp + ' XP');

  /* ---------- رأس الصفحة (مشترك بين النوعين) ---------- */
  $('lEmoji').textContent = lesson.emoji;
  $('lEmoji').style.setProperty('--c', track.color);
  $('lMeta').textContent = 'وحدة ' + track.name + ' · الدرس ' + (index + 1) + ' من ' + track.lessons.length + ' · ' + lesson.xp + ' XP';
  $('lTitle').textContent = lesson.title;
  $('crumbs').innerHTML = track.lessons.map((l, i) => '<a class="dot ' + (st.completed[l.id] ? 'done' : '') + (l.id === id ? ' cur' : '') + '" href="lesson.html?id=' + l.id + '" title="' + NG.esc(l.title) + '">' + (i + 1) + '</a>').join('');
  refreshXp();
  if (already) NG.toast('أنهيت هذا الدرس من قبل — يمكنك مراجعته والتدرّب عليه براحتك 👍');

  /* ---------- الروبوت الصوتي: استماع لشرح الدرس فقط (دون الأسئلة) ---------- */
  (function initTTS() {
    const btn = $('ttsBtn');
    if (!btn) return;
    if (!('speechSynthesis' in window)) { btn.hidden = true; return; }
    const synth = window.speechSynthesis;
    function lessonText() {
      const src = (track.type === 'quiz' ? lesson.content : lesson.intro) || '';
      const tmp = document.createElement('div');
      tmp.innerHTML = src;
      return (tmp.textContent || '').replace(/\s+/g, ' ').trim();
    }
    function pickArabicVoice() {
      const voices = synth.getVoices() || [];
      return voices.find((v) => /^ar/i.test(v.lang)) || null;
    }
    function setState(s) {
      btn.dataset.state = s;
      btn.innerHTML = s === 'playing' ? '⏸ إيقاف مؤقت' : s === 'paused' ? '▶ استكمال الاستماع' : '🤖 استمع للدرس';
    }
    setState('idle');
    btn.onclick = () => {
      if (synth.speaking && !synth.paused) { synth.pause(); setState('paused'); return; }
      if (synth.paused) { synth.resume(); setState('playing'); return; }
      const text = lessonText();
      if (!text) { NG.toast('لا يوجد نص لقراءته في هذا الدرس'); return; }
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'ar-SA';
      const v = pickArabicVoice(); if (v) utter.voice = v;
      utter.rate = 0.95;
      utter.onend = () => setState('idle');
      utter.onerror = () => setState('idle');
      synth.cancel();
      synth.speak(utter);
      setState('playing');
    };
    if (synth.onvoiceschanged !== undefined) synth.addEventListener('voiceschanged', () => {});
    window.addEventListener('beforeunload', () => synth.cancel());
    document.addEventListener('visibilitychange', () => { if (document.hidden) synth.cancel(); });
  })();

  function finish(hints, solutionUsed) {
    const r = NG.completeLesson(id, hints || 0, !!solutionUsed);
    refreshXp();
    const nxt = track.lessons[index + 1];
    const ov = $('done'); ov.hidden = false; NG.confetti();
    const badges = (r.badges || []).map((b) => '<div class="new-badge">' + b.icon + ' <b>' + b.name + '</b><small>' + b.desc + '</small></div>').join('');
    ov.innerHTML = '<div class="modal"><div class="big-emoji">🎉</div><h2>' + (r.already ? 'أحسنت مرة أخرى!' : 'أحسنت! أتممت الدرس') + '</h2>' +
      (r.already ? '<p class="muted">هذا الدرس مسجَّل عندك بالفعل.</p>' : '<div class="xp-gain">+' + r.xp + ' XP</div>') +
      (r.levelUp ? '<p class="lvl-up">⚡ ترقّيت للمستوى ' + r.levelUp + ' — ' + NG.levelName(r.levelUp) + '</p>' : '') + badges +
      '<div class="modal-actions">' +
      (nxt ? '<a class="btn btn-primary" href="lesson.html?id=' + nxt.id + '">الدرس التالي ▶</a>' : '<a class="btn btn-primary" href="certificate.html?track=' + track.id + '">🎓 شهادتي</a>') +
      '<button class="btn btn-ghost" id="stay">أكمل هنا</button><a class="btn btn-ghost" href="app.html">لوحتي</a></div></div>';
    $('stay').onclick = () => (ov.hidden = true);
  }

  /* =========================================================
     النوع 1: درس نظري + أسئلة فهم (quiz) — بدون كود خالص
     ========================================================= */
  if (track.type === 'quiz') {
    document.getElementById('ws').dataset.type = 'quiz';
    document.body.classList.add('is-quiz');
    document.getElementById('mTabs').hidden = true;
    const illo = document.createElement('div');
    illo.className = 'l-illustration'; illo.style.setProperty('--c', track.color);
    illo.innerHTML = '<i class="li-shape s1"></i><i class="li-shape s2"></i><i class="li-shape s3"></i><span class="li-emoji">' + lesson.emoji + '</span>';
    $('lIntro').before(illo);
    $('lIntro').innerHTML = lesson.content;
    $('lGoals').parentElement.querySelector('h3').hidden = true;
    $('lGoals').hidden = true;

    const box = document.createElement('div');
    box.className = 'concept-quiz';
    box.innerHTML = '<h3>🧠 تأكد من فهمك</h3><div id="cq"></div>' +
      '<button class="btn btn-primary btn-lg" id="finishBtn" style="width:100%;margin-top:18px">أنهيت الدرس ✅</button>';
    $('paneInfo').appendChild(box);

    const QICON = ['🤔', '🔎', '💡', '⭐'];
    const L = ['أ', 'ب', 'ج', 'د'];
    document.getElementById('cq').innerHTML = lesson.questions.map((q, qi) =>
      '<div class="cq-item" data-qi="' + qi + '"><div class="q-text" style="font-size:1.05rem"><span class="q-ico">' + (QICON[qi % QICON.length]) + '</span>' + NG.esc(q.q) + '</div>' +
      q.o.map((o, oi) => '<button class="opt" data-oi="' + oi + '"><span class="l">' + L[oi] + '</span><bdi>' + NG.esc(o) + '</bdi></button>').join('') +
      '<div class="explain cq-exp" hidden></div></div>').join('');

    document.querySelectorAll('.cq-item').forEach((item) => {
      const qi = +item.dataset.qi, q = lesson.questions[qi];
      item.querySelectorAll('.opt').forEach((btn) => {
        btn.onclick = () => {
          if (btn.disabled) return;
          const oi = +btn.dataset.oi, ok = oi === q.a;
          item.querySelectorAll('.opt').forEach((b, n) => { b.disabled = true; if (n === q.a) b.classList.add('right'); else if (n === oi) b.classList.add('wrong'); });
          const ex = item.querySelector('.cq-exp'); ex.hidden = false;
          ex.innerHTML = (ok ? '✅ <b>صح!</b> ' : '❌ <b>قريب.</b> ') + NG.esc(q.ex);
        };
      });
    });

    $('finishBtn').onclick = () => finish(0, false);
    return; // مفيش محرر أو iframe في الدرس ده
  }

  /* =========================================================
     النوع 2 (الافتراضي): درس كود — محرر + تشغيل + تصحيح تلقائي
     ========================================================= */
  $('lIntro').innerHTML = lesson.intro;
  $('lGoals').innerHTML = lesson.goals.map((g) => '<li>' + g + '</li>').join('');

  const draft = st.drafts[id] || (st.drafts[id] = { code: null, hints: 0 });
  let hints = draft.hints || 0, solutionUsed = false, myCode = null, checking = false;

  /* ---------- المحرر ---------- */
  const ta = $('ta'), hl = $('hl'), gut = $('gutterIn');
  const KW = 'const|let|var|function|return|if|else|for|while|class|new|await|async|try|catch|throw|extends|constructor|this|true|false|null|of|in|super|get|set';
  const RE_BASE = /(<!--[\s\S]*?-->)|(\/\*[\s\S]*?\*\/)|((?<!:)\/\/[^\n]*)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|(<\/?[a-zA-Z][\w-]*)|(\b(?:KW)\b)|(\b\d+(?:\.\d+)?(?:px|em|rem|%|s|ms)?)/g;
  const RE = new RegExp(RE_BASE.source.replace('KW', KW), 'g');
  const eh = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function highlight(src) {
    let out = '', last = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(src))) {
      out += eh(src.slice(last, m.index));
      const cls = m[1] || m[2] || m[3] ? 'c' : m[4] ? 's' : m[5] ? 't' : m[6] ? 'k' : 'n';
      out += '<span class="' + cls + '">' + eh(m[0]) + '</span>';
      last = m.index + m[0].length;
      if (m[0].length === 0) RE.lastIndex++;
    }
    return out + eh(src.slice(last)) + '\n';
  }
  function paint() {
    hl.innerHTML = highlight(ta.value);
    const n = ta.value.split('\n').length;
    if (gut.childElementCount !== n) gut.innerHTML = Array.from({ length: n }, (_, i) => '<div>' + (i + 1) + '</div>').join('');
    syncScroll();
  }
  function syncScroll() {
    hl.style.transform = 'translate(' + -ta.scrollLeft + 'px,' + -ta.scrollTop + 'px)';
    gut.style.transform = 'translateY(' + -ta.scrollTop + 'px)';
  }
  ta.addEventListener('scroll', syncScroll);
  ta.addEventListener('input', () => { paint(); draft.code = ta.value; draft.hints = hints; NG.save(); });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') { e.preventDefault(); ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); }
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
    else if (e.key === 'Enter') {
      const s = ta.selectionStart, before = ta.value.slice(0, s), line = before.slice(before.lastIndexOf('\n') + 1);
      let ind = (line.match(/^\s*/) || [''])[0];
      if (/[{(\[]\s*$/.test(line)) ind += '  ';
      e.preventDefault(); ta.setRangeText('\n' + ind, s, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input'));
    }
  });
  ta.value = draft.code != null ? draft.code : lesson.starter;
  paint();

  /* ---------- التشغيل ---------- */
  const frame = $('frame'), conLines = $('conLines');
  const BOOT = '<script>(function(){var P=window.parent,send=function(k,a){try{P.postMessage({__ng:1,k:k,a:a},"*")}catch(e){}};' +
    '["log","info","warn","error"].forEach(function(k){var o=console[k];console[k]=function(){var a=[].slice.call(arguments).map(function(x){try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}});send(k,a);try{o.apply(console,arguments)}catch(e){}}});' +
    'window.addEventListener("error",function(e){send("error",[e.message+(e.lineno?" (سطر "+e.lineno+")":"")])});' +
    'window.addEventListener("unhandledrejection",function(e){send("error",[String(e.reason&&e.reason.message||e.reason)])});' +
    'window.alert=function(m){send("alert",[String(m)])};window.confirm=function(){return true};window.prompt=function(m,d){return d||""};' +
    'var real=window.localStorage,PFX="sbx:",mine=function(){return Object.keys(real).filter(function(k){return k.indexOf(PFX)===0})};' +
    'var fake={getItem:function(k){return real.getItem(PFX+k)},setItem:function(k,v){real.setItem(PFX+k,String(v))},removeItem:function(k){real.removeItem(PFX+k)},clear:function(){mine().forEach(function(k){real.removeItem(k)})},key:function(i){var m=mine();return m[i]?m[i].slice(PFX.length):null}};' +
    'Object.defineProperty(fake,"length",{get:function(){return mine().length}});' +
    'try{Object.defineProperty(window,"localStorage",{get:function(){return fake},configurable:true})}catch(e){}' +
    '})();<\/script>';
  function build(code) {
    const m = code.match(/<head[^>]*>/i) || code.match(/<html[^>]*>/i);
    if (m) return code.replace(m[0], m[0] + BOOT);
    const d = code.match(/<!doctype[^>]*>/i);
    return d ? code.replace(d[0], d[0] + BOOT) : BOOT + code;
  }
  function logLine(k, text) {
    const d = document.createElement('div'); d.className = 'ln ' + k; d.textContent = (k === 'alert' ? '💬 alert: ' : k === 'error' ? '⛔ ' : k === 'warn' ? '⚠️ ' : '› ') + text;
    conLines.appendChild(d); conLines.parentElement.scrollTop = conLines.parentElement.scrollHeight;
  }
  window.addEventListener('message', (e) => {
    if (e.source !== frame.contentWindow || !e.data || !e.data.__ng) return;
    logLine(e.data.k, e.data.a.join(' '));
    if (e.data.k === 'alert') NG.toast('💬 ' + e.data.a.join(' '));
  });
  $('clearCon').onclick = () => (conLines.innerHTML = '');
  function run() {
    return new Promise((res) => {
      conLines.innerHTML = '';
      let fin = false; const done = () => { if (!fin) { fin = true; res(); } };
      frame.onload = () => setTimeout(done, 350);
      frame.srcdoc = build(ta.value);
      setTimeout(done, 3000);
      NG.touchStreak(); NG.save();
    });
  }
  $('runBtn').onclick = () => { run(); if (window.innerWidth < 980) setPane('out'); };

  /* ---------- التصحيح ---------- */
  function ctx() {
    const doc = frame.contentDocument, win = frame.contentWindow;
    return {
      doc, win, code: ta.value,
      q: (s) => doc.querySelector(s), qa: (s) => Array.from(doc.querySelectorAll(s)),
      css: (s, p) => { const el = doc.querySelector(s); return el ? win.getComputedStyle(el)[p] : ''; },
      click: (s) => { const el = doc.querySelector(s); if (el) el.click(); },
      wait: (ms) => new Promise((r) => setTimeout(r, ms))
    };
  }
  async function check() {
    if (checking) return; checking = true; $('checkBtn').disabled = true;
    try {
      await run();
      let results;
      try { results = await lesson.check(ctx()); }
      catch (err) { results = [['حصل خطأ أثناء التصحيح: ' + err.message, false]]; }
      showChecks(results);
      if (results.every((r) => r[1])) finish(hints, solutionUsed);
      else { NG.toast('قربت! راجع النقاط الحمرا 💪', 'bad'); }
    } finally { checking = false; $('checkBtn').disabled = false; }
  }
  function showChecks(rs) {
    $('checkBox').hidden = false;
    $('checkList').innerHTML = rs.map((r) => '<li class="' + (r[1] ? 'ok' : 'no') + '">' + (r[1] ? '✅' : '❌') + ' ' + NG.esc(r[0]) + '</li>').join('');
    setPane('info'); $('checkBox').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  $('checkBtn').onclick = check;

  /* ---------- التلميحات والحل ---------- */
  function paintHints() {
    $('hintCount').textContent = '(' + hints + '/' + lesson.hints.length + ')';
    $('hintBox').innerHTML = lesson.hints.slice(0, hints).map((h, i) => '<div class="hint"><b>💡 تلميح ' + (i + 1) + ':</b> <span dir="auto">' + NG.esc(h) + '</span></div>').join('');
    $('hintBtn').disabled = hints >= lesson.hints.length;
    $('solBtn').hidden = hints < lesson.hints.length;
  }
  $('hintBtn').onclick = () => { if (hints < lesson.hints.length) { hints++; draft.hints = hints; NG.save(); paintHints(); } };
  $('solBtn').onclick = () => {
    if (solutionUsed && myCode !== null) { ta.value = myCode; myCode = null; $('solBtn').textContent = '👀 الحل'; paint(); return; }
    if (!confirm('متأكد؟ لو شُفت الحل هتاخد نقاط أقل في الدرس ده.')) return;
    myCode = ta.value; solutionUsed = true; ta.value = lesson.solution; $('solBtn').textContent = '↩ رجّع كودي'; paint(); NG.toast('ده الحل — حاول تفهمه وبعدها اضغط «تحقق»');
  };
  $('resetBtn').onclick = () => { if (confirm('ترجّع الكود للبداية؟')) { ta.value = lesson.starter; draft.code = null; paint(); } };
  paintHints();

  /* ---------- تبويبات الموبايل ---------- */
  function setPane(p) {
    if (window.innerWidth >= 980) return;
    $('ws').dataset.pane = p;
    document.querySelectorAll('#mTabs button').forEach((b) => b.classList.toggle('on', b.dataset.p === p));
  }
  $('mTabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setPane(b.dataset.p); });

  run();
  window.__ng = { run, check, ta, paint, lesson, ctx };
})();
