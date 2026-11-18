/* قائمة الموبايل المشتركة لكل صفحات المنصة */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const b = document.getElementById('burger'), l = document.getElementById('links');
    if (!b || !l) return;
    b.addEventListener('click', () => l.classList.toggle('open'));
    l.addEventListener('click', (e) => { if (e.target.tagName === 'A') l.classList.remove('open'); });
  });
})();
