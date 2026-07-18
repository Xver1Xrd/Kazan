import Hero from '../components/Hero';
import Marquee from '../components/Marquee';
import FlightSection from '../components/FlightSection';
import RouteSection from '../components/RouteSection';
import FoodSection from '../components/FoodSection';
import MemoriesSection from '../components/MemoriesSection';
import GalleryTeaser from '../components/GalleryTeaser';
import MapTeaser from '../components/MapTeaser';

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <FlightSection />
      <RouteSection />
      <FoodSection />
      <MemoriesSection />
      <GalleryTeaser />
      <MapTeaser />
    </>
  );
}
