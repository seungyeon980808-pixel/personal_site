import {$} from './utils.js';

const glassCorners=[[140,25],[477,25],[573,463],[52,463]];
// 누운 사진에서 보이는 휴대폰 밑면(스피커·단자 면). 윗변은 화면 아랫변 바로 아래다.
const chinTop=[[44,468],[584,468]],chinBottom=[[584,526],[44,526]];

export function phonePhotoTarget(){
 const photo=$('.phone-rest-photo'),lid=$('#notebook-lid');
 const previous=lid.style.transform,transition=lid.style.transition;
 lid.style.transition='none';
 lid.style.transform='none';
 const frame=photo.getBoundingClientRect(),screen=$('.phone-screen-anchor').getBoundingClientRect();
 lid.style.transform=previous;
 lid.getBoundingClientRect();
 lid.style.transition=transition;
 const scale=frame.width/628;
 const source=glassCorners.map(([x,y])=>[x*scale,y*scale]);
 const left=screen.left-frame.left,top=screen.top-frame.top;
 const target=[[left,top],[left+screen.width,top],[left+screen.width,top+screen.height],[left,top+screen.height]];
 return `translate(-50%,-50%) ${project(source,target)}`;
}

export function project(source,target){
 const rows=[];
 source.forEach(([x,y],i)=>{
  const [u,v]=target[i];
  rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);
 });
 for(let column=0;column<8;column++){
  let pivot=column;
  for(let row=column+1;row<8;row++)if(Math.abs(rows[row][column])>Math.abs(rows[pivot][column]))pivot=row;
  [rows[column],rows[pivot]]=[rows[pivot],rows[column]];
  const divisor=rows[column][column];
  for(let cell=column;cell<9;cell++)rows[column][cell]/=divisor;
  for(let row=0;row<8;row++)if(row!==column){
   const factor=rows[row][column];
   for(let cell=column;cell<9;cell++)rows[row][cell]-=factor*rows[column][cell];
  }
 }
 const [a,b,c,d,e,f,g,h]=rows.map(row=>row[8]);
 return `matrix3d(${a},${d},0,${g},${b},${e},0,${h},0,0,1,0,${c},${f},0,1)`;
}

export function placePhoneScreen(viewport){
 const photo=$('.phone-rest-photo'),scale=parseFloat(getComputedStyle(photo).width)/628;
 const anchor=getComputedStyle($('.phone-screen-anchor'));
 const width=337*scale,height=width*parseFloat(anchor.height)/parseFloat(anchor.width);
 $('.phone-screen-clip').append(viewport);
 viewport.style.width=width+'px';viewport.style.height=height+'px';
 viewport.style.transform=project([[0,0],[width,0],[width,height],[0,height]],glassCorners.map(([x,y])=>[x*scale,y*scale]));
}

export function phoneFrames(target){
 const photo=$('.phone-rest-photo').getBoundingClientRect(),shell=$('.phone-upright-shell').getBoundingClientRect();
 const end=new DOMMatrix(target.slice(target.indexOf('matrix3d')));
 const offset=new DOMMatrix().translate(shell.left-photo.left,shell.top-photo.top);
 const inverse=end.inverse(),scale=photo.width/628;
 const source=glassCorners.map(([x,y])=>[x*scale,y*scale]);
 const destination=source.map(([x,y])=>{const p=new DOMPoint(x,y).matrixTransform(end);return [p.x/p.w,p.y/p.w];});
 const photoFrames=[],shellFrames=[],baseFrames=[];
 const chinSource=[...chinTop,...chinBottom].map(([x,y])=>[x*scale,y*scale]);
 const apply=(matrix,[x,y])=>{const p=new DOMPoint(x,y).matrixTransform(matrix);return [p.x/p.w,p.y/p.w];};
 for(let i=0;i<=60;i++){
  const progress=i/60;
  // 아랫변을 경첩처럼 바닥에 붙인 채 윗부분만 들리면 아래가 고정돼 보인다 → 일어서는 동안 전체가 살짝 떠올랐다 내려앉는다
  const lift=-photo.height*.09*Math.sin(Math.PI*progress);
  const corners=source.map(([x,y],index)=>[x+(destination[index][0]-x)*progress,y+(destination[index][1]-y)*progress+lift]);
  const matrix=new DOMMatrix(project(source,corners));
  photoFrames.push({offset:progress,transform:`translate(-50%,-50%) ${matrix.toString()}`,opacity:1});
  shellFrames.push({offset:progress,transform:offset.inverse().multiply(matrix).multiply(inverse).multiply(offset).toString()});
  // 밑면: 윗변은 화면과 같은 변환을 따라가고(폭도 화면과 함께), 두께는 휴대폰이 일어설수록 0으로 준다.
  // 화면 변환을 그대로 아래로 늘리면 밑면이 화면보다 넓게 벌어진 채 남아 '아래만 고정된' 것처럼 보였다.
  const [left,right]=[chinSource[0],chinSource[1]].map(point=>apply(matrix,point));
  const grow=Math.hypot(right[0]-left[0],right[1]-left[1])/(chinSource[1][0]-chinSource[0][0]);
  const thick=(chinSource[2][1]-chinSource[1][1])*grow*Math.max(.002,1-progress/.5);
  const chinTarget=[left,right,[right[0],right[1]+thick],[left[0],left[1]+thick]];
  const base=matrix.inverse().multiply(new DOMMatrix(project(chinSource,chinTarget)));
  // 같은 모양이라도 행렬 전체에 배율이 곱해져 있으면 브라우저가 보간한 값과 숫자가 달라진다 → 마지막 칸(m44)을 1로 맞춘다
  const unit=DOMMatrix.fromFloat64Array(base.toFloat64Array().map(value=>value/base.m44));
  baseFrames.push({offset:progress,transform:unit.toString()});
 }
 photoFrames[0].transform='translate(-50%,-50%)';
 photoFrames[60].transform=target;
 shellFrames[60].transform='none';
 baseFrames[0].transform='none';
 return {photoFrames,shellFrames,baseFrames};
}

export function phoneCameraFrames(rest){
 const camera=$('#photo-flight'),lid=$('#notebook-lid');
 const cameraStyle=camera.style.transform,lidStyle=lid.style.transform,transition=lid.style.transition;
 camera.style.transform='none';lid.style.transition='none';lid.style.transform='none';
 const r=$('.phone-screen-anchor').getBoundingClientRect();
 camera.style.transform=cameraStyle;lid.style.transform=lidStyle;lid.getBoundingClientRect();lid.style.transition=transition;
 const restY=parseFloat(rest.slice(rest.indexOf('(')+1)),scale=Math.max(innerWidth/r.width,innerHeight/r.height);
 const smooth=t=>{const p=Math.max(0,Math.min(1,t));return p*p*(3-2*p);};
 return Array.from({length:91},(_,i)=>{
  const t=i/90,z=smooth((t-.4)/.6),rise=smooth(t/.65);
  return {offset:t,transform:`translate(${(innerWidth/2-(r.x+r.width/2)*scale)*z}px,${restY*(1-rise)+(innerHeight/2-(r.y+r.height/2)*scale)*z}px) scale(${1+(scale-1)*z})`};
 });
}
