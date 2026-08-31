Puter.Taskbar = (function(){
  const { el } = Puter.util;

  function render(){
    const container = document.getElementById('taskbar-apps');
    container.innerHTML = '';
    Puter.WindowManager.list().forEach(w => {
      const btn = el('div', { class:'taskbar-app' + (w.root.classList.contains('focused') && !w.minimized ? ' focused' : '') }, [
        el('img', { src: w.icon, alt:'' }),
        el('span', { text: w.title })
      ]);
      btn.addEventListener('click', ()=>{
        if (w.minimized) Puter.WindowManager.restore(w);
        else if (w.root.classList.contains('focused')) Puter.WindowManager.minimize(w);
        else Puter.WindowManager.focus(w);
      });
      btn.addEventListener('contextmenu', e=>{
        e.preventDefault();
        Puter.ContextMenu.show(e.clientX, e.clientY, [
          { label: w.maximized ? 'Restore' : 'Maximize', onClick: ()=> Puter.WindowManager.toggleMax(w) },
          { label: 'Minimize', onClick: ()=> Puter.WindowManager.minimize(w) },
          '-',
          { label: 'Close', onClick: ()=> Puter.WindowManager.close(w) }
        ]);
      });
      container.appendChild(btn);
    });
  }

  function startClock(){
    const c = document.getElementById('clock');
    const tick = ()=>{
      const d = new Date();
      const hh = String(d.getHours()).padStart(2,'0');
      const mm = String(d.getMinutes()).padStart(2,'0');
      c.textContent = hh + ':' + mm;
    };
    tick(); setInterval(tick, 10000);
  }

  function init(){
    ['window:open','window:close','window:focus','window:change'].forEach(ev => Puter.bus.on(ev, render));
    startClock();

    const startBtn = document.getElementById('start-btn');
    const menu = document.getElementById('start-menu');
    startBtn.addEventListener('click', e=>{
      e.stopPropagation();
      menu.classList.toggle('hidden');
    });
    document.addEventListener('click', e=>{
      if (!menu.contains(e.target) && e.target !== startBtn && !startBtn.contains(e.target)){
        menu.classList.add('hidden');
      }
    });
    document.getElementById('start-settings').addEventListener('click', ()=>{
      menu.classList.add('hidden');
      Puter.Registry.launch('settings');
    });
    document.getElementById('start-lock').addEventListener('click', ()=>{
      menu.classList.add('hidden');
      Puter.signOut && Puter.signOut();
    });
  }

  return { init, render };
})();
