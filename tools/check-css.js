(() => {
  // Grab all classes used in DOM
  const used = new Set();
  document.querySelectorAll('[class]').forEach(el => {
    el.classList.forEach(c => used.add(c));
  });

  // Extract classes specifically from main.css
  const defined = new Set();
  Array.from(document.styleSheets).forEach(sheet => {
    if (sheet.href && sheet.href.includes('main.css')) {
      try {
        Array.from(sheet.cssRules || []).forEach(rule => {
          if (rule.selectorText) {
            const matches = rule.selectorText.match(/\.[\w-]+/g);
            if (matches) matches.forEach(m => defined.add(m.slice(1)));
          }
        });
      } catch (e) {}
    }
  });

  const missing = Array.from(used).filter(c => !defined.has(c));
  console.log(`%c Missing in main.css (${missing.length}):`, 'color: #ef4444; font-weight: bold;', missing);
})();
