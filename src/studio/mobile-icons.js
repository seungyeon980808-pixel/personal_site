const glyphs = {
 folder: '<path d="M9 20a4 4 0 0 1 4-4h13l5 6h20a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4Z"/>',
 star: '<path d="m32 10 6.7 14 15.5 2.2-11.2 11 2.6 15.4L32 45.3l-13.6 7.3L21 37.2 9.8 26.2l15.5-2.2Z"/>',
 person: '<circle cx="32" cy="22" r="10"/><path d="M13 52v-4c0-10 8-16 19-16s19 6 19 16v4Z"/>',
 note: '<path d="M16 10h32a4 4 0 0 1 4 4v36a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4Zm5 12v3h22v-3Zm0 9v3h22v-3Zm0 9v3h15v-3Z" fill-rule="evenodd"/>',
 sheet: '<path d="M10 13h44v10H10Zm3 13h38v25H13Zm13 6v5h12v-5Z" fill-rule="evenodd"/>',
 guestbook: '<path d="M10 14c8-4 15-3 20 1v38c-6-4-13-5-20-1Zm24 1c5-4 12-5 20-1v38c-7-4-14-3-20 1Z"/>',
 message: '<path d="M32 11c14 0 25 8.5 25 20S46 51 32 51h-7L12 58l3-13C-3 30 9 11 32 11Z"/>',
 settings: '<path d="m27 7 10 0 2 7 5 3 7-2 5 9-5 5v6l5 5-5 9-7-2-5 3-2 7H27l-2-7-5-3-7 2-5-9 5-5v-6l-5-5 5-9 7 2 5-3Zm5 15a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" fill-rule="evenodd"/>'
};
const colors = {folder:['#48beff','#087bec'],star:['#ffcc48','#ff961f'],person:['#bd8cf5','#8650cf'],note:['#6bddb0','#12a878'],sheet:['#ff9573','#ee584a'],guestbook:['#64c9d7','#1595b3'],message:['#76e26a','#27b840'],settings:['#bec6d2','#798497']};
const outlines = {
 folder:'<path d="M10 20h17l5 6h22v24H10Z"/><path d="M10 32h44"/>',
 star:'<path d="m32 10 7 14 15 2-11 11 3 16-14-8-14 8 3-16-11-11 15-2Z"/>',
 person:'<circle cx="32" cy="23" r="9"/><path d="M14 51c0-12 7-18 18-18s18 6 18 18"/>',
 note:'<rect x="15" y="10" width="35" height="44" rx="5"/><path d="M23 10v44m6-31h14m-14 9h14m-14 9h9"/>',
 sheet:'<path d="M10 15h44v10H10Zm3 10v26h38V25M26 34h12"/>',
 guestbook:'<path d="M32 18c-8-6-16-6-23-3v35c8-3 16-2 23 3 7-5 15-6 23-3V15c-7-3-15-3-23 3Zm0 0v35"/>',
 message:'<path d="M52 43c-6 8-19 9-28 5l-12 7 3-14C2 21 18 9 34 12s27 16 18 31Z"/><path d="M22 30h20"/>',
 settings:'<circle cx="32" cy="32" r="10"/><path d="m27 8 10 0 2 7 6 3 7-1 4 8-5 5v5l5 5-5 8-7-1-5 3-2 7H27l-2-7-6-3-7 1-4-8 5-5v-5l-5-5 4-8 7 1 6-3Z"/>'
};
const objects = {
 folder:'<path fill="#df991f" d="M5 16q0-5 5-5h16l7 7h25v34H5Z"/><path fill="#fff7dc" d="m11 21 40-5 3 31-40 5Z"/><path fill="#e8d8a8" d="M14 23h36v25H14Z"/><path fill="url(#MAIN)" d="M5 27h55l-6 27H9Z"/><path stroke="#ffe49d" stroke-width="2" d="M9 29h46"/>',
 star:'<path fill="#ad5c0c" d="m33 7 8 16 18 3-13 13 3 18-16-8-17 8 3-18L6 26l19-3Z"/><path fill="url(#MAIN)" d="m31 4 8 17 18 3-13 13 3 18-16-9-16 9 3-18L5 24l18-3Z"/><path fill="#fff2b0" d="m31 4 1 28-9-11Z"/><path fill="#f2a523" d="m32 32 15 23-3-18 13-13Z"/>',
 person:'<path fill="#6671bd" d="m14 9 37 4 4 44-41-4Z"/><g transform="rotate(-7 32 32)"><rect x="10" y="9" width="39" height="45" rx="5" fill="url(#MAIN)"/><rect x="24" y="5" width="12" height="9" rx="3" fill="#dce1f0"/><circle cx="30" cy="26" r="8" fill="#fff7e9"/><path d="M17 46c0-9 6-13 13-13s13 4 13 13" fill="#fff7e9"/></g>',
 note:'<g transform="rotate(-9 32 32)"><rect x="12" y="8" width="41" height="49" rx="5" fill="#186a4c"/><path fill="#ece9ce" d="M17 51h35v4H17Z"/><rect x="10" y="5" width="41" height="47" rx="5" fill="url(#MAIN)"/><path stroke="#165e42" stroke-width="4" d="M17 6v45"/><rect x="25" y="17" width="19" height="17" rx="2" fill="#f8f3d8"/><path stroke="#849579" stroke-width="2" d="M29 22h11m-11 6h8"/></g>',
 sheet:'<path fill="#ca7752" d="m8 20 11-12h29l10 12-7 12H13Z"/><path fill="#f0be92" d="M9 20h49v32H9Z"/><path fill="url(#MAIN)" d="M6 25h52v30H6Z"/><path fill="#ffe3b8" d="M4 19h56v10H4Z"/><rect x="22" y="36" width="20" height="10" rx="2" fill="#fdf7e7"/><path stroke="#986d50" stroke-width="2" d="M27 41h10"/>',
 guestbook:'<path fill="#bc5d48" d="m12 11 20-5 23 8v41l-23-5-20 7Z"/><path fill="#fff3d4" d="m9 9 23 6 23-6v41l-23 5-23-5Z"/><path fill="#ebd5ad" d="M32 15v40l23-5V9Z"/><path stroke="#bb9166" stroke-width="1.6" d="m14 20 13 3m-13 5 13 3m-13 5 13 3m10-16 13-3m-13 11 13-3m-13 11 13-3"/><path fill="#e46d51" d="m40 12 6-2v21l-3-3-3 5Z"/>',
 message:'<path fill="#167c57" d="M8 18h46v31H28L15 59V49H8Z"/><path fill="url(#MAIN)" d="M14 8h36a9 9 0 0 1 9 9v22a9 9 0 0 1-9 9H29L14 57l2-9h-2a9 9 0 0 1-9-9V17a9 9 0 0 1 9-9Z"/><path stroke="#ccffe2" stroke-width="2" stroke-linecap="round" d="M15 12h32"/><g fill="#effff3"><circle cx="19" cy="29" r="3"/><circle cx="32" cy="29" r="3"/><circle cx="45" cy="29" r="3"/></g>',
 settings:'<circle cx="32" cy="35" r="25" fill="#4e5869"/><circle cx="32" cy="30" r="25" fill="url(#MAIN)"/><circle cx="32" cy="30" r="19" stroke="#f5f7f9" stroke-width="7" stroke-dasharray="4 3" fill="none"/><circle cx="32" cy="30" r="13" fill="#707e91"/><circle cx="32" cy="30" r="8" fill="#2e3b50"/><path d="M26 34a8 8 0 0 0 14-5" stroke="#e5eaf1" stroke-width="2" fill="none"/>'
};
const editorial = {
 folder:'<path fill="#2b4ee5" d="M6 14h23l7 8h23v33H6Z"/><path fill="#ffca54" d="M4 29h56L49 55H4Z"/><path stroke="#192033" stroke-width="3" d="M13 36h26"/>',
 star:'<circle cx="34" cy="34" r="25" fill="#fa6b4b"/><path fill="#ffe18b" d="m27 3 8 16 18 3-13 12 3 18-16-8-16 8 3-18L1 22l18-3Z"/><circle cx="27" cy="29" r="5" fill="#192033"/>',
 person:'<path fill="#7b4bd8" d="M5 58V37l27-7 27 7v21Z"/><circle cx="32" cy="19" r="14" fill="#ffc75b"/><path fill="#192033" d="M18 18a14 14 0 0 1 28 0l-14-6Z"/>',
 note:'<path fill="#1539c1" d="M15 7h44v50H15Z"/><path fill="#a3e3c4" d="M5 3h43v50H5Z"/><path stroke="#192033" stroke-width="4" d="M14 16h24m-24 11h24m-24 11h14"/>',
 sheet:'<path fill="#fb754e" d="M5 17h51v40H5Z"/><path fill="#ffc953" d="m4 16 11-12h48L52 16Z"/><path fill="#192033" d="M24 27h17v6H24Z"/><path fill="#ffd58a" d="M46 17h10v40H46Z"/>',
 guestbook:'<path fill="#ffbdb0" d="M3 7h25l5 7 5-7h23v47H38l-5 6-5-6H3Z"/><path fill="#f0543b" d="M33 14 38 7h23v47H38l-5 6Z"/><path stroke="#192033" stroke-width="3" d="M11 20h12m-12 9h12m-12 9h12m17-18h12m-12 9h12m-12 9h12M33 14v39"/>',
 message:'<path fill="#263bce" d="M15 18h47v34H47L35 62V52H15Z"/><path fill="#d1ec80" d="M2 3h48v36H21L7 50V39H2Z"/><path stroke="#192033" stroke-width="4" d="M12 16h27m-27 10h17"/>',
 settings:'<path fill="#fbd268" d="M25 2h14l3 12 11-3 7 12-9 9 9 9-7 12-11-3-3 12H25l-3-12-11 3-7-12 9-9-9-9 7-12 11 3Z"/><circle cx="32" cy="32" r="15" fill="#ff7556"/><circle cx="32" cy="32" r="7" fill="#192033"/>'
};
let sequence = 0;
function renderIcon(name, style) {
 const id = `variant-${sequence++}`;
 const palette = style === 'object' && name === 'folder' ? ['#ffdb79','#e6a333'] : style === 'object' && name === 'star' ? ['#ffdf70','#e7a526'] : colors[name];
 const gradient = `<defs><linearGradient id="${id}" x2=".25" y2="1"><stop stop-color="${palette[0]}"/><stop offset="1" stop-color="${palette[1]}"/></linearGradient></defs>`;
 let drawing;
 if (style === 'object') drawing = objects[name].replaceAll('#MAIN', `#${id}`);
 else if (style === 'color') drawing = editorial[name];
 else if (style === 'mono') drawing = `<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="square" stroke-linejoin="round" transform="translate(8 8) scale(.75)">${outlines[name]}</g>`;
 else if (style === 'glass') drawing = `<g class="variant-glass-glyph" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${outlines[name]}</g>`;
 else drawing = `<g fill="currentColor" transform="translate(6.4 6.4) scale(.8)">${glyphs[name]}</g>`;
 return `<svg viewBox="0 0 64 64" width="60" height="60" aria-hidden="true" focusable="false">${gradient}${drawing}</svg>`;
}
export function renderMobileIcons(){
 if(!matchMedia('(max-width:700px)').matches)return;
 const symbols={shared:'folder',recommend:'star',archives:'sheet',guestbook:'guestbook',contact:'message',private:'folder',training:'note'};
 document.querySelectorAll('#icons [data-route],#dock [data-route]').forEach(button=>{
  const view=JSON.parse(button.dataset.route).view,node=button.querySelector('.app-icon');
  if(!node)return;
  if(view==='programs')return;
  const name=view==='settings'?'settings':symbols[view];if(!name)return;
  node.className='app-icon mobile-ios-icon';node.style.background=`linear-gradient(155deg,${colors[name][0]},${colors[name][1]})`;node.innerHTML=renderIcon(name,'ios');
 });
}
