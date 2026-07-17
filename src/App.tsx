import Nav from './components/Nav';
import Hero from './components/Hero';
import RouteSection from './components/RouteSection';
import FoodSection from './components/FoodSection';
import ChecklistSection from './components/ChecklistSection';
import MemoriesSection from './components/MemoriesSection';
import MapSection from './components/MapSection';
import Footer from './components/Footer';

function App() {
  return (
    <div className="relative w-full">
      <Nav />
      <Hero />
      <RouteSection />
      <FoodSection />
      <ChecklistSection />
      <MemoriesSection />
      <MapSection />
      <Footer />
    </div>
  );
}

export default App;
