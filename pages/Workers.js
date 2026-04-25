import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { workerService, projectService } from '../services/api';

const Workers = () => {
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ full_name: '', id_number: '', role: '', phone: '', email: '' });
  const [assign, setAssign] = useState({ worker_id: '', project_id: '', assigned_role: 'worker' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [workerRes, projectRes] = await Promise.all([workerService.getAll(), projectService.getAll()]);
        setWorkers(workerRes.data || []);
        setProjects(projectRes.data || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to load workers');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAssignChange = (event) => {
    const { name, value } = event.target;
    setAssign((prev) => ({ ...prev, [name]: value }));
  };

  const createWorker = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.full_name || !form.id_number || !form.role || !form.phone) {
      setError('Complete all required worker fields.');
      return;
    }
    try {
      const response = await workerService.create(form);
      setWorkers((prev) => [response.data, ...prev]);
      setForm({ full_name: '', id_number: '', role: '', phone: '', email: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create worker');
    }
  };

  const assignWorker = async (event) => {
    event.preventDefault();
    setError('');
    if (!assign.worker_id || !assign.project_id) {
      setError('Select a worker and project to assign.');
      return;
    }
    try {
      await workerService.assign(assign.worker_id, assign);
      setAssign({ worker_id: '', project_id: '', assigned_role: 'worker' });
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to assign worker');
    }
  };

  return (
    <AppLayout title="Worker Management" subtitle="Add workers, track profiles, and assign them to sites">
      <div className="space-y-6">
        {error && <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-[2rem] bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-slate-950">Worker roster</h2>
            <p className="mt-2 text-sm text-slate-500">Employees and subcontractors available for assignments.</p>
            <div className="mt-6 space-y-4">
              {loading ? (
                <div className="py-12 text-center text-slate-500">Loading workers...</div>
              ) : workers.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">No workers added yet.</div>
              ) : (
                <div className="space-y-3">
                  {workers.map((worker) => (
                    <div key={worker.id} className="rounded-3xl border border-slate-200 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-base font-semibold text-slate-950">{worker.full_name}</p>
                          <p className="mt-1 text-sm text-slate-500">{worker.role} • {worker.id_number}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">{worker.phone}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="rounded-[2rem] bg-white p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-slate-950">Add new worker</h3>
            <form className="mt-6 space-y-4" onSubmit={createWorker}>
              <label className="block text-sm text-slate-700">
                Full name
                <input name="full_name" value={form.full_name} onChange={handleFormChange} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400" />
              </label>
              <label className="block text-sm text-slate-700">
                ID number
                <input name="id_number" value={form.id_number} onChange={handleFormChange} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400" />
              </label>
              <label className="block text-sm text-slate-700">
                Role
                <input name="role" value={form.role} onChange={handleFormChange} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400" />
              </label>
              <label className="block text-sm text-slate-700">
                Phone
                <input name="phone" value={form.phone} onChange={handleFormChange} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400" />
              </label>
              <label className="block text-sm text-slate-700">
                Email
                <input name="email" value={form.email} onChange={handleFormChange} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400" />
              </label>
              <button type="submit" className="w-full rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Create worker</button>
            </form>
          </aside>
        </div>

        <section className="rounded-[2rem] bg-white p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-slate-950">Assign worker to project</h3>
          <form className="mt-6 grid gap-4 lg:grid-cols-3" onSubmit={assignWorker}>
            <label className="block text-sm text-slate-700">
              Worker
              <select name="worker_id" value={assign.worker_id} onChange={handleAssignChange} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400">
                <option value="">Select worker</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>{worker.full_name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-700">
              Project
              <select name="project_id" value={assign.project_id} onChange={handleAssignChange} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400">
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-700">
              Role
              <input name="assigned_role" value={assign.assigned_role} onChange={handleAssignChange} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400" />
            </label>
            <div className="lg:col-span-3">
              <button type="submit" className="rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Assign worker</button>
            </div>
          </form>
        </section>
      </div>
    </AppLayout>
  );
};

export default Workers;
