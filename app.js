const express = require("express")
const app = express()
  .set("view engine", "ejs")
const port = process.env.PORT || 3000

app.get("/", (req, res) => {
  res.render("index")
})

app.listen(port, () => {
  console.log(`MiscServer is up and running at http://localhost:${port}`)
})
