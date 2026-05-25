const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Konfigurasi koneksi MySQL dinamis (Bisa baca Localhost maupun Cloud)
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', 
    database: process.env.DB_NAME || 'db_monitoring',
    port: process.env.DB_PORT || 3306
});

db.connect((err) => {
    if (err) {
        console.error('Gagal koneksi ke MySQL:', err);
        return;
    }
    console.log('Terhubung ke database MySQL XAMPP.');
    
    // Menggunakan DELETE FROM agar lebih aman dari isu permission, dan log error jika gagal
    db.query('DELETE FROM sensor_logs', (err) => {
        if (err) {
            console.error('Gagal membersihkan data lama di MySQL:', err.message);
        } else {
            console.log('Tabel sensor_logs berhasil dibersihkan (reset data lama).');
            
            // Inisialisasi 30 data harian ke belakang (Untuk grafik mingguan & tabel bulanan)
            let initTMA = 2.5; 
            for (let i = 30; i > 0; i--) {
                if (initTMA > 3.5) initTMA -= (Math.random() * 0.5); 
                else initTMA += (Math.random() * 0.4 - 0.2); 
                if (Math.random() < 0.10) initTMA += (Math.random() * 1.5); 
                if (Math.random() < 0.05) initTMA += (Math.random() * 2.0); 
                if (initTMA < 2.0) initTMA = 2.0 + Math.random() * 0.2; 
                if (initTMA > 6.0) initTMA = 6.0; 

                let initDebit = (initTMA * 22) + (Math.random() * 5 - 2.5);
                if (initDebit < 5) initDebit = 5 + Math.random() * 2;

                let curahHujan = (initTMA * 12) + (Math.random() * 8 - 4);
                if (curahHujan < 0) curahHujan = 0;
                curahHujan = parseFloat(curahHujan.toFixed(2));
                
                let status = 'Aman';
                if (initTMA >= 5.00) status = 'Awas';
                else if (initTMA >= 4.00) status = 'Siaga';
                else if (initTMA >= 3.00) status = 'Waspada';

                const query = 'INSERT INTO sensor_logs (ketinggian_air, debit_air, curah_hujan, status, created_at) VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))';
                db.query(query, [initTMA.toFixed(2), initDebit.toFixed(2), curahHujan, status, i]);
            }

            // Inisialisasi 50 data detik awal hari ini (Diperbesar ke 50 agar chart garis real-time terpenuhi)
            for (let i = 50; i > 0; i--) {
                // Mayoritas di 2.0 - 4.0 meter
                if (initTMA > 3.5) initTMA -= (Math.random() * 0.5); // Cepat surut jika tinggi
                else initTMA += (Math.random() * 0.4 - 0.2); // Fluktuasi normal
                
                if (Math.random() < 0.10) initTMA += (Math.random() * 1.5); // 10% peluang hujan deras (jarang)
                if (Math.random() < 0.05) initTMA += (Math.random() * 2.0); // 5% peluang sangat deras (Siaga/Awas)
                
                if (initTMA < 2.0) initTMA = 2.0 + Math.random() * 0.2; // JANGAN DI BAWAH 2 METER
                if (initTMA > 6.0) initTMA = 6.0; // Maksimal tinggi 6.0 meter

                // Curah Hujan dan Debit Air berbanding lurus dengan Ketinggian Air
                let initDebit = (initTMA * 22) + (Math.random() * 5 - 2.5);
                if (initDebit < 5) initDebit = 5 + Math.random() * 2;

                let curahHujan = (initTMA * 12) + (Math.random() * 8 - 4);
                if (curahHujan < 0) curahHujan = 0;
                curahHujan = parseFloat(curahHujan.toFixed(2));
                
                let status = 'Aman';
                if (initTMA >= 5.00) status = 'Awas';
                else if (initTMA >= 4.00) status = 'Siaga';
                else if (initTMA >= 3.00) status = 'Waspada';

                // DATE_SUB digunakan untuk memundurkan jam/waktu agar urutannya pas
                const query = 'INSERT INTO sensor_logs (ketinggian_air, debit_air, curah_hujan, status, created_at) VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? SECOND))';
                db.query(query, [initTMA.toFixed(2), initDebit.toFixed(2), curahHujan, status, i * 15]);
            }
            console.log('Data riwayat 30 hari & 50 data detik awal berhasil ditambahkan!');
        }
    });
});

// Simpan state sementara
let currentTMA = 2.5; 

// SIMULASI SENSOR: Generate data dummy setiap 15 detik
setInterval(() => {
    if (currentTMA > 3.5) currentTMA -= (Math.random() * 0.5); // Cepat surut jika tinggi
    else currentTMA += (Math.random() * 0.4 - 0.2); // Fluktuasi normal
    
    if (Math.random() < 0.10) currentTMA += (Math.random() * 1.5); // 10% peluang hujan deras (jarang)
    if (Math.random() < 0.05) currentTMA += (Math.random() * 2.0); // 5% peluang sangat deras (Siaga/Awas)
    
    if (currentTMA < 2.0) currentTMA = 2.0 + Math.random() * 0.2; // JANGAN DI BAWAH 2 METER
    if (currentTMA > 6.0) currentTMA = 6.0;

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

    const query = 'INSERT INTO sensor_logs (ketinggian_air, debit_air, curah_hujan, status) VALUES (?, ?, ?, ?)';
    db.query(query, [ketinggianAir, debitAir, curahHujan, status], (err, result) => {
        if (err) console.error('Gagal menyimpan data dummy:', err);
        else console.log(`Data Dummy Masuk -> Tinggi: ${ketinggianAir}m, Status: ${status}`);
    });
}, 15000);

// ENDPOINT: Ambil 50 data terakhir untuk grafik di Frontend
app.get('/api/sensor-data', (req, res) => {
    // Mengambil 50 data terbaru, lalu diurutkan dari yang terlama ke terbaru agar grafik mengalir ke kanan
    const query = `
        SELECT * FROM (
            SELECT id, ketinggian_air, debit_air, curah_hujan, status, 
                   DATE_FORMAT(created_at, '%d %b %Y') as tanggal,
                   DATE_FORMAT(created_at, '%H:%i:%s') as jam 
            FROM sensor_logs 
            ORDER BY created_at DESC LIMIT 50
        ) AS subquery ORDER BY id ASC`;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// ENDPOINT: Ambil data mingguan (7 Hari Terakhir dari MySQL)
app.get('/api/sensor-data/weekly', (req, res) => {
    const query = `
        SELECT 
            DATE(created_at) as raw_date,
            ROUND(AVG(ketinggian_air), 2) as tinggi_rata2,
            ROUND(MAX(ketinggian_air), 2) as tinggi_maks
        FROM sensor_logs
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const daysMap = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const mapped = results.map(r => {
            const d = new Date(r.raw_date);
            return { hari: daysMap[d.getDay()], tinggi_rata2: r.tinggi_rata2, tinggi_maks: r.tinggi_maks };
        });
        res.json(mapped);
    });
});

// ENDPOINT: Ambil data bulanan (30 Hari Terakhir dari MySQL)
app.get('/api/sensor-data/monthly', (req, res) => {
    const query = `
        SELECT 
            DATE(created_at) as raw_date,
            ROUND(AVG(ketinggian_air), 2) as tinggi_rata2,
            ROUND(MAX(ketinggian_air), 2) as tinggi_maks,
            ROUND(AVG(debit_air), 2) as debit_rata2,
            ROUND(AVG(curah_hujan), 2) as curah_hujan,
            MAX(ketinggian_air) as max_ketinggian
        FROM sensor_logs
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const mapped = results.map(r => {
            let status = 'Aman';
            if (r.max_ketinggian >= 5.00) status = 'Awas';
            else if (r.max_ketinggian >= 4.00) status = 'Siaga';
            else if (r.max_ketinggian >= 3.00) status = 'Waspada';
            
            const d = new Date(r.raw_date);
            const tanggalFormat = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            return { hari: tanggalFormat, tinggi_rata2: r.tinggi_rata2, tinggi_maks: r.tinggi_maks, debit_rata2: r.debit_rata2, curah_hujan: r.curah_hujan, status: status };
        });
        res.json(mapped);
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend berjalan di http://localhost:${PORT}`);
});