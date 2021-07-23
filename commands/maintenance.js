const Discord = require(`discord.js`);
const main = require(`../index.js`);
const { SupportGuild } = require(`../index`)
module.exports = {
	name: "maintenance",
	description: "notify for how long the maintenance is gonna last",
	memberpermissions: ["VIEW_CHANNEL"],
	adminPermOverride: true,
	cooldown: 2,
	usage: ["`maintenance <time_period>` - notify for how long the maintenance is gonna last"],
	execute(message, args) {
		if (!isNaN(args[0])) {
			let time = args[0];
			const now = new Date();
			let end = Math.floor((now.getTime() + time) / 1000)

			let alertChannel = SupportGuild.channels.resolve("867682507592171551")
			alertChannel.send(`<@&867682973939138590>`, kifo.embed(`<@!795638549730295820> is having a planned maintenance. It should be up at <t:${end}>, <t:${end}:R>`, `Maintenance alert!`)).then(msg => {
				msg.crosspost().catch(err => main.log(err))
			}).catch(err => main.log(err))

		}
	},
};