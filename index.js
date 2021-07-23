require('dotenv').config()
const Discord = require('discord.js');
const fs = require('fs');
const kifo = require('kifo');
const config = require('./configuration.json')
const main = require(`./index.js`)

const client = new Discord.Client();
client.commands = new Discord.Collection();
var KifoClanker = {};
var isKifoOnline = true;
var SupportGuild = {};
let maintenanceEnd = new Date();

module.exports.SupportGuild = SupportGuild;
module.exports.maintenanceEnd = maintenanceEnd;

const commandFiles = fs.readdirSync(`./commands`).filter(file => file.endsWith(".js"))
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
	console.log(`"${file.slice(0, -3)}"`);
}

// On Ready
client.once('ready', async () => {
	console.log('Ready!');
	SupportGuild = await client.guilds.fetch("822800862581751848");
	KifoClanker = await client.users.fetch("795638549730295820");

	checkKifoClanker();
	setInterval(checkKifoClanker, 1000 * 5)
});

client.on("message", (message) => {

	if (message.author.id !== "289119054130839552") return;
	if (!message.content.startsWith(config.prefix)) return;
	let args = message.content.slice(config.prefix.length).split(" ");
	let cmd = args.shift().toLowerCase();
	if (client.commands.has(cmd)) {
		client.commands.get(cmd).execute(message, args)
	}
})

async function checkKifoClanker() {
	KifoClanker = await client.users.fetch("795638549730295820", { force: true })

	let now = Date.now();

	if (now > maintenanceEnd) {
		if (KifoClanker.presence.status == "online" && !isKifoOnline) {
			isKifoOnline = true;
			let alertChannel = SupportGuild.channels.resolve("867682507592171551")
			alertChannel.send(`<@&867682973939138590>`, kifo.embed("<@!795638549730295820> has recovered from unexpected crash! 🥳", `Unplanned downtime alert!`)).then(msg => {
				msg.crosspost().catch(err => main.log(err))
			}).catch(err => main.log(err))
		}

		if (KifoClanker.presence.status == "offline" && isKifoOnline) {
			console.log("KifoClanker is offline!!!")
			isKifoOnline = false;
			let alertChannel = SupportGuild.channels.resolve("867682507592171551")
			alertChannel.send(`<@&867682973939138590>`, alertEmbed).then(msg => {
				msg.crosspost().catch(err => main.log(err))
			}).catch(err => main.log(err))
		}
	} else isKifoOnline = true;
}

let alertEmbed = kifo.embed(`<@!795638549730295820> had an unexpected crash. <@!289119054130839552> has been notified, he will fix the bot soon.`, "Unplanned downtime alert!")

client.login(process.env.LOGIN_TOKEN);

/**
 * Logs in #kifo-logs
 * @param {string} log the message you want to log
 * @returns Promise, in case something breaks
 */
exports.log = function (log, ...args) {
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