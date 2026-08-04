import React from 'react';

export default function Dashboard() {
  // Dummy data
  const projects = [
    { id: 1, name: 'Sistem Absensi Next.js', role: 'Frontend Dev', status: 'Active' },
    { id: 2, name: 'Analisis Data Freelance', role: 'Data Analyst', status: 'Completed' },
    { id: 3, name: 'UI/UX Redesign', role: 'Designer', status: 'Active' }
  ];
  
  const stats = [
    { label: 'Total Jam Kerja', value: '45 Jam' },
    { label: 'Proyek Aktif', value: '2' },
    { label: 'Kehadiran', value: '98%' }
  ];

  return (
    <main className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Dashboard Absensi</h1>
      <p className="text-gray-600 mb-8">Halo, Leonard Manurung! Berikut adalah ringkasan waktu kerjamu dan daftar aktivitas saat ini.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">{stat.label}</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-4">Daftar Proyek & Aktivitas</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 font-medium text-gray-600">Nama Proyek</th>
              <th className="p-4 font-medium text-gray-600">Peran</th>
              <th className="p-4 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(proj => (
              <tr key={proj.id} className="border-t border-gray-100">
                <td className="p-4 font-medium">{proj.name}</td>
                <td className="p-4 text-gray-600">{proj.role}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${proj.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {proj.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}