Puter.WindowManager = (function(){
  const { el, clamp, uid } = Puter.util;
  const windows = [];
  let topZ = 10;

  function layer(){ return document.getElementById('windows-layer'); }

  function focus(w){
    windows.forEach(x => x.root.classList.remove('focused'));
    w.root.classList.add('focused');
    topZ++;
    w.root.style.zIndex = topZ;
    Puter.bus.emit('window:focus', w);
  }

  function makeDraggable(w){
    const header = w.root.querySelector('.window-header');
    header.addEventListener('mousedown', (e)=>{
      if (e.target.closest('.win-buttons')) return;
      if (w.maximized) return;
      const startX = e.clientX, startY = e.clientY;
      const rect = w.root.getBoundingClientRect();
      const parentRect = layer().getBoundingClientRect();
      const origLeft = rect.left - parentRect.left;
      const origTop = rect.top - parentRect.top;
      focus(w);
      function move(ev){
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        w.root.style.left = clamp(origLeft + dx, -rect.width + 80, parentRect.width - 80) + 'px';
        w.root.style.top = clamp(origTop + dy, 0, parentRect.height - 40) + 'px';
      }
      function up(){ document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); }
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });
    header.addEventListener('dblclick', ()=> toggleMax(w));
  }

  function makeResizable(w){
    const handle = el('div', { class:'resize-handle' });
    w.root.appendChild(handle);
    handle.addEventListener('mousedown', (e)=>{
      if (w.maximized) return;
      e.stopPropagation();
      const startX = e.clientX, startY = e.clientY;
      const startW = w.root.offsetWidth, startH = w.root.offsetHeight;
      function move(ev){
        w.root.style.width = Math.max(w.minW||280, startW + (ev.clientX - startX)) + 'px';
        w.root.style.height = Math.max(w.minH||180, startH + (ev.clientY - startY)) + 'px';
      }
      function up(){ document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); }
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });
  }

  function toggleMax(w){
    w.maximized = !w.maximized;
    w.root.classList.toggle('maximized', w.maximized);
    Puter.bus.emit('window:change', w);
  }
  function minimize(w){
    w.minimized = true;
    w.root.classList.add('minimized');
    Puter.bus.emit('window:change', w);
  }
  function restore(w){
    w.minimized = false;
    w.root.classList.remove('minimized');
    focus(w);
    Puter.bus.emit('window:change', w);
  }
  function close(w){
    if (w._closing) return;
    w._closing = true;
    w.root.classList.add('closing');
    setTimeout(()=>{
      w.root.remove();
      const idx = windows.indexOf(w);
      if (idx >= 0) windows.splice(idx, 1);
      w.onClose && w.onClose();
      Puter.bus.emit('window:close', w);
    }, 180);
  }

  function open(opts){
    const title = opts.title || 'Window';
    const icon = opts.icon || 'assets/icons/app.svg';
    const w = {
      id: uid('win_'),
      title, icon,
      appId: opts.appId,
      minW: opts.minW || 280,
      minH: opts.minH || 180,
      maximized:false, minimized:false,
      onClose: opts.onClose,
      data: opts.data || {}
    };
    const body = el('div', { class:'window-body' });
    const minBtn = el('button', { title:'Minimize', html:'&#x2212;', class:'win-min' });
    const maxBtn = el('button', { title:'Maximize', html:'&#x25A1;', class:'win-max' });
    const closeBtn = el('button', { title:'Close', html:'&#x2715;', class:'win-close' });
    const header = el('div', { class:'window-header' }, [
      el('img', { class:'win-icon', src: icon, alt:'' }),
      el('div', { class:'win-title', text: title }),
      el('div', { class:'win-buttons' }, [minBtn, maxBtn, closeBtn])
    ]);
    const root = el('div', { class:'window' }, [header, body]);
    // Default size/position
    const parent = layer();
    const pw = parent.clientWidth, ph = parent.clientHeight;
    const width = opts.width || Math.min(720, pw - 60);
    const height = opts.height || Math.min(480, ph - 60);
    root.style.width = width + 'px';
    root.style.height = height + 'px';
    const offset = (windows.length % 8) * 24;
    root.style.left = Math.max(20, (pw - width)/2 + offset) + 'px';
    root.style.top = Math.max(20, (ph - height)/2 + offset - 20) + 'px';

    w.root = root;
    w.body = body;
    w.header = header;

    minBtn.addEventListener('click', ()=> minimize(w));
    maxBtn.addEventListener('click', ()=> toggleMax(w));
    closeBtn.addEventListener('click', ()=> close(w));
    root.addEventListener('mousedown', ()=> focus(w));

    parent.appendChild(root);
    windows.push(w);
    makeDraggable(w);
    makeResizable(w);
    focus(w);
    Puter.bus.emit('window:open', w);

    if (opts.onReady) opts.onReady(w);
    return w;
  }

  function list(){ return windows.slice(); }
  function setTitle(w, title){ w.title = title; w.root.querySelector('.win-title').textContent = title; Puter.bus.emit('window:change', w); }

  return { open, close, focus, minimize, restore, toggleMax, list, setTitle };
})();
