from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import random
import numpy as np

app = FastAPI(title="Smart Scheduler GA API")

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
    mode: str = Field(pattern=r"^(same|per-day)$")
    same: Optional[BreakWindow] = None
    perDay: Optional[Dict[str, BreakWindow]] = None

class Course(BaseModel):
    name: str
    type: str = Field(pattern=r"^(Lecture|Lab)$")
    creditHours: int

class GeneratePayload(BaseModel):
    instituteID: str
    session: str
    year: int
    classes: List[str]
    courses: List[Course]
    instructors: List[str]
    rooms: List[str]
    timeslots: List[Dict[str, Any]]  # expected { day: 'Mon', start: '10:00', end: '11:00' }
    breaks: BreaksConfig
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


def split_into_hour_slices(start: str, end: str) -> List[tuple]:
    """Split a window (start,end) into ~1h slices."""
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
    while s + 50 <= e:  # require at least 50 minutes for a slice
        nxt = min(s + 60, e)
        out.append((from_min(s), from_min(nxt)))
        s = nxt
    return out


def generate_candidate(payload: GeneratePayload, seed: int) -> Dict[str, Any]:
    """Generate one timetable candidate with simple constraint solving.

    Constraints:
    - Lecture creditHours = number of 1-hour sessions per week per class per course
    - Labs require a 3-hour block (or 3 consecutive 1-hour slots if no 3h block exists)
    - No clashes for room, class, or instructor at the same day/time
    - Avoid scheduling within break windows
    """
    random.seed(seed)
    np.random.seed(seed)

    classes = payload.classes or ["Class"]
    rooms = payload.rooms or ["R1"]
    instructors = payload.instructors or ["Instructor"]

    # Normalize usable 1-hour slots by day, excluding breaks
    one_hour_slots = []  # list of (day, start, end)
    slots_by_day: Dict[str, List[tuple]] = {}
    for ts in payload.timeslots:
        day = ts.get("day")
        start = ts.get("start")
        end = ts.get("end")
        if not day or not start or not end:
            continue
        # Split the day window into hour slices, then filter by break
        for (s, e) in split_into_hour_slices(start, end):
            if not respects_break(day, s, e, payload.breaks):
                continue
            one_hour_slots.append((day, s, e))
            slots_by_day.setdefault(day, []).append((s, e))
    # Sort each day by start time
    for d in slots_by_day:
        slots_by_day[d].sort(key=lambda se: se[0])

    # Instructor assignment per course (stable mapping to reduce clashes)
    course_to_instructor: Dict[str, str] = {}
    for idx, c in enumerate(payload.courses):
        course_to_instructor[c.name] = instructors[idx % len(instructors)]

    # Occupancy trackers to prevent clashes
    room_busy = set()        # (room, day, start, end)
    class_busy = set()       # (class, day, start, end)
    instr_busy = set()       # (instructor, day, start, end)

    details = []
    timeTableID = 0

    def try_place_lecture(cls: str, course_name: str) -> bool:
        random.shuffle(one_hour_slots)
        instr = course_to_instructor.get(course_name, instructors[0])
        for (day, start, end) in one_hour_slots:
            # Check occupancy
            for r in rooms:
                key_room = (r, day, start, end)
                key_class = (cls, day, start, end)
                key_instr = (instr, day, start, end)
                if key_room in room_busy or key_class in class_busy or key_instr in instr_busy:
                    continue
                # Place
                nonlocal timeTableID
                timeTableID += 1
                details.append({
                    "timeTableID": timeTableID,
                    "roomNumber": r,
                    "class": cls,
                    "course": course_name,
                    "day": day,
                    "time": slot_string(start, end),
                    "instructorName": instr,
                })
                room_busy.add(key_room)
                class_busy.add(key_class)
                instr_busy.add(key_instr)
                return True
        return False

    def find_consecutive_triplet(day: str) -> Optional[List[tuple]]:
        day_slots = slots_by_day.get(day, [])
        for i in range(len(day_slots) - 2):
            s1, e1 = day_slots[i]
            s2, e2 = day_slots[i + 1]
            s3, e3 = day_slots[i + 2]
            # consecutive if previous end equals next start
            if e1 == s2 and e2 == s3:
                return [(s1, e1), (s2, e2), (s3, e3)]
        return None

    def try_place_lab(cls: str, course_name: str) -> bool:
        instr = course_to_instructor.get(course_name, instructors[0])
        days_shuffled = list(slots_by_day.keys())
        random.shuffle(days_shuffled)
        for day in days_shuffled:
            triplet = find_consecutive_triplet(day)
            if not triplet:
                continue
            (s1, e1), (s2, e2), (s3, e3) = triplet
            for r in rooms:
                k1 = (r, day, s1, e1)
                k2 = (r, day, s2, e2)
                k3 = (r, day, s3, e3)
                c1 = (cls, day, s1, e1)
                c2 = (cls, day, s2, e2)
                c3 = (cls, day, s3, e3)
                i1 = (instr, day, s1, e1)
                i2 = (instr, day, s2, e2)
                i3 = (instr, day, s3, e3)
                if any(k in room_busy for k in (k1, k2, k3)) or any(k in class_busy for k in (c1, c2, c3)) or any(k in instr_busy for k in (i1, i2, i3)):
                    continue
                # Place as three rows
                nonlocal timeTableID
                for (s, e) in [(s1, e1), (s2, e2), (s3, e3)]:
                    timeTableID += 1
                    details.append({
                        "timeTableID": timeTableID,
                        "roomNumber": r,
                        "class": cls,
                        "course": course_name,
                        "day": day,
                        "time": slot_string(s, e),
                        "instructorName": instr,
                    })
                room_busy.update([k1, k2, k3])
                class_busy.update([c1, c2, c3])
                instr_busy.update([i1, i2, i3])
                return True
        return False

    # Build task list: for each class and course
    tasks = []
    for cls in classes:
        for c in payload.courses:
            if c.type == "Lab":
                tasks.append((cls, c.name, "lab", 3))
            else:
                sessions = max(1, int(c.creditHours))
                for _ in range(sessions):
                    tasks.append((cls, c.name, "lec", 1))

    # Shuffle to reduce systematic conflicts
    random.shuffle(tasks)

    # Try to place all tasks; track failures
    failed_tasks = []
    placement_count = {}  # (class, course) -> count
    for (cls, cname, kind, _hours) in tasks:
        placed = try_place_lab(cls, cname) if kind == "lab" else try_place_lecture(cls, cname)
        if placed:
            key = (cls, cname)
            placement_count[key] = placement_count.get(key, 0) + 1
        else:
            failed_tasks.append({"class": cls, "course": cname, "type": kind})

    # Verify credit hours met for all courses
    expected_placements = {}
    for cls in classes:
        for c in payload.courses:
            key = (cls, c.name)
            if c.type == "Lab":
                expected_placements[key] = 1  # lab = 1 task (3 consecutive slots)
            else:
                expected_placements[key] = max(1, int(c.creditHours))

    missing = []
    for (cls, cname), exp in expected_placements.items():
        actual = placement_count.get((cls, cname), 0)
        if actual < exp:
            missing.append({"class": cls, "course": cname, "expected": exp, "actual": actual})

    if failed_tasks or missing:
        error_msg = "Scheduling failed due to clashes or insufficient slots.\n"
        if failed_tasks:
            error_msg += f"Failed to place {len(failed_tasks)} task(s): {failed_tasks[:5]}\n"
        if missing:
            error_msg += f"Credit hours not met for {len(missing)} course(s): {missing[:5]}"
        raise ValueError(error_msg)

    # Extract global break from payload if uniform (mode=same)
    bstart = None
    bend = None
    if payload.breaks and payload.breaks.mode == "same" and payload.breaks.same:
        bstart = payload.breaks.same.start
        bend = payload.breaks.same.end

    header = {
        "instituteTimeTableID": random.randint(1000, 999999),
        "session": payload.session,
        "year": payload.year,
        "visibility": True,
        "currentStatus": False,
        **({"breakStart": bstart, "breakEnd": bend} if bstart and bend else {}),
    }

    return {"header": header, "details": details}

@app.post("/timetables/generate")
async def generate(payload: GeneratePayload):
    from fastapi import HTTPException
    # run three seeded variants to emulate different GA runs
    try:
        candidates = [
            generate_candidate(payload, seed=42),
            generate_candidate(payload, seed=1337),
            generate_candidate(payload, seed=2025),
        ]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"candidates": candidates}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
