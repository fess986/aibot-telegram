import { existsSync } from 'fs';
import path from 'path';
import config from 'config';
import axios from 'axios';
import { Telegraf } from 'telegraf'; // для работы с ботом телеграмма

import { files } from './utils/files.js';
import removeFile, { deleteFolderRecursive } from './utils/utils.js';

import { createNotionRecord } from './API/notion.js';

import {
  INIT_SESSION,
  CONTEXT_MAX,
  CONTEXT_PROGRAMMER,
  CONTEXT_CHAT_BOT,
} from './const/context.js';

export const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

export const commandList = {
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

  weatherRequest(ctx) {
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
  },

  async weatherLocation(ctx) {
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
  async createRecord(ctx, mode = 'default') {
    try {
      // await writeRecord(ctx);
      const { text } = ctx.message;

      let themeWithSigns;
      let rest;

      switch (mode) {
        case 'default':
          [, themeWithSigns, ...rest] = text.split(' ');
          break;

        case 'button':
          [themeWithSigns, ...rest] = text.split(' ');
          break;

        default:
          [, themeWithSigns, ...rest] = text.split(' ');
      }

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

      const archiveFilePath = path.join(recordsPath, '../', `${user}.zip`);
      console.log(archiveFilePath);
      if (existsSync(archiveFilePath)) {
        removeFile(archiveFilePath);
        console.log('есть такое дело');
      }

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

  // создание записи в ноушн
  async createNotionRecordCommand(ctx) {
    try {
      const { text } = ctx.message;

      const [, ...rest] = text.split(' ');

      if (rest.length === 0) {
        await ctx.reply('Пустой запрос, повторите еще раз');
        return;
      }

      const data = rest.join(' ');
      const response = await createNotionRecord(data);
      await ctx.reply(`Создана новая запись в notion. Ссылка на неё: ${response.url}`);
    } catch (err) {
      console.log('ошибка добавление записи в ноушен', err.message);
    }
  },
};
