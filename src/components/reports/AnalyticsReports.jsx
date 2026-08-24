import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/auth/AuthProvider";
import toast from "react-hot-toast";

export default function AnalyticsReports() {
  const { auth } = useAuth();
  // Previously fell back to localStorage.getItem("role")/("username"), keys
  // nothing in the app ever wrote, then to hardcoded "teacher"/"user" —
  // meaning this always silently used those fallbacks. Now reads only from
  // the real auth context.
  const role = auth?.role;
  const username = auth?.username;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    districtId: "",
    teacherId: "",
    studentId: "",
    startDate: "",
    endDate: "",
  });

  // Auto-fill known IDs from username/role if applicable
  useEffect(() => {
    const preset = { ...filters };
    if (role === "district") preset.districtId = username;
    if (role === "teacher") preset.teacherId = username;
    if (role === "student") preset.studentId = username;
    setFilters(preset);
  }, [role, username]);

  useEffect(() => {
    loadData();
  }, [role]);

  async function loadData() {
    try {
      setLoading(true);

      const params = new URLSearchParams({ role });
      if (filters.districtId) params.append("districtId", filters.districtId);
      if (filters.teacherId) params.append("teacherId", filters.teacherId);
      if (filters.studentId) params.append("studentId", filters.studentId);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const res = await fetch(`/api/reports/dashboard?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load analytics data");

      const body = await res.json();
      setData(body);
    } catch (err) {
      console.error(err);
      toast.error("Analytics load failed — using mock data");
      setData(mockAnalytics(role));
    } finally {
      setLoading(false);
    }
  }

  const COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6"];
  const summary = data?.summary || {};
  const charts = data?.charts || {};
  const table = data?.table || [];

  if (loading) return <Spinner />;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Analytics & Reports Dashboard</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 bg-gray-50 border p-3 rounded-md">
        {role === "admin" && (
          <Input
            placeholder="District ID"
            value={filters.districtId}
            onChange={(e) =>
              setFilters((f) => ({ ...f, districtId: e.target.value }))
            }
          />
        )}
        {["admin", "district"].includes(role) && (
          <Input
            placeholder="Teacher ID"
            value={filters.teacherId}
            onChange={(e) =>
              setFilters((f) => ({ ...f, teacherId: e.target.value }))
            }
          />
        )}
        {["teacher"].includes(role) && (
          <Input
            placeholder="Student ID"
            value={filters.studentId}
            onChange={(e) =>
              setFilters((f) => ({ ...f, studentId: e.target.value }))
            }
          />
        )}
        <Input
          type="date"
          value={filters.startDate}
          onChange={(e) =>
            setFilters((f) => ({ ...f, startDate: e.target.value }))
          }
        />
        <Input
          type="date"
          value={filters.endDate}
          onChange={(e) =>
            setFilters((f) => ({ ...f, endDate: e.target.value }))
          }
        />
        <Button onClick={loadData}>Generate Report</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(summary).map(([k, v]) => (
          <Card key={k} className="text-center shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm capitalize">{k}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{v}</CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.performance}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#3B82F6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Competency Mastery</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {/* <BarChart data={charts.mastery}>
                <XAxis dataKey="competency" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#22C55E" />
              </BarChart> */}
              <RadarChart
                outerRadius="80%"
                data={charts.mastery}
              >
                <PolarGrid />
                <PolarAngleAxis dataKey="competency" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Student1"
                  dataKey="score"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.4}
                />
                {/* <Legend /> */}
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {["admin", "district", "teacher"].includes(role) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Evidence Model Coverage</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.evidence}
                    dataKey="value"
                    nameKey="label"
                    outerRadius={100}
                    label
                  >
                    {charts.evidence?.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Report</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse border">
            <thead className="bg-gray-100">
              <tr>
                {Object.keys(table[0] || {}).map((col) => (
                  <th key={col} className="border p-2 text-left">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="border p-2">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// 🧩 Fallback mock data (for offline dev)
function mockAnalytics(role) {
  const now = new Date();
  const days = Array.from({ length: 10 }, (_, i) => {
    const d = new Date(now - i * 86400000);
    return d.toISOString().slice(0, 10);
  }).reverse();

  return {
    summary: {
      sessions: role === "student" ? 8 : 120,
      averageScore: role === "student" ? 78 : 64,
      masteryRate: role === "student" ? "85%" : "72%",
      activeStudents: role === "teacher" ? 24 : 320,
    },
    charts: {
      performance: days.map((d, i) => ({
        date: d,
        average: 60 + Math.sin(i / 2) * 10 + Math.random() * 5,
      })),
      mastery: [
        { competency: "தமிழ்", score: 65 },
        { competency: "English", score: 51 },
        { competency: "Mathematics", score: 85 },
        { competency: "Science", score: 78 },
        { competency: "Social Science", score: 44 },
        { competency: "Physical Education", score: 100 },
      ],
      evidence: [
        { label: "Selected Response", value: 40 },
        { label: "Constructed Response", value: 25 },
        { label: "Performance Tasks", value: 20 },
        { label: "Rubric-based", value: 15 },
      ],
    },
    table: [
      { name: "Session A", score: 78, tasks: 10, date: "2025-09-20" },
      { name: "Session B", score: 82, tasks: 12, date: "2025-09-21" },
      { name: "Session C", score: 70, tasks: 9, date: "2025-09-22" },
    ],
  };
}
