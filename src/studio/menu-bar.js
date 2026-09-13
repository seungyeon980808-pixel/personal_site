export function initMenuBar(open){
 const menus=[...document.querySelectorAll('.system-menu')];
 for(const menu of menus){
  menu.addEventListener('toggle',()=>{if(menu.open)for(const other of menus)if(other!==menu)other.open=false;});
  menu.addEventListener('click',event=>{const button=event.target.closest('button[data-route]');if(!button)return;event.stopPropagation();menu.open=false;open(JSON.parse(button.dataset.route));});
 }
 document.addEventListener('click',event=>{for(const menu of menus)if(!menu.contains(event.target))menu.open=false;});
 document.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  const menu=menus.find(m=>m.open);if(!menu)return;
  event.preventDefault();event.stopImmediatePropagation();menu.open=false;menu.querySelector('summary').focus();
 },true);
}
