import { Input, session } from 'telegraf';

import { INIT_SESSION, roles } from './const/context.js';
import { commandList } from './commandList.js';
import { openAi } from './API/openai.js';
import { ERROR_MESSAGES } from './const/const.js';
import { accessIsAllowed } from './utils/utils.js';

// прописываем мидлвеир, который будет добавлять в контекст общения текущее время, для того чтобы бот постоянно знал какая сегодня дата. А так же проверяем наличие контекста - если его нет, инициируем

export const startMW = (bot) => {
  bot.use(session()); // подключаем мидлвеир, который умеет работать с сессиями

  bot.use(async (ctx, next) => {
    try {
      // письмо пользователю МАРТ
      // if (ctx?.message?.from?.id === 6083583477) {
      //   await ctx.reply('Здравствуйте, Март, это программист данного бота - Карпов Максим! ');
      //   await ctx.reply('Эту запись добавил специально для Вас!');
      //   await ctx.reply('Дело в том, что этот бот изначально создавался для меня и моих знакомых, а сейчас я начал замечать, что он используется большим количеством людей, что совсем не планировалось. Поэтому в ближайшее время я планирую включить ограничение доступа. Если вы меня знаете, или просто хотели бы продолжить использовать бота, напишите мне в телегу или вацап, мой номер 8-906-598-71-86. Вы вроде тоже занимаетесь программированием, поэтому просто так не хочу вас удалять ');
      // }

      console.log(`Пользователь в разрешенном списке? - ${accessIsAllowed(ctx?.message?.from?.id)}`);
      // accessIsAllowed(ctx?.message?.from?.id);

      if (accessIsAllowed(ctx?.message?.from?.id)) {
        await next();
      } else {
        ctx.reply('до конца года использование данного бота ограничено администрацией для большинства пользователей. Скорее всего он будет разблокирован в начале 2024 года. Если вам выдали личное разрешение на использование, свяжитесь с Карповым Максимом');
      }
    } catch (err) {
      await commandList.rebootBot(
        ctx,
        'ошибка MW ограничения бот-листа: ',
        err,
      );
      await next();
    }
  });

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
      // console.log(ctx.session);

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
        await commandList.createRecord(ctx, 'button');
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

  // обработка того, задан ли вопрос пользователю по поводу записи текста в notion
  bot.use(async (ctx, next) => {
    try {
      if (ctx?.session?.askNotionRecord === true) {
        await commandList.createNotionRecordCommand(ctx, 'button');
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

  // обработка того, задан ли вопрос пользователю по поводу записи текста в notion TODO List
  bot.use(async (ctx, next) => {
    try {
      if (ctx?.session?.askNotionTODO === true) {
        await commandList.createNotionRecordCommand(ctx, 'button', 'todo');
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
};
