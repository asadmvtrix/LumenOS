Puter.Registry.register({
  id:'media-player',
  title:'Media Player',
  icon:'assets/icons/app-media.svg',
  handlesExt:['mp4','webm','ogg','mp3','wav','m4a','png','jpg','jpeg','gif','webp','svg','bmp'],
  launch(args){
    const { el, extOf } = Puter.util;
    const view = el('div', { class:'mp-view' });
    const info = el('div', { class:'app-statusbar', text:'No media loaded' });

    function isImage(ext){ return ['png','jpg','jpeg','gif','webp','svg','bmp'].includes(ext); }
    function isVideo(ext){ return ['mp4','webm','ogg','mov'].includes(ext); }
    function isAudio(ext){ return ['mp3','wav','m4a','ogg'].includes(ext); }

    function srcFor(path){
      // External file? Use its URL directly.
      const extSrc = Puter.VFS.readSrc(path);
      if (extSrc) return extSrc;
      // Otherwise read data (text like SVG or data URLs)
      const data = Puter.VFS.read(path);
      if (data && data.startsWith('data:')) return data;
      if (extOf(path) === 'svg') return 'data:image/svg+xml;base64,' + btoa(data);
      return null;
    }

    function load(path){
      view.innerHTML = '';
      let src;
      try { src = srcFor(path); } catch(e){ info.textContent = 'Error: ' + e.message; return; }
      if (!src){ info.textContent = 'Cannot display (unsupported or empty file)'; return; }
      const ext = extOf(path);
      if (isImage(ext)){
        view.appendChild(el('img', { src, alt: path }));
      } else if (isVideo(ext)){
        view.appendChild(el('video', { src, controls:'true', autoplay:'true' }));
      } else if (isAudio(ext)){
        view.appendChild(el('audio', { src, controls:'true', autoplay:'true' }));
      } else {
        info.textContent = 'Unsupported file type: ' + ext;
        return;
      }
      info.textContent = path;
    }

    Puter.WindowManager.open({
      title: args.path ? args.path.split('/').pop() + ' — Media Player' : 'Media Player',
      icon:'assets/icons/app-media.svg', appId:'media-player',
      width:820, height:580,
      onReady(w){
        const toolbar = el('div', { class:'app-toolbar' });
        const openBtn = el('button', { text:'Open…' });
        openBtn.addEventListener('click', async ()=>{
          const p = await Puter.Dialog.prompt('Open Media', 'Path in file system:', '/Pictures/');
          if (p) load(p);
        });
        const openUrlBtn = el('button', { text:'Open URL…' });
        openUrlBtn.addEventListener('click', async ()=>{
          const u = await Puter.Dialog.prompt('Open URL', 'Image/video URL:', 'https://');
          if (!u) return;
          view.innerHTML = '';
          const ext = (u.split('?')[0].split('.').pop() || '').toLowerCase();
          let elem;
          if (isVideo(ext)) elem = el('video', { src:u, controls:'true', autoplay:'true' });
          else if (isAudio(ext)) elem = el('audio', { src:u, controls:'true', autoplay:'true' });
          else elem = el('img', { src:u });
          view.appendChild(elem);
          info.textContent = u;
        });
        toolbar.append(openBtn, openUrlBtn);
        w.body.appendChild(el('div', { class:'mp-wrap' }, [toolbar, view, info]));
        if (args.path) load(args.path);
      }
    });
  }
});
