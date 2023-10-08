export const ERROR_MESSAGES = {
  timeOutChat: 'Во время запроса к AI, время ответа было больше 1 минуты, поэтому для того чтобы не потерять контекст общения, последний запрос был отменен. Возможно это связано с большим предыдущим контекстом, который хранит все сообщения с начала сессии, если вы его не обнуляете время от времени. Для очистки - выберите соответствующий пункт меню или напечатайте "/new". Ну или openAI в данный момент тупит - повторите запрос позже или перефразируйте его ',
  timeOutVoice: 'Во время запроса к AI на распознание голоса - произошла ошибка по таймауту 60 сек. Скорее всего что то не так с сервером, тк обычно текст распознаётся довольно-таки быстро. Попробуйте повторить сообщение позже',
  timeOutImage: 'Во время запроса к AI на создание картинки произошла ошибка таймаута. Запрос на создание отклонен. На нет и суда нет, нефиг трафик АИ бота тратить - функция добавлена в основном для учебных целей, а так в инете завались этой работы с картинками )))) ',
  noResponse: 'По каким то причинам не получен ответ от GPT. Возможно вы создали слишком длинную цепочку запросов, попробуйте обнулить сессию, или попробовать запрос позже ',
};

export const helpMessage = `
Основная функция бота - это общение с АИ с сохранением текущего контекста разговора, а так же есть возможность добавления преднаписанного контекста. Для того чтобы начать общаться с ботом, можно просто начать писать в чат или отправить голосовое сообщение.

Кнопки и комманды управления:
/context - Управление контекстом общения
/bonus - Дополнительными функции бота
/records -  Работа с личными записями/заметками
/notion - Работа с ноушеном

При помощи голоса можно управлять:
"ЗАПИСЬ НА ТЕМУ ..." - создаст запись с темой 4-го слова этой фразы. Остальные слова - будут являться текстом записи
"КОНТЕКСТ ..." - выбор контекста 
"ГОЛОСОВОЙ НАБОР ..." - перевод голосового сообщения в текст и вывод в ответе
"ЗАПИСЬ В БЛОКНОТ ..." - создание записи в notion
"ЗАПИСЬ В СПИСОК ..." - создание записи в notion TODO list
`;

// константы комманд бота
export const botCommands = {
  new: 'new', // новая сессия
  reboot: 'reboot', // перезагрузка бота

  contextMax: 'max', // контекст максима
  contextBot: 'bot', // контекст программирования бота
  contextProg: 'prog', // контекст программиста JS и TS

  weather: 'w', // текущая погода
  image: 'i', // рисование картинок по запросу пользователя. Для экономии ресурсов будем рисовать только по одной картинке с разрешением 256х256

  record: 'r1', // запись сообщения в файл
  sendRecords: 's', // отправить архив с текущими записями пользователя
  removeRecords: 'rr', // удалить записи пользователя

  contextButtons: 'context', // меню с добавлением контекста общения
  bonusButtons: 'bonus', // меню с управлением приложением
  recordButtons: 'records',
  notionButtons: 'notion',

  createNotionRecord: 'nr',
  createNotionTODO: 'nt',
};

export const MODELS = {
  gpt3_5: 'gpt-3.5-turbo',
  davinci: 'text-davinci-003',
  whisper: 'whisper-1',
};
