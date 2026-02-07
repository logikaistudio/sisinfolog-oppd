import { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Upload, Download, FileSpreadsheet, Search, Trash2, Loader2, Database, Filter, X } from 'lucide-react';
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
    const [searchParams, setSearchParams] = useSearchParams();
    const conditionParam = searchParams.get('condition');

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

        setIsInitializing(true);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const jsonData = XLSX.utils.sheet_to_json(ws) as any[];

                const formattedData = jsonData.map((item) => {
                    const getVal = (keys: string[]) => {
                        for (let k of keys) {
                            if (item[k] !== undefined) return String(item[k]);
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

                let successCount = 0;
                let failCount = 0;
                let lastError = "";

                for (const item of formattedData) {
                    try {
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

                const result = await sql`SELECT * FROM data_aset ORDER BY id DESC`;
                setData(result as unknown as AsetData[]);

                if (failCount > 0) {
                    alert(`Import selesai sebagian. Berhasil: ${successCount}. Gagal: ${failCount}. Error terakhir: ${lastError}`);
                } else {
                    alert(`Berhasil mengimport ${successCount} data.`);
                }

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
        const exportData = filteredData.map(item => ({
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
        XLSX.writeFile(wb, `Data_Aset_${conditionParam || 'All'}.xlsx`);
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

    // Advanced Filtering Logic
    const filteredData = useMemo(() => {
        return data.filter(item => {
            // Search Filter
            const matchesSearch = Object.values(item).some(val =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            );

            // Condition Filter
            let matchesCondition = true;
            if (conditionParam) {
                // Normalize both: remove punct check if includes
                const cond = (item.kondisi || '').toLowerCase();
                const filter = conditionParam.toLowerCase().replace('.', '');

                // Specific checks for common variations
                if (filter.includes('rr') && filter.includes('tdk')) {
                    // RR TDK OPS
                    matchesCondition = cond.includes('tdk') || cond.includes('tidak');
                } else if (filter.includes('rr') && !filter.includes('tdk')) {
                    // RR OPS (exclude TDK)
                    matchesCondition = (cond.includes('rr') || cond.includes('ringan')) && !(cond.includes('tdk') || cond.includes('tidak'));
                } else if (filter === 'rb' || filter.includes('berat')) {
                    matchesCondition = cond === 'rb' || cond.includes('berat');
                } else {
                    matchesCondition = cond.includes(filter);
                }
            }

            return matchesSearch && matchesCondition;
        });
    }, [data, searchTerm, conditionParam]);

    // Summary Statistics
    const summary = useMemo(() => {
        if (!conditionParam || filteredData.length === 0) return null;

        const byCategory: Record<string, number> = {};
        const byMerk: Record<string, number> = {};

        filteredData.forEach(item => {
            const cat = item.kategori || 'Tanpa Kategori';
            byCategory[cat] = (byCategory[cat] || 0) + 1;

            const merk = item.merk || 'Tanpa Merk';
            byMerk[merk] = (byMerk[merk] || 0) + 1;
        });

        // Sort by count desc
        const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
        const sortedMerks = Object.entries(byMerk).sort((a, b) => b[1] - a[1]);

        return {
            total: filteredData.length,
            byCategory: sortedCats,
            byMerk: sortedMerks
        };
    }, [filteredData, conditionParam]);

    const clearConditionFilter = () => {
        setSearchParams({});
    };

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
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm font-medium"
                    >
                        {isInitializing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Import Excel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={data.length === 0 || isLoading}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export Excel
                    </button>
                    {data.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            disabled={isLoading}
                            className="flex items-center px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition disabled:opacity-50 text-sm font-medium"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus Semua
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Panel */}
            {summary && (
                <div className="bg-blue-50/50 rounded-xl mb-6 border border-blue-100 p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-blue-900 text-lg flex items-center gap-2">
                            <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                            Ringkasan Aset: Kondisi {conditionParam}
                        </h3>
                        <button
                            onClick={clearConditionFilter}
                            className="text-xs flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors bg-white px-2 py-1 rounded shadow-sm border border-gray-100 hover:border-red-200"
                        >
                            <X className="w-3 h-3" /> Hapus Filter
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Total Card */}
                        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-center items-center">
                            <span className="text-sm text-gray-500 font-medium">Total Unit</span>
                            <span className="text-4xl font-extrabold text-blue-600">{summary.total}</span>
                            <span className="text-xs text-blue-400 font-medium mt-1">Data Terfilter</span>
                        </div>

                        {/* Category Breakdown */}
                        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-bold text-gray-700 text-xs uppercase mb-3 border-b border-gray-100 pb-1">Top Kategori</h4>
                                <ul className="text-sm space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                    {summary.byCategory.slice(0, 10).map(([cat, count]) => (
                                        <li key={cat} className="flex justify-between items-center group">
                                            <span className="text-gray-600 truncate max-w-[70%] text-xs font-medium group-hover:text-blue-600 transition-colors">{cat}</span>
                                            <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">{count}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-700 text-xs uppercase mb-3 border-b border-gray-100 pb-1">Top Merk</h4>
                                <ul className="text-sm space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                    {summary.byMerk.slice(0, 10).map(([merk, count]) => (
                                        <li key={merk} className="flex justify-between items-center group">
                                            <span className="text-gray-600 truncate max-w-[70%] text-xs font-medium group-hover:text-blue-600 transition-colors">{merk}</span>
                                            <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">{count}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50/30">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Cari data aset..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {conditionParam && (
                        <div className="flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
                            <Filter className="w-3 h-3 mr-2" />
                            Filter Aktif: {conditionParam}
                        </div>
                    )}
                    <div className="flex items-center text-sm text-gray-500 ml-auto bg-white px-3 py-1 rounded border border-gray-200">
                        Total Data: <span className="font-bold text-gray-800 ml-1">{filteredData.length}</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 font-extrabold sticky left-0 bg-gray-50 z-10 w-12 text-center border-r border-gray-200">No</th>
                                <th className="px-4 py-3 font-bold whitespace-nowrap">Kode Aset</th>
                                <th className="px-4 py-3 font-bold whitespace-nowrap">No. UN</th>
                                <th className="px-4 py-3 font-bold whitespace-nowrap">Kategori</th>
                                <th className="px-4 py-3 font-bold whitespace-nowrap">Sub Kategori</th>
                                <th className="px-4 py-3 font-bold whitespace-nowrap">Jenis</th>
                                <th className="px-4 py-3 font-bold whitespace-nowrap">Merk</th>
                                <th className="px-4 py-3 font-bold whitespace-nowrap">No. Rangka</th>
                                <th className="px-4 py-3 font-bold whitespace-nowrap">No. Mesin</th>
                                <th className="px-4 py-3 font-bold whitespace-nowrap">Satgas</th>
                                <th className="px-4 py-3 font-bold whitespace-nowrap">Lokasi</th>
                                <th className="px-4 py-3 font-bold whitespace-nowrap text-center">Kondisi</th>
                                <th className="px-4 py-3 font-bold whitespace-nowrap text-center">Pembuatan</th>
                                <th className="px-4 py-3 font-bold whitespace-nowrap text-center">Operasi</th>
                                <th className="px-4 py-3 font-bold text-center sticky right-0 bg-gray-50 z-10 border-l border-gray-200">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading && data.length === 0 ? (
                                <tr>
                                    <td colSpan={15} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                                            <p>Memuat data dari Neon DB...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.length > 0 ? (
                                filteredData.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-4 py-3 text-center border-r border-gray-100 sticky left-0 bg-white group-hover:bg-blue-50/30">{index + 1}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{item.kode_aset}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-500">{item.no_un}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{item.kategori}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-500">{item.sub_kategori}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{item.jenis}</td>
                                        <td className="px-4 py-3 whitespace-nowrap font-medium">{item.merk}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-500 font-mono text-[10px]">{item.no_rangka}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-500 font-mono text-[10px]">{item.no_mesin}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-200">
                                                {item.satgas}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-500">{item.lokasi}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={clsx(
                                                "px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide",
                                                item.kondisi.toLowerCase().includes('baik') ? "bg-green-50 text-green-700 border-green-200" :
                                                    item.kondisi.toLowerCase().includes('rusak') || item.kondisi.toLowerCase() === 'rb' ? "bg-red-50 text-red-700 border-red-200" :
                                                        "bg-yellow-50 text-yellow-700 border-yellow-200"
                                            )}>
                                                {item.kondisi}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-500 font-mono text-xs">{item.pembuatan}</td>
                                        <td className="px-4 py-3 text-center text-gray-500 font-mono text-xs">{item.operasi}</td>
                                        <td className="px-4 py-3 text-center sticky right-0 bg-white group-hover:bg-blue-50/30 border-l border-gray-100">
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                                                title="Hapus Data"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={15} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileSpreadsheet className="w-12 h-12 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium text-gray-900">Tidak ada data ditemukan</p>
                                            <p className="text-sm mt-1 text-gray-400">Silakan sesuaikan filter pencarian atau import data baru</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredData.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                            Menampilkan 1 - {filteredData.length} dari {filteredData.length} data
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataAset;
