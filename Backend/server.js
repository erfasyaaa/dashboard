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
});

// SIMULASI SENSOR: Generate data dummy setiap 5 detik
setInterval(() => {
    // Math.random() untuk mengacak nilai sensor
    const ketinggianAir = parseFloat((Math.random() * (5.0 - 0.5) + 0.5).toFixed(2)); // 0.5m - 5.0m
    const debitAir = parseFloat((ketinggianAir * 12.5).toFixed(2)); // Simulasi rasio debit dibanding tinggi air
    const curahHujan = parseFloat((Math.random() * (100 - 0) + 0).toFixed(2)); // 0mm - 100mm

    // Logika menentukan status kewaspadaan
    let status = 'Aman';
    if (ketinggianAir > 4.0 || curahHujan > 75) {
        status = 'Siaga';
    } else if (ketinggianAir > 2.5 || curahHujan > 40) {
        status = 'Waspada';
    }

    const query = 'INSERT INTO sensor_logs (ketinggian_air, debit_air, curah_hujan, status) VALUES (?, ?, ?, ?)';
    db.query(query, [ketinggianAir, debitAir, curahHujan, status], (err, result) => {
        if (err) console.error('Gagal menyimpan data dummy:', err);
        else console.log(`Data Dummy Masuk -> Tinggi: ${ketinggianAir}m, Status: ${status}`);
    });
}, 5000);

// ENDPOINT: Ambil 15 data terakhir untuk grafik di Frontend
app.get('/api/sensor-data', (req, res) => {
    // Mengambil 15 data terbaru, lalu diurutkan dari yang terlama ke terbaru agar grafik mengalir ke kanan
    const query = `
        SELECT * FROM (
            SELECT id, ketinggian_air, debit_air, curah_hujan, status, 
                   DATE_FORMAT(created_at, '%H:%i:%s') as jam 
            FROM sensor_logs 
            ORDER BY created_at DESC LIMIT 15
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