const
	Telegraf = require('telegraf')
	fs = require('fs')
	LocalSession = require('telegraf-session-local')
	http = require('http')
	static = require('node-static')

const file = new static.Server('./public');

http.createServer(function (request, response) {
    request.addListener('end', function () {
        file.serve(request, response);
    }).resume();
}).listen(process.env.PORT || 5000);

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use((new LocalSession({ database: 'db.json' })).middleware())

const downloadPhotoMiddleware = (ctx, next) => {
	var photoSizeList = ctx.message.photo;
	var photoSizeMax = photoSizeList[photoSizeList.length - 1];
	ctx.session.photos =  ctx.session.photos || [];
	ctx.session.photos.push(photoSizeMax);
  	return bot.telegram.getFileLink(photoSizeMax.file_id)
    .then((link) => {
      ctx.state.photoLink = link
      return next()
    })
}

const downloadVideoMiddleware = (ctx, next) => {
	ctx.session.videos =  ctx.session.videos || [];
	ctx.session.videos.push(ctx.message.video);
  	return bot.telegram.getFileLink(ctx.message.video.file_id)
    .then((link) => {
      ctx.state.videoLink = link
      return next()
    })
}

bot.start((ctx) => {
  ctx.session.user = ctx.from;
  return ctx.reply('Welcome! Try send a photo.')
})
bot.command('help', (ctx) => ctx.reply('Try send a photo!'))

bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.on('photo', downloadPhotoMiddleware, (ctx, next) => {
	ctx.replyWithPhoto({
		url: ctx.state.photoLink
	});
})
bot.on('video', downloadVideoMiddleware, (ctx, next) => {
	ctx.replyWithVideo({
		url: ctx.state.videoLink
	});
})
bot.on('document', (ctx) => {
	ctx.reply('🤖 Please send me your story as a \'Photo\' or \'Video\', not as a \'File\'.');
})

bot.startPolling()
