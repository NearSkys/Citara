// Minimal modal loader for pages: open by adding data-modal="name" to any button.
// Expects a file named `<name>_modal.html` at the site root (same folder as pages).
(function () {
  async function loadModalHtml(name) {
    const tryUrls = [`${name}_modal.html`, `${name.replace(/-/g, '_')}_modal.html`];
    let lastErr;
    for (const url of tryUrls) {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (res.ok) return await res.text();
        lastErr = new Error(`Modal not found: ${url} (${res.status})`);
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error('Modal fetch failed');
  }

  function disableBodyScroll() {
    document.documentElement.classList.add('modal-open');
  }
  function enableBodyScroll() {
    document.documentElement.classList.remove('modal-open');
  }

  function attachCloseHandlers(wrapper) {
    const overlay = wrapper.querySelector('.modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', (ev) => {
        if (ev.target === overlay) closeModal(wrapper);
      });
    }

    // Close on elements explicitly marked, or on outline buttons and icon buttons
    wrapper.querySelectorAll('[data-modal-close], .btn-icon, .modal-footer .btn-outline').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(wrapper);
      });
    });
  }

  function closeModal(wrapper) {
    if (!wrapper) return;
    try {
      wrapper.remove();
    } catch (err) {
      // older browsers
      if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
    }
    enableBodyScroll();
    document.dispatchEvent(new CustomEvent('modal:close', { detail: { modal: wrapper } }));
  }

  async function openModal(name) {
    try {
      const existing = document.getElementById('modal-' + name);
      if (existing) return; // already open

      const html = await loadModalHtml(name);
      const wrapper = document.createElement('div');
      wrapper.id = 'modal-' + name;
      wrapper.className = 'injected-modal';
      wrapper.innerHTML = html;
      document.body.appendChild(wrapper);
      disableBodyScroll();
      attachCloseHandlers(wrapper);
      document.dispatchEvent(new CustomEvent('modal:open', { detail: { name, modal: wrapper } }));
      // If modal contains project form, wire up submit handlers
      try {
        const form = wrapper.querySelector('#add-project-form');
        if (form) setupAddProjectForm(wrapper, form);

        const deleteBtn = wrapper.querySelector('#confirm-delete-btn');
        if (deleteBtn) setupDeleteProjectModal(wrapper);
      } catch (e) {
        // noop
      }
    } catch (err) {
      console.error('Failed to open modal', name, err);
    }
  }

  function setupAddProjectForm(wrapper, form) {
    const submitBtn = wrapper.querySelector('#add-project-submit');
    const closeWrapper = () => closeModal(wrapper);

    function parseTags(raw) {
      if (!raw) return [];
      return raw.split(',').map(t => t.trim()).filter(Boolean);
    }

    function addProjectToSidebar({ name, color, tags }) {
      try {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        const firstSection = sidebar.querySelector('.sidebar-section');
        if (!firstSection) return;
        // the projects container is the element right after .sidebar-header inside the first section
        const header = firstSection.querySelector('.sidebar-header');
        let projectsContainer = header ? header.nextElementSibling : null;
        if (!projectsContainer) {
          // fallback: find any container with nav-item in sidebar
          projectsContainer = sidebar.querySelector('a.nav-item')?.parentElement || null;
        }
        if (!projectsContainer) return;

        const a = document.createElement('a');
        a.className = 'nav-item';
        a.href = '#';
        a.style.display = 'flex';
        a.style.justifyContent = 'space-between';
        a.style.alignItems = 'center';

        const span = document.createElement('span');
        span.textContent = name;
        if (color) span.style.color = color;

        const more = document.createElement('span');
        more.className = 'material-symbols-outlined more-icon';
        more.textContent = 'more_horiz';

        a.appendChild(span);
        a.appendChild(more);
        if (tags && tags.length) a.dataset.tags = tags.join(',');

        // insert at top
        projectsContainer.insertBefore(a, projectsContainer.firstChild);
      } catch (err) {
        console.error('Failed to add project to sidebar', err);
      }
    }

    // Single submit handler for create OR edit; bound only once per button
    if (!submitBtn.__bound) {
      submitBtn.__bound = true;
      submitBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        const formData = new FormData(form);
        const name = (formData.get('name') || '').toString().trim();
        const color = (formData.get('color') || '').toString().trim();
        const tags = parseTags((formData.get('tags') || '').toString());
        if (!name) {
          const nameInput = form.querySelector('[name="name"]');
          if (nameInput) nameInput.focus();
          return;
        }

        // If an edit target is set, update it instead of creating a new project
        const edit = window.__projectEditTarget;
        if (edit && edit.element) {
          try {
            const a = edit.element;
            const nameSpan = a.querySelector('span');
            if (nameSpan) {
              nameSpan.textContent = name;
              if (color) nameSpan.style.color = color;
              else nameSpan.style.removeProperty('color');
            }
            if (tags && tags.length) a.dataset.tags = tags.join(',');
            else delete a.dataset.tags;
          } catch (err) {
            console.error('Failed to update project element', err);
          }
          // clear edit target and close
          window.__projectEditTarget = null;
          closeWrapper();
          return;
        }

        // Otherwise create a new project
        addProjectToSidebar({ name, color, tags });
        closeWrapper();
      });
    }

    // If modal opened for editing, prefill fields
    try {
      const edit = window.__projectEditTarget;
      if (edit && edit.element) {
        const a = edit.element;
        const nameSpan = a.querySelector('span');
        const nameVal = nameSpan ? nameSpan.textContent.trim() : '';
        const tagsVal = a.dataset.tags || '';
        const colorVal = (nameSpan && nameSpan.style && nameSpan.style.color) ? nameSpan.style.color : '';

        const nameInput = form.querySelector('[name="name"]');
        const tagsInput = form.querySelector('[name="tags"]');
        const colorInput = form.querySelector('[name="color"]');
        if (nameInput) nameInput.value = nameVal;
        if (tagsInput) tagsInput.value = tagsVal;
        if (colorInput && colorVal) {
          // Try to normalize rgb(...) to hex if needed
          try {
            const hex = rgbToHex(colorVal);
            if (hex) colorInput.value = hex;
            document.getElementById('selected-color-preview').style.backgroundColor = colorInput.value;
          } catch (e) {
            // ignore
          }
        }
        // update modal labels
        const submit = wrapper.querySelector('#add-project-submit');
        if (submit) submit.textContent = 'Save';

        if (edit.focusTags && tagsInput) {
          setTimeout(() => tagsInput.focus(), 50);
        }
      }
    } catch (e) {
      // noop
    }
  }

  // Helper: convert rgb(...) or named color to hex (best-effort)
  function rgbToHex(color) {
    if (!color) return '';
    color = color.trim();
    // If already hex
    if (color[0] === '#') return color;
    // rgb(a)
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (m) {
      const r = parseInt(m[1], 10);
      const g = parseInt(m[2], 10);
      const b = parseInt(m[3], 10);
      return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }
    // Fallback: return empty
    return '';
  }

  // Context menu for project "more" button
  function closeProjectMenu() {
    const existing = document.querySelector('.project-context-menu');
    if (existing) existing.remove();
    // remove any stored doc-click handler
    try {
      if (window.__proj_menu_doc_click) {
        document.removeEventListener('click', window.__proj_menu_doc_click);
        delete window.__proj_menu_doc_click;
      }
    } catch (e) { }
  }

  function showProjectMenu(projectAnchor, triggerEl) {
    closeProjectMenu();
    if (!projectAnchor) return;
    const rect = triggerEl.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'project-context-menu';
    Object.assign(menu.style, {
      position: 'absolute',
      zIndex: 9999,
      minWidth: '12rem',
      background: 'rgb(31, 34, 43)',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
      borderRadius: '8px',
      padding: '4px 0',
      top: (rect.bottom + window.scrollY) + 'px',
      left: (rect.left + window.scrollX) + 'px',
      color: '#e2e8f0',
      fontFamily: 'var(--font-family, sans-serif)'
    });

    // Extract project info
    const nameSpan = projectAnchor.querySelector('span');
    const projectName = nameSpan ? nameSpan.textContent : 'Project';
    const projectColor = nameSpan ? nameSpan.style.color : '';

    // Menu Header with Color Indicator
    const header = document.createElement('div');
    Object.assign(header.style, {
      padding: '8px 12px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      marginBottom: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    });

    if (projectColor) {
      const dot = document.createElement('div');
      Object.assign(dot.style, {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: projectColor,
        flexShrink: 0,
        border: '1px solid rgba(255,255,255,0.2)'
      });
      header.appendChild(dot);
    }

    const title = document.createElement('span');
    title.textContent = projectName;
    Object.assign(title.style, {
      fontWeight: '600',
      fontSize: '0.9rem',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      color: '#f8fafc'
    });
    menu.appendChild(header);

    const items = [
      { label: 'Rename', action: () => { window.__projectEditTarget = { element: projectAnchor, mode: 'rename' }; openModal('add-project'); } },
      { label: 'Edit Project', action: () => { window.__projectEditTarget = { element: projectAnchor, mode: 'edit' }; openModal('add-project'); } },
      { label: 'Tags', action: () => { window.__projectEditTarget = { element: projectAnchor, mode: 'edit', focusTags: true }; openModal('add-project'); } },
      {
        label: 'Delete', action: () => {
          window.__projectToDelete = projectAnchor;
          openModal('delete_project');
        }, danger: true
      }
    ];

    items.forEach(it => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = it.label;
      Object.assign(btn.style, {
        display: 'block',
        width: '100%',
        padding: '8px 12px',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.9rem',
        color: it.danger ? '#ef4444' : '#cbd5e1',
        transition: 'background 0.2s'
      });

      btn.onmouseenter = () => btn.style.background = 'rgba(255,255,255,0.05)';
      btn.onmouseleave = () => btn.style.background = 'transparent';

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        try { it.action(); } catch (err) { console.error(err); }
        closeProjectMenu();
      });
      menu.appendChild(btn);
    });

    // remove on outside click (single-use listener)
    function __proj_menu_doc_click() {
      closeProjectMenu();
    }
    // store handler so it can be removed when the menu is closed programmatically
    window.__proj_menu_doc_click = __proj_menu_doc_click;
    setTimeout(() => document.addEventListener('click', __proj_menu_doc_click), 0);

    document.body.appendChild(menu);
    // ensure within viewport horizontally
    const mRect = menu.getBoundingClientRect();
    if (mRect.right > window.innerWidth) {
      menu.style.left = Math.max(8, window.innerWidth - mRect.width - 8) + 'px';
    }
  }

  // Delegate clicks on sidebar more-icon
  document.addEventListener('click', (e) => {
    const more = e.target.closest('.more-icon');
    if (!more) return;
    e.preventDefault();
    e.stopPropagation();
    const a = more.closest('.nav-item');
    if (!a) return;
    showProjectMenu(a, more);
  });

  // Delegate clicks on any [data-modal] button
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-modal]');
    if (!btn) return;
    const name = btn.getAttribute('data-modal');
    if (!name) return;
    e.preventDefault();
    openModal(name);
  });

  // Expose functions for debugging
  window.__modalLoader = { openModal, closeModal };
})();

/* CSS helper (optional): if you want to prevent background scroll, add this rule to your CSS:
   .modal-open { overflow: hidden; }
*/
