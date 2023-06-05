export const roles = {
  ASSISTANT: 'assistant',
  USER: 'user',
  SYSTEM: 'system',
}

const botMenu = `
help - справка по боту
c - работа с контекстом общения с ботом
b - дополнительные возможности бота
`

export const helpMessage = `
Основная функция бота - это общение с АИ с сохранением текущего контекста разговора, а так же есть возможность добавления преднаписанного контекста. Для того чтобы начать общаться с ботом, можно просто начать писать в чат или отправить голосовое сообщение.
/c - кнопки для управления контекстом общения
/b - кнопки с дополнительными функциями бота
Так же есть возможность сохранения голосовых заметок фразой "Запись на тему ...", а так же добавления контекста по голосу фразой "контекст ...", например "контекст Максим"
`

// константы комманд бота
export const botComands = {

  new: 'new', // новая сессия
  reload: 'reload', // перезагрузка бота

  contextMax: 'max', // контекст максима
  contextBot : 'bot', // контекст программирования бота
  contextProg: 'prog', // контекст программиста JS и TS
  
  weather: 'w', // текущая погода
  image: 'i', // рисование картинок по запросу пользователя. Для экономии ресурсов будем рисовать только по одной картинке с разрешением 256х256
  
  record: 'r', // запись сообщения в файл
  sendRecords: 's', // отправить архив с текущими записями пользователя
  removeRecords: 'rr', // удалить записи пользователя


  contextButtons: 'c', // меню с добавлением контекста общения
  manageButtons: 'b', // меню с управлением приложением

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
  `}


