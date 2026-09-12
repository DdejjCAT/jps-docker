(function(){
  function css(id,c){var s=document.createElement('style');s.id=id;s.textContent=c;document.head.appendChild(s);}
  css('kx-css',
    'body{margin:0!important}.kx{position:absolute;top:8px;right:8px;z-index:999999;display:flex;flex-direction:column;gap:8px;align-items:flex-end;opacity:.22;transition:opacity .25s}'+
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
  // kxStretchV3: правильно масштабируем без поломки ввода.
  // Проблема: CSS-растягивание канваса на 100vw/100vh НЕ меняет внутренний
  // scale, по которому KasmVNC переводит clientX в координаты сервера (remote=clientX/scale).
  // Вместо этого:
  //  1) растягиваем на весь экран КОНТЕЙНЕР канваса (его размер читает KasmVNC);
  //  2) включаем НАТИВНЫЙ resize=scale — KasmVNC сам выставляет scale и канвас,
  //     а значит и ввод, и курсор оказываются правильными;
  //  3) убираем свой CSS-стилинг канвасов, оставшийся от старых версий.
  //  4) dot-курсор (z-index 65535) ставится приложением в raw-координатах сервера
  //     (0..1920) — переотображаем его через transform по тому же scale.
  (function(){var st=document.createElement('style');st.textContent='body{margin:0!important;background:#000}';document.head.appendChild(st);})();
  function kxStretchV3(){
    try{
      var lst=Array.prototype.slice.call(document.querySelectorAll('canvas'));
      var big=null;lst.forEach(function(c){if(!big||(c.width||0)>(big.width||0))big=c;});
      if(!big)return;

      // откатываем старый CSS-стилинг канвасов (наш собственный из старых версий)
      lst.forEach(function(c){
        var cs=c.style;
        if(Number(cs.zIndex)>=4||cs.position==='fixed'){
          cs.position='';cs.left='';cs.top='';cs.width='';cs.height='';
          cs.maxWidth='';cs.maxHeight='';cs.objectFit='';cs.margin='';
          cs.border='';cs.zIndex='';cs.right='';cs.bottom='';
        }
      });

      // контейнер канваса — на весь экран; сам канвас оставляем KasmVNC.
      var scr=big.parentElement;
      if(scr){
        scr.style.overflow='hidden';
        scr.style.width='100vw';
        scr.style.height='100vh';
        scr.style.maxWidth='none';
        scr.style.maxHeight='none';
        scr.style.margin='0';
      }

      // нативный resize=scale: ввод и курсор считаются самим KasmVNC
      var sel=document.getElementById('noVNC_setting_resize');
      if(sel){
        if(sel.value!=='scale')sel.value='scale';
        try{sel.dispatchEvent(new Event('change',{bubbles:true}));}catch(e){}
      }

      // dot-курсор KasmVNC (canvas, fixed, z-index 65535) — пересчитываем по тому же масштабу
      (function(){
        var dot=null;
        for(var i=0;i<lst.length;i++){
          var c=lst[i];
          if(c.style.zIndex==='65535'){dot=c;break;}
        }
        if(dot){
          var S=(big.getBoundingClientRect().width||big.width)/(big.width||1);
          var L=parseFloat(dot.style.left),T=parseFloat(dot.style.top);
          if(isFinite(L)&&isFinite(T)&&(L>window.innerWidth||T>window.innerHeight)){
            dot.style.transform='translate('+Math.round(L*(S-1))+'px,'+Math.round(T*(S-1))+'px)';
          }
        }
      })();
    }catch(e){}
    setTimeout(kxStretchV3,500);
  }
  setTimeout(kxStretchV3,300);
  setTimeout(kxStretchV3,1200);
  setTimeout(kxStretchV3,4000);
  setTimeout(kxStretchV3,10000);
})();