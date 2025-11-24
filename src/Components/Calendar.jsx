import { useState, useEffect, useMemo, useCallback } from "react";
import dayjs from "dayjs";

export default function Calendar() {
  const [current, setCurrent] = useState(dayjs());
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const monthStart = useMemo(() => current.startOf("month"), [current]);
  const daysInMonth = useMemo(() => current.daysInMonth(), [current]);
  const startDay = useMemo(() => monthStart.day(), [monthStart]);
  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, [events]);

  const handlePrev = useCallback(() => setCurrent((s) => s.subtract(1, "month")), []);
  const handleNext = useCallback(() => setCurrent((s) => s.add(1, "month")), []);
  const handlePrevYear = useCallback(() => setCurrent((s) => s.subtract(1, "year")), []);
  const handleNextYear = useCallback(() => setCurrent((s) => s.add(1, "year")), []);
  const handleToday = useCallback(() => setCurrent(dayjs()), []);

  const formatTimeRange = (ev) => `${ev.startTime} - ${ev.endTime}`;
  const getDuration = (ev) => {
    try {
      const start = dayjs(`${ev.date} ${ev.startTime}`, "YYYY-MM-DD HH:mm");
      const end = dayjs(`${ev.date} ${ev.endTime}`, "YYYY-MM-DD HH:mm");
      const diffMins = Math.max(0, end.diff(start, "minute"));
      const hrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    } catch {
      return "";
    }
  };

  useEffect(() => {
    fetch("/events.json")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch(() => setEvents([]));
  }, []);

  const getEventsForDate = (date) => eventsByDate[date] || [];

  const renderCells = () => {
    let cells = [];

    for (let i = 0; i < startDay; i++) {
      cells.push(
        <div
          key={"empty-" + i}
          className="p-2 border relative rounded-lg min-h-[6rem]"
        />
      );
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayObj = current.date(d);
      const formatted = dayObj.format("YYYY-MM-DD");
      const dayEvents = getEventsForDate(formatted);

      cells.push(
        <div
          key={d}
          className={`p-2 border relative rounded-lg min-h-[6rem] ${
            formatted === today ? "bg-blue-100 border-blue-600" : ""
          }`}
        >
          <div className="font-semibold">{d}</div>

          <div className="flex flex-col gap-1 mt-1 overflow-y-auto">
            {dayEvents.map((ev, idx) => (
              <div
                key={idx}
                className="text-white text-xs p-1 rounded cursor-pointer flex items-center justify-between"
                title={`${ev.title} (${ev.startTime} - ${ev.endTime})\nAttendees: ${ev.attendees?.join(", ") || "None"}\n${ev.description || ""}`}
                onClick={() => setSelectedEvent(ev)}
                role="button"
                style={{ backgroundColor: ev.color }}
              >
                <span className="truncate pr-2">{ev.title}</span>
                <div className="flex items-center">
                  <span className="text-[11px] opacity-90">{ev.startTime}</span>
                  {ev.attendees && ev.attendees.length > 0 && (
                    <span className="ml-2 text-[10px] px-1 rounded bg-white/30 text-white/100">{ev.attendees.length}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="max-w-4xl w-full mx-auto mt-6 p-3 sm:p-5">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex gap-1 items-center">
          <button onClick={handlePrevYear} className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" aria-label="Previous year">«</button>
          <button onClick={handlePrev} className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" aria-label="Previous month">←</button>
        </div>

        <div className="text-center w-full sm:w-auto">
          <h2 className="text-lg sm:text-2xl font-bold">{current.format("MMMM YYYY")}</h2>
          <div className="text-xs sm:text-sm text-gray-500 mt-1">{current.format("YYYY")}</div>
        </div>

        <div className="flex gap-1 items-center">
          <button onClick={handleNext} className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" aria-label="Next month">→</button>
          <button onClick={handleNextYear} className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" aria-label="Next year">»</button>
        </div>

        <button onClick={handleToday} className="mt-2 sm:mt-0 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200" aria-label="Today">Today</button>
      </div>

      <div className="grid grid-cols-7 text-center font-semibold mb-2 text-[11px] sm:text-base">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {renderCells()}
      </div>

      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full sm:w-11/12 max-w-md p-4 sm:p-5 mx-3 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex justify-between items-start">
              <div className="pr-4">
                <div className="flex items-center">
                  <span
                    className="w-3 h-3 rounded mr-2"
                    style={{ backgroundColor: selectedEvent.color }}
                  ></span>
                  <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
                </div>

                <p className="text-sm text-gray-500 mt-1">{selectedEvent.date}</p>
                <p className="text-sm text-gray-700 mt-1 font-medium">
                  {formatTimeRange(selectedEvent)}
                </p>
              </div>

              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-gray-700">

              <div className="flex justify-between">
                <div className="text-gray-600">Duration</div>
                <div className="font-medium">{getDuration(selectedEvent)}</div>
              </div>

              <div>
                <div className="text-gray-600 mb-1">Attendees</div>
                <div className="flex flex-wrap gap-2">
                  {(selectedEvent.attendees && selectedEvent.attendees.length > 0)
                    ? selectedEvent.attendees.map((a, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">{a}</span>
                      ))
                    : <span className="text-gray-500 text-xs">No attendees listed</span>
                  }
                </div>
              </div>

              <div>
                <div className="text-gray-600 mb-1">Description</div>
                <div className="text-gray-700">
                  {selectedEvent.description || "No description provided."}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
