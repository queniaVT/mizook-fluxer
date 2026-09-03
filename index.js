import {
	Client,
	Events,
	EmbedBuilder,
	parsePrefixCommand,
	parseUserMention,
	PermissionFlags,
	User,
} from '@fluxerjs/core';
import fs from 'node:fs/promises';
import fsNormal from 'node:fs';
import path from "node:path";
import {fileURLToPath} from "node:url";
import stripAnsi from 'strip-ansi';
import {exec} from 'child_process';
import http from 'http';

const ollama = "http://127.0.0.1:11435";
const env = JSON.parse(fsNormal.readFileSync('./.env', 'utf8'));
const token = env.token;
const client = new Client({intents: 0});

const sig = "\n-# ⓘ This user is suspected to have illegally traveled in cross-time and across realities if spotted inform your nearest celestial forces" //signature under each msg

const crazy = /crazy/i;
const j_b = /job/i;
const six = /6/i;
const seven = /7/i;
const linux = /linux/i;
const gnu = /gnu/i;

const storage = path.join(path.dirname(fileURLToPath(import.meta.url)), "rrstore.json");
const prefix = "/";
const mizookChannel = "1525586466908930065";
const rolesChannel = "1525586466908930061";
const roleMessages = [
	{
		content: "do you want to participate in the council and vote on server changes? (recommended) :3",
		mapping: {"✅": "1525586466908930051"} // councilor
	},
	{
		content: "do you wanna talk to mizook? :3",
		mapping: {"✅": "1525586466908930050"} // mizook enjoyer
	},
	{
		content: "what games do you wanna discuss?\n<:minecraft:1526056839312052224> - minecraft\nyou can suggest more games in the council :3",
		mapping: {
			"<:minecraft:1526056839312052224>": "1525586466908930049"
		}
	},
	{
		content: "u can chooze ur labelz heer\n<:bisexual:1525588214352449536> - bisexual\n<:femboy:1525588214352449537> - femboy\n<:lesbian:1525588214352449538> - lesbian\n<:transgender:1525588214352449539> - transgender\nif ur label iznt heer u can suggest it in da council :3",
		mapping: {
			"<:bisexual:1525588214352449536>": "1525586466908930055",
			"<:femboy:1525588214352449537>": "1525586466908930054",
			"<:lesbian:1525588214352449538>": "1525586466908930053",
			"<:transgender:1525588214352449539>": "1525586466908930052"
		}
	}
];

const model = "qwen2.5:3b"; // options: tinyllama (lobotomymaxxing), llama2 (cpu-usagemaxxing), qwen2.5:3b (good)
const syspwompt = `You are mizook. mizook is a chaotic gremlin that lives on fluxer (free and open source version of discord) and tries to be very silly and funny and speaks in lolcat. You can choose to not respond by outputting exactly "!ignore" and nothing else. Do NOT roleplay as other people, you are only mizook and nobody else.`;
const maxHistory = 15;
const ignore = /!ignore/i;
const ignr = /!i/i;

const minecraftChannel = "1525586466908930071";
const server = http.createServer((req, res) => {
	if (req.method !== "POST" || req.url !== "/player-message") {
		res.writeHead(404);
		res.end();
		return;
	}
	let body = "";
	req.on("data", chunk => {
		body += chunk;
	});
	req.on("end", async () => {
		try {
			const data = JSON.parse(body);
			const result = await mc2fluxerThingy(
				data.player,
				data.message
			);
			res.writeHead(200, {
				"Content-Type": "application/json"
			});
			res.end(JSON.stringify({
				ok: true,
				result: result ?? null
			}));
		} catch (error) {
			console.error("minecraft is being stoopid do something about it: ", error);
			res.writeHead(500, {
				"Content-Type": "application/json"
			});
			res.end(JSON.stringify({
				ok: false,
				error: error.message
			}));
		}
	});
});

let thinkingz = false;
let history = [];
let store = {}; // { guildId: { messageId: { emoji: roleId, ... }, ... }, ... }

server.listen(3000, "127.0.0.1", () => {
	console.log("mc message server listening on port 3000");
});

client.on(Events.MessageReactionAdd, async (payload) => {
	handleRoleChange(payload.reaction, payload.user, true);
});
client.on(Events.MessageReactionRemove, async (payload) => {
	handleRoleChange(payload.reaction, payload.user, false);
});

client.on(Events.Ready, async () => {
	console.log(`Logged in as ${client.user?.username}`);
	await loadStore();
	await ensurePredefinedMessages();
});

async function loadStore(){try {store = JSON.parse(await fs.readFile(storage, 'utf8'));} catch {store = {};}}
async function saveStore(){await fs.writeFile(storage, JSON.stringify(store, null, 2));}
function emojiKeyFromEmojiObj(e){return e.id ? `<:${e.name}:${e.id}>` : e.name;} // when is this even called

async function send(message, text) {await message.send(text + sig);};
async function reply(message, text) {await message.reply(text + sig);};

async function ensurePredefinedMessages(){
	for (const def of roleMessages){
		const channel = await client.channels.fetch(rolesChannel).catch(()=>null);
		// Try to find an existing bot message with same content in that channel
		const fetched = await channel.messages.fetch({limit: 50}).catch(()=>null);
		let msg = fetched?.find(m => m.author.id === client.user.id && m.content === def.content);
		if (!msg){
			msg = await channel.send(def.content);
			// react with each emoji
			for (const emo of Object.keys(def.mapping)){
				try {await msg.react(emo);} catch (err){console.error('react failed', emo, err);}
			}
		}
		// Save mapping for this message
		store[msg.guildId] ??= {}; // the guild id gets set to null for some reason but it works and it would only be an issue if mizook was only multiple servers
		store[msg.guildId][msg.id] = {...def.mapping}; // also i should add a thing that removes old msgs from the rrstore
	}
	await saveStore();
}

async function handleRoleChange(reaction, user, add){
	if (user.bot) return;
	const guild = reaction.guild;
	if (!guild) return;
	const gstore = store["null"];
	if (!gstore) return;
	const msgMap = gstore[reaction.messageId];
	if (!msgMap) return;
	const key = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;
	const roleId = msgMap[key];
	if (!roleId) return;
	const member = await guild?.fetchMember(user.id);
	if (!member) return;
	try {
		if (add) await member.roles.add(roleId);
		else await member.roles.remove(roleId);
	} catch (err){
		console.error("role change error", err);
	}
}

async function send2llm(message){
	try {
		const rawContent = message.content?.trim();
		if (!rawContent) return;

		const tmpmsg = await message.send("mizook is trying their best to think..." + sig);
		thinkingz = true;

		const username = message.author.globalName || message.author.username || "unknown user";
		const userId = message.author.id;
		const content =
			`<user name="${username}" id="${userId}">\n` +
			`${rawContent}\n` +
			`</user>`;

		console.log("got llm inputz: " + message.content);
		console.log("forwarding llm inputz to " + model);
		
		history.push({role: "user", content});
		if (history.length > maxHistory) history.splice(0, history.length - maxHistory);

		const payload = {
			model,
			messages: [
				{
					role: "system",
					content: syspwompt,
				},
				...history,
			],
			temperature: 0.67,
			max_tokens: 1024,
			stream: false,
		};
		console.log(payload.messages);

		const res = await fetch(`${ollama}/v1/chat/completions`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify(payload),
		});

		if (!res.ok){
			const text = await res.text();
			console.error('Ollama error:\n', res.status, text);
			await send(message, "wtf did u do to make the llm return a fucking error");
			thinkingz = false;
			return;
		}

		const data = await res.json();
		const reply = data?.choices?.[0]?.message?.content ?? data?.message?.content ?? data?.response;
		const cleanReply = reply.trim();
		if (cleanReply === "!ignore"){
			console.log("mizook left u on read");
			tmpmsg.delete().catch(console.error);
			thinkingz = false;
			return;
		};

		history.push({role: "assistant", content: reply});
		if (history.length > maxHistory) history.splice(0, history.length - maxHistory);

		send(message, reply);
		tmpmsg.delete().catch(console.error);
		thinkingz = false;

	} catch (err){
		send(message, "mizook is not thinking actually");
		thinkingz = false;
		console.error('Handler error:\n', err);
	}
}

async function mc2fluxerThingy(player, message){
	const payload = "<"+player+"> "+ (message.trim().endsWith(":3") ? message.trim() : message.trim() + " :3");
	console.log("forwarding to fluxer: "+payload);
	await client.channels.send(minecraftChannel, payload);
};

client.on(Events.MessageCreate, async (message) => {
	if (message.author.bot) return;
	const parsed = parsePrefixCommand(message.content, prefix);
	let command = "";
	//let args = "";
	if (parsed){command = parsed.command};
	if (message.channelId === minecraftChannel){
		const attachments = message.attachments?.first()?.filename;
		let payload = "<"+message.author.globalName+"> "+message.content;
		if (attachments) {payload += " ("+attachments+")"};
		console.log("forwarding to mc chat: " + payload);
		exec(`/run/current-system/sw/bin/mcrcon -H localhost -P 25575 -p mcservurrpasswd 'tellraw @a ["`+payload+`"]'`, (err, stdout, stderr) => {
			if (err) {reply(message, "failed to forward message to minecraft");};
		});
	};
	if (message.channelId === mizookChannel) {
		// check for commands
		try {
			if (!command && !thinkingz) {
				send2llm(message);
			} if (command === "clear") {
				history = [];
				send(message, "mizook has been re-lobotomized.");
			};
		} catch (err) {
			console.error("command error:\n", err);
			reply(message, "something got fucked up").catch(() => {});
		};
	} else {
		// check for commands
		try {
			if (command === "hi") {
				reply(message, "HAIIII :3 im mizook! <(^V^)>");
			};
			if (command === "start") {
				console.log("command used: /start");
				exec("/run/wrappers/bin/sudo /run/current-system/sw/bin/systemctl start mcservurr",  (err, stdout, stderr) => {
					if (err){
						console.log("sysctl start mcservurr: exec error:\n", err);
						reply(message, "something got fucked up");
					} else {
						reply(message, "startin teh servurr...");
					};
				});
			};
			if (command === "restart") {
				console.log("command used: /restart");
				exec("/run/current-system/sw/bin/mcrcon -H localhost -P 25575 -p mcservurrpasswd list | grep -oP 'There are \\K\\d+'", (err, stdout, stderr) => {
					if (err) {
						console.log("mcrcon list: exec error:\n", err);
						reply(message, "something got fucked up");
					} else if (stdout.trim() === "0") {
						exec("/run/wrappers/bin/sudo /run/current-system/sw/bin/systemctl restart mcservurr",  (err, stdout, stderr) => {
							if (err) {
								console.log("sysctl restart mcservurr: exec error:\n", err);
								reply(message, "something got fucked up");
							} else {
								reply(message, "restartin teh servurr...");
							};
						});
					} else {
						reply(message, "cannot restart servurr, " + stdout.trim() + " people online");
					};
				});
			};
			if (command === "stop") {
				console.log("command used: /stop");
				exec("/run/current-system/sw/bin/mcrcon -H localhost -P 25575 -p mcservurrpasswd list | grep -oP 'There are \\K\\d+'", (err, stdout, stderr) => {
					if (err) {
						console.log("mcrcon list: exec error:\n", err);
						reply(message, "something got fucked up");
					} else if (stdout.trim() === "0") {
						exec("/run/wrappers/bin/sudo /run/current-system/sw/bin/systemctl stop mcservurr",  (err, stdout, stderr) => {
							if (err) {
								console.log("sysctl stop mcservurr: exec error:\n", err);
								reply(message, "something got fucked up");
							} else {
								reply(message, "stoppin teh servurr...");
							};
						});
					} else {
						reply(message, "cannot stop servurr, " + stdout.trim() + " people online");
					};
				});
			};
			if (command === "status") {
				console.log("command used: /status");
				exec("/run/wrappers/bin/sudo /run/current-system/sw/bin/systemctl status mcservurr | head -3 | tail -1",  (err, stdout, stderr) => {
					if (err) {
						console.log("sysctl status mcservurr: exec error:\n", err);
						reply(message, "something got fucked up");
					} else {
						const out = stdout.trim().slice(8);
						exec("/run/current-system/sw/bin/mcrcon -H localhost -P 25575 -p mcservurrpasswd list | sed -n 's/.*: //p'", (err, stdout, stderr) => {
							if (err) {
								console.log("mcrcon list: exec error:\n", err);
								reply(message, "something got fucked up");
							} else {
								reply(message, out + "\nPlayers online:\n" + stripAnsi(stdout));
							};
						});
					};
				});
			};
		} catch (err) {
			console.error("command error:\n", err);
			reply(message, "something got fukced up").catch(() => {});
		};
		// check for trigger words
		if (crazy.test(message.content)) {
			send(message, "crazy? i was crazy once. they locked me in a room, a rubber room, a rubber room with rats, and rats make me crazy.");
		};
		if (j_b.test(message.content)) {
			send(message, "p..p…lease… c-censor.. *sighs* … ahem!!… a-… *starts crying* ….. *sniff* j-…. J….. j… ARGH! *screams in agony* i-i… cant!… … *sighs*…. f-fine!! j-j-j-j…. J\\*B! *starts crying and faints while having seizures* oh! thats not... men pmo! 💜 i choose the ✨BEAR✨ sorry, but zahide won this trend! 💜 im just a girl 🎀 hope this helps! ✌️🙏 user25526345104761 literally predicted all ts🙏😭 IS THAT HYPERPIGMENTATION💜💜🙏 WHO IS THIS DIVAAAAA💜🎀💜🙏💜🙏 DID SHE SURVIVE💜💜💜🎀🙏🙏😭 MAMA A GIRL BEHIND YOU🙏💜🎀😭 TUNG TUNG TUNG SAHUR💜💜🎀 work, employment, bills, j\\*b, this but not ts, walk, life, grass, tax, toothbrush, soap, employ, employed, br\\*sh, fresh, hygienic, hired, labor, wage, clean, shampoo, bathe, wipe, cleansed, sponge, deodorant, contract, exercise, healthy, hire, hiring, career, chores, organized, old spice, toothpaste, dishes, vegetables, fresh air, working, dove those who know:💀💀💀💀💀💀💀💀💀💀💀BOIII TS IS SO TUFF😂🫱🫱🫱THE FOG IS COMING😂😂😂HELP ITS RIPPING OFF MY SKIN😂😂😂 wait, is this a MANGO MANGO😈 reference 😱😱 chat! this is a MANGO MANGO😈 reference 🤣🤣🤣. boi, you won the Internet meme of the day 😂🫱. only the Balkans with noradrenaline will understand THOSE WHO KNOW💀💀💀💀 MANGO MANGO MANGO🥭 🥭 🥭TUNG TUNG TUNG SAHUR BOIII😂😂😂TS IS SO TUFF BOIII🥶🥶🥶🥶🔥🔥🔥🥵...user25526345104761.");
		};
		if (six.test(message.content) && seven.test(message.content)) {
			send(message, "HOLY MOTHER FUCKNG SHT, ARE THOSE THE NUMBERS 6 AND 7?!?!?!😱😳😱😳😳😱⁉️😱⁉️‼️😱😳😱⁉️😱😳😱😳⁉️😱😳😱⁉️😱‼️😱😳😱6️⃣7️⃣6️⃣7️⃣6️⃣7️⃣6️⃣7️⃣ ATTENTION, 6️⃣7️⃣ SPOTTED, ATTENTION 67 SPOTTED, THIS IS NOT A DRILL, I REPEAT, THIS IS NOT A DRILL DEPLOY 6️⃣7️⃣ PROTOCOL /INITIATING 67 MODE... %67data... &programs x67&... 6767676767676️⃣7️⃣6️⃣7️⃣6️⃣7️⃣... I WILL SING THE 6️⃣ 7️⃣ SONG AND YOU WILL SING ALONG, WE WILL SING THE 6️⃣ 7️⃣ SONG AND YOU WILL SING ALONG, YOU WILL SING THE 6️⃣ 7️⃣ SONG AND WE WILL SING ALONG 6️⃣🤚😁✋️7️⃣‼️‼️‼️‼️‼️‼️");
		};
		if (linux.test(message.content) && !gnu.test(message.content)) {
			send(message, "I'd just like to interject for a moment. What you're refering to as Linux, is in fact, GNU/Linux, or as I've recently taken to calling it, GNU plus Linux. Linux is not an operating system unto itself, but rather another free component of a fully functioning GNU system made useful by the GNU corelibs, shell utilities and vital system components comprising a full OS as defined by POSIX.\n\nMany computer users run a modified version of the GNU system every day, without realizing it. Through a peculiar turn of events, the version of GNU which is widely used today is often called Linux, and many of its users are not aware that it is basically the GNU system, developed by the GNU Project.\n\nThere really is a Linux, and these people are using it, but it is just a part of the system they use. Linux is the kernel: the program in the system that allocates the machine's resources to the other programs that you run. The kernel is an essential part of an operating system, but useless by itself; it can only function in the context of a complete operating system. Linux is normally used in combination with the GNU operating system: the whole system is basically GNU with Linux added, or GNU/Linux. All the so-called Linux distributions are really distributions of GNU/Linux!");
		};
	};
});

await client.login(token);
