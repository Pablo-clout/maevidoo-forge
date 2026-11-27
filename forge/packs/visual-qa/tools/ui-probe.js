/*
 * Forge UI probe — a dependency-free script that measures what a screenshot cannot prove.
 *
 * Run it IN THE PAGE (the host browser's "execute JavaScript" tool, or Runtime.evaluate over the
 * DevTools protocol): paste this whole file; its value is a JSON-serialisable report.
 * Run it once per viewport and per state worth judging (empty, filled, after a rejected submit,
 * with the longest valid input). It focuses elements, so run it after the screenshot of that state.
 *
 * It only reads the page (focus and blur aside) and changes nothing in the project.
 * Rules: page-overflow, element-overflow, text-clipped, low-contrast, small-target,
 *        focus-not-visible, state-hidden-by-focus, unlabelled-control, uneven-row,
 *        near-duplicate-spacing, tiny-text, zoom-disabled, dead-control, long-lines,
 *        flat-hierarchy, style-drift, low-contrast-border, squeezed-text, wrapped-label,
 *        cramped-chevron, nav-wraps, table-on-phone, edge-hugging, tight-padding,
 *        tight-line-height, crowded-view, stretched-field, stretched-control, footer-placement,
 *        clipped-by-container, stranded-content, off-scale-spacing (only with a project scale),
 *        misaligned-edge, competing-primary. It also returns `load` (controls, framed boxes, words, filled buttons
 *        on the first screen) for the canon's density budget.
 * Besides findings it returns `typography` and `colours` (what is in use), which /forge-ux-sweep
 * compares with the app's canon (docs/ui-canon.md).
 */
(() => {
  const findings = [];
  const notes = [];
  const seen = new Set();
  // Every rule is one signal of a principle (forge/packs/core/skills/forge-ui-detail/principles.md).
  const PRINCIPLE = {
    'page-overflow': 'fit', 'element-overflow': 'fit', 'text-clipped': 'fit', 'clipped-by-container': 'fit',
    'squeezed-text': 'fit', 'wrapped-label': 'fit', 'table-on-phone': 'fit', 'nav-wraps': 'fit',
    'stretched-field': 'fit', 'stretched-control': 'fit',
    'tight-padding': 'clearance', 'cramped-chevron': 'clearance', 'edge-hugging': 'clearance', 'small-target': 'clearance',
    'uneven-row': 'alignment', 'footer-placement': 'alignment', 'stranded-content': 'alignment', 'misaligned-edge': 'alignment',
    'near-duplicate-spacing': 'rhythm', 'off-scale-spacing': 'rhythm', 'style-drift': 'consistency',
    'low-contrast': 'readability', 'low-contrast-border': 'readability', 'tiny-text': 'readability',
    'long-lines': 'readability', 'tight-line-height': 'readability',
    'flat-hierarchy': 'hierarchy', 'crowded-view': 'hierarchy', 'competing-primary': 'hierarchy',
    'dead-control': 'findability', 'not-findable': 'findability',
    'focus-not-visible': 'access', 'state-hidden-by-focus': 'access', 'unlabelled-control': 'access', 'zoom-disabled': 'access',
  };
  const add = (rule, severity, el, detail) => {
    const target = describe(el);
    const key = `${rule}|${target}`;
    if (seen.has(key)) return;
    seen.add(key);
    findings.push({ rule, principle: PRINCIPLE[rule] ?? 'other', severity, target, detail });
  };

  function describe(el) {
    if (!el || el === document.documentElement) return 'page';
    const id = el.id ? `#${el.id}` : '';
    const cls = typeof el.className === 'string' && el.className.trim()
      ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}` : '';
    const name = el.getAttribute?.('name') ? `[name=${el.getAttribute('name')}]` : '';
    const text = (el.innerText || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 30);
    return `${el.tagName.toLowerCase()}${id}${cls}${name}${text ? ` "${text}"` : ''}`;
  }

  const visible = (el) => {
    if (el.checkVisibility && !el.checkVisibility({ contentVisibilityAuto: true })) return false; // e.g. inside a closed <details>
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0;
  };

  // ---- colour helpers -------------------------------------------------------------------------
  const parse = (c) => {
    const m = String(c).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return { r, g, b, a };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrast = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const over = (top, under) => ({
    r: top.r * top.a + under.r * (1 - top.a),
    g: top.g * top.a + under.g * (1 - top.a),
    b: top.b * top.a + under.b * (1 - top.a),
    a: 1,
  });
  /** Background actually behind an element: walk up, compositing translucent layers over white. */
  const backgroundOf = (el) => {
    const layers = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage !== 'none') return null; // image or gradient: cannot judge
      const c = parse(s.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a === 1) break; }
    }
    return layers.reverse().reduce((under, top) => over(top, under), { r: 255, g: 255, b: 255, a: 1 });
  };
  const colourDistance = (a, b) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);

  // ---- 1. overflow ----------------------------------------------------------------------------
  const vw = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > vw + 1) {
    add('page-overflow', 'High', document.documentElement,
      `page is ${document.documentElement.scrollWidth}px wide in a ${vw}px viewport (scrolls sideways)`);
    for (const el of document.body.querySelectorAll('*')) {
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && r.width <= vw * 3 && !el.querySelector('*') && !el.closest('svg')) {
        add('element-overflow', 'Medium', el, `right edge at ${Math.round(r.right)}px, viewport ${vw}px`);
        if (findings.filter((f) => f.rule === 'element-overflow').length >= 5) break;
      }
    }
  }

  // ---- 2. text: clipped, contrast, size -------------------------------------------------------
  for (const el of document.body.querySelectorAll('*')) {
    if (!visible(el)) continue;
    const hasOwnText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!hasOwnText) continue;
    const s = getComputedStyle(el);
    const srOnly = el.clientWidth <= 2 || el.clientHeight <= 2; // visually hidden on purpose, for screen readers
    if (!srOnly && (s.overflow === 'hidden' || s.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 1) {
      add('text-clipped', 'Medium', el, `content ${el.scrollWidth}px in a ${el.clientWidth}px box`);
    }
    const size = parseFloat(s.fontSize);
    if (size < 12) add('tiny-text', 'Low', el, `font-size ${size}px`);
    const fg = parse(s.color);
    const bg = backgroundOf(el);
    if (fg && bg) {
      const ratio = contrast(over(fg, bg), bg);
      const large = size >= 24 || (size >= 18.66 && Number(s.fontWeight) >= 700);
      const need = large ? 3 : 4.5;
      if (ratio < need) {
        add('low-contrast', ratio < 3 ? 'Medium' : 'Low', el,
          `contrast ${ratio.toFixed(2)}:1, needs ${need}:1 (${s.color} on rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)}))`);
      }
    }
  }

  // ---- 3. interactive controls ----------------------------------------------------------------
  const controls = [...document.querySelectorAll(
    'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [tabindex]:not([tabindex="-1"])',
  )].filter((el) => visible(el) && !el.disabled);

  const edge = (el) => {
    const s = getComputedStyle(el);
    return {
      outlineOn: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0,
      outlineColor: s.outlineColor,
      outlineWidth: parseFloat(s.outlineWidth) || 0,
      outlineOffset: parseFloat(s.outlineOffset) || 0,
      borderColor: s.borderTopColor,
      borderWidth: parseFloat(s.borderTopWidth) || 0,
      boxShadow: s.boxShadow,
      background: s.backgroundColor,
    };
  };
  const signature = (e) => [e.outlineOn, e.outlineColor, e.outlineWidth, e.boxShadow, e.background].join('|');

  // Browsers only paint focus styles in a focused page. In a background tab or an unfocused pane every
  // control would look "not focusable" — a false alarm — so the focus rules are skipped and said so.
  let focusJudgeable = document.hasFocus();
  if (focusJudgeable && controls.length) {
    controls[0].focus({ preventScroll: true });
    focusJudgeable = controls[0].matches(':focus');
    controls[0].blur();
  }
  if (!focusJudgeable) {
    notes.push('focus rules skipped: the page does not have focus (run in a focused tab, or headless with focus emulation — tools/run-ui-probe.mjs does this)');
  }

  const previouslyFocused = document.activeElement;
  for (const el of controls) {
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 24) {
      add('small-target', 'Medium', el, `${Math.round(r.width)}×${Math.round(r.height)}px, minimum 24×24`);
    } else if (vw <= 480) {
      // On a phone: buttons and links should be thumb-sized; a full-width text field is easy to hit
      // even when a little short, so it is only reported when really thin.
      const field = /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !['checkbox', 'radio', 'submit', 'button'].includes(el.type);
      const tooSmall = field ? r.height < 32 : (r.height < 44 || r.width < 44) && el.tagName !== 'A';
      if (tooSmall) add('small-target', 'Low', el, `${Math.round(r.width)}×${Math.round(r.height)}px on a phone-width viewport, ${field ? '32px high minimum for a field' : '44×44 recommended'}`);
    }

    // accessible name
    const labelled = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')
      || (el.labels && el.labels.length) || el.getAttribute('title')
      || ((el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('role') === 'button') && /[\p{L}\p{N}]/u.test(el.innerText))
      || (el.tagName === 'INPUT' && ['submit', 'button', 'reset'].includes(el.type) && el.value);
    if (!labelled) {
      const glyph = (el.innerText || '').trim();
      add('unlabelled-control', 'High', el, glyph
        ? `its only text is "${glyph}" — a symbol or emoji, not a name a screen reader can say (add aria-label)`
        : 'no label, aria-label or text gives this control a name');
    }

    // a field's border is what shows where to type: non-text contrast 3:1 against what is behind it
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !['checkbox', 'radio', 'range', 'color', 'submit', 'button', 'reset'].includes(el.type)) {
      const s = getComputedStyle(el);
      const border = parse(s.borderTopColor);
      const behind = backgroundOf(el.parentElement || el);
      const own = parse(s.backgroundColor);
      const fill = own && own.a > 0 && behind ? over(own, behind) : behind;
      if (border && behind && parseFloat(s.borderTopWidth) > 0) {
        const vsBehind = contrast(over(border, behind), behind);
        const fillStandsOut = fill && contrast(fill, behind) >= 3;
        if (vsBehind < 3 && !fillStandsOut) {
          add('low-contrast-border', 'Low', el, `field border ${vsBehind.toFixed(2)}:1 against the page, needs 3:1 to show where to type (WCAG 1.4.11)`);
        }
      }
    }

    if (!focusJudgeable) continue;

    // focus visibility
    el.blur();
    const rest = edge(el);
    el.focus({ preventScroll: true });
    if (document.activeElement !== el) continue;
    const focused = edge(el);
    const changed = signature(rest) !== signature(focused) || rest.borderColor !== focused.borderColor;
    if (!changed) add('focus-not-visible', 'High', el, 'nothing changes when the control takes keyboard focus');

    // an error/selected/… state must stay visible while the control is focused
    const marked = el.getAttribute('aria-invalid') === 'true' || el.matches('.invalid, .error, .is-invalid, .ng-invalid.ng-touched');
    if (marked) {
      const invalidAttr = el.getAttribute('aria-invalid');
      const cls = el.className;
      el.removeAttribute('aria-invalid');
      if (typeof cls === 'string') el.className = cls.replace(/\b(invalid|error|is-invalid)\b/g, '');
      const plainFocused = edge(el);
      if (invalidAttr !== null) el.setAttribute('aria-invalid', invalidAttr);
      if (typeof cls === 'string') el.className = cls;

      const sameRing = signature(focused) === signature(plainFocused);
      const borderDiffers = focused.borderColor !== plainFocused.borderColor;
      const ringCoversBorder = focused.outlineOn && focused.outlineOffset <= 0 && focused.outlineWidth >= focused.borderWidth;
      const ring = parse(focused.outlineColor);
      const border = parse(focused.borderColor);
      if (sameRing && (!borderDiffers || (ringCoversBorder && ring && border && colourDistance(ring, border) > 60))) {
        const describedBy = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)
          .map((id) => document.getElementById(id)).filter((n) => n && visible(n) && n.innerText.trim());
        const nearbyMessage = describedBy.length > 0
          || [...(el.closest('label, .field, .form-group, div')?.querySelectorAll('.err, .error, [role=alert]') ?? [])]
            .some((n) => visible(n) && n.innerText.trim());
        add('state-hidden-by-focus', nearbyMessage ? 'Low' : 'Medium', el,
          (nearbyMessage ? 'a visible message still names the error, but ' : 'no visible message backs it up, and ') + (borderDiffers
            ? `the error border (${focused.borderColor}) is covered by the focus ring (${focused.outlineColor}, offset ${focused.outlineOffset}px): a focused invalid field looks like a focused valid one`
            : 'a focused invalid field is styled exactly like a focused valid one'));
      }
    }
    el.blur();
  }
  if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus({ preventScroll: true });

  // ---- 4. rows of controls with slightly different heights -----------------------------------
  for (const row of document.querySelectorAll('*')) {
    const s = getComputedStyle(row);
    if (!/flex|grid/.test(s.display) || !visible(row)) continue;
    const kids = [...row.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, button')]
      .filter(visible);
    if (kids.length < 2) continue;
    const sameLine = kids.filter((k) => Math.abs(k.getBoundingClientRect().top - kids[0].getBoundingClientRect().top) < 12);
    const heights = sameLine.map((k) => Math.round(k.getBoundingClientRect().height));
    const spread = Math.max(...heights) - Math.min(...heights);
    if (sameLine.length >= 2 && spread >= 1 && spread <= 8) {
      add('uneven-row', 'Low', row, `controls on one line are ${[...new Set(heights)].join('px / ')}px high`);
    }
  }

  // ---- 5. spacing scale -----------------------------------------------------------------------
  const spacing = new Map();
  for (const el of document.body.querySelectorAll('*')) {
    if (!visible(el)) continue;
    const s = getComputedStyle(el);
    for (const prop of ['rowGap', 'columnGap', 'paddingTop', 'paddingLeft', 'marginTop', 'marginBottom']) {
      const v = Math.round(parseFloat(s[prop]) * 10) / 10;
      if (v > 0 && v <= 64) spacing.set(v, (spacing.get(v) || 0) + 1);
    }
  }
  const values = [...spacing.keys()].sort((a, b) => a - b);
  for (let i = 1; i < values.length; i += 1) {
    const [a, b] = [values[i - 1], values[i]];
    if (b - a > 0 && b - a <= 1 && a >= 4) {
      add('near-duplicate-spacing', 'Low', document.documentElement,
        `${a}px (×${spacing.get(a)}) and ${b}px (×${spacing.get(b)}) are both in use — probably one spacing value written two ways`);
    }
  }

  // Against the project's own scale, when the runner was given one (--scale, from the canon or the
  // design document). No grid is imposed: without a scale this check does not run.
  const scale = Array.isArray(window.__forgeScale) ? window.__forgeScale.filter((n) => Number.isFinite(n)) : null;
  if (scale && scale.length) {
    const off = values.filter((v) => v > 2 && !scale.some((s) => Math.abs(s - v) <= 1))
      .sort((a, b) => spacing.get(b) - spacing.get(a));
    if (off.length) {
      add('off-scale-spacing', 'Low', document.documentElement,
        `${off.slice(0, 6).map((v) => `${v}px (×${spacing.get(v)})`).join(', ')} ${off.length === 1 ? 'is' : 'are'} not on the project's spacing scale (${scale.join(' · ')})`);
    }
  }

  // ---- 6. zoom, dead controls -----------------------------------------------------------------
  const vp = [...document.querySelectorAll('meta[name=viewport]')].pop()?.getAttribute('content') || ''; // the last one wins
  const maxScale = Number(vp.match(/maximum-scale\s*=\s*([\d.]+)/i)?.[1] ?? 10);
  if (/user-scalable\s*=\s*(no|0)/i.test(vp) || maxScale < 2) {
    add('zoom-disabled', 'Medium', document.documentElement, `meta viewport "${vp}" stops people from zooming`);
  }
  for (const el of controls) {
    const href = el.tagName === 'A' ? (el.getAttribute('href') || '').trim() : null;
    if (href === '#' || /^javascript:/i.test(href || '')) {
      add('dead-control', 'Low', el, `link with href="${href}" — check that it does something, and that it should not be a button`);
    }
  }

  // ---- 7. reading: line length, hierarchy ---------------------------------------------------------
  const blocks = [...document.querySelectorAll('p, li, dd, blockquote')]
    .filter((el) => visible(el) && (el.innerText || '').trim().length > 160);
  let longLines = 0;
  for (const el of blocks) {
    const s = getComputedStyle(el);
    const perLine = el.clientWidth / (parseFloat(s.fontSize) * 0.5); // ~0.5em per character on average
    if (perLine > 90 && longLines < 3) { longLines += 1; add('long-lines', 'Low', el, `about ${Math.round(perLine)} characters per line — 45 to 80 reads well`); }
  }
  const textEls = [...document.body.querySelectorAll('*')].filter((el) => visible(el)
    && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  const sizeCount = new Map();
  for (const el of textEls) {
    const size = Math.round(parseFloat(getComputedStyle(el).fontSize) * 2) / 2;
    sizeCount.set(size, (sizeCount.get(size) || 0) + (el.innerText || '').length);
  }
  const body = [...sizeCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const heading = document.querySelector('h1') || document.querySelector('h2');
  if (body && heading && visible(heading)) {
    const hs = getComputedStyle(heading);
    const ratio = parseFloat(hs.fontSize) / body;
    if (ratio < 1.2 && Number(hs.fontWeight) < 600) {
      add('flat-hierarchy', 'Low', heading, `main heading ${hs.fontSize} / weight ${hs.fontWeight} next to ${body}px body text: it does not stand out`);
    }
  }

  // ---- 7b. components squeezed on small screens -------------------------------------------------
  // What people mark first on a phone: a label cut into one word per line, a button whose label
  // wraps, a navigation that breaks onto a second row, a table that needs sideways scrolling or
  // wraps its cells, a select whose chevron touches the edge.
  const lines = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return new Set([...range.getClientRects()].filter((x) => x.width > 1 && x.height > 1).map((x) => Math.round(x.top))).size;
  };
  let squeezed = 0;
  for (const el of textEls) {
    if (squeezed >= 4 || el.closest('table') || el.querySelector('input, select, textarea, button, img, svg')) continue;
    const words = (el.innerText || '').trim().split(/\s+/).filter(Boolean).length;
    if (words < 3 || words > 12) continue;
    const n = lines(el);
    if (n >= 3 && n >= words * 0.75) {
      squeezed += 1;
      add('squeezed-text', 'Medium', el, `${words} words on ${n} lines — about one word per line; the box is too narrow for its label`);
    }
  }
  for (const el of controls) {
    if (!/^(BUTTON|A)$/.test(el.tagName) && el.getAttribute('role') !== 'button') continue;
    const s = getComputedStyle(el);
    const label = (el.innerText || '').trim();
    if (!label || label.length > 40 || s.display === 'block' && el.tagName === 'A' && !el.matches('.btn, [class*=button]')) continue;
    if (lines(el) >= 2) add('wrapped-label', 'Medium', el, `the label "${label.slice(0, 30)}" breaks onto ${lines(el)} lines — keep a control's label on one line`);
  }
  // A chevron needs room from the border AND from the rounded corner: max(16, radius + 6) px.
  // Native selects, styled selects (appearance:none + background arrow) and custom dropdown buttons.
  const chevronRoom = (s) => Math.max(16, (parseFloat(s.borderTopRightRadius) || 0) + 6);
  for (const el of document.querySelectorAll('select')) {
    if (!visible(el)) continue;
    const s = getComputedStyle(el);
    const native = (s.appearance || s.webkitAppearance || 'auto') !== 'none';
    const need = chevronRoom(s);
    let gap = null;
    if (native) gap = parseFloat(s.paddingRight) || 0;
    else if (s.backgroundImage !== 'none') {
      const m = s.backgroundPositionX.match(/right\s+([\d.]+)px|calc\(100% - ([\d.]+)px\)/);
      if (m) gap = parseFloat(m[1] ?? m[2]);
      else if (/^(100%|right)$/.test(s.backgroundPositionX.trim())) gap = 0;
    }
    if (gap !== null && gap < need) {
      add('cramped-chevron', 'Low', el, `the chevron sits ${Math.round(gap)}px from the border of a ${s.borderTopRightRadius} rounded field — it needs ${need}px to clear the corner`);
    }
  }
  for (const el of document.querySelectorAll('[role=combobox], [aria-haspopup="listbox"], [aria-haspopup="menu"], [aria-haspopup="true"], .select, .dropdown, .dropdown-toggle')) {
    if (!visible(el) || el.tagName === 'SELECT' || !(el.innerText || '').trim()) continue; // icon-only buttons centre their icon
    const icons = [...el.querySelectorAll('svg, img, i, .icon, .chevron, .caret')].filter(visible);
    const icon = icons[icons.length - 1];
    if (!icon) continue;
    const s = getComputedStyle(el);
    const gap = el.getBoundingClientRect().right - (parseFloat(s.borderRightWidth) || 0) - icon.getBoundingClientRect().right;
    const need = Math.max(12, (parseFloat(s.borderTopRightRadius) || 0) + 4);
    if (gap < need) add('cramped-chevron', 'Low', el, `the dropdown's icon sits ${Math.round(gap)}px from the border — it needs ${need}px to clear the corner`);
  }

  // ---- 7e. footer, clipped content, content stranded away from the navigation ----------------------
  const screenH = document.documentElement.clientHeight;
  const footer = [...document.querySelectorAll('footer, [role=contentinfo]')].filter(visible).pop();
  const main = document.querySelector('main, [role=main]');
  if (footer) {
    const fr = footer.getBoundingClientRect();
    const short = document.documentElement.scrollHeight <= screenH + 1;
    if (short && screenH - fr.bottom > 24) {
      add('footer-placement', 'Low', footer, `on a short page the footer floats ${Math.round(screenH - fr.bottom)}px above the bottom of the screen, right after the content — anchor it to the bottom`);
    }
    if (main && visible(main)) {
      const range = document.createRange();
      range.selectNodeContents(footer);
      const textLeft = range.getBoundingClientRect().left;
      const firstText = textEls.find((e) => main.contains(e));
      const mainLeft = firstText ? firstText.getBoundingClientRect().left : main.getBoundingClientRect().left;
      if (Math.abs(textLeft - mainLeft) > 8 && fr.width < vw - 2 || Math.abs(textLeft - mainLeft) > 8 && !footer.contains(main) && fr.left < main.getBoundingClientRect().left - 8) {
        add('footer-placement', 'Low', footer, `the footer's text starts at ${Math.round(textLeft)}px while the content starts at ${Math.round(mainLeft)}px — align it with the content column`);
      }
    }
  }
  let clippedBy = 0;
  for (const el of [...document.querySelectorAll('table, img, video, canvas'), ...controls, ...textEls]) {
    if (clippedBy >= 3 || !visible(el)) continue;
    const r = el.getBoundingClientRect();
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (/(auto|scroll)/.test(s.overflowX)) break; // a scroller shows the rest on scroll
      if (/(hidden|clip)/.test(s.overflowX)) {
        const pr = n.getBoundingClientRect();
        if (r.right > pr.right + 2 && r.left < pr.right) {
          clippedBy += 1;
          add('clipped-by-container', 'Medium', el, `${Math.round(r.right - pr.right)}px of it is cut off by its container (overflow hidden) — the user cannot reach it`);
        }
        break;
      }
    }
  }
  if (vw >= 1440 && main && visible(main)) {
    const side = [...document.querySelectorAll('nav, aside, [role=navigation]')].filter(visible)
      .find((n) => { const r = n.getBoundingClientRect(); return r.left < 40 && r.height > screenH * 0.6 && r.width < vw / 3; });
    if (side) {
      const contentLeft = Math.min(...[...main.children].filter(visible).map((c) => c.getBoundingClientRect().left));
      const gap = contentLeft - side.getBoundingClientRect().right;
      if (gap > 160) add('stranded-content', 'Low', main, `on a ${vw}px screen the content starts ${Math.round(gap)}px away from the navigation — keep it beside the navigation and cap its width instead of centring it`);
    }
  }
  if (vw <= 600) {
    for (const nav of document.querySelectorAll('nav, [role=navigation]')) {
      if (!visible(nav)) continue;
      const links = [...nav.querySelectorAll('a, button')].filter(visible);
      const tops = links.map((l) => Math.round(l.getBoundingClientRect().top));
      const rows = new Set(tops).size;
      const sideBySide = tops.length - rows > 0;
      if (links.length >= 3 && sideBySide && rows >= 2) {
        add('nav-wraps', 'Medium', nav, `the navigation breaks onto ${rows} rows on a ${vw}px screen — use one horizontally scrollable row, or a menu`);
      }
    }
  }
  if (vw <= 480) {
    for (const table of document.querySelectorAll('table')) {
      if (!visible(table)) continue;
      const r = table.getBoundingClientRect();
      let box = table.parentElement;
      while (box && box !== document.body && getComputedStyle(box).overflowX === 'visible') box = box.parentElement;
      const room = Math.min(vw, box && box !== document.body ? box.clientWidth : vw);
      const tallCell = [...table.querySelectorAll('td')].find((td) => visible(td) && lines(td) >= 3);
      if (r.width > room + 1) {
        add('table-on-phone', 'Medium', table, `the table is ${Math.round(r.width)}px wide on a ${vw}px screen and must be scrolled sideways — show one stacked card per row on the phone`);
      } else if (tallCell) {
        add('table-on-phone', 'Medium', tallCell, `a cell wraps onto ${lines(tallCell)} lines on a ${vw}px screen: the columns are too narrow — show one stacked card per row on the phone`);
      }
    }
  }

  // ---- 7b2. stretched on wide screens ---------------------------------------------------------------
  if (vw >= 1024) {
    let stretched = 0;
    for (const el of controls) {
      if (stretched >= 3) break;
      const r = el.getBoundingClientRect();
      const field = /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !['checkbox', 'radio', 'range'].includes(el.type);
      if (field && r.width > 720 && !el.closest('table')) {
        stretched += 1;
        add('stretched-field', 'Low', el, `a ${Math.round(r.width)}px wide field on a ${vw}px screen — cap forms at about 640px; a field this wide is hard to scan`);
      } else if (!field && /^(BUTTON)$/.test(el.tagName) && r.width > 480) {
        stretched += 1;
        add('stretched-control', 'Low', el, `a ${Math.round(r.width)}px wide button on a ${vw}px screen — full width suits a phone, not a desktop`);
      }
    }
  }

  // ---- 7c. breathing room: page gutter, padding inside boxes, line height ----------------------------
  const vh = document.documentElement.clientHeight;
  if (vw <= 480 && document.documentElement.scrollWidth <= vw + 1) { // an overflowing page is already page-overflow
    let hugging = 0;
    for (const el of [...textEls, ...controls]) {
      if (hugging >= 3) break;
      const r = el.getBoundingClientRect();
      if (r.width >= vw - 2 || r.bottom < 0) continue; // full-bleed bands are fine
      let scroller = false; // items of a sideways-scrolling row are meant to run past the edge
      for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
        if (/(auto|scroll)/.test(getComputedStyle(n).overflowX)) { scroller = true; break; }
      }
      if (scroller) continue;
      if (r.left < 12 || r.right > vw - 12) {
        hugging += 1;
        add('edge-hugging', 'Medium', el, `${r.left < 12 ? `${Math.round(r.left)}px from the left` : `${Math.round(vw - r.right)}px from the right`} edge of the screen — keep a 16px gutter on the phone`);
      }
    }
  }
  let tight = 0;
  for (const el of textEls) {
    if (tight >= 4) break;
    const s = getComputedStyle(el);
    const boxed = parseFloat(s.borderLeftWidth) > 0 || (parse(s.backgroundColor)?.a ?? 0) > 0.05;
    if (!boxed || /^(INPUT|SELECT|TEXTAREA|TD|TH|HTML|BODY)$/.test(el.tagName)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 16) continue;
    const range = document.createRange();
    range.selectNodeContents(el);
    const tr = range.getBoundingClientRect();
    if (tr.width <= 0) continue;
    // Thresholds of the anatomy cards: 8px on the sides and 4px above and below for a button, card or
    // tile; a badge (small, a word or two) may go down to 6px and 2px.
    const badge = r.height <= 32 && (el.innerText || '').trim().length <= 24;
    const side = Math.min(tr.left - r.left, r.right - tr.right);
    const vertical = Math.min(tr.top - r.top, r.bottom - tr.bottom);
    const needSide = badge ? 6 : 8;
    const needVertical = badge ? 2 : 4;
    if (side < needSide - 0.5 || vertical < needVertical - 0.5) {
      tight += 1;
      add('tight-padding', 'Low', el, side < needSide - 0.5
        ? `text sits ${Math.max(0, Math.round(side))}px from the side of its box — ${needSide}px at least for a ${badge ? 'badge' : 'button, card or tile'}`
        : `text sits ${Math.max(0, Math.round(vertical))}px from the top or bottom of its box — ${needVertical}px at least`);
    }
  }
  let tightLines = 0;
  for (const el of document.querySelectorAll('p, li, dd, blockquote')) {
    if (tightLines >= 2 || !visible(el) || lines(el) < 2) continue;
    const s = getComputedStyle(el);
    const lh = s.lineHeight === 'normal' ? 1.2 * parseFloat(s.fontSize) : parseFloat(s.lineHeight);
    if (lh / parseFloat(s.fontSize) < 1.35) {
      tightLines += 1;
      add('tight-line-height', 'Low', el, `line height ${(lh / parseFloat(s.fontSize)).toFixed(2)} on running text — 1.4 to 1.6 reads well`);
    }
  }

  // ---- 7d. load: how much the first screen asks of the eye -----------------------------------------
  // Measured, not judged: the reviewer compares these numbers with the canon's budget for the screen,
  // and with the last run, so "it got busier" is a number.
  const aboveFold = (el) => { const r = el.getBoundingClientRect(); return r.top < vh && r.bottom > 0; };
  const boxes = [...document.body.querySelectorAll('*')].filter((el) => {
    if (!visible(el) || !aboveFold(el)) return false;
    const s = getComputedStyle(el);
    return parseFloat(s.borderTopWidth) > 0 || s.boxShadow !== 'none';
  }).length;
  const words = textEls.filter(aboveFold).reduce((n, el) => n + [...el.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent.trim().split(/\s+/).filter(Boolean).length).reduce((a, b) => a + b, 0), 0);
  const load = {
    controls: controls.filter(aboveFold).length,
    boxes,
    words,
    accents: controls.filter((el) => aboveFold(el) && /btn|button/i.test(el.className) && (parse(getComputedStyle(el).backgroundColor)?.a ?? 0) > 0.5 && colourDistance(parse(getComputedStyle(el).backgroundColor), { r: 255, g: 255, b: 255 }) > 120).length,
  };
  const budget = vw <= 480 ? { controls: 14, boxes: 16 } : { controls: 30, boxes: 30 };
  if (load.controls > budget.controls || load.boxes > budget.boxes) {
    add('crowded-view', 'Low', document.documentElement, `the first screen holds ${load.controls} controls and ${load.boxes} framed boxes (default budget ${budget.controls} / ${budget.boxes} at this width) — check what the job needs, and compare with the canon's budget`);
  }

  // ---- 7f. stacked siblings that do not share a left edge -------------------------------------------
  // Fields of a form, rows of a list, blocks of a section: when at least two thirds start on the same
  // line, one that starts 2 to 24px away is misaligned (further away is an indent or a centred block).
  let misaligned = 0;
  for (const parent of document.body.querySelectorAll('*')) {
    if (misaligned >= 3) break;
    const kids = [...parent.children].filter((k) => visible(k) && !['absolute', 'fixed'].includes(getComputedStyle(k).position)
      && !/^(SCRIPT|STYLE|BR|TD|TH|TR|OPTION)$/.test(k.tagName));
    if (kids.length < 3) continue;
    const rects = kids.map((k) => k.getBoundingClientRect());
    const stacked = rects.every((r, i) => i === 0 || r.top >= rects[i - 1].bottom - 1);
    if (!stacked) continue;
    const pr = parent.getBoundingClientRect();
    const counts = new Map();
    rects.forEach((r) => counts.set(Math.round(r.left), (counts.get(Math.round(r.left)) || 0) + 1));
    const [norm, share] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (share / kids.length < 2 / 3) continue;
    const odd = kids.findIndex((k, i) => {
      const d = Math.abs(rects[i].left - norm);
      const centred = Math.abs((rects[i].left - pr.left) - (pr.right - rects[i].right)) <= 2;
      return d >= 2 && d <= 24 && !centred;
    });
    if (odd !== -1) {
      misaligned += 1;
      add('misaligned-edge', 'Low', kids[odd], `starts at ${Math.round(rects[odd].left)}px where ${share} of its ${kids.length} stacked siblings start at ${norm}px`);
    }
  }

  // ---- 7g. more than one primary action in view -----------------------------------------------------
  // A filled button in a strong colour is the screen's primary action. Two of them outside repeated
  // rows compete. Buttons repeated on each row of a list or table are one action, shown several times.
  const pageBg = backgroundOf(document.body) || { r: 255, g: 255, b: 255, a: 1 };
  const openDialog = [...document.querySelectorAll('dialog[open], [role=dialog], [role=alertdialog]')].filter(visible).pop();
  const filled = controls.filter((el) => {
    if (!aboveFold(el) || !(el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' || (el.tagName === 'A' && /btn|button/i.test(el.className)) || (el.tagName === 'INPUT' && el.type === 'submit'))) return false;
    if (openDialog ? !openDialog.contains(el) : false) return false;
    const bg = parse(getComputedStyle(el).backgroundColor);
    if (!bg || bg.a < 0.5 || contrast(over(bg, pageBg), pageBg) < 3) return false;
    return /[\p{L}\p{N}]/u.test(el.innerText || el.value || '');
  });
  const single = filled.filter((el) => !el.closest('tr, li, [role=row], [role=listitem]'));
  if (single.length >= 2) {
    add('competing-primary', 'Low', single[1], `${single.length} filled buttons share the view (${single.slice(0, 4).map((el) => `"${(el.innerText || el.value || '').trim().slice(0, 20)}"`).join(', ')}) — one primary action per view; make the others secondary`);
  }
  // Where the primary action sits on a phone: a number for the reviewer (thumb reach), not a verdict.
  load.primaryAction = filled.length ? (() => {
    const el = single[0] || filled[0];
    const r = el.getBoundingClientRect();
    return { name: (el.innerText || el.value || '').trim().slice(0, 30), fromTop: Math.round(((r.top + r.height / 2) / vh) * 100), filledInView: filled.length, outsideRows: single.length };
  })() : null;

  // ---- 8. style drift among repeated siblings ------------------------------------------------------
  // Siblings that share tag and classes are meant to look alike. A property held by at least two thirds
  // of them is the group's own norm; a sibling off it by more than the tolerance is reported. No grid
  // and no threshold is imposed from outside: the page is compared with itself.
  const drift = [['paddingTop', 4], ['paddingLeft', 4], ['fontSize', 1], ['borderTopLeftRadius', 2], ['height', 4]];
  let drifts = 0;
  for (const parent of document.body.querySelectorAll('*')) {
    if (drifts >= 5) break;
    const groups = new Map();
    for (const kid of parent.children) {
      if (!visible(kid)) continue;
      const key = `${kid.tagName}.${typeof kid.className === 'string' ? kid.className.trim().split(/\s+/).sort().join('.') : ''}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(kid);
    }
    for (const kids of groups.values()) {
      if (kids.length < 3) continue;
      for (const [prop, tolerance] of drift) {
        const values = kids.map((k) => (prop === 'height' ? k.getBoundingClientRect().height : parseFloat(getComputedStyle(k)[prop])) || 0);
        const counts = new Map();
        values.forEach((v) => counts.set(Math.round(v), (counts.get(Math.round(v)) || 0) + 1));
        const [norm, share] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
        if (share / kids.length < 2 / 3) continue;
        const odd = kids.findIndex((k, i) => Math.abs(values[i] - norm) > tolerance);
        if (odd !== -1 && (prop !== 'height' || /^(BUTTON|A|INPUT|SELECT|LI)$/.test(kids[odd].tagName))) {
          drifts += 1;
          add('style-drift', 'Low', kids[odd], `${prop} ${Math.round(values[odd])}px where ${share} of its ${kids.length} look-alike siblings have ${norm}px`);
          break;
        }
      }
    }
  }

  // ---- 9. what is in use (compared with docs/ui-canon.md by the reviewer) --------------------------
  const families = new Set();
  const weights = new Set();
  const colours = new Map();
  for (const el of textEls) {
    const s = getComputedStyle(el);
    families.add(s.fontFamily.split(',')[0].trim().replace(/["']/g, ''));
    weights.add(s.fontWeight);
    colours.set(s.color, (colours.get(s.color) || 0) + 1);
  }

  // ---- 10. inventory: every component on screen, typed, for the detail review --------------------
  // forge/packs/visual-qa/tools/run-ui-detail.mjs crops each one at 2x and groups them by type, so a
  // reviewer looks at every select side by side, every card side by side — detail is seen by contrast.
  const typeOf = (el) => {
    const tag = el.tagName;
    const role = el.getAttribute('role');
    if (tag === 'SELECT') return 'select';
    if (el.matches('[aria-haspopup]:not([aria-haspopup=false]), [role=combobox], .dropdown, .dropdown-toggle') && /[\p{L}]/u.test(el.innerText || '')) return 'dropdown';
    if (/^(INPUT|TEXTAREA)$/.test(tag) && !['submit', 'button', 'reset', 'hidden'].includes(el.type)) return ['checkbox', 'radio'].includes(el.type) ? 'choice' : 'field';
    if (tag === 'BUTTON' || role === 'button' || (tag === 'INPUT' && ['submit', 'button', 'reset'].includes(el.type))) {
      return /[\p{L}\p{N}]/u.test(el.innerText || el.value || '') ? 'button' : 'icon-button';
    }
    if (tag === 'NAV' || role === 'navigation') return 'navigation';
    if (tag === 'HEADER' || role === 'banner') return 'header';
    if (tag === 'FOOTER' || role === 'contentinfo') return 'footer';
    if (tag === 'TABLE' || role === 'table' || role === 'grid') return 'table';
    if (tag === 'DIALOG' || role === 'dialog' || role === 'alertdialog') return 'dialog';
    if (role === 'status' || role === 'alert') return 'message';
    if (tag === 'A' && el.closest('nav, [role=navigation]')) return 'nav-item';
    if (tag === 'A') {
      const s = getComputedStyle(el);
      return parseFloat(s.borderTopWidth) > 0 || (parse(s.backgroundColor)?.a ?? 0) > 0.05 ? 'button' : null;
    }
    const s = getComputedStyle(el);
    const framed = parseFloat(s.borderTopWidth) > 0 || s.boxShadow !== 'none' || ((parse(s.backgroundColor)?.a ?? 0) > 0.05 && parseFloat(s.borderTopLeftRadius) > 0);
    if (!framed || !(el.innerText || '').trim()) return null;
    const r = el.getBoundingClientRect();
    if (r.height <= 32 && (el.innerText || '').trim().length <= 24) return 'badge';
    if (r.width >= 64 && r.height >= 40) return 'card';
    return null;
  };
  const components = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (components.length >= 160 || !visible(el)) continue;
    const type = typeOf(el);
    if (!type) continue;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    components.push({
      type,
      name: describe(el),
      box: { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) },
      radius: parseFloat(s.borderTopLeftRadius) || 0,
      padding: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].map((v) => Math.round(parseFloat(v) || 0)),
      font: `${s.fontSize} ${s.fontWeight}`,
    });
  }

  const order = { High: 0, Medium: 1, Low: 2 };
  findings.sort((x, y) => order[x.severity] - order[y.severity]);
  return {
    probe: 'forge-ui-probe/2',
    url: location.href,
    viewport: { width: vw, height: document.documentElement.clientHeight },
    controls: controls.length,
    spacingValues: values,
    load,
    components,
    typography: {
      sizes: [...sizeCount.keys()].sort((a, b) => a - b),
      bodySize: body ?? null,
      families: [...families],
      weights: [...weights].sort(),
    },
    colours: { text: colours.size, values: [...colours.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([c]) => c) },
    // What was actually checked, so "no finding" can be told from "not looked at".
    checks: {
      pageOverflow: { ok: document.documentElement.scrollWidth <= vw + 1, scrollWidth: document.documentElement.scrollWidth, viewport: vw },
      controls: controls.length,
      focusJudged: focusJudgeable,
      invalidControls: controls.filter((el) => el.getAttribute('aria-invalid') === 'true' || el.matches('.invalid, .error, .is-invalid')).length,
    },
    notes,
    findings,
  };
})();
