import {plain} from './utils.js';

const text=(value,max)=>typeof value==='string'&&value.length<=max;

function normalizeStep(step={}){
 return {programId:String(step.programId??''),role:plain(step.role)};
}

export function normalizeWorkflowOverrides(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return {};
 return Object.fromEntries(Object.entries(raw).map(([id,item])=>[id,{
  name:plain(item?.name),tag:plain(item?.tag),desc:plain(item?.desc),problem:plain(item?.problem),outcome:plain(item?.outcome),
  steps:(Array.isArray(item?.steps)?item.steps:[]).map(normalizeStep)
 }]));
}

export function validateWorkflowOverrides(raw){
 const overrides=normalizeWorkflowOverrides(raw);
 if(Object.keys(overrides).length>100)throw Error('프로젝트 편집 수가 허용 범위를 벗어났습니다.');
 for(const [id,item] of Object.entries(overrides)){
  if(!text(id,100)||!id||!text(item.name,160)||!item.name.trim()||!text(item.tag,80)||!item.tag.trim()||!text(item.desc,10000)||!text(item.problem,10000)||!text(item.outcome,10000)||item.steps.length>20)throw Error('프로젝트 개요와 분야를 확인해주세요.');
  for(const step of item.steps)if(!text(step.programId,100)||!step.programId||!text(step.role,1000)||!step.role.trim())throw Error('프로젝트 단계의 프로그램과 역할을 확인해주세요.');
 }
 return structuredClone(overrides);
}

export function resolvedWorkflows(base=[],overrides={}){
 return base.map(item=>({
  ...item,
  ...(overrides[item.id]||{}),
  id:item.id,
  steps:(overrides[item.id]?.steps||item.steps||[]).map(normalizeStep)
 }));
}
