import { existsSync } from 'fs';
import path from 'path';
import config from 'config';
import axios from 'axios';
import logger from './API/logger.js';

import { files } from './utils/files.js';
import removeFile, {
  deleteFolderRecursive,
  fromWho,
  getUserId,
} from './utils/utils.js';
import stateManagerModel from './statemanagers/model/stateManager.js';
import stateManagerApp from './statemanagers/application/stateManager.js';

import { createNotionRecord, queryNote } from './API/notionNote.js';
import { createNotionTODO, queryTODO } from './API/notionTODO.js';
import { getNotionReminders } from './API/notionReminders.js';
import { setModel, setTemperature } from './statemanagers/model/actions.js';

import { MODELS, stateApplication } from './const/const.js';
import {
  INIT_SESSION,
  CONTEXT_MAX,
  CONTEXT_PROGRAMMER,
  CONTEXT_CHAT_BOT,
  CONTEXT_DEVOPS,
} from './const/context.js';

export const commandList = {
  async newSession(ctx) {
    try {
      // console.log('..............Обнуление сессии...............');
      // console.log(
      //   `from ${ctx?.from?.first_name} ${ctx?.from?.last_name}, id = ${ctx?.from?.id}`,
      // );
      // console.log('обнуление произвел - ', fromWho(ctx?.from?.id), '\n \n');

      logger.info('..............Обнуление сессии...............');
      logger.info(`from ${ctx?.from?.first_name} ${ctx?.from?.last_name}, id = ${ctx?.from?.id}`);
      logger.info(`обнуление произвел - ${fromWho(ctx?.from?.id)} \n \n`);

      ctx.session.messages ??= JSON.parse(JSON.stringify(INIT_SESSION));
      // ctx.session.messages = ctx.session.messages || JSON.parse(JSON.stringify(INIT_SESSION));
      ctx.session.messages = JSON.parse(JSON.stringify(INIT_SESSION));

      ctx.session.sessionLength = ctx.session.sessionLength || 0;
      ctx.session.sessionLength = 0;

      const userId = getUserId(ctx);
      if (!userId) {
        // console.log('ошибка userId');
        logger.error('ошибка userId');
        return;
      }
      stateManagerApp.resetState(userId); // устанавливаем состояние приложение в дефолтное

      await ctx.reply(
        'Начало новой сессии. Жду вашего голосового или текстового сообщения. Чтобы начать новую сессию введите /new в чате!!!!',
      );

      // ctx.session = {...INIT_SESSION}; // так не работает, поверхностное клонирование
      // ctx.session = Object.assign({}, INIT_SESSION) // поверхностное клонирование,  нам не подходит так как там вложенные объекты
      // ctx.session = structuredClone(INIT_SESSION); // стандартная функция в ноде версии 17+. Так как у нас 16, нельзя использовать
      // ctx.session = cloneDeep(INIT_SESSION); // лодэш как то странно работает с нодой
      // console.log(ctx.session.messages)

      // так в итоге работает
      // ctx.session = JSON.parse(JSON.stringify(INIT_SESSION))
      // await ctx.reply('Начало новой сессии. Жду вашего голосового или текстового сообщения. Чтобы начать новую сессию введите /new в чате!!!!')
    } catch (err) {
      // console.log('Ошибка обнуления сессии', err.message);
      logger.error('Ошибка обнуления сессии', err.message);

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

  async changeId(ctx) {
    if (!ctx.session.changeId || ctx?.session?.changeId === false) {
      ctx.session.changeId = true;
    } else {
      ctx.session.changeId = false;
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

  contextDevOps(ctx) {
    try {
      ctx.session.messages.push(CONTEXT_DEVOPS);
      ctx.reply('Контекст <b>CONTEXT_DEVOPS</b> добавлен', {
        parse_mode: 'HTML',
      });
    } catch (err) {
      commandList.rebootBot(
        ctx,
        'Ошибка добавления контекста CONTEXT_DEVOPS',
        err,
      );
    }
  },

  async rebootBot(ctx, text, err = { message: 'объект ошибки отсутствует' }) {
    try {
      // console.log(`Сообщение ошибки при ребуте --- ${err.message}`);
      logger.error(`Сообщение ошибки при ребуте --- ${err.message}`);

      if (!ctx) {
        throw new Error('НЕТ КОНТЕКСТА ПРИ ПЕРЕДАЧЕ ОШИБКИ В РЕБУТ');
      }

      // await ctx.reply('<b>Бот перезапускается...</b>', { parse_mode: 'HTML' });

      if (!ctx.session) {
        ctx.session = {};
      }

      // console.log(ctx);
      logger.info(ctx);

      ctx.session = {};

      if (err.code === 403 || err.code === 429) {
        // console.log('ошибка 403!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        logger.error('ошибка 403!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        return;
      }

      if (text) {
        // console.log(`${text} --- `, err.message);
        logger.error(`${text} --- ${err.message}`);
        await ctx.reply(`${text} - ${err.message}`);
      }

      // console.log('перезапуск бота...');
      logger.error('перезапуск бота...');

      await this.newSession(ctx);
      // console.log('Бот перезапущен!!!');
      logger.info('Бот перезапущен!!!');
      await ctx.reply('<b>Бот перезапущен.</b>', { parse_mode: 'HTML' });
      // bot.launch();
    } catch (error) {
      // console.log('ошибка перезапуска бота', error.message);
      logger.error(`ошибка перезапуска бота - ${error.message}`);

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
      const userId = getUserId(ctx);
      stateManagerApp.setState(userId, stateApplication.askImageDiscription);
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
      const theme =				themeWithSigns.match(pattern) !== null
				  ? themeWithSigns.match(pattern)[0].toLowerCase()
				  : 'default';

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

  async sendRecords(ctx, bot) {
    try {
      const user =				(await ctx?.message?.from?.last_name)
				?? ctx?.update?.callback_query?.from?.last_name
				?? 'user'; // в зависимости от того, когда происходит действие, объект контекста может различаться, например если он вызывается при нажатии кнопки действия кейпада, у него не будет поля ctx.message.from , но зато будет ctx.update.callback_query.from? , поэтому мы проверяем наличие всех этих полей чтобы не схватить ошибку.

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
      const user =				(await ctx?.message?.from?.last_name)
				?? ctx?.update?.callback_query?.from?.last_name
				?? 'user';

      const recordsPath = files.recordsPath(user);

      const archiveFilePath = path.join(recordsPath, '../', `${user}.zip`);
      if (existsSync(archiveFilePath)) {
        removeFile(archiveFilePath);
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
  async createNotionRecordCommand(ctx, mode = 'command', target = 'note') {
    try {
      const { text } = ctx.message;

      let notionText;
      let response;

      switch (mode) {
        case 'command':
          [, ...notionText] = text.split(' ');
          break;

        case 'button':
          [...notionText] = text.split(' ');
          break;

        default:
          [...notionText] = text.split(' ');
      }

      if (notionText.length === 0) {
        await ctx.reply('Пустой запрос, повторите еще раз');
        return;
      }

      const data = notionText.join(' ');

      switch (target) {
        case 'note':
          response = await createNotionRecord(data);
          break;

        case 'todo':
          response = await createNotionTODO(data);
          break;

        default:
          response = await createNotionRecord(data);
      }

      // const response = await createNotionRecord(data);
      await ctx.reply(
        `Создана новая запись в notion. Ссылка на неё: ${response.url}`,
      );
    } catch (err) {
      // console.log('ошибка добавление записи в ноушен', err.message);
      logger.error(`ошибка добавление записи в ноушен ${err.message}`);
    }
  },

  // создание записи в ноушн при помощи голосовой команды "ЗАПИСЬ В БЛОКНОТ ..."
  async createNotionVoiceCommand(ctx, data) {
    try {
      const response = await createNotionRecord(data);
      await ctx.reply(
        `Создана новая запись в notion. Ссылка на неё: ${response.url}`,
      );
    } catch (err) {
      // console.log('ошибка добавление записи в ноушен', err.message);
      logger.error(`ошибка добавление записи в ноушен - ${err.message}`);
    }
  },

  // создание записи в ноушн при помощи голосовой команды "ЗАПИСЬ В СПИСОК ..."
  async createNotionTODOVoiceCommand(ctx, data) {
    try {
      const response = await createNotionTODO(data);
      await ctx.reply(
        `Создана новая запись в notion TODO List. Ссылка на неё: ${response.url}`,
      );
    } catch (err) {
      // console.log('ошибка добавления записи в ноушен TODO List', err.message);
      logger.error(`ошибка добавления записи в ноушен TODO List - ${err.message}`);
    }
  },

  // получение из ноушена записей TODO LIST-а
  async getNotionTODO(ctx) {
    try {
      const list = await queryTODO();
      const formattedList = list.join('\n');
      ctx.reply(formattedList);
    } catch (err) {
      // console.log(
      //   'ошибка получения записей из ноушен - TODO List - а',
      //   err.message,
      // );
      logger.error(`ошибка получения записей из ноушен - TODO List - ${err.message}`);
    }
  },

  // получение из ноушена записей Блокнота
  async getNotionNotes(ctx) {
    try {
      const list = await queryNote();
      const formattedList = list.join('\n');
      ctx.reply(formattedList);
    } catch (err) {
      // console.log('ошибка получения записей из ноушен - Note', err.message);
      logger.error(`ошибка получения записей из ноушен - Note - ${err.message}`);
    }
  },

  // получение из ноушена записей-напоминалок
  async getNotionReminders(ctx) {
    try {
      const list = await getNotionReminders();
      const formattedList = list.join('\n');
      ctx.reply(formattedList);
    } catch (err) {
      // console.log('ошибка получения записей из напоминалок', err.message);
      logger.error(`ошибка получения записей из напоминалок - ${err.message}`);
    }
  },

  // устанавливаем модель gpt3.5
  async setGPT3(ctx) {
    try {
      await setModel(ctx, MODELS.gpt3_5);
    } catch (err) {
      // console.log('ошибка установки модели 3.5', err.message);
      logger.error(`ошибка установки модели 3.5 - ${err.message}`);
    }
  },

  // устанавливаем модель gpt4о
  async setGPT4(ctx) {
    try {
      await setModel(ctx, MODELS.gpt4o);
    } catch (err) {
      // console.log('ошибка установки модели 4', err.message);
      logger.error(`ошибка установки модели 4 - ${err.message}`);
    }
  },

  // устанавливаем модель gpt4о
  async setGPT4_mini(ctx) {
    try {
      await setModel(ctx, MODELS.gpt4o_mini);
    } catch (err) {
      // console.log('ошибка установки модели 4', err.message);
      logger.error(`ошибка установки модели 4 - ${err.message}`);
    }
  },

  // получаем текущие данные модели
  async getStateGPT(ctx) {
    try {
      const state = await stateManagerModel.getState(ctx.message.from.id);
      if (state) {
        await ctx.reply(JSON.stringify(state, null, 2));
      } else {
        await ctx.reply('Ошибка получения данных модели');
      }
    } catch (err) {
      // console.log('ошибка получения текущих данных модели', err.message);
      logger.error(`ошибка получения текущих данных модели - ${err.message}`);
    }
  },

  // устанавливаем температуру по шаблону /settemp 0.5
  async setGptTemp(ctx) {
    try {
      const temp = parseFloat(ctx.message.text.split(' ')[1]);
      if (Number.isNaN(temp) || temp < 0 || temp > 1) {
        ctx.reply('Пожалуйста, укажите значение температуры от 0 до 1');
      } else {
        setTemperature(ctx, temp);
      }
    } catch (err) {
      // console.log('ошибка установки температуры модели', err.message);
      logger.error(`ошибка установки температуры модели - ${err.message}`);
    }
  },
};
