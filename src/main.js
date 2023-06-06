import { Telegraf, session, Markup, Input } from 'telegraf'; // для работы с ботом телеграмма
import { message } from 'telegraf/filters' // помогает работать с текстом/голосом телеграмма
import { code } from 'telegraf/format'; // специальная фишка, которая меняет формат сообщения. Нам нужна, чтобы системные сообщения отличались
import config from 'config'; // для того чтобы можно было считывать настройки приложения из папки конфига]
import axios from "axios";

import {deleteFolderRecursive} from './utils.js'
import { ogg } from './oggToMp3.js' 
import { openAi } from './openai.js';
import {files} from './files.js'

import { roles, botComands, INIT_SESSION, CONTEXT_MAX, CONTEXT_PROGRAMMER, CONTEXT_CHAT_BOT, helpMessage } from './context.js'

console.log(config.get("TEST"));  // видимо конфиг умеет понимать по строке cross-env NODE_ENV=development пакаджа, из какого файла брать ключи - из дефолта или продакшена

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

bot.start(async (ctx) => {
  ctx.session.messages = JSON.parse(JSON.stringify(INIT_SESSION)) 
  await ctx.reply('Добро пожаловать в наш бот! Введите /help чтобы узнать подробнее о его возможностях.');
});

bot.help((ctx) => {
  ctx.reply(helpMessage);
})

// тестируем работу с кнопками. Для того чтобы всё выполнялось по порядку, делаем функцию асинхронной и потом при помощи await ожидаем выполнение очередной задачи. При этом не забываем трай-кэтч при любой асинхронщине, чтобы не крашить бота при асинхронной ошибке
bot.command(botComands.contextButtons, async (ctx) => {

  try {
    await ctx.replyWithHTML('<b>Добавление контекста:</b>', Markup.inlineKeyboard(
        [
          [Markup.button.callback('Макс', 'max'), Markup.button.callback('Программист JS', 'programmist'), Markup.button.callback('Пишем бота', 'bot')], // каждый массив представляет одну строку с кнопками. btn1 - это идентификатор, по которому ее потом можно найти
          [Markup.button.callback('Новый контекст!', 'new')]
        ]
  ))

  bot.action('max', async (ctx) => {
    await ctx.answerCbQuery();
    comandList.contentMax(ctx)
  })

  bot.action('programmist', async (ctx) => {
    await ctx.answerCbQuery();
    comandList.contentProg(ctx)
  })

  bot.action('bot', async (ctx) => {
    await ctx.answerCbQuery();
    comandList.contentBot(ctx)
  })

  bot.action('new', async (ctx) => {
    await ctx.answerCbQuery();
    comandList.newSession(ctx)
  })

  // buttonHandlers('btn1', false, 'первая кнопка');
  } catch(err) {
    console.log('ошибка работы с кнопками контекста', err)
  }
})

bot.command(botComands.manageButtons, async (ctx) => {

  try {
    await ctx.replyWithHTML('<b>Управление функциями бота:</b>', Markup.inlineKeyboard(
        [
          [Markup.button.callback('Перезагрузка бота', 'reload'), Markup.button.callback('Новый контекст', 'new')], // каждый массив представляет одну строку с кнопками. btn1 - это идентификатор, по которому ее потом можно найти
          [Markup.button.callback('Текущая погода', 'weather')],
          [Markup.button.callback('Создать картинку по описанию', 'createImage')],
          [Markup.button.callback('Создать запись', 'createRecord')],
          [Markup.button.callback('Скачать записи', 'sendRecord')],
          [Markup.button.callback('Удалить записи', 'removeRecords')],
        ]
  ))

  bot.action('reload', async (ctx) => {
    await ctx.answerCbQuery();
    comandList.rebootBot(ctx)
  })

  bot.action('weather', async (ctx) => {
    await ctx.answerCbQuery();
    weatherRequest(ctx);
  })

  bot.action('new', async (ctx) => {
    await ctx.answerCbQuery();
    comandList.newSession(ctx)
  })

  bot.action('createImage', async (ctx) => {
    await ctx.answerCbQuery();
    comandList.createImage(ctx);
  })

  bot.action('createRecord', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply('Введите сообщение для записи. Первое слово записи будет соответствовать названию папки для записи. Остальные слова - текст записи.')
    ctx.session.askRecordText = true
  })

  bot.action('sendRecord', async (ctx) => {
    // await ctx.answerCbQuery();
    await comandList.sendRecords(ctx);
  })

  bot.action('removeRecords', async (ctx) => {
    await ctx.answerCbQuery();
    await comandList.removeRecords(ctx);
  })

  } catch(err) {
    console.log('ошибка работы с кнопками управления', err)
  }
})

bot.use(session()); // подключаем мидлвеир, который умеет работать с сессиями

// прописываем мидлвеир, который будет добавлять в контекст общения текущее время, для того чтобы бот постоянно знал какая сегодня дата. А так же проверяем наличие контекста - если его нет, инициируем
bot.use((ctx, next) => {
  const currentDate = new Date(); // получаем текущую дату и время

  if (!ctx.session) { // Проверяем существует ли объект ctx.session
    ctx.session = {};
  }
  ctx.session.currentDate = currentDate; // сохраняем дату и время в сессионное хранилище
  ctx.session.messages ??= JSON.parse(JSON.stringify(INIT_SESSION)); // инициируем новый контекст, если его не было
  ctx.session.messages.push({
    role: roles.SYSTEM, 
    content: `Системное время: ${currentDate}` 
  })

  // console.time(`Processing update ${ctx.update.update_id}`); - запуск счетчика времени выполнения процессов

  next(); // передаем управление следующему обработчику

  // console.timeEnd(`Processing update ${ctx.update.update_id}`); // завершение счётчика и показ времени выполнения всех мидлвеиров
});

bot.command(botComands.sendRecords, async (ctx) => {
  console.log(ctx)
  comandList.sendRecords(ctx)
})

bot.command(botComands.removeRecords, async (ctx) => {
  comandList.removeRecords(ctx);
})

// обработка того, задан ли вопрос пользователю по поводу описания картинки
bot.use(async (ctx, next) => {

  if (ctx.session.askImageDiscription === true) {
    // ctx.session.imageDescription = ctx.message.text;
    await ctx.replyWithHTML(`Картинка по вашему запросу: <b>"${ctx.message.text}"</b> - создается, поождите немного... `);

    const url = await openAi.image(ctx.message.text);

    await ctx.replyWithPhoto(Input.fromURL(url)); // используем специальный объект Input для того чтобы не было проблем с загрузкой картинки по url
  
  }

  next()
})

// обработка того, задан ли вопрос пользователю по поводу записи текста
bot.use(async (ctx, next) => {

  if (ctx.session.askRecordText === true) {
    
    const text = ctx.message.text;
    const [themeWithSigns, ...rest] = text.split(' ');

    console.log('we there')

    const pattern = /[A-Za-zА-Яа-яЁё]+/g; // убираем лишние знаки из строки запроса

    const theme = (themeWithSigns.match(pattern) !== null) ? themeWithSigns.match(pattern)[0].toLowerCase() : 'default';

    const data = rest.join(' ');
    const user = ctx.message.from.last_name;
    const time = ctx.session.currentDate;
    
    await ctx.replyWithHTML(`Ваш текст : <b>"${data}"</b> - сохранен в папке <b>"${theme}"</b>.`);

  files.writeRecord(user, time, theme, data);

  }

  next()
})


const comandList = {

  async newSession(ctx) {
    ctx.session.messages = JSON.parse(JSON.stringify(INIT_SESSION))
    await ctx.reply('Начало новой сессии. Жду вашего голосового или текстового сообщения. Чтобы начать новую сессию введите /new в чате!!!!')
  },

  contentMax(ctx) {
    ctx.session.messages.push(CONTEXT_MAX);
    ctx.reply(`Контекст <b>CONTEXT_MAX</b> добавлен`, { parse_mode: "HTML" })
  },

  contentProg(ctx) {
    ctx.session.messages.push(CONTEXT_PROGRAMMER);
    ctx.reply(`Контекст <b>CONTEXT_PROGRAMMER</b> добавлен`, { parse_mode: "HTML" })
  },

  contentBot(ctx) {
    ctx.session.messages.push(CONTEXT_CHAT_BOT);
    ctx.reply(`Контекст <b>CONTEXT_CHAT_BOT</b> добавлен`, { parse_mode: "HTML" })
  },

  rebootBot(ctx) {
  bot.stop();
  ctx.reply(`<b>Бот перезапускается, текущая сессия обнуляется</b>`, { parse_mode: "HTML" })
  console.log('перезапуск бота')
  ctx.session = null;
  bot.launch();
},

  createImage(ctx) {
    ctx.reply('Опишите картинку, которую вы так мечтаете увидеть? Лучше на английском языке...')
    ctx.session.askImageDiscription = true
  },

  async sendRecords(ctx) {

    try {
    const user = await ctx?.message?.from?.last_name ?? ctx?.update?.callback_query?.from?.last_name ?? 'user';  // в зависимости от того, когда происходит действие, объект контекста может различаться, например если он вызывается при нажатии кнопки действия кейпада, у него не будет поля ctx.message.from , но зато будет ctx.update.callback_query.from? , поэтому мы проверяем наличие всех этих полей чтобы не схватить ошибку.

    const recordsExist = files.areRecordsExists(user);
  
    if (!recordsExist) {
      ctx.reply('У вас нет ни одной записи для отправки архива. Создайте её через соответствующую кнопку в меню /b , или через /r , или же через голосовое управление фразой "Запись на тему ..."');
      return
    }
  
    const arhPath = await files.archiveRecords(user); 
    bot.telegram.sendDocument(ctx.chat.id, {
      source: arhPath // указываем путь к файлу. Можно относительный или абсолютный
    }, { caption: 'Архив с вашими текстовыми записями скачан' }) 
  
    } catch(err) {
      console.log('Ошибка архивирования и отправки файлов', err.message);
    }
  },

  async removeRecords(ctx) {
    try {
      const user = await ctx?.message?.from?.last_name ?? ctx?.update?.callback_query?.from?.last_name ?? 'user'; 
      const recordsPath = files.recordsPath(user);
      deleteFolderRecursive(recordsPath);
      await ctx.replyWithHTML(`Ваша папка с записями: <b>"${user}"</b> - удалена. `);
    } catch(err) {
      console.log('ошибка удаления папки с вашими записями', err.message)
    }
  }

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

// команда для записи заметки в формате "/record theme ..." - в итоге заметка сохранится в папку record/theme , а сообщение "..." будет сохранено в файле
bot.command(`${botComands.record}`, async (ctx) => {

  const text = ctx.message.text;

  const [,themeWithSigns, ...rest] = text.split(' ');

  const pattern = /[A-Za-zА-Яа-яЁё]+/g; // убираем лишние знаки из строки запроса
  const theme = (themeWithSigns.match(pattern) !== null) ? themeWithSigns.match(pattern)[0].toLowerCase() : 'default';

  const data = rest.join(' ');
  const user = ctx.message.from.last_name;
  const time = ctx.session.currentDate;

  files.writeRecord(user, time, theme, data);

  await ctx.replyWithHTML(`Ваш текст : <b>"${data}"</b> - сохранен в папке <b>"${theme}"</b>.`);
})

bot.command(`${botComands.contextMax}`, async (ctx) => {
  comandList.contentMax(ctx);
})

bot.command(`${botComands.contextProg}`, async (ctx) => {
  comandList.contentProg(ctx);
})

bot.command(`${botComands.contextBot}`, async (ctx) => {
  comandList.contentBot(ctx);
})

bot.command(`${botComands.reload}`, (ctx) => {
  comandList.rebootBot(ctx);
})

bot.command(`${botComands.image}`, (ctx) => {
  comandList.createImage(ctx);
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


  if ((ctx.session.askImageDiscription === true) || ( ctx.session.askRecordText === true) )  {
    ctx.session.askImageDiscription = false;
    ctx.session.askRecordText = false;
    return
  }

try {
  await ctx.reply(code('Текстовое сообщение принято, обрабатывается...'));

  ctx.session.messages.push({role: roles.USER, content: ctx.message.text});

  const response = await openAi.chat(ctx.session.messages);

  ctx.session.messages.push({
    role: roles.ASSISTANT, 
    content: response.content,
  })

  await ctx.reply(response.content);
  console.log('текст обработан аи...')
  // console.log(ctx.session.messages)

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

  const splitedText = text.split(' ');
  const [firstWord, secondWord, thirdWord, forthWord] = splitedText;

  // await ctx.reply(`<b>${firstWord}</b>`, { parse_mode: "HTML" }); // если хотим форматированный текст в ответе бота. При этом не все теги можно использовать, например h1 будет выдавать ошибку

  if (firstWord.toLowerCase().startsWith('контекст')) {

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

  // запись сообщения в папку records, который вызывается из голосового сообщения, которое начинается с фразы "запись на тему ...". 
  if (firstWord.toLowerCase().startsWith('запись')) {

      const pattern = /[A-Za-zА-Яа-яЁё]+/g; // убираем лишние знаки из строки запроса
      const theme = (forthWord.match(pattern) !== null) ? forthWord.match(pattern)[0].toLowerCase() : 'default';
      const user = ctx.message.from.last_name;
      const time = ctx.session.currentDate;

      files.writeRecord(user, time, theme, text);

      ctx.reply(`Ваша запись <b>${text}</b> сохранена в папке <b>${theme}</b>`, { parse_mode: "HTML" })

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