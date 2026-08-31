Puter.Registry.register({
  id:'ai-assistant',
  title:'AI Assistant',
  icon:'assets/icons/app-ai.svg',
  launch(){
    const { el, esc } = Puter.util;
    const settingsKey = 'LUMEN_AI_SETTINGS_V1';
    // Demo fallback — used when the user hasn't entered their own key.
    // NOTE: anyone who opens the site can read this in DevTools. Treat as burner.
    const DEFAULT_PROVIDER = { provider:'gemini', apiKey:'', model:'gemini-2.0-flash-lite' };
    function loadSettings(){
      try {
        const s = JSON.parse(localStorage.getItem(settingsKey) || '{}');
        // If user never configured one, return the built-in default
        if (!s.provider || !s.apiKey) return { ...DEFAULT_PROVIDER, _default:true };
        return s;
      } catch { return { ...DEFAULT_PROVIDER, _default:true }; }
    }
    function saveSettings(s){ localStorage.setItem(settingsKey, JSON.stringify(s)); }

    const state = { messages: [], busy: false };

    const log = el('div', { class:'ai-log' });
    const input = el('textarea', { class:'ai-input', placeholder:'Ask me anything…', rows:'2' });
    const sendBtn = el('button', { class:'primary-btn', text:'Send' });
    const settingsBtn = el('button', { class:'ai-gear', html:'&#9881;', title:'Settings' });
    const clearBtn = el('button', { text:'Clear' });

    function fmt(text){
      return esc(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Basic markdown links [text](url)
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:underline">$1</a>')
        .replace(/\n/g, '<br>');
    }

    function addMsg(role, text){
      const msg = el('div', { class:'ai-msg ai-' + role });
      const bubble = el('div', { class:'ai-bubble' });
      bubble.innerHTML = fmt(text);
      msg.appendChild(bubble);
      log.appendChild(msg);
      log.scrollTop = log.scrollHeight;
      return bubble;
    }

    function providerLabel(){
      const s = loadSettings();
      if (s._default) return 'gemini (built-in)';
      if (s.apiKey && s.provider) return s.provider;
      return 'offline';
    }

    function greet(){
      const mode = providerLabel();
      const s = loadSettings();
      const usingDemo = !!s._default;
      addMsg('bot', "Hi! I'm your **LumenOS Assistant** — running in **" + mode + "** mode.\n\n" +
        "Try:\n" +
        "- `open paint` — I'll launch apps for you\n" +
        "- `set wallpaper ferrari` — change your wallpaper\n" +
        "- *Tell me about LumenOS*\n" +
        "- Any general question works too.\n\n" +
        (usingDemo
          ? "The built-in demo key has a shared quota. Hitting rate limits? Grab your own free key in 30 seconds at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and paste it in ⚙."
          : "Click ⚙ to change provider or model."));
    }

    // ===== ACTION COMMANDS (work in any mode) =====
    // Return {handled:true, reply:'...'} if the input triggered an action, else {handled:false}
    function handleAction(q){
      const s = q.trim().toLowerCase();

      // open <app>
      const mOpen = s.match(/^(?:open|launch|start|run)\s+(.+?)[!.?]?$/);
      if (mOpen){
        const target = mOpen[1].trim();
        const apps = Puter.Registry.list();
        const match = apps.find(a => a.id === target || a.title.toLowerCase() === target || a.title.toLowerCase().replace(/\s+/g,'') === target.replace(/\s+/g,''))
          || apps.find(a => a.title.toLowerCase().includes(target) || target.includes(a.id));
        if (match){
          Puter.Registry.launch(match.id);
          return { handled:true, reply: "Opening **" + match.title + "** for you." };
        }
        return { handled:true, reply: "I couldn't find an app called *" + target + "*. Try: " + apps.map(a=>'`'+a.title+'`').join(', ') };
      }

      // list apps
      if (/^(?:what (apps|programs)|list apps|show apps|apps)$/.test(s)){
        const list = Puter.Registry.list().map(a => '- **' + a.title + '** (`' + a.id + '`)').join('\n');
        return { handled:true, reply: 'Installed apps:\n' + list };
      }

      // sign out
      if (/^(?:sign ?out|log ?out|logout|lock)$/.test(s)){
        setTimeout(()=> Puter.signOut && Puter.signOut(), 400);
        return { handled:true, reply:'Signing you out…' };
      }

      // theme
      let mTheme = s.match(/\b(?:switch to |set |change to )?(dark|light)\s*(?:mode|theme)?\b/);
      if (mTheme){
        const theme = mTheme[1];
        const prefsKey = 'PUTER_PREFS_V1';
        const prefs = (()=>{ try { return JSON.parse(localStorage.getItem(prefsKey) || '{}'); } catch { return {}; } })();
        prefs.theme = theme; localStorage.setItem(prefsKey, JSON.stringify(prefs));
        Puter.applyTheme();
        return { handled:true, reply: 'Switched to **' + theme + ' theme**.' };
      }

      // set wallpaper <query>
      const mWall = s.match(/^set\s+wallpaper\s+(.+)$/);
      if (mWall){
        const q2 = mWall[1].trim();
        let picks = [];
        try { picks = Puter.VFS.list('/Pictures').filter(n => n.type==='file'); } catch {}
        const found = picks.find(n => n.name.toLowerCase().includes(q2));
        if (found){
          const src = Puter.VFS.readSrc('/Pictures/' + found.name) || '/Pictures/' + found.name;
          const prefsKey = 'PUTER_PREFS_V1';
          const prefs = (()=>{ try { return JSON.parse(localStorage.getItem(prefsKey) || '{}'); } catch { return {}; } })();
          prefs.wallpaper = src; localStorage.setItem(prefsKey, JSON.stringify(prefs));
          Puter.applyWallpaper();
          return { handled:true, reply: 'Wallpaper set to **' + found.name + '**.' };
        }
        return { handled:true, reply: "I couldn't find an image in /Pictures matching *" + q2 + "*. Available: " + picks.map(p=>'`'+p.name+'`').join(', ') };
      }

      // calculate
      const mCalc = s.match(/^(?:what(?:'s|s| is)?\s+|calc(?:ulate)?\s+)?([\d+\-*/().%\s]+)$/);
      if (mCalc && /[+\-*/%]/.test(mCalc[1])){
        try {
          const r = Function('"use strict";return (' + mCalc[1] + ')')();
          if (isFinite(r)) return { handled:true, reply: '**' + mCalc[1].trim() + ' = ' + r + '**' };
        } catch {}
      }

      return { handled:false };
    }

    // ===== OFFLINE FALLBACK =====
    const faq = [
      { m: /\b(hi|hello|hey|yo)\b/i, r: "Hey! 👋 What can I help you with?" },
      { m: /\b(help|what can you do)\b/i, r: "I can:\n- **Open apps** — try `open paint` or `open browser`\n- **Switch themes** — `dark mode` / `light mode`\n- **Set wallpaper** — `set wallpaper ferrari`\n- **Sign you out** — `sign out`\n- Do math — `what is 45 * 12`\n- Answer questions about LumenOS" },
      { m: /\b(theme|dark|light)\b/i, r: "Say `dark mode` or `light mode` and I'll switch it. Or go to **Settings → Appearance**." },
      { m: /\bwallpaper|background\b/i, r: "Say `set wallpaper <name>` (e.g. `set wallpaper sunset`), or right-click an image in **File Explorer → Set as wallpaper**. Settings has a full picker too." },
      { m: /\bopen.*file|how.*open/i, r: "Double-click any file in **File Explorer**, or launch apps from **Start menu**." },
      { m: /\bsave.*paint|paint/i, r: "**Paint** has: Brush, Eraser, Color picker, Size slider, Undo, Clear, and Save PNG. Save PNGs to `/Pictures/`." },
      { m: /\bbrowser\b/i, r: "**Browser** supports tabs, bookmarks, and URL/search. Big sites that block embedding (Google, YouTube) open in a real browser tab." },
      { m: /\bdownload\b/i, r: "**Downloader**: paste a URL and destination path. It fetches and saves to your VFS. Works for most direct image/video links (CORS-permitting)." },
      { m: /\bterminal|cmd/i, r: "**Terminal** commands: `ls`, `cd`, `cat`, `echo`, `mkdir`, `rm`, `touch`, `launch <appId>`, `apps`, `help`, `clear`. Use ↑/↓ for history." },
      { m: /\breset|clear.*data/i, r: "**Settings → Data**: Reset preferences (reloads) or Clear all files (wipes VFS, restores defaults)." },
      { m: /\b(who|about|lumen)/i, r: "I'm the built-in assistant for **LumenOS** — a portable browser-based desktop OS. 100% frontend. No server, no installs. Version 1.0." },
      { m: /\b(api|key|online|gpt|claude|gemini|anthropic|openai)/i, r: "Click the ⚙ icon to add a key. Supported providers: **OpenAI** (GPT models), **Anthropic** (Claude), **Google Gemini**. Your key is stored in your browser only." },
      { m: /\bthanks?\b/i, r: "You're welcome! Anything else?" },
      { m: /\bbye\b/i, r: "See you around! 👋" }
    ];
    function offlineReply(q){
      for (const f of faq){ if (f.m.test(q)) return f.r; }
      return "I don't have a trained answer for that offline. Try keywords like *apps, theme, wallpaper, paint, browser, terminal, reset*, or add an API key (⚙) for full AI answers.";
    }

    // ===== ONLINE PROVIDERS =====
    async function onlineReply(q){
      const s = loadSettings();
      const history = state.messages.map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }));
      history.push({ role:'user', content: q });
      const appList = Puter.Registry.list().map(a => a.title).join(', ');
      const sys = [
        'You are the AI assistant inside LumenOS — a portable browser-based desktop OS. Be concise and friendly. Use **bold** and `code` where helpful.',
        '',
        'IMPORTANT — LumenOS has EXACTLY these action commands. NEVER invent others. If a user asks to do something these commands don\'t cover, say so honestly and suggest the closest manual alternative:',
        '  • `open <app-name>` — launches an app. Valid app names: ' + appList + '.',
        '  • `set wallpaper <keyword>` — changes wallpaper by matching an image name in /Pictures (e.g. `set wallpaper ferrari`).',
        '  • `dark mode` / `light mode` — switch theme.',
        '  • `sign out` — logs the user out to the login screen.',
        '  • Plain arithmetic like `45 * 12` — you\'ll do the math.',
        '',
        'There is NO "create new document" command, NO "tell me a fun fact" command, NO "what is the date" command, NO "show all apps" command. Don\'t list commands that don\'t exist.',
        '',
        'For general knowledge questions, answer normally. For LumenOS-specific questions (how to use an app, where a setting is), be factual — don\'t make up features. If unsure, say so.'
      ].join('\n');

      if (s.provider === 'openai'){
        return callOpenAI(s, sys, history);
      } else if (s.provider === 'anthropic'){
        return callAnthropic(s, sys, history);
      } else if (s.provider === 'gemini'){
        return callGemini(s, sys, history);
      } else {
        throw new Error('No provider selected. Open settings (⚙) and pick one.');
      }
    }

    async function callOpenAI(s, sys, history){
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + s.apiKey },
        body: JSON.stringify({
          model: s.model || 'gpt-4o-mini',
          messages: [{ role:'system', content: sys }, ...history]
        })
      });
      if (!resp.ok) throw new Error('OpenAI HTTP ' + resp.status + ': ' + (await resp.text()).slice(0,200));
      const json = await resp.json();
      return json.choices?.[0]?.message?.content || '(empty response)';
    }

    async function callAnthropic(s, sys, history){
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'x-api-key': s.apiKey,
          'anthropic-version':'2023-06-01',
          'anthropic-dangerous-direct-browser-access':'true'
        },
        body: JSON.stringify({
          model: s.model || 'claude-3-5-haiku-latest',
          max_tokens: 1024,
          system: sys,
          messages: history
        })
      });
      if (!resp.ok) throw new Error('Anthropic HTTP ' + resp.status + ': ' + (await resp.text()).slice(0,200));
      const json = await resp.json();
      return json.content?.[0]?.text || '(empty response)';
    }

    async function callGemini(s, sys, history){
      // Try multiple models in order — if one is rate-limited, try the next.
      const contents = history.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
      const preferred = s.model && s.model.trim();
      const fallbacks = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-1.5-flash-8b'];
      const models = preferred ? [preferred, ...fallbacks.filter(m => m !== preferred)] : fallbacks;

      const keyTail = (s.apiKey || '').slice(-6);
      let lastErr;
      for (const model of models){
        try {
          const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(s.apiKey), {
            method:'POST',
            headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents })
          });
          if (resp.ok){
            const json = await resp.json();
            const parts = json.candidates?.[0]?.content?.parts || [];
            const text = parts.map(p => p.text).join('\n') || '(empty response)';
            return text + (model !== models[0] ? '\n\n_(via ' + model + ' — your default was rate-limited)_' : '');
          }
          const body = (await resp.text()).slice(0,200);
          lastErr = new Error('Gemini HTTP ' + resp.status + ' on ' + model + ' (key …' + keyTail + '): ' + body);
          // Only retry on 429 (rate limit); bail on 400/401/403/404
          if (resp.status !== 429) throw lastErr;
        } catch(e){
          lastErr = e;
          if (!/429/.test(e.message)) throw e;
        }
      }
      throw lastErr || new Error('All Gemini models rate-limited.');
    }

    async function send(){
      const q = input.value.trim();
      if (!q || state.busy) return;
      input.value = '';
      addMsg('user', q);
      state.messages.push({ role:'user', text:q });

      // Actions run first, regardless of mode
      const action = handleAction(q);
      if (action.handled){
        const b = addMsg('bot', action.reply);
        state.messages.push({ role:'bot', text: action.reply });
        return;
      }

      const thinking = addMsg('bot', '…');
      state.busy = true; sendBtn.disabled = true;
      try {
        const s = loadSettings();
        let answer;
        if (s.apiKey && s.provider){
          try {
            answer = await onlineReply(q);
          } catch(onlineErr){
            console.warn('Online provider failed, falling back to offline:', onlineErr);
            const msg = onlineErr.message || '';
            let friendly;
            if (/\b429\b|quota|rate/i.test(msg)){
              friendly = "**Quota hit on the shared demo key** — the free Gemini tier is limited. Two options:\n\n" +
                "1. **Wait a minute** and try again (per-minute limits reset fast).\n" +
                "2. **Get your own free key** — takes 30 seconds at [aistudio.google.com/apikey](https://aistudio.google.com/apikey), then paste it in ⚙.\n\n" +
                "Meanwhile, I can still use offline answers and action commands like `open paint` or `set wallpaper ferrari`.";
            } else if (/\b401\b|\b403\b|invalid|unauthoriz/i.test(msg)){
              friendly = "**Auth failed** — the built-in key may have been revoked. Add your own key via ⚙ (free from aistudio.google.com).";
            } else if (/\b404\b|not found/i.test(msg)){
              friendly = "**Model not available** — Google may have deprecated the default model. Try changing the model name in ⚙ settings.";
            } else {
              friendly = offlineReply(q) + "\n\n_(Online error: " + msg.slice(0, 100) + ")_";
            }
            answer = friendly;
          }
        } else {
          await new Promise(r => setTimeout(r, 250));
          answer = offlineReply(q);
        }
        thinking.innerHTML = fmt(answer);
        state.messages.push({ role:'bot', text: answer });
      } catch(e){
        thinking.innerHTML = '<span style="color:#e63946">Error: ' + esc(e.message) + '</span>';
      } finally {
        state.busy = false; sendBtn.disabled = false; input.focus();
      }
    }

    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); send(); }
    });
    clearBtn.addEventListener('click', ()=>{
      state.messages = [];
      log.innerHTML = '';
      greet();
    });

    const MODEL_OPTIONS = {
      openai: [
        { value:'gpt-4o-mini', label:'GPT-4o mini (fast, cheap)' },
        { value:'gpt-4o', label:'GPT-4o (smart)' },
        { value:'gpt-4-turbo', label:'GPT-4 Turbo' },
        { value:'gpt-3.5-turbo', label:'GPT-3.5 Turbo' }
      ],
      anthropic: [
        { value:'claude-3-5-haiku-latest', label:'Claude 3.5 Haiku (fast)' },
        { value:'claude-3-5-sonnet-latest', label:'Claude 3.5 Sonnet (smart)' },
        { value:'claude-3-opus-latest', label:'Claude 3 Opus (smartest)' }
      ],
      gemini: [
        { value:'gemini-2.0-flash-lite', label:'Gemini 2.0 Flash Lite (highest quota)' },
        { value:'gemini-2.0-flash', label:'Gemini 2.0 Flash' },
        { value:'gemini-2.5-flash', label:'Gemini 2.5 Flash (smart)' },
        { value:'gemini-flash-latest', label:'Gemini Flash (latest)' }
      ]
    };
    const PROVIDER_HINTS = {
      openai: 'Get a key at platform.openai.com',
      anthropic: 'Get a key at console.anthropic.com',
      gemini: 'Get a free key at aistudio.google.com/apikey'
    };

    settingsBtn.addEventListener('click', ()=>{
      const s = loadSettings();
      const provider = el('select', { class:'ai-provider-sel' }, [
        el('option', { value:'', text:'— Use built-in (Gemini demo key) —' }),
        el('option', { value:'openai', text:'OpenAI (GPT)' }),
        el('option', { value:'anthropic', text:'Anthropic (Claude)' }),
        el('option', { value:'gemini', text:'Google Gemini' })
      ]);
      provider.value = s._default ? '' : (s.provider || '');

      // Masked key input — shows dots once typed; "Show" button reveals
      const keyInput = el('input', {
        type:'password',
        value: s._default ? '' : (s.apiKey || ''),
        placeholder:'Paste your API key here…',
        autocomplete:'off',
        spellcheck:'false',
        class:'ai-key-input'
      });
      const toggleBtn = el('button', { class:'ai-key-toggle', type:'button', text:'Show' });
      toggleBtn.addEventListener('click', ()=>{
        if (keyInput.type === 'password'){ keyInput.type = 'text'; toggleBtn.textContent = 'Hide'; }
        else { keyInput.type = 'password'; toggleBtn.textContent = 'Show'; }
      });
      const keyRow = el('div', { class:'ai-key-row' }, [keyInput, toggleBtn]);

      // Model dropdown — populated based on provider
      const modelSel = el('select', { class:'ai-provider-sel' });
      function populateModels(){
        modelSel.innerHTML = '';
        const p = provider.value;
        if (!p){
          modelSel.appendChild(el('option', { value:'', text:'(built-in uses gemini-2.0-flash-lite)' }));
          modelSel.disabled = true;
          return;
        }
        modelSel.disabled = false;
        const opts = MODEL_OPTIONS[p] || [];
        opts.forEach((o,i) => {
          modelSel.appendChild(el('option', { value:o.value, text:o.label + (i===0 ? ' — default' : '') }));
        });
        // Preserve saved model if it's in the list, else keep the first (default)
        const saved = s._default ? '' : (s.model || '');
        if (saved && opts.some(o => o.value === saved)) modelSel.value = saved;
      }
      populateModels();

      const hintEl = el('p', { class:'ai-hint' });
      function updateHint(){
        const p = provider.value;
        hintEl.textContent = p ? PROVIDER_HINTS[p] : 'Uses the built-in demo key. Shared quota — may hit rate limits.';
      }
      updateHint();
      provider.addEventListener('change', ()=>{ populateModels(); updateHint(); });

      const saveBtn = el('button', { class:'primary', text:'Save' });
      const cancelBtn = el('button', { text:'Cancel' });
      const body = el('div', null, [
        el('h3', { text:'AI Assistant settings' }),
        el('p', { text:'Choose a provider and model. Your key stays in your browser (localStorage).' }),
        el('label', { text:'Provider', style:{fontSize:'12px',color:'var(--fg-muted)'} }), provider,
        el('div',{style:{height:'10px'}}),
        el('label', { text:'API Key', style:{fontSize:'12px',color:'var(--fg-muted)'} }), keyRow,
        el('div',{style:{height:'10px'}}),
        el('label', { text:'Model', style:{fontSize:'12px',color:'var(--fg-muted)'} }), modelSel,
        hintEl,
        el('div', { class:'actions', style:{marginTop:'14px'} }, [cancelBtn, saveBtn])
      ]);
      const { close } = Puter.Dialog.open(body);
      saveBtn.addEventListener('click', ()=>{
        const ns = {
          provider: provider.value || null,
          apiKey: keyInput.value.trim(),
          model: modelSel.value || ''
        };
        if (!ns.provider || !ns.apiKey){
          localStorage.removeItem(settingsKey);
        } else {
          saveSettings(ns);
        }
        close();
        const now = loadSettings();
        if (now._default){
          addMsg('bot', 'Using **built-in Gemini** (demo key). Your own key was cleared.');
        } else {
          addMsg('bot', '**' + now.provider + '** enabled with model `' + (now.model || 'default') + '` ✓');
        }
      });
      cancelBtn.addEventListener('click', close);
    });

    Puter.WindowManager.open({
      title:'AI Assistant', icon:'assets/icons/app-ai.svg', appId:'ai-assistant',
      width:560, height:620,
      onReady(w){
        const toolbar = el('div', { class:'app-toolbar' }, [
          el('strong', { text:'AI Assistant' }),
          el('div', { class:'sep' }),
          clearBtn, settingsBtn
        ]);
        const inputRow = el('div', { class:'ai-input-row' }, [input, sendBtn]);
        w.body.appendChild(el('div', { class:'ai-wrap' }, [toolbar, log, inputRow]));
        greet();
        setTimeout(()=> input.focus(), 200);
      }
    });
  }
});
