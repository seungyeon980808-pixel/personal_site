import {$} from './utils.js';

let home;
export function resizeScreen(){
 const viewport=$('.screen-viewport'),content=$('.screen-content');
 content.style.width=`${innerWidth}px`;content.style.height=`${innerHeight}px`;
 const body=getComputedStyle(document.body),size=getComputedStyle(viewport);
 content.style.font=body.font;content.style.lineHeight=String(parseFloat(body.lineHeight)/parseFloat(body.fontSize));content.style.color=body.color;
 content.style.transform=`scale(${parseFloat(size.width)/innerWidth},${parseFloat(size.height)/innerHeight})`;
}
export function mountDesktop(){
 const desktop=$('#desktop');
 if(!home){home=document.createElement('span');home.hidden=true;desktop.before(home);}
 $('.screen-content').append(desktop);desktop.hidden=false;desktop.inert=true;resizeScreen();
}
export function releaseDesktop(){
 if(home)home.after($('#desktop'));
 $('#desktop').hidden=false;$('#desktop').inert=false;
}
