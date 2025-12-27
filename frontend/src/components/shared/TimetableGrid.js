import React from 'react';
import { FaCalendarAlt, FaClock, FaGraduationCap, FaUserTie, FaDoorOpen } from 'react-icons/fa';

/**
 * Reusable Timetable Grid Component
 * Displays timetable data in a grid format with days as rows and time slots as columns
 * 
 * @param {Array} data - Array of timetable entries with { class, day, time, course, teacher, roomNumber }
 * @param {Array} allDays - Array of day names (e.g., ['Monday', 'Tuesday', ...])
 * @param {Array} allTimes - Array of time slots (e.g., ['08:00-09:00', 'BREAK', ...])
 * @param {Boolean} showClassHeader - Whether to show class header (default: true)
 */
const TimetableGrid = ({ data = [], allDays = [], allTimes = [], showClassHeader = true }) => {
  // Normalize day names
  const normalizeDay = (day) => {
    if (!day) return '';
    const lower = day.toLowerCase().trim();
    const map = {
      mon: 'Monday', monday: 'Monday',
      tue: 'Tuesday', tuesday: 'Tuesday',
      wed: 'Wednesday', wednesday: 'Wednesday',
      thu: 'Thursday', thursday: 'Thursday',
      fri: 'Friday', friday: 'Friday',
      sat: 'Saturday', saturday: 'Saturday',
      sun: 'Sunday', sunday: 'Sunday'
    };
    return map[lower] || day;
  };

  // Deduplicate data
  const seen = new Set();
  const dedupedData = [];
  for (const d of data) {
    const key = `${d.class}|${d.day}|${d.time}|${d.course}|${d.roomNumber}|${d.teacher || d.instructorName}`;
    if (!seen.has(key)) {
      seen.add(key);
      dedupedData.push(d);
    }
  }

  // Group by class
  const classMap = new Map();
  for (const d of dedupedData) {
    const klass = String(d.class || 'Unknown');
    const day = normalizeDay(d.day);
    const time = String(d.time || '');
    if (!classMap.has(klass)) classMap.set(klass, []);
    classMap.get(klass).push({ ...d, day, time });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {Array.from(classMap.entries()).map(([className, classDetails]) => {
        // Create lookup map: key = day|time
        const byKey = new Map();
        classDetails.forEach(d => {
          const key = `${d.day}|${d.time}`;
          byKey.set(key, d);
        });

        return (
          <div 
            key={className}
            style={{
              border: '2px solid var(--theme-color)',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#fff'
            }}
          >
            {/* Class Header */}
            {showClassHeader && (
              <div style={{
                background: 'linear-gradient(135deg, var(--theme-color) 0%, var(--theme-color) 100%)',
                color: '#fff',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaGraduationCap style={{ fontSize: '18px' }} />
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>
                  Class: {className}
                </div>
              </div>
            )}

            {/* Timetable Grid */}
            <div style={{ padding: '20px', overflowX: 'auto' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: `minmax(80px, 100px) repeat(${allTimes.length}, minmax(140px, 1fr))`,
                minWidth: 'fit-content',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {/* Header Row */}
                <div style={{
                  padding: '12px 10px',
                  background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                  fontWeight: 700,
                  color: '#374151',
                  fontSize: '13px',
                  borderRight: '1px solid #e5e7eb',
                  borderBottom: '2px solid var(--theme-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaClock style={{ marginRight: '6px', fontSize: '12px', color: 'var(--theme-color)' }} />
                  Day / Time
                </div>

                {allTimes.map((time, idx) => {
                  const isBreak = time === 'BREAK';
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 10px',
                        background: isBreak
                          ? 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)'
                          : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                        fontWeight: 600,
                        color: isBreak ? '#9a3412' : '#374151',
                        fontSize: '12px',
                        textAlign: 'center',
                        borderRight: '1px solid #e5e7eb',
                        borderBottom: '2px solid var(--theme-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      {isBreak && <FaClock style={{ fontSize: '12px' }} />}
                      {isBreak ? 'Break Time' : time}
                    </div>
                  );
                })}

                {/* Data Rows - One row per day */}
                {allDays.map((day, dayIndex) => (
                  <React.Fragment key={day}>
                    {/* Day column */}
                    <div style={{
                      padding: '14px 10px',
                      background: dayIndex % 2 === 0
                        ? 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)'
                        : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                      fontWeight: 700,
                      color: '#374151',
                      fontSize: '13px',
                      borderRight: '1px solid #e5e7eb',
                      borderBottom: '1px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <FaCalendarAlt style={{ color: 'var(--theme-color)', fontSize: '14px' }} />
                      {day}
                    </div>

                    {/* Time slot cells for this day */}
                    {allTimes.map((time, timeIndex) => {
                      const isBreak = time === 'BREAK';
                      
                      if (isBreak) {
                        // Break column - only render once for the first day
                        if (dayIndex === 0) {
                          return (
                            <div
                              key={`break-${timeIndex}`}
                              style={{
                                padding: '14px 10px',
                                background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
                                textAlign: 'center',
                                color: '#9a3412',
                                fontWeight: 600,
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                gridRow: `span ${allDays.length}`,
                                borderRight: '1px solid #fdba74',
                                borderBottom: '1px solid #fdba74'
                              }}
                            >
                              <FaClock style={{ fontSize: '14px' }} />
                              Break Time
                            </div>
                          );
                        }
                        return null;
                      }
                      
                      // Look up the slot using day|time key
                      const slot = byKey.get(`${day}|${time}`);
                      
                      return (
                        <div
                          key={`${day}-${timeIndex}`}
                          style={{
                            padding: '12px',
                            background: slot
                              ? (dayIndex % 2 === 0 ? '#faf5ff' : '#f5f3ff')
                              : (dayIndex % 2 === 0 ? '#ffffff' : '#fafafa'),
                            borderRight: '1px solid #e5e7eb',
                            borderBottom: '1px solid #e5e7eb',
                            minHeight: '80px',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}
                        >
                          {slot ? (
                            <>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                color: 'var(--theme-color)',
                                marginBottom: '4px'
                              }}>
                                {slot.course}
                              </div>
                              <div style={{
                                fontSize: '11px',
                                color: '#6b7280',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <FaUserTie style={{ fontSize: '12px' }} />
                                  {slot.teacher || slot.instructorName || 'N/A'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <FaDoorOpen style={{ fontSize: '12px' }} />
                                  {slot.roomNumber || 'N/A'}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div style={{ 
                              color: '#d1d5db', 
                              fontSize: '11px',
                              textAlign: 'center',
                              margin: 'auto'
                            }}>
                              —
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimetableGrid;
