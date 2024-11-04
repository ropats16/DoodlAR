"use client";

import { useGameContext } from "@/context/GameContext";
import { dryrun } from "@permaweb/aoconnect";
import { useActiveAddress, useConnection } from "arweave-wallet-kit";
import { useEffect } from "react";

export default function PlayerProfile() {
  const { currentPlayer, setCurrentPlayer } = useGameContext();

  const activeAddress = useActiveAddress();
  const { connected } = useConnection();

  const fetchPlayerProfile = async () => {
    console.log("Fetching player profile for", activeAddress);

    const profileIdRes = await dryrun({
      process: "SNy4m-DrqxWl01YqGM4sxI8qCni-58re8uuJLvZPypY",
      tags: [
        {
          name: "Action",
          value: "Get-Profiles-By-Delegate",
        },
      ],
      //   signer: createDataItemSigner(window.arweaveWallet),
      data: JSON.stringify({ Address: activeAddress }),
    }).then((res) => JSON.parse(res.Messages[0].Data));

    const profileRes = await dryrun({
      process: profileIdRes && profileIdRes[0].ProfileId,
      tags: [
        {
          name: "Action",
          value: "Info",
        },
      ],
      data: "",
    }).then((res) => {
      try {
        return JSON.parse(res.Messages[0].Data);
      } catch (error) {
        console.log("Failed to parse JSON:", error);
        // return {}
        return {
          Profile: {
            DisplayName: "ANON",
            ProfileImage: "NONE",
          },
        };
      }
    });

    // console.log("Player profile result", profileRes.Profile);

    const playerDetails = {
      id: activeAddress!,
      name:
        profileRes.Profile.DisplayName !== ""
          ? profileRes.Profile.DisplayName
          : "ANON",
      image:
        profileRes.Profile.ProfileImage !== ""
          ? profileRes.Profile.ProfileImage
          : "NONE",
      score: 0,
      bazarId: profileIdRes[0].ProfileId,
    };

    console.log("Player profile result", playerDetails);

    setCurrentPlayer(playerDetails);
  };

  useEffect(() => {
    if (connected && activeAddress) fetchPlayerProfile();
  }, [connected, activeAddress]);

  return (
    <div className="text-2xl font-bold text-red-400">
      {currentPlayer ? <p>{currentPlayer.name}</p> : <p>ANON</p>}
    </div>
  );
}
