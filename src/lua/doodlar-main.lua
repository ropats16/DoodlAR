-- Define the list to store processes
local processes = {}

-- .load-blueprint apm

-- apm.update()

-- apm.install("@rakis/DbAdmin")

-- ============

-- Db Setup

local sqlite3 = require("lsqlite3")
local dbAdmin = require("@rakis/DbAdmin")

-- Open an in-memory database
db = sqlite3.open_memory()

-- Create a DbAdmin instance
admin = dbAdmin.new(db)

-- New Processes Table
admin:exec([[
  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    players INTEGER DEFAULT 0,
    state TEXT DEFAULT 'In-Waiting'
  );
]])

-- Handlers to spawn a new process
Handlers.add(
    "Spawn-New-Game",
    "Spawn-New-Game",
    function(msg)
        local results = admin:exec("SELECT * FROM games WHERE state = 'In-Waiting' AND players < 8")
        ao.spawn("2qIQBC_mo5ywHZcTbC3Z-OTqyzserEhHAXscCjqOc1k", {
            ["On-Boot"] = "Vn-zHCtRkIFoEITuEzR2G-jTK538ewOwHNRd7HwsVZU"
        })
        admin:apply("INSERT INTO games (id) VALUES (?)", {msg.id})
    end
)

-- Function to find and return the first process with participants less than 8 and status 'In-Waiting'
local function findProcess()
    for _, process in ipairs(processes) do
        if process.numPlayers < 8 and process.status == 'In-Waiting' then
            return process
        end
    end
    return nil
end

-- Function to increment players in a process
local function incrementPlayers(process)
    if process then
        process.numPlayers = process.numPlayers + 1
    end
end

-- Function to update the game state of a process
local function updateGameState(process, newState)
    if process then
        process.status = newState
    end
end