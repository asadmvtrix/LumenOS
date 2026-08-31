Puter.Registry.register({
  id:'browser',
  title:'Browser',
  icon:'assets/icons/app-browser.svg',
  launch(args){
    const { el, esc } = Puter.util;
    const bmKey = 'LUMEN_BROWSER_BOOKMARKS_V1';
    const homeUrl = 'about:home';
    const tabs = []; let activeTab = null;

    function loadBookmarks(){
      try { return JSON.parse(localStorage.getItem(bmKey) || 'null') || defaultBookmarks(); }
      catch { return defaultBookmarks(); }
    }
    function saveBookmarks(list){ localStorage.setItem(bmKey, JSON.stringify(list)); }
    function defaultBookmarks(){
      return [
        { name:'Wikipedia', url:'https://en.wikipedia.org/wiki/Main_Page' },
        { name:'MDN', url:'https://developer.mozilla.org' },
        { name:'Example.com', url:'https://example.com' },
        { name:'HTTPBin', url:'https://httpbin.org' }
      ];
    }

    // Quick-link shortcuts — real favicons via Google's S2 service (public, no auth).
    function favicon(domain){ return 'https://www.google.com/s2/favicons?sz=64&domain=' + domain; }
    const shortcuts = [
      { name:'Google', url:'https://www.google.com', icon:favicon('google.com'), embed:false },
      { name:'YouTube', url:'https://www.youtube.com', icon:favicon('youtube.com'), embed:false },
      { name:'GitHub', url:'https://github.com', icon:favicon('github.com'), embed:false },
      { name:'Wikipedia', url:'https://en.wikipedia.org/wiki/Main_Page', icon:favicon('wikipedia.org'), embed:true },
      { name:'MDN', url:'https://developer.mozilla.org', icon:favicon('developer.mozilla.org'), embed:true },
      { name:'Reddit', url:'https://www.reddit.com', icon:favicon('reddit.com'), embed:false },
      { name:'Stack Overflow', url:'https://stackoverflow.com', icon:favicon('stackoverflow.com'), embed:false },
      { name:'ChatGPT', url:'https://chat.openai.com', icon:favicon('openai.com'), embed:false },
      { name:'Twitter/X', url:'https://x.com', icon:favicon('x.com'), embed:false },
      { name:'LinkedIn', url:'https://linkedin.com', icon:favicon('linkedin.com'), embed:false },
      { name:'Example', url:'https://example.com', icon:favicon('example.com'), embed:true },
      { name:'HTTPBin', url:'https://httpbin.org', icon:favicon('httpbin.org'), embed:true }
    ];

    function resolveInput(v){
      v = (v || '').trim();
      if (!v) return homeUrl;
      if (v === 'about:home' || v === 'home') return homeUrl;
      if (/^https?:\/\//i.test(v)) return v;
      if (/^[\w-]+\.[\w.-]+/.test(v)) return 'https://' + v;
      // treat as a Google search — opens in real browser because Google blocks iframe
      return 'search:' + encodeURIComponent(v);
    }

    function homePageHTML(){
      const sc = shortcuts.map(s =>
        `<a href="#" class="sc" data-url="${esc(s.url)}" data-embed="${s.embed ? '1' : '0'}">
          <div class="sc-tile"><img src="${esc(s.icon)}" alt="" onerror="this.style.display='none'"/></div>
          <span>${esc(s.name)}</span>
        </a>`
      ).join('');
      return `<!doctype html><html><head><meta charset="utf-8"><style>
        *{box-sizing:border-box}
        body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
             background:linear-gradient(160deg,#0f1220 0%,#1a1f3a 50%,#2d1f4a 100%);
             color:#fff;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px}
        .brand{font-size:54px;font-weight:300;letter-spacing:8px;margin-bottom:4px;background:linear-gradient(90deg,#6f8cff,#a155c9);-webkit-background-clip:text;background-clip:text;color:transparent}
        .tagline{color:rgba(255,255,255,.55);margin-bottom:30px;font-size:13px;letter-spacing:1px}
        form{width:100%;max-width:600px;display:flex;background:rgba(255,255,255,.08);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.15);border-radius:30px;overflow:hidden;margin-bottom:12px}
        input{flex:1;background:transparent;border:none;outline:none;color:#fff;padding:14px 22px;font-size:15px}
        input::placeholder{color:rgba(255,255,255,.45)}
        button{background:linear-gradient(135deg,#6f8cff,#a155c9);color:#fff;border:none;padding:0 26px;cursor:pointer;font-size:14px;font-weight:500}
        .hint{color:rgba(255,255,255,.4);font-size:11px;margin-bottom:36px;text-align:center;max-width:500px;line-height:1.5}
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:14px;max-width:640px;width:100%}
        a.sc{display:flex;flex-direction:column;align-items:center;gap:8px;text-decoration:none;color:#fff;font-size:12px;transition:transform .15s}
        a.sc:hover{transform:translateY(-3px)}
        a.sc .sc-tile{width:60px;height:60px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.35);overflow:hidden}
        a.sc .sc-tile img{width:40px;height:40px;object-fit:contain}
      </style></head><body>
        <div class="brand">LUMEN</div>
        <div class="tagline">Your portable desktop · Search the web</div>
        <form id="sf">
          <input id="q" type="text" placeholder="Search Google or type a URL…" autofocus />
          <button type="submit">Search</button>
        </form>
        <div class="hint">Pages from sites that permit embedding will open here. Everything else opens in a real browser tab.</div>
        <div class="grid">${sc}</div>
        <script>
          const send = (payload) => parent.postMessage(Object.assign({type:'lumen-browser-nav'}, payload), '*');
          document.getElementById('sf').addEventListener('submit', e=>{
            e.preventDefault();
            const q = document.getElementById('q').value.trim();
            if (!q) return;
            send({ query:q });
          });
          document.querySelectorAll('a.sc').forEach(a => a.addEventListener('click', e=>{
            e.preventDefault();
            send({ url:a.dataset.url, embed: a.dataset.embed === '1' });
          }));
        <\/script>
      </body></html>`;
    }

    // --- UI ---
    const tabstrip = el('div', { class:'bw-tabs' });
    const addTabBtn = el('button', { class:'bw-addtab', html:'+', title:'New tab' });
    const tabstripWrap = el('div', { class:'bw-tabstrip' }, [tabstrip, addTabBtn]);

    const backBtn = el('button', { html:'&#8592;', title:'Back' });
    const fwdBtn = el('button', { html:'&#8594;', title:'Forward' });
    const reloadBtn = el('button', { html:'&#8635;', title:'Reload' });
    const homeBtn = el('button', { html:'&#8962;', title:'Home' });
    const urlBar = el('input', { class:'bw-url', placeholder:'Search or enter URL' });
    const goBtn = el('button', { text:'Go' });
    const bmBtn = el('button', { html:'&#9733;', title:'Bookmark this page' });
    const openExtBtn = el('button', { text:'Open in real browser', class:'bw-ext' });

    const toolbar = el('div', { class:'bw-toolbar' }, [backBtn, fwdBtn, reloadBtn, homeBtn, urlBar, goBtn, bmBtn, openExtBtn]);

    const bmBar = el('div', { class:'bw-bmbar' });
    function renderBookmarks(){
      bmBar.innerHTML = '';
      loadBookmarks().forEach((b, idx) => {
        const b1 = el('button', { class:'bw-bm', text: b.name });
        b1.addEventListener('click', ()=> navigate(b.url));
        b1.addEventListener('contextmenu', e=>{
          e.preventDefault();
          Puter.ContextMenu.show(e.clientX, e.clientY, [
            { label:'Open', onClick: ()=> navigate(b.url) },
            { label:'Rename', onClick: async ()=>{
              const nn = await Puter.Dialog.prompt('Rename bookmark', 'New name:', b.name);
              if (nn){ const list = loadBookmarks(); list[idx].name = nn; saveBookmarks(list); renderBookmarks(); }
            }},
            { label:'Delete', onClick: ()=>{
              const list = loadBookmarks(); list.splice(idx, 1); saveBookmarks(list); renderBookmarks();
            }}
          ]);
        });
        bmBar.appendChild(b1);
      });
    }

    const frameWrap = el('div', { class:'bw-frame' });
    const statusBar = el('div', { class:'app-statusbar', text:'' });

    // --- Tab management ---
    function createTab(url){
      const tab = {
        id: Puter.util.uid('tab_'),
        url: url || homeUrl,
        history: [], hIdx: -1,
        title: 'New Tab',
        iframe: null
      };
      const iframe = el('iframe', { class:'bw-iframe', sandbox:'allow-scripts allow-same-origin allow-forms allow-popups allow-downloads' });
      iframe.style.display = 'none';
      frameWrap.appendChild(iframe);
      tab.iframe = iframe;
      tabs.push(tab);
      renderTabs();
      activate(tab);
      navigate(tab.url);
      return tab;
    }
    function closeTab(tab){
      const idx = tabs.indexOf(tab);
      if (idx < 0) return;
      tab.iframe.remove();
      tabs.splice(idx, 1);
      if (activeTab === tab){
        activeTab = tabs[Math.min(idx, tabs.length-1)] || null;
        if (!activeTab) createTab(homeUrl);
        else activate(activeTab);
      }
      renderTabs();
    }
    function activate(tab){
      activeTab = tab;
      tabs.forEach(t => t.iframe.style.display = (t === tab ? 'block' : 'none'));
      urlBar.value = tab.url === homeUrl ? '' : tab.url;
      renderTabs();
      updateNavButtons();
    }
    function renderTabs(){
      tabstrip.innerHTML = '';
      tabs.forEach(t => {
        const tEl = el('div', { class:'bw-tab' + (t === activeTab ? ' active' : '') }, [
          el('span', { class:'bw-tab-title', text: t.title || 'Loading…' }),
          el('button', { class:'bw-tab-close', html:'&#215;', title:'Close tab' })
        ]);
        tEl.addEventListener('click', (e)=>{
          if (e.target.classList.contains('bw-tab-close')){ closeTab(t); return; }
          activate(t);
        });
        tabstrip.appendChild(tEl);
      });
    }

    function loadUrlIntoFrame(tab, url){
      if (url === homeUrl){
        tab.iframe.srcdoc = homePageHTML();
        tab.title = 'Home';
      } else if (url.startsWith('search:')){
        const q = decodeURIComponent(url.slice(7));
        const realUrl = 'https://www.google.com/search?q=' + encodeURIComponent(q);
        statusBar.textContent = 'Google blocks embedding — opening search in a real browser tab.';
        window.open(realUrl, '_blank', 'noopener');
        // go back to home after opening search
        tab.url = homeUrl;
        tab.iframe.srcdoc = homePageHTML();
        tab.title = 'Home';
        // also pop the search entry from history so back button works cleanly
        if (tab.history[tab.hIdx] === url){
          tab.history.splice(tab.hIdx, 1);
          tab.hIdx = Math.max(-1, tab.hIdx - 1);
          tab.history.splice(tab.hIdx + 1, 0, homeUrl);
          tab.hIdx = tab.hIdx + 1;
        }
        urlBar.value = '';
        return;
      } else {
        tab.iframe.removeAttribute('srcdoc');
        try { tab.iframe.src = url; } catch(e){ statusBar.textContent = 'Error: ' + e.message; }
        try { tab.title = new URL(url).hostname; } catch { tab.title = url; }
      }
    }

    // Navigate pushes history. Back/forward use goHistory(delta) instead.
    function navigate(url){
      if (!activeTab) return;
      const resolved = resolveInput(url);
      activeTab.url = resolved;
      urlBar.value = resolved === homeUrl || resolved.startsWith('search:') ? '' : resolved;
      statusBar.textContent = resolved.startsWith('search:') ? '' : ('Loading ' + resolved);
      activeTab.history = activeTab.history.slice(0, activeTab.hIdx + 1);
      activeTab.history.push(resolved);
      activeTab.hIdx = activeTab.history.length - 1;
      loadUrlIntoFrame(activeTab, resolved);
      renderTabs();
      updateNavButtons();
    }
    function goHistory(delta){
      if (!activeTab) return;
      const target = activeTab.hIdx + delta;
      if (target < 0 || target >= activeTab.history.length) return;
      activeTab.hIdx = target;
      const url = activeTab.history[target];
      activeTab.url = url;
      urlBar.value = url === homeUrl || url.startsWith('search:') ? '' : url;
      statusBar.textContent = 'Loading ' + url;
      loadUrlIntoFrame(activeTab, url);
      renderTabs();
      updateNavButtons();
    }
    function updateNavButtons(){
      if (!activeTab){ backBtn.disabled = fwdBtn.disabled = true; return; }
      backBtn.disabled = activeTab.hIdx <= 0;
      fwdBtn.disabled = activeTab.hIdx >= activeTab.history.length - 1;
    }

    backBtn.addEventListener('click', ()=> goHistory(-1));
    fwdBtn.addEventListener('click', ()=> goHistory(+1));
    reloadBtn.addEventListener('click', ()=>{ if (activeTab) loadUrlIntoFrame(activeTab, activeTab.url); });
    homeBtn.addEventListener('click', ()=> navigate(homeUrl));
    goBtn.addEventListener('click', ()=> navigate(urlBar.value));
    urlBar.addEventListener('keydown', e => { if (e.key === 'Enter') navigate(urlBar.value); });
    addTabBtn.addEventListener('click', ()=> createTab(homeUrl));
    openExtBtn.addEventListener('click', ()=>{
      if (!activeTab || activeTab.url === homeUrl) return;
      let u = activeTab.url;
      if (u.startsWith('search:')) u = 'https://www.google.com/search?q=' + u.slice(7);
      window.open(u, '_blank', 'noopener');
    });
    bmBtn.addEventListener('click', async ()=>{
      if (!activeTab || activeTab.url === homeUrl || activeTab.url.startsWith('search:')){ Puter.Dialog.alert('Bookmark', 'Navigate somewhere first.'); return; }
      const name = await Puter.Dialog.prompt('Add bookmark', 'Name:', activeTab.title || activeTab.url);
      if (!name) return;
      const list = loadBookmarks(); list.push({ name, url: activeTab.url }); saveBookmarks(list); renderBookmarks();
    });

    // iframe load events to update title
    frameWrap.addEventListener('load', (e)=>{
      const t = tabs.find(x => x.iframe === e.target);
      if (!t) return;
      try { const doc = t.iframe.contentDocument; if (doc && doc.title) t.title = doc.title; } catch {}
      if (t === activeTab && !t.url.startsWith('search:')) statusBar.textContent = 'Loaded';
      renderTabs();
    }, true);

    // Messages from the embedded home page
    const msgHandler = (ev) => {
      if (!ev.data || ev.data.type !== 'lumen-browser-nav') return;
      if (ev.data.query){
        // search: open in real browser
        window.open('https://www.google.com/search?q=' + encodeURIComponent(ev.data.query), '_blank', 'noopener');
        statusBar.textContent = 'Search opened in a real browser tab.';
        return;
      }
      if (ev.data.url){
        if (ev.data.embed === false){
          window.open(ev.data.url, '_blank', 'noopener');
          statusBar.textContent = 'Opened ' + ev.data.url + ' in a real browser tab (site blocks embedding).';
        } else {
          navigate(ev.data.url);
        }
      }
    };
    window.addEventListener('message', msgHandler);

    Puter.WindowManager.open({
      title:'Browser', icon:'assets/icons/app-browser.svg', appId:'browser',
      width:980, height:640,
      onClose(){ window.removeEventListener('message', msgHandler); },
      onReady(w){
        const body = el('div', { class:'bw-wrap' }, [tabstripWrap, toolbar, bmBar, frameWrap, statusBar]);
        w.body.appendChild(body);
        renderBookmarks();
        createTab(args && args.url ? args.url : homeUrl);
      }
    });
  }
});
