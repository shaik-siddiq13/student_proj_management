
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
  "#3b82f6",
  "#8b5cf6",
  "#16a34a",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#64748b"
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
  const hasData = data.some((item) => item.count > 0);

  return (
    <div className="content-card">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>Student distribution analysis</p>
        </div>
      </div>

      {!hasData ? (
        <p>No data available.</p>
      ) : (
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            {type === "pie" ? (
              <PieChart>
                <Pie
                  data={data.filter((item) => item.count > 0)}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(1)}%`
                  }
                >
                  {data
                    .filter((item) => item.count > 0)
                    .map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            ) : (
              <BarChart
                data={data}
                margin={{ top: 15, right: 15, left: 0, bottom: 45 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  height={65}
                  tick={{ fontSize: 11 }}
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="count"
                  name="Students"
                  fill={color}
                  radius={[6, 6, 0, 0]}
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

  // Student Profile
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [batchFilter, setBatchFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));
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

      const message =
        err.response?.data?.detail ||
        "Unable to save student details. Please try again.";

      setError(
        typeof message === "string"
          ? message
          : "Please check the entered student details."
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

    document.getElementById("student-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
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

      if (editingId === student.student_id) {
        resetForm();
      }

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

  // Open student profile
  const handleViewProfile = (student) => {
    setSelectedStudent(student);
  };

  // Close student profile
  const handleCloseProfile = () => {
    setSelectedStudent(null);
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
        !batchFilter ||
        String(student.batch_id) === batchFilter;

      return matchesSearch && matchesBatch;
    });
  }, [students, searchTerm, batchFilter]);

  const getBatchName = (batchId) => {
    const batch = batches.find(
      (item) => String(item.batch_id) === String(batchId)
    );

    return batch ? batch.batch_name : `Batch ${batchId}`;
  };

  const studentsByBatch = useMemo(() => {
    return batches.map((batch) => ({
      name: batch.batch_name,
      count: students.filter(
        (student) =>
          String(student.batch_id) === String(batch.batch_id)
      ).length
    }));
  }, [students, batches]);

  const studentsByQualification = useMemo(() => {
    const counts = {};

    students.forEach((student) => {
      const qualification =
        student.qualification?.trim() || "Not specified";

      counts[qualification] = (counts[qualification] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count
    }));
  }, [students]);

  const studentsByLocation = useMemo(() => {
    const counts = {};

    students.forEach((student) => {
      const location =
        student.location?.trim() || "Not specified";

      counts[location] = (counts[location] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count
    }));
  }, [students]);

  return (
    <div className="app-container">

      {/* Header */}
      <header className="header">
        <div>
          <h1>Student Management System</h1>
          <p>Manage and track student information</p>
        </div>

        <button
          className="refresh-button"
          type="button"
          onClick={loadInitialData}
          disabled={loading}
        >
          Refresh Data
        </button>
      </header>

      <main className="main-content">

        {/* Dashboard Statistics */}
        <section className="stats-grid">
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

        {/* Dashboard Analytics */}
        <section style={{ marginBottom: "25px" }}>
          <div className="section-heading">
            <div>
              <h2>Dashboard Analytics</h2>
              <p>Insights into student distribution and demographics</p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px"
            }}
          >
            <AnalyticsCard
              title="Students by Batch"
              data={studentsByBatch}
              type="pie"
              color="#3b82f6"
            />

            <AnalyticsCard
              title="Students by Qualification"
              data={studentsByQualification}
              type="bar"
              color="#8b5cf6"
            />

            <AnalyticsCard
              title="Students by Location"
              data={studentsByLocation}
              type="bar"
              color="#16a34a"
            />
          </div>
        </section>

        {/* Notifications */}
        {notice && (
          <div className="alert success-alert">
            {notice}
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="alert error-alert">
            {error}
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Add / Edit Student Form */}
        <section className="content-card" id="student-form">
          <div className="section-heading">
            <div>
              <h2>
                {editingId !== null ? "Edit Student" : "Add New Student"}
              </h2>
              <p>
                {editingId !== null
                  ? `Updating student ID: ${editingId}`
                  : "Enter the student information below"}
              </p>
            </div>

            {editingId !== null && (
              <span className="editing-label">Editing</span>
            )}
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
                  <option key={batch.batch_id} value={batch.batch_id}>
                    {batch.batch_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="student_name">Student Name *</label>
              <input
                id="student_name"
                type="text"
                name="student_name"
                placeholder="Enter student name"
                value={formData.student_name}
                onChange={handleChange}
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
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
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
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleChange}
                maxLength={15}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="qualification">Qualification *</label>
              <input
                id="qualification"
                type="text"
                name="qualification"
                placeholder="Example: B.Tech"
                value={formData.qualification}
                onChange={handleChange}
                maxLength={50}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location *</label>
              <input
                id="location"
                type="text"
                name="location"
                placeholder="Enter city"
                value={formData.location}
                onChange={handleChange}
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
        <section className="content-card">
          <div className="section-heading records-heading">
            <div>
              <h2>Student Records</h2>
              <p>View, search, filter and manage student details</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="toolbar">
            <div className="search-box">
              <input
                type="search"
                placeholder="Search by name, email or student ID..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="filter-box">
              <select
                value={batchFilter}
                onChange={(event) => setBatchFilter(event.target.value)}
              >
                <option value="">All Batches</option>
                {batches.map((batch) => (
                  <option key={batch.batch_id} value={batch.batch_id}>
                    {batch.batch_name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="clear-filter-button"
              onClick={() => {
                setSearchTerm("");
                setBatchFilter("");
              }}
            >
              Clear Filters
            </button>
          </div>

          {/* Students Table */}
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

                      <td className="student-name-cell">
                        <button
                          type="button"
                          onClick={() => handleViewProfile(student)}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#2563eb",
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: 0,
                            fontSize: "inherit",
                            textAlign: "left"
                          }}
                          title="View student profile"
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
                            type="button"
                            className="edit-button"
                            onClick={() => handleEdit(student)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete-button"
                            onClick={() => handleDelete(student)}
                            disabled={deletingId === student.student_id}
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
      </main>

      {/* Student Profile Modal */}
      {selectedStudent && (
        <div
          onClick={handleCloseProfile}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1000
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              backgroundColor: "#ffffff",
              width: "100%",
              maxWidth: "480px",
              borderRadius: "16px",
              padding: "28px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "22px"
              }}
            >
              <div>
                <h2
                  id="profile-title"
                  style={{ margin: 0, color: "#1e293b" }}
                >
                  Student Profile
                </h2>
                <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                  Student ID: {selectedStudent.student_id}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseProfile}
                aria-label="Close student profile"
                style={{
                  border: "none",
                  background: "#f1f5f9",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  fontSize: "22px",
                  cursor: "pointer",
                  color: "#334155"
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                background: "#eff6ff",
                borderRadius: "12px",
                padding: "18px",
                marginBottom: "20px",
                textAlign: "center"
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "#2563eb",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "26px",
                  fontWeight: 700,
                  margin: "0 auto 12px"
                }}
              >
                {(selectedStudent.student_name || "?")
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <h3 style={{ margin: 0, color: "#1e293b" }}>
                {selectedStudent.student_name || "Not available"}
              </h3>

              <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                {getBatchName(selectedStudent.batch_id)}
              </p>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              {[
                ["Student ID", selectedStudent.student_id],
                ["Email Address", selectedStudent.email],
                ["Phone Number", selectedStudent.phone],
                ["Batch", getBatchName(selectedStudent.batch_id)],
                ["Qualification", selectedStudent.qualification],
                ["Location", selectedStudent.location]
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    borderBottom: "1px solid #e2e8f0",
                    paddingBottom: "10px"
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      fontWeight: 600,
                      textTransform: "uppercase"
                    }}
                  >
                    {label}
                  </span>

                  <span
                    style={{
                      fontSize: "15px",
                      color: "#1e293b",
                      overflowWrap: "anywhere"
                    }}
                  >
                    {value || "Not available"}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCloseProfile}
              style={{
                width: "100%",
                marginTop: "24px",
                padding: "12px",
                border: "none",
                borderRadius: "8px",
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "14px"
              }}
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
