> **Terms of use.** Only for courses you are enrolled in, for your own study, through your own logged-in browser session. Respect the platform's terms of service and the instructor's copyright: paraphrase, do not redistribute captions or course material, and do not publish pages that reproduce the course.

# Reading lecture captions from the user's logged-in Udemy (Claude in Chrome)

Only with the user's explicit offer. Use the Chrome tools (load with ToolSearch: `tabs_context_mcp`, `navigate`, `javascript_tool`, `browser_batch`, `tabs_close_mcp`). Open your own tab, open the course player once, then run these in the page.

```js
// 1) curriculum (paginate; page_size 100). Chapters are _class 'chapter', lectures 'lecture'.
const all=[];
for(const pg of [1,2,3,4,5,6,7,8,9]){
  const r=await fetch('/api-2.0/courses/COURSE_ID/subscriber-curriculum-items/?page_size=100&page='+pg+'&fields[lecture]=title,object_index&fields[chapter]=title,object_index');
  if(!r.ok)break; const j=await r.json(); all.push(...j.results.map(x=>[x._class[0],x.id,x.object_index,x.title]));
}
window.__A=all;

// 2) captions -> plain text, stored in window.__T[index]
window.__T={};
for(const [idx,id] of WANTED /* [[262,10777164],...] */){
  const r=await fetch(`/api-2.0/users/me/subscribed-courses/COURSE_ID/lectures/${id}/?fields[lecture]=asset&fields[asset]=captions`);
  const j=await r.json(); const caps=(j.asset&&j.asset.captions)||[];
  const en=caps.find(c=>/^en/.test(c.locale_id))||caps[0];
  if(!en){window.__T[idx]='nocap';continue}
  const v=await (await fetch(en.url)).text();
  window.__T[idx]=v.split(/\n\n+/).map(b=>b.split('\n').filter(l=>!/-->|^WEBVTT|^\d+$/.test(l)).join(' ')).filter(Boolean).join(' ').replace(/\s+/g,' ');
}
```

Reading long text: a tool result shows ~1000 characters. Use `browser_batch` with up to ~14 items of `'tag '+window.__T[i].slice(a,a+1000)` per call.

Rules: paraphrase to Hebrew bullets ("מה נאמר בהרצאה"), do not reproduce long quotes, note captions are automatic and a few words can be lost at slice borders, and close the tab when done.
