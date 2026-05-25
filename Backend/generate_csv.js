const fs = require('fs');
const path = require('path');

const generateCSV = () => {
    // Header CSV
    let csvContent = 'ketinggian_air,debit_air,curah_hujan,status,created_at\n';
    
    let currentTMA = 2.5;
    
    const now = Date.now();
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;

    const addRecord = (timestamp) => {
        // Logika fluktuasi air distabilkan agar banyak Aman & Waspada, jarang Siaga/Awas
        if (currentTMA > 3.5) currentTMA -= (Math.random() * 0.5 + 0.1); // Cepat surut jika di atas 3.5 meter
        else currentTMA += (Math.random() * 0.4 - 0.2); // Fluktuasi normal naik turun perlahan
        
        if (Math.random() < 0.15) currentTMA += (Math.random() * 0.8); // 15% peluang naik (Waspada/Siaga)
        if (Math.random() < 0.02) currentTMA += (Math.random() * 1.2); // 2% peluang sangat deras (Awas)
        
        if (currentTMA < 2.0) currentTMA = 2.0 + Math.random() * 0.1; // Minimal 2
        if (currentTMA > 5.0) currentTMA = 5.0; // Maksimal batas 5

        let currentDebit = (currentTMA * 22) + (Math.random() * 5 - 2.5);
        if (currentDebit < 5) currentDebit = 5 + Math.random() * 2;

        let curahHujan = (currentTMA * 12) + (Math.random() * 8 - 4);
        if (curahHujan < 0) curahHujan = 0;
        
        let status = 'Aman';
        if (currentTMA >= 5.00) status = 'Awas';
        else if (currentTMA >= 4.00) status = 'Siaga';
        else if (currentTMA >= 3.00) status = 'Waspada';

        const recordDate = new Date(timestamp - tzOffset);
        const formattedDate = recordDate.toISOString().slice(0, 19).replace('T', ' ');

        csvContent += `${currentTMA.toFixed(2)},${currentDebit.toFixed(2)},${curahHujan.toFixed(2)},${status},${formattedDate}\n`;
    };

    // 1. Generate Riwayat 30 Hari Kebelakang (1 data per jam = 720 baris) -> Untuk grafik mingguan/bulanan
    for (let i = 720; i > 0; i--) {
        addRecord(now - (i * 60 * 60 * 1000));
    }

    // 2. Generate Riwayat Hari Ini (1 data per 15 detik untuk 4 jam terakhir = 960 baris) -> Untuk grafik real-time
    for (let i = 960; i >= 0; i--) {
        addRecord(now - (i * 15 * 1000));
    }

    const filePath = path.join(__dirname, 'dummy_sensor_data.csv');
    fs.writeFileSync(filePath, csvContent);
    console.log(`Berhasil membuat file CSV riwayat 30 hari & data real-time!`);
};

generateCSV();