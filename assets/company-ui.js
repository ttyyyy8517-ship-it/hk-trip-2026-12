(function(){
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  function table(head, rows){
    return `<div class="tblwrap"><table class="tbl">
      <thead><tr>${head.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(r=>`<tr>${r.map((v,i)=>{
        const num = i > 0 && String(v).length <= 12 && /\d/.test(String(v));
        return `<td class="${num ? "n" : ""}">${esc(v)}</td>`;
      }).join("")}</tr>`).join("")}</tbody>
    </table></div>`;
  }

  let chart = null, ro = null;
  function destroyChart(){
    if (chart) { try { chart.remove(); } catch(e){} chart = null; }
    if (ro) { try { ro.disconnect(); } catch(e){} ro = null; }
  }

  function fmtNum(v, unit){
    if (unit === "%") return v.toFixed(1) + "%";
    if (Math.abs(v) >= 1000) return Math.round(v).toLocaleString("en-US");
    if (Math.abs(v) < 10) return v.toFixed(2);
    return v.toFixed(1);
  }
  function barChart(series, labels){
    const vals = series.values.map(v => v === null || v === undefined ? null : Number(v));
    const nums = vals.filter(v => v !== null);
    const max = Math.max(...nums, 0), min = Math.min(...nums, 0);
    const range = max - min || 1;
    const W = 320, H = 120, padX = 16, padTop = 20, padBot = 24;
    const baseY = padTop + (max / range) * (H - padTop - padBot);
    const step = (W - padX * 2) / vals.length;
    const bw = Math.min(38, step * 0.56);
    const bars = vals.map((v, i) => {
      const cx = padX + step * i + step / 2;
      if (v === null) return `<text x="${cx}" y="${baseY - 6}" text-anchor="middle" font-size="9" fill="#9aa7b6">—</text>`;
      const h = Math.abs(v) / range * (H - padTop - padBot);
      const y = v >= 0 ? padTop + (max - v) / range * (H - padTop - padBot) : baseY;
      const fill = v >= 0 ? "#2e548f" : "#c0392b";
      const ty = v >= 0 ? Math.max(10, y - 5) : Math.min(H - 20, y + h + 11);
      return `<rect x="${cx - bw/2}" y="${y}" width="${bw}" height="${Math.max(1,h)}" rx="2" fill="${fill}" opacity=".82"/>
        <text x="${cx}" y="${ty}" text-anchor="middle" font-size="8.5" fill="#5b6b7c">${fmtNum(v, series.unit)}</text>`;
    }).join("");
    const labs = labels.map((l, i) => {
      const cx = padX + step * i + step / 2;
      return `<text x="${cx}" y="${H - 6}" text-anchor="middle" font-size="8.5" fill="#9aa7b6">${esc(l)}</text>`;
    }).join("");
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
      <line x1="${padX}" y1="${baseY}" x2="${W-padX}" y2="${baseY}" stroke="#e6ebf1" stroke-width="1"/>
      ${bars}${labs}
    </svg>`;
  }
  function dataHTML(c){
    const cons = c.consensus ? `<div class="tblwrap"><table class="tbl">
      <thead><tr>${c.consensus.head.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead>
      <tbody>${c.consensus.rows.map(r=>`<tr>${r.map((v,i)=>`<td class="${i>0 && String(v).length<=14 && /\d/.test(String(v)) ? "n" : ""}">${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table></div><div class="note">${esc(c.consensus.note)}</div>` : '<div class="empty">一致预期待补</div>';
    const trend = c.trend ? `<div class="trend-grid">${c.trend.series.map(s=>`
      <div class="trend-card"><div class="trend-h"><b>${esc(s.name)}</b><span>${esc(s.unit)}</span></div>${barChart(s, c.trend.labels)}</div>`).join("")}</div>` : '<div class="empty">财务趋势待补</div>';
    const fal = c.falsify ? table(["证伪条件","阈值 / 时间","动作"], c.falsify) : '<div class="empty">证伪清单待补</div>';
    const trendNote = c.trend && c.trend.note ? `<div class="note">${esc(c.trend.note)}</div>` : "";
    const latest = c.latest && c.latest.length ? `<h3 class="block-h">最新经营数据</h3><ul class="points">${c.latest.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>` : "";
    const peers = c.peers ? `<h3 class="block-h">同业估值</h3>${table(c.peers.head, c.peers.rows)}<div class="note">${esc(c.peers.note || "")}</div>` : "";
    return `<div class="data-note">数据底稿：一致预期来自 brm，财务数据来自公司财报，证伪阈值为研究员设定；行情截至 2026-11-24。</div>
      <h3 class="block-h">一致预期</h3>${cons}
      <h3 class="block-h">财务趋势</h3>${trend}${trendNote}
      <h3 class="block-h">证伪与跟踪</h3>${fal}
      ${latest}
      ${peers}`;
  }

  function briefHTML(c){
    return `
      <div class="co-intro">${c.intro.map(p=>`<p>${esc(p)}</p>`).join("")}</div>
      <h3 class="block-h">发展历史</h3>
      <div class="hist">${c.history.map(([y,t])=>`<div class="hist-row"><span class="hy">${esc(y)}</span><p>${esc(t)}</p></div>`).join("")}</div>
      <h3 class="block-h">主要业务</h3>
      ${table(c.business.head, c.business.rows)}
      <div class="note">${esc(c.business.note)}</div>
      <h3 class="block-h">财务业绩</h3>
      ${table(c.financial.head, c.financial.rows)}
      <div class="note">${esc(c.financial.note)}</div>
      <ul class="points">${c.financial.points.map(p=>`<li>${esc(p)}</li>`).join("")}</ul>
      <h3 class="block-h">短期边际催化</h3>
      ${table(["时间","事件","影响"], c.catalysts)}
      <h3 class="block-h">长期投资看点</h3>
      <div class="lt-grid">${c.longTerm.map((x,i)=>`<div class="lt-card"><em>0${i+1}</em><h4>${esc(x[0])}</h4><p>${esc(x[1])}</p></div>`).join("")}</div>
      <h3 class="block-h">风险提示</h3>
      <div class="risk-list">${c.risks.map(x=>`<div><b>${esc(x[0])}</b><p>${esc(x[1])}</p></div>`).join("")}</div>
      <h3 class="block-h">估值摘要</h3>
      <div class="two">
        <div class="card">${table(["指标","数值","备注"], c.valuation.rows)}</div>
        <div class="card">${table(["机构","目标价","空间","备注"], c.valuation.targets)}<p class="comment">${esc(c.valuation.comment)}</p></div>
      </div>`;
  }

  function outlineHTML(c){
    let qn = 0;
    return `
      <div class="shortcut">
        <h3>只有 10 分钟，先问这三句</h3>
        <ol>${c.outlineShort.map(q=>`<li>${esc(q)}</li>`).join("")}</ol>
      </div>
      ${c.outline.map((b,i)=>{
        const qs = b.qs.map(([q,w])=>{
          qn++;
          return `<div class="q"><p><span class="no">Q${qn}</span>${esc(q)}</p><div class="want"><b>要拿到</b>：${esc(w)}</div></div>`;
        }).join("");
        return `<details class="qbox" ${i===0?"open":""}>
          <summary><span class="qn">BLOCK ${i+1}</span>${esc(b.title)}<span class="cnt">${b.qs.length} 问</span><span class="arw">▶</span></summary>
          <div class="qbody">${qs}</div>
        </details>`;
      }).join("")}`;
  }

  function valuationHTML(c){
    return `
      <div class="kline-card">
        <div class="kline-top">
          <div><h3>${esc(c.name)} <small>${esc(c.code)}</small></h3><span>日线 · 前复权 · 港元</span></div>
          <div class="ranges" id="ranges">
            ${[["1M",1],["3M",3],["6M",6],["1Y",12],["2Y",24]].map(([label,m])=>`<button data-m="${m}" class="${label==="1Y"?"on":""}">${label}</button>`).join("")}
          </div>
        </div>
        <div class="kline-legend" id="klineLegend"></div>
        <div id="kline"></div>
        <div class="kline-foot">数据：Yahoo Finance / 港交所，截至 ${c.klineAsOf || "2026-11-24"}；红涨绿跌，十字光标看 OHLC。</div>
      </div>
      <div class="two" style="margin-top:18px">
        <div class="card"><h3>估值口径</h3>${table(["指标","数值","备注"], c.valuation.rows)}</div>
        <div class="card"><h3>卖方目标价</h3>${table(["机构","目标价","空间","备注"], c.valuation.targets)}<p class="comment">${esc(c.valuation.comment)}</p></div>
      </div>`;
  }

  function initKline(c, body){
    const wrap = body.querySelector("#kline");
    const legend = body.querySelector("#klineLegend");
    if (!wrap) return;
    const rows = (window.KLINE && window.KLINE[c.symbol] && window.KLINE[c.symbol].rows) || [];
    if (!rows.length) { wrap.innerHTML = '<div class="empty">暂无行情数据</div>'; return; }

    const h = window.innerWidth <= 760 ? 320 : 400;
    chart = LightweightCharts.createChart(wrap, {
      width: wrap.clientWidth, height: h,
      layout: { background: { type: "solid", color: "#ffffff" }, textColor: "#5b6b7c", fontSize: 11, fontFamily: "inherit" },
      grid: { vertLines: { color: "#f1f4f8" }, horzLines: { color: "#f1f4f8" } },
      crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
        vertLine: { color: "#9fb0c4", width: 1, style: 2, labelBackgroundColor: "#2b6b59" },
        horzLine: { color: "#9fb0c4", width: 1, style: 2, labelBackgroundColor: "#2b6b59" }
      },
      rightPriceScale: { borderColor: "#e4eaf1", scaleMargins: { top: 0.08, bottom: 0.24 } },
      timeScale: { borderColor: "#e4eaf1", timeVisible: false, secondsVisible: false, rightOffset: 4 },
      handleScroll: true, handleScale: true
    });

    const candle = chart.addCandlestickSeries({ upColor: "#c0392b", downColor: "#1e7a5c", borderVisible: false, wickUpColor: "#c0392b", wickDownColor: "#1e7a5c" });
    const volume = chart.addHistogramSeries({ priceFormat: { type: "volume" }, priceScaleId: "vol", lastValueVisible: false, priceLineVisible: false });
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.84, bottom: 0 } });

    candle.setData(rows.map(r=>({ time: r[0], open: r[1], high: r[2], low: r[3], close: r[4] })));
    volume.setData(rows.map((r,i)=>({ time: r[0], value: r[5], color: r[4] >= (i > 0 ? rows[i-1][4] : r[1]) ? "rgba(192,57,43,.25)" : "rgba(30,122,92,.25)" })));

    const idx = new Map(rows.map((r,i)=>[r[0], i]));
    const fmtVol = v => v >= 1e6 ? (v/1e6).toFixed(1) + "M" : (v/1e3).toFixed(0) + "K";
    function show(i){
      const r = rows[i]; if (!r) return;
      const prev = i > 0 ? rows[i-1][4] : r[1];
      const dec = Math.abs(r[4]) < 5 ? 3 : 2;
      const fmt = n => Number(n).toFixed(dec);
      const chg = r[4] - prev, pct = chg / prev * 100;
      const color = chg >= 0 ? "#c0392b" : "#1e7a5c";
      legend.innerHTML = `<span class="kl-name">${esc(c.name)} ${esc(c.code)}</span>
        <span>开 <b>${fmt(r[1])}</b></span><span>高 <b>${fmt(r[2])}</b></span>
        <span>低 <b>${fmt(r[3])}</b></span><span>收 <b>${fmt(r[4])}</b></span>
        <span style="color:${color}">${chg >= 0 ? "+" : ""}${fmt(chg)} (${chg >= 0 ? "+" : ""}${pct.toFixed(2)}%)</span>
        <span class="kl-vol">量 ${fmtVol(r[5])}</span>`;
    }
    show(rows.length - 1);
    chart.subscribeCrosshairMove(param=>{
      if (!param.time) { show(rows.length - 1); return; }
      const i = idx.get(param.time); if (i !== undefined) show(i);
    });

    function setRange(months){
      const to = rows[rows.length - 1][0];
      const d = new Date(to + "T00:00:00"); d.setMonth(d.getMonth() - months);
      chart.timeScale().setVisibleRange({ from: d.toISOString().slice(0,10), to });
    }
    setRange(12);
    body.querySelectorAll("#ranges button").forEach(b=>b.onclick = ()=>{
      body.querySelectorAll("#ranges button").forEach(x=>x.classList.toggle("on", x === b));
      setRange(parseInt(b.dataset.m, 10));
    });

    ro = new ResizeObserver(()=>{ if (chart) chart.applyOptions({ width: wrap.clientWidth }); });
    ro.observe(wrap);
  }

  function render(c, host){
    destroyChart();
    host.innerHTML = `
      <div class="co-expand-head">
        <div class="co-expand-main">
          <div class="kicker">${esc(c.kicker)}</div>
          <h2>${esc(c.name)}<small>${esc(c.code)}</small></h2>
          <p>${esc(c.tagline)}</p>
          <div class="co-stats">${c.stats.map(([v,l])=>`<span><b>${esc(v)}</b>${esc(l)}</span>`).join("")}</div>
          <div class="meet-line">${esc(c.meet)}</div>
        </div>
        <button class="co-close" data-close>收起 ×</button>
      </div>
      <div class="co-tabs" id="coTabs">
        <button data-tab="brief" class="on">一页纸</button>
        <button data-tab="outline">调研提纲</button>
        <button data-tab="valuation">股价与估值</button>
        <button data-tab="data">数据底稿</button>
      </div>
      <div class="co-panel-body" id="coPanelBody"></div>`;
    const body = host.querySelector("#coPanelBody");
    const tabs = [...host.querySelectorAll("#coTabs button")];
    body.innerHTML = briefHTML(c);
    tabs.forEach(btn=>btn.onclick = ()=>{
      tabs.forEach(x=>x.classList.toggle("on", x === btn));
      destroyChart();
      const tab = btn.dataset.tab;
      body.innerHTML = tab === "brief" ? briefHTML(c) : tab === "outline" ? outlineHTML(c) : tab === "valuation" ? valuationHTML(c) : dataHTML(c);
      if (tab === "valuation") initKline(c, body);
    });
  }

  window.CompanyUI = { render, close: destroyChart };
})();
