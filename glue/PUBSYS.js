/* HUB2 glue — SAVE TO LIBRARY: CSV of the active table tab, or the active layout as a .pubsys.zip pack */
window.HUB2_SAVES = ['csv','tsv','txt','zip','pubsys'];
window.HUB2_SAVE = function(ext){
  var tab = state.tabs.find(function(t){ return t.id===state.active; }); if(!tab) return false;
  if(ext==='zip' || ext==='pubsys'){
    if(tab.type==='layout' || tab.type==='hybrid'){ exportLayoutZip(tab.id); return true; }
    return false;
  }
  var ed = document.querySelector('.tc.active .csv-ed');
  if(!ed) return false;
  dl(ed.value, (tab.name||'table').replace(/[^\w\-]+/g,'_')+'.'+ext, 'text/'+(ext==='tsv'?'tab-separated-values':ext==='txt'?'plain':'csv'));
  return true;
};
