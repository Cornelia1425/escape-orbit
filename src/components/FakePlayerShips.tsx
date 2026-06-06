import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import Ship from "./Ship";
import type { FakePlayer } from "../types";

interface FakePlayerShipsProps {
  players: FakePlayer[];
  onUpdate: (players: FakePlayer[]) => void;
}

const FAKE_PLAYER_COLORS = ["#66ffcc", "#ffcc66", "#ff88cc", "#88ccff", "#aaff88"];

export default function FakePlayerShips({ players, onUpdate }: FakePlayerShipsProps) {
  const playersRef = useRef(players);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useFrame((_, delta) => {
    let changed = false;
    const updated = playersRef.current.map((p) => {
      if (p.status !== "flying") return p;
      const newProgress = Math.min(1, p.progress + p.speed * delta);
      if (newProgress !== p.progress) changed = true;
      return { ...p, progress: newProgress };
    });
    if (changed) {
      playersRef.current = updated;
      onUpdate(updated);
    }
  });

  return (
    <>
      {players.map((p, i) => {
        const x = -5 + p.progress * 10;
        return (
          <Ship
            key={p.name}
            position={[x, p.laneY, 0]}
            color={FAKE_PLAYER_COLORS[i % FAKE_PLAYER_COLORS.length]}
            label={p.name}
            showLabel
            failed={p.status === "failed"}
          />
        );
      })}
    </>
  );
}
