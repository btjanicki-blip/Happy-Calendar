import { FormEvent, useEffect, useState } from "react";
import { theme } from "../styles/theme";
import { RecurrenceRule } from "./TaskCard";

export interface TaskFormValues {
  title: string;
  date: string;
  points: number;
  recurrence: RecurrenceRule;
}

interface TaskFormProps {
  initialValues?: TaskFormValues;
  mode?: "create" | "edit";
  onSubmitTask: (values: TaskFormValues) => Promise<void>;
  onCancel?: () => void;
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function TaskForm({
  initialValues,
  mode = "create",
  onSubmitTask,
  onCancel,
}: TaskFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [date, setDate] = useState(initialValues?.date ?? getTodayDate());
  const [points, setPoints] = useState(initialValues?.points ?? 10);
  const [recurrence, setRecurrence] = useState<RecurrenceRule>(
    initialValues?.recurrence ?? "none"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(initialValues?.title ?? "");
    setDate(initialValues?.date ?? getTodayDate());
    setPoints(initialValues?.points ?? 10);
    setRecurrence(initialValues?.recurrence ?? "none");
  }, [initialValues]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmitTask({
        title: title.trim(),
        date,
        points,
        recurrence,
      });

      if (mode === "create") {
        setTitle("");
        setDate(getTodayDate());
        setPoints(10);
        setRecurrence("none");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={`${theme.card} space-y-4 p-6`} onSubmit={handleSubmit}>
      <div>
        <h2 className="text-xl font-semibold text-inkSoft">
          {mode === "edit" ? "Edit task" : "Create a task"}
        </h2>
        <p className="text-sm text-inkSoft/65">
          {mode === "edit"
            ? "Refine the title, date, or points without losing the task history."
            : "Add something meaningful, assign points, and place it on the calendar."}
        </p>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-inkSoft/80">Title</span>
          <input
            className="w-full rounded-3xl border border-borderSoft bg-white px-4 py-3 outline-none transition focus:border-skyPastel focus:ring-2 focus:ring-skyPastel/30"
            placeholder="Write blog post"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-inkSoft/80">Date</span>
            <input
              className="w-full rounded-3xl border border-borderSoft bg-white px-4 py-3 outline-none transition focus:border-skyPastel focus:ring-2 focus:ring-skyPastel/30"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-inkSoft/80">Points</span>
            <input
              className="w-full rounded-3xl border border-borderSoft bg-white px-4 py-3 outline-none transition focus:border-skyPastel focus:ring-2 focus:ring-skyPastel/30"
              type="number"
              min={1}
              value={points}
              onChange={(event) => setPoints(Number(event.target.value))}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-inkSoft/80">Recurrence</span>
          <select
            className="w-full rounded-3xl border border-borderSoft bg-white px-4 py-3 outline-none transition focus:border-skyPastel focus:ring-2 focus:ring-skyPastel/30"
            value={recurrence}
            disabled={mode === "edit"}
            onChange={(event) => setRecurrence(event.target.value as RecurrenceRule)}
          >
            <option value="none">One-time task</option>
            <option value="daily">Daily for the next 2 weeks</option>
            <option value="weekly">Weekly for the next 12 weeks</option>
            <option value="monthly">Monthly for the next 6 months</option>
          </select>
          {mode === "edit" ? (
            <span className="mt-2 block text-xs text-inkSoft/55">
              Recurrence is chosen when the task series is first created.
            </span>
          ) : null}
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`${theme.button} w-full bg-skyPastel py-3 text-center disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {isSubmitting ? "Saving..." : mode === "edit" ? "Save changes" : "Add task"}
      </button>

      {mode === "edit" && onCancel ? (
        <button
          type="button"
          className={`${theme.button} w-full border border-borderSoft bg-white py-3 text-center`}
          onClick={onCancel}
        >
          Cancel editing
        </button>
      ) : null}
    </form>
  );
}

export default TaskForm;
