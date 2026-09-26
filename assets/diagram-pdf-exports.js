/* Checked-in diagram exports; UI controls stay outside the paper and sync source. */
window.DocumentDiagramExports = [
  { id: 'dfd-p2', label: 'DFD Process 2.0', image: 'assets/figures-v2/dfd-level2-compact/png/dfd-level2-p2.png', file: 'dfd-process-2-a4.pdf', caption: 'Figure 6: DFD Level 2 - Process 2.0: Manage Reservations, Availability & Approvals', source: 'assets/figures-v2/dfd-level2-compact/dfd-level2-compact.html?process=p2', selector: '#stage svg' },
  { id: 'activity-p2', label: 'Activity Diagram 2.0', image: 'assets/system-diagrams/activity-p2.png', file: 'activity-process-2-a4.pdf', caption: 'Figure 12: Activity Diagram - Manage Reservations, Availability & Approvals', svg: 'assets/system-diagrams/activity-p2.svg' },
  { id: 'erd', label: 'Complete ERD A4', image: 'assets/erd/erd-a4-complete.png', file: 'erd-complete-a4.pdf', pdf: 'assets/erd/erd-a4.pdf' },
  { id: 'swimlane', label: 'Swimlane', image: 'assets/system-diagrams/swimlane-system.png', file: 'swimlane-a4.pdf', pdf: 'assets/system-diagrams/swimlane-system.pdf' },
  { id: 'usecase', label: 'Figure 2: Use Case Diagram', image: 'assets/figures-v2/usecase-diagram-draft.png', file: 'usecase-figure-2-a4.pdf', caption: 'Figure 2: Use Case Diagram', source: 'assets/figures-v2/usecase-diagram-source.html?export=1', selector: '#stage svg' },
  { id: 'deployment', label: 'Deployment Diagram', image: 'assets/system-diagrams/deployment.png', file: 'deployment-a4.pdf', pdf: 'assets/system-diagrams/deployment.pdf' },
];

window.installDiagramPdfExports = function (target) {
  target.querySelectorAll('.diagram-pdf-toolbar').forEach(node => node.remove());
  target.querySelectorAll('.pagedjs_page').forEach(page => {
    const matches = window.DocumentDiagramExports.filter(item => [...page.querySelectorAll('figure img')].some(img => new URL(img.src, location.href).pathname.endsWith('/' + item.image)));
    if (!matches.length) return;
    const toolbar = document.createElement('nav');
    toolbar.className = 'diagram-pdf-toolbar';
    toolbar.setAttribute('aria-label', 'Diagram PDF downloads');
    matches.forEach(item => {
      const link = document.createElement('a');
      link.href = item.id === 'swimlane' || item.id === 'deployment' ? item.pdf : 'assets/downloads/diagrams/' + item.file;
      link.download = item.file;
      link.textContent = (item.id === 'swimlane' || item.id === 'deployment' ? 'Export PDF - ' : 'Download A4 PDF - ') + item.label;
      toolbar.appendChild(link);
    });
    page.before(toolbar);
  });
};
