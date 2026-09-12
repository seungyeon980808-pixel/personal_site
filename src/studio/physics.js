import {$} from './utils.js';
import {content} from './window.js';
let frame;
export function physics(){
 content('물리 놀이터',`<div class="page"><p class="eyebrow">A LITTLE PHYSICS</p><h1>천천히, 흔들리는 진자</h1><p class="muted">줄의 길이를 바꿔보세요. 길어질수록 한 번 왕복하는 시간이 늘어납니다.</p><div class="physics-stage"><svg id="pendulum" viewBox="0 0 600 300" role="img" aria-label="길이에 따라 움직이는 단진자"><path d="M200 30h200" stroke="#526478" stroke-width="3"/><g id="pendulum-arm"><path id="rope" d="M300 30v180" stroke="#526478" stroke-width="2"/><circle id="bob" cx="300" cy="210" r="22" fill="#0869df"/></g></svg></div><div class="physics-controls"><label for="length">줄의 길이 <output id="length-value">1.00 m</output></label><input id="length" type="range" min="25" max="200" value="100"><strong id="period">주기 약 2.01초</strong><button id="pause" class="secondary">일시정지</button></div><p class="muted">작은 진폭 · 중력가속도 9.81 m/s². 움직임 줄이기 설정에서는 정지된 상태로 시작합니다.</p><a href="classic.html#demoSection">중력 궤도·포물선 실험도 열어보기 ↗</a></div>`);
 let length=1,running=!matchMedia('(prefers-reduced-motion: reduce)').matches,t=0,last=0;
 function paint(time){if(last&&running)t+=(time-last)/1000;last=time;const angle=20*Math.cos(Math.sqrt(9.81/length)*t);$('#pendulum-arm')?.setAttribute('transform',`rotate(${angle} 300 30)`);if(running)frame=requestAnimationFrame(paint);}
 const label=()=>$('#pause').textContent=running?'일시정지':'재생';label();paint(0);
 $('#pause').onclick=()=>{running=!running;label();cancelAnimationFrame(frame);last=0;if(running)frame=requestAnimationFrame(paint);};
 $('#length').oninput=event=>{length=Number(event.target.value)/100;$('#length-value').textContent=`${length.toFixed(2)} m`;$('#period').textContent=`주기 약 ${(2*Math.PI*Math.sqrt(length/9.81)).toFixed(2)}초`;const h=90+length*65;$('#rope').setAttribute('d',`M300 30v${h}`);$('#bob').setAttribute('cy',30+h);if(!running)paint(0);};
}
document.addEventListener('studio:windowclose',()=>cancelAnimationFrame(frame));
