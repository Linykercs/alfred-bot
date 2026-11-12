/* Alfred — persistent theme (dark default). Set pre-paint via inline snippet in <head>. */
(function () {
  const KEY = "alfred-theme";
  window.AlfredTheme = {
    get() { return document.documentElement.getAttribute("data-theme") || "dark"; },
    set(t) {
      document.documentElement.setAttribute("data-theme", t);
      try { localStorage.setItem(KEY, t); } catch (e) {}
    },
    toggle() { this.set(this.get() === "dark" ? "light" : "dark"); }
  };
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-theme-toggle]");
    if (btn) window.AlfredTheme.toggle();
  });
})();
