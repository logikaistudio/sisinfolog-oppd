import { useState, useMemo } from 'react';
import {
    ClipboardList,
    Loader2,
    CheckCircle2,
    Clock,
    Settings,
    MoreVertical,
    Calendar,
    User,
    MapPin,
    AlertCircle,
    ArrowRightCircle,
    ArrowLeftCircle
} from 'lucide-react';
import clsx from 'clsx';

// Define Ticket Interface
interface Ticket {
    id: string;
    assetCode: string;
    assetName: string;
    satgas: string;
    issue: string; // Deskripsi kerusakan
    type: 'Perbaikan' | 'Ganti Sparepart' | 'Harwat';
    severity: 'Ringan' | 'Sedang' | 'Berat';
    date: string;
    status: 'Pengajuan' | 'Proses' | 'Pelaksanaan' | 'Selesai';
    reporter: string;
}

// Mock Data Initial State
const INITIAL_TICKETS: Ticket[] = [
    {
        id: 'REQ-001',
        assetCode: 'UN-8921-X',
        assetName: 'Toyota Land Cruiser',
        satgas: 'BGC MONUSCO',
        issue: 'Mesin overheat saat patroli, radiator bocor halus.',
        type: 'Perbaikan',
        severity: 'Sedang',
        date: '2024-02-05',
        status: 'Pengajuan',
        reporter: 'Sgt. Budi'
    },
    {
        id: 'REQ-002',
        assetCode: 'GEN-5512',
        assetName: 'Generator 500kVA',
        satgas: 'UNIFIL',
        issue: 'Filter oli perlu penggantian rutin.',
        type: 'Harwat',
        severity: 'Ringan',
        date: '2024-02-04',
        status: 'Proses',
        reporter: 'Prajurik Satu Arif'
    },
    {
        id: 'REQ-003',
        assetCode: 'TRK-1102',
        assetName: 'Truck Reo',
        satgas: 'Kizi MINUSCA',
        issue: 'Rem blong, kampas habis total.',
        type: 'Ganti Sparepart',
        severity: 'Berat',
        date: '2024-02-01',
        status: 'Pelaksanaan',
        reporter: 'Koptu Dedi'
    },
    {
        id: 'REQ-004',
        assetCode: 'COM-3321',
        assetName: 'Radio Rig Motorola',
        satgas: 'Indo Medic',
        issue: 'Antena patah akibat cuaca buruk.',
        type: 'Perbaikan',
        severity: 'Ringan',
        date: '2024-01-28',
        status: 'Selesai',
        reporter: 'Sertu Eko'
    },
    {
        id: 'REQ-005',
        assetCode: 'AMB-9912',
        assetName: 'Ambulance Ford',
        satgas: 'BGC MONUSCO',
        issue: 'Sirine mati, lampu rotator tidak berputar.',
        type: 'Perbaikan',
        severity: 'Sedang',
        date: '2024-02-06',
        status: 'Pengajuan',
        reporter: 'Prada Fajar'
    },
];

const PengajuanPerbaikan = () => {
    const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
    const [isLoading, setIsLoading] = useState(false);

    // Calculate Summary Stats
    const stats = useMemo(() => {
        return {
            pengajuan: tickets.filter(t => t.status === 'Pengajuan').length,
            proses: tickets.filter(t => t.status === 'Proses' || t.status === 'Pelaksanaan').length,
            selesai: tickets.filter(t => t.status === 'Selesai').length,
            total: tickets.length
        };
    }, [tickets]);

    // Helper to move ticket status
    const moveTicket = (id: string, newStatus: Ticket['status']) => {
        setTickets(prev => prev.map(t =>
            t.id === id ? { ...t, status: newStatus } : t
        ));
    };

    // Render a Kanban Column
    const KanbanColumn = ({
        title,
        status,
        colorClass,
        icon: Icon
    }: {
        title: string,
        status: Ticket['status'],
        colorClass: string,
        icon: any
    }) => {
        const columnTickets = tickets.filter(t => t.status === status);

        return (
            <div className="flex flex-col h-full">
                {/* Column Header */}
                <div className={`p-4 rounded-t-xl border-t border-x ${colorClass} bg-opacity-10 border-b-2 border-b-current flex items-center justify-between`}>
                    <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-sm">
                        <Icon className="w-4 h-4" />
                        {title}
                    </div>
                    <span className="bg-white/50 px-2 py-0.5 rounded text-xs font-bold shadow-sm">
                        {columnTickets.length}
                    </span>
                </div>

                {/* Drop Area / List */}
                <div className="flex-1 bg-gray-50/50 border-x border-b border-gray-200 rounded-b-xl p-3 space-y-3 min-h-[500px]">
                    {columnTickets.map(ticket => (
                        <div key={ticket.id} className="bg-white hover:bg-blue-50/20 p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all group relative animate-in fade-in zoom-in duration-300">
                            {/* Priority Badge */}
                            <div className="flex justify-between items-start mb-2">
                                <span className={clsx(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                                    ticket.severity === 'Berat' ? "bg-red-50 text-red-600 border-red-100" :
                                        ticket.severity === 'Sedang' ? "bg-orange-50 text-orange-600 border-orange-100" :
                                            "bg-green-50 text-green-600 border-green-100"
                                )}>
                                    {ticket.severity}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">{ticket.id}</span>
                            </div>

                            {/* Content */}
                            <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">{ticket.assetName}</h4>
                            <div className="text-xs text-blue-600 font-medium mb-2 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {ticket.satgas}
                            </div>
                            <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 mb-3 border border-gray-100">
                                <p className="line-clamp-2 italic">"{ticket.issue}"</p>
                            </div>

                            {/* Meta & Footer */}
                            <div className="flex items-center justify-between text-[10px] text-gray-400 mb-3 border-t border-gray-50 pt-2">
                                <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" /> {ticket.reporter}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {ticket.date}
                                </div>
                            </div>

                            {/* Actions (Move buttons) */}
                            <div className="flex justify-between items-center gap-2 opacity-100 transition-opacity pt-2 border-t border-gray-100">
                                {status !== 'Pengajuan' && (
                                    <button
                                        onClick={() => {
                                            const prev = status === 'Selesai' ? 'Pelaksanaan' : status === 'Pelaksanaan' ? 'Proses' : 'Pengajuan';
                                            moveTicket(ticket.id, prev);
                                        }}
                                        className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                                        title="Kembali"
                                    >
                                        <ArrowLeftCircle className="w-5 h-5" />
                                    </button>
                                )}
                                <div className="flex-1"></div>
                                {status !== 'Selesai' && (
                                    <button
                                        onClick={() => {
                                            const next = status === 'Pengajuan' ? 'Proses' : status === 'Proses' ? 'Pelaksanaan' : 'Selesai';
                                            moveTicket(ticket.id, next);
                                        }}
                                        className="flex items-center justify-center gap-1 px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded text-xs font-bold transition-colors w-full"
                                    >
                                        Proses <ArrowRightCircle className="w-4 h-4 ml-1" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {columnTickets.length === 0 && (
                        <div className="text-center py-10 opacity-50">
                            <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
                                <ClipboardList className="w-5 h-5 text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-400 font-medium">Kosong</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const StatBox = ({ title, value, icon: Icon, colorClass }: any) => (
        <div className={`p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between bg-white relative overflow-hidden group hover:shadow-md transition-shadow`}>
            {/* Background Decor */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 group-hover:scale-110 transition-transform ${colorClass.split(' ')[0].replace('text', 'bg')}`}></div>

            <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-3xl font-black text-gray-800 tracking-tight">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${colorClass}`}>
                <Icon className={`w-6 h-6`} />
            </div>
        </div>
    );

    return (
        <div className="p-6 space-y-8 min-h-screen bg-gray-50/30">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <ClipboardList className="w-8 h-8 text-primary" />
                    Manajemen Perbaikan & Sucad
                </h1>
                <p className="text-gray-500 mt-1 ml-11">Monitor status pengajuan perbaikan dan suku cadang secara real-time.</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatBox
                    title="Pengajuan Masuk"
                    value={stats.pengajuan}
                    icon={AlertCircle}
                    colorClass="bg-blue-50 text-blue-600"
                />
                <StatBox
                    title="Dalam Proses"
                    value={stats.proses}
                    icon={Settings}
                    colorClass="bg-orange-50 text-orange-600"
                />
                <StatBox
                    title="Selesai Diperbaiki"
                    value={stats.selesai}
                    icon={CheckCircle2}
                    colorClass="bg-green-50 text-green-600"
                />
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KanbanColumn
                    title="Pengajuan"
                    status="Pengajuan"
                    colorClass="text-blue-600 border-blue-200 bg-blue-50"
                    icon={ClipboardList}
                />
                <KanbanColumn
                    title="Proses Analisa"
                    status="Proses"
                    colorClass="text-orange-600 border-orange-200 bg-orange-50"
                    icon={Settings}
                />
                <KanbanColumn
                    title="Pelaksanaan"
                    status="Pelaksanaan"
                    colorClass="text-purple-600 border-purple-200 bg-purple-50"
                    icon={Wrench}
                />
                <KanbanColumn
                    title="Selesai"
                    status="Selesai"
                    colorClass="text-green-600 border-green-200 bg-green-50"
                    icon={CheckCircle2}
                />
            </div>
        </div>
    );
};

export default PengajuanPerbaikan;
