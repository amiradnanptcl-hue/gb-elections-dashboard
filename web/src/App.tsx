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
const PartyPage = lazy(() =>
  import("@/pages/PartyPage").then((m) => ({ default: m.PartyPage })),
);
const SourcesPage = lazy(() =>
  import("@/pages/SourcesPage").then((m) => ({ default: m.SourcesPage })),
);
const PollingStationsPage = lazy(() =>
  import("@/pages/PollingStationsPage").then((m) => ({
    default: m.PollingStationsPage,
  })),
);
const VotersPage = lazy(() =>
  import("@/pages/VotersPage").then((m) => ({ default: m.VotersPage })),
);
const CandidatesPage = lazy(() =>
  import("@/pages/CandidatesPage").then((m) => ({
    default: m.CandidatesPage,
  })),
);
const AnthemsPage = lazy(() =>
  import("@/pages/AnthemsPage").then((m) => ({ default: m.AnthemsPage })),
);
const RecordsPage = lazy(() =>
  import("@/pages/RecordsPage").then((m) => ({ default: m.RecordsPage })),
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
        <Route path="records" element={<RecordsPage />} />
        <Route path="records/:section" element={<RecordsPage />} />
        <Route path="constituency/:id" element={<ConstituencyPage />} />
        <Route path="party/:id" element={<PartyPage />} />
        <Route path="sources" element={<SourcesPage />} />
        <Route path="polling-stations" element={<PollingStationsPage />} />
        <Route path="voters" element={<VotersPage />} />
        <Route path="candidates" element={<CandidatesPage />} />
        <Route path="anthems" element={<AnthemsPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="methodology" element={<MethodologyPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
