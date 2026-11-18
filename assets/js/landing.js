/* الصفحة الرئيسية: كروت المسارات + جرّب بنفسك + قائمة الموبايل */
(function () {
  const host = document.getElementById('trackCards');
  const first = (t) => t.lessons.slice(0, 4).map((l) => '<li>' + NG.esc(l.title) + '</li>').join('');
  host.innerHTML = NG_TRACKS.map((t) =>
    '<article class="track-card" style="--c:' + t.color + '">' +
    '<div class="track-emoji">' + t.emoji + '</div>' +
    '<span class="age-tag">' + t.ages + '</span>' +
    '<h3>' + t.name + ' <small class="muted" style="font-size:.8rem;direction:ltr;display:inline-block">' + t.en + '</small></h3>' +
    '<p class="muted">' + t.desc + '</p>' +
    '<div class="chips">' + t.langs.map((l) => '<span class="chip">' + l + '</span>').join('') + '</div>' +
    '<ul>' + first(t) + '<li>… و ' + (t.lessons.length - 4) + ' دروس أخرى</li></ul>' +
    '<div class="outcome">🏁 <b>الناتج:</b> ' + t.outcome + '</div>' +
    '<a class="btn btn-primary" style="background:' + t.color + ';box-shadow:none;color:#fff" href="app.html#track-' + t.id + '">ابدأ الوحدة</a>' +
    '</article>').join('');

  const rmHost = document.getElementById('roadmapCards');
  const rmSection = rmHost && rmHost.closest('.roadmap-teaser');
  if (rmHost && window.NG_ROADMAP && NG_ROADMAP.length) {
    rmHost.innerHTML = NG_ROADMAP.map((r) => '<div class="rm-item"><span class="rm-e">' + r.emoji + '</span><b>' + NG.esc(r.name) + '</b><small class="muted">' + NG.esc(r.desc) + '</small><span class="rm-count">' + r.count + ' درس</span></div>').join('');
  } else if (rmSection) {
    rmSection.hidden = true;
  }

  // جرّب بنفسك
  const ta = document.getElementById('tryCode'), fr = document.getElementById('tryOut');
  ta.value = '<h1 id="t">أهلاً أيها المبرمج! 👋</h1>\n<button onclick="change()">اضغط هنا</button>\n\n<style>\n  body { font-family: sans-serif; text-align: center; padding: 30px; background: #fff7e6; }\n  h1 { color: #e8590c; }\n  button { padding: 10px 24px; font-size: 18px; border-radius: 10px; border: 0; background: #2f7bff; color: #fff; cursor: pointer; }\n</style>\n\n<script>\n  function change() {\n    document.getElementById("t").textContent = "رائع! أنت تبرمج الآن 🎉";\n  }\n<\/script>';
  let timer;
  const run = () => { fr.srcdoc = '<!DOCTYPE html><html lang="ar" dir="rtl"><meta charset="UTF-8">' + ta.value; };
  ta.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 350); });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); }
  });
  run();
})();
