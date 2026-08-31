Puter.Registry.register({
  id:'paint',
  title:'Paint',
  icon:'assets/icons/app-paint.svg',
  launch(){
    const { el } = Puter.util;
    const state = { tool:'brush', color:'#1c1c1f', size:6, drawing:false, last:null };

    const canvas = el('canvas', { class:'paint-canvas', width:1600, height:1000 });
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // Undo stack: store snapshots before each stroke
    const undoStack = [];
    const MAX_UNDO = 20;
    function pushUndo(){
      if (undoStack.length >= MAX_UNDO) undoStack.shift();
      undoStack.push(canvas.toDataURL('image/png'));
    }
    function undo(){
      if (undoStack.length === 0) return;
      const img = new Image();
      img.onload = ()=>{ ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0); };
      img.src = undoStack.pop();
    }

    function pos(e){
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
    }
    function begin(e){ pushUndo(); state.drawing = true; state.last = pos(e); }
    function move(e){
      if (!state.drawing) return;
      const p = pos(e);
      ctx.strokeStyle = state.tool === 'eraser' ? '#ffffff' : state.color;
      ctx.lineWidth = state.size * (state.tool === 'eraser' ? 3 : 1);
      ctx.beginPath();
      ctx.moveTo(state.last.x, state.last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      state.last = p;
    }
    function end(){ state.drawing = false; state.last = null; }
    canvas.addEventListener('mousedown', begin);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);

    // SVG icons inline for tool buttons
    const ico = {
      brush:  '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a1 1 0 00-1.41 0L9 12.25 11.75 15l8.96-8.96a1 1 0 000-1.41z"/></svg>',
      eraser: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16.24 3.56l4.2 4.2a2 2 0 010 2.83l-8.49 8.48a2 2 0 01-2.83 0L4.93 14.9a2 2 0 010-2.83l8.48-8.5a2 2 0 012.83 0zM3 20h8v2H5z"/></svg>',
      clear:  '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 7h12l-1 14H7L6 7zm3-4h6l1 2h4v2H4V5h4l1-2z"/></svg>',
      undo:   '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>',
      save:   '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zM12 19a3 3 0 110-6 3 3 0 010 6zm3-10H5V5h10v4z"/></svg>',
      color:  '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 22C6.49 22 2 17.51 2 12S6.04 2.25 12.55 2C18 2 22 6.04 22 11.55c0 1.84-1.49 3.33-3.33 3.33h-1.77a1.16 1.16 0 00-.82 1.97c.15.17.23.39.23.62a1.67 1.67 0 01-1.67 1.67H12zm-5.5-9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm3-4a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm5 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm3 4a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>'
    };

    function toolBtn(key, label){
      const b = el('button', { class:'paint-tool-btn', title: label });
      b.innerHTML = ico[key] + '<span class="tool-label">' + label + '</span>';
      return b;
    }

    const brushBtn = toolBtn('brush', 'Brush');
    brushBtn.classList.add('active');
    const eraserBtn = toolBtn('eraser', 'Eraser');
    const undoBtn = toolBtn('undo', 'Undo');
    const clearBtn = toolBtn('clear', 'Clear');
    const saveBtn = toolBtn('save', 'Save PNG');

    const colorInput = el('input', { type:'color', value: state.color, class:'paint-color' });
    const sizeInput = el('input', { type:'range', min:1, max:60, value: state.size, class:'paint-size' });
    const sizeLbl = el('span', { class:'paint-sizelbl', text: state.size + 'px' });

    function setTool(t){
      state.tool = t;
      brushBtn.classList.toggle('active', t==='brush');
      eraserBtn.classList.toggle('active', t==='eraser');
    }
    brushBtn.addEventListener('click', ()=> setTool('brush'));
    eraserBtn.addEventListener('click', ()=> setTool('eraser'));
    undoBtn.addEventListener('click', undo);
    clearBtn.addEventListener('click', async ()=>{
      if (await Puter.Dialog.confirm('Clear canvas', 'Erase everything?')){
        pushUndo();
        ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
      }
    });
    colorInput.addEventListener('input', ()=> state.color = colorInput.value);
    sizeInput.addEventListener('input', ()=>{ state.size = +sizeInput.value; sizeLbl.textContent = state.size + 'px'; });
    saveBtn.addEventListener('click', async ()=>{
      const p = await Puter.Dialog.prompt('Save PNG', 'Path:', '/Pictures/drawing-' + Date.now() + '.png');
      if (!p) return;
      const dataUrl = canvas.toDataURL('image/png');
      try { Puter.VFS.writeFile(p, dataUrl, 'image/png'); Puter.Dialog.alert('Saved', 'Saved to ' + p); }
      catch(e){ Puter.Dialog.alert('Error', e.message); }
    });

    Puter.WindowManager.open({
      title:'Paint', icon:'assets/icons/app-paint.svg', appId:'paint',
      width:1100, height:720,
      onReady(w){
        const tools = el('div', { class:'paint-tools' }, [
          brushBtn, eraserBtn, undoBtn, clearBtn,
          el('div',{class:'sep'}),
          el('div', { class:'paint-ctrl' }, [
            el('span', { html: ico.color, style:{display:'flex'} }),
            colorInput
          ]),
          el('div', { class:'paint-ctrl' }, [
            el('span',{text:'Size'}), sizeInput, sizeLbl
          ]),
          el('div', { class:'paint-spacer' }),
          saveBtn
        ]);
        const cwrap = el('div', { class:'paint-canvas-wrap' }, [canvas]);
        w.body.appendChild(el('div',{class:'paint-wrap'},[tools, cwrap]));
      }
    });
  }
});
