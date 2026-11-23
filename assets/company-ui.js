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
        <div class="kline-foot">数据：Yahoo Finance / 港交所，截至 2026-11-23；红涨绿跌，十字光标看 OHLC。</div>
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
    volume.setData(rows.map(r=>({ time: r[0], value: r[5], color: r[4] >= r[1] ? "rgba(192,57,43,.25)" : "rgba(30,122,92,.25)" })));

    const idx = new Map(rows.map((r,i)=>[r[0], i]));
    const fmt = n => Number(n).toFixed(2);
    const fmtVol = v => v >= 1e6 ? (v/1e6).toFixed(1) + "M" : (v/1e3).toFixed(0) + "K";
    function show(i){
      const r = rows[i]; if (!r) return;
      const chg = r[4] - r[1], pct = chg / r[1] * 100;
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
      </div>
      <div class="co-panel-body" id="coPanelBody"></div>`;
    const body = host.querySelector("#coPanelBody");
    const tabs = [...host.querySelectorAll("#coTabs button")];
    body.innerHTML = briefHTML(c);
    tabs.forEach(btn=>btn.onclick = ()=>{
      tabs.forEach(x=>x.classList.toggle("on", x === btn));
      destroyChart();
      const tab = btn.dataset.tab;
      body.innerHTML = tab === "brief" ? briefHTML(c) : tab === "outline" ? outlineHTML(c) : valuationHTML(c);
      if (tab === "valuation") initKline(c, body);
    });
  }

  window.CompanyUI = { render, close: destroyChart };
})();
