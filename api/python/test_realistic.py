"""
Test CSP solver with realistic data matching CSV structure:
- Multiple theory courses (5+ courses with 1-3 credit hours each)
- Multiple lab courses (3 labs with 1 credit hour = 3 consecutive slots each)
- Multiple classes with different sections
"""

import sys
import json

# Realistic test payload matching CSV data structure
test_payload = {
    "instituteID": "test-institute-001",
    "session": "Fall",
    "year": 2024,
    "classes": ["BS Computer Science-A", "BS Computer Science-B"],
    
    # Realistic course load: 5 theory courses + 3 labs per class
    "assignments": [
        # BS Computer Science Section A - Theory Courses
        {"class": "BS Computer Science-A", "course": "Data Structures", "type": "Lecture", "creditHours": 2, "instructor": "Dr. Smith"},
        {"class": "BS Computer Science-A", "course": "Operating Systems", "type": "Lecture", "creditHours": 3, "instructor": "Dr. Johnson"},
        {"class": "BS Computer Science-A", "course": "Database Systems", "type": "Lecture", "creditHours": 2, "instructor": "Dr. Williams"},
        {"class": "BS Computer Science-A", "course": "Web Development", "type": "Lecture", "creditHours": 2, "instructor": "Dr. Brown"},
        {"class": "BS Computer Science-A", "course": "Software Engineering", "type": "Lecture", "creditHours": 3, "instructor": "Dr. Davis"},
        
        # BS Computer Science Section A - Lab Courses
        {"class": "BS Computer Science-A", "course": "Data Structures Lab", "type": "Lab", "creditHours": 1, "instructor": "Dr. Smith"},
        {"class": "BS Computer Science-A", "course": "Operating Systems Lab", "type": "Lab", "creditHours": 1, "instructor": "Dr. Johnson"},
        {"class": "BS Computer Science-A", "course": "Database Systems Lab", "type": "Lab", "creditHours": 1, "instructor": "Dr. Williams"},
        
        # BS Computer Science Section B - Theory Courses
        {"class": "BS Computer Science-B", "course": "Data Structures", "type": "Lecture", "creditHours": 2, "instructor": "Dr. Smith"},
        {"class": "BS Computer Science-B", "course": "Operating Systems", "type": "Lecture", "creditHours": 3, "instructor": "Dr. Miller"},
        {"class": "BS Computer Science-B", "course": "Database Systems", "type": "Lecture", "creditHours": 2, "instructor": "Dr. Wilson"},
        {"class": "BS Computer Science-B", "course": "Web Development", "type": "Lecture", "creditHours": 2, "instructor": "Dr. Brown"},
        {"class": "BS Computer Science-B", "course": "Software Engineering", "type": "Lecture", "creditHours": 3, "instructor": "Dr. Taylor"},
        
        # BS Computer Science Section B - Lab Courses
        {"class": "BS Computer Science-B", "course": "Data Structures Lab", "type": "Lab", "creditHours": 1, "instructor": "Dr. Smith"},
        {"class": "BS Computer Science-B", "course": "Operating Systems Lab", "type": "Lab", "creditHours": 1, "instructor": "Dr. Miller"},
        {"class": "BS Computer Science-B", "course": "Database Systems Lab", "type": "Lab", "creditHours": 1, "instructor": "Dr. Wilson"},
    ],
    
    # Rooms matching CSV structure
    "rooms": ["F102", "F101", "G106", "F122", "B106", "B203", "B204", "G104", "LabB102", "LabB217", "LabB214", "LabB202", "LabB216", "LabB101"],
    "roomTypes": {
        "F102": "Class", "F101": "Class", "G106": "Class", "F122": "Class",
        "B106": "Class", "B203": "Class", "B204": "Class", "G104": "Class",
        "LabB102": "Lab", "LabB217": "Lab", "LabB214": "Lab", "LabB202": "Lab",
        "LabB216": "Lab", "LabB101": "Lab"
    },
    
    # Time slots: 5 days, 6 hours per day
    "timeslots": [
        {"day": "Monday", "start": "09:00", "end": "15:00"},
        {"day": "Tuesday", "start": "09:00", "end": "15:00"},
        {"day": "Wednesday", "start": "09:00", "end": "15:00"},
        {"day": "Thursday", "start": "09:00", "end": "15:00"},
        {"day": "Friday", "start": "09:00", "end": "15:00"},
    ],
    
    "breaks": {
        "mode": "same",
        "same": {"start": "12:00", "end": "12:30"}
    },
    
    "slotMinutes": 60,
    "algorithms": ["CSP"]
}

print("=" * 80)
print("REALISTIC CSP TIMETABLE SCHEDULER TEST")
print("=" * 80)

try:
    from app import generate_candidate, GeneratePayload
    print("\n✓ Successfully imported CSP modules")
except Exception as e:
    print(f"\n✗ Failed to import: {e}")
    sys.exit(1)

# Calculate statistics
theory_sessions = sum(a["creditHours"] for a in test_payload["assignments"] if a["type"] == "Lecture")
lab_sessions = sum(1 for a in test_payload["assignments"] if a["type"] == "Lab")
total_sessions = theory_sessions + lab_sessions

print(f"\nTest Configuration:")
print(f"  - Classes: {len(test_payload['classes'])}")
print(f"  - Assignments: {len(test_payload['assignments'])}")
print(f"  - Total Sessions: {total_sessions} ({theory_sessions} theory + {lab_sessions} labs)")
print(f"  - Rooms: {len(test_payload['rooms'])} ({sum(1 for r in test_payload['roomTypes'].values() if r == 'Lab')} labs)")
print(f"  - Days: {len(test_payload['timeslots'])}")
print(f"  - Break: 12:00 - 12:30")

print("\n" + "-" * 80)
print("Running CSP Solver...")
print("-" * 80)

try:
    payload_obj = GeneratePayload(**test_payload)
    result = generate_candidate(payload_obj, seed=42)
    
    print("\n✓ CSP Solver completed successfully!")
    print("\n" + "=" * 80)
    print("RESULTS SUMMARY")
    print("=" * 80)
    
    header = result.get("header", {})
    details = result.get("details", [])
    stats = result.get("stats", {})
    
    print(f"\nTimetable ID: {header.get('timetableID')}")
    print(f"Session: {header.get('session')} {header.get('year')}")
    print(f"Total Sessions Scheduled: {len(details)}")
    
    print(f"\nSolver Statistics:")
    print(f"  - Variables Assigned: {stats.get('variablesAssigned', 0)}")
    print(f"  - Constraints Checked: {stats.get('constraintsChecked', 0)}")
    print(f"  - Backtracks: {stats.get('backtracks', 0)}")
    
    # Analyze schedule quality
    print("\n" + "-" * 80)
    print("SCHEDULE QUALITY ANALYSIS")
    print("-" * 80)
    
    # Group by class and day
    schedule_by_class_day = {}
    for session in details:
        key = (session["class"], session["day"])
        if key not in schedule_by_class_day:
            schedule_by_class_day[key] = []
        schedule_by_class_day[key].append(session)
    
    # Check distribution
    max_sessions_per_day = max(len(sessions) for sessions in schedule_by_class_day.values()) if schedule_by_class_day else 0
    avg_sessions_per_day = sum(len(sessions) for sessions in schedule_by_class_day.values()) / len(schedule_by_class_day) if schedule_by_class_day else 0
    
    print(f"  - Max sessions on any day: {max_sessions_per_day}")
    print(f"  - Average sessions per day: {avg_sessions_per_day:.1f}")
    
    # Count labs scheduled
    labs_scheduled = sum(1 for s in details if "Lab" in s["course"])
    print(f"  - Labs scheduled: {labs_scheduled}/{lab_sessions}")
    
    # Count theory sessions
    theory_scheduled = len(details) - labs_scheduled
    print(f"  - Theory sessions scheduled: {theory_scheduled}/{theory_sessions}")
    
    # Show sample schedule
    print("\n" + "-" * 80)
    print("SAMPLE SCHEDULE (First 15 sessions)")
    print("-" * 80)
    print(f"{'ID':<6} {'Room':<12} {'Class':<25} {'Course':<30} {'Day':<12} {'Time':<15}")
    print("-" * 80)
    
    for session in details[:15]:
        room = session.get('roomNumber', session.get('room', 'N/A'))
        time_str = session.get('time', f"{session.get('start', '')}-{session.get('end', '')}")
        print(f"{session['timeTableID']:<6} {room:<12} {session['class']:<25} {session['course']:<30} {session['day']:<12} {time_str}")
    
    if len(details) > 15:
        print(f"\n... and {len(details) - 15} more sessions")
    
    print("\n" + "=" * 80)
    print("OVERALL ASSESSMENT")
    print("=" * 80)
    
    if len(details) == total_sessions:
        print("✓ ALL SESSIONS SUCCESSFULLY SCHEDULED")
        print("✓ Timetable is COMPLETE and ready to use")
    else:
        print(f"⚠ Partial schedule: {len(details)}/{total_sessions} sessions scheduled")
    
    print("\n" + "=" * 80)
    print("TEST COMPLETED SUCCESSFULLY")
    print("=" * 80)
    
except Exception as e:
    print(f"\n✗ TEST FAILED: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
