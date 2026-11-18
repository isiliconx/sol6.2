(() => {
  "use strict";
  const groups = ["Science","Creative","Systems","Algorithms","Games"];
  const sections = window.SOL_SECTIONS || {};
  const list = groups.flatMap(group => (sections[group] || []).map(demo => ({...demo,group})));
  const byId = new Map(list.map(demo => [demo.id,demo]));
  const palette = {
    Science:["#24276c","#bdc3f8","#facea3"],Creative:["#57164e","#ffbebd","#e7b9fd"],
    Systems:["#231833","#a2e2d2","#ee9fc9"],Algorithms:["#382059","#efb8f7","#eaddae"],
    Games:["#482238","#ffd088","#ffa4ae"]
  };
  const $ = id => document.getElementById(id);
  const SVG = "http://www.w3.org/2000/svg";
  function svg(tag, attrs, parent) {
    const node = document.createElementNS(SVG,tag);
    for (const [k,v] of Object.entries(attrs)) node.setAttribute(k,v);
    if(parent) parent.append(node);
    return node;
  }
  function make(tag, cls, txt) {
    const n=document.createElement(tag); if(cls)n.className=cls;if(txt)n.textContent=txt;return n;
  }
  const orbit = $("hero-orbit");
  for(let j=0;j<29;j++){
    const dw=j/28; let d="";
    for(let i=0;i<=230;i++){
      const t=i/230*Math.PI*2, tilt=dw*1.7-0.83;
      const r=186+29*Math.cos(3*t+dw*4.6), stretch=.48+.27*Math.sin(j*.102+.47);
      const xx=r*Math.cos(t),yy=r*stretch*Math.sin(t) + 40*Math.sin(t*2+dw*4.4);
      const x=330+xx*Math.cos(tilt)-yy*Math.sin(tilt),y=246+xx*Math.sin(tilt)+yy*Math.cos(tilt);
      d+=(i?"L":"M")+x.toFixed(1)+" "+y.toFixed(1);
    }
    svg("path",{d,fill:"none",stroke:j<9?"#f3c5f8":j<20?"#8d9aff":"#fff3d1","stroke-width":j===20?2.1:1,"stroke-opacity":.77},orbit);
  }
  const checks = ["All",...groups];
  const filters=$("filters"), cards=$("cards"), search=$("search"), dialog=$("experiment"), target=$("demo-root");
  let active = "All", current, cleanup, origin;
  for (const group of checks) {
    const b=make("button","",group); b.type="button";b.dataset.group=group;
    b.setAttribute("aria-pressed",group===active);
    b.addEventListener("click",() => {
      active=group;
      for(const n of filters.children)n.setAttribute("aria-pressed",n.dataset.group===active);
      render();
    });
    filters.append(b);
  }
  function rnd(seed){
    let a=2166136261;
    for(let i=0;i<seed.length;i++) a=Math.imul(a^seed.charCodeAt(i),16777619);
    return () => { a+=0x6D2B79F5; let k=a; k=Math.imul(k^k>>>15,k|1); k^=k+Math.imul(k^k>>>7,k|61); return ((k^k>>>14)>>>0)/4294967296; };
  }
  function preview(x){
    const r=rnd(x.id), c=palette[x.group], [night,ink,light]=c;
    const paper="#fff3d1", gold="#ffd086", mint="#a8e7cb", pink="#f3acd3", blue="#a7bbff";
    const s=svg("svg",{viewBox:"0 0 310 125",preserveAspectRatio:"xMidYMid slice","aria-hidden":"true",focusable:"false"});
    const shape=(tag,attrs)=>svg(tag,attrs,s);
    const rect=(x,y,width,height,fill,opacity=1,rx=0)=>shape("rect",{x,y,width,height,fill,opacity,rx});
    const path=(d,color=ink,w=1,opacity=1,fill="none",dash="")=>shape("path",{d,fill,stroke:color,"stroke-width":w,opacity,"stroke-linecap":"round","stroke-linejoin":"round",...(dash?{"stroke-dasharray":dash}:{})});
    const line=(x1,y1,x2,y2,c,w,o)=>path(`M${x1} ${y1}L${x2} ${y2}`,c,w,o);
    const dot=(cx,cy,r,fill=light,opacity=1)=>shape("circle",{cx,cy,r,fill,opacity});
    const ring=(cx,cy,rx,ry=rx,color=ink,opacity=1,angle=0,w=1.3)=>shape("ellipse",{cx,cy,rx,ry,fill:"none",stroke:color,opacity,transform:`rotate(${angle} ${cx} ${cy})`,"stroke-width":w});
    const cross=(cx,cy,h,color=paper,o=1)=>path(`M${cx-h} ${cy}h${2*h}m${-h} ${-h}v${2*h}`,color,1.4,o);
    const text=(value,x,y,size,fill=paper,face="Georgia, serif")=>{
      shape("text",{x,y,fill,"font-size":size,"font-family":face}).textContent=value;
    };
    const grid=(x,y,cols,rows,dx,dy,color=ink,o=.32)=>{
      let d="";
      for(let i=0;i<=cols;i++)d+=`M${x+i*dx} ${y}v${rows*dy}`;
      for(let j=0;j<=rows;j++)d+=`M${x} ${y+j*dy}h${cols*dx}`;
      path(d,color,.8,o);
    };
    const curve=(fn,n=130)=>{
      let d="";
      for(let i=0;i<=n;i++){
        const [a,b]=fn(i/n);
        d+=(i?"L":"M")+a.toFixed(2)+" "+b.toFixed(2);
      }
      return d;
    };
    const box=(x,y,w,h,color=ink,o=1)=>path(`M${x} ${y}h${w}v${h}h${-w}Z`,color,1.25,o);
    const diamond=(x,y,w,h,color)=>path(`M${x} ${y-h}l${w} ${h} ${-w} ${h} ${-w} ${-h}Z`,"none",0,1,color);
    const inflect=(d,color=ink,w=1.4,o=1)=>path(d,color,w,o,"none","3 5");
    const tau=2*Math.PI;
    rect(0,0,310,125,night);
    let dust="";
    for(let row=0;row<8;row++)for(let col=0;col<19;col++)if(r()>.16){
      const a=11+16*col,b=10+15*row;
      dust+=`M${a} ${b}h.1`;
    }
    path(dust,paper,1.25,.27);
    path("M14 23V14H23 M287 14H296V23 M296 102V111H287 M23 111H14V102",paper,1,.38);
    switch(x.id){
      // Science: each plate depicts the actual phenomenon being manipulated.
      case "dark-fringe": {
        const cx=155, cy=62;
        for(let i=-5;i<=5;i++){
          const d=curve(q=>{const y=10+104*q, k=(y-cy)/52;return [cx+i*(15+6*k*k)+i*i*k*.18,y]},36);
          path(d,i===0?paper:i%2?mint:blue,i===0?3.65:5.5,1-Math.abs(i)*.105);
        }
        for(const a of [38,272]){dot(a,62,5.5,gold);ring(a,62,11,11,gold,.6);}
        break;
      }
      case "kepler-loom":
        for(let i=0;i<39;i++){
          const t=i/39*tau;
          line(155+108*Math.cos(t),62+37*Math.sin(t),155+63*Math.cos(t*2),62+22*Math.sin(t*2),i%6===0?gold:blue,1.15,i%6===0?.95:.57);
        }
        ring(155,62,108,37,blue,.56);ring(155,62,63,22,ink,.47);
        dot(155,62,5,gold);dot(262,58,6,paper);dot(105,75,5.5,pink);
        break;
      case "velvet-chaos": {
        let a=.1,b=0,z=0,d="";
        for(let i=0;i<2200;i++){
          const step=.008,dx=10*(b-a),dy=a*(28-z)-b,dz=a*b-8*z/3;
          a+=step*dx;b+=step*dy;z+=step*dz;
          if(i>=400&&i%2===0)d+=(d?"L":"M")+(155+a*5.3+b*.95).toFixed(1)+" "+(109-z*2).toFixed(1);
        }
        path(d,pink,1.05,.72);line(39,104,271,104,blue,.9,.35);
        break;
      }
      case "julia-atlas": {
        const cols=127, rows=53, dx=2.08, dy=1.85, cells=[[],[],[],[]];
        for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
          let a=(i-(cols-1)/2)*.026,b=(j-(rows-1)/2)*.038,n=0;
          while(n<39&&a*a+b*b<4){[a,b]=[a*a-b*b-.745,2*a*b+.113];n++;}
          if(n>=9){const k=n>=39?3:n>=23?2:n>=14?1:0;cells[k].push(`M${(24+i*dx).toFixed(1)} ${(14+j*dy).toFixed(1)}h2.12`);}
        }
        cells.forEach((bins,i)=>path(bins.join(""),[blue,pink,gold,paper][i],1.65,[.32,.64,.87,.98][i]));
        break;
      }
      case "thermal-ink":
        grid(31,14,18,7,14,14,blue,.33);
        for(const [cx,cy,a] of [[101,67,-20],[206,43,18]]){
          for(let j=6;j>=0;j--)ring(cx,cy,9+j*8,6+j*5,[paper,gold,gold,pink,pink,blue,blue][j],.95-.09*j,a,2);
          dot(cx,cy,3.3,paper);
        }
        path("M156 21v67h46",paper,4,.95);
        break;
      case "fourier-draw":
        ring(99,62,38,38,blue,.63);ring(130,43,24,24,mint,.78);ring(148,58,12,12,gold,.92);
        path("M99 62L130 43L148 58L157 65",paper,2.2);
        for(const [a,b] of [[99,62],[130,43],[148,58],[157,65]])dot(a,b,2.4,paper);
        path("M207 96L216 68 189 47 222 47 234 21 246 47 279 47 252 68 262 96 234 79Z",gold,2.5);
        inflect("M157 65h43",blue,1,.9);
        break;
      case "spin-weather":
        for(let j=0;j<8;j++)for(let i=0;i<24;i++){
          const a=31+i*10.7,b=22+j*11.3,k=Math.sin(i*.48+j*.56)+.65*Math.cos(j*1.16-i*.18)+(r()-.5)*1.15;
          rect(a-3.9,b-3.7,7.8,7.4,k>0?mint:pink,k>0?.9:.68,1.3);
          if(k>0)line(a,b+2,a,b-2,night,1.25,.9);else line(a-2,b,a+2,b,night,1.25,.8);
        }
        break;
      case "crystal-diffraction":
        for(let j=0;j<7;j++)for(let i=0;i<7;i++)dot(34+i*12+j*3.5,24+j*12,2.1,i===3?paper:blue,.85);
        line(155,19,155,106,blue,1,.35);path("M141 62h28m-6-6 6 6-6 6",paper,1.65,.9);
        for(let j=-3;j<=3;j++)for(let i=-3;i<=3;i++){
          const dist=Math.hypot(i,j),a=235+13*i-2.8*j,b=62+13*j;
          if(dist>4)continue;
          dot(a,b,Math.max(1,5.25-dist),i===0&&j===0?paper:mint,1-dist*.14);
        }
        break;
      case "einstein-glass":
        for(let j=0;j<7;j++)ring(156,62,24+j*6,16+j*4,blue,.7-.074*j,-10,1.15);
        dot(156,62,13,"#161a3a");cross(156,62,8,gold,.77);
        path("M123 66a35 23 -10 0 1 55-24 M188 62a35 23 -10 0 1-52 18",gold,4.9,.96);
        inflect("M36 62h67 M208 62h66",blue,1,.85);dot(62,62,5,paper);dot(238,62,3.5,paper,.9);
        break;
      case "voronoi-commons": {
        const sites=[[27,39],[59,91],[82,31],[121,63],[153,24],[151,94],[187,61],[220,25],[224,94],[274,46],[281,87]];
        sites.forEach(([a,b],idx)=>{
          let cell=[[22,17],[289,17],[289,108],[22,108]];
          for(const [u,v] of sites){
            if(u===a&&v===b)continue;
            const f=([px,py])=>(px-(a+u)/2)*(u-a)+(py-(b+v)/2)*(v-b),next=[];
            for(let i=0;i<cell.length;i++){
              const start=cell[i],end=cell[(i+1)%cell.length],m=f(start),n=f(end);
              if(m<=0)next.push(start);
              if((m<=0)!==(n<=0)){const t=m/(m-n);next.push(start.map((p,k)=>p+(end[k]-p)*t));}
            }
            cell=next;
          }
          const d=cell.map((p,i)=>(i?"L":"M")+p.map(v=>v.toFixed(1)).join(" ")).join("")+"Z";
          path(d,idx%3?mint:blue,1.45,.85,idx%3?"#314660":"#43457a");dot(a,b,2.7,idx%3?mint:gold);
        });
        break;
      }
      // Creative: type, paper, pigment, and sound get their own visual grammars.
      case "pattern-loom":
        for(let y=0;y<7;y++)for(let i=0;i<18;i++){
          const a=31+i*14,b=15+y*14,swap=((i+2*y)%5)<2,col=[gold,pink,mint][Math.floor(i/3)%3];
          rect(a,b,14,14,i%2?"#4f2b55":"#3e2249",1);
          rect(a,b+4,14,6,y%3===0?paper:blue,.78,1);
          if(swap){rect(a+3,b,8,14,col,1,1);line(a+5,b+1,a+5,b+13,paper,.8,.57);}
          else{rect(a+3,b,8,4,col,1);rect(a+3,b+10,8,4,col,1);}
        }
        break;
      case "ink-harmonograph":
        for(let i=0;i<12;i++){
          path(curve(q=>{const t=q*23,scale=1-.48*q;return [153+107*scale*Math.sin(3.03*t+i*.035),62+46*scale*Math.sin(2*t+.72+i*.022)];},290),i%4===0?gold:pink,i%4===0?1.3:.75,i%4===0?.86:.49);
        }
        break;
      case "palette-choir": {
        const colors=["#ba6ea3",pink,gold,mint,blue];
        colors.forEach((color,i)=>rect(31+i*50,26,49,74,color,1));
        colors.forEach((_,i)=>line(56+50*i,31,56+50*i,92,night,.9,.24));
        path(curve(q=>[31+249*q,63+22*Math.sin(Math.PI*q)*(.7*Math.sin(31*q)+.3*Math.sin(57*q))],150),night,3.1);
        [56,106,156,206,256].forEach((a,i)=>dot(a,63+22*Math.sin(Math.PI*(a-31)/249)*(.7*Math.sin(31*(a-31)/249)+.3*Math.sin(57*(a-31)/249)),3.5,i%2?paper:night));
        break;
      }
      case "pocket-stepper": {
        const hits=[[0,4,8,11],[2,6,10],[0,2,4,6,8,10],[1,4,7,11]];
        rect(125,12,20,101,ink,.19,1);
        hits.forEach((row,j)=>{
          rect(30,24+j*21,9,9,[gold,pink,mint,blue][j],.9,4);
          for(let i=0;i<12;i++)rect(49+i*19,20+j*21,15,15,row.includes(i)?[gold,pink,mint,blue][j]:"#805176",row.includes(i)?1:.46,2);
        });
        break;
      }
      case "weather-stage":
        rect(23,15,264,94,"#654276");dot(213,45,24,gold);dot(226,18,2.3,paper);
        path("M23 85L61 54 79 64 112 33 147 61 176 50 218 80 255 54 287 73V109H23Z","none",0,1,"#7971aa");
        path("M23 94L43 78 72 86 109 70 137 89 164 79 197 94 219 78 245 86 287 70V109H23Z","none",0,1,"#4a557f");
        path("M164 86l6-37h11l5 37zM168 49l7-7 8 7z","none",0,1,paper);
        path("M183 50L230 47l2 9-49-3Z","none",0,.78,gold);
        path("M23 99Q61 87 103 100T187 99 287 96V109H23Z","none",0,1,mint);
        break;
      case "story-casting-room":
        for(let i=0;i<4;i++){
          const a=36+i*62,b=[24,17,26,20][i],color=[gold,pink,mint,blue][i];
          rect(a,b,53,78,color,1,3);box(a+5,b+5,43,68,night,.38);
          if(i===0){dot(a+26,b+31,8,night);path(`M${a+14} ${b+48}q12-14 24 0Z`,"none",0,1,night);}
          if(i===1)path(`M${a+11} ${b+47}l10-19 7 9 6-12 9 22Z`,"none",0,1,night);
          if(i===2)path(`M${a+27} ${b+20}l-8 16h9l-3 14 12-19h-10Z`,"none",0,1,night);
          if(i===3){ring(a+26,b+35,13,13,night,1,0,2);line(a+17,b+44,a+35,b+26,night,2);}
          line(a+15,b+61,a+38,b+61,night,1.6,.67);
        }
        break;
      case "riso-press":
        rect(64,16,184,94,paper);box(68,20,176,86,night,.35);
        for(let j=0;j<12;j++)for(let i=0;i<23;i++){
          const a=75+7.1*i,b=23+7.2*j, d1=Math.hypot((a-144)/1.55,b-60),d2=Math.hypot((a-165)/1.55,b-66);
          if(d1<35)dot(a,b,2.2+(35-d1)*.031,"#d45786",.91);
          if(d2<32)dot(a+1.7,b+1.5,2+(32-d2)*.031,"#554893",.75);
        }
        cross(50,25,6,pink);cross(265,98,6,gold);
        break;
      case "type-specimen":
        rect(47,16,216,92,paper);line(61,89,249,89,"#a36686",1,.65);
        text("Aa",71,84,77,night);line(178,29,178,96,"#a36686",1,.7);
        text("Ag",190,50,23,"#84255e");text("Mm",190,78,19,"#533264");
        for(let i=0;i<4;i++)line(193+i*11,93,193+i*11,100,"#a36686",1.2,.82);
        break;
      case "erasure-desk": {
        rect(43,15,224,96,paper);
        const phrase=["leave","a","window","for","the","rain"],at=[2,0,2,1,3,2];
        for(let j=0;j<6;j++){
          const segments=at[j],b=28+j*13,a=58+j*4;
          for(let i=0;i<segments;i++)rect(a+i*17,b,14,7,night,.93,1);
          const p=a+17*segments;
          text(phrase[j],p,b+7,12,"#712c61");line(p,b+9,p+phrase[j].length*5.5,b+9,"#bf6292",1,.6);
          const start=p+phrase[j].length*6+9;
          for(let u=start;u<246;){const w=Math.min(247-u,8+r()*15);rect(u,b,w,7,night,.93,1);u+=w+3;}
        }
        break;
      }
      case "motion-flipbook":
        rect(27,23,256,77,"#432547");box(27,23,256,77,pink,.75);
        for(let i=0;i<4;i++){
          const a=59+i*64,b=[67,52,46,65][i],bend=[0,-14,15,5][i],col=[gold,pink,mint,blue][i];
          if(i)line(a-32,23,a-32,100,pink,1,.62);
          line(a-20,88,a+20,88,col,.9,.5);dot(a,b-13,6.6,col);
          path(`M${a} ${b-5}l${bend/3} 14m${-bend/3} -14l${-10+bend/3} ${8+bend/3}m${10-bend/3} ${-8-bend/3}l${10+bend/3} ${7-bend/3}M${a+bend/3} ${b+9}l-9 12m9-12 9 12`,col,3.4,.97);
        }
        break;
      // Games: picture the player's choice rather than a generic arcade grid.
      case "beacon-switchboard":
        for(let j=0;j<5;j++)for(let i=0;i<7;i++){
          const a=91+i*21,b=21+j*21,lit=Math.abs(i-3)+Math.abs(j-2)===1||i===3&&j===2||i===0&&j<2||i===6&&j===4;
          rect(a-8,b-8,16,16,lit?gold:"#6a435c",1,2);
          if(lit){dot(a,b,3.5,night);cross(a,b,5.3,night);}
        }
        inflect("M39 62h39 M232 62h39",gold,1.25,.8);
        break;
      case "warehouse-night-shift":
        grid(69,17,9,5,19,18,light,.65);
        for(const [i,j] of [[0,0],[0,1],[0,2],[1,0],[2,0],[2,2],[2,3],[6,1],[6,2],[7,4],[8,4],[8,3],[8,2]])rect(70+i*19,18+j*18,17,16,"#875b72",.85);
        for(const [i,j] of [[4,1],[5,2]]){
          const a=70+i*19,b=18+j*18;rect(a+1,b+1,15,14,gold,1,1);path(`M${a+4} ${b+4}l9 8m0-8-9 8`,night,1.45,.95);
        }
        diamond(117,80,7,7,blue);ring(230,45,5.8,5.8,mint,1);ring(211,81,5.8,5.8,mint,1);
        inflect("M122 80H151Q167 80 167 64V58H215",blue,1.3,.8);
        break;
      case "one-more-matchstick":
        [3,4,2,6].forEach((count,j)=>{
          for(let i=0;i<count;i++){const a=37+j*73+i*7,b=36+(i%3)*4;
            line(a,b,a+3,95,gold,4,.96);dot(a,b,4,i===count-1?pink:paper);
          }
          line(31+j*73,104,72+j*73,104,ink,1,.5);
        });
        break;
      case "harbor-dispatch":
        for(let j=0;j<6;j++)path(curve(q=>[27+256*q,25+j*15+4*Math.sin(q*16+j*.89)],65),blue,1.1,.38);
        path("M25 23h31v16h33v24H73v31H25Z","none",0,1,"#855973");
        path("M232 28l21-10 24 12-10 15-27 2Z M240 77l26-19 22 9v31l-33 7Z","none",0,1,"#80566a");
        inflect("M83 56Q166 13 238 36 M72 78Q149 98 244 82 M89 64Q157 35 248 85",mint,1.5,.85);
        path("M129 55h42l-9 10h-26Z M143 55v-8h15v8Z","none",0,1,gold);
        path("M173 77h41l-7 9h-26Z M189 77v-7h13v7Z","none",0,1,pink);
        break;
      case "memory-of-moons": {
        const cards=[[50,31],[103,24],[157,34],[211,24]], marks=[0,1,0,2];
        cards.forEach(([a,b],i)=>{
          const col=i===1?gold:i===3?blue:mint;
          rect(a,b,47,67,"#68445d",1,4);box(a+4,b+4,39,59,col,.8);
          if(marks[i]===0){dot(a+23,b+31,11,col);dot(a+28,b+27,9,"#68445d");}
          if(marks[i]===1){dot(a+23,b+32,7,col);ring(a+23,b+32,15,5,col,.95,-20,1.65);}
          if(marks[i]===2){diamond(a+23,b+32,11,13,col);cross(a+23,b+32,5,night);}
        });
        break;
      }
      case "canal-city": {
        grid(37,16,13,5,18,18,pink,.41);
        const canal="M165 8V44H183V81H165V110";
        path(canal,blue,14,.95);path(canal,paper,1,.73,"none","2 5");
        for(const [i,j] of [[0,1],[1,1],[1,3],[3,2],[5,1],[5,3],[9,1],[10,3],[12,3]]){
          const a=46+i*18,b=25+j*18;
          path(`M${a-7} ${b}l7-7 7 7h-2v6h-10v-6Z`,"none",0,1,gold);
        }
        for(const [i,j] of [[1,0],[3,1],[4,4],[8,1],[8,2],[10,1],[11,1],[12,2]])dot(46+i*18,25+j*18,5.5,mint,.96);
        for(const [i,j] of [[0,3],[4,2],[8,4],[10,2],[11,4]])diamond(46+i*18,25+j*18,6,6,pink);
        break;
      }
      case "clockwork-pendulum-golf":
        path("M25 96H284",pink,1.4,.68);
        rect(231,93,35,6,gold,1,2);
        const flight=q=>[49+200*q,91-65*Math.sin(Math.PI*q)];
        inflect(curve(flight,52),gold,2.3,.95);
        for(const t of [.05,.27,.49,.71,.91]){const [a,b]=flight(t);dot(a,b,t===.49?6:2.8,paper);}
        path("M251 93V53l21 7-21 8",mint,2.15,.92);
        break;
      case "moth-mosaic": {
        const wings=[["M155 53Q132 18 88 24Q64 30 96 55Q112 68 151 69Z",gold],["M155 53Q178 18 222 24Q246 30 214 55Q198 68 159 69Z",gold],
          ["M151 65Q114 53 92 76Q96 100 125 98Q138 93 155 78Z",pink],["M159 65Q196 53 218 76Q214 100 185 98Q172 93 155 78Z",pink]];
        for(const [d,col] of wings)path(d,"none",0,.92,col);
        path("M155 50L142 31M155 50l13-19M155 54v25",paper,3.9);
        for(const [a,b] of [[107,42],[203,42],[116,80],[194,80]]){ring(a,b,9,7,night,.85,0,2.25);dot(a,b,3,night);}
        grid(76,19,6,3,26,29,night,.91);box(76,19,156,87,paper,.61);
        rect(206,77,26,29,night,.98);
        break;
      }
      case "rail-junction":
        grid(49,18,7,3,30,30,pink,.62);
        for(const d of ["M49 63h45q15 0 15-15v-3q0-12 15-12h15q15 0 15 15v16q0 13 15 13h15q15 0 15-14h60",
                        "M64 18v15q0 15 15 15h15","M97 108q12-5 12-16t18-14h12","M189 18v16q0 13 18 13h21","M229 108V93q0-14 13-14h17"]){
          path(d,mint,5.6,.93);path(d,night,1.1,.83);
        }
        rect(41,56,16,14,gold,1,2);rect(252,56,16,14,blue,1,2);
        break;
      case "lunar-lemonade":
        dot(72,47,24,gold);dot(80,42,20,night);cross(45,72,5,pink);cross(238,27,4,paper);
        path("M126 48h55l-6 49h-42Z",paper,2.6,.94);
        path("M131 65h45l-4 28h-36Z","none",0,1,gold);path("M154 73l16-46 15-5",pink,3.1);
        dot(176,48,13,gold);ring(176,48,9,9,night,.8);line(167,48,185,48,night,1,.8);
        for(let i=0;i<5;i++)rect(217+i*9,88-i*6,5,7+i*6,mint,.72,1);
        break;
      // Systems: queues, memory and failure modes as compact circuit diagrams.
      case "packet-switch":
        path("M44 62H135 M172 62h36V30h59 M172 62h95 M172 62h36v32h59",mint,2,.66);
        rect(136,43,36,38,ink,1,3);path("M144 62h20m-5-5 5 5-5 5",night,2.4);
        [30,62,94].forEach((b,j)=>{for(let i=0;i<4;i++)rect(221+i*15,b-6,10,12,i<3-j?[mint,pink,gold][j]:"#573f60",1,1);});
        for(let i=0;i<5;i++)rect(43+i*15,56,9,12,i===2?gold:mint,1,1);
        break;
      case "cpu-scheduler":
        grid(54,24,12,3,19,25,ink,.31);
        [[4,3,2,3],[2,2,1,3,1,3],[1,4,2,3,2]].forEach((row,j)=>{
          let a=54;row.forEach((n,i)=>{rect(a+1,27+j*25,n*19-2,19,[mint,pink,gold,blue][(i+j)%4],.95,1);a+=n*19;});
          line(29,36+j*25,44,36+j*25,ink,2,.8);
        });
        line(188,18,188,105,paper,1.3,.85);
        break;
      case "bloom-filter":
        for(let i=0;i<12;i++)rect(33+i*20.5,77,17,19,[0,2,3,5,7,10,11].includes(i)?mint:"#503959",1,2);
        for(const pair of [[79,0,2],[152,3,7],[227,5,10]]) {
          const [a,i,j]=pair;dot(a,31,8,pink);cross(a,31,4,night);
          for(const k of [i,j])path(`M${a} 39Q${a} 56 ${41.5+k*20.5} 76`,pink,1.65,.75);
        }
        break;
      case "raft-election": {
        const pts=[[62,55],[111,32],[111,89],[214,34],[240,87]];
        [[0,1],[0,2],[1,2],[3,4]].forEach(([i,j])=>line(...pts[i],...pts[j],mint,2.3,.6));
        inflect("M166 17v91",pink,2.2,.8);
        pts.forEach(([a,b],i)=>{dot(a,b,11,i===0?gold:i<3?mint:"#73516e");ring(a,b,14,14,i===0?gold:i<3?mint:pink,.63);});
        path("M55 56l5 5 8-9",night,2.2);
        break;
      }
      case "load-balancer":
        path("M43 62h71 M145 62h35V29h88 M145 62h123 M145 62h35v33h88",mint,2,.48);
        diamond(129,62,17,17,gold);
        for(let j=0;j<3;j++){
          const b=29+j*33;
          rect(250,b-10,28,20,ink,.9,2);
          for(let i=0;i<4-j;i++)rect(190+i*12,b-4,8,8,j===0?pink:mint,.97,1);
        }
        [48,68,88].forEach(a=>dot(a,62,4,paper,.86));
        break;
      case "cache-replacement":
        for(let i=0;i<12;i++)rect(42+i*19,19,14,14,[pink,ink,blue,gold][[0,1,2,0,3,2,0,3,1,3,2,0][i]],.93,2);
        for(let i=0;i<4;i++){rect(63+i*47,71,37,27,[pink,ink,blue,gold][i],.9,2);box(68+i*47,76,27,17,night,.55);}
        [0,3,5,7,9,11].forEach((i,j)=>path(`M${49+i*19} 35Q${49+i*19} 55 ${81+[0,0,2,3,3,0][j]*47} 70`,j%2?mint:pink,1.4,.67));
        break;
      case "bplus-index": {
        const bands=[[[155,23]],[[96,51],[217,51]],[[58,86],[108,86],[204,86],[254,86]]];
        for(let j=0;j<2;j++)bands[j+1].forEach(([a,b],i)=>line(...bands[j][i>>1],a,b,ink,1.65,.64));
        inflect("M58 86h196",pink,1.7,.9);
        bands.forEach((nodes,j)=>nodes.forEach(([a,b],i)=>{
          rect(a-16,b-7,32,14,j===2&&i>0&&i<3?gold:ink,1,1);
          for(let k=1;k<3;k++)line(a-16+k*10,b-7,a-16+k*10,b+7,night,1.15,.8);
        }));
        break;
      }
      case "xor-shards":
        [45,93,141,189,237].forEach((a,i)=>{
          const col=i===4?gold:i===2?pink:mint;
          if(i===2)path(`M${a} 32h28v61h-28Z`,col,1.85,.94,"none","4 4");
          else rect(a,32,28,61,col,.84,2);
          for(let j=0;j<5;j++)if(i===2||r()>.2)line(a+6,42+j*10,a+22,42+j*10,i===2?pink:night,2,i===2?.32:.82);
          if(i<4)cross(a+38,63,3,paper,.74);
        });
        break;
      case "heap-allocator":
        [[48,34,true],[82,18,false],[100,44,true],[144,12,false],[156,51,true],[207,24,false],[231,31,true]].forEach(([a,w,filled],i)=>{
          rect(a,40,w-2,45,filled?[gold,mint,pink,blue][(i/2)|0]:"#47304e",.94,1);
          if(!filled)for(let b=a+4;b<a+w-2;b+=5)line(b,46,b,79,ink,.7,.42);
        });
        path("M48 32v-6h214v6 M83 91v7H99v-7 M145 91v7h11v-7 M208 91v7h22v-7",ink,1.4,.63);
        break;
      case "write-ahead-log":
        for(let i=0;i<8;i++){
          const a=37+i*29;rect(a,36,26,48,i<5?mint:"#53395a",i<5?.94:.9,1);
          for(let j=0;j<3;j++)line(a+5,46+j*8,a+19-(j%2)*4,46+j*8,i<5?night:pink,1.4,.83);
          if(i<5)path(`M${a+7} 75l4 4 7-8`,night,1.5,.9);
        }
        path("M184 15l-11 19h9l-7 21 19-25h-10l8-15Z","none",0,1,gold);
        inflect("M184 84v23",pink,1.6,.95);
        break;
      // Algorithms: specimen views of the search, match, arrangement, or proof.
      case "astar-expedition": {
        grid(37,17,16,6,15,15,ink,.32);
        for(let i=0;i<33;i++){const a=40+15*Math.floor(r()*16),b=20+15*Math.floor(r()*6);rect(a,b,10,10,"#71547b",.95,1);}
        for(let i=0;i<9;i++){const a=54+15*i,b=52-15*Math.floor(Math.sin(i*.65)*1.7);rect(a,b,12,12,blue,.27,1);}
        path("M45 85h30v-15h45V55h30V40h45v15h30V40h45",gold,3.7,.96);
        dot(45,85,4.5,mint);diamond(270,40,6,6,pink);
        break;
      }
      case "stable-constellations": {
        const a=[30,52,74,97], b=[1,3,0,2];
        a.forEach((dy,i)=>{path(`M50 ${dy}C121 ${dy} 189 ${a[b[i]]} 259 ${a[b[i]]}`,[gold,pink,mint,blue][i],2.4,.88);});
        a.forEach((dy,i)=>{dot(50,dy,5.5,[gold,pink,mint,blue][i]);dot(259,dy,5.5,[mint,gold,blue,pink][i]);});
        break;
      }
      case "expedition-knapsack":
        box(50,21,207,82,ink,.85);
        [[51,22,66,80,pink],[118,22,47,41,gold],[166,22,45,41,mint],[118,64,93,38,blue],[212,22,44,80,gold]].forEach(([a,b,w,h,c],i)=>{
          rect(a+2,b+2,w-4,h-4,c,.84,2);box(a+7,b+7,w-14,h-14,night,.58);
          for(let j=0;j<i%3+1;j++)dot(a+w*.5+(j-(i%3)/2)*9,b+h*.52,2.5,night,.85);
        });
        break;
      case "sort-the-spectrum":
        [29,65,17,44,52,31,72,37,19,54,72,63,57,51,45,38,31,25,19,13].forEach((h,i)=>{
          if(i>=10)h=85-(i-10)*7.7;
          rect(32+i*12.4,102-h,8,h,[pink,pink,blue,mint,mint,gold,pink,pink,blue,mint,gold,gold,gold,gold,mint,mint,mint,blue,blue,blue][i],.9,1);
        });
        line(29,103,281,103,ink,1,.5);line(154,18,154,104,ink,.8,.35);
        break;
      case "graph-color-outfit": {
        const p=[[44,67],[80,30],[98,93],[132,54],[172,34],[175,86],[225,70],[267,34],[274,91]];
        [[0,1],[0,2],[1,2],[1,3],[2,3],[3,4],[3,5],[4,5],[4,6],[4,7],[5,6],[5,8],[6,7],[6,8],[7,8]].forEach(([i,j])=>line(...p[i],...p[j],ink,1.5,.7));
        p.forEach(([a,b],i)=>{const c=[gold,mint,pink,gold,mint,pink,gold,pink,mint][i];dot(a,b,6,c);ring(a,b,10,10,c,.57)});
        break;
      }
      case "huffman-type-foundry": {
        const p=[[155,20],[109,43],[202,43],[73,65],[128,66],[181,65],[231,65],[49,93],[89,93],[167,93],[199,93]];
        [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6],[3,7],[3,8],[5,9],[5,10]].forEach(([i,j])=>line(...p[i],...p[j],j%2?mint:pink,1.65,.76));
        p.forEach(([a,b],i)=>{const label={4:"A",6:"E",7:"R",8:"M",9:"O",10:"N"}[i];if(label){rect(a-8,b-8,16,17,i%2?mint:gold,1,2);text(label,a-4.5,b+5,13,night);}else dot(a,b,3.5,paper);});
        break;
      }
      case "sequence-tailor":
        grid(66,26,14,6,14,12,ink,.38);
        path("M73 32H87V44H101V56H129V68H143V80H185V92H255",gold,2.8,.93);
        for(const [a,b] of [[87,44],[129,68],[185,92]])dot(a,b,4,pink);
        for(let i=0;i<12;i++)text("SEQUENCELINE"[i],69+14*i,21,8,mint,"monospace");
        for(let i=0;i<6;i++)text("ALIGNS"[i],52,36+12*i,9,mint,"monospace");
        break;
      case "river-capacity":
        for(const [d,w,c] of [["M40 62h41L129 32h55l43 30h42",8,mint],["M81 62l46 28h57l43-28",5,blue],["M129 32l55 58",2.5,pink],["M129 32q28 56 55 0",3.3,gold]])path(d,c,w,.9);
        for(const [a,b] of [[40,62],[81,62],[129,32],[127,90],[184,32],[184,90],[227,62],[269,62]])dot(a,b,5.7,a===40||a===269?gold:paper);
        break;
      case "perceptron-plot":
        grid(35,17,16,6,15,15,ink,.26);
        for(let i=0;i<51;i++){
          const a=46+r()*218,b=22+r()*80,side=b-95+(a-46)*.295;
          if(Math.abs(side)<8&&r()>.3)continue;
          if(side>0)diamond(a,b,3.2,3.2,pink);else dot(a,b,2.65,mint,.92);
        }
        line(43,99,270,32,gold,2.7,.96);inflect("M46 88 259 21",gold,1,.39);
        break;
      case "signal-grid":
        path("M130 20v19h14v18h14v18h14v17h14v16",mint,3,.93);
        for(let j=0;j<6;j++)for(let i=0;i<17;i++){
          const a=39+i*14,b=19+j*17.4,connected=(i-6===Math.max(0,j-1)||i-7===j&&j<5);
          if(connected||r()>.47)rect(a,b,12,13,connected?mint:i%5?blue:pink,connected?.97:.55,1);
        }
        break;
      default:
        for(let i=0;i<9;i++)ring(155,62,32+i*8,13+i*2,i%3?ink:gold,.67,-20+i*5,1.2);
        dot(155,62,9,light);
    }
    return s;
  }
  function render() {
    const q=search.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    const matches=list.filter(x=>(active==="All"||x.group===active) && q.every(t=>[x.title,x.summary,x.tag,x.group].join(" ").toLocaleLowerCase().includes(t)));
    $("result-count").textContent=matches.length +(matches.length===1?" experiment":" experiments");
    cards.replaceChildren();
    if(!matches.length){ cards.append(make("p","empty","Nothing matches. Try another word or choose All."));return; }
    const grid=document.createDocumentFragment();
    for(const d of matches){
      const card=make("article","card"), art=make("div","card-media"),body=make("div","card-body"),title=make("h3"), go=make("button","",d.title);
      art.append(preview(d)); go.dataset.demo=d.id;go.type="button";go.addEventListener("click",()=>openDemo(d,go));
      title.append(go);body.append(make("div","card-meta",d.group+" / "+d.tag),title,make("p","",d.summary));
      card.append(art,body);grid.append(card);
    }
    cards.append(grid);
  }
  function clearDemo(){
    if(typeof cleanup==="function"){
      try{ cleanup(); } catch (e){ console.error("Experiment cleanup failed",e); }
    }
    cleanup=null; target.replaceChildren();
  }
  function openDemo(experiment, launch, changeHash=true) {
    if(!experiment) return;
    if(!dialog.open){origin=launch||document.activeElement;dialog.showModal();}
    clearDemo(); current=experiment;
    $("dialog-kicker").textContent=experiment.group+" / "+experiment.tag;
    $("dialog-title").textContent=experiment.title;
    $("dialog-summary").textContent=experiment.summary;
    $("copy-state").textContent="";
    if(changeHash) history.replaceState(null,"","#"+encodeURIComponent(experiment.id));
    try{cleanup=experiment.mount(target);}catch(e){console.error("Experiment failed",experiment.id,e);target.append(make("p","demo-error","This experiment couldn't start in your browser. Try another bench."));}
    dialog.scrollTop=0;
  }
  function readHash(){try{return decodeURIComponent(location.hash.substring(1));}catch{return "";}}
  $("close").addEventListener("click",()=>dialog.close());
  dialog.addEventListener("close",()=>{
    clearDemo(); current=null;
    if(byId.has(readHash()))history.replaceState(null,"",location.pathname+location.search);
    if(origin && origin.isConnected)origin.focus();origin=null;
  });
  $("surprise").addEventListener("click",e=>openDemo(list[Math.floor(Math.random()*list.length)],e.currentTarget));
  $("next-demo").addEventListener("click",()=>{if(!current)return;openDemo(list[(list.indexOf(current)+1)%list.length]); $("close").focus();});
  $("copy-link").addEventListener("click",async()=>{
    try{await navigator.clipboard.writeText(location.href);$("copy-state").textContent="Copied";}
    catch{$("copy-state").textContent="Copy this experiment’s address from your browser."; }
  });
  search.addEventListener("input",render);render();
  const goFromHash=()=>{const x=byId.get(readHash());if(x&&x!==current)openDemo(x,null,false);};
  window.addEventListener("hashchange",goFromHash);goFromHash();
})();
