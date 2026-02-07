export interface User {
    id: string;
    name: string;
    email: string;
    nrp: string;
    position: string;
    location: string;
    status: 'Active' | 'Inactive';
}

export interface Satgas {
    id: string;
    name: string;
    type: string;
    country: string;
    lat: number;
    lng: number;
    personnelCount: number;
}

export interface AssetCategory {
    id: string;
    name: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
}

export interface LocationData {
    id: string;
    name: string;
    lat: number;
    lng: number;
}
