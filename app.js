const express = require("express")
const https = require("https")
const cors = require("cors")
var bodyParser = require('body-parser')
const app = express()
  .set("view engine", "ejs")
  .use(express.static('public'))
  .use(bodyParser.urlencoded({ extended: false }))
  .use(bodyParser.json())
const port = process.env.PORT || 3000

app.use(cors({origin: '*'}))

app.get("/", (req, res) => {
  res.render("index")
})

// Stonkey
const rand = (n) => Math.ceil(n*Math.random())
app.get("/stonkey", (req, res) => {
  https.get("https://www.alphavantage.co/query?" + new URLSearchParams({
    function: "TIME_SERIES_INTRADAY_EXTENDED",
    symbol: req.query.sym,
    interval: "5min",
    slice: `year${rand(2)}month${rand(12)}`,
    apikey: process.env.STONKEY_KEY || "demo"
  }), resp => resp.pipe(res))
})

// Helpful
const helpful_api = require("./src/helpful_api.js")
app.post("/helpful", (req, res) => {
  helpful_api.get_advice(req.body.question).then(advice => {
    // Sort the advice and return the top 50
    sorted = Object.keys(advice).sort((a, b) => advice[b]-advice[a])
    res.json(sorted.slice(0, 50))
  })
})

app.listen(port, () => {
  console.log(`MiscServer is up and running at http://localhost:${port}`)
})
