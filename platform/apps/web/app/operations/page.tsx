"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { DashboardShell } from "@/components/ui/layout/DashboardShell";

type TaskType = "turnover" | "inspection" | "maintenance" | "custom";
type TaskState = "pending" | "in_progress" | "done" | "failed" | "expired";
type SlaStatus = "on_track" | "at_risk" | "breached";

interface Task {
  id: string;
  tenantId: string;
  type: TaskType;
  state: TaskState;
  priority: string | null;
  siteId: string;
  reservationId: string | null;
  assignedToUserId: string | null;
  assignedToTeamId: string | null;
  slaDueAt: string | null;
  slaStatus: SlaStatus;
  checklist: any;
  photos: any;
  notes: string | null;
  source: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const STATE_COLORS: Record<TaskState, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  done: "bg-emerald-100 text-emerald-800 border-emerald-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  expired: "bg-slate-100 text-slate-600 border-slate-200",
};

const SLA_COLORS: Record<SlaStatus, string> = {
  on_track: "bg-emerald-500",
  at_risk: "bg-amber-500",
  breached: "bg-red-500",
};

const TYPE_LABELS: Record<TaskType, string> = {
  turnover: "Turnover",
  inspection: "Inspection",
  maintenance: "Maintenance",
  custom: "Custom",
};

const TYPE_ICONS: Record<TaskType, string> = {
  turnover: "🧹",
  inspection: "🔍",
  maintenance: "🔧",
  custom: "📋",
};

export default function OperationsBoardPage() {
  const [selectedCampgroundId, setSelectedCampgroundId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ state?: TaskState; type?: TaskType; slaStatus?: SlaStatus }>({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Sync selected campground from localStorage (set by DashboardShell switcher)
  useEffect(() => {
    const readSelected = () => {
      if (typeof window === "undefined") return;
      const stored = localStorage.getItem("campreserv:selectedCampground");
      setSelectedCampgroundId(stored);
    };
    readSelected();
    window.addEventListener("storage", readSelected);
    return () => window.removeEventListener("storage", readSelected);
  }, []);

  const loadTasks = useCallback(async () => {
    if (!selectedCampgroundId) return;
    try {
      setLoading(true);
      const data = await apiClient.getTasks(selectedCampgroundId, filter);
      setTasks(data as any);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCampgroundId, filter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const updateTaskState = async (id: string, state: TaskState) => {
    try {
      await apiClient.updateTask(id, { state });
      loadTasks();
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  // Group tasks by state for kanban view
  const tasksByState = {
    pending: tasks.filter(t => t.state === "pending"),
    in_progress: tasks.filter(t => t.state === "in_progress"),
    done: tasks.filter(t => t.state === "done"),
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{TYPE_ICONS[task.type]}</span>
          <span className="font-medium text-slate-900">{TYPE_LABELS[task.type]}</span>
        </div>
        <div className={`w-2 h-2 rounded-full ${SLA_COLORS[task.slaStatus]}`} title={`SLA: ${task.slaStatus.replace("_", " ")}`} />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <span>📍</span>
          <span>Site {task.siteId.slice(0, 8)}...</span>
        </div>

        {task.slaDueAt && (
          <div className="flex items-center gap-2 text-slate-600">
            <span>⏰</span>
            <span>Due: {formatDate(task.slaDueAt)}</span>
          </div>
        )}

        {task.notes && (
          <p className="text-slate-500 line-clamp-2 text-xs mt-2">{task.notes}</p>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        {task.state === "pending" && (
          <button
            onClick={() => updateTaskState(task.id, "in_progress")}
            className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
          >
            Start
          </button>
        )}
        {task.state === "in_progress" && (
          <>
            <button
              onClick={() => updateTaskState(task.id, "done")}
              className="flex-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors"
            >
              Complete
            </button>
            <button
              onClick={() => updateTaskState(task.id, "failed")}
              className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
            >
              Fail
            </button>
          </>
        )}
        {(task.state === "done" || task.state === "failed") && (
          <button
            onClick={() => updateTaskState(task.id, "pending")}
            className="flex-1 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors"
          >
            Reopen
          </button>
        )}
      </div>
    </div>
  );

  const KanbanColumn = ({ title, tasks, state }: { title: string; tasks: Task[]; state: TaskState }) => (
    <div className="flex-1 min-w-[280px] max-w-[360px]">
      <div className="flex items-center gap-2 mb-4 px-1">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATE_COLORS[state]}`}>
          {tasks.length}
        </span>
      </div>
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No tasks</div>
        ) : (
          tasks.map(task => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );

  if (!selectedCampgroundId) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Select a campground to view operations</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Operations Board</h1>
            <p className="text-slate-500 mt-1">Manage housekeeping, turnovers, and maintenance tasks</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <span>+</span> New Task
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-900">{tasks.length}</div>
            <div className="text-sm text-slate-500">Total Tasks</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-amber-600">{tasksByState.pending.length}</div>
            <div className="text-sm text-slate-500">Pending</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{tasksByState.in_progress.length}</div>
            <div className="text-sm text-slate-500">In Progress</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-red-600">
                {tasks.filter(t => t.slaStatus === "breached").length}
              </div>
              {tasks.filter(t => t.slaStatus === "at_risk").length > 0 && (
                <span className="text-sm text-amber-600">
                  ({tasks.filter(t => t.slaStatus === "at_risk").length} at risk)
                </span>
              )}
            </div>
            <div className="text-sm text-slate-500">SLA Breached</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <select
            value={filter.type ?? ""}
            onChange={e => setFilter(f => ({ ...f, type: e.target.value as TaskType || undefined }))}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
          >
            <option value="">All Types</option>
            <option value="turnover">Turnover</option>
            <option value="inspection">Inspection</option>
            <option value="maintenance">Maintenance</option>
            <option value="custom">Custom</option>
          </select>
          <select
            value={filter.slaStatus ?? ""}
            onChange={e => setFilter(f => ({ ...f, slaStatus: e.target.value as SlaStatus || undefined }))}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
          >
            <option value="">All SLA Status</option>
            <option value="on_track">On Track</option>
            <option value="at_risk">At Risk</option>
            <option value="breached">Breached</option>
          </select>
          <button
            onClick={() => setFilter({})}
            className="px-3 py-2 text-slate-500 hover:text-slate-700 text-sm"
          >
            Clear filters
          </button>
        </div>

        {/* Kanban Board */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4">
            <KanbanColumn title="Pending" tasks={tasksByState.pending} state="pending" />
            <KanbanColumn title="In Progress" tasks={tasksByState.in_progress} state="in_progress" />
            <KanbanColumn title="Completed" tasks={tasksByState.done} state="done" />
          </div>
        )}

        {/* Create Task Modal */}
        {showCreateModal && (
          <CreateTaskModal
            campgroundId={selectedCampgroundId}
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false);
              loadTasks();
            }}
          />
        )}
      </div>
    </DashboardShell>
  );
}

function CreateTaskModal({
  campgroundId,
  onClose,
  onCreated,
}: {
  campgroundId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [type, setType] = useState<TaskType>("turnover");
  const [siteId, setSiteId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [notes, setNotes] = useState("");
  const [slaDueAt, setSlaDueAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [sites, setSites] = useState<Array<{ id: string; siteNumber: string }>>([]);

  useEffect(() => {
    async function loadSites() {
      try {
        const data = await apiClient.getSites(campgroundId);
        setSites(data.map((s: any) => ({ id: s.id, siteNumber: s.siteNumber })));
      } catch (err) {
        console.error("Failed to load sites:", err);
      }
    }
    loadSites();
  }, [campgroundId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId) return;

    setSaving(true);
    try {
      await apiClient.createTask(campgroundId, {
        type,
        siteId,
        priority,
        notes: notes || undefined,
        slaDueAt: slaDueAt || undefined,
        createdBy: "user", // TODO: get from auth context
      });
      onCreated();
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Create Task</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Task Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as TaskType)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            >
              <option value="turnover">🧹 Turnover</option>
              <option value="inspection">🔍 Inspection</option>
              <option value="maintenance">🔧 Maintenance</option>
              <option value="custom">📋 Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Site *</label>
            <select
              value={siteId}
              onChange={e => setSiteId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              required
            >
              <option value="">Select a site...</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.siteNumber}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Due Date/Time</label>
            <input
              type="datetime-local"
              value={slaDueAt}
              onChange={e => setSlaDueAt(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none"
              placeholder="Additional instructions or details..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !siteId}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
