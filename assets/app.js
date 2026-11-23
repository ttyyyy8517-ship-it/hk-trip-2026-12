(function(){
  const T = window.TRIP;
  const $ = (s, el=document)=>el.querySelector(s);
  const $$ = (s, el=document)=>[...el.querySelectorAll(s)];

  /* ---------- map ---------- */
  const map = L.map('map', {
    zoomControl: true,
    scrollWheelZoom: false,
    zoomSnap: 0.5,
    attributionControl: true
  }).setView([22.287, 114.185], 13);

  const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let tileErr = 0;
  osm.on('tileerror', function(){
    if (++tileErr >= 4) {
      map.removeLayer(osm);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16,
        attribution: 'Tiles &copy; Esri'
      }).addTo(map);
    }
  });

  const layer = L.layerGroup().addTo(map);
  const markers = {};
  let current = null;
  let day = 1;

  function pinIcon(s, on){
    return L.divIcon({
      className: '',
      html: `<div class="pin ${s.type}${on ? ' on' : ''}">${s.badge}</div>`,
      iconSize: [28,28], iconAnchor: [14,14]
    });
  }

  T.stops.forEach(s=>{
    const m = L.marker([s.lat, s.lng], {icon: pinIcon(s,false), riseOnHover:true});
    m.on('click', ()=>select(s.id, true));
    markers[s.id] = m;
  });

  function detailHTML(s){
    let actions = '';
    if (s.links) {
      actions = `<div class="sd-actions">
        <a class="btn primary" href="${s.links.brief}">一页纸</a>
        <a class="btn" href="${s.links.outline}">调研提纲</a>
        <a class="btn" href="${s.links.valuation}">股价估值</a>
      </div>`;
    } else if (s.pending) {
      actions = `<div class="sd-actions">
        <button class="btn" data-pending="${s.name}">一页纸</button>
        <button class="btn" data-pending="${s.name}">调研提纲</button>
        <button class="btn" data-pending="${s.name}">股价估值</button>
      </div>`;
    }
    const dayLabel = s.day === 1 ? '12/2 周三' : '12/3 周四';
    return `<div class="sd-time">${dayLabel} ${s.time}${s.end ? '–' + s.end : ''}</div>
      <div class="sd-name">${s.name}${s.code ? `<small>${s.code}</small>` : ''}</div>
      <div class="sd-addr">${s.addr}</div>
      <div class="sd-note">${s.note}</div>${actions}`;
  }

  function select(id, fromMap, noFly){
    const s = T.stops.find(x=>x.id === id);
    if (!s) return;
    const prev = current;
    current = id;
    $('#stopDetail').innerHTML = detailHTML(s);
    $$('#stopList .stop-row').forEach(r=>r.classList.toggle('on', r.dataset.id === id));
    if (prev && markers[prev]) markers[prev].setIcon(pinIcon(T.stops.find(x=>x.id===prev), false));
    if (markers[id]) markers[id].setIcon(pinIcon(s, true));
    if (!noFly) {
      map.flyTo([s.lat, s.lng], fromMap ? 16 : 15.5, {duration: .65});
      if (window.innerWidth <= 960 && fromMap) {
        setTimeout(()=>$('#stopDetail').scrollIntoView({behavior:'smooth', block:'center'}), 260);
      }
    }
    bindPending();
  }

  function renderList(){
    const rows = T.stops.filter(s=>s.day === day).map(s=>`
      <div class="stop-row ${s.type}" data-id="${s.id}">
        <div class="t"><b>${s.time}</b>${s.end || ''}</div>
        <div class="nm">${s.name}<span>${s.sub || s.addr}</span></div>
        <span class="dot"></span>
      </div>`).join('');
    $('#stopList').innerHTML = rows;
    $$('#stopList .stop-row').forEach(r=>r.onclick = ()=>select(r.dataset.id, false));
  }

  function setDay(d, keep){
    day = d;
    $$('#dayToggle button').forEach(b=>b.classList.toggle('on', +b.dataset.day === d));
    layer.clearLayers();
    T.stops.filter(s=>s.day === d).forEach(s=>{
      markers[s.id].setIcon(pinIcon(s, s.id === current));
      markers[s.id].addTo(layer);
    });
    renderList();
    const pts = T.stops.filter(s=>s.day === d).map(s=>[s.lat, s.lng]);
    map.fitBounds(L.latLngBounds(pts), {padding:[44,44], maxZoom: d === 1 ? 13.5 : 14});
    if (!keep) {
      const first = T.stops.find(s=>s.day === d && s.type === 'meet') || T.stops.find(s=>s.day === d);
      select(first ? first.id : T.stops.find(s=>s.day===d).id, false, true);
    } else if (current) {
      select(current, false, true);
    }
  }

  /* ---------- day toggle ---------- */
  $('#dayToggle').innerHTML = T.days.map(d=>`
    <button data-day="${d.id}" class="${d.id===1?'on':''}">
      ${d.label}<small>${d.sub.split(' · ')[0]}</small>
    </button>`).join('');
  $$('#dayToggle button').forEach(b=>b.onclick = ()=>setDay(+b.dataset.day, false));

  /* ---------- hotel ---------- */
  const h = T.hotel;
  $('#hotelPrice').innerHTML = `${h.price}<small>${h.priceNote}</small>`;
  $('#hotelWhy').textContent = h.why;
  $('#hotelDist').innerHTML = h.dist.map(d=>`<div><span>${d[0]}</span><b>${d[1]}</b></div>`).join('');

  /* ---------- flights / rail ---------- */
  $('#flights').innerHTML = T.flights.rows.map(f=>`
    <div class="flight-row">
      <span class="d">${f.dir}<br>${f.date.replace(' 周','')}</span>
      <span class="r">${f.route}<span>${f.sub}</span></span>
      <span class="tm">${f.time}</span>
    </div>`).join('');
  const r = T.rail;
  $('#rail').innerHTML = `
    <div>车程<b>${r.dur}</b></div>
    <div>二等座<b>${r.price}</b></div>
    <div>发车<b>${r.time}</b></div>
    <div>班次<b>${r.freq}</b></div>`;
  $('#railNote').textContent = r.note;

  /* ---------- companies ---------- */
  $('#companyGrid').innerHTML = T.companies.map(c=>`
    <a class="co-card ${c.ready ? '' : 'pending'}" href="${c.ready ? c.href : '#'}" ${c.ready ? '' : `data-pending="${c.name}"`}>
      <span class="state ${c.ready ? '' : 'pending'}">${c.ready ? '已就绪' : '素材待补'}</span>
      <div class="when">${c.when}</div>
      <h3>${c.name}<small>${c.code}</small></h3>
      <p class="line">${c.line}</p>
      <span class="go">${c.ready ? '进入公司页' : '看交流方向'} →</span>
    </a>`).join('');

  /* ---------- modal ---------- */
  const modal = $('#modal');
  function openPending(name){
    const c = T.companies.find(x=>x.name === name || x.name.indexOf(name) === 0);
    const s = T.stops.find(x=>x.name.indexOf(name) === 0);
    const focus = T.pendingFocus[name] || [];
    $('#mTitle').textContent = name;
    $('#mMeta').textContent = `${c ? c.when : ''}${s ? ' · ' + s.addr : ''}`;
    $('#mBody').innerHTML = focus.length
      ? '先把交流方向列在这，素材到了再补一页纸、提纲和估值：<br>' + focus.map(f=>'· '+f).join('<br>')
      : '这家的研报、纪要、模型还没发我，先把时间地点放在这。素材到了按太古同一套补。';
    modal.hidden = false;
  }
  function bindPending(){
    $$('[data-pending]').forEach(el=>{
      el.onclick = (e)=>{ e.preventDefault(); openPending(el.dataset.pending); };
    });
  }
  bindPending();
  modal.addEventListener('click', e=>{
    if (e.target === modal || e.target.closest('[data-close]')) modal.hidden = true;
  });
  document.addEventListener('keydown', e=>{ if (e.key === 'Escape') modal.hidden = true; });

  /* ---------- nav active ---------- */
  const secs = ['map-sec','travel','companies'].map(id=>document.getElementById(id));
  const navLinks = $$('.nav a');
  const io = new IntersectionObserver(entries=>{
    entries.forEach(en=>{
      if (en.isIntersecting) {
        navLinks.forEach(a=>a.classList.toggle('on', a.getAttribute('href') === '#'+en.target.id));
      }
    });
  }, {rootMargin:'-45% 0px -50% 0px'});
  secs.forEach(s=>s && io.observe(s));

  /* ---------- boot ---------- */
  setDay(1, false);
})();
