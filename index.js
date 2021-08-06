require("dotenv").config();
const Discord = require("discord.js");
const fs = require("fs");
const kifo = require("kifo");
const config = require("./configuration.json");
const main = require(`./index.js`);
const mysql = require("mysql");

//client login
const client = new Discord.Client({
	partials: [`MESSAGE`, `CHANNEL`, `REACTION`],
	intents: [
		Discord.Intents.FLAGS.GUILDS,
		Discord.Intents.FLAGS.GUILD_MEMBERS,
		Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
		Discord.Intents.FLAGS.GUILD_WEBHOOKS,
		Discord.Intents.FLAGS.GUILD_INVITES,
		Discord.Intents.FLAGS.GUILD_PRESENCES,
		Discord.Intents.FLAGS.GUILD_MESSAGES,
		Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
		Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING,
		Discord.Intents.FLAGS.DIRECT_MESSAGES,
		Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
		Discord.Intents.FLAGS.DIRECT_MESSAGE_TYPING,
	],
});
client.commands = new Discord.Collection();
var con;
var KifoClanker = {};
var isKifoOnline = true;
var SupportGuild = {};
let maintenanceEnd = new Date();
var dbconfig = {
	host: process.env.HOST,
	user: process.env.USER,
	password: process.env.PASSWORD,
	database: "kifo_helper_db",
};

//Database connection
function dbReconnect() {
	con = mysql.createConnection(dbconfig);
	con.connect(async function (err) {
		if (err) {
			main.log(err);
			setTimeout(dbReconnect, 3000);
		}
		console.log(`Connected to ${process.env.HOST} MySQL DB!`);
		module.exports.con = con;
	});

	con.on("error", function (err) {
		main.log(err);
		if (err.code === "PROTOCOL_CONNECTION_LOST") {
			dbReconnect();
		} else {
			main.log(err, "BOT IS LIKELY SHUT DOWN");
			throw err;
		}
	});
}
dbReconnect();

//globally accessible variables

module.exports.SupportGuild = SupportGuild;
module.exports.maintenanceEnd = maintenanceEnd;

// Commands loader
const commandFiles = fs
	.readdirSync(`./commands`)
	.filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
	console.log(`"${file.slice(0, -3)}"`);
}

// On Ready
client.once("ready", async () => {
	console.log("Ready!");
	SupportGuild = await client.guilds.fetch("822800862581751848");
	KifoClanker = await client.users.fetch("795638549730295820");

	checkKifoClanker();
	setInterval(checkKifoClanker, 1000 * 2);
});

client.on("error", (err) => console.log(err));

client.on("message", (message) => {
	if (message.author.id !== "289119054130839552") return;
	if (!message.content.startsWith(config.prefix)) return;
	let args = message.content.slice(config.prefix.length).split(" ");
	let cmd = args.shift().toLowerCase();
	if (client.commands.has(cmd)) {
		client.commands.get(cmd).execute(message, args);
	}
});

async function checkKifoClanker() {
	KifoClanker = await client.users.fetch("795638549730295820", {
		force: true,
	});

	let now = new Date(Date.now());

	if (KifoClanker.presence.status == "online" && !isKifoOnline) {
		isKifoOnline = true;
		let alertChannel = SupportGuild.channels.resolve("867682507592171551");
		alertChannel
			.send(
				`<@&867682973939138590>`,
				kifo.embed(
					"<@!795638549730295820> has recovered from unexpected crash! 🥳",
					`Unplanned downtime alert!`
				)
			)
			.then((msg) => {
				msg.crosspost().catch((err) => main.log(err));
			})
			.catch((err) => main.log(err));
	}

	if (KifoClanker.presence.status == "offline" && isKifoOnline) {
		let Kifo = await client.users.fetch("289119054130839552", {
			force: true,
		});
		console.log(`KifoClanker is offline!!! ${now.toUTCString()}`);
		isKifoOnline = false;
		let alertChannel = SupportGuild.channels.resolve("867682507592171551");
		let alertEmbed = kifo.embed(
			`<@!795638549730295820> had an unexpected crash. <@!289119054130839552> has been notified, he ${
				Kifo.presence.status == "offline"
					? "is currently offline, so it may take some time until he fixes the bot."
					: "will fix the bot soon"
			}.`,
			"Unplanned downtime alert!"
		);
		alertChannel
			.send(`<@&867682973939138590>`, alertEmbed)
			.then((msg) => {
				msg.crosspost().catch((err) => main.log(err));
			})
			.catch((err) => main.log(err));
	}
}

client.login(process.env.LOGIN_TOKEN);

/**
 * Logs in #kifo-logs
 * @param {string} log the message you want to log
 * @returns Promise, in case something breaks
 */
exports.log = function (log, ...args) {
	console.log(log);
	let channel = client.guilds
		.resolve("822800862581751848")
		.channels?.resolve("864112365896466432");

	if (log instanceof Error) {
		const now = new Date(Date.now());
		return channel
			.send(
				`<@!289119054130839552>`,
				kifo.embed(
					`${log.stack}\n\nAt <t:${Math.floor(
						now.getTime() / 1000
					)}>, <t:${Math.floor(
						now.getTime() / 1000
					)}:R>\nOther args: ${args.join(" ")}`,
					`CRITICAL ERROR`
				)
			)
			.catch((err) => console.log(err));
	}
	return channel
		.send(kifo.embed(`${log} ${args.join(" ")}`, "LOG"))
		.catch((err) => {
			main.log(err);
		});
};

// process.on('uncaughtException', async (err) => {
// 	console.error(err)
// 	await main.log(err)
// })
