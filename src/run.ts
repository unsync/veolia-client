import console from 'node:console'
import fs from 'node:fs'
import { VeoliaClient } from './veolia.js'

async function run() {
  const config = JSON.parse(fs.readFileSync('./.config.json', 'utf8'))
  const app = new VeoliaClient(config)
  const results = await app.getEnergyData()
  console.info(results)
}

run().then(() => {
  console.info('done')
})
