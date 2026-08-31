Puter.Registry.register({
  id:'terminal',
  title:'Terminal',
  icon:'assets/icons/app-terminal.svg',
  launch(){
    const { el, esc } = Puter.util;
    const state = { cwd:'/', history:[], hIdx:-1 };
    const out = el('div', { class:'term' });
    let currentLine = null, currentInput = null;

    function print(text, cls){
      const d = el('div', { class: cls || '' });
      d.innerHTML = esc(String(text));
      out.appendChild(d);
      out.scrollTop = out.scrollHeight;
    }

    function resolve(p){
      if (!p) return state.cwd;
      if (p === '/') return '/';
      if (p.startsWith('/')) return p.replace(/\/+$/,'') || '/';
      const parts = state.cwd.split('/').filter(Boolean);
      p.split('/').forEach(seg => {
        if (!seg || seg === '.') return;
        if (seg === '..') parts.pop();
        else parts.push(seg);
      });
      return '/' + parts.join('/');
    }

    const COMMANDS = {
      help(){ print('Commands: help, ls, cd <path>, pwd, cat <file>, echo <text>, mkdir <dir>, rm <path>, touch <file>, clear, date, about, apps, launch <id>'); },
      ls(args){
        const path = args[0] ? resolve(args[0]) : state.cwd;
        try { Puter.VFS.list(path).forEach(n => print((n.type==='dir'?'[D] ':'[F] ') + n.name)); }
        catch(e){ print('ls: ' + e.message, 'err'); }
      },
      cd(args){
        const p = resolve(args[0] || '/');
        const n = Puter.VFS.stat(p);
        if (!n){ print('cd: no such path: ' + p, 'err'); return; }
        if (n.type !== 'dir'){ print('cd: not a directory', 'err'); return; }
        state.cwd = p;
      },
      pwd(){ print(state.cwd); },
      cat(args){
        if (!args[0]){ print('usage: cat <file>', 'err'); return; }
        try { print(Puter.VFS.read(resolve(args[0]))); } catch(e){ print('cat: ' + e.message, 'err'); }
      },
      echo(args){ print(args.join(' ')); },
      mkdir(args){
        if (!args[0]){ print('usage: mkdir <dir>', 'err'); return; }
        try { Puter.VFS.mkdir(resolve(args[0])); } catch(e){ print('mkdir: ' + e.message, 'err'); }
      },
      rm(args){
        if (!args[0]){ print('usage: rm <path>', 'err'); return; }
        try { Puter.VFS.remove(resolve(args[0])); } catch(e){ print('rm: ' + e.message, 'err'); }
      },
      touch(args){
        if (!args[0]){ print('usage: touch <file>', 'err'); return; }
        try { Puter.VFS.writeFile(resolve(args[0]), '', 'text/plain'); } catch(e){ print('touch: ' + e.message, 'err'); }
      },
      clear(){ out.innerHTML = ''; },
      date(){ print(new Date().toString()); },
      about(){ print('LumenOS — portable browser desktop'); },
      apps(){ Puter.Registry.list().forEach(a => print(a.id.padEnd(16) + a.title)); },
      launch(args){
        if (!args[0]){ print('usage: launch <appId>', 'err'); return; }
        Puter.Registry.launch(args[0]);
      }
    };

    function run(cmd){
      const parts = cmd.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return;
      const name = parts[0]; const args = parts.slice(1);
      if (COMMANDS[name]) COMMANDS[name](args);
      else print(name + ': command not found', 'err');
    }

    function freezeAndNew(){
      // freeze current input as a static span
      if (currentLine && currentInput){
        const span = el('span', { text: currentInput.value });
        currentInput.replaceWith(span);
      }
      const input = el('input', { class:'term-input', autocomplete:'off', spellcheck:'false' });
      const line = el('div', null, [
        el('span', { class:'prompt', text: 'lumen:' + state.cwd + '$ ' }),
        input
      ]);
      out.appendChild(line);
      currentLine = line; currentInput = input;
      input.addEventListener('keydown', e=>{
        if (e.key === 'Enter'){
          const cmd = input.value;
          if (cmd.trim()){ state.history.push(cmd); state.hIdx = state.history.length; }
          run(cmd);
          freezeAndNew();
        } else if (e.key === 'ArrowUp'){
          if (state.history.length === 0) return;
          e.preventDefault();
          state.hIdx = Math.max(0, state.hIdx - 1);
          input.value = state.history[state.hIdx] || '';
        } else if (e.key === 'ArrowDown'){
          e.preventDefault();
          state.hIdx = Math.min(state.history.length, state.hIdx + 1);
          input.value = state.history[state.hIdx] || '';
        }
      });
      setTimeout(()=> input.focus(), 0);
      out.scrollTop = out.scrollHeight;
    }

    Puter.WindowManager.open({
      title:'Terminal', icon:'assets/icons/app.svg', appId:'terminal',
      width:640, height:400,
      onReady(w){
        w.body.appendChild(out);
        print('LumenOS Terminal — type "help" for commands');
        freezeAndNew();
        out.addEventListener('click', ()=> currentInput && currentInput.focus());
      }
    });
  }
});
