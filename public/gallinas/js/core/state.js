/* ============================================
   STATE — Estado reactivo central
   Singleton con suscripcion (pub/sub) + actions
   ============================================ */

const State = (() => {

  let db = Storage.load();
  const subs = new Set();

  function get() { return db; }

  function set(next) {
    db = next;
    Storage.save(db);
    _notify();
  }

  function update(mutator) {
    const draft = JSON.parse(JSON.stringify(db));
    mutator(draft);
    set(draft);
  }

  function subscribe(fn) {
    subs.add(fn);
    return () => subs.delete(fn);
  }

  function _notify() {
    subs.forEach(fn => { try { fn(db); } catch (e) { console.error(e); } });
  }

  function reload() {
    db = Storage.load();
    _notify();
  }

  return { get, set, update, subscribe, reload, db };

})();
