import React from 'react';
import { FaCalendarAlt, FaClock, FaGraduationCap, FaDoorOpen, FaChalkboardTeacher } from 'react-icons/fa';

const normalizeDayToShort = (day) => {
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
};

const shortToFull = (short) => {
  const map = {
    'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday',
    'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday'
  };
  return map[short] || short;
};

const parseStartMinutes = (timeRange) => {
  if (!timeRange || typeof timeRange !== 'string') return 0;
  const part = timeRange.split('-')[0] || '';
  const [hh, mm] = part.split(':').map(n => parseInt(n, 10));
  if (Number.isFinite(hh) && Number.isFinite(mm)) return hh * 60 + mm;
  return 0;
};

const expandCourseName = (courseName) => {
  if (!courseName) return courseName;
  
  const abbreviations = {
    'OOP': 'Object Oriented Programming',
    'DSA': 'Data Structures and Algorithms',
    'DAA': 'Design and Analysis of Algorithms',
    'OS': 'Operating Systems',
    'DBMS': 'Database Management Systems',
    'SE': 'Software Engineering',
    'AI': 'Artificial Intelligence',
    'ML': 'Machine Learning',
    'DL': 'Deep Learning',
    'NLP': 'Natural Language Processing',
    'CV': 'Computer Vision',
    'CN': 'Computer Networks',
    'DC': 'Data Communications',
    'DIP': 'Digital Image Processing',
    'CC': 'Cloud Computing',
    'BD': 'Big Data',
    'IoT': 'Internet of Things',
    'HCI': 'Human Computer Interaction',
    'IR': 'Information Retrieval',
    'IS': 'Information Security',
    'CG': 'Computer Graphics',
    'TOA': 'Theory of Automata',
    'DLD': 'Digital Logic Design',
    'CA': 'Computer Architecture',
    'COA': 'Computer Organization and Architecture',
    'PF': 'Programming Fundamentals',
    'DS': 'Data Science',
    'WD': 'Web Development',
    'MD': 'Mobile Development',
    'GD': 'Game Development',
    'VP': 'Visual Programming',
    'LA': 'Linear Algebra',
    'DM': 'Discrete Mathematics',
    'PS': 'Probability and Statistics',
    'CAL': 'Calculus',
    'DE': 'Differential Equations',
    'NM': 'Numerical Methods',
    'PM': 'Project Management',
    'BPR': 'Business Process Reengineering',
    'ITM': 'IT Management',
    'MIS': 'Management Information Systems',
    'ICT': 'Information and Communication Technology',
    'IT': 'Information Technology',
    'CS': 'Computer Science',
    'TA': 'Technical Writing',
    'CE': 'Communication and Presentation Skills'
  };
  
  if (abbreviations[courseName.trim()]) {
    return abbreviations[courseName.trim()];
  }
  
  let expanded = courseName;
  Object.keys(abbreviations).forEach(abbr => {
    const regex = new RegExp(`\\b${abbr}\\b`, 'g');
    expanded = expanded.replace(regex, abbreviations[abbr]);
  });
  
  return expanded;
};

const DailyTimetableGrid = ({ data = [], currentDay, searchQuery = '' }) => {
  const todayFromSystem = () => {
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return names[new Date().getDay()];
  };

  const normalizedCurrentDay = currentDay || todayFromSystem();
  const normalizedSearchQuery = searchQuery.toLowerCase().trim();

  const normalized = (data || []).map((d) => ({
    ...d,
    class: String(d.class || 'Unknown'),
    day: normalizeDayToShort(d.day),
    time: String(d.time || '')
  }));

  const classSet = new Set();
  const daySet = new Set();
  const timeSet = new Set();

  normalized.forEach((d) => {
    if (d.class) classSet.add(d.class);
    if (d.day) daySet.add(d.day);
    if (d.time) timeSet.add(d.time);
  });

  const classNames = Array.from(classSet);
  const primaryClassName = classNames.length === 1 ? classNames[0] : null;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const allDays = days.filter((day) => daySet.has(day));
  
  const baseTimes = Array.from(timeSet)
    .filter(Boolean)
    .sort((a, b) => parseStartMinutes(a) - parseStartMinutes(b));
  
  const breakPairs = {};
  for (const d of normalized) {
    const bs = d.breakStart ? String(d.breakStart) : null;
    const be = d.breakEnd ? String(d.breakEnd) : null;
    if (bs && be) {
      const k = `${bs}-${be}`;
      breakPairs[k] = (breakPairs[k] || 0) + 1;
    }
  }
  
  let breakStart = null, breakEnd = null;
  if (Object.keys(breakPairs).length) {
    const top = Object.entries(breakPairs).sort((a, b) => b[1] - a[1])[0][0];
    [breakStart, breakEnd] = top.split('-');
  }
  
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

  const byKey = new Map();
  normalized.forEach((d) => {
    const key = `${d.day}|${d.time}`;
    byKey.set(key, d);
  });

  if (!allDays.length || !allTimes.length) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        color: '#6b7280',
        borderRadius: '16px',
        border: '1px dashed #d1d5db',
        background: '#f9fafb'
      }}>
        <FaCalendarAlt style={{ fontSize: '20px', marginBottom: '8px', color: '#d1d5db' }} />
        <div style={{ fontWeight: 600 }}>No timetable data available</div>
        <div style={{ fontSize: '13px', marginTop: '4px' }}>
          Once your timetable is generated, it will appear here.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        style={{
          border: '1px solid rgba(105, 65, 219, 0.15)',
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.95) 100%)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
        }}
      >
        {primaryClassName && (
          <div
            style={{
              padding: '14px 18px',
              background: 'linear-gradient(135deg, #6941db 0%, #a855f7 100%)',
              borderBottom: '1px solid rgba(105, 65, 219, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FaGraduationCap style={{ color: '#fff', fontSize: '18px' }} />
            </div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)', letterSpacing: '0.3px' }}>
              Class: {primaryClassName}
            </div>
          </div>
        )}

        <div style={{ padding: '0', overflowX: 'auto' }} className="table-responsive">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `minmax(70px, 100px) repeat(${allTimes.length}, minmax(140px, 1fr))`,
              minWidth: 'fit-content',
            }}
          >
            <div
              style={{
                padding: '12px 10px',
                background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                fontWeight: 700,
                color: '#374151',
                fontSize: '0.8rem',
                borderRight: '1px solid #e5e7eb',
                borderBottom: '2px solid #6941db',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'sticky',
                left: 0,
                zIndex: 2,
                boxShadow: '2px 0 4px rgba(0, 0, 0, 0.05)'
              }}
            >
              <FaClock style={{ marginRight: '6px', fontSize: '0.75rem', color: '#6941db' }} />
              Day / Time
            </div>

            {allTimes.map((t, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 10px',
                  background: typeof t !== 'string' && t.__break
                    ? 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)'
                    : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                  fontWeight: 600,
                  color: typeof t !== 'string' && t.__break ? '#9a3412' : '#374151',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  borderRight: '1px solid #e5e7eb',
                  borderBottom: '2px solid #6941db',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                {typeof t !== 'string' && t.__break && <FaClock style={{ fontSize: '0.7rem' }} />}
                {typeof t === 'string' ? t : (t.__break ? t.range : '')}
              </div>
            ))}

            {allDays.map((day, dayIndex) => {
              const dayFull = shortToFull(day);
              const isCurrentDay = dayFull === normalizedCurrentDay;

              return (
                <React.Fragment key={day}>
                  <div
                    style={{
                      padding: '14px 10px',
                      background: isCurrentDay
                        ? 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)'
                        : dayIndex % 2 === 0
                        ? 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)'
                        : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                      fontWeight: 700,
                      color: isCurrentDay ? '#6941db' : '#374151',
                      fontSize: '0.85rem',
                      borderRight: '1px solid #e5e7eb',
                      borderBottom: '2px solid rgba(105, 65, 219, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isCurrentDay ? 'inset 4px 0 0 #6941db' : 'none',
                      position: 'sticky',
                      left: 0,
                      zIndex: 1,
                    }}
                  >
                    <FaCalendarAlt
                      style={{
                        color: isCurrentDay ? '#6941db' : '#9ca3af',
                        fontSize: '0.75rem',
                      }}
                    />
                    <span>{day}</span>
                  </div>

                  {allTimes.map((t, timeIndex) => {
                    if (typeof t !== 'string' && t.__break) {
                      if (dayIndex === 0) {
                        return (
                          <div
                            key={`break-col-${timeIndex}`}
                            style={{
                              padding: '14px 10px',
                              background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
                              textAlign: 'center',
                              color: '#9a3412',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              gridRow: `span ${allDays.length}`,
                              borderRight: '1px solid #fdba74',
                              borderLeft: '2px solid #fb923c',
                              boxShadow: 'inset 0 2px 4px rgba(154, 52, 18, 0.1)',
                            }}
                          >
                            <FaClock style={{ fontSize: '0.75rem' }} />
                            Break Time
                          </div>
                        );
                      }
                      return null;
                    }

                    const slot = byKey.get(`${day}|${t}`);
                    const isEmpty = !slot || !slot.course;
                    
                    // Check if this cell matches search query
                    const matchesSearch = !isEmpty && normalizedSearchQuery && (
                      (slot.course && slot.course.toLowerCase().includes(normalizedSearchQuery)) ||
                      (slot.instructorName && slot.instructorName.toLowerCase().includes(normalizedSearchQuery)) ||
                      (slot.teacher && slot.teacher.toLowerCase().includes(normalizedSearchQuery)) ||
                      (expandCourseName(slot.course) && expandCourseName(slot.course).toLowerCase().includes(normalizedSearchQuery))
                    );

                    return (
                      <div
                        key={`${day}-${timeIndex}`}
                        style={{
                          padding: isEmpty ? '16px' : '14px',
                          background: matchesSearch
                            ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                            : isCurrentDay
                            ? isEmpty
                              ? '#f3f4f6'
                              : dayIndex % 2 === 0 ? '#ffffff' : '#fafafa'
                            : isEmpty
                            ? '#f3f4f6'
                            : dayIndex % 2 === 0 ? '#ffffff' : '#fafafa',
                          borderRight: '1px solid #e5e7eb',
                          borderBottom: '2px solid rgba(105, 65, 219, 0.3)',
                          minHeight: isEmpty ? '80px' : '120px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          opacity: isCurrentDay ? 1 : 0.5,
                          filter: isCurrentDay ? 'none' : 'grayscale(0.3)',
                          position: 'relative',
                          border: matchesSearch ? '2px solid #fbbf24' : undefined,
                          boxShadow: matchesSearch ? '0 0 0 3px rgba(251, 191, 36, 0.2)' : undefined,
                        }}
                      >
                        {!isEmpty ? (
                          <>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: '#6941db',
                              background: 'rgba(105, 65, 219, 0.1)',
                              padding: '3px 6px',
                              borderRadius: '5px',
                              width: 'fit-content'
                            }}>
                              <FaDoorOpen style={{ fontSize: '0.65rem' }} />
                              {slot.roomNumber}
                            </div>

                            <div style={{
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              color: '#111827',
                              textAlign: 'center',
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              lineHeight: '1.3',
                              padding: '4px 8px',
                              wordBreak: 'break-word',
                              hyphens: 'auto'
                            }}>
                              {expandCourseName(slot.course)}
                            </div>

                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: '#6b7280',
                              background: 'rgba(107, 114, 128, 0.08)',
                              padding: '3px 6px',
                              borderRadius: '5px'
                            }}>
                              <FaChalkboardTeacher style={{ fontSize: '0.65rem' }} />
                              {slot.instructorName || slot.teacher}
                            </div>
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyTimetableGrid;
