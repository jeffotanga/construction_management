import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { projectService, paymentService, attendanceService } from '../services/api';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [projectRes, paymentRes, attendanceRes] = await Promise.all([
          projectService.getAll(),
          paymentService.getAll(),
          attendanceService.summary(),
        ]);
        setProjects(projectRes.data || []);
        setPayments(paymentRes.data || []);
        setAttendanceSummary(attendanceRes.data || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const totalBudget = projects.reduce((sum, project) => sum + Number(project.budget), 0);
  // eslint-disable-next-line no-unused-vars
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const paidCount = payments.filter((item) => item.status === 'paid').length;
  const pendingCount = payments.filter((item) => item.status === 'pending').length;

  const getStatusBadge = (status) => {
    const statusStyles = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      active: 'bg-blue-100 text-blue-800',
      planning: 'bg-gray-100 text-gray-800',
      on_hold: 'bg-orange-100 text-orange-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-800';
  };

  if (error) {
    return (
      <AppLayout title="Executive Dashboard" subtitle="Construction portfolio performance overview">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-6 h-24 w-24 text-slate-300">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.98-5.5-2.5M12 2l3 3-3 3-3-3 3-3z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-slate-900">Unable to load dashboard</h3>
            <p className="mb-6 text-slate-500">We're having trouble connecting to the server. Please check your connection and try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-3xl bg-orange px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-orange-dark hover:shadow-soft"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Executive Dashboard" subtitle="Construction portfolio performance overview">
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy to-navy-dark p-4 text-white shadow-soft-lg sm:p-6">
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10 sm:h-20 sm:w-20"></div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">Active Projects</p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">{projects.length}</h2>
            <p className="mt-2 text-sm text-slate-300">Projects under management</p>
            <div className="absolute bottom-4 right-4 h-6 w-6 rounded-full bg-orange/20 flex items-center justify-center sm:h-8 sm:w-8">
              <svg className="h-3 w-3 text-orange sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange to-orange-dark p-4 text-white shadow-soft-lg sm:p-6">
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10 sm:h-20 sm:w-20"></div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-100">Total Budget</p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">KES {totalBudget.toLocaleString()}</h2>
            <p className="mt-2 text-sm text-orange-100">Estimated project budget</p>
            <div className="absolute bottom-4 right-4 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center sm:h-8 sm:w-8">
              <svg className="h-3 w-3 text-white sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-[2rem] bg-white p-4 shadow-soft border border-slate-200 sm:col-span-2 sm:p-6 lg:col-span-1">
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-slate-100 sm:h-20 sm:w-20"></div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Payments</p>
            <h2 className="mt-4 text-3xl font-bold text-slate-950 sm:text-4xl">{paidCount}</h2>
            <p className="mt-2 text-sm text-slate-600">{pendingCount} pending payments</p>
            <div className="absolute bottom-4 right-4 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center sm:h-8 sm:w-8">
              <svg className="h-3 w-3 text-green-600 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </article>
        </div>

        {/* Data Tables Section */}
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <section className="rounded-[2rem] bg-white p-4 shadow-soft sm:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950 sm:text-xl">Recent Payments</h3>
                <p className="mt-1 text-sm text-slate-500">Latest payment transactions and status</p>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-slate-500">Loading payment data...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-[0.24em]">
                    <tr>
                      <th className="px-4 py-3 sm:px-6">Worker</th>
                      <th className="px-4 py-3 sm:px-6">Amount</th>
                      <th className="px-4 py-3 sm:px-6">Status</th>
                      <th className="hidden px-4 py-3 sm:px-6 sm:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {payments.slice(0, 5).map((payment, index) => (
                      <tr key={payment.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-4 py-3 font-semibold text-slate-900 sm:px-6">Worker {payment.worker_id}</td>
                        <td className="px-4 py-3 sm:px-6">KES {Number(payment.amount).toLocaleString()}</td>
                        <td className="px-4 py-3 sm:px-6">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-slate-500 sm:px-6 sm:table-cell">{new Date(payment.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!payments.length && (
                  <div className="px-4 py-10 text-center text-slate-500 sm:px-6">No payment records found.</div>
                )}
              </div>
            )}
          </section>

          <aside className="rounded-[2rem] bg-white p-4 shadow-soft sm:p-6">
            <h3 className="text-lg font-semibold text-slate-950 sm:text-xl">Attendance Summary</h3>
            <p className="mt-1 text-sm text-slate-500">Worker attendance across projects</p>

            {loading ? (
              <div className="py-20 text-center text-slate-500">Loading attendance data...</div>
            ) : (
              <div className="mt-6 space-y-4">
                {attendanceSummary.slice(0, 4).map((record, index) => (
                  <div key={`${record.worker_id}-${record.project_id}`} className={`rounded-3xl border p-3 sm:p-4 ${index % 2 === 0 ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Worker {record.worker_id}</p>
                        <p className="text-xs text-slate-500">Project {record.project_id}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          {record.total_present} Present
                        </span>
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                          {record.total_absent} Absent
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {!attendanceSummary.length && (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center text-slate-500 sm:p-6">
                    No attendance records found.
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
