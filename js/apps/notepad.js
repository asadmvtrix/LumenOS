Puter.Registry.register({
  id:'notepad',
  title:'Notepad',
  icon:'assets/icons/app-notepad.svg',
  handlesExt:['txt','md','log','csv',''],
  launch(args){
    const { el } = Puter.util;
    const state = { path: args.path || null, dirty: false };
    const ta = el('textarea', { class:'editor-textarea', spellcheck:'false' });
    const status = el('div', { class:'app-statusbar', text:'Ready' });

    const w = Puter.WindowManager.open({
      title: state.path ? state.path.split('/').pop() : 'Untitled — Notepad',
      icon:'assets/icons/app-notepad.svg', appId:'notepad',
      width:640, height:440,
      onReady(w){
        const toolbar = el('div', { class:'app-toolbar' });
        const newBtn = el('button', { text:'New' });
        const openBtn = el('button', { text:'Open…' });
        const saveBtn = el('button', { text:'Save' });
        const saveAsBtn = el('button', { text:'Save As…' });
        toolbar.append(newBtn, openBtn, el('div',{class:'sep'}), saveBtn, saveAsBtn);
        const wrap = el('div', { class:'editor-wrap' }, [
          toolbar,
          el('div', { class:'editor-area' }, [ta]),
          status
        ]);
        w.body.appendChild(wrap);

        if (state.path){
          try { ta.value = Puter.VFS.read(state.path); } catch(e){ ta.value = ''; }
        }

        ta.addEventListener('input', ()=>{
          state.dirty = true;
          Puter.WindowManager.setTitle(w, (state.path ? state.path.split('/').pop() : 'Untitled') + ' *');
          status.textContent = 'Modified';
        });

        newBtn.addEventListener('click', ()=>{
          ta.value = ''; state.path = null; state.dirty = false;
          Puter.WindowManager.setTitle(w, 'Untitled — Notepad');
          status.textContent = 'New document';
        });

        openBtn.addEventListener('click', async ()=>{
          const p = await Puter.Dialog.prompt('Open File', 'Enter path (e.g. /Documents/notes.txt):', state.path || '/Documents/');
          if (!p) return;
          try {
            ta.value = Puter.VFS.read(p);
            state.path = p; state.dirty = false;
            Puter.WindowManager.setTitle(w, p.split('/').pop() + ' — Notepad');
            status.textContent = 'Opened ' + p;
          } catch(e){ Puter.Dialog.alert('Open failed', e.message); }
        });

        async function doSave(asNew){
          let p = state.path;
          if (!p || asNew){
            p = await Puter.Dialog.prompt('Save As', 'Path:', p || '/Documents/untitled.txt');
            if (!p) return;
          }
          try {
            Puter.VFS.writeFile(p, ta.value, 'text/plain');
            state.path = p; state.dirty = false;
            Puter.WindowManager.setTitle(w, p.split('/').pop() + ' — Notepad');
            status.textContent = 'Saved ' + p;
          } catch(e){ Puter.Dialog.alert('Save failed', e.message); }
        }
        saveBtn.addEventListener('click', ()=> doSave(false));
        saveAsBtn.addEventListener('click', ()=> doSave(true));
      }
    });
    return w;
  }
});
