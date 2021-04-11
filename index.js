const {Collection, Client, Discord} = require('discord.js')
const fs = require('fs')
const client = new Client({
    disableEveryone: true
})

const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://Devo:Astro11@cluster0.yvqz1.mongodb.net/test', {
  useUnifiedTopology : true,
  useNewUrlParser: true,
}).then(console.log('Connected to mongo db!'))


const prefixSchema = require('./models/prefix')

const fetc = require('node-fetch')
const config = require('./config.json')
const prefix = config.prefix
const token = config.token
const db = require('quick.db')
client.commands = new Collection();
client.aliases = new Collection();
client.categories = fs.readdirSync("./commands/");
["command"].forEach(handler => {
    require(`./handlers/${handler}`)(client);
}); 



client.prefix = async function(message) {
    let custom;

    const data = await prefixSchema.findOne({ Guild : message.guild.id })
        .catch(err => console.log(err))
    
    if(data) {
        custom = data.Prefix;
    } else {
        custom = prefix;
    }
    return custom;
}



client.on('ready', () => {
    client.user.setActivity(`${prefix}help`)
    console.log(`${client.user.username} ✅`)
})


client.on('message', async message => {
    //under if(message.author.bot)
  
  if(db.has(`afk-${message.author.id}+${message.guild.id}`)) {
          const info = db.get(`afk-${message.author.id}+${message.guild.id}`)
          await db.delete(`afk-${message.author.id}+${message.guild.id}`)
          message.reply(`**Tu afk se ha eliminado:** ${info}`).then(m => m.delete({ timeout: 10000 }))
      }
      //checking for mentions
      if(message.mentions.members.first()) {
          if(db.has(`afk-${message.mentions.members.first().id}+${message.guild.id}`)) {
              message.channel.send(message.mentions.members.first().user.tag + " AFK: " + db.get(`afk-${message.mentions.members.first().id}+${message.guild.id}`))
          }else return;
      }else;
  })



client.on('message', async message => {
    const p = await client.prefix(message)
    if(message.mentions.users.first()) {
        if(message.mentions.users.first().id === '815388581052547093') return message.channel.send(`Hola! Soy **Astro**, mi prefix en **${message.guild.name}** es **${p}**`)
    }
    if (!message.content.startsWith(p)) return;
    if (!message.guild) return;
    if (!message.member) message.member = await message.guild.fetchMember(message);
    const args = message.content.slice(p.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();
    if (cmd.length == 0) return;
    let command = client.commands.get(cmd)
    if (!command) command = client.commands.get(client.aliases.get(cmd));
    if (command) command.run(client, message, args)
})

client.on('guildDelete', async (guild) => {
    prefixSchema.findOne({ Guild: guild.id }, async (err, data) => {
        if (err) throw err;
        if (data) {
            prefixSchema.findOneAndDelete({ Guild : guild.id }).then(console.log('deleted data.'))
        }
    })
})


client.login(token)
