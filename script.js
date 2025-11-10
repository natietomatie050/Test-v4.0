 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/script.js b/script.js
index c1f6ed414f98652a1922c0fa83928ddcb2dbe7da..9a2cf6d203867503c3840427fbbf095de1b3e577 100644
--- a/script.js
+++ b/script.js
@@ -1,156 +1,177 @@
- (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
-diff --git a/script.js b/script.js
-new file mode 100644
-index 0000000000000000000000000000000000000000..2ece9db927fae5faea637e43180bf45d95ce5824
---- /dev/null
-+++ b/script.js
-@@ -0,0 +1,146 @@
-+const clickRows = document.querySelector('#click-rows');
-+const summaryEl = document.querySelector('.results__summary');
-+const tableEl = document.querySelector('.results__table');
-+const exportButton = document.querySelector('#export-json');
-+const buttonGrid = document.querySelector('.button-grid');
-+
-+const statElements = {
-+  total: document.querySelector('#total-count'),
-+  'knop-a': document.querySelector('#count-knop-a'),
-+  'knop-b': document.querySelector('#count-knop-b'),
-+};
-+
-+const clickLog = [];
-+
-+function formatTimeStamp(date) {
-+  return date.toLocaleString('nl-NL', {
-+    hour: '2-digit',
-+    minute: '2-digit',
-+    second: '2-digit',
-+    fractionalSecondDigits: 3,
-+  });
-+}
-+
-+function downloadFile(filename, contents) {
-+  const blob = new Blob([contents], { type: 'application/json' });
-+  const url = URL.createObjectURL(blob);
-+  const link = document.createElement('a');
-+  link.href = url;
-+  link.download = filename;
-+  document.body.appendChild(link);
-+  link.click();
-+  document.body.removeChild(link);
-+  URL.revokeObjectURL(url);
-+}
-+
-+function updateStats() {
-+  const total = clickLog.length;
-+  const perButton = clickLog.reduce((accumulator, entry) => {
-+    const next = accumulator;
-+    next[entry.id] = (next[entry.id] ?? 0) + 1;
-+    return next;
-+  }, {});
-+
-+  statElements.total?.textContent = total.toString();
-+  statElements['knop-a']?.textContent = (perButton['knop-a'] ?? 0).toString();
-+  statElements['knop-b']?.textContent = (perButton['knop-b'] ?? 0).toString();
-+
-+  if (!summaryEl || !exportButton) {
-+    return;
-+  }
-+
-+  if (total === 0) {
-+    summaryEl.textContent = 'Nog geen klikken geregistreerd.';
-+    exportButton.disabled = true;
-+    exportButton.textContent = 'Download als JSON';
-+    return;
-+  }
-+
-+  const lastEntry = clickLog[clickLog.length - 1];
-+  summaryEl.textContent = `Laatste klik: ${lastEntry.label} om ${formatTimeStamp(
-+    lastEntry.timestamp,
-+  )}`;
-+  exportButton.disabled = false;
-+  exportButton.textContent = `Download ${total} registraties`;
-+}
-+
-+function renderTable() {
-+  if (!clickRows || !tableEl) {
-+    return;
-+  }
-+
-+  updateStats();
-+
-+  if (clickLog.length === 0) {
-+    tableEl.hidden = true;
-+    clickRows.replaceChildren();
-+    return;
-+  }
-+
-+  tableEl.hidden = false;
-+
-+  const fragment = document.createDocumentFragment();
-+
-+  clickLog.forEach((entry, index) => {
-+    const row = document.createElement('tr');
-+
-+    const indexCell = document.createElement('td');
-+    indexCell.textContent = index + 1;
-+    row.appendChild(indexCell);
-+
-+    const buttonCell = document.createElement('td');
-+    buttonCell.textContent = entry.label;
-+    row.appendChild(buttonCell);
-+
-+    const timeCell = document.createElement('td');
-+    timeCell.textContent = formatTimeStamp(entry.timestamp);
-+    row.appendChild(timeCell);
-+
-+    fragment.appendChild(row);
-+  });
-+
-+  clickRows.replaceChildren(fragment);
-+}
-+
-+function handleClick(event) {
-+  const target = event.target;
-+  if (!(target instanceof HTMLButtonElement)) {
-+    return;
-+  }
-+
-+  if (target === exportButton) {
-+    return;
-+  }
-+
-+  const label = target.textContent?.trim() ?? 'Onbekende knop';
-+  const identifier = target.dataset.id ?? 'onbekend';
-+  const timestamp = new Date();
-+
-+  clickLog.push({ id: identifier, label, timestamp });
-+  renderTable();
-+}
-+
-+function handleExport() {
-+  if (clickLog.length === 0) {
-+    return;
-+  }
-+
-+  const exportData = clickLog.map((entry) => ({
-+    id: entry.id,
-+    label: entry.label,
-+    timestamp: entry.timestamp.toISOString(),
-+  }));
-+
-+  const json = JSON.stringify(exportData, null, 2);
-+  const safeTimestamp = new Date().toISOString().replace(/[:]/g, '-');
-+  const filename = `klikdata-${safeTimestamp}.json`;
-+  downloadFile(filename, json);
-+}
-+
-+function init() {
-+  buttonGrid?.addEventListener('click', handleClick);
-+  exportButton?.addEventListener('click', handleExport);
-+  renderTable();
-+}
-+
-+document.addEventListener('DOMContentLoaded', init);
- 
-EOF
-)
\ No newline at end of file
+const STORAGE_KEY = 'klikregistratie-log-v1';
+
+const buttonGroup = document.querySelector('.button-group');
+const downloadButton = document.querySelector('#download-data');
+const clearButton = document.querySelector('#clear-data');
+const summaryEl = document.querySelector('#summary');
+const totalEl = document.querySelector('#total-count');
+const countElements = {
+  'knop-a': document.querySelector('#count-knop-a'),
+  'knop-b': document.querySelector('#count-knop-b'),
+  'knop-c': document.querySelector('#count-knop-c'),
+};
+const logTableBody = document.querySelector('#log-rows');
+
+function loadLog() {
+  try {
+    const raw = window.localStorage.getItem(STORAGE_KEY);
+    if (!raw) {
+      return [];
+    }
+    const parsed = JSON.parse(raw);
+    return Array.isArray(parsed)
+      ? parsed.map((entry) => ({
+          id: entry.id,
+          label: entry.label,
+          timestamp: entry.timestamp,
+        }))
+      : [];
+  } catch (error) {
+    console.warn('Kon lokale opslag niet lezen, begin opnieuw.', error);
+    return [];
+  }
+}
+
+function saveLog(log) {
+  try {
+    const serialised = JSON.stringify(log);
+    window.localStorage.setItem(STORAGE_KEY, serialised);
+  } catch (error) {
+    console.warn('Kon log niet bewaren in lokale opslag.', error);
+  }
+}
+
+const clickLog = loadLog();
+
+function formatTimestamp(isoString) {
+  const date = new Date(isoString);
+  return new Intl.DateTimeFormat('nl-NL', {
+    dateStyle: 'short',
+    timeStyle: 'medium',
+  }).format(date);
+}
+
+function updateStats() {
+  const total = clickLog.length;
+  totalEl.textContent = total.toString();
+
+  const perButton = clickLog.reduce((acc, entry) => {
+    const next = acc;
+    next[entry.id] = (next[entry.id] ?? 0) + 1;
+    return next;
+  }, {});
+
+  Object.entries(countElements).forEach(([id, element]) => {
+    if (element) {
+      element.textContent = (perButton[id] ?? 0).toString();
+    }
+  });
+
+  if (total === 0) {
+    summaryEl.textContent = 'Nog geen klikken geregistreerd.';
+    downloadButton.disabled = true;
+    clearButton.disabled = true;
+  } else {
+    const lastEntry = clickLog[clickLog.length - 1];
+    summaryEl.textContent = `Laatste klik: ${lastEntry.label} om ${formatTimestamp(
+      lastEntry.timestamp,
+    )}`;
+    downloadButton.disabled = false;
+    clearButton.disabled = false;
+  }
+}
+
+function renderLog() {
+  if (!logTableBody) {
+    return;
+  }
+
+  const fragment = document.createDocumentFragment();
+
+  clickLog.forEach((entry, index) => {
+    const row = document.createElement('tr');
+
+    const indexCell = document.createElement('td');
+    indexCell.textContent = String(index + 1);
+    row.appendChild(indexCell);
+
+    const buttonCell = document.createElement('td');
+    buttonCell.textContent = entry.label;
+    row.appendChild(buttonCell);
+
+    const timeCell = document.createElement('td');
+    timeCell.textContent = formatTimestamp(entry.timestamp);
+    row.appendChild(timeCell);
+
+    fragment.appendChild(row);
+  });
+
+  logTableBody.replaceChildren(fragment);
+  updateStats();
+}
+
+function addEntry(identifier, label) {
+  const newEntry = {
+    id: identifier,
+    label,
+    timestamp: new Date().toISOString(),
+  };
+  clickLog.push(newEntry);
+  saveLog(clickLog);
+  renderLog();
+}
+
+function handleButtonClick(event) {
+  const target = event.target;
+  if (!(target instanceof HTMLButtonElement)) {
+    return;
+  }
+
+  if (!target.dataset.id) {
+    return;
+  }
+
+  const label = target.textContent?.trim() ?? target.dataset.id;
+  addEntry(target.dataset.id, label);
+}
+
+function handleDownload() {
+  if (clickLog.length === 0) {
+    return;
+  }
+
+  const blob = new Blob([JSON.stringify(clickLog, null, 2)], {
+    type: 'application/json',
+  });
+  const url = URL.createObjectURL(blob);
+  const link = document.createElement('a');
+  link.href = url;
+  const timestamp = new Date().toISOString().replace(/[:]/g, '-');
+  link.download = `kliklog-${timestamp}.json`;
+  document.body.appendChild(link);
+  link.click();
+  document.body.removeChild(link);
+  URL.revokeObjectURL(url);
+}
+
+function handleClear() {
+  if (clickLog.length === 0) {
+    return;
+  }
+
+  if (!window.confirm('Weet je zeker dat je alle geregistreerde klikken wilt verwijderen?')) {
+    return;
+  }
+
+  clickLog.length = 0;
+  saveLog(clickLog);
+  renderLog();
+}
+
+buttonGroup?.addEventListener('click', handleButtonClick);
+downloadButton?.addEventListener('click', handleDownload);
+clearButton?.addEventListener('click', handleClear);
+
+document.addEventListener('DOMContentLoaded', () => {
+  renderLog();
+});
 
EOF
)
