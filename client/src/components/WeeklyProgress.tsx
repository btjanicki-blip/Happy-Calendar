import { theme } from "../styles/theme";
import { useEffect, useState } from "react";

interface WeeklyProgressProps {
  weeklyGoal: number;
  weeklyPoints: number;
  onSaveGoal: (goal: number) => Promise<void>;
}

function WeeklyProgress({
  weeklyGoal,
  weeklyPoints,
  onSaveGoal,
}: WeeklyProgressProps) {
  const progress = Math.min(100, Math.round((weeklyPoints / weeklyGoal) * 100));
  const [goalInput, setGoalInput] = useState(String(weeklyGoal));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setGoalInput(String(weeklyGoal));
  }, [weeklyGoal]);

  async function handleSaveGoal() {
    const parsedGoal = Number(goalInput);

    if (!Number.isFinite(parsedGoal) || parsedGoal < 1) {
      return;
    }

    setIsSaving(true);

    try {
      await onSaveGoal(parsedGoal);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className={`${theme.card} p-6`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-inkSoft">Weekly progress</h2>
          <p className="text-sm text-inkSoft/65">
            Earn points by finishing tasks before the week wraps up.
          </p>
        </div>
        <div className="rounded-3xl bg-blushPastel px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-inkSoft/60">Goal</p>
          <p className="text-xl font-bold text-inkSoft">{weeklyGoal} pts</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm font-medium text-inkSoft/70">
          <span>{weeklyPoints} points earned</span>
          <span>{progress}%</span>
        </div>

        <div className="h-4 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-skyPastel to-blushPastel transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-3xl bg-slate-50 p-4 sm:flex-row sm:items-end">
        <label className="block flex-1">
          <span className="mb-2 block text-sm font-medium text-inkSoft/80">Update weekly goal</span>
          <input
            className="w-full rounded-3xl border border-borderSoft bg-white px-4 py-3 outline-none transition focus:border-skyPastel focus:ring-2 focus:ring-skyPastel/30"
            type="number"
            min={1}
            value={goalInput}
            onChange={(event) => setGoalInput(event.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            void handleSaveGoal();
          }}
          disabled={isSaving}
          className={`${theme.button} bg-white border border-borderSoft py-3 disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {isSaving ? "Saving..." : "Save goal"}
        </button>
      </div>
    </section>
  );
}

export default WeeklyProgress;
