/* Deploy under your own Google account. Never make this web app public.
 * Final-term integration: pinned to the final-term document, never the original.
 * Deploy this file in a separate Apps Script project; local edits do not update /exec. */
const TARGET_ID = '1UfFa6G0eWenSY_KjokZoOHqrQ2ajKGVgIwU56dkjpzY';
const SYNC_BUILD = '2026-09-26-readable-erd-appendix';
const DOC_FONT_SIZE = 11;
// Migration-only match for older copies; never used as the current project title.
const OLD_TITLE = 'SOMADA: A Web-Based Laboratory Management System';
const SECTION_ORDER = ['overview','methodology','requirements','backlog','events',
  'usecase-diagrams','usecase-full','gap-analysis','system-analysis','context-diagram','dfd','erd','activity-diagrams','swimlane-diagram','sequence-diagrams','deployment-diagram','references','erd-appendix'];
const SECTION_NAMES = {
  overview:'project context', methodology:'methodology', requirements:'requirements analysis',
  backlog:'product backlog', events:'event tables', 'usecase-diagrams':'use case diagrams',
  'usecase-full':'use case full description', 'gap-analysis':'gap analysis',
  'context-diagram':'context diagram', dfd:'data flow diagrams', erd:'entity-relationship diagram',
  'activity-diagrams':'activity diagrams', 'swimlane-diagram':'swimlane diagram',
  'system-analysis':'system analysis and design', 'sequence-diagrams':'sequence diagram',
  'deployment-diagram':'deployment diagram', references:'references',
  'erd-appendix':'appendix a - detailed entity-relationship diagrams'
};
// Only these new, explicitly selected sections may be created if absent.
const NEW_SECTIONS = {'activity-diagrams':'2.3.4 Activity Diagrams','swimlane-diagram':'2.3.5 Swimlane Diagram',
  'sequence-diagrams':'2.3.6 Sequence Diagram','deployment-diagram':'2.3.7 Deployment Diagram',
  'erd-appendix':'Appendix A - Detailed Entity-Relationship Diagrams'};

// Run once in the Apps Script editor, authorize, then copy the key from the execution log.
function setupSync() {
  const document = DocumentApp.openById(TARGET_ID);
  DriveApp.getFileById(TARGET_ID).getName(); // Ask for backup permission at setup time.
  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty('LAB_SYNC_KEY');
  if (!key) { key = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('LAB_SYNC_KEY',key); }
  console.log('Target: ' + document.getUrl());
  console.log('Sync build: ' + SYNC_BUILD);
  console.log('Sync key (keep private; paste only into your local sync dialog): ' + key);
}

function doGet() {
  return page_('Final-term Google Docs connection', 'Build: ' + SYNC_BUILD + '. Target document: ' + TARGET_ID + '. After running setupSync and authorizing this deployment, return to Docs.html and use Update Google Docs. Supports 15 selectable sections, including the readable ERD appendix. References are preserved.', null);
}

function doPost(event) {
  const lock = LockService.getScriptLock();
  let stageFile = null, stageDocument = null, backupUrl = null, mutationStarted = false;
  let phase = 'validating the update';
  try {
    const params = event && event.parameter || {};
    const secret = PropertiesService.getScriptProperties().getProperty('LAB_SYNC_KEY');
    if (!secret || params.syncKey !== secret) throw new Error('Invalid sync key. Run setupSync and use the key from your own project.');
    if (!params.payload || params.payload.length > 26 * 1024 * 1024) throw new Error('Missing or oversized update.');
    const payload = JSON.parse(params.payload);
    validatePayload_(payload);
    if (!lock.tryLock(1000)) throw new Error('Another sync is running. Wait for its result before retrying.');
    const sourceFile = DriveApp.getFileById(TARGET_ID);
    const sourceVersion = sourceFile.getLastUpdated().getTime();
    const target = DocumentApp.openById(TARGET_ID);
    const tab = target.getTabs()[0].asDocumentTab();
    const body = tab.getBody();
    const plan = planSections_(body, payload);
    const fallbackStyle = bodyStyle_(body, 0, body.getNumChildren());
    const sectionStyles = {};
    plan.sections.forEach(change => {
      sectionStyles[change.id] = bodyStyle_(body, change.start+1, change.end) || fallbackStyle;
    });

    // Build every table and decode every image in a private temporary document first.
    // Any unsupported image/content fails before the target is touched.
    phase = 'preparing content';
    const imageBounds = imageBounds_(body);
    const width = imageBounds.width, height = imageBounds.height;
    const stage = stageDocument = DocumentApp.create('Laboratory sync preparation ' + new Date().toISOString());
    stageFile = DriveApp.getFileById(stage.getId());
    const stageBody = stage.getBody();
    const prepared = {};
    payload.sections.forEach(section => {
      const start = stageBody.getNumChildren();
      if (plan.sections.find(change=>change.id===section.id).create) {
        appendBlock_(stageBody,{kind:'heading',text:NEW_SECTIONS[section.id],level:3,pageBreakBefore:true},width,height,null);
      }
      section.blocks.forEach(block => appendBlock_(stageBody,block,width,height,sectionStyles[section.id]));
      const elements = [];
      for (let i=start; i<stageBody.getNumChildren(); i++) elements.push(stageBody.getChild(i).copy());
      prepared[section.id] = elements;
    });
    // Keep the preparation document OPEN while its element copies are consumed.
    // Detached DocumentApp elements are service objects, not plain JSON snapshots.
    // Closing their source before insertTable/insertParagraph can invalidate them.

    phase = 'reopening and checking the target';
    const writeTarget = DocumentApp.openById(TARGET_ID);
    const writeBody = writeTarget.getTabs()[0].asDocumentTab().getBody();
    const writePlan = planSections_(writeBody, payload);

    if (DriveApp.getFileById(TARGET_ID).getLastUpdated().getTime() !== sourceVersion) {
      throw new Error('The Google Doc changed while preparing the update. Review those edits and retry.');
    }
    phase = 'creating the backup';
    const backup = sourceFile.makeCopy(sourceFile.getName() + ' — backup ' + new Date().toISOString());
    backupUrl = backup.getUrl();
    // Apply from bottom to top so original section indexes remain valid.
    const changes = writePlan.sections.slice().sort((a,b)=>b.start-a.start || SECTION_ORDER.indexOf(b.id)-SECTION_ORDER.indexOf(a.id));
    changes.forEach(change => {
      phase = 'replacing ' + SECTION_NAMES[change.id];
      replaceSection_(writeBody, change, prepared[change.id], () => { mutationStarted = true; });
    });
    if (payload.title) {
      phase = 'updating the cover title';
      const paragraph = writeBody.getChild(writePlan.titleIndex).asParagraph();
      mutationStarted = true;
      updateTitle_(paragraph, payload.title);
    }
    phase = 'setting first-tab text to black, 11 pt';
    mutationStarted = true;
    normalizeFont_(writeTarget.getTabs()[0].asDocumentTab());
    phase = 'saving the target';
    writeTarget.saveAndClose();
    return page_('Google Doc updated',
      'Updated ' + (payload.title ? 'cover title' : '') + (payload.title && payload.sections.length ? ' and ' : '') +
      payload.sections.map(section=>SECTION_NAMES[section.id]).join(', ') +
      '. First-tab body, header and footer text is now black, 11 pt. Bold and italic were preserved; text inside images is unchanged. Review page breaks and refresh the table of contents. Unselected content was preserved apart from font size and text color.', backupUrl);
  } catch(error) {
    console.error('Sync failed while ' + phase + ': ' + String(error.stack || error));
    return page_(mutationStarted ? 'Update interrupted — check the backup' : 'Update not applied',
      String(error.message || error) + ' Step: ' + phase + '.' + (mutationStarted ? ' Some selected content may have changed. Open the backup to recover the previous version.' : ' The target content was not changed.'), backupUrl);
  } finally {
    // Cleanup must not turn a successful target save into an "interrupted" result.
    if (stageDocument) { try { stageDocument.saveAndClose(); } catch (ignored) { console.warn('Preparation document could not be closed.'); } }
    if (stageFile) { try { stageFile.setTrashed(true); } catch (ignored) { console.warn('Preparation copy retained.'); } }
    if (lock.hasLock()) lock.releaseLock();
  }
}

function replaceSection_(body,change,elements,onMutation) {
  // Materialize every source copy before touching the target section. A bad or
  // closed source fails here, while the section's original content is intact.
  const copies = elements.map(element => {
    const type = element.getType();
    if (type === DocumentApp.ElementType.TABLE) return {type,element:element.asTable().copy()};
    if (type === DocumentApp.ElementType.PARAGRAPH) return {type,element:element.asParagraph().copy()};
    throw new Error('Unsupported prepared element: ' + type);
  });
  onMutation();
  // Keep a final paragraph even when replacing the last section with a table.
  if (change.end === body.getNumChildren()) body.appendParagraph('');
  let cursor = change.create ? change.start : change.start+1;
  copies.forEach(copy => {
    if (copy.type === DocumentApp.ElementType.TABLE) body.insertTable(cursor++,copy.element);
    else body.insertParagraph(cursor++,copy.element);
  });
  if (change.create) return; // New sections insert only; never remove nearby content.
  // Only remove originals once ALL replacement elements have been inserted.
  // If insertion fails midway, the old section is still available beside any
  // partially inserted content. The complete pre-update backup is also retained.
  for (let index=change.end+copies.length-1; index>change.start+copies.length; index--) {
    body.removeChild(body.getChild(index));
  }
}

function validatePayload_(payload) {
  if (!payload || ![1,2,3].includes(payload.version) || payload.documentId !== TARGET_ID) throw new Error('Wrong document or unsupported update format. Update Code.gs and deploy a new version.');
  if (!Array.isArray(payload.sections) || payload.sections.length > SECTION_ORDER.length-1) throw new Error('Invalid section list.');
  if (payload.title !== null && (typeof payload.title !== 'string' || !payload.title.trim() || payload.title.length > 400)) throw new Error('Invalid cover title.');
  if (!payload.title && !payload.sections.length) throw new Error('Nothing selected.');
  const seen = {};
  payload.sections.forEach(section => {
    if (!SECTION_NAMES[section.id] || ['requirements','system-analysis','references'].includes(section.id) || seen[section.id]) throw new Error('Invalid or duplicate section.');
    seen[section.id]=true;
    if (!Array.isArray(section.blocks) || !section.blocks.length || section.blocks.length>1500) throw new Error('Invalid section content.');
    section.blocks.forEach(block => {
      if (block.pageBreakBefore !== undefined && (typeof block.pageBreakBefore!=='boolean' || (block.pageBreakBefore && block.kind!=='heading'))) throw new Error('Invalid page break.');
      if (block.kind==='paragraph' || block.kind==='heading') {
        if(typeof block.text!=='string' || block.text.length>50000) throw new Error('Invalid paragraph.');
        if(block.kind==='heading' && ![1,2,3,4,5].includes(block.level)) throw new Error('Invalid heading level.');
        validateRuns_(block.runs, block.text);
        if(block.role !== undefined && !['body','caption','list'].includes(block.role)) throw new Error('Invalid paragraph role.');
      } else if(block.kind==='table') {
        if(!Array.isArray(block.rows) || !block.rows.length || block.rows.length>500) throw new Error('Invalid table.');
        const width=block.rows[0].length;
        if(!width || width>12 || !block.rows.every(row=>Array.isArray(row)&&row.length===width&&row.every(cell=>typeof cell==='string'&&cell.length<=50000))) throw new Error('Invalid table cells.');
        if(block.cellStyles !== undefined) {
          if(!Array.isArray(block.cellStyles) || block.cellStyles.length!==block.rows.length) throw new Error('Invalid table styles.');
          block.cellStyles.forEach((row,r) => {
            if(!Array.isArray(row) || row.length!==width) throw new Error('Invalid table styles.');
            row.forEach((style,c) => {
              if(!style || typeof style.header!=='boolean') throw new Error('Invalid cell style.');
              validateRuns_(style.runs,block.rows[r][c]);
            });
          });
        }
      } else if(block.kind==='image') {
        if(typeof block.data!=='string' || !block.data.startsWith('iVBORw0KGgo') || !/^[A-Za-z0-9+/=]+$/.test(block.data) || block.data.length>16*1024*1024) throw new Error('Invalid PNG image.');
        if(!Number.isFinite(block.width)||!Number.isFinite(block.height)||block.width<=0||block.height<=0||block.width*block.height>30000000) throw new Error('Invalid image dimensions.');
        if(typeof block.caption!=='string'||block.caption.length>2000) throw new Error('Invalid caption.');
      } else throw new Error('Unsupported content type.');
    });
  });
}

function headingName_(text) {
  return String(text).replace(/\s+/g,' ').trim().toLowerCase()
    .replace(/^(?:[ivx]+\.?|\d+(?:\.\d+)*\.?)\s+/,'').replace(/[–—]/g,'-');
}

function planSections_(body,payload) {
  const indexes={};
  const titles=[];
  for(let i=0; i<body.getNumChildren(); i++) {
    const element=body.getChild(i);
    if(element.getType()!==DocumentApp.ElementType.PARAGRAPH) continue;
    const text=element.asParagraph().getText().replace(/\s+/g,' ').trim();
    if(text===OLD_TITLE || (payload.title && text===payload.title)) titles.push(i);
    let normalized=headingName_(text);
    if(normalized==='project overview') normalized='project context';
    if(normalized==='product backlog / user stories') normalized='product backlog';
    if(normalized==='entity-relationship diagrams') normalized='entity-relationship diagram';
    if(normalized==='sequence diagrams') normalized='sequence diagram';
    if(normalized==='activity diagram') normalized='activity diagrams';
    if(normalized==='swimlane diagrams') normalized='swimlane diagram';
    const match=Object.keys(SECTION_NAMES).find(key=>SECTION_NAMES[key]===normalized);
    if(match) (indexes[match]||(indexes[match]=[])).push(i);
  }
  if(payload.title && titles.length!==1) throw new Error('Expected exactly one cover title in the first tab. No change was made.');
  if(payload.sections.some(section=>section.id==='erd'||NEW_SECTIONS[section.id])) {
    let previous=-1;
    ['erd','activity-diagrams','swimlane-diagram','sequence-diagrams','deployment-diagram','references'].forEach(id=>{
      if(!indexes[id]) return;
      if(indexes[id].length!==1) throw new Error('Cannot uniquely locate '+SECTION_NAMES[id]+'.');
      if(indexes[id][0]<=previous) throw new Error('Unexpected new diagram section order.');
      previous=indexes[id][0];
    });
  }
  const sections=payload.sections.map(section=>{
    const at=SECTION_ORDER.indexOf(section.id);
    let end=body.getNumChildren();
    for(let i=at+1;i<SECTION_ORDER.length;i++) {
      const next=SECTION_ORDER[i];
      if(indexes[next] && indexes[next].length===1){end=indexes[next][0];break;}
      if(indexes[next] || !NEW_SECTIONS[next]) throw new Error('Cannot uniquely locate the end of '+SECTION_NAMES[section.id]+'.');
    }
    if(!indexes[section.id] && NEW_SECTIONS[section.id]) {
      if(section.id==='erd-appendix') {
        if(!indexes.references || indexes.references.length!==1) throw new Error('Cannot safely locate References before the ERD appendix.');
        return{id:section.id,start:body.getNumChildren(),end:body.getNumChildren(),create:true};
      }
      if(!indexes.erd || indexes.erd.length!==1 || indexes.erd[0]>=end) throw new Error('Cannot safely locate ERD before the new diagram section.');
      return{id:section.id,start:end,end,create:true};
    }
    if(!indexes[section.id]||indexes[section.id].length!==1) throw new Error('Cannot uniquely locate '+SECTION_NAMES[section.id]+' in the first document tab.');
    const start=indexes[section.id][0];
    if(section.id==='erd-appendix' && (!indexes.references || indexes.references.length!==1 || start<=indexes.references[0])) throw new Error('The ERD appendix must follow References.');
    if(NEW_SECTIONS[section.id] && (!indexes.erd || indexes.erd.length!==1 || start<=indexes.erd[0])) throw new Error('Unexpected new diagram section order.');
    if(end<=start) throw new Error('Unexpected section order.');
    return{id:section.id,start,end};
  });
  return{sections,titleIndex:titles[0]};
}

// Only copy typography and paragraph spacing, not page breaks or keep-with-next.
function bodyStyle_(body,start,end) {
  for(let i=start;i<end;i++) {
    const element=body.getChild(i);
    if(element.getType()!==DocumentApp.ElementType.PARAGRAPH) continue;
    const paragraph=element.asParagraph(), value=paragraph.getText();
    if(paragraph.getHeading()!==DocumentApp.ParagraphHeading.NORMAL || value.trim().length<80 ||
      /^(?:Figure|Table)\s+\d/i.test(value.trim())) continue;
    const text=paragraph.editAsText();
    if(text.isBold()===true || text.isItalic()===true) continue;
    const paraAttrs=paragraph.getAttributes(), textAttrs=text.getAttributes(0);
    const pick=(attributes,names)=>{
      const result={};
      names.forEach(name=>{ const key=DocumentApp.Attribute[name]; if(attributes[key]!=null) result[key]=attributes[key]; });
      return result;
    };
    return {
      paragraph:pick(paraAttrs,['INDENT_START','INDENT_END','INDENT_FIRST_LINE','LINE_SPACING','SPACING_BEFORE','SPACING_AFTER']),
      text:pick(textAttrs,['FONT_FAMILY','FONT_SIZE','FOREGROUND_COLOR'])
    };
  }
  return null;
}

function updateTitle_(paragraph,title) {
  const attributes=paragraph.getText() ? paragraph.editAsText().getAttributes(0) : {};
  const paragraphAttributes=paragraph.getAttributes();
  paragraph.setText(title);
  paragraph.setAttributes(paragraphAttributes);
  paragraph.editAsText().setAttributes(attributes).setBold(true).setFontSize(DOC_FONT_SIZE);
}

function normalizeFont_(tab) {
  // Normalize all text, including tables and links; preserve wording and emphasis.
  [tab.getBody(),tab.getHeader(),tab.getFooter()].forEach(section=>{
    if(section && section.getText()) {
      const text = section.editAsText();
      text.setFontSize(DOC_FONT_SIZE);
      text.setForegroundColor('#000000');
    }
  });
}

function validateRuns_(runs,text) {
  if(runs===undefined) return; // Older local client.
  if(!Array.isArray(runs) || runs.length>text.length) throw new Error('Invalid text formatting.');
  let end=0;
  runs.forEach(run=>{
    if(!run || !Number.isInteger(run.start) || !Number.isInteger(run.end) || run.start!==end ||
      run.end<=run.start || run.end>text.length || typeof run.bold!=='boolean' || typeof run.italic!=='boolean') {
      throw new Error('Invalid text formatting range.');
    }
    end=run.end;
  });
  if(end!==text.length) throw new Error('Incomplete text formatting.');
}

function applyRuns_(text,runs) {
  if(!runs) return;
  runs.forEach(run=>{
    text.setBold(run.start,run.end-1,run.bold);
    text.setItalic(run.start,run.end-1,run.italic);
  });
}

// Body page dimensions are points; InlineImage setters expect pixels (96 dpi).
// Reserve 40 pt vertically for the caption/paragraph spacing, not 40 pixels.
function imageBounds_(body) {
  const innerWidth = body.getPageWidth()-body.getMarginLeft()-body.getMarginRight();
  const innerHeight = body.getPageHeight()-body.getMarginTop()-body.getMarginBottom()-40;
  if (!Number.isFinite(innerWidth) || !Number.isFinite(innerHeight) || innerWidth<=0 || innerHeight<=0) {
    throw new Error('The target needs valid page dimensions and margins before images can be fitted.');
  }
  return {width:Math.floor(innerWidth*96/72),height:Math.floor(innerHeight*96/72)};
}

function appendBlock_(body,block,maxWidth,maxHeight,bodyStyle) {
  if(block.kind==='image') {
    const blob=Utilities.newBlob(Utilities.base64Decode(block.data),'image/png','diagram.png');
    const paragraph=body.appendParagraph('');
    paragraph.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    const image=paragraph.appendInlineImage(blob);
    // Blob decoding above verifies the image; size from the actual decoded asset.
    const width=image.getWidth(),height=image.getHeight(),scale=Math.min(1,maxWidth/width,maxHeight/height);
    image.setWidth(Math.max(1,Math.round(width*scale))).setHeight(Math.max(1,Math.round(height*scale)));
    image.setAltDescription(block.caption);
    const caption=body.appendParagraph(block.caption); caption.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    caption.editAsText().setFontSize(DOC_FONT_SIZE).setItalic(true);
  } else if(block.kind==='table') {
    const table=body.appendTable(block.rows);
    table.setBorderColor('#000000').setBorderWidth(0.5);
    // Fresh tables have no cell shading. Set the base text style once per table,
    // then visit only cells with emphasis instead of restyling every plain cell.
    const A=DocumentApp.Attribute;
    table.editAsText().setAttributes({
      [A.FONT_FAMILY]:'Arial', [A.FONT_SIZE]:DOC_FONT_SIZE, [A.FOREGROUND_COLOR]:'#000000',
      [A.BOLD]:false, [A.ITALIC]:false
    });
    for(let row=0;row<block.rows.length;row++) {
      let tableRow=null;
      for(let col=0;col<block.rows[row].length;col++) {
        if(!block.rows[row][col]) continue;
        const style=block.cellStyles && block.cellStyles[row][col];
        const emphasized=style && style.runs ? style.runs.filter(run=>run.bold || run.italic) : [];
        const headerFallback=!(style && style.runs) && (style ? style.header : row===0);
        if(!emphasized.length && !headerFallback) continue;
        if(!tableRow) tableRow=table.getRow(row);
        const text=tableRow.getCell(col).editAsText();
        if(headerFallback) text.setBold(true);
        emphasized.forEach(run=>text.setAttributes(run.start,run.end-1,{
          [A.BOLD]:run.bold, [A.ITALIC]:run.italic
        }));
      }
    }
  } else {
    const paragraph=body.appendParagraph(block.pageBreakBefore ? '' : block.text);
    // Keep the break inside the heading paragraph so section matching and repeat
    // updates retain it. DocumentApp has no PAGE_BREAK_BEFORE attribute.
    if(block.pageBreakBefore){paragraph.appendPageBreak();paragraph.appendText(block.text);}
    if(block.kind==='heading') {
      paragraph.setHeading(DocumentApp.ParagraphHeading['HEADING'+Math.min(6,block.level)]);
      paragraph.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
    } else {
      paragraph.setHeading(DocumentApp.ParagraphHeading.NORMAL);
      paragraph.editAsText().setFontFamily('Times New Roman').setFontSize(11).setBold(false).setItalic(false);
      paragraph.setSpacingAfter(8);
      if(bodyStyle) {
        paragraph.setAttributes(bodyStyle.paragraph);
        paragraph.editAsText().setAttributes(bodyStyle.text);
      }
      if(block.role==='caption') {
        paragraph.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        paragraph.setIndentFirstLine(0).setIndentStart(0).setIndentEnd(0);
      } else if(block.role==='list') {
        paragraph.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
      } else paragraph.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
    }
    applyRuns_(paragraph.editAsText(),block.runs);
    paragraph.editAsText().setFontSize(DOC_FONT_SIZE);
  }
}

function escape_(value) {return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function page_(title,message,backupUrl) {
  return HtmlService.createHtmlOutput('<!doctype html><html><head><base target="_top"><meta charset="utf-8"></head><body style="font:16px/1.6 Arial,sans-serif;max-width:720px;margin:50px auto;padding:20px"><h1>'+escape_(title)+'</h1><p>'+escape_(message)+'</p><p><a href="https://docs.google.com/document/d/'+TARGET_ID+'/edit">Open the new Google Doc copy</a></p>'+(backupUrl?'<p><a href="'+escape_(backupUrl)+'">Open the backup</a></p>':'')+'<p style="font-size:12px;color:#666">Sync build: '+escape_(SYNC_BUILD)+'</p></body></html>').setTitle(title);
}
