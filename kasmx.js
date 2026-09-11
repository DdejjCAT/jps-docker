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
(function(){
  // На мобильных автоматически включаем Local Scaling (resize=scale),
  // чтобы стрим 1280x720 целиком умещался в границы экрана телефона.
  var kxFired=false;
  function kxIsMobile(){
    var w=window.innerWidth||document.documentElement.clientWidth||screen.width;
    var touch=('ontouchstart' in window)||(navigator.maxTouchPoints&&navigator.maxTouchPoints>0);
    return touch||(w>0&&w<900);
  }
  function kxForceScale(){
    var el=document.getElementById('noVNC_setting_resize');
    if(!el)return setTimeout(kxForceScale,250);
    if(el.value!=='scale'){el.value='scale';}
    // re-dispatch: applyResizeMode() требует o.rfb и применяет scale только после
    // соединения/следующего фрейма — повторяем, пока не подействует.
    try{el.dispatchEvent(new Event('change',{bubbles:true}));}catch(e){}
    kxFired=true;
  }
  function kxStart(){
    if(!kxIsMobile())return;
    kxForceScale();
  }
  if(document.readyState==='complete'){kxStart();}
  else if(document.addEventListener){document.addEventListener('DOMContentLoaded',kxStart);window.addEventListener('load',kxStart);}
  setTimeout(kxStart,1200);
  setTimeout(kxStart,4000);
  setTimeout(kxStart,9000);
  setTimeout(kxStart,30000);
})();
(function(){
  // Растягиваем видеоканвас на ВЕСЬ экран, сохраняя соответствие ввода:
  // KasmVNC считает координаты мыши от _canvas (input-канвас, tabIndex=-1) через
  // getBoundingClientRect. Если растягивать ТОЛЬКО видимый WebGL-канвас - ввод разъезжается.
  // Поэтому fixed-растягиваем И input-канвас, И все видимые канвасы одновременно.
  function kxStretchV2(){
    var lst=[];
    try{lst=Array.prototype.slice.call(document.querySelectorAll('canvas'));}catch(e){}
    var cv=null,foundInput=false;
    lst.forEach(function(c){ if(c.tabIndex===-1){cv=c;foundInput=true;} });
    if(!cv){
      var w=-1;
      lst.forEach(function(c){ if((c.width||0)>w){w=c.width;cv=c;} });
    }
    if(!cv){setTimeout(kxStretchV2,500);return;}
    if(!foundInput&&cv.width<300){setTimeout(kxStretchV2,500);return;}
    var scr=cv.parentElement;
    if(scr){
      try{scr.style.overflow='hidden';scr.style.width='100vw';scr.style.height='100vh';scr.style.position='fixed';scr.style.left='0';scr.style.top='0';scr.style.margin='0';scr.style.maxWidth='none';}catch(e){}
    }
    var s=cv.style;
    s.position='fixed';s.left='0';s.top='0';s.width='100vw';s.height='100vh';
    s.maxWidth='none';s.maxHeight='none';s.objectFit='fill';s.margin='0';s.border='0';s.zIndex='5';
    var z=4;
    lst.forEach(function(c){ if(c===cv)return; var cs=c.style;
      cs.position='fixed';cs.left='0';cs.top='0';cs.width='100vw';cs.height='100vh';
      cs.maxWidth='none';cs.maxHeight='none';cs.objectFit='fill';cs.margin='0';cs.border='0';cs.zIndex=String(z); });
    setTimeout(kxStretchV2,1000);
  }
  setTimeout(kxStretchV2,200);
  setTimeout(kxStretchV2,1500);
  setTimeout(kxStretchV2,5000);
})();
