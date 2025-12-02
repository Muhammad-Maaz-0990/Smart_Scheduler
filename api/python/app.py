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

# Utility: build weekly grid
DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

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


def generate_candidate(payload: GeneratePayload, seed: int) -> Dict[str, Any]:
    random.seed(seed)
    np.random.seed(seed)

    # Build available slots list as tuples (day, start, end)
    slots = []
    for ts in payload.timeslots:
        day = ts.get("day")
        start = ts.get("start")
        end = ts.get("end")
        if not day or not start or not end:
            continue
        if not respects_break(day, start, end, payload.breaks):
            continue
        slots.append((day, start, end))

    # Enforce credit hours; labs must be 3
    course_requirements = []
    for c in payload.courses:
        ch = 3 if c.type == "Lab" else max(1, int(c.creditHours))
        # For lectures: number of sessions equals credit hours (1h blocks assumed)
        # For labs: 1 session of 3 hours
        if c.type == "Lab":
            course_requirements.append({"course": c.name, "sessions": [(3,)]})
        else:
            course_requirements.append({"course": c.name, "sessions": [(1,) for _ in range(ch)]})

    # A naive GA-like shuffler: random assignment respecting sessions count and slot duration
    details = []
    timeTableID = 0
    rooms_cycle = payload.rooms if payload.rooms else ["R1"]
    instructors_cycle = payload.instructors if payload.instructors else ["Instructor"]
    classes_cycle = payload.classes if payload.classes else ["Class"]

    def pick_room(i):
        return rooms_cycle[i % len(rooms_cycle)]

    def pick_instructor(i):
        return instructors_cycle[i % len(instructors_cycle)]

    def pick_class(i):
        return classes_cycle[i % len(classes_cycle)]

    slot_index = 0
    for req in course_requirements:
        cname = req["course"]
        for sess in req["sessions"]:
            # required hours in this session tuple; for lab it's (3,), lectures are (1,) blocks
            required_hours = sess[0]
            # find slot(s) that fit
            allocated = False
            attempts = 0
            while not allocated and attempts < 1000 and slots:
                sday, sstart, send = slots[slot_index % len(slots)]
                attempts += 1
                dur = duration_in_hours(sstart, send)
                if required_hours <= dur + 1e-6:  # allow exact or longer slot
                    timeTableID += 1
                    details.append({
                        "timeTableID": timeTableID,
                        "roomNumber": pick_room(timeTableID),
                        "class": pick_class(timeTableID),
                        "course": cname,
                        "day": sday,
                        "time": slot_string(sstart, send),
                        "instructorName": pick_instructor(timeTableID),
                        # break window is implicit; we do not schedule within breaks
                    })
                    allocated = True
                    slot_index += 1
                else:
                    slot_index += 1

    header = {
        "instituteTimeTableID": random.randint(1000, 999999),
        "session": payload.session,
        "year": payload.year,
        "visibility": True,
        "currentStatus": False,
    }

    return {"header": header, "details": details}

@app.post("/timetables/generate")
async def generate(payload: GeneratePayload):
    # run three seeded variants to emulate different GA runs
    candidates = [
        generate_candidate(payload, seed=42),
        generate_candidate(payload, seed=1337),
        generate_candidate(payload, seed=2025),
    ]
    return {"candidates": candidates}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
