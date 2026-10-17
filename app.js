/* app.js · Morvexa Free Cloud House dashboard. Sumber: dashboard.json (publik, tanpa rahasia). */
(function () {
  "use strict";

  var ROLE = {
    "GitHub Repo": "rumah konfigurasi dan indeks manifest",
    "GitHub Actions": "otomatis mingguan dan verifikasi CI",
    "GitHub Pages": "dashboard ini, yang sedang Anda baca",
    "MEGA 20GB": "arsip snapshot penuh, dirotasi otomatis",
    "Google Drive 5TiB": "jangkar arsip dan indeks terkini",
    "Katalog D1 (Cloudflare)": "katalog tiap snapshot untuk pencarian cepat",
    "Alarm Workers (CF)": "alarm mingguan bila push gagal jalan",
    "TeraBox 1TB": "ruang cadangan 1 TB untuk arsip dan pecahan"
  };

  var STATUS = {
    "ready(remote)": "terhubung",
    "ready(local)": "siap (lokal)",
    "workflows-siap": "workflow siap",
    "LIVE (github.io)": "LIVE · github.io",
    "siap": "siap",
    "siap-mirror": "siap",
    "D1(mfch)-siap": "katalog siap",
    "terpasang": "terpasang",
    "mfc-health-LIVE": "alarm hidup",
    "arsip-19,9GB-OKE": "arsip 19,9 GB tersimpan",
    "menunggu-login": "menunggu login",
    "pending-rclone": "menunggu rclone"
  };

  var $ = function (id) { return document.getElementById(id); };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  /* nilai du -h macOS ("20G") -> "≈20 GB" */
  function fmtBytes(s) {
    var m = /^([0-9.]+)([KMGTP])$/.exec(String(s || "").trim());
    if (!m) return String(s || "…");
    var u = { K: "KB", M: "MB", G: "GB", T: "TB", P: "PB" };
    return "≈" + m[1].replace(".", ",") + " " + (u[m[2]] || m[2]);
  }

  function parseStamp(s) {
    if (!s) return null;
    var t = String(s).replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
    var d = new Date(t);
    return isNaN(d.getTime()) ? null : d;
  }

  var LONG = new Intl.DateTimeFormat("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
  var CLOCK = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });

  function snapMetaLine(dash) {
    var s = dash.snapshot || {};
    if (!s.last) return "manifest belum ada. Jalankan pertama mfc backup";
    var d = parseStamp(s.created);
    if (!d) return String(s.created || "…");
    return LONG.format(d) + " pukul " + CLOCK.format(d) + " WIB";
  }

  function freshnessText(dash) {
    var d = parseStamp(dash.updated);
    if (!d) return String(dash.updated || "…");
    var mnt = Math.round((Date.now() - d.getTime()) / 60000);
    if (mnt < 1) return "diperbarui baru saja";
    if (mnt < 60) return "diperbarui " + mnt + " mnt lalu";
    return "diperbarui " + Math.floor(mnt / 60) + " jam lalu";
  }

  var lastDash = null;

  function tickFreshness() {
    if (lastDash) $("freshness").textContent = freshnessText(lastDash);
  }

  function render(dash) {
    lastDash = dash;
    var s = dash.snapshot || {};
    $("sha-art").textContent = s.sha256 || "(belum ada snapshot; jalankan mfc backup)";
    $("snap-created").textContent = snapMetaLine(dash);
    $("stat-size").textContent = s.last ? fmtBytes(s.bytes) : "…";
    $("stat-slots").textContent = String((dash.clouds || []).length);
    tickFreshness();
  }

  function renderCards(dash) {
    var grid = $("grid");
    grid.textContent = "";
    (dash.clouds || []).forEach(function (c, i) {
      var card = el("article", "log-stagger-in card");
      card.style.animationDelay = (90 + i * 70) + "ms";
      card.appendChild(el("p", "meta", "slot " + c.slot));
      card.appendChild(el("h3", null, c.name || "…"));
      card.appendChild(el("p", "status", STATUS[String(c.status || "").trim()] || String(c.status || "")));
      card.appendChild(el("p", "detail", ROLE[c.name] || ""));
      grid.appendChild(card);
    });
  }

  function copySha(btn) {
    var text = ($("sha-art").textContent || "").trim();
    if (!text) return;
    function done() {
      btn.textContent = "Tersalin";
      setTimeout(function () { btn.textContent = "Salin SHA-256"; }, 2000);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) { /* no-op */ }
      document.body.removeChild(ta);
      done();
    }
  }

  function load() {
    fetch("dashboard.json", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (dash) {
        render(dash);
        renderCards(dash);
      })
      .catch(function () {
        $("grid").textContent = "";
        $("grid").appendChild(el("p", "lede",
          "Gagal memuat dashboard.json. Segarkan halaman, atau buka versi statis di repo."));
        $("sha-art").textContent = "…";
        $("freshness").textContent = "gagal memuat";
      });
  }

  $("copy-sha").addEventListener("click", function (ev) { copySha(ev.currentTarget); });

  $("freshness").addEventListener("click", function () {
    this.textContent = "memuat…";
    load();
  });

  if (window.matchMedia && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var intro = document.querySelectorAll(".hero-art, .display, .lede, .section-title, .stat-row, .site-foot .foot-row");
    intro.forEach(function (n, i) {
      n.classList.add("log-in");
      n.style.animationDelay = (i * 70) + "ms";
    });
  }

  load();
  setInterval(tickFreshness, 60000);
})();
