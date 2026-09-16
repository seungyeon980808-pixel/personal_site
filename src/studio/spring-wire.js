export function springWire(canvas){
 const context=canvas.getContext('2d');
 const coil=Array.from({length:201},(_,j)=>{const t=j/200,a=t*Math.PI*20,taper=Math.min(1,t*12,(1-t)*12);return {t,across:11*Math.sin(a)*taper,along:3.5*(Math.cos(a)-1)*taper};});
 let previous,dirty=true;
 function resize(){dirty=true;}
 function prepare(){
  const ratio=devicePixelRatio||1;
  canvas.width=Math.ceil(innerWidth*ratio);canvas.height=Math.ceil(innerHeight*ratio);
  context.setTransform(ratio,0,0,ratio,0,0);
  context.strokeStyle='#95b4c8';context.lineWidth=1.5;
  context.shadowColor='#ffffff88';context.shadowOffsetY=ratio;context.shadowBlur=2*ratio;
  previous=null;dirty=false;
 }
 function paint(ax,ay,bx,by){
  if(dirty)prepare();
  if(previous)context.clearRect(previous.x,previous.y,previous.w,previous.h);
  const dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy)||1;
  context.beginPath();context.moveTo(ax,ay);
  for(const {t,across,along} of coil)context.lineTo(ax+dx*t-dy/len*across+dx/len*along,ay+dy*t+dx/len*across+dy/len*along);
  context.stroke();
  previous={x:Math.min(ax,bx)-24,y:Math.min(ay,by)-24,w:Math.abs(dx)+48,h:Math.abs(dy)+48};
 }
 return {resize,paint};
}
