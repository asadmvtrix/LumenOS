window.Puter = window.Puter || {};

Puter.util = {
  el(tag, attrs, children){
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs){
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k === 'style' && typeof attrs[k] === 'object') Object.assign(e.style, attrs[k]);
      else if (k.startsWith('on') && typeof attrs[k] === 'function') e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    if (children){
      (Array.isArray(children)?children:[children]).forEach(c=>{
        if (c == null) return;
        e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return e;
  },
  uid(prefix){ return (prefix||'id_') + Math.random().toString(36).slice(2,10); },
  clamp(v,min,max){ return Math.max(min, Math.min(max, v)); },
  debounce(fn, ms){
    let t; return function(...a){ clearTimeout(t); t=setTimeout(()=>fn.apply(this,a),ms); };
  },
  extOf(name){
    const i = (name||'').lastIndexOf('.');
    return i < 0 ? '' : name.slice(i+1).toLowerCase();
  },
  fmtSize(n){
    if (n < 1024) return n + ' B';
    if (n < 1024*1024) return (n/1024).toFixed(1) + ' KB';
    return (n/1024/1024).toFixed(2) + ' MB';
  },
  esc(s){
    return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
};
