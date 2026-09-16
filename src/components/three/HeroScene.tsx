import * as React from "react";
import { Link } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { X, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEntries } from "@/entries/EntriesProvider";
import type { Skill } from "@/data/portfolio";

/* --------------------------------------------------------------------------
   3D scene: an infrastructure skill-node cluster.
   Nodes represent skills configured by the portfolio admin.
   Clicking a node inspects the skill in an interactive card.
   Dragging rotates the cluster.
   -------------------------------------------------------------------------- */

const RUST = new THREE.Color("#e2704a");
const MOSS = new THREE.Color("#6a9364");
const BONE = new THREE.Color("#f0ebe3");
const DIM = new THREE.Color("#6f5e4d");

/** Duration of the inspection card enter and exit animation. */
const CARD_ANIM_MS = 180;
/** Unmount a touch later so the exit animation is always seen to finish. */
const CARD_EXIT_MS = CARD_ANIM_MS + 20;

/** Two entries are the same skill when their ids match, falling back to the name. */
function sameSkill(a: Skill, b: Skill) {
  return a.id && b.id ? a.id === b.id : a.name === b.name;
}

interface NodeDef {
  pos: THREE.Vector3;
  scale: number;
  accent: boolean;
  color: THREE.Color;
  skill: Skill;
}

/** Node positions built deterministically from the list of skills. */
function buildNodes(skills: Skill[]): NodeDef[] {
  if (!skills || skills.length === 0) return [];

  const count = skills.length;
  // Distribute across 1-3 concentric rings based on skill count
  const ringConfigs =
    count <= 8
      ? [{ count, radius: 2.0, y: 0, tilt: 0.1 }]
      : count <= 18
      ? [
          { count: Math.ceil(count * 0.45), radius: 1.8, y: 0.45, tilt: 0.15 },
          { count: count - Math.ceil(count * 0.45), radius: 2.35, y: -0.4, tilt: -0.12 },
        ]
      : [
          { count: Math.round(count * 0.3), radius: 1.75, y: 0.72, tilt: 0.18 },
          { count: Math.round(count * 0.45), radius: 2.35, y: -0.15, tilt: -0.1 },
          {
            count: count - Math.round(count * 0.3) - Math.round(count * 0.45),
            radius: 1.6,
            y: -0.85,
            tilt: 0.28,
          },
        ];

  const nodes: NodeDef[] = [];
  let skillIndex = 0;

  ringConfigs.forEach((ring, ringIndex) => {
    for (let i = 0; i < ring.count && skillIndex < count; i++, skillIndex++) {
      const skill = skills[skillIndex];
      const angle = (i / ring.count) * Math.PI * 2 + ringIndex * 0.65;
      // Node size doubles as the click target, so it is kept large enough to
      // hit comfortably while still scaling a little with proficiency.
      const baseScale = 0.082 + (Math.min(Math.max(skill.level, 35), 100) / 100) * 0.05;

      let nodeColor = MOSS;
      let isAccent = false;

      if (skill.category === "Leadership" || skill.category === "Engineering") {
        nodeColor = RUST;
        isAccent = true;
      } else if (skill.category === "Security") {
        nodeColor = new THREE.Color("#c84b2c");
        isAccent = true;
      } else if (skill.category === "Data") {
        nodeColor = new THREE.Color("#4e7953");
      }

      nodes.push({
        pos: new THREE.Vector3(
          Math.cos(angle) * ring.radius,
          ring.y + Math.sin(angle * 2) * ring.tilt,
          Math.sin(angle) * ring.radius,
        ),
        scale: baseScale,
        accent: isAccent,
        color: nodeColor,
        skill,
      });
    }
  });

  return nodes;
}

/** Index pairs joined by lines: neighbouring nodes plus every node to the core. */
function buildEdges(nodes: NodeDef[]) {
  const pairs: [number, number][] = [];
  const maxDistance = nodes.length > 20 ? 1.45 : nodes.length > 10 ? 1.85 : 2.6;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].pos.distanceTo(nodes[j].pos) < maxDistance) {
        pairs.push([i, j]);
      }
    }
  }
  return pairs;
}

function Cluster({
  nodes,
  edgePositions,
  coreEdges,
  hovered,
  selectedSkill,
  dragMovedRef,
  onHover,
  onSelect,
}: {
  nodes: NodeDef[];
  edgePositions: Float32Array;
  coreEdges: Float32Array;
  hovered: number | null;
  selectedSkill: Skill | null;
  dragMovedRef: React.MutableRefObject<boolean>;
  onHover: (i: number | null) => void;
  onSelect: (skill: Skill) => void;
}) {
  const group = React.useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    // slow breathing on the Z axis so it does not feel stiff
    group.current.rotation.z = Math.sin(t * 0.22) * 0.06;
    group.current.position.y = Math.sin(t * 0.5) * 0.05;
    // extra core spin while a card is open, paused while the cursor rests on a
    // node so the hovered target never drifts out from under a click
    if (selectedSkill !== null && hovered === null) {
      group.current.rotation.y += delta * 0.18;
    }
  });

  return (
    <group ref={group}>
      {/* core wireframe icosahedron */}
      <mesh>
        <icosahedronGeometry args={[0.62, 1]} />
        <meshBasicMaterial color={RUST} wireframe transparent opacity={0.85} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial
          color="#1d1915"
          emissive={RUST}
          emissiveIntensity={hovered !== null || selectedSkill !== null ? 0.9 : 0.35}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* lines between neighbouring nodes */}
      {edgePositions.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[edgePositions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={DIM} transparent opacity={0.55} />
        </lineSegments>
      )}

      {/* lines from the core to each node */}
      {coreEdges.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[coreEdges, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={MOSS} transparent opacity={0.2} />
        </lineSegments>
      )}

      {/* skill nodes */}
      {nodes.map((node, i) => {
        const isSelected =
          Boolean(selectedSkill) &&
          (selectedSkill?.id ? selectedSkill.id === node.skill.id : selectedSkill?.name === node.skill.name);
        const isHovered = hovered === i;
        const isHot = isHovered || isSelected;

        return (
          <mesh
            key={node.skill.id || node.skill.name || i}
            position={node.pos}
            scale={isHot ? node.scale * 1.8 : node.scale}
            onPointerOver={(e) => {
              e.stopPropagation();
              onHover(i);
            }}
            onPointerOut={() => onHover(null)}
            onClick={(e) => {
              e.stopPropagation();
              // Only select if pointer was not actively dragged across canvas
              if (!dragMovedRef.current) {
                onSelect(node.skill);
              }
            }}
          >
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={isHot ? BONE : node.color}
              emissive={isHot ? BONE : node.color}
              emissiveIntensity={isSelected ? 1.8 : isHovered ? 1.4 : 0.45}
              roughness={0.35}
              metalness={0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Wraps the cluster and applies rotation from cursor drag. */
function DraggableCluster({
  rotation,
  nodes,
  edgePositions,
  coreEdges,
  hovered,
  selectedSkill,
  dragMovedRef,
  onHover,
  onSelect,
}: {
  rotation: React.MutableRefObject<{ x: number; y: number }>;
  nodes: NodeDef[];
  edgePositions: Float32Array;
  coreEdges: Float32Array;
  hovered: number | null;
  selectedSkill: Skill | null;
  dragMovedRef: React.MutableRefObject<boolean>;
  onHover: (i: number | null) => void;
  onSelect: (skill: Skill) => void;
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
      <Cluster
        nodes={nodes}
        edgePositions={edgePositions}
        coreEdges={coreEdges}
        hovered={hovered}
        selectedSkill={selectedSkill}
        dragMovedRef={dragMovedRef}
        onHover={onHover}
        onSelect={onSelect}
      />
    </group>
  );
}

export function HeroScene({
  className,
  skills: propSkills,
}: {
  className?: string;
  skills?: Skill[];
}) {
  const { skills: contextSkills } = useEntries();
  const skills = propSkills ?? contextSkills;

  const rotation = React.useRef({ x: 0.18, y: 0.4 });
  const drag = React.useRef({ active: false, x: 0, y: 0, moved: false });
  const dragMovedRef = React.useRef(false);
  const auto = React.useRef(true);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = React.useState<number | null>(null);
  const [selectedSkill, setSelectedSkill] = React.useState<Skill | null>(null);
  const [cardClosing, setCardClosing] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  /** Mirror of `hovered`, readable from the animation loop without re-subscribing. */
  const hoveredRef = React.useRef<number | null>(null);

  /** Skill queued to open once the current card has finished closing. */
  const pendingSkill = React.useRef<Skill | null>(null);
  const closeTimer = React.useRef<number | null>(null);
  /** Set by a node click so the canvas handler below knows the click was consumed. */
  const nodeHit = React.useRef(false);

  const clearCloseTimer = React.useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const handleHover = React.useCallback((i: number | null) => {
    hoveredRef.current = i;
    setHovered(i);
  }, []);

  /** Show a card straight away, cancelling any exit animation still in flight. */
  const openCard = React.useCallback(
    (skill: Skill) => {
      clearCloseTimer();
      pendingSkill.current = null;
      setCardClosing(false);
      setSelectedSkill(skill);
    },
    [clearCloseTimer],
  );

  /**
   * Close the active card. When `next` is given, that skill opens as soon as the
   * exit animation finishes, so the previous card is always seen to close first.
   */
  const closeCard = React.useCallback(
    (next: Skill | null = null) => {
      pendingSkill.current = next;
      if (cardClosing) return; // exit already running, only retarget what opens next
      clearCloseTimer();
      setCardClosing(true);
      closeTimer.current = window.setTimeout(() => {
        closeTimer.current = null;
        const queued = pendingSkill.current;
        pendingSkill.current = null;
        setCardClosing(false);
        setSelectedSkill(queued);
      }, CARD_EXIT_MS);
    },
    [cardClosing, clearCloseTimer],
  );

  const selectSkill = React.useCallback(
    (skill: Skill) => {
      // A node was hit, so the click must not be read as an outside click.
      nodeHit.current = true;
      const current = selectedSkill;
      if (current && sameSkill(current, skill)) return; // its own node keeps the card open
      if (!current) {
        openCard(skill);
        return;
      }
      closeCard(skill); // another node: close the old card, then show this one
    },
    [selectedSkill, openCard, closeCard],
  );

  React.useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  // A left click anywhere outside this widget closes the active card.
  React.useEffect(() => {
    if (!selectedSkill) return;
    const onDocumentPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (rootRef.current?.contains(e.target as Node)) return;
      closeCard();
    };
    document.addEventListener("pointerdown", onDocumentPointerDown, true);
    return () => document.removeEventListener("pointerdown", onDocumentPointerDown, true);
  }, [selectedSkill, closeCard]);

  /** Clicks that land on the canvas but miss every node. */
  const onCanvasClick = () => {
    if (drag.current.moved) return; // a rotate gesture, not a click
    if (nodeHit.current) return; // a node click already handled this gesture
    closeCard();
  };

  const { nodes, edgePositions, coreEdges } = React.useMemo(() => {
    const n = buildNodes(skills);
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
  }, [skills]);

  // automatic spin when there is no active drag
  React.useEffect(() => {
    let raf = 0;
    const tick = () => {
      // frozen while the cursor rests on a node, so a click always lands on the
      // node the user is aiming at
      if (auto.current && !drag.current.active && hoveredRef.current === null) {
        rotation.current.y += 0.0032;
        rotation.current.x += Math.sin(performance.now() / 4200) * 0.0012;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { active: true, x: e.clientX, y: e.clientY, moved: false };
    dragMovedRef.current = false;
    nodeHit.current = false;
    auto.current = false;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      drag.current.moved = true;
      dragMovedRef.current = true;
      // Only a real drag flips this, so a plain click never flickers the hint.
      setDragging(true);
    }
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
      ref={rootRef}
      className={cn(
        "relative select-none touch-none",
        dragging ? "cursor-grabbing" : hovered !== null ? "cursor-pointer" : "cursor-grab",
        className,
      )}
      // The reticle cursor reads this, so the affordance the native cursor used
      // to carry survives now that the native pointer is hidden.
      data-cursor={dragging ? "DRAG" : hovered !== null ? "NODE" : "GRAB"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onClick={onCanvasClick}
      role="region"
      aria-label="Interactive three-dimensional view of skills cluster"
    >
      <Canvas
        camera={{ position: [0, 0.6, 6.4], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[4, 5, 5]} intensity={55} color="#ffd9c2" />
        <pointLight position={[-5, -3, -4]} intensity={30} color="#9fd39a" />
        <DraggableCluster
          rotation={rotation}
          nodes={nodes}
          edgePositions={edgePositions}
          coreEdges={coreEdges}
          hovered={hovered}
          selectedSkill={selectedSkill}
          dragMovedRef={dragMovedRef}
          onHover={handleHover}
          onSelect={selectSkill}
        />
      </Canvas>

      {/* Interactive skill inspection card */}
      {selectedSkill && (
        <div
          className="pointer-events-auto absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-[calc(100%-1.5rem)] max-w-[280px]"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            // Remount per skill so switching nodes always replays the enter
            // animation from its first frame instead of flashing mid-state.
            key={selectedSkill.id || selectedSkill.name}
            style={{ animationDuration: `${CARD_ANIM_MS}ms` }}
            className={cn(
              "panel-flagged p-3.5 bg-card/95 backdrop-blur-md shadow-lift border border-border/80 rounded-notch fill-mode-forwards",
              cardClosing
                ? "animate-out fade-out-0 zoom-out-95"
                : "animate-in fade-in zoom-in-95",
            )}
          >
            <div className="flex items-start justify-between gap-2 pl-2">
              <div className="min-w-0 pr-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary block truncate">
                  {selectedSkill.category}
                </span>
                <h4 className="font-display text-sm font-semibold tracking-tight text-foreground truncate mt-0.5">
                  {selectedSkill.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => closeCard()}
                className="text-muted-foreground hover:text-foreground p-1 transition-colors shrink-0 -mr-1 -mt-1 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Close skill details"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 pl-2 border-t border-border/50 pt-2.5">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                  Proficiency
                </p>
                <p className="font-display text-xs font-semibold tabular-nums text-foreground">
                  {selectedSkill.level}%
                </p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                  Experience
                </p>
                <p className="font-display text-xs font-semibold tabular-nums text-foreground">
                  {selectedSkill.years} yrs
                </p>
              </div>
            </div>

            <div className="mt-3 pl-2 flex items-center justify-between gap-2 pt-1">
              <span className="font-mono text-[10px] text-muted-foreground">
                Active {selectedSkill.lastUsed}
              </span>
              <Link
                to="/skills"
                className="inline-flex items-center gap-1 font-mono text-[10px] text-primary hover:underline underline-offset-2"
              >
                All skills
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* interaction hint, hidden once dragged */}
      <div
        className={cn(
          "pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap",
          "font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground",
          "transition-opacity duration-500",
          dragging ? "opacity-0" : "opacity-100",
        )}
      >
        click node to inspect · drag to rotate
      </div>
    </div>
  );
}
