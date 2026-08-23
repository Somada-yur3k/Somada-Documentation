(function () {
  const NS = 'http://www.w3.org/2000/svg';

  function svgPoint(svg, event) {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse());
  }

  function parsePath(d) {
    const tokens = String(d || '').match(/[MLHV]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [];
    const points = [];
    let i = 0, command = '', x = 0, y = 0;
    while (i < tokens.length) {
      if (/^[MLHV]$/i.test(tokens[i])) command = tokens[i++].toUpperCase();
      if (command === 'M' || command === 'L') {
        x = Number(tokens[i++]); y = Number(tokens[i++]); points.push({x, y});
        if (command === 'M') command = 'L';
      } else if (command === 'H') {
        x = Number(tokens[i++]); points.push({x, y});
      } else if (command === 'V') {
        y = Number(tokens[i++]); points.push({x, y});
      } else break;
    }
    return points;
  }

  function pathFrom(points) {
    return points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  }

  function init(svg, options) {
    options = options || {};
    const connectors = [...svg.querySelectorAll('.diagram-connector[data-flow-id]')];
    if (!connectors.length) return;

    const storageKey = `somada-diagram-edits:${options.storageKey || location.pathname}`;
    let saved = {paths: {}, labels: {}};
    try { saved = {...saved, ...JSON.parse(localStorage.getItem(storageKey) || '{}')}; } catch (_) {}
    saved.paths = saved.paths || {};
    saved.labels = saved.labels || {};

    const handleLayer = document.createElementNS(NS, 'g');
    handleLayer.setAttribute('class', 'diagram-handle-layer');
    svg.appendChild(handleLayer);
    let selectedId = null;
    let hoveredId = null;
    let drag = null;

    function flowNodes(id) {
      return [...svg.querySelectorAll(`[data-flow-id="${CSS.escape(id)}"]`)];
    }

    function persist() {
      try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch (_) {}
    }

    function activate(id) {
      const active = selectedId || id;
      svg.classList.toggle('diagram-has-active', Boolean(active));
      svg.querySelectorAll('.is-active').forEach(node => node.classList.remove('is-active'));
      if (active) flowNodes(active).forEach(node => node.classList.add('is-active'));
    }

    function setPath(id, d, remember) {
      flowNodes(id).forEach(node => {
        if (node.matches('path.diagram-connector, path.diagram-connector-halo, path.diagram-connector-hit')) node.setAttribute('d', d);
      });
      if (remember) { saved.paths[id] = d; persist(); }
    }

    function drawHandles() {
      handleLayer.replaceChildren();
      if (!selectedId) return;
      const path = svg.querySelector(`.diagram-connector[data-flow-id="${CSS.escape(selectedId)}"]`);
      if (!path) return;
      const points = parsePath(path.getAttribute('d'));
      if (points.length === 2) {
        const a = points[0], b = points[1];
        const handle = document.createElementNS(NS, 'rect');
        handle.setAttribute('x', (a.x + b.x) / 2 - 6);
        handle.setAttribute('y', (a.y + b.y) / 2 - 6);
        handle.setAttribute('width', 12);
        handle.setAttribute('height', 12);
        handle.setAttribute('rx', 3);
        handle.setAttribute('class', 'diagram-segment-handle');
        handle.addEventListener('pointerdown', event => {
          event.preventDefault(); event.stopPropagation();
          drag = {type: 'straight', id: selectedId, start: svgPoint(svg, event), points: points.map(point => ({...point}))};
        });
        handleLayer.appendChild(handle);
        return;
      }
      for (let index = 1; index < points.length - 2; index++) {
        const a = points[index], b = points[index + 1];
        const horizontal = Math.abs(a.y - b.y) < .1;
        const vertical = Math.abs(a.x - b.x) < .1;
        if (!horizontal && !vertical) continue;
        const handle = document.createElementNS(NS, 'rect');
        handle.setAttribute('x', (a.x + b.x) / 2 - 6);
        handle.setAttribute('y', (a.y + b.y) / 2 - 6);
        handle.setAttribute('width', 12);
        handle.setAttribute('height', 12);
        handle.setAttribute('rx', 3);
        handle.setAttribute('class', 'diagram-segment-handle');
        handle.addEventListener('pointerdown', event => {
          event.preventDefault(); event.stopPropagation();
          drag = {type: 'segment', id: selectedId, index, horizontal, start: svgPoint(svg, event), points: points.map(point => ({...point}))};
        });
        handleLayer.appendChild(handle);
      }
    }

    function select(id) {
      selectedId = id;
      activate(hoveredId);
      drawHandles();
    }

    connectors.forEach(connector => {
      const id = connector.dataset.flowId;
      connector.dataset.originalD = connector.getAttribute('d');
      if (saved.paths[id]) setPath(id, saved.paths[id], false);
      const hit = connector.cloneNode(false);
      hit.removeAttribute('marker-end');
      hit.removeAttribute('style');
      hit.setAttribute('class', 'diagram-connector-hit');
      hit.setAttribute('data-flow-id', id);
      hit.setAttribute('d', connector.getAttribute('d'));
      connector.parentNode.insertBefore(hit, connector);
      hit.addEventListener('pointerenter', () => { hoveredId = id; activate(id); });
      hit.addEventListener('pointerleave', () => { hoveredId = null; activate(null); });
      hit.addEventListener('click', event => { event.stopPropagation(); select(id); });
    });

    const labelOverlay = document.createElementNS(NS, 'g');
    labelOverlay.setAttribute('class', 'diagram-label-overlay');
    [...svg.querySelectorAll('.diagram-flow-label[data-flow-id]')].forEach(label => labelOverlay.appendChild(label));
    svg.appendChild(labelOverlay);
    svg.appendChild(handleLayer);

    svg.querySelectorAll('.diagram-flow-label[data-flow-id]').forEach(label => {
      const id = label.dataset.flowId;
      label.dataset.baseTransform = label.getAttribute('transform') || '';
      const offset = saved.labels[id];
      if (offset) label.setAttribute('transform', `translate(${offset.x || 0} ${offset.y || 0}) ${label.dataset.baseTransform}`.trim());
      label.addEventListener('pointerenter', () => { hoveredId = id; activate(id); });
      label.addEventListener('pointerleave', () => { hoveredId = null; activate(null); });
      label.addEventListener('pointerdown', event => {
        event.preventDefault(); event.stopPropagation(); select(id);
        const current = saved.labels[id] || {x: 0, y: 0};
        drag = {type: 'label', id, label, start: svgPoint(svg, event), origin: {...current}};
      });
    });

    window.addEventListener('pointermove', event => {
      if (!drag) return;
      const point = svgPoint(svg, event);
      const dx = point.x - drag.start.x, dy = point.y - drag.start.y;
      if (drag.type === 'label') {
        const offset = {x: drag.origin.x + dx, y: drag.origin.y + dy};
        saved.labels[drag.id] = offset;
        drag.label.setAttribute('transform', `translate(${offset.x} ${offset.y}) ${drag.label.dataset.baseTransform}`.trim());
      } else if (drag.type === 'straight') {
        const a = drag.points[0], b = drag.points[1];
        let points;
        if (Math.abs(a.y - b.y) < .1) {
          const direction = Math.sign(b.x - a.x) || 1;
          const inset = Math.min(30, Math.abs(b.x - a.x) * .22);
          points = [a,{x:a.x+direction*inset,y:a.y},{x:a.x+direction*inset,y:a.y+dy},{x:b.x-direction*inset,y:b.y+dy},{x:b.x-direction*inset,y:b.y},b];
        } else if (Math.abs(a.x - b.x) < .1) {
          const direction = Math.sign(b.y - a.y) || 1;
          const inset = Math.min(30, Math.abs(b.y - a.y) * .22);
          points = [a,{x:a.x,y:a.y+direction*inset},{x:a.x+dx,y:a.y+direction*inset},{x:b.x+dx,y:b.y-direction*inset},{x:b.x,y:b.y-direction*inset},b];
        } else if (Math.abs(b.x-a.x) >= Math.abs(b.y-a.y)) {
          points = [a,{x:point.x,y:a.y},{x:point.x,y:b.y},b];
        } else {
          points = [a,{x:a.x,y:point.y},{x:b.x,y:point.y},b];
        }
        setPath(drag.id, pathFrom(points), false);
      } else {
        const points = drag.points.map(vertex => ({...vertex}));
        if (drag.horizontal) {
          points[drag.index].y += dy; points[drag.index + 1].y += dy;
        } else {
          points[drag.index].x += dx; points[drag.index + 1].x += dx;
        }
        setPath(drag.id, pathFrom(points), false);
        drawHandles();
      }
    });

    window.addEventListener('pointerup', () => {
      if (!drag) return;
      if (drag.type !== 'label') {
        const path = svg.querySelector(`.diagram-connector[data-flow-id="${CSS.escape(drag.id)}"]`);
        if (path) saved.paths[drag.id] = path.getAttribute('d');
      }
      persist(); drag = null; drawHandles();
    });

    svg.addEventListener('click', event => {
      if (event.target.closest('.diagram-flow-label, .diagram-connector-hit, .diagram-segment-handle')) return;
      selectedId = null; activate(hoveredId); drawHandles();
    });

    window.addEventListener('keydown', event => {
      if (event.key === 'Escape') { selectedId = null; activate(hoveredId); drawHandles(); }
    });

    const toolbar = document.createElement('div');
    toolbar.className = 'diagram-editor-toolbar';
    toolbar.innerHTML = '<span>Hover to trace • drag a label • click an arrow, then drag a square route handle</span><button type="button">Reset edits</button>';
    toolbar.querySelector('button').addEventListener('click', () => {
      connectors.forEach(connector => setPath(connector.dataset.flowId, connector.dataset.originalD, false));
      svg.querySelectorAll('.diagram-flow-label[data-flow-id]').forEach(label => {
        label.setAttribute('transform', label.dataset.baseTransform);
      });
      saved = {paths: {}, labels: {}};
      try { localStorage.removeItem(storageKey); } catch (_) {}
      selectedId = null; hoveredId = null; activate(null); drawHandles();
    });
    if (!new URLSearchParams(location.search).has('export')) document.body.appendChild(toolbar);
  }

  window.SOMADADiagramEditor = {init};
})();
