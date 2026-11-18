/* لوحة الطالب */
(function () {
  const S = () => NG.state;
  const AVATARS = ['🚀', '🤖', '🦊', '🐱', '🦄', '👾', '🐼', '🦁'];

  /* ---------- Onboarding (المنصة مخصصة لسن 10-12، فموافقة ولي الأمر لازمة دايماً) ---------- */
  function onboarding() {
    const ov = document.getElementById('onboard'); ov.hidden = false;
    const age = document.getElementById('obAge');
    for (let a = 10; a <= 12; a++) age.insertAdjacentHTML('beforeend', '<option value="' + a + '">' + a + ' سنة</option>');
    let avatar = AVATARS[0];
    const av = document.getElementById('obAvatars');
    av.innerHTML = AVATARS.map((a, i) => '<button type="button" class="av' + (i === 0 ? ' on' : '') + '" data-a="' + a + '">' + a + '</button>').join('');
    av.addEventListener('click', (e) => {
      const b = e.target.closest('.av'); if (!b) return;
      av.querySelectorAll('.av').forEach((x) => x.classList.remove('on')); b.classList.add('on'); avatar = b.dataset.a;
    });
    document.getElementById('obConsentRow').hidden = false;
    document.getElementById('obConsent').required = true;
    document.getElementById('onboardForm').addEventListener('submit', (e) => {
      e.preventDefault();
      S().profile = { name: document.getElementById('obName').value.trim(), age: +age.value, avatar, consent: true, since: Date.now() };
      NG.save(); ov.hidden = true; render(); NG.guard();
      NG.toast('أهلاً بك في NextGen Academy! 🎉', 'good');
    });
  }

  /* ---------- Render ---------- */
  function render() {
    const s = S(), p = s.profile; if (!p) return;
    const lv = NG.levelOf(s.xp), inLv = s.xp % NG.XP_PER_LEVEL, pct = Math.round((inLv / NG.XP_PER_LEVEL) * 100);
    const done = Object.keys(s.completed).length, total = NG.allLessons().length;
    document.getElementById('welcome').innerHTML =
      '<div class="av-big">' + p.avatar + '</div>' +
      '<div class="w-main"><h1>أهلاً يا ' + NG.esc(p.name) + ' 👋</h1>' +
      '<div class="lvl"><b>المستوى ' + lv + '</b> · ' + NG.levelName(lv) + '<div class="bar"><i style="width:' + pct + '%"></i></div><small class="muted">' + inLv + ' / ' + NG.XP_PER_LEVEL + ' XP للمستوى التالي</small></div></div>' +
      '<div class="stat-row">' +
      '<div class="stat"><b>⭐ ' + s.xp + '</b><span>نقاط XP</span></div>' +
      '<div class="stat"><b>🔥 ' + NG.currentStreak() + '</b><span>أيام متتالية</span></div>' +
      '<div class="stat"><b>📘 ' + done + '/' + total + '</b><span>دروس</span></div>' +
      '<div class="stat"><b>🏅 ' + Object.keys(s.badges).length + '</b><span>شارات</span></div></div>';

    const nx = NG.nextLesson();
    document.getElementById('continueBox').innerHTML = nx
      ? '<div class="continue" style="--c:' + nx.track.color + '"><div><span class="muted">تابع من حيث توقفت</span><h2>' + nx.lesson.emoji + ' ' + NG.esc(nx.lesson.title) + '</h2><small class="muted">وحدة ' + nx.track.name + ' · الدرس ' + (nx.index + 1) + '</small></div><a class="btn btn-primary btn-lg" href="lesson.html?id=' + nx.lesson.id + '">متابعة ▶</a></div>'
      : '<div class="continue"><div><h2>🎉 أتممت كل الدروس المتاحة! أنت أسطورة حقيقية</h2></div></div>';

    document.getElementById('tracksHost').innerHTML = NG_TRACKS.map((t) => {
      const pr = NG.trackProgress(t), complete = pr.done === pr.total;
      const q = s.quiz[t.id];
      return '<section class="panel track" id="track-' + t.id + '" style="--c:' + t.color + '">' +
        '<div class="track-head"><div class="th-l"><span class="te">' + t.emoji + '</span><div><h2>وحدة ' + t.name + '</h2><small class="muted">' + t.ages + ' · ' + t.tagline + '</small></div></div>' +
        '<div class="th-r"><div class="ring" style="--p:' + pr.pct + '"><b>' + pr.pct + '%</b></div></div></div>' +
        '<div class="lessons">' + t.lessons.map((l, i) => {
          const d = s.completed[l.id], open = NG.isUnlocked(t.id, i);
          const cls = d ? 'done' : open ? 'open' : 'locked';
          const inner = '<span class="ln">' + (d ? '✓' : open ? i + 1 : '🔒') + '</span><span class="lt"><b>' + l.emoji + ' ' + NG.esc(l.title) + '</b><small>' + (d ? '+' + d.xp + ' XP' : l.xp + ' XP') + '</small></span>';
          return open || d ? '<a class="lesson ' + cls + '" href="lesson.html?id=' + l.id + '">' + inner + '</a>' : '<div class="lesson locked" title="أتمم الدرس السابق أولاً">' + inner + '</div>';
        }).join('') + '</div>' +
        '<div class="track-foot">' +
        (NG_QUIZ[t.id] ? '<a class="btn btn-ghost btn-sm" href="quiz.html?track=' + t.id + '">📝 اختبار تدريبي' + (q ? ' (أفضل نتيجة ' + q.best + '/5)' : '') + '</a>' : '<span></span>') +
        (complete ? '<a class="btn btn-primary btn-sm" href="certificate.html?track=' + t.id + '">🎓 شهادتي</a>' : '<span class="muted">أتمم ' + (pr.total - pr.done) + ' دروساً أخرى للحصول على الشهادة</span>') +
        '</div></section>';
    }).join('') +
    (window.NG_ROADMAP && NG_ROADMAP.length ? '<section class="panel roadmap"><h2>🗺️ وحدات جاية قريباً</h2><p class="muted">وحدات إضافية قيد الإعداد، تُبنى بنفس مستوى الجودة والعناية.</p><div class="roadmap-grid">' +
      NG_ROADMAP.map((r) => '<div class="rm-item"><span class="rm-e">' + r.emoji + '</span><b>' + NG.esc(r.name) + '</b><small class="muted">' + NG.esc(r.desc) + '</small><span class="rm-count">' + r.count + ' درس</span></div>').join('') +
      '</div></section>' : '');

    document.getElementById('badges').innerHTML = NG.BADGES.map((b) => {
      const got = s.badges[b.id];
      return '<div class="badge ' + (got ? 'got' : '') + '" title="' + b.desc + '"><span>' + (got ? b.icon : '🔒') + '</span><b>' + b.name + '</b><small>' + b.desc + '</small></div>';
    }).join('');
  }

  if (!S().profile) onboarding(); else { render(); NG.guard(); }
  if (location.hash) setTimeout(() => { const el = document.querySelector(location.hash); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 150);
})();
