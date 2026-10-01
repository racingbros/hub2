/* HUB2 glue — SAVE TO LIBRARY: SVG template → composed SVG; image → composed PNG */
window.HUB2_SAVES = ['svg','png','jpg','jpeg','webp'];
window.HUB2_SAVE = function(ext){ if(ext==='svg') exportSVG(); else exportPNG(); return true; };
