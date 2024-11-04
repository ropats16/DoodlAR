"use client";

// import LandingPage from "@/components/LandingPage";
// import WaitingRoom from "@/components/WaitingRoom";
// import GameRound from "@/components/GameRound";
import { useGameContext } from "@/context/GameContext";
import { useConnection } from "arweave-wallet-kit";

import dynamic from "next/dynamic";

const LandingPage = dynamic(() => import("@/components/LandingPage"), {
  ssr: false,
});

const WaitingRoom = dynamic(() => import("@/components/WaitingRoom"), {
  ssr: false,
});

const GameRound = dynamic(() => import("@/components/GameRound"), {
  ssr: false,
});

export default function SketchGuessApp() {
  const { mode, setMode, setCurrentPlayer } = useGameContext();
  const { connected } = useConnection();

  if (!connected) {
    setMode("landing");
    setCurrentPlayer(null);
  }

  return (
    <div className="flex flex-col justify-center h-full my-10">
      {mode === "landing" && <LandingPage />}
      {mode === "waiting" && <WaitingRoom />}
      {(mode === "drawing" || mode === "guessing" || mode === "results") && (
        <GameRound />
      )}
    </div>
  );
}
