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
      // For non-admin, only show visible items
      if (!isAdmin) list = list.filter(h => !!h.visibility);
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
  }, [isAdmin]);

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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
              {details.length === 0 ? (
                <div style={{ color: '#6b7280' }}>No rows</div>
              ) : (
                details.map((d, i) => (
                  <div key={i} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontWeight: 600, color: '#111827', marginBottom: '6px' }}>{d.day} • {d.time}</div>
                    <div style={{ fontSize: '13px', color: '#374151' }}>
                      <div>Class: {d.class}</div>
                      <div>Course: {d.course}</div>
                      <div>Room: {d.roomNumber}</div>
                      <div>Instructor: {d.instructorName}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TimeTable;
