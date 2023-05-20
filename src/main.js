import { Telegraf, session } from 'telegraf'; // для работы с ботом телеграмма
import { message } from 'telegraf/filters' // помогает работать с текстом/голосом телеграмма
import { code } from 'telegraf/format'; // специальная фишка, которая меняет формат сообщения. Нам нужна, чтобы системные сообщения отличались
import config from 'config'; // для того чтобы можно было считывать настройки приложения из папки конфига

import { ogg } from './oggToMp3.js' 
import { openAi } from './openai.js';
import { roles, INIT_SESSION } from './context.js'

console.log(config.get("TEST"));  // видимо конфиг умеет понимать по строке cross-env NODE_ENV=development пакаджа, из какого файла брать ключи - из дефолта или продакшена

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

bot.start((ctx) => {
  ctx.reply('Добро пожаловать в наш бот! Введите /help чтобы узнать подробнее о его возможностях.');
});

bot.use(session()); // подключаем мидлвеир, который умеет работать с сессиями

//  прописываем то, что при получении комманды "/start" - телеграм бот должен будет нам ответить сообщением-объектом ctx.message. П.С. command - это именно комманды бота
bot.command('start', async (ctx) => {
  ctx.session = JSON.parse(JSON.stringify(INIT_SESSION)) // глубокое клонирование
  // console.log(ctx.session.messages)
  await ctx.reply('Начало новой сессии. Жду вашего голосового или текстового сообщения. Чтобы начать новую сессию введите /new в чате')
})  

// bot.command - позволяет обрабатывать комманды в чате, например тут будет обрабатываться комманда '/new'. В данном случае мы обнуляем контекст сессии для того чтобы общаться с ботом заново
bot.command('new', async (ctx) => {
  // ctx.session = {...INIT_SESSION}; // так не работает, поверхностное клонирование
  // ctx.session = Object.assign({}, INIT_SESSION) // поверхностное клонирование,  нам не подходит так как там вложенные объекты
  // ctx.session = structuredClone(INIT_SESSION); // стандартная функция в ноде версии 17+. Так как у нас 16, нельзя использовать
  // ctx.session = cloneDeep(INIT_SESSION); // лодэш как то странно работает с нодой
  ctx.session = JSON.parse(JSON.stringify(INIT_SESSION))
  // console.log(ctx.session.messages)
  await ctx.reply('Начало новой сессии. Жду вашего голосового или текстового сообщения. Чтобы начать новую сессию введите /new в чате!!!!')
})

// учим бота общаться через текст
bot.on(message('text'), async (ctx) => {
  ctx.session ??= JSON.parse(JSON.stringify(INIT_SESSION))
try {
  await ctx.reply(code('Текстовое сообщение принято, обрабатывается...'));

  ctx.session.messages.push({role: roles.USER, content: ctx.message.text});

  const response = await openAi.chat(ctx.session.messages);

  ctx.session.messages.push({
    role: roles.ASSISTANT, 
    content: response.content,
  })

  await ctx.reply(response.content);

  console.log(ctx.session.messages)

  // throw new Error("500 Internal Server Error"); // для проверки отработки ошибок

} catch(err) {
  if (err) {
   await ctx.reply(`Ошибка работы с текстовым чатом аи, текст ошибки: ${err.message}`)
   console.log('Ошибка работы с текстовым чатом аи, текст ошибки: ', err.message);
   // перезапускаем бота при ошибке и обнуляем контекст общения 
   bot.stop();
   // console.log(INIT_SESSION)
   ctx.session = JSON.parse(JSON.stringify(INIT_SESSION));
   console.log(ctx.session)
   bot.launch();
  } else {
    await ctx.reply(`Ошибка работы с текстовым чатом аи, скорее всего где то в openAi.chat`)
    console.log('Ошибка работы с текстовым чатом аи, скорее всего где то в openAi.chat')
  }
}
  }) 

  bot.on(message('voice'), async (ctx) => {
    ctx.session ??= JSON.parse(JSON.stringify(INIT_SESSION))
    // console.log(ctx.session.messages)
  try {
    await ctx.reply(code('Голосовое сообщение принято, обрабатывается...'));
  
  const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id); // получаем от телеграмбота ссылку на нашу голосовую запись с расширением .ogg
  const userId = String(ctx.message.from.id);
  const oggPath = await ogg.create(link.href, userId); // создаем наше сообщение в папке voices и  по итогу возвращаем в переменную oggPath - путь до файла. Обязательно прописываем await , так как нам нужно дождаться выполнения асинхронной операции
  
  const mp3Path = await ogg.toMp3(oggPath, userId); // трансформируем .ogg файл в .mp3 и удаляем первый. После этого получаем путь к этому mp3-файлу
  
  // работаем с аи
  const text = await openAi.transcription(mp3Path);
  await ctx.reply(code(`Ваш запрос таков: ${text}`));
  
  // const messages = [{role: openAi.roles.USER, content: text}] // передавать будем не только само сообщенеие но и роль и прочий контекст - так мы делаем если не сохраняем контент а сразу кидаем в мессаджи
  
  ctx.session.messages.push({role: roles.USER, content: text});
  
  const response = await openAi.chat(ctx.session.messages);
  
  // после того как получаем ответ от аи - добавляем его в наш объект с сессией с пометкой ассистент
  ctx.session.messages.push({
    role: roles.ASSISTANT, // помечаем что этот контент пришел именно от самого бота
    content: response.content,
  })

  // выводим ответ аи в боте
  await ctx.reply(response.content);

  // throw new Error("500 Internal Server Error");
  
  // await ctx.reply(JSON.stringify(link, null, 2)); // парсим джейсон
  
  // console.log(link); // тут мы понимаем, что стринглифай немного неправильно приводит объект к строке. на самом деле это действительно полноценный объект с полем href которое нас будет интересовать в дальнейшем
  // console.log(link.href); // именно эта ссылка нам будет нужна

  // throw new Error("500 Internal Server Error"); // для проверки отработки ошибок
  
  } catch(err) {
    if (err) {

      bot.stop();
      // console.log(INIT_SESSION)
      ctx.session = JSON.parse(JSON.stringify(INIT_SESSION));
      bot.launch();

      await ctx.reply(`Ошибка работы с голосовым чатом аи, текст ошибки: ${err.message}`)
      console.log('Ошибка работы с голосовым чатом аи, текст ошибки: ', err.message)
    } else {
      await ctx.reply(`Ошибка работы с голосовым чатом аи, вероятно в openAi-модуле`)
      console.log('Ошибка работы с голосовым чатом аи, вероятно в openAi-модуле')
    }
    
  }
    }) 

bot.launch();
// nodemon({ script: bot.launch(), exitcrash: true }); // перезапуск через nodemon. Работает криво

process.once('SIGINT', () => bot.stop('SIGINT')); // остановка бота по условиям
process.once('SIGTERM', () => bot.stop('SIGTERM')); // остановка бота по условиям