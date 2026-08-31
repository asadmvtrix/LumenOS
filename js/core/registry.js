Puter.Registry = (function(){
  const apps = {};
  const fileHandlers = {}; // ext -> appId

  function register(def){
    apps[def.id] = def;
    if (def.handlesExt){
      def.handlesExt.forEach(e => { fileHandlers[e] = fileHandlers[e] || def.id; });
    }
  }
  function list(){
    return Object.values(apps).filter(a => !a.hidden);
  }
  function launch(id, args){
    const def = apps[id];
    if (!def) { console.warn('No such app:', id); return; }
    return def.launch(args || {});
  }
  function openFile(path){
    const node = Puter.VFS.stat(path);
    if (!node || node.type !== 'file'){ Puter.Dialog.alert('Error', 'Cannot open'); return; }
    const ext = Puter.util.extOf(node.name);
    const appId = fileHandlers[ext] || 'notepad';
    launch(appId, { path });
  }
  function renderStart(){
    const host = document.getElementById('start-apps');
    host.innerHTML = '';
    list().forEach(a => {
      const item = Puter.util.el('div', { class:'start-app' }, [
        Puter.util.el('img', { src: a.icon, alt:'' }),
        Puter.util.el('span', { text: a.title })
      ]);
      item.addEventListener('click', ()=>{
        document.getElementById('start-menu').classList.add('hidden');
        launch(a.id);
      });
      host.appendChild(item);
    });
  }
  return { register, list, launch, openFile, renderStart, fileHandlers };
})();
