(function boot(){
  Puter.applyTheme();
  Puter.applyWallpaper();

  function startDesktop(userName){
    const prefs = (()=>{ try { return JSON.parse(localStorage.getItem('PUTER_PREFS_V1') || '{}'); } catch { return {}; } })();
    const user = Puter.Users.find(userName);
    const name = userName || prefs.userName || 'Guest';
    const unameEl = document.getElementById('start-username');
    if (unameEl) unameEl.textContent = name;

    if (!Puter._desktopInited){
      Puter.Desktop.init();
      Puter.Taskbar.init();
      Puter.Registry.renderStart();
      Puter._desktopInited = true;
    }
    document.getElementById('desktop').classList.remove('hidden');
  }

  function showLogin(){
    document.getElementById('desktop').classList.add('hidden');
    if (!Puter.Users.setupDone()){
      Puter.Setup.init((name)=> startDesktop(name));
    } else {
      Puter.Login.init((name)=> startDesktop(name));
    }
  }

  Puter.signOut = function(){
    Puter.WindowManager.list().slice().forEach(w => Puter.WindowManager.close(w));
    document.getElementById('start-menu').classList.add('hidden');
    showLogin();
  };

  document.addEventListener('keydown', e=>{
    if (e.key === 'Escape') Puter.ContextMenu.close();
  });

  window.puter = Puter;
  showLogin();
})();
