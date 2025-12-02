import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import '../Dashboard.css';

function GenerateTimetable() {
  const { instituteObjectId } = useAuth();
  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [roomClassMap, setRoomClassMap] = useState({});
  const [classCoursesMap, setClassCoursesMap] = useState({});
  const [courseTeacherMap, setCourseTeacherMap] = useState({}); // Key: "classId_courseId", Value: teacherId
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!instituteObjectId) {
        setError('Institute ID not found');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('token');

        // Fetch rooms
        const roomsRes = await fetch(`http://localhost:5000/api/rooms?instituteID=${encodeURIComponent(instituteObjectId)}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (roomsRes.ok) {
          const roomsData = await roomsRes.json();
          setRooms(Array.isArray(roomsData) ? roomsData : []);
        } else {
          console.error('Failed to fetch rooms:', await roomsRes.text());
        }

        // Fetch classes
        const classesRes = await fetch(`http://localhost:5000/api/classes/${encodeURIComponent(instituteObjectId)}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (classesRes.ok) {
          const classesData = await classesRes.json();
          setClasses(Array.isArray(classesData) ? classesData : []);
        } else {
          console.error('Failed to fetch classes:', await classesRes.text());
        }

        // Fetch courses
        const coursesRes = await fetch(`http://localhost:5000/api/courses/${encodeURIComponent(instituteObjectId)}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setCourses(Array.isArray(coursesData) ? coursesData : []);
        } else {
          console.error('Failed to fetch courses:', await coursesRes.text());
        }

        // Fetch teachers
        const teachersRes = await fetch('http://localhost:5000/api/users/institute', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (teachersRes.ok) {
          const usersData = await teachersRes.json();
          const teachersList = Array.isArray(usersData) ? usersData.filter(u => u.designation === 'Teacher') : [];
          setTeachers(teachersList);
        } else {
          console.error('Failed to fetch teachers:', await teachersRes.text());
        }

      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (instituteObjectId) {
      fetchData();
    }
  }, [instituteObjectId]);

  const handleRoomToggle = (roomId) => {
    setSelectedRooms((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const handleClassSelect = (roomId, classId) => {
    // Check if this class is already assigned to another room
    const alreadyAssignedRoom = Object.entries(roomClassMap).find(
      ([rId, cId]) => cId === classId && rId !== roomId
    );
    
    if (alreadyAssignedRoom) {
      alert(`This class is already assigned to another room`);
      return;
    }

    setRoomClassMap((prev) => ({
      ...prev,
      [roomId]: classId,
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

  const handleNext = () => {
    if (step === 1 && selectedRooms.length === 0) {
      alert('Please select at least one room');
      return;
    }
    if (step === 2) {
      const missingClass = selectedRooms.find((roomId) => !roomClassMap[roomId]);
      if (missingClass) {
        alert('Please assign a class to each selected room');
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
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleGenerate = () => {
    setLoading(true);
    // TODO: Call backend API to generate timetable
    setTimeout(() => {
      setLoading(false);
      alert('Timetable generation logic will be implemented here');
      // Navigate back to timetable view
    }, 1500);
  };

  const assignedClasses = Object.values(roomClassMap);

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
                { num: 5, label: 'Review & Generate' },
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
                  {idx < 4 && (
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
                    Assign one class to each selected room
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {selectedRooms.map((roomId) => {
                      const room = rooms.find((r) => r._id === roomId);
                      return (
                        <div
                          key={roomId}
                          style={{
                            border: '2px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '20px',
                            background: '#fff',
                          }}
                        >
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#7c3aed', marginBottom: '12px' }}>
                            {room?.roomNumber} ({room?.roomStatus || 'Class'})
                          </div>
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {classes.length === 0 ? (
                              <div style={{ color: '#6b7280', fontSize: '14px' }}>No classes available</div>
                            ) : (
                              classes.map((cls) => (
                                <button
                                  key={cls._id}
                                  onClick={() => handleClassSelect(roomId, cls._id)}
                                  style={{
                                    padding: '10px 16px',
                                    border: roomClassMap[roomId] === cls._id ? '2px solid #7c3aed' : '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                    background: roomClassMap[roomId] === cls._id ? '#7c3aed' : '#fff',
                                    color: roomClassMap[roomId] === cls._id ? '#fff' : '#374151',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  {`${cls.degree} ${cls.year}-${cls.section}`}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
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
                    Select courses for each class (you can select multiple)
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {assignedClasses.map((classId) => {
                      const cls = classes.find((c) => c._id === classId);
                      const assignedRooms = Object.entries(roomClassMap)
                        .filter(([, cId]) => cId === classId)
                        .map(([rId]) => rooms.find((r) => r._id === rId)?.roomNumber)
                        .join(', ');
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
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#7c3aed' }}>
                              {cls ? `${cls.degree} ${cls.year}-${cls.section}` : 'Unknown Class'}
                            </div>
                            <div style={{ fontSize: '13px', color: '#6b7280' }}>Room(s): {assignedRooms}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {courses.length === 0 ? (
                              <div style={{ color: '#6b7280', fontSize: '14px' }}>No courses available</div>
                            ) : (
                              courses.map((course) => (
                                <button
                                  key={course._id}
                                  onClick={() => handleCourseToggle(classId, course._id)}
                                  style={{
                                    padding: '10px 16px',
                                    border: (classCoursesMap[classId] || []).includes(course._id)
                                      ? '2px solid #7c3aed'
                                      : '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                    background: (classCoursesMap[classId] || []).includes(course._id)
                                      ? '#7c3aed'
                                      : '#fff',
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
                    })}
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
                      const assignedClasses = Object.values(roomClassMap);
                      
                      return assignedClasses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                          No classes assigned
                        </div>
                      ) : (
                        assignedClasses.map((classId) => {
                          const cls = classes.find((c) => c._id === classId);
                          const coursesForClass = classCoursesMap[classId] || [];
                          const room = Object.entries(roomClassMap)
                            .find(([, cId]) => cId === classId);
                          const roomName = room ? rooms.find(r => r._id === room[0])?.roomNumber : 'Unknown';

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
                              
                              {coursesForClass.length === 0 ? (
                                <div style={{ color: '#6b7280', fontSize: '14px' }}>No courses assigned</div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                  {coursesForClass.map((courseId) => {
                                    const course = courses.find((c) => c._id === courseId);
                                    const key = `${classId}_${courseId}`;
                                    
                                    return (
                                      <div
                                        key={courseId}
                                        style={{
                                          padding: '12px',
                                          background: '#f9fafb',
                                          borderRadius: '8px',
                                          border: '1px solid #e5e7eb',
                                        }}
                                      >
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                          📚 {course?.courseTitle || 'Unknown Course'}
                                        </div>
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
                          );
                        })
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Step 5: Review & Generate */}
              {step === 5 && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
                    Step 5: Review & Generate
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                    Review your selections before generating the timetable
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {selectedRooms.map((roomId) => {
                      const room = rooms.find((r) => r._id === roomId);
                      const classId = roomClassMap[roomId];
                      const cls = classes.find((c) => c._id === classId);
                      const selectedCourses = (classCoursesMap[classId] || []).map((cId) =>
                        courses.find((co) => co._id === cId)
                      );

                      return (
                        <div
                          key={roomId}
                          style={{
                            border: '2px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '20px',
                            background: '#f9fafb',
                          }}
                        >
                          <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
                            <div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Room</div>
                              <div style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>
                                {room?.roomNumber}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Class</div>
                              <div style={{ fontSize: '16px', fontWeight: 700, color: '#7c3aed' }}>
                                {cls ? `${cls.degree} ${cls.year}-${cls.section}` : 'N/A'}
                              </div>
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Courses & Teachers</div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {selectedCourses.length === 0 ? (
                                <div style={{ color: '#6b7280', fontSize: '14px' }}>No courses selected</div>
                              ) : (
                                selectedCourses.filter(c => c).map((course) => {
                                  const key = `${classId}_${course._id}`;
                                  const teacher = teachers.find(t => t._id === courseTeacherMap[key]);
                                  return (
                                    <div
                                      key={course._id}
                                      style={{
                                        padding: '8px 12px',
                                        background: '#7c3aed',
                                        color: '#fff',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                      }}
                                    >
                                      <div style={{ fontWeight: 700 }}>{course.courseTitle}</div>
                                      <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.9 }}>
                                        👨‍🏫 {teacher?.userName || 'No teacher'}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
              {step < 5 ? (
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
              ) : (
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default GenerateTimetable;
