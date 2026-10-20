export function initHammer(){
 const asset='./hammer-cutout.png';
 const tool=document.createElement('button');tool.className='hammer-tool';tool.setAttribute('aria-label','망치 모드 · 더블클릭으로 시작');tool.innerHTML=`<img src="${asset}" alt="망치"><span>망치</span><small>더블클릭</small>`;document.body.append(tool);
 const cursor=document.createElement('img');cursor.src=asset;cursor.alt='';cursor.className='hammer-cursor';cursor.hidden=true;document.body.append(cursor);
 const glass=document.createElementNS('http://www.w3.org/2000/svg','svg');glass.classList.add('hammer-glass');glass.setAttribute('aria-hidden','true');document.body.append(glass);
 const hint=document.createElement('div');hint.className='hammer-hint';hint.hidden=true;hint.innerHTML='누르고 있다가 놓으세요 <kbd>Esc</kbd> 종료';document.body.append(hint);
 const gauge=document.createElement('div');gauge.className='hammer-charge';gauge.hidden=true;gauge.innerHTML='<span>타격 세기</span><div class="charge-track"><i></i></div><strong>0%</strong>';document.body.append(gauge);
 const boom=document.createElement('div');boom.className='hammer-boom';boom.hidden=true;boom.innerHTML='<div class="blast-ring"></div><p role="status">이런.. 노트북이 박살나버렸네요.</p>';document.body.append(boom);
 const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
 let active=false,count=0,swing,impact,chargeStart=0,chargeFrame,returnTimer,charging=false,exploded=false,power=0,hitX=0,hitY=0;
 function resetCharge(){charging=false;cancelAnimationFrame(chargeFrame);power=0;gauge.querySelector('i').style.transform='scaleY(0)';gauge.querySelector('strong').textContent='0%';cursor.style.transform='';cursor.style.filter='';}
 function explode(){
  charging=false;exploded=true;cursor.hidden=true;gauge.hidden=true;hint.hidden=true;boom.hidden=false;
  boom.style.setProperty('--hit-x',hitX+'px');boom.style.setProperty('--hit-y',hitY+'px');
  crack(hitX,hitY,1.7);document.documentElement.classList.remove('hammer-active');
  returnTimer=setTimeout(()=>location.assign('../device-unlock.html'),2600);
 }
 function charge(now){
  if(!charging)return;power=Math.min(1,(now-chargeStart)/3000);
  gauge.querySelector('i').style.transform=`scaleY(${power})`;gauge.querySelector('strong').textContent=Math.round(power*100)+'%';
  cursor.style.transform=`translate(-22%,-20%) rotate(${12+power*95}deg)`;
  const heat=Math.max(0,(power-.65)/.35);cursor.style.filter=`drop-shadow(4px 9px 5px #0004) sepia(${heat}) saturate(${1+heat*9}) hue-rotate(${-35*heat}deg) drop-shadow(0 0 ${heat*15}px #ff291d)`;
  if(power===1){explode();return;}chargeFrame=requestAnimationFrame(charge);
 }
 function end(){clearTimeout(returnTimer);resetCharge();exploded=false;boom.hidden=true;gauge.hidden=true;clearTimeout(impact);active=false;document.documentElement.classList.remove('hammer-active');cursor.hidden=true;hint.hidden=true;glass.replaceChildren();count=0;swing?.cancel();}
 function start(e){e.preventDefault();if(active)return;active=true;gauge.hidden=false;document.documentElement.classList.add('hammer-active');cursor.hidden=false;hint.hidden=false;move(e);}
 tool.ondblclick=start;tool.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();start(e);}};
 function move(e){if(!active)return;cursor.style.left=(Number.isFinite(e.clientX)?e.clientX:innerWidth/2)+'px';cursor.style.top=(Number.isFinite(e.clientY)?e.clientY:innerHeight/2)+'px';}
 document.addEventListener('pointermove',move);
 function line(d,width,opacity){const p=document.createElementNS(glass.namespaceURI,'path');p.setAttribute('d',d);p.setAttribute('stroke-width',width);p.setAttribute('opacity',opacity);return p;}
 function crack(x,y,strength=1){
  const group=document.createElementNS(glass.namespaceURI,'g'),rays=15,angles=[],rings=[[],[],[],[]];
  const point=(a,r)=>[x+Math.cos(a)*r,y+Math.sin(a)*r];
  const path=pts=>'M'+pts.map(p=>p.join(' ')).join(' L');
  function fracture(d,w=0.8){
   const shadow=line(d,w+.55,.64);shadow.setAttribute('stroke','#162c37');shadow.setAttribute('transform','translate(.65 .65)');group.append(shadow);
   const edge=line(d,w,.92);edge.setAttribute('stroke','#f5ffff');group.append(edge);
  }
  for(let i=0;i<rays;i++){
   const a=(i+.15+Math.random()*.65)*Math.PI*2/rays;angles.push(a);
   const end=(120+Math.random()*190)*strength,pts=[[x,y]];
   [8,25,60,end].forEach((radius,j)=>{const p=point(a+(Math.random()-.5)*.13,radius*(.72+Math.random()*.5));rings[j].push(p);pts.push(p);});
   fracture(path(pts),.45+Math.random()*.6);
   const root=pts[3],tip=point(a+.15+Math.random()*.25,end*.9);
   fracture(path([root,[(root[0]+tip[0])/2+8,(root[1]+tip[1])/2-5],tip]),.35);
  }
  for(let k=0;k<3;k++)for(let i=0;i<rays;i++){
   const j=(i+1)%rays,a=rings[k][i],b=rings[k][j];
   if(Math.random()>.18)fracture(path([a,[(a[0]+b[0])/2+(Math.random()-.5)*8,(a[1]+b[1])/2+(Math.random()-.5)*8],b]),.35);
   if(k<2&&Math.random()>.48){
    const polygon=document.createElementNS(glass.namespaceURI,'path');polygon.setAttribute('d',path([a,b,rings[k+1][j],rings[k+1][i]])+' Z');polygon.setAttribute('fill',Math.random()>.5?'#eaffff24':'#112c3820');polygon.setAttribute('stroke','none');group.prepend(polygon);
   }
  }
  for(let i=0;i<24;i++){
   const a=Math.random()*Math.PI*2,r=Math.random()*12,p=point(a,r),size=1+Math.random()*3;
   const chip=document.createElementNS(glass.namespaceURI,'path');chip.setAttribute('d',`M${p[0]} ${p[1]} l${size} ${-size*.6} l${-size*.3} ${size*1.4} Z`);chip.setAttribute('fill','#eaffffe0');chip.setAttribute('stroke','#34444b80');chip.setAttribute('stroke-width','.35');group.append(chip);
  }
  glass.append(group);if(++count>18){glass.firstElementChild.remove();count=18;}
  if(!matchMedia('(prefers-reduced-motion:reduce)').matches){
   group.animate([{opacity:0},{opacity:1}],{duration:85});
   for(let i=0;i<8;i++){
    const chip=document.createElementNS(glass.namespaceURI,'path');chip.setAttribute('d',`M${x} ${y} l5 -3 l-1 8 Z`);chip.setAttribute('fill','#e8faffaa');chip.setAttribute('stroke','#627f8a');chip.setAttribute('stroke-width','.5');glass.append(chip);
    const dx=(Math.random()-.5)*150,dy=-25-Math.random()*90;
    chip.animate([{transform:'translate(0,0)',opacity:1},{transform:`translate(${dx*.6}px,${dy}px)`,opacity:.8,offset:.45},{transform:`translate(${dx}px,${60+Math.random()*60}px)`,opacity:0}],{duration:450+Math.random()*200,easing:'ease-out'}).finished.then(()=>chip.remove());
   }
  }
 }
 document.addEventListener('pointerdown',e=>{
  if(!active||exploded||e.button!==0)return;e.preventDefault();e.stopImmediatePropagation();
  clearTimeout(impact);swing?.cancel();move(e);hitX=e.clientX;hitY=e.clientY;charging=true;chargeStart=performance.now();chargeFrame=requestAnimationFrame(charge);
 },true);
 document.addEventListener('pointermove',e=>{if(charging){hitX=e.clientX;hitY=e.clientY;}},true);
 document.addEventListener('pointerup',e=>{
  if(!active||exploded)return;e.preventDefault();e.stopImmediatePropagation();if(!charging)return;
  const strength=power,angle=12+power*95;resetCharge();
  const duration=160+strength*280;
  if(!reduced())swing=cursor.animate([{transform:`translate(-22%,-20%) rotate(${angle}deg)`},{transform:'translate(-22%,-20%) rotate(0deg)',offset:.55},{transform:`translate(-22%,-20%) rotate(${5+strength*12}deg)`,offset:.8},{transform:'translate(-22%,-20%) rotate(0deg)'}],{duration,easing:'cubic-bezier(.5,0,.85,1)'});
  impact=setTimeout(()=>{if(active)crack(hitX,hitY,.35+strength*1.1);},reduced()?0:duration*.55);
 },true);
 document.addEventListener('click',e=>{if(active){e.preventDefault();e.stopImmediatePropagation();}},true);
 document.addEventListener('pointercancel',()=>{if(charging)resetCharge();},true);
 document.addEventListener('keydown',e=>{if(active&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();end();}},true);
 window.addEventListener('blur',()=>{if(active)end();});
}
