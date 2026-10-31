/* English demo content: compound interest. Shows: executive summary, 2 stations, glossary with single-home cards, a calculator widget, verification table. */
const LECN={};
window.SECTION_LABELS={1:'Compound interest'};
Object.assign(G,{
 principal:{he:'Principal',en:'Principal',al:['principal'],home:'S1',
  d:'The amount of money you start with (or borrow).',c:'<span class="fx">P = initial amount</span>',r:'Everything else is computed on top of it.',ed:'The starting amount.',ev:'initial deposit · capital · face value'},
 rate:{he:'Interest rate',en:'Interest rate',al:['interest rate','rate'],home:'S1',
  d:'The percentage added to the balance per period.',c:'<span class="fx">interest = P × r</span>',r:'A rate must always be paired with its period (per year, per month).',ed:'Percentage added per period.',ev:'APR · nominal rate · periodic rate'},
 compounding:{he:'Compounding',en:'Compounding',al:['compounding','compound interest'],home:'S2',
  d:'Interest is earned on the principal and on interest already earned.',c:'<span class="fx">A = P × (1 + r/m)^(m·t)</span>m = periods per year, t = years.',r:'More frequent compounding gives slightly more, with diminishing returns.',ed:'Interest on interest.',ev:'compound growth · effective annual rate · EAR'}
});
const EXEC=`<h2 class="part" id="exec" style="margin-top:2rem">Executive summary</h2>
<div class="exec">
<div class="ex-grid">
<div class="ex-card"><b>What it helps you do</b>Estimate how a balance grows over time and compare saving or borrowing options.</div>
<div class="ex-card"><b>How it is done</b><ol><li>Fix the <a href="#S1">principal and the rate</a>.</li><li>Choose the <a href="#S2">compounding</a> frequency.</li><li>Apply the formula and check it by hand.</li></ol></div>
<div class="ex-card"><b>What to watch</b><ul><li>Rate and period must match.</li><li>Nominal rate is not the effective rate.</li><li>Fees are not in the formula.</li></ul></div>
</div>
<h3>What counts as good or bad</h3>
<div class="tw"><table class="mw"><thead><tr><th>Measure</th><th>Good</th><th>Borderline</th><th>Worrying</th><th>In this demo</th></tr></thead><tbody>
<tr><td>Real return (rate − inflation)</td><td class="gd">Above 2%</td><td class="am">0% to 2%</td><td class="rd">Negative</td><td>Depends on your inflation assumption (rule of thumb)</td></tr>
<tr><td>Compounding frequency effect</td><td class="gd">Monthly or daily</td><td class="am">Quarterly</td><td class="rd">Ignored when comparing offers</td><td>See the calculator in S2</td></tr>
</tbody></table></div>
<h3>Conclusions</h3><ul><li>Time matters more than frequency.</li><li>Always compare effective annual rates.</li></ul>
</div>`;
const P0=`<h2 class="part" id="p0" style="margin-top:2rem">Opening: what this demo is</h2><p>A tiny English page built with the English edition of the framework. It checks the jump menu, glossary, back strip, TOC and modes.</p>`;
const S1=station({id:'S1',sec:1,title:'Principal and rate',he:'The two inputs',kind:['vid'],ds:'dn',
 where:'First station: the inputs.',data:'No data files. Worked numbers only.',goal:'Know what principal and rate mean.',
 body:`<p>The ${T('principal')} is where you start. The ${T('rate')} says how fast it grows per period.</p>${defCard('principal')}${defCard('rate')}
 ${tbl(['Principal','Rate','Interest after 1 year'],[['1,000','5%','50'],['2,000','5%','100']],{cls:['n','n','n']})}`,
 sum:{d:'Principal and rate.',c:'interest = P × r',r:'Interest is proportional to the principal.'}});
const S2=station({id:'S2',sec:1,title:'Compounding',he:'Interest on interest',kind:['vid'],ds:'dn',need:['principal','rate'],
 where:'Second station: growth over several periods.',data:'Computed live in this page.',goal:'See how compounding changes the final balance.',
 body:`<p>${T('compounding')} makes the balance grow faster than simple interest.</p>${defCard('compounding')}
 <figure><div class="row"><label>Principal</label><input id="cp" type="number" value="1000" class="btn"><label>Rate %</label><input id="cr" type="number" value="5" class="btn"><label>Years</label><input id="ct" type="number" value="10" class="btn"><label>Periods/yr</label><select id="cm" class="btn"><option>1</option><option>4</option><option selected>12</option></select></div><div id="cres" class="status"></div>
 <figcaption>Change an input and compare the result with the hand calculation below.</figcaption></figure>
 <h3>Check by hand</h3><div id="chk"></div>`,
 sum:{d:'Compounding = interest on interest.',c:'A = P × (1 + r/m)^(m·t)',r:'Monthly compounding at 5% for 10 years turns 1,000 into about 1,647.'}});
post.push(()=>{
  const q=id=>document.getElementById(id);
  const calc=()=>{const P=+q('cp').value,r=+q('cr').value/100,t=+q('ct').value,m=+q('cm').value;const A=P*Math.pow(1+r/m,m*t);
    q('cres').innerHTML='A = '+P+' × (1 + '+(r/m).toFixed(5)+')^('+(m*t)+') = <b>'+A.toFixed(2)+'</b>';return A};
  ['cp','cr','ct','cm'].forEach(i=>q(i).addEventListener('input',calc));calc();
  const A=1000*Math.pow(1+.05/12,120),B=1000;let bal=B;for(let i=0;i<120;i++)bal*=1+.05/12;
  q('chk').innerHTML=tbl(['Check','Formula','Step-by-step loop','Match'],[['1,000 at 5%, 10 yrs, monthly',A.toFixed(2),bal.toFixed(2),Math.abs(A-bal)<1e-6?'<span class="tag ok">match</span>':'<span class="tag bad">differs</span>']],{cls:['','n','n','']});
});
const P2=`<h2 class="part" id="p2">Summary and work template</h2><ul class="chk"><li><span class="tag ok">1</span><span>State principal, rate and period.</span></li><li><span class="tag ok">2</span><span>Pick the compounding frequency.</span></li><li><span class="tag ok">3</span><span>Verify with a loop.</span></li></ul>`;
const P3=`<h2 class="part" id="p3">What was verified</h2><p>The formula result equals a 120-step loop (see S2). Not verified: tax and fees.</p>`;
