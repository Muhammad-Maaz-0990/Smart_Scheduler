from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Tuple, Set
import random
from collections import defaultdict

app = FastAPI(title="Schedule Hub CSP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BreakWindow(BaseModel):
    start: str
    end: str

class BreaksConfig(BaseModel):
    mode: str = Field(pattern=r"^(same|per-day|none)$")
    same: Optional[BreakWindow] = None
    perDay: Optional[Dict[str, BreakWindow]] = None

class Assignment(BaseModel):
    # Internal model; we will construct this manually from dicts to avoid alias parsing issues
    class_: str
    course: str
    type: str = Field(pattern=r"^(Lecture|Lab)$")
    creditHours: int
    instructor: Optional[str] = None

class GeneratePayload(BaseModel):
    instituteID: str
    session: str
    year: int
    classes: List[str]
    assignments: List[Dict[str, Any]]
    rooms: List[str]
    roomTypes: Dict[str, str] = {}
    # Optional: restrict lab rooms per class name
    classLabRooms: Optional[Dict[str, List[str]]] = None
    timeslots: List[Dict[str, Any]]  # expected { day: 'Mon', start: '10:00', end: '11:00' }
    breaks: BreaksConfig
    slotMinutes: int = 60
    algorithms: List[str]

def duration_in_hours(start: str, end: str) -> float:
    def to_min(t: str) -> int:
        h, m = t.split(":")
        return int(h) * 60 + int(m)
    return max(0, (to_min(end) - to_min(start))) / 60.0


def slot_string(start: str, end: str) -> str:
    return f"{start}-{end}"


def respects_break(day: str, start: str, end: str, breaks: BreaksConfig) -> bool:
    if breaks.mode == "same" and breaks.same:
        bs, be = breaks.same.start, breaks.same.end
    elif breaks.mode == "per-day" and breaks.perDay and day in breaks.perDay:
        bw = breaks.perDay[day]
        bs, be = bw.start, bw.end
    else:
        return True

    def to_min(t: str) -> int:
        h, m = t.split(":")
        return int(h) * 60 + int(m)

    s1, e1 = to_min(start), to_min(end)
    s2, e2 = to_min(bs), to_min(be)
    # no overlap with break window
    return e1 <= s2 or s1 >= e2


def split_into_slices(start: str, end: str, minutes: int) -> List[tuple]:
    """Split a window (start,end) into fixed-length slices in minutes.
    Note: This creates aligned slices starting at the window start.
    A separate helper will add post-break aligned slices when needed.
    """
    def to_min(t: str) -> int:
        h, m = t.split(":")
        return int(h) * 60 + int(m)
    def from_min(x: int) -> str:
        h = x // 60
        m = x % 60
        return f"{h:02d}:{m:02d}"
    s = to_min(start)
    e = to_min(end)
    out = []
    threshold = max(1, minutes - 10)
    while s + threshold <= e:
        nxt = min(s + minutes, e)
        out.append((from_min(s), from_min(nxt)))
        s = nxt
    return out

def add_post_break_slices(day: str, start: str, end: str, minutes: int, breaks: BreaksConfig) -> List[tuple]:
    """Generate additional slices that start exactly at break end so sessions resume immediately.
    Only added when a break window falls within [start, end].
    """
    def to_min(t: str) -> int:
        h, m = t.split(":")
        return int(h) * 60 + int(m)
    def from_min(x: int) -> str:
        h = x // 60
        m = x % 60
        return f"{h:02d}:{m:02d}"

    # resolve break window for this day
    if breaks.mode == "same" and breaks.same:
        bs, be = breaks.same.start, breaks.same.end
    elif breaks.mode == "per-day" and breaks.perDay and day in breaks.perDay:
        bw = breaks.perDay[day]
        bs, be = bw.start, bw.end
    else:
        return []

    s = to_min(start); e = to_min(end)
    s2 = to_min(bs); e2 = to_min(be)
    # if break overlaps window, start extra series at break end
    if s2 < e and e2 > s:
        cur = max(e2, s)
        out = []
        threshold = max(1, minutes - 10)
        while cur + threshold <= e:
            nxt = min(cur + minutes, e)
            out.append((from_min(cur), from_min(nxt)))
            cur = nxt
        return out
    return []


class CSPVariable:
    """Represents a variable in the CSP - a class session to be scheduled."""
    def __init__(self, var_id: int, class_name: str, course: str, session_type: str, 
                 instructor: Optional[str] = None):
        self.id = var_id
        self.class_name = class_name
        self.course = course
        self.session_type = session_type  # 'Lecture' or 'Lab'
        self.instructor = instructor
        self.assignment: Optional[Tuple] = None  # (room, day, time_slots)
    
    def __repr__(self):
        return f"Var({self.class_name}/{self.course}/{self.session_type})"


class CSPDomain:
    """Represents the domain of possible assignments for a variable."""
    def __init__(self):
        self.values: List[Tuple] = []  # List of (room, day, time_slots_tuple)
    
    def add(self, room: str, day: str, time_slots: tuple):
        self.values.append((room, day, time_slots))
    
    def remove(self, value):
        if value in self.values:
            self.values.remove(value)
    
    def is_empty(self):
        return len(self.values) == 0
    
    def copy(self):
        new_domain = CSPDomain()
        new_domain.values = self.values.copy()
        return new_domain


class CSPSolver:
    """Constraint Satisfaction Problem solver for timetable scheduling."""
    
    def __init__(self, payload: GeneratePayload, seed: int, max_seconds: float = 8.0):
        random.seed(seed)
        self.payload = payload
        self.seed = seed
        self.max_seconds = max_seconds
        import time
        self._start_time = time.time()
        self.variables: List[CSPVariable] = []
        self.domains: Dict[int, CSPDomain] = {}
        self.constraints_checked = 0
        self.backtracks = 0
        
        # Initialize data structures
        self._initialize_variables()
        self._initialize_domains()
    
    def _initialize_variables(self):
        """Create CSP variables from assignments.
        
        Handles both theory courses (1-3 credit hours = 1-3 sessions per week)
        and lab courses (1 credit hour = 1 session of 3 consecutive hours).
        """
        var_id = 0
        for a in self.payload.assignments:
            cls = a.get("class") or a.get("class_")
            course = a.get("course")
            typ = a.get("type")
            ch = a.get("creditHours", 1)
            instr = a.get("instructor")
            
            if not cls or not course or not typ:
                continue
            
            # Normalize course type
            typ = "Lab" if typ.lower() in ["lab", "laboratory"] else "Lecture"
            
            if typ == "Lab":
                # Lab: 1 credit hour = 1 session of 3 consecutive slots
                # Each lab gets exactly 1 variable representing 3 consecutive hours
                var = CSPVariable(var_id, str(cls), str(course), "Lab", 
                                 str(instr) if instr else None)
                self.variables.append(var)
                var_id += 1
            else:
                # Theory: creditHours = number of separate 1-hour sessions per week
                # Create one variable per session (e.g., 3 credit hours = 3 sessions)
                sessions = max(1, int(ch))
                for session_num in range(sessions):
                    var = CSPVariable(var_id, str(cls), str(course), "Lecture", 
                                     str(instr) if instr else None)
                    self.variables.append(var)
                    var_id += 1
    
    def _initialize_domains(self):
        """Initialize domains for all variables based on available slots.
        
        Each variable gets a domain of possible (room, day, time_slots) assignments.
        Theory courses get single slots, labs get consecutive slot blocks.
        """
        # Get available time slots respecting breaks
        slots_by_day = self._get_slots_by_day()
        
        if not slots_by_day:
            raise ValueError("No valid time slots available after applying breaks")
        
        # Count variables by type for logging
        lab_count = sum(1 for v in self.variables if v.session_type == "Lab")
        lecture_count = len(self.variables) - lab_count
        
        print(f"Initializing domains for {len(self.variables)} variables:")
        print(f"  - {lecture_count} theory sessions")
        print(f"  - {lab_count} lab sessions")
        print(f"  - {len(self.payload.rooms)} rooms available")
        print(f"  - {sum(len(slots) for slots in slots_by_day.values())} total time slots")
        
        empty_domain_vars = []
        for var in self.variables:
            domain = CSPDomain()
            
            if var.session_type == "Lab":
                # Lab needs consecutive slots (prefer 3, allow 2 as fallback)
                self._add_lab_domain_values(domain, slots_by_day, var)
            else:
                # Lecture needs 1 slot
                self._add_lecture_domain_values(domain, slots_by_day, var)
            
            if domain.is_empty():
                empty_domain_vars.append(var)
            
            self.domains[var.id] = domain
        
        if empty_domain_vars:
            print(f"\nWARNING: {len(empty_domain_vars)} variables have empty domains:")
            for v in empty_domain_vars[:5]:
                print(f"  - {v}")
            if len(empty_domain_vars) > 5:
                print(f"  ... and {len(empty_domain_vars) - 5} more")
    
    def _get_slots_by_day(self) -> Dict[str, List[Tuple[str, str]]]:
        """Extract and organize time slots by day, respecting breaks."""
        slots_by_day = {}
        
        for ts in self.payload.timeslots:
            day = ts.get("day")
            start = ts.get("start")
            end = ts.get("end")
            
            if not day or not start or not end:
                continue
            
            # Split into fixed-length slices
            slices = split_into_slices(start, end, self.payload.slotMinutes)
            # Add slices starting exactly at break end to resume immediately
            slices += add_post_break_slices(day, start, end, self.payload.slotMinutes, self.payload.breaks)
            
            for s, e in slices:
                if respects_break(day, s, e, self.payload.breaks):
                    if day not in slots_by_day:
                        slots_by_day[day] = []
                    slots_by_day[day].append((s, e))
        
        # Sort and de-duplicate by start time
        for day in slots_by_day:
            dedup = {}
            for s, e in slots_by_day[day]:
                # keep earliest end for same start to avoid duplicates
                if s not in dedup or e < dedup[s]:
                    dedup[s] = e
            slots_by_day[day] = sorted([(s, dedup[s]) for s in dedup.keys()], key=lambda x: x[0])
        
        return slots_by_day
    
    def _add_lab_domain_values(self, domain: CSPDomain, slots_by_day: Dict, var: CSPVariable):
        """Add all possible lab slot combinations to domain.
        
        Labs require consecutive time slots (ideally 3 hours).
        Prefers dedicated lab rooms but can use classrooms if needed.
        """
        # Preferred lab rooms: if class-specific restriction provided, honor it
        if self.payload.classLabRooms and var.class_name in self.payload.classLabRooms:
            lab_rooms = [r for r in self.payload.classLabRooms.get(var.class_name, [])
                         if self.payload.roomTypes.get(r, "Class") == "Lab"]
        else:
            lab_rooms = [r for r in self.payload.rooms 
                         if self.payload.roomTypes.get(r, "Class") == "Lab"]
        
        # If no dedicated lab rooms matched restriction, fallback to any selected rooms
        if not lab_rooms:
            lab_rooms = self.payload.rooms
        
        if not lab_rooms:
            return  # No rooms available at all
        
        total_options = 0
        for day, day_slots in slots_by_day.items():
            # Priority 1: Find 3 consecutive slots (standard lab duration)
            consecutive_blocks_3 = self._find_consecutive_blocks(day_slots, 3)
            for block in consecutive_blocks_3:
                for room in lab_rooms:
                    domain.add(room, day, tuple(block))
                    total_options += 1
            
            # Priority 2: If few 3-slot options, also try 2 consecutive slots
            # This provides more flexibility for scheduling
            if total_options < len(lab_rooms) * 2:  # Not enough options
                consecutive_blocks_2 = self._find_consecutive_blocks(day_slots, 2)
                for block in consecutive_blocks_2:
                    for room in lab_rooms:
                        domain.add(room, day, tuple(block))
                        total_options += 1
    
    def _add_lecture_domain_values(self, domain: CSPDomain, slots_by_day: Dict, var: CSPVariable):
        """Add all possible lecture slot combinations to domain.
        
        Theory courses need single 1-hour slots.
        Can use any classroom, and also lab rooms when they're available.
        """
        # Get all classroom-type rooms
        class_rooms = [r for r in self.payload.rooms 
                      if self.payload.roomTypes.get(r, "Class") == "Class"]
        
        # If no dedicated classrooms, use all available rooms (including labs)
        if not class_rooms:
            class_rooms = self.payload.rooms
        
        if not class_rooms:
            raise ValueError("No rooms available for scheduling")
        
        # Add all possible single-slot options for each day
        for day, day_slots in slots_by_day.items():
            for slot in day_slots:
                for room in class_rooms:
                    domain.add(room, day, (slot,))
    
    def _find_consecutive_blocks(self, slots: List[Tuple[str, str]], count: int) -> List[List[Tuple[str, str]]]:
        """Find consecutive time slot blocks of given count."""
        blocks = []
        
        for i in range(len(slots) - count + 1):
            is_consecutive = True
            block = [slots[i]]
            
            for j in range(1, count):
                # Check if next slot starts when previous ends
                if slots[i + j - 1][1] == slots[i + j][0]:
                    block.append(slots[i + j])
                else:
                    is_consecutive = False
                    break
            
            if is_consecutive and len(block) == count:
                blocks.append(block)
        
        return blocks
    
    # ==================== HARD CONSTRAINTS ====================
    
    def check_hard_constraints(self, var: CSPVariable, assignment: Tuple) -> bool:
        """Check if assignment satisfies all hard constraints."""
        self.constraints_checked += 1
        
        room, day, time_slots = assignment
        
        # Hard Constraint 1: No room conflicts
        if not self._check_no_room_conflict(room, day, time_slots, var):
            return False
        
        # Hard Constraint 2: No class conflicts
        if not self._check_no_class_conflict(var.class_name, day, time_slots, var):
            return False
        
        # Hard Constraint 3: No instructor conflicts
        if var.instructor and not self._check_no_instructor_conflict(
            var.instructor, day, time_slots, var):
            return False
        
        # Hard Constraint 4: Correct room type (Lab vs Class)
        if not self._check_room_type(var.session_type, room):
            return False
        
        return True
    
    def _check_no_room_conflict(self, room: str, day: str, time_slots: tuple, 
                                current_var: CSPVariable) -> bool:
        """Ensure room is not already occupied at this time."""
        for var in self.variables:
            if var.id == current_var.id or var.assignment is None:
                continue
            
            assigned_room, assigned_day, assigned_slots = var.assignment
            
            if assigned_room == room and assigned_day == day:
                # Check for time overlap
                if self._slots_overlap(time_slots, assigned_slots):
                    return False
        
        return True
    
    def _check_no_class_conflict(self, class_name: str, day: str, time_slots: tuple,
                                 current_var: CSPVariable) -> bool:
        """Ensure class doesn't have overlapping sessions."""
        for var in self.variables:
            if var.id == current_var.id or var.assignment is None:
                continue
            
            if var.class_name == class_name:
                _, assigned_day, assigned_slots = var.assignment
                
                if assigned_day == day and self._slots_overlap(time_slots, assigned_slots):
                    return False
        
        return True
    
    def _check_no_instructor_conflict(self, instructor: str, day: str, time_slots: tuple,
                                     current_var: CSPVariable) -> bool:
        """Ensure instructor doesn't have overlapping sessions."""
        for var in self.variables:
            if var.id == current_var.id or var.assignment is None:
                continue
            
            if var.instructor == instructor:
                _, assigned_day, assigned_slots = var.assignment
                
                if assigned_day == day and self._slots_overlap(time_slots, assigned_slots):
                    return False
        
        return True
    
    def _check_room_type(self, session_type: str, room: str) -> bool:
        """Check if room type matches session type.
        
        Flexible matching:
        - Labs prefer lab rooms but can use classrooms if needed
        - Theory courses prefer classrooms but can use labs when available
        """
        room_type = self.payload.roomTypes.get(room, "Class")
        
        if session_type == "Lab":
            # Labs strongly prefer lab rooms, but can use any room
            return True  # Allow flexibility for realistic scheduling
        else:
            # Theory courses can use any room type
            return True
    
    def _slots_overlap(self, slots1: tuple, slots2: tuple) -> bool:
        """Check if two sets of time slots overlap."""
        def to_minutes(time_str: str) -> int:
            h, m = time_str.split(":")
            return int(h) * 60 + int(m)
        
        # Get time ranges for both slot sets
        for s1, e1 in slots1:
            start1 = to_minutes(s1)
            end1 = to_minutes(e1)
            
            for s2, e2 in slots2:
                start2 = to_minutes(s2)
                end2 = to_minutes(e2)
                
                # Check overlap
                if start1 < end2 and start2 < end1:
                    return True
        
        return False
    
    # ==================== SOFT CONSTRAINTS ====================
    
    def calculate_soft_constraint_score(self, var: CSPVariable, assignment: Tuple) -> float:
        """Calculate soft constraint violations (lower is better).
        
        Optimizes for realistic academic scheduling with multiple theory courses
        and labs per class, ensuring good distribution and minimal conflicts.
        """
        score = 0.0
        room, day, time_slots = assignment
        
        # Soft Constraint 1: Avoid multiple sessions of same course on same day
        # Important for theory courses with 2-3 sessions per week
        score += self._penalty_same_course_same_day(var, day) * 12
        
        # Soft Constraint 2: Prefer spreading sessions across different days
        # Balances workload when scheduling 5+ theory courses + 3 labs
        score += self._penalty_day_overload(var.class_name, day) * 6
        
        # Soft Constraint 3: Avoid back-to-back same course sessions
        # Prevents fatigue from consecutive sessions of same subject
        score += self._penalty_back_to_back(var, day, time_slots) * 15
        
        # Soft Constraint 4: Prefer balanced instructor workload
        # Distributes teaching load evenly across days
        score += self._penalty_instructor_overload(var.instructor, day) * 4
        
        # Soft Constraint 5: Prefer sessions in middle time slots
        # Avoids very early or very late sessions
        score += self._penalty_time_preference(time_slots) * 2
        
        # Soft Constraint 6: Minimize gaps in class schedules
        # Reduces idle time between sessions for students
        score += self._penalty_schedule_gaps(var.class_name, day, time_slots) * 7
        
        # Soft Constraint 7: Prefer proper room types
        # Bonus for using correct room type (lab in lab room, etc)
        score += self._penalty_room_type_mismatch(var.session_type, room) * 3
        
        return score
    
    def _penalty_same_course_same_day(self, var: CSPVariable, day: str) -> float:
        """Penalty for scheduling same course multiple times on same day."""
        count = 0
        for v in self.variables:
            if v.id != var.id and v.assignment is not None:
                if (v.class_name == var.class_name and 
                    v.course == var.course and 
                    v.assignment[1] == day):
                    count += 1
        return count
    
    def _penalty_day_overload(self, class_name: str, day: str) -> float:
        """Penalty for having too many sessions on same day.
        
        With 5+ theory courses and 3 labs, classes may have 15+ sessions/week.
        Aim for 3-4 sessions per day across 5 days.
        """
        count = 0
        for v in self.variables:
            if v.assignment is not None and v.class_name == class_name:
                if v.assignment[1] == day:
                    count += 1
        
        # Progressive penalty: ideal is 3-4 sessions per day
        if count <= 3:
            return 0  # Good distribution
        elif count == 4:
            return 0.5  # Acceptable
        elif count == 5:
            return 2  # Getting heavy
        else:
            return (count - 4) * 3  # Too many sessions
    
    def _penalty_room_type_mismatch(self, session_type: str, room: str) -> float:
        """Penalty for not using ideal room type.
        
        Labs should prefer lab rooms, theory courses prefer classrooms.
        """
        room_type = self.payload.roomTypes.get(room, "Class")
        
        if session_type == "Lab" and room_type != "Lab":
            return 1.0  # Lab in classroom (acceptable but not ideal)
        elif session_type == "Lecture" and room_type == "Lab":
            return 0.5  # Theory in lab room (less problematic)
        
        return 0  # Perfect match
    
    def _penalty_back_to_back(self, var: CSPVariable, day: str, time_slots: tuple) -> float:
        """Penalty for back-to-back sessions of same course."""
        for v in self.variables:
            if v.id != var.id and v.assignment is not None:
                if (v.class_name == var.class_name and 
                    v.course == var.course and 
                    v.assignment[1] == day):
                    
                    assigned_slots = v.assignment[2]
                    
                    # Check if slots are adjacent
                    if self._slots_adjacent(time_slots, assigned_slots):
                        return 1.0
        return 0
    
    def _penalty_instructor_overload(self, instructor: Optional[str], day: str) -> float:
        """Penalty for instructor having too many sessions on same day."""
        if not instructor:
            return 0
        
        count = 0
        for v in self.variables:
            if v.assignment is not None and v.instructor == instructor:
                if v.assignment[1] == day:
                    count += 1
        
        if count > 5:
            return count - 5
        return 0
    
    def _penalty_time_preference(self, time_slots: tuple) -> float:
        """Penalty for undesirable time slots (too early or too late)."""
        def to_minutes(time_str: str) -> int:
            h, m = time_str.split(":")
            return int(h) * 60 + int(m)
        
        penalty = 0
        for start, _ in time_slots:
            start_min = to_minutes(start)
            
            # Prefer times between 9 AM and 5 PM
            if start_min < 9 * 60:  # Before 9 AM
                penalty += 0.5
            elif start_min > 17 * 60:  # After 5 PM
                penalty += 0.5
        
        return penalty
    
    def _penalty_schedule_gaps(self, class_name: str, day: str, time_slots: tuple) -> float:
        """Penalty for creating gaps in class schedule."""
        def to_minutes(time_str: str) -> int:
            h, m = time_str.split(":")
            return int(h) * 60 + int(m)
        
        # Get all slots for this class on this day
        class_slots = []
        for v in self.variables:
            if v.assignment is not None and v.class_name == class_name:
                if v.assignment[1] == day:
                    for s, e in v.assignment[2]:
                        class_slots.append((to_minutes(s), to_minutes(e)))
        
        # Add current slots
        for s, e in time_slots:
            class_slots.append((to_minutes(s), to_minutes(e)))
        
        # Sort by start time
        class_slots.sort()
        
        # Calculate total gap time
        gap_penalty = 0
        for i in range(len(class_slots) - 1):
            gap = class_slots[i + 1][0] - class_slots[i][1]
            if gap > 60:  # Gap larger than 1 hour
                gap_penalty += (gap - 60) / 60.0  # Penalty proportional to gap size
        
        return gap_penalty
    
    def _slots_adjacent(self, slots1: tuple, slots2: tuple) -> bool:
        """Check if two slot sets are adjacent in time."""
        for _, e1 in slots1:
            for s2, _ in slots2:
                if e1 == s2:
                    return True
        
        for _, e2 in slots2:
            for s1, _ in slots1:
                if e2 == s1:
                    return True
        
        return False
    
    # ==================== VARIABLE ORDERING HEURISTICS ====================
    
    def select_unassigned_variable(self) -> Optional[CSPVariable]:
        """Select next variable using MRV (Minimum Remaining Values) heuristic."""
        unassigned = [v for v in self.variables if v.assignment is None]
        
        if not unassigned:
            return None
        
        # MRV: Choose variable with smallest domain
        min_domain_size = float('inf')
        best_var = None
        
        for var in unassigned:
            domain_size = len(self.domains[var.id].values)
            
            if domain_size == 0:
                return var  # Dead end, return immediately
            
            if domain_size < min_domain_size:
                min_domain_size = domain_size
                best_var = var
        
        return best_var
    
    # ==================== VALUE ORDERING HEURISTICS ====================
    
    def order_domain_values(self, var: CSPVariable) -> List[Tuple]:
        """Order domain values using Least Constraining Value heuristic."""
        domain = self.domains[var.id]
        
        # Score each value by soft constraints
        scored_values = []
        for value in domain.values:
            if self.check_hard_constraints(var, value):
                score = self.calculate_soft_constraint_score(var, value)
                scored_values.append((score, value))
        
        # Sort by score (lower is better)
        scored_values.sort(key=lambda x: x[0])
        
        return [v for _, v in scored_values]
    
    # ==================== FORWARD CHECKING ====================
    
    def forward_check(self, var: CSPVariable, assignment: Tuple) -> Dict[int, CSPDomain]:
        """Perform forward checking to prune domains of unassigned variables."""
        removed_values = defaultdict(list)
        
        room, day, time_slots = assignment
        
        for other_var in self.variables:
            if other_var.id == var.id or other_var.assignment is not None:
                continue
            
            domain = self.domains[other_var.id]
            values_to_remove = []
            
            for value in domain.values[:]:
                other_room, other_day, other_slots = value
                
                # Check if this value would violate constraints
                # Room conflict
                if other_room == room and other_day == day:
                    if self._slots_overlap(time_slots, other_slots):
                        values_to_remove.append(value)
                        continue
                
                # Class conflict
                if other_var.class_name == var.class_name and other_day == day:
                    if self._slots_overlap(time_slots, other_slots):
                        values_to_remove.append(value)
                        continue
                
                # Instructor conflict
                if (var.instructor and other_var.instructor == var.instructor and 
                    other_day == day):
                    if self._slots_overlap(time_slots, other_slots):
                        values_to_remove.append(value)
                        continue
            
            # Remove conflicting values and track for restoration
            for value in values_to_remove:
                domain.remove(value)
                removed_values[other_var.id].append(value)
        
        return removed_values
    
    def restore_domains(self, removed_values: Dict[int, List]):
        """Restore domain values after backtracking."""
        for var_id, values in removed_values.items():
            for value in values:
                self.domains[var_id].add(*value)
    
    # ==================== BACKTRACKING SEARCH ====================
    
    def _time_exceeded(self) -> bool:
        import time
        return (time.time() - self._start_time) > self.max_seconds

    def backtrack(self) -> bool:
        """Backtracking search with forward checking."""
        # Abort if time budget exceeded to avoid hanging
        if self._time_exceeded():
            return False
        # Check if assignment is complete
        var = self.select_unassigned_variable()
        if var is None:
            return True  # All variables assigned
        
        # Check if domain is empty
        if self.domains[var.id].is_empty():
            return False
        
        # Try values in order
        ordered_values = self.order_domain_values(var)
        
        for value in ordered_values:
            # Make assignment
            var.assignment = value
            
            # Forward check
            removed = self.forward_check(var, value)
            
            # Check if any domain became empty
            domains_valid = all(
                not self.domains[v.id].is_empty() 
                for v in self.variables 
                if v.assignment is None
            )
            
            if domains_valid:
                # Recursive call
                result = self.backtrack()
                if result:
                    return True
            
            # Backtrack
            self.backtracks += 1
            var.assignment = None
            self.restore_domains(removed)
        
        return False
    
    def solve(self) -> bool:
        """Solve the CSP."""
        return self.backtrack()
    
    def get_solution(self) -> Dict[str, Any]:
        """Convert CSP solution to timetable format."""
        details = []
        timetable_id = 0
        
        for var in self.variables:
            if var.assignment is None:
                continue
            
            room, day, time_slots = var.assignment
            
            for start, end in time_slots:
                timetable_id += 1
                details.append({
                    "timeTableID": timetable_id,
                    "roomNumber": room,
                    "class": var.class_name,
                    "course": var.course,
                    "day": day,
                    "time": f"{start}-{end}",
                    "instructorName": var.instructor or "Instructor",
                })
        
        # Generate header
        base_id = hash(f"{self.payload.instituteID}_{self.payload.session}_{self.payload.year}_{self.seed}") % 900000 + 100000
        
        header = {
            "instituteTimeTableID": base_id,
            "session": self.payload.session,
            "year": self.payload.year,
            "visibility": True,
            "currentStatus": False,
        }
        
        # Add break times if uniform
        if (self.payload.breaks and self.payload.breaks.mode == "same" and 
            self.payload.breaks.same):
            header["breakStart"] = self.payload.breaks.same.start
            header["breakEnd"] = self.payload.breaks.same.end
        
        return {
            "header": header,
            "details": details,
            "stats": {
                "constraintsChecked": self.constraints_checked,
                "backtracks": self.backtracks,
                "variablesAssigned": len([v for v in self.variables if v.assignment])
            }
        }


def generate_candidate(payload: GeneratePayload, seed: int) -> Dict[str, Any]:
    """Generate one timetable candidate using CSP solver.

    Hard Constraints:
    1. No room conflicts - same room cannot be used at same time
    2. No class conflicts - class cannot have multiple sessions at same time
    3. No instructor conflicts - instructor cannot teach multiple sessions at same time
    4. Room type matching - labs in lab rooms, lectures in classrooms
    5. Break time respect - no sessions during break windows
    6. Lab consecutive slots - labs require 3 consecutive hour slots

    Soft Constraints (preferences, not requirements):
    1. Avoid multiple sessions of same course on same day
    2. Spread sessions across different days (avoid day overload)
    3. Avoid back-to-back same course sessions
    4. Balance instructor workload across days
    5. Prefer middle time slots (9 AM - 5 PM)
    6. Minimize gaps in class schedules
    """
    random.seed(seed)

    # Normalize breaks
    def to_min(t: str) -> int:
        h, m = t.split(":"); return int(h) * 60 + int(m)
    def from_min(x: int) -> str:
        h = x // 60; m = x % 60; return f"{h:02d}:{m:02d}"
    
    if payload.breaks:
        if payload.breaks.mode == "same" and payload.breaks.same:
            bs = payload.breaks.same.start
            be = payload.breaks.same.end
            if bs and (not be or to_min(be) <= to_min(bs)):
                payload.breaks.same.end = from_min(to_min(bs) + payload.slotMinutes)
        elif payload.breaks.mode == "per-day" and payload.breaks.perDay:
            for day, bw in list(payload.breaks.perDay.items()):
                bs = bw.start; be = bw.end
                if bs and (not be or to_min(be) <= to_min(bs)):
                    payload.breaks.perDay[day].end = from_min(to_min(bs) + payload.slotMinutes)
    
    # Create and solve CSP
    try:
        # Limit solve time to avoid hanging; adjustable if needed
        solver = CSPSolver(payload, seed, max_seconds=8.0)
    except Exception as e:
        raise HTTPException(status_code=400, detail={
            "message": f"Failed to initialize CSP solver: {str(e)}",
            "hint": "Check that rooms, time slots, and breaks are properly configured."
        })
    
    # Log initial state
    print(f"\n=== CSP Solver Initialized ===")
    print(f"Variables: {len(solver.variables)}")
    print(f"Rooms: {len(payload.rooms)}")
    print(f"Time slots: {len(payload.timeslots)}")
    empty_domains = [v for v in solver.variables if solver.domains[v.id].is_empty()]
    if empty_domains:
        print(f"WARNING: {len(empty_domains)} variables have empty domains from start!")
        for v in empty_domains[:3]:
            print(f"  - {v}")
    print(f"==============================\n")
    
    # Attempt to solve with timeout protection
    success = solver.solve()
    
    if not success:
        # Get diagnostic information
        unassigned = [v for v in solver.variables if v.assignment is None]
        empty_domains = [v for v in solver.variables 
                        if solver.domains[v.id].is_empty() and v.assignment is None]
        
        error_msg = f"CSP Solver failed to find a complete solution.\n"
        error_msg += f"Assigned {len([v for v in solver.variables if v.assignment])} out of {len(solver.variables)} variables.\n"
        error_msg += f"Unassigned variables: {len(unassigned)}\n"
        
        if empty_domains:
            error_msg += f"Variables with empty domains: {len(empty_domains)}\n"
            error_msg += f"Sample: {empty_domains[:3]}\n"
        
        raise HTTPException(status_code=400, detail={
            "message": error_msg,
            "unassigned": [{"class": v.class_name, "course": v.course, "type": v.session_type} 
                          for v in unassigned[:10]],
            "stats": {
                "totalVariables": len(solver.variables),
                "assignedVariables": len([v for v in solver.variables if v.assignment]),
                "constraintsChecked": solver.constraints_checked,
                "backtracks": solver.backtracks,
            },
            "hint": "Solver timed out or insufficient resources. Try: adding more rooms, extending time windows, reducing sessions, or adjusting break times."
        })
    
    # Get the solution
    return solver.get_solution()

@app.post("/timetables/generate")
async def generate(payload: GeneratePayload):
    """Generate timetable candidates using CSP solver with different seeds."""
    try:
        # Generate multiple candidates with different random seeds
        # This provides variety while maintaining constraint satisfaction
        candidates = [
            generate_candidate(payload, seed=42),
            generate_candidate(payload, seed=1337),
            generate_candidate(payload, seed=2025),
        ]
    except HTTPException as e:
        # Bubble up structured scheduling failures
        raise e
    except Exception as e:
        # Convert unexpected errors to 400 with message for client
        raise HTTPException(status_code=400, detail={
            "message": f"Unexpected error during generation: {str(e)}",
            "type": type(e).__name__
        })
    
    return {"candidates": candidates}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
