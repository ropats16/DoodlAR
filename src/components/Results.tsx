import { useGameContext } from "@/context/GameContext";
import { Medal, Trophy, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const topColors = [
  "bg-yellow-100 border-yellow-300",
  "bg-gray-100 border-gray-300",
  "bg-orange-100 border-orange-300",
];

export default function Results() {
  const { joinedPlayers, setMode } = useGameContext();

  const getMedalIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Medal className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-orange-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-12 h-full">
      <div className="w-full max-w-2xl">
        <h2 className="text-4xl md:text-6xl font-bold mb-8 text-center">
          Game Over
        </h2>
        <p className="text-xl md:text-2xl mb-12 text-center text-muted-foreground">
          Final Scores and Rankings
        </p>
        <div className="bg-muted rounded-lg p-6 mb-12">
          <ul className="space-y-4">
            {joinedPlayers
              .slice()
              .sort((a, b) => b.score! - a.score!)
              .map((player, index) => (
                <li
                  key={player.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    index < 3
                      ? topColors[index]
                      : "bg-background border-transparent"
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-2xl font-bold mr-4 w-8">
                      {index + 1}.
                    </span>
                    {getMedalIcon(index)}
                    <span className="text-xl ml-2">{player.name}</span>
                  </div>
                  <span className="text-xl font-semibold">
                    {player.score} pts
                  </span>
                </li>
              ))}
          </ul>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={() => setMode("waiting")} className="px-8">
            <Trophy className="w-5 h-5 mr-2" />
            Play Again
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setMode("landing")}
            className="px-8"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
