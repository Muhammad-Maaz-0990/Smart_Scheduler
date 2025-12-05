import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import '../Dashboard.css';

function GenerateTimetable() {
  const navigate = useNavigate();
  const { instituteObjectId } = useAuth();
  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [roomClassMap, setRoomClassMap] = useState({}); // single class per Class-room
  const [roomLabMap, setRoomLabMap] = useState({}); // multiple classes per Lab-room
  const [classCoursesMap, setClassCoursesMap] = useState({});
  const [courseTeacherMap, setCourseTeacherMap] = useState({}); // Key: "classId_courseId", Value: teacherId
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [candidates, setCandidates] = useState([]); // array of { header, details }
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(null);
  const [breakStart, setBreakStart] = useState('12:00');
  const [breakEnd, setBreakEnd] = useState('13:00');
  const [noBreak, setNoBreak] = useState(false);
  const [slotMinutes, setSlotMinutes] = useState(60);

  // Fetch rooms, classes, courses, teachers once instituteObjectId is available
  useEffect(() => {
    const run = async () => {
      try {
        if (!instituteObjectId) return;
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        const commonHeaders = {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        // Rooms
        const roomsRes = await fetch(`http://localhost:5000/api/rooms/${instituteObjectId}`, { headers: commonHeaders });
        if (roomsRes.ok) {
          const data = await roomsRes.json();
          setRooms(Array.isArray(data) ? data : (data?.rooms || []));
        } else {
          // fallback to query style
          const roomsResQ = await fetch(`http://localhost:5000/api/rooms?instituteID=${instituteObjectId}`, { headers: commonHeaders });
          const dataQ = roomsResQ.ok ? await roomsResQ.json() : [];
          setRooms(Array.isArray(dataQ) ? dataQ : (dataQ?.rooms || []));
        }

        // Classes
        const classesRes = await fetch(`http://localhost:5000/api/classes/${instituteObjectId}`, { headers: commonHeaders });
        if (classesRes.ok) {
          const data = await classesRes.json();
          setClasses(Array.isArray(data) ? data : (data?.classes || []));
        } else {
          const classesResQ = await fetch(`http://localhost:5000/api/classes?instituteID=${instituteObjectId}`, { headers: commonHeaders });
          const dataQ = classesResQ.ok ? await classesResQ.json() : [];
          setClasses(Array.isArray(dataQ) ? dataQ : (dataQ?.classes || []));
        }

        // Courses
        const coursesRes = await fetch(`http://localhost:5000/api/courses/${instituteObjectId}`, { headers: commonHeaders });
        if (coursesRes.ok) {
          const data = await coursesRes.json();
          setCourses(Array.isArray(data) ? data : (data?.courses || []));
        } else {
          const coursesResQ = await fetch(`http://localhost:5000/api/courses?instituteID=${instituteObjectId}`, { headers: commonHeaders });
          const dataQ = coursesResQ.ok ? await coursesResQ.json() : [];
          setCourses(Array.isArray(dataQ) ? dataQ : (dataQ?.courses || []));
        }

        // Teachers: backend exposes /api/users/institute for Admin; filter by designation
        const teachersRes = await fetch(`http://localhost:5000/api/users/institute`, { headers: commonHeaders });
        if (teachersRes.ok) {
          const data = await teachersRes.json();
          const list = Array.isArray(data) ? data : (data?.users || []);
          setTeachers(list.filter(u => (u.designation || '').toLowerCase() === 'teacher'));
        } else {
          setTeachers([]);
        }
      } catch (e) {
        console.error(e);
        setError('Failed to load institute data');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [instituteObjectId]);

  const handleRoomToggle = (roomId) => {
    setSelectedRooms((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const handleClassSelect = (roomId, classId) => {
    const roomObj = rooms.find(r => r._id === roomId);
    const status = roomObj?.roomStatus || 'Class';

    if (status === 'Lab') {
      // toggle multi-select for lab room
      setRoomLabMap((prev) => {
        const current = prev[roomId] || [];
        const exists = current.includes(classId);
        const updated = exists ? current.filter(id => id !== classId) : [...current, classId];
        return { ...prev, [roomId]: updated };
      });
      return;
    }

    // Class room: allow only one class, and prevent same class assigned to another Class room
    const alreadyAssignedClassRoom = Object.entries(roomClassMap).find(([rId, cId]) => cId === classId && rId !== roomId);
    if (alreadyAssignedClassRoom) {
      alert('This class is already assigned to another class room');
      return;
    }
    setRoomClassMap((prev) => ({ ...prev, [roomId]: classId }));
  };

  const handleLabRemove = (roomId, classId) => {
    setRoomLabMap(prev => ({
      ...prev,
      [roomId]: (prev[roomId] || []).filter(id => id !== classId)
    }));
  };

  const handleCourseToggle = (classId, courseId) => {
    setClassCoursesMap((prev) => {
      const currentCourses = prev[classId] || [];
      const updated = currentCourses.includes(courseId)
        ? currentCourses.filter((id) => id !== courseId)
        : [...currentCourses, courseId];
      return { ...prev, [classId]: updated };
    });
  };

  const handleTeacherSelect = (classId, courseId, teacherId) => {
    const key = `${classId}_${courseId}`;
    setCourseTeacherMap((prev) => ({
      ...prev,
      [key]: teacherId,
    }));
  };

  const isClassSelectedInAnyLab = (classId) => {
    return Object.entries(roomLabMap).some(([roomId, classIds]) => Array.isArray(classIds) && classIds.includes(classId));
  };

  const handleNext = () => {
    if (step === 1 && selectedRooms.length === 0) {
      alert('Please select at least one room');
      return;
    }
    if (step === 2) {
      // Validate room assignments: Class rooms must have one class; Lab rooms must have at least one selected class
      const missing = selectedRooms.find((roomId) => {
        const roomObj = rooms.find(r => r._id === roomId);
        const status = roomObj?.roomStatus || 'Class';
        if (status === 'Lab') {
          return !roomLabMap[roomId] || roomLabMap[roomId].length === 0;
        }
        return !roomClassMap[roomId];
      });
      if (missing) {
        alert('Assign classes: one for each Class room, and at least one for each Lab');
        return;
      }
    }
    if (step === 3) {
      const assignedClasses = Object.values(roomClassMap);
      const missingCourses = assignedClasses.find((classId) => !classCoursesMap[classId] || classCoursesMap[classId].length === 0);
      if (missingCourses) {
        alert('Please assign at least one course to each class');
        return;
      }
    }
    if (step === 4) {
      // Validate that each class-course combination has a teacher
      const assignedClasses = Object.values(roomClassMap);
      for (const classId of assignedClasses) {
        const coursesForClass = classCoursesMap[classId] || [];
        for (const courseId of coursesForClass) {
          const key = `${classId}_${courseId}`;
          if (!courseTeacherMap[key]) {
            alert('Please assign a teacher to each course for each class');
            return;
          }
        }
      }
    }
    if (step === 5) {
      // Validate break times unless noBreak selected
      if (!noBreak) {
        if (!breakStart || !breakEnd) {
          alert('Please set break start and end times or choose No Break');
          return;
        }
        if (breakStart >= breakEnd) {
          alert('Break end time must be after start time');
          return;
        }
      }
      // Validate slotMinutes
      if (!Number.isFinite(Number(slotMinutes)) || Number(slotMinutes) < 30) {
        alert('Lecture duration must be at least 30 minutes');
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleGenerate = () => {
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');

        // Build payload expected by backend generator
        const allClasses = [];
        const assignments = [];
        const allRoomNumbers = [];
        const roomTypes = {};

        // Collect unique classes from both Class and Lab room assignments
        const uniqueClassIds = new Set();
        Object.values(roomClassMap).forEach(clsId => { if (clsId) uniqueClassIds.add(clsId); });
        Object.values(roomLabMap).forEach(clsIds => { 
          if (Array.isArray(clsIds)) clsIds.forEach(cid => { if (cid) uniqueClassIds.add(cid); });
        });

        uniqueClassIds.forEach(clsId => {
          const clsObj = classes.find(c => c._id === clsId);
          if (clsObj) {
            const className = `${clsObj.degree} ${clsObj.year}-${clsObj.section}`;
            if (!allClasses.includes(className)) allClasses.push(className);
          }
        });

        // Collect all rooms with type mapping
        selectedRooms.forEach((roomId) => {
          const roomObj = rooms.find(r => r._id === roomId);
          if (roomObj?.roomNumber && !allRoomNumbers.includes(roomObj.roomNumber)) {
            allRoomNumbers.push(roomObj.roomNumber);
            roomTypes[roomObj.roomNumber] = roomObj.roomType === 'Lab' ? 'Lab' : 'Class';
          }
        });

        // Collect per-class assignments (course + instructor)
        uniqueClassIds.forEach(clsId => {
          const clsObj = classes.find(c => c._id === clsId);
          const className = clsObj ? `${clsObj.degree} ${clsObj.year}-${clsObj.section}` : undefined;
          const courseIds = (classCoursesMap[clsId] || []);

          courseIds.forEach(cid => {
            const cObj = courses.find(c => c._id === cid);
            const teacherId = courseTeacherMap[`${clsId}_${cid}`];
            const tObj = teachers.find(t => t._id === teacherId);

            const courseType = (cObj?.courseType === 'Lab' || /lab/i.test(cObj?.courseTitle || '')) ? 'Lab' : 'Lecture';
            const courseName = cObj?.courseTitle || 'Course';
            const creditHours = courseType === 'Lab' ? 3 : (Number(cObj?.creditHours) || 1);
            const instructorName = tObj?.userName || 'Instructor';

            if (className) {
              assignments.push({
                class: className,
                course: courseName,
                type: courseType,
                creditHours,
                instructor: instructorName
              });
            }
          });
        });

        const currentYear = new Date().getFullYear();
        // Use admin-selected lecture duration from Step 5
        const selectedSlotMinutes = Number(slotMinutes) || 60;
        const body = {
          instituteID: instituteObjectId,
          session: `${currentYear}-${currentYear + 1}`,
          year: currentYear,
          classes: allClasses,
          assignments,
          rooms: allRoomNumbers,
          roomTypes,
          timeslots: [
            { day: 'Mon', start: '08:00', end: '09:00' },
            { day: 'Mon', start: '09:00', end: '10:00' },
            { day: 'Mon', start: '10:00', end: '11:00' },
            { day: 'Mon', start: '11:00', end: '12:00' },
            { day: 'Mon', start: '13:00', end: '14:00' },
            { day: 'Mon', start: '14:00', end: '15:00' },
            { day: 'Mon', start: '15:00', end: '16:00' },
            { day: 'Tue', start: '08:00', end: '09:00' },
            { day: 'Tue', start: '09:00', end: '10:00' },
            { day: 'Tue', start: '10:00', end: '11:00' },
            { day: 'Tue', start: '11:00', end: '12:00' },
            { day: 'Tue', start: '13:00', end: '14:00' },
            { day: 'Tue', start: '14:00', end: '15:00' },
            { day: 'Tue', start: '15:00', end: '16:00' },
            { day: 'Wed', start: '08:00', end: '09:00' },
            { day: 'Wed', start: '09:00', end: '10:00' },
            { day: 'Wed', start: '10:00', end: '11:00' },
            { day: 'Wed', start: '11:00', end: '12:00' },
            { day: 'Wed', start: '13:00', end: '14:00' },
            { day: 'Wed', start: '14:00', end: '15:00' },
            { day: 'Wed', start: '15:00', end: '16:00' },
            { day: 'Thu', start: '08:00', end: '09:00' },
            { day: 'Thu', start: '09:00', end: '10:00' },
            { day: 'Thu', start: '10:00', end: '11:00' },
            { day: 'Thu', start: '11:00', end: '12:00' },
            { day: 'Thu', start: '13:00', end: '14:00' },
            { day: 'Thu', start: '14:00', end: '15:00' },
            { day: 'Thu', start: '15:00', end: '16:00' },
            { day: 'Fri', start: '08:00', end: '09:00' },
            { day: 'Fri', start: '09:00', end: '10:00' },
            { day: 'Fri', start: '10:00', end: '11:00' },
            { day: 'Fri', start: '11:00', end: '12:00' },
            { day: 'Fri', start: '13:00', end: '14:00' },
            { day: 'Fri', start: '14:00', end: '15:00' },
            { day: 'Fri', start: '15:00', end: '16:00' },
          ],
          breaks: (!noBreak && breakStart && breakEnd)
            ? { mode: 'same', same: { start: breakStart, end: breakEnd } }
            : { mode: 'none' },
          slotMinutes: selectedSlotMinutes,
        };

        const res = await fetch('http://localhost:5000/api/timetables-gen/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          // Try to extract structured Python clash details forwarded by backend
          let msg = 'Failed to generate timetables';
          try {
            const dataErr = await res.json();
            if (dataErr && dataErr.message) {
              if (typeof dataErr.message === 'string') {
                msg = dataErr.message;
              } else {
                // message could be an object propagated from Python detail
                msg = JSON.stringify(dataErr.message);
              }
            }
          } catch (_) {
            const txt = await res.text();
            if (txt) msg = txt;
          }
          throw new Error(msg);
        }
        const data = await res.json();
        const list = Array.isArray(data?.candidates) ? data.candidates : (Array.isArray(data) ? data : []);
        if (!list.length) {
          throw new Error('No candidates returned');
        }
        setCandidates(list);
        setSelectedCandidateIndex(0);
        setStep(7); // show candidates selection step
      } catch (e) {
        console.error(e);
        // If Python provided structured detail JSON string, try to prettify for UI
        let msg = e.message || 'Generation failed';
        try {
          const parsed = JSON.parse(msg);
          if (parsed && parsed.message) {
            const head = typeof parsed.message === 'string' ? parsed.message : 'Scheduling failed';
            const failed = Array.isArray(parsed.failedTasks) ? parsed.failedTasks.slice(0,3).map(ft => `${ft.class} • ${ft.course} (${ft.type})`).join('; ') : '';
            const missing = Array.isArray(parsed.missing) ? parsed.missing.slice(0,3).map(m => `${m.class} • ${m.course} exp:${m.expected} got:${m.actual}`).join('; ') : '';
            const clashes = Array.isArray(parsed.clashes) ? parsed.clashes.slice(0,3).map(c => `${c.day} ${Array.isArray(c.time)?c.time.join(', '):c.time} • ${c.class} • ${c.room}`).join('; ') : '';
            msg = [head, failed && `Failed: ${failed}`, missing && `Missing: ${missing}`, clashes && `Clashes: ${clashes}`].filter(Boolean).join('\n');
          }
        } catch(_) {}
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    run();
  };

  // eslint-disable-next-line no-unused-vars
  const assignedClasses = Array.from(new Set([
    ...Object.values(roomClassMap),
    ...Object.values(roomLabMap).flat()
  ].filter(Boolean)));

  return (
    <>
      <Sidebar activeMenu="timetables" />
      <div className="dashboard-page">
        <div className="bg-animation">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
        <div className="dashboard-content" style={{ background: '#fff', minHeight: '100vh', padding: '32px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
                Generate Timetable
              </h1>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Follow the steps to configure and generate your institute timetable
              </p>
              {error && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontSize: '14px' }}>
                  {error}
                </div>
              )}
            </div>

            {/* Progress Steps */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', gap: '16px' }}>
              {[
                { num: 1, label: 'Select Rooms' },
                { num: 2, label: 'Assign Classes' },
                { num: 3, label: 'Assign Courses' },
                { num: 4, label: 'Assign Teachers' },
                { num: 5, label: 'Set Break Time' },
                { num: 6, label: 'Review & Generate' },
                { num: 7, label: 'Select Candidate' },
              ].map((s, idx) => (
                <React.Fragment key={s.num}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: step >= s.num ? '#7c3aed' : '#e5e7eb',
                        color: step >= s.num ? '#fff' : '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '16px',
                      }}
                    >
                      {s.num}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: step >= s.num ? '#7c3aed' : '#9ca3af' }}>
                        {s.label}
                      </div>
                    </div>
                  </div>
                  {idx < 6 && (
                    <div
                      style={{
                        flex: 1,
                        height: '2px',
                        background: step > s.num ? '#7c3aed' : '#e5e7eb',
                      }}
                    ></div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Step Content */}
            <div
              style={{
                background: '#fff',
                border: '2px solid #e5e7eb',
                borderRadius: '16px',
                padding: '32px',
                minHeight: '400px',
              }}
            >
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                  <div style={{ fontSize: '18px', marginBottom: '8px' }}>Loading data...</div>
                  <div style={{ fontSize: '14px' }}>Please wait</div>
                </div>
              ) : (
                <>
              {/* Step 1: Select Rooms */}
              {step === 1 && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
                    Step 1: Select Rooms
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                    Choose the rooms you want to include in the timetable generation
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                    {rooms.length === 0 ? (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        No rooms found for your institute
                      </div>
                    ) : (
                      rooms.map((room) => (
                        <div
                          key={room._id}
                          onClick={() => handleRoomToggle(room._id)}
                          style={{
                            border: selectedRooms.includes(room._id) ? '3px solid #7c3aed' : '2px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '20px',
                            cursor: 'pointer',
                            background: selectedRooms.includes(room._id) ? '#f5f3ff' : '#fff',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1f2937' }}>{room.roomNumber}</div>
                            {selectedRooms.includes(room._id) && (
                              <div style={{ color: '#7c3aed', fontSize: '20px' }}>✓</div>
                            )}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            {room.roomStatus || 'Class'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Assign Classes */}
              {step === 2 && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
                    Step 2: Assign Classes to Rooms
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                    Assign one class per Class room. Labs can have multiple classes.
                  </p>
                  {/* Class Rooms */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', marginBottom: '12px' }}>Class Rooms</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {selectedRooms.filter(rid => (rooms.find(r => r._id === rid)?.roomStatus || 'Class') === 'Class').length === 0 ? (
                        <div style={{ color: '#6b7280', fontSize: '14px' }}>No class rooms selected</div>
                      ) : (
                        selectedRooms.filter(rid => (rooms.find(r => r._id === rid)?.roomStatus || 'Class') === 'Class').map((roomId) => {
                          const room = rooms.find((r) => r._id === roomId);
                          return (
                            <div key={roomId} style={{ border: '2px solid #e5e7eb', borderRadius: '12px', padding: '20px', background: '#fff' }}>
                              <div style={{ fontSize: '16px', fontWeight: 700, color: '#7c3aed', marginBottom: '12px' }}>
                                {room?.roomNumber} (Class)
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>Select Class</label>
                                <select
                                  value={roomClassMap[roomId] || ''}
                                  onChange={(e) => handleClassSelect(roomId, e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    color: '#111827'
                                  }}
                                >
                                  <option value="">-- Select a class --</option>
                                  {classes.map(cls => (
                                    <option key={cls._id} value={cls._id}>{`${cls.degree} ${cls.year}-${cls.section}`}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Lab Rooms */}
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', marginBottom: '12px' }}>Lab Rooms</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {selectedRooms.filter(rid => (rooms.find(r => r._id === rid)?.roomStatus || 'Class') === 'Lab').length === 0 ? (
                        <div style={{ color: '#6b7280', fontSize: '14px' }}>No lab rooms selected</div>
                      ) : (
                        selectedRooms.filter(rid => (rooms.find(r => r._id === rid)?.roomStatus || 'Class') === 'Lab').map((roomId) => {
                          const room = rooms.find((r) => r._id === roomId);
                          const selectedForLab = roomLabMap[roomId] || [];
                          return (
                            <div key={roomId} style={{ border: '2px solid #e5e7eb', borderRadius: '12px', padding: '20px', background: '#fff' }}>
                              <div style={{ fontSize: '16px', fontWeight: 700, color: '#7c3aed', marginBottom: '12px' }}>
                                {room?.roomNumber} (Lab)
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>Select Class(es)</label>
                                <select
                                  multiple
                                  value={selectedForLab}
                                  onChange={(e) => {
                                    const opts = Array.from(e.target.selectedOptions).map(o => o.value);
                                    setRoomLabMap(prev => ({ ...prev, [roomId]: opts }));
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    minHeight: '100px',
                                    color: '#111827'
                                  }}
                                >
                                  {classes.map(cls => (
                                    <option key={cls._id} value={cls._id}>{`${cls.degree} ${cls.year}-${cls.section}`}</option>
                                  ))}
                                </select>

                                {/* Chips */}
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                                  {selectedForLab.length === 0 ? (
                                    <div style={{ color: '#6b7280', fontSize: '13px' }}>No classes selected</div>
                                  ) : (
                                    selectedForLab.map(cid => {
                                      const cls = classes.find(c => c._id === cid);
                                      const label = cls ? `${cls.degree} ${cls.year}-${cls.section}` : cid;
                                      return (
                                        <div key={cid} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#eef2ff', color: '#1f2937', border: '1px solid #c7d2fe', borderRadius: '999px', padding: '6px 10px' }}>
                                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{label}</span>
                                          <button onClick={() => handleLabRemove(roomId, cid)} style={{ border: 'none', background: 'transparent', color: '#6b7280', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Assign Courses */}
              {step === 3 && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
                    Step 3: Assign Courses to Classes
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                    Select courses in two sections: Class Rooms show theory courses; Lab Rooms show lab courses. If a class is in both, select in both sections.
                  </p>

                  {/* Class Rooms Section */}
                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', marginBottom: '12px' }}>Class Rooms</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {Object.entries(roomClassMap).filter(([, cId]) => !!cId).length === 0 ? (
                        <div style={{ color: '#6b7280', fontSize: '14px' }}>No classes assigned to Class rooms</div>
                      ) : (
                        Object.entries(roomClassMap).filter(([, cId]) => !!cId).map(([rId, classId]) => {
                          const cls = classes.find(c => c._id === classId);
                          const roomNumber = rooms.find(r => r._id === rId)?.roomNumber;
                          const availableCourses = courses.filter(c => !(c.courseType === 'Lab' || /lab/i.test(c.courseTitle || '')));
                          return (
                            <div key={`${rId}-${classId}`} style={{ border: '2px solid #e5e7eb', borderRadius: '12px', padding: '20px', background: '#fff' }}>
                              <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '16px', fontWeight: 700, color: '#7c3aed' }}>
                                  {cls ? `${cls.degree} ${cls.year}-${cls.section}` : 'Unknown Class'}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6b7280' }}>Room: {roomNumber}</div>
                              </div>
                              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {availableCourses.length === 0 ? (
                                  <div style={{ color: '#6b7280', fontSize: '14px' }}>No courses available</div>
                                ) : (
                                  availableCourses.map((course) => (
                                    <button
                                      key={course._id}
                                      onClick={() => handleCourseToggle(classId, course._id)}
                                      style={{
                                        padding: '10px 16px',
                                        border: (classCoursesMap[classId] || []).includes(course._id) ? '2px solid #7c3aed' : '2px solid #e5e7eb',
                                        borderRadius: '8px',
                                        background: (classCoursesMap[classId] || []).includes(course._id) ? '#7c3aed' : '#fff',
                                        color: (classCoursesMap[classId] || []).includes(course._id) ? '#fff' : '#374151',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        transition: 'all 0.2s',
                                      }}
                                    >
                                      {course.courseTitle}
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Lab Rooms Section */}
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', marginBottom: '12px' }}>Lab Rooms</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {Object.entries(roomLabMap).filter(([, arr]) => Array.isArray(arr) && arr.length > 0).length === 0 ? (
                        <div style={{ color: '#6b7280', fontSize: '14px' }}>No classes assigned to Lab rooms</div>
                      ) : (
                        Object.entries(roomLabMap).flatMap(([rId, arr]) => arr.map(classId => ({ rId, classId }))).map(({ rId, classId }) => {
                          const cls = classes.find(c => c._id === classId);
                          const roomNumber = rooms.find(r => r._id === rId)?.roomNumber;
                          const availableCourses = courses.filter(c => (c.courseType === 'Lab' || /lab/i.test(c.courseTitle || '')));
                          return (
                            <div key={`${rId}-${classId}`} style={{ border: '2px solid #e5e7eb', borderRadius: '12px', padding: '20px', background: '#fff' }}>
                              <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '16px', fontWeight: 700, color: '#7c3aed' }}>
                                  {cls ? `${cls.degree} ${cls.year}-${cls.section}` : 'Unknown Class'}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6b7280' }}>Room: {roomNumber} (Lab)</div>
                                {Object.values(roomClassMap).includes(classId) && (
                                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                                    This class is also in a Class room. Select theory courses in the Class Rooms section above.
                                  </div>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {availableCourses.length === 0 ? (
                                  <div style={{ color: '#6b7280', fontSize: '14px' }}>No lab courses available</div>
                                ) : (
                                  availableCourses.map((course) => (
                                    <button
                                      key={course._id}
                                      onClick={() => handleCourseToggle(classId, course._id)}
                                      style={{
                                        padding: '10px 16px',
                                        border: (classCoursesMap[classId] || []).includes(course._id) ? '2px solid #7c3aed' : '2px solid #e5e7eb',
                                        borderRadius: '8px',
                                        background: (classCoursesMap[classId] || []).includes(course._id) ? '#7c3aed' : '#fff',
                                        color: (classCoursesMap[classId] || []).includes(course._id) ? '#fff' : '#374151',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        transition: 'all 0.2s',
                                      }}
                                    >
                                      {course.courseTitle}
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Assign Teachers */}
              {step === 4 && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
                    Step 4: Assign Teachers to Courses
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                    Assign one teacher to each course for each class (same course can have different teachers for different classes)
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {(() => {
                      const assignedClassesLocal = Array.from(new Set([
                        ...Object.values(roomClassMap),
                        ...Object.values(roomLabMap).flat()
                      ].filter(Boolean)));
                      
                      return assignedClassesLocal.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                          No classes assigned
                        </div>
                      ) : (
                        assignedClassesLocal.map((classId) => {
                          const cls = classes.find((c) => c._id === classId);
                          const classInLab = isClassSelectedInAnyLab(classId);
                          const classInClassRoom = Object.values(roomClassMap).includes(classId);
                          const allSelectedCourses = (classCoursesMap[classId] || []);
                          const labCourseIds = allSelectedCourses.filter(cid => {
                            const cObj = courses.find(c => c._id === cid);
                            return cObj && (cObj.courseType === 'Lab' || /lab/i.test(cObj.courseTitle || ''));
                          });
                          const theoryCourseIds = allSelectedCourses.filter(cid => {
                            const cObj = courses.find(c => c._id === cid);
                            return cObj && !(cObj.courseType === 'Lab' || /lab/i.test(cObj.courseTitle || ''));
                          });
                          const roomEntry = Object.entries(roomClassMap).find(([, cId]) => cId === classId) ||
                                            Object.entries(roomLabMap).find(([rId, arr]) => Array.isArray(arr) && arr.includes(classId));
                          const roomName = roomEntry ? (rooms.find(r => r._id === roomEntry[0])?.roomNumber || 'Unknown') : 'Unknown';

                          return (
                            <div
                              key={classId}
                              style={{
                                border: '2px solid #e5e7eb',
                                borderRadius: '12px',
                                padding: '20px',
                                background: '#fff',
                              }}
                            >
                              <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                                <div style={{ fontSize: '18px', fontWeight: 700, color: '#7c3aed' }}>
                                  {cls ? `${cls.degree} ${cls.year}-${cls.section}` : 'Unknown Class'}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                                  Room: {roomName}
                                </div>
                              </div>
                              {/* Theory Section (Class room) */}
                              {classInClassRoom && (
                                <div style={{ marginBottom: '12px' }}>
                                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>Theory Courses</div>
                                  {theoryCourseIds.length === 0 ? (
                                    <div style={{ color: '#6b7280', fontSize: '14px' }}>No theory courses selected</div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                      {theoryCourseIds.map((courseId) => {
                                        const course = courses.find((c) => c._id === courseId);
                                        const key = `${classId}_${courseId}`;
                                        return (
                                          <div key={courseId} style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>📚 {course?.courseTitle || 'Unknown Course'}</div>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                              {teachers.length === 0 ? (
                                                <div style={{ color: '#6b7280', fontSize: '13px' }}>No teachers available</div>
                                              ) : (
                                                teachers.map((teacher) => (
                                                  <button
                                                    key={teacher._id}
                                                    onClick={() => handleTeacherSelect(classId, courseId, teacher._id)}
                                                    style={{
                                                      padding: '8px 14px',
                                                      border: courseTeacherMap[key] === teacher._id ? '2px solid #7c3aed' : '2px solid #e5e7eb',
                                                      borderRadius: '6px',
                                                      background: courseTeacherMap[key] === teacher._id ? '#7c3aed' : '#fff',
                                                      color: courseTeacherMap[key] === teacher._id ? '#fff' : '#374151',
                                                      cursor: 'pointer',
                                                      fontWeight: 600,
                                                      fontSize: '13px',
                                                      transition: 'all 0.2s',
                                                    }}
                                                  >
                                                    {teacher.userName}
                                                  </button>
                                                ))
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Lab Section */}
                              {classInLab && (
                                <div>
                                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>Lab Courses</div>
                                  {labCourseIds.length === 0 ? (
                                    <div style={{ color: '#6b7280', fontSize: '14px' }}>No lab courses selected</div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                      {labCourseIds.map((courseId) => {
                                        const course = courses.find((c) => c._id === courseId);
                                        const key = `${classId}_${courseId}`;
                                        return (
                                          <div key={courseId} style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>📚 {course?.courseTitle || 'Unknown Course'}</div>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                              {teachers.length === 0 ? (
                                                <div style={{ color: '#6b7280', fontSize: '13px' }}>No teachers available</div>
                                              ) : (
                                                teachers.map((teacher) => (
                                                  <button
                                                    key={teacher._id}
                                                    onClick={() => handleTeacherSelect(classId, courseId, teacher._id)}
                                                    style={{
                                                      padding: '8px 14px',
                                                      border: courseTeacherMap[key] === teacher._id ? '2px solid #7c3aed' : '2px solid #e5e7eb',
                                                      borderRadius: '6px',
                                                      background: courseTeacherMap[key] === teacher._id ? '#7c3aed' : '#fff',
                                                      color: courseTeacherMap[key] === teacher._id ? '#fff' : '#374151',
                                                      cursor: 'pointer',
                                                      fontWeight: 600,
                                                      fontSize: '13px',
                                                      transition: 'all 0.2s',
                                                    }}
                                                  >
                                                    {teacher.userName}
                                                  </button>
                                                ))
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Step 5: Set Break Time */}
              {step === 5 && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
                    Step 5: Set Break Time
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                    Configure the break window for the timetable
                  </p>

                  <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div
                      style={{
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '32px',
                        background: '#f9fafb',
                      }}
                    >
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                          <input type="checkbox" checked={noBreak} onChange={(e) => setNoBreak(e.target.checked)} />
                          No Break for this timetable
                        </label>
                      </div>
                      <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                          Break Start Time
                        </label>
                        <input
                          type="time"
                          value={breakStart}
                          onChange={(e) => setBreakStart(e.target.value)}
                          disabled={noBreak}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#1f2937',
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                          Break End Time
                        </label>
                        <input
                          type="time"
                          value={breakEnd}
                          onChange={(e) => setBreakEnd(e.target.value)}
                          disabled={noBreak}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#1f2937',
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                          Lecture Duration (minutes)
                        </label>
                        <input
                          type="number"
                          min={30}
                          step={5}
                          value={slotMinutes}
                          onChange={(e) => setSlotMinutes(Number(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#1f2937',
                          }}
                        />
                      </div>

                      <div
                        style={{
                          padding: '16px',
                          background: '#fff7ed',
                          border: '1px solid #fed7aa',
                          borderRadius: '8px',
                          marginTop: '20px',
                        }}
                      >
                        <div style={{ fontSize: '14px', color: '#9a3412', fontWeight: 600, marginBottom: '4px' }}>
                          ⏰ Break Duration
                        </div>
                        <div style={{ fontSize: '18px', color: '#7c2d12', fontWeight: 700 }}>
                          {noBreak ? 'No Break' : (breakStart && breakEnd ? `${breakStart} - ${breakEnd}` : 'Not set')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Review & Generate */}
              {step === 6 && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
                    Step 6: Review & Generate
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                    Review your selections before generating the timetable
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {selectedRooms.map((roomId) => {
                      const room = rooms.find((r) => r._id === roomId);
                      const status = room?.roomStatus || 'Class';
                      const classIds = status === 'Lab' ? (roomLabMap[roomId] || []) : ([roomClassMap[roomId]].filter(Boolean));
                      const byClass = classIds.map(cid => ({
                        classId: cid,
                        cls: classes.find(c => c._id === cid),
                        selectedIds: (classCoursesMap[cid] || [])
                      }));

                      return (
                        <div key={roomId} style={{ border: '2px solid #e5e7eb', borderRadius: '12px', padding: '20px', background: '#f9fafb' }}>
                          <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
                            <div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Room</div>
                              <div style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>{room?.roomNumber}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Class(es)</div>
                              <div style={{ fontSize: '16px', fontWeight: 700, color: '#7c3aed' }}>
                                {byClass.length === 0 ? 'N/A' : byClass.map(x => x.cls ? `${x.cls.degree} ${x.cls.year}-${x.cls.section}` : 'Unknown').join(', ')}
                              </div>
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Courses & Teachers</div>
                            {byClass.length === 0 ? (
                              <div style={{ color: '#6b7280', fontSize: '14px' }}>No courses selected</div>
                            ) : (
                              byClass.map(({ classId: cid, cls, selectedIds }) => {
                                const classInLab = Object.entries(roomLabMap).some(([_, arr]) => Array.isArray(arr) && arr.includes(cid));
                                const classInClassRoom = Object.values(roomClassMap).includes(cid);
                                const uniqueIds = Array.from(new Set(selectedIds));
                                const labCourses = uniqueIds.map(id => courses.find(c => c._id === id)).filter(c => c && ((c.courseType === 'Lab') || /lab/i.test(c.courseTitle || '')));
                                const theoryCourses = uniqueIds.map(id => courses.find(c => c._id === id)).filter(c => c && !((c.courseType === 'Lab') || /lab/i.test(c.courseTitle || '')));

                                return (
                                  <div key={cid} style={{ marginBottom: '16px' }}>
                                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>{cls ? `${cls.degree} ${cls.year}-${cls.section}` : 'Class'}</div>

                                    {classInClassRoom && status === 'Class' && (
                                      <div style={{ marginBottom: '10px' }}>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Theory Courses</div>
                                        {theoryCourses.length === 0 ? (
                                          <div style={{ color: '#6b7280', fontSize: '14px' }}>No theory courses selected</div>
                                        ) : (
                                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {theoryCourses.map(course => {
                                              const key = `${cid}_${course._id}`;
                                              const teacher = teachers.find(t => t._id === courseTeacherMap[key]);
                                              return (
                                                <div key={course._id} style={{ padding: '8px 12px', background: '#7c3aed', color: '#fff', borderRadius: '6px', fontSize: '13px' }}>
                                                  <div style={{ fontWeight: 700 }}>{course.courseTitle}</div>
                                                  <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.9 }}>👨‍🏫 {teacher?.userName || 'No teacher'}</div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {classInLab && status === 'Lab' && (
                                      <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Lab Courses</div>
                                        {labCourses.length === 0 ? (
                                          <div style={{ color: '#6b7280', fontSize: '14px' }}>No lab courses selected</div>
                                        ) : (
                                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {labCourses.map(course => {
                                              const key = `${cid}_${course._id}`;
                                              const teacher = teachers.find(t => t._id === courseTeacherMap[key]);
                                              return (
                                                <div key={course._id} style={{ padding: '8px 12px', background: '#7c3aed', color: '#fff', borderRadius: '6px', fontSize: '13px' }}>
                                                  <div style={{ fontWeight: 700 }}>{course.courseTitle}</div>
                                                  <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.9 }}>👨‍🏫 {teacher?.userName || 'No teacher'}</div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 7: Select Candidate */}
              {step === 7 && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
                    Step 7: Select a Timetable Candidate
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                    Review the generated candidates and choose one to save.
                  </p>
                  {candidates.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      No candidates available. Go back and try again.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                      {candidates.map((cand, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedCandidateIndex(idx)}
                          style={{
                            border: selectedCandidateIndex === idx ? '3px solid #10b981' : '2px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '16px',
                            background: selectedCandidateIndex === idx ? '#ecfeff' : '#fff',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ fontWeight: 700, color: '#1f2937' }}>Candidate {idx + 1}</div>
                            {selectedCandidateIndex === idx && <div style={{ color: '#10b981' }}>✓ Selected</div>}
                          </div>
                          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                            {cand?.header?.session || 'Session'} • {cand?.header?.year || 'Year'}
                          </div>
                          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
                            {(cand?.details || []).map((d, i) => (
                              <div key={i} style={{ fontSize: '12px', color: '#374151', marginBottom: '6px' }}>
                                {d.day} {d.time} • {d.class} • {d.course} • {d.roomNumber}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              </>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
              <button
                onClick={handleBack}
                disabled={step === 1}
                style={{
                  padding: '12px 24px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  background: '#fff',
                  color: '#374151',
                  cursor: step === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  opacity: step === 1 ? 0.5 : 1,
                }}
              >
                Back
              </button>

              {/* Steps 1-5: Next */}
              {step >= 1 && step <= 5 && (
                <button
                  onClick={handleNext}
                  style={{
                    padding: '12px 32px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#7c3aed',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  Next
                </button>
              )}

              {/* Step 6: Generate */}
              {step === 6 && (
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  style={{
                    padding: '12px 32px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#7c3aed',
                    color: '#fff',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? 'Generating...' : 'Generate Timetable'}
                </button>
              )}

              {/* Step 7: Save */}
              {step === 7 && (
                <button
                  onClick={async () => {
                    try {
                      if (selectedCandidateIndex == null) {
                        alert('Please select a candidate first');
                        return;
                      }
                      setLoading(true);
                      setError('');
                      const token = localStorage.getItem('token');
                      const chosen = candidates[selectedCandidateIndex];
                      const res = await fetch('http://localhost:5000/api/timetables-gen/save', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({
                          instituteID: instituteObjectId,
                          // include session/year for compatibility with older backend versions
                          session: chosen.header?.session,
                          year: chosen.header?.year,
                          header: chosen.header,
                          details: chosen.details,
                        })
                      });
                      if (!res.ok) {
                        const txt = await res.text();
                        throw new Error(txt || 'Failed to save timetable');
                      }
                      alert('Timetable saved successfully');
                      navigate('/admin/timetables');
                    } catch (e) {
                      console.error(e);
                      setError(e.message || 'Save failed');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading || selectedCandidateIndex == null}
                  style={{
                    padding: '12px 32px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#10b981',
                    color: '#fff',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? 'Saving...' : 'Save Selected'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default GenerateTimetable;
