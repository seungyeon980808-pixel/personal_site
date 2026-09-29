export function springWire(canvas){
 const context=canvas.getContext('2d');
 const coil=Array.from({length:201},(_,j)=>{const t=j/200,a=t*Math.PI*20,taper=Math.min(1,t*12,(1-t)*12);return {t,across:11*Math.sin(a)*taper,along:3.5*(Math.cos(a)-1)*taper};});
 const pad=24;let ratio=1,width=0,height=0,dirty=true;
 function resize(){dirty=true;}
 function prepare(w,h){
  ratio=devicePixelRatio||1;width=w;height=h;
  canvas.width=Math.ceil(w*ratio);canvas.height=Math.ceil(h*ratio);
  canvas.style.width=w+'px';canvas.style.height=h+'px';
  context.strokeStyle='#95b4c8';context.lineWidth=1.5;
  context.shadowColor='#ffffff88';context.shadowOffsetY=ratio;context.shadowBlur=2*ratio;
  dirty=false;
 }
 function paint(ax,ay,bx,by){
  const dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy)||1;
  const left=Math.floor(Math.min(ax,bx)-pad),top=Math.floor(Math.min(ay,by)-pad);
  const w=Math.ceil(Math.abs(dx)+pad*2)+1,h=Math.ceil(Math.abs(dy)+pad*2)+1;
  if(dirty||w>width||h>height||ratio!==(devicePixelRatio||1))prepare(Math.max(w,width+64),Math.max(h,height+64));
  context.setTransform(1,0,0,1,0,0);context.clearRect(0,0,canvas.width,canvas.height);
  context.setTransform(ratio,0,0,ratio,-left*ratio,-top*ratio);
  canvas.style.transform=`translate(${left}px,${top}px)`;
  context.beginPath();context.moveTo(ax,ay);
  for(const {t,across,along} of coil)context.lineTo(ax+dx*t-dy/len*across+dx/len*along,ay+dy*t+dx/len*across+dy/len*along);
  context.stroke();
 }
 return {resize,paint};
}
