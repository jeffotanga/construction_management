import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { workerService, projectService, paymentService } from '../services/api';

const Payments = () => {
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [form, setForm] = useState({ worker_id: '', project_id: '', amount: '', method: 'mpesa', transaction_reference: '', status: 'pending', bank_name: '', account_number: '', bank_reference: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayments = async () => {
      setLoading(true);
      try {
        const [workerRes, projectRes, paymentRes] = await Promise.all([workerService.getAll(), projectService.getAll(), paymentService.getAll()]);
        setWorkers(workerRes.data || []);
        setProjects(projectRes.data || []);
        setPayments(paymentRes.data || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to load payments');
      } finally {
        setLoading(false);
      }
    };
    loadPayments();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.worker_id || !form.project_id || !form.amount || !form.transaction_reference) {
      setError('Worker, project, amount and reference are required.');
      return;
    }

    try {
      const response = await paymentService.create(form);
      setPayments((prev) => [response.data, ...prev]);
      setForm({ worker_id: '', project_id: '', amount: '', method: 'mpesa', transaction_reference: '', status: 'pending', bank_name: '', account_number: '', bank_reference: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to record payment');
    }
  };

  const totals = payments.reduce(
    (acc, payment) => {
      acc.total += Number(payment.amount);
      if (payment.status === 'paid') acc.paid += 1;
      if (payment.status === 'pending') acc.pending += 1;
      if (payment.status === 'failed') acc.failed += 1;
      return acc;
    },
    { total: 0, paid: 0, pending: 0, failed: 0 }
  );

  return (
    <AppLayout title="Payments" subtitle="Track wage payments, status and generation flows">
      <div className="space-y-6">
        {error && <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Total spending</p>
            <p className="mt-4 text-3xl font-semibold text-slate-950">KES {totals.total.toLocaleString()}</p>
            <p className="mt-2 text-sm text-slate-500">All worker payments recorded</p>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Paid</p>
            <p className="mt-4 text-3xl font-semibold text-slate-950">{totals.paid}</p>
            <p className="mt-2 text-sm text-slate-500">Completed payments</p>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Pending</p>
            <p className="mt-4 text-3xl font-semibold text-slate-950">{totals.pending}</p>
            <p className="mt-2 text-sm text-slate-500">Awaiting confirmation</p>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <article className="rounded-[2rem] bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-slate-950">Payment ledger</h2>
            <p className="mt-2 text-sm text-slate-500">Review payment records, filter by worker or project, and maintain financial accuracy.</p>
            <div className="mt-6 space-y-3">
              {loading ? (
                <div className="py-12 text-center text-slate-500">Loading payments...</div>
              ) : payments.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">No payment records available.</div>
              ) : (
                payments.map((payment) => (
                  <div key={payment.id} className="rounded-3xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-950">Worker {payment.worker_id}</p>
                        <p className="mt-1 text-sm text-slate-500">Project {payment.project_id}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">{payment.status}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-4 text-sm text-slate-700">
                      <span>KES {Number(payment.amount).toLocaleString()}</span>
                      <span>{payment.method.toUpperCase()}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">Ref: {payment.transaction_reference}</p>
                  </div>
                ))
              )}
            </div>
          </article>

          <aside className="rounded-[2rem] bg-white p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-slate-950">Record payment</h3>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
              <label className="block text-sm text-slate-700">
                Amount (KES)
                <input name="amount" type="number" value={form.amount} onChange={handleChange} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400" />
              </label>
              <label className="block text-sm text-slate-700">
                Method
                <select name="method" value={form.method} onChange={handleChange} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400">
                  <option value="mpesa">M-Pesa</option>
                  <option value="airtel">Airtel Money</option>
                  <option value="bank">Bank</option>
                </select>
              </label>
              <label className="block text-sm text-slate-700">
                Transaction reference
                <input name="transaction_reference" value={form.transaction_reference} onChange={handleChange} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400" />
              </label>
              {form.method === 'bank' && (
                <>
                  <label className="block text-sm text-slate-700">
                    Bank name
                    <input name="bank_name" value={form.bank_name} onChange={handleChange} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400" />
                  </label>
                  <label className="block text-sm text-slate-700">
                    Account number
                    <input name="account_number" value={form.account_number} onChange={handleChange} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400" />
                  </label>
                  <label className="block text-sm text-slate-700">
                    Bank reference
                    <input name="bank_reference" value={form.bank_reference} onChange={handleChange} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400" />
                  </label>
                </>
              )}
              <button type="submit" className="w-full rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Submit payment</button>
            </form>
          </aside>
        </section>
      </div>
    </AppLayout>
  );
};

export default Payments;
