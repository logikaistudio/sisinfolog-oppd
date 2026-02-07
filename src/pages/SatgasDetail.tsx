import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Loader2, Database, Download, Box, Layers, Truck, Wrench, AlertTriangle, XOctagon, X, Save, Trash2, Send, Edit, FileText, UserCheck, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import clsx from 'clsx';
import sql from '../lib/db';
import { SATGAS_DATA } from '../data/mockData';

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

const SatgasDetail = () => {
    const { type } = useParams<{ type: string }>();
    const decodedType = decodeURIComponent(type || '');
    const [data, setData] = useState<AsetData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Modal & Selection State
    const [selectedAsset, setSelectedAsset] = useState<AsetData | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // Controls Read-Only vs Edit in Detail Modal
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState<AsetData | null>(null);

    // Repair Form State
    const [repairForm, setRepairForm] = useState({
        jenis_kerusakan: 'Ringan',
        deskripsi: '',
        jenis_pengajuan: 'Perbaikan',
        tanggal: new Date().toISOString().split('T')[0],
        pelapor_nama: '',
        pelapor_nrp: '',
        menyetujui_nama: '',
        menyetujui_nrp: ''
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const targetNames = SATGAS_DATA
                .filter(s => s.type === decodedType)
                .map(s => s.name.toLowerCase());

            if (!targetNames.includes(decodedType.toLowerCase())) {
                targetNames.push(decodedType.toLowerCase());
            }

            const result = await sql`SELECT * FROM data_aset ORDER BY id DESC`;
            const allData = result as unknown as AsetData[];

            const filtered = allData.filter(item => {
                const s = (item.satgas || '').toLowerCase();
                return targetNames.some(t => s.includes(t));
            });

            // Auto-sort by Pembuatan (Descending)
            filtered.sort((a, b) => {
                const yearA = String(a.pembuatan || '');
                const yearB = String(b.pembuatan || '');
                return yearB.localeCompare(yearA, undefined, { numeric: true });
            });

            setData(filtered);
        } catch (error) {
            console.error("Failed to fetch satgas data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (decodedType) {
            fetchData();
        }
    }, [decodedType]);

    const handleRowClick = (asset: AsetData) => {
        setSelectedAsset(asset);
        setEditForm({ ...asset });
        setIsEditing(false); // Default to Read Only
        setIsDetailModalOpen(true);
    };

    const handleInputDetailChange = (field: keyof AsetData, value: string) => {
        if (editForm) {
            setEditForm({ ...editForm, [field]: value });
        }
    };

    const handleOpenRepairModal = () => {
        if (selectedAsset) {
            setIsDetailModalOpen(false); // Close detail modal
            // Reset repair form
            setRepairForm({
                jenis_kerusakan: 'Ringan',
                deskripsi: '',
                jenis_pengajuan: 'Perbaikan',
                tanggal: new Date().toISOString().split('T')[0],
                pelapor_nama: '',
                pelapor_nrp: '',
                menyetujui_nama: '',
                menyetujui_nrp: ''
            });
            setIsRepairModalOpen(true);
        }
    };

    const handleSubmitRepair = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        alert(`Pengajuan ${repairForm.jenis_pengajuan} untuk aset ${selectedAsset?.kode_aset} berhasil dikirim!`);
        setIsSaving(false);
        setIsRepairModalOpen(false);
    };

    const handleUpdateAsset = async () => {
        if (!editForm) return;
        setIsSaving(true);
        try {
            await sql`
                UPDATE data_aset 
                SET kode_aset = ${editForm.kode_aset},
                    no_un = ${editForm.no_un},
                    kategori = ${editForm.kategori},
                    sub_kategori = ${editForm.sub_kategori},
                    jenis = ${editForm.jenis},
                    merk = ${editForm.merk},
                    no_rangka = ${editForm.no_rangka},
                    no_mesin = ${editForm.no_mesin},
                    satgas = ${editForm.satgas},
                    lokasi = ${editForm.lokasi},
                    kondisi = ${editForm.kondisi},
                    pembuatan = ${editForm.pembuatan},
                    operasi = ${editForm.operasi}
                WHERE id = ${editForm.id}
            `;
            await fetchData();
            alert("Data berhasil diperbarui!");
            setIsDetailModalOpen(false);
        } catch (error) {
            console.error("Error updating asset:", error);
            alert("Gagal memperbarui data.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAsset = async () => {
        if (!editForm || !window.confirm("Yakin hapus aset ini permanently?")) return;
        setIsSaving(true);
        try {
            await sql`DELETE FROM data_aset WHERE id = ${editForm.id}`;
            await fetchData();
            alert("Aset dihapus.");
            setIsDetailModalOpen(false);
        } catch (e) {
            console.error(e);
            alert("Gagal hapus.");
        } finally {
            setIsSaving(false);
        }
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
        XLSX.writeFile(wb, `Data_Aset_${decodedType.replace(/\s+/g, '_')}.xlsx`);
    };

    const filteredData = data.filter(item =>
        Object.values(item).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    // Calculate Summary Stats
    const stats = useMemo(() => {
        let summary = {
            total: data.length,
            kategori: new Set(data.map(d => d.kategori).filter(Boolean)).size,
            baik: 0,
            rr_ops: 0,
            rr_t_ops: 0,
            rb: 0
        };

        data.forEach(item => {
            const k = (item.kondisi || '').toLowerCase();
            if (k.includes('baik')) {
                summary.baik++;
            } else if (k.includes('berat') || k === 'rb') {
                summary.rb++;
            } else if (k.includes('ringan') || k.includes('rr')) {
                if (k.includes('tidak') || k.includes('t ops') || k.includes('tdk')) {
                    summary.rr_t_ops++;
                } else {
                    summary.rr_ops++;
                }
            } else {
                if (k) summary.rr_ops++; // Fallback
            }
        });

        return summary;
    }, [data]);

    const StatBox = ({ title, value, icon: Icon, colorClass }: any) => (
        <div className={`p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between ${colorClass.split(' ')[0]} bg-opacity-30`}>
            <div>
                <p className="text-xs text-gray-600 font-bold uppercase tracking-wide">{title}</p>
                <h3 className="text-xl font-extrabold text-gray-900 mt-1">{value}</h3>
            </div>
            <div className={`p-2.5 rounded-lg bg-white/60`}>
                <Icon className={`w-6 h-6 ${colorClass.split(' ')[1]}`} />
            </div>
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        {decodedType}
                        {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                        <Database className="w-3 h-3" /> Asset Inventory & Status
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        disabled={data.length === 0 || isLoading}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* Summary Boxes */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatBox title="Total Aset" value={stats.total} icon={Box} colorClass="bg-gray-100 text-gray-600" />
                <StatBox title="Total Kategori" value={stats.kategori} icon={Layers} colorClass="bg-purple-100 text-purple-600" />
                <StatBox title="Baik" value={stats.baik} icon={Truck} colorClass="bg-blue-100 text-blue-600" />
                <StatBox title="RR OPS" value={stats.rr_ops} icon={Wrench} colorClass="bg-green-100 text-emerald-600" />
                <StatBox title="RR TDK OPS" value={stats.rr_t_ops} icon={AlertTriangle} colorClass="bg-orange-100 text-orange-600" />
                <StatBox title="RB" value={stats.rb} icon={XOctagon} colorClass="bg-red-200 text-red-800" />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Cari aset..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center text-sm text-gray-500 ml-auto">
                        Total Aset: <span className="font-semibold text-gray-800 ml-1">{data.length}</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="text-xs text-white uppercase bg-gray-500 border-b border-gray-500">
                            <tr>
                                <th className="px-3 py-3 font-bold">Kode Aset</th>
                                <th className="px-3 py-3 font-bold">No. UN</th>
                                <th className="px-3 py-3 font-bold">Kategori</th>
                                <th className="px-3 py-3 font-bold">Sub Kategori</th>
                                <th className="px-3 py-3 font-bold">Jenis</th>
                                <th className="px-3 py-3 font-bold">Lokasi</th>
                                <th className="px-3 py-3 font-bold">Kondisi</th>
                                <th className="px-3 py-3 font-bold">Pembuatan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading && data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                                            <p>Memuat data...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.length > 0 ? (
                                filteredData.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                                        onClick={() => handleRowClick(item)}
                                    >
                                        <td className="px-3 py-2 font-medium text-gray-900">{item.kode_aset}</td>
                                        <td className="px-3 py-2">{item.no_un}</td>
                                        <td className="px-3 py-2">{item.kategori}</td>
                                        <td className="px-3 py-2">{item.sub_kategori}</td>
                                        <td className="px-3 py-2">{item.jenis}</td>
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
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        Tidak ada data.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DETAIL MODAL (Read-Only by Default) */}
            {isDetailModalOpen && editForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    {isEditing ? <Edit className="w-5 h-5 text-primary" /> : <FileText className="w-5 h-5 text-gray-500" />}
                                    {isEditing ? 'Edit Data Aset' : 'Detail Aset'}
                                </h3>
                                <p className="text-sm text-gray-500">{isEditing ? 'Perbarui informasi aset' : 'Informasi lengkap aset (Read Only)'}</p>
                            </div>
                            <div className="flex gap-2">
                                {!isEditing && (
                                    <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200">
                                        Edit Data
                                    </button>
                                )}
                                <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 bg-white border border-gray-200">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Disabled Inputs when !isEditing */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900 border-b pb-2">Informasi Aset</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Kode Aset</label>
                                            <input type="text" disabled value={editForm.kode_aset} className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">No. UN</label>
                                            <input type="text" disabled={!isEditing} value={editForm.no_un} onChange={(e) => handleInputDetailChange('no_un', e.target.value)} className={clsx("w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none", !isEditing && "bg-gray-50 text-gray-600")} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Kategori</label>
                                        <input type="text" disabled={!isEditing} value={editForm.kategori} onChange={(e) => handleInputDetailChange('kategori', e.target.value)} className={clsx("w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none", !isEditing && "bg-gray-50 text-gray-600")} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Sub Kategori</label>
                                        <input type="text" disabled={!isEditing} value={editForm.sub_kategori} onChange={(e) => handleInputDetailChange('sub_kategori', e.target.value)} className={clsx("w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none", !isEditing && "bg-gray-50 text-gray-600")} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Jenis</label>
                                        <input type="text" disabled={!isEditing} value={editForm.jenis} onChange={(e) => handleInputDetailChange('jenis', e.target.value)} className={clsx("w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none", !isEditing && "bg-gray-50 text-gray-600")} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900 border-b pb-2">Detail Teknis</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Merk</label>
                                            <input type="text" disabled={!isEditing} value={editForm.merk} onChange={(e) => handleInputDetailChange('merk', e.target.value)} className={clsx("w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none", !isEditing && "bg-gray-50 text-gray-600")} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Kondisi</label>
                                            {isEditing ? (
                                                <select value={editForm.kondisi} onChange={(e) => handleInputDetailChange('kondisi', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                                                    <option>Baik</option>
                                                    <option>Rusak Ringan</option>
                                                    <option>Rusak Berat</option>
                                                </select>
                                            ) : (
                                                <div className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 font-semibold ${editForm.kondisi.toLowerCase().includes('baik') ? 'text-green-600' : 'text-red-600'}`}>{editForm.kondisi}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Lokasi Satgas</label>
                                            <input type="text" disabled={!isEditing} value={editForm.satgas} onChange={(e) => handleInputDetailChange('satgas', e.target.value)} className={clsx("w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none", !isEditing && "bg-gray-50 text-gray-600")} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Lokasi Detail</label>
                                            <input type="text" disabled={!isEditing} value={editForm.lokasi} onChange={(e) => handleInputDetailChange('lokasi', e.target.value)} className={clsx("w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none", !isEditing && "bg-gray-50 text-gray-600")} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <button
                                        onClick={handleOpenRepairModal}
                                        className="flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 rounded-xl text-sm font-bold shadow-lg shadow-orange-200 transition-all transform hover:-translate-y-0.5"
                                    >
                                        <Wrench className="w-4 h-4 mr-2" />
                                        Ajukan Perbaikan (Harwat)
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isEditing && (
                                        <>
                                            <button
                                                onClick={handleDeleteAsset}
                                                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-semibold flex items-center"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" /> Hapus
                                            </button>
                                            <button
                                                onClick={handleUpdateAsset}
                                                disabled={isSaving}
                                                className="px-6 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg text-sm font-semibold shadow flex items-center"
                                            >
                                                <Save className="w-4 h-4 mr-2" /> Simpan
                                            </button>
                                        </>
                                    )}
                                    {!isEditing && (
                                        <button onClick={() => setIsDetailModalOpen(false)} className="px-6 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-semibold transition-colors">
                                            Tutup
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* REPAIR MODAL */}
            {isRepairModalOpen && selectedAsset && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-orange-50 p-6 border-b border-orange-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-orange-900 flex items-center gap-2">
                                    <Wrench className="w-5 h-5 text-orange-600" /> Form Pengajuan Perbaikan
                                </h3>
                                <p className="text-sm text-orange-700 mt-1">Isi form berikut untuk mengajukan ticket harwat</p>
                            </div>
                            <button onClick={() => setIsRepairModalOpen(false)} className="p-2 hover:bg-orange-100 rounded-full text-orange-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitRepair} className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Read Only Asset Info */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-xs text-gray-500 font-semibold mb-0.5">Kode Aset</div>
                                    <div className="font-bold text-gray-800">{selectedAsset.kode_aset}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 font-semibold mb-0.5">Satgas / Lokasi</div>
                                    <div className="font-medium text-gray-800">{selectedAsset.satgas} / {selectedAsset.lokasi}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 font-semibold mb-0.5">Kategori / Sub</div>
                                    <div className="font-medium text-gray-800">{selectedAsset.kategori} - {selectedAsset.sub_kategori}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 font-semibold mb-0.5">Kondisi Asset</div>
                                    <div className="font-medium text-gray-800">{selectedAsset.kondisi}</div>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Jenis Pengajuan</label>
                                        <select
                                            value={repairForm.jenis_pengajuan}
                                            onChange={e => setRepairForm({ ...repairForm, jenis_pengajuan: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                        >
                                            <option>Perbaikan (Repair)</option>
                                            <option>Penggantian (Replace)</option>
                                            <option>Harwat Rutin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Jenis Kerusakan</label>
                                        <select
                                            value={repairForm.jenis_kerusakan}
                                            onChange={e => setRepairForm({ ...repairForm, jenis_kerusakan: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                        >
                                            <option>Ringan</option>
                                            <option>Sedang</option>
                                            <option>Berat / Mati Total</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi Kerusakan</label>
                                    <textarea
                                        rows={3}
                                        value={repairForm.deskripsi}
                                        onChange={e => setRepairForm({ ...repairForm, deskripsi: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                                        placeholder="Jelaskan detail kerusakan..."
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Tanggal Pengajuan</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="date"
                                                value={repairForm.tanggal}
                                                onChange={e => setRepairForm({ ...repairForm, tanggal: e.target.value })}
                                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 my-4 pt-4">
                                    <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <UserCheck className="w-4 h-4" /> Validasi Personil
                                    </h5>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <p className="text-xs font-semibold text-gray-500 uppercase">Yang Mengajukan</p>
                                            <input
                                                type="text"
                                                placeholder="Nama Lengkap"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                value={repairForm.pelapor_nama}
                                                onChange={e => setRepairForm({ ...repairForm, pelapor_nama: e.target.value })}
                                                required
                                            />
                                            <input
                                                type="text"
                                                placeholder="NRP"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                value={repairForm.pelapor_nrp}
                                                onChange={e => setRepairForm({ ...repairForm, pelapor_nrp: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-xs font-semibold text-gray-500 uppercase">Menyetujui (Dansat/Kasi)</p>
                                            <input
                                                type="text"
                                                placeholder="Nama Lengkap"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                value={repairForm.menyetujui_nama}
                                                onChange={e => setRepairForm({ ...repairForm, menyetujui_nama: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                placeholder="NRP"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                value={repairForm.menyetujui_nrp}
                                                onChange={e => setRepairForm({ ...repairForm, menyetujui_nrp: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsRepairModalOpen(false)} className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                                    Batal
                                </button>
                                <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all flex items-center">
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                                    Kirim Pengajuan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SatgasDetail;
