import { Task } from "./TaskCard";
import { theme } from "../styles/theme";

interface CalendarViewProps {
  tasks: Task[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onToggleComplete: (taskId: string) => void;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function buildCalendarDays(date: Date) {
  const firstDay = startOfMonth(date);
  const lastDay = endOfMonth(date);
  const days: Date[] = [];

  const leadingDays = firstDay.getDay();
  for (let index = leadingDays; index > 0; index -= 1) {
    days.push(new Date(firstDay.getFullYear(), firstDay.getMonth(), 1 - index));
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(firstDay.getFullYear(), firstDay.getMonth(), day));
  }

  while (days.length % 7 !== 0) {
    const nextIndex = days.length - leadingDays - lastDay.getDate() + 1;
    days.push(new Date(lastDay.getFullYear(), lastDay.getMonth() + 1, nextIndex));
  }

  return days;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function CalendarView({
  tasks,
  selectedDate,
  onSelectDate,
  onToggleComplete,
}: CalendarViewProps) {
  const monthAnchor = new Date(`${selectedDate}T00:00:00`);
  const days = buildCalendarDays(monthAnchor);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <section className={`${theme.card} p-6`}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-inkSoft">
            {monthAnchor.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <p className="text-sm text-inkSoft/65">Tap a day to focus today’s quests.</p>
        </div>
        <div className="rounded-full bg-skyPastel/35 px-4 py-2 text-sm font-medium text-inkSoft">
          {tasks.length} total tasks
        </div>
      </div>

      <div className="mb-3 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-inkSoft/50">
        {weekdays.map((weekday) => (
          <div key={weekday}>{weekday}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-3">
        {days.map((day) => {
          const dateKey = formatDateKey(day);
          const tasksForDay = tasks.filter((task) => task.date === dateKey);
          const isSelected = selectedDate === dateKey;
          const isCurrentMonth = day.getMonth() === monthAnchor.getMonth();

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(dateKey)}
              className={`min-h-28 rounded-3xl border p-3 text-left transition duration-200 hover:-translate-y-1 ${
                isSelected
                  ? "border-skyPastel bg-skyPastel/25 shadow-md"
                  : "border-borderSoft bg-white/85 hover:border-skyPastel/70"
              } ${isCurrentMonth ? "opacity-100" : "opacity-55"}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-inkSoft">{day.getDate()}</span>
                {tasksForDay.length > 0 ? (
                  <span className="rounded-full bg-blushPastel px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-inkSoft">
                    {tasksForDay.length}
                  </span>
                ) : null}
              </div>

              <div className="space-y-2">
                {tasksForDay.slice(0, 2).map((task) => (
                  <div
                    key={task.id}
                    className={`rounded-2xl px-2 py-1 text-xs ${
                      task.completed ? "bg-success/30 text-inkSoft/65" : "bg-slate-100 text-inkSoft"
                    }`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleComplete(task.id);
                    }}
                  >
                    <span className={task.completed ? "line-through" : ""}>
                      {task.title}
                      {task.recurrence !== "none" ? " ↻" : ""}
                    </span>
                  </div>
                ))}
                {tasksForDay.length > 2 ? (
                  <p className="text-xs font-medium text-inkSoft/55">
                    +{tasksForDay.length - 2} more
                  </p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default CalendarView;
