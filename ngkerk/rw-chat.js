// River Whisperer AI Chat Widget — loaded on all pages
(function(){
  fetch('/api/me').then(function(r){return r.json()}).then(function(d){
    if(!d.authenticated||d.user.role!=='admin')return;

    var s=document.createElement('style');
    s.textContent='.rwo::-webkit-scrollbar{width:4px}.rwo::-webkit-scrollbar-track{background:transparent}.rwo::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px}.rw-upload-msg{display:flex;align-items:center;gap:8px;font-size:0.82rem;}.rw-upload-msg img,.rw-upload-msg video{max-width:100%;border-radius:8px;margin-top:4px;}';
    document.body.appendChild(s);

    // Chat overlay — publish bar is a fixed row between messages and input
    var o=document.createElement('div');o.id='rw-o';
    o.style.cssText='display:none;position:fixed;bottom:90px;left:24px;z-index:9999;width:380px;max-width:calc(100vw-48px);height:560px;max-height:calc(100vh-140px);background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.18);flex-direction:column;overflow:hidden;border:1px solid #eee;font-family:Raleway,sans-serif;';
    o.innerHTML='<div style="background:#1a2e3a;color:#fcfaf7;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;border-radius:16px 16px 0 0;"><div style="display:flex;align-items:center;gap:10px;"><span style="font-size:1.3rem;">⛪</span><div><div style="font-weight:600;font-size:0.9rem;">Site Editor</div><div style="font-size:0.72rem;opacity:0.6;">Edits staged until publish</div></div></div><button id="rw-c" style="background:none;border:none;color:#fcfaf7;font-size:1.3rem;cursor:pointer;padding:4px;line-height:1;">&times;</button></div><div id="rw-m" class="rwo" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;font-size:0.88rem;line-height:1.5;"></div><div id="rw-pb-bar" style="display:none;padding:8px 16px;border-top:1px solid #e8e0d8;background:#fcfaf7;flex-shrink:0;"><button id="rw-pb-btn" style="width:100%;background:#25D366;color:#fff;border:none;border-radius:8px;padding:10px;font-weight:600;font-size:0.85rem;cursor:pointer;font-family:Raleway,sans-serif;">📦 Publish</button><div style="display:flex;gap:6px;margin-top:6px;"><button id="rw-pv-btn" style="flex:1;background:#f0ece8;color:#1a2e3a;border:none;border-radius:8px;padding:8px;font-weight:600;font-size:0.8rem;cursor:pointer;font-family:Raleway,sans-serif;">👁 Preview Draft</button><button id="rw-cx-btn" style="flex:1;background:#fdeaea;color:#c0392b;border:none;border-radius:8px;padding:8px;font-weight:600;font-size:0.8rem;cursor:pointer;font-family:Raleway,sans-serif;">✕ Cancel Changes</button></div></div><div id="rw-backups-section" style="display:none;border-top:1px solid #e8e0d8;background:#fcfaf7;flex-shrink:0;max-height:160px;overflow-y:auto;"><div style="padding:8px 16px 4px;font-size:0.75rem;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.5px;">⏪ Backups (click to restore)</div><div id="rw-backups-list"></div></div><div style="border-top:1px solid #eee;padding:12px 16px;display:flex;gap:6px;flex-shrink:0;background:#faf8f5;align-items:center;"><label id="rw-attach-label" style="cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;background:#f0ece8;transition:background 0.15s;font-size:1.1rem;" title="Upload media (images, video, audio, docs)">📎<input id="rw-file" type="file" style="display:none;" multiple></label><input id="rw-i" type="text" placeholder="Ask me to edit the site..." style="flex:1;border:1.5px solid #ddd;border-radius:8px;padding:10px 14px;font-size:0.85rem;font-family:Raleway,sans-serif;outline:none;background:#fff;"><button id="rw-s" style="background:#1a2e3a;color:#fff;border:none;border-radius:8px;padding:10px 16px;cursor:pointer;font-weight:600;font-size:0.85rem;font-family:Raleway,sans-serif;">Send</button></div>';
    document.body.appendChild(o);

    // Toggle button (pencil)
    var t=document.createElement('button');t.id='rw-t';
    t.style.cssText='display:flex;align-items:center;justify-content:center;position:fixed;bottom:24px;left:24px;z-index:9998;width:56px;height:56px;border-radius:50%;background:#1a2e3a;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,0.2);font-size:1.4rem;';
    t.innerHTML='&#9998;';
    document.body.appendChild(t);

    var op=false,ld=false,stagedCount=0;
    var pbBar=document.getElementById('rw-pb-bar');
    var pbBtn=document.getElementById('rw-pb-btn');
    var bkSection=document.getElementById('rw-backups-section');
    var bkList=document.getElementById('rw-backups-list');

    function addMsg(text,isUser,htmlContent){
      var d=document.createElement('div');
      d.style.alignSelf=isUser?'flex-end':'flex-start';
      d.style.background=isUser?'#1a2e3a':'#f4f2ef';
      d.style.color=isUser?'#fcfaf7':'#4a4a4a';
      d.style.borderRadius=isUser?'12px 12px 4px 12px':'12px 12px 12px 4px';
      d.style.padding='10px 14px';d.style.maxWidth='85%';
      d.style.fontSize='0.88rem';d.style.lineHeight='1.5';
      if(htmlContent){ d.innerHTML=text; }
      else { d.textContent=text; d.style.whiteSpace='pre-wrap'; }
      document.getElementById('rw-m').appendChild(d);
      d.scrollIntoView({behavior:'smooth',block:'end'});
    }

    function updatePublishBar(){
      pbBar.style.display='block';
      var has=stagedCount>0;
      if(has){
        pbBtn.innerHTML='📦 Publish ('+stagedCount+' file'+ (stagedCount>1?'s':'') +')';
        pbBtn.style.background='#25D366'; pbBtn.disabled=false;
      } else {
        pbBtn.innerHTML='📦 No changes to publish';
        pbBtn.style.background='#aaa'; pbBtn.disabled=true;
      }
      pvBtn.disabled=!has; cxBtn.disabled=!has;
      pvBtn.style.opacity=has?1:0.5;
      cxBtn.style.opacity=has?1:0.5;
    }

    function fmtDate(iso){
      var d=new Date(iso);
      var dd=String(d.getDate()).padStart(2,'0');
      var mm=String(d.getMonth()+1).padStart(2,'0');
      var yy=d.getFullYear();
      var hh=String(d.getHours()).padStart(2,'0');
      var mi=String(d.getMinutes()).padStart(2,'0');
      return dd+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]+' '+yy+', '+hh+':'+mi;
    }

    function loadBackups(){
      fetch('/api/backups').then(function(r){return r.json()}).then(function(d){
        var bks=d.backups||[];
        if(bks.length===0){
          bkSection.style.display='none';
          return;
        }
        bkSection.style.display='block';
        bkList.innerHTML='';
        bks.slice(0,15).forEach(function(b){
          var row=document.createElement('div');
          row.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:6px 16px;font-size:0.78rem;border-bottom:1px solid #f0ece8;cursor:pointer;transition:background 0.15s;';
          row.innerHTML='<span style="color:#555;">'+fmtDate(b.createdAt)+' <span style="color:#999;">('+b.files.length+' files)</span></span><span style="color:#b8956a;font-weight:600;">↩ Restore</span>';
          row.onmouseenter=function(){this.style.background='#f4f2ef';};
          row.onmouseleave=function(){this.style.background='transparent';};
          row.onclick=function(){
            if(!confirm('Restore site from backup of '+fmtDate(b.createdAt)+'?\n\nCurrent live files will be backed up first.'))return;
            row.style.opacity='0.5';
            row.querySelector('span:last-child').textContent='Restoring...';
            fetch('/api/backups/'+b.id+'/restore',{method:'POST'}).then(function(r){return r.json()}).then(function(r){
              addMsg('✅ Restored '+r.count+' file(s) from '+fmtDate(b.createdAt)+'. Page will reload.',false);
              setTimeout(function(){location.reload();},2000);
            }).catch(function(){
              addMsg('❌ Restore failed',false);
              row.style.opacity='1';
              row.querySelector('span:last-child').textContent='↩ Restore';
            });
          };
          bkList.appendChild(row);
        });
      }).catch(function(){});
    }

    pbBtn.onclick=function(){if(stagedCount===0)return;
      this.disabled=true;this.innerHTML='📦 Publishing...';
      fetch('/api/publish',{method:'POST'}).then(function(r){return r.json()}).then(function(d){
        stagedCount=0;
        addMsg('✅ Published '+d.count+' file(s). A full backup was auto-created — you can revert anytime from the Backups section below.',false);
        updatePublishBar();
        pbBtn.disabled=false;
        loadBackups();
      }).catch(function(){
        pbBtn.innerHTML='❌ Failed — try again';
        pbBtn.disabled=false;
      });
    };

    document.getElementById('rw-pv-btn').onclick=function(){
      window.open('/preview','_blank');
    };

    document.getElementById('rw-cx-btn').onclick=function(){
      if(!confirm('Discard all staged draft changes? The live site is not affected.'))return;
      var btn=this;btn.disabled=true;btn.textContent='Discarding…';
      fetch('/api/drafts/discard',{method:'POST'}).then(function(r){return r.json()}).then(function(d){
        stagedCount=0;
        addMsg('🗑️ Discarded '+d.count+' draft file(s). Live site untouched.',false);
        updatePublishBar();
        btn.disabled=false;btn.textContent='✕ Cancel Changes';
      }).catch(function(){
        btn.disabled=false;btn.textContent='✕ Cancel Changes';
        addMsg('❌ Could not discard drafts',false);
      });
    };

    function checkStaged(){
      fetch('/api/draft-status').then(function(r){return r.json()}).then(function(d){
        stagedCount=d.count;
        updatePublishBar();
      }).catch(function(){});
    }

    addMsg('Hi! I\'m the site editor. Edits are staged (drafts/) until you publish.',false);
    addMsg('Every publish auto-creates a backup you can revert from below. Try: "Change the hero heading"',false);

    t.onclick=function(){
      op=!op;o.style.display=op?'flex':'none';
      t.innerHTML=op?'&times;':'&#9998;';
      t.style.background=op?'#b8956a':'#1a2e3a';
      if(op){ checkStaged(); loadBackups(); }
    };
    document.getElementById('rw-c').onclick=t.onclick;

    // ── File upload (📎 button + drag & drop share this) ──
    var fileInput=document.getElementById('rw-file');

    function fmtSize(n){
      if(!n)return '0 B';
      if(n>1048576)return (n/1048576).toFixed(1)+' MB';
      if(n>1024)return (n/1024).toFixed(0)+' KB';
      return n+' B';
    }

    // Shows the file in the chat instantly (local preview), uploads in the background,
    // then swaps to the server copy. No file paths are ever shown.
    function uploadFiles(files){
      if(!files||!files.length)return;
      var esc=function(s){return String(s).replace(/[<>&"]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c];});};
      for(var i=0;i<files.length;i++){
        (function(file){
          var isImg=/^image\//.test(file.type), isVid=/^video\//.test(file.type), isAud=/^audio\//.test(file.type);
          var localUrl=URL.createObjectURL(file);
          var bubble=document.createElement('div');
          bubble.style.cssText='align-self:flex-start;background:#f4f2ef;color:#4a4a4a;border-radius:12px 12px 12px 4px;padding:10px 14px;max-width:85%;font-size:0.88rem;line-height:1.5;border:1px solid #e6e0d8;';
          var html='<b>'+esc(file.name)+'</b>';
          if(isImg) html+='<br><img src="'+localUrl+'" style="max-width:100%;border-radius:6px;display:block;margin-top:6px;">';
          else if(isVid) html+='<br><video src="'+localUrl+'" style="max-width:100%;border-radius:6px;margin-top:6px;" controls></video>';
          else if(isAud) html+='<br><audio src="'+localUrl+'" controls style="width:100%;margin-top:6px;"></audio>';
          else html+='<br><span style="display:flex;align-items:center;gap:6px;font-size:0.75rem;color:#888;"><span style="font-size:1rem;">📄</span> '+fmtSize(file.size)+'</span>';
          html+='<div style="font-size:0.72rem;color:#999;margin-top:6px;">⏳ uploading…</div>';
          bubble.innerHTML=html;
          document.getElementById('rw-m').appendChild(bubble);
          bubble.scrollIntoView({behavior:'smooth',block:'end'});

          var fd=new FormData();
          fd.append('file',file);
          fetch('/api/upload',{method:'POST',body:fd}).then(function(r){return r.json()}).then(function(d){
            if(d.success&&d.file){
              var f=d.file;
              if(isImg&&bubble.querySelector('img'))bubble.querySelector('img').src=f.url;
              if(isVid&&bubble.querySelector('video'))bubble.querySelector('video').src=f.url;
              if(isAud&&bubble.querySelector('audio'))bubble.querySelector('audio').src=f.url;
              bubble.style.border='1px solid #cfe8cf';
              var st=bubble.querySelector('div[style*="margin-top:6px;"]');
              if(st)st.textContent='✅ uploaded';
            } else {
              var st=bubble.querySelector('div[style*="margin-top:6px;"]');
              if(st)st.textContent='❌ '+(d.error||'upload failed');
              bubble.style.border='1px solid #f0c9c9';
            }
            URL.revokeObjectURL(localUrl);
          }).catch(function(){
            var st=bubble.querySelector('div[style*="margin-top:6px;"]');
            if(st)st.textContent='❌ upload error';
            bubble.style.border='1px solid #f0c9c9';
            URL.revokeObjectURL(localUrl);
          });
        })(files[i]);
      }
      return files.length;
    }

    fileInput.onchange=function(){
      uploadFiles(this.files);
      this.value='';
    };

    // ── Drag & drop ──
    var dropOverlay=document.createElement('div');
    dropOverlay.id='rw-drop';
    dropOverlay.style.cssText='display:none;position:absolute;inset:0;z-index:20;background:rgba(26,46,58,0.93);border:3px dashed #d4b08a;border-radius:16px;color:#fcfaf7;font-family:Raleway,sans-serif;font-size:1rem;font-weight:600;align-items:center;justify-content:center;flex-direction:column;gap:10px;text-align:center;padding:20px;';
    dropOverlay.innerHTML='<span style="font-size:2.2rem;">📥</span>Drop files here to upload<br><span style="font-size:0.75rem;font-weight:400;opacity:0.7;">Any file type — images, videos, audio, PDFs, docs</span>';
    o.appendChild(dropOverlay);

    var dragDepth=0;
    function hasFiles(e){ return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types,'Files')!==-1; }
    function showDrop(){ dropOverlay.style.display='flex'; }
    function hideDrop(){ dropOverlay.style.display='none'; }

    o.addEventListener('dragenter',function(e){ if(!hasFiles(e))return; e.preventDefault(); dragDepth++; showDrop(); });
    o.addEventListener('dragover',function(e){ if(!hasFiles(e))return; e.preventDefault(); e.dataTransfer.dropEffect='copy'; });
    o.addEventListener('dragleave',function(e){ if(!hasFiles(e))return; e.preventDefault(); if(--dragDepth<=0){dragDepth=0;hideDrop();} });
    o.addEventListener('drop',function(e){
      if(!hasFiles(e))return;
      e.preventDefault();
      e.stopPropagation();
      dragDepth=0;hideDrop();
      var files=e.dataTransfer.files;
      if(files&&files.length) uploadFiles(files);
    });

    // Never let the browser paste a file path into the text input
    var rwInput=document.getElementById('rw-i');
    ['dragenter','dragover'].forEach(function(ev){
      rwInput.addEventListener(ev,function(e){ if(hasFiles(e)){ e.preventDefault(); e.stopPropagation(); } });
      o.addEventListener(ev,function(e){ if(hasFiles(e)){ e.preventDefault(); e.stopPropagation(); } });
    });
    rwInput.addEventListener('drop',function(e){
      if(!hasFiles(e))return;
      e.preventDefault();
      e.stopPropagation();
      var files=e.dataTransfer.files;
      if(files&&files.length) uploadFiles(files);
    });

    // Drop anywhere on the page opens the editor and uploads
    ['dragenter','dragover'].forEach(function(ev){
      document.addEventListener(ev,function(e){ if(hasFiles(e))e.preventDefault(); });
    });
    document.addEventListener('drop',function(e){
      if(!hasFiles(e))return;
      if(e.target&&e.target.closest&&e.target.closest('#rw-o'))return; // overlay/input handle it
      e.preventDefault();
      var files=e.dataTransfer.files;
      if(files&&files.length){
        if(!op)t.onclick();
        setTimeout(function(){ uploadFiles(files); },300);
      }
    });

    // Attach button hover
    var attachLabel=document.getElementById('rw-attach-label');
    attachLabel.onmouseenter=function(){this.style.background='#e0dcd8';};
    attachLabel.onmouseleave=function(){this.style.background='#f0ece8';};

    function send(){
      var x=document.getElementById('rw-i').value.trim();
      if(!x||ld)return;
      document.getElementById('rw-i').value='';
      addMsg(x,true);
      ld=true;document.getElementById('rw-s').disabled=true;document.getElementById('rw-s').textContent='...';
      // Instant feedback bubble — updates in place as the job progresses
      var st=document.createElement('div');
      st.style.cssText='align-self:flex-start;background:#fff8e6;color:#8a6d3b;border:1px solid #f0e2b6;border-radius:12px 12px 12px 4px;padding:8px 12px;font-size:0.82rem;max-width:85%;';
      st.textContent='✅ Message received — starting…';
      var msgBox=document.getElementById('rw-m');
      msgBox.appendChild(st);
      st.scrollIntoView({behavior:'smooth',block:'end'});
      var t0=Date.now(),timer=null,jobId=null;
      function finish(){
        ld=false;document.getElementById('rw-s').disabled=false;document.getElementById('rw-s').textContent='Send';
        if(timer)clearTimeout(timer);
      }
      function poll(){
        fetch('/api/ai-chat/'+jobId).then(function(r){return r.json()}).then(function(d){
          if(d.status==='working'){
            st.innerHTML='⏳ Working on it… ('+Math.round((Date.now()-t0)/1000)+'s)';
            timer=setTimeout(poll,1500);
          } else if(d.status==='done'){
            st.innerHTML='✅ Done ('+Math.round((Date.now()-t0)/1000)+'s)';
            addMsg(d.reply||'Done!',false);
            checkStaged();
            finish();
          } else if(d.status==='error'){
            st.innerHTML='❌ '+(d.error||'Something went wrong');
            finish();
          } else {
            timer=setTimeout(poll,1500);
          }
        }).catch(function(){
          st.innerHTML='⚠️ Connection issue — retrying…';
          timer=setTimeout(poll,2000);
        });
      }
      fetch('/api/ai-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:x})})
        .then(function(r){return r.json()})
        .then(function(d){
          if(d.jobId){ jobId=d.jobId; st.innerHTML='✅ Message received — agent working…'; poll(); }
          else if(d.reply){ st.innerHTML='✅ Done'; addMsg(d.reply||'Done!',false); checkStaged(); finish(); }
          else { st.innerHTML='❌ '+(d.error||'Failed to start job'); finish(); }
        })
        .catch(function(){ st.innerHTML='❌ Could not reach server'; finish(); });
    }
    document.getElementById('rw-s').onclick=send;
    document.getElementById('rw-i').onkeydown=function(e){if(e.key==='Enter')send();};
  }).catch(function(){});
})();
