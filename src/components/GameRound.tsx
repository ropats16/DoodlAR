"use client";

import { use, useEffect, useState } from "react";

import Sidebar from "./Sidebar";
import Drawing from "./Drawing";
import { useGameContext } from "@/context/GameContext";
import { dryrunResult } from "@/lib/utils";
import Guessing from "./Guessing";
import { toast } from "@/hooks/use-toast";
import Results from "./Results";
import { useActiveAddress } from "arweave-wallet-kit";

export default function GameRound() {
  const {
    mode,
    gameState,
    joinedPlayers,
    setJoinedPlayers,
    currentPlayer,
    setGamestate,
    setMode,
  } = useGameContext();

  const [timeLeft, setTimeLeft] = useState(60);

  const activeAddress = useActiveAddress();

  const fetchGameState = async () => {
    console.log("Fetching game state");
    const GameState = await dryrunResult(gameState.gameProcess, [
      {
        name: "Action",
        value: "Game-State",
      },
    ]);

    console.log("Game state result", GameState.mode, mode);

    if (GameState.mode === "Drawing" && mode !== "drawing") {
      setGamestate({
        ...gameState,
        currentRound: GameState.currentRound,
        activeDrawer: GameState.activeDrawer,
      });
      setMode("drawing");
    } else if (GameState.mode === "Guessing" && mode !== "guessing") {
      setMode("guessing");
    } else if (GameState.mode === "Completed" && mode !== "results") {
      toast({
        title: "Final results are in!",
        description: "You are being redirected to the results page.",
      });
      setMode("results");
    } else {
      console.log("No mode change detected");
    }
  };

  const userRes = async () => {
    const updatedPlayers = await dryrunResult(gameState.gameProcess, [
      {
        name: "Action",
        value: "Joined-Players",
      },
    ]);

    console.log("Joined users result in waiting room", updatedPlayers);
    if (updatedPlayers !== joinedPlayers) {
      setJoinedPlayers(updatedPlayers);
    } else console.log("No active player updates");
  };

  useEffect(() => {
    const timerInterval = setInterval(() => {
      if (timeLeft > 0 && mode !== "results") {
        setTimeLeft(timeLeft - 1);
      } else if (timeLeft === 0 || timeLeft % 5 === 0) {
        console.log("Fetching game state from round for timer");
        fetchGameState();
      }
    }, 1000);

    if (mode === "results") {
      clearInterval(timerInterval);
    }

    return () => clearInterval(timerInterval);
  }, [timeLeft, mode, activeAddress]);

  //   useEffect(() => {
  //     const interval = setInterval(() => {
  //       console.log("Fetching game state from round for new mode");
  //       fetchGameState();
  //     }, 5000);

  //     if (mode === "results") {
  //       clearInterval(interval);
  //     }

  //     // return () => clearInterval(interval);
  //   }, [mode]);

  useEffect(() => {
    if (mode !== "results") {
      console.log("Fetching game state from round for mode change");
      userRes();
      fetchGameState();
      setTimeLeft(60);
    }
  }, [mode, activeAddress]);

  return (
    <main className="flex bg-background min-h-screen text-foreground">
      {mode === "drawing" && <Drawing timeLeft={timeLeft} />}
      {mode === "guessing" && <Guessing timeLeft={timeLeft} />}
      {mode !== "results" && <Sidebar />}
      {mode === "results" && <Results />}
    </main>
  );
}
