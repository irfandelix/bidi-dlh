const fs = require('fs');
let code = fs.readFileSync('src/app/pengawasan/mobile/FormBAP.tsx', 'utf-8');

code = code.replace(/Promise\.resolve\(localStorage\.getItem\((.*?)\);/g, 'Promise.resolve(localStorage.getItem($1));');
code = code.replace(/Promise\.resolve\(localStorage\.removeItem\((.*?)\);/g, 'Promise.resolve(localStorage.removeItem($1));');

// Replace complex Alert
code = code.replace(/Alert\.alert\(\s*'Sukses!',\s*'Form BAP tersimpan dan Link GDrive berhasil dibuat\.',[\s\S]*?\]\s*\);/g, `
    const isShare = window.confirm('Sukses! Form BAP tersimpan dan Link GDrive berhasil dibuat.\\n\\nKlik OK untuk Bagikan ke WA, atau Cancel untuk tutup.');
    if (isShare) {
        const text = \`Berikut adalah BAP Pengawasan Lapangan. Silakan unduh/cetak melalui tautan berikut:\\n\\n\${gdriveLink}\`;
        window.open(\`https://api.whatsapp.com/send?text=\${encodeURIComponent(text)}\`, '_blank');
    }
    setScreen('info');
`);

code = code.replace(/Alert\.alert\('Sukses', 'Form BAP berhasil disimpan[\\s\\S]*?\]\);/g, `
    alert('Sukses: Form BAP berhasil disimpan (namun gagal membuat Link GDrive, silakan cek dashboard web).');
    setScreen('info');
`);

code = code.replace(/Alert\.alert\('Mode Offline', 'Koneksi internet bermasalah[\\s\\S]*?\]\);/g, `
    alert('Mode Offline: Koneksi internet bermasalah. Data BAP telah disimpan sebagai Draft di HP Anda. Harap buka kembali agenda ini saat terhubung ke internet dan klik "Simpan & Selesai" untuk sinkronisasi.');
    setScreen('info');
`);

code = code.replace(/Alert\.alert\('Error Sinkronisasi', 'Gagal menyimpan draft: ' \+ e\.message\);/g, `
    alert('Error Sinkronisasi: Gagal menyimpan draft: ' + e.message);
`);

// One more alert
code = code.replace(/Alert\.alert\('Izin Ditolak', 'Aplikasi butuh izin kamera untuk mengambil foto\.'\);/g, `
    alert('Izin Ditolak: Aplikasi butuh izin kamera untuk mengambil foto.');
`);

fs.writeFileSync('src/app/pengawasan/mobile/FormBAP.tsx', code);
