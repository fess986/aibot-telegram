import { Markup } from 'telegraf';
import { bot } from '../bot.js';
import { commandList } from '../commandList.js';
import { getUserId } from '../utils/utils.js';
import { stateApplication } from '../const/const.js';
import stateManagerApp from '../statemanagers/application/stateManager.js';

export const recordButtons = async (ctx) => {
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
      const userId = getUserId(ctx1);
      stateManagerApp.setState(userId, stateApplication.askRecordText);
    });

    bot.action('sendRecord', async (ctx1) => {
      await ctx1.answerCbQuery();
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
};
