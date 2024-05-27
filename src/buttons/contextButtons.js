import { Markup } from 'telegraf';
import { bot } from '../bot.js';
import { commandList } from '../commandList.js';

export const contextButtons = async (ctx) => {
  try {
    await ctx.replyWithHTML(
      '<b>Добавление контекста:</b>',
      Markup.inlineKeyboard([
        [Markup.button.callback('Новый контекст!', 'new')],
        [
          Markup.button.callback('Макс', 'max'),
          Markup.button.callback('Программист JS', 'programmist'),
          Markup.button.callback('Пишем бота', 'bot'),
        ],
        [Markup.button.callback('DevOps', 'deVopsContext')], // каждый массив представляет одну строку с кнопками. btn1 - это идентификатор, по которому ее потом можно найти
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

    bot.action('deVopsContext', async (ctx1) => {
      await ctx1.answerCbQuery();
      commandList.contextDevOps(ctx1);
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
};
