const LS_KEY = "gym_progress_tracker_v1";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function todayISO() {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function loadState() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) {
    return {
      exercises: [
        { id: uid(), name: "Press banca" },
        { id: uid(), name: "Sentadilla" },
        { id: uid(), name: "Peso muerto" },
      ],
      days: [
        // { date:"YYYY-MM-DD", entries:[ {id, exerciseId, exerciseNameSnapshot, sets:[{weight,reps},...]} ] }
      ]
    };
  }
  return JSON.parse(raw);
}

function saveState(state) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
  return true;
}

const state = loadState();

// UI refs
const tabBtns = [...document.querySelectorAll(".tabBtn")];
const panels = [...document.querySelectorAll(".panel")];

const dayDate = document.getElementById("dayDate");
const btnEnsureDay = document.getElementById("btnEnsureDay");

const exerciseSelect = document.getElementById("exerciseSelect");
const historyExerciseSelect = document.getElementById("historyExerciseSelect");

const btnAddEntry = document.getElementById("btnAddEntry");
const entriesWrap = document.getElementById("entriesWrap");
const noEntriesHint = document.getElementById("noEntriesHint");

const btnSaveDay = document.getElementById("btnSaveDay");
const saveStatus = document.getElementById("saveStatus");

const newExerciseName = document.getElementById("newExerciseName");
const btnAddExercise = document.getElementById("btnAddExercise");
const exerciseList = document.getElementById("exerciseList");

const compareDateA = document.getElementById("compareDateA");
const compareDateB = document.getElementById("compareDateB");
const btnCompare = document.getElementById("btnCompare");
const btnSwapDates = document.getElementById("btnSwapDates");
const compareResults = document.getElementById("compareResults");

const historyResults = document.getElementById("historyResults");
const btnLoadHistory = document.getElementById("btnLoadHistory");

const btnExport = document.getElementById("btnExport");
const btnImport = document.getElementById("btnImport");
const btnReset = document.getElementById("btnReset");

// Current day being edited
let currentEditingDate = null;
let currentDraftDay = null;

function getDay(date) {
  return state.days.find(d => d.date === date) || null;
}

function ensureDay(date) {
  let day = getDay(date);
  if (!day) {
    day = { date, entries: [] };
    state.days.push(day);
  }
  return day;
}

function refreshExerciseSelects() {
  // Registrar select
  exerciseSelect.innerHTML = "";
  for (const ex of state.exercises) {
    const opt = document.createElement("option");
    opt.value = ex.id;
    opt.textContent = ex.name;
    exerciseSelect.appendChild(opt);
  }

  // Historial select
  historyExerciseSelect.innerHTML = "";
  for (const ex of state.exercises) {
    const opt = document.createElement("option");
    opt.value = ex.id;
    opt.textContent = ex.name;
    historyExerciseSelect.appendChild(opt);
  }
}

function renderExerciseCards() {
  entriesWrap.innerHTML = "";
  if (!currentEditingDate || !currentDraftDay || currentDraftDay.entries.length === 0) {
    noEntriesHint.style.display = "block";
    return;
  }
  noEntriesHint.style.display = "none";

  for (const entry of currentDraftDay.entries) {
    const exName = entry.exerciseNameSnapshot || entry.exerciseName || "Ejercicio";
    const card = document.createElement("div");
    card.className = "entryCard";

    const head = document.createElement("div");
    head.className = "entryHead";

    const titleWrap = document.createElement("div");
    const p = document.createElement("p");
    p.className = "entryTitle";
    p.textContent = exName;

    const meta = document.createElement("p");
    meta.className = "entryMeta";
    meta.textContent = `${entry.sets.length} series`;

    titleWrap.appendChild(p);
    titleWrap.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "entryActions";

    const btnRemoveEntry = document.createElement("button");
    btnRemoveEntry.className = "miniBtn";
    btnRemoveEntry.textContent = "Quitar";
    btnRemoveEntry.onclick = () => {
      currentDraftDay.entries = currentDraftDay.entries.filter(e => e.id !== entry.id);
      renderExerciseCards();
    };

    actions.appendChild(btnRemoveEntry);

    head.appendChild(titleWrap);
    head.appendChild(actions);

    const grid = document.createElement("div");
    grid.className = "setGrid";

    const c1 = document.createElement("div"); c1.className="setTitle"; c1.textContent="Serie";
    const c2 = document.createElement("div"); c2.className="setTitle"; c2.textContent="Peso";
    const c3 = document.createElement("div"); c3.className="setTitle"; c3.textContent="Reps";
    const c4 = document.createElement("div"); c4.className="setTitle"; c4.textContent="";

    grid.appendChild(c1); grid.appendChild(c2); grid.appendChild(c3); grid.appendChild(c4);

    entry.sets.forEach((set, idx) => {
      const weightCell = document.createElement("div");
      const repsCell = document.createElement("div");
      const removeBtnCell = document.createElement("div");

      const weightInput = document.createElement("input");
      weightInput.type = "number";
      weightInput.step = "0.5";
      weightInput.value = set.weight ?? "";
      weightInput.placeholder = "kg";

      const repsInput = document.createElement("input");
      repsInput.type = "number";
      repsInput.step = "1";
      repsInput.value = set.reps ?? "";
      repsInput.placeholder = "reps";

      const setIndex = document.createElement("div");
      setIndex.style.color = "var(--muted)";
      setIndex.textContent = `#${idx + 1}`;

      weightCell.appendChild(weightInput);
      repsCell.appendChild(repsInput);

      removeBtnCell.style.display = "flex";
      removeBtnCell.style.justifyContent = "flex-end";
      removeBtnCell.style.alignItems = "center";

      const btnRemoveSet = document.createElement("button");
      btnRemoveSet.className = "miniBtn";
      btnRemoveSet.textContent = "−";
      btnRemoveSet.onclick = () => {
        entry.sets.splice(idx, 1);
        renderExerciseCards();
      };

      removeBtnCell.appendChild(btnRemoveSet);

      weightInput.addEventListener("input", () => {
        entry.sets[idx].weight = weightInput.value === "" ? null : Number(weightInput.value);
      });
      repsInput.addEventListener("input", () => {
        entry.sets[idx].reps = repsInput.value === "" ? null : Number(repsInput.value);
      });

      grid.appendChild(setIndex);
      grid.appendChild(weightCell);
      grid.appendChild(repsCell);
      grid.appendChild(removeBtnCell);
    });

    const addSeriesRow = document.createElement("div");
    addSeriesRow.className = "row";
    addSeriesRow.style.marginTop = "10px";

    const btnAddSet = document.createElement("button");
    btnAddSet.className = "miniBtn";
    btnAddSet.textContent = "+ Agregar serie";
    btnAddSet.onclick = () => {
      entry.sets.push({ weight: null, reps: null });
      renderExerciseCards();
    };

    addSeriesRow.appendChild(btnAddSet);

    card.appendChild(head);
    card.appendChild(grid);
    card.appendChild(addSeriesRow);

    entriesWrap.appendChild(card);
  }
}

function addEntryToCurrentDay() {
  if (!currentEditingDate) {
    alert("Primero inicia un día.");
    return;
  }
  const exerciseId = exerciseSelect.value;
  const ex = state.exercises.find(e => e.id === exerciseId);
  if (!ex) return;

  let existing = currentDraftDay.entries.find(en => en.exerciseId === exerciseId);
  if (!existing) {
    existing = {
      id: uid(),
      exerciseId,
      exerciseNameSnapshot: ex.name,
      sets: [{ weight: null, reps: null }]
    };
    currentDraftDay.entries.push(existing);
  } else {
    existing.sets.push({ weight: null, reps: null });
  }

  renderExerciseCards();
}

function bestOfEntry(entry) {
  const sets = entry.sets || [];
  const weightSets = sets
    .filter(s => s.weight !== null && s.weight !== undefined && !Number.isNaN(Number(s.weight)));
  if (weightSets.length > 0) {
    weightSets.sort((a,b) => Number(b.weight)-Number(a.weight));
    const top = weightSets[0];
    return { weight: top.weight, reps: top.reps ?? null };
  }

  const repSets = sets
    .filter(s => s.reps !== null && s.reps !== undefined && !Number.isNaN(Number(s.reps)));
  if (repSets.length > 0) {
    repSets.sort((a,b) => Number(b.reps)-Number(a.reps));
    const top = repSets[0];
    return { weight: null, reps: top.reps };
  }

  return { weight: null, reps: null };
}

function formatBest(best) {
  if (best.weight !== null && best.weight !== undefined) {
    return `${best.weight} kg x ${best.reps ?? "-" }`;
  }
  if (best.reps !== null && best.reps !== undefined) {
    return `${best.reps} reps`;
  }
  return "-";
}

function renderCompare() {
  compareResults.innerHTML = "";
  const a = compareDateA.value;
  const b = compareDateB.value;

  if (!a || !b) {
    compareResults.innerHTML = `<p class="muted">Selecciona ambos días.</p>`;
    return;
  }

  const dayA = getDay(a);
  const dayB = getDay(b);

  if (!dayA && !dayB) {
    compareResults.innerHTML = `<p class="muted">No hay datos en esos días.</p>`;
    return;
  }

  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.innerHTML = `
    <thead>
      <tr>
        <th style="text-align:left;padding:10px;border-bottom:1px solid var(--border);">Ejercicio</th>
        <th style="text-align:left;padding:10px;border-bottom:1px solid var(--border);">${a}</th>
        <th style="text-align:left;padding:10px;border-bottom:1px solid var(--border);">${b}</th>
        <th style="text-align:left;padding:10px;border-bottom:1px solid var(--border);">Cambio</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");

  const entriesA = dayA ? dayA.entries : [];
  const entriesB = dayB ? dayB.entries : [];

  for (const ex of state.exercises) {
    const entA = entriesA.find(e => e.exerciseId === ex.id);
    const entB = entriesB.find(e => e.exerciseId === ex.id);

    const hasA = !!entA;
    const hasB = !!entB;
    if (!hasA && !hasB) continue;

    const bestA = entA ? bestOfEntry(entA) : { weight:null, reps:null };
    const bestB = entB ? bestOfEntry(entB) : { weight:null, reps:null };

    let change = "-";
    if (bestA.weight !== null && bestB.weight !== null) {
      const diff = Number(bestB.weight) - Number(bestA.weight);
      change = `${diff >= 0 ? "+" : ""}${diff} kg`;
    } else if (
      bestA.reps !== null && bestB.reps !== null &&
      bestA.weight === null && bestB.weight === null
    ) {
      const diff = Number(bestB.reps) - Number(bestA.reps);
      change = `${diff >= 0 ? "+" : ""}${diff} reps`;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="padding:10px;border-bottom:1px solid var(--border);font-weight:600;">${ex.name}</td>
      <td style="padding:10px;border-bottom:1px solid var(--border);">${formatBest(bestA)}</td>
      <td style="padding:10px;border-bottom:1px solid var(--border);">${formatBest(bestB)}</td>
      <td style="padding:10px;border-bottom:1px solid var(--border);color:${change.startsWith("+")? "#8ef0a1" : ""};">${change}</td>
    `;
    tbody.appendChild(tr);
  }

  compareResults.appendChild(table);
}

function renderHistory() {
  historyResults.innerHTML = "";
  const exId = historyExerciseSelect.value;
  const ex = state.exercises.find(e => e.id === exId);
  if (!ex) return;

  const daysSorted = [...state.days].sort((d1,d2) => d1.date.localeCompare(d2.date)).reverse();

  const rows = [];
  for (const day of daysSorted) {
    const entry = day.entries.find(en => en.exerciseId === exId);
    if (!entry) continue;
    const best = bestOfEntry(entry);
    rows.push({ date: day.date, best });
  }

  if (rows.length === 0) {
    historyResults.innerHTML = `<p class="muted">No hay registros para "${ex.name}".</p>`;
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = "card";
  wrap.style.marginTop = "10px";

  wrap.innerHTML = `
    <h3 style="margin-top:0;">${ex.name}</h3>
    <div class="divider"></div>
    <div style="overflow:auto;">
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left;padding:10px;border-bottom:1px solid var(--border);">Fecha</th>
            <th style="text-align:left;padding:10px;border-bottom:1px solid var(--border);">Mejor serie (peso/reps)</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;

  const tbody = wrap.querySelector("tbody");
  for (const r of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="padding:10px;border-bottom:1px solid var(--border);font-weight:600;">${r.date}</td>
      <td style="padding:10px;border-bottom:1px solid var(--border);">${formatBest(r.best)}</td>
    `;
    tbody.appendChild(tr);
  }

  historyResults.appendChild(wrap);
}

// Exercise management
function renderExerciseList() {
  exerciseList.innerHTML = "";
  for (const ex of state.exercises) {
    const row = document.createElement("div");
    row.className = "entryCard";
    row.style.padding = "10px 12px";

    row.innerHTML = `
      <div class="row" style="justify-content:space-between;">
        <div>
          <div style="font-weight:800;">${ex.name}</div>
          <div class="muted small">ID: ${ex.id.slice(0,8)}…</div>
        </div>
        <button class="miniBtn" data-delete="${ex.id}">Borrar de tipos</button>
      </div>
    `;

    row.querySelector(`[data-delete="${ex.id}"]`).onclick = () => {
      const ok = confirm(`¿Eliminar "${ex.name}" de la lista de ejercicios? (Los datos de días se mantienen pero ya no aparecerán en el select.)`);
      if (!ok) return;

      state.exercises = state.exercises.filter(e => e.id !== ex.id);
      refreshExerciseSelects();
      renderExerciseList();

      if (currentDraftDay) {
        currentDraftDay.entries = currentDraftDay.entries.filter(
          en => state.exercises.some(e => e.id === en.exerciseId)
        );
      }

      renderExerciseCards();
      saveState(state);
    };

    exerciseList.appendChild(row);
  }
}

// Tabs
function setTab(tabName) {
  tabBtns.forEach(b => b.classList.toggle("active", b.dataset.tab === tabName));
  panels.forEach(p => {
    const id = p.getAttribute("id"); // tab-xxx
    const match = id === `tab-${tabName}`;
    p.classList.toggle("active", match);
  });
}

tabBtns.forEach(btn => {
  btn.addEventListener("click", () => setTab(btn.dataset.tab));
});

// Events
btnEnsureDay.addEventListener("click", () => {
  const date = dayDate.value || todayISO();
  currentEditingDate = date;
  currentDraftDay = JSON.parse(JSON.stringify(ensureDay(date))); // deep copy draft
  renderExerciseCards();
  saveStatus.textContent = `Editando día: ${date}`;
});

btnAddEntry.addEventListener("click", addEntryToCurrentDay);

btnSaveDay.addEventListener("click", () => {
  if (!currentEditingDate || !currentDraftDay) return;

  const idx = state.days.findIndex(d => d.date === currentEditingDate);
  if (idx >= 0) state.days[idx] = currentDraftDay;
  else state.days.push(currentDraftDay);

  saveState(state);
  saveStatus.textContent = "Guardado ✅";
  setTimeout(() => (saveStatus.textContent = ""), 1800);
});

btnAddExercise.addEventListener("click", () => {
  const name = (newExerciseName.value || "").trim();
  if (!name) return alert("Escribe un nombre.");

  state.exercises.push({ id: uid(), name });
  newExerciseName.value = "";
  refreshExerciseSelects();
  renderExerciseList();
  saveState(state);
});

btnCompare.addEventListener("click", renderCompare);

btnSwapDates.addEventListener("click", () => {
  const tmp = compareDateA.value;
  compareDateA.value = compareDateB.value;
  compareDateB.value = tmp;
  renderCompare();
});

btnLoadHistory.addEventListener("click", renderHistory);

btnExport.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gym_progress_export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

btnImport.addEventListener("click", async () => {
  const text = prompt("Pega aquí el JSON exportado:");
  if (!text) return;

  try {
    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.exercises) || !Array.isArray(parsed.days)) {
      throw new Error("Formato inválido");
    }
    if (!confirm("Esto reemplazará tus datos actuales. ¿Continuar?")) return;

    state.exercises = parsed.exercises;
    state.days = parsed.days;

    saveState(state);
    refreshExerciseSelects();
    renderExerciseList();

    currentEditingDate = null;
    currentDraftDay = null;
    entriesWrap.innerHTML = "";
    noEntriesHint.style.display = "block";
    saveStatus.textContent = "Importado ✅";
    setTimeout(() => (saveStatus.textContent = ""), 1600);
  } catch (e) {
    alert("No se pudo importar: " + e.message);
  }
});

btnReset.addEventListener("click", () => {
  const ok = confirm("¿Resetear todo? Se borrarán ejercicios y días guardados en este navegador.");
  if (!ok) return;

  localStorage.removeItem(LS_KEY);
  location.reload();
});

// Init
function init() {
  refreshExerciseSelects();
  renderExerciseList();

  dayDate.value = todayISO();
  compareDateA.value = todayISO();
  compareDateB.value = todayISO();

  renderCompare();
  renderHistory();
  setTab("log");
  noEntriesHint.style.display = "block";
}

init();
