/* Reservation contract shared by the interactive form preview and its tests.
 * No backend exists in this documentation repository. Use the same checks
 * server-side before a future reservation/hold transaction is committed. */
(function(root){
 'use strict';
 function prepare(input,account){
  if(!['Class Representative','Faculty'].includes(account.role))throw Error('This account cannot submit reservations.');
  if(!['ON_SCHEDULE','OUT_OF_SCHEDULE'].includes(input.schedule_type))throw Error('Choose a Schedule Type.');
  const record={schedule_type:input.schedule_type,requester_id:account.account_id,group_id:account.group_id};
  if(account.role==='Class Representative'){
   if(!['GROUP','STUDENT_ONLY'].includes(input.reservation_type))throw Error('Select a Reservation Type before submitting.');
   record.reservation_type=input.reservation_type;
   if(input.reservation_type==='STUDENT_ONLY'){
    if(!account.student_id)throw Error('The account needs its existing student identity.');
    record.student_ids=[account.student_id];
   }else{
    const selected=[...new Set(input.student_ids||[])];
    if(!selected.length)throw Error('Confirm the existing group/member information.');
    if(selected.some(id=>!account.group_student_ids.includes(id)))throw Error('Members must belong to the assigned class.');
    record.student_ids=selected;
   }
   record.approval_route=input.schedule_type==='ON_SCHEDULE'?['Faculty']:['Faculty','Dean'];
  }else{
   record.reservation_type=null;
   record.student_ids=[...new Set(input.student_ids||[])];
   record.approval_route=input.schedule_type==='ON_SCHEDULE'?[]:['Dean'];
  }
  return record;
 }
 root.ReservationType={prepare};if(typeof module!=='undefined')module.exports=root.ReservationType;
})(typeof window==='undefined'?globalThis:window);
