/* HUB2 glue — SAVE TO LIBRARY: store list back as CSV */
window.HUB2_SAVES = ['csv'];
window.HUB2_SAVE = function(ext){ if(ext==='csv'){ trmExportCSV(); return true; } return false; };
