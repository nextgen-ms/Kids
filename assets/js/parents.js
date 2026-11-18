/* لوحة أولياء الأمور — محمية برقم سري، فيها التقدم والتقرير وحد الوقت */
(function () {
  const root = document.getElementById('root'), S = () => NG.state;
  const DAYS = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  let unlocked = false;

  function gate() {
    const has = !!S().parent.pin;
    root.innerHTML = '<div class="panel gate center"><div class="big-emoji">🔐</div><h2>لوحة أولياء الأمور</h2>' +
      '<p class="muted">' + (has ? 'أدخل الرقم السري (4 أرقام).' : 'أنشئ رقماً سرياً من 4 أرقام حتى لا يدخل أحد غيرك إلى هنا.') + '</p>' +
      '<form id="pinForm"><input class="input pin-in" id="pin" type="password" inputmode="numeric" pattern="\\d{4}" maxlength="4" required placeholder="••••" autocomplete="off">' +
      '<button class="btn btn-primary" style="margin-top:14px;width:100%">' + (has ? 'دخول' : 'إنشاء الرقم السري') + '</button></form></div>';
    document.getElementById('pinForm').onsubmit = (e) => {
      e.preventDefault(); const v = document.getElementById('pin').value;
      if (!/^\d{4}$/.test(v)) return NG.toast('أدخل 4 أرقام', 'bad');
      if (!has) { S().parent.pin = v; NG.save(); unlocked = true; NG.toast('تم إنشاء الرقم السري ✅', 'good'); return view(); }
      if (v === S().parent.pin) { unlocked = true; view(); } else NG.toast('الرقم السري غير صحيح', 'bad');
    };
  }

  function view() {
    const s = S(), p = s.profile;
    if (!p) { root.innerHTML = '<div class="panel gate center"><div class="big-emoji">👶</div><h2>لم يسجّل أحد بعد</h2><p class="muted">اطلب من الطالب فتح لوحته والتسجيل أولاً.</p><a class="btn btn-primary" href="app.html">لوحة الطالب</a></div>'; return; }
    const lv = NG.levelOf(s.xp), week = NG.weekActivity(), maxMin = Math.max(30, ...week.map((d) => d.min));
    const total = week.reduce((a, d) => a + d.min, 0), done = Object.keys(s.completed).length;
    const recent = Object.entries(s.completed).sort((a, b) => b[1].at - a[1].at).slice(0, 8).map(([id, c]) => ({ f: NG.findLesson(id), c }));

    root.innerHTML = '<div class="p-wrap">' +
      '<div class="panel"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center"><div><h2 style="margin:0">' + p.avatar + ' تقرير ' + NG.esc(p.name) + ' (' + p.age + ' سنة)</h2><small class="muted">تاريخ التقرير: ' + new Date().toLocaleDateString('ar-EG') + '</small></div>' +
      '<div class="no-print" style="display:flex;gap:8px"><button class="btn btn-ghost btn-sm" onclick="print()">🖨️ طباعة التقرير</button><button class="btn btn-ghost btn-sm" id="lock">🔒 قفل</button></div></div>' +
      '<div class="kpis" style="margin-top:16px"><div class="kpi"><b>' + lv + '</b><span>المستوى (' + NG.levelName(lv) + ')</span></div><div class="kpi"><b>' + s.xp + '</b><span>نقاط XP</span></div><div class="kpi"><b>' + done + '/' + NG.allLessons().length + '</b><span>دروس مكتملة</span></div><div class="kpi"><b>' + NG.currentStreak() + '</b><span>أيام متتالية</span></div></div></div>' +

      '<div class="panel"><h2>⏱️ وقت التعلم آخر 7 أيام <small class="muted">(المجموع ' + total + ' دقيقة)</small></h2><div class="week">' +
      week.map((d, i) => '<div class="d"><b>' + d.min + '</b><i class="' + (i === 6 ? 'today' : '') + '" style="height:' + Math.max(3, Math.round((d.min / maxMin) * 100)) + '%"></i>' + DAYS[d.day.getDay()] + '</div>').join('') + '</div></div>' +

      '<div class="grid2"><div class="panel"><h2>📚 التقدم في المسارات</h2>' +
      NG_TRACKS.map((t) => { const pr = NG.trackProgress(t), q = s.quiz[t.id]; return '<div class="trk-row" style="--c:' + t.color + '"><b>' + t.emoji + ' ' + t.name + '</b><div class="bar"><i style="width:' + pr.pct + '%"></i></div><span>' + pr.done + '/' + pr.total + '</span></div>' + (q ? '<small class="muted">أفضل نتيجة اختبار: ' + q.best + '/5</small>' : ''); }).join('') + '</div>' +

      '<div class="panel"><h2>⚙️ إعدادات الأمان</h2><label class="lbl">حد الوقت اليومي</label><select class="input" id="limit">' +
      [[0, 'بدون حد'], [20, '20 دقيقة'], [30, '30 دقيقة'], [45, '45 دقيقة'], [60, 'ساعة'], [90, 'ساعة ونص']].map(([v, l]) => '<option value="' + v + '"' + (s.parent.limitMin === v ? ' selected' : '') + '>' + l + '</option>').join('') +
      '</select><small class="muted">اليوم: ' + NG.todayMinutes() + ' دقيقة</small>' +
      '<label class="lbl">تغيير الرقم السري</label><div style="display:flex;gap:8px;flex-wrap:wrap"><input class="input" id="newPin" style="flex:1;min-width:120px" maxlength="4" inputmode="numeric" placeholder="4 أرقام"><button class="btn btn-blue btn-sm" id="savePin">حفظ</button></div>' +
      '<p class="muted" style="font-size:.85rem;margin-top:14px">✔ لا توجد أي دردشة أو تواصل مع الغرباء.<br>✔ البيانات مخزّنة على هذا الجهاز فقط.</p></div></div>' +

      '<div class="panel"><h2>🕘 آخر الدروس المكتملة</h2>' + (recent.length ? '<table class="table"><tr><th>الدرس</th><th>المسار</th><th>تلميحات</th><th>XP</th><th>التاريخ</th></tr>' +
      recent.map((r) => '<tr><td>' + NG.esc(r.f.lesson.title) + '</td><td>' + r.f.track.name + '</td><td>' + r.c.hints + (r.c.solution ? ' + حل' : '') + '</td><td>' + r.c.xp + '</td><td>' + new Date(r.c.at).toLocaleDateString('ar-EG') + '</td></tr>').join('') + '</table>' : '<p class="muted">لا توجد دروس مكتملة بعد.</p>') + '</div>' +

      '<div class="panel"><h2>🏅 الشارات (' + Object.keys(s.badges).length + '/' + NG.BADGES.length + ')</h2><div class="badges">' +
      NG.BADGES.map((b) => '<div class="badge ' + (s.badges[b.id] ? 'got' : '') + '"><span>' + (s.badges[b.id] ? b.icon : '🔒') + '</span><b>' + b.name + '</b><small>' + b.desc + '</small></div>').join('') + '</div></div>' +

      '<div class="panel no-print danger" style="border:1px solid"><h2>⚠️ منطقة الخطر</h2><p class="muted">مسح كل تقدم الطالب وبياناته من هذا الجهاز نهائياً.</p><button class="btn btn-ghost btn-sm danger" id="wipe">مسح كل البيانات</button></div></div>';

    document.getElementById('lock').onclick = () => { unlocked = false; gate(); };
    document.getElementById('limit').onchange = (e) => { S().parent.limitMin = +e.target.value; NG.save(); NG.toast('تم حفظ حد الوقت ✅', 'good'); };
    document.getElementById('savePin').onclick = () => {
      const v = document.getElementById('newPin').value; if (!/^\d{4}$/.test(v)) return NG.toast('أدخل 4 أرقام', 'bad');
      S().parent.pin = v; NG.save(); NG.toast('تم تغيير الرقم السري ✅', 'good');
    };
    document.getElementById('wipe').onclick = () => {
      if (confirm('سيتم مسح جميع البيانات نهائياً. هل أنت متأكد؟')) { const pin = S().parent.pin; NG.reset(); NG.state.parent.pin = pin; NG.save(); NG.toast('تم المسح'); view(); }
    };
  }
  gate();
})();
