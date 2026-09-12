/* Paged.js builds a read-only preview; React's complete source stays intact for sync. */
(function () {
  'use strict';
  const pageStarts = new Set(['toc','overview','methodology','requirements','events',
    'usecase-diagrams','usecase-full','gap-analysis','context-diagram','dfd',
    'dfd-p1','dfd-p2','dfd-p3','dfd-p4','dfd-p5','erd']);

  async function render(source, target, onProgress) {
    if (!window.Paged) throw new Error('The page-layout library did not load. Reload this page.');
    await document.fonts.ready;
    const copy = source.cloneNode(true);
    copy.className = 'a4-document';
    copy.removeAttribute('aria-hidden');
    copy.removeAttribute('inert');
    copy.querySelectorAll('[id]').forEach(node => {
      const id = node.id;
      node.dataset.sectionId = id;
      if (pageStarts.has(id)) node.classList.add('page-start');
      node.removeAttribute('id'); // No duplicate IDs between the source and split pages.
    });
    copy.querySelectorAll('.toc-page').forEach(node => { node.textContent = '–'; });
    copy.querySelectorAll('.doc-footer,.entity-note,.entity-grid,.figure-editor-link,.anchor-link,.zoom-hint').forEach(node => node.remove());
    // Use the checked-in image in the paper preview. The live SVG editor remains
    // in the source, so Google Docs sync still captures its current diagram.
    copy.querySelectorAll('iframe.diagram-embed').forEach(frame => {
      const url = new URL(frame.src, location.href);
      if (!url.pathname.endsWith('/dfd-level1-source.html')) throw new Error('Missing print image for an embedded diagram.');
      const img = document.createElement('img');
      img.src = new URL('dfd-level1-draft.png', url).href;
      img.alt = frame.title;
      frame.replaceWith(img);
    });
    // Flatten layout-only wrappers before fragmentation. Deeply nested sections
    // around a table can make a forced break skip its remaining rows in Paged.js.
    // Keep semantic blocks and put each navigation anchor on its first block.
    function flatten(node) {
      if (node.nodeType !== Node.ELEMENT_NODE) return [];
      if (node.matches('.cover,[data-section-id="toc"],.section-heading,figure,table,p,ul,ol,h1,h2,h3,h4,h5')) return [node];
      const blocks = Array.from(node.children).flatMap(flatten);
      if (node.classList.contains('lede')) blocks.forEach(block => block.classList.add('lede'));
      if (blocks.length && node.dataset.sectionId) {
        blocks[0].dataset.sectionId = node.dataset.sectionId;
        if (node.classList.contains('page-start')) blocks[0].classList.add('page-start');
      }
      return blocks;
    }
    const blocks = Array.from(copy.children).flatMap(flatten);
    copy.replaceChildren(...blocks);
    // Detached lazy images never enter the viewport. Decode them before measuring.
    await Promise.all(Array.from(copy.querySelectorAll('img'), async img => {
      img.loading = 'eager';
      await Promise.race([
        img.decode(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('A diagram took too long to load. Reload to retry.')), 20000))
      ]);
    }));
    const previewer = new Paged.Previewer();
    let preparedPages = 0;
    previewer.on('page', () => onProgress(++preparedPages));
    await previewer.preview(copy, ['assets/doc-paper.css'], target);
    const pages = Array.from(target.querySelectorAll('.pagedjs_page'));
    pages.forEach((page, index) => {
      page.dataset.pageNumber = String(index); // Cover is unnumbered; TOC starts at 1.
      page.setAttribute('aria-label', index ? 'Page ' + index : 'Cover page');
      if (index) {
        const footer = document.createElement('div');
        footer.className = 'a4-page-number';
        footer.textContent = String(index);
        page.appendChild(footer);
      }
    });
    target.querySelectorAll('.toc-row').forEach(link => {
      const section = find(target, link.getAttribute('href').slice(1));
      const page = section && section.closest('.pagedjs_page');
      if (page) link.querySelector('.toc-page').textContent = page.dataset.pageNumber;
    });
    return pages.length;
  }

  function find(target, id) {
    if (!target) return null;
    return target.querySelector('[data-section-id="' + CSS.escape(id) + '"]');
  }
  window.DocumentPages = { render, find };
}());
