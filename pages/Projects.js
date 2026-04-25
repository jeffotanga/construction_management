import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { projectService } from '../services/api';

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', budget: '', start_date: '', end_date: '', status: 'planning', description: '' });

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        const response = await projectService.getAll();
        setProjects(response.data || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const bySearch = project.name.toLowerCase().includes(search.toLowerCase()) || project.location.toLowerCase().includes(search.toLowerCase());
      const byStatus = status === 'all' || project.status === status;
      return bySearch && byStatus;
    });
  }, [projects, search, status]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name || !form.location || !form.budget || !form.start_date || !form.end_date) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const response = await projectService.create(form);
      setProjects((prev) => [response.data, ...prev]);
      setShowAdd(false);
      setForm({ name: '', location: '', budget: '', start_date: '', end_date: '', status: 'planning', description: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to create project');
    }
  };

  return (
    <AppLayout title="Projects" subtitle="Manage active work packages and budgets" actions={
      <button onClick={() => setShowAdd(true)} className="rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
        + Add New Project
      </button>
    }>
      <div className="space-y-6">
        {error && <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Projects</p>
            <p className="mt-4 text-3xl font-semibold text-slate-950">{projects.length}</p>
            <p className="mt-2 text-sm text-slate-500">Tracked project portfolio</p>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Live status</p>
            <p className="mt-4 text-3xl font-semibold text-slate-950">{filteredProjects.length}</p>
            <p className="mt-2 text-sm text-slate-500">Matching current filters</p>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Search</p>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="mt-4 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
            />
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-soft">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Project directory</h2>
              <p className="mt-2 text-sm text-slate-500">Search, filter, and access detailed project records.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400">
                <option value="all">All statuses</option>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On hold</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-500">Loading projects...</div>
          ) : (
            <div className="overflow-hidden rounded-[2rem] border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-[0.24em]">
                  <tr>
                    <th className="px-6 py-4">Project</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Budget</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Timeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="cursor-pointer transition hover:bg-slate-50" onClick={() => navigate(`/projects/${project.id}`)}>
                      <td className="px-6 py-4 font-semibold text-slate-900">{project.name}</td>
                      <td className="px-6 py-4">{project.location}</td>
                      <td className="px-6 py-4">KES {Number(project.budget).toLocaleString()}</td>
                      <td className="px-6 py-4 capitalize text-slate-700">{project.status.replace('_', ' ')}</td>
                      <td className="px-6 py-4">{project.start_date} - {project.end_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredProjects.length && <div className="px-6 py-10 text-center text-slate-500">No matching projects found.</div>}
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-soft">
            <header className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">Create Project</h3>
                <p className="mt-1 text-sm text-slate-500">Add a new project and publish it immediately.</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Close</button>
            </header>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Project name</span>
                  <input name="name" value={form.name} onChange={handleChange} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400" />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Location</span>
                  <input name="location" value={form.location} onChange={handleChange} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400" />
                </label>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Budget</span>
                  <input name="budget" type="number" value={form.budget} onChange={handleChange} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400" />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Start date</span>
                  <input name="start_date" type="date" value={form.start_date} onChange={handleChange} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400" />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>End date</span>
                  <input name="end_date" type="date" value={form.end_date} onChange={handleChange} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400" />
                </label>
              </div>
              <label className="space-y-2 text-sm text-slate-700">
                <span>Status</span>
                <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400">
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>Description</span>
                <textarea name="description" value={form.description} onChange={handleChange} className="h-28 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400" />
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowAdd(false)} className="rounded-3xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Cancel</button>
                <button type="submit" className="rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Create project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Projects;
