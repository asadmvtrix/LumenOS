Puter.Registry.register({
  id:'settings',
  title:'Settings',
  icon:'assets/icons/app-settings.svg',
  launch(){
    const { el } = Puter.util;
    const prefsKey = 'PUTER_PREFS_V1';
    const prefs = (()=>{ try { return JSON.parse(localStorage.getItem(prefsKey) || '{}'); } catch { return {}; } })();
    function save(){ localStorage.setItem(prefsKey, JSON.stringify(prefs)); }

    const themeSel = el('select', null, [
      el('option', { value:'light', text:'Light' }),
      el('option', { value:'dark', text:'Dark' })
    ]);
    themeSel.value = prefs.theme || 'light';
    themeSel.addEventListener('change', ()=>{
      prefs.theme = themeSel.value; save(); applyTheme();
    });

    // ==== Wallpaper picker ====
    const wallpaperPicker = el('div', { class:'wp-picker' });
    function renderPicker(){
      wallpaperPicker.innerHTML = '';
      // Built-in options from /Pictures (images only)
      let images = [];
      try { images = Puter.VFS.list('/Pictures').filter(n => n.type === 'file' && /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(n.name)); } catch {}
      images.forEach(n => {
        const path = '/Pictures/' + n.name;
        const src = Puter.VFS.readSrc(path) || '';
        const tile = el('div', { class:'wp-tile' + (prefs.wallpaper === src ? ' active' : ''), title: n.name }, [
          el('img', { src, alt:'', loading:'lazy' }),
          el('span', { class:'wp-name', text: n.name })
        ]);
        tile.addEventListener('click', ()=>{
          prefs.wallpaper = src; save(); applyWallpaper(); renderPicker();
        });
        wallpaperPicker.appendChild(tile);
      });
      if (images.length === 0){
        wallpaperPicker.appendChild(el('div', { class:'wp-empty', text:'No images in /Pictures. Add some to see them here.' }));
      }
    }
    renderPicker();
    Puter.bus.on('fs:changed', renderPicker);

    const urlInput = el('input', { type:'text', value: prefs.wallpaper || 'assets/images/wallpaper.webp', placeholder:'Or paste an image URL…' });
    const urlBtn = el('button', { text:'Apply URL' });
    urlBtn.addEventListener('click', ()=>{
      prefs.wallpaper = urlInput.value.trim() || 'assets/images/wallpaper.webp';
      save(); applyWallpaper(); renderPicker();
    });

    const resetBtn = el('button', { text:'Reset filesystem (wipes all files)' });
    resetBtn.addEventListener('click', async ()=>{
      if (await Puter.Dialog.confirm('Reset', 'This will delete ALL files and restore defaults. Continue?')){
        Puter.VFS.reset();
      }
    });

    const clearPrefsBtn = el('button', { text:'Reset preferences' });
    clearPrefsBtn.addEventListener('click', ()=>{
      localStorage.removeItem(prefsKey);
      location.reload();
    });

    Puter.WindowManager.open({
      title:'Settings', icon:'assets/icons/cog.svg', appId:'settings',
      width:520, height:440,
      onReady(w){
        const body = el('div', { class:'settings' }, [
          el('h3', { text:'Appearance' }),
          el('div', { class:'row' }, [el('label',{text:'Theme'}), themeSel]),
          el('div', { class:'row wp-row' }, [
            el('label',{text:'Wallpaper'}),
            wallpaperPicker
          ]),
          el('div', { class:'row' }, [el('label',{text:'Custom URL'}), urlInput, urlBtn]),
          el('h3', { text:'Data' }),
          el('div', { class:'row' }, [el('label',{text:'Reset everything'}), clearPrefsBtn]),
          el('div', { class:'row' }, [el('label',{text:'Clear all files'}), resetBtn]),
          el('h3', { text:'About' }),
          el('div', { class:'row' }, [el('label',{text:'LumenOS — portable browser desktop. v1.0.0'})])
        ]);
        w.body.appendChild(body);
      }
    });
  }
});

// Applied globally
function applyTheme(){
  const prefs = (()=>{ try { return JSON.parse(localStorage.getItem('PUTER_PREFS_V1') || '{}'); } catch { return {}; } })();
  document.body.classList.toggle('theme-dark', prefs.theme === 'dark');
}
function applyWallpaper(){
  const prefs = (()=>{ try { return JSON.parse(localStorage.getItem('PUTER_PREFS_V1') || '{}'); } catch { return {}; } })();
  const dt = document.getElementById('desktop');
  if (!dt) return;
  const url = prefs.wallpaper || 'assets/images/wallpaper.webp';
  dt.style.backgroundImage = 'url("' + url.replace(/"/g,'\\"') + '")';
  dt.style.backgroundSize = 'cover';
  dt.style.backgroundPosition = 'center center';
  dt.style.backgroundRepeat = 'no-repeat';
  dt.style.backgroundColor = '#0a0d1a';
  dt.style.backgroundAttachment = 'fixed';
}
Puter.applyTheme = applyTheme;
Puter.applyWallpaper = applyWallpaper;

// Public helper used by File Explorer / Desktop context menus
Puter.setWallpaper = function(src){
  const key = 'PUTER_PREFS_V1';
  const prefs = (()=>{ try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } })();
  prefs.wallpaper = src;
  localStorage.setItem(key, JSON.stringify(prefs));
  applyWallpaper();
};
