import { theme } from "../styles/theme";

export type RecurrenceRule = "none" | "daily" | "weekly" | "monthly";

export interface Task {
  id: string;
  title: string;
  date: string;
  points: number;
  completed: boolean;
  recurrence: RecurrenceRule;
  seriesId?: string | null;
}

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

function formatTaskDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

function formatRecurrence(recurrence: RecurrenceRule) {
  if (recurrence === "none") {
    return "One-time";
  }

  return `Repeats ${recurrence}`;
}

function TaskCard({ task, onToggleComplete, onEdit, onDelete }: TaskCardProps) {
  return (
    <div
      className={`${theme.card} ${
        task.completed ? "border-success/70 bg-success/20" : ""
      } flex items-center justify-between gap-4 p-4 transition duration-200 hover:-translate-y-1`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={task.completed ? "Mark task incomplete" : "Mark task complete"}
            className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold transition ${
              task.completed
                ? "border-success bg-success text-white"
                : "border-borderSoft bg-white text-inkSoft hover:border-skyPastel"
            }`}
            onClick={() => onToggleComplete(task.id)}
          >
            {task.completed ? "✓" : ""}
          </button>
          <div>
            <p
              className={`font-semibold ${
                task.completed ? "text-inkSoft/60 line-through" : "text-inkSoft"
              }`}
            >
              {task.title}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <p className="text-sm text-inkSoft/60">{formatTaskDate(task.date)}</p>
              <span className="rounded-full bg-skyPastel/20 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-inkSoft/60">
                {formatRecurrence(task.recurrence)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-full bg-blushPastel px-3 py-1 text-sm font-semibold text-inkSoft">
          +{task.points} pts
        </span>
        {onEdit ? (
          <button
            type="button"
            className="rounded-full border border-borderSoft px-3 py-2 text-sm text-inkSoft/70 transition hover:border-skyPastel hover:bg-skyPastel/30"
            onClick={() => onEdit(task.id)}
          >
            Edit
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            className="rounded-full border border-borderSoft px-3 py-2 text-sm text-inkSoft/70 transition hover:border-blushPastel hover:bg-blushPastel/40"
            onClick={() => onDelete(task.id)}
          >
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default TaskCard;
