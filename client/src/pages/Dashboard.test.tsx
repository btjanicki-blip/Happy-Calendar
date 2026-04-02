import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "./Dashboard";

const statsResponse = {
  weeklyGoal: 100,
  weeklyPoints: 25,
  currentStreak: 2,
  bestStreak: 4,
  totalPoints: 125,
  totalCompletedTasks: 6,
  level: 2,
  nextLevelPoints: 200,
  badges: [
    {
      id: "first-win",
      label: "First Win",
      description: "Complete your first task.",
      earned: true,
    },
  ],
};

function jsonResponse(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: async () => data,
  });
}

function getTodayDateKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

describe("Dashboard", () => {
  beforeEach(() => {
    const tasksResponse = [
      {
        id: "task-1",
        title: "Write landing page copy",
        date: getTodayDateKey(),
        points: 15,
        completed: false,
        recurrence: "weekly",
        seriesId: "series-1",
      },
    ];

    global.fetch = vi.fn((input, init) => {
      const url = String(input);

      if (url.endsWith("/tasks") && (!init || !init.method || init.method === "GET")) {
        return jsonResponse(tasksResponse);
      }

      if (url.endsWith("/stats") && (!init || !init.method || init.method === "GET")) {
        return jsonResponse(statsResponse);
      }

      if (url.endsWith("/tasks") && init?.method === "POST") {
        return jsonResponse({ success: true });
      }

      if (url.includes("/tasks/task-1") && init?.method === "PUT") {
        return jsonResponse({ success: true });
      }

      if (url.endsWith("/stats") && init?.method === "PUT") {
        return jsonResponse({
          ...statsResponse,
          weeklyGoal: 120,
        });
      }

      return jsonResponse({ success: true });
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the dashboard and shows gamification stats", async () => {
    render(<Dashboard />);

    expect(await screen.findByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByText("Game stats")).toBeInTheDocument();
    expect(screen.getByText("First Win")).toBeInTheDocument();
  });

  it("supports editing a task", async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    await screen.findByRole("button", { name: "Edit" });
    await user.click(screen.getByRole("button", { name: "Edit" }));

    const titleInput = await screen.findByDisplayValue("Write landing page copy");
    await user.clear(titleInput);
    await user.type(titleInput, "Updated task title");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/tasks/task-1"),
        expect.objectContaining({
          method: "PUT",
        })
      );
    });
  });

  it("updates the weekly goal from the UI", async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    expect(await screen.findByText("Weekly progress")).toBeInTheDocument();
    const goalInput = screen.getByDisplayValue("100");
    await user.clear(goalInput);
    await user.type(goalInput, "120");
    await user.click(screen.getByRole("button", { name: "Save goal" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/stats"),
        expect.objectContaining({
          method: "PUT",
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("120")).toBeInTheDocument();
    });
  });
});
