import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_KEY = "mediprice_tour_done";

export function useOnboardingTour() {
  useEffect(() => {
    // Only show once — check localStorage
    if (localStorage.getItem(TOUR_KEY)) return;

    // Small delay so the page renders fully first
    const timer = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        overlayColor: "#000",
        overlayOpacity: 0.6,
        smoothScroll: true,
        allowClose: true,
        doneBtnText: "Get Started 🚀",
        closeBtnText: "Skip",
        nextBtnText: "Next →",
        prevBtnText: "← Back",
        onDestroyed: () => {
          localStorage.setItem(TOUR_KEY, "true");
        },
        steps: [
          {
            element: "#search-input",
            popover: {
              title: "🔍 Search Any Service",
              description:
                "Type any diagnostic test or procedure — MRI, X-Ray, Blood Test, ECG. We compare prices across all nearby hospitals instantly.",
              side: "bottom",
              align: "start",
            },
          },
          {
            element: "#city-input",
            popover: {
              title: "📍 Set Your City",
              description:
                "Enter your city to find hospitals near you. We sort results by distance, price, and rating.",
              side: "bottom",
              align: "start",
            },
          },
          {
            element: "#search-btn",
            popover: {
              title: "🚀 Hit Search",
              description:
                "Click Search to see a live comparison of hospitals with prices, ratings, and wait times.",
              side: "bottom",
              align: "center",
            },
          },
          {
            element: "#popular-searches",
            popover: {
              title: "⚡ Quick Searches",
              description:
                "In a hurry? Click any popular service to instantly search — no typing needed.",
              side: "top",
              align: "center",
            },
          },
          {
            element: "#trending-section",
            popover: {
              title: "📈 Trending Near You",
              description:
                "See the most-booked services in your city with lowest prices and average wait times.",
              side: "top",
              align: "start",
            },
          },
        ],
      });

      driverObj.drive();
    }, 800);

    return () => clearTimeout(timer);
  }, []);
}

// Call this to manually restart the tour (e.g. from a Help button)
export function resetTour() {
  localStorage.removeItem(TOUR_KEY);
}
