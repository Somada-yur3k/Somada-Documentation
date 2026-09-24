document.getElementById('erd-zoom').addEventListener('change',event=>{
 const zoom=Number(event.target.value);document.querySelectorAll('.erd-sheet').forEach(sheet=>{sheet.style.width=(210*zoom)+'mm';sheet.style.height=(297*zoom)+'mm';});
});
