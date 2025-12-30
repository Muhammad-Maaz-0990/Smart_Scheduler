import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Container } from 'react-bootstrap';
import TimetableGrid from '../../components/shared/TimetableGrid';
import { apiUrl } from '../../utils/api';
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
  const [floorFilter, setFloorFilter] = useState('all');
  const [roomTypeFilter, setRoomTypeFilter] = useState('all');
  const [assignmentMode, setAssignmentMode] = useState('list'); // 'list' or 'graphic'
  const [draggedClass, setDraggedClass] = useState(null);
  const [selectedClassForAssignment, setSelectedClassForAssignment] = useState(null);
  const [activeClassTab, setActiveClassTab] = useState(null);
  const [activeTeacherClassTab, setActiveTeacherClassTab] = useState(null);
  const [activeRoomTypeTab, setActiveRoomTypeTab] = useState('classroom'); // 'classroom' or 'lab'
  const [activeCandidateTab, setActiveCandidateTab] = useState(0); // For Step 7 candidate tabs
  const [courseSearchQuery, setCourseSearchQuery] = useState(''); // Search query for courses
  const [courseSortBy, setCourseSortBy] = useState('title'); // 'title', 'code', 'credits'
  const [modalMessage, setModalMessage] = useState(''); // Modal message
  const [showModal, setShowModal] = useState(false); // Show/hide modal

  // Auto-scroll during drag
  useEffect(() => {
    if (!draggedClass) return;

    let scrollInterval;
    const handleDragMove = (e) => {
      const scrollThreshold = 100;
      const scrollSpeed = 10;
      const viewportHeight = window.innerHeight;
      const mouseY = e.clientY;

      if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
      }

      if (mouseY < scrollThreshold) {
        // Scroll up
        scrollInterval = setInterval(() => {
          window.scrollBy(0, -scrollSpeed);
        }, 16);
      } else if (mouseY > viewportHeight - scrollThreshold) {
        // Scroll down
        scrollInterval = setInterval(() => {
          window.scrollBy(0, scrollSpeed);
        }, 16);
      }
    };

    document.addEventListener('dragover', handleDragMove);

    return () => {
      document.removeEventListener('dragover', handleDragMove);
      if (scrollInterval) clearInterval(scrollInterval);
    };
  }, [draggedClass]);

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
        const roomsRes = await fetch(apiUrl(`/api/rooms/${instituteObjectId}`), { headers: commonHeaders });
        if (roomsRes.ok) {
          const data = await roomsRes.json();
          setRooms(Array.isArray(data) ? data : (data?.rooms || []));
        } else {
          // fallback to query style
          const roomsResQ = await fetch(apiUrl(`/api/rooms?instituteID=${instituteObjectId}`), { headers: commonHeaders });
          const dataQ = roomsResQ.ok ? await roomsResQ.json() : [];
          setRooms(Array.isArray(dataQ) ? dataQ : (dataQ?.rooms || []));
        }

        // Classes
        const classesRes = await fetch(apiUrl(`/api/classes/${instituteObjectId}`), { headers: commonHeaders });
        if (classesRes.ok) {
          const data = await classesRes.json();
          setClasses(Array.isArray(data) ? data : (data?.classes || []));
        } else {
          const classesResQ = await fetch(apiUrl(`/api/classes?instituteID=${instituteObjectId}`), { headers: commonHeaders });
          const dataQ = classesResQ.ok ? await classesResQ.json() : [];
          setClasses(Array.isArray(dataQ) ? dataQ : (dataQ?.classes || []));
        }

        // Courses
        const coursesRes = await fetch(apiUrl(`/api/courses/${instituteObjectId}`), { headers: commonHeaders });
        if (coursesRes.ok) {
          const data = await coursesRes.json();
          setCourses(Array.isArray(data) ? data : (data?.courses || []));
        } else {
          const coursesResQ = await fetch(apiUrl(`/api/courses?instituteID=${instituteObjectId}`), { headers: commonHeaders });
          const dataQ = coursesResQ.ok ? await coursesResQ.json() : [];
          setCourses(Array.isArray(dataQ) ? dataQ : (dataQ?.courses || []));
        }

        // Teachers: backend exposes /api/users/institute for Admin; filter by designation
        const teachersRes = await fetch(apiUrl('/api/users/institute'), { headers: commonHeaders });
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

  // Helper function to extract floor from room number
  const getFloorFromRoomNumber = (roomNumber) => {
    if (!roomNumber) return null;
    const upperRoom = roomNumber.toUpperCase();
    
    // Match patterns like F101, F205, G05, B206, B105, etc.
    // Extract floor: First letter + first digit only
    const match = upperRoom.match(/^([FGB])(\d)/);
    if (match) {
      const prefix = match[1];
      const floorNum = match[2];
      
      if (prefix === 'G') return 'G';
      if (prefix === 'F') return `F${floorNum}`;
      if (prefix === 'B') return `B${floorNum}`;
    }
    return null;
  };

  // Show modal function
  const showMessage = (message) => {
    setModalMessage(message);
    setShowModal(true);
  };

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
      showMessage('This class is already assigned to another class room');
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
      showMessage('Please select at least one room');
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
        showMessage('Assign classes: one for each Class room, and at least one for each Lab');
        return;
      }
    }
    if (step === 3) {
      const assignedClasses = Object.values(roomClassMap);
      const missingCourses = assignedClasses.find((classId) => !classCoursesMap[classId] || classCoursesMap[classId].length === 0);
      if (missingCourses) {
        showMessage('Please assign at least one course to each class');
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
            showMessage('Please assign a teacher to each course for each class');
            return;
          }
        }
      }
    }
    if (step === 5) {
      // Validate break times unless noBreak selected
      if (!noBreak) {
        if (!breakStart || !breakEnd) {
          showMessage('Please set break start and end times or choose No Break');
          return;
        }
        if (breakStart >= breakEnd) {
          showMessage('Break end time must be after start time');
          return;
        }
      }
      // Validate slotMinutes
      if (!Number.isFinite(Number(slotMinutes)) || Number(slotMinutes) < 30) {
        showMessage('Lecture duration must be at least 30 minutes');
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
        const classLabRooms = {}; // class name -> array of lab roomNumbers

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

        // Map lab room selections per class (by class name)
        uniqueClassIds.forEach(clsId => {
          const clsObj = classes.find(c => c._id === clsId);
          const className = clsObj ? `${clsObj.degree} ${clsObj.year}-${clsObj.section}` : undefined;
          if (!className) return;
          // find all selected lab rooms that include this class
          const labRoomNumbersForClass = Object.entries(roomLabMap)
            .filter(([rId, arr]) => Array.isArray(arr) && arr.includes(clsId))
            .map(([rId]) => rooms.find(r => r._id === rId)?.roomNumber)
            .filter(Boolean);
          if (labRoomNumbersForClass.length) {
            classLabRooms[className] = labRoomNumbersForClass;
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
          classLabRooms,
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

        const res = await fetch(apiUrl('/api/timetables-gen/generate'), {
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
    <Container fluid style={{ padding: 0, maxWidth: 'none', paddingLeft: '1rem', paddingRight: '1rem', paddingTop: '2rem', paddingBottom: '2rem', background: '#fff', minHeight: '100vh' }}>
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
                        borderRadius: '8px',
                        background: step >= s.num ? 'var(--theme-color)' : '#e5e7eb',
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
                      <div style={{ fontSize: '14px', fontWeight: 600, color: step >= s.num ? 'var(--theme-color)' : '#9ca3af' }}>
                        {s.label}
                      </div>
                    </div>
                  </div>
                  {idx < 6 && (
                    <div
                      style={{
                        flex: 1,
                        height: '2px',
                        background: step > s.num ? 'var(--theme-color)' : '#e5e7eb',
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
              {/* Action Buttons at Top */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px solid #e5e7eb' }}>
                <button
                  onClick={step === 1 ? () => navigate('/admin/timetables') : handleBack}
                  style={{
                    padding: '12px 24px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    background: '#fff',
                    color: '#374151',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  {step === 1 ? 'Return to Timetable Screen' : 'Back'}
                </button>

                {/* Steps 1-5: Next */}
                {step >= 1 && step <= 5 && (
                  <button
                    onClick={handleNext}
                    style={{
                      padding: '12px 32px',
                      border: 'none',
                      borderRadius: '8px',
                      background: 'var(--theme-color)',
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
                      background: 'var(--theme-color)',
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
                          showMessage('Please select a candidate first');
                          return;
                        }
                        setLoading(true);
                        setError('');
                        const token = localStorage.getItem('token');
                        const chosen = candidates[selectedCandidateIndex];
                        const res = await fetch(apiUrl('/api/timetables-gen/save'), {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                          },
                          body: JSON.stringify({
                            instituteObjectId,
                            header: chosen.header,
                            details: chosen.details,
                          })
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Failed to save timetable');
                        showMessage('Timetable saved successfully!');
                        setTimeout(() => navigate('/admin/timetables'), 1500);
                      } catch (e) {
                        console.error(e);
                        setError(e.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading || selectedCandidateIndex == null}
                    style={{
                      padding: '12px 32px',
                      border: 'none',
                      borderRadius: '8px',
                      background: 'var(--theme-color)',
                      color: '#fff',
                      cursor: (loading || selectedCandidateIndex == null) ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '14px',
                      opacity: (loading || selectedCandidateIndex == null) ? 0.6 : 1,
                    }}
                  >
                    {loading ? 'Saving...' : 'Save Timetable'}
                  </button>
                )}
              </div>

              {/* Step 1: Select Rooms */}
              {step === 1 && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
                    Step 1: Select Rooms
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                    Choose the rooms you want to include in the timetable generation
                  </p>

                  {/* Selected Rooms Summary */}
                  {selectedRooms.length > 0 && (
                    <div style={{ 
                      marginBottom: '32px', 
                      padding: '24px', 
                      background: '#f9fafb', 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '12px' 
                    }}>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: 700, 
                        color: '#1f2937', 
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        Selected Rooms ({selectedRooms.length})
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* Classrooms Section */}
                        {(() => {
                          const selectedClassrooms = selectedRooms.filter(roomId => {
                            const room = rooms.find(r => r._id === roomId);
                            return room && (room.roomStatus || 'Class') === 'Class';
                          });
                          
                          return (
                            <div>
                              <div style={{ 
                                fontSize: '14px', 
                                fontWeight: 600, 
                                color: 'var(--theme-color)', 
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <span style={{ 
                                  background: 'var(--theme-color)', 
                                  color: '#fff', 
                                  padding: '4px 10px', 
                                  borderRadius: '6px',
                                  fontSize: '12px'
                                }}>
                                  Classrooms ({selectedClassrooms.length})
                                </span>
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {selectedClassrooms.length === 0 ? (
                                  <div style={{ color: '#9ca3af', fontSize: '13px' }}>No classrooms selected</div>
                                ) : (
                                  selectedClassrooms.map(roomId => {
                                    const room = rooms.find(r => r._id === roomId);
                                    if (!room) return null;
                                    
                                    return (
                                      <div
                                        key={roomId}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px',
                                          padding: '8px 12px',
                                          background: 'var(--theme-color-light)',
                                          border: '2px solid var(--theme-color)',
                                          borderRadius: '8px',
                                          fontSize: '14px',
                                          fontWeight: 600,
                                          color: '#1f2937',
                                        }}
                                      >
                                        <span>{room.roomNumber}</span>
                                        <button
                                          onClick={() => handleRoomToggle(roomId)}
                                          style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#6b7280',
                                            cursor: 'pointer',
                                            fontSize: '18px',
                                            padding: '0 4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            lineHeight: 1
                                          }}
                                          title="Remove"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Labs Section */}
                        {(() => {
                          const selectedLabs = selectedRooms.filter(roomId => {
                            const room = rooms.find(r => r._id === roomId);
                            return room && (room.roomStatus || 'Class') === 'Lab';
                          });
                          
                          return (
                            <div>
                              <div style={{ 
                                fontSize: '14px', 
                                fontWeight: 600, 
                                color: '#059669', 
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <span style={{ 
                                  background: '#059669', 
                                  color: '#fff', 
                                  padding: '4px 10px', 
                                  borderRadius: '6px',
                                  fontSize: '12px'
                                }}>
                                  Labs ({selectedLabs.length})
                                </span>
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {selectedLabs.length === 0 ? (
                                  <div style={{ color: '#9ca3af', fontSize: '13px' }}>No labs selected</div>
                                ) : (
                                  selectedLabs.map(roomId => {
                                    const room = rooms.find(r => r._id === roomId);
                                    if (!room) return null;
                                    
                                    return (
                                      <div
                                        key={roomId}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px',
                                          padding: '8px 12px',
                                          background: '#ecfdf5',
                                          border: '2px solid #059669',
                                          borderRadius: '8px',
                                          fontSize: '14px',
                                          fontWeight: 600,
                                          color: '#1f2937',
                                        }}
                                      >
                                        <span>{room.roomNumber}</span>
                                        <button
                                          onClick={() => handleRoomToggle(roomId)}
                                          style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#6b7280',
                                            cursor: 'pointer',
                                            fontSize: '18px',
                                            padding: '0 4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            lineHeight: 1
                                          }}
                                          title="Remove"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Filters */}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                        Filter by Room Type
                      </label>
                      <select
                        value={roomTypeFilter}
                        onChange={(e) => setRoomTypeFilter(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          color: '#111827',
                          background: '#fff',
                        }}
                      >
                        <option value="all">All Rooms</option>
                        <option value="Class">Classrooms Only</option>
                        <option value="Lab">Labs Only</option>
                      </select>
                    </div>

                    <div style={{ flex: '1', minWidth: '200px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                        Filter by Floor
                      </label>
                      <select
                        value={floorFilter}
                        onChange={(e) => setFloorFilter(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          color: '#111827',
                          background: '#fff',
                        }}
                      >
                        <option value="all">All Floors</option>
                        {Array.from(new Set(rooms.map(r => getFloorFromRoomNumber(r.roomNumber)).filter(f => f !== null)))
                          .sort((a, b) => {
                            // Sort: B2, B1, G, F1, F2, ...
                            const getOrder = (f) => {
                              if (f === 'G') return 0;
                              if (f.startsWith('B')) return -parseInt(f.substring(1));
                              if (f.startsWith('F')) return parseInt(f.substring(1));
                              return 0;
                            };
                            return getOrder(a) - getOrder(b);
                          })
                          .map(floor => {
                            let floorLabel = floor;
                            if (floor === 'G') floorLabel = 'Ground';
                            else if (floor.startsWith('F')) floorLabel = `Floor ${floor.substring(1)}`;
                            else if (floor.startsWith('B')) floorLabel = `Basement ${floor.substring(1)}`;
                            return <option key={floor} value={floor}>{floorLabel}</option>;
                          })}
                      </select>
                    </div>
                  </div>

                  {/* Rooms organized by Floor */}
                  {(() => {
                    const filteredRooms = rooms.filter(room => {
                      const roomType = room.roomStatus || 'Class';
                      const floor = getFloorFromRoomNumber(room.roomNumber);
                      
                      const typeMatch = roomTypeFilter === 'all' || roomType === roomTypeFilter;
                      const floorMatch = floorFilter === 'all' || floor === floorFilter;
                      
                      return typeMatch && floorMatch;
                    });

                    // Group all rooms by floor
                    const roomsByFloor = filteredRooms.reduce((acc, room) => {
                      const floor = getFloorFromRoomNumber(room.roomNumber) || 'Other';
                      if (!acc[floor]) acc[floor] = [];
                      acc[floor].push(room);
                      return acc;
                    }, {});

                    const sortedFloors = Object.keys(roomsByFloor).sort((a, b) => {
                      const getOrder = (f) => {
                        if (f === 'G') return 0;
                        if (f.startsWith('B')) return -parseInt(f.substring(1));
                        if (f.startsWith('F')) return parseInt(f.substring(1));
                        return 999;
                      };
                      return getOrder(a) - getOrder(b);
                    });

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {filteredRooms.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                            No rooms match the selected filters
                          </div>
                        ) : (
                          sortedFloors.map(floor => {
                            const floorRooms = roomsByFloor[floor];
                            const classrooms = floorRooms.filter(r => (r.roomStatus || 'Class') === 'Class');
                            const labs = floorRooms.filter(r => (r.roomStatus || 'Class') === 'Lab');
                            
                            let floorLabel = floor;
                            if (floor === 'G') floorLabel = 'Ground';
                            else if (floor.startsWith('F')) floorLabel = `Floor ${floor.substring(1)}`;
                            else if (floor.startsWith('B')) floorLabel = `Basement ${floor.substring(1)}`;
                            
                            return (
                              <div key={floor} style={{ 
                                border: '2px solid #e5e7eb', 
                                borderRadius: '12px', 
                                padding: '24px',
                                background: '#fafafa'
                              }}>
                                <div style={{ 
                                  fontSize: '18px', 
                                  fontWeight: 700, 
                                  color: '#1f2937', 
                                  marginBottom: '20px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '1px'
                                }}>
                                  {floorLabel}
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                  {/* Classrooms in this floor */}
                                  <div>
                                    <div style={{ 
                                      fontSize: '14px', 
                                      fontWeight: 600, 
                                      color: 'var(--theme-color)', 
                                      marginBottom: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}>
                                      <span style={{ 
                                        background: 'var(--theme-color)', 
                                        color: '#fff', 
                                        padding: '4px 10px', 
                                        borderRadius: '6px',
                                        fontSize: '12px'
                                      }}>
                                        Classrooms ({classrooms.length})
                                      </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                                      {classrooms.length === 0 ? (
                                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '13px' }}>
                                          No classrooms
                                        </div>
                                      ) : (
                                        classrooms.map((room) => (
                                          <div
                                            key={room._id}
                                            onClick={() => handleRoomToggle(room._id)}
                                            style={{
                                              border: selectedRooms.includes(room._id) ? '3px solid var(--theme-color)' : '2px solid #e5e7eb',
                                              borderRadius: '10px',
                                              padding: '14px',
                                              cursor: 'pointer',
                                              background: selectedRooms.includes(room._id) ? 'var(--theme-color-light)' : '#fff',
                                              transition: 'all 0.2s',
                                            }}
                                          >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>{room.roomNumber}</div>
                                              {selectedRooms.includes(room._id) && (
                                                <div style={{ color: 'var(--theme-color)', fontSize: '16px' }}>✓</div>
                                              )}
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>

                                  {/* Labs in this floor */}
                                  <div>
                                    <div style={{ 
                                      fontSize: '14px', 
                                      fontWeight: 600, 
                                      color: '#059669', 
                                      marginBottom: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}>
                                      <span style={{ 
                                        background: '#059669', 
                                        color: '#fff', 
                                        padding: '4px 10px', 
                                        borderRadius: '6px',
                                        fontSize: '12px'
                                      }}>
                                        Labs ({labs.length})
                                      </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                                      {labs.length === 0 ? (
                                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '13px' }}>
                                          No labs
                                        </div>
                                      ) : (
                                        labs.map((room) => (
                                          <div
                                            key={room._id}
                                            onClick={() => handleRoomToggle(room._id)}
                                            style={{
                                              border: selectedRooms.includes(room._id) ? '3px solid #059669' : '2px solid #e5e7eb',
                                              borderRadius: '10px',
                                              padding: '14px',
                                              cursor: 'pointer',
                                              background: selectedRooms.includes(room._id) ? '#ecfdf5' : '#fff',
                                              transition: 'all 0.2s',
                                            }}
                                          >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>{room.roomNumber}</div>
                                              {selectedRooms.includes(room._id) && (
                                                <div style={{ color: '#059669', fontSize: '16px' }}>✓</div>
                                              )}
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })()}

                  {/* No Rooms Message */}
                  {rooms.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      No rooms found for your institute
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Assign Classes */}
              {step === 2 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                      Step 2: Assign Classes to Rooms
                    </h2>
                    
                    {/* Mode Toggle Button */}
                    <button
                      onClick={() => setAssignmentMode(prev => prev === 'list' ? 'graphic' : 'list')}
                      style={{
                        padding: '10px 20px',
                        background: assignmentMode === 'graphic' ? 'var(--theme-color)' : '#fff',
                        color: assignmentMode === 'graphic' ? '#fff' : 'var(--theme-color)',
                        border: '2px solid var(--theme-color)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {assignmentMode === 'list' ? (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                          </svg>
                          <span>Graphic Mode</span>
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="8" y1="6" x2="21" y2="6" />
                            <line x1="8" y1="12" x2="21" y2="12" />
                            <line x1="8" y1="18" x2="21" y2="18" />
                            <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="3" strokeLinecap="round" />
                            <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="3" strokeLinecap="round" />
                            <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                          <span>List Mode</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                    {assignmentMode === 'list' 
                      ? 'Assign one class per classroom. Labs can have multiple classes.'
                      : 'Drag and drop classes onto rooms to assign them.'}
                  </p>

                  {/* Assigned Mappings Summary */}
                  {(() => {
                    const classroomAssignments = Object.entries(roomClassMap).filter(([_, classId]) => classId);
                    const labAssignments = Object.entries(roomLabMap).filter(([_, classIds]) => classIds.length > 0);
                    const totalAssignments = classroomAssignments.length + labAssignments.length;

                    if (totalAssignments > 0) {
                      return (
                        <div style={{ 
                          background: '#f3f4f6', 
                          borderRadius: '10px', 
                          padding: '20px',
                          marginBottom: '24px',
                          border: '2px solid #e5e7eb'
                        }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: 700, 
                            color: '#1f2937', 
                            marginBottom: '16px'
                          }}>
                            Assigned Mappings ({totalAssignments})
                          </div>
                          
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                            gap: '12px' 
                          }}>
                            {/* Classroom Assignments */}
                            {classroomAssignments.map(([roomId, classId]) => {
                              const room = rooms.find(r => r._id === roomId);
                              const cls = classes.find(c => c._id === classId);
                              if (!room || !cls) return null;
                              
                              return (
                                <div 
                                  key={roomId}
                                  style={{
                                    background: '#fff',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    border: '1px solid #e5e7eb',
                                    fontSize: '13px'
                                  }}
                                >
                                  <div style={{ fontWeight: 700, color: '#1f2937', marginBottom: '4px' }}>
                                    {room.roomNumber}
                                  </div>
                                  <div style={{ color: '#6b7280' }}>
                                    {cls.degree} {cls.year}-{cls.section}
                                  </div>
                                </div>
                              );
                            })}

                            {/* Lab Assignments */}
                            {labAssignments.map(([roomId, classIds]) => {
                              const room = rooms.find(r => r._id === roomId);
                              if (!room) return null;
                              
                              return (
                                <div 
                                  key={roomId}
                                  style={{
                                    background: '#fff',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    border: '1px solid #e5e7eb',
                                    fontSize: '13px'
                                  }}
                                >
                                  <div style={{ 
                                    fontWeight: 700, 
                                    color: '#1f2937',
                                    marginBottom: '4px'
                                  }}>
                                    {room.roomNumber} ({classIds.length})
                                  </div>
                                  <div style={{ color: '#6b7280' }}>
                                    {classIds.map((classId, idx) => {
                                      const cls = classes.find(c => c._id === classId);
                                      if (!cls) return null;
                                      return (
                                        <span key={classId}>
                                          {cls.degree} {cls.year}-{cls.section}{idx < classIds.length - 1 ? ', ' : ''}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Conditional Rendering: List Mode vs Graphic Mode */}
                  {assignmentMode === 'list' ? (
                    /* List Mode - Original Layout */
                    (() => {
                      const selectedRoomsList = selectedRooms.map(id => rooms.find(r => r._id === id)).filter(Boolean);
                    
                      // Group rooms by floor
                      const roomsByFloor = selectedRoomsList.reduce((acc, room) => {
                        const floor = getFloorFromRoomNumber(room.roomNumber) || 'Other';
                        if (!acc[floor]) acc[floor] = [];
                        acc[floor].push(room);
                        return acc;
                      }, {});

                      const sortedFloors = Object.keys(roomsByFloor).sort((a, b) => {
                        const getOrder = (f) => {
                          if (f === 'G') return 0;
                          if (f.startsWith('B')) return -parseInt(f.substring(1));
                          if (f.startsWith('F')) return parseInt(f.substring(1));
                          return 999;
                        };
                        return getOrder(a) - getOrder(b);
                      });

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                          {selectedRoomsList.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                              No rooms selected. Please go back to Step 1.
                            </div>
                          ) : (
                            sortedFloors.map(floor => {
                            const floorRooms = roomsByFloor[floor];
                            const classrooms = floorRooms.filter(r => (r.roomStatus || 'Class') === 'Class');
                            const labs = floorRooms.filter(r => (r.roomStatus || 'Class') === 'Lab');
                            
                            let floorLabel = floor;
                            if (floor === 'G') floorLabel = 'Ground';
                            else if (floor.startsWith('F')) floorLabel = `Floor ${floor.substring(1)}`;
                            else if (floor.startsWith('B')) floorLabel = `Basement ${floor.substring(1)}`;
                            
                            return (
                              <div key={floor} style={{ 
                                border: '2px solid #e5e7eb', 
                                borderRadius: '12px', 
                                padding: '24px',
                                background: '#fafafa'
                              }}>
                                <div style={{ 
                                  fontSize: '18px', 
                                  fontWeight: 700, 
                                  color: '#1f2937', 
                                  marginBottom: '20px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '1px'
                                }}>
                                  {floorLabel}
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                  {/* Classrooms in this floor */}
                                  <div>
                                    <div style={{ 
                                      fontSize: '14px', 
                                      fontWeight: 600, 
                                      color: 'var(--theme-color)', 
                                      marginBottom: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}>
                                      <span style={{ 
                                        background: 'var(--theme-color)', 
                                        color: '#fff', 
                                        padding: '4px 10px', 
                                        borderRadius: '6px',
                                        fontSize: '12px'
                                      }}>
                                        Classrooms ({classrooms.length})
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                      {classrooms.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '13px' }}>
                                          No classrooms
                                        </div>
                                      ) : (
                                        classrooms.map((room) => (
                                          <div
                                            key={room._id}
                                            style={{
                                              border: '2px solid #e5e7eb',
                                              borderRadius: '10px',
                                              padding: '16px',
                                              background: '#fff'
                                            }}
                                          >
                                            <div style={{ 
                                              fontSize: '15px', 
                                              fontWeight: 700, 
                                              color: 'var(--theme-color)',
                                              marginBottom: '10px'
                                            }}>
                                              {room.roomNumber}
                                            </div>
                                            <select
                                              value={roomClassMap[room._id] || ''}
                                              onChange={(e) => handleClassSelect(room._id, e.target.value)}
                                              style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '2px solid #e5e7eb',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                color: '#111827',
                                                background: '#fff'
                                              }}
                                            >
                                              <option value="">-- Select a class --</option>
                                              {classes.map(cls => (
                                                <option key={cls._id} value={cls._id}>
                                                  {`${cls.degree} ${cls.year}-${cls.section}`}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>

                                  {/* Labs in this floor */}
                                  <div>
                                    <div style={{ 
                                      fontSize: '14px', 
                                      fontWeight: 600, 
                                      color: '#059669', 
                                      marginBottom: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}>
                                      <span style={{ 
                                        background: '#059669', 
                                        color: '#fff', 
                                        padding: '4px 10px', 
                                        borderRadius: '6px',
                                        fontSize: '12px'
                                      }}>
                                        Labs ({labs.length})
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                      {labs.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '13px' }}>
                                          No labs
                                        </div>
                                      ) : (
                                        labs.map((room) => {
                                          const selectedForLab = roomLabMap[room._id] || [];
                                          return (
                                            <div
                                              key={room._id}
                                              style={{
                                                border: '2px solid #e5e7eb',
                                                borderRadius: '10px',
                                                padding: '16px',
                                                background: '#fff'
                                              }}
                                            >
                                              <div style={{ 
                                                fontSize: '15px', 
                                                fontWeight: 700, 
                                                color: '#059669',
                                                marginBottom: '12px'
                                              }}>
                                                {room.roomNumber}
                                              </div>

                                              {/* Checkboxes for classes */}
                                              <div style={{ 
                                                display: 'grid', 
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                                gap: '8px',
                                                marginBottom: '12px'
                                              }}>
                                                {classes.map(cls => {
                                                  const isSelected = selectedForLab.includes(cls._id);
                                                  return (
                                                    <label
                                                      key={cls._id}
                                                      style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '8px 12px',
                                                        border: '2px solid ' + (isSelected ? '#059669' : '#e5e7eb'),
                                                        borderRadius: '8px',
                                                        background: isSelected ? '#ecfdf5' : '#fff',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: isSelected ? 600 : 500,
                                                        transition: 'all 0.2s'
                                                      }}
                                                    >
                                                      <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                          if (e.target.checked) {
                                                            setRoomLabMap(prev => ({
                                                              ...prev,
                                                              [room._id]: [...(prev[room._id] || []), cls._id]
                                                            }));
                                                          } else {
                                                            setRoomLabMap(prev => ({
                                                              ...prev,
                                                              [room._id]: (prev[room._id] || []).filter(id => id !== cls._id)
                                                            }));
                                                          }
                                                        }}
                                                        style={{
                                                          width: '16px',
                                                          height: '16px',
                                                          cursor: 'pointer',
                                                          accentColor: '#059669'
                                                        }}
                                                      />
                                                      <span>{cls.degree} {cls.year}-{cls.section}</span>
                                                    </label>
                                                  );
                                                })}
                                              </div>

                                              {/* Selected Classes Summary */}
                                              {selectedForLab.length > 0 && (
                                                <div style={{ 
                                                  padding: '10px', 
                                                  background: '#f0fdf4', 
                                                  borderRadius: '8px',
                                                  fontSize: '13px',
                                                  color: '#059669',
                                                  fontWeight: 600
                                                }}>
                                                  {selectedForLab.length} class{selectedForLab.length !== 1 ? 'es' : ''} assigned
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })()
                ) : (
                  /* Graphic Mode - Drag and Drop */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Room Type Tabs */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px',
                      borderBottom: '2px solid #e5e7eb',
                      paddingBottom: '0'
                    }}>
                      <button
                        onClick={() => setActiveRoomTypeTab('classroom')}
                        style={{
                          padding: '12px 24px',
                          background: activeRoomTypeTab === 'classroom' ? 'var(--theme-color)' : '#fff',
                          color: activeRoomTypeTab === 'classroom' ? '#fff' : '#6b7280',
                          border: 'none',
                          borderBottom: '3px solid ' + (activeRoomTypeTab === 'classroom' ? 'var(--theme-color)' : 'transparent'),
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 600,
                          transition: 'all 0.2s',
                          borderRadius: '8px 8px 0 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '-2px'
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="16" rx="2" />
                          <line x1="7" y1="8" x2="17" y2="8" />
                          <line x1="7" y1="12" x2="17" y2="12" />
                          <line x1="7" y1="16" x2="13" y2="16" />
                        </svg>
                        <span>Classrooms</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveRoomTypeTab('lab')}
                        style={{
                          padding: '12px 24px',
                          background: activeRoomTypeTab === 'lab' ? '#059669' : '#fff',
                          color: activeRoomTypeTab === 'lab' ? '#fff' : '#6b7280',
                          border: 'none',
                          borderBottom: '3px solid ' + (activeRoomTypeTab === 'lab' ? '#059669' : 'transparent'),
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 600,
                          transition: 'all 0.2s',
                          borderRadius: '8px 8px 0 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '-2px'
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 2v4M15 2v4M9 14l2 2 4-4" />
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                        </svg>
                        <span>Labs</span>
                      </button>
                    </div>
                    
                    {/* Top Section: Rooms Drop Zones */}
                    <div style={{ 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '12px', 
                      padding: '20px',
                      background: '#fafafa'
                    }}>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: 700, 
                        color: '#1f2937', 
                        marginBottom: '16px'
                      }}>
                        {activeRoomTypeTab === 'classroom' ? 'Classrooms' : 'Labs'} (Drop Zone)
                      </div>
                      
                      {selectedClassForAssignment && (
                        <div style={{ 
                          fontSize: '13px', 
                          color: 'var(--theme-color)', 
                          marginBottom: '16px',
                          padding: '10px',
                          background: 'var(--theme-color-light)',
                          borderRadius: '8px',
                          border: '2px solid var(--theme-color)',
                          fontWeight: 600,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span>Selected: {selectedClassForAssignment.degree} {selectedClassForAssignment.year}-{selectedClassForAssignment.section} — Click on a {activeRoomTypeTab === 'classroom' ? 'classroom' : 'lab'} to assign</span>
                          <button
                            onClick={() => setSelectedClassForAssignment(null)}
                            style={{
                              padding: '4px 8px',
                              background: '#fff',
                              border: '1px solid var(--theme-color)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              color: 'var(--theme-color)',
                              fontWeight: 600
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      
                      {selectedRooms.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                          No rooms selected. Please go back to Step 1.
                        </div>
                      ) : (
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                          gap: '12px' 
                        }}>
                          {selectedRooms
                            .filter(roomId => {
                              const room = rooms.find(r => r._id === roomId);
                              if (!room) return false;
                              const isLab = (room.roomStatus || 'Class') === 'Lab';
                              return activeRoomTypeTab === 'lab' ? isLab : !isLab;
                            })
                            .map(roomId => {
                            const room = rooms.find(r => r._id === roomId);
                            if (!room) return null;
                            
                            const isLab = (room.roomStatus || 'Class') === 'Lab';
                            const assignedClassId = roomClassMap[roomId];
                            const assignedLabIds = roomLabMap[roomId] || [];
                            const hasAssignment = isLab ? assignedLabIds.length > 0 : !!assignedClassId;
                            
                            return (
                              <div
                                key={roomId}
                                onClick={() => {
                                  if (!selectedClassForAssignment) return;
                                  
                                  if (isLab) {
                                    // Add to lab (allow multiple)
                                    setRoomLabMap(prev => {
                                      const current = prev[roomId] || [];
                                      if (current.includes(selectedClassForAssignment._id)) return prev;
                                      return { ...prev, [roomId]: [...current, selectedClassForAssignment._id] };
                                    });
                                  } else {
                                    // Assign to classroom (single) - remove from any other classroom first
                                    setRoomClassMap(prev => {
                                      const newMap = { ...prev };
                                      // Remove this class from any other classroom
                                      Object.keys(newMap).forEach(rId => {
                                        if (newMap[rId] === selectedClassForAssignment._id && rId !== roomId) {
                                          delete newMap[rId];
                                        }
                                      });
                                      // Assign to this classroom
                                      newMap[roomId] = selectedClassForAssignment._id;
                                      return newMap;
                                    });
                                  }
                                  setSelectedClassForAssignment(null);
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = 'copy';
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  if (!draggedClass) return;
                                  
                                  if (isLab) {
                                    // Add to lab (allow multiple)
                                    setRoomLabMap(prev => {
                                      const current = prev[roomId] || [];
                                      if (current.includes(draggedClass._id)) return prev;
                                      return { ...prev, [roomId]: [...current, draggedClass._id] };
                                    });
                                  } else {
                                    // Assign to classroom (single) - remove from any other classroom first
                                    setRoomClassMap(prev => {
                                      const newMap = { ...prev };
                                      // Remove this class from any other classroom
                                      Object.keys(newMap).forEach(rId => {
                                        if (newMap[rId] === draggedClass._id && rId !== roomId) {
                                          delete newMap[rId];
                                        }
                                      });
                                      // Assign to this classroom
                                      newMap[roomId] = draggedClass._id;
                                      return newMap;
                                    });
                                  }
                                }}
                                style={{
                                  border: '2px dashed ' + (isLab ? 
                                    (hasAssignment ? '#059669' : '#a7f3d0') : 
                                    (hasAssignment ? 'var(--theme-color)' : '#ddd6fe')),
                                  borderRadius: '10px',
                                  padding: '16px',
                                  background: isLab ?
                                    (hasAssignment ? '#ecfdf5' : '#fff') :
                                    (hasAssignment ? 'var(--theme-color-light)' : '#fff'),
                                  transition: 'all 0.2s',
                                  minHeight: '120px',
                                  cursor: selectedClassForAssignment ? 'pointer' : 'default'
                                }}
                              >
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: '8px'
                                }}>
                                  <div style={{ 
                                    fontSize: '15px', 
                                    fontWeight: 700, 
                                    color: isLab ? '#059669' : 'var(--theme-color)'
                                  }}>
                                    {room.roomNumber}
                                    <span style={{ 
                                      fontSize: '12px', 
                                      fontWeight: 600, 
                                      color: '#6b7280',
                                      marginLeft: '8px'
                                    }}>
                                      ({isLab ? 'Lab' : 'Classroom'})
                                    </span>
                                  </div>
                                  
                                  {hasAssignment && (
                                    <button
                                      onClick={() => {
                                        if (isLab) {
                                          setRoomLabMap(prev => ({ ...prev, [roomId]: [] }));
                                        } else {
                                          setRoomClassMap(prev => {
                                            const copy = { ...prev };
                                            delete copy[roomId];
                                            return copy;
                                          });
                                        }
                                      }}
                                      style={{
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        background: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        color: '#6b7280'
                                      }}
                                    >
                                      Clear
                                    </button>
                                  )}
                                </div>
                                
                                {/* Display assigned classes */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {isLab ? (
                                    assignedLabIds.length === 0 ? (
                                      <div style={{ color: '#9ca3af', fontSize: '13px' }}>Drop classes here (multiple allowed)</div>
                                    ) : (
                                      assignedLabIds.map(cid => {
                                        const cls = classes.find(c => c._id === cid);
                                        if (!cls) return null;
                                        return (
                                          <div 
                                            key={cid}
                                            style={{ 
                                              background: '#ecfdf5', 
                                              border: '1px solid #059669',
                                              borderRadius: '6px',
                                              padding: '4px 8px',
                                              fontSize: '12px',
                                              fontWeight: 600,
                                              color: '#1f2937',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '4px'
                                            }}
                                          >
                                            {cls.degree} {cls.year}-{cls.section}
                                            <button
                                              onClick={() => handleLabRemove(roomId, cid)}
                                              style={{
                                                border: 'none',
                                                background: 'transparent',
                                                color: '#6b7280',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                padding: 0,
                                                lineHeight: 1
                                              }}
                                            >
                                              ×
                                            </button>
                                          </div>
                                        );
                                      })
                                    )
                                  ) : (
                                    assignedClassId ? (
                                      (() => {
                                        const cls = classes.find(c => c._id === assignedClassId);
                                        return cls ? (
                                          <div style={{ 
                                            background: '#f3e8ff', 
                                            border: '1px solid var(--theme-color)',
                                            borderRadius: '6px',
                                            padding: '4px 8px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: '#1f2937'
                                          }}>
                                            {cls.degree} {cls.year}-{cls.section}
                                          </div>
                                        ) : null;
                                      })()
                                    ) : (
                                      <div style={{ color: '#9ca3af', fontSize: '13px' }}>Drop a class here</div>
                                    )
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Bottom Section: Available Classes */}
                    <div style={{ 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '12px', 
                      padding: '20px',
                      background: '#fafafa'
                    }}>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: 700, 
                        color: '#1f2937', 
                        marginBottom: '16px'
                      }}>
                        Available Classes (Drag or Click to Select)
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                        gap: '8px' 
                      }}>
                        {classes.map(cls => {
                          const classLabel = `${cls.degree} ${cls.year}-${cls.section}`;
                          const isAssignedToClassroom = Object.values(roomClassMap).includes(cls._id);
                          const isAssignedToLab = Object.values(roomLabMap).some(arr => arr.includes(cls._id));
                          const isSelected = selectedClassForAssignment?._id === cls._id;
                          
                          // Determine color based on assignment and active tab
                          let cardBg = '#fff';
                          let cardBorder = 'var(--theme-color)';
                          let cardColor = '#1f2937';
                          let canInteract = true;
                          
                          if (isSelected) {
                            cardBg = '#ddd6fe';
                            cardBorder = 'var(--theme-color)';
                          } else if (activeRoomTypeTab === 'classroom') {
                            // In Classroom tab
                            if (isAssignedToClassroom) {
                              // Already assigned to a classroom - not allowed
                              cardBg = '#e5e7eb';
                              cardBorder = '#9ca3af';
                              cardColor = '#6b7280';
                              canInteract = false;
                            } else {
                              // Not assigned to classroom yet (can assign even if in lab)
                              cardBg = isAssignedToLab ? '#ecfdf5' : '#fff';
                              cardBorder = isAssignedToLab ? '#059669' : 'var(--theme-color)';
                            }
                          } else {
                            // In Lab tab
                            if (isAssignedToLab) {
                              // Assigned to lab - grey it out (not allowed)
                              cardBg = '#e5e7eb';
                              cardBorder = '#9ca3af';
                              cardColor = '#6b7280';
                              canInteract = false;
                            } else if (isAssignedToClassroom) {
                              // Assigned to classroom - show purple but allow lab assignment
                              cardBg = 'var(--theme-color-light)';
                              cardBorder = 'var(--theme-color)';
                            }
                          }
                          
                          return (
                            <div
                              key={cls._id}
                              draggable={canInteract}
                              onClick={() => {
                                if (canInteract) {
                                  setSelectedClassForAssignment(cls);
                                }
                              }}
                              onDragStart={(e) => {
                                if (canInteract) {
                                  setDraggedClass(cls);
                                  e.dataTransfer.effectAllowed = 'copy';
                                }
                              }}
                              onDragEnd={() => setDraggedClass(null)}
                              style={{
                                padding: '12px 16px',
                                background: cardBg,
                                border: '2px solid ' + cardBorder,
                                borderRadius: '8px',
                                cursor: canInteract ? 'pointer' : 'not-allowed',
                                fontSize: '14px',
                                fontWeight: isSelected ? 700 : 600,
                                color: cardColor,
                                opacity: canInteract ? 1 : 0.6,
                                transition: 'all 0.2s',
                                textAlign: 'center',
                                boxShadow: isSelected ? '0 0 0 3px rgba(124, 58, 237, 0.1)' : 'none'
                              }}
                            >
                              {classLabel}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                </div>
              )}

              {/* Step 3: Assign Courses */}
              {step === 3 && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
                    Step 3: Assign Courses to Classes
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                    Select a class tab and assign courses. A checkmark appears when courses are assigned.
                  </p>

                  {(() => {
                    // Get all assigned classes
                    const classroomClasses = Object.entries(roomClassMap).filter(([, cId]) => !!cId);
                    const labClassIds = Array.from(new Set(
                      Object.values(roomLabMap).filter(arr => Array.isArray(arr)).flat()
                    ));
                    
                    // Combine all unique class IDs
                    const allClassIds = Array.from(new Set([
                      ...classroomClasses.map(([, cId]) => cId),
                      ...labClassIds
                    ]));

                    if (allClassIds.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                          No classes assigned yet. Please go back to Step 2.
                        </div>
                      );
                    }

                    // Set initial active tab if not set
                    if (!activeClassTab && allClassIds.length > 0) {
                      setActiveClassTab(allClassIds[0]);
                    }

                    return (
                      <>
                        {/* Tabs */}
                        <div style={{ 
                          display: 'flex', 
                          gap: '8px', 
                          marginBottom: '24px',
                          borderBottom: '2px solid #e5e7eb',
                          paddingBottom: '0',
                          overflowX: 'auto',
                          flexWrap: 'wrap'
                        }}>
                          {allClassIds.map(classId => {
                            const cls = classes.find(c => c._id === classId);
                            const hasClassroom = Object.values(roomClassMap).includes(classId);
                            const hasLab = labClassIds.includes(classId);
                            const selectedCourses = classCoursesMap[classId] || [];
                            const hasAssignedCourses = selectedCourses.length > 0;
                            const isActive = activeClassTab === classId;
                            
                            // Determine tab color based on assignment status
                            let tabColor = '#6b7280'; // Default gray
                            let activeTabColor = 'var(--theme-color)'; // Default purple
                            if (hasAssignedCourses) {
                              tabColor = '#059669'; // Green when courses assigned
                              activeTabColor = '#059669'; // Green when active
                            }
                            
                            return (
                              <button
                                key={classId}
                                onClick={() => setActiveClassTab(classId)}
                                style={{
                                  padding: '12px 20px',
                                  background: isActive ? activeTabColor : '#fff',
                                  color: isActive ? '#fff' : tabColor,
                                  border: 'none',
                                  borderBottom: '3px solid ' + (isActive ? activeTabColor : 'transparent'),
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  transition: 'all 0.2s',
                                  borderRadius: '8px 8px 0 0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  position: 'relative',
                                  marginBottom: '-2px',
                                  minWidth: '180px',
                                  justifyContent: 'center'
                                }}
                              >
                                <span>
                                  {cls ? `${cls.degree} ${cls.year}-${cls.section}` : 'Unknown'}
                                </span>
                                {hasAssignedCourses && (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                                <div style={{ 
                                  fontSize: '10px', 
                                  background: isActive ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                                  color: isActive ? '#fff' : tabColor,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 700
                                }}>
                                  {hasClassroom && hasLab ? 'Both' : hasLab ? 'Lab' : 'Class'}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Tab Content */}
                        {activeClassTab && (() => {
                          const cls = classes.find(c => c._id === activeClassTab);
                          const hasClassroom = Object.values(roomClassMap).includes(activeClassTab);
                          const hasLab = labClassIds.includes(activeClassTab);
                          const roomNumber = classroomClasses.find(([, cId]) => cId === activeClassTab)?.[0];
                          const room = roomNumber ? rooms.find(r => r._id === roomNumber) : null;
                          const selectedCourses = classCoursesMap[activeClassTab] || [];
                          
                          // Filter and sort courses
                          const filterAndSortCourses = (courseList) => {
                            let filtered = courseList;
                            
                            // Apply search filter
                            if (courseSearchQuery.trim()) {
                              const query = courseSearchQuery.toLowerCase();
                              filtered = filtered.filter(c => 
                                (c.courseTitle || '').toLowerCase().includes(query) ||
                                (c.courseCode || '').toLowerCase().includes(query)
                              );
                            }
                            
                            // Apply sorting
                            const sorted = [...filtered].sort((a, b) => {
                              if (courseSortBy === 'title') {
                                return (a.courseTitle || '').localeCompare(b.courseTitle || '');
                              } else if (courseSortBy === 'code') {
                                return (a.courseCode || '').localeCompare(b.courseCode || '');
                              } else if (courseSortBy === 'credits') {
                                return (b.creditHours || 0) - (a.creditHours || 0);
                              }
                              return 0;
                            });
                            
                            return sorted;
                          };
                          
                          const theoryCourses = filterAndSortCourses(
                            courses.filter(c => !(c.courseType === 'Lab' || /lab/i.test(c.courseTitle || '')))
                          );
                          const labCourses = filterAndSortCourses(
                            courses.filter(c => (c.courseType === 'Lab' || /lab/i.test(c.courseTitle || '')))
                          );

                          return (
                            <div style={{ 
                              border: '2px solid #e5e7eb', 
                              borderRadius: '12px', 
                              padding: '24px',
                              background: '#fafafa'
                            }}>
                              {/* Class Header */}
                              <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #e5e7eb' }}>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
                                  {cls ? `${cls.degree} ${cls.year}-${cls.section}` : 'Unknown Class'}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                  {hasClassroom && (
                                    <div style={{ 
                                      fontSize: '13px', 
                                      color: 'var(--theme-color)',
                                      padding: '6px 12px',
                                      background: 'var(--theme-color-light)',
                                      borderRadius: '6px',
                                      border: '1px solid var(--theme-color)',
                                      fontWeight: 600,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px'
                                    }}>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                        <polyline points="9 22 9 12 15 12 15 22" />
                                      </svg>
                                      Classroom: {room?.roomNumber}
                                    </div>
                                  )}
                                  {hasLab && (
                                    <div style={{ 
                                      fontSize: '13px', 
                                      color: '#059669',
                                      padding: '6px 12px',
                                      background: '#ecfdf5',
                                      borderRadius: '6px',
                                      border: '1px solid #059669',
                                      fontWeight: 600,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px'
                                    }}>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 3v6l-3 7c-1 2 1 3 3 3h6c2 0 4-1 3-3l-3-7V3" />
                                        <path d="M9 3h6" />
                                      </svg>
                                      Has Lab Access
                                    </div>
                                  )}
                                  <div style={{ 
                                    fontSize: '13px', 
                                    color: '#6b7280',
                                    padding: '6px 12px',
                                    background: '#fff',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e7eb',
                                    fontWeight: 600
                                  }}>
                                    {selectedCourses.length} Course{selectedCourses.length !== 1 ? 's' : ''} Selected
                                  </div>
                                  <div style={{ 
                                    fontSize: '13px', 
                                    color: '#fff',
                                    padding: '6px 12px',
                                    background: 'var(--theme-color)',
                                    borderRadius: '6px',
                                    fontWeight: 700
                                  }}>
                                    Total: {selectedCourses.reduce((sum, cId) => {
                                      const c = courses.find(course => course._id === cId);
                                      return sum + (c?.creditHours || 0);
                                    }, 0)} CH/week
                                  </div>
                                </div>
                              </div>

                              {/* Selected Courses Display */}
                              {selectedCourses.length > 0 && (
                                <div style={{ 
                                  marginBottom: '20px',
                                  display: 'flex',
                                  gap: '16px',
                                  flexWrap: 'wrap'
                                }}>
                                  {/* Theory Courses Section */}
                                  {(() => {
                                    const selectedTheory = selectedCourses.filter(cId => {
                                      const course = courses.find(c => c._id === cId);
                                      return course && !(course.courseType === 'Lab' || /lab/i.test(course.courseTitle || ''));
                                    });
                                    
                                    if (selectedTheory.length === 0) return null;
                                    
                                    return (
                                      <div style={{ 
                                        flex: '1',
                                        minWidth: '300px',
                                        padding: '12px',
                                        background: 'var(--theme-color-light)',
                                        border: '1px solid var(--theme-color)',
                                        borderRadius: '6px'
                                      }}>
                                        <div style={{ 
                                          fontSize: '12px', 
                                          fontWeight: 700, 
                                          color: 'var(--theme-color)',
                                          marginBottom: '8px',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center'
                                        }}>
                                          <span>Theory ({selectedTheory.length})</span>
                                          <span style={{ 
                                            background: 'var(--theme-color)',
                                            color: '#fff',
                                            padding: '3px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px'
                                          }}>
                                            Total: {selectedTheory.reduce((sum, cId) => {
                                              const c = courses.find(course => course._id === cId);
                                              return sum + (c?.creditHours || 0);
                                            }, 0)} CH/week
                                          </span>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                          {selectedTheory.map(courseId => {
                                            const course = courses.find(c => c._id === courseId);
                                            if (!course) return null;
                                            return (
                                              <div
                                                key={courseId}
                                                style={{
                                                  padding: '6px 10px',
                                                  background: '#fff',
                                                  border: '1px solid var(--theme-color)',
                                                  borderRadius: '4px',
                                                  fontSize: '11px',
                                                  fontWeight: 600,
                                                  color: '#1f2937',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '6px',
                                                  flex: '1 1 100%'
                                                }}
                                              >
                                                <span style={{ fontWeight: 700, color: 'var(--theme-color)' }}>{course.courseCode}</span>
                                                <span>-</span>
                                                <span>{course.courseTitle}</span>
                                                <span style={{ 
                                                  marginLeft: 'auto',
                                                  background: '#f3f4f6',
                                                  padding: '2px 6px',
                                                  borderRadius: '3px',
                                                  fontSize: '10px',
                                                  fontWeight: 700,
                                                  color: '#6b7280'
                                                }}>
                                                  {course.creditHours} CH
                                                </span>
                                                <button
                                                  onClick={() => handleCourseToggle(activeClassTab, courseId)}
                                                  style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '0',
                                                    display: 'flex',
                                                    color: '#ef4444',
                                                    fontSize: '14px',
                                                    lineHeight: '1'
                                                  }}
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                  
                                  {/* Lab Courses Section */}
                                  {(() => {
                                    const selectedLab = selectedCourses.filter(cId => {
                                      const course = courses.find(c => c._id === cId);
                                      return course && (course.courseType === 'Lab' || /lab/i.test(course.courseTitle || ''));
                                    });
                                    
                                    if (selectedLab.length === 0) return null;
                                    
                                    return (
                                      <div style={{ 
                                        flex: '1',
                                        minWidth: '300px',
                                        padding: '12px',
                                        background: '#ecfdf5',
                                        border: '1px solid #059669',
                                        borderRadius: '6px'
                                      }}>
                                        <div style={{ 
                                          fontSize: '12px', 
                                          fontWeight: 700, 
                                          color: '#059669',
                                          marginBottom: '8px',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center'
                                        }}>
                                          <span>Lab ({selectedLab.length})</span>
                                          <span style={{ 
                                            background: '#059669',
                                            color: '#fff',
                                            padding: '3px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px'
                                          }}>
                                            Total: {selectedLab.reduce((sum, cId) => {
                                              const c = courses.find(course => course._id === cId);
                                              return sum + (c?.creditHours || 0);
                                            }, 0)} CH/week
                                          </span>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                          {selectedLab.map(courseId => {
                                            const course = courses.find(c => c._id === courseId);
                                            if (!course) return null;
                                            return (
                                              <div
                                                key={courseId}
                                                style={{
                                                  padding: '6px 10px',
                                                  background: '#fff',
                                                  border: '1px solid #059669',
                                                  borderRadius: '4px',
                                                  fontSize: '11px',
                                                  fontWeight: 600,
                                                  color: '#1f2937',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '6px',
                                                  flex: '1 1 100%'
                                                }}
                                              >
                                                <span style={{ fontWeight: 700, color: '#059669' }}>{course.courseCode}</span>
                                                <span>-</span>
                                                <span>{course.courseTitle}</span>
                                                <span style={{ 
                                                  marginLeft: 'auto',
                                                  background: '#f3f4f6',
                                                  padding: '2px 6px',
                                                  borderRadius: '3px',
                                                  fontSize: '10px',
                                                  fontWeight: 700,
                                                  color: '#6b7280'
                                                }}>
                                                  {course.creditHours} CH
                                                </span>
                                                <button
                                                  onClick={() => handleCourseToggle(activeClassTab, courseId)}
                                                  style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '0',
                                                    display: 'flex',
                                                    color: '#ef4444',
                                                    fontSize: '14px',
                                                    lineHeight: '1'
                                                  }}
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {/* Search and Sort Controls */}
                              <div style={{ 
                                marginBottom: '24px', 
                                display: 'flex', 
                                gap: '12px', 
                                flexWrap: 'wrap',
                                alignItems: 'center'
                              }}>
                                {/* Search Bar */}
                                <div style={{ flex: '1', minWidth: '250px' }}>
                                  <input
                                    type="text"
                                    placeholder="Search courses by name or code..."
                                    value={courseSearchQuery}
                                    onChange={(e) => setCourseSearchQuery(e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '12px 16px',
                                      fontSize: '14px',
                                      border: '2px solid #e5e7eb',
                                      borderRadius: '8px',
                                      outline: 'none',
                                      transition: 'all 0.2s',
                                      background: '#fff'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--theme-color)'}
                                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                  />
                                </div>
                                
                                {/* Sort Dropdown */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280' }}>
                                    Sort by:
                                  </label>
                                  <select
                                    value={courseSortBy}
                                    onChange={(e) => setCourseSortBy(e.target.value)}
                                    style={{
                                      padding: '10px 14px',
                                      fontSize: '14px',
                                      border: '2px solid #e5e7eb',
                                      borderRadius: '8px',
                                      background: '#fff',
                                      cursor: 'pointer',
                                      fontWeight: 600,
                                      color: '#1f2937',
                                      outline: 'none'
                                    }}
                                  >
                                    <option value="title">Course Name (A-Z)</option>
                                    <option value="code">Course Code (A-Z)</option>
                                    <option value="credits">Credit Hours (High-Low)</option>
                                  </select>
                                </div>
                                
                                {/* Results Count */}
                                {courseSearchQuery && (
                                  <div style={{ 
                                    fontSize: '13px', 
                                    color: '#6b7280',
                                    padding: '8px 12px',
                                    background: '#f3f4f6',
                                    borderRadius: '6px',
                                    fontWeight: 600
                                  }}>
                                    Found: {theoryCourses.length + labCourses.length} course(s)
                                  </div>
                                )}
                              </div>

                              {/* Courses Grid - Side by Side */}
                              <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: hasClassroom && hasLab ? '1fr 1fr' : '1fr',
                                gap: '20px'
                              }}>
                              {/* Theory Courses */}
                              {hasClassroom && (
                                <div>
                                  <div style={{ 
                                    fontSize: '16px', 
                                    fontWeight: 700, 
                                    color: '#1f2937', 
                                    marginBottom: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}>
                                    <span style={{ 
                                      background: 'var(--theme-color)', 
                                      color: '#fff', 
                                      padding: '4px 10px', 
                                      borderRadius: '6px',
                                      fontSize: '13px'
                                    }}>
                                      Theory Courses
                                    </span>
                                  </div>
                                  <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                                    gap: '10px'
                                  }}>
                                    {theoryCourses.length === 0 ? (
                                      <div style={{ 
                                        color: '#9ca3af', 
                                        fontSize: '13px', 
                                        gridColumn: '1 / -1', 
                                        textAlign: 'center', 
                                        padding: '40px',
                                        background: '#fff',
                                        borderRadius: '8px'
                                      }}>
                                        No theory courses available
                                      </div>
                                    ) : (
                                      theoryCourses.map((course) => {
                                        const isSelected = selectedCourses.includes(course._id);
                                        return (
                                          <button
                                            key={course._id}
                                            onClick={() => handleCourseToggle(activeClassTab, course._id)}
                                            style={{
                                              padding: '12px 14px',
                                              border: '2px solid ' + (isSelected ? 'var(--theme-color)' : '#e5e7eb'),
                                              borderRadius: '8px',
                                              background: isSelected ? 'var(--theme-color-light)' : '#fff',
                                              color: isSelected ? 'var(--theme-color)' : '#6b7280',
                                              cursor: 'pointer',
                                              fontWeight: isSelected ? 700 : 600,
                                              fontSize: '13px',
                                              transition: 'all 0.2s',
                                              textAlign: 'left',
                                              display: 'flex',
                                              flexDirection: 'column',
                                              gap: '4px',
                                              minHeight: '85px',
                                              position: 'relative'
                                            }}
                                          >
                                            {/* Top section: Course Code and Checkmark */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                              <span style={{ 
                                                fontSize: '11px', 
                                                fontWeight: 700,
                                                color: isSelected ? 'var(--theme-color)' : '#6b7280'
                                              }}>
                                                {course.courseCode}
                                              </span>
                                              {isSelected && (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ flexShrink: 0 }}>
                                                  <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                              )}
                                            </div>
                                            
                                            {/* Course Name */}
                                            <div style={{ 
                                              fontSize: '13px', 
                                              lineHeight: '1.3',
                                              fontWeight: 600,
                                              color: isSelected ? '#1f2937' : '#374151',
                                              flex: 1
                                            }}>
                                              {course.courseTitle}
                                            </div>
                                            
                                            {/* Lower Right: Credit Hours */}
                                            <div style={{ 
                                              display: 'flex',
                                              justifyContent: 'flex-end'
                                            }}>
                                              <span style={{ 
                                                background: isSelected ? 'rgba(124, 58, 237, 0.15)' : '#f3f4f6',
                                                padding: '3px 8px',
                                                borderRadius: '4px',
                                                fontWeight: 700,
                                                fontSize: '10px',
                                                color: isSelected ? 'var(--theme-color)' : '#6b7280'
                                              }}>
                                                {course.creditHours} CH
                                              </span>
                                            </div>
                                          </button>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Lab Courses */}
                              {hasLab && (
                                <div>
                                  <div style={{ 
                                    fontSize: '16px', 
                                    fontWeight: 700, 
                                    color: '#1f2937', 
                                    marginBottom: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}>
                                    <span style={{ 
                                      background: '#059669', 
                                      color: '#fff', 
                                      padding: '4px 10px', 
                                      borderRadius: '6px',
                                      fontSize: '13px'
                                    }}>
                                      Lab Courses
                                    </span>
                                  </div>
                                  <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                                    gap: '10px'
                                  }}>
                                    {labCourses.length === 0 ? (
                                      <div style={{ 
                                        color: '#9ca3af', 
                                        fontSize: '13px', 
                                        gridColumn: '1 / -1', 
                                        textAlign: 'center', 
                                        padding: '40px',
                                        background: '#fff',
                                        borderRadius: '8px'
                                      }}>
                                        No lab courses available
                                      </div>
                                    ) : (
                                      labCourses.map((course) => {
                                        const isSelected = selectedCourses.includes(course._id);
                                        return (
                                          <button
                                            key={course._id}
                                            onClick={() => handleCourseToggle(activeClassTab, course._id)}
                                            style={{
                                              padding: '12px 14px',
                                              border: '2px solid ' + (isSelected ? '#059669' : '#e5e7eb'),
                                              borderRadius: '8px',
                                              background: isSelected ? '#ecfdf5' : '#fff',
                                              color: isSelected ? '#059669' : '#6b7280',
                                              cursor: 'pointer',
                                              fontWeight: isSelected ? 700 : 600,
                                              fontSize: '13px',
                                              transition: 'all 0.2s',
                                              textAlign: 'left',
                                              display: 'flex',
                                              flexDirection: 'column',
                                              gap: '4px',
                                              minHeight: '85px',
                                              position: 'relative'
                                            }}
                                          >
                                            {/* Top section: Course Code and Checkmark */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                              <span style={{ 
                                                fontSize: '11px', 
                                                fontWeight: 700,
                                                color: isSelected ? '#059669' : '#6b7280'
                                              }}>
                                                {course.courseCode}
                                              </span>
                                              {isSelected && (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ flexShrink: 0 }}>
                                                  <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                              )}
                                            </div>
                                            
                                            {/* Course Name */}
                                            <div style={{ 
                                              fontSize: '13px', 
                                              lineHeight: '1.3',
                                              fontWeight: 600,
                                              color: isSelected ? '#1f2937' : '#374151',
                                              flex: 1
                                            }}>
                                              {course.courseTitle}
                                            </div>
                                            
                                            {/* Lower Right: Credit Hours */}
                                            <div style={{ 
                                              display: 'flex',
                                              justifyContent: 'flex-end'
                                            }}>
                                              <span style={{ 
                                                background: isSelected ? 'rgba(5, 150, 105, 0.15)' : '#f3f4f6',
                                                padding: '3px 8px',
                                                borderRadius: '4px',
                                                fontWeight: 700,
                                                fontSize: '10px',
                                                color: isSelected ? '#059669' : '#6b7280'
                                              }}>
                                                {course.creditHours} CH
                                              </span>
                                            </div>
                                          </button>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              )}
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Step 4: Assign Teachers */}
              {step === 4 && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
                    Step 4: Assign Teachers to Courses
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                    Select a class tab and assign teachers to their courses. A checkmark appears when all courses have teachers.
                  </p>

                  {(() => {
                    const assignedClassesLocal = Array.from(new Set([
                      ...Object.values(roomClassMap),
                      ...Object.values(roomLabMap).flat()
                    ].filter(Boolean)));

                    if (assignedClassesLocal.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                          No classes assigned yet. Please go back to Step 2.
                        </div>
                      );
                    }

                    // Set initial active tab if not set
                    if (!activeTeacherClassTab && assignedClassesLocal.length > 0) {
                      setActiveTeacherClassTab(assignedClassesLocal[0]);
                    }

                    return (
                      <>
                        {/* Tabs */}
                        <div style={{ 
                          display: 'flex', 
                          gap: '8px', 
                          marginBottom: '24px',
                          borderBottom: '2px solid #e5e7eb',
                          paddingBottom: '0',
                          overflowX: 'auto',
                          flexWrap: 'wrap'
                        }}>
                          {assignedClassesLocal.map(classId => {
                            const cls = classes.find(c => c._id === classId);
                            const allSelectedCourses = (classCoursesMap[classId] || []);
                            const isActive = activeTeacherClassTab === classId;
                            
                            // Check if all courses have teachers assigned
                            const allCoursesHaveTeachers = allSelectedCourses.length > 0 && allSelectedCourses.every(courseId => {
                              const key = `${classId}_${courseId}`;
                              return !!courseTeacherMap[key];
                            });
                            
                            // Determine tab color
                            let tabColor = '#6b7280'; // Default gray
                            let activeTabColor = 'var(--theme-color)'; // Default purple
                            if (allCoursesHaveTeachers) {
                              tabColor = '#059669'; // Green when all teachers assigned
                              activeTabColor = '#059669'; // Green when active
                            }
                            
                            return (
                              <button
                                key={classId}
                                onClick={() => setActiveTeacherClassTab(classId)}
                                style={{
                                  padding: '12px 20px',
                                  background: isActive ? activeTabColor : '#fff',
                                  color: isActive ? '#fff' : tabColor,
                                  border: 'none',
                                  borderBottom: '3px solid ' + (isActive ? activeTabColor : 'transparent'),
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  transition: 'all 0.2s',
                                  borderRadius: '8px 8px 0 0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  position: 'relative',
                                  marginBottom: '-2px',
                                  minWidth: '180px',
                                  justifyContent: 'center'
                                }}
                              >
                                <span>
                                  {cls ? `${cls.degree} ${cls.year}-${cls.section}` : 'Unknown'}
                                </span>
                                {allCoursesHaveTeachers && (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Tab Content */}
                        {activeTeacherClassTab && (() => {
                          const cls = classes.find(c => c._id === activeTeacherClassTab);
                          const classInLab = isClassSelectedInAnyLab(activeTeacherClassTab);
                          const classInClassRoom = Object.values(roomClassMap).includes(activeTeacherClassTab);
                          const allSelectedCourses = (classCoursesMap[activeTeacherClassTab] || []);
                          const labCourseIds = allSelectedCourses.filter(cid => {
                            const cObj = courses.find(c => c._id === cid);
                            return cObj && (cObj.courseType === 'Lab' || /lab/i.test(cObj.courseTitle || ''));
                          });
                          const theoryCourseIds = allSelectedCourses.filter(cid => {
                            const cObj = courses.find(c => c._id === cid);
                            return cObj && !(cObj.courseType === 'Lab' || /lab/i.test(cObj.courseTitle || ''));
                          });

                          return (
                            <div style={{ 
                              border: '2px solid #e5e7eb', 
                              borderRadius: '12px', 
                              padding: '24px',
                              background: '#fafafa'
                            }}>
                              {/* Class Header */}
                              <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #e5e7eb' }}>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
                                  {cls ? `${cls.degree} ${cls.year}-${cls.section}` : 'Unknown Class'}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                  {classInClassRoom && (
                                    <div style={{ 
                                      fontSize: '13px', 
                                      color: 'var(--theme-color)',
                                      padding: '6px 12px',
                                      background: 'var(--theme-color-light)',
                                      borderRadius: '6px',
                                      border: '1px solid var(--theme-color)',
                                      fontWeight: 600,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px'
                                    }}>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                      </svg>
                                      {theoryCourseIds.length} Theory Course{theoryCourseIds.length !== 1 ? 's' : ''}
                                    </div>
                                  )}
                                  {classInLab && (
                                    <div style={{ 
                                      fontSize: '13px', 
                                      color: '#059669',
                                      padding: '6px 12px',
                                      background: '#ecfdf5',
                                      borderRadius: '6px',
                                      border: '1px solid #059669',
                                      fontWeight: 600,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px'
                                    }}>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 3v6l-3 7c-1 2 1 3 3 3h6c2 0 4-1 3-3l-3-7V3" />
                                        <path d="M9 3h6" />
                                      </svg>
                                      {labCourseIds.length} Lab Course{labCourseIds.length !== 1 ? 's' : ''}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {allSelectedCourses.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                  No courses assigned to this class. Go back to Step 3.
                                </div>
                              ) : (
                                <>
                                  {/* Side by Side Layout */}
                                  <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: classInClassRoom && theoryCourseIds.length > 0 && classInLab && labCourseIds.length > 0 ? '1fr 1fr' : '1fr',
                                    gap: '20px'
                                  }}>
                                    {/* Theory Courses */}
                                    {classInClassRoom && theoryCourseIds.length > 0 && (
                                      <div>
                                        <div style={{ 
                                          fontSize: '16px', 
                                          fontWeight: 700, 
                                          color: '#1f2937', 
                                          marginBottom: '12px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px'
                                        }}>
                                          <span style={{ 
                                            background: 'var(--theme-color)', 
                                            color: '#fff', 
                                            padding: '4px 10px', 
                                            borderRadius: '6px',
                                            fontSize: '13px'
                                          }}>
                                            Theory Courses
                                          </span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {theoryCourseIds.map((courseId) => {
                                          const course = courses.find((c) => c._id === courseId);
                                          const key = `${activeTeacherClassTab}_${courseId}`;
                                          const selectedTeacherId = courseTeacherMap[key];
                                          
                                          return (
                                            <div key={courseId} style={{ 
                                              padding: '16px', 
                                              background: '#fff', 
                                              borderRadius: '10px', 
                                              border: '2px solid #e5e7eb' 
                                            }}>
                                              <div style={{ 
                                                fontSize: '15px', 
                                                fontWeight: 700, 
                                                color: '#1f2937', 
                                                marginBottom: '12px',
                                                paddingBottom: '8px',
                                                borderBottom: '1px solid #e5e7eb',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                              }}>
                                                <span>{course?.courseTitle || 'Unknown Course'}</span>
                                                <span style={{ 
                                                  fontSize: '11px',
                                                  fontWeight: 700,
                                                  color: '#6b7280',
                                                  background: '#f3f4f6',
                                                  padding: '4px 8px',
                                                  borderRadius: '4px'
                                                }}>
                                                  {course?.courseCode}
                                                </span>
                                              </div>
                                              <div>
                                                <label style={{ 
                                                  fontSize: '13px', 
                                                  fontWeight: 600, 
                                                  color: '#6b7280',
                                                  marginBottom: '8px',
                                                  display: 'block'
                                                }}>
                                                  Select Teacher:
                                                </label>
                                                <select
                                                  value={selectedTeacherId || ''}
                                                  onChange={(e) => handleTeacherSelect(activeTeacherClassTab, courseId, e.target.value || null)}
                                                  style={{
                                                    width: '100%',
                                                    padding: '12px 14px',
                                                    fontSize: '14px',
                                                    border: '2px solid ' + (selectedTeacherId ? 'var(--theme-color)' : '#e5e7eb'),
                                                    borderRadius: '8px',
                                                    background: selectedTeacherId ? 'var(--theme-color-light)' : '#fff',
                                                    cursor: 'pointer',
                                                    fontWeight: selectedTeacherId ? 600 : 400,
                                                    color: selectedTeacherId ? 'var(--theme-color)' : '#1f2937',
                                                    outline: 'none'
                                                  }}
                                                >
                                                  <option value="">-- Select a teacher --</option>
                                                  {teachers.map((teacher) => (
                                                    <option key={teacher._id} value={teacher._id}>
                                                      {teacher.userName}
                                                    </option>
                                                  ))}
                                                </select>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Lab Courses */}
                                  {classInLab && labCourseIds.length > 0 && (
                                    <div>
                                      <div style={{ 
                                        fontSize: '16px', 
                                        fontWeight: 700, 
                                        color: '#1f2937', 
                                        marginBottom: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                      }}>
                                        <span style={{ 
                                          background: '#059669', 
                                          color: '#fff', 
                                          padding: '4px 10px', 
                                          borderRadius: '6px',
                                          fontSize: '13px'
                                        }}>
                                          Lab Courses
                                        </span>
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {labCourseIds.map((courseId) => {
                                          const course = courses.find((c) => c._id === courseId);
                                          const key = `${activeTeacherClassTab}_${courseId}`;
                                          const selectedTeacherId = courseTeacherMap[key];
                                          
                                          return (
                                            <div key={courseId} style={{ 
                                              padding: '16px', 
                                              background: '#fff', 
                                              borderRadius: '10px', 
                                              border: '2px solid #e5e7eb' 
                                            }}>
                                              <div style={{ 
                                                fontSize: '15px', 
                                                fontWeight: 700, 
                                                color: '#1f2937', 
                                                marginBottom: '12px',
                                                paddingBottom: '8px',
                                                borderBottom: '1px solid #e5e7eb',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                              }}>
                                                <span>{course?.courseTitle || 'Unknown Course'}</span>
                                                <span style={{ 
                                                  fontSize: '11px',
                                                  fontWeight: 700,
                                                  color: '#6b7280',
                                                  background: '#f3f4f6',
                                                  padding: '4px 8px',
                                                  borderRadius: '4px'
                                                }}>
                                                  {course?.courseCode}
                                                </span>
                                              </div>
                                              <div>
                                                <label style={{ 
                                                  fontSize: '13px', 
                                                  fontWeight: 600, 
                                                  color: '#6b7280',
                                                  marginBottom: '8px',
                                                  display: 'block'
                                                }}>
                                                  Select Teacher:
                                                </label>
                                                <select
                                                  value={selectedTeacherId || ''}
                                                  onChange={(e) => handleTeacherSelect(activeTeacherClassTab, courseId, e.target.value || null)}
                                                  style={{
                                                    width: '100%',
                                                    padding: '12px 14px',
                                                    fontSize: '14px',
                                                    border: '2px solid ' + (selectedTeacherId ? '#059669' : '#e5e7eb'),
                                                    borderRadius: '8px',
                                                    background: selectedTeacherId ? '#ecfdf5' : '#fff',
                                                    cursor: 'pointer',
                                                    fontWeight: selectedTeacherId ? 600 : 400,
                                                    color: selectedTeacherId ? '#059669' : '#1f2937',
                                                    outline: 'none'
                                                  }}
                                                >
                                                  <option value="">-- Select a teacher --</option>
                                                  {teachers.map((teacher) => (
                                                    <option key={teacher._id} value={teacher._id}>
                                                      {teacher.userName}
                                                    </option>
                                                  ))}
                                                </select>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    );
                  })()}
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
                        <div style={{ fontSize: '14px', color: '#9a3412', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          Break Duration
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {selectedRooms.map((roomId) => {
                      const room = rooms.find((r) => r._id === roomId);
                      const status = room?.roomStatus || 'Class';
                      const isLab = status === 'Lab';
                      const classIds = isLab ? (roomLabMap[roomId] || []) : ([roomClassMap[roomId]].filter(Boolean));
                      
                      return (
                        <div 
                          key={roomId} 
                          style={{ 
                            border: '2px solid ' + (isLab ? '#059669' : 'var(--theme-color)'),
                            borderRadius: '12px', 
                            padding: '20px', 
                            background: isLab ? '#f0fdf4' : '#faf5ff'
                          }}
                        >
                          {/* Room Header */}
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            marginBottom: '20px',
                            paddingBottom: '16px',
                            borderBottom: '2px solid ' + (isLab ? 'var(--theme-color-light)' : '#e9d5ff')
                          }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '10px',
                              background: isLab ? '#059669' : 'var(--theme-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '16px'
                            }}>
                              {isLab ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M9 2v4M15 2v4M9 14l2 2 4-4" />
                                  <rect x="3" y="4" width="18" height="18" rx="2" />
                                </svg>
                              ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="4" width="18" height="16" rx="2" />
                                  <line x1="7" y1="8" x2="17" y2="8" />
                                  <line x1="7" y1="12" x2="17" y2="12" />
                                  <line x1="7" y1="16" x2="13" y2="16" />
                                </svg>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                fontSize: '18px', 
                                fontWeight: 700, 
                                color: '#1f2937',
                                marginBottom: '4px'
                              }}>
                                {room?.roomNumber}
                              </div>
                              <div style={{ 
                                fontSize: '13px', 
                                color: '#6b7280',
                                fontWeight: 600
                              }}>
                                {isLab ? 'Laboratory' : 'Classroom'} • {classIds.length} {classIds.length === 1 ? 'Class' : 'Classes'}
                              </div>
                            </div>
                          </div>

                          {/* Classes and Courses */}
                          {classIds.length === 0 ? (
                            <div style={{ 
                              textAlign: 'center', 
                              padding: '24px', 
                              color: '#9ca3af',
                              fontSize: '14px'
                            }}>
                              No classes assigned to this room
                            </div>
                          ) : (
                            classIds.map(cid => {
                              const cls = classes.find(c => c._id === cid);
                              const selectedCourseIds = classCoursesMap[cid] || [];
                              const uniqueIds = Array.from(new Set(selectedCourseIds));
                              const classInLab = Object.entries(roomLabMap).some(([_, arr]) => Array.isArray(arr) && arr.includes(cid));
                              const classInClassRoom = Object.values(roomClassMap).includes(cid);
                              
                              const labCourses = uniqueIds
                                .map(id => courses.find(c => c._id === id))
                                .filter(c => c && ((c.courseType === 'Lab') || /lab/i.test(c.courseTitle || '')));
                              
                              const theoryCourses = uniqueIds
                                .map(id => courses.find(c => c._id === id))
                                .filter(c => c && !((c.courseType === 'Lab') || /lab/i.test(c.courseTitle || '')));

                              const displayCourses = isLab ? labCourses : theoryCourses;
                              const shouldDisplay = (isLab && classInLab) || (!isLab && classInClassRoom);

                              if (!shouldDisplay) return null;

                              return (
                                <div 
                                  key={cid} 
                                  style={{ 
                                    marginBottom: '20px',
                                    padding: '16px',
                                    background: '#fff',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb'
                                  }}
                                >
                                  {/* Class Name */}
                                  <div style={{ 
                                    fontSize: '15px', 
                                    fontWeight: 700, 
                                    color: isLab ? '#059669' : 'var(--theme-color)',
                                    marginBottom: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}>
                                    <span>{cls ? `${cls.degree} ${cls.year}-${cls.section}` : 'Unknown Class'}</span>
                                    <span style={{
                                      fontSize: '11px',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      background: isLab ? 'var(--theme-color-light)' : 'var(--theme-color-light)',
                                      color: isLab ? '#047857' : '#6b21a8',
                                      fontWeight: 600
                                    }}>
                                      {displayCourses.length} {isLab ? 'Lab' : 'Theory'} Course{displayCourses.length !== 1 ? 's' : ''}
                                    </span>
                                  </div>

                                  {/* Courses List */}
                                  {displayCourses.length === 0 ? (
                                    <div style={{ 
                                      color: '#9ca3af', 
                                      fontSize: '13px',
                                      fontStyle: 'italic'
                                    }}>
                                      No {isLab ? 'lab' : 'theory'} courses assigned
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      {displayCourses.map(course => {
                                        const key = `${cid}_${course._id}`;
                                        const teacher = teachers.find(t => t._id === courseTeacherMap[key]);
                                        
                                        return (
                                          <div 
                                            key={course._id} 
                                            style={{ 
                                              display: 'grid',
                                              gridTemplateColumns: '1fr auto',
                                              gap: '16px',
                                              padding: '12px',
                                              background: '#f9fafb',
                                              borderRadius: '6px',
                                              alignItems: 'center'
                                            }}
                                          >
                                            {/* Left: Course Info */}
                                            <div>
                                              <div style={{ 
                                                fontSize: '14px', 
                                                fontWeight: 700, 
                                                color: '#1f2937',
                                                marginBottom: '4px'
                                              }}>
                                                {course.courseTitle}
                                              </div>
                                              <div style={{ 
                                                fontSize: '12px', 
                                                color: '#6b7280',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                              }}>
                                                <span>Code: {course.courseCode}</span>
                                                <span>•</span>
                                                <span>{course.courseType || 'Theory'}</span>
                                              </div>
                                            </div>

                                            {/* Right: Room & Teacher */}
                                            <div style={{ textAlign: 'right' }}>
                                              <div style={{
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                color: isLab ? '#059669' : 'var(--theme-color)',
                                                marginBottom: '4px'
                                              }}>
                                                {room?.roomNumber}
                                              </div>
                                              <div style={{
                                                fontSize: '12px',
                                                color: '#6b7280',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                justifyContent: 'flex-end'
                                              }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                  <circle cx="12" cy="7" r="4" />
                                                </svg>
                                                <span>{teacher?.userName || 'No teacher'}</span>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
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
                    Review the generated timetable candidates and choose one to save.
                  </p>
                  {candidates.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      No candidates available. Go back and try again.
                    </div>
                  ) : (
                    <div>
                      {/* Candidate Tabs */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '8px',
                        borderBottom: '2px solid #e5e7eb',
                        paddingBottom: '0',
                        marginBottom: '24px'
                      }}>
                        {candidates.slice(0, 3).map((cand, idx) => {
                          const isActive = activeCandidateTab === idx;
                          const isSelected = selectedCandidateIndex === idx;
                          
                          return (
                            <button
                              key={idx}
                              onClick={() => setActiveCandidateTab(idx)}
                              style={{
                                padding: '12px 24px',
                                background: isActive ? 'var(--theme-color)' : '#fff',
                                color: isActive ? '#fff' : '#6b7280',
                                border: 'none',
                                borderBottom: '3px solid ' + (isActive ? 'var(--theme-color)' : 'transparent'),
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 600,
                                transition: 'all 0.2s',
                                borderRadius: '8px 8px 0 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '-2px',
                                position: 'relative'
                              }}
                            >
                              <span>Candidate {idx + 1}</span>
                              {isSelected && (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Candidate Timetable */}
                      {candidates[activeCandidateTab] && (() => {
                        const cand = candidates[activeCandidateTab];
                        const details = cand.details || [];
                        
                        // Always show all weekdays (Monday-Friday)
                        const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                        
                        // Define all time slots including break
                        const allTimes = [
                          '08:00-09:00',
                          '09:00-10:00',
                          '10:00-11:00',
                          '11:00-12:00',
                          'BREAK',
                          '13:00-14:00',
                          '14:00-15:00',
                          '15:00-16:00'
                        ];

                        return (
                          <div>
                            {/* Selection Button */}
                            <div style={{ 
                              marginBottom: '24px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '16px',
                              background: selectedCandidateIndex === activeCandidateTab ? 'var(--theme-color-light)' : '#f9fafb',
                              borderRadius: '8px',
                              border: '2px solid ' + (selectedCandidateIndex === activeCandidateTab ? '#059669' : '#e5e7eb')
                            }}>
                              <div>
                                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
                                  Candidate {activeCandidateTab + 1}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                                  {cand?.header?.session || 'Session'} • {cand?.header?.year || 'Year'}
                                </div>
                              </div>
                              <button
                                onClick={() => setSelectedCandidateIndex(activeCandidateTab)}
                                style={{
                                  padding: '10px 20px',
                                  background: selectedCandidateIndex === activeCandidateTab ? '#059669' : 'var(--theme-color)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                              >
                                {selectedCandidateIndex === activeCandidateTab ? (
                                  <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    Selected
                                  </>
                                ) : (
                                  'Select This'
                                )}
                              </button>
                            </div>

                            {/* Timetable Grid Component */}
                            <TimetableGrid 
                              data={details}
                              allDays={allDays}
                              allTimes={allTimes}
                              showClassHeader={true}
                            />
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
              </>
              )}
            </div>

      {/* Custom Modal */}
      {showModal && (
        <div 
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--theme-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 700, 
                color: '#1f2937',
                margin: 0
              }}>
                Notification
              </h3>
            </div>
            <p style={{ 
              fontSize: '16px', 
              color: '#6b7280', 
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              {modalMessage}
            </p>
            <button
              onClick={() => setShowModal(false)}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: 'var(--theme-color)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#6d28d9'}
              onMouseOut={(e) => e.target.style.background = 'var(--theme-color)'}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </Container>
  );
}

export default GenerateTimetable;
