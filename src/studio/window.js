import {$} from './utils.js';
let trail=[],renderRoute,focusBefore=null,position={x:0,y:0},drag=null;
export function configureWindow(renderer){renderRoute=renderer;}
export function currentRoute(){return trail.at(-1);}
export function open(route,replace=false){
 if(!$('#workspace-window').open)focusBefore=document.activeElement;
 if(replace&&trail.length)trail[trail.length-1]=route;else trail.push(route);
 $('#workspace-window').classList.remove('minimized');$('#restore').hidden=true;
 renderRoute(route);$('#window-back').disabled=trail.length<2;
 if(!$('#workspace-window').open){$('#workspace-window').showModal();position={x:0,y:0};$('#workspace-window').style.transform='';}
 $('#window-close').focus();
}
export function redraw(){if(trail.length)renderRoute(trail.at(-1));}
function resetBrowserControls(){const controls=$('#browser-controls');controls.hidden=true;$('#browser-origin').hidden=true;$('#browser-origin').textContent='';$('#browser-reload').onclick=null;$('#browser-separate').onclick=null;}
export function close(){document.dispatchEvent(new Event('studio:windowclose'));resetBrowserControls();$('#workspace-window').close();$('#window-body').replaceChildren();$('#restore').hidden=true;trail=[];focusBefore?.focus();}
export function initWindow(){
 const win=$('#workspace-window'),bar=$('#titlebar');
 $('#window-close').onclick=close;
 $('#window-back').onclick=()=>{if(trail.length>1){trail.pop();renderRoute(trail.at(-1));$('#window-back').disabled=trail.length<2;}};
 const maximize=()=>{win.classList.toggle('maximized');position={x:0,y:0};win.style.transform='';$('#window-expand').setAttribute('aria-pressed',String(win.classList.contains('maximized')));};
 $('#window-expand').onclick=maximize;bar.ondblclick=e=>{if(!e.target.closest('button'))maximize();};
 $('#window-minimize').onclick=()=>{win.close();$('#restore').hidden=false;$('#restore-label').textContent=$('#window-title').textContent;$('#restore').focus();document.dispatchEvent(new Event('studio:windowclose'));};
 $('#restore').onclick=()=>{win.showModal();$('#restore').hidden=true;if(currentRoute()?.view==='physics')redraw();$('#window-close').focus();};
 win.addEventListener('cancel',e=>{e.preventDefault();close();});
 win.addEventListener('click',event=>{if(event.target===win&&!drag)close();});
 bar.onpointerdown=e=>{if(e.target.closest('button,input')||innerWidth<700||win.classList.contains('maximized'))return;drag={x:e.clientX,y:e.clientY,start:{...position},rect:win.getBoundingClientRect()};bar.setPointerCapture(e.pointerId);};
 bar.onpointermove=e=>{if(!drag)return;const dx=Math.max(12-drag.rect.left,Math.min(innerWidth-12-drag.rect.right,e.clientX-drag.x));const dy=Math.max(48-drag.rect.top,Math.min(innerHeight-60-drag.rect.top,e.clientY-drag.y));position={x:drag.start.x+dx,y:drag.start.y+dy};win.style.transform=`translate(${position.x}px,${position.y}px)`;};
 bar.onpointerup=bar.onpointercancel=()=>drag=null;
 window.addEventListener('resize',()=>{position={x:0,y:0};win.style.transform='';});
}
export function content(title,html){$('#workspace-window').classList.remove('browser-window');resetBrowserControls();document.dispatchEvent(new Event('studio:windowclose'));$('#window-title').textContent=title;$('#window-body').innerHTML=html;$('#window-body').scrollTop=0;}
