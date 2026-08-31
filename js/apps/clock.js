Puter.Registry.register({
  id:'clock',
  title:'Clock',
  icon:'assets/icons/app-clock.svg',
  launch(){
    const { el } = Puter.util;
    const time = el('div', { class:'time', text:'--:--:--' });
    const date = el('div', { class:'date', text:'' });
    function tick(){
      const d = new Date();
      time.textContent = [d.getHours(), d.getMinutes(), d.getSeconds()].map(n=>String(n).padStart(2,'0')).join(':');
      date.textContent = d.toDateString();
    }
    tick();
    const id = setInterval(tick, 1000);
    Puter.WindowManager.open({
      title:'Clock', icon:'assets/icons/clock.svg', appId:'clock',
      width:380, height:240,
      onClose(){ clearInterval(id); },
      onReady(w){ w.body.appendChild(el('div',{class:'clockapp'},[time, date])); }
    });
  }
});
