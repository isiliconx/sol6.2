(() => {
  "use strict";
  const rootNS=(window.SOL_SECTIONS ||= {}), demos=[], P="#d9b7ff", G="#9eefc9", Y="#ffcf90", F="#231832";
  const style="display:block;width:100%;height:auto";
  const esc=s=>String(s).replace(/[<>&"]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[c]));
  const label=(x,y,s,color="#fff0dd",size=14,anchor="middle")=>'<text x="'+x+'" y="'+y+'" fill="'+color+'" text-anchor="'+anchor+'" font-family="system-ui" font-size="'+size+'">'+esc(s)+'</text>';
  const rect=(x,y,w,h,fill,rx=3)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+rx+'" fill="'+fill+'"/>';
  const line=(x,y,xx,yy,color=P,w=1.6)=>'<path d="M'+x+' '+y+'L'+xx+' '+yy+'" stroke="'+color+'" stroke-width="'+w+'" fill="none"/>';
  function add(id,title,summary,tag,mount){demos.push({id,title,summary,tag,accent:P,mount});}
  function node(type,text,attrs={}){
    const n=document.createElement(type);if(text)n.textContent=text;Object.assign(n,attrs);return n;
  }
  function shell(root,desc,h=260,w=760){
    const stage=node("div","",{className:"demo-stage"}), ct=node("div","",{className:"demo-controls"}), out=node("output","",{className:"demo-output"});
    out.setAttribute("role","status");root.append(stage,ct,out);
    function draw(body){stage.innerHTML='<svg viewBox="0 0 '+w+' '+h+'" style="'+style+'" role="img" aria-label="'+esc(desc)+'">'+body+'</svg>';}
    function slider(text,min,max,value,update,step=1){
      const input=node("input","",{type:"range",min,max,step,value}), val=node("span",value.toString()), wrap=node("label",text+" ");
      wrap.append(input,val);ct.append(wrap);input.oninput=()=>{val.textContent=input.value;update(Number(input.value))};return input;
    }
    function button(text,fn){const n=node("button",text,{type:"button",onclick:fn});ct.append(n);return n;}
    function choose(text,options,val,fn){
      const menu=node("select"),wrap=node("label",text+" ");for(const opt of options)menu.add(node("option",opt,{value:opt}));menu.value=val;
      menu.onchange=()=>fn(menu.value);wrap.append(menu);ct.append(wrap);return menu;
    }
    function input(text,val,fn){const n=node("input","",{type:"text",value:val,maxLength:35}),wrap=node("label",text+" ");wrap.append(n);ct.append(wrap);n.oninput=()=>fn(n.value);return n;}
    const write=s=>out.textContent=s;
    return {stage,ct,out,draw,slider,button,choose,input,write};
  }
  function rng(seed) {return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
  add("astar-expedition","A* Expedition","Thread a route through boulders and watch the search frontier change with the heuristic.","Pathfinding",root=>{
    const ui=shell(root,"Grid showing obstacles, explored cells and a computed route",276), nx=24, ny=10; let wall=.26,h=1,seed=8;
    function draw(){
      const rand=rng(seed), n=nx*ny,start=nx*4+1,end=nx*4+nx-2, g=Array(n).fill(Infinity), prev=Array(n).fill(-1), blocked=Array.from({length:n},(_,i)=>![start,end].includes(i)&&rand()<wall);
      const visit=new Set(), queue=[start];
      function dist(i){return Math.abs(i%nx-end%nx)+Math.abs(Math.floor(i/nx)-Math.floor(end/nx));}
      g[start]=0;
      while(queue.length){
        queue.sort((a,b)=>(g[b]+h*dist(b))-(g[a]+h*dist(a))); const x=queue.pop(); if(visit.has(x))continue;visit.add(x);if(x===end)break;
        const k=x%nx, opts=[k?x-1:-1,k<nx-1?x+1:-1,x-nx,x+nx];
        for(const z of opts)if(z>=0&&z<n&&!blocked[z]&&g[z]>g[x]+1){g[z]=g[x]+1;prev[z]=x;queue.push(z);visit.delete(z);}
      }
      const route=new Set();if(prev[end]>=0)for(let p=end;p!==-1;p=prev[p])route.add(p);
      const open=new Set(queue);
      ui.draw(blocked.map((b,i)=>rect(60+i%nx*27,6+Math.floor(i/nx)*27,24,24,i===start||i===end?Y:route.has(i)?G:b?"#5e3958":visit.has(i)?"#755da4":open.has(i)?P:"#35284c",2)).join(""));
      ui.write((route.size?"Route: "+(route.size-1)+" moves":"No route")+". "+visit.size+" cells explored. Coral squares mark start and goal.");
    }
    ui.slider("Wall density",.05,.52,wall,x=>{wall=x;draw()},.01);
    ui.slider("Heuristic weight",0,2,h,x=>{h=x;draw()},.1);
    ui.button("New terrain",()=>{seed++;draw()});draw();
  });
  add("stable-constellations","Stable Constellations","Read proposals and rejections as two ranked groups build a stable matching.","Matching",root=>{
    const ui=shell(root,"Names and currently held proposals between two groups",296);
    const people=["Ada","Bea","Cleo","Dina","Esi"], stations=["Amber","Blue","Coral","Dusk","Ember"];let seed=1,t=0,trace=[];
    function solve(){
      const r=rng(seed), perm=()=>Array.from({length:5},(_,i)=>[r(),i]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]), ps=people.map(perm), ss=stations.map(perm);
      const held=Array(5).fill(-1), tries=Array(5).fill(0), queue=[0,1,2,3,4];
      trace=[{held:[...held],text:"No station holds a proposal. Step through the Gale–Shapley algorithm."}];
      while(queue.length){
        const p=queue.shift(), s=ps[p][tries[p]++], old=held[s]; if(s===undefined)break;
        let change;
        if(old===-1){held[s]=p;change=" accepts";}
        else if(ss[s].indexOf(p)<ss[s].indexOf(old)){held[s]=p;queue.push(old);change=" drops "+people[old]+" and accepts";}
        else {queue.push(p);change=" declines";}
        trace.push({held:[...held],text:people[p]+" → "+stations[s]+". "+stations[s]+change+"."});
      }
    }
    function draw(){
      const o=trace[t], y=i=>46+i*48;
      ui.draw(o.held.map((p,s)=>p<0?"":line(155,y(p)-4,605,y(s)-4,p%2?G:P,3)).join("")+people.map((x,i)=>rect(20,y(i)-22,135,36,"#473365")+label(88,y(i),x)+rect(605,y(i)-22,135,36,"#473365")+label(672,y(i),stations[i])).join(""));
      ui.write((t===trace.length-1?"Stable match reached. ":"")+"Proposal "+t+" of "+(trace.length-1)+". "+o.text);
    }
    ui.button("Next proposal",()=>{t=Math.min(t+1,trace.length-1);draw()});
    ui.button("Finish",()=>{t=trace.length-1;draw()});
    ui.button("Rerank everyone",()=>{seed++;t=0;solve();draw()});solve();draw();
  });
  add("expedition-knapsack","The Expedition Pack","Optimize value against weight, then compare the result to a ratio-first shortcut.","Dynamic programming",root=>{
    const ui=shell(root,"Selected and unselected inventory items",280);
    const items=[["Tent",7,9],["Water",6,12],["Radio",4,8],["Tarp",5,8],["Medkit",3,7],["Food",6,10],["Camera",5,6],["Rope",3,5],["Light",2,4]];let cap=17;
    function draw(){
      const dp=Array.from({length:items.length+1},()=>Array(cap+1).fill(0));
      for(let n=1;n<=items.length;n++){const [,w,v]=items[n-1];for(let j=0;j<=cap;j++)dp[n][j]=Math.max(dp[n-1][j],j>=w?dp[n-1][j-w]+v:0);}
      let j=cap;const selected=new Set();
      for(let n=items.length;n>0;n--)if(dp[n][j]!==dp[n-1][j]){selected.add(n-1);j-=items[n-1][1];}
      let mass=0,val=0;for(const [,w,v] of [...items].sort((a,b)=>b[2]/b[1]-a[2]/a[1]))if(mass+w<=cap){mass+=w;val+=v}
      ui.draw(items.map(([name,w,v],i)=>{const x=17+(i%3)*245,y=12+Math.floor(i/3)*86,s=selected.has(i);return rect(x,y,228,70,s?"#557a7a":"#453459")+label(x+14,y+27,name,s?G:"#f6dbff",17,"start")+label(x+14,y+52,w+" kg / "+v+" value","#fff0dd",13,"start");}).join(""));
      ui.write("Optimal: "+dp[items.length][cap]+" value at "+(cap-j)+"/"+cap+" kg. Ratio-first shortcut: "+val+" value at "+mass+" kg.");
    }
    ui.slider("Capacity (kg)",3,38,cap,x=>{cap=x;draw()});draw();
  });
  add("sort-the-spectrum","Sort the Spectrum","Step through the same array with Insertion Sort or Selection Sort and count the cost.","Sorting",root=>{
    const ui=shell(root,"Bar chart of current array order and compared pair",240);
    let seed=3, mode="Insertion", itr, data, frame, event, swaps, comparisons, hot;
    function* sorting(a,kind){
      if(kind==="Insertion"){
        for(let i=1;i<a.length;i++)for(let j=i;j>0;j--){yield ["compare",j-1,j];if(a[j-1]<=a[j])break;[a[j-1],a[j]]=[a[j],a[j-1]];yield ["swap",j-1,j];}
      }else for(let i=0;i<a.length-1;i++){let m=i;for(let j=i+1;j<a.length;j++){yield ["compare",m,j];if(a[j]<a[m])m=j;}if(m!==i){[a[m],a[i]]=[a[i],a[m]];yield ["swap",i,m];}}
    }
    function restart(){const rand=rng(seed);data=Array.from({length:22},()=>4+rand()*94);itr=sorting(data,mode);hot=[];frame=swaps=comparisons=0;event="Ready.";}
    function draw(){
      ui.draw(data.map((v,i)=>rect(20+i*33,221-v*2,26,v*2,hot.includes(i)?Y:(event==="Sorted."?G:P),2)).join(""));
      ui.write(event+" "+comparisons+" comparisons, "+swaps+" swaps.");
    }
    function step(){const n=itr.next(); if(n.done){event="Sorted.";hot=[];return;}frame++;hot=n.value.slice(1);if(n.value[0]==="swap"){swaps++;event="Swap."; }else{comparisons++;event="Compare.";}}
    ui.choose("Algorithm",["Insertion","Selection"],mode,x=>{mode=x;restart();draw()});
    ui.button("Step",()=>{step();draw()});ui.button("Run to finish",()=>{do{step()}while(hot.length);draw()});ui.button("Reseed",()=>{seed++;restart();draw()});restart();draw();
  });
  add("graph-color-outfit","Graph Color Outfit","Give connected neighbors different colors; compare greedy coloring with a small exact solver.","Constraint search",root=>{
    const ui=shell(root,"A colored graph and its adjacency lines",280), colors=["#d1b6fc","#ffbb9e","#a4e7c8","#ffa7c4","#bdc5ff","#ffda8f","#f5f1d2","#d3bbbb","#acf7ed","#ffe188","#efc7ff","#cee79c"];let seed=17,p=.27,order="As drawn";
    function draw(){
      const r=rng(seed),n=10, adj=Array.from({length:n},()=>[]),edges=[];
      for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(r()<p){edges.push([i,j]);adj[i].push(j);adj[j].push(i);}
      const points=adj.map((_,i)=>[380+245*Math.cos(i/10*2*Math.PI-Math.PI/2),140+105*Math.sin(i/10*2*Math.PI-Math.PI/2)]);
      const ord=Array.from({length:n},(_,i)=>i),desc=[...ord].sort((a,b)=>adj[b].length-adj[a].length);if(order!=="As drawn")ord.sort((a,b)=>adj[b].length-adj[a].length);
      const found=Array(n).fill(-1);for(const i of ord){const used=new Set(adj[i].map(j=>found[j]));let c=0;while(used.has(c))c++;found[i]=c;}
      const greedy=Math.max(...found)+1;
      const trial=Array(n).fill(-1);
      function backtrack(i,max){if(i===n)return true;const v=desc[i];for(let c=0;c<max;c++)if(!adj[v].some(j=>trial[j]===c)){trial[v]=c;if(backtrack(i+1,max))return true;trial[v]=-1;}return false;}
      let optimal=1;while(optimal<greedy&&!backtrack(0,optimal))optimal++;
      ui.draw(edges.map(([a,b])=>line(...points[a],...points[b],"#9279af")).join("")+points.map(([x,y],i)=>'<circle cx="'+x+'" cy="'+y+'" r="18" fill="'+colors[found[i]]+'"/>'+label(x,y+5,i+1,F,13)).join(""));
      ui.write("Greedy used "+greedy+" colors; exact minimum "+optimal+". "+edges.length+" edges.");
    }
    ui.choose("Coloring order",["As drawn","Highest degree first"],order,x=>{order=x;draw()});
    ui.slider("Edge probability",.06,.73,p,x=>{p=x;draw()},.01);ui.button("New graph",()=>{seed++;draw()});draw();
  });
  add("huffman-type-foundry","Huffman Type Foundry","Build a prefix code from your own phrase and see how frequency changes bit length.","Compression",root=>{
    const ui=shell(root,"Characters, frequencies, and assigned prefix codes",300);let text="three thin things";
    function draw(){
      const raw=[...text].slice(0,35),freq=new Map();raw.forEach(c=>freq.set(c,(freq.get(c)||0)+1));
      const queue=[...freq].map(([ch,n])=>({ch,n}));while(queue.length>1){queue.sort((a,b)=>a.n-b.n);const left=queue.shift(),right=queue.shift();queue.push({left,right,n:left.n+right.n});}
      const codes=new Map();function walk(v,code){if(!v)return;if("ch" in v){codes.set(v.ch,code||"0");return;}walk(v.left,code+"0");walk(v.right,code+"1");}walk(queue[0],"");
      const entries=[...freq].sort((a,b)=>b[1]-a[1]),bits=entries.reduce((a,[c,n])=>a+n*codes.get(c).length,0);
      ui.draw(entries.map(([c,n],i)=>{const cols=Math.ceil(entries.length/10),x=24+Math.floor(i/10)*Math.floor(710/cols),y=27+i%10*27;return label(x,y,c===" "?"␣":c,Y,16,"start")+label(x+33,y,n,G,14,"start")+label(x+58,y,codes.get(c),P,14,"start");}).join("") || label(380,152,"Enter a phrase to build its code."));
      ui.write("Payload: "+bits+" bits vs "+(raw.length*8)+" under an 8-bit-per-symbol baseline. Code table overhead is excluded.");
    }
    ui.input("Phrase",text,x=>{text=x;draw()});draw();
  });
  add("sequence-tailor","Sequence Tailor","Align two words using dynamic programming and inspect substitutions, insertions and deletions.","Edit distance",root=>{
    const ui=shell(root,"Levenshtein matrix of edit costs and traced optimal path",390);let a="MARIMO",b="MORNING";
    function draw(){
      const xs=[...a].slice(0,12),ys=[...b].slice(0,10),m=xs.length+1,n=ys.length+1,D=Array.from({length:n},()=>Array(m).fill(0));
      for(let j=0;j<m;j++)D[0][j]=j;for(let i=0;i<n;i++)D[i][0]=i;
      for(let i=1;i<n;i++)for(let j=1;j<m;j++)D[i][j]=Math.min(D[i-1][j]+1,D[i][j-1]+1,D[i-1][j-1]+(xs[j-1]!==ys[i-1]));
      let i=n-1,j=m-1;const path=new Set([i+","+j]);while(i||j){if(i&&j&&D[i][j]===D[i-1][j-1]+(xs[j-1]!==ys[i-1])){i--;j--;}else if(i&&D[i][j]===D[i-1][j]+1)i--;else j--;path.add(i+","+j);}
      const x=j=>70+j*49,y=i=>30+i*31;
      ui.draw(xs.map((c,j)=>label(x(j+1)+22,22,c,Y,14)).join("")+ys.map((c,i)=>label(42,y(i+1)+18,c,Y,14)).join("")+D.map((row,i)=>row.map((v,j)=>{const ok=path.has(i+","+j);return rect(x(j),y(i),44,26,ok?"#699f98":"#43315b",2)+label(x(j)+22,y(i)+19,v,ok?F:"#fff0dd",13)}).join("")).join(""));
      ui.write("Minimum edits: "+D[n-1][m-1]+". The highlighted path is one optimal alignment. Inputs use the first 12 and 10 characters.");
    }
    ui.input("Source",a,x=>{a=x;draw()});ui.input("Target",b,x=>{b=x;draw()});draw();
  });
  add("river-capacity","River Capacity","Change a bottleneck and watch Edmonds–Karp find the maximum flow across a network.","Network flow",root=>{
    const ui=shell(root,"Directed river routes showing assigned flow and capacity",288);let cap=4,scale=1;
    function draw(){
      const nodes=[[62,145],[255,46],[255,239],[503,46],[503,239],[697,145]],names=["Source","A","B","C","D","Outlet"];
      const edges=[[0,1,9],[0,2,7],[1,2,3],[1,3,cap],[1,4,3],[2,4,6],[3,5,10],[4,5,5],[4,3,2]];
      const c=nodes.map(()=>nodes.map(()=>0));for(const [i,j,w] of edges)c[i][j]=w*scale;
      const f=nodes.map(()=>nodes.map(()=>0));let flow=0,steps=0;
      for(;;){const prev=nodes.map(()=>-1),queue=[0];prev[0]=0;while(queue.length&&prev[5]<0){const i=queue.shift();for(let j=0;j<6;j++)if(prev[j]<0&&c[i][j]-f[i][j]>0){prev[j]=i;queue.push(j);}}if(prev[5]<0)break;
        let amt=Infinity;for(let i=5;i!==0;i=prev[i])amt=Math.min(amt,c[prev[i]][i]-f[prev[i]][i]);for(let i=5;i!==0;i=prev[i]){f[prev[i]][i]+=amt;f[i][prev[i]]-=amt;}flow+=amt;steps++;
      }
      ui.draw(edges.map(([a,b])=>{const [x,y]=nodes[a],[xx,yy]=nodes[b], q=Math.atan2(yy-y,xx-x), ax=xx-32*Math.cos(q),ay=yy-32*Math.sin(q);return line(x,y,ax,ay,f[a][b]>0?G:"#ac8dc4",1+f[a][b]*.29)+line(ax,ay,ax-10*Math.cos(q-.55),ay-10*Math.sin(q-.55),G)+line(ax,ay,ax-10*Math.cos(q+.55),ay-10*Math.sin(q+.55),G)+rect((x+xx)/2-22,(y+yy)/2-16,44,22,F)+label((x+xx)/2,(y+yy)/2,f[a][b]+"/"+c[a][b],Y,13);}).join("")+nodes.map(([x,y],i)=>'<circle cx="'+x+'" cy="'+y+'" r="30" fill="#60487d"/>'+label(x,y+5,names[i],"#fff0dd",13)).join(""));
      ui.write("Maximum flow: "+flow+" units in "+steps+" augmenting paths. Edges show flow / capacity.");
    }
    ui.slider("A → C capacity",0,14,cap,x=>{cap=x;draw()});ui.slider("Network scale",1,3,scale,x=>{scale=x;draw()});draw();
  });
  add("perceptron-plot","The Learning Line","Train a perceptron on tagged points and see how its separator changes.","Machine learning",root=>{
    const ui=shell(root,"Two classes of points and the current learned classifier boundary",288);
    let seed=12,overlap=.16,pts=[],w=[0,0,0],epoch=0;
    function reset(){const r=rng(seed);pts=Array.from({length:64},()=>{const x=r()*2-1,y=r()*2-1,z=(x+.48*y+(r()*2-1)*overlap)>0?1:-1;return [x,y,z]});w=[0,0,0];epoch=0;}
    function cls(x,y){return w[0]*x+w[1]*y+w[2]>=0?1:-1;}
    function train(){for(const [x,y,yhat] of pts)if(cls(x,y)!==yhat){w[0]+=.2*yhat*x;w[1]+=.2*yhat*y;w[2]+=.2*yhat;}epoch++;}
    function draw(){const X=x=>380+x*245,Yp=y=>144-y*125;
      let sep="";if(Math.hypot(w[0],w[1])>0){const intersections=[];if(Math.abs(w[1])>.0001)for(const x of [-1,1]){const y=-(w[0]*x+w[2])/w[1];if(Math.abs(y)<=1)intersections.push([x,y]);}if(Math.abs(w[0])>.0001)for(const y of [-1,1]){const x=-(w[1]*y+w[2])/w[0];if(Math.abs(x)<=1)intersections.push([x,y]);}if(intersections.length>=2)sep=line(X(intersections[0][0]),Yp(intersections[0][1]),X(intersections[1][0]),Yp(intersections[1][1]),"#fff0dd",2.7);}
      ui.draw(rect(135,19,490,250,"#3c2d53")+line(135,144,625,144,"#7a6087")+line(380,19,380,269,"#7a6087")+sep+pts.map(([x,y,z])=>z>0?'<circle cx="'+X(x)+'" cy="'+Yp(y)+'" r="5" fill="'+G+'"/>':rect(X(x)-4,Yp(y)-4,8,8,P)).join(""));
      ui.write("Epoch "+epoch+". Training accuracy "+Math.round(100*pts.filter(([x,y,z])=>cls(x,y)===z).length/pts.length)+"%. Changing overlap regenerates the dataset.");
    }
    ui.slider("Class overlap",0,1.2,overlap,x=>{overlap=x;reset();draw()},.04);
    ui.button("Train one epoch",()=>{train();draw()});ui.button("Train 20 epochs",()=>{for(let i=0;i<20;i++)train();draw()});ui.button("New sample",()=>{seed++;reset();draw()});reset();draw();
  });
  add("signal-grid","Signal Grid","Sweep cell density to see when a random medium connects top to bottom.","Union–find",root=>{
    const ui=shell(root,"Random lattice highlighting the biggest cluster and any spanning cluster",276), n=19;let p=.56, seed=92;
    function draw(){
      const r=rng(seed),n2=n*n,on=Array.from({length:n2},()=>r()<p),parent=on.map((_,i)=>i),size=on.map(x=>+x);
      function f(a){while(parent[a]!==a){parent[a]=parent[parent[a]];a=parent[a];}return a;}
      function union(a,b){a=f(a);b=f(b);if(a===b)return;if(size[b]>size[a])[a,b]=[b,a];parent[b]=a;size[a]+=size[b];}
      for(let i=0;i<n2;i++)if(on[i]){if(i%n&&on[i-1])union(i,i-1);if(i>=n&&on[i-n])union(i,i-n);}
      const top=new Set(on.slice(0,n).flatMap((y,i)=>y?[f(i)]:[])),bottom=new Set(on.slice(-n).flatMap((y,i)=>y?[f(n2-n+i)]:[]));const spans=new Set([...top].filter(k=>bottom.has(k)));
      let max=0;for(const s of size)max=Math.max(max,s);
      ui.draw(on.map((o,i)=>rect(252+14*(i%n),5+14*Math.floor(i/n),12,12,!o?"#3c284d":spans.has(f(i))?G:size[f(i)]===max?Y:P,1)).join(""));
      ui.write((spans.size?"A top-to-bottom connection exists.":"No top-to-bottom connection.")+" Largest component: "+max+" cells.");
    }
    ui.slider("Occupancy",.1,.95,p,x=>{p=x;draw()},.01);ui.button("New sample",()=>{seed++;draw()});draw();
  });
  rootNS.Algorithms=demos;
})();
