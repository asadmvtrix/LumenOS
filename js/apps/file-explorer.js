Puter.Registry.register({
  id:'file-explorer',
  title:'File Explorer',
  icon:'assets/icons/app-files.svg',
  launch(args){
    const { el } = Puter.util;
    const state = { path: args.path || '/', selected: null };

    const crumbs = el('div', { class:'fx-path' });
    const grid = el('div', { class:'fx-grid' });
    const main = el('div', { class:'fx-main' });

    const sideItems = [
      { label:'This PC', path:'/', icon:'assets/icons/folder-home.svg' },
      { label:'Desktop', path:'/Desktop', icon:'assets/icons/folder.svg' },
      { label:'Documents', path:'/Documents', icon:'assets/icons/folder-documents.svg' },
      { label:'Pictures', path:'/Pictures', icon:'assets/icons/folder-pictures.svg' },
      { label:'Videos', path:'/Videos', icon:'assets/icons/folder.svg' },
      { label:'Music', path:'/Music', icon:'assets/icons/folder.svg' },
      { label:'Trash', path:'/Trash', icon:'assets/icons/trash.svg' }
    ];
    const side = el('div', { class:'fx-side' });
    sideItems.forEach(s => {
      const it = el('div', { class:'item' }, [el('img',{src:s.icon,alt:''}), el('span',{text:s.label})]);
      it.addEventListener('click', ()=> go(s.path));
      side.appendChild(it);
    });

    function renderCrumbs(){
      crumbs.innerHTML = '';
      const parts = ['/', ...state.path.split('/').filter(Boolean)];
      let accum = '';
      parts.forEach((p, i) => {
        accum = i === 0 ? '/' : (accum === '/' ? '/' + p : accum + '/' + p);
        const c = el('div', { class:'crumb', text: i === 0 ? 'This PC' : p });
        const target = accum;
        c.addEventListener('click', ()=> go(target));
        crumbs.appendChild(c);
        if (i < parts.length-1) crumbs.appendChild(el('span',{text:'›',style:{color:'var(--fg-muted)',padding:'0 2px'}}));
      });
      // highlight active side item
      side.querySelectorAll('.item').forEach((it,i)=> it.classList.toggle('active', sideItems[i].path === state.path));
    }

    function renderGrid(){
      grid.innerHTML = '';
      let nodes;
      try { nodes = Puter.VFS.list(state.path); }
      catch(e){ grid.appendChild(el('div',{text:'Error: ' + e.message, style:{padding:'20px',color:'var(--fg-muted)'}})); return; }
      if (nodes.length === 0){
        grid.appendChild(el('div',{text:'(empty folder)', style:{padding:'20px',color:'var(--fg-muted)',gridColumn:'1 / -1'}}));
      }
      nodes.forEach(n => {
        const path = (state.path === '/' ? '/' : state.path) + (state.path.endsWith('/') ? '' : '/') + n.name;
        const item = el('div', { class:'fx-item' }, [
          el('img', { src: Puter.Desktop.iconForNode(n) }),
          el('span', { text: n.name })
        ]);
        item.addEventListener('click', e=>{
          e.stopPropagation();
          grid.querySelectorAll('.fx-item.selected').forEach(x => x.classList.remove('selected'));
          item.classList.add('selected');
          state.selected = { path, node:n };
        });
        item.addEventListener('dblclick', ()=> openNode(path, n));
        item.addEventListener('contextmenu', e=>{
          e.preventDefault(); e.stopPropagation();
          const isImage = n.type === 'file' && /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(n.name);
          const items = [
            { label:'Open', onClick: ()=> openNode(path, n) }
          ];
          if (isImage){
            items.push({ label:'Set as wallpaper', onClick: ()=>{
              const src = Puter.VFS.readSrc(path) || path;
              Puter.setWallpaper(src);
            }});
          }
          items.push(
            '-',
            { label:'Rename', onClick: async ()=>{
              const nn = await Puter.Dialog.prompt('Rename', 'New name:', n.name);
              if (nn && nn !== n.name){
                try { Puter.VFS.rename(path, nn); renderGrid(); } catch(err){ Puter.Dialog.alert('Error', err.message); }
              }
            }},
            { label:'Delete', onClick: async ()=>{
              if (await Puter.Dialog.confirm('Delete', 'Move "' + n.name + '" to Trash?')){
                try { Puter.VFS.remove(path); renderGrid(); } catch(err){ Puter.Dialog.alert('Error', err.message); }
              }
            }}
          );
          Puter.ContextMenu.show(e.clientX, e.clientY, items);
        });
        grid.appendChild(item);
      });
    }

    function openNode(path, n){
      if (n.type === 'dir') go(path);
      else Puter.Registry.openFile(path);
    }

    function go(path){
      state.path = path || '/';
      Puter.WindowManager.setTitle(w, state.path + ' — File Explorer');
      renderCrumbs(); renderGrid();
    }

    const unsub = Puter.bus.on('fs:changed', ()=> renderGrid());

    const w = Puter.WindowManager.open({
      title: state.path + ' — File Explorer',
      icon:'assets/icons/app-files.svg', appId:'file-explorer',
      width:780, height:500,
      onClose: unsub,
      onReady(w){
        const toolbar = el('div', { class:'app-toolbar' });
        const upBtn = el('button', { text:'↑ Up' });
        const newFolderBtn = el('button', { text:'New Folder' });
        const newFileBtn = el('button', { text:'New File' });
        const refreshBtn = el('button', { text:'Refresh' });
        toolbar.append(upBtn, el('div',{class:'sep'}), newFolderBtn, newFileBtn, el('div',{class:'sep'}), refreshBtn);

        upBtn.addEventListener('click', ()=>{
          if (state.path === '/') return;
          const p = state.path.split('/').filter(Boolean); p.pop();
          go('/' + p.join('/'));
        });
        newFolderBtn.addEventListener('click', async ()=>{
          const n = await Puter.Dialog.prompt('New Folder', 'Name:', 'New Folder');
          if (n) try { Puter.VFS.mkdir((state.path === '/' ? '' : state.path) + '/' + n); } catch(e){ Puter.Dialog.alert('Error', e.message); }
        });
        newFileBtn.addEventListener('click', async ()=>{
          const n = await Puter.Dialog.prompt('New File', 'Name:', 'untitled.txt');
          if (n) try { Puter.VFS.writeFile((state.path === '/' ? '' : state.path) + '/' + n, '', 'text/plain'); } catch(e){ Puter.Dialog.alert('Error', e.message); }
        });
        refreshBtn.addEventListener('click', renderGrid);

        main.appendChild(crumbs);
        main.appendChild(grid);
        main.addEventListener('contextmenu', e=>{
          if (e.target.closest('.fx-item')) return;
          e.preventDefault();
          Puter.ContextMenu.show(e.clientX, e.clientY, [
            { label:'New Folder', onClick: ()=> newFolderBtn.click() },
            { label:'New File', onClick: ()=> newFileBtn.click() },
            '-',
            { label:'Refresh', onClick: renderGrid }
          ]);
        });
        main.addEventListener('click', ()=>{
          grid.querySelectorAll('.fx-item.selected').forEach(x => x.classList.remove('selected'));
          state.selected = null;
        });

        const body = el('div', { class:'fx' }, [
          toolbar,
          el('div', { class:'fx-body' }, [side, main])
        ]);
        w.body.appendChild(body);
        renderCrumbs();
        renderGrid();
      }
    });
    return w;
  }
});
