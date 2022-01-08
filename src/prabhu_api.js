require('@tensorflow/tfjs-node')
const use = require('@tensorflow-models/universal-sentence-encoder')
const { text } = require('express')
const model = use.load()

const fs = require("fs")
const fetch = require('node-fetch')

async function encode_book(book) {
  let texts = book.flatMap(sect => sect.chapters.flatMap(chap => chap.verses.map(verse => ({
    book: sect.name,
    chapter: chap.name,
    verse: verse.verse,
    text: verse.translation + '\n' + verse.purport
  }))))
  const m = await model
  const embeddings = []
  const stride = 1000
  for (let i = 0; i < texts.length; i += stride) {
    let chunk = texts.slice(i, i+stride).map(text => text.text)
    let chunk_embedding = (await m.embed(chunk)).arraySync()
    embeddings.push(...chunk_embedding)
  }
  embeddings.forEach((v, i) => {
    texts[i].embedding = v
    delete texts[i].text
  })
  return texts
}

async function fetch_json(url) {
  let res = await fetch(url)
  if (!res.ok) throw new Error(res.statusText)
  let data = await res.text()
  return JSON.parse(data)
}

const cache_file = './src/assets/v_embed.json'
async function load_cache() {
  try {
    return await fetch_json('https://firebasestorage.googleapis.com/v0/b/swag-site-bc744.appspot.com/o/v_embed.json?alt=media&token=03454fc5-feff-4367-a905-a1caa43f2d16')
  } catch {
    console.log('Failed to get prabhu cache from firebase')
    try {
      return JSON.parse(fs.readFileSync(cache_file))
    } catch {
      console.log('Failed to get prabhu cache from disk')
      return {}
    }
  }
}

let cache = null
async function get_book(book) {
  if (cache === null) cache = await load_cache()
  if (cache[book]) return cache[book]
  let book_json = await fetch_json('https://swag31415.github.io/Krishna-Compendium/data/'+book+'.json')
  cache[book] = await encode_book(book_json)
  // Uncomment this to enable file cache
  // fs.writeFile(cache_file, JSON.stringify(cache), () => console.log('Successfully cached', book))
  return cache[book]
}

const { dotProduct } = require("./dot_product.js")
module.exports.ask = async function (query, book_name) {
  let book = await get_book(book_name)
  const m = await model
  let q_embedding = (await m.embed([query])).arraySync()[0]
  return book.map(verse => ({
    score: dotProduct(verse.embedding, q_embedding),
    book: verse.book,
    chapter: verse.chapter,
    verse: verse.verse
  })).sort((v1, v2) => v2.score - v1.score)
}
