const express = require("express")
const https = require("https")
const app = express()
  .set("view engine", "ejs")
const port = process.env.PORT || 3000

app.get("/", (req, res) => {
  res.render("index")
})

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

app.listen(port, () => {
  console.log(`MiscServer is up and running at http://localhost:${port}`)
})
