const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require("mongoose")
const {Schema} = mongoose;

mongoose.connect(process.env.MONGO_URI)

const UserSchema = new Schema ({
  username: String,
});
const User = mongoose.model("User", UserSchema);

const ExerciseSchema = new Schema ({
  user_id: {type: String, required: true},
  description: String,
  duration: Number,
  date: Date,
});
const Exercise = mongoose.model("Exercise", ExerciseSchema);


app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/api/users", async (req, res) => {
  try {
    // Select only _id and username fields
    const users = await User.find({}).select("_id username");
    if(!users || users.length === 0) {
      res.json([]); // Return empty array if no users found, not "No Users" string
    } else {
      res.json(users)
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error retrieving users" });
  }
});

// Route to create a new user
app.post("/api/users", async (req, res) => {
  const username = req.body.username; // Get username from request body
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  const userObj = new User({
    username: username
  });

  try {
    const user = await userObj.save();
    res.json({
      _id: user._id,
      username: user.username
    }); // Return only _id and username for new user
  } catch(err) {
    console.error(err);
    // Check for duplicate key error (MongoDB E11000)
    if (err.code === 11000) {
      return res.status(409).json({ error: "Username already exists" });
    }
    res.status(500).json({ error: "Error saving user" });
  }
});

// Route to add an exercise for a user (Test 8)
app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;

  // Basic validation
  if (!description || !duration) {
    return res.status(400).json({ error: "Description and duration are required." });
  }
  if (isNaN(Number(duration))) {
    return res.status(400).json({ error: "Duration must be a number." });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.json({ error: "User not found" }); // Return JSON for user not found
    }

    const exerciseObj = new Exercise({
      user_id: user._id, // Associate exercise with the found user's _id
      description: description,
      duration: Number(duration), // Ensure duration is a number
      date: date ? new Date(date) : new Date() // Use current date if not provided
    });

    const exercise = await exerciseObj.save();

    // Test 8: Response format - user object with exercise fields added
    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString() // Correctly use exercise.date and format it
    });

  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "There was an error saving the exercise" });
  }
});

// Route to get a user's exercise log (Tests 10-16)
app.get("/api/users/:_id/logs", async (req, res) => {
  const { from, to, limit } = req.query; // Query parameters
  const id = req.params._id; // User ID from URL

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.json({ error: "User not found" }); // Return JSON for user not found
    }

    let dateFilter = {}; // Object to build date query
    if (from) {
      dateFilter["$gte"] = new Date(from); // Greater than or equal to 'from' date
    }
    if (to) {
      dateFilter["$lte"] = new Date(to); // Less than or equal to 'to' date (FIXED: was $ite)
    }

    let queryFilter = {
      user_id: id // Always filter by user_id
    };

    // Add date filter to main queryFilter if 'from' or 'to' are present
    if (from || to) {
      queryFilter.date = dateFilter;
    }

    let query = Exercise.find(queryFilter);

    // Apply limit if provided and is a valid number
    if (limit) {
      const parsedLimit = parseInt(limit);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        query = query.limit(parsedLimit);
      }
    }

    const exercises = await query.exec(); // Execute the query

    // Format the log array as required (Tests 11-15)
    const log = exercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString() // Use .toDateString() for the required format (FIXED: was e.validateSync)
    }));

    // Tests 10 & 11: Return user object with count and log array
    res.json({
      username: user.username,
      count: exercises.length, // Total number of exercises found
      _id: user._id,
      log: log // The formatted array of exercises
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error retrieving exercise log" });
  }
});


// Define the application port using process.env.PORT, defaulting to 3000
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Your app is listening on port ${PORT}`)
})