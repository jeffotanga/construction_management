import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { attendanceService, workerService, projectService } from '../services/api';

const Attendance = () => {
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState([]);
  const [form, setForm] = useState({ worker_id: '', project_id: '', attendance_date: '', status: 'present', notes: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAttendance = async () => {
      setLoading(true);
      try {
        const [workerRes, projectRes, recordRes, summaryRes] = await Promise.all([
          workerService.getAll(),
          projectService.getAll(),
          attendanceService.getAll(),
          attendanceService.summary(),
        ]);
        setWorkers(workerRes.data || []);
        setProjects(projectRes.data || []);
        setRecords(recordRes.data || []);
        setSummary(summaryRes.data || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to load attendance');
      } finally {
        setLoading(false);
      }
    };
    loadAttendance();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.worker_id || !form.project_id || !form.attendance_date) {
      setError('Worker, project and date are required.');
      return;
    }

    try {
      const response = await attendanceService.create(form);
      setRecords((prev) => [response.data, ...prev]);
      setForm({ worker_id: '', project_id: '', attendance_date: '', status: 'present', notes: '' });
      const summaryRes = await attendanceService.summary();
      setSummary(summaryRes.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save attendance');
    }
  };

  return (
    <AppLayout title="Attendance Tracking" subtitle="Record daily site attendance and review weekly summaries">
      <div className="space-y-6">
        {error && <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-slate-950">Daily attendance</h2>
            <p className="mt-2 text-sm text-slate-500">Capture worker presence and absence by project.</p>
            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-slate-700">
                  Worker
                  <select name="worker_id" value={form.worker_id} onChange={handleChange} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400">
                    <option value="">Select worker</option>
                    {workers.map((worker) => (
                      <option key={worker.id} value={worker.id}>{worker.full_name}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-slate-700">
                  Project
                  <select name="project_id" value={form.project_id} onChange={handleChange} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400">
                    <option value="">Select project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-slate-700">
                  Date
                  <input type="date" name="attendance_date" value={form.attendance_date} onChange={handleChange} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400" />
                </label>
                <label className="block text-sm text-slate-700">
                  Status
                  <select name="status" value={form.status} onChange={handleChange} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400">
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm text-slate-700">
                Notes
                <textarea name="notes" value={form.notes} onChange={handleChange} className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400" />
              </label>
              <button type="submit" className="rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Save attendance</button>
            </form>
          </section>

          <aside className="rounded-[2rem] bg-white p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-slate-950">Weekly attendance summary</h3>
            <div className="mt-5 space-y-3">
              {loading ? (
                <div className="py-10 text-center text-slate-500">Loading summary...</div>
              ) : !summary.length ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">No attendance summary yet.</div>
              ) : (
                summary.map((item) => (
                  <div key={`${item.worker_id}-${item.project_id}`} className="rounded-3xl border border-slate-200 p-4">
                    <p className="font-semibold text-slate-950">Worker {item.worker_id}</p>
                    <p className="mt-1 text-sm text-slate-500">Project {item.project_id}</p>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-700">
                      <span>Present: {item.total_present}</span>
                      <span>Absent: {item.total_absent}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>

        <section className="rounded-[2rem] bg-white p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-slate-950">Recent attendance records</h3>
          <div className="mt-6 space-y-3">
            {loading ? (
              <div className="py-10 text-center text-slate-500">Loading records...</div>
            ) : records.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">No attendance records found.</div>
            ) : (
              records.map((record) => (
                <div key={record.id} className="rounded-3xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">Worker {record.worker_id}</p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">{record.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Project {record.project_id} • {record.attendance_date}</p>
                  {record.notes && <p className="mt-2 text-sm text-slate-600">{record.notes}</p>}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Attendance;
