import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function TimeTable({ isAdmin = false }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [timetable, setTimetable] = useState([]);
  const [error, setError] = useState('');

  const fetchTimetable = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // TODO: Replace with real API endpoint when available
      // const res = await fetch('/api/timetable');
      // const data = await res.json();
      // setTimetable(data || []);
      // Temporary mock data
      setTimetable([
        { day: 'Monday', slots: ['Math (9:00)', 'Physics (11:00)'] },
        { day: 'Tuesday', slots: ['Chemistry (10:00)', 'English (1:00)'] },
        { day: 'Wednesday', slots: ['Biology (9:00)'] },
        { day: 'Thursday', slots: ['Computer (12:00)'] },
        { day: 'Friday', slots: ['Arts (11:00)'] },
      ]);
    } catch (e) {
      setError('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateTimetable = useCallback(() => {
    navigate('/admin/generate-timetable');
  }, [navigate]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  return (
    <div style={{ padding: '24px', background: '#fff', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Time Table</h2>
        {isAdmin && (
          <button 
            onClick={generateTimetable} 
            disabled={loading}
            style={{
              background: '#7c3aed',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Generating…' : 'Generate Timetable'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ color: '#dc2626', marginBottom: '16px', padding: '12px', background: '#fee2e2', borderRadius: '8px' }}>{error}</div>
      )}

      {loading && !isAdmin && <div style={{ marginTop: '8px', color: '#6b7280' }}>Loading…</div>}

      <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
        {timetable.map((row) => (
          <div key={row.day} style={{ border: '2px solid #e5e7eb', borderRadius: '12px', padding: '16px', background: '#fff' }}>
            <div style={{ fontWeight: 700, marginBottom: '12px', color: '#7c3aed', fontSize: '16px' }}>{row.day}</div>
            {row.slots.length === 0 ? (
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>No slots</div>
            ) : (
              row.slots.map((s, idx) => (
                <div key={idx} style={{ padding: '10px 12px', background: '#f3f4f6', borderRadius: '8px', marginBottom: '8px', fontSize: '14px', color: '#374151', borderLeft: '3px solid #7c3aed' }}>
                  {s}
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TimeTable;
