(function(){
  function css(id,c){var s=document.createElement('style');s.id=id;s.textContent=c;document.head.appendChild(s);}
  css('kx-css',
    '.kx{position:absolute;top:8px;right:8px;z-index:999999;display:flex;flex-direction:column;gap:8px;align-items:flex-end;opacity:.22;transition:opacity .25s}'+
    '.kx:hover{opacity:1}'+
    '.kx button{width:46px;height:46px;border:0;border-radius:10px;background:#111827;color:#fff;font-size:21px;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.55);line-height:1}'+
    '.kx button:hover{background:#1f2937}'+
    '.kx .badge{font:600 12px/1 monospace;color:#cbd5e1;background:rgba(17,24,39,.85);padding:5px 12px;border-radius:99px;white-space:nowrap}');

  // Перехват всех AudioContext — звук KasmVNC идёт через WebAudio
  (function(){
    if(window.__kxaP)return;window.__kxaP=true;
    window.__kxa=new Set();
    var names=['AudioContext','webkitAudioContext'];
    names.forEach(function(n){
      var Orig=window[n];
      if(!Orig)return;
      var Patch=new Proxy(Orig,{
        construct:function(t,args){
          var ctx=Reflect.construct(t,args);
          window.__kxa.add(ctx);
          return ctx;
        }
      });
      try{window[n]=Patch;}catch(e){}
    });
  })();

  function bodyReady(fn){if(document.body){fn();}else{document.addEventListener('DOMContentLoaded',fn);}}
  bodyReady(function(){
    var E=function(t){return document.createElement(t);};
    var box=E('div');box.className='kx';
    var fs=E('button');fs.textContent='⛶';fs.title='во весь экран';
    var sd=E('button');sd.textContent='🔊';sd.title='звук вкл/выкл';
    var badge=E('div');badge.className='badge';badge.textContent='by t.me/error_kill';
    box.appendChild(fs);box.appendChild(sd);box.appendChild(badge);
    document.body.appendChild(box);

    fs.addEventListener('click',function(){
      if(document.fullscreenElement){document.exitFullscreen&&document.exitFullscreen();}
      else{
        var el=document.documentElement;
        var r=el.requestFullscreen||el.webkitRequestFullscreen;
        if(r){try{r.call(el);}catch(e){}}
      }
      try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(function(){});}catch(e){}
    });

    var muted=false;
    function ctxMute(m){
      window.__kxa.forEach(function(ctx){
        try{if(m){ctx.suspend&&ctx.suspend();}else{ctx.resume&&ctx.resume();}}catch(e){}
      });
      try{
        document.querySelectorAll('audio,video').forEach(function(el){el.muted=m;});
      }catch(e){}
    }
    sd.addEventListener('click',function(){
      muted=!muted;
      ctxMute(muted);
      sd.textContent=muted?'🔇':'🔊';
    });
  });
})();
