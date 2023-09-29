import fs from 'fs';
import { Markup } from 'telegraf'; // для работы с ботом телеграмма
import { message } from 'telegraf/filters'; // помогает работать с текстом/голосом телеграмма
import { code } from 'telegraf/format'; // специальная фишка, которая меняет формат сообщения. Нам нужна, чтобы системные сообщения отличались
import config from 'config'; // для того чтобы можно было считывать настройки приложения из папки конфига]
import axios from 'axios';

import { ogg } from './utils/oggToMp3.js';
import { openAi } from './API/openai.js';
import { files } from './utils/files.js';
import { Loader } from './loader/loader.js';
import { commandList } from './commandList.js';
import { bot } from './bot.js';

import {
  roles,
  INIT_SESSION,
} from './const/context.js';

import { ERROR_MESSAGES, botCommands } from './const/const.js';

console.log(config.get('TEST')); // видимо конфиг умеет понимать по строке cross-env NODE_ENV=development пакаджа, из какого файла брать ключи - из дефолта или продакшена

// bot.use(session());

// Обработка полученной локации и вывод текущей погоды на экран
bot.on('location', async (ctx) => {
  commandList.weatherLocation(ctx);
});

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
      commandList.weatherRequest(ctx1);
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
      await commandList.sendRecords(ctx1, bot);
    });

    bot.action('removeRecords', async (ctx1) => {
      await ctx1.answerCbQuery();
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

// ----------------------ЗАПУСК КОМАНД----------------------------

// bot.command - позволяет обрабатывать комманды в чате, например тут будет обрабатываться комманда '/new'. В данном случае мы обнуляем контекст сессии для того чтобы общаться с ботом заново
bot.command(`${botCommands.new}`, async (ctx) => {
  console.log(ctx);
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
  commandList.sendRecords(ctx, bot);
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
  commandList.weatherRequest(ctx);
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

bot.command(`${botCommands.createNotionRecord}`, async (ctx) => {
  await commandList.createNotionRecordCommand(ctx);
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

    commandList.weatherRequest(ctx);
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

    const voiceAnswerLoader = new Loader(ctx);
    voiceAnswerLoader.show();

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

    voiceAnswerLoader.hide();

    // выводим ответ аи в боте
    await ctx.reply(response.content);

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

// global.process

// nodemon({ script: bot.launch(), exitcrash: true }); // перезапуск через nodemon. Работает криво

// прерывания нужны для адекватного "мягкого" завершения работы бота при получении от системы или пользователя соответствующих запросов. process.once - обрабатывает эти запросы, а коллбэк завершает работу бота () => bot.stop('SIGINT')
process.once('SIGINT', () => bot.stop('SIGINT')); // остановка бота по условию Signal Interrupt - прерыванию процесса, например пользователем ctrl+c.
process.once('SIGTERM', () => bot.stop('SIGTERM')); // (Signal Terminate) остановка бота по завершению работы, например от системы
