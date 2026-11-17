// Simple bar graph. buildChart once, then updateChart whenever the numbers change.
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function buildChart(el, heroes) {
  el.innerHTML = heroes.map(h =>
    '<div class="col" data-id="' + h.id + '">' +
      '<span class="val"><b>0</b><small>0%</small></span>' +
      '<div class="track"><i></i></div>' +
      '<span class="lab">' + esc(h.name) + "</span>" +
    "</div>").join("");
}

export function updateChart(el, heroes, counts, mineId) {
  const total = heroes.reduce((n, h) => n + (counts[h.id] || 0), 0);
  const max = Math.max(1, ...heroes.map(h => counts[h.id] || 0));
  heroes.forEach(h => {
    const col = el.querySelector('[data-id="' + h.id + '"]');
    const n = counts[h.id] || 0;
    col.querySelector("b").textContent = n;
    col.querySelector("small").textContent = (total ? Math.round((n / total) * 100) : 0) + "%";
    col.querySelector("i").style.height = (n / max) * 100 + "%";
    col.classList.toggle("mine", mineId === h.id);
    col.classList.toggle("top", n > 0 && n === max);
  });
  el.setAttribute("aria-label", "Votes per hero: " + heroes.map(h => h.name + " " + (counts[h.id] || 0)).join(", "));
}
