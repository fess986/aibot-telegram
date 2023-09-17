import fs from 'fs';
import {
  Telegraf, session, Markup, Input,
} from 'telegraf'; // для работы с ботом телеграмма
import { message } from 'telegraf/filters'; // помогает работать с текстом/голосом телеграмма
import { code } from 'telegraf/format'; // специальная фишка, которая меняет формат сообщения. Нам нужна, чтобы системные сообщения отличались
import config from 'config'; // для того чтобы можно было считывать настройки приложения из папки конфига]
import axios from 'axios';

import { deleteFolderRecursive } from './utils.js';
import { ogg } from './oggToMp3.js';
import { openAi } from './openai.js';
import { files } from './files.js';
import { Loader } from './loader.js';

import {
  roles,
  botCommands,
  INIT_SESSION,
  CONTEXT_MAX,
  CONTEXT_PROGRAMMER,
  CONTEXT_CHAT_BOT,
  helpMessage,
  ERROR_MESSAGES,
} from './context.js';

console.log(config.get('TEST')); // видимо конфиг умеет понимать по строке cross-env NODE_ENV=development пакаджа, из какого файла брать ключи - из дефолта или продакшена

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

bot.help((ctx) => {
  ctx.reply(helpMessage);
});

// -------------------------------------- ПОГОДА ------------------

const weatherRequest = (ctx) => {
  // Отправляем запрос на получение местоположения
  ctx
    .reply(
      'Пожалуйста, поделитесь своим местоположением для того чтобы узнать прогноз погоды',
      {
        // добавляем кнопку для запроса местоположения
        reply_markup: {
          keyboard: [
            // массив массивов с объектами, которые будут отображаться на клавиатуре
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
      },
    )
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
  try {
    const { latitude, longitude } = ctx.message.location; // после запроса у пользователя мы получаем объект location
    // console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

    const weatherRequestURL = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${config.get(
      'WEATHER_KEY',
    )}`;

    const response = await axios.get(weatherRequestURL);
    ctx.reply(`Город: ${response.data.name}
  ситуация на улице: ${response.data.weather[0].description}
  температура: ${response.data.main.temp} °C
  влажность: ${response.data.main.humidity} %
  давление: ${response.data.main.pressure} мм.рт.ст.`);
  } catch (e) {
    // eslint-disable-next-line no-use-before-define
    await commandList.rebootBot(ctx, 'Ошибка запроса погоды: ', e); // отключаем проверку линтера, так как получается перекрестный вызов
  }
});

// ---------------------------ОПИСАНИЕ КОМАНД БОТА---------------
const commandList = {
  async newSession(ctx) {
    try {
      console.log('Обнуление сессии...');
      ctx.session.messages ??= JSON.parse(JSON.stringify(INIT_SESSION));
      // ctx.session.messages = ctx.session.messages || JSON.parse(JSON.stringify(INIT_SESSION));
      ctx.session.messages = JSON.parse(JSON.stringify(INIT_SESSION));

      // ctx.session.askImageDiscription ??= false; // ??= - нуль-исключение. Значение справа присваивается только в том случае, если слева null или undefined
      ctx.session.askImageDiscription = ctx.session.askImageDiscription || false;
      ctx.session.askImageDiscription = false;
      // ctx.session.askRecordText ??= false;
      ctx.session.askRecordText = ctx.session.askRecordText || false;
      ctx.session.askRecordText = false;
      ctx.session.createTextCompletion = ctx.session.createTextCompletion || false;
      ctx.session.createTextCompletion = false;

      await ctx.reply(
        'Начало новой сессии. Жду вашего голосового или текстового сообщения. Чтобы начать новую сессию введите /new в чате!!!!',
      );
      console.log(ctx.session.messages);
      console.log(ctx.session);
    } catch (err) {
      console.log('Ошибка обнуления сессии');

      if (!!ctx) {
        await ctx.reply('Ошибка обнуления сессии');
      }

      // !!ctx && (await ctx.reply('Ошибка обнуления сессии')); // линтер не понимает
    }
  },

  async contentMax(ctx) {
    try {
      ctx.session.messages.push(CONTEXT_MAX);
      ctx.reply('Контекст <b>CONTEXT_MAX</b> добавлен', { parse_mode: 'HTML' });
    } catch (err) {
      commandList.rebootBot(
        ctx,
        'Ошибка добавления контекста CONTEXT_MAX',
        err,
      );
    }
  },

  contentProg(ctx) {
    try {
      ctx.session.messages.push(CONTEXT_PROGRAMMER);
      ctx.reply('Контекст <b>CONTEXT_PROGRAMMER</b> добавлен', {
        parse_mode: 'HTML',
      });
    } catch (err) {
      commandList.rebootBot(
        ctx,
        'Ошибка добавления контекста CONTEXT_PROGRAMMER',
        err,
      );
    }
  },

  contentBot(ctx) {
    try {
      ctx.session.messages.push(CONTEXT_CHAT_BOT);
      ctx.reply('Контекст <b>CONTEXT_CHAT_BOT</b> добавлен', {
        parse_mode: 'HTML',
      });
    } catch (err) {
      commandList.rebootBot(
        ctx,
        'Ошибка добавления контекста CONTEXT_CHAT_BOT',
        err,
      );
    }
  },

  async rebootBot(ctx, text, err = { message: 'объект ошибки отсутствует' }) {
    try {
      // bot.stop();
      console.log(`Сообщение ошибки при ребуте - ${err.message}`);

      if (!ctx) {
        throw new Error('НЕТ КОНТЕКСТА ПРИ ПЕРЕДАЧЕ ОШИБКИ В РЕБУТ');
      }

      await ctx.reply('<b>Бот перезапускается...</b>', { parse_mode: 'HTML' });

      if (!ctx.session) {
        ctx.session = {};
      }

      console.log(ctx);
      ctx.session = {};

      console.log(`${text} - `, err.message);
      await ctx.reply(`${text} - ${err.message}`);

      console.log('перезапуск бота...');
      await ctx.reply('<b>Бот перезапущен.</b>', { parse_mode: 'HTML' });
      // bot.launch();

      await this.newSession(ctx);
    } catch (error) {
      console.log('ошибка перезапуска бота', error.message);

      if (!!ctx) {
        await ctx.reply('ошибка перезапуска бота', error.message);
      }

      // !!ctx && (await ctx.reply('ошибка перезапуска бота', error.message));
    }
  },

  createImage(ctx) {
    try {
      ctx.reply(
        'Опишите картинку, которую вы так мечтаете увидеть? Лучше на английском языке...',
      );
      ctx.session.askImageDiscription = true;
    } catch (err) {
      commandList.rebootBot(ctx, 'Ошибка запроса на создание картинки');
    }
  },

  // команда для записи заметки в формате "/record theme ..." - в итоге заметка сохранится в папку record/theme , а сообщение "..." будет сохранено в файле
  async createRecord(ctx) {
    try {
      const { text } = ctx.message;

      const [, themeWithSigns, ...rest] = text.split(' ');

      const pattern = /[A-Za-zА-Яа-яЁё0-9]+/g; // убираем лишние знаки из строки запроса
      const theme = themeWithSigns.match(pattern) !== null ? themeWithSigns.match(pattern)[0].toLowerCase() : 'default';

      const data = rest.join(' ');
      const user = ctx.message.from.last_name;
      const time = ctx.session.currentDate;

      files.writeRecord(user, time, theme, data);

      await ctx.replyWithHTML(
        `Ваш текст : <b>"${data}"</b> - сохранен в папке <b>"${theme}"</b>.`,
      );
    } catch (err) {
      await commandList.rebootBot(ctx, 'ошибка записи: ', err);
    }
  },

  async sendRecords(ctx) {
    try {
      const user = (await ctx?.message?.from?.last_name) ?? ctx?.update?.callback_query?.from?.last_name ?? 'user'; // в зависимости от того, когда происходит действие, объект контекста может различаться, например если он вызывается при нажатии кнопки действия кейпада, у него не будет поля ctx.message.from , но зато будет ctx.update.callback_query.from? , поэтому мы проверяем наличие всех этих полей чтобы не схватить ошибку.

      const recordsExist = files.areRecordsExists(user);

      if (!recordsExist) {
        ctx.reply(
          'У вас нет ни одной записи для отправки архива. Создайте её через соответствующую кнопку в меню /b , или через /r , или же через голосовое управление фразой "Запись на тему ..."',
        );
        return;
      }

      const arhPath = await files.archiveRecords(user);
      bot.telegram.sendDocument(
        ctx.chat.id,
        {
          source: arhPath, // указываем путь к файлу. Можно относительный или абсолютный
        },
        { caption: 'Архив с вашими текстовыми записями скачан' },
      );
    } catch (err) {
      await commandList.rebootBot(
        ctx,
        'Ошибка архивирования и отправки файлов: ',
        err,
      );
    }
  },

  async removeRecords(ctx) {
    try {
      const user = (await ctx?.message?.from?.last_name) ?? ctx?.update?.callback_query?.from?.last_name ?? 'user';
      const recordsPath = files.recordsPath(user);
      deleteFolderRecursive(recordsPath);
      await ctx.replyWithHTML(
        `Ваша папка с записями: <b>"${user}"</b> - удалена. `,
      );
    } catch (err) {
      await commandList.rebootBot(
        ctx,
        'ошибка удаления папки с вашими записями: ',
        err,
      );
    }
  },
};

// тестируем работу с кнопками. Для того чтобы всё выполнялось по порядку, делаем функцию асинхронной и потом при помощи await ожидаем выполнение очередной задачи. При этом не забываем трай-кэтч при любой асинхронщине, чтобы не крашить бота при асинхронной ошибке
bot.command(botCommands.contextButtons, async (ctx) => {
  try {
    await ctx.replyWithHTML(
      '<b>Добавление контекста:</b>',
      Markup.inlineKeyboard([
        [Markup.button.callback('Новый контекст!', 'new')],
        [
          Markup.button.callback('Макс', 'max'),
          Markup.button.callback('Программист JS', 'programmist'),
          Markup.button.callback('Пишем бота', 'bot'),
        ], // каждый массив представляет одну строку с кнопками. btn1 - это идентификатор, по которому ее потом можно найти
      ]),
    );

    bot.action('max', async (ctx1) => {
      await ctx1.answerCbQuery();
      commandList.contentMax(ctx1);
      // throw new Error('ass')
    });

    bot.action('programmist', async (ctx1) => {
      await ctx1.answerCbQuery();
      commandList.contentProg(ctx1);
    });

    bot.action('bot', async (ctx1) => {
      await ctx1.answerCbQuery();
      commandList.contentBot(ctx1);
    });

    bot.action('new', async (ctx1) => {
      await ctx1.answerCbQuery();
      commandList.newSession(ctx1);
    });

    // buttonHandlers('btn1', false, 'первая кнопка');
  } catch (err) {
    console.log(err);
    await commandList.rebootBot(
      ctx,
      'ошибка работы с кнопками контекста: ',
      err,
    );
  }
});

bot.command(botCommands.bonusButtons, async (ctx) => {
  try {
    await ctx.replyWithHTML(
      '<b>Управление функциями бота:</b>',
      Markup.inlineKeyboard([
        [
          Markup.button.callback('Перезагрузка бота', 'reboot'),
          Markup.button.callback('Новый контекст', 'new'),
        ], // каждый массив представляет одну строку с кнопками. btn1 - это идентификатор, по которому ее потом можно найти
        [Markup.button.callback('Текущая погода', 'weather')],
        [
          Markup.button.callback(
            'Перевести голос в текст',
            'createTextFromVoice',
          ),
        ],
        [
          Markup.button.callback(
            'Дополнить текст',
            'textCompletion',
          ),
        ],
      ]),
    );

    bot.action('reboot', async (ctx1) => {
      await ctx1.answerCbQuery();
      await commandList.rebootBot(
        ctx1,
        'Перезагрузка по запросу пользователя: ',
      );
    });

    bot.action('weather', async (ctx1) => {
      await ctx1.answerCbQuery();
      weatherRequest(ctx1);
    });
  } catch (err) {
    await commandList.rebootBot(
      ctx,
      'ошибка работы с кнопками управления ботом: ',
      err,
    );
  }

  bot.action('createTextFromVoice', async (ctx1) => {
    await ctx1.answerCbQuery();
    ctx1.reply(
      'Произнесите голосом текст, который вы хотите увидеть в напечатанном виде',
    );
    ctx.session.createTextFromVoice ??= true;
    ctx.session.createTextFromVoice = true;
  });

  bot.action('textCompletion', async (ctx1) => {
    await ctx1.answerCbQuery();
    ctx1.replyWithHTML(
      'Начните печатать текст, который вы хотите чтобы АИ дополнил. Лучше использовать <b> Английский язык </b> - так текст будет гораздо длиннее',
    );
    ctx1.session.createTextCompletion ??= true;
    ctx1.session.createTextCompletion = true;
  });
});

bot.command(botCommands.recordButtons, async (ctx) => {
  try {
    await ctx.replyWithHTML(
      '<b>Работа с записями:</b>',
      Markup.inlineKeyboard([
        [Markup.button.callback('Создать запись', 'createRecord')],
        [Markup.button.callback('Скачать записи', 'sendRecord')],
        [Markup.button.callback('Удалить записи', 'removeRecords')],
      ]),
    );

    bot.action('createRecord', async (ctx1) => {
      await ctx1.answerCbQuery();
      ctx1.reply(
        'Введите сообщение для записи. Первое слово записи будет соответствовать названию папки для записи. Остальные слова - текст записи.',
      );
      ctx1.session.askRecordText = true;
    });

    bot.action('sendRecord', async (ctx1) => {
      // await ctx.answerCbQuery();
      await commandList.sendRecords(ctx1);
    });

    bot.action('removeRecords', async (ctx1) => {
      await ctx.answerCbQuery();
      await commandList.removeRecords(ctx1);
    });
  } catch (err) {
    await commandList.rebootBot(
      ctx,
      'ошибка работы с кнопками управления ботом: ',
      err,
    );
  }
});

// -----------------------МИДДЛВЕИРЫ---------------------------------

bot.use(session()); // подключаем мидлвеир, который умеет работать с сессиями

// прописываем мидлвеир, который будет добавлять в контекст общения текущее время, для того чтобы бот постоянно знал какая сегодня дата. А так же проверяем наличие контекста - если его нет, инициируем
bot.use(async (ctx, next) => {
  try {
    const currentDate = new Date(); // получаем текущую дату и время

    if (!ctx.session) {
      // Проверяем существует ли объект ctx.session
      ctx.session = {};
    }
    ctx.session.currentDate = currentDate; // сохраняем дату и время в сессионное хранилище
    ctx.session.messages ??= JSON.parse(JSON.stringify(INIT_SESSION)); // инициируем новый контекст, если его не было
    // ctx.session.messages = ctx.session.messages || JSON.parse(JSON.stringify(INIT_SESSION));

    ctx.session.messages.push({
      role: roles.SYSTEM,
      content: `Системное время: ${currentDate}`,
    });
    console.log(ctx.session);

    // console.time(`Processing update ${ctx.update.update_id}`); - запуск счетчика времени выполнения процессов

    await next(); // передаем управление следующему обработчику

    // console.timeEnd(`Processing update ${ctx.update.update_id}`); // завершение счётчика и показ времени выполнения всех мидлвеиров
  } catch (err) {
    await commandList.rebootBot(
      ctx,
      'ошибка MW добавления системного времени в контекст разговора: ',
      err,
    );
    await next();
  }
});

// обработка того, задан ли вопрос пользователю по поводу описания картинки
bot.use(async (ctx, next) => {
  try {
    if (ctx?.session?.askImageDiscription === true) {
      console.log(
        'обработка запроса описания картинки',
        ctx.session.askImageDiscription,
      );

      await ctx.replyWithHTML(
        `Картинка по вашему запросу: <b>"${ctx.message.text}"</b> - создается, подождите немного... `,
      );

      const url = await openAi.image(ctx.message.text);

      if (url === 'ошибка') {
        await ctx.reply(ERROR_MESSAGES.timeOutImage);
        ctx.session.askImageDiscription = false;

        return;
      }

      await ctx.replyWithPhoto(Input.fromURL(url)); // используем специальный объект Input для того чтобы не было проблем с загрузкой картинки по url
    }
    await next();
  } catch (err) {
    await commandList.rebootBot(
      ctx,
      'ошибка MW обработки вопроса об описании текста картинки: ',
      err,
    );
    await next();
  }
});

// обработка того, задан ли вопрос пользователю по поводу записи текста
bot.use(async (ctx, next) => {
  try {
    if (ctx?.session?.askRecordText === true) {
      const { text } = ctx.message;
      const [themeWithSigns, ...rest] = text.split(' ');

      const pattern = /[A-Za-zА-Яа-яЁё0-9]+/g; // убираем лишние знаки из строки запроса

      const theme = themeWithSigns.match(pattern) !== null ? themeWithSigns.match(pattern)[0].toLowerCase() : 'default';

      const data = rest.join(' ');
      const user = ctx.message.from.last_name;
      const time = ctx.session.currentDate;

      await ctx.replyWithHTML(
        `Ваш текст : <b>"${data}"</b> - сохранен в папке <b>"${theme}"</b>.`,
      );

      files.writeRecord(user, time, theme, data);
    }
    await next();
  } catch (err) {
    await commandList.rebootBot(
      ctx,
      'ошибка MW обработки вопроса о создании записи: ',
      err,
    );
    await next();
  }
});

// обработка того, задан ли вопрос пользователю по поводу дополнения текста
bot.use(async (ctx, next) => {
  try {
    if (ctx?.session?.createTextCompletion === true) {
      const userText = ctx?.update?.message?.text || 'no text';

      if (!ctx?.update?.message?.text) {
        ctx.reply('Вы должны были ввести какой-либо текст, в следущий раз будьте чуть внимательнее!');
        ctx.session.createTextCompletion = false;
        return;
      }

      ctx.replyWithHTML(`создаётся продолжение вашего текста <b> ${userText} </b>`);
      const response = await openAi.completion(userText);

      if (response === 'ошибка') {
        await ctx.reply('Вылет по таймауту. Повторите свой запрос позже');

        await next();
        return;
      }

      // eslint-disable-next-line
      const responseText = response?.choices[0]?.text || 'По какой то причине текст не был сформирован';

      await ctx.reply(responseText);
      console.log(responseText);
    }
    await next();
  } catch (err) {
    await commandList.rebootBot(
      ctx,
      'ошибка MW обработки дополнения текста ',
      err,
    );
    await next();
  }
});

// -------------------------СТАРТ БОТА--------------------------

bot.start(async (ctx) => {
  try {
    // ctx.session.messages ??= JSON.parse(JSON.stringify(INIT_SESSION));
    ctx.session.messages = ctx.session.messages || JSON.parse(JSON.stringify(INIT_SESSION));
    ctx.session.messages = JSON.parse(JSON.stringify(INIT_SESSION));
    await ctx.reply(
      'Добро пожаловать в наш бот! Введите /help чтобы узнать подробнее о его возможностях.',
    );
  } catch (err) {
    await commandList.rebootBot(ctx, 'ошибка при старте бота: ', err);
  }
});

// ----------------------ЗАПУСК КОМАНД----------------------------

// bot.command - позволяет обрабатывать комманды в чате, например тут будет обрабатываться комманда '/new'. В данном случае мы обнуляем контекст сессии для того чтобы общаться с ботом заново
bot.command(`${botCommands.new}`, async (ctx) => {
  commandList.newSession(ctx);

  // ctx.session = {...INIT_SESSION}; // так не работает, поверхностное клонирование
  // ctx.session = Object.assign({}, INIT_SESSION) // поверхностное клонирование,  нам не подходит так как там вложенные объекты
  // ctx.session = structuredClone(INIT_SESSION); // стандартная функция в ноде версии 17+. Так как у нас 16, нельзя использовать
  // ctx.session = cloneDeep(INIT_SESSION); // лодэш как то странно работает с нодой
  // console.log(ctx.session.messages)

  // так в итоге работает
  // ctx.session = JSON.parse(JSON.stringify(INIT_SESSION))
  // await ctx.reply('Начало новой сессии. Жду вашего голосового или текстового сообщения. Чтобы начать новую сессию введите /new в чате!!!!')
});

bot.command(`${botCommands.record}`, async (ctx) => {
  commandList.createRecord(ctx);
});

bot.command(botCommands.sendRecords, async (ctx) => {
  commandList.sendRecords(ctx);
});

bot.command(botCommands.removeRecords, async (ctx) => {
  commandList.removeRecords(ctx);
});

bot.command(`${botCommands.contextMax}`, async (ctx) => {
  commandList.contentMax(ctx);
});

bot.command(`${botCommands.contextProg}`, async (ctx) => {
  commandList.contentProg(ctx);
});

bot.command(`${botCommands.contextBot}`, async (ctx) => {
  commandList.contentBot(ctx);
});

bot.command(`${botCommands.reboot}`, async (ctx) => {
  await commandList.rebootBot(
    ctx,
    'Перезагрузка бота по запросу пользователя: ',
  );
});

bot.command(`${botCommands.image}`, (ctx) => {
  commandList.createImage(ctx);
});

bot.command(`${botCommands.weather}`, (ctx) => {
  weatherRequest(ctx);
});

bot.command('g', async (ctx) => {
  try {
    ctx.reply('скачиваем контекст из гитхаба');

    const owner = 'fess986';
    const repo = 'aibot-telegram';
    const url = `https://api.github.com/repos/${owner}/${repo}/tarball`;

    axios
      .get(url, {
        responseType: 'stream',
        headers: {
          accept: 'application/vnd.github.v3+json',
          authorization: 'Bearer [token]',
        },
      })
      .then((response) => {
        response.data.pipe(fs.createWriteStream(`./${repo}.tar.gz`));
      });
  } catch (err) {
    await commandList.rebootBot(
      ctx,
      'ошибка скачивания проекта с гитхаба: ',
      err,
    );
  }
});

// --------------------------- AI-ТЕКСТ --------------------------
// учим бота общаться через текст
bot.on(message('text'), async (ctx) => {
  if (ctx?.session?.createTextFromVoice === true) {
    console.log('Попытка печатать текст при запросе голосового сообщения');
    ctx.reply(
      'Вы попытались напечатать текст, а ожидалось голосовое сообщение. Вы плохо поступили! Ожидание голосового сообщения завершено, текст проигнорирован!',
    );
    ctx.session.createTextFromVoice = false;
    return;
  }

  if (
    ctx?.session?.askImageDiscription === true || ctx?.session?.askRecordText === true || ctx?.session?.createTextCompletion === true
  ) {
    ctx.session.askImageDiscription = false;
    ctx.session.askRecordText = false;
    ctx.session.createTextCompletion = false;
    return;
  }

  try {
    await ctx.reply(code('Текстовое сообщение принято, обрабатывается...'));

    const textLoader = new Loader(ctx);

    ctx.session.messages ??= JSON.parse(JSON.stringify(INIT_SESSION));
    ctx.session.messages.push({ role: roles.USER, content: ctx.message.text });
    console.log(ctx.message.text);

    textLoader.show();

    const response = await openAi.chat(ctx.session.messages);

    // проверяем, прошел ли запрос по таймайту, если нет - пишем сообщение пользователю и ничего не делаем
    if (typeof response === 'string') {
      console.log('ошибка таймаута ...................................');
      console.log('ошибочный запрос: ', ctx.message.text);

      ctx.session.messages.pop(); // удалим наш запрос, который вызвал ошибку
      await ctx.reply(ERROR_MESSAGES.timeOutChat);
      return;
    }

    console.log(
      'текст обработан аи...................................................',
    );

    if (!response) {
      await ctx.reply(ERROR_MESSAGES.noResponse);
      console.log('ошибка ответа chatGPT');
      return;
    }

    ctx.session.messages ??= JSON.parse(JSON.stringify(INIT_SESSION));
    ctx.session.messages.push({
      role: roles.ASSISTANT,
      content: response.content,
    });

    textLoader.hide();

    await ctx.reply(response.content);

    console.log(response.content);
  } catch (err) {
    if (err) {
      await commandList.rebootBot(
        ctx,
        'Ошибка работы с текстовым чатом аи, текст ошибки: ',
        err,
      );
    } else {
      await commandList.rebootBot(
        ctx,
        'Ошибка работы с текстовым чатом аи, скорее всего где то в openAi.chat: ',
      );
    }
  }
});

// ------------------------------------ ГОЛОС ---------------------------

// проверка голосового сообщения - является ли оно запросом к АИ или это голосовая команда боту
const checkVoice = async (ctx, text) => {
  if (!text) {
    await ctx.replyWithHTML(ERROR_MESSAGES.noResponse);
    console.log('ошибка ответа chatGPT');
    return true;
  }

  const splitedText = text.split(' ');
  const [firstWord, secondWord, thirdWord, forthWord, ...rest] = splitedText;

  // проверим, ожидается ли печать текста
  if (ctx?.session?.createTextFromVoice === true) {
    await ctx.replyWithHTML('<b>Ваш текст:</b>');
    await ctx.reply(`${text}`);

    ctx.session.createTextFromVoice ??= false; // если в настройках линтера мы прописываем стандарт ECMAScript 2021, то такая конструкция начинает работать, иначе пишем как внизу указано
    // ctx.session.createTextFromVoice = ctx.session.createTextFromVoice || false;
    ctx.session.createTextFromVoice = false;
    return true;
  }

  // await ctx.reply(`<b>${firstWord}</b>`, { parse_mode: "HTML" }); // если хотим форматированный текст в ответе бота. При этом не все теги можно использовать, например h1 будет выдавать ошибку

  // добавление контекста
  if (firstWord.toLowerCase().startsWith('контекст')) {
    if (secondWord) {
      if (secondWord.toLowerCase().startsWith('макс')) {
        commandList.contentMax(ctx);
        return true;
      }

      if (secondWord.toLowerCase().startsWith('нов')) {
        commandList.newSession(ctx);
        return true;
      }
    }
  }

  // "Голосовой набор ..."
  if (firstWord.toLowerCase().startsWith('голос')) {
    if (secondWord) {
      if (secondWord.toLowerCase().startsWith('набор')) {
        await ctx.replyWithHTML('<b>Ваш текст:</b>');
        await ctx.reply(`${thirdWord} ${forthWord} ${rest.join(' ')}`);
        return true;
      }
    }
  }

  // погода
  if (firstWord.toLowerCase().startsWith('погода')) {
    if (secondWord) {
      return false;
    }

    weatherRequest(ctx);
    return true;
  }

  // запись сообщения в папку records, который вызывается из голосового сообщения, которое начинается с фразы "запись на тему ...".
  if (firstWord.toLowerCase().startsWith('запис')) {
    const pattern = /[A-Za-zА-Яа-яЁё0-9]+/g; // убираем лишние знаки из строки запроса
    const theme = forthWord.match(pattern) !== null ? forthWord.match(pattern)[0].toLowerCase() : 'default';
    const user = ctx.message.from.last_name;
    const time = ctx.session.currentDate;

    files.writeRecord(user, time, theme, text);

    ctx.reply(`Ваша запись <b>${text}</b> сохранена в папку <b>${theme}</b>`, {
      parse_mode: 'HTML',
    });

    return true;
  }

  // если ни одна проверка не сработала, возвращаем false для дальнейшей передачи сообщения АИ
  return false;
};

bot.on(message('voice'), async (ctx) => {
  try {
    await ctx.reply(code('Голосовое сообщение принято, обрабатывается...'));

    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id); // получаем от телеграмбота ссылку на нашу голосовую запись с расширением .ogg
    const userId = String(ctx.message.from.id);
    const oggPath = await ogg.create(link.href, userId); // создаем наше сообщение в папке voices и  по итогу возвращаем в переменную oggPath - путь до файла. Обязательно прописываем await , так как нам нужно дождаться выполнения асинхронной операции

    const mp3Path = await ogg.toMp3(oggPath, userId); // трансформируем .ogg файл в .mp3 и удаляем первый. После этого получаем путь к этому mp3-файлу

    // будем подсовывать этот путь созданного длинного сообщения для тестов

    // работаем с аи
    const text = await openAi.transcription(mp3Path);

    await ctx.replyWithHTML(`Ваш запрос таков: <b> ${text} </b>`);

    // для тестов отключим дальнейшие телодвижения ------------------------

    // запускаем проверку голосового сообщения и если какая из них сработала, не будем передавать его в AI

    if (text === 'ошибка') {
      console.log('ошибка превышения таймаута на перевод голоса в текст');
      await ctx.reply(ERROR_MESSAGES.timeOutVoice);

      return;
    }

    // проверяем, является ли голосовое сообщение какой-либо стандартной командой для бота или же это обращение к AI.
    const isCheckPass = await checkVoice(ctx, text);

    if (isCheckPass) {
      return;
    }

    // const voiceAnswerLoader = new Loader(ctx);
    // voiceAnswerLoader.show();

    // const messages = [{role: openAi.roles.USER, content: text}] // передавать будем не только само сообщенеие но и роль и прочий контекст - так мы делаем если не сохраняем контент а сразу кидаем в мессаджи
    ctx.session.messages ??= JSON.parse(JSON.stringify(INIT_SESSION));
    ctx.session.messages.push({ role: roles.USER, content: text });

    const response = await openAi.chat(ctx.session.messages);

    if (!response) {
      await ctx.reply(ERROR_MESSAGES.noResponse);
      console.log('ошибка ответа chatGPT');
      return;
    }

    // после того как получаем ответ от аи - добавляем его в наш объект с сессией с пометкой ассистент
    ctx.session.messages ??= JSON.parse(JSON.stringify(INIT_SESSION));
    ctx.session.messages.push({
      role: roles.ASSISTANT, // помечаем что этот контент пришел именно от самого бота
      content: response.content,
    });

    // voiceAnswerLoader.hide();

    // выводим ответ аи в боте
    await ctx.reply(response.content);

    // throw new Error("500 Internal Server Error");

    // await ctx.reply(JSON.stringify(link, null, 2)); // парсим джейсон

    // console.log(link); // тут мы понимаем, что стринглифай немного неправильно приводит объект к строке. на самом деле это действительно полноценный объект с полем href которое нас будет интересовать в дальнейшем
    // console.log(link.href); // именно эта ссылка нам будет нужна
  } catch (err) {
    if (err) {
      await commandList.rebootBot(
        ctx,
        'Ошибка работы с голосовым чатом аи, текст ошибки: ',
        err,
      );
    } else {
      await commandList.rebootBot(
        ctx,
        'Ошибка работы с голосовым чатом аи, вероятно в openAi-модуле: ',
      );
    }
  }
});

bot.launch();

// global.process

// nodemon({ script: bot.launch(), exitcrash: true }); // перезапуск через nodemon. Работает криво

// прерывания нужны для адекватного "мягкого" завершения работы бота при получении от системы или пользователя соответствующих запросов. process.once - обрабатывает эти запросы, а коллбэк завершает работу бота () => bot.stop('SIGINT')
process.once('SIGINT', () => bot.stop('SIGINT')); // остановка бота по условию Signal Interrupt - прерыванию процесса, например пользователем ctrl+c.
process.once('SIGTERM', () => bot.stop('SIGTERM')); // (Signal Terminate) остановка бота по завершению работы, например от системы
