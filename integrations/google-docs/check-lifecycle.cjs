// Offline lifecycle/section-replacement regression checks. Never contacts Google.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync(__dirname + '/Code.gs','utf8');
const targetId = '1UfFa6G0eWenSY_KjokZoOHqrQ2ajKGVgIwU56dkjpzY';
const seed = ['Cover','I. Project Overview','Original introduction','II. Methodology','Keep this methodology',
  'III. Requirements Analysis','3.1.1 Product Backlog','Old backlog','3.1.2 Event Tables','Keep these events',
  '3.1.3 Use Case Diagrams','Old use case image','3.1.4 Use Case Full Description','Keep use case tables',
  '3.1.5 Gap Analysis','Keep gap analysis','3.1.6 Context Diagram','Keep context image',
  '3.1.7 Data Flow Diagrams','Old DFD images','3.1.8 Entity-Relationship Diagram','Old ERD','References','Preserved bibliography'];
const payload = {version:2,documentId:targetId,title:null,sections:[
  {id:'overview',blocks:[{kind:'paragraph',text:'New introduction'}]},
  {id:'backlog',blocks:[{kind:'table',rows:[['Header','New backlog']]}]},
  {id:'usecase-diagrams',blocks:[{kind:'image',data:'iVBORw0KGgoAAA==',width:10,height:10,caption:'New use case image'}]},
  {id:'dfd',blocks:[{kind:'paragraph',text:'New DFD images'}]},
  {id:'erd',blocks:[{kind:'table',rows:[['New ERD table']]}]}
]};

function simulate(options={}) {
  const events=[], targetData=(options.seed||seed).map(text=>({type:'p',text}));
  let stage, opens=0, released=false, backedUp=null, insertCount=0;
  function element(data,owner) {
    function check() { if(owner.closed) throw new Error('Document is closed; its contents cannot be updated.'); }
    const item={data,
      getType(){check();return data.type;},
      asParagraph(){check();return item;},asTable(){check();return item;},
      getText(){check();return data.text;},
      copy(){check();events.push('copy:'+owner.name);return element({...data},owner);}
    };
    return item;
  }
  function document(name,data) {
    const owner={name,closed:false};
    const check=()=>{ if(owner.closed) throw new Error('Document is closed; its contents cannot be updated.'); };
    const body={
      getText:()=>data.map(d=>d.text).join('\n'),
      editAsText:()=>({setFontSize(size){assert.equal(size,11);events.push('font:11');},setForegroundColor(color){assert.equal(color,'#000000');events.push('color:black');}}),
      getNumChildren(){check();return data.length;},
      getChild(i){check();assert(data[i],'Valid child index '+i);return element(data[i],owner);},
      getPageWidth:()=>595,getMarginLeft:()=>51,getMarginRight:()=>51,
      getPageHeight:()=>842,getMarginTop:()=>57,getMarginBottom:()=>57,
      appendParagraph(text){check();const d={type:'p',text};data.push(d);return element(d,owner);},
      removeChild(item){check();events.push('remove:'+item.data.text);data.splice(data.indexOf(item.data),1);},
      insertParagraph(i,item){return insert(i,item);},insertTable(i,item){return insert(i,item);},
      appendPrepared(block){
        check();data.push({type:block.kind==='table'?'t':'p',text:block.text||block.caption||block.rows.flat().join('|')});
      }
    };
    function insert(i,item) {
      check();item.getType(); // Source handle must also be live during insertion.
      if (++insertCount===options.failInsert) throw new Error('Injected insertion error');
      assert(backedUp,'Backup must exist before mutation');
      events.push('insert:'+item.data.text);data.splice(i,0,{...item.data});
    }
    return {owner,body,
      getId:()=>name==='stage'?'stage-id':targetId,
      getTabs:()=>[{asDocumentTab:()=>({getBody:()=>{check();return body;},getHeader:()=>null,getFooter:()=>null})}],
      getBody:()=>body,
      saveAndClose(){check();events.push('close:'+name);owner.closed=true;if(name==='stage'&&options.cleanupFailure)throw new Error('Cleanup failed');}
    };
  }
  const initial=document('target-initial',targetData);
  const lock={tryLock:()=>true,hasLock:()=>!released,releaseLock(){released=true;events.push('unlock');}};
  const context=vm.createContext({
    console:{error(){},warn(){}},
    DocumentApp:{ElementType:{PARAGRAPH:'p',TABLE:'t'},
      openById(id){assert.equal(id,targetId);opens++;events.push('open:target');return opens===1?initial:document('target-write',targetData);},
      create(){events.push('create:stage');stage=document('stage',[]);return stage;}
    },
    LockService:{getScriptLock:()=>lock},
    PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'test-only-key'})},
    DriveApp:{getFileById(id){return id==='stage-id'?{setTrashed(){events.push('trash:stage');}}:{
      getLastUpdated:()=>new Date(options.changed && opens>1?200:100),getName:()=> 'Target',
      makeCopy(){backedUp=targetData.map(x=>({...x}));events.push('backup');return{getUrl:()=> 'https://example.test/backup'};}
    };}}
  });
  vm.runInContext(options.earlyClose?code.replace("phase = 'reopening and checking the target';","stage.saveAndClose(); phase = 'reopening and checking the target';"):code,context);
  // Formatting has its own tests. Exercise the real doPost and replaceSection_.
  context.bodyStyle_=()=>null;
  context.appendBlock_=(body,block)=>{if(options.badPreparation)throw new Error('Bad image');body.appendPrepared(block);};
  context.page_=(title,message,backupUrl)=>({title,message,backupUrl});
  const result=context.doPost({parameter:{syncKey:'test-only-key',payload:JSON.stringify(options.payload||payload)}});
  assert(released,'Lock is released on every result');
  assert(events.includes('trash:stage'),'Preparation is cleaned up');
  return {result,events,data:targetData.map(x=>x.text),backedUp,opens};
}

const ok=simulate();
assert.equal(ok.result.title,'Google Doc updated');
assert.equal(ok.opens,2,'Reacquire target body before writes');
assert(ok.events.indexOf('close:stage')>ok.events.indexOf('close:target-write'),'Keep source live until target is saved');
assert.deepEqual(ok.backedUp.map(x=>x.text),seed,'Backup contains original content');
assert(ok.data.includes('New introduction') && ok.data.includes('Header|New backlog') && ok.data.includes('New use case image'));
assert(!ok.data.includes('Old use case image') && !ok.data.includes('Old DFD images'));
assert(ok.data.includes('Keep this methodology') && ok.data.includes('Keep these events'));
assert.equal(ok.data.at(-1),'Preserved bibliography','References survive updates to the final diagram');
for(const value of ['Original introduction','Old backlog','Old use case image','Old DFD images','Old ERD']) {
  const removal=ok.events.indexOf('remove:'+value);
  assert(removal>0 && ok.events[removal-1].startsWith('insert:'),'Insert replacement before deleting original');
}
const closed=simulate({earlyClose:true});
assert.match(closed.result.message,/Document is closed/,'Reproduce the old closed-source failure');
assert.deepEqual(closed.data,seed,'Closed-source preflight does not remove originals');
const failed=simulate({failInsert:2});
assert.match(failed.result.title,/interrupted/);
assert(failed.data.includes('Old DFD images'),'A failed section insertion preserves its old content');
assert(failed.result.backupUrl,'Partial update links to backup');
for(const options of [{changed:true},{badPreparation:true}]) {
  const test=simulate(options);
  assert.equal(test.result.title,'Update not applied');
  assert.deepEqual(test.data,seed);
  assert.equal(test.backedUp,null);
}
assert.equal(simulate({cleanupFailure:true}).result.title,'Google Doc updated','Cleanup failure must not misreport a saved update');
assert(ok.events.includes('font:11'),'Uniform font is applied after the backup');
const supplements={version:3,documentId:targetId,title:null,sections:[
 {id:'swimlane-diagram',blocks:[{kind:'paragraph',text:'New whole-system swimlane'}]},
 {id:'activity-diagrams',blocks:[{kind:'paragraph',text:'New five activities'}]},
 {id:'erd',blocks:[{kind:'paragraph',text:'New ERD'}]}
]};
const created=simulate({payload:supplements});
assert.equal(created.result.title,'Google Doc updated');
assert(created.data.indexOf('3.1.8 Entity-Relationship Diagram')<created.data.indexOf('2.3.4 Activity Diagrams'));
assert(created.data.indexOf('2.3.4 Activity Diagrams')<created.data.indexOf('2.3.5 Swimlane Diagram'));
for(const value of ['New ERD','New five activities','New whole-system swimlane'])assert(created.data.includes(value));
assert(!created.data.includes('Old ERD'));assert(created.data.includes('Old DFD images'),'Unselected DFD remains');
const repeated=simulate({seed:created.data,payload:supplements});
assert.equal(repeated.result.title,'Google Doc updated');
for(const value of ['2.3.4 Activity Diagrams','2.3.5 Swimlane Diagram','New five activities','New whole-system swimlane'])assert.equal(repeated.data.filter(t=>t===value).length,1,'No duplicated '+value);
const onlyActivity=simulate({payload:{...supplements,sections:supplements.sections.filter(s=>s.id==='activity-diagrams')}});
assert(!onlyActivity.data.includes('2.3.5 Swimlane Diagram'),'Only selected missing sections are created');
assert(onlyActivity.data.includes('Old ERD'),'Creating a new section does not delete ERD');
const onlySwim=simulate({seed:onlyActivity.data,payload:{...supplements,sections:supplements.sections.filter(s=>s.id==='swimlane-diagram')}});
assert.equal(onlySwim.result.title,'Google Doc updated');assert(onlySwim.data.includes('New five activities'));
console.log('Lifecycle checks passed: safe creation/order/idempotency of new sections, closed-source regression, fresh target, backups, insert-before-delete, failures, 11 pt and cleanup.');
