import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download, FileSpreadsheet, Search, Trash2, Loader2, Database } from 'lucide-react';
import clsx from 'clsx';
import sql from '../lib/db';

interface AsetData {
    id: number;
    kode_aset: string;
    no_un: string;
    kategori: string;
    sub_kategori: string;
    jenis: string;
    merk: string;
    no_rangka: string;
    no_mesin: string;
    satgas: string;
    lokasi: string;
    kondisi: string;
    pembuatan: string;
    operasi: string;
}

const DataAset = () => {
    const [data, setData] = useState<AsetData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial load and table check
    useEffect(() => {
        const initData = async () => {
            setIsLoading(true);
            try {
                // Check queries to create table if not exists with correct schema
                // Using tagged template literal syntax for Neon DB
                await sql`
                    CREATE TABLE IF NOT EXISTS data_aset (
                        id SERIAL PRIMARY KEY,
                        kode_aset TEXT,
                        no_un TEXT,
                        kategori TEXT,
                        sub_kategori TEXT,
                        jenis TEXT,
                        merk TEXT,
                        no_rangka TEXT,
                        no_mesin TEXT,
                        satgas TEXT,
                        lokasi TEXT,
                        kondisi TEXT,
                        pembuatan TEXT,
                        operasi TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    )
                `;

                // Fetch data
                const result = await sql`SELECT * FROM data_aset ORDER BY id DESC`;
                setData(result as unknown as AsetData[]);
            } catch (error: any) {
                console.error("Failed to initialize or fetch data:", error);

                // Cek apakah error karena variabel environment tidak terbaca
                if (import.meta.env.VITE_DATABASE_URL === undefined) {
                    alert("Error: Konfigurasi database belum terbaca. Coba restart server terminal.");
                } else {
                    alert(`Gagal terhubung ke database Neon: ${error.message || error}`);
                }
            } finally {
                setIsLoading(false);
            }
        };

        initData();
    }, []);

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsInitializing(true); // Reusing loading state specifically for import processing

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const jsonData = XLSX.utils.sheet_to_json(ws) as any[];

                console.log("Raw data from Excel (First row):", jsonData[0]);

                // Process data in chunks to avoid overwhelming the DB connection
                const formattedData = jsonData.map((item, index) => {
                    // Helper to normalize keys (case insensitive search)
                    const getVal = (keys: string[]) => {
                        for (let k of keys) {
                            if (item[k] !== undefined) return String(item[k]);
                            // Cek case insensitive
                            const foundKey = Object.keys(item).find(ik => ik.toLowerCase() === k.toLowerCase());
                            if (foundKey) return String(item[foundKey]);
                        }
                        return '';
                    };

                    return {
                        kode_aset: getVal(['Kode Aset', 'kode_aset', 'kode aset']),
                        no_un: getVal(['No. UN', 'no_un', 'no un']),
                        kategori: getVal(['Kategori', 'kategori']),
                        sub_kategori: getVal(['Sub Kategori', 'sub_kategori', 'sub kategori']),
                        jenis: getVal(['Jenis', 'jenis']),
                        merk: getVal(['Merk', 'merk']),
                        no_rangka: getVal(['No. Rangka', 'no_rangka', 'no rangka']),
                        no_mesin: getVal(['No. Mesin', 'no_mesin', 'no mesin']),
                        satgas: getVal(['Satgas', 'satgas']),
                        lokasi: getVal(['Lokasi', 'lokasi']),
                        kondisi: getVal(['Kondisi', 'kondisi']),
                        pembuatan: getVal(['Pembuatan', 'pembuatan', 'tahun pembuatan']),
                        operasi: getVal(['Operasi', 'operasi', 'tahun operasi']),
                    };
                });

                console.log("Formatted data (First row):", formattedData[0]);

                let successCount = 0;
                let failCount = 0;
                let lastError = "";

                for (const item of formattedData) {
                    try {
                        // Using tagged template literal for INSERT
                        // Note: values are automatically parameterized by the library
                        await sql`
                            INSERT INTO data_aset 
                            (kode_aset, no_un, kategori, sub_kategori, jenis, merk, no_rangka, no_mesin, satgas, lokasi, kondisi, pembuatan, operasi) 
                            VALUES (
                                ${item.kode_aset}, ${item.no_un}, ${item.kategori}, ${item.sub_kategori}, ${item.jenis}, 
                                ${item.merk}, ${item.no_rangka}, ${item.no_mesin}, ${item.satgas}, ${item.lokasi}, 
                                ${item.kondisi}, ${item.pembuatan}, ${item.operasi}
                            )
                        `;
                        successCount++;
                    } catch (err: any) {
                        console.error("Failed to insert row:", item, err);
                        failCount++;
                        lastError = err.message || JSON.stringify(err);
                    }
                }

                // Refresh data
                const result = await sql`SELECT * FROM data_aset ORDER BY id DESC`;
                setData(result as unknown as AsetData[]);

                if (failCount > 0) {
                    alert(`Import selesai sebagian. Berhasil: ${successCount}. Gagal: ${failCount}. Error terakhir: ${lastError}`);
                } else {
                    alert(`Berhasil mengimport ${successCount} data.`);
                }

                // Reset input
                if (fileInputRef.current) fileInputRef.current.value = '';

            } catch (error: any) {
                console.error("Import error:", error);
                alert(`Terjadi kesalahan fatal saat import: ${error.message || error}`);
            } finally {
                setIsInitializing(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleExport = () => {
        const exportData = data.map(item => ({
            'Kode Aset': item.kode_aset,
            'No. UN': item.no_un,
            'Kategori': item.kategori,
            'Sub Kategori': item.sub_kategori,
            'Jenis': item.jenis,
            'Merk': item.merk,
            'No. Rangka': item.no_rangka,
            'No. Mesin': item.no_mesin,
            'Satgas': item.satgas,
            'Lokasi': item.lokasi,
            'Kondisi': item.kondisi,
            'Pembuatan': item.pembuatan,
            'Operasi': item.operasi,
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, 'Data Aset');
        XLSX.writeFile(wb, 'Data_Aset_Export.xlsx');
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;

        try {
            await sql`DELETE FROM data_aset WHERE id = ${id}`;
            setData(data.filter(item => item.id !== id));
        } catch (error) {
            console.error("Delete error:", error);
            alert("Gagal menghapus data.");
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data di database? Tindakan ini tidak dapat dibatalkan.')) return;

        try {
            setIsLoading(true);
            await sql`DELETE FROM data_aset`;
            setData([]);
            alert("Semua data berhasil dihapus.");
        } catch (error) {
            console.error("Delete all error:", error);
            alert("Gagal menghapus semua data.");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredData = data.filter(item =>
        Object.values(item).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        Master Data Aset
                        {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                        <Database className="w-3 h-3" /> Terhubung ke Neon DB
                    </p>
                </div>
                <div className="flex gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImport}
                        accept=".xlsx, .xls"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isInitializing || isLoading}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                        {isInitializing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Import Excel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={data.length === 0 || isLoading}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export Excel
                    </button>
                    {data.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            disabled={isLoading}
                            className="flex items-center px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus Semua
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Cari data aset..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center text-sm text-gray-500 ml-auto">
                        Total Data: <span className="font-semibold text-gray-800 ml-1">{data.length}</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-3 py-3 font-bold">Kode Aset</th>
                                <th className="px-3 py-3 font-bold">No. UN</th>
                                <th className="px-3 py-3 font-bold">Kategori</th>
                                <th className="px-3 py-3 font-bold">Sub Kategori</th>
                                <th className="px-3 py-3 font-bold">Jenis</th>
                                <th className="px-3 py-3 font-bold">Merk</th>
                                <th className="px-3 py-3 font-bold">No. Rangka</th>
                                <th className="px-3 py-3 font-bold">No. Mesin</th>
                                <th className="px-3 py-3 font-bold">Satgas</th>
                                <th className="px-3 py-3 font-bold">Lokasi</th>
                                <th className="px-3 py-3 font-bold">Kondisi</th>
                                <th className="px-3 py-3 font-bold">Pembuatan</th>
                                <th className="px-3 py-3 font-bold">Operasi</th>
                                <th className="px-3 py-3 font-bold text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading && data.length === 0 ? (
                                <tr>
                                    <td colSpan={14} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                                            <p>Memuat data dari Neon DB...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.length > 0 ? (
                                filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50">
                                        <td className="px-3 py-2 font-medium text-gray-900">{item.kode_aset}</td>
                                        <td className="px-3 py-2">{item.no_un}</td>
                                        <td className="px-3 py-2">{item.kategori}</td>
                                        <td className="px-3 py-2">{item.sub_kategori}</td>
                                        <td className="px-3 py-2">{item.jenis}</td>
                                        <td className="px-3 py-2">{item.merk}</td>
                                        <td className="px-3 py-2">{item.no_rangka}</td>
                                        <td className="px-3 py-2">{item.no_mesin}</td>
                                        <td className="px-3 py-2">{item.satgas}</td>
                                        <td className="px-3 py-2">{item.lokasi}</td>
                                        <td className="px-3 py-2">
                                            <span className={clsx(
                                                "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                                                item.kondisi.toLowerCase().includes('baik') ? "bg-green-50 text-green-700 border-green-200" :
                                                    item.kondisi.toLowerCase().includes('rusak') ? "bg-red-50 text-red-700 border-red-200" :
                                                        "bg-gray-50 text-gray-700 border-gray-200"
                                            )}>
                                                {item.kondisi}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">{item.pembuatan}</td>
                                        <td className="px-3 py-2">{item.operasi}</td>
                                        <td className="px-3 py-2 text-center">
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={14} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileSpreadsheet className="w-12 h-12 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium text-gray-900">Belum ada data</p>
                                            <p className="text-sm mt-1">Silakan import data dari file Excel</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredData.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                        <div className="text-xs text-gray-500">
                            Menampilkan {filteredData.length} data aset
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataAset;
