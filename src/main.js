import { Telegraf, session } from 'telegraf'; // для работы с ботом телеграмма
import { message } from 'telegraf/filters' // помогает работать с текстом/голосом телеграмма
import { code } from 'telegraf/format'; // специальная фишка, которая меняет формат сообщения. Нам нужна, чтобы системные сообщения отличались
import config from 'config'; // для того чтобы можно было считывать настройки приложения из папки конфига

import { ogg } from './oggToMp3.js' 
import { openAi } from './openai.js';
import { roles, INIT_SESSION, CONTEXT_MAX, CONTEXT_PROGRAMMER, CONTEXT_CHAT_BOT } from './context.js'

console.log(config.get("TEST"));  // видимо конфиг умеет понимать по строке cross-env NODE_ENV=development пакаджа, из какого файла брать ключи - из дефолта или продакшена

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

bot.start((ctx) => {
  ctx.reply('Добро пожаловать в наш бот! Введите /help чтобы узнать подробнее о его возможностях.');
});

bot.use(session()); // подключаем мидлвеир, который умеет работать с сессиями

// bot.use((ctx, next) => {
//   // получаем текущую дату и время
//   const currentDate = new Date();
//   console.log(currentDate)
//   // сохраняем дату и время в сессионное хранилище
//   ctx.session.currentDate = currentDate;
//   // передаем управление следующему обработчику
//   next();
// });

// прописываем мидлвеир, который будет добавлять в контекст общения текущее время, для того чтобы бот постоянно знал какая сегодня дата
bot.use((ctx, next) => {
  const currentDate = new Date();
  // console.log(currentDate);
  // Проверяем существует ли объект ctx.session
  if (!ctx.session) {
    ctx.session = {};
  }
  ctx.session.currentDate ??= currentDate;
  //console.log(ctx.session.currentDate);
  next();
});

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

bot.command('max', async (ctx) => {
  ctx.session ??= JSON.parse(JSON.stringify(INIT_SESSION));
  ctx.session.messages.push(CONTEXT_MAX);

  // вариант если мы достаем текущее время из контекста. На данный момент вместо этого мы используем время, которое в миддлвеире прописываем в сессию - ctx.session.currentDate

  // function getMonthName(date) {
  //   const monthNames = [
  //     'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  //     'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  //   ];
  //   return monthNames[date.getMonth()];
  // }

  // const messageDate = new Date(ctx.message.date * 1000);
  // const formattedDate = `${messageDate.getDate()} ${getMonthName(messageDate)} ${messageDate.getFullYear()} года. Время ${messageDate.getHours()} часов, ${messageDate.getMinutes()} минут`;

  ctx.session.messages.push({
    role: roles.USER, 
    content: `Время, которое мы будем использовать в текущей беседе - ${ctx.session.currentDate}, то есть, если я спрошу, какое сейчас время, в ответе руководствуйся этими данными. При этом отсчитывай время отталкиваясь от этой минуты, чтобы получать актуальное время в контексте нашего общения`,
  });
  console.log(ctx.session.messages);
})

bot.command('prog', async (ctx) => {
  ctx.session ??= JSON.parse(JSON.stringify(INIT_SESSION));
  ctx.session.messages.push(CONTEXT_PROGRAMMER);
  console.log(ctx.session.messages);
})

bot.command('bot', async (ctx) => {
  ctx.session ??= JSON.parse(JSON.stringify(INIT_SESSION));
  ctx.session.messages.push(CONTEXT_CHAT_BOT);
  console.log(ctx.session.messages);
})

// учим бота общаться через текст
bot.on(message('text'), async (ctx) => {
  ctx.session ??= JSON.parse(JSON.stringify(INIT_SESSION))
  
 // console.log(ctx.session.currentDate);
try {
  await ctx.reply(code('Текстовое сообщение принято, обрабатывается...'));

  if (!ctx.session.messages) {
    ctx.session.messages = [];
  }

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
   console.log(ctx.session) // будем выводить контекст в консоль чтобы анализировать из за чего мог зависнуть бот
   ctx.session = JSON.parse(JSON.stringify(INIT_SESSION));
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

  if (!ctx.session.messages) {
    ctx.session.messages = [];
  }
  
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