from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, AliasChoices
from pydantic.config import ConfigDict
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
    """Generate one timetable candidate with heuristic constraint solving.

    Constraints:
    - Lecture creditHours = number of 1-hour sessions per week per class per course
    - Labs require a 3-hour block (or 3 consecutive 1-hour slots if no 3h block exists)
    - No clashes for room, class, or instructor at the same day/time
    - Avoid scheduling within break windows

    Heuristics:
    - Prioritize labs first; they are harder to place
    - Prefer less-crowded days/times to spread load
    - Avoid back-to-back same-course for a class to improve distribution
    - Prefer assigning courses to their mapped instructor consistently
    - Mild backtracking: if placement fails, try alternate ordering
    """
    random.seed(seed)
    np.random.seed(seed)

    classes = payload.classes or ["Class"]
    rooms = payload.rooms or ["R1"]
    # Collect instructor names present in assignments (computed after normalization below)
    instructors = []

    # Normalize: Lab creditHours are treated as 1 (equals 3 consecutive hours)
    # Build assignments from raw dicts and normalize lab credit hours
    normalized_assignments: List[Assignment] = []
    for a in payload.assignments:
        cls = a.get("class") or a.get("class_")
        course = a.get("course")
        typ = a.get("type")
        ch = a.get("creditHours")
        instr = a.get("instructor")
        if not cls or not course or not typ:
            raise ValueError("Invalid assignment entry: missing class/course/type")
        if typ == "Lab" and ch != 1:
            ch = 1
        normalized_assignments.append(Assignment(class_=str(cls), course=str(course), type=str(typ), creditHours=int(ch or 1), instructor=(str(instr) if instr else None)))

    # Now collect instructors list from normalized assignments
    instructors = [a.instructor or "Instructor" for a in normalized_assignments] or ["Instructor"]

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

    # Pre-checks: availability for labs in Lab rooms
    lab_rooms = [r for r in rooms if payload.roomTypes.get(r, "Class") == "Lab"]
    class_rooms = [r for r in rooms if payload.roomTypes.get(r, "Class") == "Class"]
    lab_hour_slices_total = sum(len(slots_by_day.get(day, [])) for day in slots_by_day)
    # Count consecutive triplets available across days
    def count_triplets() -> int:
        total = 0
        for day, day_slots in slots_by_day.items():
            for i in range(len(day_slots) - 2):
                s1, e1 = day_slots[i]
                s2, e2 = day_slots[i + 1]
                s3, e3 = day_slots[i + 2]
                if e1 == s2 and e2 == s3:
                    total += 1
        return total
    lab_consecutive_triplets = count_triplets()

    # Instructor assignment per course (stable mapping to reduce clashes)
    course_to_instructor: Dict[str, str] = {}
    for a in normalized_assignments:
        if a.instructor:
            course_to_instructor[a.course] = a.instructor

    # Occupancy trackers to prevent clashes
    room_busy = set()        # (room, day, start, end)
    class_busy = set()       # (class, day, start, end)
    instr_busy = set()       # (instructor, day, start, end)
    clash_log: List[Dict[str, Any]] = []
    # Track lab block windows per class/day to prevent lectures inside lab spans
    lab_blocks: Dict[tuple, List[tuple]] = {}

    # Util: crowd score per (day,start,end) based on current occupancy
    def crowd_score(day: str, start: str, end: str) -> int:
        base = 0
        for (r, d, s, e) in room_busy:
            if d == day and s == start and e == end:
                base += 1
        for (c, d, s, e) in class_busy:
            if d == day and s == start and e == end:
                base += 1
        for (i, d, s, e) in instr_busy:
            if d == day and s == start and e == end:
                base += 1
        return base

    details = []
    timeTableID = 0

    def within_lab_block(cls: str, day: str, start: str, end: str) -> bool:
        blocks = lab_blocks.get((cls, day), [])
        def to_min(t: str) -> int:
            h, m = t.split(":"); return int(h) * 60 + int(m)
        s = to_min(start); e = to_min(end)
        for (bs, be) in blocks:
            if s < be and e > bs:
                return True
        return False

    def try_place_lecture(cls: str, course_name: str) -> bool:
        # Prefer less crowded slots
        slot_candidates = sorted(one_hour_slots, key=lambda x: crowd_score(*x))
        instr = course_to_instructor.get(course_name, instructors[0])
        # Avoid back-to-back same course for the class on the same day
        last_by_day: Dict[str, Optional[str]] = {}
        for (day, start, end) in slot_candidates:
            # Check occupancy
            for r in rooms:
                # ensure class lectures go to Class rooms
                if payload.roomTypes.get(r, "Class") != "Class":
                    continue
                key_room = (r, day, start, end)
                key_class = (cls, day, start, end)
                key_instr = (instr, day, start, end)
                # skip if inside any lab block for this class/day
                if within_lab_block(cls, day, start, end):
                    continue
                if key_room in room_busy or key_class in class_busy or key_instr in instr_busy:
                    clash_log.append({
                        "kind": "lecture",
                        "reason": "occupied",
                        "room": r,
                        "class": cls,
                        "instructor": instr,
                        "day": day,
                        "time": slot_string(start, end)
                    })
                    continue
                # avoid consecutive same-course for class
                if last_by_day.get(day) == course_name:
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
                last_by_day[day] = course_name
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
        # Prefer days with available consecutive triplets and lower crowding
        day_candidates = list(slots_by_day.keys())
        day_candidates.sort(key=lambda d: sum(crowd_score(d, s, e) for (s, e) in slots_by_day.get(d, [])))
        for day in day_candidates:
            triplet = find_consecutive_triplet(day)
            if not triplet:
                continue
            (s1, e1), (s2, e2), (s3, e3) = triplet
            # Prefer rooms with least occupancy for these slots
            room_candidates = sorted(rooms, key=lambda r: sum((r, day, s, e) in room_busy for (s, e) in [ (s1,e1), (s2,e2), (s3,e3) ]))
            for r in room_candidates:
                # ensure labs go to Lab rooms
                if payload.roomTypes.get(r, "Class") != "Lab":
                    continue
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
                    clash_log.append({
                        "kind": "lab",
                        "reason": "occupied",
                        "room": r,
                        "class": cls,
                        "instructor": instr,
                        "day": day,
                        "time": [slot_string(*pair) for pair in [(s1, e1), (s2, e2), (s3, e3)]]
                    })
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
                # register lab block window to prevent lectures inside
                lab_blocks.setdefault((cls, day), []).append((to_min(s1), to_min(e3)))
                return True
        return False

    # Build task list strictly from assignments per class
    def build_tasks(order_variant: int = 0) -> List[tuple]:
        tasks_local = []
        for a in normalized_assignments:
            if a.type == "Lab":
                tasks_local.append((a.class_, a.course, "lab", 3))
            else:
                sessions = max(1, int(a.creditHours))
                for _ in range(sessions):
                    tasks_local.append((a.class_, a.course, "lec", 1))
        # Order variants: 0 labs-first, 1 lectures-first, 2 random
        if order_variant == 0:
            tasks_local.sort(key=lambda t: (0 if t[2] == "lab" else 1, -t[3]))
        elif order_variant == 1:
            tasks_local.sort(key=lambda t: (0 if t[2] == "lec" else 1, -t[3]))
        else:
            random.shuffle(tasks_local)
        return tasks_local

    def place_all_tasks(tasks_local: List[tuple], allow_lab_split: bool = False) -> tuple:
        failed = []
        placement_count_local = {}
        for (cls, cname, kind, _hours) in tasks_local:
            if kind == "lab":
                placed = try_place_lab(cls, cname)
                # fallback: allow splitting lab into 3 non-consecutive 1h blocks in Lab rooms
                if not placed and allow_lab_split:
                    # try three separate hours
                    need = 3
                    instr = course_to_instructor.get(cname, instructors[0])
                    slot_candidates = sorted(one_hour_slots, key=lambda x: crowd_score(*x))
                    # choose a single day with most available lab slices to avoid lectures in between
                    day_order = list(slots_by_day.keys())
                    day_order.sort(key=lambda d: -len(slots_by_day.get(d, [])))
                    for day in day_order:
                        for (start, end) in slots_by_day.get(day, []):
                            # only Lab rooms
                            for r in rooms:
                                if payload.roomTypes.get(r, "Class") != "Lab":
                                    continue
                            key_room = (r, day, start, end)
                            key_class = (cls, day, start, end)
                            key_instr = (instr, day, start, end)
                            if key_room in room_busy or key_class in class_busy or key_instr in instr_busy:
                                continue
                            nonlocal timeTableID
                            timeTableID += 1
                            details.append({
                                "timeTableID": timeTableID,
                                "roomNumber": r,
                                "class": cls,
                                "course": cname,
                                "day": day,
                                "time": slot_string(start, end),
                                "instructorName": instr,
                            })
                            room_busy.add(key_room)
                            class_busy.add(key_class)
                            instr_busy.add(key_instr)
                            need -= 1
                            if need == 0:
                                # register lab block covering from earliest to latest on that day
                                # compute min/max from placed segments for (cls,day)
                                segments = [d for d in details if d["class"] == cls and d["day"] == day and d["course"] == cname]
                                def to_min(t: str) -> int:
                                    h, m = t.split(":"); return int(h) * 60 + int(m)
                                mins = [to_min(s.split('-')[0]) for s in [seg["time"] for seg in segments]]
                                maxs = [to_min(s.split('-')[1]) for s in [seg["time"] for seg in segments]]
                                if mins and maxs:
                                    lab_blocks.setdefault((cls, day), []).append((min(mins), max(maxs)))
                                break
                        if need == 0:
                            break
                    placed = need == 0
            else:
                placed = try_place_lecture(cls, cname)
            if placed:
                key = (cls, cname)
                placement_count_local[key] = placement_count_local.get(key, 0) + 1
            else:
                failed.append({"class": cls, "course": cname, "type": kind})
        return failed, placement_count_local

    # Multi-strategy attempts: up to 10 revisions
    failed_tasks = []
    placement_count = {}
    strategies = [
        {"order": 0, "allow_split": False},
        {"order": 0, "allow_split": True},
        {"order": 1, "allow_split": False},
        {"order": 2, "allow_split": False},
        {"order": 2, "allow_split": True},
    ]
    # expand to reach ~10 attempts by varying random seed perturbation
    while len(strategies) < 10:
        strategies.append({"order": 2, "allow_split": bool(random.randint(0,1))})

    # Try strategies until success
    for strat in strategies:
        # reset trackers for a fresh attempt
        room_busy.clear(); class_busy.clear(); instr_busy.clear(); details.clear(); timeTableID = 0
        random.shuffle(rooms)
        # slight randomization of slot order
        one_hour_slots.sort(key=lambda x: (x[0], x[1]))
        if strat["order"] == 2:
            random.shuffle(one_hour_slots)

        tasks_variant = build_tasks(order_variant=strat["order"])
        failed_tasks, placement_count = place_all_tasks(tasks_variant, allow_lab_split=strat["allow_split"])
        # compute expected to check success
        expected_placements = {}
        for a in normalized_assignments:
            key = (a.class_, a.course)
            if a.type == "Lab":
                expected_placements[key] = 1
            else:
                expected_placements[key] = max(1, int(a.creditHours))
        missing = []
        for (cls, cname), exp in expected_placements.items():
            actual = placement_count.get((cls, cname), 0)
            if actual < exp:
                missing.append({"class": cls, "course": cname, "expected": exp, "actual": actual})
        if not failed_tasks and not missing:
            break

    # After strategies, compute final missing if any
    expected_placements = {}
    for a in normalized_assignments:
        key = (a.class_, a.course)
        if a.type == "Lab":
            expected_placements[key] = 1  # lab = 1 task (3 consecutive slots)
        else:
            expected_placements[key] = max(1, int(a.creditHours))

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
        # include a short sample of clashes to aid debugging
        sample_clashes = clash_log[:5]
        payload_debug = {
            "message": error_msg,
            "failedTasks": failed_tasks,
            "missing": missing,
            "clashes": sample_clashes,
            "hint": "Ensure lab rooms are selected; provide 3 consecutive 1h slots for labs or allow split fallback; adjust break windows or reduce crowding.",
            "diagnostics": {
                "labRoomsSelected": lab_rooms,
                "classRoomsSelected": class_rooms,
                "labHourSlicesTotal": lab_hour_slices_total,
                "labConsecutiveTriplets": lab_consecutive_triplets
            }
        }
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=payload_debug)

    # Extract global break from payload if uniform (mode=same)
    bstart = None
    bend = None
    if payload.breaks and payload.breaks.mode == "same" and payload.breaks.same:
        bstart = payload.breaks.same.start
        bend = payload.breaks.same.end

    # Generate unique deterministic ID per seed to prevent collisions
    base_id = hash(f"{payload.instituteID}_{payload.session}_{payload.year}_{seed}") % 900000 + 100000
    
    header = {
        "instituteTimeTableID": base_id,
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
    except HTTPException as e:
        # bubble up our structured scheduling failure
        raise e
    except Exception as e:
        # convert unexpected errors to 400 with message for client
        raise HTTPException(status_code=400, detail=f"Generation error: {str(e)}")
    return {"candidates": candidates}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
