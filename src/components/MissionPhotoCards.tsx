import { Html } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import * as THREE from "three";
import type { Identity } from "spacetimedb";
import type { MissionPhoto, PhotoTransform } from "../module_bindings/types";

interface MissionPhotoCardsProps {
  photos: MissionPhoto[];
  transforms: PhotoTransform[];
  currentIdentity: Identity | null;
  onUpdateTransform: (photoId: bigint, posX: number, posY: number, size: number) => void;
}

function columnPos(index: number): [number, number, number] {
  const side = index % 2 === 0 ? -1 : 1;
  const row  = Math.floor(index / 2);
  return [side * 7.4, 1.6 - row * 1.5, -1];
}

type DragState = {
  id: string;
  startMouseX: number;
  startMouseY: number;
  startPos: [number, number, number];
};

type ResizeState = {
  id: string;
  startMouseX: number;
  startMouseY: number;
  startSize: number;
};

export default function MissionPhotoCards({ photos, transforms, currentIdentity, onUpdateTransform }: MissionPhotoCardsProps) {
  const transformMap = useMemo(() => {
    const m = new Map<string, PhotoTransform>();
    transforms.forEach(t => m.set(String(t.photoId), t));
    return m;
  }, [transforms]);
  const { camera, size } = useThree();
  // Local state used only during active drag/resize for smooth UX
  const [localPositions, setLocalPositions] = useState<Map<string, [number, number, number]>>(new Map());
  const [localSizes, setSizes] = useState<Map<string, number>>(new Map());
  const [floatOffsets, setFloatOffsets] = useState<Map<string, number>>(new Map());
  const timeRef   = useRef(0);
  const dragRef   = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);

  const sortedPhotos = useMemo(
    () => [...photos].sort((a, b) => Number(a.id - b.id)),
    [photos]
  );

  useFrame((_, delta) => {
    timeRef.current += delta;
    const next = new Map<string, number>();
    photos.forEach((photo) => {
      const phase = Number(photo.id % 100n) * 0.063;
      next.set(String(photo.id), Math.sin(timeRef.current * 0.5 + phase) * 0.12);
    });
    setFloatOffsets(next);
  });

  // Server pos/size or fallback to column layout
  const getBase = (photo: MissionPhoto, index: number): [number, number, number] => {
    const t = transformMap.get(String(photo.id));
    if (t && t.size > 0) return [t.posX, t.posY, -1];
    return columnPos(index);
  };

  const getServerSize = (photo: MissionPhoto): number => {
    const t = transformMap.get(String(photo.id));
    return t && t.size > 0 ? t.size : 72;
  };

  const getPosition = (photo: MissionPhoto, index: number): [number, number, number] => {
    const base   = localPositions.get(String(photo.id)) ?? getBase(photo, index);
    const floatY = floatOffsets.get(String(photo.id)) ?? 0;
    return [base[0], base[1] + floatY, base[2]];
  };

  const getSize = (photo: MissionPhoto): number =>
    localSizes.get(String(photo.id)) ?? getServerSize(photo);

  const getWorldDelta = useCallback((dx: number, dy: number, z: number): [number, number] => {
    const cam = camera as THREE.PerspectiveCamera;
    const fov = cam.fov * (Math.PI / 180);
    const distance  = Math.abs(cam.position.z - z);
    const worldHeight = 2 * Math.tan(fov / 2) * distance;
    const scale = worldHeight / size.height;
    return [dx * scale, -dy * scale];
  }, [camera, size]);

  const handleMouseDown = useCallback((e: React.MouseEvent, photo: MissionPhoto, index: number) => {
    e.stopPropagation();
    const id = String(photo.id);
    dragRef.current = {
      id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPos: localPositions.get(id) ?? getBase(photo, index),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localPositions]);

  const handleResizeDown = useCallback((e: React.MouseEvent, photo: MissionPhoto) => {
    e.stopPropagation();
    resizeRef.current = {
      id: String(photo.id),
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startSize: localSizes.get(String(photo.id)) ?? getServerSize(photo),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSizes]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (resizeRef.current) {
        const { id, startMouseX, startMouseY, startSize } = resizeRef.current;
        const delta   = (e.clientX - startMouseX + e.clientY - startMouseY) / 2;
        const newSize = Math.max(50, Math.min(300, startSize + delta));
        setSizes(prev => new Map(prev).set(id, newSize));
        return;
      }
      if (!dragRef.current) return;
      const { id, startMouseX, startMouseY, startPos } = dragRef.current;
      const [wx, wy] = getWorldDelta(e.clientX - startMouseX, e.clientY - startMouseY, startPos[2]);
      setLocalPositions(prev => {
        const next = new Map(prev);
        next.set(id, [startPos[0] + wx, startPos[1] + wy, startPos[2]]);
        return next;
      });
    };

    const onMouseUp = () => {
      // Sync final position/size to SpacetimeDB on release
      if (dragRef.current) {
        const { id, startPos } = dragRef.current;
        const pos  = localPositions.get(id) ?? startPos;
        const photo = photos.find(p => String(p.id) === id);
        if (photo) {
          const sz = localSizes.get(id) ?? getServerSize(photo);
          onUpdateTransform(photo.id, pos[0], pos[1], sz);
        }
        dragRef.current = null;
      }
      if (resizeRef.current) {
        const { id } = resizeRef.current;
        const photo = photos.find(p => String(p.id) === id);
        if (photo) {
          const pos = localPositions.get(id) ?? getBase(photo, sortedPhotos.indexOf(photo));
          const sz  = localSizes.get(id) ?? getServerSize(photo);
          onUpdateTransform(photo.id, pos[0], pos[1], sz);
        }
        resizeRef.current = null;
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getWorldDelta, localPositions, localSizes, photos, onUpdateTransform]);

  const isOwn = (photo: MissionPhoto) =>
    currentIdentity != null && photo.playerIdentity.isEqual(currentIdentity);

  return (
    <>
      {sortedPhotos.map((photo, index) => {
        const own = isOwn(photo);
        const sz  = getSize(photo);
        return (
          <Html key={String(photo.id)} position={getPosition(photo, index)} center occlude={false}>
            <div
              onMouseDown={(e) => handleMouseDown(e, photo, index)}
              style={{
                background: "rgba(6,14,36,0.72)",
                border: `1px solid ${own ? "rgba(100,200,255,0.45)" : "rgba(100,200,255,0.22)"}`,
                borderRadius: "2px",
                padding: "4px 4px 18px 4px",
                boxShadow: "0 0 18px rgba(40,140,255,0.18)",
                cursor: "grab",
                userSelect: "none",
                width: `${sz}px`,
                position: "relative",
                opacity: 0.82,
                backdropFilter: "blur(4px)",
              }}
            >
              <img
                src={photo.imageUrl}
                alt={photo.playerName}
                draggable={false}
                style={{ width: `${sz - 8}px`, height: `${sz - 8}px`, objectFit: "cover", display: "block" }}
              />
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "7px",
                color: "rgba(140,200,255,0.7)",
                letterSpacing: "0.08em",
                textAlign: "center",
                marginTop: "5px",
                textTransform: "uppercase",
              }}>
                {photo.playerName}
              </div>
              <div
                onMouseDown={(e) => handleResizeDown(e, photo)}
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  width: 10,
                  height: 10,
                  cursor: "nwse-resize",
                  borderRight: "2px solid rgba(100,200,255,0.5)",
                  borderBottom: "2px solid rgba(100,200,255,0.5)",
                }}
              />
            </div>
          </Html>
        );
      })}
    </>
  );
}
