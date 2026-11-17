import {
  onUser, logout, checkAdmin, subscribeVotes, subscribeNext, subscribeVoting, subscribeUsers,
  setVotingOpen, resetVotes
} from "./firebase.js";
import { HEROES } from "./heroes.js";
import { buildChart, updateChart } from "./chart.js";

const $ = s => document.querySelector(s);
const esc = t => String(t == null ? "" : t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let users = [], votes = [], nextVotes = [], votingOpen = true, filter = "";
const heroName = Object.fromEntries(HEROES.map(h => [h.id, h.name]));
const tally = (list, key) => list.reduce((c, v) => { c[v[key]] = (c[v[key]] || 0) + 1; return c; }, {});
const plural = n => n + (n === 1 ? " vote" : " votes");

function render() {
  const counts = tally(votes, "heroId");
  const total = HEROES.reduce((n, h) => n + (counts[h.id] || 0), 0);
  const max = Math.max(0, ...HEROES.map(h => counts[h.id] || 0));

  // voting switch
  $("#pill").textContent = votingOpen ? "OPEN" : "CLOSED";
  $("#pill").className = "pill " + (votingOpen ? "on" : "off");
  $("#toggle").textContent = votingOpen ? "Turn voting OFF" : "Turn voting ON";
  $("#toggle").classList.toggle("primary", !votingOpen);

  // overview numbers
  $("#kUsers").textContent = users.length;
  $("#kVotes").textContent = total;
  $("#kPart").textContent = (users.length ? Math.min(100, Math.round((total / users.length) * 100)) : 0) + "%";
  $("#kLead").textContent = max ? HEROES.filter(h => (counts[h.id] || 0) === max).map(h => h.name).join(" / ") : "—";

  updateChart($("#chart"), HEROES, counts, null);

  const nc = tally(nextVotes, "choice");
  $("#nHero").textContent = plural(nc.hero || 0);
  $("#nWeapons").textContent = plural(nc.weapons || 0);
  $("#nEvents").textContent = plural(nc.events || 0);

  // users by server
  const bySrv = tally(users, "server");
  $("#servers").innerHTML = Object.keys(bySrv).sort().map(s => '<span class="chip">' + esc(s) + " <b>" + bySrv[s] + "</b></span>").join("");

  // users table
  const voteOf = Object.fromEntries(votes.map(v => [v.uid, v.heroId]));
  const q = filter.trim().toLowerCase();
  const list = users
    .filter(u => !q || [u.username, u.email, u.ingameId, u.server].some(x => String(x || "").toLowerCase().includes(q)))
    .sort((a, b) => ((b.createdAt && b.createdAt.seconds) || 0) - ((a.createdAt && a.createdAt.seconds) || 0));
  $("#rows").innerHTML = list.length ? list.map(u => {
    const v = voteOf[u.uid];
    const joined = u.createdAt && u.createdAt.toDate ? u.createdAt.toDate().toLocaleDateString() : "";
    return "<tr><td>" + esc(u.username) + "</td><td>" + esc(u.email) + "</td><td>" + esc(u.ingameId) + "</td><td>" + esc(u.server) +
      "</td><td>" + esc(u.mobile) + "</td><td>" + esc(u.gender) + "</td><td>" + esc(u.address) + "</td>" +
      (v ? '<td class="voted">' + esc(heroName[v] || v) + "</td>" : '<td class="none">Not yet</td>') +
      "<td>" + esc(joined) + "</td></tr>";
  }).join("") : '<tr><td class="empty" colspan="9">No users found.</td></tr>';
}

let toastTimer;
function toast(text) {
  const t = $("#toast");
  t.textContent = text; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 4000);
}

$("#search").addEventListener("input", e => { filter = e.target.value; render(); });
$("#logout").addEventListener("click", () => logout());
$("#logout2").addEventListener("click", () => logout());

$("#toggle").addEventListener("click", async e => {
  const b = e.currentTarget; b.disabled = true;
  try { await setVotingOpen(!votingOpen); }
  catch (err) { console.error(err); toast("Couldn’t change the voting status. Check your Firestore rules."); }
  b.disabled = false;
});

$("#reset").addEventListener("click", async e => {
  if (!confirm("Delete ALL votes (heroes and the “revamp next” poll)? This can’t be undone.")) return;
  const b = e.currentTarget; b.disabled = true;
  try { await resetVotes(); toast("All votes were reset."); }
  catch (err) { console.error(err); toast("Couldn’t reset the votes. Check your Firestore rules."); }
  b.disabled = false;
});

buildChart($("#chart"), HEROES);
render();

let started = false;
onUser(async user => {
  if (!user) { location.replace("loginform.html"); return; }
  const ok = await checkAdmin(user.uid).catch(() => false);
  if (!ok) { $("#deniedUid").textContent = user.uid; $("#denied").hidden = false; return; }
  $("#app").hidden = false;
  if (started) return;
  started = true;
  const fail = e => { console.error(e); const m = $("#err"); m.textContent = "Couldn’t load some data. Check your Firestore rules."; m.hidden = false; };
  subscribeVoting(o => { votingOpen = o; render(); }, fail);
  subscribeVotes(v => { votes = v; render(); }, fail);
  subscribeNext(v => { nextVotes = v; render(); }, fail);
  subscribeUsers(u => { users = u; render(); }, fail);
});
