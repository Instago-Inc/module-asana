const mod = require('asana@1.0.0');

(async () => {
  if (!mod || typeof mod.selfTest !== 'function') {
    throw new Error('selfTest not found on module');
  }
  const res = await mod.selfTest();
  if (typeof res !== 'undefined') {
    console.log(res);
  }
})();
