import { createDataItemSigner, dryrun, message, result } from "@permaweb/aoconnect";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function dryrunResult(gameProcess: string, tags: { name: string; value: string }[]) {
  const res = await dryrun({
    process: gameProcess,
    tags,
  }).then((res) => JSON.parse(res.Messages[0].Data))

  return res
}

export async function messageResult(gameProcess: string, tags: { name: string; value: string }[], data?: any) {  
  const res = await message({
    process: gameProcess,
    signer: createDataItemSigner(window.arweaveWallet),
    tags,
    data,
  })

  let { Messages, Spawns, Output, Error } = await result({
    message: res,
    process: gameProcess,
  })

  console.dir({ Messages, Spawns, Output, Error }, { depth: Infinity, colors: true })

  return { Messages, Spawns, Output, Error }
}