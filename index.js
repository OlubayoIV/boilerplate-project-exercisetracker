const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require("mongoose")
const {Schema} = mongoose;

mongoose.connect(process.env.PORT)

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

app.post("/api/users", (req, res) => {
console.log(req.body)
res.json({hey: "hi"})
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
