// 일어선 휴대폰 테두리(phone-upright-shell)용 이미지.
// phone-refined.webp 오른쪽의 일어선 휴대폰을 테두리 상자 크기로 잘라내고, 화면 구멍 바로 바깥 띠를
// 검은 유리색으로 칠한다. 사진 속 화면(청록) 가장자리가 마스크 구멍 둘레에 선으로 비치던 것을 없앤다.
import sharp from 'sharp';
const W=1536/3.85276,left=Math.round(W*2.3876),top=Math.round(W*1.97*.2162),width=Math.round(W),height=Math.round(W*1.97);
const k=width/1000,ky=height/1970;
// phone-frame-mask.svg 의 구멍(46..954 × 40.385..1925.675, 모서리 118)을 사방 8 넓힌 둥근 사각형
const ring=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><path fill="#030607" d="M${164*k} ${32.385*ky}H${836*k}Q${962*k} ${32.385*ky} ${962*k} ${158.385*ky}V${1807.675*ky}Q${962*k} ${1933.675*ky} ${836*k} ${1933.675*ky}H${164*k}Q${38*k} ${1933.675*ky} ${38*k} ${1807.675*ky}V${158.385*ky}Q${38*k} ${32.385*ky} ${164*k} ${32.385*ky}Z"/></svg>`;
await sharp('assets/studio/phone-refined.webp').extract({left,top,width,height}).composite([{input:Buffer.from(ring)}]).webp({quality:90}).toFile('assets/studio/phone-upright-frame.webp');
console.log('ok',{left,top,width,height});
