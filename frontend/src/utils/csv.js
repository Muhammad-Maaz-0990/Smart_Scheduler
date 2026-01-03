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
  const formatForExcel = (header, val) => {
    const s = String(val ?? '');
    if (!s) return s;

    // Excel commonly converts long numbers to scientific notation. For identifiers like
    // phone/cnic/nic/contact numbers, force Excel to treat the cell as text.
    const headerKey = String(header ?? '').toLowerCase();
    const looksLikeIdentifierColumn = /(phone|mobile|contact|cnic|nic)/i.test(headerKey);
    const digitsOnly = s.replace(/\D/g, '');
    const looksLikeLongNumber = /^\d+$/.test(s) && s.length >= 11;
    const hasLeadingZero = /^0\d+$/.test(s);

    if (looksLikeIdentifierColumn && digitsOnly.length >= 6) {
      return `="${digitsOnly}"`;
    }
    if (looksLikeLongNumber || hasLeadingZero) {
      return `="${s}"`;
    }
    return s;
  };

  const escape = (val) => {
    const s = String(val ?? '');
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const headerLine = headers.map(escape).join(',');
  const lines = rows.map(r => headers.map(h => escape(formatForExcel(h, r[h]))).join(','));
  return [headerLine, ...lines].join('\r\n');
}

export function downloadCSV(filename, csvString) {
  const withBom = csvString?.startsWith('\uFEFF') ? csvString : '\uFEFF' + (csvString ?? '');
  const blob = new Blob([withBom], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
