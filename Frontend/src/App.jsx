import React, { useState, useEffect } from 'react'; 
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts'; 
import cctvImage from './assets/sungai code.png'; 

// Base URL untuk backend (VITE_API_URL ini nanti diisi domain Render di Vercel)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() { 
  const [dataLogs, setDataLogs] = useState([]); 
  const [latestData, setLatestData] = useState({ 
    ketinggian_air: 2.15, 
    debit_air: 30.8, 
    curah_hujan: 43.2, 
    status: 'Aman' 
  }); 
  const [tableType, setTableType] = useState('realtime');
  const [activePage, setActivePage] = useState('dashboard'); 
  const [scale, setScale] = useState({ x: 1, y: 1 }); 

  // State Grafik Mingguan (Fallback otomatis dipakai jika MySQL gagal / terputus)
  const [dataGrafikMingguan, setDataGrafikMingguan] = useState([ 
    { hari: 'Sen', tinggi_rata2: 2.2, tinggi_maks: 3.1 }, 
    { hari: 'Sel', tinggi_rata2: 2.1, tinggi_maks: 2.5 }, 
    { hari: 'Rab', tinggi_rata2: 2.5, tinggi_maks: 3.8 }, 
    { hari: 'Kam', tinggi_rata2: 3.2, tinggi_maks: 4.8 }, 
    { hari: 'Jum', tinggi_rata2: 2.8, tinggi_maks: 3.5 }, 
    { hari: 'Sab', tinggi_rata2: 2.3, tinggi_maks: 2.9 }, 
    { hari: 'Min', tinggi_rata2: 2.0, tinggi_maks: 2.4 }, 
  ]); 

  // State Tabel Bulanan
  const [dataTabelBulanan, setDataTabelBulanan] = useState(() => {
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      let rata2 = Math.random() * 1.0 + 2.0; // Rata-rata normal 2.0 - 3.0 meter
      let maks = rata2 + Math.random() * 1.0;
      if (Math.random() < 0.10) maks += Math.random() * 2.5; // Sesekali spike karena hujan (bisa Siaga/Awas)
      if (maks > 6.0) maks = 6.0; // Batas mentok absolut 6.0 meter
      
      let status = 'Aman';
      if (maks >= 5.00) status = 'Awas';
      else if (maks >= 4.00) status = 'Siaga';
      else if (maks >= 3.00) status = 'Waspada';

      let rataDebit = (rata2 * 22) + (Math.random() * 5 - 2.5);
      if (rataDebit < 5) rataDebit = 5 + Math.random() * 2;
      
      let rataHujan = (rata2 * 12) + (Math.random() * 8 - 4);
      if (rataHujan < 0) rataHujan = 0;

      const d = new Date(today);
      d.setDate(today.getDate() - (29 - i));
      const tanggalFormat = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

      return {
        hari: tanggalFormat,
        tinggi_rata2: parseFloat(rata2.toFixed(2)),
        tinggi_maks: parseFloat(maks.toFixed(2)),
        debit_rata2: parseFloat(rataDebit.toFixed(2)),
        curah_hujan: parseFloat(rataHujan.toFixed(2)),
        status: status
      };
    });
  });

  const fetchData = async () => { 
    try { 
      const response = await fetch(`${API_URL}/api/sensor-data`); 
      const data = await response.json(); 
      if (data.length > 0) { 
        setDataLogs(data); 
        const lastRecord = data[data.length - 1]; 
        setLatestData({ 
          ketinggian_air: lastRecord.ketinggian_air || 2.15, 
          debit_air: lastRecord.debit_air || 30.8, 
          curah_hujan: lastRecord.curah_hujan || 43.2, 
          status: lastRecord.status || 'Aman' 
        }); 
      } 
        
        // Fetch Data Mingguan dari Database
        const resWeekly = await fetch(`${API_URL}/api/sensor-data/weekly`); 
        const dataWeekly = await resWeekly.json(); 
        if (dataWeekly.length > 0) setDataGrafikMingguan(dataWeekly); 

        // Fetch Data Bulanan dari Database
        const resMonthly = await fetch(`${API_URL}/api/sensor-data/monthly`); 
        const dataMonthly = await resMonthly.json(); 
        if (dataMonthly.length > 0) setDataTabelBulanan(dataMonthly); 
    } catch (error) { 
      console.warn('Backend tidak terhubung, menjalankan simulasi indikator lokal...'); 
      
      setLatestData(prev => {
        let newTMA = prev.ketinggian_air;
        
        // Mayoritas di 2.0 - 4.0 meter (Aman/Waspada)
        if (newTMA > 3.5) newTMA -= (Math.random() * 0.5); 
        else newTMA += (Math.random() * 0.4 - 0.2); 
        
        if (Math.random() < 0.10) newTMA += (Math.random() * 1.5); // Peluang Siaga
        if (Math.random() < 0.05) newTMA += (Math.random() * 2.0); // Peluang Awas
        
        if (newTMA < 2.0) newTMA = 2.0 + Math.random() * 0.2; // JANGAN DI BAWAH 2 METER
        if (newTMA > 6.0) newTMA = 6.0;

        let status = 'Aman';
        if (newTMA >= 5.00) status = 'Awas';
        else if (newTMA >= 4.00) status = 'Siaga';
        else if (newTMA >= 3.00) status = 'Waspada';

        let newDebit = (newTMA * 22) + (Math.random() * 5 - 2.5);
        if (newDebit < 5) newDebit = 5 + Math.random() * 2;
        
        let newHujan = (newTMA * 12) + (Math.random() * 8 - 4);
        if (newHujan < 0) newHujan = 0;

        const newData = {
          ketinggian_air: parseFloat(newTMA.toFixed(2)),
          debit_air: parseFloat(newDebit.toFixed(2)),
          curah_hujan: parseFloat(newHujan.toFixed(2)),
          status: status
        };

        setDataLogs(prevLogs => {
          const now = new Date();
          const jam = now.toLocaleTimeString('id-ID', { hour12: false });
          const newLog = { ...newData, jam, tanggal: now.toLocaleDateString('id-ID') };
          const updatedLogs = [...prevLogs, newLog];
          return updatedLogs.length > 50 ? updatedLogs.slice(updatedLogs.length - 50) : updatedLogs;
        });

        return newData;
      });
    } 
  }; 

  useEffect(() => { 
    fetchData(); 
    const interval = setInterval(fetchData, 15000); 
    return () => clearInterval(interval); 
  }, []); 

  useEffect(() => { 
    const handleResize = () => { 
      const scaleX = window.innerWidth / 1920; 
      const scaleY = window.innerHeight / 1080; 
      setScale({ x: scaleX, y: scaleY }); 
    }; 
    handleResize(); 
    setTimeout(() => { 
      window.dispatchEvent(new Event('resize')); 
    }, 100); 
    window.addEventListener('resize', handleResize); 
    return () => window.removeEventListener('resize', handleResize); 
  }, []); 

  const getStatusTheme = () => { 
    const status = latestData.status; 
    // Hitung angle secara dinamis (0-180 derajat) berdasarkan ketinggian air maksimal 6.0 meter
    const angle = Math.min(180, Math.max(0, (latestData.ketinggian_air / 6.0) * 180));
    if (status === 'Awas') { 
      return { color: '#ef4444', bg: 'bg-red-500', angle }; 
    } else if (status === 'Siaga') { 
      return { color: '#f97316', bg: 'bg-orange-500', angle }; 
    } else if (status === 'Waspada') { 
      return { color: '#eab308', bg: 'bg-yellow-500', angle }; 
    } 
    return { color: '#84cc16', bg: 'bg-lime-500', angle }; 
  }; 

  const currentTheme = getStatusTheme(); 

  const customTooltipStyle = { 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    borderRadius: '8px', 
    border: '1px solid #e2e8f0', 
    padding: '6px' 
  }; 

  const CustomTooltip = ({ active, payload, label }) => { 
    if (active && payload && payload.length) { 
      return ( 
        <div style={customTooltipStyle} className="text-[10px] font-bold text-slate-700 shadow-md"> 
          <p className="text-slate-400 mb-0.5">{label}</p> 
          {payload.map((entry, index) => ( 
            <p key={index} style={{ color: entry.color }}> 
              {entry.name}: {entry.value} 
            </p> 
          ))} 
        </div> 
      ); 
    } 
    return null; 
  }; 

  // Fungsi untuk berpindah ke halaman tabel saat grafik diklik
  const handleChartClick = (e, type) => {
    setTableType(type);
    setActivePage('table');
  };

  return ( 
    <div className="w-screen h-screen flex items-center justify-center bg-slate-900 overflow-hidden"> 
      <div 
        className="w-[1920px] h-[1080px] relative bg-gradient-to-b from-cyan-700 via-teal-400 via-[73%] to-green-200 overflow-hidden shadow-2xl shrink-0" 
        style={{ transform: `scale(${scale.x}, ${scale.y})`, transformOrigin: 'center' }} 
      > 
        <style> 
          {`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Inter:wght@400;700&display=swap');`} 
        </style> 

        {/* ================= JUDUL UTAMA ================= */} 
        <div className="w-[882.51px] h-96 left-[195px] top-[-87px] absolute text-center justify-center text-white text-6xl font-extrabold font-['Poppins'] [text-shadow:_0px_4px_4px_rgb(0_0_0_/_0.25)] flex items-center select-none"> 
          Hydroguard Interactive 
        </div> 

        {/* ================= HEADER CONTROLS (SEARCH & MENU) ================= */} 
        {/* Hamburger Menu Icon */}
        <div className="w-9 h-6 left-[156.40px] top-[212px] absolute flex flex-col justify-between cursor-pointer">
          <span className="w-full h-[5px] bg-white rounded-full"></span>
          <span className="w-full h-[5px] bg-white rounded-full"></span>
          <span className="w-full h-[5px] bg-white rounded-full"></span>
        </div>
        
        {/* Dashboard Search Bar Area */}
        <div className="w-[808.85px] h-20 left-[231px] top-[184.15px] absolute bg-white/20 rounded-[43.76px] flex items-center justify-between px-10 border border-white/10 shadow-lg"> 
          <span className="text-white text-xl font-bold font-['Poppins'] tracking-widest opacity-90">DASHBOARD SUNGAI CODE</span> 
          {/* Sesuai Gambar image_65f3a3.png kaca pembesar figma baru */}
          <div className="flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
            <svg className="w-8 h-8 text-white font-black" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div> 
        
        {/* Avatar Icon */}
        <div className="w-10 h-14 left-[1076.39px] top-[200.42px] absolute bg-cyan-700/50 border border-white/25 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform overflow-hidden"> 
          <svg className="w-6 h-6 text-white/80 mt-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5-3-8-3z"/></svg> 
        </div> 

        {/* ================= PANEL UTAMA KIRI (CONTAINER GRAFIK) ================= */} 
        <div className="w-[1153px] h-[715px] left-[81px] top-[321px] absolute bg-gradient-to-b from-white/20 to-sky-100/20 to-72% rounded-3xl shadow-[0px_4.606557369232178px_4.606557369232178px_0px_rgba(0,0,0,0.25)] backdrop-blur-sm"></div> 

        {/* 1. CARD BLOCK: ANALISIS MINGGUAN BAR CHART */} 
        <div className="w-[505.42px] h-[628.80px] left-[136.18px] top-[363px] absolute bg-gradient-to-b from-white to-sky-100 rounded-xl shadow-lg overflow-hidden flex flex-col justify-between pb-4"> 
          <div className="w-[505.60px] h-5 bg-teal-400"></div> 
          <div className="px-5 pt-3"> 
            <div className="w-full text-black text-lg font-normal font-['Poppins'] leading-5 font-bold opacity-60"> 
              Analisis Ketinggian dan Debit Air Mingguan
            </div> 
          </div> 
          
          <div 
            className="flex-1 px-6 mt-4 space-y-4 flex flex-col justify-center cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => handleChartClick(null, 'mingguan')}
          > 
            {/* Grafik Atas */} 
            <div className="w-full h-44"> 
              <ResponsiveContainer width="100%" height="100%"> 
                <BarChart 
                  data={dataGrafikMingguan} 
                  barCategoryGap="20%" 
                  margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
                > 
                  <XAxis dataKey="hari" tickLine={false} axisLine={false} stroke="#000" fontSize={11} fontStyle="normal" fontFamily="Poppins" /> 
                  <YAxis hide /> 
                  <Tooltip content={<CustomTooltip />} /> 
                  <Bar dataKey="tinggi_rata2" stackId="a" fill="#2dd4bf" maxBarSize={48} radius={[4, 4, 0, 0]} /> 
                  <Bar dataKey="tinggi_maks" stackId="a" fill="#7c3aed" maxBarSize={48} radius={[4, 4, 0, 0]} /> 
                </BarChart> 
              </ResponsiveContainer> 
            </div> 

            {/* Grafik Bawah */} 
            <div className="w-full h-44"> 
              <ResponsiveContainer width="100%" height="100%"> 
                <BarChart 
                  data={dataGrafikMingguan} 
                  barCategoryGap="20%" 
                  margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
                > 
                  <XAxis dataKey="hari" tickLine={false} axisLine={false} stroke="#000" fontSize={11} fontStyle="normal" fontFamily="Poppins" /> 
                  <YAxis hide /> 
                  <Tooltip content={<CustomTooltip />} /> 
                  <Bar dataKey="tinggi_rata2" stackId="b" fill="#2dd4bf" maxBarSize={48} radius={[4, 4, 0, 0]} /> 
                  <Bar dataKey="tinggi_maks" stackId="b" fill="#f87171" maxBarSize={48} radius={[4, 4, 0, 0]} /> 
                </BarChart> 
              </ResponsiveContainer> 
            </div> 
          </div> 

          <div className="px-5 flex gap-6 items-center mb-2"> 
            <div className="flex items-center gap-1.5"> 
              <div className="w-5 h-4 bg-linear-221 from-red-400 to-orange-200 rounded-xs border border-black/10"></div> 
              <span className="text-black text-[8.25px] font-semibold font-['Poppins']">Ketinggian Air (m)</span> 
            </div> 
            <div className="flex items-center gap-1.5"> 
              <div className="w-5 h-4 bg-linear-221 from-violet-900 to-fuchsia-700 rounded-xs border border-black/10"></div> 
              <span className="text-black text-[8.25px] font-semibold font-['Poppins']">Debit Air (m³/s)</span> 
            </div> 
          </div> 
        </div> 

        {/* 2. CARD BLOCK: INTENSITAS CURAH HUJAN */} 
        <div 
          className="w-[506.36px] h-72 left-[673px] top-[368.20px] absolute bg-gradient-to-b from-white via-white to-sky-100 rounded-xl shadow-lg overflow-hidden p-6 cursor-pointer hover:scale-105 transition-transform"
          onClick={() => handleChartClick(null, 'curah_hujan')}
        > 
          <div className="w-[506.53px] h-5 left-0 top-0 absolute bg-teal-600"></div> 
          <div className="text-black text-lg font-normal font-['Poppins'] leading-4 opacity-60">Intensitas Curah Hujan</div> 
          <div className="text-black text-7xl font-bold font-['Poppins'] mt-4">{latestData.curah_hujan.toString().replace('.', ',')}</div> 
          <div className="text-black text-2xl font-bold font-['Inter'] mt-1 flex items-center gap-2"> 
            Naik 20% 
            <div className="w-9 h-6 bg-red-400 rounded flex items-center justify-center text-white text-sm">▲</div> 
          </div> 
          <div className="text-black text-lg font-normal font-['Inter'] mt-8">Curah Hujan Perhari</div> 
          <div className="w-full h-4 bg-teal-400 rounded-full overflow-hidden mt-2 relative"> 
            <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-400 to-orange-200 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (latestData.curah_hujan / 100) * 100)}%` }}></div> 
          </div> 
        </div> 

        {/* 3. CARD BLOCK: TREN DEBIT AIR REAL-TIME */} 
        <div 
          className="w-[506.36px] h-80 left-[673px] top-[663.02px] absolute bg-gradient-to-b from-white to-sky-100 rounded-xl shadow-lg overflow-hidden p-6 cursor-pointer hover:scale-105 transition-transform"
          onClick={() => handleChartClick(null, 'debit')}
        > 
          <div className="w-[506.53px] h-5 left-0 top-0 absolute bg-cyan-700"></div> 
          <div className="text-black text-lg font-normal font-['Poppins'] leading-4 opacity-60 mb-2">Tren Debit Air Real-Time</div> 
          <div className="w-full h-48 relative mt-2"> 
            <ResponsiveContainer width="100%" height="100%"> 
              <LineChart data={dataLogs} margin={{ top: 15, right: 15, left: -30, bottom: 15 }}> 
                <defs> 
                  <linearGradient id="curveGradient" x1="0" y1="0" x2="1" y2="0"> 
                    <stop offset="0%" stopColor="#4c1d95" /> 
                    <stop offset="40%" stopColor="#a855f7" /> 
                    <stop offset="70%" stopColor="#f43f5e" /> 
                    <stop offset="100%" stopColor="#fdba74" /> 
                  </linearGradient> 
                </defs> 
                <CartesianGrid stroke="#000000" strokeWidth={1.5} horizontal={false} opacity={0.8} /> 
                <XAxis dataKey="jam" tickLine={false} axisLine={false} stroke="#000" fontSize={8.44} fontStyle="bold" fontFamily="Inter" /> 
                <YAxis hide domain={[0, 70]} /> 
                <Tooltip content={<CustomTooltip />} /> 
                <Line type="monotone" dataKey="debit_air" stroke="url(#curveGradient)" strokeWidth={3.5} dot={false} /> 
              </LineChart> 
            </ResponsiveContainer> 
          </div> 
        </div> 

        {/* ================= PANEL UTAMA KANAN (MONITORING PANEL LOKASI) ================= */} 
        <div className="w-[571.96px] h-[980.05px] left-[1262.04px] top-[56.95px] absolute bg-gradient-to-b from-white to-sky-100 rounded-3xl shadow-2xl border border-white p-6 flex flex-col justify-between"> 
          {/* CONTAINER PREVIEW IMAGE SUNGAI */} 
          <div className="relative w-[498.77px] h-96 rounded-xl overflow-hidden shadow-md mx-auto"> 
            <img className="w-full h-full object-cover" src={cctvImage} alt="Sungai Code" /> 
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6"> 
              <div className="text-white text-3xl font-bold font-['Poppins'] leading-tight">Sungai Code, Sinduadi</div> 
              <div className="text-white text-xl font-semibold font-['Poppins'] mt-1">Minggu, 24 Mei 2026</div> 
            </div> 
          </div> 

          {/* AREA METER INDIKATOR GAUGE */} 
          <div 
            className="flex flex-col items-center justify-center flex-1 py-6 relative cursor-pointer hover:scale-105 transition-transform"
            onClick={() => handleChartClick(null, 'realtime')}
          > 
            <div className="relative w-80 h-40 overflow-hidden flex items-end justify-center"> 
              <svg className="w-full h-full absolute top-0 left-0" viewBox="0 0 100 50"> 
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#conicGaugeGradient)" strokeWidth="10" strokeLinecap="round" /> 
                <defs> 
                  <linearGradient id="conicGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%"> 
                    <stop offset="0%" stopColor="#84cc16" /> 
                    <stop offset="50%" stopColor="#eab308" /> 
                    <stop offset="66%" stopColor="#f97316" /> 
                    <stop offset="83%" stopColor="#ef4444" /> 
                  </linearGradient> 
                </defs> 
              </svg> 
              {/* Jarum Pointer Utama Dinamis sesuai GetStatusTheme */} 
              <div 
                className="absolute w-[74px] h-1.5 bg-black rounded-full origin-right transition-transform duration-1000 flex items-center" 
                style={{ transform: `rotate(${currentTheme.angle}deg)`, right: '50%', bottom: '0px' }} 
              >
                {/* Desain Kepala Anak Panah Sesuai Gambar Ketiga */}
                <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[12px] border-r-black absolute left-0" style={{ stroke: currentTheme.color }}></div>
              </div> 
              <div className="size-3.5 bg-black rounded-full absolute bottom-[-4px] z-10"></div> 
            </div> 
            {/* Teks Range Skala Ukur */}
            <div className="w-80 flex justify-between text-base font-semibold font-['Poppins'] text-black mt-2 px-1"> 
              <span>0</span> <span>1.5</span> <span>3.0</span> <span>4.5</span> <span>6.0</span> 
            </div> 
            {/* Tombol Kotak Status Dinamis */} 
            <div key={latestData.status} className={`w-[384px] h-20 ${currentTheme.bg} rounded-xl flex items-center justify-center shadow-md mt-6 transition-colors duration-500 animate-in fade-in zoom-in duration-500`}> 
              <span className="text-white text-2xl font-bold font-['Poppins'] tracking-wider drop-shadow-md"> 
                {latestData.status === 'Mencari data...' ? 'Aman' : latestData.status} 
              </span> 
            </div> 
          </div> 

          {/* ================= 3 PANEL METRIK MINI DI BAGIAN BAWAH ================= */} 
          <div className="grid grid-cols-3 gap-4 px-2 justify-items-center"> 
            {/* Card Ketinggian */} 
            <div 
              className="w-36 h-32 bg-white border border-slate-100 rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between p-3 pb-2 text-left cursor-pointer hover:scale-105 transition-transform"
              onClick={() => handleChartClick(null, 'ketinggian')}
            > 
              <div className="w-36 h-5 bg-teal-400 absolute top-0 left-0"></div> 
              <span className="text-black text-lg font-normal font-['Poppins'] leading-tight opacity-60 mt-4 block">Ketinggian Air</span> 
              <div className="w-full flex items-baseline justify-between mt-1 gap-1">
                <span key={latestData.ketinggian_air} className="text-3xl font-semibold font-['Poppins'] text-black tracking-tighter truncate animate-in fade-in slide-in-from-bottom-2 duration-500">{latestData.ketinggian_air.toString().replace('.', ',')}</span> 
                <span className="text-black text-sm font-semibold font-['Poppins'] shrink-0">m</span> 
              </div>
            </div> 

            {/* Card Debit */} 
            <div 
              className="w-36 h-32 bg-white border border-slate-100 rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between p-3 pb-2 text-left cursor-pointer hover:scale-105 transition-transform"
              onClick={() => handleChartClick(null, 'debit')}
            > 
              <div className="w-36 h-5 bg-teal-600 absolute top-0 left-0"></div> 
              <span className="text-black text-base font-normal font-['Poppins'] leading-tight opacity-60 mt-4 block">Debit Air</span> 
              <div className="w-full flex items-baseline justify-between mt-1 gap-1">
                <span key={latestData.debit_air} className="text-3xl font-semibold font-['Poppins'] text-black tracking-tighter truncate animate-in fade-in slide-in-from-bottom-2 duration-500">{latestData.debit_air.toString().replace('.', ',')}</span> 
                <span className="text-black text-sm font-semibold font-['Poppins'] shrink-0">m³/s</span> 
              </div>
            </div> 

            {/* Card Hujan */} 
            <div 
              className="w-36 h-32 bg-white border border-slate-100 rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between p-3 pb-2 text-left cursor-pointer hover:scale-105 transition-transform"
              onClick={() => handleChartClick(null, 'curah_hujan')}
            > 
              <div className="w-36 h-5 bg-cyan-700 absolute top-0 left-0"></div> 
              <span className="text-black text-base font-normal font-['Poppins'] leading-tight opacity-60 mt-4 block">Curah Hujan</span> 
              <div className="w-full flex items-baseline justify-between mt-1 gap-1">
                <span key={latestData.curah_hujan} className="text-3xl font-semibold font-['Poppins'] text-black tracking-tighter truncate animate-in fade-in slide-in-from-bottom-2 duration-500">{latestData.curah_hujan.toString().replace('.', ',')}</span> 
                <span className="text-black text-sm font-semibold font-['Poppins'] shrink-0">mm</span> 
              </div>
            </div> 
          </div> 
        </div> 

        {/* ================= HALAMAN TABEL DETAIL ================= */} 
        {activePage === 'table' && (
          <div className="absolute inset-0 z-50 bg-[#01798B] flex flex-col p-16 animate-in fade-in duration-200">
            {/* Bagian Header Tabel */}
            <div className="flex justify-between items-center mb-8">
               <div className="flex items-center gap-4">
                 <div className="w-3 h-12 bg-teal-400 rounded-full"></div>
                 <h1 className="text-5xl font-extrabold text-white font-['Poppins'] drop-shadow-md">
                   Data Riwayat {tableType === 'mingguan' ? '30 Hari Terakhir' : 
                                 tableType === 'realtime' ? 'Keseluruhan (Real-Time)' : 
                                 tableType === 'ketinggian' ? 'Ketinggian Air' :
                                 tableType === 'debit' ? 'Debit Air' : 
                                 'Curah Hujan'}
                 </h1>
               </div>
               <button
                 onClick={() => setActivePage('dashboard')}
                 className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold font-['Poppins'] backdrop-blur border border-white/20 transition-all shadow-lg flex items-center gap-2"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                 Kembali ke Dashboard
               </button>
            </div>

            {/* Container Tabel dengan Scroll */}
            <div className="flex-1 bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
               <div className="overflow-y-auto flex-1 p-0">
                 <table className="w-full text-left border-collapse font-['Poppins']">
                   <thead className="sticky top-0 bg-teal-600 shadow-md z-10">
                     <tr className="text-white text-xl">
                       {tableType === 'mingguan' ? (
                         <>
                           <th className="p-6 font-semibold">Tanggal</th>
                           <th className="p-6 font-semibold">Ketinggian Rata-rata (m)</th>
                           <th className="p-6 font-semibold">Ketinggian Maks. (m)</th>
                           <th className="p-6 font-semibold">Debit Rata-rata (m³/s)</th>
                           <th className="p-6 font-semibold">Curah Hujan (mm)</th>
                           <th className="p-6 font-semibold">Status (Maks)</th>
                         </>
                       ) : (
                         <>
                           <th className="p-6 font-semibold">No</th>
                           <th className="p-6 font-semibold">Tanggal</th>
                           <th className="p-6 font-semibold">Jam</th>
                           {(tableType === 'realtime' || tableType === 'ketinggian') && <th className="p-6 font-semibold">Ketinggian (m)</th>}
                           {(tableType === 'realtime' || tableType === 'debit') && <th className="p-6 font-semibold">Debit Air (m³/s)</th>}
                           {(tableType === 'realtime' || tableType === 'curah_hujan') && <th className="p-6 font-semibold">Curah Hujan (mm)</th>}
                           <th className="p-6 font-semibold">Status</th>
                         </>
                       )}
                     </tr>
                   </thead>
                   <tbody>
                     {tableType === 'mingguan' ? (
                      dataTabelBulanan.map((row, idx) => (
                         <tr key={idx} className="border-b border-slate-200 hover:bg-teal-50 transition-colors text-lg text-slate-700">
                           <td className="p-6 font-bold text-slate-600 whitespace-nowrap">{row.hari}</td>
                           <td className="p-6">{row.tinggi_rata2}</td>
                           <td className="p-6 font-semibold text-teal-600">{row.tinggi_maks}</td>
                           <td className="p-6 font-semibold text-violet-600">{row.debit_rata2}</td>
                           <td className="p-6 font-semibold text-sky-600">{row.curah_hujan}</td>
                           <td className="p-6">
                             <span className={`px-4 py-2 rounded-full text-sm font-bold text-white shadow-sm ${row.status === 'Awas' ? 'bg-red-500' : row.status === 'Siaga' ? 'bg-orange-500' : row.status === 'Waspada' ? 'bg-yellow-500' : 'bg-lime-500'}`}>
                               {row.status}
                             </span>
                           </td>
                         </tr>
                       ))
                     ) : (
                       [...dataLogs].reverse().map((log, idx) => (
                         <tr key={idx} className="border-b border-slate-200 hover:bg-teal-50 transition-colors text-lg text-slate-700">
                           <td className="p-6 font-bold text-slate-400">{idx + 1}</td>
                           <td className="p-6">{log.tanggal}</td>
                           <td className="p-6">{log.jam}</td>
                           {(tableType === 'realtime' || tableType === 'ketinggian') && <td className="p-6 font-semibold text-teal-600">{log.ketinggian_air}</td>}
                           {(tableType === 'realtime' || tableType === 'debit') && <td className="p-6 font-semibold text-violet-600">{log.debit_air}</td>}
                           {(tableType === 'realtime' || tableType === 'curah_hujan') && <td className="p-6 font-semibold text-sky-600">{log.curah_hujan}</td>}
                           <td className="p-6">
                             <span className={`px-4 py-2 rounded-full text-sm font-bold text-white ${log.status === 'Awas' ? 'bg-red-500' : log.status === 'Siaga' ? 'bg-orange-500' : log.status === 'Waspada' ? 'bg-yellow-500' : 'bg-lime-500'}`}>
                               {log.status}
                             </span>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}
      </div> 
    </div> 
  ); 
}