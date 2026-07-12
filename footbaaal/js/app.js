/* footbaaal simple data store — all in localStorage, no server needed */
(function () {
  const KEY = "footbaaal_v1";
  const ADMIN_KEY = "footbaaal_admin_session";

  function daysFromNow(d, hour, minute) {
    const dt = new Date();
    dt.setDate(dt.getDate() + d);
    dt.setHours(hour, minute, 0, 0);
    return dt.toISOString();
  }

  function uid(prefix) {
    return (prefix || "id") + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  function money(n) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
  }

  function defaultTeams() {
    return [
      { id: "t1", name: "Aurora FC", short: "AUR", country: "USA", logo: "assets/teams/aurora.svg" },
      { id: "t2", name: "Cascade United", short: "CAS", country: "Canada", logo: "assets/teams/cascade.svg" },
      { id: "t3", name: "Verdant Rovers", short: "VER", country: "Ireland", logo: "assets/teams/verdant.svg" },
      { id: "t4", name: "Gold Harbor SC", short: "GHS", country: "Portugal", logo: "assets/teams/goldharbor.svg" },
      { id: "t5", name: "Northwind Athletic", short: "NWA", country: "Scotland", logo: "assets/teams/northwind.svg" },
      { id: "t6", name: "Ember City FC", short: "EMB", country: "Spain", logo: "assets/teams/ember.svg" },
      { id: "t7", name: "Silverline United", short: "SLU", country: "England", logo: "assets/teams/silverline.svg" },
      { id: "t8", name: "Pacific Titans", short: "PAC", country: "Japan", logo: "assets/teams/pacific.svg" }
    ];
  }

  function buildSeats(category) {
    const seats = [];
    const sections = category === "CLOSER" ? ["CL-A", "CL-B", "CL-C", "CL-D"] : ["UP-E", "UP-F", "UP-G", "UP-H"];
    const rows = category === "CLOSER" ? ["1", "2", "3", "4", "5"] : ["6", "7", "8", "9", "10"];
    const perRow = category === "CLOSER" ? 8 : 10;
    sections.forEach(function (section) {
      rows.forEach(function (row) {
        for (var n = 1; n <= perRow; n++) {
          seats.push({
            id: section + "-" + row + "-" + n,
            section: section,
            row: row,
            number: n,
            category: category,
            status: "AVAILABLE"
          });
        }
      });
    });
    // mark a few sold
    seats.slice(0, category === "CLOSER" ? 8 : 12).forEach(function (s) { s.status = "SOLD"; });
    return seats;
  }

  function defaultMatches(teams) {
    var fixtures = [
      [0, 1, 3, 19, 30, "Aurora Grand Arena", "United States", "Austin", true],
      [2, 3, 7, 20, 0, "Emerald Pitch", "Ireland", "Dublin", true],
      [4, 5, 12, 18, 45, "Highland Lights Stadium", "Scotland", "Glasgow", false],
      [6, 7, 18, 21, 0, "Coastal Crown Bowl", "England", "Manchester", true],
      [1, 6, 24, 19, 0, "Cascade Dome", "Canada", "Vancouver", false],
      [5, 0, 30, 20, 15, "Ember Night Stadium", "Spain", "Seville", false]
    ];
    return fixtures.map(function (f, i) {
      return {
        id: "m" + (i + 1),
        homeTeamId: teams[f[0]].id,
        awayTeamId: teams[f[1]].id,
        kickoffAt: daysFromNow(f[2], f[3], f[4]),
        stadium: f[5],
        country: f[6],
        city: f[7],
        featured: f[8],
        seats: buildSeats("UPPER").concat(buildSeats("CLOSER"))
      };
    });
  }

  function defaultData() {
    var teams = defaultTeams();
    return {
      settings: {
        siteName: "Pitchora",
        heroHeadline: "Book Your Football Tickets",
        heroSubheadline: "Premium seats. Iconic stadiums. Unforgettable nights under the lights.",
        upperPrice: 89,
        closerPrice: 218,
        maxTickets: 2,
        serviceFeeEnabled: false,
        serviceFeePercent: 5,
        taxEnabled: false,
        taxPercent: 8.25,
        uniquePayment: true,
        upperApplePay: "https://www.apple.com/apple-pay/",
        upperCashApp: "https://cash.app/$PitchoraUpper",
        closerApplePay: "https://www.apple.com/apple-pay/",
        closerCashApp: "https://cash.app/$PitchoraCloser",
        contactEmail: "support@pitchora.com",
        contactPhone: "+1 (555) 014-2200",
        contactAddress: "1200 Arena Boulevard, Suite 400, Austin, TX 78701",
        whatsapp: "https://wa.me/15550142200",
        footerText: "Premium football ticket experiences worldwide.",
        faq: [
          { q: "How many tickets can I buy?", a: "Online orders are limited to 2 tickets. For 3+, use the bulk request form." },
          { q: "Which payments are accepted?", a: "Apple Pay and Cash App only." },
          { q: "Can I choose exact seats?", a: "Yes — use the interactive stadium map after choosing a category." }
        ],
        privacy: "Pitchora collects booking contact details to process tickets and support requests. We do not sell your data.",
        terms: "Max 2 tickets per online order. Bulk bookings require admin approval. Payments via Apple Pay or Cash App only."
      },
      teams: teams,
      matches: defaultMatches(teams),
      orders: [],
      bulkRequests: [],
      contacts: [],
      admin: { email: "admin@pitchora.com", password: "Admin123!" }
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) {
        var data = defaultData();
        save(data);
        return data;
      }
      return JSON.parse(raw);
    } catch (e) {
      var fresh = defaultData();
      save(fresh);
      return fresh;
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function getTeam(data, id) {
    return data.teams.find(function (t) { return t.id === id; });
  }

  function upcoming(data) {
    var now = Date.now();
    return data.matches
      .filter(function (m) { return new Date(m.kickoffAt).getTime() > now; })
      .sort(function (a, b) { return new Date(a.kickoffAt) - new Date(b.kickoffAt); });
  }

  function availableCount(match) {
    return match.seats.filter(function (s) { return s.status === "AVAILABLE"; }).length;
  }

  function calcTotals(settings, category, qty) {
    var unit = category === "CLOSER" ? settings.closerPrice : settings.upperPrice;
    var subtotal = unit * qty;
    var fee = settings.serviceFeeEnabled ? Math.round(subtotal * settings.serviceFeePercent) / 100 : 0;
    var tax = settings.taxEnabled ? Math.round(subtotal * settings.taxPercent) / 100 : 0;
    var original = Math.round((subtotal + fee + tax) * 100) / 100;
    var pay = original;
    if (settings.uniquePayment) {
      pay = Math.round((original + Math.random() * 2.99 + 0.01) * 100) / 100;
    }
    return { unit: unit, subtotal: subtotal, fee: fee, tax: tax, original: original, payment: pay };
  }

  function qs(name) {
    var p = new URLSearchParams(location.search);
    return p.get(name);
  }

  function setHtml(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function renderCountdown(targetIso, mountId) {
    function tick() {
      var el = document.getElementById(mountId);
      if (!el) return;
      var diff = Math.max(0, new Date(targetIso).getTime() - Date.now());
      if (diff <= 0) {
        el.innerHTML = '<span class="muted">Kickoff passed</span>';
        return;
      }
      var d = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      function box(v, l) {
        return '<span>' + String(v).padStart(2, "0") + '<small>' + l + '</small></span>';
      }
      el.innerHTML = box(d, "D") + box(h, "H") + box(m, "M") + box(s, "S");
    }
    tick();
    setInterval(tick, 1000);
  }

  function matchCard(data, match) {
    var home = getTeam(data, match.homeTeamId);
    var away = getTeam(data, match.awayTeamId);
    var avail = availableCount(match);
    return (
      '<article class="glass match-card">' +
        '<div class="match-top">' +
          '<div class="team"><img src="' + home.logo + '" alt=""><div><strong>' + home.name + '</strong><div class="muted" style="font-size:.8rem">' + home.country + '</div></div></div>' +
          '<div style="text-align:center"><div class="display" style="color:var(--gold);font-size:1.4rem">VS</div><div class="muted" style="font-size:.75rem">' + new Date(match.kickoffAt).toLocaleDateString() + '</div></div>' +
          '<div class="team right"><img src="' + away.logo + '" alt=""><div><strong>' + away.name + '</strong><div class="muted" style="font-size:.8rem">' + away.country + '</div></div></div>' +
        '</div>' +
        '<div class="match-body">' +
          '<div class="meta"><span>' + new Date(match.kickoffAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + '</span><span>' + match.stadium + ', ' + match.country + '</span></div>' +
          '<div class="countdown" id="cd-' + match.id + '"></div>' +
          '<div class="muted" style="font-size:.9rem"><span style="color:var(--emerald);font-weight:700">' + avail + '</span> seats left · from ' + money(data.settings.upperPrice) + '</div>' +
          '<a class="btn btn-emerald" href="match.html?id=' + match.id + '">Buy Tickets</a>' +
        '</div>' +
      '</article>'
    );
  }

  function wireHeader() {
    var btn = document.getElementById("menuBtn");
    var nav = document.getElementById("nav");
    if (btn && nav) {
      btn.addEventListener("click", function () { nav.classList.toggle("open"); });
    }
    var path = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("#nav a").forEach(function (a) {
      var href = a.getAttribute("href");
      if (href === path || (path === "" && href === "index.html")) a.classList.add("active");
    });
  }

  function resetDemo() {
    if (!confirm("Reset all demo data?")) return;
    localStorage.removeItem(KEY);
    location.reload();
  }

  function isAdmin() {
    return localStorage.getItem(ADMIN_KEY) === "1";
  }

  function requireAdmin() {
    if (!isAdmin()) location.href = "login.html";
  }

  function loginAdmin(email, password) {
    var data = load();
    if (email === data.admin.email && password === data.admin.password) {
      localStorage.setItem(ADMIN_KEY, "1");
      return true;
    }
    return false;
  }

  function logoutAdmin() {
    localStorage.removeItem(ADMIN_KEY);
    location.href = "login.html";
  }

  // booking cart in sessionStorage
  function getCart() {
    try { return JSON.parse(sessionStorage.getItem("footbaaal_cart") || "null"); } catch (e) { return null; }
  }
  function setCart(cart) {
    sessionStorage.setItem("footbaaal_cart", JSON.stringify(cart));
  }
  function clearCart() {
    sessionStorage.removeItem("footbaaal_cart");
  }

  window.App = {
    load: load,
    save: save,
    uid: uid,
    money: money,
    qs: qs,
    setHtml: setHtml,
    upcoming: upcoming,
    getTeam: getTeam,
    availableCount: availableCount,
    calcTotals: calcTotals,
    renderCountdown: renderCountdown,
    matchCard: matchCard,
    wireHeader: wireHeader,
    resetDemo: resetDemo,
    isAdmin: isAdmin,
    requireAdmin: requireAdmin,
    loginAdmin: loginAdmin,
    logoutAdmin: logoutAdmin,
    getCart: getCart,
    setCart: setCart,
    clearCart: clearCart,
    buildSeats: buildSeats
  };
})();
