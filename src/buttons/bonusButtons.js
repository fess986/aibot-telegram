import { Markup } from 'telegraf';
import { bot } from '../bot.js';
import { commandList } from '../commandList.js';

export const bonusButtons = async (ctx) => {
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
};
