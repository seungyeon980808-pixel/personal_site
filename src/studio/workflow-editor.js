import {escape as e,toast} from './utils.js';
import {update,state} from './store.js';
import {open} from './window.js';

const field=(name,label,value='',kind='input',max=10000)=>`<label>${label}${kind==='textarea'?`<textarea name="${name}" maxlength="${max}">${e(value)}</textarea>`:`<input name="${name}" value="${e(value)}" maxlength="${max}" required>`}</label>`;

export function workflowEditor(workflow,programs){
 const options=programs.map(program=>`<option value="${e(program.id)}">${e(program.label)}</option>`).join('');
 const steps=(workflow.steps||[]).map((step,index)=>`<fieldset class="workflow-step"><legend>단계 ${index+1}</legend><label>프로그램<select name="step-program">${options.replace(`value="${e(step.programId)}"`,`value="${e(step.programId)}" selected`)}</select></label>${field('step-role','역할',step.role,'textarea',1000)}<button type="button" class="text admin-only" data-remove-step>단계 삭제</button></fieldset>`).join('');
 return `${field('tag','분야',workflow.tag,'input',80)}${field('name','프로젝트 이름',workflow.name,'input',160)}${field('desc','개요',workflow.desc,'textarea')}${field('problem','해결하려는 문제',workflow.problem,'textarea')}<div id="workflow-steps">${steps}</div><button type="button" class="secondary admin-only" id="add-workflow-step">단계 추가</button>${field('outcome','현재 메모 · 결과',workflow.outcome,'textarea')}<div class="actions"><button class="primary admin-only">초안 저장</button><button type="button" class="danger admin-only" id="reset-workflow">기본값으로 되돌리기</button></div><p id="form-error" role="alert"></p>`;
}

export function bindWorkflowEditor(form,workflow,programs,route){
 const addStep=values=>{
  const fieldset=document.createElement('fieldset');fieldset.className='workflow-step';fieldset.innerHTML=`<legend>새 단계</legend><label>프로그램<select name="step-program">${programs.map(program=>`<option value="${e(program.id)}" ${values?.programId===program.id?'selected':''}>${e(program.label)}</option>`).join('')}</select></label>${field('step-role','역할',values?.role||'','textarea',1000)}<button type="button" class="text" data-remove-step>단계 삭제</button>`;
  fieldset.querySelector('[data-remove-step]').classList.add('admin-only');fieldset.querySelector('[data-remove-step]').onclick=()=>fieldset.remove();form.querySelector('#workflow-steps').append(fieldset);
 };
 form.querySelectorAll('[data-remove-step]').forEach(button=>button.onclick=()=>button.closest('fieldset').remove());
 form.querySelector('#add-workflow-step').onclick=()=>addStep();
 form.onsubmit=event=>{
  event.preventDefault();const data=new FormData(form),programIds=data.getAll('step-program'),roles=data.getAll('step-role'),next=structuredClone(state.workspace);
  next.workflowOverrides[workflow.id]={name:String(data.get('name')||'').trim(),tag:String(data.get('tag')||'').trim(),desc:String(data.get('desc')||'').trim(),problem:String(data.get('problem')||'').trim(),outcome:String(data.get('outcome')||'').trim(),steps:programIds.map((programId,index)=>({programId:String(programId),role:String(roles[index]||'').trim()}))};
  try{update(next);open({...route,view:'admin',tab:'workflows',id:workflow.id},true);toast('프로젝트 초안을 저장했습니다.');}catch(error){form.querySelector('#form-error').textContent=error.message;}
 };
 form.querySelector('#reset-workflow').onclick=()=>{
  if(!confirm('이 프로젝트의 편집 내용을 지우고 기본 내용으로 되돌릴까요?'))return;
  const next=structuredClone(state.workspace);delete next.workflowOverrides[workflow.id];
  try{update(next);open({...route,view:'admin',tab:'workflows',id:workflow.id},true);toast('기본 프로젝트 내용으로 되돌렸습니다.');}catch(error){form.querySelector('#form-error').textContent=error.message;}
 };
}
