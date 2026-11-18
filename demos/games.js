(() => {
  "use strict";
  const ns=(window.SOL_SECTIONS||={}), games=[];
  const C={night:"#24172d",plum:"#503757",haze:"#bda1cb",cream:"#fff3d8",gold:"#ffd086",mint:"#aae7cc",pink:"#fb9db6",off:"#735371",blue:"#9cc7ff"};
  function e(tag,text,attrs={}){const el=document.createElement(tag); if(text!==undefined)el.textContent=text;Object.assign(el,attrs);return el}
  function shell(root){
    const stage=e("div",undefined,{className:"demo-stage"}),ct=e("div",undefined,{className:"demo-controls"}),out=e("output",undefined,{className:"demo-output"});out.setAttribute("role","status");root.append(stage,ct,out);
    function b(title,fn,where=ct){const n=e("button",title,{type:"button",onclick:fn});where.append(n);return n;}
    function slider(title,min,max,value,fn){const l=e("label",title+" "),i=e("input",undefined,{type:"range",min,max,step:1,value});const v=e("span",String(value));l.append(i,v);ct.append(l);i.oninput=()=>{v.textContent=i.value;fn(+i.value)};}
    function grid(n,size=520){
      const el=e("div");Object.assign(el.style,{display:"grid",gridTemplateColumns:"repeat("+n+",minmax(0,1fr))",gap:"4px",margin:"auto",maxWidth:size+"px"});
      stage.append(el);return el;
    }
    function cell(g,title,fn){const n=b(title,fn,g);Object.assign(n.style,{aspectRatio:"1",padding:"0",minHeight:"0",fontFamily:"system-ui",fontSize:"clamp(.69rem,3.2vw,1.4rem)",lineHeight:"1",color:C.cream,background:C.plum,border:"1px solid #896f8b",borderRadius:"3px"});return n;}
    function canvas(w,h,description){const n=e("canvas",undefined,{width:w,height:h});n.setAttribute("role","img");n.setAttribute("aria-label",description);stage.append(n);return [n,n.getContext("2d")];}
    function say(s){out.textContent=s;}
    return {stage,ct,out,b,slider,grid,cell,canvas,say};
  }
  function add(id,title,summary,tag,mount){games.push({id,title,summary,tag,accent:C.gold,mount});}
  const roll=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const shuffle=(a,r)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  function paint(n,text,aria,bg,fg=C.night){n.textContent=text;n.style.background=bg;n.style.color=fg;n.setAttribute("aria-label",aria);}
  add("beacon-switchboard","Beacon Switchboard","Turn every beacon off. Each switch also toggles its four closest neighbors.","Logic puzzle",root=>{
    const ui=shell(root), n=5, g=ui.grid(n,420), btn=[], at=Array(n*n).fill(false);let moves=0,seed=31;
    function toggle(i){for(const j of [i,i-n,i+n,i%n?i-1:-1,i%n<n-1?i+1:-1])if(j>=0&&j<n*n)at[j]=!at[j];}
    function draw(){at.forEach((on,i)=>paint(btn[i],on?"☼":"·","Beacon row "+(1+(i/n|0))+", column "+(i%n+1)+", "+(on?"on":"off"),on?C.gold:C.plum,on?C.night:C.cream));const count=at.filter(Boolean).length;ui.say(count?count+" lit. "+moves+" moves. Clear all 25.":"All dark. Solved in "+moves+" moves.");}
    for(let i=0;i<n*n;i++)btn.push(ui.cell(g,"",()=>{toggle(i);moves++;draw()}));
    function reset(){const r=roll(seed);at.fill(false);for(const i of shuffle([...at.keys()],r).slice(0,7))toggle(i);moves=0;draw();}
    ui.b("Retry puzzle",reset);ui.b("New puzzle",()=>{seed++;reset()});reset();
  });
  add("warehouse-night-shift","Warehouse Night Shift","Push the two cargo crates onto the marked docks without trapping them.","Sokoban",root=>{
    const ui=shell(root),g=ui.grid(7,445), btn=[], w=7, h=7;
    const walls=new Set([0,1,2,3,4,5,6,7,13,14,20,21,23,27,28,34,35,41,42,43,44,45,46,47,48]),goals=new Set([12,37]);let p,boxes,moves,won;
    function draw(){for(let i=0;i<w*h;i++){const wall=walls.has(i),box=boxes.has(i),goal=goals.has(i);
      paint(btn[i],wall?"":p===i?"◆":box?"■":goal?"◎":"·",(p===i?"Worker":box?"Crate":goal?"Dock":wall?"Wall":"Floor")+" at "+(i/w|0)+"-"+i%w,wall?"#392942":p===i?C.blue:box?goal?C.mint:C.gold:goal?"#614463":C.plum,goal&&!box&&p!==i?C.cream:wall||!box&&p!==i?C.haze:C.night);}
      ui.say(won?"Both crates docked in "+moves+" moves.":"Moves: "+moves+". Use the arrow controls or keyboard.");
    }
    function move(delta){if(won)return;const a=p+delta;if(a<0||a>=w*h||walls.has(a))return;if(boxes.has(a)){const b=a+delta;if(b<0||b>=w*h||walls.has(b)||boxes.has(b))return;boxes.delete(a);boxes.add(b);}p=a;moves++;won=[...goals].every(i=>boxes.has(i));draw();}
    function reset(){p=30;boxes=new Set([17,31]);moves=0;won=false;draw();}
    for(let i=0;i<w*h;i++)btn.push(ui.cell(g,"",()=>{const d=i-p;if([-1,1,-w,w].includes(d))move(d);}));
    const dirs={ArrowUp:-w,ArrowLeft:-1,ArrowDown:w,ArrowRight:1};
    for(const [key,d] of Object.entries(dirs))ui.b(key.replace("Arrow",""),()=>move(d));
    ui.b("Reset shift",reset);reset();
    function key(e){if(e.key in dirs){e.preventDefault();move(dirs[e.key]);}}
    root.closest("dialog").addEventListener("keydown",key);return()=>root.closest("dialog").removeEventListener("keydown",key);
  });
  add("one-more-matchstick","One More Matchstick","Play a real game of Nim against a perfect opponent, or hand the second turn to a friend.","Strategy game",root=>{
    const ui=shell(root);let piles,turn,winner,bot=true,rev=0;
    const draw=()=>{
      ui.stage.replaceChildren();
      piles.forEach((n,i)=>{const row=e("div");Object.assign(row.style,{display:"flex",gap:".3rem",alignItems:"center",minHeight:"43px",padding:"5px",flexWrap:"wrap"});
        const title=e("span","Pile "+(i+1)+": "+n);title.style.minWidth="70px";row.append(title);
        for(let j=1;j<=n;j++){const b=ui.b(String(j),()=>choose(i,j),row);b.title="Remove "+j+" from pile "+(i+1);b.disabled=!!winner;}
        ui.stage.append(row);
      });
      ui.say(winner||"Player "+turn+" to move. Click how many to remove from one pile. Last move wins.");
    };
    function go(i,j){piles[i]-=j;if(!piles.some(Boolean)){winner=(bot&&turn===2?"Computer":"Player "+turn)+" takes the last match and wins.";return;}turn=3-turn;}
    function choose(i,j){if(winner||j>piles[i])return;go(i,j);if(!winner&&bot&&turn===2){
      const xor=piles.reduce((a,b)=>a^b,0);let k=piles.findIndex(x=>(x^xor)<x);
      if(k<0){k=piles.findIndex(Boolean);go(k,1);}else go(k,piles[k]-(piles[k]^xor));
    }draw();}
    function reset(){piles=rev%2?[2,5,6,8]:[3,4,6,7];turn=1;winner="";draw();}
    const swap=ui.b("Play two players",()=>{bot=!bot;swap.textContent=bot?"Play two players":"Play the computer";reset()});ui.b("New round",()=>{rev++;reset()});reset();
  });
  add("harbor-dispatch","Harbor Dispatch","Balance deliveries from three ferry routes before the tide closes the harbor.","Planning game",root=>{
    const ui=shell(root),routes=[["North Quay",3,4],["Glass Island",4,7],["Ropewalk",2,3]];
    let ships,t,reward,arrivals,next,events;const T=13;
    const status=e("div");Object.assign(status.style,{display:"grid",gap:"6px"});ui.stage.append(status);
    function start(){ships=[];t=0;reward=0;arrivals=0;next=0;events="Two ferries ready. ";draw();}
    function draw(){
      status.replaceChildren();const heading=e("strong","Hour "+t+" / "+T+"   ·   Cargo delivered "+reward+"   ·   Ferries free "+(2-ships.length));status.append(heading);
      routes.forEach(([name,hr,v],i)=>{const row=e("div");Object.assign(row.style,{display:"flex",alignItems:"center",gap:"8px",padding:"5px",borderTop:"1px solid #916f92",flexWrap:"wrap"});
        row.append(e("span",name+" · "+hr+"h · "+v+" crates"));const b=ui.b("Dispatch",()=>{ships.push({route:i,due:t+hr,id:next++});events="Dispatched to "+name+". ";draw();},row);b.disabled=t>=T||ships.length>=2;
        const active=ships.filter(x=>x.route===i).map(x=>"hour "+x.due).join(" & ");if(active)row.append(e("span","Returns at "+active));row.append();status.append(row);
      });
      advance.disabled=t===T;ui.say((t===T?"Tide closed the harbor. "+arrivals+" trips completed. Final score: "+reward+".":events+"Optimize delivered crates by hour "+T+"."));
    }
    function tick(){if(t>=T)return;t++;const done=ships.filter(s=>s.due<=t);ships=ships.filter(s=>s.due>t);for(const s of done){reward+=routes[s.route][2];arrivals++;}events=done.length?done.length+" ferry returned. ":"";draw();}
    const advance=ui.b("Advance one hour",tick);ui.b("Restart dispatch",start);start();
  });
  add("memory-of-moons","Memory of Moons","Match eight pairs of planetary symbols in as few flips as you can.","Memory game",root=>{
    const ui=shell(root),g=ui.grid(4,400),btn=[],glyphs=["ϟ","✿","✳","☽","♢","℧","☉","⌬"],names=["Bolt","Bloom","Star","Crescent","Gem","Bell","Sun","Hexagon"];
    let a,first,last,done,tries,ready,serial=91,timer;
    function draw(){for(let i=0;i<16;i++){const k=a[i],matched=done.has(i),up=matched||first===i||last===i;paint(btn[i],up?glyphs[k]:"·","Tile "+(i+1)+(up?", "+names[k]+(matched?", matched":""): ", face down"),matched?C.mint:up?C.gold:C.plum,up?C.night:C.cream);}
      ui.say((done.size===16?"All pairs found. ":"")+done.size/2+" of 8 pairs. "+tries+" guesses.");
    }
    function reveal(i){if(!ready||done.has(i)||i===first)return;if(first<0){first=i;draw();return;}last=i;tries++;ready=false;draw();
      timer=setTimeout(()=>{if(a[first]===a[last]){done.add(first);done.add(last);}first=last=-1;ready=true;draw();},680);
    }
    for(let i=0;i<16;i++)btn.push(ui.cell(g,"",()=>reveal(i)));
    function reset(){clearTimeout(timer);a=shuffle(Array.from({length:16},(_,i)=>i%8),roll(++serial));done=new Set();first=last=-1;ready=true;tries=0;draw();}
    ui.b("Shuffle moons",reset);reset();return()=>clearTimeout(timer);
  });
  add("canal-city","Canal City","Lay out homes, trees and commerce, then see how water access changes the neighborhood.","City simulator",root=>{
    const ui=shell(root),g=ui.grid(9,450),b=[],n=9, palette=[["Empty","·",C.plum],["Home","⌂",C.gold],["Park","✿",C.mint],["Shop","◆",C.pink],["Canal","≈",C.blue]];
    let grid,brush=1,controls=[];
    function around(i){const x=i%n,y=i/n|0;return [-1,0,1].flatMap(dx=>[-1,0,1].flatMap(dy=>(dx||dy)&&x+dx>=0&&x+dx<n&&y+dy>=0&&y+dy<n?[(y+dy)*n+x+dx]:[]));}
    function draw(){let h=0,score=0,pop=0,shops=0;
      grid.forEach((k,i)=>{const [name,char,bg]=palette[k];paint(b[i],char,name+" at row "+(1+(i/n|0))+" column "+(i%n+1),bg,k?C.night:C.cream);
        if(k===1){h++;const adj=around(i).map(i=>grid[i]); const a=adj.filter(x=>x===2).length,c=adj.filter(x=>x===4).length,s=adj.filter(x=>x===3).length;
          score+=Math.min(100,42+a*13+c*9+s*12);pop+=c?4:2;
        } if(k===3)shops++;
      });
      ui.say(h+" homes, "+pop+" residents, "+shops+" shops. "+(h?"Mean home quality: "+Math.round(score/h)+"/100.":"Place a home to measure quality.")+" Nearby parks, shops, and water all help.");
    }
    function paintTile(i,terrain){grid[i]=terrain;draw();}
    for(let i=0;i<n*n;i++)b.push(ui.cell(g,"",()=>paintTile(i,brush)));
    for(let i=0;i<palette.length;i++){const button=ui.b(palette[i][0],()=>{brush=i;controls.forEach((c,j)=>c.setAttribute("aria-pressed",i===j));});controls.push(button);button.setAttribute("aria-pressed",i===brush);}
    function reset(){grid=Array(n*n).fill(0);for(let i=0;i<n;i++)grid[i*n+(i<5?5:6)]=4;grid[39]=grid[20]=1;grid[29]=2;grid[50]=3;draw();}
    ui.b("Reset town",reset);reset();
  });
  add("clockwork-pendulum-golf","Clockwork Golf","Choose your angle and power. Aim to stop on the narrow gold landing pad.","Precision game",root=>{
    const ui=shell(root),[canvas,ctx]=ui.canvas(720,325,"Golf ball, arc and gold landing target");
    let angle=42,power=47,target=498,shots=0,time=0,raf=0,trail=[],ball=[44,270],shot=false,currentSeed=5,last=null;
    const ground=276,g=157;const rad=()=>angle*Math.PI/180;
    function draw(){
      ctx.fillStyle=C.night;ctx.fillRect(0,0,720,325);ctx.strokeStyle="#66506b";ctx.lineWidth=1;
      for(let x=20;x<720;x+=20){ctx.beginPath();ctx.moveTo(x,12);ctx.lineTo(x,ground);ctx.stroke();}
      ctx.fillStyle="#523a5d";ctx.fillRect(0,ground,720,50);ctx.fillStyle=C.gold;ctx.fillRect(target-22,ground-4,44,8);
      ctx.fillStyle=C.cream;ctx.font="15px system-ui";ctx.fillText("LANDING PAD",Math.min(590,Math.max(12,target-42)),ground+30);
      ctx.strokeStyle=C.pink;ctx.lineWidth=2;ctx.setLineDash([4,8]);ctx.beginPath();ctx.moveTo(44,ground-6);ctx.lineTo(44+Math.cos(rad())*(20+power*.67),ground-6-Math.sin(rad())*(20+power*.67));ctx.stroke();ctx.setLineDash([]);
      if(trail.length){ctx.strokeStyle=C.blue;ctx.beginPath();trail.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
      ctx.beginPath();ctx.arc(ball[0],ball[1],6,0,Math.PI*2);ctx.fillStyle=C.mint;ctx.fill();
    }
    function run(ts){if(last===null)last=ts;time+=Math.min((ts-last)/1000,.06);last=ts;
      ball=[44+shot.vx*time,270-shot.vy*time+.5*g*time*time];
      if(ball[1]>=270&&time>.07){const land=44+shot.vx*2*shot.vy/g;ball=[land,270];trail.push(ball);draw();shot=false;fire.disabled=false;ui.say(Math.abs(land-target)<=22?"On the pad! "+shots+" shots.":"Missed by "+Math.round(Math.abs(land-target))+" px to the "+(land<target?"left":"right")+". Change angle or power.");return;}
      trail.push(ball);draw();raf=requestAnimationFrame(run);
    }
    ui.slider("Angle",8,79,angle,x=>{angle=x;draw()});ui.slider("Power",15,80,power,x=>{power=x;draw()});
    const fire=ui.b("Take shot",()=>{if(shot)return;shot={vx:power*4.1*Math.cos(rad()),vy:power*4.1*Math.sin(rad())};time=0;last=null;trail=[];shots++;fire.disabled=true;ui.say("Shot "+shots+" in flight.");raf=requestAnimationFrame(run);});
    ui.b("New pin",()=>{cancelAnimationFrame(raf);shot=false;fire.disabled=false;const r=roll(++currentSeed*217);target=190+Math.round(r()*390);shots=0;trail=[];ball=[44,270];ui.say("Try the new landing pad.");draw();});
    ui.say("Aim for the center of the gold pad. Try 42° at higher power.");draw();return()=>cancelAnimationFrame(raf);
  });
  add("moth-mosaic","Moth Mosaic","Slide the mosaic pieces to restore the moth’s serial number, using a deterministic solvable shuffle.","Sliding puzzle",root=>{
    const ui=shell(root),n=4,g=ui.grid(n,410),b=[];let a,zero,moves,seed=2;
    function near(i){const x=i%n,y=i/n|0;return [x?i-1:-1,x<n-1?i+1:-1,y?i-n:-1,y<n-1?i+n:-1].filter(j=>j>=0);}
    function draw(){a.forEach((j,i)=>paint(b[i],j?String(j):"","Position "+(i+1)+(j?", tile "+j:", empty"),j?["#ffe0a3","#fcbacf","#c7b3f0","#abdfcc"][(j-1)/4|0]:C.plum,j?C.night:C.cream));const win=a.every((v,i)=>v===(i+1)%16);ui.say(win?"Mosaic restored in "+moves+" moves.":"Slide a neighboring tile into the gap. Goal: 1 to 15, then the blank. "+moves+" moves.");}
    function move(i){if(!near(zero).includes(i))return;[a[i],a[zero]]=[a[zero],a[i]];zero=i;moves++;draw();}
    function reset(){a=Array.from({length:16},(_,i)=>(i+1)%16);zero=15;moves=0;let prev=-1;const r=roll(seed*997);
      for(let k=0;k<27;k++){const list=near(zero).filter(i=>i!==prev),i=list[Math.floor(r()*list.length)];[a[i],a[zero]]=[a[zero],a[i]];prev=zero;zero=i;}draw();}
    for(let i=0;i<16;i++)b.push(ui.cell(g,"",()=>move(i)));
    ui.b("Shuffle mosaic",()=>{seed++;reset()});ui.b("Start over",reset);reset();
  });
  add("rail-junction","Rail Junction","Rotate the track tiles until a train can cross from the yellow platform to the mint depot.","Routing puzzle",root=>{
    const ui=shell(root),n=6,g=ui.grid(n,430),b=[],track=[], start=12,end=23;
    const bits=[[1,0,1,0],[1,1,0,0]],corners=["└","┌","┐","┘"], labels=["north/east","east/south","south/west","west/north"];
    let a,seed=7,moves;
    const opposite=d=>(d+2)%4;
    function connection(i,d){return bits[track[i]][(d-a[i]+4)%4]===1;}
    function adj(i,d){return d===0?i-n:d===1?(i%n<n-1?i+1:-1):d===2?i+n:(i%n?i-1:-1);}
    function route(){const seen=new Set([start]), todo=[start];while(todo.length){const i=todo.shift();for(let d=0;d<4;d++){const j=adj(i,d);if(j>=0&&j<n*n&&connection(i,d)&&connection(j,opposite(d))&&!seen.has(j)){seen.add(j);todo.push(j);}}}return seen;}
    function draw(){const set=route();a.forEach((r,i)=>paint(b[i],track[i]?corners[r]:r%2?"─":"│","Track "+(i+1)+", "+(track[i]?labels[r]:r%2?"east/west":"north/south")+(i===start?", platform":i===end?", depot":""),i===start?C.gold:i===end?C.mint:set.has(i)?"#6d567e":C.plum,i===start||i===end?C.night:C.cream));ui.say(set.has(end)?"Connected! Completed in "+moves+" turns.":"Rotate tiles clockwise. "+set.size+" tiles connected to the platform. "+moves+" turns.");}
    function reset(){const r=roll(seed*37);a=Array.from({length:n*n},()=>r()*4|0);moves=0;
      for(let i=0;i<n*n;i++)track[i]=r()>.53?1:0;
      for(const i of [start,13,21,22,end])track[i]=0;for(const i of [14,20])track[i]=1;
      a[start]=1;a[end]=1;draw();
    }
    for(let i=0;i<n*n;i++)b.push(ui.cell(g,"",()=>{a[i]=(a[i]+1)%4;moves++;draw()}));
    ui.b("New junction",()=>{seed++;reset()});ui.b("Reset junction",reset);reset();
  });
  add("lunar-lemonade","Lunar Lemonade","Set price and supplies before each market day. Weather shifts demand and leftovers are lost.","Market simulation",root=>{
    const ui=shell(root),[canvas,ctx]=ui.canvas(690,258,"Chart of actual daily net cash, weather and demand");
    let price=5,batch=32,cash=125,day=0,data=[],weather=[],seed=19;
    function reset(){const r=roll(seed*314);day=0;cash=125;data=[];weather=Array.from({length:9},()=>({hot:r()>.45,noise:Math.round(r()*14-7)}));draw();}
    function draw(){
      ctx.fillStyle=C.night;ctx.fillRect(0,0,690,258);ctx.font="14px system-ui";ctx.fillStyle=C.cream;ctx.fillText("Net cash per market day",22,27);
      ctx.strokeStyle="#cdaac1";ctx.beginPath();ctx.moveTo(22,149);ctx.lineTo(668,149);ctx.stroke();
      for(let i=0;i<9;i++){const x=27+i*72, v=data[i];
        ctx.fillStyle=C.plum;ctx.fillRect(x,47,55,158);ctx.fillStyle=C.cream;ctx.fillText(String(i+1),x+24,226);
        if(v){const h=Math.min(90,Math.abs(v.net)*.83);ctx.fillStyle=v.net>=0?C.mint:C.pink;ctx.fillRect(x+4, v.net>=0?149-h:149,47,h);ctx.fillStyle=C.cream;ctx.fillText((v.net>0?"+":"")+v.net,x+8,v.net>=0?137-h:166+h);}
      }
      const last=data.at(-1);const announcement=last?"Last day: sold "+last.sales+" of "+last.batch+"; net "+last.net+" credits. ":"";
      ui.say(announcement+(day===9?"Market closed. Final cash: "+cash+" credits.":"Cash: "+cash+". Day "+(day+1)+" forecast: "+(weather[day].hot?"warm":"cold")+". Supplies cost 2 credits per cup."));
      serve.disabled=day===9;
    }
    const trade=()=>{if(day>=9)return;const stock=Math.max(0,Math.min(batch,Math.floor(cash/2))),{hot,noise}=weather[day],demand=Math.max(0,(hot?51:32)-Math.max(0,price-2)*4+noise),sales=Math.min(stock,demand),net=sales*price-stock*2;cash+=net;data.push({net,sales,batch:stock});day++;draw();};
    ui.slider("Price",1,11,price,x=>{price=x;});ui.slider("Batch size",1,70,batch,x=>{batch=x;});
    const serve=ui.b("Open for one day",trade);ui.b("Restart market",()=>{seed++;reset()});reset();
  });
  ns.Games=games;
})();
