import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Form, Row, Col } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, fadeIn, scaleIn } from './animation_variants';
import { FaPlus, FaTrash, FaCalendarAlt, FaEye, FaEyeSlash, FaStar, FaClock, FaGraduationCap, FaChalkboardTeacher, FaDoorOpen, FaEdit, FaSave, FaTimes, FaExchangeAlt, FaFilePdf, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../utils/api';
import html2pdf from 'html2pdf.js';

// Function to expand common abbreviations to full names
const expandCourseName = (courseName) => {
  if (!courseName) return courseName;
  
  const abbreviations = {
    // Programming & Software
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
    
    // Mathematics & Science
    'LA': 'Linear Algebra',
    'DM': 'Discrete Mathematics',
    'PS': 'Probability and Statistics',
    'CAL': 'Calculus',
    'DE': 'Differential Equations',
    'NM': 'Numerical Methods',
    
    // Business & Management
    'PM': 'Project Management',
    'BPR': 'Business Process Reengineering',
    'ITM': 'IT Management',
    'MIS': 'Management Information Systems',
    
    // General
    'ICT': 'Information and Communication Technology',
    'IT': 'Information Technology',
    'CS': 'Computer Science',
    'TA': 'Technical Writing',
    'CE': 'Communication and Presentation Skills'
  };
  
  // Try exact match first
  if (abbreviations[courseName.trim()]) {
    return abbreviations[courseName.trim()];
  }
  
  // Try to expand abbreviations within the course name
  let expanded = courseName;
  Object.keys(abbreviations).forEach(abbr => {
    // Match whole words only (with word boundaries)
    const regex = new RegExp(`\\b${abbr}\\b`, 'g');
    expanded = expanded.replace(regex, abbreviations[abbr]);
  });
  
  return expanded;
};

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
  const [undoStack, setUndoStack] = useState([]); // History for undo functionality
  const [redoStack, setRedoStack] = useState([]); // History for redo functionality
  const [swapBox, setSwapBox] = useState({}); // Organized by class: { className: [cells] }
  const [selectedCells, setSelectedCells] = useState([]); // Array of {index, class}
  const [, setSuccessMessage] = useState('');
  const [undoRedoMessage, setUndoRedoMessage] = useState({ className: null, message: '' });
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
  const [searchQuery, setSearchQuery] = useState(''); // search across course/instructor
  const [showPrintPreview, setShowPrintPreview] = useState(false);

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
            const coursesUrl = apiUrl(`/api/courses/${instituteParam}`);
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
          const roomsUrl = apiUrl('/api/rooms');
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
          const teachersUrl = apiUrl('/api/users/institute');
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
        const response = await fetch(apiUrl(`/api/auth/institute/${encodeURIComponent(instituteParam)}`), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          // If instituteLogo is a path (not data URL), prepend base URL
          if (data.instituteLogo && !data.instituteLogo.startsWith('data:') && !data.instituteLogo.startsWith('http')) {
            data.instituteLogo = apiUrl(data.instituteLogo);
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
      const res = await fetch(apiUrl('/api/timetables-gen/list'), {
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
      const res = await fetch(apiUrl(`/api/timetables-gen/details/${encodeURIComponent(header.instituteTimeTableID)}`), {
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
      const res = await fetch(apiUrl(`/api/timetables-gen/header/${encodeURIComponent(id)}`), {
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
        const response = await fetch(apiUrl(`/api/auth/institute/${encodeURIComponent(instId)}`), {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (response.ok) {
          const data = await response.json();
          if (data.instituteLogo && !String(data.instituteLogo).startsWith('http') && !String(data.instituteLogo).startsWith('data:')) {
            data.instituteLogo = apiUrl(data.instituteLogo);
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
    setShowPrintPreview(true);
  }, []);

  const confirmPrint = useCallback(async () => {
    try {
      setShowPrintPreview(false);
      
      // Ensure institute info is loaded
      if (!instituteInfo) {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const instituteRef = user?.instituteID;
          const instituteParam = typeof instituteRef === 'object'
            ? (instituteRef._id || instituteRef.instituteID || instituteRef)
            : instituteRef;
          if (instituteParam) {
            const response = await fetch(apiUrl(`/api/auth/institute/${encodeURIComponent(instituteParam)}`), {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (response.ok) {
              const data = await response.json();
              if (data.instituteLogo && !String(data.instituteLogo).startsWith('http') && !String(data.instituteLogo).startsWith('data:')) {
                data.instituteLogo = apiUrl(data.instituteLogo);
              }
              setInstituteInfo(data);
            }
          }
        }
      }

      // Get the content to print
      const element = document.getElementById('timetable-print-content');
      if (!element) {
        console.error('Print content not found');
        return;
      }

      // Clone the element to avoid modifying the original
      const clonedElement = element.cloneNode(true);
      
      // Remove elements with 'no-print' class from the clone
      const noPrintElements = clonedElement.querySelectorAll('.no-print');
      noPrintElements.forEach(el => el.remove());

      // Add compact styling to make timetables fit on one page
      const timetableCards = clonedElement.querySelectorAll('[data-class-timetable]');
      timetableCards.forEach((card, index) => {
        // Add page breaks after each class timetable
        if (index < timetableCards.length - 1) {
          card.style.pageBreakAfter = 'always';
          card.style.breakAfter = 'page';
        }

        // Avoid splitting a single timetable across pages
        card.style.pageBreakInside = 'avoid';
        card.style.breakInside = 'avoid-page';

        // Reduce overall size to fit on one page
        card.style.transform = 'scale(0.7)';
        card.style.transformOrigin = 'top left';
        card.style.margin = '0 auto 8px auto';

        // Make cells more compact
        const cells = card.querySelectorAll('div[style*="minHeight"]');
        cells.forEach(cell => {
          cell.style.minHeight = '55px';
          cell.style.padding = '6px';
          cell.style.fontSize = '9px';
        });

        // Reduce header size
        const header = card.querySelector('div[style*="padding: 1rem"]');
        if (header) {
          header.style.padding = '0.4rem 0.8rem';
          header.style.fontSize = '13px';
        }

        // Make grid more compact
        const grid = card.querySelector('div[style*="gridTemplateColumns"]');
        if (grid) {
          grid.style.fontSize = '9px';
        }
      });

      // Configure html2pdf options
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `timetable-${selected?.weekStart || 'schedule'}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 1.5,
          useCORS: true,
          logging: false,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'landscape'
        },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      // Generate PDF
      await html2pdf().set(opt).from(clonedElement).save();
      
    } catch (error) {
      console.error('Print error:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  }, [instituteInfo, selected]);

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
      
      const res = await fetch(apiUrl(`/api/timetables-gen/details/${encodeURIComponent(selected.instituteTimeTableID)}`), {
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

  // Save current state to undo stack before making changes
  const saveToUndoStack = useCallback(() => {
    console.log('💾 Saving to undo stack:', {
      editDetails: editDetails.slice(0, 3),
      swapBox
    });
    setUndoStack(prev => [...prev, {
      editDetails: JSON.parse(JSON.stringify(editDetails)),
      swapBox: JSON.parse(JSON.stringify(swapBox))
    }]);
    setRedoStack([]); // Clear redo stack on new action
  }, [editDetails, swapBox]);

  // Undo functionality
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    
    const previousState = undoStack[undoStack.length - 1];
    console.log('🔙 UNDO - Previous state:', {
      editDetails: previousState.editDetails.slice(0, 3),
      swapBox: previousState.swapBox
    });
    console.log('🔙 UNDO - Current state before undo:', {
      editDetails: editDetails.slice(0, 3),
      swapBox
    });
    
    setRedoStack(prev => [...prev, {
      editDetails: JSON.parse(JSON.stringify(editDetails)),
      swapBox: JSON.parse(JSON.stringify(swapBox))
    }]);
    setEditDetails(previousState.editDetails);
    setSwapBox(previousState.swapBox);
    setUndoStack(prev => prev.slice(0, -1));
    setSelectedCells([]);
    
    console.log('🔙 UNDO - State restored');
    
    // Show feedback - find which class was affected
    const affectedClasses = new Set();
    previousState.editDetails.forEach((cell, idx) => {
      if (cell.course && cell.course !== editDetails[idx]?.course) {
        affectedClasses.add(cell.class);
      }
    });
    Object.keys(previousState.swapBox).forEach(className => {
      if (JSON.stringify(previousState.swapBox[className]) !== JSON.stringify(swapBox[className])) {
        affectedClasses.add(className);
      }
    });
    
    const affectedClass = Array.from(affectedClasses)[0];
    if (affectedClass) {
      setUndoRedoMessage({ className: affectedClass, message: 'Undo successful' });
      setTimeout(() => setUndoRedoMessage({ className: null, message: '' }), 2000);
    }
  }, [undoStack, editDetails, swapBox]);

  // Redo functionality
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, {
      editDetails: JSON.parse(JSON.stringify(editDetails)),
      swapBox: JSON.parse(JSON.stringify(swapBox))
    }]);
    setEditDetails(nextState.editDetails);
    setSwapBox(nextState.swapBox);
    setRedoStack(prev => prev.slice(0, -1));
    setSelectedCells([]);
    
    // Show feedback - find which class was affected
    const affectedClasses = new Set();
    nextState.editDetails.forEach((cell, idx) => {
      if (cell.course && cell.course !== editDetails[idx]?.course) {
        affectedClasses.add(cell.class);
      }
    });
    Object.keys(nextState.swapBox).forEach(className => {
      if (JSON.stringify(nextState.swapBox[className]) !== JSON.stringify(swapBox[className])) {
        affectedClasses.add(className);
      }
    });
    
    const affectedClass = Array.from(affectedClasses)[0];
    if (affectedClass) {
      setUndoRedoMessage({ className: affectedClass, message: 'Redo successful' });
      setTimeout(() => setUndoRedoMessage({ className: null, message: '' }), 2000);
    }
  }, [redoStack, editDetails, swapBox]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    if (!isEditMode) return;
    
    const handleKeyDown = (e) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z for redo
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') || 
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        handleRedo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, handleUndo, handleRedo]);

  // Click to select cells
  const handleCellClick = useCallback((cellIndex, className) => {
    if (!isEditMode) return;
    
    const alreadySelected = selectedCells.findIndex(s => s.index === cellIndex);
    if (alreadySelected >= 0) {
      // Deselect
      setSelectedCells(selectedCells.filter((_, i) => i !== alreadySelected));
    } else {
      // Allow multiple selections, but only from same class
      if (selectedCells.length >= 1 && selectedCells[0].class !== className) {
        // First selection is from different class, don't allow
        return;
      }
      
      setSelectedCells([...selectedCells, { index: cellIndex, class: className }]);
    }
  }, [isEditMode, selectedCells]);

  // Remove cell content (make it empty)
  const handleRemoveCell = useCallback((cellIndex) => {
    saveToUndoStack();
    const newDetails = [...editDetails];
    newDetails[cellIndex] = {
      ...newDetails[cellIndex],
      course: '',
      roomNumber: '',
      instructorName: ''
    };
    setEditDetails(newDetails);
    setSelectedCells(selectedCells.filter(s => s.index !== cellIndex));
  }, [editDetails, selectedCells, saveToUndoStack]);

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
    
    saveToUndoStack();
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
  }, [editDetails, modalCellData, modalForm, saveToUndoStack]);

  // Close modal
  const handleCloseCellModal = useCallback(() => {
    setShowCellModal(false);
    setModalCellData(null);
  }, []);

  // Drag start from timetable cell
  const handleDragStart = useCallback((e, cell, cellIndex, className) => {
    e.dataTransfer.effectAllowed = 'move';
    
    // Check if this cell is part of selected cells
    const selectedIndices = selectedCells.map(sc => sc.index);
    if (selectedIndices.includes(cellIndex) && selectedCells.length > 1) {
      // Dragging multiple selected cells
      e.dataTransfer.setData('multiCell', 'true');
      e.dataTransfer.setData('selectedCells', JSON.stringify(selectedCells));
      
      // Hide default drag image
      const emptyImage = document.createElement('div');
      emptyImage.style.position = 'absolute';
      emptyImage.style.top = '-9999px';
      document.body.appendChild(emptyImage);
      e.dataTransfer.setDragImage(emptyImage, 0, 0);
      setTimeout(() => document.body.removeChild(emptyImage), 0);
      
      // Create animated clones for all selected cells
      const dragContainer = document.createElement('div');
      dragContainer.id = 'multi-drag-container';
      dragContainer.style.position = 'fixed';
      dragContainer.style.pointerEvents = 'none';
      dragContainer.style.zIndex = '9999';
      dragContainer.style.transition = 'none';
      
      const draggedCellElement = document.querySelector(`[data-cell-index="${cellIndex}"]`);
      const draggedRect = draggedCellElement.getBoundingClientRect();
      
      // Create clone for the dragged cell (sticks to cursor)
      const draggedClone = draggedCellElement.cloneNode(true);
      draggedClone.style.position = 'absolute';
      draggedClone.style.width = draggedRect.width + 'px';
      draggedClone.style.height = draggedRect.height + 'px';
      draggedClone.style.left = '0px';
      draggedClone.style.top = '0px';
      draggedClone.style.opacity = '0.95';
      draggedClone.style.transform = 'scale(1)';
      draggedClone.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.4)';
      draggedClone.style.transition = 'none';
      draggedClone.style.zIndex = '100';
      dragContainer.appendChild(draggedClone);
      
      // Store other cells to animate towards dragged cell
      const otherCells = [];
      selectedIndices.forEach((idx) => {
        if (idx !== cellIndex) {
          const cellElement = document.querySelector(`[data-cell-index="${idx}"]`);
          if (cellElement) {
            const rect = cellElement.getBoundingClientRect();
            const clone = cellElement.cloneNode(true);
            
            // Store initial position (world coordinates)
            const initialX = rect.left;
            const initialY = rect.top;
            
            clone.style.position = 'absolute';
            clone.style.width = rect.width + 'px';
            clone.style.height = rect.height + 'px';
            clone.style.opacity = '0.9';
            clone.style.transform = 'scale(0.95)';
            clone.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
            clone.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            clone.style.zIndex = '50';
            
            otherCells.push({ clone, initialX, initialY, rect });
            dragContainer.appendChild(clone);
            
            // Fade out original cell
            cellElement.style.opacity = '0.3';
          }
        }
      });
      
      // Fade out the dragged cell
      draggedCellElement.style.opacity = '0.3';
      
      document.body.appendChild(dragContainer);
      
      let animationStarted = false;
      
      // Update position on drag
      const updatePosition = (e) => {
        if (dragContainer) {
          const cursorX = e.clientX;
          const cursorY = e.clientY;
          
          // Update dragged cell position (centered on cursor)
          dragContainer.style.left = (cursorX - draggedRect.width / 2) + 'px';
          dragContainer.style.top = (cursorY - draggedRect.height / 2) + 'px';
          
          // Animate other cells towards dragged cell after a brief delay
          if (!animationStarted) {
            setTimeout(() => {
              animationStarted = true;
              otherCells.forEach(({ clone, initialX, initialY, rect }) => {
                // Position relative to dragged cell (maintain relative positions)
                const offsetX = initialX - draggedRect.left;
                const offsetY = initialY - draggedRect.top;
                
                clone.style.left = offsetX + 'px';
                clone.style.top = offsetY + 'px';
              });
            }, 100);
          }
        }
      };
      
      // Set initial position
      updatePosition(e);
      
      // Track mouse movement
      document.addEventListener('dragover', updatePosition);
      
      // Cleanup on drag end
      const cleanup = () => {
        const container = document.getElementById('multi-drag-container');
        if (container) {
          document.body.removeChild(container);
        }
        document.removeEventListener('dragover', updatePosition);
        document.removeEventListener('dragend', cleanup);
        document.removeEventListener('drop', cleanup);
        
        // Restore original cells
        selectedIndices.forEach(idx => {
          const cellElement = document.querySelector(`[data-cell-index="${idx}"]`);
          if (cellElement) {
            cellElement.style.opacity = '1';
          }
        });
      };
      
      document.addEventListener('dragend', cleanup);
      document.addEventListener('drop', cleanup);
    } else {
      // Dragging single cell
      e.dataTransfer.setData('cellIndex', cellIndex.toString());
      e.dataTransfer.setData('cellData', JSON.stringify(cell));
      e.dataTransfer.setData('className', className);
    }
  }, [selectedCells]);

  // Drop to swap box (removes from timetable, adds to swap box)
  const handleDropToSwapBox = useCallback((e, targetClass) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const isMultiCell = e.dataTransfer.getData('multiCell') === 'true';
      
      if (isMultiCell) {
        // Handle multiple selected cells deletion
        saveToUndoStack();
        const selectedCellsData = JSON.parse(e.dataTransfer.getData('selectedCells'));
        const newDetails = [...editDetails];

        setSwapBox(prev => {
          const next = { ...prev };
          selectedCellsData.forEach(({ index, class: className }) => {
            const cellData = newDetails[index];
            if (cellData && cellData.course) {
              next[className] = [...(next[className] || []), { ...cellData }];
              newDetails[index] = {
                ...newDetails[index],
                course: '',
                roomNumber: '',
                instructorName: ''
              };
            }
          });
          return next;
        });

        setEditDetails(newDetails);
        if (setSelectedCells) setSelectedCells([]);
        return;
      }
      
      // Handle single cell deletion
      const cellIndex = parseInt(e.dataTransfer.getData('cellIndex'), 10);
      const className = e.dataTransfer.getData('className');
      const cellDataStr = e.dataTransfer.getData('cellData');
      
      if (isNaN(cellIndex) || cellIndex < 0 || !className || !cellDataStr) return;
      
      const cellData = JSON.parse(cellDataStr);
      const actualClass = className; // Use the class from the dragged cell
      
      saveToUndoStack();
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
  }, [editDetails, saveToUndoStack]);

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
      
      saveToUndoStack();
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
  }, [editDetails, saveToUndoStack]);


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
        const response = await fetch(apiUrl(`/api/classes/${instituteParam}`), {
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
        await fetch(apiUrl(`/api/timetables-gen/header/${encodeURIComponent(selected.instituteTimeTableID)}`) , {
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
    <>
    <Container fluid style={{ minHeight: '100vh', maxWidth: '1600px' }}>
      {/* Header Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3 no-print"
        style={{ 
          padding: '1rem',
          minHeight: '82px',
          borderBottom: '1px solid rgba(17, 24, 39, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            background: 'var(--theme-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(105, 65, 219, 0.3)',
            flexShrink: 0
          }}>
            <FaCalendarAlt style={{ fontSize: '1.5rem', color: 'white' }} />
          </div>
          <div>
            <h2 style={{ 
              fontSize: '1.5rem',
              fontWeight: '800',
              color: 'var(--theme-color)',
              lineHeight: '1.2',
              margin: 0
            }}>
              Time Tables Management
            </h2>
            <p style={{ 
              fontSize: 'clamp(0.85rem, 1.8vw, 0.95rem)',
              color: 'var(--theme-color)',
              margin: 0,
              fontWeight: '600'
            }}>
              Explore all timetables of your institute
            </p>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2">
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
                  <FaFilePdf style={{ fontSize: '0.875rem' }} /> Download PDF
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
                            const res = await fetch(apiUrl(`/api/timetables-gen/${encodeURIComponent(selected.instituteTimeTableID)}`), {
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
                  <FaCalendarAlt style={{ color: 'var(--theme-color)', fontSize: '0.875rem' }} />
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
                    border: '2px solid var(--theme-color)',
                    borderRadius: '10px',
                    backgroundColor: '#fff',
                    color: '#111827',
                    fontWeight: 500,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--theme-color)';
                    e.target.style.boxShadow = '0 0 0 2px var(--theme-color)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--theme-color)';
                    e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  {items.map((h, index) => (
                    <option key={h.instituteTimeTableID} value={h.instituteTimeTableID}>
                      {h.session} - Version {items.length - index}{h.currentStatus ? ' (Current)' : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>
        </motion.div>
      )}

      {/* Search Box - Show when timetable is selected and not in edit mode */}
      {selected && !isEditMode && (
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--theme-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  Search Timetable
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by course name or instructor name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                    e.target.style.borderColor = 'var(--theme-color)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(105, 65, 219, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                  }}
                />
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
            border: '2px dashed rgba(105, 65, 219, 0.3)',
            borderRadius: '16px',
            padding: '2.5rem 1.5rem',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)'
          }}>
            <Card.Body>
              <div style={{ marginBottom: '0.75rem', opacity: 0.3 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3 style={{ color: '#6b7280', fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.5rem' }}>No Timetables Found</h3>
              <p style={{ color: '#9ca3af', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                {isAdmin ? 'Click Generate to create your first timetable' : 'No timetables available yet'}
              </p>
              {isAdmin && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={generateTimetable}
                    style={{
                      background: 'var(--theme-color)',
                      border: 'none',
                      padding: '10px 24px',
                      borderRadius: '10px',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      boxShadow: '0 2px 8px rgba(105, 65, 219, 0.25)'
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
          data-institute-name={(() => {
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
            return displayName || 'Institute';
          })()}
          data-session={selected.session}
          data-generated={new Date(selected.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          data-logo={instituteInfo?.instituteLogo || ''}
        >
          <Card className="glass-effect" style={{
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(15px)'
          }}>

            {/* Card Header */}
            <Card.Header className="no-print" style={{
              background: 'var(--theme-color-light)',
              border: 'none',
              borderRadius: '12px 12px 0 0',
              padding: '1rem 1.5rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Row className="align-items-center w-100">
                <Col xs={12} lg={6}>
                  <div className="d-flex align-items-center gap-3 mb-3 mb-lg-0">
                    <FaCalendarAlt style={{ fontSize: '1.5rem', color: 'var(--theme-color)' }} />
                    <div>
                      <h4 className="mb-1" style={{ color: 'var(--theme-color)', fontWeight: 700, fontSize: '1.25rem', lineHeight: '1.2', margin: 0 }}>
                        Timetable - Version {items.length - items.findIndex(h => h.instituteTimeTableID === selected.instituteTimeTableID)}
                      </h4>
                      <div className="d-flex flex-wrap gap-2 align-items-center">
                        <div style={{ 
                          fontSize: '0.85rem', 
                          padding: '6px 14px', 
                          borderRadius: '8px', 
                          fontWeight: 600, 
                          color: 'var(--theme-color)', 
                          background: '#ffffff',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <FaCalendarAlt style={{ fontSize: '0.75rem' }} />
                          {selected.session}
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
                
                <Col xs={12} lg={6}>
                  <div className="d-flex flex-wrap gap-3 justify-content-lg-end align-items-center">
                    {selected.currentStatus && (
                      <div style={{
                        background: 'var(--theme-color-light)',
                        fontSize: '0.85rem',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        color: 'var(--theme-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <FaStar style={{ fontSize: '0.75rem' }} />
                        Current
                      </div>
                    )}
                    
                    {isAdmin && (
                      <>
                        <style>
                          {`
                            #visibility-switch.form-check-input:checked,
                            #current-switch.form-check-input:checked {
                              background-color: var(--theme-color);
                              border-color: var(--theme-color);
                            }
                            #visibility-switch.form-check-input:focus,
                            #current-switch.form-check-input:focus {
                              border-color: var(--theme-color);
                              box-shadow: 0 0 0 0.25rem rgba(105, 65, 219, 0.25);
                            }
                          `}
                        </style>
                        <Form.Check
                        type="switch"
                        id="visibility-switch"
                        label={
                          <span className="d-flex align-items-center gap-2" style={{ color: 'var(--theme-color)', fontWeight: 600, fontSize: '0.9rem' }}>
                            {selected.visibility ? <FaEye style={{ fontSize: '0.875rem' }} /> : <FaEyeSlash style={{ fontSize: '0.875rem' }} />}
                            {selected.visibility ? 'Visible' : 'Hidden'}
                          </span>
                        }
                        checked={!!selected.visibility}
                        onChange={(e) => updateHeader(selected.instituteTimeTableID, { visibility: e.target.checked })}
                        style={{ accentColor: 'var(--theme-color)' }}
                      />
                      <Form.Check
                        type="switch"
                        id="current-switch"
                        label={
                          <span className="d-flex align-items-center gap-2" style={{ color: 'var(--theme-color)', fontWeight: 600, fontSize: '0.9rem' }}>
                            <FaStar style={{ fontSize: '0.875rem' }} />
                            Current
                          </span>
                        }
                        checked={!!selected.currentStatus}
                        onChange={(e) => updateHeader(selected.instituteTimeTableID, { currentStatus: e.target.checked })}
                        style={{ accentColor: 'var(--theme-color)' }}
                      />
                      </>
                    )}
                  </div>
                </Col>
              </Row>
            </Card.Header>

            <Card.Body className="p-3 p-md-4">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" style={{ color: 'var(--theme-color)', width: '2.5rem', height: '2.5rem' }} role="status">
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
                      {/* Multi-selection hint */}
                      {selectedCells.length > 1 && (
                        <div style={{
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: 'white',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          marginBottom: '16px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                        }}>
                          <FaInfoCircle style={{ fontSize: '1rem' }} />
                          <span>
                            {selectedCells.length} cells selected. 
                            {selectedCells.length === 2 && selectedCells[0].class === selectedCells[1].class 
                              ? ' Click SWAP button or drag any selected cell to delete area below to remove all.' 
                              : ' Drag any selected cell to delete area below to remove all selected cells.'}
                          </span>
                        </div>
                      )}
                      
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
                                          fontSize: '0.8rem',
                                          fontWeight: 700,
                                          color: '#111827',
                                          marginBottom: '6px',
                                          lineHeight: '1.3',
                                          wordBreak: 'break-word'
                                        }}>
                                          {expandCourseName(cell.course)}
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
                    searchQuery={searchQuery}
                    setEditDetails={(newDetails) => {
                      saveToUndoStack();
                      setEditDetails(newDetails);
                      setRenderKey(prev => prev + 1);
                    }}
                    saveToUndoStack={saveToUndoStack}
                    handleUndo={handleUndo}
                    handleRedo={handleRedo}
                    undoStack={undoStack}
                    redoStack={redoStack}
                    undoRedoMessage={undoRedoMessage}
                  />
                </>
              )}
            </Card.Body>
          </Card>
        </motion.div>
      )}
      
      {/* Print Footer - appears on every printed page */}
      <div className="print-footer" style={{ display: 'none' }}>
        <span style={{ fontWeight: 600 }}>Generated by Schedule Hub</span>
        {instituteInfo?.instituteLogo && (
          <img 
            src={instituteInfo.instituteLogo} 
            alt="Logo" 
            style={{ height: '20px', width: 'auto', objectFit: 'contain' }}
          />
        )}
      </div>
    </Container>

      {/* Time Settings Modal - Portal */}
      {ReactDOM.createPortal(
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
        </AnimatePresence>,
        document.body
      )}

      {/* Add Class Modal - Portal */}
      {ReactDOM.createPortal(
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
                    <FaPlus style={{ marginRight: '8px', color: 'var(--theme-color)' }} />
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
                      <FaDoorOpen color="var(--theme-color)" />
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
                        background: 'var(--theme-color)',
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
        </AnimatePresence>,
        document.body
      )}

      {/* Cell Add/Update Modal - Portal */}
      {ReactDOM.createPortal(
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
                      <FaGraduationCap color="var(--theme-color)" />
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
        </AnimatePresence>,
        document.body
      )}

      {/* Print Preview Modal - Portal */}
      {ReactDOM.createPortal(
        <AnimatePresence>
          {showPrintPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrintPreview(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px',
                overflow: 'auto'
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  width: '95%',
                  maxWidth: '1400px',
                  maxHeight: '95vh',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 25px 70px rgba(0, 0, 0, 0.4)'
                }}
              >
                {/* Modal Header */}
                <div style={{
                  padding: '20px 24px',
                  borderBottom: '2px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'linear-gradient(135deg, var(--theme-color) 0%, #8b5cf6 100%)',
                  borderRadius: '16px 16px 0 0',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FaFilePdf style={{ fontSize: '24px', color: '#fff' }} />
                    <div>
                      <h3 style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: '18px' }}>PDF Preview</h3>
                      <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.9)', fontSize: '13px' }}>
                        {details ? [...new Set(details.map(d => String(d.class || '')))].length : 1} page(s) - One timetable per page
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPrintPreview(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '8px',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                  >
                    ×
                  </button>
                </div>

                {/* Preview Content - Scrollable */}
                <div style={{
                  padding: '24px',
                  overflow: 'auto',
                  flex: 1,
                  background: '#f9fafb'
                }}>
                  <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                    transform: 'scale(0.75)',
                    transformOrigin: 'top center',
                    pointerEvents: 'none'
                  }}>
                    {/* Render the actual timetable content */}
                    <TimetableTables 
                      details={details}
                      header={selected}
                      isEditMode={false}
                      searchQuery={searchQuery}
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div style={{
                  padding: '20px 24px',
                  borderTop: '2px solid #e5e7eb',
                  display: 'flex',
                  gap: '12px',
                  background: '#fff',
                  borderRadius: '0 0 16px 16px',
                  flexShrink: 0
                }}>
                  <Button
                    variant="success"
                    onClick={confirmPrint}
                    style={{
                      flex: 1,
                      padding: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      fontWeight: 600,
                      fontSize: '15px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <FaFilePdf />
                    Download PDF
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowPrintPreview(false)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      fontWeight: 600,
                      fontSize: '15px',
                      borderRadius: '10px'
                    }}
                  >
                    <FaTimes />
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

export default TimeTable;

// Print styles injected via style tag - reinsert on every render to ensure fresh styles
if (typeof document !== 'undefined') {
  const styleId = 'timetable-print-styles';
  // Remove old style if exists to ensure latest version
  const oldStyle = document.getElementById(styleId);
  if (oldStyle) {
    oldStyle.remove();
  }
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @media screen {
      .print-only {
        display: none !important;
      }
      .print-footer {
        display: none !important;
      }
    }
    @media print {
      /* Hide screen-only elements */
      .no-print,
      .no-print * {
        display: none !important;
        visibility: hidden !important;
      }
      
      .print-footer {
        display: flex !important;
        visibility: visible !important;
      }
      
      /* Page setup with smaller margins */
      @page {
        size: landscape;
        margin: 0.5cm;
      }
      
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
        margin: 0;
        padding: 0;
      }
      
      /* Page breaks */
      .timetable-class-container {
        page-break-before: always;
        page-break-inside: avoid;
        break-before: page;
        break-inside: avoid;
        margin-top: 70px !important;
        position: relative;
      }
      
      .timetable-class-container:first-of-type {
        page-break-before: auto;
        break-before: auto;
        margin-top: 70px !important;
      }
      
      /* Header on every page using pseudo-element */
      .timetable-class-container::before {
        content: '';
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 65px;
        background: white;
        z-index: 9998;
        border-bottom: 1px solid #e5e7eb;
      }
      
      #timetable-print-content::before {
        content: attr(data-institute-name);
        display: block;
        position: fixed;
        top: 12px;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 18px;
        font-weight: 700;
        color: #1f2937;
        z-index: 9999;
        background: white;
        padding: 0 15px;
      }
      
      #timetable-print-content::after {
        content: 'Academic Year: ' attr(data-session);
        display: block;
        position: fixed;
        top: 38px;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 12px;
        color: #6b7280;
        z-index: 9999;
        background: white;
      }
      
      /* Footer on each page */
      .print-footer {
        position: fixed;
        bottom: 8px;
        right: 12px;
        font-size: 9px;
        color: #6b7280;
        display: flex !important;
        align-items: center;
        gap: 5px;
        padding: 3px 6px;
        background: white;
        z-index: 9999;
      }
      
      .print-footer img {
        height: 16px;
        width: auto;
      }
      
      /* Reduce table sizes more aggressively */
      .timetable-class-container {
        font-size: 0.65rem !important;
        transform: scale(0.72);
        transform-origin: top left;
        width: 138.9%;
        margin-bottom: -50px !important;
      }
      
      .timetable-class-container table,
      .timetable-class-container div[style*="grid"] {
        font-size: 0.65rem !important;
      }
      
      .timetable-class-container h5 {
        font-size: 0.95rem !important;
        padding: 6px 10px !important;
      }
      
      .timetable-class-container [style*="padding"] {
        padding: 4px 6px !important;
      }
      
      /* Reduce spacing in cells more */
      .timetable-class-container > div > div > div > div {
        min-height: 60px !important;
        padding: 5px !important;
      }
      
      /* Smaller font in cells */
      .timetable-class-container div[style*="fontSize"] {
        font-size: 0.6rem !important;
      }
      
      /* Reduce gaps between elements */
      .timetable-class-container div[style*="gap"] {
        gap: 4px !important;
      }
    }
  `;
  document.head.appendChild(style);
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
  handleOpenCellModal = null,
  searchQuery = '',
  saveToUndoStack = null,
  handleUndo = null,
  handleRedo = null,
  undoStack = [],
  redoStack = [],
  undoRedoMessage = { className: null, message: '' }
}) {
  if (!Array.isArray(details) || details.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-5"
        style={{
          background: 'linear-gradient(135deg, rgba(105, 65, 219, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
          borderRadius: '14px',
          border: '2px dashed rgba(105, 65, 219, 0.2)'
        }}
      >
        <div style={{ marginBottom: '0.75rem', opacity: 0.3 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
        </div>
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
            className="timetable-class-container"
            data-class-timetable={klass}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: classIndex * 0.1 }}
            style={{
              border: '1px solid rgba(105, 65, 219, 0.15)',
              borderRadius: '16px',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.95) 100%)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
            }}
          >
            {/* Class Title Header */}
            <div style={{
              padding: '1rem 1.5rem',
              background: 'var(--theme-color-light)',
              borderBottom: '1px solid var(--theme-color)',
              border: '1px solid var(--theme-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaGraduationCap style={{ color: 'var(--theme-color)', fontSize: '1.25rem' }} />
                <h5 style={{
                  margin: 0,
                  color: 'var(--theme-color)',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  letterSpacing: '0.3px'
                }}>
                  Class: {klass}
                </h5>
              </div>
              
              {/* Success message - appears on the left of undo/redo buttons */}
              {undoRedoMessage.className === klass && undoRedoMessage.message && (
                <div style={{
                  padding: '6px 12px',
                  background: '#10b981',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                  animation: 'fadeIn 0.3s ease-in-out'
                }}>
                  ✓ {undoRedoMessage.message}
                </div>
              )}
              
              {/* Undo/Redo buttons - only in edit mode */}
              {isEditMode && saveToUndoStack && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleUndo}
                    disabled={!undoStack || undoStack.length === 0}
                    style={{
                      background: undoStack && undoStack.length > 0 ? 'var(--theme-color)' : '#9ca3af',
                      border: 'none',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: undoStack && undoStack.length > 0 ? 'pointer' : 'not-allowed',
                      opacity: undoStack && undoStack.length > 0 ? 1 : 0.5,
                      boxShadow: '0 2px 6px rgba(105, 65, 219, 0.3)',
                      transition: 'all 0.2s'
                    }}
                    title="Undo (Ctrl+Z)"
                  >
                    ↶ Undo
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={!redoStack || redoStack.length === 0}
                    style={{
                      background: redoStack && redoStack.length > 0 ? 'var(--theme-color)' : '#9ca3af',
                      border: 'none',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: redoStack && redoStack.length > 0 ? 'pointer' : 'not-allowed',
                      opacity: redoStack && redoStack.length > 0 ? 1 : 0.5,
                      boxShadow: '0 2px 6px rgba(105, 65, 219, 0.3)',
                      transition: 'all 0.2s'
                    }}
                    title="Redo (Ctrl+Y)"
                  >
                    ↷ Redo
                  </button>
                </div>
              )}
            </div>

            {/* Responsive Table Wrapper */}
            <div className="table-responsive">
              <div style={{
                display: 'grid',
                gridTemplateColumns: `minmax(70px, 100px) repeat(${allTimes.length}, minmax(140px, 1fr))`,
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
                  borderBottom: '2px solid var(--theme-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  boxShadow: '2px 0 4px rgba(0, 0, 0, 0.05)'
                }}>
                  <FaClock className="me-2" style={{ color: 'var(--theme-color)', fontSize: '0.75rem' }} />
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
                      borderBottom: '2px solid var(--theme-color)',
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
                      borderBottom: '2px solid rgba(105, 65, 219, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      position: 'sticky',
                      left: 0,
                      zIndex: 1,
                      boxShadow: '2px 0 4px rgba(0, 0, 0, 0.03)'
                    }}>
                      <FaCalendarAlt style={{ color: 'var(--theme-color)', fontSize: '0.75rem' }} />
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
                      
                      // Check if this cell matches search query
                      const normalizedSearchQuery = searchQuery.toLowerCase().trim();
                      const matchesSearch = !isEmpty && normalizedSearchQuery && (
                        (row.course && row.course.toLowerCase().includes(normalizedSearchQuery)) ||
                        (row.instructorName && row.instructorName.toLowerCase().includes(normalizedSearchQuery)) ||
                        (row.teacher && row.teacher.toLowerCase().includes(normalizedSearchQuery)) ||
                        (expandCourseName(row.course) && expandCourseName(row.course).toLowerCase().includes(normalizedSearchQuery))
                      );
                      
                      // Build cell key - for empty cells use trailing |, for filled include course
                      const cellKey = isEmpty 
                        ? `${klass}|${day}|${t}|`
                        : `${klass}|${day}|${t}|${row.course}`;
                      const cellIndex = cellIndexMap.get(cellKey) ?? -1;
                      
                      const isSelected = isEditMode && selectedCells.some(s => s.index === cellIndex);
                      const isSwapping = swappingCells && (swappingCells.cell1 === cellIndex || swappingCells.cell2 === cellIndex);
                      const isSwappingCell1 = swappingCells && swappingCells.cell1 === cellIndex;
                      
                      // Get animation path based on actual positions
                      let animationConfig = {};
                      if (isSwapping && swappingCells.deltaX !== undefined && swappingCells.deltaY !== undefined) {
                        const { deltaX, deltaY } = swappingCells;
                        const arcHeight = 100; // Additional vertical arc height
                        
                        if (isSwappingCell1) {
                          // Cell A: Arc up and over to Cell B's position
                          animationConfig = {
                            x: [0, deltaX * 0.3, deltaX * 0.7, deltaX],
                            y: [0, -arcHeight, deltaY - arcHeight, deltaY],
                            scale: [1, 1.15, 1.15, 1],
                            zIndex: 100
                          };
                        } else {
                          // Cell B: Arc up and over to Cell A's position
                          animationConfig = {
                            x: [0, -deltaX * 0.3, -deltaX * 0.7, -deltaX],
                            y: [0, -arcHeight, -deltaY - arcHeight, -deltaY],
                            scale: [1, 1.15, 1.15, 1],
                            zIndex: 100
                          };
                        }
                      }
                      
                      return (
                        <motion.div
                          key={`${day}-${i}`}
                          data-cell-index={cellIndex}
                          animate={isSwapping ? animationConfig : {}}
                          transition={{
                            duration: 1.2,
                            ease: "easeInOut",
                            times: [0, 0.35, 0.65, 1]
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
                          onDragEnd={(e) => {
                            // Cleanup is handled in handleDragStart's cleanup function
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
                              e.currentTarget.style.background = '#f3f4f6';
                              e.currentTarget.style.border = 'none';
                            }
                          }}
                          onDrop={(e) => {
                            if (isEditMode && isEmpty && onDropToCell) {
                              e.preventDefault();
                              onDropToCell(e, cellIndex, klass);
                              e.currentTarget.style.background = '#f3f4f6';
                              e.currentTarget.style.border = 'none';
                            }
                          }}
                          style={{
                            position: 'relative',
                            padding: isEmpty ? '16px' : '14px',
                            background: matchesSearch
                              ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                              : isSelected 
                              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)'
                              : isSwapping
                              ? (isSwappingCell1 
                                ? 'rgba(59, 130, 246, 0.2)'
                                : 'rgba(16, 185, 129, 0.2)')
                              : isEmpty
                              ? '#f3f4f6'
                              : di % 2 === 0 ? '#ffffff' : '#fafafa',
                            borderRight: '1px solid #e5e7eb',
                            borderBottom: '2px solid rgba(105, 65, 219, 0.3)',
                            border: matchesSearch 
                              ? '2px solid #fbbf24' 
                              : isSelected 
                              ? '2px solid #f59e0b' 
                              : isSwapping 
                              ? (isSwappingCell1 ? '2px solid #3b82f6' : '2px solid #10b981') 
                              : `1px solid #e5e7eb`,
                            boxShadow: matchesSearch 
                              ? '0 0 0 3px rgba(251, 191, 36, 0.2)' 
                              : isSwapping 
                              ? (isSwappingCell1 
                                ? '0 8px 16px rgba(59, 130, 246, 0.3)' 
                                : '0 8px 16px rgba(16, 185, 129, 0.3)') 
                              : undefined,
                            minHeight: isEmpty ? '80px' : '120px',
                            cursor: isEditMode && !isEmpty ? 'pointer' : 'default',
                            userSelect: 'none',
                            zIndex: isSwapping ? 999 : isSelected ? 10 : matchesSearch ? 8 : 0,
                            transition: isSwapping ? 'none' : undefined
                          }}
                          onMouseEnter={(e) => {
                            if (isEditMode && !isSwapping) {
                              setHoveredCell(cellIndex);
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSwapping) {
                              setHoveredCell(null);
                            }
                          }}
                        >
                          {/* Add/Update Button on Hover - positioned at bottom center of cell */}
                          {isEditMode && hoveredCell === cellIndex && !isSwapping && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCellModal(cellIndex, isEmpty);
                              }}
                              style={{
                                position: 'absolute',
                                bottom: '8px',
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
                                whiteSpace: 'nowrap'
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
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
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
                                    {selectedCells.length > 1 ? `${selectedCells.length} SELECTED` : 'SELECTED'}
                                  </div>
                                  {selectedCells.length === 2 && selectedCells.length <= 2 && selectedCells[0].class === selectedCells[1].class && selectedCells[1].index === cellIndex && setEditDetails && (
                                    <motion.button
                                      initial={{ scale: 0, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      exit={{ scale: 0, opacity: 0 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        
                                        const [cell1, cell2] = selectedCells;
                                        
                                        // Get actual DOM positions of both cells
                                        const cell1Element = document.querySelector(`[data-cell-index="${cell1.index}"]`);
                                        const cell2Element = document.querySelector(`[data-cell-index="${cell2.index}"]`);
                                        
                                        if (cell1Element && cell2Element) {
                                          const rect1 = cell1Element.getBoundingClientRect();
                                          const rect2 = cell2Element.getBoundingClientRect();
                                          
                                          // Calculate distance between cells
                                          const deltaX = rect2.left - rect1.left;
                                          const deltaY = rect2.top - rect1.top;
                                          
                                          // Store positions for animation
                                          setSwappingCells({ 
                                            cell1: cell1.index, 
                                            cell2: cell2.index,
                                            deltaX,
                                            deltaY
                                          });
                                        } else {
                                          // Fallback without positions
                                          setSwappingCells({ 
                                            cell1: cell1.index, 
                                            cell2: cell2.index
                                          });
                                        }
                                        
                                        // Clear animation state and swap data after animation completes
                                        setTimeout(() => {
                                          saveToUndoStack();
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
                                          setSwappingCells(null);
                                          if (setSelectedCells) setSelectedCells([]);
                                        }, 1200);
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
                                color: 'var(--theme-color)',
                                background: 'rgba(105, 65, 219, 0.1)',
                                padding: '3px 6px',
                                borderRadius: '5px',
                                width: 'fit-content'
                              }}>
                                <FaDoorOpen style={{ fontSize: '0.65rem' }} />
                                {row.roomNumber}
                              </div>

                              {/* Course Name - Full Title */}
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
                                {expandCourseName(row.course)}
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
