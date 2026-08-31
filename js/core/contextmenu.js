Puter.ContextMenu = (function(){
  const { el } = Puter.util;
  let current = null;

  function close(){
    if (current){ current.remove(); current = null; }
  }
  document.addEventListener('click', close);
  document.addEventListener('contextmenu', (e)=>{
    if (current && !current.contains(e.target)) close();
  }, true);

  function show(x, y, items){
    close();
    const menu = el('div', { class:'ctxmenu' });
    items.forEach(it => {
      if (it === '-' || it.sep){
        menu.appendChild(el('div', { class:'sep' }));
        return;
      }
      const item = el('div', { class:'item' + (it.disabled ? ' disabled' : ''), text: it.label });
      if (!it.disabled){
        item.addEventListener('click', ev => { ev.stopPropagation(); close(); it.onClick && it.onClick(); });
      }
      menu.appendChild(item);
    });
    document.getElementById('contextmenu-layer').appendChild(menu);
    // Clamp to viewport
    const rect = menu.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    menu.style.left = Math.min(x, vw - rect.width - 4) + 'px';
    menu.style.top = Math.min(y, vh - rect.height - 4) + 'px';
    current = menu;
  }
  return { show, close };
})();
