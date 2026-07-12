(function () {
  function nav(active) {
    var items = [
      ["index.html", "Dashboard", "dashboard"],
      ["matches.html", "Matches", "matches"],
      ["orders.html", "Orders", "orders"],
      ["customers.html", "Customers", "customers"],
      ["bulk.html", "Bulk Requests", "bulk"],
      ["settings.html", "Settings", "settings"],
      ["content.html", "Content", "content"]
    ];
    document.getElementById("side").innerHTML =
      '<a href="index.html" class="brand gold" style="display:block;margin-bottom:1rem;font-size:1.8rem">PITCHORA</a>' +
      items.map(function (i) {
        return '<a href="' + i[0] + '" class="' + (active === i[2] ? "active" : "") + '">' + i[1] + '</a>';
      }).join("") +
      '<a href="#" id="logoutBtn">Logout</a>' +
      '<a href="../index.html">View Site</a>' +
      '<a href="#" id="resetBtn" style="color:#fca5a5">Reset Demo Data</a>';
    document.getElementById("logoutBtn").addEventListener("click", function (e) {
      e.preventDefault();
      App.logoutAdmin();
    });
    document.getElementById("resetBtn").addEventListener("click", function (e) {
      e.preventDefault();
      App.resetDemo();
    });
  }
  window.Admin = { nav: nav };
})();
