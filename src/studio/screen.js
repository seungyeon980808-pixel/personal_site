import {$} from './utils.js';

import {placePhoneScreen} from './phone-motion.js';
import {restorePage} from './pages.js';
let home;
export function resizeScreen(){
 const viewport=$('.screen-viewport'),content=$('.screen-content');
 if(matchMedia('(max-width:700px)').matches){placePhoneScreen(viewport);viewport.append($('.screen-notch'));}
 else {$('#notebook-lid').append(viewport,$('.screen-notch'));viewport.style.removeProperty('width');viewport.style.removeProperty('height');viewport.style.removeProperty('transform');}
 content.style.width=`${innerWidth}px`;content.style.height=`${innerHeight}px`;
 const body=getComputedStyle(document.body),size=getComputedStyle(viewport);
 content.style.font=body.font;content.style.lineHeight=String(parseFloat(body.lineHeight)/parseFloat(body.fontSize));content.style.color=body.color;
 const width=parseFloat(size.width),height=parseFloat(size.height),scale=Math.max(width/innerWidth,height/innerHeight);
 content.style.transform=`translate(${(width-innerWidth*scale)/2}px,${(height-innerHeight*scale)/2}px) scale(${scale})`;
}
export function mountDesktop(){
 const desktop=$('#desktop');
 if(!home){home=document.createElement('span');home.hidden=true;desktop.before(home);}
 $('.screen-content').append(desktop);desktop.hidden=false;desktop.inert=true;resizeScreen();restorePage();
}
export function releaseDesktop(){
 if(home)home.after($('#desktop'));
 $('#desktop').hidden=false;$('#desktop').inert=false;restorePage();
}
