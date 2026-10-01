/* HUB2 glue — SAVE TO LIBRARY: the active photo / video with its marks and text (download path, never the OS share sheet) */
window.HUB2_SAVES = ['jpg','jpeg','png','webp','gif','bmp','avif','mp4','mov','webm','m4v'];
window.HUB2_SAVE = function(ext){
  exportActiveBlob().then(function(r){
    if(!r) return;
    var url = URL.createObjectURL(r.blob), a = document.createElement('a');
    a.href = url; a.download = 'project-pe.' + r.ext; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1500);
  });
  return true;
};
