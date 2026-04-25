import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { projectService, reportService } from '../services/api';

const Reports = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await projectService.getAll();
        setProjects(response.data || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to load project list');
      }
    };
    loadProjects();
  }, []);

  const downloadReport = async (endpoint) => {
    if (!selectedProject) {
      setError('Choose a project first');
      return;
    }
    setError('');
    try {
      const response = await endpoint(selectedProject);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'report.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to generate report');
    }
  };

  return (
    <AppLayout title="Reports" subtitle="Download project, financial and attendance reports">
      <div className="space-y-6">
        {error && <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
        <section className="rounded-[2rem] bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-950">Generate PDF reports</h2>
          <p className="mt-2 text-sm text-slate-500">Choose a project and download the report format you need.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <div>
              <label className="block text-sm text-slate-700">
                Project
                <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400">
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-3">
              <button type="button" onClick={() => downloadReport(reportService.projectSummary)} className="rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Project summary</button>
              <button type="button" onClick={() => downloadReport(reportService.financial)} className="rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Financial report</button>
              <button type="button" onClick={() => downloadReport(reportService.attendance)} className="rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Attendance report</button>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Reports;
