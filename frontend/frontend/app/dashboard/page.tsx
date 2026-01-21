"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

type EmailStatus = "SCHEDULED" | "SENT" | "FAILED";

interface EmailRow {
  id: string;
  to: string;
  subject: string;
  status: EmailStatus;
  scheduledAt: string;
  sentAt?: string | null;
}

type TabKey = "scheduled" | "sent";

export default function DashboardPage() {
  const user = useRequireAuth();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("scheduled");
  const [scheduled, setScheduled] = useState<EmailRow[]>([]);
  const [sent, setSent] = useState<EmailRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compose form state
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [emailsText, setEmailsText] = useState("");
  const [startTime, setStartTime] = useState(""); // we'll set this only on change
  const [delayMs, setDelayMs] = useState("2000");
  const [hourlyLimit, setHourlyLimit] = useState("200");
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (activeTab === "scheduled") {
          const res = await api.get("/api/emails/scheduled");
          setScheduled(res.data.emails || []);
        } else {
          const res = await api.get("/api/emails/sent");
          setSent(res.data.emails || []);
        }
      } catch (err: any) {
        console.error(err);
        setError("Failed to load emails");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, user]);

  if (!user) {
    return null; // redirect is happening
  }

  const handleSchedule = async () => {
    try {
      setCreating(true);
      setCreateMessage(null);
      setError(null);

      const emails = emailsText
        .split(/[\n,]/)
        .map(e => e.trim())
        .filter(Boolean);

      if (!subject || !body || emails.length === 0 || !startTime) {
        setCreateMessage("Fill subject, body, emails and start time.");
        setCreating(false);
        return;
      }

      // startTime comes from <input type="datetime-local">
      // which gives a local string like "2026-01-21T16:30"
      const isoStart = new Date(startTime).toISOString();

      await api.post("/api/emails/schedule", {
        subject,
        body,
        emails,
        startTime: isoStart,
        delayMs: Number(delayMs),
        hourlyLimit: Number(hourlyLimit),
      });

      setCreateMessage("Emails scheduled successfully.");

      // clear form
      setSubject("");
      setBody("");
      setEmailsText("");
      setStartTime("");

      // refresh scheduled tab
      setActiveTab("scheduled");
    } catch (err: any) {
      console.error(err);
      setCreateMessage("Failed to schedule emails.");
    } finally {
      setCreating(false);
    }
  };

  const renderTable = () => {
    const data = activeTab === "scheduled" ? scheduled : sent;

    if (loading) {
      return (
        <div className="py-10 text-center text-sm text-slate-400">
          Loading {activeTab} emails...
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-10 text-center text-sm text-red-400">
          {error}
        </div>
      );
    }

    if (!data.length) {
      return (
        <div className="py-10 text-center text-sm text-slate-400">
          No {activeTab} emails yet.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="border-b border-slate-800 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-3 py-2">To</th>
              <th className="px-3 py-2">Subject</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">
                {activeTab === "scheduled" ? "Scheduled At" : "Sent At"}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr
                key={row.id}
                className="border-b border-slate-900/60 last:border-0"
              >
                <td className="px-3 py-2 text-slate-200">{row.to}</td>
                <td className="px-3 py-2 text-slate-300">{row.subject}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      row.status === "SENT"
                        ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400"
                        : row.status === "FAILED"
                        ? "rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400"
                        : "rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400"
                    }
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-400">
                  {activeTab === "scheduled"
                    ? new Date(row.scheduledAt).toLocaleString()
                    : row.sentAt
                    ? new Date(row.sentAt).toLocaleString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-sm font-semibold">
              ES
            </div>
            <div>
              <p className="text-sm font-medium">Email Scheduler</p>
              <p className="text-xs text-slate-400">Google Connected</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {user.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="h-8 w-8 rounded-full border border-slate-700"
                />
              )}
              <div className="text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Compose card */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Compose New Email
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Subject</label>
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Subject line"
              />

              <label className="text-xs text-slate-400">Body</label>
              <textarea
                className="h-28 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Email content"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400">
                Recipient Emails (comma or new line separated)
              </label>
              <textarea
                className="h-20 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={emailsText}
                onChange={e => setEmailsText(e.target.value)}
                placeholder="a@example.com, b@example.com"
              />

              <label className="text-xs text-slate-400">Start Time</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
                onChange={e => setStartTime(e.target.value)}
              />

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-400">
                    Delay between emails (ms)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    value={delayMs}
                    onChange={e => setDelayMs(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-400">Hourly limit</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    value={hourlyLimit}
                    onChange={e => setHourlyLimit(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Emails will be scheduled from the selected time with the given
              delay and hourly limit.
            </p>
            <button
              onClick={handleSchedule}
              disabled={creating}
              className="rounded-lg bg-blue-500 px-4 py-2 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-60"
            >
              {creating ? "Scheduling..." : "Schedule Emails"}
            </button>
          </div>

          {createMessage && (
            <p className="mt-2 text-xs text-slate-300">{createMessage}</p>
          )}
        </section>

        {/* Tabs */}
        <section>
          <div className="mb-3 flex gap-2 border-b border-slate-800">
            <button
              className={
                activeTab === "scheduled"
                  ? "border-b-2 border-blue-500 px-3 py-2 text-xs font-medium"
                  : "px-3 py-2 text-xs text-slate-400"
              }
              onClick={() => setActiveTab("scheduled")}
            >
              Scheduled
            </button>
            <button
              className={
                activeTab === "sent"
                  ? "border-b-2 border-blue-500 px-3 py-2 text-xs font-medium"
                  : "px-3 py-2 text-xs text-slate-400"
              }
              onClick={() => setActiveTab("sent")}
            >
              Sent
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            {renderTable()}
          </div>
        </section>
      </main>
    </div>
  );
}
