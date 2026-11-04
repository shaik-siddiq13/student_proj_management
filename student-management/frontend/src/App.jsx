import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import {
  LayoutDashboard, BarChart3, UserPlus, Users, Settings as SettingsIcon,
  GraduationCap, Layers, ListFilter, RefreshCw, Download, Pencil, Trash2,
  X, Search, SearchX, ArrowUp, ArrowDown
} from "lucide-react";

import "./App.css";
import API from "./api";

const COLORS = [
  "#3977D5", "#20A780", "#F0A33B", "#8B5CF6",
  "#E35D6A", "#06B6D4", "#EC4899", "#64748B"
];

const QUALIFICATIONS = [
  "B.Tech", "M.Tech", "B.Sc", "M.Sc", "BCA", "MCA", "MBA", "Other"
];

const PAGE_SIZE = 8;

const emptyForm = {
  batch_id: "", student_name: "", email: "",
  phone: "", qualification: "", location: ""
};

const simplify = (v) => v.toLowerCase().replace(/[.\s]/g, "");

// Merges "Btech", "b.tech", "B.tech" into "B.Tech"
const normalizeQualification = (value) => {
  const raw = (value || "").trim();
  if (!raw) return "Not specified";
  const match = QUALIFICATIONS.find((q) => simplify(q) === simplify(raw));
  return match || raw;
};

const initials = (name) =>
  (name || "?").trim().split(/\s+/).slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase()).join("");

function AnalyticsCard({ title, data, type, color }) {
  const chartData = data.filter((item) => item.count > 0);
  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="content-card analytics-card">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>Student distribution</p>
        </div>
        <span className="analytics-total">{total} students</span>
      </div>

      {chartData.length === 0 ? (
        <div className="no-chart-data">No data available.</div>
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            {type === "pie" ? (
              <PieChart>
                <Pie
                  data={chartData} dataKey="count" nameKey="name"
                  cx="50%" cy="44%" innerRadius={62} outerRadius={98}
                  paddingAngle={4} cornerRadius={5} stroke="none"
                >
                  {chartData.map((item, index) => (
                    <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} students`, name]} />
                <Legend
                  verticalAlign="bottom" iconType="circle"
                  wrapperStyle={{ fontSize: "12px", paddingTop: "15px" }}
                />
              </PieChart>
            ) : (
              <BarChart
                data={chartData} layout="vertical"
                margin={{ top: 8, right: 25, left: 12, bottom: 8 }}
                barCategoryGap="25%"
              >
                <CartesianGrid stroke="#e9eef5" horizontal={false} />
                <XAxis
                  type="number" allowDecimals={false}
                  axisLine={false} tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  type="category" dataKey="name" width={105}
                  axisLine={false} tickLine={false}
                  tick={{ fill: "#334155", fontSize: 12 }}
                />
                <Tooltip formatter={(value) => [`${value} students`, "Students"]} />
                <Bar
                  dataKey="count" name="Students" fill={color}
                  radius={[0, 8, 8, 0]} barSize={20}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function App() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [page, setPage] = useState(1);
  const [qualFilter, setQualFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sort, setSort] = useState({ key: "student_id", dir: "asc" });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );
  const [showStats, setShowStats] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(true);

  useEffect(() => { loadInitialData(); }, []);

  useEffect(() => {
    try { localStorage.setItem("darkMode", String(darkMode)); } catch { /* ignore */ }
  }, [darkMode]);

  // Messages disappear by themselves
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 7000);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => { setPage(1); }, [searchTerm, batchFilter, qualFilter, locationFilter]);

  // Escape closes any open popup
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { setDeleteTarget(null); setSelectedStudent(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError("");
    try {
      const [studentResponse, batchResponse] = await Promise.all([
        API.get("/students"),
        API.get("/batches")
      ]);
      setStudents(studentResponse.data);
      setBatches(batchResponse.data);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Unable to load data. Please check your backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    const response = await API.get("/students");
    setStudents(response.data);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const studentData = { ...formData, batch_id: Number(formData.batch_id) };

    try {
      if (editingId !== null) {
        await API.put(`/students/${editingId}`, studentData);
        setNotice("Student details updated.");
      } else {
        await API.post("/students", studentData);
        setNotice("Student added.");
      }
      resetForm();
      await fetchStudents();
    } catch (err) {
      console.error("Error saving student:", err);
      const message = err.response?.data?.detail;
      setError(
        typeof message === "string"
          ? message
          : "Unable to save student details. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (student) => {
    setEditingId(student.student_id);
    setFormData({
      batch_id: String(student.batch_id ?? ""),
      student_name: student.student_name || "",
      email: student.email || "",
      phone: student.phone || "",
      qualification: student.qualification
        ? normalizeQualification(student.qualification)
        : "",
      location: student.location || ""
    });
    setError("");
    setNotice("");
    navigateTo("student-form");
  };

  const handleDelete = async (student) => {
    setDeleteTarget(null);
    setDeletingId(student.student_id);
    setError("");
    setNotice("");

    try {
      await API.delete(`/students/${student.student_id}`);
      setNotice("Student deleted.");
      if (editingId === student.student_id) resetForm();
      await fetchStudents();
    } catch (err) {
      console.error("Error deleting student:", err);
      setError(
        err.response?.data?.detail || "Unable to delete student. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getBatchName = (batchId) => {
    const batch = batches.find((item) => String(item.batch_id) === String(batchId));
    return batch ? batch.batch_name : batchId ? `Batch ${batchId}` : "No batch";
  };

  const navigateTo = (section) => {
    setActiveSection(section);
    if (section === "student-form" && editingId === null) setFormData(emptyForm);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (section !== "settings") {
      setTimeout(() => {
        document.getElementById(section)?.scrollIntoView({
          behavior: "smooth", block: "start"
        });
      }, 100);
    }
  };

  const filteredStudents = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    return students.filter((student) => {
      const matchesSearch =
        !search ||
        String(student.student_id).includes(search) ||
        (student.student_name || "").toLowerCase().includes(search) ||
        (student.email || "").toLowerCase().includes(search) ||
        (student.location || "").toLowerCase().includes(search);
      const matchesBatch = !batchFilter || String(student.batch_id) === batchFilter;
      const matchesQual =
        !qualFilter || normalizeQualification(student.qualification) === qualFilter;
      const matchesLoc =
        !locationFilter || (student.location || "").trim() === locationFilter;
      return matchesSearch && matchesBatch && matchesQual && matchesLoc;
    }).sort((a, b) => {
      const val = (st) =>
        sort.key === "batch" ? getBatchName(st.batch_id)
        : sort.key === "qualification" ? normalizeQualification(st.qualification)
        : st[sort.key];
      const x = val(a) ?? "";
      const y = val(b) ?? "";
      const cmp = typeof x === "number" && typeof y === "number"
        ? x - y
        : String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: "base" });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [students, batches, searchTerm, batchFilter, qualFilter, locationFilter, sort]);

  const locationOptions = useMemo(
    () => [...new Set(students.map((s) => (s.location || "").trim()).filter(Boolean))].sort(),
    [students]
  );

  const toggleSort = (key) =>
    setSort((p) => p.key === key
      ? { key, dir: p.dir === "asc" ? "desc" : "asc" }
      : { key, dir: "asc" });

  const sortHead = (key, label) => (
    <th aria-sort={sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button className="sort-button" onClick={() => toggleSort(key)}>
        {label}
        {sort.key === key && (sort.dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </button>
    </th>
  );

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedStudents = filteredStudents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const exportCSV = () => {
    const header = ["ID", "Name", "Email", "Phone", "Batch", "Qualification", "Location"];
    const rows = filteredStudents.map((s) => [
      s.student_id, s.student_name, s.email, s.phone,
      getBatchName(s.batch_id), s.qualification, s.location
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "students.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const studentsByBatch = useMemo(() => {
    const list = batches.map((batch) => ({
      name: batch.batch_name,
      count: students.filter(
        (s) => String(s.batch_id) === String(batch.batch_id)
      ).length
    }));
    const unassigned = students.filter(
      (s) => !batches.some((b) => String(b.batch_id) === String(s.batch_id))
    ).length;
    return unassigned > 0 ? [...list, { name: "No batch", count: unassigned }] : list;
  }, [students, batches]);

  const studentsByQualification = useMemo(() => {
    const counts = {};
    students.forEach((s) => {
      const name = normalizeQualification(s.qualification);
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [students]);

  const studentsByLocation = useMemo(() => {
    const counts = {};
    students.forEach((s) => {
      const name = s.location?.trim() || "Not specified";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [students]);

  const navItems = [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["analytics", "Analytics", BarChart3],
    ["student-form", "Add Student", UserPlus],
    ["student-records", "Student Records", Users]
  ];

  const qualificationOptions = [
    ...QUALIFICATIONS,
    ...(formData.qualification && !QUALIFICATIONS.includes(formData.qualification)
      ? [formData.qualification] : [])
  ];

  return (
    <div className={`app-container ${darkMode ? "dark-mode" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon"><GraduationCap size={22} /></div>
          <div>
            <h2>Student Portal</h2>
            <p>Management System</p>
          </div>
        </div>

        <nav className="sidebar-menu">
          <p className="sidebar-label">Main menu</p>
          {navItems.map(([id, label, Icon]) => (
            <button
              key={id}
              className={activeSection === id ? "nav-item active" : "nav-item"}
              onClick={() => navigateTo(id)}
            >
              <Icon size={18} /> {label}
            </button>
          ))}

          <p className="sidebar-label secondary-label">Preferences</p>
          <button
            className={activeSection === "settings" ? "nav-item active" : "nav-item"}
            onClick={() => navigateTo("settings")}
          >
            <SettingsIcon size={18} /> Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-icon"><GraduationCap size={18} /></div>
          <div>
            <strong>Student Records</strong>
            <span>Batches &amp; analytics</span>
          </div>
        </div>
      </aside>

      <div className="dashboard-content">
        <header className="header">
          <div>
            <h1>{activeSection === "settings" ? "Settings" : "Student Management System"}</h1>
            <p>
              {activeSection === "settings"
                ? "Customize your application preferences"
                : "Manage and track student information"}
            </p>
          </div>

          {activeSection !== "settings" && (
            <button className="refresh-button" onClick={loadInitialData} disabled={loading}>
              <RefreshCw size={15} className={loading ? "spin" : ""} />
              {loading ? "Refreshing..." : "Refresh data"}
            </button>
          )}
        </header>

        <main className="main-content">
          <div className="toast-stack">
            {error && (
              <div className="alert error-alert" role="alert">
                <span>{error}</span>
                <button onClick={() => setError("")} aria-label="Dismiss"><X size={16} /></button>
              </div>
            )}
            {notice && (
              <div className="alert success-alert" role="status">
                <span>{notice}</span>
                <button onClick={() => setNotice("")} aria-label="Dismiss"><X size={16} /></button>
              </div>
            )}
          </div>

          {activeSection !== "settings" && (
            <>
              {showStats && (
                <section className="stats-grid" id="dashboard">
                  <div className="stat-card">
                    <div className="stat-icon blue"><Users size={22} /></div>
                    <div><p>Total students</p><h2>{students.length}</h2></div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon purple"><Layers size={22} /></div>
                    <div><p>Total batches</p><h2>{batches.length}</h2></div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon green"><ListFilter size={22} /></div>
                    <div><p>Displayed students</p><h2>{filteredStudents.length}</h2></div>
                  </div>
                </section>
              )}
              {!showStats && <div id="dashboard" />}

              {showAnalytics && (
                <section className="analytics-section" id="analytics">
                  <div className="section-heading">
                    <div>
                      <h2>Dashboard analytics</h2>
                      <p>Insights into student distribution and demographics</p>
                    </div>
                  </div>
                  <div className="analytics-grid">
                    <AnalyticsCard title="Students by batch" data={studentsByBatch} type="pie" color="#3977D5" />
                    <AnalyticsCard title="Students by qualification" data={studentsByQualification} type="bar" color="#8B5CF6" />
                    <AnalyticsCard title="Students by location" data={studentsByLocation} type="bar" color="#20A780" />
                  </div>
                </section>
              )}
              {!showAnalytics && <div id="analytics" />}

              <section className="content-card" id="student-form">
                <div className="section-heading">
                  <div>
                    <h2>{editingId !== null ? "Edit student" : "Add new student"}</h2>
                    <p>
                      {editingId !== null
                        ? `Updating student ID: ${editingId}`
                        : "Enter the student information below"}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="student-form">
                  <div className="form-group">
                    <label htmlFor="batch_id">Batch *</label>
                    <select id="batch_id" name="batch_id" value={formData.batch_id} onChange={handleChange} required>
                      <option value="">Select batch</option>
                      {batches.map((batch) => (
                        <option key={batch.batch_id} value={batch.batch_id}>{batch.batch_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="student_name">Student name *</label>
                    <input id="student_name" name="student_name" value={formData.student_name}
                      onChange={handleChange} placeholder="Enter student name" maxLength={100} required />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email address *</label>
                    <input id="email" type="email" name="email" value={formData.email}
                      onChange={handleChange} placeholder="name@example.com" maxLength={150} required />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone number *</label>
                    <input id="phone" type="tel" name="phone" value={formData.phone}
                      onChange={handleChange} placeholder="10-digit number" maxLength={15}
                      pattern="[0-9]{10,15}" title="Enter 10 to 15 digits" required />
                  </div>

                  <div className="form-group">
                    <label htmlFor="qualification">Qualification *</label>
                    <select id="qualification" name="qualification" value={formData.qualification}
                      onChange={handleChange} required>
                      <option value="">Select qualification</option>
                      {qualificationOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">Location *</label>
                    <input id="location" name="location" value={formData.location}
                      onChange={handleChange} placeholder="Enter city" maxLength={100} required />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="primary-button" disabled={saving}>
                      {saving ? "Please wait..." : editingId !== null ? "Update student" : "Add student"}
                    </button>
                    <button type="button" className="secondary-button" onClick={resetForm}>
                      {editingId !== null ? "Cancel edit" : "Clear form"}
                    </button>
                  </div>
                </form>
              </section>

              <section className="content-card" id="student-records">
                <div className="section-heading">
                  <div>
                    <h2>Student records</h2>
                    <p>View, search, filter and manage student details</p>
                  </div>
                </div>

                <div className="toolbar">
                  <div className="search-box">
                    <Search size={16} />
                    <input type="search" placeholder="Search by name, email, location or ID"
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>

                  <div className="filter-box">
                    <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
                      <option value="">All batches</option>
                      {batches.map((batch) => (
                        <option key={batch.batch_id} value={batch.batch_id}>{batch.batch_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-box">
                    <select value={qualFilter} onChange={(e) => setQualFilter(e.target.value)}>
                      <option value="">All qualifications</option>
                      {QUALIFICATIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                    </select>
                  </div>

                  <div className="filter-box">
                    <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                      <option value="">All locations</option>
                      {locationOptions.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  <button className="clear-filter-button" onClick={() => {
                    setSearchTerm(""); setBatchFilter(""); setQualFilter(""); setLocationFilter("");
                  }}>
                    Clear filters
                  </button>
                  <button className="clear-filter-button" onClick={exportCSV} disabled={filteredStudents.length === 0}>
                    <Download size={15} /> Export CSV
                  </button>
                </div>

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        {sortHead("student_id", "ID")}{sortHead("student_name", "Student")}
                        {sortHead("email", "Email")}<th>Phone</th>
                        {sortHead("batch", "Batch")}{sortHead("qualification", "Qualification")}
                        {sortHead("location", "Location")}<th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i}>
                            <td colSpan="8"><div className="skeleton" /></td>
                          </tr>
                        ))
                      ) : filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="table-message">
                            <SearchX size={28} />
                            <strong>No students found</strong>
                            <span>Try a different search, or add a new student above.</span>
                          </td>
                        </tr>
                      ) : (
                        pagedStudents.map((student) => (
                          <tr key={student.student_id}>
                            <td>{student.student_id}</td>
                            <td>
                              <div className="name-cell">
                                <span className="avatar">{initials(student.student_name)}</span>
                                <button className="profile-link" onClick={() => setSelectedStudent(student)}>
                                  {student.student_name}
                                </button>
                              </div>
                            </td>
                            <td>{student.email}</td>
                            <td>{student.phone}</td>
                            <td><span className="batch-badge">{getBatchName(student.batch_id)}</span></td>
                            <td>{normalizeQualification(student.qualification) === "Not specified" ? "—" : normalizeQualification(student.qualification)}</td>
                            <td>{student.location}</td>
                            <td>
                              <div className="action-buttons">
                                <button className="edit-button" onClick={() => handleEdit(student)}>
                                  <Pencil size={14} /> Edit
                                </button>
                                <button className="delete-button" onClick={() => setDeleteTarget(student)}
                                  disabled={deletingId === student.student_id}>
                                  <Trash2 size={14} />
                                  {deletingId === student.student_id ? "Deleting..." : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="table-footer">
                  <span>Showing {pagedStudents.length} of {filteredStudents.length} students</span>
                  <div className="pagination">
                    <button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</button>
                  </div>
                </div>
              </section>

              <footer className="footer">Student Management System</footer>
            </>
          )}

          {activeSection === "settings" && (
            <section className="content-card settings-section" id="settings">
              <div className="section-heading">
                <div>
                  <h2>Settings</h2>
                  <p>Customize your dashboard appearance and display</p>
                </div>
              </div>

              <div className="settings-group">
                {[
                  ["Dark mode", "Switch between light and dark themes.", darkMode, setDarkMode],
                  ["Show dashboard statistics", "Display total students, batches and filtered count.", showStats, setShowStats],
                  ["Show dashboard analytics", "Display batch, qualification and location charts.", showAnalytics, setShowAnalytics]
                ].map(([title, text, value, setter]) => (
                  <div className="settings-item" key={title}>
                    <div><h3>{title}</h3><p>{text}</p></div>
                    <label className="settings-toggle">
                      <input type="checkbox" checked={value} onChange={(e) => setter(e.target.checked)} />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                ))}
              </div>

              <div className="application-info">
                <h3>Application information</h3>
                <p className="application-description">
                  A web application for managing student records, batches and student distribution analytics.
                </p>
                <div className="application-info-grid">
                  {[
                    ["Frontend", "React.js"], ["Build tool", "Vite"],
                    ["Backend", "Python, FastAPI"], ["Database", "Supabase (PostgreSQL)"],
                    ["Database toolkit", "SQLAlchemy"], ["Charts", "Recharts"],
                    ["API communication", "Axios"]
                  ].map(([label, value]) => (
                    <div key={label}><span>{label}</span><strong>{value}</strong></div>
                  ))}
                </div>
              </div>

              <footer className="footer">Student Management System</footer>
            </section>
          )}
        </main>
      </div>

      {deleteTarget && (
        <div className="profile-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="profile-modal confirm-modal" role="alertdialog" aria-modal="true"
            onClick={(e) => e.stopPropagation()}>
            <h2>Delete student?</h2>
            <p>
              This permanently removes <strong>{deleteTarget.student_name}</strong> from
              the database. This cannot be undone.
            </p>
            <div className="confirm-actions">
              <button className="secondary-button" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="danger-button" onClick={() => handleDelete(deleteTarget)}>Delete student</button>
            </div>
          </div>
        </div>
      )}

      {selectedStudent && (
        <div className="profile-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="profile-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="profile-header">
              <div>
                <h2>Student profile</h2>
                <p>Student ID: {selectedStudent.student_id}</p>
              </div>
              <button className="profile-close-button" onClick={() => setSelectedStudent(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="profile-summary">
              <div className="profile-avatar">{initials(selectedStudent.student_name)}</div>
              <h3>{selectedStudent.student_name}</h3>
              <p>{getBatchName(selectedStudent.batch_id)}</p>
            </div>

            <div className="profile-details">
              {[
                ["Student ID", selectedStudent.student_id],
                ["Email address", selectedStudent.email],
                ["Phone number", selectedStudent.phone],
                ["Batch", getBatchName(selectedStudent.batch_id)],
                ["Qualification", normalizeQualification(selectedStudent.qualification)],
                ["Location", selectedStudent.location]
              ].map(([label, value]) => (
                <div className="profile-detail" key={label}>
                  <span>{label}</span>
                  <strong>{value || "Not available"}</strong>
                </div>
              ))}
            </div>

            <button className="profile-done-button" onClick={() => setSelectedStudent(null)}>
              Close profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;