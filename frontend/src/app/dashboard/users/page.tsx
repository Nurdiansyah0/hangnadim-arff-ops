"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  nik: string;
  email: string;
  role_id: number;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", nik: "", email: "", password: "", role_id: 6 });

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to add user");
      fetchUsers(); // refresh
      setForm({ name: "", nik: "", email: "", password: "", role_id: 6 });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Manajemen Personel</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="bg-white p-6 rounded shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Tambah Personel Baru</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
          <input type="text" placeholder="Nama" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border p-2 rounded w-full" required />
          <input type="text" placeholder="NIK" value={form.nik} onChange={e => setForm({...form, nik: e.target.value})} className="border p-2 rounded w-full" required />
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="border p-2 rounded w-full" required />
          <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="border p-2 rounded w-full" required />
          
          <select value={form.role_id} onChange={e => setForm({...form, role_id: Number(e.target.value)})} className="border p-2 rounded w-full">
            <option value={1}>Manager ARFF</option>
            <option value={2}>Team Leader Shift</option>
            <option value={3}>Team Leader Performance</option>
            <option value={4}>Team Leader Maintenance</option>
            <option value={5}>Watchroom</option>
            <option value={6}>Firefighter</option>
            <option value={7}>Admin</option>
          </select>
          
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white p-2 rounded font-semibold">Tugaskan Personel</button>
        </form>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3">Nama</th>
              <th className="p-3">NIK</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role ID</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.nik}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
