import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function TimeTable({ isAdmin = false }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]); // headers list
  const [selected, setSelected] = useState(null); // selected header
  const [details, setDetails] = useState([]); // details for selected
  const [instituteInfo, setInstituteInfo] = useState(null);

  useEffect(() => {
    const fetchInstituteInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        const instituteRef = user?.instituteID;
        const instituteParam = typeof instituteRef === 'object'
          ? (instituteRef._id || instituteRef.instituteID || instituteRef)
          : instituteRef;
        if (!instituteParam) return;
        const response = await fetch(`http://localhost:5000/api/auth/institute/${encodeURIComponent(instituteParam)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          // If instituteLogo is a path (not data URL), prepend base URL
          if (data.instituteLogo && !data.instituteLogo.startsWith('data:') && !data.instituteLogo.startsWith('http')) {
            data.instituteLogo = `http://localhost:5000${data.instituteLogo}`;
          }
          console.log('Institute info loaded:', data);
          setInstituteInfo(data);
        }
      } catch (err) {
        console.error('Failed to fetch institute info:', err);
      }
    };
    fetchInstituteInfo();
  }, []);

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

  // Fallback: if instituteInfo is missing, try fetching via selected header's instituteID
  useEffect(() => {
    const fetchByHeader = async () => {
      if (instituteInfo || !selected?.instituteID) return;
      try {
        const token = localStorage.getItem('token');
        const instId = selected.instituteID;
        const response = await fetch(`http://localhost:5000/api/auth/institute/${encodeURIComponent(instId)}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (response.ok) {
          const data = await response.json();
          if (data.instituteLogo && !String(data.instituteLogo).startsWith('http') && !String(data.instituteLogo).startsWith('data:')) {
            data.instituteLogo = `http://localhost:5000${data.instituteLogo}`;
          }
          setInstituteInfo(data);
        }
      } catch {}
    };
    fetchByHeader();
  }, [selected, instituteInfo]);

  const generateTimetable = useCallback(() => {
    navigate('/admin/generate-timetable');
  }, [navigate]);

  const handlePrint = useCallback(async () => {
    try {
      // Ensure institute info is loaded
      if (!instituteInfo) {
        // Try refetch quickly if missing
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const instituteRef = user?.instituteID;
          const instituteParam = typeof instituteRef === 'object'
            ? (instituteRef._id || instituteRef.instituteID || instituteRef)
            : instituteRef;
          if (instituteParam) {
            const response = await fetch(`http://localhost:5000/api/auth/institute/${encodeURIComponent(instituteParam)}`, {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (response.ok) {
              const data = await response.json();
              if (data.instituteLogo && !String(data.instituteLogo).startsWith('http') && !String(data.instituteLogo).startsWith('data:')) {
                data.instituteLogo = `http://localhost:5000${data.instituteLogo}`;
              }
              setInstituteInfo(data);
            }
          }
        }
      }

      // If there's a logo, wait for it to load before printing
      if (instituteInfo?.instituteLogo) {
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = instituteInfo.instituteLogo;
        });
      }

      // Give the browser a tick to apply print-only styles
      await new Promise(r => setTimeout(r, 50));
      window.print();
    } catch {
      window.print();
    }
  }, [instituteInfo]);

  return (
    <div style={{ padding: '24px', background: '#fff', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#333' }} className="no-print">Time Tables</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          {selected && (
            <button
              onClick={handlePrint}
              style={{
                background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px'
              }}
              className="no-print"
            >
              🖨️ Print Timetable
            </button>
          )}
          {isAdmin && (
            <>
              <button
                onClick={generateTimetable}
                disabled={loading}
                style={{
                  background: '#7c3aed', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '14px', opacity: loading ? 0.6 : 1
                }}
                className="no-print"
              >
                Generate Timetable
              </button>
              {selected && (
                <button
                  onClick={async () => {
                    try {
                      const confirmDel = window.confirm(`Delete timetable ${selected.instituteTimeTableID}? This cannot be undone.`);
                      if (!confirmDel) return;
                      const token = localStorage.getItem('token');
                      const res = await fetch(`http://localhost:5000/api/timetables-gen/${encodeURIComponent(selected.instituteTimeTableID)}`, {
                        method: 'DELETE',
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                      });
                      if (!res.ok) throw new Error(await res.text());
                      // Refresh list; fetchList will auto-select current or first
                      await fetchList();
                    } catch (e) {
                      setError('Failed to delete timetable');
                    }
                  }}
                  disabled={loading}
                  style={{
                    background: '#ef4444', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '14px', opacity: loading ? 0.6 : 1
                  }}
                  className="no-print"
                >
                  🗑️ Delete Timetable
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div style={{ color: '#dc2626', marginBottom: '16px', padding: '12px', background: '#fee2e2', borderRadius: '8px' }}>{error}</div>
      )}

      {/* Timetable Selector Dropdown */}
      {items.length > 0 && (
        <div style={{ marginBottom: '24px' }} className="no-print">
          <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '8px', fontSize: '14px' }}>
            Select Timetable:
          </label>
          <select
            value={selected?.instituteTimeTableID || ''}
            onChange={(e) => {
              const selectedId = parseInt(e.target.value);
              const timetable = items.find(h => h.instituteTimeTableID === selectedId);
              if (timetable) setSelected(timetable);
            }}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '12px 16px',
              fontSize: '14px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#fff',
              color: '#111827',
              cursor: 'pointer',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#7c3aed'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          >
            {items.map(h => (
              <option key={h.instituteTimeTableID} value={h.instituteTimeTableID}>
                Timetable {h.instituteTimeTableID} - {h.session} • {h.year}
                {h.currentStatus ? ' (Current)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {items.length === 0 && (
        <div style={{ color: '#6b7280', marginBottom: '24px', padding: '12px' }} className="no-print">
          No timetables found. Click Generate to create one.
        </div>
      )}

      {/* Details for selected timetable */}
      {selected && (
        <div style={{ border: '2px solid #e5e7eb', borderRadius: '12px', padding: '16px' }} id="timetable-print-content">
          {/* Print Header with Institute Info */}
          {(
            () => {
              // Fallbacks: prefer instituteInfo, then selected header, then user from localStorage
              let displayName = instituteInfo?.instituteName || selected?.instituteName;
              if (!displayName) {
                try {
                  const userStr = localStorage.getItem('user');
                  if (userStr) {
                    const u = JSON.parse(userStr);
                    displayName = u?.instituteName || displayName;
                  }
                } catch {}
              }
              if (!displayName) displayName = 'Institute';
              const logoUrl = instituteInfo?.instituteLogo || '';
              return (
                <div className="print-only" style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Institute Logo" style={{ height: '80px', width: '80px', borderRadius: '50%', objectFit: 'cover', marginRight: '18px' }} />
                    ) : null}
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', margin: 0 }}>{displayName}</h1>
                  </div>
                  <div style={{ fontSize: '16px', color: '#6b7280', margin: '18px 0 0 0', textAlign: 'center', width: '100%' }}>
                    Academic Year: {selected.session}
                  </div>
                  <div style={{ position: 'absolute', right: 24, bottom: 8, fontSize: '14px', color: '#9ca3af', textAlign: 'right' }}>
                    Generated on: {new Date(selected.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              );
            }
          )()}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }} className="no-print">
            {isAdmin && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} className="no-print">
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

// Print styles injected via style tag
if (typeof document !== 'undefined') {
  const styleId = 'timetable-print-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @media screen {
        .print-only {
          display: none !important;
        }
      }
      @media print {
        .no-print {
          display: none !important;
        }
        .print-only {
          display: block !important;
        }
        #timetable-print-content {
          visibility: visible !important;
          display: block !important;
        }
        @page {
          size: landscape;
          margin: 0.5cm;
        }
      }
    `;
    document.head.appendChild(style);
  }
}


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
                          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
                              {row.roomNumber}
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', textAlign: 'center', margin: '4px 0' }}>
                              {row.course}
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 500, color: '#374151', textAlign: 'right' }}>
                              {row.instructorName}
                            </div>
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
