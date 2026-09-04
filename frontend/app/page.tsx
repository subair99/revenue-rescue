"use client";

import { useState } from "react";
import { 
  AlertTriangle, 
  CheckCircle, 
  PhoneCall, 
  TrendingUp, 
  Clock 
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

// Mock data representing what your backend would feed the dashboard
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

  // Simulate triggering a rescue call
  const triggerRescue = async () => {
    setIsCalling(true);
    try {
      const response = await fetch("http://localhost:8000/webhook/revenue-rescue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: "cus_demo_123",
          customer_phone: "+15559876543",
          trigger_id: "evt_demo_999",
          amount: 249.00,
          failure_reason: "expired_card",
          is_disputed: false,
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await response.json();
      console.log("Rescue triggered:", data);
      alert(`Rescue Complete! Outcome: ${data.result.outcome}`);
    } catch (error) {
      console.error("Failed to trigger rescue:", error);
      alert("Failed to trigger rescue. Is the backend running?");
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Rescue</h1>
          <p className="text-gray-500">Autonomous, Governed Revenue Recovery Agent</p>
        </div>
        <button
          onClick={triggerRescue}
          disabled={isCalling}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-50"
        >
          <PhoneCall className="h-5 w-5" />
          {isCalling ? "Executing CALL-E..." : "Trigger Test Rescue"}
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
        <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-1">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Revenue Leakage Intelligence
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
          <p className="mt-4 text-sm text-gray-500">
            Actionable insight: 40% of failures are expired cards. Automating the "resend invoice" flow captures this instantly.
          </p>
        </div>

        {/* Recent Activity Feed */}
        <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Recent Activity</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {RECENT_ACTIVITY.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{row.customer}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">${row.amount.toFixed(2)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <StatusBadge status={row.status} outcome={row.outcome} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

function StatCard({ title, value, icon, trend, trendDown }: { title: string; value: string; icon: React.ReactNode; trend: string; trendDown: boolean }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="rounded-full bg-gray-100 p-2">{icon}</div>
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      <p className={`mt-1 text-sm ${trendDown ? "text-red-600" : "text-green-600"}`}>
        {trend}
      </p>
    </div>
  );
}

function StatusBadge({ status, outcome }: { status: string; outcome: string }) {
  const styles: Record<string, string> = {
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    skipped: "bg-gray-100 text-gray-800",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[outcome] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}