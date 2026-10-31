/* enhancement layer: runs after the page's own scripts. Config in window.ENH. */
(function(){
const C=window.ENH,G=C.G;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const wrap=document.querySelector('.wrap')||document.body;
const get=k=>{try{return localStorage.getItem(k)}catch(e){return null}},set=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};

/* ---------- bidi helper (same idea as the main pages) ---------- */
const T_="[A-Za-z0-9_\\u0370-\\u03FF][A-Za-z0-9_\\u00B2\\u2080-\\u2089\\u0370-\\u03FF]*(?:[.,][A-Za-z0-9_\\u00B2\\u2080-\\u2089\\u0370-\\u03FF]+)*%?";
const OP_="\\s*[=<>+\\-\\u2212\\u2013\\u00D7\\u00F7*/^|\\u00B1\\u2248]+\\s*";
const BRE=new RegExp("(?:(?<=^|[\\s(\\[])\\u2212(?=\\d))?"+T_+"(?:(?:"+OP_+"|\\s+)"+T_+")*","g");
const BSKIP='.en1,.voc,.n,.en,code,pre,script,style,svg,.cap,.fx,button,select,option,textarea,.term,.chip,a.chip,td.n,th.n,.tx,.legend';
function bidiFix(root){return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
  while(w.nextNode())nodes.push(w.currentNode);
  nodes.forEach(nd=>{
    const p=nd.parentElement;if(!p||p.closest(BSKIP))return;
    const t=nd.nodeValue;if(!/[A-Za-z0-9]/.test(t))return;
    BRE.lastIndex=0;let last=0,m,frag=null;
    while((m=BRE.exec(t))){
      if(!m[0])break;
      frag=frag||document.createDocumentFragment();
      frag.appendChild(document.createTextNode(t.slice(last,m.index)));
      const s=document.createElement('span');s.className='n';s.style.cssText='direction:ltr;unicode-bidi:isolate;display:inline-block;font-family:var(--mono);font-size:.92em';s.textContent=m[0].replace(/\s+$/,'');
      frag.appendChild(s);last=m.index+s.textContent.length;BRE.lastIndex=last;
    }
    if(frag){frag.appendChild(document.createTextNode(t.slice(last)));nd.replaceWith(frag);}
  });
}

/* ---------- chrome ---------- */
const bar=document.createElement('header');bar.className='enh-bar';
bar.innerHTML=`<div class="r"><button type="button" id="enh-jump" class="jb" aria-haspopup="listbox">▾</button><button type="button" id="enh-bk" hidden>↩ Back</button><button type="button" id="enh-mk" title="Mark the current place so you can come back to it">📍 Mark</button>${C.exec?'<button type="button" id="enh-exb">Executive summary</button>':''}<button type="button" id="enh-en" title="Show the English term next to every linked concept">EN</button><button type="button" id="enh-lite" title="Hides code and side notes">No code</button><button type="button" id="enh-tocb">Contents</button><button type="button" id="enh-glb">Glossary</button></div><div class="enh-cur" id="enh-cur" dir="auto"></div><div class="enh-lb" id="enh-lb" hidden>"No code" mode on: code, side notes and lecture notes are hidden.<button type="button" id="enh-lbx">Cancel</button></div><div class="enh-prog"><i id="enh-pg"></i></div>`;
document.body.insertBefore(bar,document.body.firstChild);
document.body.insertAdjacentHTML('beforeend','<div id="enh-pop" role="dialog" hidden></div><div id="enh-jmpp" hidden></div><div id="enh-strip" hidden><button type="button" id="enh-bk2" dir="auto">↩ Back to: <b id="enh-strip-l"></b> <span id="enh-strip-n"></span></button><button type="button" id="enh-hist">Previous places ▲</button><button type="button" id="enh-sx" aria-label="Clear history">✕</button></div><div id="enh-histp" hidden></div><div class="enh-drawer" id="enh-toc" hidden><aside><div class="hd"><b>Detailed contents</b><button id="enh-tocx">Close</button></div><input id="enh-tq" type="search" placeholder="Search topic, code, concept…" aria-label="Search the contents"><div id="enh-tocl"></div></aside></div><div class="enh-drawer" id="enh-gl" hidden><aside><div class="hd"><b>Glossary</b><button id="enh-glx">Close</button></div><input id="enh-gq" type="search" placeholder="Search a concept…" aria-label="Search a concept"><div id="enh-gll"></div></aside></div>');

/* ---------- sections ---------- */
const sections=C.sections,ids=new Set(sections.map(s=>s.id)),secEl={};
sections.forEach(s=>{
  const h=$(s.id);if(!h)return;
  if(h.tagName==='SECTION'){h.classList.add('enh-sec');h.dataset.sid=s.id;secEl[s.id]=h;return}
  const sec=document.createElement('div');sec.className='enh-sec';sec.dataset.sid=s.id;
  h.parentNode.insertBefore(sec,h);
  let x=h;
  while(x){const nx=x.nextElementSibling;sec.appendChild(x);
    if(!nx||nx.tagName==='SCRIPT'||nx.id==='tip'||ids.has(nx.id)||(nx.tagName==='H2'&&nx!==h))break;x=nx}
  secEl[s.id]=sec;
});
if(C.exec){
  const first=secEl[sections[0].id],ex=document.createElement('div');
  ex.className='enh-sec';ex.id='exec';ex.dataset.sid='exec';
  ex.innerHTML='<h2 style="margin-top:2rem">Executive summary</h2>'+C.exec;
  first.parentNode.insertBefore(ex,first);secEl.exec=ex;ids.add('exec');
  sections.unshift({id:'exec',t:'Executive summary'});
  if(C.groups)C.groups[0].ids.unshift('exec');
  bidiFix(ex);
}
const title=id=>(sections.find(s=>s.id===id)||{}).t||id;

/* ---------- definition cards ---------- */
const vocTags=g=>{const en=(g.en||'').toLowerCase();const t=(g.ev||'').split(' · ').map(x=>x.trim()).filter(x=>x&&x.toLowerCase()!==en&&!/[()=+−*\/&]/.test(x));return t.length?`<span class="voc" dir="ltr"><em class="vl" dir="ltr">Related terms:</em>${t.map(x=>`<i>${x}</i>`).join('')}</span>`:''};
const defHtml=k=>{const g=G[k];return `<div class="def" id="d-${k}"><header><b>📌 ${g.he}</b><span class="entag">${g.en||''}</span></header><div><b>What it is</b><span>${g.d}<span class="en1" dir="ltr" lang="en">${g.ed}</span>${vocTags(g)}</span></div><div><b>How it is computed</b><span>${g.c}</span></div><div><b>What to conclude</b><span>${g.r}</span></div></div>`};
const lastAfter=new Map();
Object.keys(G).forEach(k=>{
  const g=G[k],sec=secEl[g.home];if(!sec)return;
  const tmp=document.createElement('div');tmp.innerHTML=defHtml(k);const node=tmp.firstChild;
  let anchor=null;
  if(g.after){
    const hs=[...sec.querySelectorAll('h2,h3,h4')].find(h=>h.textContent.trim().startsWith(g.after));
    if(hs){anchor=hs.nextElementSibling&&hs.nextElementSibling.tagName==='P'?hs.nextElementSibling:hs}
  }
  if(!anchor){ // top of the section: after ctx / heading
    anchor=sec.querySelector(':scope>.ctx')||sec.querySelector(':scope>.sub')||sec.querySelector('h2')||sec.firstElementChild;
  }
  const key=anchor;const prev=lastAfter.get(key)||anchor;
  prev.insertAdjacentElement('afterend',node);lastAfter.set(key,node);
  bidiFix(node);
});

/* ---------- need row, tl;dr, lecture notes ---------- */
sections.forEach(s=>{
  const sec=secEl[s.id];if(!sec)return;
  let anchor=sec.querySelector(':scope>.ctx')||sec.querySelector(':scope>.sub')||sec.querySelector('h2');
  if(!anchor)return;
  let html='';
  if(C.need&&C.need[s.id])html+=`<div class="need"><b>Concepts this relies on</b><span class="chips">${C.need[s.id].map(k=>`<a class="chip" data-k="${k}" data-en="${esc(G[k].en||'')}" href="#d-${k}" dir="auto">${G[k].he}</a>`).join('')}</span></div>`;
  if(C.tldr&&C.tldr[s.id])html+=`<div class="tldr"><b>In one line</b><span>${C.tldr[s.id]}</span></div>`;
  if(C.lecn&&C.lecn[s.id])html+=`<details class="lecn" open><summary>What the lecture said <small>(${C.lecn[s.id].src||'notes from the transcript'})</small></summary><ul>${C.lecn[s.id].items.map(t=>`<li>${t}</li>`).join('')}</ul></details>`;
  if(!html)return;
  const tmp=document.createElement('div');tmp.innerHTML=html;
  let pos=anchor;[...tmp.children].forEach(n=>{pos.insertAdjacentElement('afterend',n);pos=n;bidiFix(n)});
});

/* ---------- auto-link first mention per section ---------- */
(function(){
  const items=[];Object.keys(G).forEach(k=>(G[k].al||[]).forEach(a=>items.push([a,k])));
  items.sort((a,b)=>b[0].length-a[0].length);
  const map={};items.forEach(([a,k])=>map[a.toLowerCase()]=k);
  const alt=items.map(([a])=>a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
  const re=new RegExp("(?<![\\u0590-\\u05FFA-Za-z0-9_.])([הובלמשכ]{0,2})("+alt+")(?![\\u0590-\\u05FFA-Za-z0-9_])","gi");
  const EX='pre,code,.term,.chip,h1,h2,h3,h4,summary,.cap,a,button,select,option,.fx,script,svg,.flow,.toc,textarea,.def,.tldr b,.need,thead,th,.legend,figcaption b,.enh-bar,#enh-pop,.enh-drawer';
  Object.keys(secEl).forEach(sid=>{
    const sec=secEl[sid],seen=new Set();
    sec.querySelectorAll('a.term').forEach(a=>seen.add(a.dataset.k));
    const w=document.createTreeWalker(sec,NodeFilter.SHOW_TEXT),nodes=[];
    while(w.nextNode())nodes.push(w.currentNode);
    nodes.forEach(nd=>{
      const p=nd.parentElement;if(!p||p.closest(EX))return;
      const t=nd.nodeValue;if(t.length<2)return;
      re.lastIndex=0;let last=0,m,frag=null;
      while((m=re.exec(t))){
        const k=map[m[2].toLowerCase()];
        if(!k||seen.has(k)||G[k].home===sid)continue;
        seen.add(k);
        frag=frag||document.createDocumentFragment();
        frag.appendChild(document.createTextNode(t.slice(last,m.index+m[1].length)));
        const a=document.createElement('a');a.className='term';a.dataset.k=k;a.dataset.en=G[k].en||'';a.href='#d-'+k;a.setAttribute('dir','auto');a.textContent=m[2];
        frag.appendChild(a);last=m.index+m[0].length;
      }
      if(frag){frag.appendChild(document.createTextNode(t.slice(last)));nd.replaceWith(frag);}
    });
  });
})();


/* annotate EVERY Hebrew mention of a glossary alias with its English term (visible only in EN mode) */
function annotateAll(){
  const items=[];Object.keys(G).forEach(k=>(G[k].al||[]).forEach(a=>{if(/[\u0590-\u05FF]/.test(a)&&G[k].en)items.push([a,k])}));
  if(!items.length)return;
  items.sort((a,b)=>b[0].length-a[0].length);
  const map={};items.forEach(([a,k])=>map[a]=k);
  const alt=items.map(([a])=>a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
  const re=new RegExp("(?<![\\u0590-\\u05FFA-Za-z0-9_.])([הובלמשכ]{0,2})("+alt+")(?![\\u0590-\\u05FFA-Za-z0-9_])","g");
  const EX='pre,code,.term,.chip,h1,h2,h3,h4,summary,.cap,a,button,select,option,.fx,script,svg,textarea,.tn,.en1,.voc,.def>header,#pop,#enh-pop,.bar,.enh-bar,.enh-drawer,#gl,#toc,.flow,.toc';
  const roots=document.querySelectorAll('.enh-sec');
  const done=new Set();
  roots.forEach(root=>{
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
    while(w.nextNode())nodes.push(w.currentNode);
    nodes.forEach(nd=>{
      if(done.has(nd))return;done.add(nd);
      const p=nd.parentElement;if(!p||p.closest(EX))return;
      const t=nd.nodeValue;if(t.length<2)return;
      re.lastIndex=0;let last=0,m,frag=null;
      while((m=re.exec(t))){
        const k=map[m[2]];if(!k)continue;
        frag=frag||document.createDocumentFragment();
        frag.appendChild(document.createTextNode(t.slice(last,m.index+m[1].length)));
        const s=document.createElement('span');s.className='tn';s.dataset.en=G[k].en;s.textContent=m[2];
        frag.appendChild(s);last=m.index+m[0].length;
      }
      if(frag){frag.appendChild(document.createTextNode(t.slice(last)));nd.replaceWith(frag);}
    });
  });
}

annotateAll();
/* ---------- navigation ---------- */
const pop=$('enh-pop'),stack=[];let popSticky=false,popT=0;
const canHover=matchMedia('(hover:hover)').matches;
const curSec=()=>{let cur=null;Object.keys(secEl).forEach(id=>{if(secEl[id].getBoundingClientRect().top<140)cur=id});return cur};
const headingAt=()=>{let cur=null;document.querySelectorAll('.enh-sec h2,.enh-sec h3,.enh-sec h4,.enh-sec .def>header b').forEach(h=>{if(h.getBoundingClientRect().top<150)cur=h});return cur?cur.textContent.replace('📌','').trim().slice(0,44):''};
function updBack(){
  const top=stack[stack.length-1];
  $('enh-bk').hidden=!top;$('enh-strip').hidden=!top;
  if(!top)$('enh-histp').hidden=true;
  if(top){$('enh-strip-l').textContent=top.label;$('enh-strip-n').textContent=stack.length>1?'('+stack.length+')':'';$('enh-hist').hidden=stack.length<2}
}
function pushHere(from,label){
  const cs=curSec();
  stack.push({y:scrollY,label:label||headingAt()||title(cs)||'Previous place',sec:title(cs),el:from});
  if(stack.length>12)stack.shift();
  updBack();
}
function jump(id,from){
  const t=document.getElementById(id);if(!t)return;
  pushHere(from);hidePop();
  t.scrollIntoView({behavior:'smooth',block:'start'});
  t.classList.remove('flash');void t.offsetWidth;t.classList.add('flash');
}
function goBack(){const s=stack.pop();if(!s)return;scrollTo({top:s.y,behavior:'smooth'});updBack();if(s.el&&s.el.isConnected){s.el.classList.remove('flash');void s.el.offsetWidth;s.el.classList.add('flash')}}
function showHist(){
  const p=$('enh-histp');
  p.innerHTML='<b>Places you were (most recent first)</b>'+stack.map((s,i)=>({s,i})).reverse().map(o=>`<button type="button" data-hi="${o.i}" dir="auto"><span>${esc(o.s.label)}</span><small>${esc(o.s.sec||'')}</small></button>`).join('');
  p.hidden=!p.hidden;
}
const popHtml=k=>{const g=G[k];return `<header>${g.he}<small>${g.en||''}</small></header><div><b>What it is</b>${g.d}<span class="en1" dir="ltr" lang="en">${g.ed}</span>${vocTags(g)}</div><div><b>How it is computed</b>${g.c}</div><div><b>What to conclude</b>${g.r}</div><footer><span>Full definition: ${title(g.home)}</span><button type="button" data-go="${k}">Jump ↗</button></footer>`};
function showPop(a,sticky){
  const k=a.dataset.k;if(!G[k])return;
  pop.innerHTML=popHtml(k);bidiFix(pop);pop.hidden=false;popSticky=!!sticky;pop.style.pointerEvents=sticky?'auto':'none';
  const r=a.getBoundingClientRect(),w=pop.offsetWidth,h=pop.offsetHeight;
  let x=Math.max(10,Math.min(innerWidth-w-10,r.left+r.width/2-w/2)),y=r.bottom+8;if(y+h>innerHeight-10)y=Math.max(10,r.top-h-8);
  pop.style.left=x+'px';pop.style.top=y+'px';pop._from=a;
}
function hidePop(){pop.hidden=true;popSticky=false}
document.addEventListener('mouseover',e=>{if(!canHover)return;const a=e.target.closest('a.term,a.chip');if(!a)return;clearTimeout(popT);popT=setTimeout(()=>showPop(a,false),120)});
document.addEventListener('mouseout',e=>{if(!canHover)return;if(!e.target.closest('a.term,a.chip'))return;clearTimeout(popT);if(!popSticky)hidePop()});
document.addEventListener('focusin',e=>{const a=e.target.closest&&e.target.closest('a.term,a.chip');if(a)showPop(a,true)});
document.addEventListener('click',e=>{
  const a=e.target.closest('a.term,a.chip');
  if(a){e.preventDefault();if(canHover)jump('d-'+a.dataset.k,a);else showPop(a,true);return}
  const g=e.target.closest('[data-go]');if(g){jump('d-'+g.dataset.go,pop._from);return}
  const h=e.target.closest('a[href^="#"]');
  if(h&&h.getAttribute('href').length>1&&!h.closest('#enh-pop')&&document.getElementById(h.getAttribute('href').slice(1))){e.preventDefault();jump(h.getAttribute('href').slice(1),h);return}
  if(!e.target.closest('#enh-pop'))hidePop();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){hidePop();$('enh-gl').hidden=true;$('enh-toc').hidden=true}});
$('enh-bk').addEventListener('click',goBack);$('enh-bk2').addEventListener('click',goBack);
$('enh-hist').addEventListener('click',showHist);
$('enh-sx').addEventListener('click',()=>{stack.length=0;updBack()});
$('enh-mk').addEventListener('click',()=>{pushHere(null,'📍 '+(headingAt()||'Bookmark'));const b=$('enh-mk');b.textContent='✓ Saved';setTimeout(()=>b.textContent='📍 Mark',1200)});
$('enh-histp').addEventListener('click',e=>{const b=e.target.closest('[data-hi]');if(!b)return;const i=+b.dataset.hi,s=stack[i];stack.length=i;scrollTo({top:s.y,behavior:'smooth'});updBack();$('enh-histp').hidden=true});
if(C.exec)$('enh-exb').addEventListener('click',()=>jump('exec',null));

/* ---------- jump menu (custom, always fires) + progress + visited ---------- */
const seen=new Set((get('enh_seen_'+C.key)||'').split(',').filter(Boolean));
(function(){
  const jb=$('enh-jump'),jp=$('enh-jmpp');
  const groups=C.groups||[{label:'Parts',ids:sections.map(s=>s.id)}];
  let cur=sections[0].id;
  const label=id=>(seen.has(id)?'✓ ':'')+title(id);
  const drawP=()=>{jp.innerHTML=groups.map(g=>`<div class="gl">${esc(g.label)}</div>`+g.ids.map(id=>`<button type="button" data-j="${id}" class="${id===cur?'cur':''}" dir="auto">${esc(label(id))}</button>`).join('')).join('')};
  const setCur=id=>{cur=id;jb.value=id;jb.textContent=title(id)+' ▾'};
  jb.addEventListener('click',e=>{e.stopPropagation();drawP();jp.hidden=!jp.hidden;if(!jp.hidden){const c=jp.querySelector('.cur');if(c)c.scrollIntoView({block:'center'})}});
  jp.addEventListener('click',e=>{const b=e.target.closest('[data-j]');if(!b)return;jp.hidden=true;jump(b.dataset.j,null)});
  document.addEventListener('click',e=>{if(!e.target.closest('#enh-jump,#enh-jmpp'))jp.hidden=true});
  let tk=0;
  const upd=()=>{
    tk=0;let c=sections[0].id;
    sections.forEach(s=>{const e=$(s.id);if(e&&e.getBoundingClientRect().top<150)c=s.id});
    if(c!==cur||!jb.textContent)setCur(c);
    const h=document.documentElement.scrollHeight-innerHeight;$('enh-pg').style.width=(h>0?Math.min(100,scrollY/h*100):0)+'%';
    let ch=false;Object.keys(secEl).forEach(id=>{const r=secEl[id].getBoundingClientRect();if(!seen.has(id)&&r.top<0&&r.bottom<innerHeight*.9){seen.add(id);ch=true}});
    if(ch)set('enh_seen_'+C.key,[...seen].join(','));
  };
  setCur(cur);
  addEventListener('scroll',()=>{if(!tk)tk=requestAnimationFrame(upd)},{passive:true});upd();
})();

/* ---------- glossary drawer ---------- */
(function(){
  const ks=Object.keys(G);
  const draw=q=>{
    q=(q||'').trim().toLowerCase();
    $('enh-gll').innerHTML=ks.filter(k=>!q||(G[k].he+' '+(G[k].en||'')+' '+(G[k].al||[]).join(' ')+' '+G[k].d+' '+G[k].ed+' '+G[k].ev).toLowerCase().includes(q)).map(k=>`<button type="button" class="gi" data-gk="${k}"><b dir="auto">${G[k].he}</b> <small dir="auto">${G[k].en||''} · ${title(G[k].home)}</small></button>`).join('')||'<p>Not found.</p>';
  };
  draw('');
  $('enh-gq').addEventListener('input',e=>draw(e.target.value));
  $('enh-gll').addEventListener('click',e=>{const b=e.target.closest('[data-gk]');if(!b)return;$('enh-gl').hidden=true;jump('d-'+b.dataset.gk,null)});
  $('enh-glb').addEventListener('click',()=>{$('enh-gl').hidden=false;$('enh-gq').focus()});
  $('enh-glx').addEventListener('click',()=>{$('enh-gl').hidden=true});
  $('enh-gl').addEventListener('click',e=>{if(e.target===$('enh-gl'))$('enh-gl').hidden=true});
})();

/* ---------- detailed TOC ---------- */
(function(){
  let n=0;
  const SEL='h3,h4,.def,figure,.codebox,.cell,.lecn,.sum';
  const info=e=>{
    let t='',ic='';
    if(e.matches('h3,h4')){t=e.textContent.trim();ic='§'}
    else if(e.matches('.def')){t=e.querySelector('header b').textContent.replace('📌','').trim();ic='📌'}
    else if(e.matches('figure')){const w=e.querySelector('.seg,select,input');const h=e.querySelector('h4,figcaption b');t=(h?h.textContent:'Chart').trim();ic=w?'⚙':'◔'}
    else if(e.matches('.codebox,.cell')){const pre=e.querySelector('pre');const first=pre?pre.textContent.split('\n').map(s=>s.trim()).find(s=>s&&!s.startsWith('#')):'';t='Code: '+(first||'');ic='⌨'}
    else if(e.matches('.lecn')){t='What the lecture said';ic='🎓'}
    else if(e.matches('.sum')){t='Station summary';ic='✓'}
    if(!t||t==='Code: ')return null;
    if(!e.id)e.id='enhn'+(++n);
    return {id:e.id,t:t.length>70?t.slice(0,68)+'…':t,ic};
  };
  const groups=sections.map(s=>{const sec=secEl[s.id];return {id:s.id,title:s.t,items:sec?[...sec.querySelectorAll(SEL)].map(info).filter(Boolean):[]}});
  const draw=q=>{
    q=(q||'').trim().toLowerCase();
    $('enh-tocl').innerHTML=groups.map(g=>{
      const its=g.items.filter(i=>!q||(i.t+' '+g.title).toLowerCase().includes(q));
      if(q&&!its.length)return '';
      return `<details ${q?'open':''} data-g="${g.id}"><summary dir="auto"><button type="button" class="tgo" data-id="${g.id}">${g.title}</button></summary>${its.map(i=>`<button type="button" class="it" data-id="${i.id}" dir="auto"><span class="ic">${i.ic}</span> ${esc(i.t)}</button>`).join('')}</details>`;
    }).join('')||'<p>Not found.</p>';
  };
  draw('');
  $('enh-tq').addEventListener('input',e=>draw(e.target.value));
  $('enh-tocl').addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(!b)return;e.preventDefault();$('enh-toc').hidden=true;jump(b.dataset.id,null)});
  $('enh-tocb').addEventListener('click',()=>{const cur=$('enh-jump').value;$('enh-tq').value='';draw('');$('enh-tocl').querySelectorAll('details').forEach(d=>d.open=d.dataset.g===cur);$('enh-toc').hidden=false;const d=$('enh-tocl').querySelector(`details[data-g="${cur}"]`);if(d)d.scrollIntoView({block:'start'})});
  $('enh-tocx').addEventListener('click',()=>{$('enh-toc').hidden=true});
  $('enh-toc').addEventListener('click',e=>{if(e.target===$('enh-toc'))$('enh-toc').hidden=true});
  const flat=groups.flatMap(g=>g.items);let tk=0;
  const upd=()=>{tk=0;let cur=null;for(const i of flat){const e=document.getElementById(i.id);if(!e)continue;if(e.getBoundingClientRect().top<150)cur=i;else break}$('enh-cur').textContent=cur?cur.ic+' '+cur.t:''};
  addEventListener('scroll',()=>{if(!tk)tk=requestAnimationFrame(upd)},{passive:true});upd();
})();

/* ---------- English terms inline toggle ---------- */
(function(){
  const b=$('enh-en');
  const apply=on=>{document.body.classList.toggle('enh-en',on);b.setAttribute('aria-pressed',on)};
  apply(get('enh_en')==='1');
  b.addEventListener('click',()=>{const on=!document.body.classList.contains('enh-en');apply(on);set('enh_en',on?'1':'0')});
})();
/* ---------- lite mode ---------- */
(function(){
  const b=$('enh-lite');
  const apply=on=>{document.body.classList.toggle('enh-lite',on);b.setAttribute('aria-pressed',on);$('enh-lb').hidden=!on};
  apply(get('enh_lite')==='1');
  b.addEventListener('click',()=>{const on=!document.body.classList.contains('enh-lite');apply(on);set('enh_lite',on?'1':'0')});
  $('enh-lbx').addEventListener('click',()=>{apply(false);set('enh_lite','0')});
})();
})();
