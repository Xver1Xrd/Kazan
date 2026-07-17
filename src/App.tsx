import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Footer from './components/Footer';
import ScrollManager from './components/ScrollManager';
import Home from './pages/Home';

const RouteDayPage = lazy(() => import('./pages/RouteDayPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const MapPage = lazy(() => import('./pages/MapPage'));

function App() {
  return (
    <div className="relative w-full">
      <ScrollManager />
      <Nav />
      <Suspense fallback={<div className="min-h-screen" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/route/:slug" element={<RouteDayPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
      <Footer />
    </div>
  );
}

export default App;
