import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix default marker icon broken in Vite/Webpack builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/**
 * HospitalMap — shows a single hospital pin on an OpenStreetMap tile
 *
 * Props:
 *   lat        {number}  — latitude
 *   lng        {number}  — longitude
 *   name       {string}  — hospital name (shown in popup)
 *   address    {string}  — address (shown in popup)
 *   height     {string}  — CSS height, default "300px"
 */
export default function HospitalMap({
  lat,
  lng,
  name,
  address,
  height = "300px",
}) {
  if (!lat || !lng) {
    return (
      <div
        className="rounded-xl bg-gray-100 flex items-center justify-center text-sm text-gray-400"
        style={{ height }}
      >
        Location not available
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden border border-gray-200"
      style={{ height }}
    >
      <MapContainer
        center={[parseFloat(lat), parseFloat(lng)]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[parseFloat(lat), parseFloat(lng)]}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold text-gray-900">{name}</div>
              {address && (
                <div className="text-gray-500 mt-0.5 text-xs">{address}</div>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

/**
 * HospitalsMap — shows multiple hospital pins on one map
 *
 * Props:
 *   hospitals  {Array}   — array of { id, name, address, lat, lng }
 *   height     {string}  — CSS height, default "400px"
 *   onSelect   {fn}      — called with hospital when a pin is clicked
 */
export function HospitalsMap({ hospitals = [], height = "400px", onSelect }) {
  if (!hospitals.length) return null;

  // Center map on first hospital
  const center = [parseFloat(hospitals[0].lat), parseFloat(hospitals[0].lng)];

  return (
    <div
      className="rounded-xl overflow-hidden border border-gray-200"
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hospitals
          .filter((h) => h.lat && h.lng)
          .map((h) => (
            <Marker
              key={h.id}
              position={[parseFloat(h.lat), parseFloat(h.lng)]}
              eventHandlers={{
                click: () => onSelect?.(h),
              }}
            >
              <Popup>
                <div className="text-sm min-w-[160px]">
                  <div className="font-semibold text-gray-900">{h.name}</div>
                  {h.address && (
                    <div className="text-gray-500 text-xs mt-0.5">
                      {h.address}
                    </div>
                  )}
                  {h.service_price && (
                    <div className="text-blue-600 font-medium mt-1 text-xs">
                      from ₹{Number(h.service_price).toLocaleString("en-IN")}
                    </div>
                  )}
                  {onSelect && (
                    <button
                      type="button"
                      onClick={() => onSelect(h)}
                      className="mt-2 w-full text-center text-xs bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 transition"
                    >
                      View Hospital
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
