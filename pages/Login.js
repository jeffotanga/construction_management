import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../services/store';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(credentials);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-xl rounded-[2rem] bg-white p-10 shadow-soft">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-orange/10 text-orange text-2xl font-bold">B</div>
          <h1 className="text-3xl font-semibold text-slate-950">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to manage your construction workflows, budgets, tasks and teams.</p>
        </div>
        {error && (
          <div className="mb-4 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert" aria-live="assertive">
            {error}
          </div>
        )}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
            <label className="block text-sm font-medium text-slate-700">
              Username
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={credentials.username}
                onChange={handleChange}
                className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-orange focus:ring-1 focus:ring-orange/20"
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={credentials.password}
                onChange={handleChange}
                className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-orange focus:ring-1 focus:ring-orange/20"
                required
              />
            </label>
            <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-orange focus:ring-orange" />
                Remember me
              </label>
              <span className="text-slate-500">Need access help? Contact support.</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-slate-950 hover:text-slate-700">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
