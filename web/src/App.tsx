import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";

// Lazy-load route components so the initial bundle ships only the home page
// path. recharts (used in constituency detail) is the largest dependency and
// gets its own chunk this way.
const HomePage = lazy(() =>
  import("@/pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const ConstituencyPage = lazy(() =>
  import("@/pages/ConstituencyPage").then((m) => ({ default: m.ConstituencyPage })),
);
const MapPage = lazy(() =>
  import("@/pages/MapPage").then((m) => ({ default: m.MapPage })),
);
const MethodologyPage = lazy(() =>
  import("@/pages/MethodologyPage").then((m) => ({ default: m.MethodologyPage })),
);
const AboutPage = lazy(() =>
  import("@/pages/AboutPage").then((m) => ({ default: m.AboutPage })),
);
const NotFoundPage = lazy(() =>
  import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);

function PageFallback() {
  return (
    <div className="py-16 text-center text-sm text-[color:var(--color-muted-foreground)]">
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        element={
          <Suspense fallback={<PageFallback />}>
            <AppLayout />
          </Suspense>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="constituency/:id" element={<ConstituencyPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="methodology" element={<MethodologyPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
