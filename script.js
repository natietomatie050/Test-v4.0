const STORAGE_KEY = 'klikregistratie-log-v1';

const buttonGroup = document.querySelector('.button-group');
const downloadButton = document.querySelector('#download-data');
const clearButton = document.querySelector('#clear-data');
const summaryEl = document.querySelector('#summary');
const totalEl = document.querySelector('#total-count');
const countElements = {
  'knop-a': document.querySelector('#count-knop-a'),
  'knop-b': document.querySelector('#count-knop-b'),
  'knop-c': document.querySelector('#count-knop-c'),
};
const logTableBody = document.querySelector('#log-rows');

function loadLog() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((entry) => ({
          id: entry.id,
          label: entry.label,
          timestamp: entry.timestamp,
        }))
      : [];
  } catch (error) {
    console.warn('Kon lokale opslag niet lezen, begin opnieuw.', error);
    return [];
  }
}

function saveLog(log) {
  try {
    const serialised = JSON.stringify(log);
    window.localStorage.setItem(STORAGE_KEY, serialised);
  } catch (error) {
    console.warn('Kon log niet bewaren in lokale opslag.', error);
  }
}

const clickLog = loadLog();

function formatTimestamp(isoString) {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('nl-NL', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date);
}

function updateStats() {
  const total = clickLog.length;
  totalEl.textContent = total.toString();

  const perButton = clickLog.reduce((acc, entry) => {
    const next = acc;
    next[entry.id] = (next[entry.id] ?? 0) + 1;
    return next;
  }, {});

  Object.entries(countElements).forEach(([id, element]) => {
    if (element) {
      element.textContent = (perButton[id] ?? 0).toString();
    }
  });

  if (total === 0) {
    summaryEl.textContent = 'Nog geen klikken geregistreerd.';
    downloadButton.disabled = true;
    clearButton.disabled = true;
  } else {
    const lastEntry = clickLog[clickLog.length - 1];
    summaryEl.textContent = `Laatste klik: ${lastEntry.label} om ${formatTimestamp(
      lastEntry.timestamp,
    )}`;
    downloadButton.disabled = false;
    clearButton.disabled = false;
  }
}

function renderLog() {
  if (!logTableBody) {
    return;
  }

  const fragment = document.createDocumentFragment();

  clickLog.forEach((entry, index) => {
    const row = document.createElement('tr');

    const indexCell = document.createElement('td');
    indexCell.textContent = String(index + 1);
    row.appendChild(indexCell);

    const buttonCell = document.createElement('td');
    buttonCell.textContent = entry.label;
    row.appendChild(buttonCell);

    const timeCell = document.createElement('td');
    timeCell.textContent = formatTimestamp(entry.timestamp);
    row.appendChild(timeCell);

    fragment.appendChild(row);
  });

  logTableBody.replaceChildren(fragment);
  updateStats();
}

function addEntry(identifier, label) {
  const newEntry = {
    id: identifier,
    label,
    timestamp: new Date().toISOString(),
  };
  clickLog.push(newEntry);
  saveLog(clickLog);
  renderLog();
}

function handleButtonClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  if (!target.dataset.id) {
    return;
  }

  const label = target.textContent?.trim() ?? target.dataset.id;
  addEntry(target.dataset.id, label);
}

function handleDownload() {
  if (clickLog.length === 0) {
    return;
  }

  const blob = new Blob([JSON.stringify(clickLog, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const timestamp = new Date().toISOString().replace(/[:]/g, '-');
  link.download = `kliklog-${timestamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function handleClear() {
  if (clickLog.length === 0) {
    return;
  }

  if (!window.confirm('Weet je zeker dat je alle geregistreerde klikken wilt verwijderen?')) {
    return;
  }

  clickLog.length = 0;
  saveLog(clickLog);
  renderLog();
}

buttonGroup?.addEventListener('click', handleButtonClick);
downloadButton?.addEventListener('click', handleDownload);
clearButton?.addEventListener('click', handleClear);

document.addEventListener('DOMContentLoaded', () => {
  renderLog();
});
