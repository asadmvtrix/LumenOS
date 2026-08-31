Puter.bus = (function(){
  const map = new Map();
  return {
    on(event, fn){
      if (!map.has(event)) map.set(event, new Set());
      map.get(event).add(fn);
      return () => this.off(event, fn);
    },
    off(event, fn){ map.get(event)?.delete(fn); },
    emit(event, payload){
      map.get(event)?.forEach(fn => { try { fn(payload); } catch(e){ console.error(e); } });
    }
  };
})();
