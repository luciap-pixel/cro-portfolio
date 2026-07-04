/* ============================================================
   Konk redesign — interactions (vanilla JS)
   ============================================================ */
(function () {
  "use strict";
  const body = document.body;

  /* ---- Page navigation (home <-> product) via data-go ---- */
  function go(page) {
    body.classList.toggle("show-home", page === "home");
    body.classList.toggle("show-pdp", page === "pdp");
    window.scrollTo({ top: 0, behavior: "auto" });
  }
  document.querySelectorAll("[data-go]").forEach(el => {
    el.addEventListener("click", e => { e.preventDefault(); go(el.dataset.go); });
  });

  /* ---- PDP gallery ---- */
  const pdpMain = document.getElementById("pdpMain");
  document.querySelectorAll(".pthumb").forEach(t => {
    t.addEventListener("click", () => {
      document.querySelectorAll(".pthumb").forEach(x => x.classList.remove("is-active"));
      t.classList.add("is-active");
      if (pdpMain) pdpMain.src = t.dataset.src;
    });
  });

  /* ---- Option selectors (single-select within a group) ---- */
  document.querySelectorAll(".opt__choices").forEach(group => {
    group.querySelectorAll(".chip").forEach(chip => {
      chip.addEventListener("click", () => {
        group.querySelectorAll(".chip").forEach(c => c.classList.remove("is-active"));
        chip.classList.add("is-active");
      });
    });
  });
  const sizeGrid = document.querySelector(".size-grid");
  if (sizeGrid) {
    sizeGrid.querySelectorAll(".size").forEach(s => {
      s.addEventListener("click", () => {
        sizeGrid.querySelectorAll(".size").forEach(x => x.classList.remove("is-active"));
        s.classList.add("is-active");
      });
    });
  }

  /* ---- Add to basket feedback ---- */
  const addBtn = document.getElementById("pdpAdd");
  const addLabel = document.getElementById("pdpAddLabel");
  if (addBtn && addLabel) {
    addBtn.addEventListener("click", () => {
      addLabel.textContent = "Added to basket ✓";
      setTimeout(() => { addLabel.textContent = "Add to basket"; }, 1800);
    });
  }

  /* ---- Init ---- */
  go("home");
})();
