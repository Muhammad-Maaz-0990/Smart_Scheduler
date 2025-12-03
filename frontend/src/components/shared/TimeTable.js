import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function TimeTable({ isAdmin = false }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]); // headers list
  const [selected, setSelected] = useState(null); // selected header
  const [details, setDetails] = useState([]); // details for selected

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/timetables-gen/list', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      let list = Array.isArray(data?.items) ? data.items : [];
      // Show all timetables returned by backend
      // Sort: current first, then latest year
      list = list.sort((a, b) => {
        if (a.currentStatus && !b.currentStatus) return -1;
        if (!a.currentStatus && b.currentStatus) return 1;
        return (b.year || 0) - (a.year || 0);
      });
      setItems(list);
      // Auto-select: current if present, else first
      const current = list.find(h => h.currentStatus);
      if (current) setSelected(current);
      else if (list.length) setSelected(list[0]);
      else { setSelected(null); setDetails([]); }
    } catch (e) {
      setError('Failed to load timetables');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetails = useCallback(async (header) => {
    if (!header) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/timetables-gen/details/${encodeURIComponent(header.instituteTimeTableID)}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setDetails(Array.isArray(data?.details) ? data.details : []);
    } catch (e) {
      setError('Failed to load timetable details');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateHeader = useCallback(async (id, updates) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/timetables-gen/header/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      // refresh list and selected
      await fetchList();
      if (data?.header) setSelected(data.header);
    } catch (e) {
      setError('Failed to update timetable');
    }
  }, [fetchList]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (selected) fetchDetails(selected);
  }, [selected, fetchDetails]);

  const generateTimetable = useCallback(() => {
    navigate('/admin/generate-timetable');
  }, [navigate]);

  return (
    <div style={{ padding: '24px', background: '#fff', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Time Tables</h2>
        {isAdmin && (
          <button
            onClick={generateTimetable}
            disabled={loading}
            style={{
              background: '#7c3aed', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '14px', opacity: loading ? 0.6 : 1
            }}
          >
            Generate Timetable
          </button>
        )}
      </div>

      {error && (
        <div style={{ color: '#dc2626', marginBottom: '16px', padding: '12px', background: '#fee2e2', borderRadius: '8px' }}>{error}</div>
      )}

      {/* List of saved headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {items.length === 0 ? (
          <div style={{ color: '#6b7280' }}>No timetables found. Click Generate to create one.</div>) : (
          items.map(h => (
            <div
              key={h.instituteTimeTableID}
              onClick={() => setSelected(h)}
              style={{ border: selected?.instituteTimeTableID === h.instituteTimeTableID ? '3px solid #7c3aed' : '2px solid #e5e7eb', borderRadius: '12px', padding: '14px', cursor: 'pointer', background: selected?.instituteTimeTableID === h.instituteTimeTableID ? '#f5f3ff' : '#fff' }}
            >
              <div style={{ fontWeight: 700, color: '#111827' }}>Timetable {h.instituteTimeTableID}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{h.session} • {h.year}</div>
              {h.currentStatus && (
                <div style={{ marginTop: '6px', display: 'inline-block', background: '#10b981', color: '#fff', fontSize: '11px', padding: '4px 8px', borderRadius: '999px' }}>Current</div>
              )}
              {isAdmin && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                  Visibility: {h.visibility ? 'Yes' : 'No'} • Current: {h.currentStatus ? 'Yes' : 'No'}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Details for selected timetable */}
      {selected && (
        <div style={{ border: '2px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#111827' }}>Timetable {selected.instituteTimeTableID}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{selected.session} • {selected.year}</div>
            </div>
            {isAdmin && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#374151' }}>
                  <input
                    type="checkbox"
                    checked={!!selected.visibility}
                    onChange={(e) => updateHeader(selected.instituteTimeTableID, { visibility: e.target.checked })}
                  />
                  Visible
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#374151' }}>
                  <input
                    type="checkbox"
                    checked={!!selected.currentStatus}
                    onChange={(e) => updateHeader(selected.instituteTimeTableID, { currentStatus: e.target.checked })}
                  />
                  Current
                </label>
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ color: '#6b7280' }}>Loading details…</div>
          ) : (
            <TimetableTables details={details} header={selected} />
          )}
        </div>
      )}
    </div>
  );
}

export default TimeTable;

// ============== Helpers & Table Renderer ==============

function normalizeDay(day) {
  if (!day) return '';
  const d = String(day).toLowerCase();
  if (d.startsWith('mon')) return 'Mon';
  if (d.startsWith('tue')) return 'Tue';
  if (d.startsWith('wed')) return 'Wed';
  if (d.startsWith('thu')) return 'Thu';
  if (d.startsWith('fri')) return 'Fri';
  if (d.startsWith('sat')) return 'Sat';
  if (d.startsWith('sun')) return 'Sun';
  return day;
}

function parseStartMinutes(timeRange) {
  // expects HH:MM-HH:MM; returns minutes from 00:00
  if (!timeRange || typeof timeRange !== 'string') return 0;
  const part = timeRange.split('-')[0] || '';
  const [hh, mm] = part.split(':').map(n => parseInt(n, 10));
  if (Number.isFinite(hh) && Number.isFinite(mm)) return hh * 60 + mm;
  return 0;
}

function TimetableTables({ details, header }) {
  if (!Array.isArray(details) || details.length === 0) {
    return <div style={{ color: '#6b7280' }}>No rows</div>;
  }

  // Build unique sets
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const baseTimes = Array.from(
    new Set(details.map(d => String(d.time || '')).filter(Boolean))
  ).sort((a, b) => parseStartMinutes(a) - parseStartMinutes(b));

  // Derive a common break window from details if present
  const breakPairs = {};
  for (const d of details) {
    const bs = d.breakStart ? String(d.breakStart) : null;
    const be = d.breakEnd ? String(d.breakEnd) : null;
    if (bs && be) {
      const k = `${bs}-${be}`;
      breakPairs[k] = (breakPairs[k] || 0) + 1;
    }
  }
  let breakStart = null, breakEnd = null;
  if (header?.breakStart && header?.breakEnd) {
    breakStart = String(header.breakStart);
    breakEnd = String(header.breakEnd);
  } else if (Object.keys(breakPairs).length) {
    const top = Object.entries(breakPairs).sort((a, b) => b[1] - a[1])[0][0];
    [breakStart, breakEnd] = top.split('-');
  }

  // Build final column set with an inserted Break column (if detected)
  let allTimes = [...baseTimes];
  if (breakStart && breakEnd) {
    const insertIdx = allTimes.findIndex(t => parseStartMinutes(t) >= parseStartMinutes(`${breakStart}-${breakEnd}`));
    const idx = insertIdx >= 0 ? insertIdx : allTimes.length;
    allTimes = [
      ...allTimes.slice(0, idx),
      { __break: true, label: 'Break', range: `${breakStart}-${breakEnd}` },
      ...allTimes.slice(idx)
    ];
  }

  // Group rows by class
  const classMap = new Map();
  for (const d of details) {
    const klass = String(d.class || 'Unknown');
    const day = normalizeDay(d.day);
    const time = String(d.time || '');
    if (!classMap.has(klass)) classMap.set(klass, []);
    classMap.get(klass).push({ ...d, day, time });
  }

  const containerStyle = { display: 'grid', gap: '16px' };
  const tableWrapper = { border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff' };
  const titleStyle = { padding: '10px 12px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', fontWeight: 700, color: '#111827' };
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `160px repeat(${allTimes.length}, 1fr)`,
    borderTop: '1px solid #e5e7eb'
  };
  const cellStyle = { borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', padding: 10, minHeight: 72 };
  const headCellStyle = { ...cellStyle, background: '#f3f4f6', fontWeight: 600, color: '#374151', textAlign: 'center' };
  const headBreakStyle = { ...headCellStyle, background: '#fff7ed', color: '#9a3412' };
  const dayCellStyle = { ...cellStyle, background: '#fafafa', fontWeight: 600, color: '#374151', width: 160 };
  const entryTitle = { fontWeight: 600, color: '#111827' };
  const entryMeta = { fontSize: 12, color: '#374151', marginTop: 4, lineHeight: 1.35 };

  return (
    <div style={containerStyle}>
      {Array.from(classMap.entries()).map(([klass, rows]) => {
        // Index rows for O(1) cell lookup: key = day|time
        const byKey = new Map();
        for (const r of rows) byKey.set(`${r.day}|${r.time}`, r);

        return (
          <div key={klass} style={tableWrapper}>
            <div style={{ ...titleStyle, textAlign: 'center' }}>Class: {klass}</div>
            <div style={gridStyle}>
              <div style={headCellStyle}></div>
              {allTimes.map((t, idx) => (
                <div key={idx} style={typeof t !== 'string' && t.__break ? headBreakStyle : headCellStyle}>
                  {typeof t === 'string' ? t : (t.__break ? t.range : '')}
                </div>
              ))}

              {days.map((day, di) => (
                <React.Fragment key={day}>
                  <div style={dayCellStyle}>{day}</div>
                  {allTimes.map((t, i) => {
                    if (typeof t !== 'string' && t.__break) {
                      if (di === 0) {
                        // Single merged break cell spanning all day rows
                        return (
                          <div
                            key={`break-col-${i}`}
                            style={{
                              ...cellStyle,
                              background: '#fff7ed',
                              textAlign: 'center',
                              color: '#9a3412',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gridRow: `span ${days.length}`
                            }}
                          >
                            Break
                          </div>
                        );
                      }
                      // Omit for other days — spanned cell covers them
                      return null;
                    }
                    const row = byKey.get(`${day}|${t}`);
                    return (
                      <div key={`${day}-${i}`} style={cellStyle}>
                        {row ? (
                          <div>
                            <div style={entryTitle}>{row.course}</div>
                            <div style={entryMeta}>Room: {row.roomNumber}</div>
                            <div style={entryMeta}>Instructor: {row.instructorName}</div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
