import { useEffect, useRef, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LocationData } from '../types';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [15, 25], // Reduced by ~40%
    iconAnchor: [7.5, 25],
    popupAnchor: [1, -20],
    shadowSize: [25, 25]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
    locations: LocationData[];
    selectedLocationId: string | 'All Regions';
    isEditMode: boolean;
    onAddLocation: (lat: number, lng: number) => void;
    onUpdateLocation: (id: string, name: string, lat: number, lng: number) => void;
    onDeleteLocation: (id: string) => void;
}

// Component to handle map movement
const MapUpdater = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, {
            duration: 1.5
        });
    }, [center, zoom, map]);
    return null;
};

// Component to handle map clicks
const MapEvents = ({ isEditMode, onAddLocation }: { isEditMode: boolean; onAddLocation: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            if (isEditMode) {
                onAddLocation(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
};

// Component for a Draggable Marker
const DraggableMarker = ({ location, isEditMode, onUpdateLocation, onDeleteLocation }: {
    location: LocationData;
    isEditMode: boolean;
    onUpdateLocation: (id: string, name: string, lat: number, lng: number) => void;
    onDeleteLocation: (id: string) => void;
}) => {
    const [name, setName] = useState(location.name);
    const markerRef = useRef<L.Marker>(null);

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker) {
                    const { lat, lng } = marker.getLatLng();
                    onUpdateLocation(location.id, location.name, lat, lng);
                }
            },
        }),
        [location, onUpdateLocation]
    );

    return (
        <Marker
            draggable={isEditMode}
            eventHandlers={eventHandlers}
            position={[location.lat, location.lng]}
            ref={markerRef}
        >
            <Popup minWidth={90}>
                <div className="text-center">
                    {isEditMode ? (
                        <div className="flex flex-col gap-2">
                            <input
                                type="text"
                                className="border border-gray-300 rounded px-2 py-1 text-xs text-dark"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <div className="flex gap-2 justify-center">
                                <button
                                    onClick={() => onUpdateLocation(location.id, name, location.lat, location.lng)}
                                    className="bg-primary text-white text-[10px] px-2 py-1 rounded hover:bg-primary/90"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => onDeleteLocation(location.id)}
                                    className="bg-danger text-white text-[10px] px-2 py-1 rounded hover:bg-danger/90"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ) : (
                        <strong className="text-primary text-sm">{location.name}</strong>
                    )}
                </div>
            </Popup>
        </Marker>
    );
};

const MapComponent = ({ locations, selectedLocationId, isEditMode, onAddLocation, onUpdateLocation, onDeleteLocation }: MapComponentProps) => {
    // Determine center and zoom
    let center: [number, number] = [0, 20]; // Default World/Africa center
    let zoom = 3;

    if (selectedLocationId !== 'All Regions') {
        const selected = locations.find(l => l.id === selectedLocationId);
        if (selected) {
            center = [selected.lat, selected.lng];
            zoom = 8;
        }
    }

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
            className="z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={center} zoom={zoom} />
            <MapEvents isEditMode={isEditMode} onAddLocation={onAddLocation} />

            {locations.map(loc => (
                <DraggableMarker
                    key={loc.id}
                    location={loc}
                    isEditMode={isEditMode}
                    onUpdateLocation={onUpdateLocation}
                    onDeleteLocation={onDeleteLocation}
                />
            ))}
        </MapContainer>
    );
};

export default MapComponent;
