import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

/**
 * PWAInstallPrompt
 * Shows a custom "Install App" banner when the browser fires
 * the `beforeinstallprompt` event (Chrome / Edge / Android).
 * iOS shows a manual instruction instead.
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed in this session
    if (sessionStorage.getItem("pwa_banner_dismissed")) return;

    // Detect iOS
    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !window.navigator.standalone;
    setIsIOS(ios);

    // Already installed — don't show
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    if (ios) {
      setShowBanner(true);
      return;
    }

    // Chrome / Edge — capture the install event
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    sessionStorage.setItem("pwa_banner_dismissed", "true");
  };

  if (!showBanner || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">M</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-sm">
              Install MediPrice
            </div>

            {isIOS ? (
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Tap{" "}
                <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-medium">
                  Share
                </span>{" "}
                then{" "}
                <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-medium">
                  Add to Home Screen
                </span>{" "}
                to install.
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Add to your home screen for quick access — works offline too!
              </p>
            )}

            {!isIOS && (
              <button
                type="button"
                onClick={handleInstall}
                className="mt-2.5 flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download size={13} /> Install App
              </button>
            )}
          </div>

          {/* Dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
