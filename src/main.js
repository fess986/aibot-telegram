import { message } from 'telegraf/filters'; // помогает работать с текстом/голосом телеграмма
import { code } from 'telegraf/format'; // специальная фишка, которая меняет формат сообщения. Нам нужна, чтобы системные сообщения отличались
import config from 'config'; // для того чтобы можно было считывать настройки приложения из папки конфига]

import { ogg } from './utils/oggToMp3.js';
import { fromWho, getUserId } from './utils/utils.js';
import { checkLength, checkVoice } from './utils/checks.js';
import { openAi } from './API/openai.js';
import { commandList } from './commandList.js';
import { bot } from './bot.js';
import { contextButtons } from './buttons/contextButtons.js';
import { bonusButtons } from './buttons/bonusButtons.js';
import { recordButtons } from './buttons/recordButtons.js';
import { notionButtons } from './buttons/notionButtons.js';

import stateManagerModel from './statemanagers/model/stateManager.js';
import stateManagerApp from './statemanagers/application/stateManager.js';

import {
  roles,
  INIT_SESSION,
} from './const/context.js';

import {
  ERROR_MESSAGES, botCommands, settingsMessage, changeIdConst, stateApplication,
} from './const/const.js';

console.log(config.get('TEST')); // видимо конфиг умеет понимать по строке cross-env NODE_ENV=development пакаджа, из какого файла брать ключи - из дефолта или продакшена

/// ----------------------------- КНОПКИ -----------------------
// тестируем работу с кнопками. Для того чтобы всё выполнялось по порядку, делаем функцию асинхронной и потом при помощи await ожидаем выполнение очередной задачи. При этом не забываем трай-кэтч при любой асинхронщине, чтобы не крашить бота при асинхронной ошибке
bot.command(botCommands.contextButtons, async (ctx) => {
  await contextButtons(ctx);
});

bot.command(botCommands.notionButtons, async (ctx) => {
  await notionButtons(ctx);
});

bot.command(botCommands.bonusButtons, async (ctx) => {
  await bonusButtons(ctx);
});

bot.command(botCommands.recordButtons, async (ctx) => {
  await recordButtons(ctx);
});

// ----------------------ЗАПУСК КОМАНД----------------------------

/// ///////// команды работы со стейтами модели ////////////
// устанавливаем модель gpt3.5
bot.command(botCommands.setGPT3, async (ctx) => {
  await commandList.setGPT3(ctx);
});

// устанавливаем модель gpt4о
bot.command(botCommands.setGPT4, async (ctx) => {
  await commandList.setGPT4(ctx);
});

// получаем текущие данные модели
bot.command(botCommands.getStateGPT, async (ctx) => {
  await commandList.getStateGPT(ctx);
});

// устанавливаем температуру по шаблону /settemp 0.5
bot.command(botCommands.setGptTemp, async (ctx) => {
  await commandList.setGptTemp(ctx);
});

bot.command(botCommands.getSettings, async (ctx) => {
  await ctx.reply(settingsMessage);
});

/// //////////// работа с контекстом ///////////////////////
bot.command(botCommands.new, async (ctx) => {
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

bot.command(`${botCommands.reboot}`, async (ctx) => {
  await commandList.rebootBot(
    ctx,
    'Перезагрузка бота по запросу пользователя: ',
  );
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

bot.command(`${botCommands.contextDevOps}`, async (ctx) => {
  commandList.contextDevOps(ctx);
});

/// ///// команды работы с записями в файлы ////////////////////////
bot.command(botCommands.record, async (ctx) => {
  commandList.createRecord(ctx);
});

bot.command(botCommands.sendRecords, async (ctx) => {
  commandList.sendRecords(ctx, bot);
});

bot.command(botCommands.removeRecords, async (ctx) => {
  commandList.removeRecords(ctx);
});

/// // работа с notion ///////////////
bot.command(`${botCommands.createNotionRecord}`, async (ctx) => {
  await commandList.createNotionRecordCommand(ctx);
});

bot.command(`${botCommands.createNotionTODO}`, async (ctx) => {
  await commandList.createNotionRecordCommand(ctx, 'default', 'todo');
});

bot.command(botCommands.getNotionRecords, async (ctx) => {
  await commandList.getNotionNotes(ctx);
});

bot.command(`${botCommands.getNotionTODO}`, async (ctx) => {
  await commandList.getNotionTODO(ctx);
});

bot.command(`${botCommands.getNotionReminders}`, async (ctx) => {
  await commandList.getNotionReminders(ctx);
});

/// //////  другие задачи ///////////////////
bot.command(`${botCommands.image}`, (ctx) => {
  commandList.createImage(ctx);
});

bot.command(`${botCommands.weather}`, (ctx) => {
  commandList.weatherRequest(ctx);
});

/// //// работа с гитхабом //////////
// bot.command('g', async (ctx) => {
//   try {
//     ctx.reply('скачиваем контекст из гитхаба');

//     const owner = 'fess986';
//     const repo = 'aibot-telegram';
//     const url = `https://api.github.com/repos/${owner}/${repo}/tarball`;

//     axios
//       .get(url, {
//         responseType: 'stream',
//         headers: {
//           accept: 'application/vnd.github.v3+json',
//           authorization: 'Bearer [token]',
//         },
//       })
//       .then((response) => {
//         response.data.pipe(fs.createWriteStream(`./${repo}.tar.gz`));
//       });
//   } catch (err) {
//     await commandList.rebootBot(
//       ctx,
//       'ошибка скачивания проекта с гитхаба: ',
//       err,
//     );
//   }
// });

// Команда для включения режима смены ID
bot.command(botCommands.changeToAltId, (ctx) => {
  changeIdConst.isChanged = true;
  ctx.reply('Режим смены ID включен.');
});

// Команда для отключения режима смены ID
bot.command(botCommands.restoreId, (ctx) => {
  changeIdConst.isChanged = false;
  ctx.reply('Режим смены ID отключен.');
});

// --------------------------- AI-ТЕКСТ --------------------------
// общение бота через текст
bot.on(message('text'), async (ctx) => {
  if (ctx?.session?.createTextFromVoice === true) {
    console.log('Попытка печатать текст при запросе голосового сообщения');
    ctx.reply(
      'Вы попытались напечатать текст, а ожидалось голосовое сообщение. Вы плохо поступили! Ожидание голосового сообщения завершено, текст проигнорирован!',
    );
    ctx.session.createTextFromVoice = false;
    return;
  }

  const userId = getUserId(ctx);
  if (!userId) {
    console.log('ошибка userId');
    return;
  }

  // выполняем проверку - если стейт приложения не дефолтный, то сбрасываем его на дефолт и ничего больше не делаем
  if (stateManagerApp.getState(userId) !== stateApplication.default) {
    stateManagerApp.resetState(userId);
    return;
  }

  if (
    // askNotionTODO
    // askRecordText
    // askImageDiscription
    // createTextCompletion

    ctx?.session?.askImageDiscription === true || ctx?.session?.askRecordText === true || ctx?.session?.createTextCompletion === true || ctx?.session?.askNotionRecord === true || ctx?.session?.askNotionTODO === true
  ) {
    ctx.session.askImageDiscription = false;
    ctx.session.askRecordText = false;
    ctx.session.createTextCompletion = false;
    ctx.session.askNotionRecord = false;
    ctx.session.askNotionTODO = false;
    return;
  }

  try {
    const firstLetter = ctx?.message?.text?.charAt(0);
    if (firstLetter === '/') {
      await ctx.reply('такой команды не существует, просмотр всех доступных команд - /help');
      return;
    }

    ctx.session.sessionLength = ctx.session.sessionLength + 1 || 1;
    // const textLoader = new Loader(ctx);

    ctx.session.messages ??= JSON.parse(JSON.stringify(INIT_SESSION));
    ctx.session.messages.push({ role: roles.USER, content: ctx.message.text });
    // console.log(ctx.message.text);
    console.log(`................Вопрос пользователя ................ : \n ${ctx.message.text}`);
    console.log(`from ${ctx?.message?.from?.first_name} ${ctx?.message?.from?.last_name}, id = ${ctx?.message?.from?.id}`);
    console.log('сообщение от пользователя - ', fromWho(ctx?.message?.from?.id));
    console.log('текущая длинна сессии - ', ctx.session.sessionLength);

    // проверяем длинну сессии
    if (await checkLength(ctx, ctx.session.sessionLength)) {
      console.log('Принудительная перезагрузка бота из за большой длинны сессии');
      return;
    }

    await ctx.reply(code('Текстовое сообщение принято, обрабатывается...'));

    // textLoader.show();

    const state = stateManagerModel.getState(userId);

    console.log('Получаем стейт пользователя - ', state);
    console.log('id пользователя - ', userId);

    const response = await openAi.chat(ctx.session.messages, state);
    // const response = await openAi.chat([{ role: 'user', content: 'Say this is a test' }]);

    // проверяем, прошел ли запрос по таймайту, если нет - пишем сообщение пользователю и ничего не делаем
    if (typeof response === 'string') {
      console.log('ошибка таймаута ...................................');
      console.log('ошибочный запрос: ', ctx.message.text);

      ctx.session.messages.pop(); // удалим наш запрос, который вызвал ошибку
      await ctx.reply(ERROR_MESSAGES.timeOutChat);
      return;
    }

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

    // textLoader.hide();

    await ctx.reply(response.content);
    console.log(`................Ответ полученный от AI................ : \n ${response.content}`);
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
    if (await checkVoice(ctx, text)) {
      return;
    }

    ctx.session.sessionLength = ctx.session.sessionLength + 1 || 1;

    // проверяем длинну сессии
    if (await checkLength(ctx, ctx.session.sessionLength)) {
      console.log('Принудительная перезагрузка бота из за большой длинны сессии');
      return;
    }

    // const voiceAnswerLoader = new Loader(ctx);
    // voiceAnswerLoader.show();

    // const messages = [{role: openAi.roles.USER, content: text}] // передавать будем не только само сообщенеие но и роль и прочий контекст - так мы делаем если не сохраняем контент а сразу кидаем в мессаджи
    ctx.session.messages ??= JSON.parse(JSON.stringify(INIT_SESSION));
    ctx.session.messages.push({ role: roles.USER, content: text });

    console.log(`................Голосовой вопрос пользователя ................ : \n ${text}`);
    console.log(`from ${ctx?.message?.from?.first_name} ${ctx?.message?.from?.last_name}, id = ${ctx?.message?.from?.id}`);
    console.log('сообщение от пользователя - ', fromWho(ctx?.message?.from?.id));
    console.log('текущая длинна сессии - ', ctx.session.sessionLength);

    const userIdVoise = ctx?.message?.from?.id ?? ctx?.update?.callback_query?.from?.id;
    if (!userIdVoise) {
      console.log('ошибка userId');
      return;
    }

    const state = stateManagerModel.getState(userIdVoise);

    console.log('Получаем стейт пользователя - ', state);
    console.log('id пользователя - ', userIdVoise);

    const response = await openAi.chat(ctx.session.messages, state);

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
    console.log(`................Голосовой ответ полученный от AI................ : \n ${response.content}`);
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

// bot.on(message('text'), async (ctx) => {
//   ctx.session.sessionLength = ctx.session.sessionLength + 1 || 1;

//   ctx.session.messages ??= JSON.parse(JSON.stringify(INIT_SESSION));
//   ctx.session.messages.push({ role: roles.USER, content: ctx.message.text });
//   // console.log(ctx.message.text);

//   const userId = ctx?.message?.from?.id ?? ctx?.update?.callback_query?.from?.id;
//   if (!userId) {
//     console.log('ошибка userId');
//     return;
//   }

//   const response = await openAi.chat(ctx.session.messages, state);

//   ctx.session.messages ??= JSON.parse(JSON.stringify(INIT_SESSION));
//   ctx.session.messages.push({
//     role: roles.ASSISTANT,
//     content: response.content,
//   });

//   await ctx.reply(response.content);
// });
