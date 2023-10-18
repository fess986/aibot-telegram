import { Telegraf } from 'telegraf'; // для работы с ботом телеграмма
import config from 'config';

import { helpMessage } from './const/const.js';
import { INIT_SESSION } from './const/context.js';
import { commandList } from './commandList.js';

import { startMW } from './mw.js';

export const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

// стартуем бота
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

// Обработка полученной локации и вывод текущей погоды на экран
bot.on('location', async (ctx) => {
  commandList.weatherLocation(ctx);
});

bot.on('left_chat_member', () => {
  // const userId = ctx.message.left_chat_member.id;
  // // Тут можешь выполнить дополнительные действия, если бот был заблокирован пользователем.
  // console.log(`Пользователь ${userId} удалил бота из чата.`);
  console.log('Пользователь удалил бота из чата.........................');
});

bot.on('my_chat_member', () => {
  // const userId = ctx.message.my_chat_member.id;
  // if (ctx.message.my_chat_member.status === 'kicked') {
  //   // Тут можешь выполнить дополнительные действия, если бот был заблокирован пользователем.
  //   console.log(`Пользователь ${userId} заблокировал бота.`);
  // }
  console.log('Пользователь заблокировал бота ');
});

// запуск бота
bot.launch();
