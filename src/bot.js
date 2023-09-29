import { Telegraf } from 'telegraf'; // для работы с ботом телеграмма
import config from 'config';

import { helpMessage } from './const/const.js';
import { INIT_SESSION } from './const/context.js';
import { commandList } from './commandList.js';

import { startMW } from './mw.js';

export const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

bot.start(async (ctx) => {
  try {
    // ctx.session.messages ??= JSON.parse(JSON.stringify(INIT_SESSION));
    ctx.session.messages = ctx.session.messages || JSON.parse(JSON.stringify(INIT_SESSION));
    ctx.session.messages = JSON.parse(JSON.stringify(INIT_SESSION));
    await ctx.reply(
      'Добро пожаловать в GPT-бот, написанный fess! Введите /help чтобы узнать подробнее о его возможностях.',
    );
  } catch (err) {
    await commandList.rebootBot(ctx, 'ошибка при старте бота: ', err);
  }
});

bot.help((ctx) => {
  ctx.reply(helpMessage);
});

startMW(bot); // запускаем миддлвеиры для бота из отдельного файла

bot.launch();
