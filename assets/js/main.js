/* ambient background, inject the glow orbs once */
(function(){
  var box=document.getElementById('codebg'); if(!box) return;
  box.innerHTML='<span class="orb o1"></span><span class="orb o2"></span><span class="orb o3"></span><div class="snakes" id="snakes"></div>';
})();

/* grid-tracing square snakes, clean per-cell path following the visible grid */
(function(){
  var host=document.getElementById('snakes'); if(!host) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var CELL=46, TH=3, MAXSNAKES=window.innerWidth<700?4:7, live=0;

  // the grid lines sit at multiples of CELL from the top-left of the fixed layer.
  // snap to the LINE (center of the 1px stroke) so segments sit exactly on it.
  function line(v){ return Math.round(v/CELL)*CELL; }

  function spawn(){
    if(live>=MAXSNAKES) return; live++;
    var W=host.clientWidth, H=host.clientHeight;
    var cols=Math.floor(W/CELL), rows=Math.floor(H/CELL);
    // start on a random intersection, 1 cell inside the edges
    var cx=1+((Math.random()*(cols-2))|0), cy=1+((Math.random()*(rows-2))|0);
    var dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    var d=dirs[(Math.random()*4)|0];
    var LEN=5+((Math.random()*6)|0);   // total cells travelled
    // build the path as a list of grid CELLS (integer coords), turning only at intersections
    var cells=[[cx,cy]];
    for(var i=0;i<LEN;i++){
      // turn only sometimes, and never reverse
      if(Math.random()<0.33){
        var opt=[[ -d[1], d[0] ],[ d[1], -d[0] ]];
        d=opt[(Math.random()*2)|0];
      }
      var nx=cells[cells.length-1][0]+d[0], ny=cells[cells.length-1][1]+d[1];
      // bounce off edges by reversing the turn
      if(nx<1||nx>cols-1||ny<1||ny>rows-1){
        d=[ -d[1], d[0] ]; // quarter-turn instead of going off screen
        nx=cells[cells.length-1][0]+d[0]; ny=cells[cells.length-1][1]+d[1];
        if(nx<1||nx>cols-1||ny<1||ny>rows-1){ break; }
      }
      cells.push([nx,ny]);
    }
    if(cells.length<3){ live--; return; }
    // pixel points on the grid lines
    var pts=cells.map(function(c){ return [c[0]*CELL, c[1]*CELL]; });

    var TAIL=Math.min(pts.length-1, 5);
    // one element per tail segment; each draws a full straight cell-edge
    var segEls=[];
    for(var t=0;t<TAIL;t++){ var el=document.createElement('div'); el.className='seg'; el.style.opacity='0'; host.appendChild(el); segEls.push(el); }

    function draw(el, ax,ay, bx,by, op){
      // straight horizontal or vertical only
      var left=Math.min(ax,bx), top=Math.min(ay,by);
      var horiz=(ay===by);
      var w=horiz?Math.abs(bx-ax):TH, h=horiz?TH:Math.abs(by-ay);
      el.style.left=(horiz?left:left-TH/2)+'px';
      el.style.top=(horiz?top-TH/2:top)+'px';
      el.style.width=w+'px'; el.style.height=h+'px'; el.style.opacity=op;
    }

    var seg=0, prog=0, t0=null;              // seg = current edge index, prog 0..1 along it
    var pxPerMs = CELL/(240+Math.random()*120);
    function frame(ts){
      if(t0==null) t0=ts; var dt=ts-t0; t0=ts;
      prog += dt*pxPerMs/CELL;
      while(prog>=1 && seg<pts.length-2){ prog-=1; seg++; }
      // draw the head partial + full tail edges behind it
      for(var k=0;k<TAIL;k++){
        var edge=seg-k, el=segEls[k];
        if(edge<0){ el.style.opacity='0'; continue; }
        var a=pts[edge], b=pts[edge+1];
        var op=(1-(k/(TAIL))).toFixed(2)*0.95;
        if(k===0){
          // partial along the current edge
          var f=Math.min(1,prog);
          draw(el, a[0],a[1], a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f, op);
        } else {
          draw(el, a[0],a[1], b[0],b[1], op);
        }
      }
      if(seg<pts.length-2){ requestAnimationFrame(frame); }
      else {
        segEls.forEach(function(el,k){ el.style.transition='opacity .45s'; setTimeout(function(){el.style.opacity='0';},k*55); });
        setTimeout(function(){ segEls.forEach(function(el){el.remove();}); live--; }, 700);
      }
    }
    requestAnimationFrame(frame);
  }
  function loop(){ spawn(); setTimeout(loop, 650+Math.random()*950); }
  setTimeout(loop, 600);
})();

/* ticker *//* ticker *//* ticker *//* ticker */
(function(){var items=['Conversion audits','Page &amp; funnel redesign','Custom code &amp; Framer','SEO &amp; Google Business','Analytics &amp; tracking'];
  var h=items.map(function(t){return '<span>'+t+'</span>';}).join('');var el=document.getElementById('tick');if(el)el.innerHTML=h+h;})();
/* results ticker (from the live site line) */
(function(){var items=['More revenue from the traffic you already have','Free teardown, no catch','Fixed price agreed before we start','You own everything we build','Every decision backed by a reason','Two people, on your project start to finish'];
  var h=items.map(function(t){return '<span>'+t+'</span>';}).join('');var el=document.getElementById('results');if(el)el.innerHTML=h+h;})();

/* statement scroll-light */
(function(){var el=document.getElementById('statement');if(!el)return;
  var words=el.dataset.text.split(' ');el.innerHTML=words.map(function(w){return '<span class="w">'+w+'</span> ';}).join('');
  var spans=[].slice.call(el.querySelectorAll('.w'));
  function upd(){var r=el.getBoundingClientRect(),vh=innerHeight;var prog=(vh*0.85-r.top)/(r.height+vh*0.35);prog=Math.max(0,Math.min(1,prog));
    var lit=Math.round(prog*spans.length);spans.forEach(function(s,i){s.classList.toggle('lit',i<lit);});}
  addEventListener('scroll',upd,{passive:true});addEventListener('resize',upd);upd();})();

var IMG={
  "sisterly": "assets/work/sisterly.jpg",
  "bespoke-carpentry": "assets/work/bespoke-carpentry.jpg",
  "woodchester": "assets/work/woodchester.jpg",
  "ruci": "assets/work/ruci.jpg",
  "konk": "assets/work/konk.jpg",
  "sisterly-card": "assets/work/sisterly-card.jpg",
  "konk-card": "assets/work/konk-card.jpg"
};
/* REAL work data (from konar.studio) */
var WORK=[
 /* Eleven Trees placeholder: there is no public screenshot of the site yet, so this
   card reuses the Konk preview. When the real shot is ready, save it as
   assets/work/eleven-trees.jpg, add an "eleven-trees" entry to IMG above, and
   change img:'konk' below to img:'eleven-trees'. */
 {name:'Eleven Trees',sub:'Bespoke garden rooms, South London',url:'#',dom:'eleventrees.co.uk',img:'konk',badge:'Client project · launching soon',
  desc:'A client we are working with right now. A builder with over 100 completed projects and a website that made them look like a one man band. We are rebuilding the whole thing so the work does the selling, and it goes live soon.',tags:['Client work','Strategy','Full build']},
 {name:'Konk',sub:'Solid wood furniture, Bristol',url:'#',dom:'konk.co.uk',img:'konk',badge:'Concept redesign',
  desc:'We rebuilt this furniture product page around one thing: made to order confidence. Honest material detail, real delivery reassurance and one clear path to a bespoke enquiry, so a serious buyer never has to hunt for a reason to trust it.',tags:['Conversion','Product page','Furniture']},
 {name:'SISTERLY',sub:'Women\'s daily multivitamin',url:'https://konar.studio/sisterly-elevator/',dom:'sisterlylab.com',img:'sisterly',badge:'Concept redesign · live',
  desc:'A cluttered subscription offer turned into one clear, confident path to subscribe, with the social proof moved right to the moment someone decides. Fewer choices, more reasons to say yes.',tags:['Conversion','Subscription','Shopify']},
 {name:'The Bespoke Carpentry Co',sub:'Live edge dining tables',url:'https://konar.studio/bespoke-carpentry/',dom:'handmade-furniture.co.uk',img:'bespoke-carpentry',badge:'Concept redesign · live',
  desc:'A high value product page rebuilt around real proof, clear customisation and a confident path to the basket, so the craftsmanship finally sells itself instead of hiding.',tags:['Conversion','Product page','Webflow']},
 {name:'Woodchester Cabinet Makers',sub:'Bespoke kitchens',url:'https://konar.studio/WoodchesterCabinetMakers/',dom:'woodchestercabinetmakers.co.uk',img:'woodchester',badge:'Concept redesign · live',
  desc:'A high value kitchen maker, redesigned to turn quiet browsers into booked design consultations. We made the next step obvious and gave people a reason to take it.',tags:['Lead gen','Consultation','Webflow']},
 {name:'RUCI',sub:'Subscription and lifestyle',url:'https://konar.studio/RUCIUK/',dom:'ruci.uk',img:'ruci',badge:'Concept redesign · live',
  desc:'A redesign focused on making the brand story and the products land on the first visit, so a new visitor gets it straight away instead of bouncing.',tags:['Conversion','Brand story','Shopify']}
];
function witem(w,i){
  var n=String(i+1).padStart(2,'0');
  var tags='<div class="wtags">'+w.tags.map(function(t){return '<span class="wtag">'+t+'</span>';}).join('')+'</div>';
  var isLive=w.url&&w.url!=='#';
  var frameOpen=isLive?'<a class="wframe" href="'+w.url+'" target="_blank" rel="noopener" aria-label="Open '+w.name+'">':'<div class="wframe">';
  var frameClose=isLive?'</a>':'</div>';
  var frame=frameOpen+
    '<div class="wbar"><i></i><i></i><i></i><em>'+w.dom+'</em></div>'+
    '<div class="wscroll"><img loading="lazy" decoding="async" src="'+(IMG[w.img]||'')+'" alt="'+w.name+'"></div>'+
    (isLive?'<span class="whint">Hover to scroll · click to open</span>':'')+frameClose;
  var cta=isLive?'<a href="'+w.url+'" target="_blank" rel="noopener" class="arrowlink" style="font-size:var(--t-md)">Open the live page <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M7 17L17 7M7 7h10v10"/></svg></a>':'<span class="arrowlink" style="font-size:var(--t-md);color:var(--mute)">Live soon</span>';
  return '<div class="witem"><div class="meta">'+
    '<div class="wtop"><span class="wnum">'+n+'</span><span class="wbadge">'+(w.badge||'Concept redesign · live')+'</span></div>'+
    '<h3>'+w.name+'</h3><div class="wsub">'+w.sub+'</div>'+
    '<p class="body">'+w.desc+'</p>'+tags+cta+
    '</div>'+frame+'</div>';
}
['work','work2'].forEach(function(id){var el=document.getElementById(id);if(el)el.innerHTML=WORK.map(witem).join('');});

/* FAQ (from live site) */
var FAQ=[
 ["Some of these are concept redesigns. Have you done this for real clients?","Yes. We are working with Eleven Trees right now, building their new site. The rest are redesigns we did on our own initiative to show exactly how we think and work. Every decision in them is grounded in real conversion principles, and we would run the same process on your live page and your data."],
 ["How much does it cost?","It depends on scope. A single landing page is a very different job from a full site or funnel. Start with the free teardown, and if we move forward you get a fixed price before any work begins. No surprises."],
 ["We already have a designer or developer.","No problem, we can work alongside them. Our focus is conversion: what to change and why. They can build it, or we can. Whatever gets the number moving."],
 ["What do we actually get?","A redesigned page or site built on the right platform for you, tracking set up so you can see what is working, and a plain breakdown of every change and the reasoning behind it. You are never guessing why we did something."],
 ["Will this definitely raise our conversion rate?","No one honest can promise a number, and you should be careful with anyone who does. What we promise is a site built on sound conversion principles with a clear reason behind every decision, and the tracking to prove what worked. Informed bets, not guesses."],
 ["How do we start?","Send us your highest traffic page. We will send back a short teardown showing where visitors hesitate and what we would change first. Free, no obligation. If it is useful, we talk."]
];
function buildFaq(el,items){if(!el)return;
  el.innerHTML=items.map(function(q){return '<div class="acc-i"><button class="acc-h" aria-expanded="false"><span>'+q[0]+'</span><span class="pm">+</span></button><div class="acc-b"><p>'+q[1]+'</p></div></div>';}).join('');
  el.querySelectorAll('.acc-h').forEach(function(btn){btn.addEventListener('click',function(){
    var it=btn.parentElement,bd=it.querySelector('.acc-b'),open=it.classList.contains('open');
    el.querySelectorAll('.acc-i.open').forEach(function(o){o.classList.remove('open');o.querySelector('.acc-b').style.maxHeight=null;o.querySelector('.acc-h').setAttribute('aria-expanded','false');});
    if(!open){it.classList.add('open');bd.style.maxHeight=bd.scrollHeight+'px';btn.setAttribute('aria-expanded','true');}});});}
var _dsg=document.getElementById('dsgimg'); if(_dsg) _dsg.src=IMG['konk-card']||IMG['sisterly-card']||'';
var TEAM={
  "jarek_c1": "assets/team/jarek_c1.jpg",
  "jarek_c2": "assets/team/jarek_c2.jpg",
  "jarek_c3": "assets/team/jarek_c3.jpg",
  "jarek_c4": "assets/team/jarek_c4.jpg",
  "jarek_main": "assets/team/jarek_main.jpg",
  "lucia_c1": "assets/team/lucia_c1.jpg",
  "lucia_c2": "assets/team/lucia_c2.jpg",
  "lucia_c3": "assets/team/lucia_c3.jpg",
  "lucia_c4": "assets/team/lucia_c4.jpg",
  "lucia_main": "assets/team/lucia_main.jpg"
};
document.querySelectorAll('.tstack img[data-key]').forEach(function(im){var k=im.getAttribute('data-key'); if(TEAM[k]) im.src=TEAM[k];});
var _h1=document.getElementById('hv1'); if(_h1) _h1.src=IMG['sisterly']||'';
var _h2=document.getElementById('hv2'); if(_h2) _h2.src=IMG['woodchester']||'';
buildFaq(document.getElementById('faq-home'),FAQ);
buildFaq(document.getElementById('faq-full'),FAQ);

/* process pinned stepper */
(function(){var list=document.getElementById('plist'),stage=document.getElementById('pstage');if(!list||!stage)return;
  var items=[].slice.call(list.querySelectorAll('.pstep')),stages=[].slice.call(stage.querySelectorAll('.pstage'));
  var i=0,t=null,run=false,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function show(n){i=n;items.forEach(function(e,k){e.classList.toggle('on',k===n);var b=e.querySelector('.bar');b.style.animation='none';void b.offsetWidth;b.style.animation='';});
    stages.forEach(function(e,k){e.classList.toggle('on',k===n);
      // restart animations inside the active stage
      if(k===n){e.querySelectorAll('*').forEach(function(x){var a=getComputedStyle(x).animationName;if(a&&a!=='none'){x.style.animation='none';void x.offsetWidth;x.style.animation='';}});
        // count-up any report numbers in the active stage
        e.querySelectorAll('.count').forEach(function(c){var to=parseFloat(c.dataset.to),dec=+(c.dataset.dec||0),st=performance.now();
          (function tk(now){var pr=Math.min(1,(now-st)/1400);var val=pr*to;c.textContent=dec?val.toFixed(dec):Math.round(val);
            if(pr<1)requestAnimationFrame(tk);else c.textContent=dec?to.toFixed(dec):Math.round(to);})(st);});}
      });}
  function start(){if(run||reduce)return;run=true;t=setInterval(function(){show((i+1)%items.length);},4400);}
  function stop(){run=false;clearInterval(t);}
  items.forEach(function(e,k){e.addEventListener('click',function(){stop();show(k);start();});e.setAttribute('tabindex','0');e.setAttribute('role','button');
    e.addEventListener('keydown',function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();stop();show(k);start();}});});
  new IntersectionObserver(function(es){es.forEach(function(e){e.isIntersecting?start():stop();});},{threshold:.2}).observe(list);})();

/* reveal */
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');if(e.target.id==='an')e.target.classList.add('in-view');io.unobserve(e.target);}});},{rootMargin:'0px 0px -6% 0px',threshold:.08});
function obs(){document.querySelectorAll('.rev:not(.in)').forEach(function(e){io.observe(e);});}obs();
var io2=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in-view');io2.unobserve(e.target);}});},{threshold:.25});
document.querySelectorAll('.an').forEach(function(e){io2.observe(e);});
/* count-up growth stat */
(function(){
  var b=document.querySelector('.growstat b'); if(!b) return;
  var done=false;
  new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting&&!done){done=true;var to=+b.dataset.to,st=performance.now();
      (function tick(now){var pr=Math.min(1,(now-st)/1400);b.textContent=Math.round(pr*to*(2-pr));
        if(pr<1)requestAnimationFrame(tick);else b.textContent='+'+to;})(st);}
  });},{threshold:.4}).observe(b);
})();

/* routing */
var MAP={'/':'p-home','/work':'p-work','/services':'p-services','/process':'p-process','/about':'p-about','/contact':'p-contact'};
function route(){var h=location.hash.replace('#','')||'/';if(!MAP[h])h='/';
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});
  var el=document.getElementById(MAP[h]);if(el)el.classList.add('active');
  document.querySelectorAll('.nlinks a').forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+h);});
  document.getElementById('mob').classList.remove('open');scrollTo(0,0);
  requestAnimationFrame(function(){document.querySelectorAll('.page.active .rev').forEach(function(e,i){if(e.getBoundingClientRect().top<innerHeight*1.05)setTimeout(function(){e.classList.add('in');if(e.id==='an')e.classList.add('in-view');},i*55);});obs();});}
addEventListener('hashchange',route);route();
addEventListener('scroll',function(){document.getElementById('nav').classList.toggle('stuck',scrollY>24);},{passive:true});
document.getElementById('burger').addEventListener('click',function(){document.getElementById('mob').classList.toggle('open');});
/* team: circular selector + hover photo cycle */
(function(){
  // hover-cycle photos on any disc (active or idle)
  function wireCycle(disc){
    var imgs=[].slice.call(disc.querySelectorAll('.tstack img'));
    var pips=[].slice.call(disc.querySelectorAll('.tpips i'));
    var idx=0, timer=null;
    function lit(n){ imgs.forEach(function(im,i){ im.classList.toggle('on', i===n && n>0); });
      pips.forEach(function(p,i){ p.classList.toggle('lit', i===n); }); }
    disc.addEventListener('mouseenter',function(){
      if(imgs.length<2) return;
      disc.classList.add('playing'); idx=0; lit(0);
      timer=setInterval(function(){ idx=(idx+1)%imgs.length; lit(idx); }, 420);
    });
    disc.addEventListener('mouseleave',function(){
      clearInterval(timer); disc.classList.remove('playing'); idx=0; lit(0);
      imgs.forEach(function(im){ im.classList.remove('on'); });
    });
  }

  document.querySelectorAll('[data-teamgroup]').forEach(function(group){
    var discs=[].slice.call(group.querySelectorAll('.tdisc'));
    var profiles=[].slice.call(group.querySelectorAll('.pcard'));
    discs.forEach(wireCycle);

    function activate(key){
      discs.forEach(function(d){
        var isActive = d.getAttribute('data-disc')===key;
        d.classList.toggle('active',isActive);
        d.classList.toggle('idle',!isActive);
        // swap flash on the newly active
        if(isActive){ d.classList.remove('swapping'); void d.offsetWidth; d.classList.add('swapping'); }
      });
      profiles.forEach(function(pc){ pc.classList.toggle('on', pc.getAttribute('data-profile')===key); });
    }

    // click an idle disc to activate it
    discs.forEach(function(d){
      d.setAttribute('tabindex','0'); d.setAttribute('role','button');
      d.addEventListener('click',function(){ if(d.classList.contains('idle')) activate(d.getAttribute('data-disc')); });
      d.addEventListener('keydown',function(e){ if((e.key==='Enter'||e.key===' ')&&d.classList.contains('idle')){ e.preventDefault(); activate(d.getAttribute('data-disc')); } });
    });
    // switch buttons in the profile panel
    group.querySelectorAll('[data-switch]').forEach(function(btn){
      btn.addEventListener('click',function(){ activate(btn.getAttribute('data-switch')); });
    });
  });
})();

/* footer wordmark reveal */
(function(){var fb=document.getElementById('footbig');if(!fb)return;
  new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){fb.classList.add('in');}else{fb.classList.remove('in');}});},{threshold:.3}).observe(fb);})();
