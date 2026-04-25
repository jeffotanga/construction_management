import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { projectService } from '../services/api';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      try {
        const response = await projectService.getById(id);
        setProject(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to load project');
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [id]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">Loading project detail...</div>;
  }

  if (!project) {
    return <AppLayout title="Project Not Found" subtitle="Check the project ID and try again."></AppLayout>;
  }

  return (
    <AppLayout title="Project Detail" subtitle={project.name}>
      <div className="space-y-6">
        {error && <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-[2rem] bg-white p-6 shadow-soft lg:col-span-2">
            <h2 className="text-xl font-semibold text-slate-950">Overview</h2>
            <p className="mt-3 text-sm text-slate-500">Project details, schedule, tasks and team resources for active delivery.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Status</p>
                <p className="mt-3 text-xl font-semibold text-slate-950">{project.status.replace('_', ' ')}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Budget</p>
                <p className="mt-3 text-xl font-semibold text-slate-950">KES {Number(project.budget).toLocaleString()}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Timeline</p>
                <p className="mt-3 text-lg font-semibold text-slate-950">{project.start_date}</p>
                <p className="text-sm text-slate-500">to {project.end_date}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Last updated</p>
                <p className="mt-3 text-lg font-semibold text-slate-950">{new Date(project.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </article>

          <aside className="rounded-[2rem] bg-white p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-slate-950">Assign workers</h3>
            <p className="mt-2 text-sm text-slate-500">Use the workers page to assign roles and update the project crew.</p>
            <div className="mt-6 space-y-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Team size</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{project.workers?.length || 0}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Files uploaded</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{project.documents?.length || 0}</p>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <article className="rounded-[2rem] bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-950">Task board</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">{project.tasks?.length || 0} tasks</span>
            </div>
            <div className="mt-5 space-y-4">
              {project.tasks?.map((task) => (
                <div key={task.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-500">Priority: {task.priority}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">{task.status.replace('_', ' ')}</span>
                  </div>
                  <p className="mt-4 text-sm text-slate-600">Due {task.due_date || 'TBD'}</p>
                </div>
              ))}
              {!project.tasks?.length && <p className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">No task details available.</p>}
            </div>
          </article>

          <aside className="rounded-[2rem] bg-white p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-slate-950">Project team</h3>
            <div className="mt-5 space-y-3">
              {project.workers?.map((worker) => (
                <div key={worker.id} className="rounded-3xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-950">{worker.full_name}</p>
                  <p className="mt-1 text-sm text-slate-500">{worker.role} • assigned as {worker.assigned_role}</p>
                </div>
              ))}
              {!project.workers?.length && <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">No assigned workers yet.</div>}
            </div>
          </aside>
        </section>
      </div>
    </AppLayout>
  );
};

export default ProjectDetail;
