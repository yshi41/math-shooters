(()=>{
'use strict';
const BUILD='2026-10-29.5';
const $=s=>document.querySelector(s);
const rand=(a,b)=>a+Math.random()*(b-a);
const ri=n=>Math.floor(Math.random()*n);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pickOne=a=>a[ri(a.length)];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=ri(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const DPR=()=>Math.min(2,window.devicePixelRatio||1);
const TAU=Math.PI*2;
const isObj=o=>o&&typeof o==='object'&&!Array.isArray(o);
const dist=(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by);
const cfont=s=>`800 ${Math.round(s)}px system-ui,"Segoe UI",Roboto,sans-serif`;

/* ---------- data ---------- */
/* the players and the grade their numbers follow (Riley is in 3rd grade; Yan is the test player) */
const KIDS=[{id:'charlie',name:'Charlie',grade:4,col:'#38bdf8'},{id:'riley',name:'Riley',grade:3,col:'#fb923c'},{id:'yan',name:'Yan',grade:4,col:'#a78bfa'}];
/* the map: one sector per kind of math, Mixed last; six worlds in each */
const SECTORS=[
  {id:'add',name:'Addition',sym:'+',blurb:{3:'Sums from 10 up to 1,000',4:'Sums from 20 up to 2,000'}},
  {id:'sub',name:'Subtraction',sym:'−',blurb:{3:'Take-aways from 10 up to 500',4:'Take-aways from 20 up to 5,000'}},
  {id:'tables',name:'Times Tables',sym:'×',blurb:{3:'Facts from 1×1 to 9×9, the 1s to 3s first',4:'Facts from 1×1 to 9×9, the 1s to 3s first'}},
  {id:'mul',name:'Multiplication',sym:'×',blurb:{3:'From 5 × 5 up to 30 × 5',4:'From 5 × 10 up to 99 × 12'}},
  {id:'div',name:'Division',sym:'÷',blurb:{3:'From 25 ÷ 5 up to 300 ÷ 10',4:'From 50 ÷ 5 up to 900 ÷ 9'}},
  {id:'mix',name:'Mixed',sym:'✦',blurb:{3:'Everything at once',4:'Everything at once'}}];
const WORLDS_PER=6;
/* the slow ramp inside a sector: numbers, bubble speed and enemies per world (index = world - 1) */
const WORLD_RAMP=[
  {tier:1.0,speed:85,cap:1,crash:4.5,shooter:3.0,aim:true,crashHP:1,tank:false},
  {tier:1.4,speed:90,cap:2,crash:4.0,shooter:2.8,aim:true,crashHP:1,tank:false},
  {tier:2.0,speed:95,cap:2,crash:3.6,shooter:2.6,aim:true,crashHP:1,tank:false},
  {tier:2.6,speed:100,cap:2,crash:3.2,shooter:2.2,aim:true,crashHP:1,tank:false},
  {tier:3.4,speed:106,cap:3,crash:2.8,shooter:2.0,aim:true,crashHP:2,tank:false},
  {tier:4.2,speed:112,cap:3,crash:2.6,shooter:1.8,aim:true,crashHP:2,tank:true}];
const MIX_TIERS=[2,2.6,3.2,3.8,4.4,5];
const WAVE_N=5,WAVES=3,L_MAX=20,LOSE_ON_HIT=1;
const loseOnWrong=wi=>wi>=5?2:1;
/* run upgrades: picked between waves, reset every world; the losable ones fall off as capsules */
const UPGRADES={
  rapid:{name:'Rapid Fire',tag:'RF',max:3,blurb:'Shoot faster',lose:true},
  spread:{name:'Spread Shot',tag:'SP',max:2,blurb:'Extra side shots',lose:true},
  power:{name:'Power Shot',tag:'PW',max:2,blurb:'Shots hit harder',lose:true},
  shield:{name:'Bubble Shield',tag:'SH',max:2,blurb:'Blocks one enemy hit, then recharges',lose:true},
  speed:{name:'Speedy Fins',tag:'SF',max:2,blurb:'Fly faster',lose:true},
  slow:{name:'Slow Bubbles',tag:'SB',max:2,blurb:'Answer bubbles fall slower',lose:true},
  heart:{name:'Extra Heart',tag:'HP',max:2,blurb:'One more heart, now and max',lose:false},
  bomb:{name:'Bomb Bag',tag:'BB',max:2,blurb:'One more bomb, now and max',lose:true},
  magnet:{name:'Treat Magnet',tag:'MG',max:2,blurb:'Pulls treats and capsules to you',lose:true},
  lucky:{name:'Lucky Drops',tag:'LK',max:2,blurb:'Enemies drop more',lose:true},
  heal:{name:'Patch Up',tag:'+2',max:99,blurb:'Two hearts back right now',lose:false,filler:true},
  treats:{name:'Treat Bag',tag:'$',max:99,blurb:'15 treats',lose:false,filler:true}};
const UP_ORDER=['rapid','spread','power','shield','speed','slow','heart','bomb','magnet','lucky'];
/* hub perks: bought once with treats, never lost */
const PERK_LIST=[
  {id:'p_heart',name:'Heart Locket',blurb:'Start every world with 6 hearts',price:60},
  {id:'p_bomb',name:'Spare Bomb',blurb:'Start every world with 2 bombs',price:80},
  {id:'p_magnet',name:'Treat Magnet',blurb:'Treats and capsules drift toward you',price:90},
  {id:'p_slow',name:'Calm Waters',blurb:'Answer bubbles fall 10% slower',price:100},
  {id:'p_fire',name:'Quick Trigger',blurb:'Start with Rapid Fire (you can still drop it)',price:120},
  {id:'p_shield',name:'Starter Shield',blurb:'Start with a Bubble Shield',price:150},
  {id:'p_grip',name:'Sticky Fins',blurb:'Dropped capsules float for 7 seconds instead of 4',price:160},
  {id:'p_luck',name:'Lucky Charm',blurb:'25% more treats from every world',price:180},
  {id:'p_pick4',name:'Big Choice',blurb:'Pick from 4 upgrades instead of 3',price:220},
  {id:'p_revive',name:'Second Wind',blurb:'Once per world, get back up with 2 hearts',price:300}];
const PERKS={};PERK_LIST.forEach(p=>PERKS[p.id]=p);
/* keyboard maps: solo takes both hands; together, player 1 has the left hand and player 2 the right */
const KEYS=[
  {left:['ArrowLeft','a','A'],right:['ArrowRight','d','D'],up:['ArrowUp','w','W'],down:['ArrowDown','s','S'],fire:[' ','Enter'],bomb:['b','B','Shift']},
  {left:['a','A'],right:['d','D'],up:['w','W'],down:['s','S'],fire:['f','F'],bomb:['q','Q']},
  {left:['ArrowLeft'],right:['ArrowRight'],up:['ArrowUp'],down:['ArrowDown'],fire:['.'],bomb:['/']}];
const MILESTONES={3:2,5:5,10:10,15:15};
const PRAISE=['Nice!','Yes!','Boom!','Got it!','Sharp!','Zoom!','Great catch!'];
const CONFETTI=['#38bdf8','#fb923c','#a78bfa','#22c55e','#f5c842','#f472b6'];
const starSvg=on=>`<svg viewBox="0 0 24 24" class="st${on?' on':''}" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>`;
const heartSvg=on=>`<svg viewBox="0 0 24 22" class="heart${on?'':' lost'}" aria-hidden="true"><path d="M12 21s-9-5.6-9-12.2C3 5.4 5.5 3 8.4 3c1.6 0 2.9.8 3.6 2 .7-1.2 2-2 3.6-2C18.5 3 21 5.4 21 8.8 21 15.4 12 21 12 21z" fill="#FF5C8A" stroke="#fff" stroke-width="1.5"/></svg>`;
const treatSvg='<svg class="ic" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="#fde68a" stroke="#f59e0b" stroke-width="2"/><circle cx="10" cy="10" r="3.5" fill="#f59e0b"/></svg>';
const shipSvg=col=>`<svg class="pc-ship" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6 Q54 28 46 52 Q32 60 18 52 Q10 28 32 6 Z" fill="${col}"/><ellipse cx="32" cy="32" rx="6" ry="8" fill="#fff" opacity=".9"/></svg>`;

/*@@MATH@@*/
/* ---------- the arithmetic: pure generators by category, grade and (fractional) tier ----------
   Node-testable: test/math.test.js lifts this block out of the file. */
const MSMath=(function(){
  const ri=n=>Math.floor(Math.random()*n),rint=(a,b)=>a+ri(Math.max(0,b-a)+1),pick=a=>a[ri(a.length)];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=ri(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
  const TOP=9;
  const factKey=(a,b)=>Math.min(a,b)+'x'+Math.max(a,b);
  /* operand ranges per grade, tiers 1..5; tier 1 starts with small, friendly numbers (Yan, 10/29: it started too hard) */
  const ADD={3:[[1,10,1,10],[2,20,2,20],[10,50,10,50],[10,99,10,99],[100,999,10,99]],4:[[2,20,2,20],[10,99,1,9],[10,99,10,99],[100,999,10,99],[100,999,100,999]]};
  const SUB={3:[10,20,50,99,500],4:[20,99,999,999,4999]};
  const MUL={3:[[1,5,1,5],[2,5,1,10],[2,9,1,10],'facts10',[11,30,2,5]],4:[[2,5,1,10],[2,12,2,12],[11,25,2,9],[20,99,2,9],[10,99,10,12]]};
  const DIV={3:[[2,5,1,5],[2,5,1,10],[2,9,1,10],[2,10,1,12],[2,10,10,30]],4:[[2,5,1,10],[2,9,2,12],[2,9,10,30],[2,9,10,99],[10,12,2,30]]};
  /* a fractional tier rolls the lower or the upper whole tier, so numbers creep up instead of jumping */
  function tierPick(t){t=clamp(+t||1,1,5);const f=Math.floor(t),fr=t-f;return (fr>0&&Math.random()<fr)?Math.min(5,f+1):f}
  function q(op,a,b,ans){const sym={add:'+',sub:'−',mul:'×',div:'÷'}[op],say={add:'plus',sub:'minus',mul:'times',div:'divided by'}[op];return {op,a,b,ans,sym,text:a+' '+sym+' '+b,say:a+' '+say+' '+b,key:op+':'+a+':'+b}}
  function genAdd(g,t){const r=ADD[g][t-1];const a=rint(r[0],r[1]),b=rint(r[2],r[3]);return q('add',a,b,a+b)}
  function genSub(g,t){const max=SUB[g][t-1];let ans,b;
    if(g===4&&t===3){b=rint(10,99);ans=rint(1,max-b)}
    else if(g===4&&t===4){b=rint(100,899);ans=rint(1,max-b)}
    else{const a=rint(Math.max(3,Math.floor(max*.2)),max);b=rint(1,a-1);ans=a-b}
    return q('sub',ans+b,b,ans)}
  function genMul(g,t){const r=MUL[g][t-1];let a,b;
    if(r==='facts10'){if(Math.random()<.7){a=rint(1,10);b=rint(1,10)}else{a=rint(1,9)*10;b=rint(2,9)}}
    else{a=rint(r[0],r[1]);b=rint(r[2],r[3])}
    if(Math.random()<.5){const s=a;a=b;b=s}return q('mul',a,b,a*b)}
  function genDiv(g,t){const r=DIV[g][t-1];const b=rint(r[0],r[1]),ans=rint(r[2],r[3]);return q('div',b*ans,b,ans)}
  function tablePool(top){const pool=[];for(let a=1;a<=top;a++)for(let b=a;b<=TOP;b++)pool.push({a,b});return pool}
  function topFor(tier){return tier<=1?3:tier<=2?5:tier<=3?7:9}
  function makeTable(f){const flip=Math.random()<.5;const a=flip?f.b:f.a,b=flip?f.a:f.b;const o=q('mul',a,b,a*b);o.op='tables';o.key=factKey(a,b);return o}
  /* a deck of facts weighted toward the ones this kid gets wrong (Times Table Worlds mixDeck) */
  function deck(facts,pool,n){facts=facts||{};const out=[];const wts=pool.map(f=>{const s=facts[factKey(f.a,f.b)];return s?clamp(1+2*(s.w|0)-.3*(s.r|0),.4,6):1.2});
    const picked=new Set();n=Math.min(n||15,pool.length);
    while(out.length<n){let tot=0;pool.forEach((f,i)=>{if(!picked.has(i))tot+=wts[i]});let r=Math.random()*tot;
      for(let i=0;i<pool.length;i++){if(picked.has(i))continue;r-=wts[i];if(r<=0){picked.add(i);out.push(pool[i]);break}}}
    return out}
  /* S is the run state: q (last problem), missed, and for tables pool/bag/poolTop */
  function problem(cat,g,t,S,facts){g=g===3?3:4;const tier=tierPick(t);
    if(S&&S.missed&&S.missed.length){const prev=S.q&&S.q.key;for(let i=0;i<S.missed.length;i++){if(S.missed[i].key!==prev&&Math.random()<.6)return Object.assign({},S.missed.splice(i,1)[0])}}
    let c=cat;if(cat==='mix'){const ops=['add','sub','tables','mul'];if(tier>=2)ops.push('div');c=pick(ops)}
    if(c==='tables'){const top=topFor(tier);
      if(S){if(!S.pool||S.poolTop!==top){S.pool=tablePool(top);S.bag=[];S.poolTop=top}
        for(let k=0;k<20;k++){if(!S.bag.length)S.bag=deck(facts,S.pool,15);const f=S.bag.pop();if(!S.q||factKey(f.a,f.b)!==S.q.key||S.pool.length<2)return makeTable(f)}
        return makeTable(pick(S.pool))}
      return makeTable(pick(tablePool(top)))}
    return c==='add'?genAdd(g,tier):c==='sub'?genSub(g,tier):c==='mul'?genMul(g,tier):genDiv(g,tier)}
  /* n answers: the right one plus near misses, wrong operations, slipped operands and digit swaps */
  function choices(qq,n){const ans=qq.ans,a=qq.a,b=qq.b,op=qq.op;const c=[];const add=v=>{if(Number.isInteger(v)&&v>0&&v<=9999&&v!==ans&&!c.includes(v))c.push(v)};
    const rev=+String(ans).split('').reverse().join('');
    if(op==='tables'){[a*(b+1),a*(b-1),(a+1)*b,(a-1)*b,ans+a,ans-a,ans+b,ans-b,ans+1,ans-1,ans+2,ans-2,ans+10,ans-10,rev].forEach(add)}
    else{const near=[ans+1,ans-1,ans+2,ans-2,ans+10,ans-10];if(ans>=100)near.push(ans+100,ans-100);
      const wrong=[a+b,a-b,a*b,(b&&a%b===0)?a/b:null];
      const off=op==='add'?[a+1+b,a-1+b,a+b+1,a+b-1]:op==='sub'?[a+1-b,a-1-b,a-b-1,a-b+1]:op==='mul'?[(a+1)*b,(a-1)*b,a*(b+1),a*(b-1)]:[ans+1,ans-1,(a+b)/b,(a-b)/b];
      const pv=[ans*10,ans%10===0?ans/10:null,rev];
      shuffle(near.concat(wrong,off,pv)).forEach(add)}
    const out=[ans];for(const v of shuffle(c)){if(out.length>=n)break;out.push(v)}
    const s=Math.max(3,Math.round(ans*.2));let guard=0;while(out.length<n&&guard++<500){const v=ans+rint(-s,s);if(v>0&&v<=9999&&!out.includes(v))out.push(v)}
    return shuffle(out)}
  /* the adaptive speed level: up a little per right answer (faster while below this kid's usual), down on a miss */
  function adapt(L,d,warm){if(d>0&&L<warm)d*=2.2;return clamp(L+d,1,20)}
  return {problem,choices,factKey,deck,tablePool,topFor,tierPick,adapt,TOP,_r:{ri,rint,pick,shuffle}};
})();
/*@@END_MATH@@*/

/* ---------- sound (WebAudio synth, no files) ---------- */
const Snd={ctx:null,on:true,
  init(){try{if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.ctx=new AC();this.out=this.ctx.createGain();this.out.gain.value=.5;const comp=this.ctx.createDynamicsCompressor();this.out.connect(comp);comp.connect(this.ctx.destination)}if(this.ctx.state==='suspended')this.ctx.resume()}catch(e){}},
  f(m){return 440*Math.pow(2,(m-69)/12)},
  tone(freq,dur,o={}){const c=this.ctx;if(!c||!this.on)return;const when=c.currentTime+(o.delay||0);const osc=c.createOscillator(),g=c.createGain();osc.type=o.type||'sine';osc.frequency.setValueAtTime(freq,when);
    if(o.slide)osc.frequency.exponentialRampToValueAtTime(Math.max(30,o.slide),when+dur);
    const v=o.vol!=null?o.vol:.25;g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(v,when+.008);g.gain.exponentialRampToValueAtTime(.0001,when+dur);
    osc.connect(g);if(o.lp){const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=o.lp;g.connect(fl);fl.connect(this.out)}else g.connect(this.out);
    osc.start(when);osc.stop(when+dur+.05)},
  noise(dur,o={}){const c=this.ctx;if(!c||!this.on)return;const n=Math.floor(c.sampleRate*dur);const b=c.createBuffer(1,n,c.sampleRate);const d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
    const s=c.createBufferSource();s.buffer=b;const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=o.lp||2000;const g=c.createGain();g.gain.value=o.vol||.2;s.connect(fl);fl.connect(g);g.connect(this.out);s.start(c.currentTime+(o.delay||0))},
  click(){this.tone(660,.06,{type:'triangle',vol:.1})},
  shoot(){this.tone(880,.05,{type:'triangle',vol:.03,slide:1400})},
  pop(combo){this.noise(.07,{vol:.22,lp:4500});const sc=[0,2,4,7,9,12,14,16,19,21,24];const r=67+sc[Math.min(Math.max(combo||1,1)-1,10)];[0,4,7,12].forEach((d,i)=>this.tone(this.f(r+d),.17,{type:'triangle',vol:.16,delay:i*.055}))},
  wrong(){this.tone(196,.34,{type:'sawtooth',vol:.13,slide:98,lp:900});this.noise(.14,{vol:.12,lp:600})},
  glow(){[72,76,79,84,88,91,96].forEach((m,i)=>this.tone(this.f(m),.14,{type:'triangle',vol:.13,delay:i*.05}))},
  hit(){this.noise(.12,{vol:.22,lp:1400});this.tone(240,.14,{vol:.18,slide:90})},
  hurt(){this.noise(.22,{vol:.3,lp:700});this.tone(160,.28,{type:'sawtooth',vol:.12,slide:60,lp:600})},
  coin(){this.tone(988,.08,{type:'square',vol:.06});this.tone(1319,.26,{type:'square',vol:.06,delay:.07})},
  special(){for(let i=0;i<6;i++)this.tone(300+i*120,.12,{vol:.12,slide:1600,delay:i*.07});this.noise(.6,{vol:.3,lp:1500,delay:.4})},
  win(){[[72,0,.14],[76,.12,.14],[79,.24,.14],[84,.36,.3],[79,.62,.12],[84,.74,.7]].forEach(([m,d,l])=>{this.tone(this.f(m),l,{type:'triangle',vol:.2,delay:d});this.tone(this.f(m-12),l,{vol:.1,delay:d})})},
  lose(){[[67,0,.3],[66,.32,.3],[65,.64,.3],[64,.96,.9]].forEach(([m,d,l])=>this.tone(this.f(m),l,{type:'triangle',vol:.18,delay:d}))},
  star(i){this.tone(this.f(79+i*5),.35,{type:'triangle',vol:.2});this.tone(this.f(91+i*5),.25,{vol:.08})}
};

/* ---------- saves (online only) ---------- */
let screen='menu',ready=false,saveMode='loading';
const saves={};let player=null,coopIds=null;
function blank(){return {cur:0,games:0,stars:{},best:{},skill:{},facts:{},ops:{},perks:[],coop:{played:0,wins:0}}}
/* deep copy first: the claude.ai db hands back frozen snapshots, and the end-of-world bookkeeping writes into these objects */
function normalize(d){const o=isObj(d)?JSON.parse(JSON.stringify(d)):{};const b=blank();b.cur=Math.max(0,o.cur|0);b.games=o.games|0;
  for(const k of ['stars','best','skill','facts','ops'])b[k]=isObj(o[k])?o[k]:{};
  b.perks=Array.isArray(o.perks)?o.perks.filter(x=>PERKS[x]):[];
  b.coop={played:(isObj(o.coop)&&o.coop.played)|0,wins:(isObj(o.coop)&&o.coop.wins)|0};return b}
function PF(id){return saves[id]||(saves[id]=blank())}
function P(){return PF(player)}
function kid(id){return KIDS.find(k=>k.id===id)||KIDS[0]}
function totalStars(p){let s=0;if(p)for(const k in p.stars)s+=p.stars[k]|0;return s}
/* the save service: the Worker named by window.MS_CLOUD (GitHub Pages), otherwise the artifact's db on claude.ai.
   Progress lives only there; nothing is kept in the browser.
   Each save names the revision it started from plus the copy it started from (base), so the service merges saves from two devices itself. */
const CLOUD=(typeof window.MS_CLOUD==='string'&&!/[?&]nosave/.test(location.search))?window.MS_CLOUD:null;
const Net=(()=>{
  const REV={},BASE={},DIRTY={},SENDING={},TIMERS={};let LOADED=false,fails=0,retryT=null,warned=false;
  const snap=o=>JSON.parse(JSON.stringify(o));
  async function call(method,path,body){const o={method,cache:'no-store'};if(body){o.body=JSON.stringify(body);o.headers={'Content-Type':'text/plain'};o.keepalive=o.body.length<60000}
    const r=await fetch(CLOUD+path,o);if(r.status!==200)throw new Error('HTTP '+r.status);return r.json()}
  function adopt(id,rev,state){REV[id]=rev;if(state){saves[id]=normalize(state);BASE[id]=snap(saves[id])}else{delete saves[id];BASE[id]=null}
    if(screen==='menu')renderMenu();else if(screen==='hub'&&player===id)renderHub();else if(screen==='map')renderMap()}
  function failed(){fails++;clearTimeout(retryT);retryT=setTimeout(retry,Math.min(30000,3000*fails));
    if(!LOADED)setReady('error');else if(!warned){warned=true;toast('Cannot reach the save server. Progress is not saved until it reconnects.')}}
  function retry(){if(!LOADED)return refresh();let any=false;for(const id in DIRTY)if(DIRTY[id]){any=true;push(id)}if(!any)refresh()}
  async function refresh(){if(!CLOUD)return;try{const r=await call('GET','/saves');fails=0;warned=false;const ps=r.players||{};
      for(const k of KIDS){const id=k.id;if(SENDING[id]||DIRTY[id]||TIMERS[id])continue;const x=ps[id];
        if(!x){if(REV[id]==null){REV[id]=0;BASE[id]=null}continue}if(REV[id]!==x.rev)adopt(id,x.rev,x.state)}
      if(!LOADED){LOADED=true;setReady('on')}else if(screen==='menu')renderMenu()}catch(e){failed()}}
  async function push(id){clearTimeout(TIMERS[id]);TIMERS[id]=null;if(SENDING[id]||!saves[id])return;
    const st=snap(saves[id]);st.updated=Date.now();const body={rev:REV[id]||0,state:st,base:BASE[id]||blank()};SENDING[id]=true;DIRTY[id]=false;
    try{const r=await call('POST','/saves/'+encodeURIComponent(id),body);SENDING[id]=false;fails=0;warned=false;
      if(r.conflict)adopt(id,r.rev,r.state);
      else{REV[id]=r.rev;if(r.state){const was=DIRTY[id];adopt(id,r.rev,r.state);DIRTY[id]=was}else BASE[id]=st}
      if(DIRTY[id])push(id)}
    catch(e){SENDING[id]=false;DIRTY[id]=true;failed()}}
  function schedule(id){if(!id||!saves[id])return;DIRTY[id]=true;clearTimeout(TIMERS[id]);TIMERS[id]=setTimeout(()=>push(id),400)}
  function flush(){for(const id in TIMERS)if(TIMERS[id])push(id)}
  document.addEventListener('visibilitychange',()=>{if(!CLOUD)return;if(document.hidden)flush();else if(LOADED&&screen==='menu')refresh()});
  window.addEventListener('pagehide',()=>{if(CLOUD)flush()});
  window.addEventListener('online',()=>{if(CLOUD)retry()});
  return {refresh,schedule,retry,flush,idle:()=>{for(const id in SENDING)if(SENDING[id])return false;for(const id in TIMERS)if(TIMERS[id])return false;return true},rev:id=>REV[id]||0}
})();
let db=null,saveQ=Promise.resolve();
function persistFor(id){if(!id)return;
  if(db){const body=JSON.parse(JSON.stringify(PF(id)));body.updated=Date.now();saveQ=saveQ.then(()=>db.doc('players/'+id).set(body)).catch(()=>toast('Could not save just now. Check the connection.'))}
  else if(CLOUD)Net.schedule(id)}
function persist(){persistFor(player)}
function renderSaveNote(){const n=$('#saveNote');
  n.textContent=saveMode==='loading'?'Loading saves…':saveMode==='on'?'Stars, treats and perks save online for every player.':saveMode==='error'?'Cannot reach the save server. Check the connection and try again.':'Saving is off in this view, so stars and treats are not kept. Open the game on claude.ai while signed in to save.';
  $('#saveRetry').hidden=saveMode!=='error'}
function setReady(mode){saveMode=mode;ready=mode==='on'||mode==='off';renderSaveNote();if(screen==='menu')renderMenu()}
$('#saveRetry').onclick=()=>{Snd.init();Snd.click();saveMode='loading';renderSaveNote();Net.retry()};

/* ---------- screens ---------- */
function show(id){document.querySelectorAll('.screen').forEach(s=>s.hidden=s.id!==id);screen=id;document.body.dataset.screen=id;window.scrollTo(0,0)}
/* full screen on the computer: entered when a world starts, kept across screens until Esc */
function canFull(){return !!document.fullscreenEnabled&&matchMedia('(hover:hover) and (pointer:fine)').matches}
function goFull(){if(!canFull()||document.fullscreenElement)return;try{const r=document.documentElement.requestFullscreen({navigationUI:'hide'});if(r&&r.catch)r.catch(()=>{})}catch(e){}}
document.addEventListener('fullscreenchange',()=>{const on=!!document.fullscreenElement;document.body.classList.toggle('fs',on);$('#fsBtn').setAttribute('aria-pressed',String(on));
  if(screen==='game'&&G){sizeStage();if(!on&&!G.paused)setPause(true)}});
let toastT=null;
function toast(msg){document.querySelectorAll('.toast2').forEach(t=>t.remove());const t=document.createElement('div');t.className='toast2';t.textContent=msg;document.body.append(t);clearTimeout(toastT);toastT=setTimeout(()=>t.remove(),2600)}
function profileCard(k,onclick,on){const p=saves[k.id];const b=document.createElement('button');b.type='button';b.className='profile-card'+(on?' on':'');b.disabled=!ready;b.dataset.kid=k.id;
  b.innerHTML=`${shipSvg(k.col)}<span class="pc-name">${k.name}</span><span class="pc-meta"><span>${starSvg(true)} ${totalStars(p)}</span><span>${treatSvg} ${p?p.cur:0}</span></span>`;b.onclick=onclick;return b}
function renderMenu(){const box=$('#kids');box.innerHTML='';KIDS.forEach(k=>box.append(profileCard(k,()=>{Snd.init();Snd.click();player=k.id;coopIds=null;openHub()})))}
function canCoop(){return matchMedia('(hover:hover) and (pointer:fine)').matches}
function openHub(){show('hub');renderHub()}
function renderHub(){const p=P(),k=kid(player);$('#hubHello').textContent=`Ready, ${k.name}?`;
  $('#statCur').innerHTML=`${treatSvg} ${p.cur}`;$('#statStars').innerHTML=`${starSvg(true)} ${totalStars(p)}/${SECTORS.length*WORLDS_PER*3}`;
  $('#coopBtn').hidden=!canCoop();renderStore();
  $('#tSound').setAttribute('aria-pressed',String(Snd.on))}
function renderStore(){const p=P();const box=$('#store');box.innerHTML='';
  PERK_LIST.forEach(pk=>{const own=p.perks.includes(pk.id);const d=document.createElement('div');d.className='perk';d.dataset.perk=pk.id;d.innerHTML=`<div><b>${pk.name}</b><span>${pk.blurb}</span></div>`;
    const b=document.createElement('button');b.type='button';b.className='btn btn-sm'+(own?' btn-ghost':'');
    if(own){b.textContent='Owned';b.disabled=true}else{b.innerHTML=`${treatSvg} ${pk.price}`;if(p.cur<pk.price){b.disabled=true;b.title=`${pk.price-p.cur} more treats needed`}}
    b.onclick=()=>buyPerk(pk);d.append(b);box.append(d)})}
function buyPerk(pk){const p=P();if(!pk||p.perks.includes(pk.id)||p.cur<pk.price)return;Snd.init();p.cur-=pk.price;p.perks.push(pk.id);persist();Snd.coin();toast(`${pk.name} is yours!`);fxBurst(innerWidth/2,innerHeight*.4,60);renderHub()}
function tog(id,get,set){const b=$(id);b.onclick=()=>{Snd.init();set(!get());b.setAttribute('aria-pressed',String(get()));Snd.click()}}
tog('#tSound',()=>Snd.on,v=>Snd.on=v);
$('#switchBtn').onclick=()=>{Snd.click();show('menu');renderMenu()};
$('#playBtn').onclick=()=>{Snd.init();Snd.click();coopIds=null;openMap()};
$('#coopBtn').onclick=()=>{Snd.init();Snd.click();openPick2()};
$('#pick2Back').onclick=()=>{Snd.click();openHub()};
$('#mapBack').onclick=()=>{Snd.click();coopIds=null;openHub()};
function openPick2(){show('pick2');const box=$('#kids2');box.innerHTML='';KIDS.filter(k=>k.id!==player).forEach(k=>box.append(profileCard(k,()=>{Snd.click();coopIds=[player,k.id];openMap()})))}

/* the world map: sector k opens after world 3 of sector k-1; Mixed after world 3 of every other sector */
function starsOf(p,id){return p.stars[id]|0}
function sectorOpen(p,si){if(si===0)return true;if(SECTORS[si].id==='mix'){for(let k=0;k<si;k++)if(!starsOf(p,SECTORS[k].id+'-3'))return false;return true}return starsOf(p,SECTORS[si-1].id+'-3')>0}
function worldOpen(p,si,wi){return wi>=1&&wi<=WORLDS_PER&&sectorOpen(p,si)&&(wi===1||starsOf(p,SECTORS[si].id+'-'+(wi-1))>0)}
function openMap(){show('map');renderMap()}
function renderMap(){if(!player)return;const p=P(),g=kid(player).grade;
  $('#mapTitle').textContent=coopIds?`${kid(coopIds[0]).name} & ${kid(coopIds[1]).name}`:`${kid(player).name}'s map`;$('#mapStars').innerHTML=`${starSvg(true)} ${totalStars(p)}`;
  const box=$('#sectors');box.innerHTML='';let nextMarked=false;
  SECTORS.forEach((s,si)=>{const open=sectorOpen(p,si);let st=0;for(let w=1;w<=WORLDS_PER;w++)st+=starsOf(p,s.id+'-'+w);
    const d=document.createElement('div');d.className='card sector'+(open?'':' locked');d.dataset.sector=s.id;
    d.innerHTML=`<div class="sec-head"><h3>${si+1}. ${s.name}</h3><small>${open?s.blurb[g]:(s.id==='mix'?'Opens when world 3 of every other sector is done':`Opens after ${SECTORS[si-1].name} world 3`)}</small><span class="sec-stars">${starSvg(true)} ${st}/${WORLDS_PER*3}</span></div>`;
    const ws=document.createElement('div');ws.className='worlds';
    for(let w=1;w<=WORLDS_PER;w++){const id=s.id+'-'+w,o=worldOpen(p,si,w),sc=starsOf(p,id);const b=document.createElement('button');b.type='button';b.className='wbtn'+(w===WORLDS_PER?' boss':'');b.disabled=!o;b.dataset.w=id;
      if(o&&!sc&&!nextMarked){b.classList.add('next');nextMarked=true}
      b.innerHTML=`<span class="wn">${o?w:'🔒'}</span><span class="ws">${[0,1,2].map(i=>starSvg(i<sc)).join('')}</span>${p.best[id]?`<small>${(p.best[id]|0).toLocaleString()}</small>`:''}`;
      b.setAttribute('aria-label',`${s.name} world ${w}, ${sc} stars`);b.onclick=()=>startWorld(si,w);ws.append(b)}
    d.append(ws);box.append(d)})}

/* ---------- the run ---------- */
const cv=$('#cv'),cx=cv.getContext('2d'),stage=$('#stage');
let G=null,W=600,H=600,lastWorld=null;
function sizeStage(){const r=stage.getBoundingClientRect();W=Math.max(280,r.width);H=Math.max(260,r.height);const d=DPR();
  cv.width=Math.round(W*d);cv.height=Math.round(H*d);cv.style.width=W+'px';cv.style.height=H+'px';cx.setTransform(d,0,0,d,0,0);
  if(G){G.bs=clamp(Math.min(W/600,H/640),.6,1.5);G.cols=W<480?4:W<680?5:6;G.r=clamp(W*.06,24,44);G.shipW=clamp(W*.11,44,76);G.shipH=G.shipW*1.1;
    for(const p of G.players){p.x=clamp(p.x,G.shipW/2,W-G.shipW/2);p.y=clamp(p.y,H*.1,H-G.shipH/2)}}}
function colX(c){return W*(c+.5)/G.cols}
function mkPlayer(i,id){const s=PF(id),perks=s.perks;
  const p={i,id,col:i?'#fb923c':'#38bdf8',x:0,y:0,vx:0,mvx:0,mvy:0,hearts:5,maxHearts:5,bombs:1,maxBombs:1,up:{},upStack:[],fireInt:.33,fireT:0,speedMul:1,magnetR:0,lucky:0,shieldOn:false,shieldT:0,inv:0,down:false,downT:0,out:false,catches:0,held:{},target:null,firing:false,wind:perks.includes('p_revive'),perks,noLoseSaid:false};
  if(perks.includes('p_heart')){p.maxHearts=6;p.hearts=6}if(perks.includes('p_bomb')){p.maxBombs=2;p.bombs=2}return p}
function startWorld(si,wi){Snd.init();Snd.click();goFull();const s=SECTORS[si],ids=coopIds||[player];lastWorld=[si,wi];
  const ramp=WORLD_RAMP[wi-1],tier=s.id==='mix'?MIX_TIERS[wi-1]:ramp.tier,grade=Math.min(...ids.map(id=>kid(id).grade));
  const p0=PF(ids[0]),saved=(p0.skill&&p0.skill[s.id])||3;
  show('game');$('#pauseMenu').hidden=true;$('#upgrade').hidden=true;stage.classList.toggle('wide',ids.length>1);hudCache={};
  G={si,wi,sector:s,id:s.id+'-'+wi,ramp,tier,grade,coop:ids.length>1,ids,players:ids.map((id,i)=>mkPlayer(i,id)),t:0,phase:'intro',phaseAt:2.4,wave:1,waveT:0,correct:0,asked:0,right:0,wrongs:0,score:0,streak:0,bestStreak:0,lastCatcher:-1,team:0,
    bubbles:[],bullets:[],enemies:[],eshots:[],pickups:[],capsules:[],parts:[],rings:[],floats:[],dots:[],q:null,qOpen:false,nextQAt:-1,log:[],missed:[],bag:[],pool:null,poolTop:0,
    L:Math.max(2,saved-2),warm:Math.max(2,saved),peakL:0,shake:0,flash:0,flashCol:'255,255,255',offer:[],taken:[],pickTurn:0,focus:-1,spawnT:1.5,shooterT:2,tankUp:false,bonusTreats:0,collected:0,glowT:0,paused:false,finished:false,endAt:0,
    top:p0.best[s.id+'-'+wi]|0,topBeaten:false,slowMul:1,won:false,beam:null,bs:1,cols:5,r:30,shipW:56,shipH:62};
  G.peakL=G.L;sizeStage();
  G.players.forEach((p,i)=>{p.x=G.coop?W*(i?.7:.3):W/2;p.y=H-G.shipH*.9;if(p.perks.includes('p_fire'))applyUp(p,'rapid',true);if(p.perks.includes('p_shield'))applyUp(p,'shield',true);recompute(p)});
  for(let i=0;i<20;i++)G.dots.push({x:Math.random(),y:Math.random(),s:rand(1,3)});
  $('#eq').className='eq';$('#eq').textContent='Ready?';updateHUD();
  banner(`${s.name} · World ${wi}`,G.coop?'Fly into the right answer together!':'Fly into the right answer!');
  $('#gameHint').textContent=G.coop?'P1: W A S D to fly, F to shoot, Q bomb · P2: arrow keys, . to shoot, / bomb · P to pause':'Arrow keys or W A S D to fly · Space to shoot · B for a bomb · P to pause'}
function recompute(p){const u=p.up;p.fireInt=[.33,.25,.2,.16][Math.min(3,u.rapid|0)];p.speedMul=Math.pow(1.2,u.speed|0);
  p.magnetR=Math.max(p.perks.includes('p_magnet')?100:0,[0,120,200][Math.min(2,u.magnet|0)]);p.lucky=u.lucky|0;
  if(!(u.shield|0)){p.shieldOn=false;p.shieldT=0}
  if(G){let sm=1;for(const q of G.players)sm=Math.min(sm,Math.pow(.8,q.up.slow|0));if(G.players.some(q=>q.perks.includes('p_slow')))sm*=.9;G.slowMul=sm}}
function applyUp(p,id,quiet){const u=UPGRADES[id];p.up[id]=(p.up[id]|0)+1;if(u.lose)p.upStack.push(id);
  if(id==='heart'){p.maxHearts=Math.min(7,p.maxHearts+1);p.hearts=Math.min(p.maxHearts,p.hearts+1)}
  else if(id==='bomb'){p.maxBombs++;p.bombs=Math.min(p.maxBombs,p.bombs+1)}
  else if(id==='heal'){p.hearts=Math.min(p.maxHearts,p.hearts+2)}
  else if(id==='treats'){G.bonusTreats+=15}
  else if(id==='shield'&&!p.shieldOn&&p.shieldT<=0)p.shieldOn=true;
  recompute(p);if(!quiet){float(`${u.name}${u.max<99?' L'+p.up[id]:''}!`,p.x,p.y-60,p.col,22)}updateHUD()}
/* a hit or a wrong catch knocks the newest upgrade level loose; it floats off as a capsule anyone can grab back */
function dropUpgrade(p,n){for(let k=0;k<n;k++){let idx=-1;for(let i=p.upStack.length-1;i>=0;i--)if(UPGRADES[p.upStack[i]].lose){idx=i;break}
    if(idx<0){if(!p.noLoseSaid){p.noLoseSaid=true;float('Nothing left to lose!',p.x,p.y-70,'#fff',20)}break}
    const id=p.upStack.splice(idx,1)[0];p.up[id]=Math.max(0,(p.up[id]|0)-1);
    if(id==='bomb'){p.maxBombs=Math.max(1,p.maxBombs-1);p.bombs=Math.min(p.bombs,p.maxBombs)}
    if(id==='shield'&&!(p.up.shield|0))p.shieldOn=false;
    const life=G.players.some(q=>q.perks.includes('p_grip'))?7:4.5,dir=p.x<W/2?1:-1;
    G.capsules.push({id,x:p.x,y:p.y-10,vx:dir*rand(120,200)*G.bs,vy:-160*G.bs,t:0,life,life0:life});
    float(`Lost ${UPGRADES[id].name}!`,p.x,p.y-90,'#fca5a5',20)}
  recompute(p);updateHUD()}

/* problems and answer bubbles */
function spawnProblem(){const q=MSMath.problem(G.sector.id,G.grade,G.tier,G,PF(G.ids[0]).facts);G.q=q;G.qOpen=true;G.asked++;
  const n=3,opts=MSMath.choices(q,n),cols=shuffle([...Array(G.cols).keys()]).slice(0,n);
  opts.forEach((v,i)=>G.bubbles.push({v,ok:v===q.ans,col:cols[i],x:colX(cols[i]),y:-G.r-i*H*.14,state:'live',alpha:1,ph:rand(0,TAU),hold:0}));
  const eq=$('#eq');eq.className='eq wait';eq.innerHTML=eqHTML(q);updateHUD()}
function eqHTML(q){return `${q.a} <span class="x">${q.sym}</span> ${q.b} = <b class="ans">?</b>`}
function eqDone(q){return `${q.a} <span class="x">${q.sym}</span> ${q.b} = <b class="ans">${q.ans}</b>`}
function bubbleSpeed(){const Lmod=clamp(.9+.02*G.L,.8,1.25);return G.ramp.speed*(1+.06*(G.wave-1))*Lmod*G.slowMul*G.bs*(G.grade===3?.9:1)}
function mult(){return 1+Math.min(4,Math.floor(G.streak/3))}
function bossWave(){return G.ramp.tank&&G.wave===WAVES}
function tankAlive(){return G.enemies.some(e=>e.kind==='tank'&&e.hp>0&&!e.flee)}
function catchBubble(p,b){const q=G.q;if(!q||!G.qOpen)return;G.qOpen=false;
  if(b.ok){b.state='ok';b.hold=.3;G.right++;G.correct++;p.catches++;let team=0;if(G.coop&&G.lastCatcher>=0&&G.lastCatcher!==p.i){G.team++;team=1}G.lastCatcher=p.i;
    G.streak++;G.bestStreak=Math.max(G.bestStreak,G.streak);G.log.push({q,ok:true});
    const pts=Math.round((100+15*G.wi)*(mult()+team)*(G.glowT>0?2:1));G.score+=pts;checkTop();adapt(.3);
    burst(b.x,b.y,30);float('+'+pts,b.x,b.y-40,'#fff',30);float(team?`Teamwork! ×${mult()+team}`:pickOne(PRAISE),b.x,b.y-80,team?'#fde68a':'#fff',22);
    Snd.pop(G.streak);$('#eq').className='eq ok';$('#eq').innerHTML=eqDone(q);milestone();
    for(const o of G.bubbles)if(o!==b&&o.state==='live'){o.state='fade';o.hold=0}
    if(G.correct>=WAVE_N&&!(bossWave()&&tankAlive()))waveClear();else G.nextQAt=G.t+.7}
  else{b.state='bad';b.hold=.3;G.wrongs++;G.streak=0;endGlow();G.log.push({q,ok:false});G.missed.push(q);
    for(const o of G.bubbles)if(o!==b&&o.state==='live'){if(o.ok){o.state='hint';o.hold=1.4}else{o.state='fade';o.hold=0}}
    puff(b.x,b.y);G.shake=12;G.flash=.3;G.flashCol='255,110,110';Snd.wrong();adapt(-.8,'slow');
    float(`${q.text} = ${q.ans}`,W/2,H*.42,'#fff',34);$('#eq').className='eq miss';$('#eq').innerHTML=eqDone(q);
    loseHeart(p);if(!p.down)dropUpgrade(p,loseOnWrong(G.wi));p.inv=1.2;G.nextQAt=G.t+1.6}
  updateHUD()}
function updateBubbles(dt){const v=bubbleSpeed();const live=G.bubbles.filter(b=>b.state==='live');
  for(const b of G.bubbles){b.ph+=dt;
    if(b.state==='live'){b.y+=v*dt;b.x=colX(b.col)+Math.sin(b.ph*1.3)*8;
      if(b.y>H+G.r){b.y=-G.r-rand(0,H*.1);const free=[];for(let c=0;c<G.cols;c++){if(c!==b.col&&!live.some(o=>o!==b&&o.col===c))free.push(c)}
        if(free.length)b.col=pickOne(free);else{let top=0;for(const o of live)if(o!==b&&o.col===b.col)top=Math.min(top,o.y);b.y=Math.min(b.y,top-2.2*G.r)}}}
    else{if(b.hold>0)b.hold-=dt;else b.alpha-=dt*2;if(b.state==='hint')b.y+=v*.5*dt}}
  G.bubbles=G.bubbles.filter(b=>b.alpha>0);
  if(G.phase==='run'&&G.qOpen){const alive=shipsAlive(),rx=G.shipW*.3;
    outer:for(const b of G.bubbles){if(b.state!=='live'||b.y<0)continue;for(const p of alive)if(dist(b.x,b.y,p.x,p.y)<G.r+rx*.9){catchBubble(p,b);break outer}}}
  if(G.phase==='run'&&!G.qOpen&&G.nextQAt>=0&&G.t>=G.nextQAt){G.nextQAt=-1;spawnProblem()}}

/* hearts, downs and rescues */
function loseHeart(p){p.hearts--;if(p.hearts<=0){p.hearts=0;downPlayer(p)}updateHUD()}
function downPlayer(p){if(p.wind){p.wind=false;p.hearts=2;p.inv=2.5;banner('Second Wind!',`${kid(p.id).name} is back up`);Snd.glow();return}
  p.down=true;p.downT=G.coop?12:99;p.firing=false;p.held={};p.target=null;puff(p.x,p.y);
  if(!G.coop||G.players.every(q=>q.down||q.out)){G.phase='lost';G.endAt=G.t+3;G.qOpen=false;banner('Game over',`Score ${G.score.toLocaleString()}`);Snd.lose()}
  else{float(`${kid(p.id).name} needs a rescue!`,p.x,p.y-70,'#fff',22);Snd.lose()}}
function revive(p,by){p.down=false;p.out=false;p.hearts=2;p.inv=2.5;p.downT=0;burst(p.x,p.y,40);banner('Rescued!',`${kid(by.id).name} saved ${kid(p.id).name}`);Snd.win();updateHUD()}
function hitPlayer(p){if(p.inv>0||p.down||p.out||G.phase!=='run')return;
  if(p.shieldOn){p.shieldOn=false;p.shieldT=(p.up.shield|0)>=2?7:12;p.inv=.6;G.rings.push({x:p.x,y:p.y,r:20,life:.45});Snd.hit();float('Shield!',p.x,p.y-60,'#7dd3fc',20);updateHUD();return}
  loseHeart(p);if(!p.down)dropUpgrade(p,LOSE_ON_HIT);p.inv=1.2;G.shake=12;G.flash=.3;G.flashCol='255,110,110';Snd.hurt();puff(p.x,p.y);updateHUD()}
function shipsAlive(){return G.players.filter(p=>!p.down&&!p.out)}
function nearestShip(x,y){let best=null,bd=1e9;for(const p of shipsAlive()){const d=dist(x,y,p.x,p.y);if(d<bd){bd=d;best=p}}return best}

/* waves */
function startRun(){G.phase='run';G.waveT=0;spawnProblem();if(bossWave()&&!G.tankUp){G.tankUp=true;spawnTank()}}
function waveClear(){G.phase='clear';G.phaseAt=G.t+1.8;G.qOpen=false;G.nextQAt=-1;
  for(const e of G.enemies)e.flee=true;G.eshots=[];G.capsules=[];for(const b of G.bubbles)if(b.state==='live'){b.state='fade';b.hold=0}
  let hearts=0;for(const p of G.players)if(!p.down&&!p.out)hearts+=p.hearts;
  const bonus=150*G.wave+50*hearts;G.score+=bonus;checkTop();
  for(const p of G.players){if(p.down||p.out)continue;p.hearts=Math.min(p.maxHearts,p.hearts+1);p.bombs=Math.min(p.maxBombs,p.bombs+1)}
  banner(G.wave<WAVES?`Wave ${G.wave} clear!`:'World clear!',`+${bonus} bonus`);Snd.glow();confetti(G.wave<WAVES?40:140);updateHUD()}
function afterClear(){if(G.wave<WAVES)openUpgrade();else{G.phase='won';G.won=true;G.endAt=G.t+2.4;Snd.win();confetti(120)}}
function nextWave(){G.wave++;G.correct=0;G.phase='intro';G.phaseAt=G.t+1.6;G.spawnT=1.5;G.shooterT=2;
  for(const p of G.players)if(p.down||p.out){p.down=false;p.out=false;p.hearts=2;p.inv=2}
  banner(`Wave ${G.wave}`,bossWave()?'Boss incoming!':G.wave===WAVES?'Last wave!':'');updateHUD()}
function openUpgrade(){G.phase='upgrade';G.pickTurn=0;G.taken=[];G.focus=-1;const n=G.coop||G.players[0].perks.includes('p_pick4')?4:3;
  const cands=shuffle(UP_ORDER.filter(id=>G.players.some(p=>(p.up[id]|0)<UPGRADES[id].max)));G.offer=cands.slice(0,n);
  while(G.offer.length<n)G.offer.push(G.players.some(p=>p.hearts<p.maxHearts)&&!G.offer.includes('heal')?'heal':'treats');
  renderOffer();$('#upgrade').hidden=false}
function renderOffer(){const p=G.players[G.pickTurn];$('#upTitle').textContent=`Wave ${G.wave} clear!`;
  $('#upWho').textContent=G.coop?`${kid(p.id).name} picks an upgrade (press 1-${G.offer.length}, or arrows and Enter)`:'Pick an upgrade';
  const box=$('#upCards');box.innerHTML='';G.offer.forEach((id,i)=>{const u=UPGRADES[id],lv=p.up[id]|0,taken=G.taken.includes(i);const b=document.createElement('button');b.type='button';b.className='up-card'+(taken?' taken':'')+(i===G.focus?' focus':'');b.disabled=taken;b.dataset.up=id;
    b.innerHTML=`<small>${i+1}</small><b>${u.name}</b><span>${u.blurb}</span><i>${u.max<99?'●'.repeat(lv)+'○'.repeat(Math.max(0,u.max-lv)):''}</i>`;b.onclick=()=>{Snd.init();pickUp(i)};box.append(b)})}
function pickUp(i){if(!G||G.phase!=='upgrade'||G.taken.includes(i)||i<0||i>=G.offer.length)return;const p=G.players[G.pickTurn],id=G.offer[i],u=UPGRADES[id];
  if((p.up[id]|0)>=u.max){G.bonusTreats+=15;float('Already maxed: +15 treats',p.x,p.y-60,'#fff',20)}else applyUp(p,id);
  Snd.coin();G.taken.push(i);
  if(G.coop&&G.pickTurn===0){G.pickTurn=1;G.focus=-1;renderOffer();return}
  $('#upgrade').hidden=true;nextWave()}
function setUpFocus(i){if(!G||G.phase!=='upgrade')return;G.focus=clamp(i,0,G.offer.length-1);renderOffer()}

/* enemies */
function spawnCrasher(){let x=rand(30,W-30);for(let k=0;k<8&&G.waveT<1&&G.players.some(p=>Math.abs(p.x-x)<60);k++)x=rand(30,W-30);
  G.enemies.push({kind:'crash',x,y:-24,vx:0,vy:120*G.bs,hp:G.ramp.crashHP,r:18*G.bs,dive:false,tx:x,wob:rand(0,TAU),fireT:rand(.8,1.6),flash:0,score:50})}
function spawnShooter(){const side=ri(2);G.enemies.push({kind:'shoot',x:side?W+30:-30,y:H*rand(.22,.3),vx:(side?-1:1)*90*G.bs,vy:0,hp:2,r:22*G.bs,fireT:G.ramp.shooter,life:9,flash:0,score:120,inside:false})}
function spawnTank(){const hp=6+G.si;G.enemies.push({kind:'tank',x:W/2,y:-70,vx:0,vy:40*G.bs,hp,max:hp,r:40*G.bs,fireT:3,flash:0,score:300})}
function fireEshot(e,ang,sp){G.eshots.push({x:e.x,y:e.y+e.r*.6,vx:Math.sin(ang)*sp,vy:Math.cos(ang)*sp,r:7})}
function enemyFire(e){const sp=220*G.bs;
  if(e.kind==='tank'){for(const a of [-.44,0,.44])fireEshot(e,a,sp)}
  else{let ang=0;if(G.ramp.aim){const p=nearestShip(e.x,e.y);if(p)ang=Math.atan2(p.x-e.x,p.y-e.y)}fireEshot(e,ang,sp)}
  Snd.shoot()}
function updateEnemies(dt){const cap=Math.min(6,G.ramp.cap+(G.wave-1));
  if(G.phase==='run'){G.spawnT-=dt;if(G.spawnT<=0&&G.enemies.filter(e=>e.kind==='crash'&&!e.flee).length<cap){spawnCrasher();G.spawnT=G.ramp.crash*(G.grade===3?1.15:1)*rand(.8,1.2)}
    if(G.ramp.shooter>0){G.shooterT-=dt;if(G.shooterT<=0&&!G.enemies.some(e=>e.kind==='shoot'&&!e.flee)){spawnShooter();G.shooterT=Math.max(3,6-.5*G.wi)}}}
  for(const e of G.enemies){e.flash=Math.max(0,e.flash-dt);
    if(e.flee){e.y-=400*dt;continue}
    if(e.kind==='crash'){e.wob+=dt*3;
      if(!e.dive){e.x+=Math.sin(e.wob)*40*dt;e.y+=e.vy*dt;if(G.phase==='run'&&e.y>0){e.fireT-=dt;if(e.fireT<=0){enemyFire(e);e.fireT=rand(2,3)}}if(e.y>H*.55){e.dive=true;const p=nearestShip(e.x,e.y);e.tx=p?p.x:e.x}}
      else{e.vx+=(clamp((e.tx-e.x)*3,-260*G.bs,260*G.bs)-e.vx)*Math.min(1,dt*4);e.x+=e.vx*dt;e.vy+=240*dt;e.y+=e.vy*dt}}
    else if(e.kind==='shoot'){e.x+=e.vx*dt;if(!e.inside&&e.x>e.r&&e.x<W-e.r)e.inside=true;if(e.inside&&(e.x<e.r||e.x>W-e.r)){e.vx=-e.vx;e.x=clamp(e.x,e.r,W-e.r)}
      e.life-=dt;if(e.life<=0)e.y-=200*dt;else if(G.phase==='run'){e.fireT-=dt;if(e.fireT<=0){enemyFire(e);e.fireT=G.ramp.shooter*rand(.85,1.15)}}}
    else{if(e.y<H*.26)e.y+=e.vy*dt;else{e.x=clamp(e.x+Math.sin(G.t*.7)*30*dt,e.r,W-e.r);if(G.phase==='run'){e.fireT-=dt;if(e.fireT<=0){enemyFire(e);e.fireT=3}}}}}
  G.enemies=G.enemies.filter(e=>e.hp>0&&e.y<H+60&&e.y>-130)}
function killEnemy(e){if(e.hp<=0)return;e.hp=0;burst(e.x,e.y,e.kind==='tank'?70:24);const pts=e.score*mult();G.score+=pts;checkTop();float('+'+pts,e.x,e.y-30,'#fff',22);Snd.hit();
  if(e.kind==='tank'){G.pickups.push({kind:'heart',x:e.x,y:e.y,vy:80});for(let i=0;i<4;i++)G.pickups.push({kind:'treat',x:e.x+rand(-30,30),y:e.y+rand(-10,10),vy:110*G.bs});G.shake=16;banner('Tank down!');if(G.correct>=WAVE_N&&G.phase==='run')waveClear()}
  else rollDrop(e)}
function rollDrop(e){const lucky=Math.max(...G.players.map(p=>p.lucky));const needHeart=G.players.some(p=>!p.down&&!p.out&&p.hearts<p.maxHearts);
  if(needHeart&&Math.random()<.12+.06*lucky)G.pickups.push({kind:'heart',x:e.x,y:e.y,vy:80});
  else if(Math.random()<.6+.2*lucky){const n=1+ri(3);for(let i=0;i<n;i++)G.pickups.push({kind:'treat',x:e.x+rand(-16,16),y:e.y+rand(-8,8),vy:110*G.bs})}}
function useBomb(p){if(!G||G.paused||G.phase!=='run'||p.down||p.out||p.bombs<=0)return;p.bombs--;
  for(const e of G.enemies){if(e.flee||e.hp<=0)continue;if(e.kind==='tank'){e.hp-=3;e.flash=.3;if(e.hp<=0)killEnemy(e)}else killEnemy(e)}
  G.eshots=[];G.flash=.5;G.flashCol='255,255,255';G.shake=20;Snd.special();banner('BOOM!');updateHUD()}

/* ships, bullets and everything that touches them */
function updatePlayers(dt){
  for(const p of G.players){if(p.out)continue;
    if(p.down){p.downT-=dt;p.y=Math.max(H*.5,p.y-10*dt);p.x=clamp(p.x+Math.sin(G.t*1.5+p.i)*20*dt,20,W-20);
      if(p.downT<=0){p.out=true;p.down=false;float(`${kid(p.id).name} is out until the next wave`,W/2,H*.4,'#fff',20);if(G.players.every(q=>q.down||q.out)){G.phase='lost';G.endAt=G.t+3;banner('Game over',`Score ${G.score.toLocaleString()}`)}}
      for(const q of G.players)if(q!==p&&!q.down&&!q.out&&dist(p.x,p.y,q.x,q.y)<G.shipW*.9)revive(p,q);
      continue}
    const sp=380*G.bs*p.speedMul;let dx=0,dy=0,wx=0,wy=0;const h=p.held;if(h.left)dx-=1;if(h.right)dx+=1;if(h.up)dy-=1;if(h.down)dy+=1;
    if(p.target){const tx=p.target.x-p.x,ty=p.target.y-p.y,d=Math.hypot(tx,ty);if(d>1){const s=Math.min(sp*1.2,d*12);wx=tx/d*s;wy=ty/d*s}}
    else{if(dx&&dy){dx*=.7071;dy*=.7071}wx=dx*sp;wy=dy*sp}
    /* ease toward the wanted velocity so starts, stops and turns glide instead of snapping */
    const k=1-Math.exp(-dt*(p.target?20:14));p.mvx+=(wx-p.mvx)*k;p.mvy+=(wy-p.mvy)*k;
    const px=p.x,nx=p.x+p.mvx*dt,ny=p.y+p.mvy*dt;p.x=clamp(nx,G.shipW/2,W-G.shipW/2);p.y=clamp(ny,H*.1,H-G.shipH/2);
    if(p.x!==nx)p.mvx=0;if(p.y!==ny)p.mvy=0;
    p.vx+=((p.x-px)/Math.max(dt,.001)-p.vx)*Math.min(1,dt*10);
    p.inv=Math.max(0,p.inv-dt);
    if(!p.shieldOn&&(p.up.shield|0)>0){p.shieldT-=dt;if(p.shieldT<=0){p.shieldOn=true;float('Shield up',p.x,p.y-50,'#7dd3fc',16);updateHUD()}}
    p.firing=G.phase==='run'&&!!h.fire;
    p.fireT-=dt;if(p.firing&&p.fireT<=0){p.fireT=p.fireInt;shoot(p)}}}
function shoot(p){const dmg=1+(p.up.power|0),sp=760*G.bs,angs=[0],s=p.up.spread|0;if(s>=1)angs.push(-.17,.17);if(s>=2)angs.push(-.35,.35);
  for(const a of angs)G.bullets.push({x:p.x+Math.sin(a)*6,y:p.y-G.shipH*.45,vx:Math.sin(a)*sp,vy:-Math.cos(a)*sp,dmg,col:p.col});Snd.shoot()}
function segDist(px,py,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy||1;const t=clamp(((px-x1)*dx+(py-y1)*dy)/l2,0,1);return dist(px,py,x1+dx*t,y1+dy*t)}
function updateCombat(dt){const alive=shipsAlive(),rx=G.shipW*.3;
  for(const b of G.bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.y<-20||b.x<-20||b.x>W+20){b.dead=true;continue}
    for(const e of G.enemies){if(e.flee||e.hp<=0||e.y<-10)continue;if(dist(b.x,b.y,e.x,e.y)<e.r+6){e.hp-=b.dmg;e.flash=.15;b.dead=true;G.parts.push({x:b.x,y:b.y,vx:rand(-60,60),vy:rand(-60,20),life:.3,r:3,col:'#fff',g:0});if(e.hp<=0)killEnemy(e);break}}}
  G.bullets=G.bullets.filter(b=>!b.dead);
  for(const e of G.enemies){if(e.flee||e.hp<=0)continue;for(const p of alive)if(dist(e.x,e.y,p.x,p.y)<e.r+rx){hitPlayer(p);if(e.kind==='crash'){e.hp=0;puff(e.x,e.y)}}}
  G.beam=(G.coop&&alive.length===2&&dist(alive[0].x,alive[0].y,alive[1].x,alive[1].y)<220*G.bs)?alive:null;
  for(const s of G.eshots){s.x+=s.vx*dt;s.y+=s.vy*dt;if(s.y>H+20||s.x<-20||s.x>W+20||s.y<-20){s.dead=true;continue}
    if(G.beam&&segDist(s.x,s.y,G.beam[0].x,G.beam[0].y,G.beam[1].x,G.beam[1].y)<9){s.dead=true;G.score+=5;G.rings.push({x:s.x,y:s.y,r:4,life:.3});continue}
    for(const p of alive)if(dist(s.x,s.y,p.x,p.y)<s.r+rx*.8){s.dead=true;hitPlayer(p);break}}
  G.eshots=G.eshots.filter(s=>!s.dead);
  G.enemies=G.enemies.filter(e=>e.hp>0);
  for(const k of G.pickups){k.y+=k.vy*dt;
    for(const p of alive){if(p.magnetR>0){const d=dist(k.x,k.y,p.x,p.y);if(d<p.magnetR&&d>1){k.x+=(p.x-k.x)/d*300*dt;k.y+=(p.y-k.y)/d*300*dt}}}
    for(const p of alive)if(dist(k.x,k.y,p.x,p.y)<rx+12){k.dead=true;collect(p,k);break}
    if(k.y>H+20)k.dead=true}
  G.pickups=G.pickups.filter(k=>!k.dead);
  for(const c of G.capsules){c.t+=dt;c.life-=dt;
    if(c.t<.4){c.y+=c.vy*dt;c.vy+=400*dt}else{const floor=H-26-Math.abs(Math.sin(c.t*4))*16;c.y=Math.min(c.y+50*G.bs*dt,floor)}
    c.x=clamp(c.x+c.vx*dt,16,W-16);c.vx*=.985;
    for(const p of alive){if(p.magnetR>0){const d=dist(c.x,c.y,p.x,p.y);if(d<p.magnetR&&d>1){c.x+=(p.x-c.x)/d*220*dt;c.y+=(p.y-c.y)/d*220*dt}}}
    for(const p of alive)if(c.t>.35&&dist(c.x,c.y,p.x,p.y)<rx+14){c.dead=true;grabCapsule(p,c);break}
    if(c.life<=0)c.dead=true}
  G.capsules=G.capsules.filter(c=>!c.dead)}
function collect(p,k){if(k.kind==='heart'){if(p.hearts<p.maxHearts){p.hearts++;float('+1 heart',k.x,k.y-20,'#f87171',20)}else{G.score+=50;float('+50',k.x,k.y-20,'#fff',20)}}
  else{G.collected++;G.score+=10;float('+1',k.x,k.y-20,'#fde68a',18)}Snd.coin();burst(k.x,k.y,8);updateHUD()}
function grabCapsule(p,c){const u=UPGRADES[c.id];if((p.up[c.id]|0)<u.max){applyUp(p,c.id,true);float(`${u.name} back!`,p.x,p.y-60,'#86efac',22)}else{G.collected+=5;float('+5 treats',p.x,p.y-60,'#fde68a',20)}Snd.glow();burst(c.x,c.y,16)}

/* bookkeeping */
function adapt(d,why){const before=Math.floor(G.L);G.L=MSMath.adapt(G.L,d,G.warm);G.peakL=Math.max(G.peakL,G.L);const after=Math.floor(G.L);
  if(after>before)float('Speed up!',W/2,H*.5,'#fff',22);else if(why==='slow'&&after<before)float('Slowing down a little',W/2,H*.5,'#fff',20)}
function milestone(){const b=MILESTONES[G.streak];if(!b)return;G.bonusTreats+=b;if(G.streak===5){G.glowT=8;banner('Glow Mode!',`double points · +${b} treats`)}else float(`${G.streak} in a row! +${b} treats`,W/2,H*.3,'#fde68a',24);Snd.glow()}
function endGlow(){G.glowT=0}
function checkTop(){if(G.topBeaten||G.top<=0||G.score<=G.top)return;G.topBeaten=true;banner('New top score!','Keep going!');Snd.glow()}
function banner(text,sub){const el=$('#banner');el.innerHTML=`<span>${text}</span>${sub?`<br><small>${sub}</small>`:''}`;el.classList.remove('show');void el.offsetWidth;el.classList.add('show')}
function float(text,x,y,col,size){G.floats.push({text,x:clamp(x,80,W-80),y:Math.max(y,W<620?150:110),col,size,life:1.4})}
function burst(x,y,n){for(let i=0;i<n;i++){const a=rand(0,TAU),sp=rand(80,360);G.parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rand(.5,1.1),r:rand(3,7),col:pickOne(CONFETTI),star:Math.random()<.45,g:200})}G.rings.push({x,y,r:10,life:.45})}
function puff(x,y){for(let i=0;i<16;i++){const a=rand(0,TAU),sp=rand(30,140);G.parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rand(.6,1.1),r:rand(6,12),col:['rgba(90,90,110,.7)','rgba(130,130,150,.6)','rgba(70,60,90,.6)'][ri(3)],g:-20})}}
function confetti(n){for(let i=0;i<n;i++)G.parts.push({x:rand(0,W),y:rand(-60,-10),vx:rand(-60,60),vy:rand(60,220),life:rand(2,3.2),r:rand(4,8),col:pickOne(CONFETTI),rect:true,rot:rand(0,6),vr:rand(-8,8),g:60})}
let hudCache={};
function put(sel,html){if(hudCache[sel]===html)return;hudCache[sel]=html;$(sel).innerHTML=html}
function updateHUD(){if(!G)return;
  put('#hearts',G.players.map(p=>`<div class="hearts pill" style="border-color:${p.col}">${G.coop?`<span class="tag" style="color:${p.col}">P${p.i+1}</span>`:''}${p.out?'<span class="tag">out</span>':p.down?'<span class="tag">rescue!</span>':Array.from({length:p.maxHearts},(_,i)=>heartSvg(i<p.hearts)).join('')}${p.shieldOn?'<span class="tag" style="color:#7dd3fc">◉</span>':''}</div>`).join(''));
  put('#stageLbl',`World ${G.wi} · Wave ${G.wave}/${WAVES} · ${Math.min(G.correct,WAVE_N)}/${WAVE_N}`);
  const w=(Math.min(1,G.correct/WAVE_N)*100)+'%';if(hudCache.prog!==w){hudCache.prog=w;$('#progBar').style.width=w}
  put('#bombs','Bomb '+G.players.map(p=>'●'.repeat(p.bombs)+'○'.repeat(Math.max(0,p.maxBombs-p.bombs))).join(' · '));
  put('#ups',G.players.map(p=>UP_ORDER.filter(id=>p.up[id]).map(id=>`<span style="color:${p.col}">${UPGRADES[id].tag}${p.up[id]>1?p.up[id]:''}</span>`).join('')).join('<span style="opacity:.4">|</span>'));
  put('#score',G.score.toLocaleString());
  put('#combo',G.glowT>0?`Glow · ${G.streak} in a row`:G.streak>=2?`${G.streak} in a row · ×${mult()}`:'');
  const tl=$('#topLbl'),cls='hud-small'+(G.topBeaten?' beat':'');if(tl.className!==cls)tl.className=cls;put('#topLbl',G.topBeaten?'New top score!':G.top?`Top ${G.top.toLocaleString()}`:'First try!')}
function update(dt){G.t+=dt;G.waveT+=dt;
  if(G.phase==='intro'&&G.t>=G.phaseAt)startRun();
  if(G.phase==='clear'&&G.t>=G.phaseAt)afterClear();
  if((G.phase==='won'||G.phase==='lost')&&G.t>=G.endAt&&!G.finished){G.finished=true;finish();return}
  if(G.phase!=='upgrade'){updatePlayers(dt);updateBubbles(dt);updateEnemies(dt);updateCombat(dt)}
  if(G.glowT>0){G.glowT-=dt;if(G.glowT<=0){endGlow();updateHUD()}}
  G.shake=Math.max(0,G.shake-dt*40);G.flash=Math.max(0,G.flash-dt*1.6);
  const cap=W<480?400:700;for(const p of G.parts){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.g||0)*dt;p.vx*=.985;if(p.rect)p.rot+=p.vr*dt}
  G.parts=G.parts.filter(p=>p.life>0);if(G.parts.length>cap)G.parts.splice(0,G.parts.length-cap);
  for(const r of G.rings){r.life-=dt;r.r+=260*dt}G.rings=G.rings.filter(r=>r.life>0);
  for(const f of G.floats){f.life-=dt;f.y-=46*dt}G.floats=G.floats.filter(f=>f.life>0);
  const dv=(40+4*G.L)/H*dt;for(const d of G.dots){d.y+=dv;if(d.y>1.02){d.y=-.02;d.x=Math.random()}}}

/* ---------- drawing (placeholder shapes) ---------- */
function dot(c,x,y,r){c.beginPath();c.arc(x,y,r,0,TAU);c.fill()}
function ell(c,x,y,rx,ry){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU)}
function starPath(c,x,y,r){c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}c.closePath()}
function heartPath(c,x,y,s){c.beginPath();c.moveTo(x,y+s*.9);c.bezierCurveTo(x-s*1.4,y,x-s*.8,y-s*1.1,x,y-s*.35);c.bezierCurveTo(x+s*.8,y-s*1.1,x+s*1.4,y,x,y+s*.9);c.closePath()}
function drawToken(c,b,t){const r=G.r,txt=String(b.v);c.save();c.translate(b.x,b.y);c.globalAlpha=clamp(b.alpha,0,1)*(b.state==='bad'?.6:1);
  if(b.state==='hint'||b.state==='ok'){const p=1+Math.sin(t*8)*.08;c.strokeStyle=b.state==='ok'?'#3FCB98':'rgba(255,255,255,.95)';c.lineWidth=Math.max(3,r*.12);c.beginPath();c.arc(0,0,r*1.3*p,0,TAU);c.stroke()}
  const g=c.createRadialGradient(-r*.35,-r*.4,r*.1,0,0,r);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(.5,'rgba(190,225,255,.55)');g.addColorStop(1,'rgba(90,150,230,.55)');c.fillStyle=g;dot(c,0,0,r);
  c.strokeStyle='rgba(255,255,255,.95)';c.lineWidth=Math.max(1.5,r*.07);c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();
  const fs=Math.max(14,r*(txt.length>3?.62:txt.length>2?.78:.95));c.font=cfont(fs);c.textAlign='center';c.textBaseline='middle';c.lineWidth=Math.max(3,fs*.16);c.strokeStyle='rgba(25,30,55,.8)';c.strokeText(txt,0,r*.04);c.fillStyle='#fff';c.fillText(txt,0,r*.04);
  if(b.state==='bad'){c.globalAlpha=clamp(b.alpha,0,1);c.strokeStyle='#FF5C8A';c.lineWidth=Math.max(3,r*.14);c.beginPath();c.moveTo(-r*.7,-r*.7);c.lineTo(r*.7,r*.7);c.moveTo(r*.7,-r*.7);c.lineTo(-r*.7,r*.7);c.stroke()}
  c.restore()}
function drawShip(c,p,t){if(p.out)return;const w=G.shipW,h=G.shipH;c.save();c.translate(p.x,p.y);
  if(p.down){const rr=w*.6+Math.sin(t*4)*3;c.fillStyle='rgba(200,210,230,.3)';dot(c,0,0,rr);c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.arc(0,0,rr,0,TAU);c.stroke();
    c.font=cfont(13);c.textAlign='center';c.textBaseline='middle';c.fillStyle='#fff';c.fillText(G.coop?`Rescue ${Math.ceil(p.downT)}`:'',0,-rr-12);c.globalAlpha=.6;c.scale(.7,.7)}
  else if(p.inv>0&&Math.floor(t*12)%2)c.globalAlpha=.35;
  c.rotate(clamp(p.vx/2600,-.25,.25));
  c.fillStyle=p.col;c.beginPath();c.moveTo(0,-h/2);c.quadraticCurveTo(w*.55,h*.1,w*.42,h*.42);c.quadraticCurveTo(0,h*.62,-w*.42,h*.42);c.quadraticCurveTo(-w*.55,h*.1,0,-h/2);c.closePath();c.fill();
  c.fillStyle='rgba(255,255,255,.85)';ell(c,0,h*.02,w*.14,h*.17);c.fill();
  if(!p.down){c.fillStyle='rgba(255,200,120,.7)';c.beginPath();c.moveTo(-w*.1,h*.44);c.lineTo(w*.1,h*.44);c.lineTo(0,h*.6+rand(0,8));c.closePath();c.fill()}
  if(p.shieldOn){c.strokeStyle='rgba(125,211,252,.9)';c.lineWidth=3;c.setLineDash([6,5]);c.lineDashOffset=-t*40;c.beginPath();c.arc(0,0,w*.7,0,TAU);c.stroke();c.setLineDash([])}
  if(G.coop){c.fillStyle=p.col;c.fillRect(-w*.3,h*.68,w*.6,3)}
  c.restore()}
function drawEnemy(c,e,t){c.save();c.translate(e.x,e.y);const fl=e.flash>0;
  if(e.kind==='crash'){c.rotate(t*2);c.fillStyle=fl?'#fff':'#ef4444';c.beginPath();for(let i=0;i<16;i++){const a=i/16*TAU,rr=i%2?e.r:e.r*.7;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}c.closePath();c.fill();
    c.fillStyle='#fff';dot(c,-e.r*.25,-e.r*.1,e.r*.16);dot(c,e.r*.25,-e.r*.1,e.r*.16);c.fillStyle='#1f2937';dot(c,-e.r*.25,-e.r*.05,e.r*.08);dot(c,e.r*.25,-e.r*.05,e.r*.08)}
  else if(e.kind==='shoot'){c.fillStyle=fl?'#fff':'#a78bfa';ell(c,0,0,e.r,e.r*.45);c.fill();c.fillStyle=fl?'#fff':'#ddd6fe';ell(c,0,-e.r*.3,e.r*.5,e.r*.4);c.fill();c.fillStyle='#fde68a';for(let i=-1;i<=1;i++)dot(c,i*e.r*.5,e.r*.15,3+(Math.floor(t*4+i)&1))}
  else{c.fillStyle=fl?'#fff':'#64748b';c.beginPath();c.roundRect(-e.r,-e.r*.8,e.r*2,e.r*1.6,12);c.fill();c.fillStyle=fl?'#fff':'#334155';c.beginPath();c.roundRect(-e.r*.6,-e.r*.4,e.r*1.2,e.r*.8,8);c.fill();c.fillStyle='#f87171';dot(c,-e.r*.3,0,5);dot(c,e.r*.3,0,5);
    const w=e.r*2.2,x=-w/2,y=-e.r-18;c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.roundRect(x-2,y-2,w+4,14,7);c.fill();c.fillStyle=e.hp/e.max>.5?'#22c55e':e.hp/e.max>.25?'#f5c842':'#ef4444';c.beginPath();c.roundRect(x,y,w*Math.max(0,e.hp)/e.max,10,5);c.fill()}
  c.restore()}
function drawCapsule(c,cp){c.save();c.translate(cp.x,cp.y);const fr=clamp(cp.life/cp.life0,0,1);c.fillStyle='rgba(134,239,172,.25)';dot(c,0,0,15);c.strokeStyle='#86efac';c.lineWidth=3;c.beginPath();c.arc(0,0,15,-Math.PI/2,-Math.PI/2+TAU*fr);c.stroke();
  c.font=cfont(11);c.textAlign='center';c.textBaseline='middle';c.fillStyle='#fff';c.fillText(UPGRADES[cp.id].tag,0,1);c.restore()}
function draw(){const c=cx,t=G.t;c.setTransform(DPR(),0,0,DPR(),0,0);c.clearRect(0,0,W,H);c.save();
  if(G.shake>0)c.translate(rand(-1,1)*G.shake*.6,rand(-1,1)*G.shake*.6);
  c.fillStyle='rgba(255,255,255,.22)';for(const d of G.dots)dot(c,d.x*W,d.y*H,d.s);
  for(const b of G.bullets){c.fillStyle=b.col;c.beginPath();c.roundRect(b.x-3,b.y-9,6,18,3);c.fill()}
  for(const e of G.enemies)drawEnemy(c,e,t);
  for(const s of G.eshots){c.fillStyle='#f87171';dot(c,s.x,s.y,s.r);c.fillStyle='#fff';dot(c,s.x-2,s.y-2,2)}
  for(const k of G.pickups){if(k.kind==='heart'){c.fillStyle='#f87171';heartPath(c,k.x,k.y,10);c.fill()}else{c.fillStyle='#fde68a';dot(c,k.x,k.y,8);c.fillStyle='#f59e0b';dot(c,k.x,k.y,4)}}
  for(const cp of G.capsules)drawCapsule(c,cp);
  if(G.beam){c.save();c.strokeStyle='rgba(125,211,252,.7)';c.lineWidth=4;c.setLineDash([8,8]);c.lineDashOffset=-t*60;c.beginPath();c.moveTo(G.beam[0].x,G.beam[0].y);c.lineTo(G.beam[1].x,G.beam[1].y);c.stroke();c.restore()}
  for(const b of G.bubbles)drawToken(c,b,t);
  for(const p of G.players)drawShip(c,p,t);
  for(const p of G.parts){c.globalAlpha=clamp(p.life*1.6,0,1);c.fillStyle=p.col;
    if(p.rect){c.save();c.translate(p.x,p.y);c.rotate(p.rot);c.fillRect(-p.r/2,-p.r,p.r,p.r*2);c.restore()}else if(p.star){starPath(c,p.x,p.y,p.r*1.4);c.fill()}else dot(c,p.x,p.y,p.r)}
  c.globalAlpha=1;
  for(const r of G.rings){c.strokeStyle=`rgba(255,255,255,${r.life*1.6})`;c.lineWidth=4;c.beginPath();c.arc(r.x,r.y,r.r,0,TAU);c.stroke()}
  c.textAlign='center';c.textBaseline='middle';
  for(const f of G.floats){c.globalAlpha=clamp(f.life*1.5,0,1);c.font=cfont(f.size);c.lineWidth=6;c.strokeStyle='rgba(25,30,55,.75)';c.strokeText(f.text,f.x,f.y);c.fillStyle=f.col;c.fillText(f.text,f.x,f.y)}
  c.globalAlpha=1;
  if(G.flash>0){c.fillStyle=`rgba(${G.flashCol},${G.flash*.45})`;c.fillRect(-20,-20,W+40,H+40)}
  c.restore()}

/* ---------- results ---------- */
function finish(){const g=G;G=null;$('#upgrade').hidden=true;$('#pauseMenu').hidden=true;
  const won=g.won,maxHearts=Math.max(...g.players.map(p=>p.down||p.out?0:p.hearts));
  const stars=won?(g.wrongs===0?3:maxHearts>=3?2:1):0,wavesCleared=won?WAVES:g.wave-1;
  const base=g.right*2+g.collected+wavesCleared*3+stars*5+g.bonusTreats;const earnedBy={};let prevBest=0,newBest=false;
  g.ids.forEach((id,i)=>{const p=PF(id);const earned=p.perks.includes('p_luck')?Math.round(base*1.25):base;earnedBy[id]=earned;p.cur=(p.cur|0)+earned;
    const old=p.best[g.id]|0;if(i===0){prevBest=old;newBest=g.score>old&&old>0}if(g.score>old)p.best[g.id]=g.score;
    p.stars[g.id]=Math.max(p.stars[g.id]|0,stars);
    p.skill[g.sector.id]=Math.round(clamp(g.L*.5+g.peakL*.5-.5,1,L_MAX)*100)/100;
    for(const l of g.log){const box=l.q.op==='tables'?p.facts:p.ops,key=l.q.op==='tables'?l.q.key:l.q.op;const f=box[key]||(box[key]={r:0,w:0});if(l.ok)f.r++;else f.w++}
    p.games=(p.games|0)+1;if(g.coop){p.coop.played++;if(won)p.coop.wins++}persistFor(id)});
  $('#resTitle').textContent=won?(stars===3?'Perfect world!':'World clear!'):g.topBeaten?'New top score!':'Game over';
  $('#resSub').textContent=`${g.sector.name} · World ${g.wi}${won?'':` · wave ${g.wave} of ${WAVES}`}${g.coop?` · ${kid(g.ids[0]).name} & ${kid(g.ids[1]).name}`:''}`;
  $('#resStars').innerHTML=starSvg(false).repeat(3);
  $('#resBest').innerHTML=newBest?`<span class="newbest">Beat your old top of ${prevBest.toLocaleString()}!</span>`:'';
  $('#rScore').textContent=g.score.toLocaleString();$('#rRight').textContent=`${g.right}/${g.asked}`;$('#rCombo').textContent=g.bestStreak;$('#rCur').innerHTML=`+${earnedBy[g.ids[0]]}`;
  $('#resTeam').textContent=g.coop?`${g.players.map(p=>`${kid(p.id).name} caught ${p.catches}`).join(' · ')} · ${g.team} teamwork catches · ${earnedBy[g.ids[1]]} treats each`:'';
  const miss=[...new Set(g.log.filter(l=>!l.ok).map(l=>`${l.q.text} = ${l.q.ans}`))];
  $('#practice').innerHTML=miss.length?`<h3 style="margin:8px 0">Ones to practice</h3><div class="chips">${miss.map(m=>`<span class="chip-m">${m}</span>`).join('')}</div>`:(g.asked?'<h3 style="margin:8px 0">Every answer right!</h3>':'');
  $('#nextBtn').hidden=!worldOpen(PF(g.ids[0]),g.si,g.wi+1);
  show('results');
  const sv=document.querySelectorAll('#resStars .st');for(let i=0;i<stars;i++)setTimeout(()=>{sv[i].classList.add('on');Snd.star(i);const r=sv[i].getBoundingClientRect();fxBurst(r.left+r.width/2,r.top+r.height/2,30)},500+i*450);
  if(won)setTimeout(()=>fxConfetti(160),300)}
$('#againBtn').onclick=()=>{if(lastWorld)startWorld(lastWorld[0],lastWorld[1])};
$('#nextBtn').onclick=()=>{if(lastWorld)startWorld(lastWorld[0],lastWorld[1]+1)};
$('#mapBtn').onclick=()=>{Snd.click();openMap()};

/* ---------- pause ---------- */
function setPause(on){if(!G)return;G.paused=on;$('#pauseMenu').hidden=!on;
  $('#pauseKeys').textContent=G.coop?'P1: W A S D to fly, F to shoot, Q bomb · P2: arrow keys, . to shoot, / bomb':'Arrow keys or W A S D to fly · Space to shoot · B for a bomb · on a touch screen drag to fly, hold FIRE to shoot';
  $('#fsBtn').hidden=!canFull();$('#fsBtn').setAttribute('aria-pressed',String(!!document.fullscreenElement));
  try{if(Snd.ctx){on?Snd.ctx.suspend():Snd.ctx.resume()}}catch(e){}G.players.forEach(p=>{p.held={};p.target=null})}
$('#pauseBtn').onclick=()=>setPause(!(G&&G.paused));
$('#fsBtn').onclick=()=>{Snd.click();if(document.fullscreenElement){try{document.exitFullscreen().catch(()=>{})}catch(e){}}else goFull()};
$('#resumeBtn').onclick=()=>setPause(false);
$('#quitBtn').onclick=()=>{setPause(false);if(G&&!G.finished){G.finished=true;finish()}};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&G&&!G.paused&&screen==='game')setPause(true)});
window.addEventListener('blur',()=>{if(G)G.players.forEach(p=>{p.held={}})});

/* ---------- input: keyboard maps, drag on the stage, the pad ---------- */
function keyMap(pi){return G.coop?KEYS[pi+1]:KEYS[0]}
function keyAction(map,k){for(const a in map)if(map[a].includes(k))return a;return null}
window.addEventListener('keydown',e=>{const k=e.key;if(screen!=='game'||!G)return;
  if(k==='Escape'||k==='p'||k==='P'){setPause(!G.paused);return}if(G.paused)return;
  if(G.phase==='upgrade'){if(/^[1-4]$/.test(k)){e.preventDefault();Snd.init();pickUp(+k-1)}
    else if(k==='ArrowLeft'||k==='a'||k==='A'||k==='ArrowUp'||k==='w'||k==='W'){e.preventDefault();setUpFocus(G.focus<0?0:G.focus-1)}
    else if(k==='ArrowRight'||k==='d'||k==='D'||k==='ArrowDown'||k==='s'||k==='S'){e.preventDefault();setUpFocus(G.focus<0?0:G.focus+1)}
    else if(k==='Enter'||k===' '||k==='f'||k==='F'||k==='.'){e.preventDefault();if(G.focus>=0){Snd.init();pickUp(G.focus)}}return}
  let used=false;G.players.forEach((p,i)=>{const a=keyAction(keyMap(i),k);if(!a)return;used=true;if(a==='bomb'){if(!e.repeat){Snd.init();useBomb(p)}}else{p.held[a]=true;p.target=null}});
  if(used)e.preventDefault()});
window.addEventListener('keyup',e=>{if(!G)return;G.players.forEach((p,i)=>{const a=keyAction(keyMap(i),e.key);if(a&&a!=='bomb')p.held[a]=false})});
let drag=null;
cv.addEventListener('pointerdown',e=>{if(!G||G.paused)return;Snd.init();e.preventDefault();if(e.pointerType!=='mouse')document.body.classList.add('touch');
  const p=G.players[0],r=cv.getBoundingClientRect();drag={id:e.pointerId,dx:p.x-(e.clientX-r.left),dy:p.y-(e.clientY-r.top)};try{cv.setPointerCapture(e.pointerId)}catch(err){}p.target={x:p.x,y:p.y}});
cv.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId||!G)return;e.preventDefault();const r=cv.getBoundingClientRect();G.players[0].target={x:e.clientX-r.left+drag.dx,y:e.clientY-r.top+drag.dy}});
const endDrag=e=>{if(!drag||(e&&e.pointerId!==undefined&&drag.id!==e.pointerId))return;drag=null;if(G)G.players[0].target=null};
cv.addEventListener('pointerup',endDrag);cv.addEventListener('pointercancel',endDrag);
function holdBtn(el,on,off){el.addEventListener('pointerdown',e=>{e.preventDefault();Snd.init();el.classList.add('held');try{el.setPointerCapture(e.pointerId)}catch(err){}on()});
  const up=()=>{el.classList.remove('held');off()};el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);el.addEventListener('contextmenu',e=>e.preventDefault())}
const p1=()=>G&&G.players[0];
holdBtn($('#padL'),()=>{const p=p1();if(p){p.held.left=true;p.target=null}},()=>{const p=p1();if(p)p.held.left=false});
holdBtn($('#padR'),()=>{const p=p1();if(p){p.held.right=true;p.target=null}},()=>{const p=p1();if(p)p.held.right=false});
holdBtn($('#padF'),()=>{const p=p1();if(p)p.held.fire=true},()=>{const p=p1();if(p)p.held.fire=false});
$('#padB').addEventListener('pointerdown',e=>{e.preventDefault();Snd.init();const p=p1();if(p)useBomb(p)});
$('#padB').addEventListener('contextmenu',e=>e.preventDefault());
$('#bombs').onclick=()=>{const p=p1();if(p)useBomb(p)};
window.addEventListener('touchstart',()=>document.body.classList.add('touch'),{passive:true,once:true});
window.addEventListener('resize',()=>{if(screen==='game'&&G)sizeStage()});

/* page-level effects (results, store) */
const fxc=$('#fx');let FX=[],fxOn=false;
function fxFit(){const d=DPR(),w=innerWidth,h=innerHeight;if(fxc.width!==Math.round(w*d)||fxc.height!==Math.round(h*d)){fxc.width=Math.round(w*d);fxc.height=Math.round(h*d)}const c=fxc.getContext('2d');c.setTransform(d,0,0,d,0,0);return {c,w,h}}
function fxBurst(x,y,n){for(let i=0;i<n;i++){const a=rand(0,TAU),sp=rand(120,420);FX.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rand(.6,1.1),r:rand(3,6),col:pickOne(CONFETTI),star:true,g:400})}}
function fxConfetti(n){for(let i=0;i<n;i++)FX.push({x:rand(0,innerWidth),y:rand(-120,-10),vx:rand(-60,60),vy:rand(80,260),life:rand(2.5,4),r:rand(5,9),col:pickOne(CONFETTI),rect:true,rot:rand(0,6),vr:rand(-8,8),g:40})}
function drawFX(dt){if(!FX.length){if(fxOn){const {c,w,h}=fxFit();c.clearRect(0,0,w,h);fxOn=false}return}
  fxOn=true;const {c,w,h}=fxFit();c.clearRect(0,0,w,h);
  for(const p of FX){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.g*dt;p.vx*=.99;if(p.rect)p.rot+=p.vr*dt;c.globalAlpha=clamp(p.life*1.5,0,1);c.fillStyle=p.col;
    if(p.rect){c.save();c.translate(p.x,p.y);c.rotate(p.rot);c.fillRect(-p.r/2,-p.r,p.r,p.r*2);c.restore()}else{starPath(c,p.x,p.y,p.r*1.4);c.fill()}}
  c.globalAlpha=1;FX=FX.filter(p=>p.life>0&&p.y<h+40)}

let last=performance.now();
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(screen==='game'&&G){if(!G.paused)update(dt);if(G)draw()}drawFX(dt);requestAnimationFrame(frame)}
renderMenu();renderSaveNote();requestAnimationFrame(frame);
(async()=>{
  if(CLOUD){Net.refresh();return}
  if(/[?&]nosave/.test(location.search)){setReady('off');return}
  let d=null;try{d=window.claude&&window.claude.use?await window.claude.use('db'):null}catch(e){d=null}
  if(!d){setReady('off');return}
  db=d;let gotAny=false;
  const fallback=setTimeout(()=>{if(!ready){if(gotAny)setReady('on');else{db=null;setReady('off')}}},10000);
  try{
    db.collection('players').onSnapshot(snap=>{gotAny=true;
      snap.docs.forEach(doc=>{if(KIDS.some(k=>k.id===doc.id)&&doc.exists)saves[doc.id]=normalize(doc.data())});
      if(!snap.metadata.fromCache&&!ready){clearTimeout(fallback);setReady('on')}
      if(screen==='menu')renderMenu();else if(screen==='hub')renderHub();else if(screen==='map')renderMap()
    },()=>{clearTimeout(fallback);db=null;setReady('off')});
  }catch(e){clearTimeout(fallback);db=null;setReady('off')}
})();
window.__ms={get G(){return G},normalize,get saves(){return saves},net:Net,cloud:CLOUD,MSMath,BUILD,SECTORS,WORLD_RAMP,UPGRADES,PERKS,
  input(i,h){if(G&&G.players[i]){Object.assign(G.players[i].held,h);G.players[i].target=null}},pickUp,useBomb,startWorld,setCoop(ids){coopIds=ids},player:()=>player,P:()=>P(),buyPerk:id=>buyPerk(PERKS[id]),worldOpen:(si,wi)=>worldOpen(P(),si,wi)};
if(CLOUD&&location.protocol.startsWith('http'))setTimeout(()=>{fetch(location.pathname,{cache:'no-store'}).then(r=>r.text()).then(t=>{const m=t.match(/const BUILD='([^']+)'/);if(m&&m[1]!==BUILD&&!location.search.includes('v='+m[1]))location.replace(location.pathname+'?v='+m[1])}).catch(()=>{})},1500);
})();
