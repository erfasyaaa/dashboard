const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mencegah browser melakukan cache pada API
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    next();
});

// Load data dari CSV ke memori
const csvFilePath = path.join(__dirname, 'dummy_sensor_data.csv');
let sensorLogs = [];

const loadCSVData = () => {
    try {
        let needsRegeneration = false;
        if (!fs.existsSync(csvFilePath)) {
            needsRegeneration = true;
        } else {
            const checkContent = fs.readFileSync(csvFilePath, 'utf-8');
            const checkLines = checkContent.trim().split('\n');
            // Jika baris kurang dari 1500, berarti file CSV masih versi lama (cuma 1 hari)
            if (checkLines.length < 1500) {
                needsRegeneration = true;
            }
        }

        // Self-Healing: Otomatis generate ulang data CSV tanpa perlu ketik manual
        if (needsRegeneration) {
            console.log('⚠️ File CSV tidak ada atau masih versi lama (riwayat kurang dari 30 hari).');
            console.log('⏳ Mengeksekusi ulang generate_csv.js secara otomatis...');
            const { execSync } = require('child_process');
            execSync('node generate_csv.js', { stdio: 'inherit' });
        }

        const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
        const lines = fileContent.trim().split('\n');
        
        sensorLogs = []; // Pastikan array kosong sebelum memuat
        for (let i = 1; i < lines.length; i++) { // Skip header
            const line = lines[i].trim();
            if (!line) continue;
            
            const [ketinggian_air, debit_air, curah_hujan, status, created_at] = line.split(',');
            // Ganti spasi dengan huruf 'T' agar format string menjadi ISO 8601 standar
            const safeDate = created_at.replace(' ', 'T'); 
            sensorLogs.push({
                id: i,
                ketinggian_air: parseFloat(ketinggian_air),
                debit_air: parseFloat(debit_air),
                curah_hujan: parseFloat(curah_hujan),
                status: status,
                created_at: new Date(safeDate) 
            });
        }
        console.log(`Berhasil memuat ${sensorLogs.length} data dari CSV ke memori.`);
    } catch (error) {
        console.error('Gagal membaca file CSV:', error);
    }
};

loadCSVData();

let currentId = sensorLogs.length > 0 ? sensorLogs[sensorLogs.length - 1].id + 1 : 1;
let currentTMA = sensorLogs.length > 0 ? sensorLogs[sensorLogs.length - 1].ketinggian_air : 2.5; 

// SIMULASI SENSOR: Generate data dummy setiap 15 detik
setInterval(() => {
    if (currentTMA > 3.5) currentTMA -= (Math.random() * 0.5 + 0.1); // Cepat surut jika tinggi
    else currentTMA += (Math.random() * 0.4 - 0.2); // Fluktuasi normal
    
    if (Math.random() < 0.15) currentTMA += (Math.random() * 0.8); // 15% peluang hujan deras
    if (Math.random() < 0.02) currentTMA += (Math.random() * 1.2); // 2% peluang sangat deras
    
    if (currentTMA < 2.0) currentTMA = 2.0 + Math.random() * 0.1; // Minimal 2
    if (currentTMA > 5.0) currentTMA = 5.0; // Maksimal batas 5

    let currentDebit = (currentTMA * 22) + (Math.random() * 5 - 2.5);
    if (currentDebit < 5) currentDebit = 5 + Math.random() * 2;

    const ketinggianAir = parseFloat(currentTMA.toFixed(2));
    const debitAir = parseFloat(currentDebit.toFixed(2));
    
    let curahHujan = (currentTMA * 12) + (Math.random() * 8 - 4);
    if (curahHujan < 0) curahHujan = 0;
    curahHujan = parseFloat(curahHujan.toFixed(2));

    let status = 'Aman';
    if (ketinggianAir >= 5.00) {
        status = 'Awas';
    } else if (ketinggianAir >= 4.00) {
        status = 'Siaga';
    } else if (ketinggianAir >= 3.00) {
        status = 'Waspada';
    }

    const now = new Date();
    
    // Simpan ke array
    sensorLogs.push({
        id: currentId++,
        ketinggian_air: ketinggianAir,
        debit_air: debitAir,
        curah_hujan: curahHujan,
        status: status,
        created_at: now
    });

    // Format timestamp untuk CSV (mirip format MySQL Timestamp: YYYY-MM-DD HH:MM:SS)
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localNow = new Date(Date.now() - tzOffset);
    const formattedDate = localNow.toISOString().slice(0, 19).replace('T', ' ');
    
    // Tambahkan baris baru ke file CSV secara otomatis
    const newCsvLine = `${ketinggianAir},${debitAir},${curahHujan},${status},${formattedDate}\n`;
    if (fs.existsSync(csvFilePath)) {
        fs.appendFile(csvFilePath, newCsvLine, (err) => {
            if (err) console.error('Gagal menyimpan ke file CSV:', err);
        });
    }
    
    console.log(`Data Dummy Masuk -> Tinggi: ${ketinggianAir}m, Status: ${status}`);
}, 15000);

// Helper format tanggal seperti format asli backend
const formatTanggal = (date) => {
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const formatJam = (date) => {
    const d = new Date(date);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
};

// Helper untuk Group by Date
const groupByDate = (logs) => {
    const grouped = {};
    logs.forEach(log => {
        const d = new Date(log.created_at);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!grouped[dateKey]) {
            grouped[dateKey] = { date: d, ketinggian_air: [], debit_air: [], curah_hujan: [] };
        }
        grouped[dateKey].ketinggian_air.push(log.ketinggian_air);
        grouped[dateKey].debit_air.push(log.debit_air);
        grouped[dateKey].curah_hujan.push(log.curah_hujan);
    });
    return Object.values(grouped).sort((a, b) => a.date - b.date);
};

// ENDPOINT: Ambil 50 data terakhir untuk grafik di Frontend
app.get('/api/sensor-data', (req, res) => {
    const last50 = sensorLogs.slice(-50);
    const results = last50.map(log => ({
        ...log,
        tanggal: formatTanggal(log.created_at),
        jam: formatJam(log.created_at)
    }));
    res.json(results);
});

// ENDPOINT: Ambil data mingguan (7 Hari Terakhir dari CSV)
app.get('/api/sensor-data/weekly', (req, res) => {
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(new Date().getDate() - 6);
    sixDaysAgo.setHours(0,0,0,0);

    const filtered = sensorLogs.filter(log => log.created_at >= sixDaysAgo);
    const grouped = groupByDate(filtered);
    const daysMap = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    
    const mapped = grouped.map(g => {
        const avgTinggi = g.ketinggian_air.reduce((a, b) => a + b, 0) / g.ketinggian_air.length;
        const maxTinggi = Math.max(...g.ketinggian_air);
        return { hari: daysMap[g.date.getDay()], tinggi_rata2: parseFloat(avgTinggi.toFixed(2)), tinggi_maks: parseFloat(maxTinggi.toFixed(2)) };
    });
    res.json(mapped);
});

// ENDPOINT: Ambil data bulanan (30 Hari Terakhir dari CSV)
app.get('/api/sensor-data/monthly', (req, res) => {
    const twentyNineDaysAgo = new Date();
    twentyNineDaysAgo.setDate(new Date().getDate() - 29);
    twentyNineDaysAgo.setHours(0,0,0,0);

    const filtered = sensorLogs.filter(log => log.created_at >= twentyNineDaysAgo);
    let grouped = groupByDate(filtered);
    grouped.reverse(); // Urutkan terbaru ke terlama sesuai query asli MySQL

    const mapped = grouped.map(g => {
            const max_ketinggian = Math.max(...g.ketinggian_air);
            let status = 'Aman';
            if (max_ketinggian >= 5.00) status = 'Awas';
            else if (max_ketinggian >= 4.00) status = 'Siaga';
            else if (max_ketinggian >= 3.00) status = 'Waspada';
            
            const avgTinggi = g.ketinggian_air.reduce((a, b) => a + b, 0) / g.ketinggian_air.length;
            const avgDebit = g.debit_air.reduce((a, b) => a + b, 0) / g.debit_air.length;
            const avgHujan = g.curah_hujan.reduce((a, b) => a + b, 0) / g.curah_hujan.length;
            
            const tanggalFormat = g.date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            
            return { 
                hari: tanggalFormat, 
                tinggi_rata2: parseFloat(avgTinggi.toFixed(2)), 
                tinggi_maks: parseFloat(max_ketinggian.toFixed(2)), 
                debit_rata2: parseFloat(avgDebit.toFixed(2)), 
                curah_hujan: parseFloat(avgHujan.toFixed(2)), 
                status: status 
            };
    });
    res.json(mapped);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend berjalan di http://localhost:${PORT}`);
});