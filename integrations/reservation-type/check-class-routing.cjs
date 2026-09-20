const assert=require('node:assert/strict');
const {prepare}=require('../../assets/reservation-type.js');
// Catch accidental account-level routing, unauthorized classes and stale members.
const account={role:'Class Representative',account_id:'rep',student_id:'s1',assigned_classes:[
 {group_id:'physics',faculty_id:'faculty-physics',student_ids:['s1','s2'],active:true},
 {group_id:'circuits',faculty_id:'faculty-circuits',student_ids:['s1','s3'],active:true},
 {group_id:'old',faculty_id:'old-faculty',student_ids:['s1'],active:false}
]};
for(const schedule_type of ['ON_SCHEDULE','OUT_OF_SCHEDULE']){
 for(const [group_id,faculty_id] of [['physics','faculty-physics'],['circuits','faculty-circuits']]){
  const student_id=group_id==='physics'?'s2':'s3';
  const result=prepare({schedule_type,group_id,reservation_type:'STUDENT_ONLY',student_id,faculty_id:'forged',student_ids:['outside']},account);
  assert.equal(result.group_id,group_id);assert.equal(result.faculty_id,faculty_id);
  assert.equal(result.requester_id,'rep');assert.deepEqual(result.student_ids,[student_id]);
  assert.deepEqual(result.approval_route,schedule_type==='ON_SCHEDULE'?['Faculty']:['Faculty','Dean']);
 }
 for(const group_id of [undefined,'','outside','old'])assert.throws(()=>prepare({schedule_type,group_id,reservation_type:'STUDENT_ONLY'},account),/assigned class/);
 assert.throws(()=>prepare({schedule_type,group_id:'circuits',reservation_type:'GROUP',student_ids:['s2']},account),/assigned class/);
 assert.deepEqual(prepare({schedule_type,group_id:'circuits',reservation_type:'GROUP',student_ids:['s1','s3']},account).student_ids,['s1','s3']);
 for(const student_id of [undefined,'','outside','s2'])assert.throws(()=>prepare({schedule_type,group_id:'circuits',reservation_type:'STUDENT_ONLY',student_id},account),/student/);
 assert.deepEqual(prepare({schedule_type,group_id:'circuits',reservation_type:'STUDENT_ONLY',student_id:'s1'},account).student_ids,['s1']);
}
console.log('PASS: one account, two class-specific Faculty reviewers; unauthorized/inactive classes and stale members rejected.');
