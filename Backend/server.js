const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Konfigurasi koneksi MySQL ke XAMPP
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Default XAMPP dikosongkan
    database: 'db_monitoring'
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
            
            // Inisialisasi 20 data awal
            let initTMA = 2.5; 
            for (let i = 20; i > 0; i--) {
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
            console.log('20 data riwayat awal berhasil ditambahkan!');
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

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Backend berjalan di http://localhost:${PORT}`);
});