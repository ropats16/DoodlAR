import { useState, FC, useEffect } from "react";
import { Excalidraw, exportToSvg } from "@excalidraw/excalidraw";
import { useGameContext } from "@/context/GameContext";
import { DataItem } from "arbundles";
import { messageResult } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface CanvasProps {
  timeLeft: number;
  setChosenWord: (word: string) => void;
}

const Canvas: FC<CanvasProps> = ({ timeLeft, setChosenWord }) => {
  const { gameState, setMode } = useGameContext();
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  const handleSubmitDrawing = async () => {
    if (!excalidrawAPI) {
      return;
    }
    const elements = excalidrawAPI.getSceneElements();
    if (!elements || !elements.length) {
      return;
    }
    const canvas = await exportToSvg({
      elements,
      appState: {
        exportWithDarkMode: false,
      },
      files: excalidrawAPI.getFiles(),
    });

    console.log("Excalidraw canvas", canvas);
    const svgString = new XMLSerializer().serializeToString(canvas);

    const signedData = await (window.arweaveWallet as any).signDataItem({
      data: svgString,
      tags: [
        {
          name: "Content-Type",
          value: "image/svg+xml",
        },
      ],
    });

    const dataItem = new DataItem(signedData);

    const uploadRes = await fetch(`https://upload.ardrive.io/v1/tx`, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        Accept: "application/json",
      },
      body: dataItem.getRaw(),
    }).then((res) => res.json());

    console.log("Upload response", uploadRes.id);

    const URL = `https://arweave.net/${uploadRes.id}`;

    console.log("URL", URL);

    const { Messages, Spawns, Output, Error } = await messageResult(
      gameState.gameProcess,
      [
        {
          name: "Action",
          value: "Submit-Drawing",
        },
      ],
      URL
    );

    setChosenWord("");
    setMode("guessing");
  };

  useEffect(() => {
    console.log("Time Left from Canvas", timeLeft);
    if (timeLeft === 0) {
      toast({
        title: "Time's up!",
        description: "Submitting your drawing.",
      });
      handleSubmitDrawing();
    }
  }, [timeLeft]);

  return (
    <div className="flex flex-col w-full items-center justify-center gap-8">
      <div
        style={{ height: "500px", width: "500px" }}
        className="bg-red-400 p-6"
      >
        <Excalidraw excalidrawAPI={(api) => setExcalidrawAPI(api)} />
      </div>
      <Button variant="outline" size="lg" onClick={handleSubmitDrawing}>
        Submit Drawing
      </Button>
    </div>
  );
};

export default Canvas;
