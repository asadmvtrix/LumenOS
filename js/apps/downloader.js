Puter.Registry.register({
  id:'downloader',
  title:'Downloader',
  icon:'assets/icons/app-download.svg',
  launch(){
    const { el } = Puter.util;
    const urlInput = el('input', { type:'text', placeholder:'Paste URL (image, video, audio, text)…' });
    const destInput = el('input', { type:'text', placeholder:'Save to (e.g. /Pictures/cat.jpg)' });
    const log = el('div', { class:'dl-log' });
    const dlBtn = el('button', { class:'primary-btn', text:'Download' });

    function write(msg, cls){
      const d = el('div', { class: cls || '', text: msg });
      log.appendChild(d);
      log.scrollTop = log.scrollHeight;
    }

    function guessDest(url){
      try {
        const u = new URL(url);
        const name = (u.pathname.split('/').pop() || 'download').split('?')[0] || 'download';
        const ext = (name.split('.').pop() || '').toLowerCase();
        let folder = '/Documents';
        if (['png','jpg','jpeg','gif','webp','svg','bmp'].includes(ext)) folder = '/Pictures';
        else if (['mp4','webm','ogg','mov'].includes(ext)) folder = '/Pictures';
        return folder + '/' + name;
      } catch { return '/Documents/download'; }
    }

    urlInput.addEventListener('input', ()=>{
      if (!destInput.value && urlInput.value) destInput.value = guessDest(urlInput.value);
    });

    async function download(){
      const url = urlInput.value.trim();
      const dest = destInput.value.trim();
      if (!url){ Puter.Dialog.alert('Missing', 'Enter a URL.'); return; }
      if (!dest){ Puter.Dialog.alert('Missing', 'Enter a destination path.'); return; }
      write('Fetching ' + url + ' …');
      dlBtn.disabled = true;
      try {
        const resp = await fetch(url, { mode:'cors' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const ct = resp.headers.get('content-type') || 'application/octet-stream';
        const isText = /^text\/|json|xml|svg/i.test(ct);
        let data;
        if (isText){
          data = await resp.text();
          write('Downloaded as text (' + Puter.util.fmtSize(data.length) + ')');
        } else {
          const blob = await resp.blob();
          data = await blobToDataURL(blob);
          write('Downloaded as binary (' + Puter.util.fmtSize(blob.size) + ')');
        }
        Puter.VFS.writeFile(dest, data, ct);
        write('Saved to ' + dest, 'ok');
      } catch(e){
        write('Failed: ' + e.message, 'err');
        write('(Many sites block cross-origin downloads via CORS. Direct-link images/files usually work.)', 'hint');
      } finally {
        dlBtn.disabled = false;
      }
    }
    function blobToDataURL(blob){
      return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = ()=> res(r.result);
        r.onerror = ()=> rej(r.error);
        r.readAsDataURL(blob);
      });
    }

    dlBtn.addEventListener('click', download);
    [urlInput, destInput].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') download(); }));

    Puter.WindowManager.open({
      title:'Downloader', icon:'assets/icons/app.svg', appId:'downloader',
      width:560, height:420,
      onReady(w){
        const body = el('div', { class:'dl-wrap' }, [
          el('div', { class:'dl-row' }, [el('label',{text:'URL'}), urlInput]),
          el('div', { class:'dl-row' }, [el('label',{text:'Save to'}), destInput]),
          el('div', { class:'dl-row' }, [dlBtn]),
          log,
          el('div', { class:'dl-hint', text:'Tip: direct links to images/videos work best. Most websites block fetching their pages due to CORS policy.' })
        ]);
        w.body.appendChild(body);
      }
    });
  }
});
