import { useState } from 'react';
import { Plus, Search, MapPin, Edit2, Trash2, Filter } from 'lucide-react';
import { SATGAS_DATA } from '../data/mockData';
import type { Satgas } from '../types';

const MasterSatgas = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [satgasList, setSatgasList] = useState<Satgas[]>(SATGAS_DATA);

    const filteredSatgas = satgasList.filter(satgas =>
        satgas.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        satgas.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        satgas.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-dark">List Satgas</h1>
                    <p className="text-sm text-text mt-1">Manage task force units and their locations.</p>
                </div>
                <button className="bg-success hover:bg-success/90 text-white px-4 py-2 rounded-lg flex items-center shadow-lg shadow-success/30 transition-all transform hover:scale-105">
                    <Plus className="w-5 h-5 mr-2" /> Add Satgas
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-dark">Show</label>
                        <select className="border-gray-200 rounded-lg text-sm focus:ring-primary focus:border-primary p-2 bg-gray-50 border">
                            <option>10</option>
                            <option>25</option>
                            <option>50</option>
                        </select>
                        <span className="text-sm font-medium text-dark">entries</span>
                    </div>

                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 w-full border-gray-200 rounded-lg focus:ring-primary focus:border-primary bg-gray-50 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/50 text-dark uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">Nama</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Negara</th>
                                <th className="px-6 py-4">X (Latitude)</th>
                                <th className="px-6 py-4">Y (Longitude)</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredSatgas.map((satgas) => (
                                <tr key={satgas.id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-6 py-4 font-semibold text-dark">{satgas.name}</td>
                                    <td className="px-6 py-4 text-text">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                            {satgas.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-text">{satgas.country}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-text">{satgas.lat}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-text">{satgas.lng}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 hover:bg-gray-100 rounded-lg text-info transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button className="p-1.5 hover:bg-gray-100 rounded-lg text-danger transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-text">
                        Showing 1 to {filteredSatgas.length > 10 ? 10 : filteredSatgas.length} of {filteredSatgas.length} entries
                    </div>
                    <div className="flex space-x-1">
                        <button className="px-3 py-1 border rounded hover:bg-gray-50 text-sm disabled:opacity-50">Previous</button>
                        <button className="px-3 py-1 border rounded bg-primary text-white text-sm">1</button>
                        <button className="px-3 py-1 border rounded hover:bg-gray-50 text-sm">2</button>
                        <button className="px-3 py-1 border rounded hover:bg-gray-50 text-sm">3</button>
                        <button className="px-3 py-1 border rounded hover:bg-gray-50 text-sm disabled:opacity-50">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MasterSatgas;
