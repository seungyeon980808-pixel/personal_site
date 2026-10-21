// 작업실에 들어가 있는 동안 브라우저 막대(주소창·하단 막대) 뒤 색을 배경화면 가장자리 색에 맞춘다.
// 입구 페이지(device-unlock) 안에서는 바깥 페이지가 같은 일을 하므로 맨 위 창일 때만 동작한다.
export function initChromeTint(){
 if(window.top!==window.self)return;
 const entrance=document.querySelector('#entrance'),meta=document.querySelector('meta[name="theme-color"]'),outside=meta?.content||'#fafafa';
 const phone=matchMedia('(max-width:700px)');
 const apply=()=>{const inside=entrance.hidden;document.documentElement.style.background=inside?(phone.matches?'#979085':'#dceffe'):'';if(meta)meta.content=inside?'#dceffe':outside;};
 new MutationObserver(apply).observe(entrance,{attributes:true,attributeFilter:['hidden']});phone.addEventListener('change',apply);apply();
}
