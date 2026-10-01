/* HUB2 glue — SAVE TO LIBRARY: the manual as its .zip pack (same as EXPORT) */
window.HUB2_SAVES = ['zip'];
window.HUB2_SAVE = function(ext){
  if(ext!=='zip' || typeof doc==='undefined' || !doc) return false;
  $('#exp-name').value = (doc.name||'MANUAL').replace(/\.html?$/i,'') + '.html';
  $('#exp-go').click(); return true;
};
