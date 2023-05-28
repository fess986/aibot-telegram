import { Telegraf, session } from 'telegraf'; // для работы с ботом телеграмма
import { message } from 'telegraf/filters' // помогает работать с текстом/голосом телеграмма
import { code } from 'telegraf/format'; // специальная фишка, которая меняет формат сообщения. Нам нужна, чтобы системные сообщения отличались
import config from 'config'; // для того чтобы можно было считывать настройки приложения из папки конфига]
import axios from "axios";

import { ogg } from './oggToMp3.js' 
import { openAi } from './openai.js';
import { roles, botComands, INIT_SESSION, CONTEXT_MAX, CONTEXT_PROGRAMMER, CONTEXT_CHAT_BOT,  } from './context.js'

console.log(config.get("TEST"));  // видимо конфиг умеет понимать по строке cross-env NODE_ENV=development пакаджа, из какого файла брать ключи - из дефолта или продакшена

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

bot.start(async (ctx) => {
  ctx.session.messages = JSON.parse(JSON.stringify(INIT_SESSION)) 
  await ctx.reply('Добро пожаловать в наш бот! Введите /help чтобы узнать подробнее о его возможностях.');
});

bot.use(session()); // подключаем мидлвеир, который умеет работать с сессиями

// прописываем мидлвеир, который будет добавлять в контекст общения текущее время, для того чтобы бот постоянно знал какая сегодня дата. А так же проверяем наличие контекста - если его нет, инициируем
bot.use((ctx, next) => {
  const currentDate = new Date(); // получаем текущую дату и время

  if (!ctx.session) { // Проверяем существует ли объект ctx.session
    ctx.session = {};
  }
  ctx.session.currentDate ??= currentDate; // сохраняем дату и время в сессионное хранилище
  ctx.session.messages ??= JSON.parse(JSON.stringify(INIT_SESSION)); // инициируем новый контекст, если его не было
  ctx.session.messages.push({
    role: roles.SYSTEM, 
    content: `Системное время: ${currentDate}` 
  })

  next(); // передаем управление следующему обработчику
});

const comandList = {

  async newSession(ctx) {
    ctx.session.messages = JSON.parse(JSON.stringify(INIT_SESSION))
    await ctx.reply('Начало новой сессии. Жду вашего голосового или текстового сообщения. Чтобы начать новую сессию введите /new в чате!!!!')
  },

  contentMax(ctx) {
    ctx.session.messages.push(CONTEXT_MAX);
    ctx.reply(`Контекст <b>CONTEXT_MAX</b> добавлен`, { parse_mode: "HTML" })
  },

  rebootBot(ctx) {
  bot.stop();
  ctx.reply(`<b>Бот перезапускается, текущая сессия обнуляется</b>`, { parse_mode: "HTML" })
  console.log('перезапуск бота')
  ctx.session = null;
  bot.launch();
},

  }




// bot.command - позволяет обрабатывать комманды в чате, например тут будет обрабатываться комманда '/new'. В данном случае мы обнуляем контекст сессии для того чтобы общаться с ботом заново
bot.command(`${botComands.new}`, async (ctx) => {

  comandList.newSession(ctx)

  // ctx.session = {...INIT_SESSION}; // так не работает, поверхностное клонирование
  // ctx.session = Object.assign({}, INIT_SESSION) // поверхностное клонирование,  нам не подходит так как там вложенные объекты
  // ctx.session = structuredClone(INIT_SESSION); // стандартная функция в ноде версии 17+. Так как у нас 16, нельзя использовать
  // ctx.session = cloneDeep(INIT_SESSION); // лодэш как то странно работает с нодой
  // console.log(ctx.session.messages)

  // так в итоге работает
  // ctx.session = JSON.parse(JSON.stringify(INIT_SESSION))
  // await ctx.reply('Начало новой сессии. Жду вашего голосового или текстового сообщения. Чтобы начать новую сессию введите /new в чате!!!!')

})

bot.command(`${botComands.contextMax}`, async (ctx) => {

  comandList.contentMax(ctx);

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

  // ctx.session.messages.push({
  //   role: roles.USER, 
  //   content: `Время, которое мы будем использовать в текущей беседе - ${ctx.session.currentDate}, то есть, если я спрошу, какое сейчас время, в ответе руководствуйся этими данными. При этом отсчитывай время отталкиваясь от этой минуты, чтобы получать актуальное время в контексте нашего общения`,
  // });
  // console.log(ctx.session.messages);
})

bot.command(`${botComands.contextProg}`, async (ctx) => {
  ctx.session.messages.push(CONTEXT_PROGRAMMER);
  ctx.reply(`Контекст <b>CONTEXT_PROGRAMMER</b> добавлен`, { parse_mode: "HTML" })

})

bot.command(`${botComands.contextBot}`, async (ctx) => {
  ctx.session.messages.push(CONTEXT_CHAT_BOT);
  ctx.reply(`Контекст <b>CONTEXT_CHAT_BOT</b> добавлен`, { parse_mode: "HTML" })
})

bot.command(`${botComands.reload}`, (ctx) => {
  comandList.rebootBot(ctx);
})

const weatherRequest = (ctx) => {
   // Отправляем запрос на получение местоположения
  ctx.reply('Пожалуйста, поделитесь своим местоположением для того чтобы узнать прогноз погоды', {
    // добавляем кнопку для запроса местоположения
    reply_markup: { 
      keyboard: [ // массив массивов с объектами, которые будут отображаться на клавиатуре
        [
          {
            text: 'Поделиться местоположением',
            request_location: true, // запрашивает у пользователя разрешение на использование его местоположения, если он нажмет на эту кнопку
          },
        ],
      ],
      resize_keyboard: true, // логическая настройка, которая позволяет изменять размер клавиатуры (true/false)
      one_time_keyboard: true, // логическая настройка, которая должна позволять удалять клавиатуру после ее использования (true/false), по факту она просто скрывает в "бутерброд" эту кнопку, а удаляем мы ее уже после
      // remove_keyboard: true, - тут эта настройка не работает почему то
      selective: true,
    },
  })
  .then(() => {
    setTimeout(() => {
      ctx.reply('Запрос геолокации удален', {
        reply_markup: {
          remove_keyboard: true, // удалаяем кнопку через 10 сек
        },
      });
    }, 10000); // Задержка в 5 секунд
  });
};

// Обработка полученной локации и вывод текущей погоды на экран
bot.on('location', async (ctx) => {

  try{

  const { latitude, longitude } = ctx.message.location; // после запроса у пользователя мы получаем объект location
  // console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

  const weatherRequest = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${config.get('WEATHER_KEY')}`

  const response = await axios.get(weatherRequest);
  ctx.reply(`Город: ${response.data.name}
  ситуация на улице: ${response.data.weather[0].description}
  температура: ${response.data.main.temp} °C
  влажность: ${response.data.main.humidity} %
  давление: ${response.data.main.pressure} мм.рт.ст.`);

  } catch(e) {
    console.log('Ошибка запроса погоды:', e.message);
  }
})


// запрос погоды
bot.command(`${botComands.weather}`, (ctx) => {
 weatherRequest(ctx)
});

///////////////////////////////////////////////////////////
// учим бота общаться через текст
bot.on(message('text'), async (ctx) => {

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

} catch(err) {
  if (err) {
   await ctx.reply(`Ошибка работы с текстовым чатом аи, текст ошибки: ${err.message}`)
   console.log('Ошибка работы с текстовым чатом аи, текст ошибки: ', err.message);
   // перезапускаем бота при ошибке и обнуляем контекст общения 
   comandList.rebootBot(ctx);
  } else {
    await ctx.reply(`Ошибка работы с текстовым чатом аи, скорее всего где то в openAi.chat`)
    console.log('Ошибка работы с текстовым чатом аи, скорее всего где то в openAi.chat')
  }
}
  }) 

  /////////////////////////////////////////////// голос
  bot.on(message('voice'), async (ctx) => {

  try {
    await ctx.reply(code('Голосовое сообщение принято, обрабатывается...'));
  
  const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id); // получаем от телеграмбота ссылку на нашу голосовую запись с расширением .ogg
  const userId = String(ctx.message.from.id);
  const oggPath = await ogg.create(link.href, userId); // создаем наше сообщение в папке voices и  по итогу возвращаем в переменную oggPath - путь до файла. Обязательно прописываем await , так как нам нужно дождаться выполнения асинхронной операции
  
  const mp3Path = await ogg.toMp3(oggPath, userId); // трансформируем .ogg файл в .mp3 и удаляем первый. После этого получаем путь к этому mp3-файлу
  
  // работаем с аи
  const text = await openAi.transcription(mp3Path);
  await ctx.reply(code(`Ваш запрос таков: ${text}`));

  const firstWord = text.split(' ')[0];
  const secondWord = text.split(' ')[1] ;
  console.log(firstWord);
  console.log(secondWord);

  // await ctx.reply(`<b>${firstWord}</b>`, { parse_mode: "HTML" }); // если хотим форматированный текст в ответе бота. При этом не все теги можно использовать, например h1 будет выдавать ошибку

  if (firstWord.toLowerCase().startsWith('контекст')) {
    console.log('ass');

    if (secondWord) {

      if (secondWord.toLowerCase().startsWith('макс')) {
        comandList.contentMax(ctx);
      } 

      if (secondWord.toLowerCase().startsWith('нов')) {
        comandList.newSession(ctx);
      } 

    }

    return;
  }

  if (firstWord.toLowerCase().startsWith('погода')) {
    weatherRequest(ctx)
    return;
  }

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
  
  } catch(err) {
    if (err) {

      comandList.rebootBot(ctx);

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

// прерывания нужны для адекватного "мягкого" завершения работы бота при получении от системы или пользователя соответствующих запросов. process.once - обрабатывает эти запросы, а коллбэк завершает работу бота () => bot.stop('SIGINT')
process.once('SIGINT', () => bot.stop('SIGINT')); // остановка бота по условию Signal Interrupt - прерыванию процесса, например пользователем ctrl+c.
process.once('SIGTERM', () => bot.stop('SIGTERM')); // (Signal Terminate) остановка бота по завершению работы, например от системы 