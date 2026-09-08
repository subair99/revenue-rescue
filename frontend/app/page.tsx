"use client";

import { useState, useRef, useEffect } from "react";
import { 
  AlertTriangle, 
  CheckCircle, 
  PhoneCall, 
  TrendingUp, 
  Clock,
  Terminal,
  Zap
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

// Mock data
const MOCK_STATS = {
  revenueAtRisk: 4250.00,
  rescuedThisWeek: 1875.50,
  activeRescues: 3,
};

const LEAKAGE_DATA = [
  { name: "Expired Card", value: 40, color: "#ef4444" }, 
  { name: "Insufficient Funds", value: 30, color: "#f59e0b" }, 
  { name: "Never Received Invoice", value: 20, color: "#3b82f6" }, 
  { name: "Disputed", value: 10, color: "#6b7280" }, 
];

const RECENT_ACTIVITY = [
  { id: 1, customer: "Jane Doe", amount: 249.00, status: "Payment Promised", date: "2 mins ago", outcome: "success" },
  { id: 2, customer: "Acme Corp", amount: 1200.00, status: "Escalated to Human", date: "15 mins ago", outcome: "warning" },
  { id: 3, customer: "John Smith", amount: 45.00, status: "Skipped (Below $50)", date: "1 hour ago", outcome: "skipped" },
];

export default function Dashboard() {
  const [isCalling, setIsCalling] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "> System initialized. Monitoring Stripe webhooks...",
    "> Decision Engine active. Quiet hours: 21:00 - 08:00.",
  ]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  const triggerRescue = async () => {
    setIsCalling(true);
    setLogs([]); // Clear logs for fresh run
    
    try {
      addLog("> [Trigger] Incoming webhook: Failed payment ($249.00)");
      await new Promise(r => setTimeout(r, 600));
      
      addLog("> [Decision Engine] Evaluating business rules...");
      await new Promise(r => setTimeout(r, 800));
      
      addLog("> [Decision Engine] Amount > $50? YES. Disputed? NO. Quiet hours? NO.");
      await new Promise(r => setTimeout(r, 600));
      
      addLog("> [Decision Engine] ✅ Proceeding to CALL-E execution.");
      
      const response = await fetch("http://localhost:8000/webhook/revenue-rescue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: "cus_demo_123",
          customer_phone: "+14045639785",
          trigger_id: "evt_demo_999",
          amount: 249.00,
          failure_reason: "expired_card",
          is_disputed: false,
          timestamp: new Date().toISOString(),
        }),
      });
      
      const data = await response.json();
      
      addLog(`> [CALL-E] Call executed. Structured JSON received.`);
      await new Promise(r => setTimeout(r, 500));
      addLog(`> [Result] Outcome: ${data.result.outcome} | Escalation: ${data.result.escalation_required}`);
      addLog(`> [Write-back] CRM updated to "Recovery in Progress".`);
      
      alert(`Rescue Complete! Outcome: ${data.result.outcome}`);
    } catch (error) {
      addLog("> [ERROR] Failed to connect to backend. Is it running?");
      alert("Failed to trigger rescue.");
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
            <Zap className="h-8 w-8 text-blue-600" />
            Revenue Rescue
          </h1>
          <p className="mt-1 text-slate-500">Autonomous, Governed Revenue Recovery Agent</p>
        </div>
        <button
          onClick={triggerRescue}
          disabled={isCalling}
          className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PhoneCall className="h-5 w-5" />
          {isCalling ? "Executing Agent..." : "Trigger Test Rescue"}
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard 
          title="Revenue at Risk" 
          value={`$${MOCK_STATS.revenueAtRisk.toLocaleString()}`} 
          icon={<AlertTriangle className="h-6 w-6 text-red-500" />} 
          trend="-12% from last week"
          trendDown={true}
        />
        <StatCard 
          title="Successfully Rescued" 
          value={`$${MOCK_STATS.rescuedThisWeek.toLocaleString()}`} 
          icon={<CheckCircle className="h-6 w-6 text-green-500" />} 
          trend="+8% from last week"
          trendDown={false}
        />
        <StatCard 
          title="Active Rescues" 
          value={MOCK_STATS.activeRescues.toString()} 
          icon={<Clock className="h-6 w-6 text-blue-500" />} 
          trend="2 pending retry"
          trendDown={false}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Revenue Leakage Intelligence (Pie Chart) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Leakage Intelligence
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={LEAKAGE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {LEAKAGE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            <span className="font-semibold text-slate-700">Insight:</span> 40% of failures are expired cards. Automating the "resend invoice" flow captures this instantly.
          </p>
        </div>

        {/* Recent Activity Feed */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Recent Activity</h2>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {RECENT_ACTIVITY.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">{row.customer}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">${row.amount.toFixed(2)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <StatusBadge status={row.status} outcome={row.outcome} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/*  NEW: Live Agentic Workflow Console */}
      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-2 border-b border-slate-700 pb-3">
          <Terminal className="h-5 w-5 text-green-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Live Agentic Workflow Console
          </h2>
          <span className="ml-auto flex h-2 w-2">
            <span className={`absolute inline-flex h-2 w-2 rounded-full ${isCalling ? 'bg-green-400 opacity-75 animate-ping' : 'bg-slate-600'}`}></span>
            <span className={`relative inline-flex h-2 w-2 rounded-full ${isCalling ? 'bg-green-500' : 'bg-slate-600'}`}></span>
          </span>
        </div>
        <div className="h-48 overflow-y-auto font-mono text-sm text-slate-300">
          {logs.map((log, index) => (
            <div key={index} className="mb-1 break-words">
              {log.startsWith("> [ERROR]") ? (
                <span className="text-red-400">{log}</span>
              ) : log.includes("✅") ? (
                <span className="text-green-400">{log}</span>
              ) : (
                <span>{log}</span>
              )}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

function StatCard({ title, value, icon, trend, trendDown }: { title: string; value: string; icon: React.ReactNode; trend: string; trendDown: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="rounded-full bg-slate-100 p-2">{icon}</div>
      </div>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      <p className={`mt-1 text-sm ${trendDown ? "text-red-600" : "text-green-600"}`}>
        {trend}
      </p>
    </div>
  );
}

function StatusBadge({ status, outcome }: { status: string; outcome: string }) {
  const styles: Record<string, string> = {
    success: "bg-green-100 text-green-800 border border-green-200",
    warning: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    skipped: "bg-slate-100 text-slate-800 border border-slate-200",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[outcome] || "bg-slate-100 text-slate-800"}`}>
      {status}
    </span>
  );
}