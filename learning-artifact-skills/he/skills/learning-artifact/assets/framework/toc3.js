/* ===== detailed table of contents (drawer + current sub-section indicator) ===== */
function buildToc(){
  let n=0;
  const SEL='h3,h4,.def,figure,.cell,.sum,.lecn,.box.warn,.box.bonus';
  const info=e=>{
    let t='',ic='';
    if(e.matches('h3,h4')){t=e.textContent.trim();ic='§'}
    else if(e.matches('.def')){t=e.querySelector('header b').textContent.replace('📌','').trim();ic='📌'}
    else if(e.matches('figure')){const w=e.querySelector('.seg,select,input');const h=e.querySelector('h4,figcaption b');t=(h?h.textContent:'תרשים').trim();ic=w?'⚙':'◔'}
    else if(e.matches('.cell')){t='קוד: '+e.querySelector('.cap span').textContent.trim();ic='⌨'}
    else if(e.matches('.sum')){t='סיכום התחנה';ic='✓'}
    else if(e.matches('.lecn')){t='מה נאמר בהרצאה';ic='🎓'}
    else{const b=e.querySelector('b.t');t=b?b.textContent.trim():'';ic=e.classList.contains('bonus')?'+':'!'}
    if(!t)return null;
    if(!e.id)e.id='nv'+(++n);
    return {id:e.id,t:t.length>70?t.slice(0,68)+'…':t,ic};
  };
  const collect=host=>[...(host.matches(SEL)?[host]:[]),...host.querySelectorAll(SEL)].filter(e=>!(e.matches('h3,h4')&&e.closest('figure'))).map(info).filter(Boolean);
  const secs=[['exec','תמצית מנהלים'],['p0','פתיחה'],...STS.map(s=>[s.id,s.id+' · '+s.title]),['p2','סיכום ותבנית עבודה'],['p3','מה אומת']];
  const groups=[];
  secs.forEach(([id,title])=>{
    const host=document.getElementById(id);if(!host)return;
    let items;
    if(host.tagName==='SECTION')items=collect(host);
    else{ // part heading: gather following siblings until the next part or station
      items=[];let x=host.nextElementSibling;
      while(x&&!x.matches('h2.part,section.st')){items.push(...collect(x));x=x.nextElementSibling}
    }
    groups.push({id,title,items});
  });
  const draw=q=>{
    q=(q||'').trim().toLowerCase();
    $('tocl').innerHTML=groups.map(g=>{
      const its=g.items.filter(i=>!q||(i.t+' '+g.title).toLowerCase().includes(q));
      if(q&&!its.length)return '';
      return `<details ${q?'open':''} data-g="${g.id}"><summary dir="auto"><button type="button" class="tgo" data-id="${g.id}">${g.title}</button></summary>${its.map(i=>`<button type="button" class="it ti" data-id="${i.id}" dir="auto"><span class="ic">${i.ic}</span> ${i.t}</button>`).join('')}</details>`;
    }).join('')||'<p>לא נמצא.</p>';
    bidiFix($('tocl'));
  };
  draw('');
  $('tq').addEventListener('input',e=>draw(e.target.value));
  $('tocl').addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(!b)return;e.preventDefault();$('toc').hidden=true;jump(b.dataset.id,null)});
  $('tocb').addEventListener('click',()=>{
    const cur=$('jump').value;$('tq').value='';draw('');
    $('tocl').querySelectorAll('details').forEach(d=>d.open=d.dataset.g===cur);
    $('toc').hidden=false;
    const d=$('tocl').querySelector(`details[data-g="${cur}"]`);if(d)d.scrollIntoView({block:'start'});
  });
  $('tocx').addEventListener('click',()=>{$('toc').hidden=true});
  $('toc').addEventListener('click',e=>{if(e.target===$('toc'))$('toc').hidden=true});
  const flat=groups.flatMap(g=>g.items);
  let tk=0;
  const upd=()=>{
    tk=0;let cur=null;
    for(const i of flat){const e=document.getElementById(i.id);if(!e)continue;if(e.getBoundingClientRect().top<150)cur=i;else break}
    $('cursub').textContent=cur?cur.ic+' '+cur.t:'';
  };
  addEventListener('scroll',()=>{if(!tk)tk=requestAnimationFrame(upd)},{passive:true});upd();
}
