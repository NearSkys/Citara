// Edit modal logic — ES module
import { Formatter } from './formatter.js';

document.addEventListener('modal:open', (e) => {
  try {
    if (!e.detail || e.detail.name !== 'edit') return;
    const wrapper = e.detail.modal;
    if (!wrapper) return;

    // find form elements inside injected modal
    const form = wrapper.querySelector('#edit-format-form');
    if (!form) return;

    const authorsInput = form.querySelector('[name="authors"]');
    const titleInput = form.querySelector('[name="title"]');
    const yearInput = form.querySelector('[name="year"]');
    const styleSelect = form.querySelector('[name="style"]');
    const templateArea = form.querySelector('[name="template"]');
    const customWrap = wrapper.querySelector('#custom-template-wrap');
    const preview = wrapper.querySelector('#format-preview');
    const copyBtn = wrapper.querySelector('#copy-formatted');

    function updatePreview() {
      const paper = {
        authors: authorsInput.value || '',
        title: titleInput.value || '',
        year: yearInput.value || ''
      };
      const style = (styleSelect.value || 'abnt').toLowerCase();
      let out = '';
      if (style === 'custom') {
        const tpl = (templateArea && templateArea.value) ? templateArea.value : '{authors} - {title} ({year})';
        out = tpl.replace(/\{authors\}/gi, paper.authors)
                 .replace(/\{title\}/gi, paper.title)
                 .replace(/\{year\}/gi, paper.year);
      } else {
        try {
          out = Formatter.format(paper, style);
        } catch (err) {
          out = '[Formatting error] ' + (err && err.message ? err.message : String(err));
        }
      }
      // sanitize minimal: convert newlines to <br> and insert
      preview.innerHTML = out.replace(/\n/g, '<br>');
    }

    // Show/hide custom template area
    styleSelect.addEventListener('change', (ev) => {
      if (styleSelect.value === 'custom') customWrap.style.display = '';
      else customWrap.style.display = 'none';
      updatePreview();
    });

    // wire inputs
    [authorsInput, titleInput, yearInput, templateArea].forEach(inp => {
      if (!inp) return;
      inp.addEventListener('input', () => updatePreview());
    });

    // copy button
    if (copyBtn) {
      copyBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        const text = preview.textContent || preview.innerText || '';
        try {
          navigator.clipboard.writeText(text).then(() => {
            copyBtn.textContent = 'Copied';
            setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1200);
          }).catch(() => {
            // fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); copyBtn.textContent = 'Copied'; } catch (e) { }
            ta.remove();
            setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1200);
          });
        } catch (err) {
          // older browsers
          console.warn('Copy failed', err);
        }
      });
    }

    // try to prefill from any details panel on the page
    (function prefillFromDetails() {
      try {
        // look for common selectors used in details panels
        const details = document.querySelector('.details-content') || document.getElementById('details-content');
        if (!details) return;
        const h = details.querySelector('h4, h3, .font-bold');
        const p = details.querySelector('p');
        const title = h ? h.textContent.trim() : '';
        const author = p ? p.textContent.trim() : '';
        if (title && titleInput && !titleInput.value) titleInput.value = title;
        if (author && authorsInput && !authorsInput.value) authorsInput.value = author;
        // year: look for label 'Year:' nearby
        const yearLabel = Array.from(details.querySelectorAll('div')).find(d => /Year[:\s]/i.test(d.textContent));
        if (yearLabel) {
          const yr = yearLabel.textContent.replace(/[^0-9]/g, '').trim();
          if (yr && yearInput && !yearInput.value) yearInput.value = yr;
        }
      } catch (e) { }
    })();

    // initial render
    updatePreview();

  } catch (err) {
    console.error('edit-modal:init error', err);
  }
});
