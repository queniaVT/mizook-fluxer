import {Client, Events} from '@fluxerjs/core';
import fs from 'node:fs';

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const token = config.token;
const client = new Client({intents: 0});

client.on(Events.Ready, () => {
  console.log(`Logged in as ${client.user?.username}`);
});

await client.login(token);
