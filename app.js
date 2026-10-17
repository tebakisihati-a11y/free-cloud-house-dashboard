/* app.js — MFC dashboard. Data: dashboard.json + manifest-latest.json (sejajar halaman). */
(function () {
  "use strict";

  var ROLE = {
    "GitHub Repo": "rumah konfigurasi + manifest index",
    "GitHub Actions": "otomatis mingguan & CI verify",
    "GitHub Pages": "dashboard ini",
    "MEGA 20GB": "arsip snapshot penuh (rotasi)",
    "Google Drive 15GB": "mirror manifest & essentials",
    "MongoDB Katalog": "katalog opsional",
    "Cloudflare Workers": "health & alarm (opsional)"
  };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function classNameForStatus(s) {
    var x = (s || "").toLowerCase();
    if (x.indexOf("ready") === 0 || x.indexOf("ok") === 0 || x.indexOf("siap") === 0 || x.indexOf("kerja") === 0) return "ready";
    if (x.indexOf("menunggu") === 0 || x.indexOf("pending") === 0) return "pending";
    return "info";
  }

  function fmtBytes(v) { return v ? String(v) : "—"; }

  function renderCards(dash) {
    var grid = document.getElementById("grid");
    grid.textContent = "";
    (dash.clouds || []).forEach(function (c) {
      var card = el("article", "card");
      card.appendChild(el("div", "slot", "SLOT " + c.slot));
      card.appendChild(el("h3", null, c.name));
      var st = el("div", "status");
      var dot = el("span", "dot dot-" + classNameForStatus(c.status));
      st.appendChild(dot);
      st.appendChild(document.createTextNode(c.status || "—"));
      card.appendChild(st);
      card.appendChild(el("p", "detail", ROLE[c.name] || ""));
      grid.appendChild(card);
    });
  }

  function renderHead(dash) {
    document.getElementById("house-name").textContent = dash.house || "MFC";
    document.getElementById("disk-free").textContent = "disk " + (dash.diskFreeGB || "?") + " GB kosong";

    var snap = dash.snapshot || {};
    document.getElementById("last-snap").textContent = snap.last
      ? "snapshot " + snap.last + " (" + fmtBytes(snap.bytes) + ")"
      : "snapshot: belum ada";
    document.getElementById("updated").textContent = "update " + (dash.updated || "—");
  }

  function renderSnapshot(file) {
    var wrap = document.getElementById("snapshot-detail");
    var m = (file && file.ok) ? file.data : null;
    if (!m) {
      wrap.textContent = "Manifest belum tersedia — jalankan pertama `bin/mfc backup`.";
      return;
    }
    var keys = [
      ["id", m.id],
      ["file", m.file],
      ["ukuran", m.bytes_from_du_h],
      ["sha256", m.sha256],
      ["encrypted", m.encrypted],
      ["sumber", m.source],
      ["dibuat", m.created]
    ];
    var wrapTable = document.createElement("table");

    var trH = document.createElement("tr");
    ["field", "value"].forEach(function (s) { trH.appendChild(el("th", null, s)); });
    wrapTable.appendChild(trH);

    keys.forEach(function (k) {
      var tr = document.createElement("tr");
      tr.appendChild(el("td", null, k[0]));
      tr.appendChild(el("td", null, String(k[1])));
      wrapTable.appendChild(tr);
    });

    wrap.textContent = "";
    wrap.appendChild(wrapTable);
  }

  function main() {
    fetch("dashboard.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (dash) {
        renderHead(dash);
        renderCards(dash);
        return fetch("manifest-latest.json", { cache: "no-store" })
          .then(function (r) { return { ok: r.ok, data: r.ok ? r.json() : null }; });
      })
      .then(function (mres) {
        if (mres.ok) { return mres.data.then(function (d) { renderSnapshot({ ok: true, data: d }); }); }
        renderSnapshot({ ok: false });
      })
      .catch(function () {
        var grid = document.getElementById("grid");
        grid.textContent = "";
        grid.appendChild(el("p", "muted", "Gagal memuat dashboard.json — jalankan deploy Pages atau buka lewat http.server."));
      });
  }

  main();
})();
