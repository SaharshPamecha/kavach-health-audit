import { chromium } from "playwright";
const b = await chromium.launch({headless:false,args:["--headless=old","--no-sandbox","--disable-gpu","--disable-dev-shm-usage"],executablePath:"/home/hermes/.cache/ms-playwright/chromium-1148/chrome-linux/chrome"});
const p = await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.goto("https://porter-kansas-knowledge-marks.trycloudflare.com",{waitUntil:"networkidle"});
await p.waitForTimeout(800);

const res = await p.evaluate(() => {
  const lum = (c) => { const [r,g,b]=c; const f=(v)=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)}; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
  const parse = (s) => (s.match(/[\d.]+/g)||[]).slice(0,4).map(Number);
  const bgOf = (el) => { let n=el; while(n){ const c=getComputedStyle(n).backgroundColor; const p=parse(c); if(p.length>=3 && (p[3]===undefined||p[3]>0.5)) return p; n=n.parentElement;} return [250,249,246]; };
  const ratio = (a,b) => { const L1=lum(a),L2=lum(b); return ((Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05)); };
  const out=[];
  document.querySelectorAll("p,span,h1,h2,h3,div").forEach(el=>{
    const t=(el.textContent||"").trim();
    if(!t || t.length>90 || el.children.length>0) return;
    const cs=getComputedStyle(el);
    if(parseFloat(cs.fontSize)<10) return;
    const fg=parse(cs.color); const bg=bgOf(el);
    if(fg.length<3) return;
    const r=ratio(fg,bg);
    if(r<4.5) out.push({t:t.slice(0,42), r:Math.round(r*100)/100, fs:cs.fontSize, fg:cs.color, bg:`rgb(${bg.slice(0,3)})`});
  });
  return out.slice(0,14);
});
console.log("LOW CONTRAST (AA 4.5:1):");
res.forEach(x=>console.log(`  ${x.r}:1  ${x.fs}  "${x.t}"  ${x.fg}`));

await p.getByText("Nandi Ridge Multispeciality").first().click();
await p.waitForTimeout(500);
await p.getByRole("button",{name:"Dispute",exact:true}).click();
await p.waitForTimeout(700);
const geo = await p.evaluate(() => {
  const btns=[...document.querySelectorAll("button")].filter(b=>/The (insurer|hospital)/.test(b.textContent||""));
  const pre=document.querySelector("pre");
  return {addressees: btns.map(b=>({t:(b.textContent||"").trim().slice(0,24), h:Math.round(b.getBoundingClientRect().height)})),
          letterTop: pre?Math.round(pre.getBoundingClientRect().top+window.scrollY):null,
          docH: document.documentElement.scrollHeight};
});
console.log("GEOMETRY", JSON.stringify(geo));
await b.close();
