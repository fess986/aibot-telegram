import { Markup } from 'telegraf';
import { bot } from '../bot.js';
import { commandList } from '../commandList.js';

export const notionButtons = async (ctx) => {
  try {
    await ctx.replyWithHTML(
      '<b>Добавление контекста:</b>',
      Markup.inlineKeyboard([
        [Markup.button.callback('Запись в noton-блокнот', 'notionNote')],
        [
          Markup.button.callback('В разработке', 'ass'),
          Markup.button.callback('В разработке', 'ass'),
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

    bot.action('ass', async (ctx1) => {
      await ctx1.answerCbQuery();
      ctx1.reply(
        'Функция в разработке',
      );
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
