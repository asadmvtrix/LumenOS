// Login + first-boot setup
Puter.Users = (function(){
  const K = 'LUMEN_USERS_V1';
  const palette = ['#6f8cff','#a155c9','#ff5f56','#27c93f','#ffbd2e','#3b6df7','#e94560','#00b894','#fd79a8','#6c5ce7'];

  function load(){
    try { return JSON.parse(localStorage.getItem(K) || 'null'); } catch { return null; }
  }
  function save(obj){ localStorage.setItem(K, JSON.stringify(obj)); }
  function initial(name){ return (name || '?').trim().charAt(0).toUpperCase() || '?'; }

  return {
    palette,
    all(){ return (load() || { users: [] }).users; },
    activeName(){ return (load() || {}).active || null; },
    has(name){ return this.all().some(u => u.name.toLowerCase() === name.toLowerCase()); },
    add(name, color){
      const state = load() || { users: [], active: null };
      if (!state.users.some(u => u.name.toLowerCase() === name.toLowerCase())){
        state.users.push({ name, color: color || palette[state.users.length % palette.length] });
      }
      state.active = name;
      save(state);
    },
    setActive(name){
      const state = load() || { users: [], active: null };
      state.active = name;
      save(state);
    },
    remove(name){
      const state = load() || { users: [], active: null };
      state.users = state.users.filter(u => u.name !== name);
      if (state.active === name) state.active = state.users[0]?.name || null;
      save(state);
    },
    find(name){ return this.all().find(u => u.name.toLowerCase() === (name||'').toLowerCase()) || null; },
    setupDone(){ return !!load(); },
    initial
  };
})();

Puter.Setup = (function(){
  const { el } = Puter.util;

  function init(onDone, opts){
    const allowCancel = !!(opts && opts.allowCancel);
    const screen = el('div', { id:'setup-screen' });
    const isFirst = !Puter.Users.setupDone();
    const state = { name: '', color: Puter.Users.palette[(Puter.Users.all().length) % Puter.Users.palette.length] };

    const avatar = el('div', { class:'user-avatar', style:{background:state.color,width:'80px',height:'80px',fontSize:'36px',margin:'0 auto 16px'}, text:'?' });
    const nameInput = el('input', { type:'text', value:'', placeholder:'Your name' });

    const colorsRow = el('div', { class:'setup-colors' });
    function paintColors(){
      colorsRow.innerHTML = '';
      Puter.Users.palette.forEach(c => {
        const d = el('div', { class:'setup-color' + (c === state.color ? ' active' : ''), style:{background:c} });
        d.addEventListener('click', ()=>{ state.color = c; paintColors(); avatar.style.background = c; });
        colorsRow.appendChild(d);
      });
    }
    paintColors();

    nameInput.addEventListener('input', ()=>{
      state.name = nameInput.value.trim();
      avatar.textContent = state.name ? Puter.Users.initial(state.name) : '?';
    });

    const continueBtn = el('button', { class:'setup-btn', text: isFirst ? 'Get Started' : 'Create User' });
    continueBtn.addEventListener('click', ()=>{
      if (!state.name) return;
      Puter.Users.add(state.name, state.color);
      screen.classList.add('hide');
      setTimeout(()=>{ screen.remove(); onDone && onDone(state.name); }, 620);
    });
    nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') continueBtn.click(); });

    const cancelBtn = allowCancel ? el('button', { class:'setup-btn secondary', text:'Cancel' }) : null;
    if (cancelBtn){
      cancelBtn.addEventListener('click', ()=>{
        screen.classList.add('hide');
        setTimeout(()=>{ screen.remove(); Puter.Login.init(onDone); }, 500);
      });
    }

    const card = el('div', { class:'setup-card' }, [
      el('img', { src:'assets/icons/logo-lumen.svg', class:'setup-logo', alt:'' }),
      el('h1', { text: isFirst ? 'Welcome to LumenOS' : 'Create New User' }),
      el('p', { text: isFirst ? "Let's set up your profile. You can change all this later." : "Add another user to this LumenOS installation." }),
      avatar,
      el('div', { class:'setup-step' }, [
        el('label', { text:'What should we call you?' }),
        nameInput,
        el('label', { text:'Pick an avatar color', style:{marginTop:'10px'} }),
        colorsRow
      ]),
      el('div', { class:'setup-actions' }, cancelBtn ? [cancelBtn, continueBtn] : [continueBtn])
    ]);
    screen.appendChild(card);
    document.body.appendChild(screen);
    setTimeout(()=>{ nameInput.focus(); nameInput.select(); }, 200);
  }

  return { init };
})();

Puter.Login = (function(){
  const { el } = Puter.util;

  function init(onDone){
    const screen = el('div', { id:'login-screen' });
    const users = Puter.Users.all();
    const activeName = Puter.Users.activeName() || (users[0] && users[0].name) || 'Asad';
    const state = { selected: Puter.Users.find(activeName) || users[0] };

    // Clock
    const time = el('div', { class:'tm', text:'--:--' });
    const date = el('div', { class:'dt', text:'' });
    function tick(){
      const d = new Date();
      time.textContent = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
      date.textContent = d.toLocaleDateString(undefined, { weekday:'long', month:'long', day:'numeric' });
    }
    tick(); const tid = setInterval(tick, 10000);

    const hint = el('div', { class:'login-hint', text:'Click a user to sign in, or type a new name below.' });
    const input = el('input', { type:'text', placeholder:'Or sign in as…', value:'' });
    const goBtn = el('button', { class:'login-go', html:'&#8594;', title:'Sign in' });
    const form = el('div', { class:'login-form' }, [input, goBtn]);

    const userRow = el('div', { class:'user-row' });
    function paintUsers(){
      userRow.innerHTML = '';
      Puter.Users.all().forEach(u => {
        const card = el('div', { class:'user-card' + (u === state.selected ? ' selected' : '') }, [
          el('div', { class:'user-avatar', style:{background:u.color}, text: Puter.Users.initial(u.name) }),
          el('div', { class:'user-name', text: u.name })
        ]);
        card.addEventListener('click', ()=>{
          // Single click = sign in directly (macOS-style)
          signIn(u.name);
        });
        card.addEventListener('contextmenu', e=>{
          e.preventDefault();
          Puter.ContextMenu.show(e.clientX, e.clientY, [
            { label:'Sign in', onClick: ()=> signIn(u.name) },
            '-',
            { label:'Remove user', onClick: async ()=>{
              if (await Puter.Dialog.confirm('Remove user', 'Remove "' + u.name + '"? Their files stay (VFS is shared).')){
                Puter.Users.remove(u.name);
                paintUsers();
              }
            }}
          ]);
        });
        userRow.appendChild(card);
      });
      // "Add user" card
      const addCard = el('div', { class:'user-card' }, [
        el('div', { class:'user-avatar add', html:'+' }),
        el('div', { class:'user-name', text:'New user' })
      ]);
      addCard.addEventListener('click', ()=>{
        clearInterval(tid);
        screen.classList.add('hide');
        setTimeout(()=>{
          screen.remove();
          Puter.Setup.init((name)=> onDone && onDone(name), { allowCancel: true });
        }, 500);
      });
      userRow.appendChild(addCard);
    }
    paintUsers();

    function signIn(name){
      const n = (name || input.value || '').trim() || 'Guest';
      if (!Puter.Users.has(n)){
        Puter.Users.add(n);
      } else {
        Puter.Users.setActive(n);
      }
      clearInterval(tid);
      screen.classList.add('hide');
      setTimeout(()=>{ screen.remove(); onDone && onDone(n); }, 620);
    }
    goBtn.addEventListener('click', ()=> signIn());
    input.addEventListener('keydown', e => { if (e.key === 'Enter') signIn(); });

    screen.appendChild(el('div', { class:'login-time' }, [time, date]));
    screen.appendChild(el('div', { class:'login-users' }, [userRow, form, hint]));
    screen.appendChild(el('div', { class:'login-footer', text:'LUMEN OS' }));
    document.body.appendChild(screen);
    setTimeout(()=> input.focus(), 200);
  }

  return { init };
})();
