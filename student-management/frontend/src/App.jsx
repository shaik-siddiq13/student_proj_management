
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import API from "./api";

const emptyForm = {
  batch_id: "",
  student_name: "",
  email: "",
  phone: "",
  qualification: "",
  location: ""
};

function App() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);

  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [batchFilter, setBatchFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Load students and batches when the page opens
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

  // Refresh student list
  const fetchStudents = async () => {
    const response = await API.get("/students");
    setStudents(response.data);
  };

  // Update form values
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));
  };

  // Clear form and exit edit mode
  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setError("");
  };

  // Add or update a student
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

  // Load selected student into the form
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

  // Delete student
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

  // Search and batch filtering
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

  // Get batch name using batch ID
  const getBatchName = (batchId) => {
    const batch = batches.find(
      (item) => item.batch_id === batchId
    );

    return batch ? batch.batch_name : `Batch ${batchId}`;
  };

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
                        {student.student_name}
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
    </div>
  );
}

export default App;
