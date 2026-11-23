const $=(s,el=document)=>el.querySelector(s);
const $$=(s,el=document)=>[...el.querySelectorAll(s)];

/* fin bars */
(function(){
  const years=['2021','2022','2023','2024','2025','2026E'];
  const pi=[74.82,74.09,75.25,69.00,67.95,69.0];
  const dv=[55.58,58.50,61.43,63.75,66.21,68.9];
  const max=80;
  const box=$('#fin');
  box.innerHTML=years.map((y,i)=>`<div class="yr" title="${y} 基本溢利 ${pi[i].toFixed(2)}E / 股息 ${dv[i].toFixed(2)}E">
    <div class="bars2">
      <div class="b1" style="height:${pi[i]/max*100}%"></div>
      <div class="b2" style="height:${dv[i]/max*100}%"></div>
    </div>
    <div class="lb">${y}</div>
  </div>`).join('');
})();

/* price chart */
const PRICE=[["20250102",15.54],["20250106",15.28],["20250113",15.16],["20250120",15.8],["20250127",15.48],["20250203",15.48],["20250210",15.16],["20250217",15.78],["20250224",15.48],["20250303",15.46],["20250310",16.08],["20250317",16.92],["20250324",17.06],["20250331",17.06],["20250407",15.52],["20250414",15.88],["20250422",16.2],["20250428",16.82],["20250506",16.62],["20250512",16.8],["20250519",16.88],["20250526",17.0],["20250602",17.26],["20250609",18.34],["20250616",18.56],["20250623",18.76],["20250630",19.6],["20250707",19.68],["20250714",19.82],["20250721",20.25],["20250728",20.7],["20250804",20.66],["20250811",21.1],["20250818",20.62],["20250825",20.96],["20250901",21.18],["20250908",21.26],["20250915",22.18],["20250922",22.06],["20250929",21.54],["20251006",21.34],["20251013",21.72],["20251020",21.96],["20251027",21.5],["20251103",21.58],["20251110",22.02],["20251117",22.6],["20251124",22.0],["20251201",21.1],["20251208",21.1],["20251215",21.24],["20251222",21.0],["20251229",20.94],["20260105",20.86],["20260112",22.18],["20260119",22.94],["20260126",23.2],["20260202",23.22],["20260209",25.8],["20260216",25.04],["20260223",26.04],["20260227",27.0],["20260302",26.46],["20260309",24.3],["20260316",24.64],["20260323",23.28],["20260330",23.62],["20260408",24.24],["20260413",24.74],["20260420",25.02],["20260427",24.62],["20260504",25.02],["20260511",25.42],["20260518",23.88],["20260526",23.18],["20260601",22.6],["20260608",21.64],["20260615",21.66],["20260622",20.52],["20260629",20.64],["20260702",20.4],["20260706",21.18],["20260713",21.16],["20260720",22.18],["20260727",23.44],["20260803",23.86],["20260810",24.04],["20260817",24.26],["20260824",25.26],["20260831",23.98],["20260907",24.42],["20260914",24.3],["20260921",24.44],["20260928",24.32],["20261005",23.76],["20261012",24.3],["20261020",24.48],["20261026",24.52],["20261102",25.6],["20261109",26.4],["20261116",25.64],["20261123",25.46]];

﻿(function(){
  const svg=document.getElementById('pc');
  if(!svg) return;
  const tip=document.getElementById('pctip');
  const n=PRICE.length;

  function draw(){
    const mob=window.innerWidth<=820;
    const W=mob?360:780, H=mob?270:320;
    const L=mob?34:48, R=mob?12:18, T=mob?22:26, B=mob?30:38;
    const lo=15, hi=28;
    const X=i=>L+(W-L-R)*i/(n-1);
    const Y=v=>T+(H-T-B)*(hi-v)/(hi-lo);
    svg.setAttribute('viewBox','0 0 '+W+' '+H);

    let g='<defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d4f7d" stop-opacity=".2"/><stop offset="1" stop-color="#1d4f7d" stop-opacity=".01"/></linearGradient></defs>';
    const gl = [16,20,24,28];
    gl.forEach(v=>{
      g+=`<line x1="${L}" y1="${Y(v)}" x2="${W-R}" y2="${Y(v)}" stroke="#edf0f4" stroke-width="1"/>`;
      g+=`<text x="${L-7}" y="${Y(v)+3.5}" text-anchor="end" font-size="${mob?10.5:10}" fill="#7f8a9a" font-family="Georgia,serif">${v}</text>`;
    });

    const pts=PRICE.map((p,i)=>`${X(i).toFixed(1)},${Y(p[1]).toFixed(1)}`);
    g+=`<polygon points="${L},${H-B} ${pts.join(' ')} ${W-R},${H-B}" fill="url(#ag)"/>`;
    g+=`<polyline points="${pts.join(' ')}" fill="none" stroke="#0d2b4a" stroke-width="${mob?2.4:2}" stroke-linejoin="round" stroke-linecap="round"/>`;

    const labels = mob
      ? [["20250102","2025.01"],["20260105","2026.01"],["20261123","11.23"]]
      : [["20250102","2025.01"],["20250707","2025.07"],["20260105","2026.01"],["20260706","2026.07"],["20261123","11.23"]];
    labels.forEach(([d,t],k)=>{
      const i=PRICE.findIndex(p=>p[0]===d); if(i<0)return;
      const anchor = k===labels.length-1 ? 'end' : 'middle';
      g+=`<text x="${X(i)}" y="${H-10}" text-anchor="${anchor}" font-size="${mob?10.5:10}" fill="#7f8a9a" font-family="Georgia,serif">${t}</text>`;
    });

    const marks=[
      {d:"20260227",t:"27.00",s:"52 周高",up:true},
      {d:"20260702",t:"20.40",s:"52 周低",up:false},
      {d:"20261123",t:"25.46",s:"现价",up:true}
    ];
    marks.forEach((m,idx)=>{
      const i=PRICE.findIndex(p=>p[0]===m.d); if(i<0)return;
      const cx=X(i), cy=Y(PRICE[i][1]);
      g+=`<circle cx="${cx}" cy="${cy}" r="${mob?3.4:3.6}" fill="#0d2b4a" stroke="#fff" stroke-width="2"/>`;
      const last = idx===marks.length-1;
      const lx = last ? cx-8 : cx;
      const anchor = last ? 'end' : 'middle';
      const ty = m.up ? cy-11 : cy+18;
      g+=`<text x="${lx}" y="${ty}" text-anchor="${anchor}" font-size="${mob?11:11}" font-weight="700" fill="#0d2b4a" font-family="Georgia,serif">${m.t}</text>`;
      g+=`<text x="${lx}" y="${m.up?ty-11:ty+11}" text-anchor="${anchor}" font-size="${mob?9:9.5}" fill="#7f8a9a">${m.s}</text>`;
    });

    g+=`<line id="cross" x1="0" y1="${T}" x2="0" y2="${H-B}" stroke="#b08a52" stroke-width="1" stroke-dasharray="3 3" opacity="0"/>`;
    g+=`<circle id="hdot" r="4" fill="#b08a52" stroke="#fff" stroke-width="2" opacity="0"/>`;
    g+=`<rect id="hover" x="${L}" y="${T}" width="${W-L-R}" height="${H-T-B}" fill="transparent"/>`;
    svg.innerHTML=g;

    const cross=document.getElementById('cross'), hdot=document.getElementById('hdot');
    const hover=document.getElementById('hover');
    function move(e){
      const r=svg.getBoundingClientRect();
      const box=svg.parentElement.getBoundingClientRect();
      const px=(e.clientX-r.left)/r.width*W;
      let i=Math.round((px-L)/((W-L-R)/(n-1)));
      i=Math.max(0,Math.min(n-1,i));
      const cx=X(i), cy=Y(PRICE[i][1]);
      cross.setAttribute('x1',cx); cross.setAttribute('x2',cx); cross.setAttribute('opacity','.55');
      hdot.setAttribute('cx',cx); hdot.setAttribute('cy',cy); hdot.setAttribute('opacity','1');
      const d=PRICE[i][0];
      tip.innerHTML=`<b>${PRICE[i][1].toFixed(2)}</b><span>${d.slice(0,4)}.${d.slice(4,6)}.${d.slice(6)}</span>`;
      tip.style.display='block';
      tip.style.left=(e.clientX-box.left)+'px';
      tip.style.top=(r.top-box.top+cy/H*r.height)+'px';
    }
    function leave(){cross.setAttribute('opacity','0');hdot.setAttribute('opacity','0');tip.style.display='none';}
    hover.addEventListener('pointermove',move);
    hover.addEventListener('pointerleave',leave);
  }

  draw();
  let t;
  window.addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(draw,180)});
})();


/* toc highlight */
(function(){
  const links=[...document.querySelectorAll('.toc a[href^="#"]')];
  const secs=['brief','outline','valuation'].map(id=>document.getElementById(id)).filter(Boolean);
  if(!secs.length) return;
  const io=new IntersectionObserver(entries=>{
    entries.forEach(en=>{
      if(en.isIntersecting){
        links.forEach(a=>a.classList.toggle('on', a.getAttribute('href')==='#'+en.target.id));
      }
    });
  },{rootMargin:'-25% 0px -65% 0px'});
  secs.forEach(s=>io.observe(s));
  /* keep hash target visible under sticky bars */
  window.addEventListener('load',()=>{
    if(location.hash){
      const el=document.querySelector(location.hash);
      if(el) setTimeout(()=>el.scrollIntoView({behavior:'auto',block:'start'}),60);
    }
  });
})();
