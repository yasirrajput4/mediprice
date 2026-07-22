import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

/**
 * OfflineIndicator
 * Shows a banner when the user goes offline,
 * and a brief "Back online" confirmation when they reconnect.
 */
export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnline(true);
      setTimeout(() => setShowBackOnline(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowBackOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showBackOnline) return null;

  return (
    <div
      className={`fixed top-16 left-0 right-0 z-50 flex items-center justify-center py-2 px-4 text-sm font-medium transition-colors ${
        isOnline ? "bg-emerald-500 text-white" : "bg-gray-900 text-white"
      }`}
    >
      {isOnline ? (
        <span className="flex items-center gap-2">
          <Wifi size={15} /> Back online
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <WifiOff size={15} /> You are offline — showing cached results
        </span>
      )}
    </div>
  );
}
