/* Print-page assignments only. Canonical entities and FK definitions stay in model.js. */
(function(root){
 const sheets=[
  {id:'identity',code:'A1',title:'Accounts, Classes and Q&A',columns:[
   ['STUDENT','USER_ACCOUNT','CLASS_GROUP'],['GROUP_MEMBER','CHAT_EXCHANGE','KNOWLEDGE_ARTICLE']
  ],note:'KNOWLEDGE_ARTICLE has no declared FK. Ordinary students do not need login accounts.'},
  {id:'requests',code:'A2',title:'Reservations and Approvals',columns:[
   ['RESERVATION','REQUEST_REVISION'],['APPROVAL','REQUEST_ITEM','REQUEST_MEMBER']
  ],note:'Each revision has zero or one approval. The selected Faculty or Dean makes the final decision.'},
  {id:'inventory',code:'A3',title:'Inventory and Disposal',columns:[
   ['ITEM_CATEGORY','ITEM'],['STOCK_MOVEMENT','DISPOSAL']
  ],note:'Stock movements retain their issue, return or disposal source. Lost items are not physical waste.'},
  {id:'borrowing',code:'A4',title:'Borrowing and Returns',columns:[
   ['BORROWING','BORROWING_ITEM'],['BORROWING_MEMBER','RETURN_ENTRY']
  ],note:'Requested and issued quantities remain separate. Return entries preserve partial-return history.'},
  {id:'schedule',code:'A5',title:'Laboratories and Schedules',columns:[
   ['TERM','SCHEDULE_BLOCK'],['LABORATORY']
  ],note:'Schedule blocks contain planned or vacant time slots, not completed usage.'},
  {id:'administration',code:'A6',title:'Usage, Daily Tasks and Clearance',columns:[
   ['USAGE_LOG','DAILY_TASK'],['CLEARANCE']
  ],note:'Completed USAGE_LOG records supply the End-Term Report. Daily tasks and clearance remain separate.'}
 ];
 sheets.forEach((s,i)=>{s.main=s.columns.flat();s.printPage=i+2;});
 const model={sheets,width:760,height:1094,selectedRelationships:['R13','R17','R23','R25','R29','R45']};
 root.LabErdPrintModel=model;if(typeof module!=='undefined')module.exports=model;
})(typeof window==='undefined'?globalThis:window);
