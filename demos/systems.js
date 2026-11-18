(() => {
  'use strict';
  const catalog = window.SOL_SECTIONS ||= {};
  const svgNS = 'http://www.w3.org/2000/svg';
  const colors = {
    ink:'#eff3fb', muted:'#9cabc0', line:'#31415b', night:'#111a2c', panel:'#18253b',
    cyan:'#6de3ed', orange:'#ffb66f', violet:'#bea8ff', lime:'#b7e993', red:'#ff889f'
  };
  const C=colors, palette=[C.cyan,C.orange,C.violet,C.lime,C.red,'#f7df7d'];
  function el(name, options={}, text) {
    const e=document.createElement(name);
    for(const [key,value] of Object.entries(options)) {
      if(key==='class') e.className=value;
      else if(key==='style') Object.assign(e.style,value);
      else e.setAttribute(key,value);
    }
    if(text!=null) e.textContent=text;
    return e;
  }
  function button(label, onClick) {
    const b=el('button',{type:'button'},label); b.addEventListener('click',onClick); return b;
  }
  function group(host, label, node) {
    const wrap=el('label',{style:{display:'inline-flex',alignItems:'center',gap:'.5rem',flexWrap:'wrap'}});
    wrap.append(el('span',{},label),node); host.append(wrap); return node;
  }
  function select(host,label,options,initial,change) {
    const s=el('select');
    for(const [value,caption] of options) s.append(el('option',{value},caption));
    s.value=initial; s.addEventListener('change',()=>change(s.value)); return group(host,label,s);
  }
  function slider(host,label,min,max,value,change) {
    const range=el('input',{type:'range',min,max,value,step:1});
    const out=el('output',{},value);
    const wrap=el('label',{style:{display:'inline-flex',alignItems:'center',gap:'.4rem',flexWrap:'wrap'}});
    range.style.width='5rem'; out.style.minWidth='1.4em';
    range.addEventListener('input',()=>{out.value=range.value;change(Number(range.value));});
    wrap.append(el('span',{},label),range,out); host.append(wrap); return range;
  }
  function field(host,label,attrs) {
    const input=el('input',attrs);
    input.style.width=attrs.type==='number'?'5rem':'10rem';
    return group(host,label,input);
  }
  function frame(root,aria,h=285) {
    const stage=el('div',{class:'demo-stage'});
    Object.assign(stage.style,{padding:'0',minHeight:'0',display:'block',overflow:'hidden',background:C.night,border:'1px solid '+C.line,borderRadius:'12px'});
    const draw=document.createElementNS(svgNS,'svg');
    Object.entries({viewBox:'0 0 720 '+h,role:'img','aria-label':aria}).forEach(([k,v])=>draw.setAttribute(k,v));
    Object.assign(draw.style,{display:'block',width:'100%',height:'auto',fontFamily:'ui-monospace, SFMono-Regular, Consolas, monospace'});
    stage.append(draw);
    const toolbar=el('div',{class:'demo-controls',style:{display:'flex',flexWrap:'wrap',gap:'.6rem',alignItems:'center',marginBlock:'.75rem'}});
    const status=el('div',{class:'demo-output',role:'status','aria-live':'polite',style:{minHeight:'2.9em',lineHeight:'1.5'}});
    root.append(stage,toolbar,status);
    return {draw,toolbar,status};
  }
  function mark(svg,tag,attrs={},value) {
    const e=document.createElementNS(svgNS,tag);
    Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));
    if(value!=null) e.textContent=value;
    svg.append(e); return e;
  }
  function box(svg,x,y,w,h,fill,stroke='none',r=6) {
    return mark(svg,'rect',{x,y,width:Math.max(0,w),height:Math.max(0,h),rx:r,fill,stroke});
  }
  function line(svg,x1,y1,x2,y2,stroke=C.line,dash) {
    return mark(svg,'line',{x1,y1,x2,y2,stroke,'stroke-width':1.25,...(dash?{'stroke-dasharray':dash}:{})});
  }
  function label(svg,x,y,value,opts={}) {
    return mark(svg,'text',{x,y,fill:C.ink,'font-size':13,...opts},String(value));
  }
  function circle(svg,cx,cy,r,fill,stroke='none') {
    return mark(svg,'circle',{cx,cy,r,fill,stroke,'stroke-width':1.25});
  }
  function heading(svg,left,right) {
    label(svg,24,30,left,{fill:C.ink,'font-weight':700,'letter-spacing':1});
    label(svg,696,30,right,{fill:C.muted,'text-anchor':'end','font-size':11});
    line(svg,24,42,696,42);
  }
  function tail(svg,left,right,y) {
    line(svg,24,y-16,696,y-16);
    label(svg,24,y,left,{fill:C.muted,'font-size':11});
    if(right) label(svg,696,y,right,{fill:C.muted,'text-anchor':'end','font-size':11});
  }
  function meter(svg,x,y,w,ratio,fill) {
    box(svg,x,y,w,7,C.line,'none',4);
    box(svg,x,y,w*Math.max(0,Math.min(1,ratio)),7,fill,'none',4);
  }
  function rng(seed) { return () => { seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; }; }
  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  function runner(toolbar,step,delay=520) {
    let interval;
    const toggle=button('Run',()=>interval ? stop() : start());
    function start() { if(interval) return; interval=setInterval(step,delay); toggle.textContent='Pause'; toggle.setAttribute('aria-pressed','true'); }
    function stop() { clearInterval(interval); interval=undefined; toggle.textContent='Run'; toggle.setAttribute('aria-pressed','false'); }
    toggle.setAttribute('aria-pressed','false'); toolbar.append(toggle);
    return stop;
  }

  const packet = {
    id:'packet-switch',title:'Packet Switch',summary:'Burst traffic into three output queues and see which packets make it through.',tag:'NETWORKS',accent:C.cyan,
    mount(root) {
      const {draw,toolbar,status}=frame(root,'Router output queues, throughput and dropped packets',289);
      let rate=8, policy='fifo', tick=0, queues, sent, drops, serial, incoming, exited, recent, random;
      const cap=9, speeds=[3,2,1], labels=['A / FAST','B / STANDARD','C / NARROW'];
      function reset() {
        tick=serial=0; queues=[[],[],[]]; sent=[0,0,0]; drops=[0,0,0]; incoming=[0,0,0]; exited=[0,0,0];
        recent=Array.from({length:18},()=>0); random=rng(31829); render();
      }
      function step(extra=0) {
        tick++; incoming=[0,0,0]; exited=[0,0,0];
        let loss=0;
        for(let n=0;n<(extra||rate);n++) {
          const r=random(), target=r<.36?0:r<.72?1:2, urgent=random()<.23;
          incoming[target]++;
          if(queues[target].length>=cap) {drops[target]++;loss++;continue;}
          queues[target].push({id:++serial,urgent});
        }
        for(let i=0;i<3;i++) {
          for(let n=0;n<speeds[i]&&queues[i].length;n++) {
            const priority=policy==='priority'?queues[i].findIndex(p=>p.urgent):-1;
            queues[i].splice(priority<0?0:priority,1);
            sent[i]++;exited[i]++;
          }
        }
        recent.push(loss);recent.shift();render();
      }
      function render() {
        draw.replaceChildren(); heading(draw,'OUTPUT QUEUES','TICK '+String(tick).padStart(3,'0'));
        label(draw,24,61,'ROUTE',{fill:C.muted,'font-size':10});
        label(draw,163,61,'ARRIVALS',{fill:C.muted,'font-size':10});
        label(draw,253,61,'BACKLOG / '+cap,{fill:C.muted,'font-size':10});
        label(draw,535,61,'SENT',{fill:C.muted,'font-size':10});
        label(draw,622,61,'DROPPED',{fill:C.muted,'font-size':10});
        queues.forEach((q,i)=>{
          const y=76+i*48;
          box(draw,24,y,672,39,C.panel);
          label(draw,36,y+23,labels[i],{fill:palette[i],'font-weight':700,'font-size':12});
          label(draw,168,y+23,'+'+incoming[i],{fill:C.ink});
          label(draw,202,y+23,'→',{fill:C.muted});
          for(let j=0;j<cap;j++) {
            const p=q[j];
            box(draw,253+j*25,y+9,20,20,p?(p.urgent?C.orange:palette[i]):C.night,p?'none':C.line,3);
            if(p&&p.urgent) label(draw,263+j*25,y+23,'!',{fill:C.night,'text-anchor':'middle','font-weight':700,'font-size':11});
          }
          label(draw,507,y+23,'→',{fill:C.muted});
          label(draw,536,y+23,String(sent[i]),{'font-weight':700});
          label(draw,624,y+23,String(drops[i]),{fill:drops[i]?C.red:C.muted,'font-weight':700});
        });
        label(draw,24,240,'LOSS / LAST 18 TICKS',{fill:C.muted,'font-size':10});
        recent.forEach((n,i)=>box(draw,207+i*19,248-Math.min(25,n*2),13,Math.max(2,Math.min(25,n*2)),n?C.red:C.line,'none',2));
        tail(draw,'! urgent packet','Output capacities: 3 / 2 / 1 per tick',275);
        status.textContent=tick
          ?'Tick '+tick+': '+incoming.reduce((a,b)=>a+b,0)+' arrived, '+exited.reduce((a,b)=>a+b,0)+' sent, '+recent.at(-1)+' dropped. '+queues.reduce((a,b)=>a+b.length,0)+' remain queued.'
          :'Step or run to inject traffic. Queue capacity is finite; new packets are dropped if the queue is already full.';
      }
      toolbar.append(button('Step',()=>step()),button('Burst +24',()=>step(24)));
      const stop=runner(toolbar,()=>step());
      slider(toolbar,'Packets / tick',1,15,rate,v=>{rate=v;});
      select(toolbar,'Discipline',[['fifo','FIFO'],['priority','Urgent first']],policy,v=>{policy=v;render();});
      toolbar.append(button('Reset',()=>{stop();reset();}));reset();
      return stop;
    }
  };

  const scheduler={
    id:'cpu-scheduler',title:'CPU Scheduler',summary:'Run the same jobs under three policies and inspect who gets the next CPU tick.',tag:'OPERATING SYSTEMS',accent:C.orange,
    mount(root) {
      const {draw,toolbar,status}=frame(root,'CPU execution timeline, job arrivals and wait statistics',301);
      const presets={
        mixed:[[0,8],[1,3],[3,6],[5,2],[8,4]],
        burst:[[0,12],[0,2],[0,3],[0,2],[0,1]],
        gaps:[[0,3],[7,5],[8,2],[16,4],[17,3]]
      };
      let policy='rr',preset='mixed',quantum=3,point=4,jobs,slots,head;
      function plan() {
        jobs=presets[preset].map(([at,size],i)=>({at,size,left:size,first:null,last:0,id:String.fromCharCode(65+i),i}));
        slots=[];let queue=[],cursor=0,used=0,running=null;
        for(let t=0;t<120&&jobs.some(j=>j.left);t++) {
          while(cursor<jobs.length&&jobs[cursor].at<=t) queue.push(jobs[cursor++]);
          if(running&&!running.left) {running=null;used=0;}
          if(policy==='rr'&&running&&used>=quantum) {queue.push(running);running=null;used=0;}
          if(policy==='srtf') {
            if(running) queue.push(running);
            queue.sort((a,b)=>a.left-b.left||a.at-b.at||a.i-b.i);
            running=null;
          }
          if(!running) {running=queue.shift();used=0;}
          if(!running){slots.push(null);continue;}
          if(running.first===null) running.first=t;
          running.left--;used++;slots.push(running);
          if(!running.left) running.last=t+1;
        }
        point=clamp(point,0,Math.max(0,slots.length-1));head.max=slots.length-1;head.value=point;head.nextElementSibling.value=point;
        render();
      }
      function render() {
        draw.replaceChildren();
        heading(draw,'CPU / SINGLE CORE',({rr:'ROUND ROBIN',fcfs:'FIRST COME FIRST SERVED',srtf:'SHORTEST REMAINING TIME'})[policy]);
        const x0=139,dx=550/slots.length;
        label(draw,24,88,'CPU',{fill:C.muted,'font-size':12});
        box(draw,x0,66,550,32,C.panel);
        slots.forEach((j,i)=>{
          const x=x0+i*dx;
          if(j) {
            box(draw,x+1,68,dx-2,28,palette[j.i],'none',3);
            if(dx>16) label(draw,x+dx/2,87,j.id,{fill:C.night,'font-weight':700,'text-anchor':'middle'});
          }
          if(i%2===0) label(draw,x+dx/2,112,i,{fill:C.muted,'font-size':10,'text-anchor':'middle'});
        });
        jobs.forEach(j=>{
          const y=135+j.i*24,a=x0+j.at*dx,b=x0+j.last*dx;
          label(draw,24,y+3,'JOB '+j.id,{fill:palette[j.i],'font-size':11,'font-weight':700});
          label(draw,79,y+3,j.size+'t',{fill:C.muted,'font-size':11});
          line(draw,a,y,b,y,C.line,'3 3');circle(draw,a,y,3,palette[j.i]);circle(draw,b-2,y,2,C.ink);
          slots.forEach((s,i)=>{if(s===j)box(draw,x0+i*dx+1,y-5,dx-2,10,palette[j.i],'none',2);});
        });
        const xp=x0+(point+.5)*dx;
        line(draw,xp,59,xp,244,C.ink);
        const avg=(k)=>jobs.reduce((sum,j)=>sum+k(j),0)/jobs.length;
        const wait=avg(j=>j.last-j.at-j.size).toFixed(1), response=avg(j=>j.first-j.at).toFixed(1);
        label(draw,24,268,'AVG WAIT  '+wait+'t',{fill:C.orange,'font-weight':700});
        label(draw,253,268,'AVG RESPONSE  '+response+'t',{fill:C.cyan,'font-weight':700});
        label(draw,696,268,'MAKESPAN '+slots.length+'t',{fill:C.muted,'text-anchor':'end','font-size':11});
        tail(draw,'Dots mark arrival and completion. Bars mark execution.','',290);
        const j=slots[point], ready=jobs.filter(a=>a.at<=point&&a.last>point&&a!==j).map(a=>a.id);
        status.textContent='Tick '+point+': '+(j?'job '+j.id+' is running':'CPU idle')+'. Waiting: '+(ready.join(', ')||'none')+'. Mean wait '+wait+' ticks; mean first response '+response+' ticks.';
      }
      select(toolbar,'Policy',[['rr','Round robin'],['fcfs','First come'],['srtf','Shortest remaining']],policy,v=>{policy=v;plan();});
      select(toolbar,'Workload',[['mixed','Mixed arrivals'],['burst','One long, four short'],['gaps','Idle gaps']],preset,v=>{preset=v;point=0;plan();});
      slider(toolbar,'Quantum',1,6,quantum,v=>{quantum=v;plan();});
      head=slider(toolbar,'Inspect tick',0,30,point,v=>{point=v;render();});
      plan();
    }
  };

  const bloom={
    id:'bloom-filter',title:'Bloom Filter',summary:'Hash words into a tiny bitset and catch “maybe” answers that turn out to be wrong.',tag:'PROBABILISTIC DATA',accent:C.violet,
    mount(root) {
      const {draw,toolbar,status}=frame(root,'Bloom filter bit map and hash probes',294);
      let m=48,k=3,inserted,bits,last,message;
      const initial=['maple','aspen','cedar','birch','larch','pine','alder','beech'];
      function hashes(value) {
        let a=2166136261,b=0x9e3779b9;
        for(const ch of value){a=Math.imul(a^ch.codePointAt(0),16777619);b=Math.imul(b^ch.codePointAt(0),0x85ebca6b);}
        return Array.from({length:k},(_,i)=> {
          let h=(a+Math.imul(i+1,b)+Math.imul(i*i+1,0x45d9f3b))|0;
          h=Math.imul(h^(h>>>16),0x45d9f3b);
          return ((h^(h>>>16))>>>0)%m;
        });
      }
      function rebuild() {bits=Array(m).fill(false);for(const word of inserted)for(const j of hashes(word))bits[j]=true;}
      function add(word) {inserted.add(word);for(const j of hashes(word))bits[j]=true;}
      function test(word,insert) {
        if(!word){message='Enter a word to '+(insert?'insert.':'test.');render();return;}
        const was=inserted.has(word), probe=hashes(word);
        if(insert) {add(word);message=(was?'Already inserted: ':'Inserted: ')+word+'.';last={word,probe,kind:'write'};}
        else {
          const maybe=probe.every(j=>bits[j]);
          const kind=maybe?(was?'hit':'false'):'miss';
          last={word,probe,kind};
          message=maybe?(was?'Maybe present; confirmed in the exact set.':'False positive: all probes were set, but “'+word+'” was never inserted.'):'Definitely absent: at least one probed bit is zero.';
        }
        render();
      }
      function render() {
        draw.replaceChildren();
        heading(draw,'HASH BITSET',m+' BITS / '+k+' HASHES');
        const n=bits.filter(Boolean).length;
        const probes=last?.probe||[];
        const probeColor=last?.kind==='false'?C.red:last?.kind==='miss'?C.orange:C.ink;
        for(let j=0;j<m;j++) {
          const x=24+(j%16)*42,y=60+Math.floor(j/16)*31;
          box(draw,x,y,34,25,bits[j]?C.violet:C.panel,probes.includes(j)?probeColor:C.line,4);
          label(draw,x+17,y+17,String(j).padStart(2,'0'),{fill:bits[j]?C.night:C.muted,'text-anchor':'middle','font-size':10,'font-weight':700});
        }
        const falseCount=Array.from({length:256},(_,i)=>'probe-'+i).filter(word=>!inserted.has(word)&&hashes(word).every(j=>bits[j])).length;
        const sampleCount=Array.from({length:256},(_,i)=>'probe-'+i).filter(word=>!inserted.has(word)).length;
        const frac=sampleCount?((100*falseCount)/sampleCount).toFixed(1):'0.0';
        meter(draw,24,203,350,n/m,C.violet);
        label(draw,24,228,n+' / '+m+' bits set',{fill:C.muted,'font-size':11});
        label(draw,696,203,inserted.size+' inserted',{fill:C.ink,'text-anchor':'end','font-weight':700});
        label(draw,696,227,frac+'% false positives in '+sampleCount+' sample probes',{fill:C.muted,'text-anchor':'end','font-size':11});
        const word=last?.word||'';
        tail(draw,word?'Probe: '+word.slice(0,26)+' → '+probes.join(', '):'Set bits are violet. Outlined bits are the last probe.','',278);
        status.textContent=message;
      }
      function reset(){inserted=new Set(initial);last=null;message='Eight tree names are preloaded. Try “cedar” or hunt for a false positive.';rebuild();render();}
      const input=field(toolbar,'Word',{type:'text',value:'cedar',maxlength:36,autocomplete:'off'});
      input.addEventListener('keydown',e=>{if(e.key==='Enter')test(input.value.trim().toLowerCase(),false);});
      toolbar.append(button('Test',()=>test(input.value.trim().toLowerCase(),false)),button('Insert',()=>test(input.value.trim().toLowerCase(),true)));
      toolbar.append(button('Find false positive',()=>{
        for(let i=0;i<2048;i++){const word='probe-'+i;if(!inserted.has(word)&&hashes(word).every(j=>bits[j])){input.value=word;test(word,false);return;}}
        last=null;message='None found in 2,048 probes. Try fewer bits or insert more words.';render();
      }));
      select(toolbar,'Bits',[[32,'32'],[48,'48'],[64,'64']],m,v=>{m=+v;last=null;rebuild();render();});
      slider(toolbar,'Hashes',1,6,k,v=>{k=v;last=null;rebuild();render();});
      toolbar.append(button('Reset words',reset));reset();
    }
  };

  const raft={
    id:'raft-election',title:'Quorum Under Pressure',summary:'Partition a five-node cluster and see why a minority cannot elect its own leader.',tag:'DISTRIBUTED SYSTEMS',accent:C.lime,
    mount(root) {
      const {draw,toolbar,status}=frame(root,'Five Raft voters, current terms and election status',306);
      const p=[[110,124],[184,205],[319,211],[492,205],[608,124]];
      let nodes,partition,now,events,chosen,nonce;
      function timeout(node) { return 4+((node.i*3+node.term*2+nonce++)%5); }
      function resetClock(node) {node.deadline=now+timeout(node);}
      function groupId(node){return partition&&(node.i===0||node.i===4)?1:0;}
      function peers(node) {return nodes.filter(v=>v.online&&groupId(v)===groupId(node));}
      function log(v){events.push(v);if(events.length>4)events.shift();}
      function downgrade(n,term){n.term=term;n.role='follower';n.vote=null;n.count=0;resetClock(n);}
      function start(n) {
        n.term++;n.role='candidate';n.vote=n.i;n.count=1;resetClock(n);
        for(const q of peers(n)) {
          if(q===n)continue;
          if(q.term>n.term){downgrade(n,q.term);log('Node '+(n.i+1)+' discovered higher term '+q.term+'.');return;}
          if(q.term<n.term)downgrade(q,n.term);
          if(q.vote===null||q.vote===n.i){q.vote=n.i;n.count++;resetClock(q);}
        }
        if(n.count>=3){n.role='leader';log('Node '+(n.i+1)+' won term '+n.term+' with '+n.count+' votes.');}
        else log('Node '+(n.i+1)+' heard '+n.count+' / 3 required votes in term '+n.term+'.');
      }
      function step() {
        now++;
        for(const n of nodes.filter(a=>a.online&&a.role==='leader')) {
          if(n.role!=='leader') continue;
          const team=peers(n);
          const highest=Math.max(...team.map(a=>a.term));
          if(highest>n.term){downgrade(n,highest);log('Former leader '+(n.i+1)+' saw term '+highest+' and stepped down.');continue;}
          for(const q of team){
            if(q===n)continue;
            if(q.term<n.term)downgrade(q,n.term);
            if(q.role!=='follower'){q.role='follower';q.count=0;}
            resetClock(q);
          }
        }
        for(const n of nodes){if(n.online&&n.role!=='leader'&&n.deadline<=now)start(n);}
        render();
      }
      function isQuorate(n) {
        return n.online&&n.role==='leader'&&peers(n).filter(q=>q.term<=n.term).length>=3;
      }
      function render() {
        draw.replaceChildren();heading(draw,'RAFT / LEADER ELECTION','TICK '+String(now).padStart(3,'0')+'  /  MAJORITY = 3');
        nodes.forEach((a,i)=>nodes.slice(i+1).forEach(b=>{
          if(!a.online||!b.online)return;
          const [ax,ay]=p[a.i],[bx,by]=p[b.i];
          const connected=groupId(a)===groupId(b);
          line(draw,ax,ay,bx,by,connected?C.line:'#553640',connected?null:'3 6');
        }));
        nodes.forEach(n=>{
          const [x,y]=p[n.i],valid=isQuorate(n),leader=n.role==='leader',color=!n.online?C.muted:valid?C.lime:leader?C.orange:n.role==='candidate'?C.violet:C.cyan;
          if(n.i===chosen)circle(draw,x,y,38,C.night,color);
          circle(draw,x,y,33,n.online?C.panel:C.night,color);
          label(draw,x,y-1,'N'+(n.i+1),{fill:color,'text-anchor':'middle','font-size':18,'font-weight':700});
          label(draw,x,y+14,'TERM '+n.term,{fill:C.muted,'text-anchor':'middle','font-size':9});
          label(draw,x,y+52,!n.online?'OFFLINE':valid?'LEADER':leader?'NO QUORUM':n.role==='candidate'?'VOTING':'FOLLOWER',{fill:color,'text-anchor':'middle','font-size':10,'font-weight':700});
        });
        label(draw,24,64,partition?'CUT: N1 + N5 | N2 + N3 + N4':'ALL LINKS AVAILABLE',{fill:partition?C.orange:C.muted,'font-size':11});
        tail(draw,(events.at(-1)||'No election yet.').slice(0,87),'',290);
        const leader=nodes.find(isQuorate);
        status.textContent=(leader?'Node '+(leader.i+1)+' has a reachable majority in term '+leader.term+'. ':'No leader currently has a majority. ')+(events.at(-1)||'');
      }
      function reset(){
        partition=false;now=0;nonce=0;events=[];
        nodes=p.map((_,i)=>({i,term:1,role:i===0?'leader':'follower',vote:0,online:true,count:i===0?5:0,deadline:0}));
        nodes.forEach(resetClock);log('Node 1 starts as leader. Try splitting the links.');render();
      }
      toolbar.append(button('Tick',step));const stop=runner(toolbar,step,580);
      toolbar.append(button('Split / Heal',()=>{partition=!partition;log(partition?'Partition created: 2 voters on one side, 3 on the other.':'Links restored. Tick to deliver heartbeats.');render();}));
      const selectedNode=select(toolbar,'Node',nodesOptions(),0,v=>{chosen=+v;render();});
      function nodesOptions(){return p.map((_,i)=>[i,'N'+(i+1)]);}
      toolbar.append(button('Toggle node',()=>{
        const n=nodes[chosen]; n.online=!n.online;
        if(n.online){n.role='follower';n.count=0;resetClock(n);}
        log('Node '+(chosen+1)+(n.online?' returned.':' went offline.'));render();
      }));
      toolbar.append(button('Reset',()=>{stop();selectedNode.value='0';chosen=0;reset();}));chosen=0;reset();
      return stop;
    }
  };

  const balancer={
    id:'load-balancer',title:'Dispatch Deck',summary:'Route work across uneven servers and compare queue growth, rejections, and wait time.',tag:'SERVICE ROUTING',accent:C.cyan,
    mount(root) {
      const {draw,toolbar,status}=frame(root,'Load balancing dispatcher and three service queues',294);
      const speeds=[1,2,4],queueMax=7;
      let nodes,now,policy='least',intensity=3,pointer,reject,complete,latency,random,dispatch,down=false;
      function reset(){nodes=speeds.map(()=>[]);now=pointer=reject=complete=latency=0;random=rng(717);dispatch=[0,0,0];down=false;render();}
      function step(extra=0){
        now++;dispatch=[0,0,0];
        const available=[0,1,2].filter(i=>i!==2||!down);
        for(let j=0;j<(extra||intensity);j++) {
          const key=Math.floor(random()*10),cost=2+Math.floor(random()*5);
          let target;
          if(policy==='least') {
            const room=available.filter(i=>nodes[i].length<queueMax);
            if(!room.length){reject++;continue;}
            target=room.reduce((a,b)=>work(a)/speeds[a]<=work(b)/speeds[b]?a:b);
          }
          else if(policy==='sticky') target=available[key%available.length];
          else target=available[pointer++%available.length];
          if(nodes[target].length>=queueMax){reject++;continue;}
          nodes[target].push({born:now,left:cost,cost,key});dispatch[target]++;
        }
        for(const i of available) {
          let budget=speeds[i];
          while(budget&&nodes[i].length) {
            const job=nodes[i][0], done=Math.min(budget,job.left);job.left-=done;budget-=done;
            if(!job.left){nodes[i].shift();complete++;latency+=now-job.born+1;}
          }
        }
        render();
      }
      function work(i){return nodes[i].reduce((a,b)=>a+b.left,0);}
      function render(){
        draw.replaceChildren();heading(draw,'REQUEST DISPATCH','TICK '+String(now).padStart(3,'0'));
        box(draw,24,72,152,146,C.panel,C.line);
        label(draw,100,103,'DISPATCHER',{fill:C.cyan,'text-anchor':'middle','font-size':12,'font-weight':700});
        label(draw,100,136,({least:'LEAST WORK',rr:'ROUND ROBIN',sticky:'STICKY CLIENT'})[policy],{fill:C.muted,'text-anchor':'middle','font-size':10});
        label(draw,100,176,'+'+dispatch.reduce((a,b)=>a+b,0)+' accepted',{fill:C.ink,'text-anchor':'middle','font-size':11});
        for(let i=0;i<3;i++){
          const y=63+i*57,online=i!==2||!down;
          line(draw,176,145,221,y+22,online?palette[i]:C.line,online?null:'3 4');
          box(draw,221,y,475,46,C.panel,online?C.line:C.red);
          label(draw,234,y+19,'SERVER '+String.fromCharCode(65+i),{fill:online?palette[i]:C.red,'font-size':12,'font-weight':700});
          label(draw,234,y+35,online?speeds[i]+' units / tick':'PAUSED',{fill:C.muted,'font-size':10});
          for(let j=0;j<queueMax;j++){
            const job=nodes[i][j], x=352+j*39;
            box(draw,x,y+10,32,26,C.night,C.line,4);
            if(job){
              box(draw,x+2,y+12,28*(job.left/job.cost),22,online?palette[i]:C.muted,'none',3);
              label(draw,x+16,y+29,job.left,{'text-anchor':'middle',fill:C.ink,stroke:C.night,'stroke-width':2,'paint-order':'stroke','font-size':11,'font-weight':700});
            }
          }
          label(draw,687,y+28,'+'+dispatch[i],{fill:C.muted,'text-anchor':'end','font-size':11});
        }
        const average=complete?(latency/complete).toFixed(1):'—';
        label(draw,24,244,'FINISHED '+complete,{fill:C.lime,'font-weight':700});
        label(draw,239,244,'REJECTED '+reject,{fill:C.red,'font-weight':700});
        label(draw,696,244,'MEAN LATENCY '+average+(complete?'t':''),{fill:C.muted,'text-anchor':'end','font-size':11});
        tail(draw,'Queue cells show remaining service units.','',278);
        status.textContent='Tick '+now+'. '+complete+' completed, '+reject+' rejected. '+nodes.reduce((a,b)=>a+b.length,0)+' jobs queued.'+(complete?' Mean latency '+average+' ticks.':'');
      }
      toolbar.append(button('Step',()=>step()),button('Burst +12',()=>step(12)));
      const stop=runner(toolbar,()=>step());
      select(toolbar,'Policy',[['least','Least work / speed'],['rr','Round robin'],['sticky','Sticky client']],policy,v=>{policy=v;render();});
      slider(toolbar,'Requests / tick',1,10,intensity,v=>{intensity=v;});
      toolbar.append(button('Pause / resume C',()=>{down=!down;render();}),button('Reset',()=>{stop();reset();}));reset();
      return stop;
    }
  };

  const cache={
    id:'cache-replacement',title:'Cache Trace',summary:'Step through reads and watch locality, replacement policy and cache size change the hit rate.',tag:'MEMORY SYSTEMS',accent:C.violet,
    mount(root){
      const {draw,toolbar,status}=frame(root,'Cache lines, replacement state, and reference trace',304);
      const workloads={
        cycle:[1,2,3,4,1,2,5,1,2,3,4,5],
        local:[2,2,4,4,2,4,1,4,2,7,2,2,4,1,1,4,9,2,4,1],
        scan:[0,1,0,1,2,3,4,5,6,7,0,1,0,1,8,9,0,1]
      };
      let policy='lru', size=3, pattern='cycle', lines, hand, count, hits, last, trace;
      function reset(){
        lines=Array(size).fill(null);hand=count=hits=0;last=null;trace=[];render();
      }
      function pageAt(n){const list=workloads[pattern];return list[n%list.length];}
      function step(){
        const page=pageAt(count++);
        let slot=lines.findIndex(v=>v?.page===page);
        const hit=slot!==-1;
        let evicted=null;
        if(hit){hits++;lines[slot].seen=count;lines[slot].bit=true;}
        else {
          if(policy==='clock'){
            while(lines[hand]?.bit){lines[hand].bit=false;hand=(hand+1)%size;}
            slot=hand;hand=(hand+1)%size;
          }else{
            slot=lines.findIndex(v=>!v);
            if(slot<0) {
              const prop=policy==='fifo'?'put':'seen';
              slot=lines.reduce((least,v,i)=>v[prop]<lines[least][prop]?i:least,0);
            }
          }
          evicted=lines[slot]?.page??null;
          lines[slot]={page,put:count,seen:count,bit:true};
        }
        last={page,slot,hit,evicted};trace.push(last);if(trace.length>14)trace.shift();render();
      }
      function render(){
        draw.replaceChildren();
        heading(draw,'CACHE / DEMAND READS',({lru:'LEAST RECENTLY USED',fifo:'FIRST IN, FIRST OUT',clock:'CLOCK / SECOND CHANCE'})[policy]);
        const w=658/size;
        for(let i=0;i<size;i++){
          const x=24+i*w,v=lines[i],focus=last?.slot===i;
          box(draw,x,64,w-9,93,C.panel,focus?(last.hit?C.lime:C.orange):C.line,6);
          label(draw,x+10,82,'LINE '+i+(policy==='clock'&&hand===i?' ◀':''),{fill:policy==='clock'&&hand===i?C.cyan:C.muted,'font-size':10});
          label(draw,x+w/2-5,120,v?'P'+v.page:'–',{fill:v?palette[v.page%palette.length]:C.muted,'font-size':26,'font-weight':700,'text-anchor':'middle'});
          if(v) label(draw,x+w/2-5,142,policy==='clock'?'REF '+Number(v.bit):policy==='fifo'?'IN '+v.put:'USED '+v.seen,{fill:C.muted,'font-size':10,'text-anchor':'middle'});
        }
        label(draw,24,184,'LAST 14 ACCESSES',{fill:C.muted,'font-size':10});
        trace.forEach((v,i)=>{
          const x=24+i*34;box(draw,x,194,29,27,v.hit?C.lime:C.orange,'none',3);
          label(draw,x+14.5,212,v.page,{fill:C.night,'font-size':12,'font-weight':700,'text-anchor':'middle'});
        });
        const ratio=count?hits/count:0;
        meter(draw,24,245,260,ratio,C.lime);
        label(draw,300,252,count?(ratio*100).toFixed(1)+'% HIT RATE':'NO READS YET',{fill:C.lime,'font-size':12,'font-weight':700});
        label(draw,696,212,'NEXT  P'+pageAt(count),{fill:C.cyan,'text-anchor':'end','font-weight':700});
        tail(draw,'Green = hit   Amber = miss',hits+' hits / '+count+' reads',289);
        status.textContent=last?'Read page '+last.page+': '+(last.hit?'hit in':'miss; loaded into')+' line '+last.slot+(last.evicted===null?'.':', evicting page '+last.evicted+'.'):'Compare replacement rules using the same repeating page trace. The next read is P'+pageAt(count)+'.';
      }
      toolbar.append(button('Read next',step),button('Read eight',()=>{for(let i=0;i<8;i++)step();}));
      const stop=runner(toolbar,step);
      select(toolbar,'Policy',[['lru','LRU'],['fifo','FIFO'],['clock','Clock']],policy,v=>{stop();policy=v;reset();});
      select(toolbar,'Trace',[['cycle','Looping working set'],['local','Locality bursts'],['scan','Sequential pollution']],pattern,v=>{stop();pattern=v;reset();});
      slider(toolbar,'Lines',2,6,size,v=>{stop();size=v;reset();});
      toolbar.append(button('Reset',()=>{stop();reset();}));reset();return stop;
    }
  };

  const btree={
    id:'bplus-index',title:'B+ Tree Explorer',summary:'Look up a range, follow the leaf links, and count how many index pages you actually touch.',tag:'DATABASE INDEXES',accent:C.orange,
    mount(root){
      const {draw,toolbar,status}=frame(root,'B+ tree index pages, query path, and sequential leaf scan',318);
      const initial=[3,6,8,11,13,16,19,24,28,31,34,37,42,46,51,57,61,66,73,80,92];
      let keys=initial.slice(),fanout=4,levels=[],path=[],scanned=[],matches=[],caption='';
      function pack(list,make){
        const n=Math.ceil(list.length/fanout);
        let off=0;
        return Array.from({length:n},(_,i)=>{
          const width=Math.floor(list.length/n)+(i<list.length%n?1:0);
          const group=list.slice(off,off+width);off+=width;return make(group);
        });
      }
      function build(){
        levels=[pack(keys,group=>({leaf:true,first:group[0],keys:group}))];
        levels[0].forEach((page,i,row)=>{page.high=row[i+1]?.first??Infinity;});
        while(levels.at(-1).length>1)levels.push(pack(levels.at(-1),children=>({leaf:false,first:children[0].first,keys:children.slice(1).map(v=>v.first),children})));
        const height=levels.length-1;
        levels.forEach((row,j)=>row.forEach((node,i)=>{
          node.x=24+(i+.5)*(672/row.length);
          node.y=74+(height-j)*(height?159/height:0);
          node.w=Math.min(row.length===1?200:152,672/row.length-12);
        }));
      }
      function value(input) {
        if(!input.value.trim())return null;
        const n=Number(input.value);
        return Number.isInteger(n)&&n>=0&&n<=99?n:null;
      }
      function query(){
        const a=value(lo),b=value(hi);
        path=[];scanned=[];matches=[];
        if(a===null||b===null||a>b){caption='Use whole numbers from 0 to 99, with From no higher than To.';render();return;}
        let node=levels.at(-1)[0];
        while(!node.leaf){
          path.push(node);
          const split=node.keys.findIndex(key=>a<key);
          node=node.children[split===-1?node.children.length-1:split];
        }
        const leaves=levels[0],start=leaves.indexOf(node);
        let finished=false;
        for(let i=start;i<leaves.length&&!finished;i++){
          const leaf=leaves[i];scanned.push(leaf);
          for(const k of leaf.keys){
            if(k>b){finished=true;break;}
            if(k>=a)matches.push(k);
          }
          // The current page stores its own upper fence key.
          if(leaf.high>b)finished=true;
        }
        const reads=path.length+scanned.length;
        caption=a+'–'+b+': '+(matches.length?'found '+matches.join(', '):'no matches')+'. Read '+reads+' of '+levels.flat().length+' index pages.';
        render();
      }
      function render(){
        draw.replaceChildren();
        heading(draw,'B+ TREE / LINKED LEAVES','FANOUT '+fanout+' / '+keys.length+' KEYS');
        const leaves=levels[0];
        for(let i=1;i<leaves.length;i++){
          const a=leaves[i-1],b=leaves[i],active=scanned.includes(a)&&scanned.includes(b),x0=a.x+a.w/2,x1=b.x-b.w/2,y=a.y;
          line(draw,x0,y,x1,y,active?C.orange:C.line);
          mark(draw,'path',{d:'M'+(x1-4)+' '+(y-3)+' L'+x1+' '+y+' L'+(x1-4)+' '+(y+3),fill:'none',stroke:active?C.orange:C.line});
        }
        for(const node of levels.flat()){
          if(node.leaf)continue;
          node.children.forEach(child=>{
            const active=path.includes(node)&&(path.includes(child)||scanned[0]===child);
            line(draw,node.x,node.y+18,child.x,child.y-18,active?C.orange:C.line,active?null:'3 4');
          });
        }
        for(const node of levels.flat()){
          const active=path.includes(node)||scanned.includes(node),x=node.x-node.w/2;
          box(draw,x,node.y-17,node.w,34,active?'#3b2f34':C.panel,active?C.orange:C.line,5);
          const inset=12,cell=(node.w-inset)/node.keys.length;
          node.keys.forEach((k,i)=>{
            const px=x+inset/2+i*cell;
            const found=node.leaf&&matches.includes(k);
            if(found)box(draw,px+1,node.y-10,cell-2,20,C.orange,'none',3);
            label(draw,px+cell/2,node.y+4,k,{fill:found?C.night:active?C.ink:C.muted,'text-anchor':'middle','font-size':12,'font-weight':found?700:500});
          });
        }
        label(draw,24,277,'MATCHES '+matches.length,{fill:C.orange,'font-weight':700});
        label(draw,696,277,'PAGES READ '+(path.length+scanned.length)+' / '+levels.flat().length,{fill:C.muted,'text-anchor':'end','font-size':11});
        tail(draw,'Internal keys route lookups. Leaf pages hold the data keys.','',304);
        status.textContent=caption;
      }
      const lo=field(toolbar,'From',{type:'number',min:0,max:99,value:23}),hi=field(toolbar,'To',{type:'number',min:0,max:99,value:58});
      toolbar.append(button('Find range',query));
      [lo,hi].forEach(input=>input.addEventListener('keydown',e=>{if(e.key==='Enter')query();}));
      select(toolbar,'Fanout',[[3,'3'],[4,'4'],[5,'5'],[6,'6']],fanout,v=>{fanout=+v;build();query();});
      const add=field(toolbar,'New key',{type:'number',min:0,max:99,value:54});
      toolbar.append(button('Insert / rebuild',()=>{
        const n=value(add);
        if(n===null||keys.includes(n)||keys.length>=24){caption=n===null?'Use a new whole number from 0 to 99.':keys.includes(n)?'Key '+n+' already exists.':'This view caps the index at 24 keys. Reset to add more.';render();return;}
        keys.push(n);keys.sort((x,y)=>x-y);build();query();
      }),button('Reset keys',()=>{keys=initial.slice();build();query();}));
      build();query();
    }
  };

  const xor={
    id:'xor-shards',title:'One-Shard Recovery',summary:'Lose a data shard, reconstruct it with XOR parity, then see what happens when two disappear.',tag:'FAULT TOLERANCE',accent:C.lime,
    mount(root){
      const {draw,toolbar,status}=frame(root,'Binary shards and XOR parity recovery calculation',316);
      const examples={
        mixed:[[0x3b,0x2c,0xf0,0x4a],[0xc6,0x3e,0x81,0x60],[0x78,0x1b,0xa5,0x93]],
        text:[[72,69,76,76],[79,32,70,82],[79,77,32,33]],
        solid:[[0xff,0x00,0x55,0xaa],[0xff,0xff,0x55,0xaa],[0x00,0x00,0x0f,0xf0]]
      };
      let pattern='mixed',byte=0,shards=[],copies=[],restored=-1,message='';
      const names=['DATA A','DATA B','DATA C','PARITY'];
      const hex=n=>n.toString(16).toUpperCase().padStart(2,'0');
      const rowButton=names.map((name,i)=>button('Lose '+name,()=>{
        if(shards[i]){shards[i]=null;restored=-1;message=name+' is now unavailable.';}
        else{shards[i]=copies[i].slice();restored=-1;message=name+' returned from the original drive.';}
        render();
      }));
      function reset(){
        const data=examples[pattern].map(row=>row.slice());
        copies=[...data,data[0].map((v,i)=>v^data[1][i]^data[2][i])];
        shards=copies.map(x=>x.slice());restored=-1;
        message='Three data shards and one parity shard are available. Lose any one, then recover it.';render();
      }
      function recover(){
        const missing=shards.flatMap((v,i)=>v?[]:[i]);
        if(missing.length===1){
          const i=missing[0];shards[i]=Array.from({length:4},(_,j)=>shards.reduce((acc,row)=>row?acc^row[j]:acc,0));restored=i;
          message=names[i]+' reconstructed. All four bytes match the original shard.';
        }else message=missing.length?'Cannot recover '+missing.length+' missing shards from one XOR parity shard.':'No shards are missing.';
        render();
      }
      function render(){
        draw.replaceChildren();
        heading(draw,'LOCAL SHARDS / 3 + 1','INSPECTING BYTE '+(byte+1)+' OF 4');
        shards.forEach((row,i)=>{
          const y=59+i*43,color=i===3?C.violet:palette[i===2?3:i];
          box(draw,24,y,672,35,row?C.panel:C.night,restored===i?C.lime:row?C.line:C.red,5);
          label(draw,38,y+22,names[i],{fill:row?color:C.red,'font-size':12,'font-weight':700});
          for(let j=0;j<4;j++){
            box(draw,140+j*43,y+6,37,23,j===byte&&row?color:C.night,C.line,3);
            label(draw,158.5+j*43,y+22,row?hex(row[j]):'– –',{fill:j===byte&&row?C.night:C.muted,'font-size':11,'text-anchor':'middle','font-weight':700});
          }
          for(let j=0;j<8;j++){
            const bit=row?(row[byte]>>(7-j))&1:0,x=337+j*33;
            box(draw,x,y+6,27,23,bit?color:C.night,C.line,3);
            label(draw,x+13.5,y+22,row?bit:'·',{fill:bit?C.night:C.muted,'font-size':11,'text-anchor':'middle','font-weight':700});
          }
          label(draw,684,y+22,row?(restored===i?'RESTORED':'READY'):'MISSING',{fill:row?restored===i?C.lime:C.muted:C.red,'text-anchor':'end','font-size':10});
          rowButton[i].textContent=(row?'Lose ':'Return ')+names[i];
          rowButton[i].setAttribute('aria-pressed',String(!row));
        });
        let target=restored;
        if(target<0)target=shards.findIndex(v=>!v);
        if(target<0)target=3;
        const others=shards.filter((_,i)=>i!==target);
        const expression=others.map(row=>row?'0x'+hex(row[byte]):'  ? ').join('  XOR  ');
        label(draw,24,261,expression+'  =  '+(others.includes(null)?'insufficient data':'0x'+hex(others.reduce((a,row)=>a^row[byte],0))+' / '+names[target]),{fill:C.lime,'font-weight':700});
        tail(draw,'The four bytes are recovered independently.','',300);
        status.textContent=message;
      }
      toolbar.append(...rowButton,button('Recover',recover));
      select(toolbar,'Payload',[['mixed','Mixed bytes'],['text','Text bytes'],['solid','Repeated patterns']],pattern,v=>{pattern=v;reset();});
      slider(toolbar,'Byte',1,4,byte+1,v=>{byte=v-1;render();});
      toolbar.append(button('Reset',reset));reset();
    }
  };

  const allocator={
    id:'heap-allocator',title:'Heap Fragments',summary:'Allocate and free blocks in a tiny heap to test when free space stops being usable.',tag:'RESOURCE ALLOCATION',accent:C.red,
    mount(root){
      const {draw,toolbar,status}=frame(root,'Fragmented heap with named allocations and holes',298);
      const capacity=64;
      let blocks,serial,policy='first',merge='auto',amount=11,caption='';
      function initial(){
        blocks=[{id:'A',size:10},{id:null,size:8},{id:'B',size:7},{id:null,size:15},{id:'C',size:11},{id:null,size:13}];serial=3;
        caption='36 units are free, but the largest free block is only 15. Try requesting 16.';render();
      }
      function compact(){
        let joined=0;
        for(let i=1;i<blocks.length;){
          if(!blocks[i].id&&!blocks[i-1].id){blocks[i-1].size+=blocks[i].size;blocks.splice(i,1);joined++;}
          else i++;
        }
        return joined;
      }
      function alloc(){
        const choices=blocks.map((b,i)=>({b,i})).filter(({b})=>!b.id&&b.size>=amount);
        if(!choices.length){caption='Could not allocate '+amount+' contiguous units.';render();return;}
        if(policy==='best')choices.sort((a,b)=>a.b.size-b.b.size||a.i-b.i);
        if(policy==='worst')choices.sort((a,b)=>b.b.size-a.b.size||a.i-b.i);
        const {b,i}=choices[0],name=serial<26?String.fromCharCode(65+serial):'B'+(serial+1);
        serial++;
        blocks.splice(i,1,{id:name,size:amount},...(b.size>amount?[{id:null,size:b.size-amount}]:[]));
        caption='Allocated '+name+' ('+amount+' units) from a '+b.size+'-unit hole.';render();
      }
      function render(){
        draw.replaceChildren();
        heading(draw,'HEAP / CONTIGUOUS BLOCKS','0x00 – 0x3F  /  '+capacity+' UNITS');
        const x0=24,span=672,dx=span/capacity;
        let cumulative=0;
        blocks.forEach((b,i)=>{
          const x=x0+cumulative*dx,w=b.size*dx,color=b.id?palette[i%palette.length]:C.panel;
          box(draw,x+1,92,w-2,74,color,b.id?'none':C.line,4);
          if(!b.id) for(let s=4;s<w-6;s+=8)line(draw,x+s,151,x+Math.min(s+7,w-2),141,C.line);
          if(w>19) label(draw,x+w/2,119,b.id||'FREE',{fill:b.id?C.night:C.muted,'text-anchor':'middle','font-size':w>48?12:9,'font-weight':700});
          if(w>19) label(draw,x+w/2,141,b.size,{fill:b.id?C.night:C.ink,'text-anchor':'middle','font-size':11});
          cumulative+=b.size;
        });
        for(let p=0;p<=capacity;p+=8){
          const x=x0+p*dx;line(draw,x,178,x,186,C.line);
          label(draw,x,199,p.toString(16).toUpperCase().padStart(2,'0'),{fill:C.muted,'font-size':10,'text-anchor':p===0?'start':p===capacity?'end':'middle'});
        }
        const free=blocks.reduce((a,b)=>b.id?a:a+b.size,0),largest=Math.max(0,...blocks.filter(b=>!b.id).map(b=>b.size));
        const frag=free?Math.round(100*(1-largest/free)):0;
        label(draw,24,232,'FREE '+free+' / 64',{fill:C.cyan,'font-weight':700});
        label(draw,243,232,'LARGEST HOLE '+largest,{fill:C.orange,'font-weight':700});
        label(draw,696,232,'FRAGMENTATION '+frag+'%',{fill:C.red,'text-anchor':'end','font-size':11});
        tail(draw,'Fragmentation = 1 − largest free block / all free space (0 if full).','',281);
        status.textContent=caption+' Free: '+free+' units. Largest hole: '+largest+'.';
        const selected=freeChoice.value;
        freeChoice.replaceChildren();
        const allocated=blocks.filter(b=>b.id);
        for(const b of allocated)freeChoice.append(el('option',{value:b.id},b.id+' ('+b.size+')'));
        if(allocated.some(b=>b.id===selected))freeChoice.value=selected;
        freeChoice.disabled=freeButton.disabled=!allocated.length;
      }
      slider(toolbar,'Request units',2,32,amount,v=>{amount=v;});
      select(toolbar,'Fit',[['first','First fit'],['best','Best fit'],['worst','Worst fit']],policy,v=>{policy=v;});
      toolbar.append(button('Allocate',alloc));
      const freeChoice=select(toolbar,'Allocation',[],'',()=>{});
      const freeButton=button('Free',()=>{
        const id=freeChoice.value,b=blocks.find(x=>x.id===id);
        if(!id||!b)return;
        b.id=null;const joins=merge==='auto'?compact():0;
        caption='Freed '+id+(joins?'; merged '+joins+' adjacent pair'+(joins===1?'':'s')+'.':'.');render();
      });
      toolbar.append(freeButton);
      select(toolbar,'Coalescing',[['auto','On free'],['manual','Manual']],merge,v=>{merge=v;});
      toolbar.append(button('Merge holes',()=>{
        const joins=compact();caption=joins?'Merged '+joins+' adjacent free pair'+(joins===1?'':'s')+'.':'No adjacent holes to merge.';render();
      }),button('Reset heap',initial));
      initial();
    }
  };

  const wal={
    id:'write-ahead-log',title:'Crash & Recover',summary:'Commit a transaction, cut the power, then replay what really made it to durable storage.',tag:'DATABASE DURABILITY',accent:C.cyan,
    mount(root){
      const {draw,toolbar,status}=frame(root,'Database pages, transaction buffer, and durable or volatile write-ahead log',323);
      let disk,log,next,active,available,last,chosen='A';
      const pg=['A','B','C'];
      function reset(){
        disk={A:25,B:50,C:75};log=[];active=null;next=1;available=true;
        last='Begin a transaction, stage a write and then try a crash before or after commit.';render();
      }
      function committed(){
        return new Set(log.filter(r=>r.kind==='COMMIT'&&r.durable).map(r=>r.tx));
      }
      function replay(){
        const result={...disk},mine=committed();
        for(const r of log)if(r.durable&&r.kind==='SET'&&mine.has(r.tx))result[r.page]=r.value;
        return result;
      }
      function note(msg){last=msg;render();}
      function sync(){for(const r of log)r.durable=true;}
      const begin=button('Begin',()=>{
        active=next++;log.push({kind:'BEGIN',tx:active,durable:false});note('Started T'+active+'.');
      });
      const write=button('Stage write',()=>{
        const v=Number(value.value);
        if(!value.value.trim()||!Number.isInteger(v)||v<0||v>999){note('Use a whole page value from 0 to 999.');return;}
        log.push({kind:'SET',tx:active,page:chosen,value:v,durable:false});
        note('Staged page '+chosen+' = '+v+' in T'+active+'. The data pages on disk have not changed.');
      });
      const flush=button('Flush log',()=>{sync();note('All log records are now durable. A write without a COMMIT record is still uncommitted.');});
      const commit=button('Commit & flush',()=>{
        const t=active;log.push({kind:'COMMIT',tx:t,durable:false});sync();active=null;
        note('T'+t+' is committed. Its writes can be recovered from the durable log even though disk pages are unchanged.');
      });
      const checkpoint=button('Checkpoint',()=>{
        disk=replay();log=[];note('Checkpoint applied committed writes to disk pages and cleared the log.');
      });
      const crash=button('Crash',()=>{
        const lost=log.filter(r=>!r.durable).length;
        log=log.filter(r=>r.durable);active=null;available=false;
        note('Power cut. '+lost+' volatile log record'+(lost===1?' was':'s were')+' lost; disk pages and durable records survived.');
      });
      const recover=button('Recover',()=>{
        available=true;const successes=committed(),replayed=log.filter(r=>r.kind==='SET'&&successes.has(r.tx)).length;
        const incomplete=Array.from(new Set(log.filter(r=>!successes.has(r.tx)).map(r=>r.tx))).length;
        // A recovery-time log cleanup discards durable but uncommitted records.
        log=log.filter(r=>successes.has(r.tx));
        note('Replayed '+replayed+' committed write'+(replayed===1?'':'s')+'; ignored '+incomplete+' uncommitted transaction'+(incomplete===1?'':'s')+'.');
      });
      function render(){
        draw.replaceChildren();
        heading(draw,'WAL / NO-STEAL BUFFER',available?(active?'RUNNING / T'+active+' OPEN':'RUNNING / READY'):'OFFLINE / RECOVERY REQUIRED');
        const current=available?replay():null;
        if(active&&current)for(const r of log)if(r.tx===active&&r.kind==='SET')current[r.page]=r.value;
        label(draw,24,79,'DISK PAGES',{fill:C.muted,'font-size':11,'font-weight':700});
        label(draw,24,165,'WORKING VIEW',{fill:C.muted,'font-size':11,'font-weight':700});
        pg.forEach((name,i)=>{
          const x=24+i*94;
          box(draw,x,90,82,57,C.panel,C.line);
          label(draw,x+11,108,name,{fill:C.muted,'font-size':10});
          label(draw,x+41,132,disk[name],{fill:C.cyan,'text-anchor':'middle','font-size':20,'font-weight':700});
          box(draw,x,176,82,57,C.panel,C.line);
          label(draw,x+11,194,name,{fill:C.muted,'font-size':10});
          label(draw,x+41,218,current?current[name]:'–',{fill:current&&current[name]!==disk[name]?C.orange:C.muted,'text-anchor':'middle','font-size':20,'font-weight':700});
        });
        line(draw,320,59,320,257,C.line);
        label(draw,344,80,'LOG / LAST '+Math.min(5,log.length)+' OF '+log.length,{fill:C.muted,'font-size':11,'font-weight':700});
        log.slice(-5).forEach((r,i)=>{
          const y=91+i*31;
          box(draw,344,y,352,25,C.panel);
          label(draw,355,y+17,'T'+r.tx+'  '+r.kind+(r.kind==='SET'?' '+r.page+' = '+r.value:''),{fill:C.ink,'font-size':11});
          label(draw,684,y+17,r.durable?'DURABLE':'VOLATILE',{fill:r.durable?C.lime:C.orange,'text-anchor':'end','font-size':10,'font-weight':700});
        });
        if(!log.length)label(draw,344,116,'No log records yet.',{fill:C.muted,'font-size':12});
        tail(draw,'Working view includes staged writes; durable data pages change at checkpoints.','',300);
        begin.disabled=!available||active!==null;
        write.disabled=commit.disabled=!available||active===null;
        flush.disabled=!available||!log.some(r=>!r.durable);
        checkpoint.disabled=!available||active!==null||!log.length;
        crash.disabled=!available;recover.disabled=available;
        status.textContent=last;
      }
      select(toolbar,'Page',pg.map(v=>[v,v]),chosen,v=>{chosen=v;});
      const value=field(toolbar,'Page value',{type:'number',min:0,max:999,value:90});
      toolbar.append(begin,write,flush,commit,checkpoint,crash,recover,button('Reset',reset));
      reset();
    }
  };

  catalog.Systems=[packet,scheduler,bloom,raft,balancer,cache,btree,xor,allocator,wal];
})();
