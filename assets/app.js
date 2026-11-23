(function(){
  const T = window.TRIP;
  const $ = (s, el=document)=>el.querySelector(s);
  const $$ = (s, el=document)=>[...el.querySelectorAll(s)];

  /* ---------- helpers ---------- */
  const dayLabel = d => d === 1 ? "12/2 周三" : "12/3 周四";
  function timeText(s){
    if (!s.end) return s.time;
    return s.time + (/^\d{2}:\d{2}$/.test(s.end) ? "–" + s.end : " " + s.end);
  }

  /* ---------- map ---------- */
  const map = L.map("map", {
    zoomControl: true,
    scrollWheelZoom: false,
    zoomSnap: 0.5,
    attributionControl: true
  }).setView([22.287, 114.185], 13);

  const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19, attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  let tileErr = 0;
  osm.on("tileerror", function(){
    if (++tileErr >= 4) {
      map.removeLayer(osm);
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 16, attribution: "Tiles &copy; Esri"
      }).addTo(map);
    }
  });

  const layer = L.layerGroup().addTo(map);
  const markers = {};
  let currentDay = 1;

  function pinIcon(s){
    const cls = s.type === "lunch" ? "lunch" : (s.type === "hotel" ? "hotel" : (s.type === "arrive" ? "arrive" : ("d" + s.day)));
    return L.divIcon({
      className: "",
      html: `<div class="pin ${cls}">${s.badge}</div>`,
      iconSize: [30, 30], iconAnchor: [15, 15]
    });
  }

  function popupHTML(s){
    return `<div class="mp">
      <div class="mp-time">${dayLabel(s.day)} ${timeText(s)}</div>
      <div class="mp-name">${s.name}${s.code ? `<em>${s.code}</em>` : ""}</div>
      <div class="mp-addr">${s.addr}</div>
      ${s.co ? `<button class="mp-btn" data-open-co="${s.co}">查看公司资料 →</button>` : ""}
    </div>`;
  }

  T.stops.filter(s => s.map !== false).forEach(s=>{
    const m = L.marker([s.lat, s.lng], {icon: pinIcon(s), riseOnHover: true});
    m.bindPopup(popupHTML(s), {maxWidth: 300, className: "co-popup", offset: [0, -4]});
    markers[s.id] = m;
  });

  function bindTips(){
    Object.values(markers).forEach(m => m.unbindTooltip());
    T.stops.filter(s => s.map !== false).forEach(s=>{
      if (s.day !== currentDay && s.type !== "hotel") return;
      const label = s.type === "hotel" ? "住 · 维港凯悦尚萃" : `${s.time} ${s.name}`;
      markers[s.id].bindTooltip(label, {
        permanent: true, direction: "top", className: "map-tip", offset: [0, -12], opacity: 1
      });
    });
  }

  function setDay(d, keep){
    currentDay = d;
    $$("#mapDay button").forEach(b=>b.classList.toggle("on", +b.dataset.day === d));
    layer.clearLayers();
    map.closePopup();
    T.stops.filter(s => s.map !== false && s.day === d).forEach(s=>{
      markers[s.id].setIcon(pinIcon(s));
      markers[s.id].addTo(layer);
    });
    const pts = T.stops.filter(s => s.map !== false && s.day === d).map(s=>[s.lat, s.lng]);
    if (pts.length) map.fitBounds(L.latLngBounds(pts), {padding: [50, 50], maxZoom: d === 1 ? 13.5 : 14});
    bindTips();
  }

  function focusStop(id){
    const s = T.stops.find(x=>x.id === id);
    if (!s) return;
    if (s.day !== currentDay) setDay(s.day, true);
    const m = markers[id];
    if (!m) return;
    if (window.innerWidth <= 960) {
      $("#map").scrollIntoView({behavior: "smooth", block: "center"});
      setTimeout(()=>{ map.flyTo([s.lat, s.lng], 15.5, {duration: .5}); m.openPopup(); }, 380);
    } else {
      map.flyTo([s.lat, s.lng], 15.5, {duration: .6});
      setTimeout(()=>m.openPopup(), 420);
    }
    $$(".tl-row").forEach(r=>r.classList.toggle("on", r.dataset.id === id));
  }

  /* ---------- day toggle ---------- */
  $("#mapDay").innerHTML = T.days.map(d=>`
    <button data-day="${d.id}" class="${d.id === 1 ? "on" : ""}">${d.label}<small>${d.sub.split(" · ")[0]}</small></button>
  `).join("");
  $$("#mapDay button").forEach(b=>b.onclick = ()=>setDay(+b.dataset.day, false));

  /* ---------- timeline ---------- */
  $("#timeline").innerHTML = T.days.map(d=>{
    const rows = T.stops.filter(s=>s.day === d.id).map((s, i)=>`
      <div class="tl-row ${s.type}" data-id="${s.id}">
        <span class="tl-no ${s.type === "lunch" ? "lunch" : ("d" + d.id)}">${i + 1}</span>
        <span class="tl-time">${s.time}</span>
        <span class="tl-body"><b>${s.name}</b><em>${s.sub || s.addr}</em></span>
        <span class="tl-arrow">›</span>
      </div>`).join("");
    return `<div class="tl-day">
      <div class="tl-day-h"><b>12月${d.id + 1}日</b><span>${d.sub.split(" · ")[1]}</span></div>
      ${rows}
    </div>`;
  }).join("");
  $$(".tl-row").forEach(r=>r.onclick = ()=>focusStop(r.dataset.id));

  /* ---------- hotels ---------- */
  $("#hotelGrid").innerHTML = T.hotels.map(h=>`
    <article class="hotel-card ${h.tag === "首选" ? "primary" : ""}">
      <span class="h-tag ${h.tag === "首选" ? "" : "alt"}">${h.tag}</span>
      <h3>${h.name}<small>${h.en}</small></h3>
      <div class="h-addr">${h.area} · ${h.addr}</div>
      <div class="h-price">${h.price}<small>${h.priceNote}</small></div>
      <p>${h.why}</p>
      <div class="h-dist">${h.dist.map(d=>`<div><span>${d[0]}</span><b>${d[1]}</b></div>`).join("")}</div>
    </article>`).join("");

  /* ---------- company cards ---------- */
  $("#companyGrid").innerHTML = T.companies.map(c=>`
    <article class="co-card" data-co="${c.id}">
      <div class="when">${c.when}</div>
      <h3>${c.name}<small>${c.code}</small></h3>
      <p>${c.line}</p>
      <div class="chips"><span>一页纸</span><span>调研提纲</span><span>股价估值</span></div>
      <span class="go">展开资料 <i>+</i></span>
    </article>`).join("");

  /* ---------- company expand ---------- */
  let activeCo = null;
  function openCompany(id){
    const c = (window.COMPANIES || {})[id];
    if (!c) return;
    if (activeCo === id && !$("#coExpand").hidden) { closeCompany(); return; }
    activeCo = id;
    $$(".co-card").forEach(el=>el.classList.toggle("on", el.dataset.co === id));
    const panel = $("#coExpand");
    panel.hidden = false;
    window.CompanyUI.render(c, $("#coExpandBody"));
    setTimeout(()=>panel.scrollIntoView({behavior: "smooth", block: "start"}), 60);
  }
  function closeCompany(){
    activeCo = null;
    $("#coExpand").hidden = true;
    $("#coExpandBody").innerHTML = "";
    if (window.CompanyUI) window.CompanyUI.close();
    $$(".co-card").forEach(el=>el.classList.remove("on"));
  }
  $$(".co-card").forEach(el=>el.onclick = ()=>openCompany(el.dataset.co));
  document.addEventListener("click", e=>{
    const b = e.target.closest("[data-open-co]");
    if (b) { map.closePopup(); openCompany(b.dataset.openCo); }
    if (e.target.closest("#coExpand [data-close]")) closeCompany();
  });

  /* ---------- nav active ---------- */
  const secs = ["travel", "map-sec", "companies"].map(id=>document.getElementById(id));
  const navLinks = $$(".nav a");
  const io = new IntersectionObserver(entries=>{
    entries.forEach(en=>{
      if (en.isIntersecting) navLinks.forEach(a=>a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id));
    });
  }, {rootMargin: "-45% 0px -50% 0px"});
  secs.forEach(s=>s && io.observe(s));

  /* ---------- boot ---------- */
  setDay(1, false);
})();
