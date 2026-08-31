Puter.Desktop = (function(){
  const { el } = Puter.util;
  const DESKTOP_PATH = '/Desktop';
  const host = () => document.getElementById('desktop-icons');

  function iconForNode(node){
    if (node.type === 'dir') return 'assets/icons/folder.svg';
    const ext = Puter.util.extOf(node.name);
    const map = { txt:'file.svg', md:'file-md.svg', js:'file-js.svg', html:'file-html.svg', css:'file-css.svg',
                  png:'file-image.svg', jpg:'file-image.svg', jpeg:'file-image.svg', gif:'file-image.svg', webp:'file-image.svg' };
    return 'assets/icons/' + (map[ext] || 'file.svg');
  }

  function render(){
    const h = host();
    h.innerHTML = '';
    // Built-in shortcuts first
    const shortcuts = [
      { name:'File Explorer', icon:'assets/icons/app-files.svg', onOpen: ()=> Puter.Registry.launch('file-explorer') },
      { name:'This PC', icon:'assets/icons/folder-home.svg', onOpen: ()=> Puter.Registry.launch('file-explorer', { path:'/' }) },
      { name:'Trash', icon:'assets/icons/trash.svg', onOpen: ()=> Puter.Registry.launch('file-explorer', { path:'/Trash' }) }
    ];
    shortcuts.forEach(s => h.appendChild(makeIcon(s.name, s.icon, s.onOpen)));

    // Desktop folder contents
    try {
      Puter.VFS.list(DESKTOP_PATH).forEach(node => {
        const path = DESKTOP_PATH + '/' + node.name;
        h.appendChild(makeIcon(node.name, iconForNode(node), ()=> openNode(path, node), path, node));
      });
    } catch(e){ /* no Desktop folder */ }
  }

  function makeIcon(name, icon, onOpen, path, node){
    const div = el('div', { class:'desktop-icon' }, [
      el('img', { src: icon, alt:'' }),
      el('span', { text: name })
    ]);
    div.addEventListener('click', e=>{
      e.stopPropagation();
      host().querySelectorAll('.desktop-icon.selected').forEach(x => x.classList.remove('selected'));
      div.classList.add('selected');
    });
    div.addEventListener('dblclick', onOpen);
    if (path){
      div.addEventListener('contextmenu', e=>{
        e.preventDefault(); e.stopPropagation();
        const isImage = node && node.type === 'file' && /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(name);
        const items = [{ label:'Open', onClick: onOpen }];
        if (isImage){
          items.push({ label:'Set as wallpaper', onClick: ()=>{
            const src = Puter.VFS.readSrc(path) || path;
            Puter.setWallpaper(src);
          }});
        }
        items.push(
          '-',
          { label:'Rename', onClick: async ()=>{
            const nn = await Puter.Dialog.prompt('Rename', 'New name:', name);
            if (nn && nn !== name){ try { Puter.VFS.rename(path, nn); render(); } catch(err){ Puter.Dialog.alert('Error', err.message); } }
          }},
          { label:'Delete', onClick: async ()=>{
            if (await Puter.Dialog.confirm('Delete', 'Move "' + name + '" to Trash?')){ Puter.VFS.remove(path); render(); }
          }}
        );
        Puter.ContextMenu.show(e.clientX, e.clientY, items);
      });
    }
    return div;
  }

  function openNode(path, node){
    if (node.type === 'dir'){
      Puter.Registry.launch('file-explorer', { path });
    } else {
      Puter.Registry.openFile(path);
    }
  }

  function init(){
    Puter.bus.on('fs:changed', render);
    const dt = document.getElementById('desktop');
    dt.addEventListener('click', ()=>{
      host().querySelectorAll('.desktop-icon.selected').forEach(x => x.classList.remove('selected'));
    });
    dt.addEventListener('contextmenu', e=>{
      if (e.target.closest('#taskbar') || e.target.closest('.window') || e.target.closest('.desktop-icon')) return;
      e.preventDefault();
      Puter.ContextMenu.show(e.clientX, e.clientY, [
        { label:'New Folder', onClick: async ()=>{
          const n = await Puter.Dialog.prompt('New Folder', 'Name:', 'New Folder');
          if (n) try { Puter.VFS.mkdir(DESKTOP_PATH + '/' + n); } catch(err){ Puter.Dialog.alert('Error', err.message); }
        }},
        { label:'New Text File', onClick: async ()=>{
          const n = await Puter.Dialog.prompt('New File', 'Name:', 'untitled.txt');
          if (n) try { Puter.VFS.writeFile(DESKTOP_PATH + '/' + n, '', 'text/plain'); } catch(err){ Puter.Dialog.alert('Error', err.message); }
        }},
        '-',
        { label:'Refresh', onClick: render },
        { label:'Open Settings', onClick: ()=> Puter.Registry.launch('settings') }
      ]);
    });
    render();
  }

  return { init, render, iconForNode };
})();
