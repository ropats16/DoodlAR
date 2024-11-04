"use client";

import { Button } from "@/components/ui/button";
import { UserCircle2, Copy, Users } from "lucide-react";
import { useGameContext } from "@/context/GameContext";
import LeaveGame from "./LeaveGame";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { dryrunResult, messageResult } from "@/lib/utils";

const pastelColors = [
  "bg-red-200",
  "bg-yellow-200",
  "bg-green-200",
  "bg-blue-200",
  "bg-indigo-200",
  "bg-purple-200",
  "bg-pink-200",
  "bg-orange-200",
];

export default function WaitingRoom() {
  const {
    currentPlayer,
    joinedPlayers,
    setJoinedPlayers,
    setMode,
    gameState,
    setGamestate,
  } = useGameContext();
  const maxPlayers = 8;

  if (!currentPlayer) {
    setMode("landing");
    return null;
  }

  const handleStartGame = async () => {
    if (joinedPlayers.length >= 2) {
      const { Messages, Output, Spawns, Error } = await messageResult(
        gameState.gameProcess,
        [
          {
            name: "Action",
            value: "Start-Game",
          },
        ]
      );
      // setMode("drawing");
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
    } else console.log("No new players joined");
  };

  const fetchGameState = async () => {
    const GameState = await dryrunResult(gameState.gameProcess, [
      {
        name: "Action",
        value: "Game-State",
      },
    ]);

    console.log("Game state result", GameState.mode);

    setGamestate({
      ...gameState,
      activeDrawer: GameState.activeDrawer,
      currentRound: GameState.currentRound,
      maxRounds: GameState.maxRounds,
    });

    if (GameState.mode == "Drawing") {
      toast({
        title: "Game in progress.",
        description: "You are being redirected to the game.",
      });
      setMode("drawing");
    } else if (GameState.mode == "Guessing") {
      toast({
        title: "Game in progress.",
        description: "You are being redirected to the guessing page.",
      });
      setMode("guessing");
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      userRes();
      fetchGameState();
    }, 2000);

    return () => clearInterval(interval);
  }, [joinedPlayers]);

  return (
    <div className="flex flex-col items-center justify-between bg-background min-h-screen text-foreground p-6 md:p-12">
      <header className="w-full max-w-4xl flex justify-between items-center">
        <div className="flex items-center space-x-2 mt-4">
          <span className="text-sm font-medium">Room Code:</span>
          <code className="bg-muted px-2 py-1 rounded">
            {gameState.gameProcess}
          </code>
          <Button
            variant="ghost"
            size="icon"
            title="Copy room code"
            onClick={() => navigator.clipboard.writeText(gameState.gameProcess)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center w-full max-w-4xl">
        <h2 className="text-3xl font-bold mb-8">Waiting Room</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8 w-full max-w-2xl">
          {Array.from({ length: maxPlayers }, (_, i) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center p-4 rounded-lg aspect-square ${
                i < joinedPlayers.length
                  ? pastelColors[i % pastelColors.length]
                  : "bg-muted"
              }`}
            >
              {i < joinedPlayers.length ? (
                <>
                  <UserCircle2 className="h-12 w-12 mb-2 text-primary" />
                  <span className="text-sm font-medium">
                    {joinedPlayers[i].name}
                  </span>
                </>
              ) : (
                <Users className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {currentPlayer.isCreator && (
            <Button
              size="lg"
              className="px-8"
              onClick={handleStartGame}
              disabled={joinedPlayers.length < 2}
            >
              Start Game
            </Button>
          )}
          <LeaveGame />
        </div>

        <div className="w-full mt-10 max-w-4xl text-center text-sm text-muted-foreground">
          <p>
            {joinedPlayers.length} / {maxPlayers} players joined
          </p>
        </div>
      </main>
    </div>
  );
}
