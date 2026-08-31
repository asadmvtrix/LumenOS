Puter.Dialog = (function(){
  const { el } = Puter.util;
  const layer = () => document.getElementById('dialog-layer');

  function open(content){
    const backdrop = el('div', { class:'dialog-backdrop' });
    const dialog = el('div', { class:'dialog' });
    dialog.appendChild(content);
    backdrop.appendChild(dialog);
    backdrop.addEventListener('mousedown', (e)=>{ if (e.target === backdrop) close(); });
    layer().appendChild(backdrop);
    function close(){ backdrop.remove(); }
    return { close, dialog };
  }

  function prompt(title, message, defaultValue){
    return new Promise(resolve => {
      const input = el('input', { type:'text', value: defaultValue || '' });
      const okBtn = el('button', { class:'primary', text:'OK' });
      const cancelBtn = el('button', { text:'Cancel' });
      const body = el('div', null, [
        el('h3', { text: title }),
        message ? el('p', { text: message }) : null,
        input,
        el('div', { class:'actions' }, [cancelBtn, okBtn])
      ].filter(Boolean));
      const { close } = open(body);
      setTimeout(()=>{ input.focus(); input.select(); }, 10);
      function submit(){ const v = input.value; close(); resolve(v); }
      okBtn.addEventListener('click', submit);
      cancelBtn.addEventListener('click', ()=>{ close(); resolve(null); });
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') submit();
        else if (e.key === 'Escape'){ close(); resolve(null); }
      });
    });
  }

  function confirm(title, message){
    return new Promise(resolve => {
      const okBtn = el('button', { class:'primary', text:'OK' });
      const cancelBtn = el('button', { text:'Cancel' });
      const body = el('div', null, [
        el('h3', { text: title }),
        el('p', { text: message }),
        el('div', { class:'actions' }, [cancelBtn, okBtn])
      ]);
      const { close } = open(body);
      okBtn.addEventListener('click', ()=>{ close(); resolve(true); });
      cancelBtn.addEventListener('click', ()=>{ close(); resolve(false); });
    });
  }

  function alert(title, message){
    return new Promise(resolve => {
      const okBtn = el('button', { class:'primary', text:'OK' });
      const body = el('div', null, [
        el('h3', { text: title }),
        el('p', { text: message }),
        el('div', { class:'actions' }, [okBtn])
      ]);
      const { close } = open(body);
      okBtn.addEventListener('click', ()=>{ close(); resolve(); });
    });
  }

  return { open, prompt, confirm, alert };
})();
