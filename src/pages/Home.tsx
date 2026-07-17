import Hero from '../components/Hero';
import RouteSection from '../components/RouteSection';
import FoodSection from '../components/FoodSection';
import ChecklistSection from '../components/ChecklistSection';
import MemoriesSection from '../components/MemoriesSection';
import GalleryTeaser from '../components/GalleryTeaser';
import MapTeaser from '../components/MapTeaser';

export default function Home() {
  return (
    <>
      <Hero />
      <RouteSection />
      <FoodSection />
      <ChecklistSection />
      <MemoriesSection />
      <GalleryTeaser />
      <MapTeaser />
    </>
  );
}
