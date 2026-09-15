import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "@/lib/utils";

/* --------------------------------------------------------------------------
   3D scene: an infrastructure node cluster.
   It can be dragged to rotate, nodes light up when the cursor comes near,
   and it spins on its own when left alone.
   -------------------------------------------------------------------------- */

const RUST = new THREE.Color("#e2704a");
const MOSS = new THREE.Color("#6a9364");
const BONE = new THREE.Color("#f0ebe3");
const DIM = new THREE.Color("#6f5e4d");

interface NodeDef {
  pos: THREE.Vector3;
  scale: number;
  accent: boolean;
}

/** Node positions are built deterministically so they do not change on every render. */
function buildNodes(): NodeDef[] {
  const nodes: NodeDef[] = [];
  const rings = [
    { count: 7, radius: 1.75, y: 0.72, tilt: 0.18 },
    { count: 10, radius: 2.35, y: -0.15, tilt: -0.1 },
    { count: 6, radius: 1.25, y: -0.95, tilt: 0.32 },
  ];

  rings.forEach((ring, ringIndex) => {
    for (let i = 0; i < ring.count; i++) {
      const angle = (i / ring.count) * Math.PI * 2 + ringIndex * 0.6;
      nodes.push({
        pos: new THREE.Vector3(
          Math.cos(angle) * ring.radius,
          ring.y + Math.sin(angle * 2) * ring.tilt,
          Math.sin(angle) * ring.radius,
        ),
        scale: 0.055 + ((i * 7 + ringIndex * 3) % 5) * 0.012,
        accent: (i + ringIndex) % 3 === 0,
      });
    }
  });

  return nodes;
}

/** Index pairs joined by lines: neighbouring nodes plus every node to the core. */
function buildEdges(nodes: NodeDef[]) {
  const pairs: [number, number][] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].pos.distanceTo(nodes[j].pos) < 1.35) pairs.push([i, j]);
    }
  }
  return pairs;
}

function Cluster({ hovered, onHover }: { hovered: number | null; onHover: (i: number | null) => void }) {
  const group = React.useRef<THREE.Group>(null);
  const { nodes, edgePositions, coreEdges } = React.useMemo(() => {
    const n = buildNodes();
    const pairs = buildEdges(n);
    const arr = new Float32Array(pairs.length * 6);
    pairs.forEach(([a, b], k) => {
      arr.set([n[a].pos.x, n[a].pos.y, n[a].pos.z, n[b].pos.x, n[b].pos.y, n[b].pos.z], k * 6);
    });
    const core = new Float32Array(n.length * 6);
    n.forEach((node, k) => {
      core.set([0, 0, 0, node.pos.x, node.pos.y, node.pos.z], k * 6);
    });
    return { nodes: n, edgePositions: arr, coreEdges: core };
  }, []);

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    // slow breathing on the Z axis so it does not feel stiff
    group.current.rotation.z = Math.sin(t * 0.22) * 0.06;
    group.current.position.y = Math.sin(t * 0.5) * 0.05;
    // extra core spin while a node is highlighted
    if (hovered !== null) group.current.rotation.y += delta * 0.22;
  });

  return (
    <group ref={group}>
      {/* inti: ikosahedron kawat */}
      <mesh>
        <icosahedronGeometry args={[0.62, 1]} />
        <meshBasicMaterial color={RUST} wireframe transparent opacity={0.85} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial
          color="#1d1915"
          emissive={RUST}
          emissiveIntensity={hovered !== null ? 0.9 : 0.35}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* lines between nodes */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edgePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={DIM} transparent opacity={0.55} />
      </lineSegments>

      {/* lines from the core to each node */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[coreEdges, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={MOSS} transparent opacity={0.2} />
      </lineSegments>

      {/* node */}
      {nodes.map((node, i) => {
        const isHot = hovered === i;
        return (
          <mesh
            key={i}
            position={node.pos}
            scale={isHot ? node.scale * 2.1 : node.scale}
            onPointerOver={(e) => {
              e.stopPropagation();
              onHover(i);
            }}
            onPointerOut={() => onHover(null)}
          >
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={isHot ? BONE : node.accent ? RUST : MOSS}
              emissive={isHot ? BONE : node.accent ? RUST : MOSS}
              emissiveIntensity={isHot ? 1.4 : 0.45}
              roughness={0.35}
              metalness={0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Wraps the cluster and applies rotation from the cursor drag. */
function DraggableCluster({
  rotation,
  hovered,
  onHover,
}: {
  rotation: React.MutableRefObject<{ x: number; y: number }>;
  hovered: number | null;
  onHover: (i: number | null) => void;
}) {
  const outer = React.useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!outer.current) return;
    const damp = 1 - Math.pow(0.001, delta);
    outer.current.rotation.x += (rotation.current.x - outer.current.rotation.x) * damp;
    outer.current.rotation.y += (rotation.current.y - outer.current.rotation.y) * damp;
  });

  return (
    <group ref={outer}>
      <Cluster hovered={hovered} onHover={onHover} />
    </group>
  );
}

export function HeroScene({ className }: { className?: string }) {
  const rotation = React.useRef({ x: 0.18, y: 0.4 });
  const drag = React.useRef({ active: false, x: 0, y: 0 });
  const auto = React.useRef(true);
  const [hovered, setHovered] = React.useState<number | null>(null);
  const [dragging, setDragging] = React.useState(false);

  // automatic spin when there is no drag
  React.useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (auto.current && !drag.current.active) {
        rotation.current.y += 0.0032;
        rotation.current.x += Math.sin(performance.now() / 4200) * 0.0012;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { active: true, x: e.clientX, y: e.clientY };
    auto.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current.x = e.clientX;
    drag.current.y = e.clientY;
    rotation.current.y += dx * 0.007;
    rotation.current.x = Math.max(-1.1, Math.min(1.1, rotation.current.x + dy * 0.007));
  };

  const endDrag = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDragging(false);
    window.setTimeout(() => {
      auto.current = true;
    }, 2200);
  };

  return (
    <div
      className={cn(
        "relative select-none touch-none",
        dragging ? "cursor-grabbing" : "cursor-grab",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      role="img"
      aria-label="Three-dimensional view of an infrastructure node cluster that can be rotated by dragging the cursor"
    >
      <Canvas
        camera={{ position: [0, 0.6, 6.4], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[4, 5, 5]} intensity={55} color="#ffd9c2" />
        <pointLight position={[-5, -3, -4]} intensity={30} color="#9fd39a" />
        <DraggableCluster rotation={rotation} hovered={hovered} onHover={setHovered} />
      </Canvas>

      {/* interaction hint, hidden once dragged */}
      <div
        className={cn(
          "pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap",
          "font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground",
          "transition-opacity duration-500",
          dragging ? "opacity-0" : "opacity-100",
        )}
      >
        drag to rotate
      </div>
    </div>
  );
}
