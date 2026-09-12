/* One-way sync to the user's authorized Apps Script deployment.
   Text and PNG bytes travel in a top-level form POST, without public image uploads. */
(() => {
  'use strict';
  const DOCUMENT_ID = '11Q2UAiRIxcR_Pc5mb4ieqBvsA-t9Stb759jTH2tizEM';
  const DOCUMENT_URL = `https://docs.google.com/document/d/${DOCUMENT_ID}/edit`;
  const SECTIONS = [
    ['overview', 'Project Overview'], ['methodology', 'Methodology'],
    ['backlog', 'Product Backlog'], ['events', 'Event Tables'],
    ['usecase-diagrams', 'Use Case Diagrams'], ['usecase-full', 'Use Case Full Description'],
    ['gap-analysis', 'Gap Analysis'], ['context-diagram', 'Context Diagram'],
    ['dfd', 'Data Flow Diagrams (Levels 1 and 2)'], ['erd', 'Entity-Relationship Diagram']
  ];
  let dialog;
  let busy = false;
  const richTextOf = element => {
    const copy = element.cloneNode(true);
    const styles = new WeakMap();
    const originals = [element, ...element.querySelectorAll('*')];
    [copy, ...copy.querySelectorAll('*')].forEach((node, i) => {
      const style = getComputedStyle(originals[i]);
      styles.set(node, { bold: style.fontWeight === 'bold' || Number(style.fontWeight) >= 600,
        italic: style.fontStyle === 'italic' || style.fontStyle === 'oblique' });
    });
    copy.querySelectorAll('.anchor-link,.figure-editor-link,.zoom-hint').forEach(node => node.remove());
    copy.querySelectorAll('br').forEach(node => node.replaceWith('\n'));
    copy.querySelectorAll('li').forEach(node => {
      const prefix = node.parentElement.tagName === 'OL'
        ? `${Array.from(node.parentElement.children).indexOf(node)+1}. ` : '• ';
      node.prepend(prefix); node.append('\n');
    });
    copy.querySelectorAll('.uc-table-no').forEach(node => node.append(' '));
    const segments = [];
    function visit(node) {
      if (node.nodeType === 3) segments.push({ text:node.textContent, ...styles.get(node.parentElement) });
      else for (const child of node.childNodes) visit(child);
    }
    visit(copy);
    return normalizeRichText(segments);
  };
  const textOf = element => richTextOf(element).text;

  // Keep UTF-16 offsets in step with whitespace cleanup (also for emoji).
  function normalizeRichText(segments) {
    let units = [];
    for (const segment of segments) {
      for (let i=0; i<segment.text.length; i++) units.push({ char:segment.text[i], bold:!!segment.bold, italic:!!segment.italic });
    }
    function replace(pattern, replacement) {
      const raw = units.map(unit => unit.char).join(''), result = [];
      let cursor = 0;
      for (const match of raw.matchAll(pattern)) {
        result.push(...units.slice(cursor, match.index));
        result.push({ ...units[match.index], char:replacement });
        cursor = match.index + match[0].length;
      }
      units = result.concat(units.slice(cursor));
    }
    replace(/[\t ]+/g, ' ');
    replace(/ *\n */g, '\n');
    const raw = units.map(unit => unit.char).join('');
    const start = raw.length - raw.trimStart().length;
    const text = raw.trim();
    units = units.slice(start, start + text.length);
    const runs = [];
    units.forEach((unit, i) => {
      const previous = runs[runs.length-1];
      if (previous && previous.bold === unit.bold && previous.italic === unit.italic) previous.end = i+1;
      else runs.push({ start:i, end:i+1, bold:unit.bold, italic:unit.italic });
    });
    return { text, runs };
  }

  async function pngBlock(image, caption) {
    const url = new URL(image.currentSrc || image.src, location.href);
    if (url.origin !== location.origin) throw new Error('Only local documentation images can be synced.');
    const response = await fetch(url.href, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Cannot read diagram image: ${url.pathname}`);
    const blob = await response.blob();
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (![137,80,78,71,13,10,26,10].every((value,i) => bytes[i] === value)) {
      throw new Error(`Expected a PNG image: ${url.pathname}`);
    }
    const bitmap = await createImageBitmap(blob);
    const block = { kind: 'image', data: await asBase64(blob), width: bitmap.width, height: bitmap.height, caption };
    bitmap.close();
    return block;
  }

  function asBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = () => reject(new Error('Could not encode a diagram image.'));
      reader.readAsDataURL(blob);
    });
  }

  async function iframePng(frame, caption) {
    const url = new URL(frame.src, location.href);
    if (url.origin !== location.origin) throw new Error('The embedded diagram must be on the same site.');
    frame.loading = 'eager';
    const start = Date.now();
    let svg;
    while (Date.now() - start < 15000) {
      svg = frame.contentDocument?.querySelector('#stage svg, svg');
      if (svg && frame.contentDocument.readyState === 'complete') break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!svg) throw new Error('Level 1 has not loaded. Open its section, then retry.');
    await frame.contentDocument.fonts.ready;
    const clone = svg.cloneNode(true);
    const originals = [svg, ...svg.querySelectorAll('*')];
    const copies = [clone, ...clone.querySelectorAll('*')];
    const props = ['fill','fill-opacity','stroke','stroke-width','stroke-opacity','stroke-dasharray',
      'stroke-linecap','stroke-linejoin','font-family','font-size','font-weight','font-style',
      'text-anchor','dominant-baseline','opacity','display','visibility','paint-order'];
    originals.forEach((node, i) => {
      const computed = frame.contentWindow.getComputedStyle(node);
      props.forEach(prop => copies[i].style.setProperty(prop, computed.getPropertyValue(prop)));
    });
    const box = svg.viewBox.baseVal;
    const sourceWidth = box.width || svg.width.baseVal.value;
    const sourceHeight = box.height || svg.height.baseVal.value;
    if (!sourceWidth || !sourceHeight) throw new Error('The embedded diagram has no fixed dimensions.');
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', sourceWidth); clone.setAttribute('height', sourceHeight);
    clone.style.width = `${sourceWidth}px`; clone.style.height = `${sourceHeight}px`;
    clone.querySelectorAll('script,foreignObject').forEach(node => node.remove());
    const blobUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type:'image/svg+xml' }));
    try {
      const image = new Image(); image.src = blobUrl; await image.decode();
      const scale = Math.min(1, 2400 / Math.max(sourceWidth, sourceHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(sourceWidth * scale); canvas.height = Math.round(sourceHeight * scale);
      const context = canvas.getContext('2d');
      context.fillStyle = '#fff'; context.fillRect(0,0,canvas.width,canvas.height);
      context.drawImage(image,0,0,canvas.width,canvas.height);
      return { kind:'image', data:canvas.toDataURL('image/png').split(',')[1], width:canvas.width, height:canvas.height, caption };
    } finally { URL.revokeObjectURL(blobUrl); }
  }

  async function collectSection(id) {
    // Always export the complete source, never one fragment of a paginated table.
    const root = document.querySelector('.doc-source #' + CSS.escape(id)) || document.getElementById(id);
    if (!root) throw new Error(`Missing local section: ${id}`);
    const blocks = [];
    async function visit(element) {
      if (element.matches('.anchor-link,.figure-editor-link,.zoom-hint,.entity-note,.entity-grid,.doc-footer')) return;
      // Keep the existing Google heading; replace only the section's contents.
      if (element.parentElement === root && element.matches('.section-heading')) return;
      if (element.matches('figure')) {
        const caption = textOf(element.querySelector('figcaption') || element);
        const image = element.querySelector('img'), frame = element.querySelector('iframe');
        if (image) blocks.push(await pngBlock(image, caption));
        else if (frame) blocks.push(await iframePng(frame, caption));
        else throw new Error(`Figure has no exportable image: ${caption}`);
        return;
      }
      if (element.matches('table')) {
        const cellStyles = [];
        const rows = Array.from(element.rows, row => {
          const values = [], formats = [];
          for (const cell of row.cells) {
            const rich = richTextOf(cell);
            values.push(rich.text); formats.push({ runs:rich.runs, header:cell.tagName === 'TH' });
            for (let i=1; i<cell.colSpan; i++) { values.push(''); formats.push({ runs:[], header:false }); }
          }
          cellStyles.push(formats);
          return values;
        });
        const width = Math.max(...rows.map(row => row.length));
        rows.forEach((row, i) => { while(row.length < width) { row.push(''); cellStyles[i].push({ runs:[], header:false }); } });
        blocks.push({ kind:'table', rows, cellStyles }); return;
      }
      if (element.matches('h1,h2,h3,h4,h5,p,li')) {
        const rich = richTextOf(element);
        if (rich.text) blocks.push({ kind:element.matches('h1,h2,h3,h4,h5') ? 'heading' : 'paragraph', ...rich,
          role:element.matches('.cap') ? 'caption' : element.matches('li') ? 'list' : 'body',
          level:element.matches('h1,h2,h3,h4,h5') ? Number(element.tagName[1]) : 0 });
        return;
      }
      for (const child of element.children) await visit(child);
    }
    await visit(root);
    if (!blocks.length) throw new Error(`Section is empty: ${id}`);
    return { id, blocks };
  }

  async function send(form, status) {
    const selected = Array.from(form.querySelectorAll('[name=section]:checked'), input => input.value);
    const includeTitle = form.elements.cover.checked;
    if (!selected.length && !includeTitle) throw new Error('Select at least one section or the cover title.');
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(form.elements.endpoint.value.trim())) {
      throw new Error('Enter the deployed Apps Script Web App URL ending in /exec. See the setup guide.');
    }
    if (form.elements.key.value.trim().length < 32) throw new Error('Enter the sync key from your Apps Script setup.');
    if (!/^https?:$/.test(location.protocol)) throw new Error('Open Docs.html through Live Server or localhost so images can be read.');
    const popupName = `labDocsSync${Date.now()}`;
    const popup = window.open('about:blank', popupName);
    if (!popup) throw new Error('Allow popups for this page, then retry.');
    popup.document.body.textContent = 'Preparing documentation. Google will show the actual sync result here.';
    try {
      const sections = [];
      for (const id of selected) {
        status.textContent = `Preparing ${SECTIONS.find(section => section[0]===id)[1]}…`;
        sections.push(await collectSection(id));
      }
      const title = textOf(document.querySelector('.doc-source #cover h1') || document.querySelector('#cover h1'));
      const payload = JSON.stringify({ version:2, documentId:DOCUMENT_ID, title:includeTitle ? title : null, sections });
      if (new Blob([payload]).size > 25 * 1024 * 1024) throw new Error('This update exceeds 25 MB. Select fewer sections per update.');
      const post = document.createElement('form');
      post.method='POST'; post.action=form.elements.endpoint.value.trim(); post.target=popupName;
      post.hidden=true;
      for (const [name,value] of Object.entries({ payload, syncKey:form.elements.key.value.trim() })) {
        const input=document.createElement('input'); input.type='hidden'; input.name=name; input.value=value; post.append(input);
      }
      document.body.append(post); post.submit(); post.remove();
      localStorage.setItem('lab-google-doc-endpoint', form.elements.endpoint.value.trim());
      status.textContent = 'Update sent. Check the Google result window for success or errors; this page cannot verify the result.';
    } catch(error) { popup.close(); throw error; }
  }

  function open() {
    if (!dialog) {
      dialog=document.createElement('dialog'); dialog.className='gdoc-dialog';
      dialog.innerHTML=`<form><h2>Update Google Docs</h2>
        <p>Target: <a href="${DOCUMENT_URL}" target="_blank" rel="noopener">your new Google Doc copy</a>.</p>
        <p>Selected sections will be replaced with their current local text, tables, and images. Other sections stay as they are. A backup copy is created before changes.</p>
        <p><a href="integrations/google-docs/SETUP.md" target="_blank" rel="noopener">One-time Google connection setup</a></p>
        <label>Apps Script Web App URL<input name="endpoint" type="url" required placeholder="https://script.google.com/macros/s/…/exec"></label>
        <label>Sync key<input name="key" type="password" required autocomplete="off" minlength="32"></label>
        <fieldset><legend>Content to update</legend><div class="gdoc-sections">
        <label><input name="cover" type="checkbox" checked> Cover title</label>
        ${SECTIONS.map(([id,label])=>`<label><input type="checkbox" name="section" value="${id}" ${id==='overview'?'checked':''}> ${label}</label>`).join('')}
        </div></fieldset>
        <p>Body paragraphs are justified using the Google Doc's existing body font and spacing when available. Bold and italic text are retained; the cover title stays bold with its existing alignment. Review page breaks and refresh the table of contents afterward. Edits inside selected sections will be replaced. Requires the latest Code.gs deployment.</p>
        <p class="gdoc-status" role="status" aria-live="polite"></p>
        <div class="gdoc-actions"><button type="button" data-close>Close</button><button type="submit">Update selected content</button></div></form>`;
      document.body.append(dialog);
      const form=dialog.querySelector('form'), status=dialog.querySelector('.gdoc-status');
      form.elements.endpoint.value=localStorage.getItem('lab-google-doc-endpoint')||'';
      dialog.querySelector('[data-close]').onclick=()=>dialog.close();
      dialog.addEventListener('cancel',event=>{ if(busy) event.preventDefault(); });
      form.onsubmit=async event=>{
        event.preventDefault(); if(busy) return; busy=true;
        const buttons=Array.from(form.querySelectorAll('button')); buttons.forEach(button=>button.disabled=true);
        status.dataset.error='false';
        try { await send(form,status); } catch(error) { status.dataset.error='true'; status.textContent=error.message; }
        finally { busy=false; buttons.forEach(button=>button.disabled=false); }
      };
    }
    dialog.showModal();
  }
  window.GoogleDocSync={ open };
})();
