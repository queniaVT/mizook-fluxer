import {Client, Events} from '@fluxerjs/core';
import fs from 'node:fs';

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const token = config.token;
const client = new Client({intents: 0});

const sig = "\n-# ⓘ This user is suspected to have illegally traveled in cross-time and across realities if spotted inform your nearest celestial forces" //signature under each msg

const crazy = /crazy/i;
const j_b = /job/i;
const six = /6/i;
const seven = /7/i;

client.on(Events.Ready, () => {
	console.log(`Logged in as ${client.user?.username}`);
});

async function send(message, text) {await message.send(text + sig);};
async function reply(message, text) {await message.reply(text + sig);};

client.on(Events.MessageCreate, async (message) => {
	if (message.author.bot) return;
	if (crazy.test(message.content)) {
		send(message, "crazy? i was crazy once. they locked me in a room, a rubber room, a rubber room with rats, and rats make me crazy.");
	};
	if (j_b.test(message.content)) {
		send(message, "p..p…lease… c-censor.. *sighs* … ahem!!… a-… *starts crying* ….. *sniff* j-…. J….. j… ARGH! *screams in agony* i-i… cant!… … *sighs*…. f-fine!! j-j-j-j…. J\\*B! *starts crying and faints while having seizures* oh! thats not... men pmo! 💜 i choose the ✨BEAR✨ sorry, but zahide won this trend! 💜 im just a girl 🎀 hope this helps! ✌️🙏 user25526345104761 literally predicted all ts🙏😭 IS THAT HYPERPIGMENTATION💜💜🙏 WHO IS THIS DIVAAAAA💜🎀💜🙏💜🙏 DID SHE SURVIVE💜💜💜🎀🙏🙏😭 MAMA A GIRL BEHIND YOU🙏💜🎀😭 TUNG TUNG TUNG SAHUR💜💜🎀 work, employment, bills, j\\*b, this but not ts, walk, life, grass, tax, toothbrush, soap, employ, employed, br\\*sh, fresh, hygienic, hired, labor, wage, clean, shampoo, bathe, wipe, cleansed, sponge, deodorant, contract, exercise, healthy, hire, hiring, career, chores, organized, old spice, toothpaste, dishes, vegetables, fresh air, working, dove those who know:💀💀💀💀💀💀💀💀💀💀💀BOIII TS IS SO TUFF😂🫱🫱🫱THE FOG IS COMING😂😂😂HELP ITS RIPPING OFF MY SKIN😂😂😂 wait, is this a MANGO MANGO😈 reference 😱😱 chat! this is a MANGO MANGO😈 reference 🤣🤣🤣. boi, you won the Internet meme of the day 😂🫱. only the Balkans with noradrenaline will understand THOSE WHO KNOW💀💀💀💀 MANGO MANGO MANGO🥭 🥭 🥭TUNG TUNG TUNG SAHUR BOIII😂😂😂TS IS SO TUFF BOIII🥶🥶🥶🥶🔥🔥🔥🥵...user25526345104761.");
	};
	if (six.test(message.content) && seven.test(message.content)) {
		send(message, "HOLY MOTHER FUCKNG SHT, ARE THOSE THE NUMBERS 6 AND 7?!?!?!😱😳😱😳😳😱⁉️😱⁉️‼️😱😳😱⁉️😱😳😱😳⁉️😱😳😱⁉️😱‼️😱😳😱6️⃣7️⃣6️⃣7️⃣6️⃣7️⃣6️⃣7️⃣ ATTENTION, 6️⃣7️⃣ SPOTTED, ATTENTION 67 SPOTTED, THIS IS NOT A DRILL, I REPEAT, THIS IS NOT A DRILL DEPLOY 6️⃣7️⃣ PROTOCOL /INITIATING 67 MODE... %67data... &programs x67&... 6767676767676️⃣7️⃣6️⃣7️⃣6️⃣7️⃣... I WILL SING THE 6️⃣ 7️⃣ SONG AND YOU WILL SING ALONG, WE WILL SING THE 6️⃣ 7️⃣ SONG AND YOU WILL SING ALONG, YOU WILL SING THE 6️⃣ 7️⃣ SONG AND WE WILL SING ALONG 6️⃣🤚😁✋️7️⃣‼️‼️‼️‼️‼️‼️");
	};
});

await client.login(token);
