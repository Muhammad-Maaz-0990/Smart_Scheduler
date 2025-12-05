export function parseCSV(text) {
  // Simple CSV parser: supports quoted fields and commas
  const rows = [];
  let i = 0, field = '', row = [], inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { // escaped quote
          field += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        field += ch;
        i++;
        continue;
      }
    } else {
      if (ch === '"') { inQuotes = true; i++; continue; }
      if (ch === ',') { row.push(field.trim()); field = ''; i++; continue; }
      if (ch === '\n' || ch === '\r') {
        // handle CRLF or LF
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(field.trim()); field = '';
        if (row.length > 1 || (row.length === 1 && row[0] !== '')) rows.push(row);
        row = [];
        i++;
        continue;
      }
      field += ch;
      i++;
    }
  }
  // push last field
  if (field.length || row.length) {
    row.push(field.trim());
    rows.push(row);
  }
  if (!rows.length) return { headers: [], items: [] };
  const headers = rows[0].map(h => h.trim());
  const items = rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = r[idx] ?? ''; });
    return obj;
  });
  return { headers, items };
}

export function toCSV(headers, rows) {
  const escape = (val) => {
    const s = String(val ?? '');
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const headerLine = headers.map(escape).join(',');
  const lines = rows.map(r => headers.map(h => escape(r[h])).join(','));
  return [headerLine, ...lines].join('\r\n');
}

export function downloadCSV(filename, csvString) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
