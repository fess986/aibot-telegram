export const roles = {
  ASSISTANT: 'assistant',
  USER: 'user',
  SYSTEM: 'system',
}

// константы комманд бота
export const botComands = {

  new: 'new', // новая сессия
  reload: 'reload', // перезагрузка бота

  contextMax: 'max', // контекст максима
  contextBot : 'bot', // контекст программирования бота
  contextProg: 'prog', // контекст программиста JS и TS
  weather: 'w',

}

export const INIT_SESSION = []

export const CONTEXT_MAX = {
  role: roles.USER, 
  content: 'Я пользователь данного бота. Зовут меня Максим, живу я в городе Тамбове (Россия).'
}

export const CONTEXT_PROGRAMMER = {
  role: roles.USER, 
  content: 'Я изучаю программирование в основном в направлении фронтэнда. Основные языки это JavaScript и TypeScript. Основной фреймворк - это React с Redux-ом.  Уровень джуниор.'
}

export const CONTEXT_CHAT_BOT = {
  role: roles.USER, 
  content: `Сейчас я пишу телеграмм-бота который работает с platform.openai.com на языке nodeJs , 
  вот так выглядит инициализация бота:
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

  нужна помощь для развития бота.
  `}


