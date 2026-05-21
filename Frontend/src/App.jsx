import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function App() {
  const [dataLogs, setDataLogs] = useState([]);
  const [latestData, setLatestData] = useState({
    ketinggian_air: 0,
    debit_air: 0,
    curah_hujan: 0,
    status: 'Mencari data...'
  });

  // DATA SIMULASI UNTUK PERBANDINGAN TIAP HARI (7 Hari Terakhir)
  const dataPerbandinganHarian = [
    { hari: 'Senin', tinggi_rata2: 1.5, tinggi_maks: 2.1 },
    { hari: 'Selasa', tinggi_rata2: 1.8, tinggi_maks: 2.5 },
    { hari: 'Rabu', tinggi_rata2: 2.2, tinggi_maks: 3.4 },
    { hari: 'Kamis', tinggi_rata2: 3.1, tinggi_maks: 4.5 },
    { hari: 'Jumat', tinggi_rata2: 2.0, tinggi_maks: 2.8 },
    { hari: 'Sabtu', tinggi_rata2: 1.4, tinggi_maks: 1.9 },
    { hari: 'Minggu', tinggi_rata2: 1.6, tinggi_maks: 2.2 },
  ];

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/sensor-data');
      const data = await response.json();
      
      if (data.length > 0) {
        setDataLogs(data);
        setLatestData(data[data.length - 1]);
      }
    } catch (error) {
      console.error('Gagal mengambil data dari API Backend:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Memperbaiki kontras warna teks dan menambahkan efek shadow glow ring
  const getStatusColor = (status) => {
    if (status === 'Siaga') {
      return 'bg-gradient-to-br from-rose-500 to-red-600 text-white animate-pulse shadow-lg shadow-red-200 border border-red-400';
    }
    if (status === 'Waspada') {
      return 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-900 shadow-lg shadow-amber-100 border border-amber-300';
    }
    return 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200 border border-emerald-400';
  };

  // Kustomisasi style untuk pop-up tooltip grafik agar lebih modern
  const customTooltipStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    border: 'none',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
    padding: '10px'
  };

  return (
   <div className="min-h-screen bg-sky-100 p-6 font-sans antialiased"> 
    <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-200/80 pb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
              Sistem Deteksi Dini & Mitigasi Banjir Real-time
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 text-xs font-bold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Monitoring
          </div>
        </div>

        {/* KARTU INDIKATOR */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          
          {/* Ketinggian Air */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/80 relative overflow-hidden transition-all hover:shadow-md">
            <div className="absolute top-0 left-0 h-1.5 w-full bg-blue-500"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ketinggian Air</p>
            <p className="text-4xl font-black text-slate-800 mt-3 tracking-tight">
              {latestData.ketinggian_air} <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">m</span>
            </p>
          </div>

          {/* Debit Air */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/80 relative overflow-hidden transition-all hover:shadow-md">
            <div className="absolute top-0 left-0 h-1.5 w-full bg-teal-500"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Debit Air</p>
            <p className="text-4xl font-black text-slate-800 mt-3 tracking-tight">
              {latestData.debit_air} <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">m³/s</span>
            </p>
          </div>

          {/* Curah Hujan */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/80 relative overflow-hidden transition-all hover:shadow-md">
            <div className="absolute top-0 left-0 h-1.5 w-full bg-purple-500"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Curah Hujan</p>
            <p className="text-4xl font-black text-slate-800 mt-3 tracking-tight">
              {latestData.curah_hujan} <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">mm</span>
            </p>
          </div>

          {/* Status Box Dengan Perbaikan Kontras Teks */}
          <div className={`p-6 rounded-2xl flex flex-col justify-center items-center font-bold uppercase transition-all duration-500 ${getStatusColor(latestData.status)}`}>
            <p className="text-[10px] font-extrabold tracking-widest uppercase opacity-75">Status Saat Ini</p>
            <p className="text-3xl font-black mt-1 tracking-wider drop-shadow-sm">{latestData.status}</p>
          </div>
          
        </div>

        {/* GRID GRAFIK UTAMA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          {/* 1. GRAFIK DEBIT AIR (DIUBAH JADI AREA CHART BIAR ADA EFEK GLOWING GRADIENT) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/80">
            <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-sm"></span> Tren Debit Air Real-time
            </h2>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataLogs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDebit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="jam" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="debit_air" name="Debit Air (m³/s)" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorDebit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. GRAFIK CURAH HUJAN (MODERN BAR CHART) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/80">
            <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm"></span> Intensitas Curah Hujan
            </h2>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataLogs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="jam" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Legend iconType="circle" />
                  <Bar dataKey="curah_hujan" name="Curah Hujan (mm)" fill="#c084fc" radius={[6, 6, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* 3. GRAFIK PERBANDINGAN MINGGUAN */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/80">
          <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm"></span> Analisis Ketinggian Air Mingguan
          </h2>
          <p className="text-[11px] font-medium text-slate-400 mb-4">*Data komparasi rata-rata vs tingkat maksimum 7 hari terakhir</p>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataPerbandinganHarian} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="hari" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend iconType="circle" />
                <Bar dataKey="tinggi_rata2" name="Tinggi Rata-rata (m)" fill="#93c5fd" radius={[6, 6, 0, 0]} maxBarSize={25} />
                <Bar dataKey="tinggi_maks" name="Tinggi Maksimum (m)" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}