import { theme } from "../styles/theme";

interface Badge {
  id: string;
  label: string;
  description: string;
  earned: boolean;
}

interface GamificationPanelProps {
  currentStreak: number;
  bestStreak: number;
  level: number;
  totalPoints: number;
  nextLevelPoints: number;
  badges: Badge[];
}

function GamificationPanel({
  currentStreak,
  bestStreak,
  level,
  totalPoints,
  nextLevelPoints,
  badges,
}: GamificationPanelProps) {
  const levelFloor = Math.max(0, (level - 1) * 100);
  const progressToNextLevel = Math.min(
    100,
    Math.round(((totalPoints - levelFloor) / (nextLevelPoints - levelFloor || 1)) * 100)
  );

  return (
    <section className={`${theme.card} p-6`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-inkSoft">Game stats</h2>
          <p className="text-sm text-inkSoft/65">
            Progress comes from real work, but we can still make it feel rewarding.
          </p>
        </div>
        <div className="rounded-3xl bg-skyPastel/35 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-inkSoft/60">Level</p>
          <p className="text-xl font-bold text-inkSoft">{level}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl bg-skyPastel/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-inkSoft/55">Current streak</p>
          <p className="mt-2 text-2xl font-bold text-inkSoft">{currentStreak} days</p>
        </div>
        <div className="rounded-3xl bg-blushPastel/25 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-inkSoft/55">Best streak</p>
          <p className="mt-2 text-2xl font-bold text-inkSoft">{bestStreak} days</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm font-medium text-inkSoft/70">
          <span>{totalPoints} total points</span>
          <span>{nextLevelPoints - totalPoints} to next level</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blushPastel to-skyPastel transition-all duration-500"
            style={{ width: `${progressToNextLevel}%` }}
          />
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-inkSoft/55">
          Badges
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`rounded-3xl border p-4 ${
                badge.earned
                  ? "border-skyPastel bg-white"
                  : "border-borderSoft bg-slate-50 opacity-75"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-inkSoft">{badge.label}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${
                    badge.earned
                      ? "bg-success/30 text-inkSoft"
                      : "bg-slate-200 text-inkSoft/55"
                  }`}
                >
                  {badge.earned ? "Earned" : "Locked"}
                </span>
              </div>
              <p className="mt-2 text-sm text-inkSoft/65">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default GamificationPanel;
