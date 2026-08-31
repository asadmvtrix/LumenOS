Puter.Registry.register({
  id:'calculator',
  title:'Calculator',
  icon:'assets/icons/app-calculator.svg',
  launch(){
    const { el } = Puter.util;
    let display = '0';
    const disp = el('div', { class:'calc-display', text:'0' });
    function set(v){ display = v; disp.textContent = v; }
    function input(ch){
      if (display === '0' && /[0-9.]/.test(ch)) set(ch);
      else if (display === 'Error') set(ch);
      else set(display + ch);
    }
    function op(sym){
      if (display === 'Error') return;
      const last = display.slice(-1);
      if ('+-*/%'.includes(last)) set(display.slice(0,-1) + sym);
      else set(display + sym);
    }
    function equals(){
      try {
        // Sanitize: only digits, operators, dot, parens
        if (!/^[0-9+\-*/%.() ]+$/.test(display)) throw new Error('bad');
        // eslint-disable-next-line no-new-func
        const r = Function('"use strict";return (' + display + ')')();
        if (!isFinite(r)) throw new Error('bad');
        set(String(+r.toFixed(10)));
      } catch { set('Error'); }
    }
    function clear(){ set('0'); }
    function back(){ set(display.length <= 1 ? '0' : display.slice(0,-1)); }

    const keys = el('div', { class:'calc-keys' });
    const layout = [
      ['C','⌫','%','/'],
      ['7','8','9','*'],
      ['4','5','6','-'],
      ['1','2','3','+'],
      ['0','.','=',null]
    ];
    layout.forEach(row => row.forEach(k => {
      if (k === null) return;
      const isOp = '+-*/%='.includes(k) || k === 'C' || k === '⌫';
      const b = el('button', { class: isOp ? 'op' : '', text:k });
      if (k === '0') b.classList.add('wide');
      b.addEventListener('click', ()=>{
        if (k === 'C') clear();
        else if (k === '⌫') back();
        else if (k === '=') equals();
        else if ('+-*/%'.includes(k)) op(k);
        else input(k);
      });
      keys.appendChild(b);
    }));

    Puter.WindowManager.open({
      title:'Calculator', icon:'assets/icons/app.svg', appId:'calculator',
      width:300, height:400,
      onReady(w){
        const wrap = el('div', { class:'calc' }, [disp, keys]);
        w.body.appendChild(wrap);
        w.body.addEventListener('keydown', e=>{
          if (/[0-9.]/.test(e.key)) input(e.key);
          else if ('+-*/%'.includes(e.key)) op(e.key);
          else if (e.key === 'Enter' || e.key === '=') equals();
          else if (e.key === 'Backspace') back();
          else if (e.key.toLowerCase() === 'c') clear();
        });
        w.body.tabIndex = 0; w.body.focus();
      }
    });
  }
});
