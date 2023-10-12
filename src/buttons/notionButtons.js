import { Markup } from 'telegraf';
import config from 'config';

import { bot } from '../bot.js';
import { commandList } from '../commandList.js';

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
        [
          Markup.button.callback('Запись в noton TODO list', 'notionTODO'),
        ], // каждый массив представляет одну строку с кнопками. btn1 - это идентификатор, по которому ее потом можно найти
      ]),
    );

    bot.action('notionNote', async (ctx1) => {
      await ctx1.answerCbQuery();

      ctx1.reply(
        'Введите сообщение для записи в notion.',
      );
      ctx1.session.askNotionRecord = true;
    });

    bot.action('notionTODO', async (ctx1) => {
      await ctx1.answerCbQuery();
      ctx1.reply(
        'Введите сообщение для записи в notion.',
      );
      ctx1.session.askNotionTODO = true;
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
