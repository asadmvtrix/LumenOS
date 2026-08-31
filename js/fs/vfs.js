// Virtual filesystem persisted in localStorage.
// Tree stored as a single JSON blob under key PUTER_FS.
// Node shape: { name, type: 'dir'|'file', children?:[], data?:string, mime?:string, createdAt, updatedAt }

Puter.VFS = (function(){
  const KEY = 'LUMEN_FS_V3';

  // External-reference files: data is empty, but `src` points to a URL served with the app.
  // Useful for large images/videos shipped in assets/ that would blow the localStorage budget.
  function seed(){
    const now = Date.now();
    const n = (name, type, extra) => Object.assign({ name, type, createdAt: now, updatedAt: now }, extra||{});
    const ext = (name, src, mime) => n(name, 'file', { external:true, src, mime, data:'' });
    return n('/', 'dir', { children: [
      n('Desktop', 'dir', { children: [
        n('Welcome.txt', 'file', { data: "Welcome to LumenOS!\n\nThis is a fully client-side desktop experience.\n- Right-click the desktop for options\n- Open the Start menu for apps\n- Your files live in your browser (localStorage)", mime:'text/plain' }),
        n('readme.md', 'file', { data: "# LumenOS\n\nA portable browser OS.\n\n- **File Explorer** — browse files\n- **Notepad** — plain text\n- **Code Editor** — with highlighting\n- **Paint**, **Calculator**, **Terminal**, etc.\n", mime:'text/markdown' })
      ]}),
      n('Documents', 'dir', { children: [
        n('notes.txt', 'file', { data:'Some notes...', mime:'text/plain' })
      ]}),
      n('Pictures', 'dir', { children: [
        ext('Ducati Lamborghini.jpg', 'assets/images/ducati-lamborghini.jpg', 'image/jpeg'),
        ext('Ferrari J50.jpg', 'assets/images/ferrari-j50.jpg', 'image/jpeg'),
        ext('Spider-Man.jpg', 'assets/images/spider-man.jpg', 'image/jpeg'),
        ext('Sunset Tides.jpg', 'assets/images/sunset-tides.jpg', 'image/jpeg'),
        ext('Default Wallpaper.webp', 'assets/images/wallpaper.webp', 'image/webp')
      ]}),
      n('Videos', 'dir', { children: [
        ext('Crazy Frog - Axel F.mp4', 'assets/videos/crazy-frog-axel-f.mp4', 'video/mp4')
      ]}),
      n('Music', 'dir', { children: [
        ext('Montagem Alquimia.mp4', 'assets/music/montagem-alquimia.mp4', 'video/mp4')
      ]}),
      n('Trash', 'dir', { children: [] })
    ]});
  }

  function load(){
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) { const s = seed(); save(s); return s; }
      return JSON.parse(raw);
    } catch(e){
      console.warn('VFS corrupt, reseeding', e);
      const s = seed(); save(s); return s;
    }
  }
  function save(tree){ localStorage.setItem(KEY, JSON.stringify(tree)); }

  let root = load();

  function parts(path){
    return path.split('/').filter(Boolean);
  }
  function find(path){
    const p = parts(path);
    let node = root;
    for (const seg of p){
      if (node.type !== 'dir') return null;
      const next = node.children.find(c => c.name === seg);
      if (!next) return null;
      node = next;
    }
    return node;
  }
  function parentOf(path){
    const p = parts(path);
    if (p.length === 0) return null;
    p.pop();
    return find('/' + p.join('/'));
  }
  function resolve(path, name){
    return (path.endsWith('/') ? path.slice(0,-1) : path) + '/' + name;
  }

  function persist(){ save(root); Puter.bus.emit('fs:changed'); }

  return {
    tree(){ return root; },
    read(path){
      const n = find(path);
      if (!n || n.type !== 'file') throw new Error('Not a file: ' + path);
      return n.data || '';
    },
    // For external-ref files, returns a URL that can be used in <img src> / <video src>.
    // For data-URL-backed files, returns the data URL. Otherwise returns null.
    readSrc(path){
      const n = find(path);
      if (!n || n.type !== 'file') return null;
      if (n.external) return n.src;
      if (typeof n.data === 'string' && n.data.startsWith('data:')) return n.data;
      return null;
    },
    isExternal(path){
      const n = find(path);
      return !!(n && n.external);
    },
    stat(path){ return find(path); },
    list(path){
      const n = find(path);
      if (!n || n.type !== 'dir') throw new Error('Not a dir: ' + path);
      return n.children.slice().sort((a,b)=>{
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    },
    writeFile(path, data, mime){
      const pp = parts(path); const name = pp.pop();
      const par = find('/' + pp.join('/'));
      if (!par || par.type !== 'dir') throw new Error('Parent not found: ' + path);
      let node = par.children.find(c => c.name === name);
      const now = Date.now();
      if (node){
        if (node.type !== 'file') throw new Error('Path is a directory');
        node.data = data;
        if (mime) node.mime = mime;
        node.updatedAt = now;
      } else {
        par.children.push({ name, type:'file', data, mime: mime || 'text/plain', createdAt: now, updatedAt: now });
      }
      persist();
    },
    mkdir(path){
      const pp = parts(path); const name = pp.pop();
      const par = find('/' + pp.join('/'));
      if (!par || par.type !== 'dir') throw new Error('Parent not found');
      if (par.children.some(c => c.name === name)) throw new Error('Already exists');
      const now = Date.now();
      par.children.push({ name, type:'dir', children: [], createdAt: now, updatedAt: now });
      persist();
    },
    remove(path){
      const par = parentOf(path);
      if (!par) throw new Error('Cannot remove root');
      const pp = parts(path); const name = pp[pp.length-1];
      const idx = par.children.findIndex(c => c.name === name);
      if (idx < 0) throw new Error('Not found');
      const [removed] = par.children.splice(idx, 1);
      // Soft-delete to Trash unless already in Trash
      if (!path.startsWith('/Trash')){
        const trash = find('/Trash');
        if (trash){
          let newName = removed.name; let i = 1;
          while (trash.children.some(c => c.name === newName)){
            newName = removed.name + ' (' + (i++) + ')';
          }
          removed.name = newName;
          trash.children.push(removed);
        }
      }
      persist();
    },
    rename(path, newName){
      if (!newName || newName.includes('/')) throw new Error('Invalid name');
      const par = parentOf(path);
      const pp = parts(path); const oldName = pp[pp.length-1];
      if (par.children.some(c => c.name === newName)) throw new Error('Already exists');
      const node = par.children.find(c => c.name === oldName);
      node.name = newName;
      node.updatedAt = Date.now();
      persist();
    },
    resolve,
    exists(path){ return !!find(path); },
    reset(){ root = seed(); save(root); Puter.bus.emit('fs:changed'); }
  };
})();
