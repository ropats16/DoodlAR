import { useGameContext } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  createDataItemSigner,
  dryrun,
  message,
  result,
} from "@permaweb/aoconnect";

export default function LeaveGame() {
  const { setMode, setJoinedPlayers, currentPlayer, gameState } =
    useGameContext();

  const handleLeaveRoom = async () => {
    console.log("Button clicked");

    if (currentPlayer) {
      console.log("Current player:", currentPlayer);

      try {
        // Wait for the player registration message to be sent to the AO process
        const sendRes = await message({
          process: gameState.gameProcess,
          signer: createDataItemSigner(window.arweaveWallet),
          tags: [
            {
              name: "Action",
              value: "Unregister-Player",
            },
          ],
        });

        console.log("Register player result", sendRes);

        const { Messages, Spawns, Output, Error } = await result({
          // the arweave TXID of the message
          message: sendRes,
          // the arweave TXID of the process
          process: gameState.gameProcess,
        });

        console.dir(
          { Messages, Spawns, Output, Error },
          { depth: Infinity, colors: true }
        );

        if (Messages[0].Data === "Successfully unregistered from game.") {
          toast({
            title: "Successfully unregistered.",
            description: "You have left the room.",
          });

          setJoinedPlayers([]);
          setMode("landing");
        }
      } catch (error) {
        toast({
          title: "An error occurred while unregistering.",
          description: "Please try again.",
        });
      }
    }
  };

  return (
    <Button variant="outline" size="lg" onClick={handleLeaveRoom}>
      Leave Room
    </Button>
  );
}
