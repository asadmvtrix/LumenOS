Puter.Registry.register({
  id:'about',
  title:'About LumenOS',
  icon:'assets/icons/app-about.svg',
  launch(){
    const { el } = Puter.util;
    const content = el('div', { class:'about' }, [
      el('img', { src:'assets/icons/logo-lumen.svg', alt:'', style:{width:'80px',height:'80px'} }),
      el('h2', { text:'LumenOS' }),
      el('p', { text:'A portable, browser-based desktop experience. All frontend — no server, no installs. Your files live in your browser.' }),
      el('p', { text:'Version 1.0.0' })
    ]);
    Puter.WindowManager.open({
      title:'About LumenOS', icon:'assets/icons/app-about.svg', appId:'about',
      width:420, height:360,
      onReady(w){ w.body.appendChild(content); }
    });
  }
});
