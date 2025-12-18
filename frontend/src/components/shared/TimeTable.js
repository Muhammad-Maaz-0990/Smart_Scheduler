import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Badge, Form, Row, Col,} from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, fadeIn, scaleIn } from './animation_variants';
import { FaPrint, FaPlus, FaTrash, FaCalendarAlt, FaEye, FaEyeSlash, FaStar, FaClock, FaGraduationCap, FaChalkboardTeacher, FaDoorOpen, FaEdit, FaSave, FaTimes, FaExchangeAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

function TimeTable({ isAdmin = false }) {
  const navigate = useNavigate();
  const { user, instituteObjectId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]); // headers list
  const [selected, setSelected] = useState(null); // selected header
  const [details, setDetails] = useState([]); // details for selected
  const [instituteInfo, setInstituteInfo] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDetails, setEditDetails] = useState([]);
  const [swapBox, setSwapBox] = useState({}); // Organized by class: { className: [cells] }
  const [selectedCells, setSelectedCells] = useState([]); // Array of {index, class}
  const [successMessage, setSuccessMessage] = useState('');
  const [renderKey, setRenderKey] = useState(0);
  const [swappingCells, setSwappingCells] = useState(null); // { cell1: index, cell2: index }
  const [showCellModal, setShowCellModal] = useState(false);
  const [modalCellData, setModalCellData] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [modalForm, setModalForm] = useState({ course: '', room: '', instructor: '' });
  const [allClasses, setAllClasses] = useState([]);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [existingClassesFromDB, setExistingClassesFromDB] = useState([]);
  const [showTimeSettingsModal, setShowTimeSettingsModal] = useState(false);
  const [timeSettings, setTimeSettings] = useState({
    startTime: '08:00',
    endTime: '17:00',
    lectureDuration: 60,
    hasBreak: true,
    breakAfterLecture: 3,
    breakDuration: 30
  });

  // Auto-scroll during drag
  useEffect(() => {
    let scrollInterval = null;
    
    const handleDragOver = (e) => {
      if (!isEditMode) return;
      
      const scrollZone = 100; // pixels from edge to trigger scroll
      const scrollSpeed = 10; // pixels per interval
      const viewportHeight = window.innerHeight;
      const mouseY = e.clientY;
      
      // Clear any existing interval
      if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
      }
      
      // Scroll down if near bottom
      if (mouseY > viewportHeight - scrollZone) {
        scrollInterval = setInterval(() => {
          window.scrollBy(0, scrollSpeed);
        }, 20);
      }
      // Scroll up if near top
      else if (mouseY < scrollZone) {
        scrollInterval = setInterval(() => {
          window.scrollBy(0, -scrollSpeed);
        }, 20);
      }
    };
    
    const handleDragEnd = () => {
      if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
      }
    };
    
    if (isEditMode) {
      document.addEventListener('dragover', handleDragOver);
      document.addEventListener('dragend', handleDragEnd);
      document.addEventListener('drop', handleDragEnd);
    }
    
    return () => {
      if (scrollInterval) {
        clearInterval(scrollInterval);
      }
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragend', handleDragEnd);
      document.removeEventListener('drop', handleDragEnd);
    };
  }, [isEditMode]);

  // Fetch courses, rooms, teachers for modal dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          return;
        }
        
        if (!user) {
          return;
        }

        // Use instituteObjectId from AuthContext (same as Courses page)
        const instituteParam = instituteObjectId || user?.instituteID;
        
        if (!instituteParam) {
          // Continue anyway - we can still fetch data
        }

        // Fetch courses - needs instituteID in URL path
        if (instituteParam) {
          try {
            const coursesUrl = `http://localhost:5000/api/courses/${instituteParam}`;
            const coursesRes = await fetch(coursesUrl, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (coursesRes.ok) {
              const coursesData = await coursesRes.json();
              let courses = Array.isArray(coursesData) ? coursesData : (coursesData.data || coursesData.courses || []);
              setAllCourses(courses);
            } else {
              setAllCourses([]);
            }
          } catch (err) {
            setAllCourses([]);
          }
        } else {
          setAllCourses([]);
        }

        // Fetch rooms
        try {
          const roomsUrl = 'http://localhost:5000/api/rooms';
          const roomsRes = await fetch(roomsUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (roomsRes.ok) {
            const roomsData = await roomsRes.json();
            let rooms = Array.isArray(roomsData) ? roomsData : (roomsData.data || roomsData.rooms || []);
            setAllRooms(rooms);
          } else {
            setAllRooms([]);
          }
        } catch (err) {
          setAllRooms([]);
        }

        // Fetch teachers - use /institute endpoint with protection
        try {
          const teachersUrl = 'http://localhost:5000/api/users/institute';
          const teachersRes = await fetch(teachersUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (teachersRes.ok) {
            const teachersData = await teachersRes.json();
            let teachers = Array.isArray(teachersData) ? teachersData : (teachersData.data || teachersData.users || []);
            // Filter only teachers
            teachers = teachers.filter(t => t.designation === 'Teacher');
            setAllTeachers(teachers);
          } else {
            setAllTeachers([]);
          }
        } catch (err) {
          setAllTeachers([]);
        }
      } catch (err) {
        // Error fetching dropdown data
      }
    };

    if (isEditMode) {
      fetchDropdownData();
    }
  }, [isEditMode, user, instituteObjectId]);
  
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
          setInstituteInfo(data);
        }
      } catch (err) {
        
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
    setDetails([]); // Clear immediately to prevent stale data mixing
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

  const enterEditMode = useCallback(() => {
    // Create a complete grid with all possible cells (including empty ones)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const allClasses = [...new Set(details.map(d => String(d.class || '')))];
    const allTimes = [...new Set(details.map(d => String(d.time || '')).filter(Boolean))].sort();
    
    // Store all classes for removal boxes
    setAllClasses(allClasses);
    
    // Build a map of existing data
    const existingData = new Map();
    details.forEach(d => {
      const key = `${d.class}|${d.day}|${d.time}`;
      existingData.set(key, { ...d });
    });
    
    // Create complete grid with all cells
    const completeGrid = [];
    allClasses.forEach(cls => {
      days.forEach(day => {
        allTimes.forEach(time => {
          const key = `${cls}|${day}|${time}`;
          if (existingData.has(key)) {
            completeGrid.push(existingData.get(key));
          } else {
            // Create empty cell placeholder
            completeGrid.push({
              class: cls,
              day: day,
              time: time,
              course: '',
              roomNumber: '',
              instructorName: '',
              breakStart: details[0]?.breakStart || '',
              breakEnd: details[0]?.breakEnd || ''
            });
          }
        });
      });
    });
    
    setEditDetails(completeGrid);
    setSwapBox({});
    setSelectedCells([]);
    setIsEditMode(true);
    setSuccessMessage('');
    setError('');
  }, [details]);

  const cancelEditMode = useCallback(() => {
    setIsEditMode(false);
    setEditDetails([]);
    setSwapBox({});
    setSelectedCells([]);
    setShowCellModal(false);
    setModalCellData(null);
    setHoveredCell(null);
    setSuccessMessage('');
    setError('');
  }, []);

  const saveEditedTimetable = useCallback(async () => {
    if (!selected) return;
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      const token = localStorage.getItem('token');
      
      const res = await fetch(`http://localhost:5000/api/timetables-gen/details/${encodeURIComponent(selected.instituteTimeTableID)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ details: editDetails })
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      setDetails(editDetails);
      setIsEditMode(false);
      setSwapBox({});
      setSelectedCells([]);
      setSuccessMessage('Timetable updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (e) {
      setError('Failed to save timetable changes');
    } finally {
      setLoading(false);
    }
  }, [selected, editDetails]);

  // Click to select cells
  const handleCellClick = useCallback((cellIndex, className) => {
    if (!isEditMode) return;
    
    const alreadySelected = selectedCells.findIndex(s => s.index === cellIndex);
    if (alreadySelected >= 0) {
      // Deselect
      setSelectedCells(selectedCells.filter((_, i) => i !== alreadySelected));
    } else {
      // Only allow selecting up to 2 cells from same class
      if (selectedCells.length >= 2) {
        // Already have 2 selected, don't allow more
        return;
      }
      
      if (selectedCells.length === 1 && selectedCells[0].class !== className) {
        // First selection is from different class, don't allow
        return;
      }
      
      setSelectedCells([...selectedCells, { index: cellIndex, class: className }]);
    }
  }, [isEditMode, selectedCells]);

  // Remove cell content (make it empty)
  const handleRemoveCell = useCallback((cellIndex) => {
    const newDetails = [...editDetails];
    newDetails[cellIndex] = {
      ...newDetails[cellIndex],
      course: '',
      roomNumber: '',
      instructorName: ''
    };
    setEditDetails(newDetails);
    setSelectedCells(selectedCells.filter(s => s.index !== cellIndex));
  }, [editDetails, selectedCells]);

  // Open modal to add/update cell
  const handleOpenCellModal = useCallback((cellIndex, isEmpty) => {
    const cellData = editDetails[cellIndex];
    setModalCellData({ index: cellIndex, isEmpty });
    setModalForm({
      course: cellData?.course || '',
      room: cellData?.roomNumber || '',
      instructor: cellData?.instructorName || ''
    });
    setShowCellModal(true);
  }, [editDetails]);

  // Save cell data from modal
  const handleSaveCellModal = useCallback(() => {
    if (!modalCellData || !modalForm.course) return;
    
    const newDetails = [...editDetails];
    newDetails[modalCellData.index] = {
      ...newDetails[modalCellData.index],
      course: modalForm.course,
      roomNumber: modalForm.room,
      instructorName: modalForm.instructor
    };
    setEditDetails(newDetails);
    setShowCellModal(false);
    setModalCellData(null);
    setHoveredCell(null);
  }, [editDetails, modalCellData, modalForm]);

  // Close modal
  const handleCloseCellModal = useCallback(() => {
    setShowCellModal(false);
    setModalCellData(null);
  }, []);

  // Drag start from timetable cell
  const handleDragStart = useCallback((e, cell, cellIndex, className) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('cellIndex', cellIndex.toString());
    e.dataTransfer.setData('cellData', JSON.stringify(cell));
    e.dataTransfer.setData('className', className);
  }, []);

  // Drop to swap box (removes from timetable, adds to swap box)
  const handleDropToSwapBox = useCallback((e, targetClass) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const cellIndex = parseInt(e.dataTransfer.getData('cellIndex'), 10);
      const className = e.dataTransfer.getData('className');
      const cellDataStr = e.dataTransfer.getData('cellData');
      
      if (isNaN(cellIndex) || cellIndex < 0 || !className || !cellDataStr) return;
      
      const cellData = JSON.parse(cellDataStr);
      const actualClass = className; // Use the class from the dragged cell
      
      // Add to swap box for this class
      setSwapBox(prev => ({
        ...prev,
        [actualClass]: [...(prev[actualClass] || []), { ...cellData, originalIndex: cellIndex }]
      }));
      
      // Make the cell empty in timetable
      const newDetails = [...editDetails];
      newDetails[cellIndex] = {
        ...newDetails[cellIndex],
        course: '',
        roomNumber: '',
        instructorName: ''
      };
      setEditDetails(newDetails);
    } catch (error) {
      // Error dropping to swap box
    }
  }, [editDetails]);

  // Remove from swap box (just removes, doesn't put back)
  const handleRemoveFromSwapBox = useCallback((className, idx) => {
    setSwapBox(prev => ({
      ...prev,
      [className]: prev[className].filter((_, i) => i !== idx)
    }));
  }, []);

  // Drop from swap box or timetable to empty cell
  const handleDropToCell = useCallback((e, targetCellIndex, targetClassName) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const sourceCellIndex = e.dataTransfer.getData('cellIndex');
      const sourceClassName = e.dataTransfer.getData('className');
      const cellDataStr = e.dataTransfer.getData('cellData');
      const swapBoxIndex = e.dataTransfer.getData('swapBoxIndex');
      
      // Must be same class
      if (sourceClassName !== targetClassName) return;
      
      // Target must be valid and empty
      const targetCell = editDetails[targetCellIndex];
      if (!targetCell || targetCell.course) return; // Invalid or not empty
      
      const cellData = JSON.parse(cellDataStr);
      const newDetails = [...editDetails];
      
      // Place the data in target cell
      newDetails[targetCellIndex] = {
        ...newDetails[targetCellIndex],
        course: cellData.course,
        roomNumber: cellData.roomNumber,
        instructorName: cellData.instructorName
      };
      
      // If source was from timetable (has valid index), clear it
      if (sourceCellIndex && sourceCellIndex !== 'swap') {
        const srcIdx = parseInt(sourceCellIndex, 10);
        if (!isNaN(srcIdx) && srcIdx >= 0) {
          newDetails[srcIdx] = {
            ...newDetails[srcIdx],
            course: '',
            roomNumber: '',
            instructorName: ''
          };
        }
      }
      // If source was from swap box, remove it from swap box
      else if (sourceCellIndex === 'swap' && swapBoxIndex) {
        const idx = parseInt(swapBoxIndex, 10);
        if (!isNaN(idx) && idx >= 0) {
          setSwapBox(prev => ({
            ...prev,
            [sourceClassName]: prev[sourceClassName].filter((_, i) => i !== idx)
          }));
        }
      }
      
      setEditDetails(newDetails);
    } catch (error) {
      // Error dropping to cell
    }
  }, [editDetails]);

  // Drag start from swap box
  const handleDragFromSwapBox = useCallback((e, cell, className, swapBoxIndex) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('cellIndex', 'swap');
    e.dataTransfer.setData('cellData', JSON.stringify(cell));
    e.dataTransfer.setData('className', className);
    e.dataTransfer.setData('swapBoxIndex', swapBoxIndex.toString());
  }, []);

  // Add new class
  const handleAddNewClass = useCallback(() => {
    if (!newClassName || !newClassName.trim()) return;
    
    const className = newClassName.trim();
    
    // Check if class already exists
    if (allClasses.includes(className)) {
      setError('Class already exists');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    // Get time slots from existing details
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const allTimes = [...new Set(editDetails.map(d => String(d.time || '')).filter(Boolean))].sort();
    
    if (allTimes.length === 0) {
      setError('No time slots found. Cannot create class.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    // Create empty cells for new class
    const newCells = [];
    days.forEach(day => {
      allTimes.forEach(time => {
        newCells.push({
          class: className,
          day: day,
          time: time,
          course: '',
          roomNumber: '',
          instructorName: '',
          breakStart: editDetails[0]?.breakStart || '',
          breakEnd: editDetails[0]?.breakEnd || ''
        });
      });
    });
    
    // Add new cells to editDetails
    setEditDetails([...editDetails, ...newCells]);
    setAllClasses([...allClasses, className]);
    setShowAddClassModal(false);
    setNewClassName('');
    setSuccessMessage(`Class ${className} added successfully!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  }, [newClassName, allClasses, editDetails]);

  // Open add class modal
  const handleOpenAddClassModal = useCallback(async () => {
    setNewClassName('');
    setShowAddClassModal(true);
    
    // Fetch existing classes from database
    try {
      const token = localStorage.getItem('token');
      const instituteParam = instituteObjectId || user?.instituteID;
      
      if (instituteParam) {
        const response = await fetch(`http://localhost:5000/api/classes/${instituteParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const classesData = await response.json();
          // Extract class names from the database
          const classNames = classesData.map(c => {
            // Build class name from degree, session, section
            return `${c.degree || ''}${c.section || ''}`.trim() || c.className || c.name || String(c.classID);
          }).filter(Boolean);
          setExistingClassesFromDB(classNames);
        }
      }
    } catch (err) {
      // If fetch fails, just continue without suggestions
    }
  }, [user, instituteObjectId]);

  // Close add class modal
  const handleCloseAddClassModal = useCallback(() => {
    setShowAddClassModal(false);
    setNewClassName('');
  }, []);

  // Open time settings modal
  const handleOpenTimeSettingsModal = useCallback(() => {
    // Extract current time settings from existing details
    if (editDetails.length > 0) {
      const times = [...new Set(editDetails.map(d => d.time).filter(Boolean))];
      if (times.length > 0) {
        // Parse first and last time to get start and end
        const sortedTimes = times.sort();
        const firstTime = sortedTimes[0].split('-')[0];
        const lastTimeRange = sortedTimes[sortedTimes.length - 1];
        const lastTime = lastTimeRange.split('-')[1];
        
        // Calculate duration from first time slot
        const [start, end] = sortedTimes[0].split('-');
        let duration = 60;
        if (start && end) {
          const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
          const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
          duration = endMinutes - startMinutes;
        }
        
        // Extract break settings
        const sampleDetail = editDetails.find(d => d.breakStart && d.breakEnd);
        let hasBreak = false;
        let breakAfterLecture = 3;
        let breakDuration = 30;
        
        if (sampleDetail && sampleDetail.breakStart && sampleDetail.breakEnd) {
          hasBreak = true;
          const [breakStartHour, breakStartMin] = sampleDetail.breakStart.split(':').map(Number);
          const breakStartMinutes = breakStartHour * 60 + breakStartMin;
          const [breakEndHour, breakEndMin] = sampleDetail.breakEnd.split(':').map(Number);
          const breakEndMinutes = breakEndHour * 60 + breakEndMin;
          breakDuration = breakEndMinutes - breakStartMinutes;
          
          // Find which lecture the break comes after
          for (let i = 0; i < sortedTimes.length; i++) {
            const [, slotEnd] = sortedTimes[i].split('-');
            const [slotEndHour, slotEndMin] = slotEnd.split(':').map(Number);
            const slotEndMinutes = slotEndHour * 60 + slotEndMin;
            
            if (slotEndMinutes === breakStartMinutes) {
              breakAfterLecture = i + 1;
              break;
            } else if (slotEndMinutes < breakStartMinutes) {
              breakAfterLecture = i + 1;
            }
          }
        }
          
        setTimeSettings({
          startTime: firstTime,
          endTime: lastTime,
          lectureDuration: duration,
          hasBreak,
          breakAfterLecture,
          breakDuration
        });
      }
    }
    setShowTimeSettingsModal(true);
  }, [editDetails]);

  // Close time settings modal
  const handleCloseTimeSettingsModal = useCallback(() => {
    setShowTimeSettingsModal(false);
  }, []);

  // Update time settings and regenerate only the selected timetable
  const handleUpdateTimeSettings = useCallback(async () => {
    const { startTime, endTime, lectureDuration, hasBreak, breakAfterLecture, breakDuration } = timeSettings;
    
    if (!startTime || !endTime || !lectureDuration || lectureDuration <= 0) {
      setError('Please enter valid time settings');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (hasBreak && (!breakAfterLecture || breakAfterLecture <= 0 || !breakDuration || breakDuration <= 0)) {
      setError('Please enter valid break settings');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    // Parse start and end times
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (startMinutes >= endMinutes) {
      setError('End time must be after start time');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Additional validations
    if (lectureDuration < 30) {
      setError('Lecture duration must be at least 30 minutes');
      setTimeout(() => setError(''), 3000);
      return;
    }
    const totalWindow = endMinutes - startMinutes;
    const effectiveWindow = totalWindow - (hasBreak ? breakDuration : 0);
    if (effectiveWindow < lectureDuration) {
      setError('Time window too short for selected duration and break');
      setTimeout(() => setError(''), 3000);
      return;
    }
    const possibleLectures = Math.floor(effectiveWindow / lectureDuration);
    if (hasBreak && breakAfterLecture > possibleLectures) {
      setError(`Break after lecture exceeds possible count (${possibleLectures})`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    // Use break settings from modal
    const breakAfterLectureNum = hasBreak ? breakAfterLecture : null;
    const breakDurationMinutes = hasBreak ? breakDuration : 0;
    
    // Generate new time slots with break inserted
    const newTimeSlots = [];
    let currentMinutes = startMinutes;
    let lectureCount = 0;
    let newBreakStart = '';
    let newBreakEnd = '';
    
    while (currentMinutes + lectureDuration <= endMinutes) {
      lectureCount++;
      
      const slotStartHour = Math.floor(currentMinutes / 60);
      const slotStartMin = currentMinutes % 60;
      const slotEndMinutes = currentMinutes + lectureDuration;
      const slotEndHour = Math.floor(slotEndMinutes / 60);
      const slotEndMin = slotEndMinutes % 60;
      
      const slotStart = `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMin).padStart(2, '0')}`;
      const slotEnd = `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMin).padStart(2, '0')}`;
      newTimeSlots.push(`${slotStart}-${slotEnd}`);
      
      currentMinutes += lectureDuration;
      
      // Insert break after the determined lecture position
      if (breakAfterLectureNum !== null && lectureCount === breakAfterLectureNum && breakDurationMinutes > 0) {
        // Calculate new break times
        const breakStartMinutes = currentMinutes;
        let breakEndMinutes = currentMinutes + breakDurationMinutes;
        // Clamp break end to not exceed overall endMinutes
        if (breakEndMinutes > endMinutes) breakEndMinutes = endMinutes;
        
        const breakStartHour = Math.floor(breakStartMinutes / 60);
        const breakStartMin = breakStartMinutes % 60;
        const breakEndHour = Math.floor(breakEndMinutes / 60);
        const breakEndMin = breakEndMinutes % 60;
        
        newBreakStart = `${String(breakStartHour).padStart(2, '0')}:${String(breakStartMin).padStart(2, '0')}`;
        newBreakEnd = `${String(breakEndHour).padStart(2, '0')}:${String(breakEndMin).padStart(2, '0')}`;
        
        // Skip ahead by break duration
        currentMinutes += (breakEndMinutes - breakStartMinutes);
      }
    }
    
    if (newTimeSlots.length === 0) {
      setError('No time slots can be generated with these settings');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    // Create a map of existing data by class, day, and old time index
    const existingDataMap = new Map();
    const oldTimeSlots = [...new Set(editDetails.map(d => d.time).filter(Boolean))].sort();
    
    editDetails.forEach(detail => {
      const oldTimeIndex = oldTimeSlots.indexOf(detail.time);
      const key = `${detail.class}|${detail.day}|${oldTimeIndex}`;
      existingDataMap.set(key, {
        course: detail.course,
        roomNumber: detail.roomNumber,
        instructorName: detail.instructorName
      });
    });
    
    // Regenerate all timetable data with new time slots
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const newEditDetails = [];
    
    allClasses.forEach(className => {
      days.forEach(day => {
        newTimeSlots.forEach((timeSlot, newTimeIndex) => {
          // Try to preserve data from corresponding old time slot
          const key = `${className}|${day}|${newTimeIndex}`;
          const existingData = existingDataMap.get(key) || {
            course: '',
            roomNumber: '',
            instructorName: ''
          };
          
          newEditDetails.push({
            class: className,
            day: day,
            time: timeSlot,
            course: existingData.course,
            roomNumber: existingData.roomNumber,
            instructorName: existingData.instructorName,
            breakStart: newBreakStart,
            breakEnd: newBreakEnd
          });
        });
      });
    });
    
    setEditDetails(newEditDetails);
    setShowTimeSettingsModal(false);
    setRenderKey(prev => prev + 1); // Force re-render

    // Persist break window on the header for this timetable only (optional)
    try {
      const token = localStorage.getItem('token');
      if (selected && token) {
        await fetch(`http://localhost:5000/api/timetables-gen/header/${encodeURIComponent(selected.instituteTimeTableID)}` , {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ breakStart: newBreakStart || undefined, breakEnd: newBreakEnd || undefined })
        });
      }
    } catch (_) {
      // Non-blocking: header persist is best-effort
    }

    const breakMsg = hasBreak 
      ? ` Break set after lecture ${breakAfterLecture} (${breakDuration} min).`
      : ' No break time set.';
    setSuccessMessage(`Time settings updated for the selected timetable.${breakMsg}`);
    setTimeout(() => setSuccessMessage(''), 4000);
  }, [timeSettings, editDetails, allClasses, selected]);

  return (
    <Container fluid className="p-3 p-md-4" style={{ minHeight: '100vh' }}>
      {/* Header Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="mb-4"
      >
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3 mb-4" style={{ paddingTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(126, 34, 206, 0.3)'
            }}>
              <FaCalendarAlt style={{ fontSize: '1.5rem', color: 'white' }} />
            </div>
            <div>
              <h2 style={{ 
                fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.5rem'
              }}>
                Time Tables Management
              </h2>
              <p style={{ 
                fontSize: 'clamp(0.85rem, 1.8vw, 0.95rem)',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
                fontWeight: '600'
              }}>
                Explore all timetables of your institute
              </p>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 no-print">
            {selected && !isEditMode && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="success"
                  onClick={handlePrint}
                  className="d-flex align-items-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  <FaPrint style={{ fontSize: '0.875rem' }} /> Print
                </Button>
              </motion.div>
            )}
            {isAdmin && (
              <>
                {!isEditMode && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={generateTimetable}
                      disabled={loading}
                      className="d-flex align-items-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        boxShadow: '0 2px 8px rgba(126, 34, 206, 0.25)',
                        opacity: loading ? 0.6 : 1
                      }}
                    >
                      <FaPlus style={{ fontSize: '0.875rem' }} /> Generate New
                    </Button>
                  </motion.div>
                )}
                {selected && isEditMode && (
                  <>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={handleOpenTimeSettingsModal}
                        disabled={loading}
                        className="d-flex align-items-center gap-2"
                        style={{
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
                          opacity: loading ? 0.6 : 1
                        }}
                      >
                        <FaClock style={{ fontSize: '0.875rem' }} /> Time Settings
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={handleOpenAddClassModal}
                        disabled={loading}
                        className="d-flex align-items-center gap-2"
                        style={{
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          boxShadow: '0 2px 8px rgba(139, 92, 246, 0.25)',
                          opacity: loading ? 0.6 : 1
                        }}
                      >
                        <FaPlus style={{ fontSize: '0.875rem' }} /> Add Class
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={saveEditedTimetable}
                        disabled={loading}
                        className="d-flex align-items-center gap-2"
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                          opacity: loading ? 0.6 : 1
                        }}
                      >
                        <FaSave style={{ fontSize: '0.875rem' }} /> Save Changes
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={cancelEditMode}
                        disabled={loading}
                        variant="secondary"
                        className="d-flex align-items-center gap-2"
                        style={{
                          background: '#6b7280',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          boxShadow: '0 2px 8px rgba(107, 114, 128, 0.25)'
                        }}
                      >
                        <FaTimes style={{ fontSize: '0.875rem' }} /> Cancel
                      </Button>
                    </motion.div>
                  </>
                )}
                {selected && !isEditMode && (
                  <>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={enterEditMode}
                        disabled={loading}
                        className="d-flex align-items-center gap-2"
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
                          opacity: loading ? 0.6 : 1
                        }}
                      >
                        <FaEdit style={{ fontSize: '0.875rem' }} /> Edit
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
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
                            await fetchList();
                          } catch (e) {
                            setError('Failed to delete timetable');
                          }
                        }}
                        disabled={loading}
                        variant="danger"
                        className="d-flex align-items-center gap-2"
                        style={{
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
                          opacity: loading ? 0.6 : 1
                        }}
                      >
                        <FaTrash style={{ fontSize: '0.875rem' }} /> Delete
                      </Button>
                    </motion.div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-4" style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
            }}>
              <Card.Body className="p-3">
                <p className="mb-0" style={{ color: '#dc2626', fontWeight: 600 }}>⚠️ {error}</p>
              </Card.Body>
            </Card>
          </motion.div>
        )}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-4" style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
            }}>
              <Card.Body className="p-3">
                <p className="mb-0" style={{ color: '#059669', fontWeight: 600 }}>✅ {successMessage}</p>
              </Card.Body>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timetable Selector - Hide in Edit Mode */}
      {items.length > 0 && !isEditMode && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-4 no-print"
        >
          <Card className="glass-effect" style={{
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}>
            <Card.Body className="p-3 p-md-4">
              <Form.Group>
                <Form.Label className="mb-2 d-flex align-items-center gap-2" style={{ fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
                  <FaCalendarAlt style={{ color: '#7e22ce', fontSize: '0.875rem' }} />
                  Select Timetable
                </Form.Label>
                <Form.Select
                  value={selected?.instituteTimeTableID || ''}
                  onChange={(e) => {
                    const selectedId = parseInt(e.target.value);
                    const timetable = items.find(h => h.instituteTimeTableID === selectedId);
                    if (timetable) setSelected(timetable);
                  }}
                  style={{
                    padding: '10px 14px',
                    fontSize: '0.9rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    backgroundColor: '#fff',
                    color: '#111827',
                    fontWeight: 500,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7e22ce';
                    e.target.style.boxShadow = '0 0 0 3px rgba(126, 34, 206, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  {items.map(h => (
                    <option key={h.instituteTimeTableID} value={h.instituteTimeTableID}>
                      Timetable {h.instituteTimeTableID} - {h.session} • {h.year}
                      {h.currentStatus ? ' ⭐ (Current)' : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {items.length === 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={scaleIn}
          className="no-print"
        >
          <Card className="text-center glass-effect" style={{
            border: '2px dashed rgba(126, 34, 206, 0.3)',
            borderRadius: '16px',
            padding: '2.5rem 1.5rem',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)'
          }}>
            <Card.Body>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem', opacity: 0.3 }}>📅</div>
              <h3 style={{ color: '#6b7280', fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.5rem' }}>No Timetables Found</h3>
              <p style={{ color: '#9ca3af', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                {isAdmin ? 'Click Generate to create your first timetable' : 'No timetables available yet'}
              </p>
              {isAdmin && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={generateTimetable}
                    style={{
                      background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                      border: 'none',
                      padding: '10px 24px',
                      borderRadius: '10px',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      boxShadow: '0 2px 8px rgba(126, 34, 206, 0.25)'
                    }}
                  >
                    <FaPlus className="me-2" style={{ fontSize: '0.875rem' }} />
                    Generate Timetable
                  </Button>
                </motion.div>
              )}
            </Card.Body>
          </Card>
        </motion.div>
      )}

      {/* Timetable Details */}
      {selected && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          id="timetable-print-content"
        >
          <Card className="glass-effect" style={{
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(15px)'
          }}>
            {/* Print Header with Institute Info */}
            {(
              () => {
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

            {/* Card Header */}
            <Card.Header className="no-print" style={{
              background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
              border: 'none',
              padding: '1.25rem 1.5rem'
            }}>
              <Row className="align-items-center">
                <Col xs={12} lg={6}>
                  <div className="d-flex align-items-center gap-3 mb-3 mb-lg-0">
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}>
                      📚
                    </div>
                    <div>
                      <h4 className="mb-1" style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>
                        Timetable #{selected.instituteTimeTableID}
                      </h4>
                      <div className="d-flex flex-wrap gap-2 align-items-center">
                        <Badge bg="light" text="dark" style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '6px' }}>
                          <FaCalendarAlt className="me-1" style={{ fontSize: '0.75rem' }} />
                          {selected.session} • {selected.year}
                        </Badge>
                        {selected.currentStatus && (
                          <Badge style={{
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                            fontSize: '0.8rem',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: 'none'
                          }}>
                            <FaStar className="me-1" style={{ fontSize: '0.75rem' }} />
                            Current
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Col>
                
                {isAdmin && (
                  <Col xs={12} lg={6}>
                    <div className="d-flex flex-wrap gap-3 justify-content-lg-end">
                      <Form.Check
                        type="switch"
                        id="visibility-switch"
                        label={
                          <span className="d-flex align-items-center gap-2" style={{ color: '#fff', fontWeight: 500, fontSize: '0.9rem' }}>
                            {selected.visibility ? <FaEye style={{ fontSize: '0.875rem' }} /> : <FaEyeSlash style={{ fontSize: '0.875rem' }} />}
                            {selected.visibility ? 'Visible' : 'Hidden'}
                          </span>
                        }
                        checked={!!selected.visibility}
                        onChange={(e) => updateHeader(selected.instituteTimeTableID, { visibility: e.target.checked })}
                      />
                      <Form.Check
                        type="switch"
                        id="current-switch"
                        label={
                          <span className="d-flex align-items-center gap-2" style={{ color: '#fff', fontWeight: 500, fontSize: '0.9rem' }}>
                            <FaStar style={{ fontSize: '0.875rem' }} />
                            Current
                          </span>
                        }
                        checked={!!selected.currentStatus}
                        onChange={(e) => updateHeader(selected.instituteTimeTableID, { currentStatus: e.target.checked })}
                      />
                    </div>
                  </Col>
                )}
              </Row>
            </Card.Header>

            <Card.Body className="p-3 p-md-4">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" style={{ color: '#7e22ce', width: '2.5rem', height: '2.5rem' }} role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3" style={{ color: '#6b7280', fontWeight: 500, fontSize: '0.9rem' }}>Loading timetable details...</p>
                </div>
              ) : (
                <>
                  {/* Removal Boxes - Only in Edit Mode */}
                  {isEditMode && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4"
                    >
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <FaTrash style={{ color: '#ef4444', fontSize: '1.2rem' }} />
                        <h5 className="mb-0" style={{
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: '#dc2626'
                        }}>
                          Removed Cells
                        </h5>
                      </div>

                      {Object.keys(swapBox).length === 0 ? (
                        <Card style={{
                          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%)',
                          border: '2px dashed #ef4444',
                          borderRadius: '16px',
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
                        }}>
                          <Card.Body className="p-3">
                            <div
                              style={{
                                minHeight: '100px',
                                padding: '16px',
                                borderRadius: '12px',
                                border: '2px dashed rgba(239, 68, 68, 0.3)',
                                background: 'rgba(239, 68, 68, 0.03)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#9ca3af',
                                fontSize: '0.875rem',
                                fontStyle: 'italic',
                                transition: 'all 0.3s ease'
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.style.borderColor = '#ef4444';
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                              }}
                              onDragLeave={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.03)';
                              }}
                              onDrop={(e) => {
                                handleDropToSwapBox(e, null);
                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.03)';
                              }}
                            >
                              Drag cells here to remove them from timetable
                            </div>
                          </Card.Body>
                        </Card>
                      ) : (
                        <div className="d-flex flex-column gap-3">
                          {Object.keys(swapBox).map(className => (
                          <Card key={className} style={{
                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%)',
                            border: '2px dashed #ef4444',
                            borderRadius: '16px',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
                          }}>
                            <Card.Body className="p-3">
                              <div style={{
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                color: '#374151',
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <FaDoorOpen style={{ color: '#ef4444', fontSize: '1rem' }} />
                                Class: {className}
                              </div>

                              <div
                                style={{
                                  minHeight: '80px',
                                  padding: '12px',
                                  borderRadius: '12px',
                                  border: '2px dashed rgba(239, 68, 68, 0.3)',
                                  background: 'rgba(239, 68, 68, 0.03)',
                                  transition: 'all 0.3s ease'
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.currentTarget.style.borderColor = '#ef4444';
                                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                }}
                                onDragLeave={(e) => {
                                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.03)';
                                }}
                                onDrop={(e) => {
                                  handleDropToSwapBox(e, className);
                                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.03)';
                                }}
                              >
                                <div className="d-flex gap-2 flex-wrap">
                                  {swapBox[className].map((cell, idx) => (
                                      <motion.div
                                        key={idx}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        draggable
                                        onDragStart={(e) => handleDragFromSwapBox(e, cell, className, idx)}
                                        style={{
                                          background: 'white',
                                          border: '2px solid #ef4444',
                                          borderRadius: '10px',
                                          padding: '10px',
                                          minWidth: '180px',
                                          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)',
                                          position: 'relative',
                                          cursor: 'grab'
                                        }}
                                        onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'}
                                        onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'}
                                      >
                                        <button
                                          onClick={() => handleRemoveFromSwapBox(className, idx)}
                                          style={{
                                            position: 'absolute',
                                            top: '4px',
                                            right: '4px',
                                            background: '#ef4444',
                                            border: 'none',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: '20px',
                                            height: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold'
                                          }}
                                        >
                                          ×
                                        </button>
                                        <div style={{
                                          fontSize: '0.75rem',
                                          fontWeight: 700,
                                          color: '#111827',
                                          marginBottom: '4px'
                                        }}>
                                          {cell.course}
                                        </div>
                                        <div style={{
                                          fontSize: '0.65rem',
                                          fontWeight: 600,
                                          color: '#6b7280',
                                          marginBottom: '2px'
                                        }}>
                                          <FaDoorOpen className="me-1" style={{ fontSize: '0.6rem' }} />
                                          {cell.roomNumber}
                                        </div>
                                        <div style={{
                                          fontSize: '0.65rem',
                                          fontWeight: 600,
                                          color: '#6b7280'
                                        }}>
                                          <FaChalkboardTeacher className="me-1" style={{ fontSize: '0.6rem' }} />
                                          {cell.instructorName}
                                        </div>
                                        <div style={{
                                          fontSize: '0.6rem',
                                          fontWeight: 600,
                                          color: '#9ca3af',
                                          marginTop: '4px'
                                        }}>
                                          {cell.day} - {cell.time}
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                            </Card.Body>
                          </Card>
                        ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                  
                  <TimetableTables 
                    key={`timetable-${renderKey}`}
                    details={isEditMode ? editDetails : details} 
                    header={selected} 
                    isEditMode={isEditMode}
                    onDragStart={handleDragStart}
                    onDropToCell={handleDropToCell}
                    onCellClick={handleCellClick}
                    onRemoveCell={handleRemoveCell}
                    selectedCells={selectedCells}
                    setSelectedCells={setSelectedCells}
                    editDetails={editDetails}
                    swappingCells={swappingCells}
                    setSwappingCells={setSwappingCells}
                    hoveredCell={hoveredCell}
                    setHoveredCell={setHoveredCell}
                    handleOpenCellModal={handleOpenCellModal}
                    setEditDetails={(newDetails) => {
                      setEditDetails(newDetails);
                      setRenderKey(prev => prev + 1);
                    }}
                  />
                </>
              )}
            </Card.Body>
          </Card>
        </motion.div>
      )}

      {/* Time Settings Modal */}
      <AnimatePresence>
        {showTimeSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            onClick={handleCloseTimeSettingsModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '500px',
                width: '90%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, color: '#1f2937', fontSize: '1.25rem', fontWeight: 600 }}>
                  <FaClock style={{ marginRight: '8px', color: '#f59e0b' }} />
                  Update Time Settings
                </h4>
                <button
                  onClick={handleCloseTimeSettingsModal}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e', fontWeight: 500 }}>
                  ⚠️ This updates time slots for this timetable only. Existing cells try to keep their course/room/teacher by slot position.
                </p>
              </div>

              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaClock color="#f59e0b" />
                        Start Time *
                      </Form.Label>
                      <Form.Control
                        type="time"
                        value={timeSettings.startTime}
                        onChange={(e) => setTimeSettings({ ...timeSettings, startTime: e.target.value })}
                        style={{ borderColor: '#d1d5db' }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaClock color="#f59e0b" />
                        End Time *
                      </Form.Label>
                      <Form.Control
                        type="time"
                        value={timeSettings.endTime}
                        onChange={(e) => setTimeSettings({ ...timeSettings, endTime: e.target.value })}
                        style={{ borderColor: '#d1d5db' }}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaClock color="#f59e0b" />
                    Lecture Duration (minutes) *
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="30"
                    max="180"
                    step="5"
                    value={timeSettings.lectureDuration}
                    onChange={(e) => setTimeSettings({ ...timeSettings, lectureDuration: parseInt(e.target.value) || 60 })}
                    style={{ borderColor: '#d1d5db' }}
                  />
                  <Form.Text className="text-muted">
                    Common values: 30, 45, 60, 75, 90 minutes
                  </Form.Text>
                </Form.Group>

                <hr style={{ margin: '24px 0', border: 'none', borderTop: '2px solid #e5e7eb' }} />

                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="break-time-switch"
                    label={
                      <span style={{ fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaClock color="#f59e0b" />
                        Include Break Time
                      </span>
                    }
                    checked={timeSettings.hasBreak}
                    onChange={(e) => setTimeSettings({ ...timeSettings, hasBreak: e.target.checked })}
                    style={{ fontSize: '1rem' }}
                  />
                  <Form.Text className="text-muted">
                    Toggle to add or remove break time from the timetable
                  </Form.Text>
                </Form.Group>

                {timeSettings.hasBreak && (
                  <>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label style={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                            Break After Lecture # *
                          </Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            max="10"
                            value={timeSettings.breakAfterLecture}
                            onChange={(e) => setTimeSettings({ ...timeSettings, breakAfterLecture: parseInt(e.target.value) || 3 })}
                            style={{ borderColor: '#d1d5db' }}
                          />
                          <Form.Text className="text-muted">
                            e.g., 3 = after 3rd lecture
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label style={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                            Break Duration (min) *
                          </Form.Label>
                          <Form.Control
                            type="number"
                            min="10"
                            max="90"
                            step="5"
                            value={timeSettings.breakDuration}
                            onChange={(e) => setTimeSettings({ ...timeSettings, breakDuration: parseInt(e.target.value) || 30 })}
                            style={{ borderColor: '#d1d5db' }}
                          />
                          <Form.Text className="text-muted">
                            Common: 15, 30, 45 min
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                  <Button
                    onClick={handleUpdateTimeSettings}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      border: 'none'
                    }}
                  >
                    <FaSave />
                    Apply To This Timetable
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCloseTimeSettingsModal}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 600
                    }}
                  >
                    <FaTimes />
                    Cancel
                  </Button>
                </div>
              </Form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Class Modal */}
      <AnimatePresence>
        {showAddClassModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            onClick={handleCloseAddClassModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '450px',
                width: '90%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, color: '#1f2937', fontSize: '1.25rem', fontWeight: 600 }}>
                  <FaPlus style={{ marginRight: '8px', color: '#8b5cf6' }} />
                  Add New Class
                </h4>
                <button
                  onClick={handleCloseAddClassModal}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaDoorOpen color="#8b5cf6" />
                    Class Name *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., B203, CS-A, Grade 10A"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewClass();
                      }
                    }}
                    list="existing-classes-list"
                    style={{ borderColor: '#d1d5db' }}
                    autoFocus
                  />
                  <datalist id="existing-classes-list">
                    {existingClassesFromDB.map((className, idx) => (
                      <option key={idx} value={className} />
                    ))}
                  </datalist>
                  <Form.Text className="text-muted">
                    {existingClassesFromDB.length > 0 ? (
                      <>
                        Showing {existingClassesFromDB.length} existing class{existingClassesFromDB.length !== 1 ? 'es' : ''} from database. Type to see suggestions or enter a new unique name.
                      </>
                    ) : (
                      'Enter a unique name for the new class. A complete timetable grid will be created.'
                    )}
                  </Form.Text>
                </Form.Group>

                <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                  <Button
                    onClick={handleAddNewClass}
                    disabled={!newClassName || !newClassName.trim()}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      border: 'none',
                      opacity: (!newClassName || !newClassName.trim()) ? 0.5 : 1
                    }}
                  >
                    <FaPlus />
                    Add Class
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCloseAddClassModal}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 600
                    }}
                  >
                    <FaTimes />
                    Cancel
                  </Button>
                </div>
              </Form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cell Add/Update Modal */}
      <AnimatePresence>
        {showCellModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            onClick={handleCloseCellModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '500px',
                width: '90%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, color: '#1f2937', fontSize: '1.25rem', fontWeight: 600 }}>
                  {modalCellData?.isEmpty ? (
                    <>
                      <FaPlus style={{ marginRight: '8px', color: '#10b981' }} />
                      Add Class
                    </>
                  ) : (
                    <>
                      <FaEdit style={{ marginRight: '8px', color: '#3b82f6' }} />
                      Update Class
                    </>
                  )}
                </h4>
                <button
                  onClick={handleCloseCellModal}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaGraduationCap color="#7e22ce" />
                    Course * ({allCourses.length} available)
                  </Form.Label>
                  <Form.Select
                    value={modalForm.course}
                    onChange={(e) => setModalForm({ ...modalForm, course: e.target.value })}
                    style={{ borderColor: '#d1d5db' }}
                  >
                    <option value="">Select Course</option>
                    {allCourses.map((course, idx) => {
                      const displayText = course.courseCode && course.courseTitle 
                        ? `${course.courseCode} - ${course.courseTitle}`
                        : (course.courseTitle || course.courseCode || course.courseName || course.name || 'Unknown');
                      const valueText = course.courseTitle || course.courseCode || course.courseName || course.name;
                      return (
                        <option key={course._id || idx} value={valueText}>
                          {displayText}
                        </option>
                      );
                    })}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaDoorOpen color="#059669" />
                    Room ({allRooms.length} available)
                  </Form.Label>
                  <Form.Select
                    value={modalForm.room}
                    onChange={(e) => setModalForm({ ...modalForm, room: e.target.value })}
                    style={{ borderColor: '#d1d5db' }}
                  >
                    <option value="">Select Room</option>
                    {allRooms.map((room, idx) => (
                      <option key={room._id || idx} value={room.roomNumber || room.number}>
                        {room.roomNumber || room.number}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaChalkboardTeacher color="#3b82f6" />
                    Instructor ({allTeachers.length} available)
                  </Form.Label>
                  <Form.Select
                    value={modalForm.instructor}
                    onChange={(e) => setModalForm({ ...modalForm, instructor: e.target.value })}
                    style={{ borderColor: '#d1d5db' }}
                  >
                    <option value="">Select Instructor</option>
                    {allTeachers.map((teacher, idx) => (
                      <option key={teacher._id || idx} value={teacher.userName || teacher.name}>
                        {teacher.userName || teacher.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                  <Button
                    variant="success"
                    onClick={handleSaveCellModal}
                    disabled={!modalForm.course}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 600
                    }}
                  >
                    <FaSave />
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCloseCellModal}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 600
                    }}
                  >
                    <FaTimes />
                    Cancel
                  </Button>
                </div>
              </Form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
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

function TimetableTables({ 
  details, 
  header, 
  isEditMode = false, 
  onDragStart = null, 
  onDropToCell = null,
  onCellClick = null,
  onRemoveCell = null,
  selectedCells = [],
  setSelectedCells = null,
  editDetails = [],
  setEditDetails = null,
  swappingCells = null,
  setSwappingCells = null,
  hoveredCell = null,
  setHoveredCell = null,
  handleOpenCellModal = null
}) {
  if (!Array.isArray(details) || details.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-5"
        style={{
          background: 'linear-gradient(135deg, rgba(126, 34, 206, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
          borderRadius: '14px',
          border: '2px dashed rgba(126, 34, 206, 0.2)'
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.3 }}>📋</div>
        <p style={{ color: '#6b7280', fontWeight: 500, fontSize: '0.95rem' }}>No schedule data available</p>
      </motion.div>
    );
  }

  // Build unique sets
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  
  // Use editDetails in edit mode, otherwise use details
  const sourceData = isEditMode && editDetails.length > 0 ? editDetails : details;
  
  console.log('TimetableTables rendering:', {
    isEditMode,
    detailsLength: details.length,
    editDetailsLength: editDetails.length,
    sourceDataLength: sourceData.length,
    firstSourceBreak: sourceData[0] ? { breakStart: sourceData[0].breakStart, breakEnd: sourceData[0].breakEnd } : null
  });
  
  const baseTimes = Array.from(
    new Set(sourceData.map(d => String(d.time || '')).filter(Boolean))
  ).sort((a, b) => parseStartMinutes(a) - parseStartMinutes(b));

  // Derive a common break window from sourceData if present
  const breakPairs = {};
  for (const d of sourceData) {
    const bs = d.breakStart ? String(d.breakStart) : null;
    const be = d.breakEnd ? String(d.breakEnd) : null;
    if (bs && be) {
      const k = `${bs}-${be}`;
      breakPairs[k] = (breakPairs[k] || 0) + 1;
    }
  }
  
  console.log('Break pairs found:', breakPairs);
  
  let breakStart = null, breakEnd = null;
  // Prefer grid-derived break; if missing, fall back to header (also in edit mode)
  if (!isEditMode && header?.breakStart && header?.breakEnd) {
    breakStart = String(header.breakStart);
    breakEnd = String(header.breakEnd);
    console.log('Using header break:', { breakStart, breakEnd });
  } else if (Object.keys(breakPairs).length) {
    const top = Object.entries(breakPairs).sort((a, b) => b[1] - a[1])[0][0];
    [breakStart, breakEnd] = top.split('-');
    console.log('Using calculated break from pairs:', { breakStart, breakEnd });
  } else if (header?.breakStart && header?.breakEnd) {
    // When entering edit mode, details might not carry break; use header as fallback
    breakStart = String(header.breakStart);
    breakEnd = String(header.breakEnd);
    console.log('Fallback to header break in edit mode:', { breakStart, breakEnd });
  }
  
  console.log('Final break times to display:', { breakStart, breakEnd });

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

  // Deduplicate by unique key: class+day+time+course+room+instructor
  const seen = new Set();
  const dedupedDetails = [];
  for (const d of sourceData) {
    const key = `${d.class}|${d.day}|${d.time}|${d.course}|${d.roomNumber}|${d.instructorName}`;
    if (!seen.has(key)) {
      seen.add(key);
      dedupedDetails.push(d);
    }
  }

  // Group rows by class
  const classMap = new Map();
  for (const d of dedupedDetails) {
    const klass = String(d.class || 'Unknown');
    const day = normalizeDay(d.day);
    const time = String(d.time || '');
    if (!classMap.has(klass)) classMap.set(klass, []);
    classMap.get(klass).push({ ...d, day, time });
  }

  // Create a global index map for all cells (including empty ones in edit mode)
  const cellIndexMap = new Map();
  const dataSource = isEditMode ? editDetails : details;
  dataSource.forEach((d, idx) => {
    // For empty cells, use class|day|time as key; for filled cells, include course
    const key = d.course 
      ? `${d.class}|${normalizeDay(d.day)}|${d.time}|${d.course}`
      : `${d.class}|${normalizeDay(d.day)}|${d.time}|`;
    cellIndexMap.set(key, idx);
  });

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {Array.from(classMap.entries()).map(([klass, rows], classIndex) => {
        // Index rows for O(1) cell lookup: key = day|time
        const byKey = new Map();
        for (const r of rows) byKey.set(`${r.day}|${r.time}`, r);

        return (
          <motion.div
            key={klass}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: classIndex * 0.1 }}
            style={{
              border: '1px solid rgba(126, 34, 206, 0.15)',
              borderRadius: '16px',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.95) 100%)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
            }}
          >
            {/* Class Title Header */}
            <div style={{
              padding: '14px 18px',
              background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
              borderBottom: '1px solid rgba(126, 34, 206, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}>
                <FaGraduationCap style={{ color: '#fff' }} />
              </div>
              <h5 style={{
                margin: 0,
                color: '#fff',
                fontWeight: 700,
                fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
                letterSpacing: '0.3px'
              }}>
                Class: {klass}
              </h5>
            </div>

            {/* Responsive Table Wrapper */}
            <div className="table-responsive">
              <div style={{
                display: 'grid',
                gridTemplateColumns: `minmax(100px, 160px) repeat(${allTimes.length}, minmax(140px, 1fr))`,
                minWidth: 'fit-content'
              }}>
                {/* Header Row */}
                <div style={{
                  padding: '12px 10px',
                  background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                  fontWeight: 700,
                  color: '#374151',
                  fontSize: '0.8rem',
                  borderRight: '1px solid #e5e7eb',
                  borderBottom: '2px solid #7e22ce',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  boxShadow: '2px 0 4px rgba(0, 0, 0, 0.05)'
                }}>
                  <FaClock className="me-2" style={{ color: '#7e22ce', fontSize: '0.75rem' }} />
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
                      borderBottom: '2px solid #7e22ce',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    {typeof t !== 'string' && t.__break && <FaClock style={{ fontSize: '0.7rem' }} />}
                    {typeof t === 'string' ? t : (t.__break ? t.range : '')}
                  </div>
                ))}

                {/* Data Rows */}
                {days.map((day, di) => (
                  <React.Fragment key={day}>
                    <div style={{
                      padding: '14px 10px',
                      background: di % 2 === 0
                        ? 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)'
                        : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                      fontWeight: 700,
                      color: '#374151',
                      fontSize: '0.85rem',
                      borderRight: '1px solid #e5e7eb',
                      borderBottom: di === days.length - 1 ? 'none' : '1px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      position: 'sticky',
                      left: 0,
                      zIndex: 1,
                      boxShadow: '2px 0 4px rgba(0, 0, 0, 0.03)'
                    }}>
                      <FaCalendarAlt style={{ color: '#7e22ce', fontSize: '0.75rem' }} />
                      {day}
                    </div>

                    {allTimes.map((t, i) => {
                      if (typeof t !== 'string' && t.__break) {
                        if (di === 0) {
                          return (
                            <div
                              key={`break-col-${i}`}
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
                                gridRow: `span ${days.length}`,
                                borderRight: '1px solid #fdba74',
                                borderLeft: '2px solid #fb923c',
                                boxShadow: 'inset 0 2px 4px rgba(154, 52, 18, 0.1)'
                              }}
                            >
                              <FaClock style={{ fontSize: '0.75rem' }} />
                              Break Time
                            </div>
                          );
                        }
                        return null;
                      }

                      const row = byKey.get(`${day}|${t}`);
                      const isEmpty = !row || !row.course;
                      
                      // Build cell key - for empty cells use trailing |, for filled include course
                      const cellKey = isEmpty 
                        ? `${klass}|${day}|${t}|`
                        : `${klass}|${day}|${t}|${row.course}`;
                      const cellIndex = cellIndexMap.get(cellKey) ?? -1;
                      
                      const isSelected = isEditMode && selectedCells.some(s => s.index === cellIndex);
                      const isSwapping = swappingCells && (swappingCells.cell1 === cellIndex || swappingCells.cell2 === cellIndex);
                      
                      return (
                        <motion.div
                          key={`${day}-${i}`}
                          data-cell-index={cellIndex}
                          animate={isSwapping ? {
                            scale: [1, 1.08, 1],
                            opacity: [1, 0.8, 1],
                            backgroundColor: [
                              'rgba(255, 255, 255, 0)',
                              'rgba(16, 185, 129, 0.15)',
                              'rgba(255, 255, 255, 0)'
                            ]
                          } : {}}
                          transition={{
                            duration: 0.8,
                            ease: "easeInOut"
                          }}
                          draggable={isEditMode && !isEmpty}
                          onClick={() => {
                            if (isEditMode && !isEmpty && onCellClick) {
                              onCellClick(cellIndex, klass);
                            }
                          }}
                          onDragStart={(e) => {
                            if (isEditMode && !isEmpty && onDragStart) {
                              onDragStart(e, row, cellIndex, klass);
                            }
                          }}
                          onDragOver={(e) => {
                            if (isEditMode && isEmpty) {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                              e.currentTarget.style.border = '2px dashed #3b82f6';
                            }
                          }}
                          onDragLeave={(e) => {
                            if (isEditMode && isEmpty) {
                              e.currentTarget.style.background = di % 2 === 0 ? '#ffffff' : '#fafafa';
                              e.currentTarget.style.border = 'none';
                            }
                          }}
                          onDrop={(e) => {
                            if (isEditMode && isEmpty && onDropToCell) {
                              e.preventDefault();
                              onDropToCell(e, cellIndex, klass);
                              e.currentTarget.style.background = di % 2 === 0 ? '#ffffff' : '#fafafa';
                              e.currentTarget.style.border = 'none';
                            }
                          }}
                          style={{
                            padding: isEmpty ? '16px' : '12px',
                            background: isSelected 
                              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)'
                              : isSwapping
                              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)'
                              : di % 2 === 0 ? '#ffffff' : '#fafafa',
                            borderRight: '1px solid #e5e7eb',
                            borderBottom: di === days.length - 1 ? 'none' : '1px solid #e5e7eb',
                            border: isSelected ? '2px solid #f59e0b' : isSwapping ? '2px solid #10b981' : undefined,
                            minHeight: isEmpty ? '80px' : '100px',
                            transition: 'all 0.3s ease',
                            cursor: isEditMode && !isEmpty ? 'pointer' : 'default',
                            position: 'relative',
                            userSelect: 'none',
                            zIndex: isSwapping ? 999 : isSelected ? 10 : 0
                          }}
                          onMouseEnter={(e) => {
                            if (isEditMode) {
                              setHoveredCell(cellIndex);
                            }
                            if (!isEmpty && !isSelected) {
                              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(126, 34, 206, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)';
                              e.currentTarget.style.transform = 'scale(1.02)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(126, 34, 206, 0.15)';
                              e.currentTarget.style.zIndex = '3';
                            }
                          }}
                          onMouseLeave={(e) => {
                            setHoveredCell(null);
                            if (!isEmpty && !isSelected) {
                              e.currentTarget.style.background = di % 2 === 0 ? '#ffffff' : '#fafafa';
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = 'none';
                              e.currentTarget.style.zIndex = '0';
                            }
                          }}
                        >
                          {/* Add/Update Button on Hover - positioned above cell like swap button */}
                          {isEditMode && hoveredCell === cellIndex && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCellModal(cellIndex, isEmpty);
                              }}
                              style={{
                                position: 'absolute',
                                top: '-20px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: isEmpty ? '#10b981' : '#3b82f6',
                                border: 'none',
                                color: 'white',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                zIndex: 1000,
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = isEmpty ? '#059669' : '#2563eb';
                                e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = isEmpty ? '#10b981' : '#3b82f6';
                                e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                              }}
                            >
                              {isEmpty ? (
                                <>
                                  <FaPlus size={10} />
                                  Add
                                </>
                              ) : (
                                <>
                                  <FaEdit size={10} />
                                  Update
                                </>
                              )}
                            </button>
                          )}
                          
                          {isEditMode && !isEmpty && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onRemoveCell) onRemoveCell(cellIndex);
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  background: '#ef4444',
                                  border: 'none',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: '22px',
                                  height: '22px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  zIndex: 10,
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#dc2626';
                                  e.currentTarget.style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#ef4444';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                ×
                              </button>
                              {isSelected && (
                                <>
                                  <div style={{
                                    position: 'absolute',
                                    top: '4px',
                                    left: '4px',
                                    background: '#f59e0b',
                                    color: 'white',
                                    borderRadius: '4px',
                                    padding: '2px 6px',
                                    fontSize: '0.65rem',
                                    fontWeight: 700
                                  }}>
                                    SELECTED
                                  </div>
                                  {selectedCells.length === 2 && selectedCells[0].class === selectedCells[1].class && selectedCells[1].index === cellIndex && setEditDetails && (
                                    <motion.button
                                      initial={{ scale: 0, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      exit={{ scale: 0, opacity: 0 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        
                                        const [cell1, cell2] = selectedCells;
                                        
                                        // Trigger swap animation
                                        setSwappingCells({ 
                                          cell1: cell1.index, 
                                          cell2: cell2.index
                                        });
                                        
                                        // Swap data at midpoint of animation
                                        setTimeout(() => {
                                          const newDetails = [...editDetails];
                                          
                                          const temp = {
                                            course: newDetails[cell1.index].course,
                                            roomNumber: newDetails[cell1.index].roomNumber,
                                            instructorName: newDetails[cell1.index].instructorName
                                          };
                                          
                                          newDetails[cell1.index] = {
                                            ...newDetails[cell1.index],
                                            course: newDetails[cell2.index].course,
                                            roomNumber: newDetails[cell2.index].roomNumber,
                                            instructorName: newDetails[cell2.index].instructorName
                                          };
                                          
                                          newDetails[cell2.index] = {
                                            ...newDetails[cell2.index],
                                            course: temp.course,
                                            roomNumber: temp.roomNumber,
                                            instructorName: temp.instructorName
                                          };
                                          
                                          setEditDetails(newDetails);
                                        }, 400);
                                        
                                        // Clear animation state
                                        setTimeout(() => {
                                          setSwappingCells(null);
                                          if (setSelectedCells) setSelectedCells([]);
                                        }, 800);
                                      }}
                                      style={{
                                        position: 'absolute',
                                        top: '-45px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        border: 'none',
                                        color: 'white',
                                        borderRadius: '8px',
                                        padding: '8px 16px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        zIndex: 100,
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        whiteSpace: 'nowrap'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.5)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                                      }}
                                    >
                                      <FaExchangeAlt /> SWAP
                                    </motion.button>
                                  )}
                                </>
                              )}
                            </>
                          )}
                          {!isEmpty ? (
                            <div style={{
                              position: 'relative',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px'
                            }}>
                              {/* Room Number */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                color: '#7e22ce',
                                background: 'rgba(126, 34, 206, 0.1)',
                                padding: '3px 6px',
                                borderRadius: '5px',
                                width: 'fit-content'
                              }}>
                                <FaDoorOpen style={{ fontSize: '0.65rem' }} />
                                {row.roomNumber}
                              </div>

                              {/* Course Name */}
                              <div style={{
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: '#111827',
                                textAlign: 'center',
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: '1.2',
                                padding: '2px 0'
                              }}>
                                {row.course}
                              </div>

                              {/* Instructor Name */}
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
                                {row.instructorName}
                              </div>
                            </div>
                          ) : null}
                        </motion.div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
