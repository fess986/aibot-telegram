// eslint-disable-next-line no-unused-vars
const botMenu = `
help - Справка
context -    Контекст общения
records -  Записи
bonus -    Дополнительные возможности
notion -    Работа с ноушеном. Ограниченный функционал
`; // данная переменная действительно не используется напрямую в проекте, но она нужна для того чтобы быстро и оперативно править менюшку бота в телеграмме

export const roles = {
  ASSISTANT: 'assistant',
  USER: 'user',
  SYSTEM: 'system',
};

export const INIT_SESSION = [
  {
    role: roles.SYSTEM,
    content: 'нужен максимално быстрый ответ на запрос',
  },
];

export const CONTEXT_MAX = {
  role: roles.USER,
  content:
'Я пользователь данного бота. Зовут меня Максим, живу я в городе Тамбове (Россия).',
};

export const CONTEXT_PROGRAMMER = {
  role: roles.USER,
  content:
'Я изучаю программирование в основном в направлении фронтэнда. Основные языки это JavaScript и TypeScript. Основной фреймворк - это React с Redux-ом.  Уровень джуниор.',
};

export const CONTEXT_CHAT_BOT = {
  role: roles.USER,
  content: `Сейчас я пишу телеграмм-бота который работает с platform.openai.com на языке nodeJs в package.json используется "type": "module", "telegraf": "^4.12.2", "openai": "^3.2.1". Версия node: v16.19.0

  Так выглядит инициализация бота:
  import { Telegraf, session } from 'telegraf';
  const bot2 = new Telegraf(config.get('TELEGRAM_TOKEN'));

  Опен аи инициализируется так:
  import { Configuration, OpenAIApi } from "openai";
  class openAI {
    // методы которыми может пользоваться класс
  }
  export const openAi = new openAI(config.get('OPENAI_KEY'));

  бот умеет работать с сессиями и сохраняет весь контекст входных данных и ответов аи. 
  bot.use(session());

  нужна помощь для написания кода для бота.
  `,
};
