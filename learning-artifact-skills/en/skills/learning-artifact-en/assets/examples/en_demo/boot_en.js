/* English demo boot */
document.getElementById('app').innerHTML=EXEC+P0+[S1,S2].join('')+P2+P3;
post.forEach(fn=>fn());
autoLink();bidiFix($('app'));wireCode();buildJump();buildGlossary();buildToc();
(function(){
  const get=k=>{try{return localStorage.getItem(k)}catch(e){return null}},set=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
  const lite=$('lite');
  const apply=on=>{document.body.classList.toggle('lite',on);const lb=document.getElementById('lb');if(lb)lb.hidden=!on;lite.setAttribute('aria-pressed',on)};
  apply(get('demo_lite')==='1');
  {const x=document.getElementById('lbx');if(x)x.addEventListener('click',()=>{apply(false);set('demo_lite','0')})}
  lite.addEventListener('click',()=>{const on=!document.body.classList.contains('lite');apply(on);set('demo_lite',on?'1':'0')});
})();
