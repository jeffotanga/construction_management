import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../services/store';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', first_name: '', last_name: '' });
  const [error, setError] = useState('');
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white p-10 shadow-soft">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-orange/10 text-orange text-2xl font-bold">B</div>
          <h1 className="text-3xl font-semibold text-slate-950">Create an account</h1>
          <p className="mt-2 text-sm text-slate-500">Register to access your construction dashboard and start managing your team.</p>
        </div>
        {error && (
          <div className="mb-4 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert" aria-live="assertive">
            {error}
          </div>
        )}
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="block text-sm text-slate-700">
              First name
              <input
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange focus:ring-1 focus:ring-orange/20"
                required
              />
            </label>
            <label className="block text-sm text-slate-700">
              Last name
              <input
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange focus:ring-1 focus:ring-orange/20"
                required
              />
            </label>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="block text-sm text-slate-700">
              Username
              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange focus:ring-1 focus:ring-orange/20"
                required
              />
            </label>
            <label className="block text-sm text-slate-700">
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange focus:ring-1 focus:ring-orange/20"
                required
              />
            </label>
          </div>
          <label className="block text-sm text-slate-700">
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange focus:ring-1 focus:ring-orange/20"
              required
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-slate-950 hover:text-slate-700">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
