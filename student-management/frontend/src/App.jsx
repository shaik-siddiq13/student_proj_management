
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

import "./App.css";
import API from "./api";

const COLORS = [
  "#3977D5", "#20A780", "#F0A33B", "#8B5CF6",
  "#E35D6A", "#06B6D4", "#EC4899", "#64748B"
];

const emptyForm = {
  batch_id: "",
  student_name: "",
  email: "",
  phone: "",
  qualification: "",
  location: ""
};

function AnalyticsCard({ title, data, type, color }) {
  const chartData = data.filter((item) => item.count > 0);
  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="content-card analytics-card">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>Student distribution analysis</p>
        </div>
        <span className="analytics-total">{total} Students</span>
      </div>

      {chartData.length === 0 ? (
        <div className="no-chart-data">No data available.</div>
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
                    <Cell
                      key={item.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} students`, name]}
                />
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
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={105}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#334155", fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => [`${value} students`, "Students"]}
                />
                <Bar
                  dataKey="count"
                  name="Students"
                  fill={color}
                  radius={[0, 8, 8, 0]}
                  barSize={20}
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

  // Dashboard settings
  const [darkMode, setDarkMode] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(true);

  useEffect(() => {
    loadInitialData();
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

    const studentData = {
      ...formData,
      batch_id: Number(formData.batch_id)
    };

    try {
      if (editingId !== null) {
        await API.put(`/students/${editingId}`, studentData);
        setNotice("Student details updated successfully!");
      } else {
        await API.post("/students", studentData);
        setNotice("Student added successfully!");
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
      batch_id: String(student.batch_id),
      student_name: student.student_name || "",
      email: student.email || "",
      phone: student.phone || "",
      qualification: student.qualification || "",
      location: student.location || ""
    });

    setError("");
    setNotice("");
    navigateTo("student-form");
  };

  const handleDelete = async (student) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${student.student_name}?`
    );

    if (!confirmed) return;

    setDeletingId(student.student_id);
    setError("");
    setNotice("");

    try {
      await API.delete(`/students/${student.student_id}`);
      setNotice("Student deleted successfully!");

      if (editingId === student.student_id) resetForm();

      await fetchStudents();
    } catch (err) {
      console.error("Error deleting student:", err);
      setError(
        err.response?.data?.detail ||
        "Unable to delete student. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getBatchName = (batchId) => {
    const batch = batches.find(
      (item) => String(item.batch_id) === String(batchId)
    );

    return batch ? batch.batch_name : `Batch ${batchId}`;
  };

  // Navigation between dashboard sections and Settings page
  const navigateTo = (section) => {
    setActiveSection(section);

    if (section === "student-form" && editingId === null) {
      setFormData(emptyForm);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (section !== "settings") {
      setTimeout(() => {
        const element = document.getElementById(section);
        element?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 100);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !search ||
        String(student.student_id).includes(search) ||
        (student.student_name || "").toLowerCase().includes(search) ||
        (student.email || "").toLowerCase().includes(search) ||
        (student.location || "").toLowerCase().includes(search);

      const matchesBatch =
        !batchFilter || String(student.batch_id) === batchFilter;

      return matchesSearch && matchesBatch;
    });
  }, [students, searchTerm, batchFilter]);

  const studentsByBatch = useMemo(
    () =>
      batches.map((batch) => ({
        name: batch.batch_name,
        count: students.filter(
          (student) =>
            String(student.batch_id) === String(batch.batch_id)
        ).length
      })),
    [students, batches]
  );

  const studentsByQualification = useMemo(() => {
    const counts = {};

    students.forEach((student) => {
      const name = student.qualification?.trim() || "Not specified";
      counts[name] = (counts[name] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count
    }));
  }, [students]);

  const studentsByLocation = useMemo(() => {
    const counts = {};

    students.forEach((student) => {
      const name = student.location?.trim() || "Not specified";
      counts[name] = (counts[name] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count
    }));
  }, [students]);

  return (
    <div className={`app-container ${darkMode ? "dark-mode" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">S</div>
          <div>
            <h2>Student Portal</h2>
            <p>Management System</p>
          </div>
        </div>

        <div className="sidebar-menu">
          <p className="sidebar-label">MAIN MENU</p>

          <button
            className={
              activeSection === "dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => navigateTo("dashboard")}
          >
            <span className="nav-icon">▦</span> Dashboard
          </button>

          <button
            className={
              activeSection === "analytics"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => navigateTo("analytics")}
          >
            <span className="nav-icon">▥</span> Analytics
          </button>

          <button
            className={
              activeSection === "student-form"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => navigateTo("student-form")}
          >
            <span className="nav-icon">＋</span> Add Student
          </button>

          <button
            className={
              activeSection === "student-records"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => navigateTo("student-records")}
          >
            <span className="nav-icon">☷</span> Student Records
          </button>

          <p className="sidebar-label secondary-label">PREFERENCES</p>

          <button
            className={
              activeSection === "settings"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => navigateTo("settings")}
          >
            <span className="nav-icon">⚙</span> Settings
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-icon">S</div>
          <div>
            <strong>Student Portal</strong>
            <span>Admin Dashboard</span>
          </div>
        </div>
      </aside>

      <div className="dashboard-content">
        <header className="header">
          <div>
            <h1>
              {activeSection === "settings"
                ? "Settings"
                : "Student Management System"}
            </h1>
            <p>
              {activeSection === "settings"
                ? "Customize your application preferences"
                : "Manage and track student information"}
            </p>
          </div>

          {activeSection !== "settings" && (
            <button
              className="refresh-button"
              onClick={loadInitialData}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "↻ Refresh Data"}
            </button>
          )}
        </header>

        <main className="main-content">
          {error && (
            <div className="alert error-alert">
              {error}
              <button onClick={() => setError("")}>×</button>
            </div>
          )}

          {notice && (
            <div className="alert success-alert">
              {notice}
              <button onClick={() => setNotice("")}>×</button>
            </div>
          )}

          {/* Dashboard pages */}
          {activeSection !== "settings" && (
            <>
              {showStats && (
                <section className="stats-grid" id="dashboard">
                  <div className="stat-card">
                    <div className="stat-icon blue">ST</div>
                    <div>
                      <p>Total Students</p>
                      <h2>{students.length}</h2>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon purple">BT</div>
                    <div>
                      <p>Total Batches</p>
                      <h2>{batches.length}</h2>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon green">RS</div>
                    <div>
                      <p>Displayed Students</p>
                      <h2>{filteredStudents.length}</h2>
                    </div>
                  </div>
                </section>
              )}

              {!showStats && <div id="dashboard" />}

              {showAnalytics && (
                <section className="analytics-section" id="analytics">
                  <div className="section-heading">
                    <div>
                      <h2>Dashboard Analytics</h2>
                      <p>
                        Insights into student distribution and demographics
                      </p>
                    </div>
                  </div>

                  <div className="analytics-grid">
                    <AnalyticsCard
                      title="Students by Batch"
                      data={studentsByBatch}
                      type="pie"
                      color="#3977D5"
                    />

                    <AnalyticsCard
                      title="Students by Qualification"
                      data={studentsByQualification}
                      type="bar"
                      color="#8B5CF6"
                    />

                    <AnalyticsCard
                      title="Students by Location"
                      data={studentsByLocation}
                      type="bar"
                      color="#20A780"
                    />
                  </div>
                </section>
              )}

              {!showAnalytics && <div id="analytics" />}

              {/* Add / Edit Student */}
              <section className="content-card" id="student-form">
                <div className="section-heading">
                  <div>
                    <h2>
                      {editingId !== null
                        ? "Edit Student"
                        : "Add New Student"}
                    </h2>
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
                    <select
                      id="batch_id"
                      name="batch_id"
                      value={formData.batch_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Batch</option>
                      {batches.map((batch) => (
                        <option
                          key={batch.batch_id}
                          value={batch.batch_id}
                        >
                          {batch.batch_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="student_name">Student Name *</label>
                    <input
                      id="student_name"
                      name="student_name"
                      value={formData.student_name}
                      onChange={handleChange}
                      placeholder="Enter student name"
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter email address"
                      maxLength={150}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      maxLength={15}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="qualification">Qualification *</label>
                    <input
                      id="qualification"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      placeholder="Example: B.Tech"
                      maxLength={50}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">Location *</label>
                    <input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Enter city"
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={saving}
                    >
                      {saving
                        ? "Please wait..."
                        : editingId !== null
                          ? "Update Student"
                          : "Add Student"}
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={resetForm}
                    >
                      {editingId !== null ? "Cancel Edit" : "Clear Form"}
                    </button>
                  </div>
                </form>
              </section>

              {/* Student Records */}
              <section className="content-card" id="student-records">
                <div className="section-heading">
                  <div>
                    <h2>Student Records</h2>
                    <p>
                      View, search, filter and manage student details
                    </p>
                  </div>
                </div>

                <div className="toolbar">
                  <div className="search-box">
                    <input
                      type="search"
                      placeholder="Search by name, email or student ID..."
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(event.target.value)
                      }
                    />
                  </div>

                  <div className="filter-box">
                    <select
                      value={batchFilter}
                      onChange={(event) =>
                        setBatchFilter(event.target.value)
                      }
                    >
                      <option value="">All Batches</option>
                      {batches.map((batch) => (
                        <option
                          key={batch.batch_id}
                          value={batch.batch_id}
                        >
                          {batch.batch_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    className="clear-filter-button"
                    onClick={() => {
                      setSearchTerm("");
                      setBatchFilter("");
                    }}
                  >
                    Clear Filters
                  </button>
                </div>

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Student Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Batch</th>
                        <th>Qualification</th>
                        <th>Location</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="8" className="table-message">
                            Loading student records...
                          </td>
                        </tr>
                      ) : filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="table-message">
                            No student records found.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student) => (
                          <tr key={student.student_id}>
                            <td>{student.student_id}</td>
                            <td>
                              <button
                                className="profile-link"
                                onClick={() =>
                                  setSelectedStudent(student)
                                }
                              >
                                {student.student_name}
                              </button>
                            </td>
                            <td>{student.email}</td>
                            <td>{student.phone}</td>
                            <td>
                              <span className="batch-badge">
                                {getBatchName(student.batch_id)}
                              </span>
                            </td>
                            <td>{student.qualification}</td>
                            <td>{student.location}</td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="edit-button"
                                  onClick={() => handleEdit(student)}
                                >
                                  Edit
                                </button>

                                <button
                                  className="delete-button"
                                  onClick={() => handleDelete(student)}
                                  disabled={
                                    deletingId === student.student_id
                                  }
                                >
                                  {deletingId === student.student_id
                                    ? "Deleting..."
                                    : "Delete"}
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
                  Showing {filteredStudents.length} of {students.length} students
                </div>
              </section>

              <footer className="footer">
                Student Management System
              </footer>
            </>
          )}

          {/* Separate Settings page */}
          {activeSection === "settings" && (
            <section className="content-card settings-section" id="settings">
              <div className="section-heading">
                <div>
                  <h2>Settings</h2>
                  <p>
                    Customize your dashboard appearance and display
                  </p>
                </div>
              </div>

              <div className="settings-group">
                <div className="settings-item">
                  <div>
                    <h3>Dark Mode</h3>
                    <p>
                      Switch between light and dark dashboard themes.
                    </p>
                  </div>

                  <label className="settings-toggle">
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={(event) =>
                        setDarkMode(event.target.checked)
                      }
                    />
                    <span className="settings-toggle-slider" />
                  </label>
                </div>

                <div className="settings-item">
                  <div>
                    <h3>Show Dashboard Statistics</h3>
                    <p>
                      Display total students, batches and filtered student count.
                    </p>
                  </div>

                  <label className="settings-toggle">
                    <input
                      type="checkbox"
                      checked={showStats}
                      onChange={(event) =>
                        setShowStats(event.target.checked)
                      }
                    />
                    <span className="settings-toggle-slider" />
                  </label>
                </div>

                <div className="settings-item">
                  <div>
                    <h3>Show Dashboard Analytics</h3>
                    <p>
                      Display batch, qualification and location charts.
                    </p>
                  </div>

                  <label className="settings-toggle">
                    <input
                      type="checkbox"
                      checked={showAnalytics}
                      onChange={(event) =>
                        setShowAnalytics(event.target.checked)
                      }
                    />
                    <span className="settings-toggle-slider" />
                  </label>
                </div>
              </div>

              <div className="application-info">
                <h3>Application Information</h3>

                <p className="application-description">
                  Student Management System is a web application for managing
                  student records, batches and student distribution analytics.
                </p>

                <div className="application-info-grid">
                  <div>
                    <span>Frontend</span>
                    <strong>React.js</strong>
                  </div>

                  <div>
                    <span>Build Tool</span>
                    <strong>Vite</strong>
                  </div>

                  <div>
                    <span>Backend</span>
                    <strong>Python · FastAPI</strong>
                  </div>

                  <div>
                    <span>Database</span>
                    <strong>Supabase · PostgreSQL</strong>
                  </div>

                  <div>
                    <span>Database Toolkit</span>
                    <strong>SQLAlchemy</strong>
                  </div>

                  <div>
                    <span>Charts</span>
                    <strong>Recharts</strong>
                  </div>

                  <div>
                    <span>API Communication</span>
                    <strong>Axios</strong>
                  </div>
                </div>

                <p className="application-version">
                  Student Management System · Dashboard
                </p>
              </div>

              <footer className="footer">
                Student Management System
              </footer>
            </section>
          )}
        </main>
      </div>

      {/* Student Profile Popup */}
      {selectedStudent && (
        <div
          className="profile-overlay"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profile-header">
              <div>
                <h2>Student Profile</h2>
                <p>Student ID: {selectedStudent.student_id}</p>
              </div>

              <button
                className="profile-close-button"
                onClick={() => setSelectedStudent(null)}
              >
                ×
              </button>
            </div>

            <div className="profile-summary">
              <div className="profile-avatar">
                {(selectedStudent.student_name || "?")
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <h3>{selectedStudent.student_name}</h3>
              <p>{getBatchName(selectedStudent.batch_id)}</p>
            </div>

            <div className="profile-details">
              {[
                ["Student ID", selectedStudent.student_id],
                ["Email Address", selectedStudent.email],
                ["Phone Number", selectedStudent.phone],
                ["Batch", getBatchName(selectedStudent.batch_id)],
                ["Qualification", selectedStudent.qualification],
                ["Location", selectedStudent.location]
              ].map(([label, value]) => (
                <div className="profile-detail" key={label}>
                  <span>{label}</span>
                  <strong>{value || "Not available"}</strong>
                </div>
              ))}
            </div>

            <button
              className="profile-done-button"
              onClick={() => setSelectedStudent(null)}
            >
              Close Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
