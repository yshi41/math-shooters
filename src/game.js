(()=>{
'use strict';
const BUILD='2026-11-04.1';
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
  {id:'add',name:'Addition',sym:'+',blurb:{3:'Sums from 10 up to 1,000',4:'Sums from 20 up to 2,000'},bg:['#0f1b2d','#1b2f4d']},
  {id:'sub',name:'Subtraction',sym:'−',blurb:{3:'Take-aways from 10 up to 500',4:'Take-aways from 20 up to 5,000'},bg:['#0f2626','#173d3a']},
  {id:'tables',name:'Times Tables',sym:'×',blurb:{3:'Facts from 1×1 to 9×9, the 1s to 3s first',4:'Facts from 1×1 to 9×9, the 1s to 3s first'},bg:['#1a1230','#2d1f52']},
  {id:'mul',name:'Multiplication',sym:'×',blurb:{3:'From 5 × 5 up to 30 × 5',4:'From 5 × 10 up to 99 × 12'},bg:['#2a1414','#4a2323']},
  {id:'div',name:'Division',sym:'÷',blurb:{3:'From 25 ÷ 5 up to 300 ÷ 10',4:'From 50 ÷ 5 up to 900 ÷ 9'},bg:['#0f2416','#1b3d27']},
  {id:'mix',name:'Mixed',sym:'✦',blurb:{3:'Everything at once',4:'Everything at once'},bg:['#141538','#262a63']}];
const WORLDS_PER=6;
/* Endless: not on the map; waves keep coming, faster each time, a boss every 4th wave, a Blitz every 5th */
const ENDLESS={id:'endless',name:'Endless',sym:'∞',blurb:{3:'Wave after wave, faster and faster',4:'Wave after wave, faster and faster'},bg:['#1c1c28','#33334a']};
function endlessRamp(w){return {tier:Math.min(5,2+.3*(w-1)),speed:112+4*(w-1),cap:Math.min(6,3+Math.floor((w-1)/3)),crash:Math.max(1.6,2.6-.1*(w-1)),shooter:Math.max(1.2,1.8-.05*(w-1)),aim:true,crashHP:w>=4?2:1,tank:true}}
/* missions (Jetpack Joyride style): three at a time on the hub, each pays treats, the next one slides in when one is done.
   stat names the run counter it adds up; the order is the kid's sequence so two devices agree */
const MISSIONS=[
  {id:'catch25',name:'Catch 25 answers',n:25,stat:'catches',pay:30},
  {id:'rescue5',name:'Rescue 5 astronauts',n:5,stat:'rescues',pay:40},
  {id:'caps6',name:'Grab 6 power-ups',n:6,stat:'caps',pay:30},
  {id:'kills60',name:'Shoot down 60 enemies',n:60,stat:'kills',pay:40},
  {id:'clear3',name:'Clear 3 worlds',n:3,stat:'wins',pay:40},
  {id:'hydra2',name:'Pop 2 Math Hydras',n:2,stat:'hydras',pay:50},
  {id:'untouched1',name:'Clear a world without getting hit',n:1,stat:'untouched',pay:60},
  {id:'bees20',name:'Swat 20 bees',n:20,stat:'bees',pay:30},
  {id:'chain4',name:'Get a ×4 chain',n:1,stat:'chain4',pay:40},
  {id:'snatch3',name:'Shoot down 3 Snatchers',n:3,stat:'snatchers',pay:40},
  {id:'blitz1',name:'Finish a Blitz perfect',n:1,stat:'blitzPerfect',pay:50},
  {id:'sub1',name:'Clear a Subtraction world',n:1,stat:'sector:sub',pay:40},
  {id:'rocks15',name:'Break 15 asteroids',n:15,stat:'rocks',pay:30},
  {id:'streak8',name:'Get 8 right in a row',n:1,stat:'streak8',pay:40},
  {id:'laser5',name:'Fire the laser 5 times',n:5,stat:'lasers',pay:30},
  {id:'treats40',name:'Collect 40 treats in play',n:40,stat:'collected',pay:30},
  {id:'perfect1',name:'Clear a world with every answer right',n:1,stat:'perfect',pay:60},
  {id:'tables1',name:'Clear a Times Tables world',n:1,stat:'sector:tables',pay:40},
  {id:'bomb3',name:'Use 3 bombs',n:3,stat:'bombs',pay:20},
  {id:'boss1',name:'Beat a boss',n:1,stat:'boss',pay:80},
  {id:'catch60',name:'Catch 60 answers',n:60,stat:'catches',pay:60},
  {id:'endless5',name:'Reach wave 5 in Endless',n:1,stat:'endless5',pay:80},
  {id:'rescue10',name:'Rescue 10 astronauts',n:10,stat:'rescues',pay:70},
  {id:'caps15',name:'Grab 15 power-ups',n:15,stat:'caps',pay:60}];
const MISSION_BY={};MISSIONS.forEach(m=>MISSION_BY[m.id]=m);
/* the four medals a world can give (Sky Force style): shown on the map, +10 treats the first time each is earned */
const MEDALS={p:{name:'Perfect',ic:'✓',blurb:'every answer right'},u:{name:'Untouched',ic:'♥',blurb:'never hit'},r:{name:'Rescuer',ic:'☺',blurb:'all 3 astronauts'},b:{name:'Blitz',ic:'⚡',blurb:'a perfect bonus round'}};
const MEDAL_IDS=['p','u','r','b'];
/* the slow ramp inside a sector: numbers, bubble speed and enemies per world (index = world - 1) */
const WORLD_RAMP=[
  {tier:1.0,speed:85,cap:1,crash:4.5,shooter:3.0,aim:true,crashHP:1,tank:false},
  {tier:1.4,speed:90,cap:2,crash:4.0,shooter:2.8,aim:true,crashHP:1,tank:false},
  {tier:2.0,speed:95,cap:2,crash:3.6,shooter:2.6,aim:true,crashHP:1,tank:false},
  {tier:2.6,speed:100,cap:2,crash:3.2,shooter:2.2,aim:true,crashHP:1,tank:false},
  {tier:3.4,speed:106,cap:3,crash:2.8,shooter:2.0,aim:true,crashHP:2,tank:false},
  {tier:4.2,speed:112,cap:3,crash:2.6,shooter:1.8,aim:true,crashHP:2,tank:true}];
const MIX_TIERS=[2,2.6,3.2,3.8,4.4,5];
const WAVE_N=5,WAVES=3,L_MAX=20,LASER_T=2,CHARGE_T=25,BLITZ_T=15,CHAIN_T=1.5,SUPPLY_T=22;
/* capsule power-ups (Raiden style): dropped by enemies, last a few seconds, never taken away */
const POWERS={
  freeze:{name:'Freeze!',tag:'❄',col:'#7dd3fc',t:4,global:true},
  x2:{name:'Double Points',tag:'×2',col:'#fde68a',t:10,global:true},
  warp:{name:'Time Warp',tag:'◐',col:'#c4b5fd',t:8,global:true},
  over:{name:'Overdrive',tag:'⚡',col:'#f472b6',t:8},
  wing:{name:'Wingman',tag:'W',col:'#a78bfa',t:15},
  shield:{name:'Shield',tag:'◉',col:'#38bdf8'},
  cell:{name:'Laser Cell',tag:'+',col:'#34d399'},
  bomb:{name:'Bomb',tag:'B',col:'#f87171'}};
/* upgrades: picked between waves and kept for good (saved with the profile, never knocked loose).
   An entry with evo:[a,b] is an evolution (Vampire Survivors style): offered as a gold card once both of those are maxed */
const UPGRADES={
  rapid:{name:'Rapid Fire',tag:'RF',max:3,blurb:'Shoot faster'},
  spread:{name:'Wing Guns',tag:'WG',max:2,blurb:'Guns on the wings: one, then two'},
  power:{name:'Power Shot',tag:'PW',max:2,blurb:'Shots hit harder'},
  shield:{name:'Bubble Shield',tag:'SH',max:2,blurb:'Blocks one enemy hit, then recharges'},
  speed:{name:'Speedy Fins',tag:'SF',max:2,blurb:'Fly faster'},
  slow:{name:'Slow Bubbles',tag:'SB',max:2,blurb:'Answer bubbles fall slower'},
  heart:{name:'Extra Heart',tag:'HP',max:2,blurb:'One more heart, now and max'},
  bomb:{name:'Bomb Bag',tag:'BB',max:2,blurb:'One more bomb, now and max'},
  magnet:{name:'Treat Magnet',tag:'MG',max:2,blurb:'Pulls treats and hearts to you'},
  lucky:{name:'Lucky Drops',tag:'LK',max:2,blurb:'Enemies drop more treats and power-ups'},
  pierce:{name:'Piercing Shot',tag:'PI',max:1,blurb:'Shots go through the first enemy they hit'},
  drone:{name:'Buddy Drone',tag:'DR',max:2,blurb:'A drone flies with you and shoots when you do'},
  missile:{name:'Homing Missiles',tag:'HM',max:2,blurb:'Missiles that chase enemies while you shoot'},
  long:{name:'Long Lasting',tag:'LL',max:2,blurb:'Power-ups last 30% longer'},
  battery:{name:'Laser Battery',tag:'LB',max:2,blurb:'Laser charges faster and lasts longer'},
  plasma:{name:'Plasma Cannon',tag:'PC',max:1,blurb:'Fat blue bolts that hit twice as hard',evo:['rapid','power']},
  starburst:{name:'Starburst',tag:'ST',max:1,blurb:'A 7-way spread that pierces twice',evo:['spread','pierce']},
  guardian:{name:'Guardian',tag:'GD',max:1,blurb:'Shield recharges twice as fast and pops nearby shots',evo:['shield','heart']},
  hive:{name:'Hive',tag:'HV',max:1,blurb:'Two drones that fire missiles',evo:['drone','missile']},
  heal:{name:'Patch Up',tag:'+2',max:99,blurb:'Two hearts back right now',filler:true},
  treats:{name:'Treat Bag',tag:'$',max:99,blurb:'15 treats',filler:true}};
const UP_ORDER=['rapid','spread','power','shield','speed','slow','heart','bomb','magnet','lucky','pierce','drone','missile','long','battery','plasma','starburst','guardian','hive'];
const EVO_IDS=UP_ORDER.filter(id=>UPGRADES[id].evo);
function canEvo(p,id){const u=UPGRADES[id];return !!u.evo&&!p.up[id]&&u.evo.every(k=>(p.up[k]|0)>=UPGRADES[k].max)}
/* hub perks: bought once with treats, never lost */
const PERK_LIST=[
  {id:'p_heart',name:'Heart Locket',blurb:'Start every world with 6 hearts',price:60},
  {id:'p_bomb',name:'Spare Bomb',blurb:'Start every world with 2 bombs',price:80},
  {id:'p_magnet',name:'Treat Magnet',blurb:'Treats and hearts drift toward you',price:90},
  {id:'p_slow',name:'Calm Waters',blurb:'Answer bubbles fall 10% slower',price:100},
  {id:'p_fire',name:'Quick Trigger',blurb:'Start with Rapid Fire',price:120},
  {id:'p_shield',name:'Starter Shield',blurb:'Start with a Bubble Shield',price:150},
  {id:'p_grip',name:'Sticky Fins',blurb:'Fly 15% faster',price:160},
  {id:'p_luck',name:'Lucky Charm',blurb:'25% more treats from every world',price:180},
  {id:'p_pick4',name:'Big Choice',blurb:'Pick from 4 upgrades instead of 3',price:220},
  {id:'p_revive',name:'Second Wind',blurb:'Once per world, get back up with 2 hearts',price:300}];
const PERKS={};PERK_LIST.forEach(p=>PERKS[p.id]=p);
/* keyboard maps: solo takes both hands; together, player 1 has the left hand and player 2 the right.
   Entries match e.key or e.code, so left and right Ctrl/Shift can do different things */
const KEYS=[
  {left:['ArrowLeft','a','A'],right:['ArrowRight','d','D'],up:['ArrowUp','w','W'],down:['ArrowDown','s','S'],fire:['ControlLeft'],capture:[' ','Enter'],special:['ShiftLeft'],bomb:['b','B']},
  {left:['a','A'],right:['d','D'],up:['w','W'],down:['s','S'],fire:['f','F'],capture:[' '],special:['ShiftLeft'],bomb:['q','Q']},
  {left:['ArrowLeft'],right:['ArrowRight'],up:['ArrowUp'],down:['ArrowDown'],fire:['.','ControlRight'],capture:['Enter'],special:['ShiftRight'],bomb:['/']}];
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
  laser(){this.tone(160,1.6,{vol:.13,type:'sawtooth',slide:900});this.tone(320,1.6,{vol:.06,slide:1800});this.noise(1.4,{vol:.12,lp:3200})},
  special(){for(let i=0;i<6;i++)this.tone(300+i*120,.12,{vol:.12,slide:1600,delay:i*.07});this.noise(.6,{vol:.3,lp:1500,delay:.4})},
  win(){[[72,0,.14],[76,.12,.14],[79,.24,.14],[84,.36,.3],[79,.62,.12],[84,.74,.7]].forEach(([m,d,l])=>{this.tone(this.f(m),l,{type:'triangle',vol:.2,delay:d});this.tone(this.f(m-12),l,{vol:.1,delay:d})})},
  lose(){[[67,0,.3],[66,.32,.3],[65,.64,.3],[64,.96,.9]].forEach(([m,d,l])=>this.tone(this.f(m),l,{type:'triangle',vol:.18,delay:d}))},
  roar(){this.tone(110,.6,{type:'sawtooth',vol:.12,slide:70,lp:700});this.noise(.5,{vol:.15,lp:500})},
  star(i){this.tone(this.f(79+i*5),.35,{type:'triangle',vol:.2});this.tone(this.f(91+i*5),.25,{vol:.08})}
};

/* ---------- saves (online only) ---------- */
let screen='menu',ready=false,saveMode='loading';
const saves={};let player=null,coopIds=null;
function blank(){return {cur:0,games:0,stars:{},best:{},skill:{},facts:{},ops:{},medals:{},perks:[],ups:{},autoFire:true,stickLeft:false,missions:{active:[],done:0,next:0},coop:{played:0,wins:0}}}
/* deep copy first: the claude.ai db hands back frozen snapshots, and the end-of-world bookkeeping writes into these objects */
function normalize(d){const o=isObj(d)?JSON.parse(JSON.stringify(d)):{};const b=blank();b.cur=Math.max(0,o.cur|0);b.games=o.games|0;
  for(const k of ['stars','best','skill','facts','ops','medals'])b[k]=isObj(o[k])?o[k]:{};
  b.autoFire=o.autoFire!==false;b.stickLeft=o.stickLeft===true;
  const ms=isObj(o.missions)?o.missions:{};b.missions={active:(Array.isArray(ms.active)?ms.active:[]).filter(m=>isObj(m)&&MISSION_BY[m.id]).map(m=>({id:m.id,n:Math.max(0,m.n|0)})).slice(0,3),done:Math.max(0,ms.done|0),next:Math.max(0,ms.next|0)};
  b.perks=Array.isArray(o.perks)?o.perks.filter(x=>PERKS[x]):[];
  if(isObj(o.ups))for(const id of UP_ORDER){const n=Math.min(UPGRADES[id].max,Math.max(0,o.ups[id]|0));if(n)b.ups[id]=n}
  b.coop={played:(isObj(o.coop)&&o.coop.played)|0,wins:(isObj(o.coop)&&o.coop.wins)|0};return b}
function PF(id){return saves[id]||(saves[id]=blank())}
function P(){return PF(player)}
function kid(id){return KIDS.find(k=>k.id===id)||KIDS[0]}
function totalStars(p){let s=0;if(p)for(const k in p.stars)s+=p.stars[k]|0;return s}
function totalMedals(p){let s=0;if(p)for(const k in p.medals)if(p.medals[k])s++;return s}
/* the kid's three missions, topped up from the pool in order (so a fresh save starts with the first three) */
function missionsOf(p){const m=p.missions||(p.missions={active:[],done:0,next:0});
  while(m.active.length<3&&m.active.length<MISSIONS.length){const id=MISSIONS[m.next%MISSIONS.length].id;m.next++;if(!m.active.some(a=>a.id===id))m.active.push({id,n:0})}return m}
function endlessOpen(p){for(const k in p.stars)if(/-3$/.test(k)&&p.stars[k])return true;return false}
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
      if(r.conflict){adopt(id,r.rev,r.state);toast('Another device saved first, so its copy was loaded.')}
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
function goFull(){if(!canFull()||document.fullscreenElement)return;try{const r=document.documentElement.requestFullscreen({navigationUI:'hide'});if(r&&r.then)r.then(()=>{try{navigator.keyboard&&navigator.keyboard.lock&&navigator.keyboard.lock(['KeyW','KeyT','KeyN','KeyQ']).catch(()=>{})}catch(e){}}).catch(()=>{})}catch(e){}}
window.addEventListener('beforeunload',e=>{if(G&&!G.finished&&!navigator.webdriver){e.preventDefault();e.returnValue=''}});
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
  $('#statMedals').innerHTML=`<span class="md-ic">🏅</span> ${totalMedals(p)}/${SECTORS.length*WORLDS_PER*MEDAL_IDS.length}`;
  $('#coopBtn').hidden=!canCoop();renderStore();renderMissions();
  const eo=endlessOpen(p);$('#endlessBtn').hidden=!eo;$('#endlessBest').textContent=p.best['endless-wave']?`Best: wave ${p.best['endless-wave']} · ${(p.best.endless|0).toLocaleString()}`:'How far can you get?';
  $('#tSound').setAttribute('aria-pressed',String(Snd.on));$('#tAuto').setAttribute('aria-pressed',String(p.autoFire!==false));applyTouchLayout()}
function renderMissions(){const p=P(),m=missionsOf(p),box=$('#missions');box.innerHTML='';
  m.active.forEach(a=>{const d=MISSION_BY[a.id],k=Math.min(1,a.n/d.n),el=document.createElement('div');el.className='mission';el.dataset.mission=a.id;
    el.innerHTML=`<div class="m-top"><b>${d.name}</b><span>${treatSvg} ${d.pay}</span></div><div class="m-bar"><i style="width:${Math.round(k*100)}%"></i></div><small>${Math.min(a.n,d.n)} / ${d.n}</small>`;box.append(el)});
  $('#missionsDone').textContent=m.done?`${m.done} done`:''}
function renderStore(){const p=P();const box=$('#store');box.innerHTML='';
  PERK_LIST.forEach(pk=>{const own=p.perks.includes(pk.id);const d=document.createElement('div');d.className='perk';d.dataset.perk=pk.id;d.innerHTML=`<div><b>${pk.name}</b><span>${pk.blurb}</span></div>`;
    const b=document.createElement('button');b.type='button';b.className='btn btn-sm'+(own?' btn-ghost':'');
    if(own){b.textContent='Owned';b.disabled=true}else{b.innerHTML=`${treatSvg} ${pk.price}`;if(p.cur<pk.price){b.disabled=true;b.title=`${pk.price-p.cur} more treats needed`}}
    b.onclick=()=>buyPerk(pk);d.append(b);box.append(d)})}
function buyPerk(pk){const p=P();if(!pk||p.perks.includes(pk.id)||p.cur<pk.price)return;Snd.init();p.cur-=pk.price;p.perks.push(pk.id);persist();Snd.coin();toast(`${pk.name} is yours!`);fxBurst(innerWidth/2,innerHeight*.4,60);renderHub()}
function tog(id,get,set){const b=$(id);b.onclick=()=>{Snd.init();set(!get());b.setAttribute('aria-pressed',String(get()));Snd.click()}}
tog('#tSound',()=>Snd.on,v=>Snd.on=v);
/* auto-fire (back since 11/3): per player, saved with the profile; the fire key always works too */
function setAuto(v){const p=P();p.autoFire=!!v;persist();if(G)for(const q of G.players)if(q.id===player)q.auto=p.autoFire;$('#tAuto').setAttribute('aria-pressed',String(p.autoFire));$('#pAuto').setAttribute('aria-pressed',String(p.autoFire));applyTouchLayout()}
tog('#tAuto',()=>P().autoFire!==false,setAuto);
tog('#pAuto',()=>P().autoFire!==false,setAuto);
/* touch layout: the thumbstick side (right unless the profile says stickLeft), the button cluster on the other side, FIRE only without auto-fire */
function applyTouchLayout(){const p=player?P():blank(),left=p.stickLeft===true;$('#touchUI').classList.toggle('swap',left);$('#tbFire').hidden=!G||G.players[0].auto;
  $('#tStick').setAttribute('aria-pressed',String(left));$('#pStick').setAttribute('aria-pressed',String(left))}
function setStick(v){P().stickLeft=!!v;persist();applyTouchLayout()}
tog('#tStick',()=>P().stickLeft===true,setStick);
tog('#pStick',()=>P().stickLeft===true,setStick);
$('#switchBtn').onclick=()=>{Snd.click();show('menu');renderMenu()};
$('#playBtn').onclick=()=>{Snd.init();Snd.click();coopIds=null;openMap()};
$('#endlessBtn').onclick=()=>{Snd.init();Snd.click();coopIds=null;startWorld('endless',1)};
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
      b.innerHTML=`<span class="wn">${o?w:'🔒'}</span><span class="ws">${[0,1,2].map(i=>starSvg(i<sc)).join('')}</span><span class="md">${MEDAL_IDS.map(m=>`<i class="${p.medals[id+'/'+m]?'on':''}" title="${MEDALS[m].name}">${MEDALS[m].ic}</i>`).join('')}</span>${p.best[id]?`<small>${(p.best[id]|0).toLocaleString()}</small>`:''}`;
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
  const p={i,id,col:i?'#fb923c':'#38bdf8',x:0,y:0,vx:0,mvx:0,mvy:0,hearts:5,maxHearts:5,bombs:1,maxBombs:1,up:{},fireInt:.33,fireT:0,speedMul:1,magnetR:0,lucky:0,shieldOn:false,shieldT:0,inv:0,down:false,downT:0,out:false,catches:0,held:{},target:null,firing:false,wind:perks.includes('p_revive'),perks,charge:1,laser:0,laserT:0,muzzle:0,
    auto:s.autoFire!==false,stick:null,pw:{over:0,wing:0},longMul:1,chargeMul:1,laserLen:LASER_T,droneT:0,missileT:0};
  if(perks.includes('p_heart')){p.maxHearts=6;p.hearts=6}if(perks.includes('p_bomb')){p.maxBombs=2;p.bombs=2}return p}
function startWorld(si,wi){Snd.init();Snd.click();goFull();const endless=si==='endless';if(endless){wi=1;si=0}const s=endless?ENDLESS:SECTORS[si],ids=coopIds||[player];lastWorld=[endless?'endless':si,wi];
  const ramp=endless?endlessRamp(1):WORLD_RAMP[wi-1],tier=endless?2:s.id==='mix'?MIX_TIERS[wi-1]:ramp.tier,grade=Math.min(...ids.map(id=>kid(id).grade));
  const p0=PF(ids[0]),saved=(p0.skill&&p0.skill[endless?'mix':s.id])||3;
  show('game');$('#pauseMenu').hidden=true;$('#upgrade').hidden=true;stage.classList.toggle('wide',ids.length>1);hudCache={};stick=null;
  G={si,wi,sector:s,id:endless?'endless':s.id+'-'+wi,endless,waves:endless?99:WAVES,ramp,tier,grade,coop:ids.length>1,ids,players:ids.map((id,i)=>mkPlayer(i,id)),t:0,phase:'intro',phaseAt:2.4,wave:1,waveT:0,correct:0,asked:0,right:0,wrongs:0,score:0,streak:0,bestStreak:0,lastCatcher:-1,team:0,
    bubbles:[],bullets:[],enemies:[],eshots:[],pickups:[],parts:[],rings:[],floats:[],dots:[],q:null,qOpen:false,nextQAt:-1,log:[],missed:[],bag:[],pool:null,poolTop:0,
    L:Math.max(2,saved-2),warm:Math.max(2,saved),peakL:0,shake:0,flash:0,flashCol:'255,255,255',offer:[],taken:[],pickTurn:0,focus:-1,spawnT:1.5,shooterT:2,hydraT:6,tankUp:false,bonusTreats:0,collected:0,glowT:0,paused:false,finished:false,endAt:0,
    top:p0.best[endless?'endless':s.id+'-'+wi]|0,topBeaten:false,slowMul:1,won:false,beam:null,bs:1,cols:5,r:30,shipW:56,shipH:62,
    pw:{freeze:0,x2:0,warp:0},warns:[],swarms:{},swarmN:0,chain:0,chainT:0,lastCm:1,rockT:7,snatchT:9,swarmT:8,astroT:5,capT:0,hudT:0,blitz:null,blitzDone:false,blitzEnded:false,scene:null,
    stats:{catches:0,rescues:0,hydras:0,caps:0,snatchers:0,chainMax:0,blitzKills:0,blitzPerfect:0,hurt:0,astroN:0,kills:0,bees:0,rocks:0,lasers:0,bombs:0,boss:0}};
  G.peakL=G.L;sizeStage();
  /* the sector's backdrop: a tinted sky, one soft planet and two nebula blobs that drift slowly */
  const bg=s.bg||SECTORS[0].bg;stage.style.background=`linear-gradient(180deg,${bg[0]},${bg[1]})`;document.body.style.setProperty('--bg',bg[0]);document.body.style.setProperty('--bg2',bg[1]);
  G.scene={planet:{x:rand(.15,.85),y:rand(.08,.35),r:rand(.1,.17),col:shadeHex(bg[1],.3),ring:Math.random()<.5,tilt:rand(-.4,.4)},nebs:[0,1].map(()=>({x:Math.random(),y:Math.random(),r:rand(.25,.4),col:shade(bg[1],.45,.16)}))};
  G.players.forEach((p,i)=>{p.x=G.coop?W*(i?.7:.3):W/2;p.y=H-G.shipH*.9;
    const kept=PF(p.id).ups||{};for(const id of UP_ORDER)for(let k=0;k<(kept[id]|0);k++)applyUp(p,id,true);
    if(p.perks.includes('p_fire')&&!p.up.rapid)applyUp(p,'rapid',true);if(p.perks.includes('p_shield')&&!p.up.shield)applyUp(p,'shield',true);recompute(p)});
  for(let i=0;i<20;i++)G.dots.push({x:Math.random(),y:Math.random(),s:rand(1,3)});
  $('#eq').className='eq';$('#eq').textContent='Ready?';updateHUD();
  banner(endless?'Endless':`${s.name} · World ${wi}`,endless?'How many waves can you clear?':G.coop?'Fly into the right answer together!':'Fly into the right answer!');
  applyTouchLayout();$('#gameHint').textContent=G.coop?'P1: W A S D to fly, F to shoot, Space to capture, left Shift laser, Q bomb · P2: arrow keys, . or right Ctrl to shoot, Enter to capture, right Shift laser, / bomb · auto-fire follows each player’s setting · P to pause':'Arrow keys or W A S D to fly · Space captures a bubble or astronaut in reach · it shoots on its own (left Ctrl too) · left Shift for the laser · B for a bomb · P to pause'}
function recompute(p){const u=p.up;p.fireInt=[.33,.25,.2,.16][Math.min(3,u.rapid|0)];p.speedMul=Math.pow(1.2,u.speed|0)*(p.perks.includes('p_grip')?1.15:1);
  p.magnetR=Math.max(p.perks.includes('p_magnet')?100:0,[0,120,200][Math.min(2,u.magnet|0)]);p.lucky=u.lucky|0;
  p.longMul=1+.3*(u.long|0);p.chargeMul=[1,.8,.65][Math.min(2,u.battery|0)];p.laserLen=LASER_T+.5*(u.battery|0);
  if(G){let sm=1;for(const q of G.players)sm=Math.min(sm,Math.pow(.8,q.up.slow|0));if(G.players.some(q=>q.perks.includes('p_slow')))sm*=.9;G.slowMul=sm}}
function applyUp(p,id,quiet){const u=UPGRADES[id];p.up[id]=(p.up[id]|0)+1;
  if(id==='heart'){p.maxHearts=Math.min(7,p.maxHearts+1);p.hearts=Math.min(p.maxHearts,p.hearts+1)}
  else if(id==='bomb'){p.maxBombs++;p.bombs=Math.min(p.maxBombs,p.bombs+1)}
  else if(id==='heal'){p.hearts=Math.min(p.maxHearts,p.hearts+2)}
  else if(id==='treats'){G.bonusTreats+=15}
  else if(id==='shield'&&!p.shieldOn&&p.shieldT<=0)p.shieldOn=true;
  recompute(p);if(!quiet){if(u.evo){banner(u.name+'!','Evolution');burst(p.x,p.y,50);Snd.win()}else float(`${u.name}${u.max<99?' L'+p.up[id]:''}!`,p.x,p.y-60,p.col,22)}updateHUD()}

/* problems and answer bubbles */
/* Endless draws from the Mixed generator (its own sector id would fall through to division) */
function probCat(){return G.endless?'mix':G.sector.id}
function spawnProblem(){const q=MSMath.problem(probCat(),G.grade,G.tier,G,PF(G.ids[0]).facts);G.q=q;G.qOpen=true;G.asked++;
  const n=3,opts=MSMath.choices(q,n),cols=shuffle([...Array(G.cols).keys()]).slice(0,n);
  opts.forEach((v,i)=>G.bubbles.push({v,ok:v===q.ans,col:cols[i],x:colX(cols[i]),y:-G.r-i*H*.14,state:'live',alpha:1,ph:rand(0,TAU),hold:0}));
  const eq=$('#eq');eq.className='eq wait';eq.innerHTML=eqHTML(q);updateHUD()}
function eqHTML(q){return `${q.a} <span class="x">${q.sym}</span> ${q.b} = <b class="ans">?</b>`}
function eqDone(q){return `${q.a} <span class="x">${q.sym}</span> ${q.b} = <b class="ans">${q.ans}</b>`}
function bubbleSpeed(){const Lmod=clamp(.9+.02*G.L,.8,1.25),wf=G.endless?1.1:1+.06*(G.wave-1);return G.ramp.speed*wf*Lmod*G.slowMul*G.bs*(G.grade===3?.9:1)}
function mult(){return 1+Math.min(4,Math.floor(G.streak/3))}
/* Glow Mode and the Double Points capsule stack; the kill chain multiplies enemy points only */
function scoreMul(){return (G.glowT>0?2:1)*(G.pw.x2>0?2:1)}
function chainMul(){return 1+Math.min(3,Math.floor(G.chain/3))}
function bossWave(){return G.endless?G.wave%4===0:(G.ramp.tank&&G.wave===G.waves)}
function bossAlive(){return G.enemies.some(e=>(e.kind==='tank'||e.kind==='boss')&&e.hp>0&&!e.flee)}
/* a bubble the Snatcher is carrying goes back to normal play (or fades with the rest) when its problem is over */
function releaseHeld(b){const e=b.by;b.by=null;if(e){e.held=null;e.tgt=null;e.mode='leave'}}
function catchBubble(p,b){const q=G.q;if(!q||!G.qOpen)return;G.qOpen=false;
  if(b.ok){b.state='ok';b.hold=.3;G.right++;G.correct++;p.catches++;G.stats.catches++;let team=0;if(G.coop&&G.lastCatcher>=0&&G.lastCatcher!==p.i){G.team++;team=1}G.lastCatcher=p.i;
    G.streak++;G.bestStreak=Math.max(G.bestStreak,G.streak);G.log.push({q,ok:true});
    const pts=Math.round((100+15*G.wi)*(mult()+team)*scoreMul());G.score+=pts;checkTop();adapt(.3);
    burst(b.x,b.y,30);float('+'+pts,b.x,b.y-40,'#fff',30);float(team?`Teamwork! ×${mult()+team}`:pickOne(PRAISE),b.x,b.y-80,team?'#fde68a':'#fff',22);
    addCharge(p,.25);Snd.pop(G.streak);$('#eq').className='eq ok';$('#eq').innerHTML=eqDone(q);milestone();
    for(const o of G.bubbles)if(o!==b&&(o.state==='live'||o.state==='held')){releaseHeld(o);o.state='fade';o.hold=0}
    if(G.correct>=WAVE_N&&!(bossWave()&&bossAlive()))waveClear();else G.nextQAt=G.t+.7}
  else{b.state='bad';b.hold=.3;G.wrongs++;G.streak=0;endGlow();G.log.push({q,ok:false});G.missed.push(q);
    for(const o of G.bubbles)if(o!==b&&(o.state==='live'||o.state==='held')){releaseHeld(o);if(o.ok){o.state='hint';o.hold=1.4}else{o.state='fade';o.hold=0}}
    puff(b.x,b.y);G.shake=12;G.flash=.3;G.flashCol='255,110,110';Snd.wrong();adapt(-.8,'slow');
    float(`= ${q.ans}`,b.x,b.y-44,'#fff',26);$('#eq').className='eq miss';$('#eq').innerHTML=eqDone(q);
    loseHeart(p);p.inv=1.2;G.nextQAt=G.t+1.6}
  updateHUD()}
function updateBubbles(dt){const fz=G.pw.freeze>0,v=fz?0:bubbleSpeed()*(G.pw.warp>0?.5:1);const live=G.bubbles.filter(b=>b.state==='live');
  for(const b of G.bubbles){if(!fz)b.ph+=dt;
    if(b.state==='held'){const e=b.by;if(e&&e.hp>0&&!e.dead&&!e.gone&&!e.flee){b.x=e.x;b.y=e.y+e.r+G.r*.7}else{b.by=null;b.state='live'}}
    else if(b.state==='live'){b.y+=v*dt;b.x=colX(b.col)+Math.sin(b.ph*1.3)*8;
      if(b.y>H+G.r){b.y=-G.r-rand(0,H*.1);const free=[];for(let c=0;c<G.cols;c++){if(c!==b.col&&!live.some(o=>o!==b&&o.col===c))free.push(c)}
        if(free.length)b.col=pickOne(free);else{let top=0;for(const o of live)if(o!==b&&o.col===b.col)top=Math.min(top,o.y);b.y=Math.min(b.y,top-2.2*G.r)}}}
    else{if(b.hold>0)b.hold-=dt;else b.alpha-=dt*2;if(b.state==='hint')b.y+=v*.5*dt}}
  G.bubbles=G.bubbles.filter(b=>b.alpha>0);
  /* bubbles are caught with CAPTURE (tryCapture), never by flying into them */
  if(G.phase==='run'&&!G.qOpen&&G.nextQAt>=0&&G.t>=G.nextQAt){G.nextQAt=-1;spawnProblem()}}

/* hearts, downs and rescues */
function loseHeart(p){p.hearts--;if(p.hearts<=0){p.hearts=0;downPlayer(p)}updateHUD()}
function downPlayer(p){if(p.wind){p.wind=false;p.hearts=2;p.inv=2.5;banner('Second Wind!',`${kid(p.id).name} is back up`);Snd.glow();return}
  p.down=true;p.laser=0;p.downT=G.coop?12:99;p.firing=false;p.held={};p.target=null;puff(p.x,p.y);
  if(!G.coop||G.players.every(q=>q.down||q.out)){G.phase='lost';G.endAt=G.t+3;G.qOpen=false;banner('Game over',`Score ${G.score.toLocaleString()}`);Snd.lose()}
  else{float(`${kid(p.id).name} needs a rescue!`,p.x,p.y-70,'#fff',22);Snd.lose()}}
function revive(p,by){p.down=false;p.out=false;p.hearts=2;p.inv=2.5;p.downT=0;burst(p.x,p.y,40);banner('Rescued!',`${kid(by.id).name} saved ${kid(p.id).name}`);Snd.win();updateHUD()}
function hitPlayer(p){if(p.inv>0||p.down||p.out||G.phase!=='run')return;
  if(p.shieldOn){p.shieldOn=false;p.shieldT=((p.up.shield|0)>=2?7:12)*(p.up.guardian?.5:1);p.inv=.6;G.rings.push({x:p.x,y:p.y,r:20,life:.45});Snd.hit();float('Shield!',p.x,p.y-60,'#7dd3fc',20);updateHUD();return}
  G.stats.hurt++;loseHeart(p);p.inv=1.2;G.shake=12;G.flash=.3;G.flashCol='255,110,110';Snd.hurt();puff(p.x,p.y);updateHUD()}
function shipsAlive(){return G.players.filter(p=>!p.down&&!p.out)}
function nearestShip(x,y){let best=null,bd=1e9;for(const p of shipsAlive()){const d=dist(x,y,p.x,p.y);if(d<bd){bd=d;best=p}}return best}

/* waves */
function startRun(){G.phase='run';G.waveT=0;spawnProblem();if(bossWave()&&!G.tankUp){G.tankUp=true;if(G.endless?(G.wave/4)%2===0:G.si%2)spawnBoss();else spawnTank()}}
function waveClear(){G.phase='clear';G.phaseAt=G.t+1.8;G.qOpen=false;G.nextQAt=-1;
  for(const e of G.enemies)e.flee=true;G.eshots=[];for(const b of G.bubbles)if(b.state==='live'||b.state==='held'){releaseHeld(b);b.state='fade';b.hold=0}
  let hearts=0;for(const p of G.players)if(!p.down&&!p.out)hearts+=p.hearts;
  if(G.wave>=G.waves)G.won=true;  /* the world is cleared now, whatever happens during the banner */
  const bonus=150*G.wave+50*hearts;G.score+=bonus;checkTop();
  for(const p of G.players){if(p.down||p.out)continue;p.hearts=Math.min(p.maxHearts,p.hearts+1);p.bombs=Math.min(p.maxBombs,p.bombs+1)}
  banner(G.wave<G.waves?`Wave ${G.wave} clear!`:'World clear!',`+${bonus} bonus`);Snd.glow();confetti(G.wave<G.waves?40:140);updateHUD()}
function afterClear(){if(G.blitzEnded){G.blitzEnded=false;nextWave();return}if(G.wave<G.waves)openUpgrade();else{G.phase='won';G.won=true;G.endAt=G.t+2.4;Snd.win();confetti(120)}}
function nextWave(){G.wave++;G.correct=0;G.phase='intro';G.phaseAt=G.t+1.6;if(G.endless){G.wi=G.wave;G.ramp=endlessRamp(G.wave);G.tier=G.ramp.tier;G.tankUp=false;G.blitzDone=false}G.spawnT=1.5;G.shooterT=2;G.hydraT=6;G.rockT=rand(5,8);G.snatchT=9;G.swarmT=8;G.astroT=rand(3,8);G.warns=[];
  for(const p of G.players)if(p.down||p.out){p.down=false;p.out=false;p.hearts=2;p.inv=2}
  banner(`Wave ${G.wave}`,bossWave()?'Boss incoming!':G.wave===G.waves?'Last wave!':'');updateHUD()}
function openUpgrade(){G.phase='upgrade';G.pickTurn=0;G.taken=[];G.focus=-1;const n=G.coop||G.players[0].perks.includes('p_pick4')?4:3;
  const cands=shuffle(UP_ORDER.filter(id=>!UPGRADES[id].evo&&G.players.some(p=>(p.up[id]|0)<UPGRADES[id].max)));
  /* an evolution that someone has just earned takes the first slot as a gold card */
  const evo=EVO_IDS.find(id=>G.players.some(p=>canEvo(p,id)));G.offer=evo?[evo].concat(cands.slice(0,n-1)):cands.slice(0,n);
  while(G.offer.length<n)G.offer.push(G.players.some(p=>p.hearts<p.maxHearts)&&!G.offer.includes('heal')?'heal':'treats');
  renderOffer();$('#upgrade').hidden=false}
function renderOffer(){const p=G.players[G.pickTurn];$('#upTitle').textContent=`Wave ${G.wave} clear!`;
  $('#upWho').textContent=G.coop?`${kid(p.id).name} picks an upgrade (press 1-${G.offer.length}, or arrows and Enter)`:'Pick an upgrade';
  const box=$('#upCards');box.innerHTML='';G.offer.forEach((id,i)=>{const u=UPGRADES[id],lv=p.up[id]|0,taken=G.taken.includes(i),locked=!!u.evo&&!canEvo(p,id);const b=document.createElement('button');b.type='button';b.className='up-card'+(taken?' taken':'')+(i===G.focus?' focus':'')+(u.evo?' evo':'');b.disabled=taken||locked;b.dataset.up=id;
    b.innerHTML=`<small>${i+1}</small>${u.evo?'<em>Evolution!</em>':''}<b>${u.name}</b><span>${locked?'Not yours yet':u.blurb}</span><i>${u.max<99?'●'.repeat(lv)+'○'.repeat(Math.max(0,u.max-lv)):''}</i>`;b.onclick=()=>{Snd.init();pickUp(i)};box.append(b)})}
function pickUp(i){if(!G||G.phase!=='upgrade'||G.taken.includes(i)||i<0||i>=G.offer.length)return;const p=G.players[G.pickTurn],id=G.offer[i],u=UPGRADES[id];
  if(u.evo&&!canEvo(p,id))return;
  if((p.up[id]|0)>=u.max){G.bonusTreats+=15;float('Already maxed: +15 treats',p.x,p.y-60,'#fff',20)}else applyUp(p,id);
  Snd.coin();G.taken.push(i);
  if(G.coop&&G.pickTurn===0){G.pickTurn=1;G.focus=-1;renderOffer();return}
  $('#upgrade').hidden=true;if((G.endless?G.wave%5===0:G.wave===2)&&!G.blitzDone)startBlitz();else nextWave()}
/* the Bonus Blitz (Galaga's Challenging Stage): after the wave-2 pick, 15 seconds where nothing shoots and nothing hurts;
   two formations of eight sweep through, treats rain, and shooting all 16 is a perfect */
function startBlitz(){G.phase='blitz';G.blitzDone=true;G.blitz={t:BLITZ_T,kills:0,spawnT:.8,wave:0};G.qOpen=false;G.nextQAt=-1;
  for(const b of G.bubbles)if(b.state==='live'||b.state==='held'){releaseHeld(b);b.state='fade';b.hold=0}
  for(const e of G.enemies)e.flee=true;G.eshots=[];G.warns=[];
  const eq=$('#eq');eq.className='eq ok';eq.innerHTML='<b class="ans">Bonus round!</b>';banner('Bonus Blitz!','Nothing can hurt you. Shoot everything!');Snd.glow();updateHUD()}
function updateBlitz(dt){const b=G.blitz;b.t-=dt;b.spawnT-=dt;
  if(b.spawnT<=0&&b.wave<2){b.wave++;b.spawnT=5.5;spawnSwarm(8,true)}
  if(Math.random()<dt*1.5)G.pickups.push({kind:'treat',x:rand(30,W-30),y:-10,vy:120*G.bs});
  if(b.t<=0||(b.wave>=2&&!G.enemies.some(e=>e.blitz&&!e.flee)))endBlitz()}
function endBlitz(){const b=G.blitz;G.blitz=null;for(const e of G.enemies)e.flee=true;const perfect=b.kills>=16;G.stats.blitzKills=b.kills;
  if(perfect){G.stats.blitzPerfect=1;const pts=300*scoreMul();G.score+=pts;checkTop();banner('PERFECT!',`+${pts} and a power-up`);dropCap(W/2,H*.3);Snd.win();confetti(60)}
  else banner(`${b.kills} of 16`,'Bonus round over');
  for(const p of G.players)if(!p.down&&!p.out)p.bombs=Math.min(p.maxBombs,p.bombs+1);
  G.phase='clear';G.phaseAt=G.t+1.8;G.blitzEnded=true;updateHUD()}
function setUpFocus(i){if(!G||G.phase!=='upgrade')return;G.focus=clamp(i,0,G.offer.length-1);renderOffer()}

/* enemies */
function spawnCrasher(){let x=rand(30,W-30);for(let k=0;k<8&&G.waveT<1&&G.players.some(p=>Math.abs(p.x-x)<60);k++)x=rand(30,W-30);
  G.enemies.push({kind:'crash',x,y:-24,vx:0,vy:120*G.bs,hp:G.ramp.crashHP,r:18*G.bs,dive:false,tx:x,wob:rand(0,TAU),fireT:rand(.8,1.6),flash:0,score:50})}
function spawnShooter(){const side=ri(2);G.enemies.push({kind:'shoot',x:side?W+30:-30,y:H*rand(.22,.3),vx:(side?-1:1)*90*G.bs,vy:0,hp:2,r:22*G.bs,fireT:G.ramp.shooter,life:9,flash:0,score:120,inside:false})}
function spawnTank(){const hp=6+G.si+(G.endless?Math.floor(G.wave/2):0);G.enemies.push({kind:'tank',x:W/2,y:-70,vx:0,vy:40*G.bs,hp,max:hp,r:40*G.bs,fireT:3,flash:0,score:300,angry:false})}
/* a red chevron at the screen edge for .7 s before something flies in from that side */
function warn(side,y){G.warns.push({side,y,t:.7})}
/* asteroids: no guns, just in the way; a big one splits into two small ones */
function spawnRock(small,x,y,vx){const big=!small,r=(big?26:14)*G.bs,verts=[];for(let i=0;i<9;i++)verts.push(rand(.72,1.06));
  const e={kind:'rock',big,x:x==null?rand(40,W-40):x,y:y==null?-30:y,vx:vx==null?rand(-25,25)*G.bs:vx,vy:(big?rand(45,70):rand(60,90))*G.bs,hp:big?3:1,r,rot:rand(0,TAU),vr:rand(-1.2,1.2),verts,
    crat:[[rand(-.5,.5),rand(-.5,.5),rand(.15,.3)],[rand(-.5,.5),rand(-.5,.5),rand(.1,.2)]],flash:0,score:big?40:30};G.enemies.push(e);return e}
/* the Bubble Snatcher (Galaga's tractor beam): grabs an answer bubble and flies off with it; shoot it to get the bubble back */
function spawnSnatcher(){const side=ri(2),y=H*.2;warn(side,y);
  const e={kind:'snatch',x:side?W+100:-100,y,vx:0,vy:0,hp:G.wi>=4?3:2,r:20*G.bs,mode:'hunt',tgt:null,held:null,wait:0,flash:0,score:150,ph:rand(0,TAU),dir:side?-1:1};G.enemies.push(e);
  float('Mine now!',side?W-80:80,y+44,'#fca5a5',20);return e}
function updateSnatch(e,edt){const sp=170*G.bs;e.ph+=edt;
  if(e.mode==='hunt'){if(!e.tgt||e.tgt.state!=='live'){const live=G.bubbles.filter(b=>b.state==='live'&&b.y>0&&b.y<H*.8);const ok=live.find(b=>b.ok);
      e.tgt=(ok&&Math.random()<.7)?ok:(live.length?live.reduce((a,b)=>dist(e.x,e.y,b.x,b.y)<dist(e.x,e.y,a.x,a.y)?b:a):null)}
    if(!e.tgt){e.wait+=edt;e.x+=clamp(W/2-e.x,-sp*edt,sp*edt)*.5;if(e.wait>6)e.mode='leave';return}
    const tx=e.tgt.x,ty=e.tgt.y-e.r-G.r*.7,d=dist(e.x,e.y,tx,ty);
    if(d<10){e.held=e.tgt;e.held.state='held';e.held.by=e;e.tgt=null;e.mode='flee';float('Got it! Shoot it down!',e.x,e.y-44,'#fff',20);Snd.hit()}
    else{const s=Math.min(sp*edt,d);e.x+=(tx-e.x)/d*s;e.y+=(ty-e.y)/d*s}}
  else if(e.mode==='flee'){e.x+=e.dir*50*G.bs*edt;e.y-=100*G.bs*edt;if(e.y<-80)escapeWith(e)}
  else{e.y-=220*edt;if(e.y<-80)e.gone=true}}
function escapeWith(e){const b=e.held;e.held=null;e.gone=true;
  if(b&&b.state==='held'){b.by=null;b.state='live';b.y=-G.r-rand(0,H*.08);const live=G.bubbles.filter(o=>o!==b&&o.state==='live'),free=[];for(let c=0;c<G.cols;c++)if(!live.some(o=>o.col===c))free.push(c);if(free.length)b.col=pickOne(free);
    float('It got away! Bubble back on top',colX(b.col),120,'#fff',18)}}
/* a swarm of bees on a sine path (Galaga formations); only the leader shoots; all of them down is a bonus */
function spawnSwarm(n,blitz){n=n||5;const side=ri(2),id=++G.swarmN,y0=H*rand(.18,.32),amp=H*.08,ph=rand(0,TAU);G.swarms[id]={n,killed:0,blitz:!!blitz};
  const lead=blitz?10:100;if(!blitz)warn(side,y0);
  for(let i=0;i<n;i++)G.enemies.push({kind:'bee',swarm:id,idx:i,blitz:!!blitz,x:side?W+lead+i*44:-lead-i*44,y:y0,y0,amp,ph,vx:(side?-1:1)*150*G.bs,hp:1,r:12*G.bs,fireT:2.5+i*.3,flash:0,score:blitz?60:40,inside:false,wing:rand(0,TAU)});
  if(!blitz)float('Bzzz!',side?W-70:70,y0+40,'#fde68a',20);return id}
function leadBee(id){return G.enemies.find(o=>o.kind==='bee'&&o.swarm===id&&!o.flee&&o.hp>0)}
/* a lost astronaut (Sky Force survivors): fly over to rescue; three per world make the Rescuer medal */
function spawnAstro(){G.stats.astroN++;const k={kind:'astro',x:rand(50,W-50),y:-20,vy:26*G.bs,ph:rand(0,TAU),wob:rand(-25,25)};G.pickups.push(k);float('Astronaut! Fly over to rescue',k.x,120,'#fff',18);return k}
/* the Mothership guards world 6 of the odd sectors: two turrets first, then the core opens and it sends crashers down */
function spawnBoss(){const ew=G.endless?G.wave:0,hp=10+2*G.si+ew,r=70*G.bs,thp=3+Math.floor(G.si/2)+Math.floor(ew/4);
  const e={kind:'boss',x:W/2,y:-120,vy:40*G.bs,home:Math.max(H*.2,120),hp,max:hp,r,fireT:2.5,spawnT:5,flash:0,score:500,ph:rand(0,TAU),noteT:0,open:false,
    turrets:[-1,1].map((s,i)=>({s,hp:thp,max:thp,x:0,y:0,r:r*.3,fireT:2+2*i,flash:0,ang:Math.PI/2,tele:false}))};
  bossTurrets(e);G.enemies.push(e);banner('Mothership!','Shoot the turrets, then the core');Snd.roar();return e}
function bossTurrets(e){for(const t of e.turrets){t.x=e.x+t.s*e.r*.72;t.y=e.y+e.r*.16}}
function updateBoss(e,edt){e.ph+=edt;
  if(e.y<e.home)e.y=Math.min(e.home,e.y+e.vy*edt);else e.x=clamp(e.x+Math.cos(e.ph*.4)*W*.1*edt,e.r,W-e.r);
  bossTurrets(e);const live=e.turrets.filter(t=>t.hp>0);e.open=!live.length;e.noteT=Math.max(0,e.noteT-edt);
  for(const t of e.turrets){t.flash=Math.max(0,t.flash-edt);t.tele=false}
  if(G.phase!=='run'||e.y<e.home)return;
  for(const t of live){const p=nearestShip(t.x,t.y);if(p)t.ang=Math.atan2(p.y-t.y,p.x-t.x);t.fireT-=edt;t.tele=t.fireT<.4;
    if(t.fireT<=0){const sp=220*G.bs;G.eshots.push({x:t.x+Math.cos(t.ang)*t.r,y:t.y+Math.sin(t.ang)*t.r,vx:Math.cos(t.ang)*sp,vy:Math.sin(t.ang)*sp,r:7});Snd.shoot();t.fireT=live.length>1?4:2.5}}
  if(e.open){e.fireT-=edt;e.tele=e.fireT<.4;if(e.fireT<=0){const sp=200*G.bs;for(const a of [-.6,-.3,0,.3,.6])fireEshot(e,a,sp);Snd.shoot();e.fireT=2.5}
    e.spawnT-=edt;if(e.spawnT<=0){e.spawnT=5;if(G.enemies.filter(o=>o.kind==='crash'&&!o.flee).length<4)spawnCrasher()}}}
/* a bullet reaching the Mothership: turrets first, then the hull; true when the bullet is used up */
function bossHit(e,b){for(const t of e.turrets){if(t.hp<=0||dist(b.x,b.y,t.x,t.y)>t.r+6)continue;t.hp-=b.dmg;t.flash=.15;G.parts.push({x:b.x,y:b.y,vx:rand(-60,60),vy:rand(-60,20),life:.3,r:3,col:'#fff',g:0});
    if(t.hp<=0){burst(t.x,t.y,30);G.shake=8;const pts=100*mult()*scoreMul();G.score+=pts;checkTop();float('+'+pts,t.x,t.y-30,'#fff',22);
      if(e.turrets.every(o=>o.hp<=0)){float('Core exposed! Hit it!',e.x,e.y+e.r*.5+30,'#fde68a',24);Snd.pop(3)}else Snd.hit()}
    return true}
  const dx=(b.x-e.x)/e.r,dy=(b.y-e.y)/(e.r*.5);if(dx*dx+dy*dy>1.1)return false;
  if(e.open){e.hp-=b.dmg;e.flash=.15;G.parts.push({x:b.x,y:b.y,vx:rand(-60,60),vy:rand(-60,20),life:.3,r:3,col:'#fff',g:0});if(e.hp<=0)killEnemy(e)}
  else{G.parts.push({x:b.x,y:b.y,vx:rand(-90,90),vy:rand(20,90),life:.25,r:3,col:'#cbd5e1',g:0});if(e.noteT<=0){e.noteT=3;float('Shoot the turrets first!',e.x,e.y+e.r*.5+16,'#fff',18)}}
  return true}
/* the Math Hydra: a body on answer arms with its own problem on its belly. Its armor holds until the arm with the right
   answer is shot off; then the body takes hits until that arm grows back with a new problem. A wrong arm just grows back. */
const HYDRA_OPEN=4.5,HYDRA_COL='#34d399';
function hydraOK(){return G.phase==='run'&&!bossWave()&&(G.wave>=2||G.wi>=3)}
/* the hydra is a solo boss: while it lives nothing else spawns, and whatever is on screen flees */
function hydraLive(){return G.enemies.some(e=>e.kind==='hydra'&&!e.flee&&e.hp>0)}
/* a wrong arm scrambles the numbers across the live arms (the right one stays on exactly one arm) */
function hydraScramble(e){const live=e.arms.filter(m=>m.state!=='gone');const vs=shuffle(live.map(m=>m.v));live.forEach((m,i)=>{m.v=vs[i];m.ok=m.v===e.q.ans})}
function spawnHydra(){const angs=G.wi>=4?[-1.6,-.55,.55,1.6]:[-1.45,0,1.45],hp=6+G.wi;
  const e={kind:'hydra',x:W/2,y:-90,vy:70*G.bs,r:44*G.bs,home:Math.max(H*.24,140),hp,max:hp,fireT:3,flash:0,score:400,ph:rand(0,TAU),open:0,miss:0,q:null,noteT:0,
    arms:angs.map(a=>({a,v:0,ok:false,state:'on',g:1,x:W/2,y:-90}))};
  hydraProblem(e);hydraArms(e);for(const o of G.enemies)if(o.kind!=='hydra')o.flee=true;G.enemies.push(e);banner('Math Hydra!','Shoot off the arm with the answer');Snd.roar();updateHUD();return e}
function hydraProblem(e){const q=MSMath.problem(probCat(),G.grade,G.tier,G,PF(G.ids[0]).facts);e.q=q;e.miss=0;
  const opts=shuffle(MSMath.choices(q,e.arms.length));e.arms.forEach((m,i)=>{m.v=opts[i];m.ok=opts[i]===q.ans})}
/* where each pod sits: arms sway, and go limp (hanging lower) while the body is open */
function hydraArms(e){const L=e.r+G.r*2.6;e.arms.forEach((m,i)=>{const limp=m.state==='limp',a=(limp?m.a*.45:m.a)+Math.sin(e.ph*1.6+i*1.7)*.13,len=L*(limp?.8:1);
  m.x=e.x+Math.sin(a)*len;m.y=e.y+Math.cos(a)*len})}
function hydraRegrow(e){e.open=0;hydraProblem(e);for(const m of e.arms){m.g=m.state==='gone'?0:.4;m.state='grow'}
  float('It grew back with a new problem!',e.x,e.y-e.r-24,'#bbf7d0',20);Snd.roar();updateHUD()}
function updateHydra(e,dt){e.ph+=dt;
  if(e.y<e.home)e.y=Math.min(e.home,e.y+e.vy*dt);else{const m=e.r+G.r*2.6;e.x=clamp(e.x+Math.cos(e.ph*.5)*W*.12*dt,m,W-m)}
  for(const m of e.arms)if(m.state==='grow'){m.g=Math.min(1,m.g+dt/.9);if(m.g>=1)m.state='on'}
  if(e.open>0){e.open-=dt;if(e.open<=0)hydraRegrow(e)}
  else if(G.phase==='run'&&e.y>=e.home){e.fireT-=dt;if(e.fireT<=0){enemyFire(e);e.fireT=rand(2.8,3.6)}}
  e.noteT=Math.max(0,e.noteT-dt);hydraArms(e)}
/* a bullet reaching the hydra: pods first, then the body; true when the bullet is used up */
function hydraHit(e,b){const pr=G.r*.78;
  for(const m of e.arms){if(m.state!=='on'||dist(b.x,b.y,m.x,m.y)>pr+5)continue;
    if(m.ok){m.state='gone';m.g=0;e.open=HYDRA_OPEN;e.flash=.2;for(const o of e.arms)if(o!==m)o.state='limp';
      const pts=Math.round((100+15*G.wi)*mult()*scoreMul());G.score+=pts;checkTop();burst(m.x,m.y,30);G.shake=8;
      float('+'+pts,m.x,m.y-30,'#fff',24);float(`${e.q.text} = ${e.q.ans} · hit the body!`,e.x,e.y-e.r-30,'#bbf7d0',24);Snd.pop(3)}
    else{m.state='grow';m.g=0;e.miss++;puff(m.x,m.y);hydraScramble(e);e.hp+=2;e.max+=2;e.fireT=Math.max(1.2,e.fireT-.3);float('Scrambled! It grows stronger',e.x,e.y-e.r-30,'#fca5a5',20);Snd.hit()}
    updateHUD();return true}
  if(dist(b.x,b.y,e.x,e.y)>e.r+6)return false;
  if(e.open>0){e.hp-=b.dmg;e.flash=.15;G.parts.push({x:b.x,y:b.y,vx:rand(-60,60),vy:rand(-60,20),life:.3,r:3,col:'#fff',g:0});if(e.hp<=0)killEnemy(e)}
  else{G.parts.push({x:b.x,y:b.y,vx:rand(-90,90),vy:rand(20,90),life:.25,r:3,col:'#a7f3d0',g:0});if(e.noteT<=0){e.noteT=3;float('Armor! Shoot the arm with the answer',e.x,e.y+e.r+16,'#fff',18)}}
  return true}
function drawHydra(c,e,t){const fl=e.flash>0,open=e.open>0,r=e.r,pr=G.r*.78;c.save();c.lineCap='round';
  /* arms: a tapering tentacle with suckers out to a bulb that carries the number */
  e.arms.forEach((m,i)=>{if(m.state==='gone')return;const k=m.state==='grow'?.3+.7*m.g:1,tx=e.x+(m.x-e.x)*k,ty=e.y+(m.y-e.y)*k;
    const x0=e.x+(tx-e.x)*.2,y0=e.y+(ty-e.y)*.2,wig=Math.sin(t*3+i*2)*12,mx=e.x+(tx-e.x)*.55+wig,my=e.y+(ty-e.y)*.55-wig*.3;
    c.globalAlpha=m.state==='limp'?.45:1;
    const path=()=>{c.beginPath();c.moveTo(x0,y0);c.quadraticCurveTo(mx,my,tx,ty)};
    path();c.strokeStyle=shade(HYDRA_COL,-.6);c.lineWidth=r*.42;c.stroke();
    path();c.strokeStyle=fl?'#fff':shade(HYDRA_COL,-.15);c.lineWidth=r*.28;c.stroke();
    c.fillStyle=shade(HYDRA_COL,.55,.85);for(let s=1;s<=3;s++){const u=.25+s*.17,v=1-u;dot(c,v*v*x0+2*v*u*mx+u*u*tx,v*v*y0+2*v*u*my+u*u*ty,r*.055)}
    const rr=pr*(m.state==='grow'?Math.max(.15,m.g):1);
    if(m.ok&&e.miss>=2&&m.state==='on'){c.strokeStyle='rgba(255,255,255,.95)';c.lineWidth=3;c.beginPath();c.arc(tx,ty,rr*1.3*(1+Math.sin(t*8)*.08),0,TAU);c.stroke()}
    const g=c.createRadialGradient(tx-rr*.35,ty-rr*.4,rr*.1,tx,ty,rr);g.addColorStop(0,'#fff');g.addColorStop(.45,'#d9f99d');g.addColorStop(1,'#15803d');c.fillStyle=g;dot(c,tx,ty,rr);
    c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=2;c.beginPath();c.arc(tx,ty,rr,0,TAU);c.stroke();
    if(rr>pr*.6){const txt=String(m.v),fs=Math.max(12,rr*(txt.length>3?.6:txt.length>2?.75:.92));c.font=cfont(fs);c.textAlign='center';c.textBaseline='middle';
      c.lineWidth=Math.max(3,fs*.16);c.strokeStyle='rgba(20,40,30,.85)';c.strokeText(txt,tx,ty+rr*.04);c.fillStyle='#fff';c.fillText(txt,tx,ty+rr*.04)}});
  c.globalAlpha=1;c.translate(e.x,e.y);
  /* body: a spiky crest, a wobbling blob, eyes that follow your ship (dizzy while open), the problem on its belly */
  c.fillStyle=shade(HYDRA_COL,-.55);for(let i=-3;i<=3;i++){const a=-Math.PI/2+i*.33;c.beginPath();c.moveTo(Math.cos(a-.13)*r*.85,Math.sin(a-.13)*r*.85);
    c.lineTo(Math.cos(a)*r*(1.32+.06*Math.sin(t*5+i)),Math.sin(a)*r*(1.32+.06*Math.sin(t*5+i)));c.lineTo(Math.cos(a+.13)*r*.85,Math.sin(a+.13)*r*.85);c.fill()}
  const bg=c.createRadialGradient(-r*.3,-r*.4,r*.1,0,0,r*1.1);bg.addColorStop(0,fl?'#fff':shade(HYDRA_COL,.35));bg.addColorStop(1,fl?'#fff':shade(HYDRA_COL,-.5));
  c.fillStyle=bg;c.beginPath();for(let i=0;i<=24;i++){const a=i/24*TAU,w=r*(1+.04*Math.sin(t*4+i*1.3));c.lineTo(Math.cos(a)*w*1.06,Math.sin(a)*w*.94)}c.closePath();c.fill();
  if(open){const k=e.open/HYDRA_OPEN,cg=c.createRadialGradient(0,r*.15,2,0,r*.15,r*.8);cg.addColorStop(0,'rgba(255,250,200,.95)');cg.addColorStop(1,'rgba(253,224,71,0)');c.fillStyle=cg;dot(c,0,r*.15,r*.8);
    c.strokeStyle='rgba(253,224,71,.9)';c.lineWidth=5;c.beginPath();c.arc(0,0,r*1.18,-Math.PI/2,-Math.PI/2+TAU*k);c.stroke()}
  else{c.strokeStyle=shade(HYDRA_COL,-.45,.8);c.lineWidth=3;for(let i=0;i<3;i++){c.beginPath();c.arc(0,r*(.05+i*.22),r*(.62-i*.1),.25*Math.PI,.75*Math.PI);c.stroke()}}
  const p=nearestShip(e.x,e.y),la=p?Math.atan2(p.y-e.y,p.x-e.x):Math.PI/2;
  for(const s of [-1,1]){const ex=s*r*.36,ey=-r*.32;c.fillStyle='#fff';dot(c,ex,ey,r*.2);
    if(open){c.strokeStyle='#1f2937';c.lineWidth=2.5;c.beginPath();for(let a=0;a<4*Math.PI;a+=.4){const rr=a/(4*Math.PI)*r*.15;c.lineTo(ex+Math.cos(a+t*8)*rr,ey+Math.sin(a+t*8)*rr)}c.stroke()}
    else{c.fillStyle='#1f2937';dot(c,ex+Math.cos(la)*r*.07,ey+Math.sin(la)*r*.07,r*.1);c.fillStyle='#fff';dot(c,ex+Math.cos(la)*r*.07-r*.03,ey+Math.sin(la)*r*.07-r*.03,r*.03)}}
  const w=r*2,bx=-w/2,by=-r*1.32-16;c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.roundRect(bx-2,by-2,w+4,12,6);c.fill();
  c.fillStyle=e.hp/e.max>.5?'#22c55e':e.hp/e.max>.25?'#f5c842':'#ef4444';c.beginPath();c.roundRect(bx,by,w*Math.max(0,e.hp)/e.max,8,4);c.fill();
  c.restore()}
/* the hydra's problem: small text on its belly (no box, so the play field stays clear; Yan 11/3) and the readable copy in the HUD chip under the equation */
function hydraLabel(c,e){const open=e.open>0,r=e.r,txt=open?`${e.q.text} = ${e.q.ans}`:`${e.q.text} = ?`,fs=Math.max(13,r*.3);c.save();c.translate(e.x,e.y);
  c.font=cfont(fs);c.textAlign='center';c.textBaseline='middle';c.lineWidth=Math.max(3,fs*.2);c.strokeStyle=open?'rgba(21,128,61,.9)':'rgba(15,23,42,.85)';c.strokeText(txt,0,r*.32);c.fillStyle='#fff';c.fillText(txt,0,r*.32);c.restore()}
function hydraChip(){const e=G.enemies.find(o=>o.kind==='hydra'&&!o.flee&&o.hp>0&&!o.dead);if(!e)return '';return e.open>0?`Hydra: ${e.q.text} = ${e.q.ans} · hit the body!`:`Hydra: ${e.q.text} = ?`}
function fireEshot(e,ang,sp){G.eshots.push({x:e.x,y:e.y+e.r*.6,vx:Math.sin(ang)*sp,vy:Math.cos(ang)*sp,r:7})}
function enemyFire(e){const sp=220*G.bs;
  if(e.kind==='tank'){for(const a of (e.angry?[-.7,-.35,0,.35,.7]:[-.44,0,.44]))fireEshot(e,a,sp)}
  else{let ang=0;if(G.ramp.aim){const p=nearestShip(e.x,e.y);if(p)ang=Math.atan2(p.x-e.x,p.y-e.y)}fireEshot(e,ang,sp)}
  Snd.shoot()}
function rockOK(){return G.wi>=2||G.si>=1}
function snatchOK(){return !bossWave()&&(G.si>=1||G.wi>=3||(G.wi>=2&&G.wave>=2))}
function swarmOK(){return !bossWave()&&(G.si>=2||G.wi>=3||(G.wi>=2&&G.wave>=3))}
function active(){return G.phase==='run'||G.phase==='blitz'}
/* enemies move on edt: zero while Freeze is on, slower under Time Warp; flashes and fleeing keep real time */
function updateEnemies(dt){const cap=Math.min(6,G.ramp.cap+(G.wave-1)),fz=G.pw.freeze>0,edt=fz?0:dt*(G.pw.warp>0?.7:1);
  if(G.phase==='run'&&!hydraLive()){G.spawnT-=edt;if(G.spawnT<=0&&G.enemies.filter(e=>e.kind==='crash'&&!e.flee).length<cap){spawnCrasher();G.spawnT=G.ramp.crash*(G.grade===3?1.15:1)*rand(.8,1.2)}
    if(G.ramp.shooter>0){G.shooterT-=edt;if(G.shooterT<=0&&!G.enemies.some(e=>e.kind==='shoot'&&!e.flee)){spawnShooter();G.shooterT=Math.max(3,6-.5*G.wi)}}
    if(hydraOK()&&!G.enemies.some(e=>e.kind==='hydra'&&!e.flee)){G.hydraT-=edt;if(G.hydraT<=0){spawnHydra();G.hydraT=14}}
    if(rockOK()){G.rockT-=edt;if(G.rockT<=0&&G.enemies.filter(e=>e.kind==='rock'&&e.big&&!e.flee).length<2){spawnRock();G.rockT=rand(6,9)}}
    if(snatchOK()&&!G.enemies.some(e=>e.kind==='snatch'&&!e.flee)){G.snatchT-=edt;if(G.snatchT<=0){spawnSnatcher();G.snatchT=18}}
    if(swarmOK()&&!G.enemies.some(e=>e.kind==='bee'&&!e.flee)){G.swarmT-=edt;if(G.swarmT<=0){spawnSwarm();G.swarmT=16}}
    G.astroT-=edt;if(G.astroT<=0&&G.stats.astroN<(G.endless?99:3)&&G.stats.astroN<G.wave){spawnAstro();G.astroT=rand(6,10)}
    G.capT+=edt;if(G.capT>SUPPLY_T){const x=rand(40,W-40);dropCap(x,-14);float('Supply drop!',x,120,'#fff',18)}}
  for(const w of G.warns)w.t-=dt;G.warns=G.warns.filter(w=>w.t>0);
  for(const e of G.enemies){e.flash=Math.max(0,e.flash-dt);e.tele=false;
    if(e.flee){e.y-=400*dt;if(e.kind==='hydra')hydraArms(e);if(e.kind==='boss')bossTurrets(e);continue}
    if(e.kind==='hydra'){updateHydra(e,edt);continue}
    if(e.kind==='boss'){updateBoss(e,edt);continue}
    if(e.kind==='snatch'){updateSnatch(e,edt);continue}
    if(e.kind==='rock'){e.x+=e.vx*edt;e.y+=e.vy*edt;e.rot+=e.vr*edt;if(e.x<e.r||e.x>W-e.r){e.vx=-e.vx;e.x=clamp(e.x,e.r,W-e.r)}continue}
    if(e.kind==='bee'){e.x+=e.vx*edt;e.y=e.y0+Math.sin(e.x/W*TAU*1.5+e.ph)*e.amp;e.wing+=dt*30;if(!e.inside&&e.x>0&&e.x<W)e.inside=true;if(e.inside&&(e.x<-50||e.x>W+50))e.gone=true;
      if(!e.blitz&&G.phase==='run'&&e.inside&&leadBee(e.swarm)===e){e.fireT-=edt;e.tele=e.fireT<.4;if(e.fireT<=0){enemyFire(e);e.fireT=2.5}}continue}
    if(e.kind==='crash'){e.wob+=edt*3;
      if(!e.dive){e.x+=Math.sin(e.wob)*40*edt;e.y+=e.vy*edt;if(G.phase==='run'&&e.y>0){e.fireT-=edt;e.tele=e.fireT<.4;if(e.fireT<=0){enemyFire(e);e.fireT=rand(2,3)}}if(e.y>H*.55){e.dive=true;const p=nearestShip(e.x,e.y);e.tx=p?p.x:e.x}}
      else{e.vx+=(clamp((e.tx-e.x)*3,-260*G.bs,260*G.bs)-e.vx)*Math.min(1,edt*4);e.x+=e.vx*edt;e.vy+=240*edt;e.y+=e.vy*edt}}
    else if(e.kind==='shoot'){e.x+=e.vx*edt;if(!e.inside&&e.x>e.r&&e.x<W-e.r)e.inside=true;if(e.inside&&(e.x<e.r||e.x>W-e.r)){e.vx=-e.vx;e.x=clamp(e.x,e.r,W-e.r)}
      e.life-=edt;if(e.life<=0)e.y-=200*edt;else if(G.phase==='run'){e.fireT-=edt;e.tele=e.fireT<.4;if(e.fireT<=0){enemyFire(e);e.fireT=G.ramp.shooter*rand(.85,1.15)}}}
    else{if(e.y<H*.26)e.y+=e.vy*edt;else{if(!e.angry&&e.hp<=e.max/2){e.angry=true;e.flash=.4;banner("It's angry!",'Watch the fan of shots');Snd.roar()}
      e.x=clamp(e.x+Math.sin(G.t*(e.angry?1.4:.7))*(e.angry?70:30)*edt,e.r,W-e.r);if(G.phase==='run'){e.fireT-=edt;e.tele=e.fireT<.4;if(e.fireT<=0){enemyFire(e);e.fireT=e.angry?2.5:3}}}}}
  G.enemies=G.enemies.filter(e=>e.hp>0&&e.y<H+60&&e.y>-160&&!e.gone)}
/* every kill feeds the chain (DoDonPachi style): kills within 1.5 s of each other multiply enemy points up to ×4 */
function killEnemy(e){if(e.dead)return;e.dead=true;e.hp=0;burst(e.x,e.y,e.kind==='crash'||e.kind==='shoot'||e.kind==='bee'||e.kind==='rock'?24:70);
  G.chain++;G.chainT=CHAIN_T;G.stats.kills++;G.stats.chainMax=Math.max(G.stats.chainMax,G.chain);const cm=chainMul();if(cm>G.lastCm){float(`Chain ×${cm}!`,e.x,e.y-56,'#fde68a',24);Snd.coin()}G.lastCm=cm;
  const pts=Math.round(e.score*mult()*cm*scoreMul());G.score+=pts;checkTop();float('+'+pts,e.x,e.y-30,'#fff',22);Snd.hit();
  if(e.kind==='tank'||e.kind==='hydra'||e.kind==='boss'){G.pickups.push({kind:'heart',x:e.x,y:e.y,vy:80});for(let i=0;i<4;i++)G.pickups.push({kind:'treat',x:e.x+rand(-30,30),y:e.y+rand(-10,10),vy:110*G.bs});dropCap(e.x,e.y+30);G.shake=16;
    if(e.kind==='hydra'){G.stats.hydras++;for(const m of e.arms)if(m.state!=='gone')puff(m.x,m.y);banner('Hydra down!');Snd.win();updateHUD()}
    else{G.stats.boss++;banner(e.kind==='boss'?'Mothership down!':'Tank down!');Snd.win();if(G.correct>=WAVE_N&&G.phase==='run')waveClear()}}
  else if(e.kind==='rock'){G.stats.rocks++;if(e.big){spawnRock(true,e.x-12,e.y,-rand(60,110)*G.bs);spawnRock(true,e.x+12,e.y,rand(60,110)*G.bs)}else rollDrop(e)}
  else if(e.kind==='snatch'){G.stats.snatchers++;if(e.held){const b=e.held;e.held=null;if(b.state==='held'){b.by=null;b.state='live';float('Dropped it!',b.x,b.y-44,'#bbf7d0',22)}}if(Math.random()<.5)dropCap(e.x,e.y);else rollDrop(e)}
  else if(e.kind==='bee'){G.stats.bees++;const sw=G.swarms[e.swarm];if(sw)sw.killed++;
    if(e.blitz){if(G.blitz)G.blitz.kills++;G.pickups.push({kind:'treat',x:e.x,y:e.y,vy:110*G.bs})}
    else if(sw&&sw.killed>=sw.n){const bonus=200*scoreMul();G.score+=bonus;float(`Full swarm! +${bonus}`,e.x,e.y-60,'#fde68a',26);Snd.glow();dropCap(e.x,e.y)}
    else rollDrop(e)}
  else rollDrop(e)}
function rollDrop(e){const lucky=Math.max(...G.players.map(p=>p.lucky));const needHeart=G.players.some(p=>!p.down&&!p.out&&p.hearts<p.maxHearts);
  if(needHeart&&Math.random()<.12+.06*lucky)G.pickups.push({kind:'heart',x:e.x,y:e.y,vy:80});
  else if(Math.random()<.09+.04*lucky)dropCap(e.x,e.y);
  else if(Math.random()<.6+.2*lucky){const n=1+ri(3);for(let i=0;i<n;i++)G.pickups.push({kind:'treat',x:e.x+rand(-16,16),y:e.y+rand(-8,8),vy:110*G.bs})}}
/* which capsule to drop: never one that is already running or would do nothing right now */
function pickPower(){const ps=shipsAlive();const ids=Object.keys(POWERS).filter(id=>{const pw=POWERS[id];if(pw.global&&G.pw[id]>0)return false;if(!pw.global&&pw.t&&ps.every(p=>p.pw[id]>0))return false;
    if(id==='shield')return ps.some(p=>!p.shieldOn);if(id==='cell')return ps.some(p=>p.charge<1);if(id==='bomb')return ps.some(p=>p.bombs<p.maxBombs);return true});
  return ids.length?pickOne(ids):'x2'}
function dropCap(x,y,id){G.capT=0;G.pickups.push({kind:'cap',pu:id||pickPower(),x,y,vy:90*G.bs,ph:rand(0,TAU)})}
function givePower(p,id){const pw=POWERS[id];if(!pw)return;G.stats.caps++;G.capT=0;let sub='';
  if(id==='shield'){p.shieldOn=true;p.shieldT=0;sub='One free hit'}
  else if(id==='cell'){addCharge(p,.5);sub='Laser +50%'}
  else if(id==='bomb'){if(p.bombs<p.maxBombs){p.bombs++;sub='+1 bomb'}else{G.score+=100;sub='+100 points'}}
  else{const t=pw.t*p.longMul;if(pw.global)G.pw[id]=Math.max(G.pw[id],t);else p.pw[id]=Math.max(p.pw[id],t);sub=`${Math.round(t)} seconds`;
    if(id==='freeze'){G.flash=.4;G.flashCol='125,211,252';G.eshots=[]}else if(id==='warp'){G.flash=.3;G.flashCol='167,139,250'}}
  float(pw.name,p.x,p.y-76,pw.col,26);float(sub,p.x,p.y-50,'#fff',16);burst(p.x,p.y,30);Snd.glow();updateHUD()}
function useBomb(p){if(!G||G.paused||!active()||p.down||p.out||p.bombs<=0)return;p.bombs--;G.stats.bombs++;
  for(const e of G.enemies){if(e.flee||e.hp<=0)continue;if(e.kind==='tank'){e.hp-=3;e.flash=.3;if(e.hp<=0)killEnemy(e)}else if(e.kind==='hydra'){e.flash=.3;if(e.open>0){e.hp-=4;if(e.hp<=0)killEnemy(e)}}
    else if(e.kind==='boss'){e.flash=.3;let any=false;for(const t of e.turrets)if(t.hp>0){any=true;t.hp-=3;t.flash=.3;if(t.hp<=0)burst(t.x,t.y,30)}if(!any){e.hp-=3;if(e.hp<=0)killEnemy(e)}}
    else killEnemy(e)}
  G.eshots=[];G.flash=.5;G.flashCol='255,255,255';G.shake=20;Snd.special();banner('BOOM!');updateHUD()}
/* the laser (left Shift): charges over time and with right answers, then burns its column clear for two seconds */
function addCharge(p,n){if(p.charge>=1)return;const seg=Math.floor(p.charge*5);p.charge=Math.min(1,p.charge+n);
  if(p.charge>=1){float('Laser ready!',p.x,p.y-70,p.col,20);Snd.coin()}if(Math.floor(p.charge*5)!==seg)updateHUD()}
function useSpecial(p){if(!G||G.paused||!active()||p.down||p.out||p.laser>0)return;
  if(p.charge<1){float('Laser charging...',p.x,p.y-70,'#fff',18);return}
  p.charge=0;p.laser=p.laserLen;p.laserT=0;G.stats.lasers++;G.shake=8;Snd.laser();banner('LASER!');updateHUD()}
function updateLaser(p,dt){p.muzzle=Math.max(0,p.muzzle-dt);
  if(p.laser<=0){if(G.phase==='run')addCharge(p,dt/(CHARGE_T*p.chargeMul));return}
  p.laser-=dt;p.laserT-=dt;const hw=G.shipW*.45,top=p.y-G.shipH*.45;
  G.eshots=G.eshots.filter(s=>!(Math.abs(s.x-p.x)<hw+s.r&&s.y<top+10));
  if(Math.random()<.6)G.parts.push({x:p.x+rand(-hw,hw),y:rand(0,top),vx:rand(-90,90),vy:rand(-90,90),life:rand(.2,.4),r:rand(2,4),col:Math.random()<.5?'#fff':p.col,g:0});
  if(p.laserT<=0){p.laserT=.1;for(const e of G.enemies){if(e.flee||e.hp<=0||e.y<-10||e.y>top+e.r)continue;
    if(e.kind==='boss'){for(const t of e.turrets)if(t.hp>0&&Math.abs(t.x-p.x)<hw+t.r){t.hp-=.5;t.flash=.08;if(t.hp<=0)burst(t.x,t.y,30)}if(e.open&&Math.abs(e.x-p.x)<hw+e.r*.5){e.hp-=.5;e.flash=.08;if(e.hp<=0)killEnemy(e)}continue}
    if(Math.abs(e.x-p.x)>hw+e.r)continue;
    if(e.kind==='tank'||e.kind==='hydra'){if(e.kind==='hydra'&&!(e.open>0))continue;e.hp-=.5;e.flash=.08;if(e.hp<=0)killEnemy(e)}else killEnemy(e)}}
  if(p.laser<=0)updateHUD()}

/* CAPTURE (Space, Enter for player 2, or the CAPTURE button) catches the answer bubble or astronaut nearest in reach,
   so the ship has to be under it when the key goes down. Flying into things does nothing. */
function tryCapture(p){if(!G||!active()||p.down||p.out||p.capCD>0)return;
  const rx=G.r*1.6,ry=H*.5;let best=null,bd=1e9;
  for(const b of G.bubbles){if(b.state!=='live'||b.y<0||!G.qOpen)continue;const dx=Math.abs(b.x-p.x),dy=Math.abs(b.y-p.y);if(dx<rx&&dy<ry&&dx+dy<bd){bd=dx+dy;best={b}}}
  for(const k of G.pickups){if(k.kind!=='astro')continue;const dx=Math.abs(k.x-p.x),dy=Math.abs(k.y-p.y);if(dx<rx*1.2&&dy<ry&&dx+dy<bd){bd=dx+dy;best={k}}}
  if(!best)return;p.capCD=.35;
  if(best.b)catchBubble(p,best.b);else{G.pickups=G.pickups.filter(x=>x!==best.k);collect(p,best.k)}}
/* ships, bullets and everything that touches them */
function updatePlayers(dt){
  for(const p of G.players){if(p.out)continue;
    if(p.down){p.downT-=dt;p.y=Math.max(H*.5,p.y-10*dt);p.x=clamp(p.x+Math.sin(G.t*1.5+p.i)*20*dt,20,W-20);
      if(p.downT<=0){p.out=true;p.down=false;float(`${kid(p.id).name} is out until the next wave`,W/2,H*.4,'#fff',20);if(G.players.every(q=>q.down||q.out)){G.phase='lost';G.endAt=G.t+3;banner('Game over',`Score ${G.score.toLocaleString()}`)}}
      for(const q of G.players)if(q!==p&&!q.down&&!q.out&&dist(p.x,p.y,q.x,q.y)<G.shipW*.9)revive(p,q);
      continue}
    const sp=440*G.bs*p.speedMul;let dx=0,dy=0,wx=0,wy=0;const h=p.held;
    if(p.stick){dx=p.stick.x;dy=p.stick.y}else{if(h.left)dx-=1;if(h.right)dx+=1;if(h.up)dy-=1;if(h.down)dy+=1;if(dx&&dy){dx*=.7071;dy*=.7071}}
    if(p.target){const tx=p.target.x-p.x,ty=p.target.y-p.y,d=Math.hypot(tx,ty);if(d>1){const s=Math.min(sp*1.2,d*14);wx=tx/d*s;wy=ty/d*s}}
    else{wx=dx*sp;wy=dy*sp}
    /* a short ease toward the wanted velocity (about 25 ms to speed, faster to a stop) so it feels snappy but not jittery (Yan 11/3: sluggish) */
    const k=1-Math.exp(-dt*(p.target||p.stick?40:(dx||dy)?38:55));p.mvx+=(wx-p.mvx)*k;p.mvy+=(wy-p.mvy)*k;
    const px=p.x,nx=p.x+p.mvx*dt,ny=p.y+p.mvy*dt;p.x=clamp(nx,G.shipW/2,W-G.shipW/2);p.y=clamp(ny,H*.1,H-G.shipH/2);
    if(p.x!==nx)p.mvx=0;if(p.y!==ny)p.mvy=0;
    p.vx+=((p.x-px)/Math.max(dt,.001)-p.vx)*Math.min(1,dt*10);
    p.inv=Math.max(0,p.inv-dt);updateLaser(p,dt);
    if(Math.random()<.8)G.parts.push({x:p.x+rand(-.16,.16)*G.shipW,y:p.y+G.shipH*.5,vx:rand(-25,25),vy:rand(160,240)*G.bs,life:rand(.15,.3),r:rand(2,4.5),col:pickOne(['rgba(255,214,120,.85)','rgba(255,140,80,.75)',p.col]),g:0});
    if(!p.shieldOn&&(p.up.shield|0)>0){p.shieldT-=dt;if(p.shieldT<=0){p.shieldOn=true;float('Shield up',p.x,p.y-50,'#7dd3fc',16);updateHUD()}}
    /* auto-fire (per player, on by default) or the fire key; drones and missiles follow the same rule */
    p.capCD=Math.max(0,(p.capCD||0)-dt);if(h.capture&&!p.capPrev)tryCapture(p);p.capPrev=!!h.capture;
    p.firing=active()&&(p.auto||!!h.fire);
    const fi=p.pw.over>0?p.fireInt*.5:p.fireInt;p.fireT-=dt;if(p.firing&&p.fireT<=0){p.fireT=fi;shoot(p)}
    if(drones(p)){p.droneT-=dt;if(p.firing&&p.droneT<=0){p.droneT=p.up.hive?.9:p.up.drone?[.5,.3][Math.min(1,(p.up.drone|0)-1)]:.35;
      for(const d of dronePos(p)){if(p.up.hive)fireMissile(p,d.x,d.y-8);else G.bullets.push({x:d.x,y:d.y-10,vx:0,vy:-700*G.bs,dmg:1,col:p.col,drone:true})}}}
    if(p.up.missile){p.missileT-=dt;if(p.firing&&p.missileT<=0){p.missileT=[1.2,.8][Math.min(1,(p.up.missile|0)-1)];const xs=(p.up.missile|0)>=2?[-.3,.3]:[0];for(const sx of xs)fireMissile(p,p.x+sx*G.shipW,p.y)}}}}
function drones(p){return Math.min(2,(p.up.drone?1:0)+(p.up.hive?1:0)+(p.pw.wing>0?1:0))}
function dronePos(p){const n=drones(p),out=[],side=p.i?1:-1;for(let k=0;k<n;k++){const s=k?-side:side;out.push({x:clamp(p.x+s*G.shipW*.8,16,W-16),y:p.y+G.shipH*.15,s})}return out}
function fireMissile(p,x,y){G.bullets.push({x,y,vx:0,vy:-300*G.bs,dmg:2,col:'#fdba74',missile:true,life:3,tgt:null,hits:0,last:null});Snd.tone(300,.1,{type:'triangle',vol:.04,slide:900})}
/* what a missile steers at: no closed hydra (armored), and a Mothership's nearest live turret before its hull */
function nearestEnemy(x,y){let best=null,bd=1e9;for(const e of G.enemies){if(e.flee||e.hp<=0||e.y<-10||(e.kind==='hydra'&&!(e.open>0)))continue;const a=aimAt(e,x,y),d=dist(x,y,a.x,a.y);if(d<bd){bd=d;best=e}}return best}
function aimAt(e,x,y){if(e.kind==='boss'){let t=null,bd=1e9;for(const o of e.turrets)if(o.hp>0){const d=dist(x,y,o.x,o.y);if(d<bd){bd=d;t=o}}if(t)return t}return e}
function shoot(p){const u=p.up,dmg=(1+(u.power|0))*(u.plasma?2:1),sp=760*G.bs,s=u.spread|0;
  /* wing guns: one gun on each wing, then two; they fire straight up beside the nose */
  const wing=s>=2?[-.5,-.36,.36,.5]:s>=1?[-.36,.36]:[];
  const shots=[{a:0,x:0}];if(u.starburst)shots.push({a:-.52,x:0},{a:.52,x:0});for(const f of wing)shots.push({a:0,x:f*G.shipW});
  const pierce=u.starburst?2:(p.pw.over>0||u.pierce)?1:0;
  p.muzzle=.07;for(const b of shots)G.bullets.push({x:p.x+b.x+Math.sin(b.a)*6,y:p.y-G.shipH*.45,vx:Math.sin(b.a)*sp,vy:-Math.cos(b.a)*sp,dmg,col:p.col,pierce,hits:0,last:null,plasma:!!u.plasma});Snd.shoot()}
function segDist(px,py,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy||1;const t=clamp(((px-x1)*dx+(py-y1)*dy)/l2,0,1);return dist(px,py,x1+dx*t,y1+dy*t)}
function updateCombat(dt){const alive=shipsAlive(),rx=G.shipW*.3,fz=G.pw.freeze>0,edt=fz?0:dt*(G.pw.warp>0?.6:1);
  for(const b of G.bullets){
    if(b.missile){b.life-=dt;if(b.life<=0){b.dead=true;continue}if(!b.tgt||b.tgt.hp<=0||b.tgt.flee||b.tgt.dead||(b.tgt.kind==='hydra'&&!(b.tgt.open>0)))b.tgt=nearestEnemy(b.x,b.y);
      const sp=560*G.bs;if(b.tgt){const a=aimAt(b.tgt,b.x,b.y),d=dist(b.x,b.y,a.x,a.y)||1,k=Math.min(1,dt*7);b.vx+=((a.x-b.x)/d*sp-b.vx)*k;b.vy+=((a.y-b.y)/d*sp-b.vy)*k}else b.vy+=(-sp-b.vy)*Math.min(1,dt*4);
      if(Math.random()<.7)G.parts.push({x:b.x,y:b.y,vx:rand(-20,20),vy:rand(-10,30),life:rand(.2,.45),r:rand(2,4),col:'rgba(200,200,210,.6)',g:0})}
    b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.y<-20||b.x<-20||b.x>W+20||b.y>H+20){b.dead=true;continue}
    for(const e of G.enemies){if(e.flee||e.hp<=0||e.y<-10||e===b.last)continue;
      if(e.kind==='hydra'){if(hydraHit(e,b)){b.dead=true;break}continue}
      if(e.kind==='boss'){if(bossHit(e,b)){b.dead=true;break}continue}
      if(dist(b.x,b.y,e.x,e.y)<e.r+6){e.hp-=b.dmg;e.flash=.15;G.parts.push({x:b.x,y:b.y,vx:rand(-60,60),vy:rand(-60,20),life:.3,r:3,col:'#fff',g:0});if(e.hp<=0)killEnemy(e);
        if(b.pierce&&b.hits<b.pierce){b.hits++;b.last=e}else b.dead=true;break}}}
  G.bullets=G.bullets.filter(b=>!b.dead);
  for(const e of G.enemies){if(e.flee||e.hp<=0||e.kind==='snatch')continue;for(const p of alive)if(dist(e.x,e.y,p.x,p.y)<e.r+rx){hitPlayer(p);if(e.kind==='crash'||e.kind==='rock'){e.hp=0;puff(e.x,e.y)}}}
  G.beam=(G.coop&&alive.length===2&&dist(alive[0].x,alive[0].y,alive[1].x,alive[1].y)<220*G.bs)?alive:null;
  for(const s of G.eshots){s.x+=s.vx*edt;s.y+=s.vy*edt;if(s.y>H+20||s.x<-20||s.x>W+20||s.y<-20){s.dead=true;continue}
    if(G.beam&&segDist(s.x,s.y,G.beam[0].x,G.beam[0].y,G.beam[1].x,G.beam[1].y)<9){s.dead=true;G.score+=5;G.rings.push({x:s.x,y:s.y,r:4,life:.3});continue}
    let popped=false;for(const p of alive)if(p.shieldOn&&p.up.guardian&&dist(s.x,s.y,p.x,p.y)<G.shipW*1.2){s.dead=true;popped=true;G.score+=5;G.rings.push({x:s.x,y:s.y,r:4,life:.3});break}if(popped)continue;
    for(const p of alive)if(dist(s.x,s.y,p.x,p.y)<s.r+rx*.8){s.dead=true;hitPlayer(p);break}}
  G.eshots=G.eshots.filter(s=>!s.dead);
  G.enemies=G.enemies.filter(e=>e.hp>0);
  for(const k of G.pickups){k.y+=k.vy*(k.kind==='astro'?edt:dt);if(k.kind==='astro')k.x=clamp(k.x+Math.sin(G.t*1.2+k.ph)*k.wob*dt,20,W-20);
    for(const p of alive){if(p.magnetR>0){const d=dist(k.x,k.y,p.x,p.y);if(d<p.magnetR&&d>1){k.x+=(p.x-k.x)/d*300*dt;k.y+=(p.y-k.y)/d*300*dt}}}
    for(const p of alive)if(k.kind!=='astro'&&dist(k.x,k.y,p.x,p.y)<rx+12){k.dead=true;collect(p,k);break}
    if(k.y>H+20){k.dead=true;if(k.kind==='astro')float('The astronaut drifted away',k.x,H-40,'#fca5a5',18)}}
  G.pickups=G.pickups.filter(k=>!k.dead);}
function collect(p,k){if(k.kind==='cap'){givePower(p,k.pu);return}
  if(k.kind==='astro'){G.stats.rescues++;const pts=150*scoreMul();G.score+=pts;checkTop();float(`Rescued! +${pts}`,k.x,k.y-24,'#fff',22);float(`${G.stats.rescues} of 3 astronauts`,k.x,k.y-50,'#fde68a',16);Snd.win();burst(k.x,k.y,30);updateHUD();return}
  if(k.kind==='heart'){if(p.hearts<p.maxHearts){p.hearts++;float('+1 heart',k.x,k.y-20,'#f87171',20)}else{G.score+=50;float('+50',k.x,k.y-20,'#fff',20)}}
  else{G.collected++;G.score+=10;float('+1',k.x,k.y-20,'#fde68a',18)}Snd.coin();burst(k.x,k.y,8);updateHUD()}

/* bookkeeping */
function adapt(d,why){const before=Math.floor(G.L);G.L=MSMath.adapt(G.L,d,G.warm);G.peakL=Math.max(G.peakL,G.L);const after=Math.floor(G.L);
  if(after>before)float('Speed up!',W/2,H*.2,'#fff',20);else if(why==='slow'&&after<before)float('Slowing down a little',W/2,H*.2,'#fff',18)}
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
  put('#stageLbl',G.endless?`Endless · Wave ${G.wave} · ${Math.min(G.correct,WAVE_N)}/${WAVE_N}`:`World ${G.wi} · Wave ${G.wave}/${WAVES} · ${Math.min(G.correct,WAVE_N)}/${WAVE_N}`);
  const w=(Math.min(1,G.correct/WAVE_N)*100)+'%';if(hudCache.prog!==w){hudCache.prog=w;$('#progBar').style.width=w}
  put('#bombs','Bomb '+G.players.map(p=>'●'.repeat(p.bombs)+'○'.repeat(Math.max(0,p.maxBombs-p.bombs))).join(' · '));
  put('#special',G.players.map(p=>p.out||p.down?'-':p.laser>0?'<b>FIRING</b>':p.charge>=1?'<b>READY</b>':'▰'.repeat(Math.floor(p.charge*5))+'▱'.repeat(5-Math.floor(p.charge*5))).join(' · ').replace(/^/,'Laser '));
  put('#ups',G.players.map(p=>UP_ORDER.filter(id=>p.up[id]).map(id=>`<span style="color:${p.col}">${UPGRADES[id].tag}${p.up[id]>1?p.up[id]:''}</span>`).join('')).join('<span style="opacity:.4">|</span>'));
  const chips=[];for(const id in G.pw)if(G.pw[id]>0)chips.push([id,G.pw[id]]);for(const p of G.players)for(const id in p.pw)if(p.pw[id]>0)chips.push([id,p.pw[id]]);
  put('#powers',chips.map(([id,t])=>`<span style="color:${POWERS[id].col}">${POWERS[id].tag} ${Math.ceil(t)}s</span>`).join(''));
  put('#score',G.score.toLocaleString());put('#eq2',hydraChip());
  const q0=G.players[0];put('#tbBomb',`BOMB<small>${'●'.repeat(q0.bombs)||'–'}</small>`);const lz=$('#tbLaser'),rdy=q0.charge>=1&&q0.laser<=0&&!q0.down&&!q0.out;if(lz.classList.contains('ready')!==rdy)lz.classList.toggle('ready',rdy);
  put('#combo',G.glowT>0?`Glow · ${G.streak} in a row`:G.streak>=2?`${G.streak} in a row · ×${mult()}`:G.chain>=3?`Chain ×${chainMul()}`:'');
  const tl=$('#topLbl'),cls='hud-small'+(G.topBeaten?' beat':'');if(tl.className!==cls)tl.className=cls;put('#topLbl',G.topBeaten?'New top score!':G.top?`Top ${G.top.toLocaleString()}`:'First try!')}
function update(dt){G.t+=dt;G.waveT+=dt;
  if(G.phase==='intro'&&G.t>=G.phaseAt)startRun();
  if(G.phase==='clear'&&G.t>=G.phaseAt)afterClear();
  if((G.phase==='won'||G.phase==='lost')&&G.t>=G.endAt&&!G.finished){G.finished=true;finish();return}
  if(G.phase==='blitz')updateBlitz(dt);
  if(G.phase!=='upgrade'){updatePlayers(dt);updateBubbles(dt);updateEnemies(dt);updateCombat(dt)}
  /* power-up timers (the HUD chips count down four times a second) and the kill chain */
  let anyPw=false;for(const id in G.pw)if(G.pw[id]>0){anyPw=true;G.pw[id]-=dt;if(G.pw[id]<=0){G.pw[id]=0;updateHUD()}}
  for(const p of G.players)for(const id in p.pw)if(p.pw[id]>0){anyPw=true;p.pw[id]-=dt;if(p.pw[id]<=0){p.pw[id]=0;updateHUD()}}
  if(anyPw){G.hudT-=dt;if(G.hudT<=0){G.hudT=.25;updateHUD()}}
  if(G.chain>0){G.chainT-=dt;if(G.chainT<=0){G.chain=0;G.lastCm=1;updateHUD()}}
  if(G.glowT>0){G.glowT-=dt;if(G.glowT<=0){endGlow();updateHUD()}}
  G.shake=Math.max(0,G.shake-dt*40);G.flash=Math.max(0,G.flash-dt*1.6);
  const cap=W<480?400:700;for(const p of G.parts){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.g||0)*dt;p.vx*=.985;if(p.rect)p.rot+=p.vr*dt}
  G.parts=G.parts.filter(p=>p.life>0);if(G.parts.length>cap)G.parts.splice(0,G.parts.length-cap);
  for(const r of G.rings){r.life-=dt;r.r+=260*dt}G.rings=G.rings.filter(r=>r.life>0);
  for(const f of G.floats){f.life-=dt;f.y-=46*dt}G.floats=G.floats.filter(f=>f.life>0);
  const dv=(40+4*G.L)/H*dt;for(const d of G.dots){d.y+=dv;if(d.y>1.02){d.y=-.02;d.x=Math.random()}}
  if(G.scene){const s=G.scene;s.planet.y+=dv/6;if(s.planet.y>1.3){s.planet.y=-.3;s.planet.x=rand(.15,.85)}for(const n of s.nebs){n.y+=dv/8;if(n.y>1.5){n.y=-.5;n.x=Math.random()}}}}

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
function rgbOf(hex){const n=parseInt(hex.slice(1),16);return [n>>16,n>>8&255,n&255]}
function shadeHex(hex,k){const f=v=>Math.round(k<0?v*(1+k):v+(255-v)*k);return '#'+rgbOf(hex).map(v=>f(v).toString(16).padStart(2,'0')).join('')}
/* k>0 mixes toward white, k<0 toward black */
function shade(hex,k,a){const f=v=>Math.round(k<0?v*(1+k):v+(255-v)*k);const [r,g,b]=rgbOf(hex);return `rgba(${f(r)},${f(g)},${f(b)},${a==null?1:a})`}
/* the ship: swept wings, a glass canopy, twin engines, and parts that show what it has picked up
   (nose guns for Rapid Fire, wing pods for Spread Shot, a glowing core for Power Shot, bigger flames for Speedy Fins) */
function drawShip(c,p,t){if(p.out)return;const w=G.shipW,h=G.shipH,u=p.up,col=p.col;c.save();c.translate(p.x,p.y);
  if(p.down){const rr=w*.6+Math.sin(t*4)*3;c.fillStyle='rgba(200,210,230,.3)';dot(c,0,0,rr);c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.arc(0,0,rr,0,TAU);c.stroke();
    c.font=cfont(13);c.textAlign='center';c.textBaseline='middle';c.fillStyle='#fff';c.fillText(G.coop?`Rescue ${Math.ceil(p.downT)}`:'',0,-rr-12);c.globalAlpha=.6;c.scale(.7,.7)}
  else if(p.inv>0&&Math.floor(t*12)%2)c.globalAlpha=.35;
  if(!p.down&&p.charge>=1&&p.laser<=0){const a=.22+.12*Math.sin(t*6),g=c.createRadialGradient(0,0,w*.2,0,0,w);g.addColorStop(0,shade(col,.5,0));g.addColorStop(.65,shade(col,.3,a));g.addColorStop(1,shade(col,0,0));c.fillStyle=g;dot(c,0,0,w)}
  c.rotate(clamp(p.vx/2600,-.25,.25));
  /* engine flames */
  if(!p.down){const boost=1+(u.speed|0)*.25+(p.mvy<-60?.35:0);
    for(const sx of [-.15,.15]){const fl=h*(.2+.08*Math.sin(t*41+sx*20)+rand(0,.05))*boost,y0=h*.38;
      const g=c.createLinearGradient(0,y0,0,y0+fl);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.3,'rgba(255,214,120,.9)');g.addColorStop(1,'rgba(255,90,60,0)');
      c.fillStyle=g;c.beginPath();c.moveTo(w*(sx-.07),y0);c.quadraticCurveTo(w*sx,y0+fl*1.3,w*(sx+.07),y0);c.closePath();c.fill()}}
  /* wings */
  const gw=c.createLinearGradient(-w/2,0,w/2,0);gw.addColorStop(0,shade(col,-.4));gw.addColorStop(.5,shade(col,.2));gw.addColorStop(1,shade(col,-.4));
  c.fillStyle=gw;c.beginPath();c.moveTo(0,-h*.2);c.lineTo(w*.5,h*.2);c.lineTo(w*.47,h*.33);c.lineTo(w*.14,h*.27);c.lineTo(-w*.14,h*.27);c.lineTo(-w*.47,h*.33);c.lineTo(-w*.5,h*.2);c.closePath();c.fill();
  c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=Math.max(1.5,w*.03);c.beginPath();c.moveTo(w*.17,h*.08);c.lineTo(w*.42,h*.25);c.moveTo(-w*.17,h*.08);c.lineTo(-w*.42,h*.25);c.stroke();
  /* wing guns: one per wing, then two */
  const s=u.spread|0;c.fillStyle='#e2e8f0';
  if(s>=1)for(const sx of [-.36,.36]){c.beginPath();c.roundRect(w*sx-w*.025,-h*.1,w*.05,h*.3,3);c.fill()}
  if(s>=2)for(const sx of [-.5,.5]){c.beginPath();c.roundRect(w*sx-w*.025,-h*.02,w*.05,h*.26,3);c.fill()}
  /* tail fins and engine bells */
  c.fillStyle=shade(col,-.5);c.beginPath();c.moveTo(w*.09,h*.18);c.lineTo(w*.26,h*.47);c.lineTo(w*.09,h*.4);c.closePath();c.moveTo(-w*.09,h*.18);c.lineTo(-w*.26,h*.47);c.lineTo(-w*.09,h*.4);c.closePath();c.fill();
  c.fillStyle='#334155';for(const sx of [-.15,.15]){c.beginPath();c.roundRect(w*(sx-.075),h*.27,w*.15,h*.13,3);c.fill()}
  /* nose guns for Rapid Fire */
  const rf=u.rapid|0;if(rf){c.fillStyle='#cbd5e1';const xs=rf>=2?[-.1,.1]:[0];if(rf>=3)xs.push(0);for(const gx of xs){c.beginPath();c.roundRect(w*gx-w*.025,-h*.5-(gx?-h*.12:h*.06),w*.05,h*.16,2);c.fill()}}
  /* body */
  const gf=c.createLinearGradient(-w*.18,0,w*.18,0);gf.addColorStop(0,shade(col,-.25));gf.addColorStop(.45,shade(col,.45));gf.addColorStop(1,shade(col,-.3));
  c.fillStyle=gf;c.beginPath();c.moveTo(0,-h/2);c.bezierCurveTo(w*.21,-h*.28,w*.2,h*.2,w*.12,h*.36);c.lineTo(-w*.12,h*.36);c.bezierCurveTo(-w*.2,h*.2,-w*.21,-h*.28,0,-h/2);c.closePath();c.fill();
  c.strokeStyle=u.plasma?'#60a5fa':'rgba(15,23,42,.35)';c.lineWidth=u.plasma?2.5:1.5;c.stroke();
  /* laser cells on the tail, missile rails on the wings, a spark ring for Long Lasting, glowing tips for Starburst */
  if(u.battery){c.fillStyle='rgba(103,232,249,.35)';for(const sx of [-.26,.26])dot(c,w*sx,h*.36,w*.07);c.fillStyle='#67e8f9';for(const sx of [-.26,.26]){c.beginPath();c.roundRect(w*sx-w*.03,h*.3,w*.06,h*.12,2);c.fill()}}
  if(u.missile||u.hive){c.fillStyle='#fdba74';for(const sx of [-.4,.4]){c.beginPath();c.roundRect(w*sx-w*.025,h*.05,w*.05,h*.2,2);c.fill();c.fillStyle='#ef4444';c.beginPath();c.moveTo(w*sx-w*.025,h*.05);c.lineTo(w*sx,h*-.01);c.lineTo(w*sx+w*.025,h*.05);c.closePath();c.fill();c.fillStyle='#fdba74'}}
  if(u.long){const n=4+2*u.long;c.fillStyle='rgba(253,230,138,.75)';for(let i=0;i<n;i++){const a=t*2+i*TAU/n;dot(c,Math.cos(a)*w*.62,Math.sin(a)*w*.62*.8,2)}}
  if(u.starburst){c.fillStyle='rgba(254,240,138,.4)';dot(c,-w*.5,h*.2,w*.1);dot(c,w*.5,h*.2,w*.1);c.fillStyle='#fef08a';dot(c,-w*.5,h*.2,w*.05);dot(c,w*.5,h*.2,w*.05)}
  /* canopy */
  const gc=c.createLinearGradient(0,-h*.32,0,h*.05);gc.addColorStop(0,'#bae6fd');gc.addColorStop(.45,'#1e3a8a');gc.addColorStop(1,'#0f172a');
  c.fillStyle=gc;ell(c,0,-h*.12,w*.095,h*.17);c.fill();
  c.fillStyle='rgba(255,255,255,.75)';ell(c,-w*.03,-h*.19,w*.025,h*.07);c.fill();
  /* power core for Power Shot */
  const pw=u.power|0;if(pw){const pr=w*(.05+.02*pw)*(1+.15*Math.sin(t*8));c.fillStyle='rgba(240,171,252,.35)';dot(c,0,h*.17,pr*2.2);c.fillStyle='#fdf4ff';dot(c,0,h*.17,pr);c.fillStyle='rgba(232,121,249,.8)';dot(c,0,h*.17,pr*.6)}
  /* wing-tip lights */
  const blink=(Math.floor(t*2)%2)?1:.3;c.fillStyle=`rgba(248,113,113,${blink})`;dot(c,-w*.48,h*.24,w*.035);c.fillStyle=`rgba(74,222,128,${1.3-blink})`;dot(c,w*.48,h*.24,w*.035);
  /* muzzle flash */
  if(p.muzzle>0){c.save();c.globalCompositeOperation='lighter';c.fillStyle=shade(col,.6,p.muzzle*12);starPath(c,0,-h*.56,w*.16);c.fill();c.restore()}
  if(p.shieldOn){const r=w*(u.guardian?.95:.74),sc=u.guardian?'253,224,71':'125,211,252',g=c.createRadialGradient(0,0,r*.55,0,0,r);g.addColorStop(0,`rgba(${sc},0)`);g.addColorStop(1,`rgba(${sc},.35)`);c.fillStyle=g;dot(c,0,0,r);
    c.strokeStyle=`rgba(${sc},.9)`;c.lineWidth=2.5;c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();
    c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=3;c.beginPath();c.arc(0,0,r,t*3,t*3+.9);c.stroke()}
  if(G.coop){c.fillStyle=col;c.fillRect(-w*.3,h*.68,w*.6,3)}
  c.restore()}
/* the drones: little wingmen on a dashed tether, striped when they belong to the Hive */
function drawDrones(c,p,t){if(p.down||p.out)return;const w=G.shipW*.28;for(const d of dronePos(p)){
  c.save();c.strokeStyle=shade(p.col,.3,.35);c.lineWidth=1.5;c.setLineDash([3,4]);c.beginPath();c.moveTo(p.x+d.s*G.shipW*.3,p.y);c.lineTo(d.x,d.y);c.stroke();c.setLineDash([]);
  c.translate(d.x,d.y+Math.sin(t*5+d.s)*2);const g=c.createLinearGradient(-w/2,0,w/2,0);g.addColorStop(0,shade(p.col,-.3));g.addColorStop(.5,shade(p.col,.4));g.addColorStop(1,shade(p.col,-.3));c.fillStyle=g;
  c.beginPath();c.moveTo(0,-w*.9);c.lineTo(w*.55,w*.5);c.lineTo(0,w*.25);c.lineTo(-w*.55,w*.5);c.closePath();c.fill();
  if(p.up.hive){c.fillStyle='rgba(253,224,71,.8)';c.fillRect(-w*.2,-w*.25,w*.4,w*.1);c.fillRect(-w*.32,w*.02,w*.64,w*.1)}
  c.fillStyle=`rgba(255,255,255,${(Math.floor(t*6+d.s)&1)?1:.4})`;dot(c,0,-w*.15,w*.12);
  const fl=w*(.3+.1*Math.sin(t*40));c.fillStyle='rgba(255,180,90,.8)';c.beginPath();c.moveTo(-w*.12,w*.4);c.lineTo(0,w*.4+fl);c.lineTo(w*.12,w*.4);c.closePath();c.fill();c.restore()}}
function drawLaser(c,p,t){const bot=p.y-G.shipH*.45,hw=G.shipW*(.3+.05*Math.sin(t*50))*Math.min(1,p.laser*3,(p.laserLen-p.laser)*8+.2);
  c.save();c.globalCompositeOperation='lighter';
  const g=c.createLinearGradient(p.x-hw*1.8,0,p.x+hw*1.8,0);g.addColorStop(0,shade(p.col,0,0));g.addColorStop(.3,shade(p.col,.2,.55));g.addColorStop(.5,'rgba(255,255,255,.95)');g.addColorStop(.7,shade(p.col,.2,.55));g.addColorStop(1,shade(p.col,0,0));
  c.fillStyle=g;c.fillRect(p.x-hw*1.8,0,hw*3.6,bot);c.fillStyle='rgba(255,255,255,.9)';c.fillRect(p.x-hw*.25,0,hw*.5,bot);
  const r=G.shipW*.55,ng=c.createRadialGradient(p.x,bot,0,p.x,bot,r);ng.addColorStop(0,'rgba(255,255,255,.95)');ng.addColorStop(1,shade(p.col,0,0));c.fillStyle=ng;dot(c,p.x,bot,r);
  c.restore()}
/* the glimmer before an enemy fires (Galaxy Attack style) and the icy tint while Freeze is on */
function drawStatus(c,e,t){if(e.tele){c.save();c.globalCompositeOperation='lighter';c.fillStyle=`rgba(255,255,255,${.18+.18*Math.sin(t*30)})`;dot(c,e.x,e.y,e.r*1.3);c.restore()}
  if(G.pw.freeze>0){c.fillStyle='rgba(125,211,252,.28)';dot(c,e.x,e.y,e.r*1.15);c.strokeStyle='rgba(186,230,253,.9)';c.lineWidth=2;c.beginPath();c.arc(e.x,e.y,e.r*1.15,0,TAU);c.stroke()}}
function drawRock(c,e,fl){const r=e.r;c.rotate(e.rot);const g=c.createRadialGradient(-r*.3,-r*.3,r*.1,0,0,r);g.addColorStop(0,fl?'#fff':'#a8a29e');g.addColorStop(1,fl?'#fff':'#44403c');c.fillStyle=g;
  c.beginPath();e.verts.forEach((v,i)=>{const a=i/e.verts.length*TAU;c.lineTo(Math.cos(a)*r*v,Math.sin(a)*r*v)});c.closePath();c.fill();c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=2;c.stroke();
  c.fillStyle='rgba(0,0,0,.25)';for(const [cx,cy,cr] of e.crat)dot(c,cx*r,cy*r,cr*r)}
function drawBee(c,e,t,fl){const r=e.r,f=Math.sin(e.wing)*.5;c.scale(e.vx<0?-1:1,1);
  c.fillStyle='rgba(255,255,255,.55)';ell(c,-r*.1,-r*.9,r*.7,r*.35*(1+f));c.fill();ell(c,r*.3,-r*.8,r*.5,r*.3*(1-f));c.fill();
  c.fillStyle=fl?'#fff':'#fbbf24';ell(c,0,0,r,r*.7);c.fill();
  c.fillStyle='#1f2937';for(const sx of [-.35,.05,.45])ell(c,sx*r,0,r*.12,r*.66),c.fill();
  c.fillStyle='#fff';dot(c,r*.65,-r*.2,r*.22);c.fillStyle='#1f2937';dot(c,r*.72,-r*.2,r*.1);
  c.strokeStyle='#1f2937';c.lineWidth=2;c.beginPath();c.moveTo(-r,0);c.lineTo(-r*1.4,r*.1);c.stroke()}
function drawSnatch(c,e,t,fl){const r=e.r;
  if(e.held){c.save();c.strokeStyle='rgba(250,204,21,.8)';c.lineWidth=3;c.setLineDash([6,6]);c.lineDashOffset=-t*40;c.beginPath();c.moveTo(0,r*.4);c.lineTo(e.held.x-e.x,e.held.y-e.y-G.r);c.stroke();c.restore()}
  c.fillStyle=fl?'#fff':'#4c1d95';ell(c,0,0,r,r*.6);c.fill();c.fillStyle=fl?'#fff':'#7c3aed';ell(c,0,-r*.35,r*.55,r*.4);c.fill();
  c.fillStyle='#fde047';dot(c,0,-r*.35,r*.2);c.fillStyle='#1f2937';dot(c,0,-r*.35,r*.09);
  c.strokeStyle=fl?'#fff':'#a78bfa';c.lineWidth=Math.max(3,r*.18);c.lineCap='round';const o=e.held?.55:.9+.15*Math.sin(t*4);
  for(const s of [-1,1]){c.beginPath();c.moveTo(s*r*.5,r*.3);c.quadraticCurveTo(s*r*o,r*1.1,s*r*.25,r*1.4);c.stroke()}}
/* the Mothership: a wide hull with two turret domes; its core is a shut eye until both turrets are gone */
function drawBoss(c,e,t){const r=e.r,fl=e.flash>0;c.save();c.translate(e.x,e.y);
  const g=c.createLinearGradient(0,-r*.5,0,r*.5);g.addColorStop(0,fl?'#fff':'#94a3b8');g.addColorStop(1,fl?'#fff':'#334155');c.fillStyle=g;ell(c,0,0,r,r*.5);c.fill();c.strokeStyle='rgba(15,23,42,.5)';c.lineWidth=3;c.stroke();
  c.fillStyle=fl?'#fff':'#64748b';ell(c,0,-r*.3,r*.45,r*.3);c.fill();
  for(let i=-3;i<=3;i++){c.fillStyle=`rgba(254,240,138,${(Math.floor(t*3+i)&1)?.9:.3})`;dot(c,i*r*.22,r*.3,r*.035)}
  const open=e.open,er=r*.26;c.fillStyle=open?'#fde68a':'#1e293b';dot(c,0,r*.05,er);
  if(open){const cg=c.createRadialGradient(0,r*.05,2,0,r*.05,er);cg.addColorStop(0,'rgba(255,255,255,.95)');cg.addColorStop(1,'rgba(250,204,21,.2)');c.fillStyle=cg;dot(c,0,r*.05,er);c.fillStyle='#b91c1c';dot(c,0,r*.05,er*.4)}
  else{c.strokeStyle='#94a3b8';c.lineWidth=3;c.beginPath();c.moveTo(-er*.8,r*.05);c.lineTo(er*.8,r*.05);c.stroke()}
  if(e.tele&&open){c.globalCompositeOperation='lighter';c.fillStyle=`rgba(255,255,255,${.2+.2*Math.sin(t*30)})`;dot(c,0,r*.05,er*1.4)}
  c.restore();
  for(const tr of e.turrets){if(tr.hp<=0){c.fillStyle='rgba(30,41,59,.8)';dot(c,tr.x,tr.y,tr.r*.6);continue}c.save();c.translate(tr.x,tr.y);
    c.strokeStyle=tr.flash>0?'#fff':'#1f2937';c.lineWidth=Math.max(4,tr.r*.4);c.lineCap='round';c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(tr.ang)*tr.r*1.3,Math.sin(tr.ang)*tr.r*1.3);c.stroke();
    c.fillStyle=tr.flash>0?'#fff':'#475569';dot(c,0,0,tr.r);c.fillStyle=tr.flash>0?'#fff':'#f87171';dot(c,0,0,tr.r*.35);
    if(tr.tele){c.globalCompositeOperation='lighter';c.fillStyle=`rgba(255,255,255,${.2+.2*Math.sin(t*30)})`;dot(c,0,0,tr.r*1.5)}
    c.restore();
    const w=tr.r*2,x=tr.x-w/2,y=tr.y-tr.r-14;c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.roundRect(x-2,y-2,w+4,10,5);c.fill();c.fillStyle='#f5c842';c.beginPath();c.roundRect(x,y,w*Math.max(0,tr.hp)/tr.max,6,3);c.fill()}
  const w=r*1.6,x=e.x-w/2,y=e.y-r*.5-26;c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.roundRect(x-2,y-2,w+4,14,7);c.fill();c.fillStyle=e.hp/e.max>.5?'#22c55e':e.hp/e.max>.25?'#f5c842':'#ef4444';c.beginPath();c.roundRect(x,y,w*Math.max(0,e.hp)/e.max,10,5);c.fill()}
function drawCap(c,k,t){const pw=POWERS[k.pu];if(!pw)return;c.save();c.translate(k.x,k.y);c.rotate(Math.sin(t*2+k.ph)*.18);
  c.fillStyle=shade(pw.col,0,.26+.1*Math.sin(t*6+k.ph));dot(c,0,0,27);c.fillStyle=pw.col;c.beginPath();c.roundRect(-19,-12,38,24,12);c.fill();
  c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.roundRect(-15,-9,30,8,4);c.fill();c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.roundRect(-19,-12,38,24,12);c.stroke();
  c.font=cfont(14);c.textAlign='center';c.textBaseline='middle';c.lineWidth=3;c.strokeStyle='rgba(15,23,42,.8)';c.strokeText(pw.tag,0,1);c.fillStyle='#fff';c.fillText(pw.tag,0,1);c.restore()}
function drawAstro(c,k,t){c.save();c.translate(k.x,k.y);c.rotate(Math.sin(t*1.5+k.ph)*.25);const wave=Math.sin(t*8)*6;
  c.strokeStyle='#e2e8f0';c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(6,2);c.lineTo(14,-8+wave);c.moveTo(-6,2);c.lineTo(-12,8);c.moveTo(-4,12);c.lineTo(-6,22);c.moveTo(4,12);c.lineTo(7,22);c.stroke();
  c.fillStyle='#f1f5f9';c.beginPath();c.roundRect(-8,-2,16,16,5);c.fill();c.fillStyle='#fb923c';c.beginPath();c.roundRect(-5,2,10,5,2);c.fill();
  c.fillStyle='#f8fafc';dot(c,0,-10,8);c.fillStyle='#1e3a8a';ell(c,1,-10,5,4);c.fill();c.fillStyle='rgba(255,255,255,.7)';dot(c,-1,-12,1.5);
  c.fillStyle='#f87171';c.beginPath();c.moveTo(14,-8+wave);c.lineTo(24,-12+wave);c.lineTo(14,-16+wave);c.closePath();c.fill();c.restore();
  c.font=cfont(12);c.textAlign='center';c.textBaseline='middle';c.lineWidth=3;c.strokeStyle='rgba(15,23,42,.7)';c.strokeText('HELP!',k.x,k.y-28);c.fillStyle='#fff';c.fillText('HELP!',k.x,k.y-28)}
function drawEnemy(c,e,t){if(e.kind==='hydra'){drawHydra(c,e,t);return drawStatus(c,e,t)}if(e.kind==='boss'){drawBoss(c,e,t);return drawStatus(c,e,t)}
  c.save();c.translate(e.x,e.y);const fl=e.flash>0;
  if(e.kind==='rock')drawRock(c,e,fl);
  else if(e.kind==='bee')drawBee(c,e,t,fl);
  else if(e.kind==='snatch')drawSnatch(c,e,t,fl);
  else if(e.kind==='crash'){c.rotate(t*2);c.fillStyle=fl?'#fff':'#ef4444';c.beginPath();for(let i=0;i<16;i++){const a=i/16*TAU,rr=i%2?e.r:e.r*.7;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}c.closePath();c.fill();
    c.fillStyle='#fff';dot(c,-e.r*.25,-e.r*.1,e.r*.16);dot(c,e.r*.25,-e.r*.1,e.r*.16);c.fillStyle='#1f2937';dot(c,-e.r*.25,-e.r*.05,e.r*.08);dot(c,e.r*.25,-e.r*.05,e.r*.08)}
  else if(e.kind==='shoot'){c.fillStyle=fl?'#fff':'#a78bfa';ell(c,0,0,e.r,e.r*.45);c.fill();c.fillStyle=fl?'#fff':'#ddd6fe';ell(c,0,-e.r*.3,e.r*.5,e.r*.4);c.fill();c.fillStyle='#fde68a';for(let i=-1;i<=1;i++)dot(c,i*e.r*.5,e.r*.15,3+(Math.floor(t*4+i)&1))}
  else{c.fillStyle=fl?'#fff':'#64748b';c.beginPath();c.roundRect(-e.r,-e.r*.8,e.r*2,e.r*1.6,12);c.fill();c.fillStyle=fl?'#fff':'#334155';c.beginPath();c.roundRect(-e.r*.6,-e.r*.4,e.r*1.2,e.r*.8,8);c.fill();c.fillStyle='#f87171';dot(c,-e.r*.3,0,5);dot(c,e.r*.3,0,5);
    const w=e.r*2.2,x=-w/2,y=-e.r-18;c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.roundRect(x-2,y-2,w+4,14,7);c.fill();c.fillStyle=e.hp/e.max>.5?'#22c55e':e.hp/e.max>.25?'#f5c842':'#ef4444';c.beginPath();c.roundRect(x,y,w*Math.max(0,e.hp)/e.max,10,5);c.fill()}
  c.restore();drawStatus(c,e,t)}
function drawScene(c){const s=G.scene;if(!s)return;
  for(const n of s.nebs){const g=c.createRadialGradient(n.x*W,n.y*H,0,n.x*W,n.y*H,n.r*W);g.addColorStop(0,n.col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;dot(c,n.x*W,n.y*H,n.r*W)}
  const p=s.planet,pr=p.r*W,px=p.x*W,py=p.y*H;const g=c.createRadialGradient(px-pr*.4,py-pr*.4,pr*.1,px,py,pr);g.addColorStop(0,shade(p.col,.3));g.addColorStop(1,shade(p.col,-.5));c.fillStyle=g;dot(c,px,py,pr);
  if(p.ring){c.save();c.translate(px,py);c.rotate(p.tilt);c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=pr*.12;c.beginPath();c.ellipse(0,0,pr*1.6,pr*.35,0,0,TAU);c.stroke();c.restore()}}
function draw(){const c=cx,t=G.t;c.setTransform(DPR(),0,0,DPR(),0,0);c.clearRect(0,0,W,H);c.save();
  if(G.shake>0)c.translate(rand(-1,1)*G.shake*.6,rand(-1,1)*G.shake*.6);
  drawScene(c);
  c.fillStyle='rgba(255,255,255,.22)';for(const d of G.dots)dot(c,d.x*W,d.y*H,d.s);
  for(const b of G.bullets){
    if(b.missile){c.save();c.translate(b.x,b.y);c.rotate(Math.atan2(b.vy,b.vx)+Math.PI/2);c.fillStyle='#fdba74';c.beginPath();c.roundRect(-3,-10,6,20,3);c.fill();c.fillStyle='#ef4444';c.beginPath();c.moveTo(-3,-10);c.lineTo(0,-16);c.lineTo(3,-10);c.closePath();c.fill();c.fillStyle='rgba(255,220,120,.9)';c.beginPath();c.moveTo(-3,10);c.lineTo(0,16+rand(0,4));c.lineTo(3,10);c.closePath();c.fill();c.restore()}
    else if(b.plasma){c.fillStyle='rgba(59,130,246,.35)';c.beginPath();c.roundRect(b.x-9,b.y-16,18,32,9);c.fill();c.fillStyle='#93c5fd';c.beginPath();c.roundRect(b.x-5,b.y-12,10,24,5);c.fill();c.fillStyle='#fff';c.beginPath();c.roundRect(b.x-2,b.y-9,4,12,2);c.fill()}
    else{const L=b.pierce?26:18;c.fillStyle=b.col;c.beginPath();c.roundRect(b.x-3,b.y-L/2,6,L,3);c.fill();if(b.pierce){c.fillStyle='#fff';c.beginPath();c.roundRect(b.x-2,b.y-L/2,4,8,2);c.fill()}}}
  for(const e of G.enemies)drawEnemy(c,e,t);
  for(const s of G.eshots){c.fillStyle='#f87171';dot(c,s.x,s.y,s.r);c.fillStyle='#fff';dot(c,s.x-2,s.y-2,2)}
  for(const k of G.pickups){if(k.kind==='heart'){c.fillStyle='#f87171';heartPath(c,k.x,k.y,10);c.fill()}else if(k.kind==='cap')drawCap(c,k,t);else if(k.kind==='astro')drawAstro(c,k,t);else{c.fillStyle='#fde68a';dot(c,k.x,k.y,8);c.fillStyle='#f59e0b';dot(c,k.x,k.y,4)}}
  if(G.beam){c.save();c.strokeStyle='rgba(125,211,252,.7)';c.lineWidth=4;c.setLineDash([8,8]);c.lineDashOffset=-t*60;c.beginPath();c.moveTo(G.beam[0].x,G.beam[0].y);c.lineTo(G.beam[1].x,G.beam[1].y);c.stroke();c.restore()}
  for(const b of G.bubbles)drawToken(c,b,t);
  for(const e of G.enemies)if(e.kind==='hydra')hydraLabel(c,e);
  for(const p of G.players)if(p.laser>0&&!p.down&&!p.out)drawLaser(c,p,t);
  for(const p of G.players){drawShip(c,p,t);drawDrones(c,p,t)}
  for(const p of G.parts){c.globalAlpha=clamp(p.life*1.6,0,1);c.fillStyle=p.col;
    if(p.rect){c.save();c.translate(p.x,p.y);c.rotate(p.rot);c.fillRect(-p.r/2,-p.r,p.r,p.r*2);c.restore()}else if(p.star){starPath(c,p.x,p.y,p.r*1.4);c.fill()}else dot(c,p.x,p.y,p.r)}
  c.globalAlpha=1;
  for(const r of G.rings){c.strokeStyle=`rgba(255,255,255,${r.life*1.6})`;c.lineWidth=4;c.beginPath();c.arc(r.x,r.y,r.r,0,TAU);c.stroke()}
  c.textAlign='center';c.textBaseline='middle';
  for(const f of G.floats){c.globalAlpha=clamp(f.life*1.5,0,1);c.font=cfont(f.size);c.lineWidth=6;c.strokeStyle='rgba(25,30,55,.75)';c.strokeText(f.text,f.x,f.y);c.fillStyle=f.col;c.fillText(f.text,f.x,f.y)}
  c.globalAlpha=1;
  if(G.flash>0){c.fillStyle=`rgba(${G.flashCol},${G.flash*.45})`;c.fillRect(-20,-20,W+40,H+40)}
  if(G.pw.warp>0||G.pw.freeze>0){const col=G.pw.freeze>0?'125,211,252':'167,139,250',g=c.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.85);g.addColorStop(0,`rgba(${col},0)`);g.addColorStop(1,`rgba(${col},.3)`);c.fillStyle=g;c.fillRect(0,0,W,H)}
  drawStick(c,t);
  for(const w of G.warns){const x=w.side?W-16:16,d=w.side?-1:1;c.globalAlpha=.5+.5*Math.sin(t*22);c.fillStyle='#f87171';c.beginPath();c.moveTo(x+d*10,w.y);c.lineTo(x-d*8,w.y-14);c.lineTo(x-d*8,w.y+14);c.closePath();c.fill();c.globalAlpha=1}
  c.restore()}

/* ---------- results ---------- */
function finish(){const g=G;G=null;stick=null;$('#upgrade').hidden=true;$('#pauseMenu').hidden=true;
  const won=g.won,maxHearts=Math.max(...g.players.map(p=>p.down||p.out?0:p.hearts));
  /* a wave counts once it was cleared, even if the kid quit during the banner or the card pick */
  const waveDone=g.phase==='clear'||g.phase==='upgrade'||g.phase==='blitz';
  const stars=won?(g.wrongs===0?3:maxHearts>=3?2:1):0,wavesCleared=won?WAVES:waveDone?g.wave:g.wave-1;
  const runStats=Object.assign({},g.stats,{wins:won?1:0,untouched:won&&g.stats.hurt===0?1:0,perfect:won&&g.wrongs===0?1:0,chain4:g.stats.chainMax>=9?1:0,streak8:g.bestStreak>=8?1:0,collected:g.collected,endless5:g.endless&&g.wave>=5?1:0});if(won)runStats['sector:'+g.sector.id]=1;const doneBy={};
  const base=g.right*2+g.collected+wavesCleared*3+stars*5+g.bonusTreats;const earnedBy={};let prevBest=0,newBest=false;
  /* the four medals (all need the world cleared); each one pays 10 treats the first time */
  const medals={p:won&&g.wrongs===0,u:won&&g.stats.hurt===0,r:won&&g.stats.rescues>=3,b:won&&g.stats.blitzPerfect>0},newMedals=[];
  g.ids.forEach((id,i)=>{const p=PF(id);const earned=p.perks.includes('p_luck')?Math.round(base*1.25):base;earnedBy[id]=earned;p.cur=(p.cur|0)+earned;const cur0=p.cur;
    const old=p.best[g.id]|0;if(i===0){prevBest=old;newBest=g.score>old&&old>0}if(g.score>old)p.best[g.id]=g.score;
    if(g.endless){p.best['endless-wave']=Math.max(p.best['endless-wave']|0,g.wave)}else p.stars[g.id]=Math.max(p.stars[g.id]|0,stars);
    /* missions: add this run's counters, pay out the finished ones and slide the next ones in */
    const mm=missionsOf(p),done=[];for(const a of mm.active){const d=MISSION_BY[a.id];a.n+=runStats[d.stat]|0;if(a.n>=d.n){done.push(d);p.cur+=d.pay;mm.done++}}
    if(done.length){mm.active=mm.active.filter(a=>!done.some(d=>d.id===a.id));missionsOf(p)}doneBy[id]=done;
    for(const m of MEDAL_IDS)if(medals[m]&&!g.endless){const key=g.id+'/'+m;if(!p.medals[key]){p.medals[key]=1;p.cur+=10;if(i===0)newMedals.push(m)}}
    earnedBy[id]+=p.cur-cur0;  /* medal and mission treats show in the total too */
    if(!g.endless)p.skill[g.sector.id]=Math.round(clamp(g.L*.5+g.peakL*.5-.5,1,L_MAX)*100)/100;
    for(const l of g.log){const box=l.q.op==='tables'?p.facts:p.ops,key=l.q.op==='tables'?l.q.key:l.q.op;const f=box[key]||(box[key]={r:0,w:0});if(l.ok)f.r++;else f.w++}
    /* levels only ever go up: a copy merged in from another device mid-world may already be higher */
    const pl=g.players[i],ups=isObj(p.ups)?p.ups:{};p.ups={};for(const k of UP_ORDER){const n=Math.min(UPGRADES[k].max,Math.max(ups[k]|0,pl.up[k]|0));if(n)p.ups[k]=n}
    p.games=(p.games|0)+1;if(g.coop){p.coop.played++;if(won)p.coop.wins++}persistFor(id)});
  $('#resTitle').textContent=g.endless?(g.wave>1?`Wave ${g.wave} reached!`:'Endless run over'):won?(stars===3?'Perfect world!':'World clear!'):g.topBeaten?'New top score!':'Game over';
  $('#resSub').textContent=g.endless?`Endless${g.topBeaten?' · new top score':''}${g.coop?` · ${kid(g.ids[0]).name} & ${kid(g.ids[1]).name}`:''}`:`${g.sector.name} · World ${g.wi}${won?'':` · wave ${g.wave} of ${WAVES}`}${g.coop?` · ${kid(g.ids[0]).name} & ${kid(g.ids[1]).name}`:''}`;
  $('#resStars').innerHTML=g.endless?'':starSvg(false).repeat(3);
  $('#resMissions').innerHTML=g.ids.map(id=>(doneBy[id]||[]).map(d=>`<span class="chip-done">${g.coop?kid(id).name+': ':''}Mission done! ${d.name} · +${d.pay} treats</span>`).join('')).join('');
  $('#resBest').innerHTML=newBest?`<span class="newbest">Beat your old top of ${prevBest.toLocaleString()}!</span>`:'';
  $('#rScore').textContent=g.score.toLocaleString();$('#rRight').textContent=`${g.right}/${g.asked}`;$('#rCombo').textContent=g.bestStreak;$('#rCur').innerHTML=`+${earnedBy[g.ids[0]]}`;
  $('#resTeam').textContent=g.coop?`${g.players.map(p=>`${kid(p.id).name} caught ${p.catches}`).join(' · ')} · ${g.team} teamwork catches · ${earnedBy[g.ids[1]]} treats each`:'';
  const p0m=PF(g.ids[0]).medals;$('#resMedals').innerHTML=g.endless?'':MEDAL_IDS.map(m=>{const on=!!p0m[g.id+'/'+m],nw=newMedals.includes(m);return `<span class="medal${on?' on':''}${nw?' new':''}" title="${MEDALS[m].blurb}"><i>${MEDALS[m].ic}</i>${MEDALS[m].name}${nw?'<em>NEW +10</em>':''}</span>`}).join('');
  const st=g.stats;$('#resExtra').textContent=[st.kills?`${st.kills} enemies down`:'',st.chainMax>=3?`best chain ×${1+Math.min(3,Math.floor(st.chainMax/3))}`:'',st.caps?`${st.caps} power-up${st.caps>1?'s':''}`:'',st.rescues?`${st.rescues} astronaut${st.rescues>1?'s':''} rescued`:'',g.blitzDone?`Blitz ${st.blitzKills}/16`:''].filter(Boolean).join(' · ');
  const miss=[...new Set(g.log.filter(l=>!l.ok).map(l=>`${l.q.text} = ${l.q.ans}`))];
  $('#practice').innerHTML=miss.length?`<h3 style="margin:8px 0">Ones to practice</h3><div class="chips">${miss.map(m=>`<span class="chip-m">${m}</span>`).join('')}</div>`:(g.right>0?'<h3 style="margin:8px 0">Every answer right!</h3>':'');
  $('#nextBtn').hidden=g.endless||!worldOpen(PF(g.ids[0]),g.si,g.wi+1);
  show('results');
  const sv=document.querySelectorAll('#resStars .st');for(let i=0;i<stars&&i<sv.length;i++)setTimeout(()=>{sv[i].classList.add('on');Snd.star(i);const r=sv[i].getBoundingClientRect();fxBurst(r.left+r.width/2,r.top+r.height/2,30)},500+i*450);
  if(won)setTimeout(()=>fxConfetti(160),300)}
$('#againBtn').onclick=()=>{if(lastWorld)startWorld(lastWorld[0],lastWorld[1])};
$('#nextBtn').onclick=()=>{if(lastWorld)startWorld(lastWorld[0],lastWorld[1]+1)};
$('#mapBtn').onclick=()=>{Snd.click();openMap()};

/* ---------- pause ---------- */
function setPause(on){if(!G)return;G.paused=on;$('#pauseMenu').hidden=!on;
  $('#pauseKeys').textContent=G.coop?'P1: W A S D to fly, F to shoot, Space to capture, left Shift laser, Q bomb · P2: arrow keys, . or right Ctrl to shoot, Enter to capture, right Shift laser, / bomb':'Arrow keys or W A S D to fly · Space to capture, left Ctrl to shoot (or let auto-fire do it) · left Shift for the laser · B for a bomb · on a touch screen drag to fly';
  $('#fsBtn').hidden=!canFull();$('#fsBtn').setAttribute('aria-pressed',String(!!document.fullscreenElement));$('#pAuto').setAttribute('aria-pressed',String(P().autoFire!==false));
  try{if(Snd.ctx){on?Snd.ctx.suspend():Snd.ctx.resume()}}catch(e){}stick=null;G.players.forEach(p=>{p.held={};p.target=null;p.stick=null});applyTouchLayout()}
$('#pauseBtn').onclick=()=>{setPause(!(G&&G.paused));$('#pauseBtn').blur()};
$('#fsBtn').onclick=()=>{Snd.click();if(document.fullscreenElement){try{document.exitFullscreen().catch(()=>{})}catch(e){}}else goFull()};
$('#resumeBtn').onclick=()=>{setPause(false);$('#resumeBtn').blur()};
$('#quitBtn').onclick=()=>{setPause(false);if(G&&!G.finished){G.finished=true;finish()}};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&G&&!G.paused&&screen==='game')setPause(true)});
window.addEventListener('blur',()=>{stick=null;if(G)G.players.forEach(p=>{p.held={};p.stick=null})});

/* ---------- input: keyboard maps, drag on the stage, the pad ---------- */
function keyMap(pi){return G.coop?KEYS[pi+1]:KEYS[0]}
function keyAction(map,k,code){for(const a in map)if(map[a].includes(code)||map[a].includes(k))return a;return null}
window.addEventListener('keydown',e=>{const k=e.key;if(screen!=='game'||!G)return;
  if(k==='Escape'||k==='p'||k==='P'){setPause(!G.paused);return}if(G.paused)return;
  if(G.phase==='upgrade'){if(/^[1-4]$/.test(k)){e.preventDefault();Snd.init();pickUp(+k-1)}
    else if(k==='ArrowLeft'||k==='a'||k==='A'||k==='ArrowUp'||k==='w'||k==='W'){e.preventDefault();setUpFocus(G.focus<0?0:G.focus-1)}
    else if(k==='ArrowRight'||k==='d'||k==='D'||k==='ArrowDown'||k==='s'||k==='S'){e.preventDefault();setUpFocus(G.focus<0?0:G.focus+1)}
    else if(k==='Enter'||k===' '||k==='f'||k==='F'||k==='.'){e.preventDefault();if(G.focus>=0){Snd.init();pickUp(G.focus)}}return}
  let used=false;G.players.forEach((p,i)=>{const a=keyAction(keyMap(i),k,e.code);if(!a)return;used=true;if(a==='bomb'||a==='special'){if(!e.repeat){Snd.init();a==='bomb'?useBomb(p):useSpecial(p)}}else{p.held[a]=true;p.target=null}});
  if(used)e.preventDefault()});
window.addEventListener('keyup',e=>{if(!G)return;G.players.forEach((p,i)=>{const a=keyAction(keyMap(i),e.key,e.code);if(a&&a!=='bomb'&&a!=='special')p.held[a]=false})});
/* the ghost thumbstick (Yan 11/3): it appears under the thumb on the stick side of the stage, pushes the ship in the
   direction the thumb moves (full speed at STICK_R), and its base follows if the thumb goes past the rim */
const STICK_R=56;let stick=null;
function stickSide(x){const left=player&&P().stickLeft===true;return left?x<W/2:x>=W/2}
cv.addEventListener('pointerdown',e=>{if(!G||G.paused)return;Snd.init();e.preventDefault();const touch=e.pointerType!=='mouse';if(touch)document.body.classList.add('touch');
  const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;if(stick||(touch&&!stickSide(x)))return;
  stick={id:e.pointerId,ox:x,oy:y,x,y};try{cv.setPointerCapture(e.pointerId)}catch(err){}const p=G.players[0];p.stick={x:0,y:0};p.target=null});
cv.addEventListener('pointermove',e=>{if(!stick||stick.id!==e.pointerId||!G)return;e.preventDefault();const r=cv.getBoundingClientRect(),R=STICK_R*G.bs,x=e.clientX-r.left,y=e.clientY-r.top;
  let dx=x-stick.ox,dy=y-stick.oy;const d=Math.hypot(dx,dy);if(d>R){stick.ox+=dx*(1-R/d);stick.oy+=dy*(1-R/d);dx*=R/d;dy*=R/d}
  stick.x=stick.ox+dx;stick.y=stick.oy+dy;const m=Math.hypot(dx,dy);G.players[0].stick=m<5?{x:0,y:0}:{x:dx/R,y:dy/R}});
const endStick=e=>{if(!stick||(e&&e.pointerId!==undefined&&stick.id!==e.pointerId))return;stick=null;if(G)G.players[0].stick=null};
cv.addEventListener('pointerup',endStick);cv.addEventListener('pointercancel',endStick);
function drawStick(c,t){const p=G.players[0];if(!p||p.down||p.out)return;const R=STICK_R*G.bs;
  if(stick){c.save();c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=3;c.beginPath();c.arc(stick.ox,stick.oy,R,0,TAU);c.stroke();c.fillStyle='rgba(255,255,255,.12)';dot(c,stick.ox,stick.oy,R);
    c.fillStyle='rgba(255,255,255,.7)';dot(c,stick.x,stick.y,R*.42);c.restore()}
  else if(document.body.classList.contains('touch')&&G.t<10&&active()){const x=stickSide(W*.75)?W*.75:W*.25,y=H-R-40;c.save();c.globalAlpha=.3+.12*Math.sin(t*3);c.setLineDash([6,6]);c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.arc(x,y,R,0,TAU);c.stroke();c.setLineDash([]);
    c.font=cfont(13);c.textAlign='center';c.textBaseline='middle';c.fillStyle='#fff';c.fillText('thumb here to fly',x,y+R+16);c.restore()}}
function holdBtn(el,on,off){el.addEventListener('pointerdown',e=>{e.preventDefault();Snd.init();el.classList.add('held');try{el.setPointerCapture(e.pointerId)}catch(err){}on()});
  const up=()=>{el.classList.remove('held');off()};el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);el.addEventListener('contextmenu',e=>e.preventDefault())}
const p1=()=>G&&G.players[0];
holdBtn($('#tbFire'),()=>{const p=p1();if(p)p.held.fire=true},()=>{const p=p1();if(p)p.held.fire=false});
holdBtn($('#tbCap'),()=>{const p=p1();if(p)p.held.capture=true},()=>{const p=p1();if(p)p.held.capture=false});
$('#tbBomb').addEventListener('pointerdown',e=>{e.preventDefault();Snd.init();const p=p1();if(p)useBomb(p)});
$('#tbBomb').addEventListener('contextmenu',e=>e.preventDefault());
/* blur after a click so Space/Enter (fire keys) never re-press a HUD button */
$('#bombs').onclick=()=>{const p=p1();if(p)useBomb(p);$('#bombs').blur()};
$('#special').onclick=()=>{const p=p1();if(p)useSpecial(p);$('#special').blur()};
$('#tbLaser').addEventListener('pointerdown',e=>{e.preventDefault();Snd.init();const p=p1();if(p)useSpecial(p)});
$('#tbLaser').addEventListener('contextmenu',e=>e.preventDefault());
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
window.__ms={get G(){return G},normalize,get saves(){return saves},net:Net,cloud:CLOUD,MSMath,BUILD,SECTORS,WORLD_RAMP,UPGRADES,PERKS,POWERS,MEDALS,EVOS:EVO_IDS,
  input(i,h){if(G&&G.players[i]){Object.assign(G.players[i].held,h);G.players[i].target=null}},pickUp,useBomb,useSpecial,spawnHydra,hydraHit,startWorld,setCoop(ids){coopIds=ids},player:()=>player,P:()=>P(),buyPerk:id=>buyPerk(PERKS[id]),worldOpen:(si,wi)=>worldOpen(P(),si,wi),
  spawnRock,spawnSnatcher,spawnSwarm,spawnBoss,spawnAstro,bossHit,startBlitz,openUpgrade,scoreMul,chainMul,setAuto,setStick,bossWave,MISSIONS,missions:()=>missionsOf(P()),nextWave,
  givePower:(i,id)=>givePower(G.players[i],id),damage:(e,n)=>{e.hp-=n;if(e.hp<=0)killEnemy(e)},applyUp:(i,id)=>applyUp(G.players[i],id,true),drones:i=>drones(G.players[i]),hitPlayer:i=>hitPlayer(G.players[i])};
if(CLOUD&&location.protocol.startsWith('http'))setTimeout(()=>{fetch(location.pathname,{cache:'no-store'}).then(r=>r.text()).then(t=>{const m=t.match(/const BUILD='([^']+)'/);if(m&&m[1]!==BUILD&&!location.search.includes('v='+m[1]))location.replace(location.pathname+'?v='+m[1])}).catch(()=>{})},1500);
})();
