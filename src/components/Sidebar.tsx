import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGameContext } from "@/context/GameContext";
import { Pencil, MessageCircle, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dryrunResult, messageResult } from "@/lib/utils";

export default function Sidebar() {
  const { gameState, joinedPlayers } = useGameContext();

  const [chatMessages, setChatMessages] = useState<
    {
      playerId: string;
      playerName: string;
      message: string;
      timeStamp: number;
    }[]
  >([]);
  const [message, setMessage] = useState("");

  const fetchChatMessages = async () => {
    const chatMessages = await dryrunResult(gameState.gameProcess, [
      {
        name: "Action",
        value: "Get-Messages",
      },
    ]);

    console.log("Chat messages", chatMessages);
    setChatMessages(chatMessages);
  };

  const sendChatMessage = async () => {
    const { Messages, Spawns, Output, Error } = await messageResult(
      gameState.gameProcess,
      [
        {
          name: "Action",
          value: "Broadcast",
        },
      ],
      message
    );

    setMessage("");
    fetchChatMessages();
  };

  useEffect(() => {
    setInterval(() => {
      fetchChatMessages();
    }, 5000);
  }, []);

  return (
    <aside
      // className={`w-80 z-10 bg-muted p-6 transition-all duration-300 ease-in-out ${showSidebar ? "translate-x-0" : "translate-x-full"}`}
      className={`w-80 z-10 bg-muted p-6`}
    >
      <Tabs defaultValue="leaderboard">
        <TabsList className="w-full">
          <TabsTrigger value="chat" className="w-1/2">
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="w-1/2">
            <Trophy className="w-4 h-4 mr-2" />
            Leaderboard
          </TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="mt-4">
          <div className="h-[calc(100vh-16rem)] overflow-y-auto mb-4">
            {chatMessages.map((msg, index) => (
              <div key={index} className="mb-2 flex flex-col gap-2">
                <div className="flex justify-between">
                  <div>
                    <span className="font-semibold text-muted">
                      {msg.playerName}:
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      (
                      {msg.playerId
                        ? `${msg.playerId.slice(0, 4)}...${msg.playerId.slice(-3)}`
                        : "0xANON"}
                      )
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.timeStamp).toLocaleTimeString()}
                  </span>
                </div>
                <span>{msg.message}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Type a message"
              className="flex-grow"
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button onClick={() => sendChatMessage()}>Send</Button>
          </div>
        </TabsContent>
        <TabsContent value="leaderboard" className="mt-4">
          <ul>
            {joinedPlayers
              // .sort((a, b) => b.score! - a.score!)
              .map((user) => (
                <li
                  key={user.id}
                  className="flex justify-between items-center mb-2"
                >
                  <span className="flex items-center">
                    {user.name}
                    {user.id === gameState.activeDrawer && (
                      <Pencil className="w-4 h-4 ml-2 text-primary" />
                    )}
                  </span>
                  <span>{user.score}</span>
                </li>
              ))}
          </ul>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
