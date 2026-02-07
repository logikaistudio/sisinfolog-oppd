import type { User, Satgas, AssetCategory } from '../types';

export const USERS_DATA: User[] = [
    { id: '1', name: 'Admin Satgas', email: 'adminsatgas@oppd.com', nrp: '123456', position: 'Administrator', location: 'Pusat', status: 'Active' },
    { id: '2', name: 'User Indobatt', email: 'indobatt@oppd.com', nrp: '654321', position: 'Operator', location: 'Lebanon', status: 'Active' },
];

export const SATGAS_DATA: Satgas[] = [
    { id: '1', name: 'BGC MONUSCO', type: 'BGC MONUSCO', country: 'Kongo', lat: 4.0383, lng: 21.7587, personnelCount: 150 },
    // Kongo Group 1 (Base)
    { id: '2', name: 'Bunia', type: 'BGC MONUSCO', country: 'Kongo', lat: 3.7333, lng: 24.4397, personnelCount: 80 },
    // Lebanon Group (Base)
    { id: '3', name: 'CIMIC UNIFIL', type: 'UNIFIL', country: 'Lebanon', lat: 33.8547, lng: 35.8623, personnelCount: 45 },
    // Kongo Group 2 (Base)
    { id: '4', name: 'Eringeti', type: 'KIZI MONUSCO', country: 'Kongo', lat: 0.5872, lng: 29.4601, personnelCount: 60 },
    // Lebanon Group (Offset 1)
    { id: '5', name: 'FHQSU UNIFIL', type: 'UNIFIL', country: 'Lebanon', lat: 33.8647, lng: 35.8723, personnelCount: 120 },
    // Kongo Group 1 (Offset 1)
    { id: '6', name: 'Goma-BGC MONUSCO', type: 'BGC MONUSCO', country: 'Kongo', lat: 3.7433, lng: 24.4497, personnelCount: 90 },
    // Kongo Group 2 (Offset 1)
    { id: '7', name: 'Goma-KIZI MONUSCO', type: 'KIZI MONUSCO', country: 'Kongo', lat: 0.5972, lng: 29.4701, personnelCount: 75 },
    { id: '8', name: 'Home Base', type: 'OPPD', country: 'Indonesia', lat: -6.52587, lng: 106.8689, personnelCount: 500 },
    // Lebanon Group (Offset 2)
    { id: '9', name: 'Indo Medic UNIFIL', type: 'UNIFIL', country: 'Lebanon', lat: 33.8447, lng: 35.8523, personnelCount: 30 },
    // Kongo Group 1 (Offset 2)
    { id: '10', name: 'Log Base', type: 'BGC MONUSCO', country: 'Kongo', lat: 3.7233, lng: 24.4297, personnelCount: 40 },
];

export const ASSET_CATEGORIES: AssetCategory[] = [
    { id: '1', name: 'Kendaraan Taktis' },
    { id: '2', name: 'Senjata Berat' },
    { id: '3', name: 'Alat Komunikasi' },
];

export const DASHBOARD_STATS = {
    maik: 1250,
    rr_ops: 45,
    rb: 12,
    rr_t_ops: 0
};
