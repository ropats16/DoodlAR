-- "@rakis/DbAdmin" package source ========================

dbAdmin = {}
dbAdmin.__index = dbAdmin

-- Function to create a new database explorer instance
function dbAdmin.new(db)
    local self = setmetatable({}, dbAdmin)
    self.db = db
    return self
end

-- Function to list all tables in the database
function dbAdmin:tables()
    local tables = {}
    for row in self.db:nrows("SELECT name FROM sqlite_master WHERE type='table';") do
        table.insert(tables, row.name)
    end
    return tables
end

-- Function to get the record count of a table
function dbAdmin:count(tableName)
    local count_query = string.format("SELECT COUNT(*) AS count FROM %s;", tableName)
    for row in self.db:nrows(count_query) do
        return row.count
    end
end

-- Function to execute a given SQL query
function dbAdmin:exec(sql)
    local results = {}
    for row in self.db:nrows(sql) do
        table.insert(results, row)
    end
    return results
end

-- Function to apply SQL INSERT, UPDATE, and DELETE statements with parameter binding
function dbAdmin:apply(sql, values)
    local DONE = require('lsqlite3').DONE
    assert(type(sql) == 'string', 'SQL MUST be a String')
    assert(type(values) == 'table', 'values MUST be an array of values')
    
    local stmt = self.db:prepare(sql)
    stmt:bind_values(table.unpack(values))
    
    if stmt:step() ~= DONE then
        error(sql .. ' statement failed because ' .. self.db:errmsg())
    end
    
    stmt:finalize()
end

-- Function to apply SQL SELECT statements with parameter binding
function dbAdmin:select(sql, values)
   local sqlite3 = require('lsqlite3')
   local DONE = sqlite3.DONE
   assert(type(sql) == 'string', 'SQL MUST be a String')
   assert(type(values) == 'table', 'values MUST be an array of values')

   local stmt = self.db:prepare(sql)
   stmt:bind_values(table.unpack(values))

   local results = {}
   while true do
       local row = stmt:step()
       if row == sqlite3.ROW then
           table.insert(results, stmt:get_named_values()) 
       elseif row == DONE then
           break
       else
           error(sql .. ' statement failed because ' .. self.db:errmsg())
       end
   end

   stmt:finalize()
   return results
end

-- return dbAdmin

-- Db Setup ========================

local sqlite3 = require("lsqlite3")

-- Open an in-memory database
db = sqlite3.open_memory()

-- Create a DbAdmin instance
admin = dbAdmin.new(db)

-- Leaderboard and Messages Setup ========================

admin:exec([[
  CREATE TABLE IF NOT EXISTS leaderboard (
    entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT,
    name TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    isCreator BOOLEAN DEFAULT FALSE
  );
]])

admin:exec[[
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
]]

-- Game State Setup ========================

GameState = {
    currentRound = 1,
    maxRounds = 8,
    activeDrawer = "",
    mode = "In-Waiting",
}

ChosenWord = ""
DrawerId = 1

WordList = {
    "cat", "dog", "tree", "house", "sun", "moon", "flower", "car", "train", 
  "phone", "pizza", "balloon", "book", "computer", "mountain", "river", 
  "apple", "banana", "cupcake", "guitar", "star", "tiger", "beach", "rainbow",
  "rocket", "bird", "fish", "laptop", "pencil", "glasses", "umbrella", 
  "jungle", "bridge", "robot", "cake", "camera", "chair", "ship", "crown",
  "horse", "airplane", "castle", "snowman", "spider", "bat", "globe",
  "forest", "elephant", "dolphin", "bicycle", "violin", "butterfly"
}

-- Chatroom Blueprint ========================

Members = Members or {}

Handlers.add(
  "register",
  "Register",
  function (msg)
    local found = false
    for _, member in ipairs(Members) do
      if member == msg.From then
        found = true
        break
      end
    end
    
    if not found then
      table.insert(Members, msg.From)
      Handlers.utils.reply("Registered.")(msg)
    else
      Handlers.utils.reply("Already registered.")(msg)
    end
  end
)

Handlers.add(
  "unregister",
  "Unregister",
  function (msg)
    local found = false
    for i, v in ipairs(Members) do
        if v == msg.From then
            table.remove(Members, i)
            Handlers.utils.reply("Unregistered")(msg)
            found = true
            break
        end
    end
    if not found then
        Handlers.utils.reply("Not registered")(msg)
    end
  end
)

-- Updated Chat Broadcast Handler ========================

Handlers.add(
  "broadcast",
  "Broadcast",
  function (msg)
    local results = admin:select("SELECT name FROM leaderboard WHERE id = ?", { msg.From })
    local name = ""
    if #results > 0 then
        name = results[1].name
    else 
        name = "PROCESS"
    end
    admin:apply("INSERT INTO messages (id, name, message, timestamp) VALUES (?, ?, ?, ?);", {msg.From, name, msg.Data, msg.Timestamp})
    -- print(admin:exec("SELECT * FROM messages"))
    for _, recipient in ipairs(Members) do
      ao.send({Target = recipient, Action = "Broadcast-Notice", Data = msg.Data})
    end
    msg.reply({Data = "Broadcasted."})
  end
)

-- Fetch Messages Handler ========================

Handlers.add(
    "Get-Messages",
    "Get-Messages",
    function(msg)
    local messages = admin:exec("SELECT * FROM messages")
        msg.reply({ Action = "Chat-Messages", Data = messages })
    end
)

-- Register Player Handler ========================

Handlers.add(
    "Register-Player",
    "Register-Player",
    function(msg)
        -- Check if the player is already in the leaderboard
        local results = admin:select('SELECT id FROM leaderboard WHERE id = ?;', { msg.From })

        if #results > 0 then
            msg.reply({ Data = "You are already registered." })
            return -- Player is already in the leaderboard
        end

        table.insert(Members, msg.From)
        
        local isCreator = false
        local result = admin:exec('SELECT COUNT(*) as count FROM leaderboard;')
        if result[1].count == 0 then
            isCreator = true
        end
        admin:apply('INSERT INTO leaderboard (id, name, score, isCreator) VALUES (?, ?, ?, ?);', { msg.From, msg.Tags.DisplayName, 0, isCreator })
        msg.reply({ Data = "Successfully registered to game." })
    end
)

-- Fetch Joined Players Handler ========================

Handlers.add(
    "Joined-Players",
    "Joined-Players",
    function (msg)
        local players = admin:exec("SELECT * FROM leaderboard")
        msg.reply({ Action = "Joined Player Res", Data = players})
    end
)

-- Unregister Player Handler ========================

Handlers.add(
    "Unregister-Player",
    "Unregister-Player",
    function(msg)
        -- Check if the player is already in the leaderboard
        local results = admin:select('SELECT id FROM leaderboard WHERE id = ?;', { msg.From })

        if #results == 0 then
            msg.reply({ Data = "You are not registered." })
            return -- Player is not in the leaderboard
        end

        for i, v in ipairs(Members) do
            if v == msg.From then
                table.remove(Members, i)
                break
            end
        end

        admin:apply('DELETE FROM leaderboard WHERE id = ?;', { msg.From })
        msg.reply({ Data = "Successfully unregistered from game." })
    end
)

-- Start Game Handler ========================

Handlers.add(
    "Start-Game",
    "Start-Game",
    function(msg)
     -- Create game round table
        admin:exec([[
            CREATE TABLE IF NOT EXISTS rounds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                active_drawer TEXT NOT NULL,
                word TEXT NOT NULL,
                drawing TEXT NOT NULL,
                correct_answers TEXT NOT NULL
            );
        ]])

        -- Select the first player from the leaderboard to be the active drawer
        local results = admin:exec('SELECT id, name FROM leaderboard')

        local drawer = results[DrawerId]

        local activeDrawerId = drawer.id
        local activeDrawer = drawer.name

        local math = require("math")

        local randomIndex = math.random(#WordList)
        local chosenWord = WordList[randomIndex]
        ChosenWord = chosenWord

        -- print(chosenWord)
        
        GameState.mode = "Drawing"
        GameState.currentTimeStamp = msg.Timestamp
        GameState.activeDrawer = activeDrawerId

        admin:apply('INSERT INTO rounds (active_drawer, word, drawing, correct_answers) VALUES (?, ?, ?, ?);', { activeDrawerId, chosenWord, "", "" })

        GameState.currentRound = admin:exec("SELECT id FROM rounds ORDER BY id DESC LIMIT 1;")[1].id
        
        -- ao.send({ Target = ao.id, Action = "Broadcast", Data = "Game-Started. "})
        ao.send({ Target = activeDrawerId, Action = "Chosen-Word", Data = chosenWord })
        ao.send({ Target = ao.id, Action = "Broadcast", Data = "Game-Started. Welcome to round " .. GameState.currentRound})
        ao.send({ Target = ao.id, Action = "Broadcast", Data = "The active drawer is " .. activeDrawer .. " : " .. activeDrawerId .. ". Please wait while they finish drawing." })
    end
)

-- Fetch Game State Handler ========================

Handlers.add(
    "Game-State",
    "Game-State",
    function (msg)
        msg.reply({ Action = "Current Game State", Data = GameState})
    end
)

-- Fetch Chosen Word Handler ========================

Handlers.add(
    "Chosen-Word",
    "Chosen-Word",
    function(msg)
        msg.reply({ Action = "Chosen-Word", Data = ChosenWord })
    end
)

-- Submit Drawing Handler ========================

Handlers.add(
    "Submit-Drawing",
    "Submit-Drawing",
    function(msg)
        -- Submit drawing
        -- ao.send({ Target = ao.id, Data = msg.Data})
        admin:apply('UPDATE rounds SET drawing = ? WHERE id = ?;', { msg.Data, GameState.currentRound })
        GameState.mode = "Guessing"
        msg.reply({ Data = "Drawing submitted successfully." })
    end
)

-- Fetch Submitted Drawing Handler ========================

Handlers.add(
    "Get-Drawing",
    "Get-Drawing",
    function(msg)
        local results = admin:select('SELECT drawing FROM rounds WHERE id = ?;', { GameState.currentRound })
        msg.reply({ Data = { results[1].drawing } })
    end
)

-- Submit Answer Handler ========================

Handlers.add(
    "Submit-Answer",
    "Submit-Answer",
    function(msg)
        -- Submit answer
            local results = admin:select('SELECT word FROM rounds WHERE id = ?;', { GameState.currentRound })
            local correctAnswer = results[1].word
            local submittedAnswer = msg.Data

            if submittedAnswer == correctAnswer then
                -- Update correct answers
                local results = admin:select('SELECT correct_answers FROM rounds WHERE id = ?;', { GameState.currentRound })
                local correctAnswers = results[1].correct_answers
                correctAnswers = correctAnswers .. msg.From .. ", "
                admin:apply('UPDATE rounds SET correct_answers = ? WHERE id = ?;', { correctAnswers, GameState.currentRound })
                admin:apply('UPDATE leaderboard SET score = score + 10 WHERE id = ?;', { msg.From })
                msg.reply({ Data = "Correct answer!" })
            else
                msg.reply({ Data = "Incorrect answer." })
            end
        -- Update leaderboard
            
    end
)

-- Update Round Handler ========================

Handlers.add(
    "Update-Round",
    "Update-Round",
    function(msg)
        if (msg.Timestamp - GameState.currentTimeStamp) < 20000 then
            msg.reply({ Action = "Spam", Data = "Round already updated"})
            return
        end

        GameState.currentRound = GameState.currentRound + 1

        if GameState.currentRound < GameState.maxRounds then
            DrawerId = DrawerId + 1

            -- Find the next player in the leaderboard
            local results = admin:exec('SELECT id, name FROM leaderboard')

            if DrawerId > #results then
                DrawerId = 1
            end

            local drawer = results[DrawerId]

            print(drawer.name .. " " .. drawer.id)

            local activeDrawerId = drawer.id
            local activeDrawer = drawer.name

            local math = require("math")

            local randomIndex = math.random(#WordList)
            local chosenWord = WordList[randomIndex]

            if chosenWord ~= ChosenWord then
                ChosenWord = chosenWord
            else
                chosenWord = WordList[randomIndex + 1]
                ChosenWord = chosenWord
            end

        -- print (activeDrawer)
            -- print(ChosenWord)
            
            GameState.mode = "Drawing"
            GameState.currentTimeStamp = msg.Timestamp
            GameState.activeDrawer = activeDrawerId

            admin:apply('INSERT INTO rounds (active_drawer, word, drawing, correct_answers) VALUES (?, ?, ?, ?);', { activeDrawerId, chosenWord, "", "" })
            
            -- ao.send({ Target = ao.id, Action = "Broadcast", Data = "Game-Started. "})
            ao.send({ Target = activeDrawerId, Action = "Chosen-Word", Data = chosenWord })
            ao.send({ Target = ao.id, Action = "Broadcast", Data = "Round-Started. Welcome to round " .. GameState.currentRound})
            ao.send({ Target = ao.id, Action = "Broadcast", Data = "The active drawer is " .. activeDrawer .. " : " .. activeDrawerId .. ". Please wait while they finish drawing." })
        else 
            GameState.mode = "Completed"
            ao.send({ Target = ao.id, Action = "Broadcast", Data = "Game Over!" }) 
        end

        msg.reply({ Data = "Round updated successfully." })
    end
)

-- Set Process Owner to Nil ========================

Owner = nil

-- Handler to check owner ========================

Handlers.add(
    "Check-Owner",
    "Check-Owner",
    function(msg)
        if Owner == nil then
            msg.reply({ Data = "No owner." })
        else
            msg.reply({ Data = "Owner is " .. Owner })
        end
    end
)

-- Handler to return Handlers list ========================

Handlers.add(
    "Handlers-List",
    "Handlers-List",
    function(msg)
        local json = require("json")
        msg.reply({ Data = json.encode(Handlers.list) })
    end
)