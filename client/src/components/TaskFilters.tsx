import { theme } from "../styles/theme";

export type TaskFilter = "selected" | "overdue" | "completed" | "highPoint";

interface TaskFiltersProps {
  activeFilter: TaskFilter;
  onChangeFilter: (filter: TaskFilter) => void;
}

const filters: Array<{ id: TaskFilter; label: string }> = [
  { id: "selected", label: "Selected day" },
  { id: "overdue", label: "Overdue" },
  { id: "completed", label: "Completed" },
  { id: "highPoint", label: "High point" },
];

function TaskFilters({ activeFilter, onChangeFilter }: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          className={`${theme.button} ${
            activeFilter === filter.id
              ? "bg-skyPastel"
              : "border border-borderSoft bg-white"
          }`}
          onClick={() => onChangeFilter(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

export default TaskFilters;
