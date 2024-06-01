import { Markup } from 'telegraf';
import config from 'config';

import { bot } from '../bot.js';
import { commandList } from '../commandList.js';

import { stateApplication } from '../const/const.js';
import stateManagerApp from '../statemanagers/application/stateManager.js';
import { getUserId } from '../utils/utils.js';

const myId = config.get('ALLOWED_USERS')[0];

export const notionButtons = async (ctx) => {
  try {
    if (myId !== ctx?.message?.from?.id) {
      ctx.reply('Извините, данная функция для вас не доступна');
      return;
    }

    await ctx.replyWithHTML(
      '<b>Добавление контекста:</b>',
      Markup.inlineKeyboard([
        [Markup.button.callback('Запись в noton-блокнот', 'notionNote')],
        [Markup.button.callback('Запись в noton TODO list', 'notionTODO')],
        [Markup.button.callback('Получить записи из блокнота', 'getNotionNote')],
        [Markup.button.callback('Получить записи из TODO', 'getNotionTodo')],
        [Markup.button.callback('Получить записи из Напоминалок', 'getNotionReminders')],
      ]),
    );

    bot.action('notionNote', async (context) => {
      await context.answerCbQuery();

      context.reply(
        'Введите сообщение для записи в notion.',
      );
      // context.session.askNotionRecord = true;

      // const userId = context.from.id;
      const userId = getUserId(context);
      stateManagerApp.setState(userId, stateApplication.askNotionRecord);
    });

    bot.action('notionTODO', async (ctx1) => {
      await ctx1.answerCbQuery();
      ctx1.reply(
        'Введите сообщение для записи в notion1.',
      );
      // ctx.session.askNotionTODO = true;

      // const userId = ctx1.from.id;
      const userId = getUserId(ctx1);
      console.log(userId);
      stateManagerApp.setState(userId, stateApplication.notionTODO);
    });

    bot.action('getNotionTodo', async (context) => {
      await context.answerCbQuery();
      await commandList.getNotionTODO(context);
    });

    bot.action('getNotionNote', async (context) => {
      await context.answerCbQuery();
      await commandList.getNotionNotes(context);
    });

    bot.action('getNotionReminders', async (context) => {
      await context.answerCbQuery();
      await commandList.getNotionReminders(context);
    });
  } catch (err) {
    console.log(err);
    await commandList.rebootBot(
      ctx,
      'ошибка работы с кнопками контекста: ',
      err,
    );
  }
};
