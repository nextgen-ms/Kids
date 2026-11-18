/* اختبارات التدريب */
(function () {
  if (!NG.state.profile) { location.replace('app.html'); return; }
  NG.guard();
  const tid = new URLSearchParams(location.search).get('track');
  const track = NG_TRACKS.find((t) => t.id === tid) || NG_TRACKS[0];
  const Q = NG_QUIZ[track.id];
  document.getElementById('qTitle').textContent = '📝 اختبار تدريبي — وحدة ' + track.name;
  const card = document.getElementById('card');
  let i = 0, score = 0; const marks = [];
  const L = ['أ', 'ب', 'ج', 'د'];

  function prog() { return '<div class="q-prog">' + Q.map((_, k) => '<i class="' + (marks[k] || (k === i ? 'on' : '')) + '"></i>').join('') + '</div>'; }
  function show() {
    const q = Q[i];
    card.innerHTML = prog() + '<small class="muted">سؤال ' + (i + 1) + ' من ' + Q.length + '</small><div class="q-text">' + NG.esc(q.q) + '</div>' +
      q.o.map((o, k) => '<button class="opt" data-k="' + k + '"><span class="l">' + L[k] + '</span><bdi>' + NG.esc(o) + '</bdi></button>').join('') + '<div id="fb"></div>';
    card.querySelectorAll('.opt').forEach((b) => (b.onclick = () => answer(+b.dataset.k)));
  }
  function answer(k) {
    const q = Q[i]; const ok = k === q.a; if (ok) score++;
    marks[i] = ok ? 'ok' : 'bad';
    card.querySelectorAll('.opt').forEach((b, n) => { b.disabled = true; if (n === q.a) b.classList.add('right'); else if (n === k) b.classList.add('wrong'); });
    card.querySelector('.q-prog').outerHTML = prog();
    document.getElementById('fb').innerHTML = '<div class="explain">' + (ok ? '✅ <b>إجابة صحيحة!</b> ' : '❌ <b>إجابة غير دقيقة.</b> ') + NG.esc(q.ex) + '</div>' +
      '<div style="margin-top:14px;text-align:left"><button class="btn btn-primary" id="nx">' + (i + 1 < Q.length ? 'السؤال التالي ◀' : 'عرض النتيجة 🎯') + '</button></div>';
    document.getElementById('nx').onclick = () => { i++; i < Q.length ? show() : end(); };
  }
  function end() {
    const r = NG.submitQuiz(track.id, score);
    if (score === Q.length) NG.confetti();
    const msg = score === Q.length ? 'ممتاز! علامة كاملة 🏆' : score >= 3 ? 'عمل جيد! واصل التدريب 💪' : 'لا بأس، راجع الدروس وحاول مرة أخرى 🌱';
    card.innerHTML = '<div class="center"><div class="score-big">' + score + ' / ' + Q.length + '</div><h2>' + msg + '</h2>' +
      (r.gain ? '<div class="xp-gain">+' + r.gain + ' XP</div>' : '<p class="muted">حاول تحسين نتيجتك للحصول على نقاط أكثر.</p>') +
      r.badges.map((b) => '<div class="new-badge">' + b.icon + ' <b>' + b.name + '</b><small>' + b.desc + '</small></div>').join('') +
      '<div class="modal-actions"><button class="btn btn-primary" onclick="location.reload()">أعد الاختبار</button><a class="btn btn-ghost" href="app.html">لوحتي</a></div></div>';
  }
  show();
})();
