import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const R = 1;
const LED = { lat: 59.93, lng: 30.31 };
const KZN = { lat: 55.79, lng: 49.11 };
const ARC_SEGMENTS = 100;
const FLIGHT_LOOP_S = 6;

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const X_AXIS = new THREE.Vector3(1, 0, 0);

function latLngToVec3(lat: number, lng: number, r: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function arcPoint(start: THREE.Vector3, end: THREE.Vector3, t: number) {
  const v = start.clone().normalize().lerp(end.clone().normalize(), t).normalize();
  const lift = 1 + 0.16 * Math.sin(Math.PI * t);
  return v.multiplyScalar(R * lift);
}

function CityDot({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.022, 16, 16]} />
        <meshBasicMaterial color="#c7e0cb" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#85AB8B" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function Scene() {
  const group = useRef<THREE.Group>(null);
  const planeRef = useRef<THREE.Mesh>(null);
  const drag = useRef({ active: false, lastX: 0, lastY: 0, offsetX: 0, offsetY: 0 });

  const start = useMemo(() => latLngToVec3(LED.lat, LED.lng, R), []);
  const end = useMemo(() => latLngToVec3(KZN.lat, KZN.lng, R), []);

  // Base orientation: the LED–KZN midpoint faces the camera, slightly above center.
  const baseQuat = useMemo(() => {
    const mid = start.clone().normalize().lerp(end.clone().normalize(), 0.5).normalize();
    return new THREE.Quaternion().setFromUnitVectors(mid, new THREE.Vector3(0, 0.08, 1).normalize());
  }, [start, end]);

  const arcLine = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= ARC_SEGMENTS; i++) pts.push(arcPoint(start, end, i / ARC_SEGMENTS));
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: '#85AB8B', transparent: true, opacity: 0.3 })
    );
  }, [start, end]);

  const trailLine = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((ARC_SEGMENTS + 1) * 3), 3));
    geo.setDrawRange(0, 0);
    return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#c7e0cb', transparent: true, opacity: 0.95 }));
  }, []);

  // Icosahedron mesh: uniform triangles, no pole convergence. Slightly larger
  // than the solid core so straight edges (chords) don't sink into it.
  const wireframe = useMemo(() => new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(R * 1.02, 2)), []);

  const stars = useMemo(() => {
    const positions = new Float32Array(350 * 3);
    for (let i = 0; i < 350; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(3.2 + Math.random() * 2.5);
      positions.set([v.x, v.y, v.z], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const scratch = useMemo(() => ({ qYaw: new THREE.Quaternion(), qPitch: new THREE.Quaternion() }), []);

  useFrame(({ clock }) => {
    const g = group.current;
    const d = drag.current;
    if (g) {
      if (!d.active) {
        // Released: ease back toward the default view.
        d.offsetX *= 0.99;
        d.offsetY *= 0.99;
      }
      const wobble = Math.sin(clock.elapsedTime * 0.15) * 0.22;
      scratch.qYaw.setFromAxisAngle(Y_AXIS, d.offsetX + wobble);
      scratch.qPitch.setFromAxisAngle(X_AXIS, d.offsetY);
      g.quaternion.copy(scratch.qPitch).multiply(scratch.qYaw).multiply(baseQuat);
    }

    // Plane flies the arc on a loop; the trail grows behind it.
    const t = (clock.elapsedTime % FLIGHT_LOOP_S) / FLIGHT_LOOP_S;
    if (planeRef.current) {
      planeRef.current.position.copy(arcPoint(start, end, t));
    }
    const count = Math.floor(t * ARC_SEGMENTS);
    const attr = trailLine.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i <= count; i++) {
      const pt = arcPoint(start, end, i / ARC_SEGMENTS);
      attr.setXYZ(i, pt.x, pt.y, pt.z);
    }
    attr.needsUpdate = true;
    trailLine.geometry.setDrawRange(0, count + 1);
  });

  return (
    <group
      ref={group}
      onPointerDown={(e) => {
        if (e.pointerType !== 'mouse') return;
        drag.current.active = true;
        drag.current.lastX = e.clientX;
        drag.current.lastY = e.clientY;
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d.active) return;
        d.offsetX += (e.clientX - d.lastX) * 0.005;
        d.offsetY = THREE.MathUtils.clamp(d.offsetY + (e.clientY - d.lastY) * 0.003, -0.6, 0.6);
        d.lastX = e.clientX;
        d.lastY = e.clientY;
      }}
      onPointerUp={() => (drag.current.active = false)}
      onPointerLeave={() => (drag.current.active = false)}
    >
      <mesh>
        <sphereGeometry args={[R * 0.985, 48, 32]} />
        <meshBasicMaterial color="#16241a" />
      </mesh>
      <lineSegments geometry={wireframe}>
        <lineBasicMaterial color="#4b7a5a" transparent opacity={0.35} />
      </lineSegments>
      <mesh>
        <sphereGeometry args={[R * 1.08, 48, 32]} />
        <meshBasicMaterial color="#4b7a5a" transparent opacity={0.07} side={THREE.BackSide} />
      </mesh>

      <CityDot position={start} />
      <CityDot position={end} />

      <primitive object={arcLine} />
      <primitive object={trailLine} />

      <mesh ref={planeRef}>
        <sphereGeometry args={[0.028, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      <points geometry={stars}>
        <pointsMaterial color="#c7e0cb" size={0.02} transparent opacity={0.55} sizeAttenuation />
      </points>
    </group>
  );
}

export default function FlightGlobe() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.15, 2.15], fov: 40 }}
      gl={{ alpha: true, antialias: true }}
      style={{ touchAction: 'pan-y' }}
    >
      <Scene />
    </Canvas>
  );
}
