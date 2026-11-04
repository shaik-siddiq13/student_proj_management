import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import {
  LayoutDashboard, BarChart3, UserPlus, Users, Settings as SettingsIcon,
  GraduationCap, Layers, Eye, RefreshCw, Search, Download, X, Pencil,
  Trash2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown,
  CheckCircle2, AlertCircle, Menu, Inbox
} from "lucide-react";

import "./App.css";
import API from "./api";

const COLORS = [
  "#1F8A6B", "#3977D5", "#F0A33B", "#8B5CF6",
  "#E35D6A", "#06B6D4", "#EC4899", "#64748B"
];

const QUALIFICATIONS = [
  "B.Tech", "M.Tech", "B.Sc", "M.Sc", "BCA", "MCA", "MBA", "Other"
];

const PAGE_SIZE = 8;

const emptyForm = {
  batch_id: "",
  student_name: "",
  email: "",
  phone: "",
  qualification: "",
  location: ""
};

const normalizeQualification = (value) => {
  const raw = (value || "").trim();
  if (!raw) return "Not specified";
  const key = raw.toLowerCase().replace(/[.\s]/g, "");
  const match = QUALIFICATIONS.find(
    (option) => option.toLowerCase().replace(/[.\s]/g, "") === key
  );
  return match || raw;
};

const initialsOf = (name) =>
  (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const avatarColor = (id) => COLORS[Math.abs(Number(id) || 0) % COLORS.length];

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
        <div className="no-chart-data">No data available yet.</div>
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            {type === "pie" ? (
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="44%"
                  innerRadius={62}
                  outerRadius={98}
                  paddingAngle={4}
                  cornerRadius={5}
                  stroke="none"
                >
                  {chartData.map((item, index) => (
                    <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} students`, name]} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", paddingTop: "15px" }}
                />
              </PieChart>
            ) : (
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 8, right: 25, left: 12, bottom: 8 }}
                barCategoryGap="25%"
              >
                <CartesianGrid stroke="#e9eef5" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={105}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip formatter={(value) => [`${value} students`, "Students"]} />
                <Bar
                  dataKey="count"
                  name="Students"
                  fill={color}
                  radius={[0, 8, 8, 0]}
                  barSize={20}
                  label={{ position: "right", fill: "#64748b", fontSize: 12 }}
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
  const [qualFilter, setQualFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const [sortKey, setSortKey] = useState("student_id");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );
  const [showStats, setShowStats] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("darkMode", String(darkMode));
    } catch {
      /* ignore storage errors */
    }
  }, [darkMode]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, batchFilter, qualFilter, sortKey, sortDir]);

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
      setError("Unable to load data. Check that the backend is running and try again.");
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
        setNotice("Student updated.");
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
          : "Could not save the student. Check the details and try again."
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
    const confirmed = window.confirm(
      `Delete ${student.student_name}? This cannot be undone.`
    );
    if (!confirmed) return;

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
        err.response?.data?.detail ||
          "Could not delete the student. Try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getBatchName = (batchId) => {
    const batch = batches.find(
      (item) => String(item.batch_id) === String(batchId)
    );
    return batch ? batch.batch_name : "No batch";
  };

  const navigateTo = (section) => {
    setActiveSection(section);
    setMenuOpen(false);

    if (section === "student-form" && editingId === null) {
      setFormData(emptyForm);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (section !== "settings") {
      setTimeout(() => {
        document
          .getElementById(section)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const qualificationOptions = useMemo(() => {
    const set = new Set(QUALIFICATIONS);
    students.forEach((s) => {
      if (s.qualification) set.add(normalizeQualification(s.qualification));
    });
    return [...set];
  }, [students]);

  const filteredStudents = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    const list = students.filter((student) => {
      const matchesSearch =
        !search ||
        String(student.student_id).includes(search) ||
        (student.student_name || "").toLowerCase().includes(search) ||
        (student.email || "").toLowerCase().includes(search) ||
        (student.location || "").toLowerCase().includes(search);

      const matchesBatch =
        !batchFilter || String(student.batch_id) === batchFilter;

      const matchesQual =
        !qualFilter ||
        normalizeQualification(student.qualification) === qualFilter;

      return matchesSearch && matchesBatch && matchesQual;
    });

    const valueOf = (student) => {
      if (sortKey === "batch_id") return getBatchName(student.batch_id).toLowerCase();
      if (sortKey === "student_id") return Number(student.student_id);
      return String(student[sortKey] || "").toLowerCase();
    };

    return [...list].sort((a, b) => {
      const x = valueOf(a);
      const y = valueOf(b);
      if (x < y) return sortDir === "asc" ? -1 : 1;
      if (x > y) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, batches, searchTerm, batchFilter, qualFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedStudents = filteredStudents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const studentsByBatch = useMemo(() => {
    const list = batches.map((batch) => ({
      name: batch.batch_name,
      count: students.filter(
        (student) => String(student.batch_id) === String(batch.batch_id)
      ).length
    }));

    const unassigned = students.filter(
      (student) =>
        !batches.some((b) => String(b.batch_id) === String(student.batch_id))
    ).length;

    return unassigned > 0 ? [...list, { name: "No batch", count: unassigned }] : list;
  }, [students, batches]);

  const countBy = (getName) => {
    const counts = {};
    students.forEach((student) => {
      const name = getName(student);
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  };

  const studentsByQualification = useMemo(
    () => countBy((s) => normalizeQualification(s.qualification)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [students]
  );

  const studentsByLocation = useMemo(
    () =>
      countBy((s) => {
        const raw = s.location?.trim();
        if (!raw) return "Not specified";
        return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [students]
  );

  const exportCSV = () => {
    const header = ["ID", "Name", "Email", "Phone", "Batch", "Qualification", "Location"];
    const rows = filteredStudents.map((s) => [
      s.student_id, s.student_name, s.email, s.phone,
      getBatchName(s.batch_id), normalizeQualification(s.qualification), s.location
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "students.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setBatchFilter("");
    setQualFilter("");
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "student-form", label: "Add Student", icon: UserPlus },
    { id: "student-records", label: "Student Records", icon: Users }
  ];

  const SortHeader = ({ label, field }) => {
    const Icon =
      sortKey !== field ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
    return (
      <th>
        <button className="sort-button" onClick={() => handleSort(field)}>
          {label} <Icon size={13} />
        </button>
      </th>
    );
  };

  const qualificationChoices = [
    ...QUALIFICATIONS,
    ...(formData.qualification && !QUALIFICATIONS.includes(formData.qualification)
      ? [formData.qualification]
      : [])
  ];

  return (
    <div className={`app-container ${darkMode ? "dark-mode" : ""}`}>
      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-icon"><GraduationCap size={20} /></div>
          <div>
            <h2>Student Portal</h2>
            <p>Management System</p>
          </div>
        </div>

        <nav className="sidebar-menu">
          <p className="sidebar-label">Main menu</p>

          {navItems.map(({ id, label, icon: Icon }) => (
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
          <div className="sidebar-footer-icon">A</div>
          <div>
            <strong>Admin</strong>
            <span>Dashboard access</span>
          </div>
        </div>
      </aside>

      <div className="dashboard-content">
        <header className="header">
          <button
            className="menu-button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="header-text">
            <h1>{activeSection === "settings" ? "Settings" : "Student Management"}</h1>
            <p>
              {activeSection === "settings"
                ? "Customize how the dashboard looks"
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
          <div className="toast-area" aria-live="polite">
            {error && (
              <div className="toast error-toast">
                <AlertCircle size={18} />
                <span>{error}</span>
                <button aria-label="Dismiss" onClick={() => setError("")}><X size={16} /></button>
              </div>
            )}
            {notice && (
              <div className="toast success-toast">
                <CheckCircle2 size={18} />
                <span>{notice}</span>
                <button aria-label="Dismiss" onClick={() => setNotice("")}><X size={16} /></button>
              </div>
            )}
          </div>

          {activeSection !== "settings" && (
            <>
              {showStats ? (
                <section className="stats-grid" id="dashboard">
                  <div className="stat-card">
                    <div className="stat-icon blue"><Users size={22} /></div>
                    <div>
                      <p>Total students</p>
                      <h2>{students.length}</h2>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon purple"><Layers size={22} /></div>
                    <div>
                      <p>Total batches</p>
                      <h2>{batches.length}</h2>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon green"><Eye size={22} /></div>
                    <div>
                      <p>Displayed students</p>
                      <h2>{filteredStudents.length}</h2>
                    </div>
                  </div>
                </section>
              ) : (
                <div id="dashboard" />
              )}

              {showAnalytics ? (
                <section className="analytics-section" id="analytics">
                  <div className="section-heading plain">
                    <div>
                      <h2>Analytics</h2>
                      <p>Student distribution by batch, qualification and location</p>
                    </div>
                  </div>

                  <div className="analytics-grid">
                    <AnalyticsCard title="Students by batch" data={studentsByBatch} type="pie" color="#1F8A6B" />
                    <AnalyticsCard title="Students by qualification" data={studentsByQualification} type="bar" color="#8B5CF6" />
                    <AnalyticsCard title="Students by location" data={studentsByLocation} type="bar" color="#3977D5" />
                  </div>
                </section>
              ) : (
                <div id="analytics" />
              )}

              {/* Add / Edit Student */}
              <section className="content-card" id="student-form">
                <div className="section-heading">
                  <div>
                    <h2>{editingId !== null ? "Edit student" : "Add new student"}</h2>
                    <p>
                      {editingId !== null
                        ? `Updating student ID ${editingId}`
                        : "Enter the student's information below"}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="student-form">
                  <div className="form-group">
                    <label htmlFor="batch_id">Batch *</label>
                    <select id="batch_id" name="batch_id" value={formData.batch_id} onChange={handleChange} required>
                      <option value="">Select batch</option>
                      {batches.map((batch) => (
                        <option key={batch.batch_id} value={batch.batch_id}>
                          {batch.batch_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="student_name">Student name *</label>
                    <input id="student_name" name="student_name" value={formData.student_name}
                      onChange={handleChange} placeholder="Full name" maxLength={100} required />
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
                      pattern="[0-9]{10}" title="Enter a 10-digit phone number" required />
                  </div>

                  <div className="form-group">
                    <label htmlFor="qualification">Qualification *</label>
                    <select id="qualification" name="qualification" value={formData.qualification}
                      onChange={handleChange} required>
                      <option value="">Select qualification</option>
                      {qualificationChoices.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">Location *</label>
                    <input id="location" name="location" value={formData.location}
                      onChange={handleChange} placeholder="City" maxLength={100} required />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="primary-button" disabled={saving}>
                      {saving ? "Saving..." : editingId !== null ? "Save changes" : "Add student"}
                    </button>
                    <button type="button" className="secondary-button" onClick={resetForm}>
                      {editingId !== null ? "Cancel edit" : "Clear form"}
                    </button>
                  </div>
                </form>
              </section>

              {/* Student Records */}
              <section className="content-card" id="student-records">
                <div className="section-heading">
                  <div>
                    <h2>Student records</h2>
                    <p>Search, filter, sort and manage student details</p>
                  </div>
                  <button className="secondary-button compact" onClick={exportCSV}
                    disabled={filteredStudents.length === 0}>
                    <Download size={15} /> Export CSV
                  </button>
                </div>

                <div className="toolbar">
                  <div className="search-box">
                    <Search size={16} />
                    <input type="search" placeholder="Search by name, email, location or ID"
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>

                  <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
                    <option value="">All batches</option>
                    {batches.map((batch) => (
                      <option key={batch.batch_id} value={batch.batch_id}>{batch.batch_name}</option>
                    ))}
                  </select>

                  <select value={qualFilter} onChange={(e) => setQualFilter(e.target.value)}>
                    <option value="">All qualifications</option>
                    {qualificationOptions.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>

                  <button className="clear-filter-button" onClick={clearFilters}>Clear filters</button>
                </div>

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <SortHeader label="ID" field="student_id" />
                        <SortHeader label="Student" field="student_name" />
                        <SortHeader label="Email" field="email" />
                        <th>Phone</th>
                        <SortHeader label="Batch" field="batch_id" />
                        <SortHeader label="Qualification" field="qualification" />
                        <SortHeader label="Location" field="location" />
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="skeleton-row">
                            {Array.from({ length: 8 }).map((__, j) => (
                              <td key={j}><span className="skeleton" /></td>
                            ))}
                          </tr>
                        ))
                      ) : pagedStudents.length === 0 ? (
                        <tr>
                          <td colSpan="8">
                            <div className="empty-state">
                              <Inbox size={34} />
                              <strong>No students found</strong>
                              <span>Try a different search or clear the filters.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        pagedStudents.map((student) => (
                          <tr key={student.student_id}>
                            <td>{student.student_id}</td>
                            <td>
                              <button className="profile-link" onClick={() => setSelectedStudent(student)}>
                                <span className="avatar" style={{ background: avatarColor(student.student_id) }}>
                                  {initialsOf(student.student_name)}
                                </span>
                                {student.student_name}
                              </button>
                            </td>
                            <td>{student.email}</td>
                            <td>{student.phone}</td>
                            <td><span className="batch-badge">{getBatchName(student.batch_id)}</span></td>
                            <td>{normalizeQualification(student.qualification)}</td>
                            <td>{student.location}</td>
                            <td>
                              <div className="action-buttons">
                                <button className="edit-button" aria-label={`Edit ${student.student_name}`}
                                  onClick={() => handleEdit(student)}>
                                  <Pencil size={14} /> Edit
                                </button>
                                <button className="delete-button" aria-label={`Delete ${student.student_name}`}
                                  onClick={() => handleDelete(student)}
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
                  <span>
                    Showing {pagedStudents.length} of {filteredStudents.length} students
                    {filteredStudents.length !== students.length && ` (${students.length} total)`}
                  </span>
                  <div className="pagination">
                    <button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}
                      aria-label="Previous page">
                      <ChevronLeft size={16} />
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}
                      aria-label="Next page">
                      <ChevronRight size={16} />
                    </button>
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
                  <h2>Appearance</h2>
                  <p>Choose what the dashboard shows</p>
                </div>
              </div>

              <div className="settings-group">
                {[
                  ["Dark mode", "Switch between light and dark themes.", darkMode, setDarkMode],
                  ["Show statistics", "Display total students, batches and the filtered count.", showStats, setShowStats],
                  ["Show analytics", "Display the batch, qualification and location charts.", showAnalytics, setShowAnalytics]
                ].map(([title, text, value, setter]) => (
                  <div className="settings-item" key={title}>
                    <div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </div>
                    <label className="settings-toggle">
                      <input type="checkbox" checked={value} onChange={(e) => setter(e.target.checked)} />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                ))}
              </div>

              <div className="application-info">
                <h3>About this application</h3>
                <p className="application-description">
                  A web application for managing student records, batches and
                  student distribution analytics.
                </p>

                <div className="application-info-grid">
                  {[
                    ["Frontend", "React"],
                    ["Build tool", "Vite"],
                    ["Backend", "Python, FastAPI"],
                    ["Database", "Supabase, PostgreSQL"],
                    ["Database toolkit", "SQLAlchemy"],
                    ["Charts", "Recharts"],
                    ["API client", "Axios"]
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <footer className="footer">Student Management System</footer>
            </section>
          )}
        </main>
      </div>

      {selectedStudent && (
        <div className="profile-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="profile-modal" role="dialog" aria-modal="true"
            onClick={(event) => event.stopPropagation()}>
            <div className="profile-header">
              <div>
                <h2>Student profile</h2>
                <p>Student ID {selectedStudent.student_id}</p>
              </div>
              <button className="profile-close-button" aria-label="Close" onClick={() => setSelectedStudent(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="profile-summary">
              <div className="profile-avatar" style={{ background: avatarColor(selectedStudent.student_id) }}>
                {initialsOf(selectedStudent.student_name)}
              </div>
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
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;