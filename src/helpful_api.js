require('@tensorflow/tfjs-node')
const use = require('@tensorflow-models/universal-sentence-encoder')
const model = use.loadQnA()

const fs = require("fs")

const [heyfromthefuture, randomstuffifound] = ["./src/assets/heyfromthefuture.json", "./src/assets/randomstuffifound.json"]
  .map(path => JSON.parse(fs.readFileSync(path)))

const advice = {
  responses: [...heyfromthefuture.map(v => v.slice(17)), ...randomstuffifound],
  contexts: [...heyfromthefuture, ...randomstuffifound]
}

const cache_file = "./src/assets/a_embed.json"
const advice_embeddings = new Promise((res) => fs.readFile(cache_file, (err, data) => {
  // If we had an error while reading (probably because it was missing)
  if (err) {
    console.log("helpful_api: advice embeddings not found. generating now. this will take a long time")
    model.then(m =>
      // Embed the advice as responses and contexts. Get the embeddings. Convert the tensor to js array.
      m.embed({ queries: [], responses: advice.responses, contexts: advice.contexts })["responseEmbedding"].arraySync()
    ).then(a_embed => {
      // Cache the embeddings as json
      fs.writeFile(cache_file, JSON.stringify(a_embed), () => console.log("embeddings cached successfully"))
      // Return the embeddings
      res(a_embed)
    })
  } else {
    // Return the embeddings
    res(JSON.parse(data))
  }
}))

const { dotProduct } = require("./dot_product.js")
module.exports.get_advice = async (question) => {
  // Get the model
  const m = await model
  // Get the advice embeddings
  const a_embed = await advice_embeddings
  // Embed the question. Get the embeddings. Convert tensor to js array.
  // Get the first element because there's only one question.
  const q_embed = m.embed({ queries: [question], responses: [] })['queryEmbedding'].arraySync()[0]
  // Now that we have the embeddings we do the dot product!
  let relavance = {}
  for (let i = 0; i < advice.responses.length; i++) {
    // For each advice compute relevance via the dot product
    relavance[advice.responses[i]] = dotProduct(q_embed, a_embed[i])
  }
  return relavance
}