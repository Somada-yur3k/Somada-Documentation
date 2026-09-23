// Run: node integrations/google-docs/check-sync.cjs
// Contract tests only: no Google connection and no live document writes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context=vm.createContext({ console, DocumentApp:{ ElementType:{PARAGRAPH:'p',TABLE:'t'} } });
vm.runInContext(fs.readFileSync(__dirname+'/Code.gs','utf8'),context);
const id='1UfFa6G0eWenSY_KjokZoOHqrQ2ajKGVgIwU56dkjpzY';
const title='A Web-Based Physics and Circuits Laboratory Management System with AI Capabilities for NU Fairview';
const oldTitle='SOMADA: A Web-Based Laboratory Management System';
const makePayload=(sections=[{id:'overview',blocks:[{kind:'paragraph',text:'Updated introduction.'}]}])=>({version:1,documentId:id,title,sections});
const para=text=>({getType:()=> 'p',asParagraph:()=>({getText:()=>text})});
const bodyOf=original=>{const texts=[...original,'References','Preserved bibliography'];return {getNumChildren:()=>texts.length,getChild:i=>para(texts[i])};};

context.validatePayload_(makePayload());
assert.throws(()=>context.validatePayload_({...makePayload(),documentId:'original-document'}),/Wrong document/);
assert.throws(()=>context.validatePayload_({...makePayload(),title:null,sections:[]}),/Nothing selected/);
assert.throws(()=>context.validatePayload_(makePayload([{id:'overview',blocks:[]}])),/Invalid section content/);
assert.throws(()=>context.validatePayload_(makePayload([...makePayload().sections,...makePayload().sections])),/duplicate/);
assert.throws(()=>context.validatePayload_(makePayload([{id:'overview',blocks:[{kind:'table',rows:[['a'],['b','c']]}]}])),/table cells/);
assert.throws(()=>context.validatePayload_(makePayload([{id:'dfd',blocks:[{kind:'image',data:'invalid',width:100,height:100,caption:'test'}]}])),/PNG/);

const text=[oldTitle,'Authors','I. Project Overview 1','I.     Project Overview','old text','II. Methodology','Keep this methodology',
  'III. Requirements Analysis','3.1.1 Product Backlog','table','3.1.2 Event Tables','table',
  '3.1.3 Use Case Diagrams','old image','3.1.4 Use Case Full Description','table',
  '3.1.5 Gap Analysis','table','3.1.6 Context Diagram','old image','3.1.7 Data Flow Diagrams','old diagrams','3.1.8 Entity-Relationship Diagram','old ERD'];
const plan=context.planSections_(bodyOf(text),makePayload());
assert.equal(plan.titleIndex,0);
assert.equal(plan.sections[0].start,3);
assert.equal(plan.sections[0].end,5);
const dfd=context.planSections_(bodyOf(text),makePayload([{id:'dfd',blocks:[{kind:'paragraph',text:'new diagrams'}]}]));
assert.equal(dfd.sections[0].start,20); assert.equal(dfd.sections[0].end,22);
assert.throws(()=>context.planSections_(bodyOf([...text,'I. Project Overview']),makePayload()),/uniquely/);
assert.throws(()=>context.planSections_(bodyOf(text.filter(t=>t!=='II. Methodology')),makePayload()),/end of/);
assert.throws(()=>context.planSections_(bodyOf(text.slice(1)),makePayload()),/cover title/);
const alreadySynced=[title,...text.slice(1)];
assert.equal(context.planSections_(bodyOf(alreadySynced),makePayload()).titleIndex,0);
const erd=context.planSections_(bodyOf(text),makePayload([{id:'erd',blocks:[{kind:'paragraph',text:'new ERD'}]}]));
assert.equal(erd.sections[0].end,text.length);

// Verify section collection has a target, and local assets are complete.
const html=fs.readFileSync(__dirname+'/../../Docs.html','utf8');
for(const section of ['overview','methodology','backlog','events','usecase-diagrams','usecase-full','gap-analysis','context-diagram','dfd','erd']) {
  assert(html.includes('id="'+section+'"'), 'Missing local section '+section);
}
const client=fs.readFileSync(__dirname+'/../../assets/google-doc-sync.js','utf8');
new vm.Script(client);
assert(client.includes(id));
assert(html.includes('window.GoogleDocSync.open()'));

// Exercise the actual client's whitespace/rich-text offsets without sending anything.
const clientContext=vm.createContext({window:{}});
vm.runInContext(client.replace('window.GoogleDocSync={ open };','window.GoogleDocSync={ open, normalizeRichText };'),clientContext);
const normalize=segments=>JSON.parse(JSON.stringify(clientContext.window.GoogleDocSync.normalizeRichText(segments)));
const rich=normalize([{text:'  Product\tVision.',bold:true},{text:'  A  plan. \n '},{text:'🧪 lab',italic:true}]);
assert.equal(rich.text,'Product Vision. A plan.\n🧪 lab');
assert.equal(rich.text.slice(rich.runs[0].start,rich.runs[0].end),'Product Vision.');
assert.equal(rich.text.slice(rich.runs.at(-1).start,rich.runs.at(-1).end),'🧪 lab');
assert.equal(rich.runs.at(-1).italic,true);
assert.equal(rich.runs.at(-1).end,rich.text.length);
assert.deepEqual(normalize([{text:' \n\t '}]),{text:'',runs:[]});
for(const value of [' a \n b ', 'x\t\t y','\n\n a \n\n b\n', ' 🧪 \t bold ', '\r\n a \r\n']) {
  assert.equal(normalize([{text:value}]).text,value.replace(/[\t ]+/g,' ').replace(/ *\n */g,'\n').trim());
}
const formattingPayload={...makePayload([{id:'overview',blocks:[{kind:'paragraph',...rich,role:'body'}]}]),version:2};
context.validatePayload_(formattingPayload);
for(const runs of [[{start:0,end:999,bold:true,italic:false}],
  [{start:1,end:3,bold:true,italic:false}], [{start:0,end:2,bold:'true',italic:false}], []]) {
  assert.throws(()=>context.validateRuns_(runs,'test'),/formatting/);
}
const tableBlock={kind:'table',rows:[['Title','Body']],cellStyles:[[
  {header:true,runs:[{start:0,end:5,bold:true,italic:false}]},
  {header:false,runs:[{start:0,end:4,bold:false,italic:false}]}
]]};
context.validatePayload_(makePayload([{id:'backlog',blocks:[tableBlock]}]));
assert.throws(()=>context.validatePayload_(makePayload([{id:'backlog',blocks:[{...tableBlock,cellStyles:[]}]}])),/table styles/);

// Mock only the Google methods used by formatting; check actual mutation helpers.
Object.assign(context.DocumentApp,{
  HorizontalAlignment:{JUSTIFY:'justify',CENTER:'center',LEFT:'left'},
  ParagraphHeading:{NORMAL:'normal',HEADING3:'h3'},
  Attribute:Object.fromEntries(['FONT_FAMILY','FONT_SIZE','FOREGROUND_COLOR','INDENT_START','INDENT_END',
    'INDENT_FIRST_LINE','LINE_SPACING','SPACING_BEFORE','SPACING_AFTER','BOLD','ITALIC'].map(name=>[name,name]))
});
function mockParagraph(value,attrs={},textAttrs={}) {
  const state={value,attrs:{...attrs},textAttrs:{...textAttrs},bold:[],italic:[],ranges:[],heading:'normal'};
  const text={
    getAttributes:()=>({...state.textAttrs}),
    setAttributes:(...args)=>{
      if(args.length===1) Object.assign(state.textAttrs,args[0]);
      else state.ranges.push(args);
      return text;
    },
    setBold:(...args)=>{state.bold.push(args);return text;},
    setItalic:(...args)=>{state.italic.push(args);return text;},
    setFontFamily:v=>{state.textAttrs.FONT_FAMILY=v;return text;},
    setFontSize:v=>{state.textAttrs.FONT_SIZE=v;return text;},
    setForegroundColor:v=>{state.textAttrs.FOREGROUND_COLOR=v;return text;},
    isBold:()=>false,isItalic:()=>false
  };
  const p={state,getText:()=>state.value,getAttributes:()=>({...state.attrs}),editAsText:()=>text,
    setText:v=>{state.value=v;return p;},
    appendText:v=>{state.value+=v;return text;},appendPageBreak:()=>{state.pageBreak=true;return {};},
    setAttributes:a=>{Object.assign(state.attrs,a);return p;},
    setHeading:v=>{state.heading=v;return p;},getHeading:()=>state.heading,
    setAlignment:v=>{state.attrs.alignment=v;return p;},
    setSpacingAfter:v=>{state.attrs.SPACING_AFTER=v;return p;},
    setIndentFirstLine:v=>{state.attrs.INDENT_FIRST_LINE=v;return p;},
    setIndentStart:v=>{state.attrs.INDENT_START=v;return p;},
    setIndentEnd:v=>{state.attrs.INDENT_END=v;return p;}
  };
  return p;
}
const template=mockParagraph('This is an existing normal paragraph in the Google Doc with the typography that should be retained.',
  {LINE_SPACING:1.5,INDENT_FIRST_LINE:36,SPACING_AFTER:0,PAGE_BREAK_BEFORE:true},
  {FONT_FAMILY:'Times New Roman',FONT_SIZE:12,FOREGROUND_COLOR:'#000000',BOLD:true});
const sample=context.bodyStyle_({getChild:()=>({getType:()=> 'p',asParagraph:()=>template})},0,1);
assert.equal(sample.text.FONT_SIZE,12);
assert.equal(sample.paragraph.LINE_SPACING,1.5);
assert.equal(sample.paragraph.PAGE_BREAK_BEFORE,undefined);
assert.equal(sample.text.BOLD,undefined);
const paragraphs=[];
const stageMock={appendParagraph:value=>{const p=mockParagraph(value);paragraphs.push(p);return p;}};
context.appendBlock_(stageMock,{kind:'paragraph',...rich},480,650,sample);
assert.equal(paragraphs[0].state.attrs.alignment,'justify');
assert.equal(paragraphs[0].state.attrs.INDENT_FIRST_LINE,36);
assert.equal(paragraphs[0].state.textAttrs.FONT_SIZE,11);
assert.deepEqual(paragraphs[0].state.bold[1],[0,rich.runs[0].end-1,true]);
context.appendBlock_(stageMock,{kind:'paragraph',text:'Caption',role:'caption'},480,650,sample);
assert.equal(paragraphs[1].state.attrs.alignment,'center');
assert.equal(paragraphs[1].state.attrs.INDENT_FIRST_LINE,0);
context.appendBlock_(stageMock,{kind:'heading',text:'Subheading',level:3},480,650,sample);
assert.equal(paragraphs[2].state.heading,'h3');
assert.equal(paragraphs[2].state.attrs.alignment,'left');
context.appendBlock_(stageMock,{kind:'paragraph',text:'Fallback body'},480,650,null);
assert.equal(paragraphs[3].state.attrs.alignment,'justify');
assert.equal(paragraphs[3].state.textAttrs.FONT_SIZE,11);
const cover=mockParagraph(oldTitle,{alignment:'center'},{FONT_SIZE:20,FONT_FAMILY:'Arial'});
context.updateTitle_(cover,title);
assert.equal(cover.state.value,title);
assert.equal(cover.state.attrs.alignment,'center');
assert.equal(cover.state.textAttrs.FONT_SIZE,11);
assert.deepEqual(cover.state.bold,[[true]]);
const cells=tableBlock.rows[0].map(value=>{
  const p=mockParagraph(value);return {p,editAsText:p.editAsText};
});
const baseTableText=mockParagraph('Title\nBody'), tableState={rowVisits:0,cellVisits:0};
const tableMock={
  setBorderColor:color=>{tableState.borderColor=color;return tableMock;},
  setBorderWidth:width=>{tableState.borderWidth=width;return tableMock;},
  editAsText:baseTableText.editAsText,
  getRow:()=>{tableState.rowVisits++;return {getCell:i=>{tableState.cellVisits++;return cells[i];}};}
};
context.appendBlock_({appendTable:()=>tableMock},tableBlock,480,650);
assert.equal(tableState.borderColor,'#000000');
assert.equal(tableState.borderWidth,0.5);
assert.equal(baseTableText.state.textAttrs.FOREGROUND_COLOR,'#000000');
assert.equal(baseTableText.state.textAttrs.FONT_SIZE,11);
assert.equal(baseTableText.state.textAttrs.BOLD,false);
assert.equal(baseTableText.state.textAttrs.ITALIC,false);
assert.deepEqual(JSON.parse(JSON.stringify(cells[0].p.state.ranges)),[[0,4,{BOLD:true,ITALIC:false}]]);
assert.deepEqual(cells[1].p.state.ranges,[]);
assert.equal(tableState.cellVisits,1,'Plain cells need no formatting calls');
const italicCell={...tableBlock,cellStyles:[[
  {header:true,runs:[{start:0,end:5,bold:true,italic:false}]},
  {header:false,runs:[{start:0,end:4,bold:false,italic:true}]}
]]};
context.appendBlock_({appendTable:()=>tableMock},italicCell,480,650);
assert.deepEqual(JSON.parse(JSON.stringify(cells[1].p.state.ranges)),[[0,3,{BOLD:false,ITALIC:true}]]);
context.appendBlock_({appendTable:()=>tableMock},{kind:'table',rows:[['Title','Body']]},480,650);
assert.deepEqual(cells[0].p.state.bold,[[true]],'Legacy payload retains bold header');
const visitsBefore=tableState.cellVisits;
context.appendBlock_({appendTable:()=>tableMock},{kind:'table',rows:[['','plain']],cellStyles:[[
  {header:false,runs:[]},{header:false,runs:[{start:0,end:5,bold:false,italic:false}]}
]]},480,650);
assert.equal(tableState.cellVisits,visitsBefore,'Empty/plain cells are skipped');
for(let i=1;i<=5;i++) {
  const png=fs.readFileSync(__dirname+'/../../assets/figures-v2/dfd-level2-compact/png/dfd-level2-p'+i+'.png');
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
}
const a4Bounds=context.imageBounds_({
  getPageWidth:()=>595.28,getPageHeight:()=>841.89,
  getMarginLeft:()=>51.02,getMarginRight:()=>51.02,
  getMarginTop:()=>56.69,getMarginBottom:()=>56.69
});
assert.equal(a4Bounds.width,657,'A4 usable width is converted from points to image pixels');
assert.equal(a4Bounds.height,918,'A4 image height keeps 40 pt for caption/spacing');
assert.throws(()=>context.imageBounds_({
  getPageWidth:()=>0,getPageHeight:()=>0,getMarginLeft:()=>0,getMarginRight:()=>0,getMarginTop:()=>0,getMarginBottom:()=>0
}),/valid page dimensions/);
context.appendBlock_(stageMock,{kind:'heading',text:'New heading',level:3,pageBreakBefore:true},480,650,null);
assert.equal(paragraphs.at(-1).state.pageBreak,true);
assert.equal(paragraphs.at(-1).state.value,'New heading');
assert.equal(paragraphs[2].state.textAttrs.FONT_SIZE,11);
const footer=mockParagraph('Page number',{}, {FONT_SIZE:9}),header=mockParagraph('Header',{}, {FONT_SIZE:14});
context.normalizeFont_({getBody:()=>cover,getHeader:()=>header,getFooter:()=>footer});
for(const p of [cover,header,footer])assert.equal(p.state.textAttrs.FONT_SIZE,11);
context.normalizeFont_({getBody:()=>cover,getHeader:()=>null,getFooter:()=>null});
const addedPayload={...makePayload(['erd','activity-diagrams','swimlane-diagram'].map(id=>({id,blocks:[{kind:'heading',text:'Figure heading',level:3,pageBreakBefore:true}]}))),version:3};
context.validatePayload_(addedPayload);
const additions=context.planSections_(bodyOf(text),addedPayload).sections;
assert.equal(additions[0].end,text.length);
for(const p of additions.slice(1)){assert.equal(p.create,true);assert.equal(p.start,text.length);assert.equal(p.end,text.length);}
const withNew=[...text,'2.3.4 Activity Diagrams','Old activities','2.3.5 Swimlane Diagram','Old swimlane'];
const replacement=context.planSections_(bodyOf(withNew),addedPayload).sections;
assert.equal(replacement[0].end,text.length);
assert.equal(replacement[1].start,text.length);assert.equal(replacement[1].end,text.length+2);
assert.equal(replacement[2].create,undefined);
assert.throws(()=>context.planSections_(bodyOf([...withNew,'2.3.4 Activity Diagrams']),addedPayload),/uniquely/);
assert.throws(()=>context.planSections_(bodyOf(text.slice(0,-2)),addedPayload),/locate/);
assert.throws(()=>context.validatePayload_({...addedPayload,sections:[{id:'activity-diagrams',blocks:[{kind:'paragraph',text:'invalid',pageBreakBefore:true}]}]}),/page break/);
console.log('Sync contract checks passed: 12 sections, safe missing-section plans, page breaks, uniform 11 pt, preserved emphasis, image units and local assets.');
