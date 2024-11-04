"use client";

import { useEffect, useState } from "react";

import Sidebar from "./Sidebar";
import Drawing from "./Drawing";
import { useGameContext } from "@/context/GameContext";
import { dryrunResult } from "@/lib/utils";
import Guessing from "./Guessing";
import { toast } from "@/hooks/use-toast";
import Results from "./Results";

export default function GameRound() {
  const {
    mode,
    gameState,
    joinedPlayers,
    setJoinedPlayers,
    setGamestate,
    setMode,
  } = useGameContext();

  const [timeLeft, setTimeLeft] = useState(60);

  const fetchGameState = async () => {
    console.log("Fetching game state");
    const GameState = await dryrunResult(gameState.gameProcess, [
      {
        name: "Action",
        value: "Game-State",
      },
    ]);

    console.log("Game state result", GameState.mode);

    if (GameState.mode == "Drawing" && mode != "drawing") {
      toast({
        title: "Next round started.",
        description: "You are being redirected to the drawing page.",
      });
      setGamestate({
        ...gameState,
        currentRound: GameState.currentRound,
        activeDrawer: GameState.activeDrawer,
      });
      setMode("drawing");
    } else if (GameState.mode == "Guessing" && mode != "guessing") {
      toast({
        title: "Time to guess!",
        description: "You are being redirected to the guessing page.",
      });
      setGamestate({
        ...gameState,
      });
      setMode("guessing");
    } else if (GameState.mode == "Completed" && mode != "results") {
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
      } else if (timeLeft === 0) {
        console.log("Fetching game state from round for timer");
        fetchGameState();
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [timeLeft]);

  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Fetching game state from round for new mode");
      fetchGameState();
    }, 5000);

    if (mode === "results") {
      clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (mode !== "results") {
      console.log("Fetching game state from round for mode change");
      userRes();
      //   fetchGameState();
      setTimeLeft(60);
    }
  }, [mode]);

  return (
    <main className="flex bg-background min-h-screen text-foreground">
      {mode === "drawing" && <Drawing timeLeft={timeLeft} />}
      {mode === "guessing" && <Guessing timeLeft={timeLeft} />}
      {mode !== "results" && <Sidebar />}
      {mode === "results" && <Results />}
    </main>
  );
}
