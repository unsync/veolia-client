import console from 'node:console';
import process from 'node:process';
import { config } from 'dotenv';
import { VeoliaClient } from './veolia.js';
config();
async function run() {
    const app = new VeoliaClient({
        mail: process.env.VEOLIA_EMAIL || '',
        password: process.env.VEOLIA_PASSWORD || '',
        pdl: process.env.VEOLIA_PDL || '',
    });
    const results = await app.getEnergyData();
    console.info(results);
}
run().then(() => {
    console.info('done');
});
