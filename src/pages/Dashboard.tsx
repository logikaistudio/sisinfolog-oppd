import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SATGAS_DATA } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar, PolarAngleAxis, Legend, LabelList } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, Zap, PenTool, Layout, Box, Edit3, Save, Loader2 } from 'lucide-react';
import MapComponent from '../components/MapComponent';
import type { LocationData } from '../types';
import sql from '../lib/db';

const Dashboard = () => {
    const navigate = useNavigate();
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState('All Regions');
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        baik: 0,
        rr_ops: 0,
        rb: 0,
        rr_t_ops: 0,
        total: 0
    });
    const [satgasStats, setSatgasStats] = useState<any[]>([]);
    const [ageChartData, setAgeChartData] = useState<any[]>([]);

    // Transform SATGAS_DATA to LocationData format for the map
    const locations: LocationData[] = SATGAS_DATA.map(s => ({
        id: s.id,
        name: s.name,
        lat: s.lat,
        lng: s.lng
    }));

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch data including year columns
                const result = await sql`SELECT kondisi, satgas, pembuatan, operasi FROM data_aset`;
                const data = result as unknown as { kondisi: string; satgas: string; pembuatan: string; operasi: string }[];

                let summary = {
                    baik: 0,
                    rr_ops: 0,
                    rb: 0,
                    rr_t_ops: 0,
                    total: data.length
                };

                // Age Buckets - Updated 5 categories
                const ageBuckets = {
                    b0_5: { name: '0-5 th', pembuatan: 0, operasi: 0 },
                    b5_10: { name: '5-10 th', pembuatan: 0, operasi: 0 },
                    b10_15: { name: '10-15 th', pembuatan: 0, operasi: 0 },
                    b15_20: { name: '15-20 th', pembuatan: 0, operasi: 0 },
                    gt20: { name: '> 20 th', pembuatan: 0, operasi: 0 }
                };
                const currentYear = new Date().getFullYear();

                const getAgeBucket = (yearStr: string) => {
                    if (!yearStr) return null;
                    // Extract first 4 digits if simple year
                    const match = yearStr.match(/\d{4}/);
                    if (!match) return null;

                    const year = parseInt(match[0]);
                    const age = currentYear - year;

                    if (age < 5) return 'b0_5';
                    if (age >= 5 && age < 10) return 'b5_10';
                    if (age >= 10 && age < 15) return 'b10_15';
                    if (age >= 15 && age < 20) return 'b15_20';
                    return 'gt20';
                };

                // Satgas Grouping Maps
                const dbSatgasMap: Record<string, { baik: number; rr_ops: number; rb: number; rr_t_ops: number; total: number }> = {};

                data.forEach(item => {
                    // 1. Process Condition stats
                    const k = (item.kondisi || '').trim().toLowerCase();
                    const s = (item.satgas || 'Unknown');
                    const sKey = s.trim().toLowerCase();

                    if (!dbSatgasMap[sKey]) {
                        dbSatgasMap[sKey] = { baik: 0, rr_ops: 0, rb: 0, rr_t_ops: 0, total: 0 };
                    }
                    dbSatgasMap[sKey].total++;

                    let category = '';
                    if (k.includes('baik')) {
                        category = 'baik';
                        summary.baik++;
                    } else if (k.includes('berat') || k === 'rb') {
                        category = 'rb';
                        summary.rb++;
                    } else if (k.includes('ringan') || k.includes('rr')) {
                        if (k.includes('tidak') || k.includes('t ops') || k.includes('tdk')) {
                            category = 'rr_t_ops';
                            summary.rr_t_ops++;
                        } else {
                            category = 'rr_ops';
                            summary.rr_ops++;
                        }
                    } else {
                        if (k) {
                            category = 'rr_ops'; // Fallback
                            summary.rr_ops++;
                        }
                    }

                    if (category) {
                        dbSatgasMap[sKey][category as keyof typeof dbSatgasMap[string]]++;
                    }

                    // 2. Process Age Stats
                    const bucketPembuatan = getAgeBucket(item.pembuatan);
                    if (bucketPembuatan) {
                        ageBuckets[bucketPembuatan as keyof typeof ageBuckets].pembuatan++;
                    }

                    const bucketOperasi = getAgeBucket(item.operasi);
                    if (bucketOperasi) {
                        ageBuckets[bucketOperasi as keyof typeof ageBuckets].operasi++;
                    }
                });

                setStats(summary);
                setAgeChartData([
                    ageBuckets.b0_5,
                    ageBuckets.b5_10,
                    ageBuckets.b10_15,
                    ageBuckets.b15_20,
                    ageBuckets.gt20
                ]);

                // USE MASTER DATA (SATGAS_DATA) AS BASE
                const usedDbKeys = new Set<string>();

                const satgasArrayMatches = SATGAS_DATA.map(masterSatgas => {
                    const key = masterSatgas.name.trim().toLowerCase();
                    if (dbSatgasMap[key]) {
                        usedDbKeys.add(key);
                    }
                    const s = dbSatgasMap[key] || { baik: 0, rr_ops: 0, rb: 0, rr_t_ops: 0, total: 0 };

                    const chartData = [
                        { name: 'RB', count: s.rb, value: s.total ? (s.rb / s.total) * 100 : 0, fill: '#FA896B' },
                        { name: 'RR TDK OPS', count: s.rr_t_ops, value: s.total ? (s.rr_t_ops / s.total) * 100 : 0, fill: '#FFAE1F' },
                        { name: 'RR OPS', count: s.rr_ops, value: s.total ? (s.rr_ops / s.total) * 100 : 0, fill: '#13DEB9' },
                        { name: 'Baik', count: s.baik, value: s.total ? (s.baik / s.total) * 100 : 0, fill: '#5D87FF' }
                    ];

                    return {
                        name: masterSatgas.name,
                        type: masterSatgas.type,
                        stats: s,
                        chartData
                    };
                });

                // Find unmatched satgas in DB
                const unmatchedKeys = Object.keys(dbSatgasMap).filter(k => !usedDbKeys.has(k) && k !== 'unknown');

                const satgasArrayUnmatched = unmatchedKeys.map(key => {
                    const s = dbSatgasMap[key];
                    const displayName = key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                    const chartData = [
                        { name: 'RB', count: s.rb, value: s.total ? (s.rb / s.total) * 100 : 0, fill: '#FA896B' },
                        { name: 'RR TDK OPS', count: s.rr_t_ops, value: s.total ? (s.rr_t_ops / s.total) * 100 : 0, fill: '#FFAE1F' },
                        { name: 'RR OPS', count: s.rr_ops, value: s.total ? (s.rr_ops / s.total) * 100 : 0, fill: '#13DEB9' },
                        { name: 'Baik', count: s.baik, value: s.total ? (s.baik / s.total) * 100 : 0, fill: '#5D87FF' }
                    ];

                    return {
                        name: displayName,
                        type: 'Other',
                        stats: s,
                        chartData
                    };
                });

                // Combine and Filter out empty satgas matching user request
                const finalSatgasStats = [...satgasArrayMatches, ...satgasArrayUnmatched].filter(item => item.stats.total > 0);

                setSatgasStats(finalSatgasStats);

            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleAddLocation = (lat: number, lng: number) => {
        console.log('Add location at', lat, lng);
    };

    const handleUpdateLocation = (id: string, name: string, lat: number, lng: number) => {
        console.log('Update location', id, name, lat, lng);
    };

    const handleDeleteLocation = (id: string) => {
        console.log('Delete location', id);
    };

    const conditionData = [
        { name: 'Baik', value: stats.baik, color: '#5D87FF' },
        { name: 'RR OPS.', value: stats.rr_ops, color: '#13DEB9' },
        { name: 'RB', value: stats.rb, color: '#FA896B' },
        { name: 'RR TDK OPS.', value: stats.rr_t_ops, color: '#FFAE1F' },
    ];

    const StatsCard = ({ title, value, color, icon: Icon, percentage }: any) => (
        <div className="bg-white rounded-xl p-6 shadow-[0_2px_12px_-3px_rgba(6,81,237,0.1)] border border-gray-100/50 flex items-center justify-between hover:shadow-lg transition-all duration-300">
            <div>
                <p className="text-sm font-semibold text-text mb-1 tracking-wide">{title}</p>
                <h3 className="text-2xl font-extrabold text-dark tracking-tight">
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : value}
                </h3>
                <div className="flex items-center mt-2">
                    <span className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded ${percentage > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                        {percentage > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {Math.abs(percentage)}%
                    </span>
                    <span className="text-xs text-muted ml-2 font-medium">vs last month</span>
                </div>
            </div>
            <div className={`p-4 rounded-xl bg-${color}/10 flex items-center justify-center`}>
                <Icon className={`w-6 h-6 text-${color}`} />
            </div>
        </div>
    );

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-dark text-white text-xs p-2 rounded shadow-lg border-none">
                    <p className="font-semibold mb-1">{label ? label : payload[0].name}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.fill }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const RadialTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-dark text-white text-xs p-2 rounded shadow-lg border-none z-50">
                    <p className="font-semibold mb-1">{data.name}</p>
                    <p>Jumlah: {data.count} unit</p>
                    <p>Porsi: {Number(data.value).toFixed(1)}%</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Page Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-extrabold text-dark tracking-tight">Dashboard</h1>
                    <p className="text-text text-sm mt-1 font-medium">Real-time asset monitoring and operational insights.</p>
                </div>
                <div className="hidden md:flex space-x-3">
                    <button className="px-4 py-2 bg-white border border-gray-200 text-text text-sm font-semibold rounded-lg shadow-sm hover:bg-gray-50 flex items-center">
                        <Layout className="w-4 h-4 mr-2" /> Customize
                    </button>
                    <button className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg shadow-primary/30 shadow-lg hover:bg-primary/90 flex items-center transition-all">
                        <Zap className="w-4 h-4 mr-2" /> Generate Report
                    </button>
                </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Baik" value={stats.baik} color="primary" icon={Box} percentage={2.5} />
                <StatsCard title="RR OPS." value={stats.rr_ops} color="success" icon={Activity} percentage={-0.4} />
                <StatsCard title="RB" value={stats.rb} color="danger" icon={PenTool} percentage={5.2} />
                <StatsCard title="RR TDK OPS." value={stats.rr_t_ops} color="warning" icon={Layout} percentage={0.0} />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Asset Map */}
                <div className="xl:col-span-2 bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-100 overflow-hidden flex flex-col h-[500px]">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                        <div>
                            <h2 className="text-lg font-bold text-dark flex items-center">
                                Asset Infografis
                                {isEditMode && <span className="ml-2 text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full animate-pulse">EDIT MODE</span>}
                            </h2>
                            <p className="text-xs text-text mt-0.5">
                                {isEditMode ? 'Drag markers to update. Changes reflect in Master Satgas.' : 'Real-time locations from Master Satgas'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsEditMode(!isEditMode)}
                                className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center ${isEditMode ? 'bg-success text-white' : 'bg-gray-100 text-dark hover:bg-gray-200'}`}
                            >
                                {isEditMode ? <><Save className="w-3 h-3 mr-1" /> Done</> : <><Edit3 className="w-3 h-3 mr-1" /> Edit Map</>}
                            </button>
                            <select
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                                className="text-xs border-gray-200 rounded-lg text-dark bg-gray-50 font-semibold focus:ring-primary focus:border-primary py-2 px-3 outline-none max-w-[150px]"
                            >
                                <option value="All Regions">All Regions</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex-1 bg-[#F1F5F9] relative flex flex-col">
                        <MapComponent
                            locations={locations}
                            selectedLocationId={selectedRegion}
                            isEditMode={isEditMode}
                            onAddLocation={handleAddLocation}
                            onUpdateLocation={handleUpdateLocation}
                            onDeleteLocation={handleDeleteLocation}
                        />
                    </div>
                </div>

                {/* Summary Donut Chart */}
                <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-100 p-6 flex flex-col h-[500px]">
                    <div className="mb-2">
                        <h2 className="text-lg font-bold text-dark">Summary OPPD</h2>
                        <p className="text-xs text-text mt-0.5">Total asset condition breakdown</p>
                    </div>

                    <div className="flex-1 relative min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={conditionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={4}
                                    dataKey="value"
                                    cornerRadius={6}
                                    stroke="none"
                                    onClick={(data) => navigate(`/data-aset?condition=${encodeURIComponent(data.name)}`)}
                                >
                                    {conditionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} cursor="pointer" />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Label */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <h3 className="text-4xl font-extrabold text-dark tracking-tighter">
                                    {isLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /> : stats.total}
                                </h3>
                                <p className="text-xs font-semibold text-text uppercase tracking-widest mt-1">Total</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-2 flex flex-col space-y-1.5">
                        {conditionData.map((item) => (
                            <div key={item.name} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full mr-3 shadow-sm ring-2 ring-white" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-sm text-dark font-medium group-hover:text-primary transition-colors">{item.name}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-sm font-bold text-dark mr-2">{item.value}</span>
                                    <span className="text-xs text-muted">/ {stats.total > 0 ? (item.value / stats.total * 100).toFixed(0) : 0}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row - Satgas & Age */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Satgas Readiness - col-span-2 to match Map width */}
                <div className="xl:col-span-2 bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-100 p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-dark">Unit Readiness Status</h2>
                            <p className="text-xs text-text mt-0.5">Asset condition by Satgas location</p>
                        </div>
                        <div className="flex gap-2 text-[10px] flex-wrap justify-end max-w-[50%]">
                            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#5D87FF] mr-1"></span>Baik</div>
                            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#13DEB9] mr-1"></span>RR OPS</div>
                            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#FFAE1F] mr-1"></span>RR TDK OPS</div>
                            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#FA896B] mr-1"></span>RB</div>
                        </div>
                    </div>

                    {/* Changed grid to allow fitting in 1 row if possible, or wrap */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {isLoading ? (
                            <div className="col-span-full py-12 flex justify-center text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin" />
                            </div>
                        ) : satgasStats.length === 0 ? (
                            <p className="col-span-full text-center text-sm text-gray-500">No data available for current Satgas</p>
                        ) : (
                            satgasStats.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex flex-col items-center cursor-pointer hover:bg-gray-50/80 p-3 rounded-xl transition-all duration-200 transform hover:scale-105"
                                    onClick={() => navigate(`/satgas/type/${encodeURIComponent(item.name)}`)}
                                    title={`Lihat detail ${item.name}`}
                                >
                                    <div className="h-40 w-full relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadialBarChart
                                                key={`radial-${index}-${satgasStats.length}`}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius="40%"
                                                outerRadius="100%"
                                                barSize={12}
                                                data={item.chartData}
                                                startAngle={270}
                                                endAngle={-90}
                                            >
                                                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                                <RadialBar
                                                    label={{ position: 'insideStart', fill: '#fff', fontSize: 0 }}
                                                    background={{ fill: '#F1F5F9' }}
                                                    dataKey="value"
                                                    cornerRadius={6}
                                                />
                                                <Tooltip content={<RadialTooltip />} cursor={false} />
                                            </RadialBarChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-2xl font-extrabold text-dark">{item.stats.total}</span>
                                        </div>
                                    </div>
                                    <h4 className="mt-0.5 font-bold text-dark text-center text-sm truncate w-full px-2" title={item.name}>
                                        {item.name}
                                    </h4>
                                    <div className="flex flex-col items-center space-y-0.5 mt-0.5">
                                        <span className="text-[#5D87FF] font-bold text-sm">Baik: {item.stats.baik}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Asset Age - col-span-1 */}
                <div className="xl:col-span-1 bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-100 p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-dark">Age Distribution</h2>
                            <p className="text-xs text-text mt-0.5">By Manufacturing & Operation Year</p>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ageChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} barSize={24}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEFF4" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#5A6A85', fontSize: 11, fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#5A6A85', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#F8FAFC' }} content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                <Bar dataKey="pembuatan" name="Pembuatan" fill="#5D87FF" radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="pembuatan" position="top" style={{ fontSize: '11px', fill: '#5A6A85', fontWeight: 600 }} />
                                </Bar>
                                <Bar dataKey="operasi" name="Operasi" fill="#13DEB9" radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="operasi" position="top" style={{ fontSize: '11px', fill: '#5A6A85', fontWeight: 600 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
