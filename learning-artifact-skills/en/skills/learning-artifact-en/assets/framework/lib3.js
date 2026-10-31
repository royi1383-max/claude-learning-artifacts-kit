/* ===== lib: helpers, components, charts ===== */
const $=id=>document.getElementById(id);
const NS='http://www.w3.org/2000/svg';
const f=(v,d=2)=>Number(v).toFixed(d).replace('-','−');
const fm=(v,d=2)=>Number(v).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}).replace('-','−');
const pc=(v,d=1)=>(v*100).toFixed(d)+'%';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const N=s=>`<span class="n">${s}</span>`;
const FX=s=>`<span class="fx">${s}</span>`;
const sum=a=>a.reduce((t,v)=>t+v,0);
const mean=a=>sum(a)/a.length;
const post=[];                       // hooks to run after the DOM exists
let _uid=0;
const uid=()=>'u'+(++_uid);
const PAL=i=>`var(--c${((i%8)+8)%8})`;
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e}

/* ---------- tooltip ---------- */
const tip=$('tip');
function showTip(e,rows){
  tip.innerHTML=rows.map(r=>`<div class="tr"><span class="k">${r[0]}</span><span class="n">${r[1]}</span></div>`).join('');
  tip.hidden=false;
  const w=tip.offsetWidth,h=tip.offsetHeight;
  let x=e.clientX+14,y=e.clientY+14;
  if(x+w>innerWidth-8)x=e.clientX-w-14;
  if(y+h>innerHeight-8)y=e.clientY-h-14;
  tip.style.left=Math.max(8,x)+'px';tip.style.top=Math.max(8,y)+'px';
}
const hideTip=()=>{tip.hidden=true};
function tipOn(node,fn){
  node.addEventListener('pointermove',e=>showTip(e,fn()));
  node.addEventListener('pointerleave',hideTip);
}

/* ---------- charts ---------- */
const sc=(d0,d1,r0,r1)=>v=>r0+(v-d0)*(r1-r0)/(d1-d0);
function plot(host,o){
  host.innerHTML='';
  const W=o.w||460,H=o.h||300,m=Object.assign({l:50,r:12,t:10,b:34},o.m||{});
  const s=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':o.label||''},host);
  const X=sc(o.x0,o.x1,m.l,W-m.r),Y=sc(o.y0,o.y1,H-m.b,m.t);
  (o.yt||[]).forEach(t=>{el('line',{x1:m.l,x2:W-m.r,y1:Y(t),y2:Y(t),class:'grid'},s);el('text',{x:m.l-6,y:Y(t)+4,'text-anchor':'end',class:'tx'},s).textContent=o.yf?o.yf(t):t});
  (o.xt||[]).forEach(t=>{el('line',{x1:X(t),x2:X(t),y1:m.t,y2:H-m.b,class:'grid'},s);el('text',{x:X(t),y:H-m.b+15,'text-anchor':'middle',class:'tx'},s).textContent=o.xf?o.xf(t):t});
  el('line',{x1:m.l,x2:W-m.r,y1:H-m.b,y2:H-m.b,class:'axis'},s);
  el('line',{x1:m.l,x2:m.l,y1:m.t,y2:H-m.b,class:'axis'},s);
  if(o.xl)el('text',{x:(m.l+W-m.r)/2,y:H-3,'text-anchor':'middle',class:'tl'},s).textContent=o.xl;
  if(o.yl){const t=el('text',{x:11,y:(m.t+H-m.b)/2,'text-anchor':'middle',class:'tl',transform:`rotate(-90 11 ${(m.t+H-m.b)/2})`},s);t.textContent=o.yl}
  return {s,X,Y,m,W,H};
}
/* pts: [{x,y,c,tip:[[k,v]],r,label}]  cent: [{x,y,c}]  links: [[i,j]] point i -> cent j */
function scatter(host,o){
  const c=plot(host,o);
  if(o.links)o.links.forEach(([i,j])=>{const p=o.pts[i],q=o.cent[j];el('line',{x1:c.X(p.x),y1:c.Y(p.y),x2:c.X(q.x),y2:c.Y(q.y),class:'lnk',style:`stroke:${PAL(q.c)}`},c.s)});
  o.pts.forEach(p=>{
    const e=el('circle',{cx:c.X(p.x),cy:c.Y(p.y),r:p.r||4.2,class:'pt',style:`fill:${p.c==null?'var(--soft)':PAL(p.c)};fill-opacity:${p.o||.88}`},c.s);
    if(p.tip)tipOn(e,()=>p.tip);
    if(p.label)el('text',{x:c.X(p.x)+7,y:c.Y(p.y)+3,class:'nm'},c.s).textContent=p.label;
  });
  (o.cent||[]).forEach(q=>{
    const x=c.X(q.x),y=c.Y(q.y),g=el('g',{},c.s);
    el('path',{d:`M${x-7} ${y-7}L${x+7} ${y+7}M${x-7} ${y+7}L${x+7} ${y-7}`,class:'cen',style:`stroke:${PAL(q.c)};stroke-width:4.5;opacity:.35`},g);
    el('path',{d:`M${x-6} ${y-6}L${x+6} ${y+6}M${x-6} ${y+6}L${x+6} ${y-6}`,class:'cen',style:`stroke:${PAL(q.c)}`},g);
    if(q.tip)tipOn(g,()=>q.tip);
  });
  return c;
}
/* line chart with markers: ys[i] at x=xs[i]; onPick(i) */
function lineChart(host,o){
  const ymax=Math.max(...o.ys)*1.06;
  const c=plot(host,Object.assign({y0:0,y1:ymax,x0:o.xs[0]-.4,x1:o.xs[o.xs.length-1]+.4,xt:o.xs,yt:o.yt},o));
  el('path',{d:o.xs.map((x,i)=>(i?'L':'M')+c.X(x).toFixed(1)+' '+c.Y(o.ys[i]).toFixed(1)).join(''),class:'ln'},c.s);
  o.xs.forEach((x,i)=>{
    const on=o.sel===x;
    const d=el('circle',{cx:c.X(x),cy:c.Y(o.ys[i]),r:on?6.5:4.5,style:`fill:${on?'var(--c1)':'var(--accent)'};stroke:var(--card);stroke-width:1.5;cursor:${o.onPick?'pointer':'default'}`},c.s);
    tipOn(d,()=>o.tip(i));
    if(o.onPick)d.addEventListener('click',()=>o.onPick(x));
  });
  return c;
}
function barChart(host,o){
  const ymax=Math.max(...o.ys)*1.1,n=o.ys.length;
  const c=plot(host,Object.assign({x0:0,x1:n,y0:0,y1:ymax},o,{xt:[]}));
  const bw=(c.W-c.m.l-c.m.r)/n;
  o.ys.forEach((y,i)=>{
    const r=el('rect',{x:c.X(i)+bw*.12,width:bw*.76,y:c.Y(y),height:c.Y(0)-c.Y(y),style:`fill:${PAL(o.col?o.col(i):0)};fill-opacity:.85`},c.s);
    tipOn(r,()=>o.tip(i));
  });
  return c;
}

/* ---------- components ---------- */
function box(kind,title,html){return `<div class="box ${kind}"><b class="t">${title}</b>${html}</div>`}
function tbl(head,rows,o={}){
  const cls=o.cls||[];
  return `<div class="tw ${o.scroll?'scroll':''}"><table class="${o.mw?'mw':''}"><thead><tr>${head.map((h,i)=>`<th class="${cls[i]||''}">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r,ri)=>`<tr class="${(o.rowCls&&o.rowCls[ri])||''}">${r.map((c,i)=>`<td class="${cls[i]||''}${o.cellCls&&o.cellCls(ri,i)?' '+o.cellCls(ri,i):''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
/* a pandas-like printed DataFrame: numbers are LTR, right aligned */
function df(cols,rows,o={}){
  return `<div class="tw ${o.scroll?'scroll':''}"><table><thead><tr><th class="l"></th>${cols.map(c=>`<th class="l">${c}</th>`).join('')}</tr></thead><tbody>${rows.map((r,i)=>`<tr><td class="l"><b>${o.idx?o.idx[i]:i}</b></td>${r.map(c=>`<td class="l">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function outTxt(s){return `<pre>${esc(s)}</pre>`}
/* code cell: rows = [[code, noteHTML?],...]; out = HTML */
function cell(o){
  const all=o.rows.map(r=>r[0]).join('\n');
  return `<div class="cell"><div class="cap"><span>${o.file||'python'}${o.in?' · '+o.in:''}</span><button type="button" data-copy>Copy</button></div>`+
  `<textarea hidden>${esc(all)}</textarea>`+
  o.rows.map(r=>`<div class="cr${r[1]?'':' bare'}"><pre data-hl>${esc(r[0])}</pre>${r[1]?`<div class="nt">${r[1]}</div>`:'<div class="nt"></div>'}</div>`).join('')+
  (o.out?`<div class="out"><div class="olab">${o.outLab||'Out'}</div>${o.out}</div>`:'')+`</div>`;
}
function chart(h,w,html){ // chart placeholder + registration
  const id=uid();
  return {id,html:`<div class="ch" id="${id}"></div>`};
}
/* register a chart that draws itself after render */
function ch(drawFn){const id=uid();post.push(()=>drawFn($(id)));return `<div class="ch" id="${id}"></div>`}
function legend(items){return `<div class="legend">${items.map(([c,t])=>`<span><i style="background:${PAL(c)}"></i>${t}</span>`).join('')}</div>`}
function fig(inner,cap){return `<figure>${inner}${cap?`<figcaption>${cap}</figcaption>`:''}</figure>`}
function seg(id,opts,sel){return `<span class="seg" id="${id}">${opts.map(([v,t])=>`<button type="button" data-v="${v}" aria-pressed="${v==sel}">${t}</button>`).join('')}</span>`}
function bindSeg(id,fn){const s=$(id);s.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;s.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));fn(b.dataset.v)})}

/* ---------- glossary: one home per concept ---------- */
const G={};           // filled in your content file (see examples/en_demo): key -> {he,en,al:[aliases],d,c,r,home}
const T=(k,txt)=>`<a class="term" data-k="${k}" href="#d-${k}" data-en="${G[k].en||''}" dir="auto">${txt||G[k].lbl||G[k].he}</a>`;
const chips=ks=>`<span class="chips">${ks.map(k=>`<a class="chip" data-k="${k}" data-en="${G[k].en||''}" href="#d-${k}" dir="auto">${G[k].lbl||G[k].he}</a>`).join('')}</span>`;
const vocTags=g=>{const en=(g.en||'').toLowerCase();const t=(g.ev||'').split(' · ').map(x=>x.trim()).filter(x=>x&&x.toLowerCase()!==en&&!/[()=+−*\/&]/.test(x));return t.length?`<span class="voc" dir="ltr"><em class="vl" dir="ltr">Related terms:</em>${t.map(x=>`<i>${x}</i>`).join('')}</span>`:''};
function defCard(k){
  const g=G[k];
  return `<div class="def" id="d-${k}"><header><b>📌 ${g.he}</b><span class="entag">${g.en||''}</span></header>`+
   `<div><b>What it is</b><span>${g.d}<span class="en1" dir="ltr" lang="en">${g.ed}</span>${vocTags(g)}</span></div><div><b>How it is computed</b><span>${g.c}</span></div><div><b>What to conclude</b><span>${g.r}</span></div></div>`;
}
/* station summary box: repeats definition, calculation, conclusion */
function stSum(o){
  return `<div class="sum"><header>Station summary</header><div><b>Definitions</b><span>${o.d}</span></div><div><b>How it is computed</b><span>${o.c}</span></div><div><b>Conclusion</b><span>${o.r}</span></div></div>`;
}
const STS=[];  // stations in order: {id,num,title,he,kind,ds,html}
const DSN=Object.assign({d0:'Dataset A',d1:'Dataset B',d2:'Dataset C',d3:'Dataset D',dn:'No files'},window.DSN_EXTRA||{});
const KIND={nb:['nb','Notebook'],lab:['lab','Lab'],vid:['vid','Video']};
function station(o){
  const kinds=o.kind.map(k=>`<span class="tag ${KIND[k][0]}">${KIND[k][1]}</span>`).join('');
  STS.push({id:o.id,title:o.title,sec:o.sec});
  return `<section class="st ${o.ds}" id="${o.id}" data-title="${esc(o.title)}">`+
   `<div class="sth"><span class="sid">${o.id}</span><h2><span class="en">${o.title}</span><small>${o.he}</small></h2></div>`+
   `<div class="sub">${kinds}<span class="ds ${o.ds}">${DSN[o.ds]}</span>${(LECN[o.id]&&o.kind.includes('vid'))?'<span class="tag ok">Based on the video transcript</span>':''}</div>`+
   `<div class="ctx"><div><b>Where we are</b><span>${o.where}</span></div>${o.need?`<div><b>Concepts this relies on</b><span>${chips(o.need)}</span></div>`:''}<div><b>Data</b><span>${o.data}</span></div><div><b>Goal</b><span>${o.goal}</span></div></div>`+
   (o.sum?`<div class="tldr"><b>In one line</b><span>${o.sum.r}</span></div>`:'')+
   (LECN[o.id]?`<details class="lecn" open><summary>What the lecture said <small>(notes from the transcript)</small></summary><ul>${LECN[o.id].map(t=>`<li>${t}</li>`).join('')}</ul></details>`:'')+
   o.body+(o.sum?stSum(o.sum):'')+`</section>`;
}

/* ---------- syntax highlight ---------- */
const KW=new Set('import from as def return for in if else elif not and or None True False lambda with class'.split(' '));
function hl(src){
  const re=/(#[^\n]*)|('[^'\n]*'|"[^"\n]*")|(\b\d+(?:\.\d+)?(?:e-?\d+)?\b)|([A-Za-z_]\w*)(?=\()|([A-Za-z_]\w*)/g;
  let out='',last=0,m;
  while((m=re.exec(src))){
    out+=esc(src.slice(last,m.index));last=re.lastIndex;
    if(m[1])out+=`<span class="c">${esc(m[1])}</span>`;
    else if(m[2])out+=`<span class="s">${esc(m[2])}</span>`;
    else if(m[3])out+=`<span class="m">${m[3]}</span>`;
    else if(m[4])out+=KW.has(m[4])?`<span class="k">${m[4]}</span>`:`<span class="f">${m[4]}</span>`;
    else out+=KW.has(m[5])?`<span class="k">${m[5]}</span>`:esc(m[5]);
  }
  return out+esc(src.slice(last));
}

/* ---------- bidi: wrap Latin/number runs in LTR isolates ---------- */
const BIDI_T="[A-Za-z0-9_\\u0370-\\u03FF][A-Za-z0-9_\\u00B2\\u2080-\\u2089\\u0370-\\u03FF]*(?:[.,][A-Za-z0-9_\\u00B2\\u2080-\\u2089\\u0370-\\u03FF]+)*%?";
const BIDI_OP="\\s*[=<>+\\-\\u2212\\u2013\\u00D7\\u00F7*/^|\\u00B1\\u2248]+\\s*";
const BIDI_RE=new RegExp("(?:(?<=^|[\\s(\\[])\\u2212(?=\\d))?"+BIDI_T+"(?:(?:"+BIDI_OP+"|\\s+)"+BIDI_T+")*","g");
const BIDI_SKIP='.en1,.voc,.n,.en,code,pre,script,style,svg,.cap,#tip,.ds,.sid,.olab,td.l,th.l,.fx,.eq,button,select,option,textarea,.term,.chip,.lec .id,.lec a,.hb .v,.res b,.tx,.flow a,.bar';
function bidiFix(root){return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];
  while(w.nextNode())nodes.push(w.currentNode);
  nodes.forEach(nd=>{
    const p=nd.parentElement;if(!p||p.closest(BIDI_SKIP))return;
    const t=nd.nodeValue;if(!/[A-Za-z0-9]/.test(t))return;
    BIDI_RE.lastIndex=0;let last=0,m,frag=null;
    while((m=BIDI_RE.exec(t))){
      if(!m[0])break;
      frag=frag||document.createDocumentFragment();
      frag.appendChild(document.createTextNode(t.slice(last,m.index)));
      const s=document.createElement('span');s.className='n';s.textContent=m[0].replace(/\s+$/,'');
      frag.appendChild(s);last=m.index+s.textContent.length;BIDI_RE.lastIndex=last;
    }
    if(frag){frag.appendChild(document.createTextNode(t.slice(last)));nd.replaceWith(frag);}
  });
}

/* ---------- auto-link: first mention of a concept per station ---------- */
function autoLink0(){
  const items=[];
  Object.keys(G).forEach(k=>(G[k].al||[]).forEach(a=>items.push([a,k])));
  items.sort((a,b)=>b[0].length-a[0].length);
  const map={};items.forEach(([a,k])=>map[a.toLowerCase()]=k);
  const alt=items.map(([a])=>a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
  const re=new RegExp("(?<![\\u0590-\\u05FFA-Za-z0-9_.])([הובלמשכ]{0,2})("+alt+")(?![\\u0590-\\u05FFA-Za-z0-9_])","gi");
  const EX='pre,code,.term,.chip,h1,h2,h3,h4,summary,.cap,a,button,select,option,.fx,script,svg,.olab,.sid,.flow,.lec,.bar,textarea,.n,.en';
  document.querySelectorAll('section.st').forEach(sec=>{
    const seen=new Set();
    sec.querySelectorAll('a.term').forEach(a=>seen.add(a.dataset.k));
    const w=document.createTreeWalker(sec,NodeFilter.SHOW_TEXT);const nodes=[];
    while(w.nextNode())nodes.push(w.currentNode);
    nodes.forEach(nd=>{
      const p=nd.parentElement;if(!p||p.closest(EX)||p.closest('.def')&&false)return;
      const t=nd.nodeValue;if(t.length<3)return;
      re.lastIndex=0;let last=0,m,frag=null;
      while((m=re.exec(t))){
        const k=map[m[2].toLowerCase()];
        if(!k||seen.has(k)||G[k].home===sec.id)continue;
        seen.add(k);
        frag=frag||document.createDocumentFragment();
        frag.appendChild(document.createTextNode(t.slice(last,m.index+m[1].length)));
        const a=document.createElement('a');a.className='term';a.dataset.k=k;a.dataset.en=G[k].en||'';a.href='#d-'+k;a.setAttribute('dir','auto');a.textContent=m[2];
        frag.appendChild(a);last=m.index+m[0].length;
      }
      if(frag){frag.appendChild(document.createTextNode(t.slice(last)));nd.replaceWith(frag);}
    });
  });
}

/* ---------- navigation: popover, jump with back-stack, glossary ---------- */
const pop=$('pop'),stack=[];let popSticky=false,popT=0;
const canHover=matchMedia('(hover:hover)').matches;
function curStation(){
  const secs=[...document.querySelectorAll('section.st')];let cur=null;
  secs.forEach(s=>{if(s.getBoundingClientRect().top<140)cur=s});
  return cur;
}
const headingAt=()=>{let cur=null;document.querySelectorAll('#app h2,#app h3,#app h4,#app .def>header b').forEach(h=>{if(h.getBoundingClientRect().top<150)cur=h});if(!cur)return '';const en=cur.matches('h2')&&cur.querySelector('.en');return (en||cur).textContent.replace('📌','').trim().slice(0,44)};
function updBack(){
  const top=stack[stack.length-1];
  $('bk').hidden=!top;$('strip').hidden=!top;
  if(!top)$('histp').hidden=true;
  if(top){$('strip-l').textContent=top.label;$('strip-n').textContent=stack.length>1?'('+stack.length+')':'';$('hist').hidden=stack.length<2}
}
function pushHere(from,label){
  const cs=curStation();
  stack.push({y:scrollY,label:label||headingAt()||(cs?cs.id:'Previous place'),sec:cs?cs.id:'',el:from});
  if(stack.length>12)stack.shift();
  updBack();
}
function jump(id,fromEl){
  const t=document.getElementById(id);if(!t)return;
  pushHere(fromEl);hidePop();
  t.scrollIntoView({behavior:'smooth',block:'start'});
  t.classList.remove('flash');void t.offsetWidth;t.classList.add('flash');
}
function goBack(){
  const s=stack.pop();if(!s)return;
  scrollTo({top:s.y,behavior:'smooth'});updBack();
  if(s.el&&s.el.isConnected){s.el.classList.remove('flash');void s.el.offsetWidth;s.el.classList.add('flash')}
}
function showHist(){
  const p=$('histp');
  p.innerHTML='<b>Places you were (most recent first)</b>'+stack.map((s,i)=>({s,i})).reverse().map(o=>`<button type="button" data-hi="${o.i}" dir="auto"><span>${esc(o.s.label)}</span><small>${esc(o.s.sec||'')}</small></button>`).join('');
  p.hidden=!p.hidden;
}
function popHtml(k){
  const g=G[k];const home=document.getElementById(g.home);
  return `<header>${g.he}<small>${g.en||''}</small></header><div><b>What it is</b>${g.d}<span class="en1" dir="ltr" lang="en">${g.ed}</span>${vocTags(g)}</div><div><b>How it is computed</b>${g.c}</div><div><b>What to conclude</b>${g.r}</div>`+
   `<footer><span>Full definition: ${g.home}</span><button type="button" data-go="${k}">Jump ↗</button></footer>`;
}
let hideT=0;
function showPop(a,sticky){
  const k=a.dataset.k;if(!G[k])return;
  clearTimeout(hideT);
  pop.innerHTML=popHtml(k);bidiFix(pop);
  pop.hidden=false;popSticky=!!sticky;pop.style.pointerEvents='auto';pop.style.overflow='auto';pop.style.maxHeight='';
  const r=a.getBoundingClientRect(),w=pop.offsetWidth;
  const above=r.top-14,below=innerHeight-r.bottom-14,placeBelow=below>=above;
  pop.style.maxHeight=Math.max(140,Math.min(placeBelow?below:above,innerHeight*.7))+'px';
  const h=pop.offsetHeight;
  let x=Math.max(10,Math.min(innerWidth-w-10,r.left+r.width/2-w/2));
  const y=placeBelow?r.bottom+8:Math.max(10,r.top-h-8);
  pop.style.left=x+'px';pop.style.top=y+'px';pop.dataset.k=k;pop._from=a;
}
function hidePop(){clearTimeout(hideT);pop.hidden=true;popSticky=false}
const hideSoon=()=>{clearTimeout(hideT);hideT=setTimeout(()=>{if(!popSticky)hidePop()},350)};
document.addEventListener('mouseover',e=>{
  if(!canHover)return;if(e.target.closest('#pop')){clearTimeout(hideT);return}
  const a=e.target.closest('a.term,a.chip');if(!a)return;
  clearTimeout(popT);popT=setTimeout(()=>showPop(a,false),120);
});
document.addEventListener('mouseout',e=>{
  if(!canHover)return;if(!(e.target.closest('a.term,a.chip')||e.target.closest('#pop')))return;
  clearTimeout(popT);hideSoon();
});
document.addEventListener('focusin',e=>{const a=e.target.closest&&e.target.closest('a.term,a.chip');if(a)showPop(a,true)});
document.addEventListener('click',e=>{
  const dt=e.target.closest('a[data-to]:not(.term):not(.chip)');
  if(dt){e.preventDefault();jump(dt.dataset.to,dt);return}
  const a=e.target.closest('a.term,a.chip');
  if(a){e.preventDefault();if(canHover){jump('d-'+a.dataset.k,a)}else{showPop(a,true)}return}
  const g=e.target.closest('[data-go]');
  if(g){jump('d-'+g.dataset.go,pop._from);return}
  const h=e.target.closest('a[href^="#"]');
  if(h&&h.getAttribute('href').length>1&&!h.closest('#pop')){e.preventDefault();jump(h.getAttribute('href').slice(1),h);return}
  if(!e.target.closest('#pop'))hidePop();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){hidePop();$('gl').hidden=true}if(e.key==='Enter'){const t=e.target.closest&&e.target.closest('a[data-to],a.term,a.chip');if(t)t.click()}});
$('bk').addEventListener('click',goBack);$('bk2').addEventListener('click',goBack);
$('hist').addEventListener('click',showHist);
$('sx').addEventListener('click',()=>{stack.length=0;updBack()});
$('mk').addEventListener('click',()=>{pushHere(null,'📍 '+(headingAt()||'Bookmark'));const b=$('mk');b.textContent='✓ Saved';setTimeout(()=>b.textContent='📍 Mark',1200)});
$('histp').addEventListener('click',e=>{const b=e.target.closest('[data-hi]');if(!b)return;const i=+b.dataset.hi,s=stack[i];stack.length=i;scrollTo({top:s.y,behavior:'smooth'});updBack();$('histp').hidden=true});
$('exb').addEventListener('click',()=>jump('exec',null));

function buildGlossary(){
  const ks=Object.keys(G);
  const draw=q=>{
    q=(q||'').trim().toLowerCase();
    $('gll').innerHTML=ks.filter(k=>!q||(G[k].he+' '+(G[k].en||'')+' '+(G[k].al||[]).join(' ')+' '+G[k].d+' '+(G[k].ed||'')+' '+(G[k].ev||'')).toLowerCase().includes(q))
      .map(k=>`<button type="button" class="it" data-gk="${k}"><b dir="auto">${G[k].he}</b> <small dir="auto">${G[k].en||''} · ${G[k].home}</small></button>`).join('')||'<p>Not found.</p>';
    bidiFix($('gll'));
  };
  draw('');
  $('gq').addEventListener('input',e=>draw(e.target.value));
  $('gll').addEventListener('click',e=>{const b=e.target.closest('[data-gk]');if(!b)return;$('gl').hidden=true;jump('d-'+b.dataset.gk,null)});
  $('glb').addEventListener('click',()=>{$('gl').hidden=false;$('gq').focus()});
  $('glx').addEventListener('click',()=>{$('gl').hidden=true});
  $('gl').addEventListener('click',e=>{if(e.target===$('gl'))$('gl').hidden=true});
}
function buildJump(){
  const jb=$('jump'),jp=$('jmpp');
  const SL=window.SECTION_LABELS||{};
  const groups=[['Opening',[['exec','Executive summary'],['p0','Opening: background and data']]]];
  const bySec={};STS.forEach(s=>{(bySec[s.sec]=bySec[s.sec]||[]).push([s.id,s.id+' · '+s.title])});
  Object.keys(bySec).sort((x,y)=>x-y).forEach(k=>groups.push([SL[k]||('Section '+k),bySec[k]]));
  groups.push(['Wrap-up',[['p2','Summary and work template'],['p3','What was verified']]]);
  const ids=['exec','p0',...STS.map(s=>s.id),'p2','p3'];
  let cur=ids[0];
  const getS=()=>{try{return new Set((localStorage.getItem('cl_seen')||'').split(','))}catch(e){return new Set()}};
  const drawP=()=>{const seen=getS();jp.innerHTML=groups.map(g=>`<div class="gl">${g[0]}</div>`+g[1].map(o=>`<button type="button" data-j="${o[0]}" class="${o[0]===cur?'cur':''}" dir="auto">${(seen.has(o[0])?'✓ ':'')+o[1]}</button>`).join('')).join('')};
  const nameOf=id=>{for(const g of groups)for(const o of g[1])if(o[0]===id)return o[1];return id};
  const setCur=id=>{cur=id;jb.value=id;jb.textContent=nameOf(id)+' ▾'};
  jb.addEventListener('click',e=>{e.stopPropagation();drawP();jp.hidden=!jp.hidden;if(!jp.hidden){const c=jp.querySelector('.cur');if(c)c.scrollIntoView({block:'center'})}});
  jp.addEventListener('click',e=>{const b=e.target.closest('[data-j]');if(!b)return;jp.hidden=true;jump(b.dataset.j,null)});
  document.addEventListener('click',e=>{if(!e.target.closest('#jump,#jmpp'))jp.hidden=true});
  let tk=0;
  const upd=()=>{
    tk=0;let c=ids[0];
    ids.forEach(id=>{const e=document.getElementById(id);if(e&&e.getBoundingClientRect().top<150)c=id});
    if(c!==cur||!jb.textContent)setCur(c);
    const h=document.documentElement.scrollHeight-innerHeight;
    $('pg').style.width=(h>0?Math.min(100,scrollY/h*100):0)+'%';
  };
  setCur(cur);
  addEventListener('scroll',()=>{if(!tk)tk=requestAnimationFrame(upd)},{passive:true});upd();
}
function wireCode(){
  document.querySelectorAll('pre[data-hl]').forEach(p=>{p.innerHTML=hl(p.textContent)});
  document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',()=>{
    const t=b.closest('.cell').querySelector('textarea').value;
    try{navigator.clipboard.writeText(t).then(()=>{b.textContent='Copied';setTimeout(()=>b.textContent='Copy',1200)},()=>{})}catch(e){}
  }));
}

function deHref(root){(root||document).querySelectorAll('a[href^="#"]').forEach(a=>{const h=a.getAttribute('href');if(h.length<2)return;a.dataset.to=h.slice(1);a.removeAttribute('href');a.setAttribute('role','link');a.tabIndex=0;a.style.cursor='pointer'})}
function autoLink(){autoLink0();annotateAll();deHref(document.body)}

/* annotate EVERY Hebrew mention of a glossary alias with its English term (visible only in EN mode) */
function annotateAll(){
  const items=[];Object.keys(G).forEach(k=>(G[k].al||[]).forEach(a=>{if(/[\u0590-\u05FF]/.test(a)&&G[k].en)items.push([a,k])}));
  if(!items.length)return;
  items.sort((a,b)=>b[0].length-a[0].length);
  const map={};items.forEach(([a,k])=>map[a]=k);
  const alt=items.map(([a])=>a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
  const re=new RegExp("(?<![\\u0590-\\u05FFA-Za-z0-9_.])([הובלמשכ]{0,2})("+alt+")(?![\\u0590-\\u05FFA-Za-z0-9_])","g");
  const EX='pre,code,.term,.chip,h1,h2,h3,h4,summary,.cap,a,button,select,option,.fx,script,svg,textarea,.tn,.en1,.voc,.def>header,#pop,#enh-pop,.bar,.enh-bar,.enh-drawer,#gl,#toc,.flow,.toc';
  const roots=document.querySelectorAll('section.st,.enh-sec,#app>*');
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

/* quality gate: run selfTest() in the browser; it must return {failed:[]} before publishing */
function selfTest(){
  const bad=[],ok=[];const need=(c,m)=>{(c?ok:bad).push(m)};
  const ids=['exec','p0',...STS.map(s=>s.id),'p2','p3'];
  ids.forEach(id=>need(!!document.getElementById(id),'section exists: '+id));
  const jb=$('jump');jb.click();const n=document.querySelectorAll('#jmpp [data-j]').length;jb.click();
  need(n===ids.length,'jump menu entries '+n+' = sections '+ids.length);
  Object.keys(G).forEach(k=>{need(!!document.getElementById('d-'+k),'definition card exists: '+k);need(!!(G[k].d&&G[k].c&&G[k].r),'definition has what/how/conclusion: '+k)});
  need(document.querySelectorAll('a[href^="#"]').length===0,'no hash href left (viewer-safe)');
  const dup=[...document.querySelectorAll('[id]')].map(e=>e.id).filter((v,i,a)=>a.indexOf(v)!==i);need(dup.length===0,'duplicate ids: '+dup.join(','));
  STS.forEach(s=>{const e=document.getElementById(s.id);need(!!(e&&e.querySelector('.tldr')),'station has one-line takeaway: '+s.id);need(!!(e&&e.querySelector('.sum')),'station has summary: '+s.id)});
  need(!/undefined|NaN/.test(document.getElementById('app').innerText),'no undefined/NaN text');
  return {passed:ok.length,failed:bad};
}
