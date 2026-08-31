// Hand-rolled code editor with basic JS/HTML/CSS/JSON syntax highlighting.
Puter.Registry.register({
  id:'code-editor',
  title:'Code Editor',
  icon:'assets/icons/app-code.svg',
  handlesExt:['js','ts','jsx','tsx','html','htm','css','json','xml','md'],
  launch(args){
    const { el, esc } = Puter.util;
    const state = { path: args.path || null, dirty:false, lang:'js', wrap:false };

    const KW = {
      js: /\b(var|let|const|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|import|export|from|default|try|catch|finally|throw|typeof|instanceof|in|of|true|false|null|undefined|this|async|await|yield|super|static|delete|void)\b/g,
      css: /\b(color|background(?:-[a-z]+)?|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|border(?:-[a-z]+)?|display|flex(?:-[a-z]+)?|grid(?:-[a-z]+)?|font(?:-[a-z]+)?|width|height|min-width|max-width|position|top|left|right|bottom|z-index|opacity|transform|transition|animation|cursor|overflow|align-items|justify-content|gap|box-shadow|border-radius|text-align|line-height|letter-spacing)\b/g,
      html: /(&lt;\/?[\w-]+)/g,
      json:/\b(true|false|null)\b/g
    };

    function highlight(code, lang){
      let out = esc(code);
      // Strings first (so keywords inside strings don't match)
      out = out.replace(/(&quot;(?:\\.|[^&])*?&quot;|&#39;(?:\\.|[^&])*?&#39;|`(?:\\.|[^`])*?`)/g, '<span class="tok-str">$1</span>');
      // Comments
      if (lang === 'js' || lang === 'css'){
        out = out.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, '<span class="tok-com">$1</span>');
      } else if (lang === 'html'){
        out = out.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="tok-com">$1</span>');
      }
      // Numbers
      out = out.replace(/\b(\d+\.?\d*)\b/g, '<span class="tok-num">$1</span>');
      // Keywords
      if (KW[lang]) out = out.replace(KW[lang], '<span class="tok-kw">$1</span>');
      // Function calls (js)
      if (lang === 'js'){
        out = out.replace(/\b([a-zA-Z_$][\w$]*)(\()/g, '<span class="tok-fn">$1</span>$2');
      }
      return out + '\n';
    }

    function detectLang(path){
      if (!path) return 'js';
      const ext = Puter.util.extOf(path);
      if (['js','ts','jsx','tsx'].includes(ext)) return 'js';
      if (['html','htm','xml','md'].includes(ext)) return 'html';
      if (ext === 'css') return 'css';
      if (ext === 'json') return 'json';
      return 'js';
    }

    const gutter = el('div', { class:'ce-gutter', text:'1' });
    const ta = el('textarea', { class:'ce-textarea', spellcheck:'false', wrap:'off' });
    const hl = el('pre', { class:'ce-highlight' });
    const cursorPos = el('span', { text:'Ln 1, Col 1' });
    const langLbl = el('span', { text:'JS' });
    const encLbl = el('span', { text:'UTF-8' });
    const dirtyDot = el('span', { class:'ce-dot', text:'' });

    function render(){
      const text = ta.value;
      hl.innerHTML = highlight(text, state.lang);
      const lines = text.split('\n').length;
      let g = '';
      for (let i = 1; i <= lines; i++) g += i + '\n';
      gutter.textContent = g;
    }

    function updateCursor(){
      const text = ta.value.slice(0, ta.selectionStart);
      const lines = text.split('\n');
      const line = lines.length;
      const col = lines[lines.length - 1].length + 1;
      cursorPos.textContent = 'Ln ' + line + ', Col ' + col;
    }

    const w = Puter.WindowManager.open({
      title: state.path ? state.path.split('/').pop() + ' — Code Editor' : 'Untitled — Code Editor',
      icon:'assets/icons/app-code.svg', appId:'code-editor',
      width:860, height:560, minW:480, minH:320,
      onReady(w){
        // Custom dark window header for IDE vibe
        w.root.classList.add('ce-window');

        // Toolbar
        const newBtn = el('button', { class:'ce-tbtn', title:'New (Ctrl+N)', html:'<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm2 18H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>' });
        const openBtn = el('button', { class:'ce-tbtn', title:'Open (Ctrl+O)', html:'<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>' });
        const saveBtn = el('button', { class:'ce-tbtn', title:'Save (Ctrl+S)', html:'<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zM12 19a3 3 0 110-6 3 3 0 010 6zm3-10H5V5h10v4z"/></svg>' });
        const langSel = el('select', { class:'ce-sel' }, ['js','html','css','json'].map(x=> el('option',{value:x,text:x.toUpperCase()})));
        const wrapBtn = el('button', { class:'ce-tbtn', title:'Toggle word wrap', text:'Wrap' });

        const fname = el('span', { class:'ce-filename', text: state.path ? state.path.split('/').pop() : 'untitled' });

        const toolbar = el('div', { class:'ce-toolbar' }, [
          newBtn, openBtn, saveBtn,
          el('div',{class:'ce-sep'}),
          wrapBtn,
          el('div',{class:'ce-spacer'}),
          dirtyDot, fname,
          el('div',{class:'ce-spacer'}),
          el('span',{class:'ce-tlabel',text:'Lang:'}), langSel
        ]);

        const area = el('div', { class:'ce-area' }, [gutter, ta, hl]);
        const status = el('div', { class:'ce-status' }, [
          cursorPos,
          el('div',{class:'ce-sep-v'}),
          langLbl,
          el('div',{class:'ce-sep-v'}),
          encLbl
        ]);
        w.body.appendChild(el('div',{class:'ce-wrap'},[toolbar, area, status]));

        if (state.path){
          try { ta.value = Puter.VFS.read(state.path); state.lang = detectLang(state.path); langSel.value = state.lang; langLbl.textContent = state.lang.toUpperCase(); } catch(e){}
        }
        render(); updateCursor();

        // Sync scroll
        ta.addEventListener('scroll', ()=>{
          hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft;
          gutter.scrollTop = ta.scrollTop;
        });
        ta.addEventListener('input', ()=>{
          state.dirty = true;
          dirtyDot.textContent = '●';
          render(); updateCursor();
        });
        ta.addEventListener('click', updateCursor);
        ta.addEventListener('keyup', updateCursor);
        ta.addEventListener('keydown', e=>{
          // Tab = 2 spaces
          if (e.key === 'Tab'){
            e.preventDefault();
            const s = ta.selectionStart, en = ta.selectionEnd;
            ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(en);
            ta.selectionStart = ta.selectionEnd = s + 2;
            render();
          }
          // Auto-indent on Enter (match previous line's leading whitespace)
          else if (e.key === 'Enter'){
            const s = ta.selectionStart;
            const before = ta.value.slice(0, s);
            const lastLine = before.split('\n').pop();
            const indent = lastLine.match(/^\s*/)[0];
            if (indent){
              e.preventDefault();
              const insert = '\n' + indent;
              ta.value = before + insert + ta.value.slice(ta.selectionEnd);
              ta.selectionStart = ta.selectionEnd = s + insert.length;
              render(); updateCursor();
              state.dirty = true; dirtyDot.textContent = '●';
            }
          }
          // Ctrl+S save
          else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's'){
            e.preventDefault(); doSave(false);
          }
          // Ctrl+N new
          else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n'){
            e.preventDefault(); newBtn.click();
          }
          // Ctrl+O open
          else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o'){
            e.preventDefault(); openBtn.click();
          }
        });
        langSel.addEventListener('change', ()=>{ state.lang = langSel.value; langLbl.textContent = state.lang.toUpperCase(); render(); });
        wrapBtn.addEventListener('click', ()=>{
          state.wrap = !state.wrap;
          ta.setAttribute('wrap', state.wrap ? 'soft' : 'off');
          hl.classList.toggle('ce-wrap', state.wrap);
          ta.classList.toggle('ce-wrap', state.wrap);
          wrapBtn.classList.toggle('active', state.wrap);
        });

        newBtn.addEventListener('click', ()=>{
          ta.value = ''; state.path = null; state.dirty = false;
          fname.textContent = 'untitled';
          dirtyDot.textContent = '';
          Puter.WindowManager.setTitle(w, 'Untitled — Code Editor');
          render(); updateCursor();
        });

        openBtn.addEventListener('click', async ()=>{
          const p = await Puter.Dialog.prompt('Open', 'Path:', state.path || '/Documents/');
          if (!p) return;
          try {
            ta.value = Puter.VFS.read(p);
            state.path = p; state.dirty = false; state.lang = detectLang(p); langSel.value = state.lang; langLbl.textContent = state.lang.toUpperCase();
            fname.textContent = p.split('/').pop();
            dirtyDot.textContent = '';
            render(); updateCursor();
            Puter.WindowManager.setTitle(w, fname.textContent + ' — Code Editor');
          } catch(e){ Puter.Dialog.alert('Open failed', e.message); }
        });

        async function doSave(asNew){
          let p = state.path;
          if (!p || asNew){
            p = await Puter.Dialog.prompt('Save As', 'Path:', p || '/Documents/untitled.js');
            if (!p) return;
          }
          try {
            Puter.VFS.writeFile(p, ta.value, 'text/plain');
            state.path = p; state.dirty = false;
            fname.textContent = p.split('/').pop();
            dirtyDot.textContent = '';
            Puter.WindowManager.setTitle(w, fname.textContent + ' — Code Editor');
          } catch(e){ Puter.Dialog.alert('Save failed', e.message); }
        }
        saveBtn.addEventListener('click', ()=> doSave(false));
      }
    });
    return w;
  }
});
