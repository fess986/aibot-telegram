export const roles = {
	ASSISTANT: "assistant",
	USER: "user",
	SYSTEM: "system",
};

const botMenu = `
help - Справка
context -    Контекст общения
records -  Записи
bonus -    Дополнительные возможности
`;

export const ERROR_MESSAGES = {
	timeOutChat : 'Во время запроса к AI, время ответа было больше 1 минуты, поэтому для того чтобы не потерять контекст общения, последний запрос был отменен. Возможно это связано с большим предыдущим контекстом, который хранит все сообщения с начала сессии, если вы его не обнуляете время от времени. Для очистки - выберите соответствующий пункт меню или напечатайте "/new". Ну или openAI в данный момент тупит - повторите запрос позже или перефразируйте его ',
	timeOutVoice : 'Во время запроса к AI на распознание голоса - произошла ошибка по таймауту 60 сек. Скорее всего что то не так с сервером, тк обычно текст распознаётся довольно-таки быстро. Попробуйте повторить сообщение позже',
	timeOutImage : 'Во время запроса к AI на создание картинки произошла ошибка таймаута. Запрос на создание отклонен. На нет и суда нет, нефиг трафик АИ бота тратить - функция добавлена в основном для учебных целей, а так в инете завались этой работы с картинками )))) ',
}

export const helpMessage = `
Основная функция бота - это общение с АИ с сохранением текущего контекста разговора, а так же есть возможность добавления преднаписанного контекста. Для того чтобы начать общаться с ботом, можно просто начать писать в чат или отправить голосовое сообщение.

Кнопки и комманды управления:
/context - Управление контекстом общения
/bonus - Дополнительными функции бота
/records -  Работа с личными записями/заметками

При помощи голоса можно управлять:
"Запись на тему ..." - создаст запись с темой 4-го слова этой фразы. Остальные слова - будут являться текстом записи
"Контекст ..." - выбор контекста 
"Голосовой набор ..." - Перевод голосового сообщения в текст и вывод в ответе
`;

// константы комманд бота
export const botCommands = {
	new: "new", // новая сессия
	reboot: "reboot", // перезагрузка бота

	contextMax: "max", // контекст максима
	contextBot: "bot", // контекст программирования бота
	contextProg: "prog", // контекст программиста JS и TS

	weather: "w", // текущая погода
	image: "i", // рисование картинок по запросу пользователя. Для экономии ресурсов будем рисовать только по одной картинке с разрешением 256х256

	record: "r", // запись сообщения в файл
	sendRecords: "s", // отправить архив с текущими записями пользователя
	removeRecords: "rr", // удалить записи пользователя

	contextButtons: "context", // меню с добавлением контекста общения
	bonusButtons: "bonus", // меню с управлением приложением
	recordButtons: 'records',
};

export const INIT_SESSION = [];

export const CONTEXT_MAX = {
	role: roles.USER,
	content:
		"Я пользователь данного бота. Зовут меня Максим, живу я в городе Тамбове (Россия).",
};

export const CONTEXT_PROGRAMMER = {
	role: roles.USER,
	content:
		"Я изучаю программирование в основном в направлении фронтэнда. Основные языки это JavaScript и TypeScript. Основной фреймворк - это React с Redux-ом.  Уровень джуниор.",
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
