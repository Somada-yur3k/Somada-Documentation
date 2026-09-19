// Read-only deterministic placement experiment. Prints columns; never mutates schema.
const model=require('../../assets/erd/model.js');
const byName=new Map(model.tables.map(t=>[t.name,t]));
const edges=model.tables.flatMap(t=>t.fields.filter(f=>f.ref).map(f=>({a:f.ref.table,b:t.name,row:t.fields.indexOf(f)})));
let state=932421;const rnd=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
const initial=[['TERM','CLASS_GROUP','GROUP_MEMBER','STUDENT','REQUEST_MEMBER','BORROWING_MEMBER','CLEARANCE'],['SCHEDULE_BLOCK','RESERVATION','REQUEST_REVISION','APPROVAL','BORROWING','RETURN_ENTRY'],['LABORATORY','USER_ACCOUNT','REQUEST_ITEM','BORROWING_ITEM','USAGE_LOG','CHAT_EXCHANGE'],['ITEM_CATEGORY','ITEM','STOCK_MOVEMENT','DISPOSAL','DAILY_TASK','KNOWLEDGE_ARTICLE']];
function score(cols){
 const p=new Map();let over=0;
 cols.forEach((names,c)=>{let y=100;for(const n of names){p.set(n,{x:55+c*355,y});y+=28+byName.get(n).fields.length*20+90;}over+=Math.max(0,y-1900)*100;});
 const segs=edges.map(e=>{const a=p.get(e.a),b=p.get(e.b),right=a.x<b.x;return {...e,x1:a.x+(right?230:0),y1:a.y+38,x2:b.x+(right?0:230),y2:b.y+38+e.row*20};});
 let cost=over;
 for(const s of segs)cost+=Math.abs(s.x1-s.x2)+Math.abs(s.y1-s.y2)*1.3;
 const orient=(x1,y1,x2,y2,x3,y3)=>(x2-x1)*(y3-y1)-(y2-y1)*(x3-x1);
 for(let i=0;i<segs.length;i++)for(let j=i+1;j<segs.length;j++){
  const a=segs[i],b=segs[j];if(a.a===b.a||a.a===b.b||a.b===b.a||a.b===b.b)continue;
  if(orient(a.x1,a.y1,a.x2,a.y2,b.x1,b.y1)*orient(a.x1,a.y1,a.x2,a.y2,b.x2,b.y2)<0&&orient(b.x1,b.y1,b.x2,b.y2,a.x1,a.y1)*orient(b.x1,b.y1,b.x2,b.y2,a.x2,a.y2)<0)cost+=160;
 }
 const kb=p.get('KNOWLEDGE_ARTICLE');cost+=(1350-kb.x)+(1700-kb.y);
 return cost;
}
let best=initial.map(a=>a.slice()),bestScore=score(best);
for(let restart=0;restart<4;restart++){
 let current=best.map(a=>a.slice()),value=score(current);
 for(let i=0;i<15000;i++){
  const a=Math.floor(rnd()*4),b=Math.floor(rnd()*4),x=Math.floor(rnd()*current[a].length),y=Math.floor(rnd()*current[b].length);
  [current[a][x],current[b][y]]=[current[b][y],current[a][x]];
  const next=score(current),temperature=700*Math.pow(1-i/15000,2)+2;
  if(next<value||rnd()<Math.exp((value-next)/temperature)){value=next;if(value<bestScore){bestScore=value;best=current.map(a=>a.slice());}}
  else [current[a][x],current[b][y]]=[current[b][y],current[a][x]];
 }
}
console.log(JSON.stringify({initialScore:score(initial),bestScore,columns:best},null,2));
