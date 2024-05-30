import { session } from 'telegraf';

import { allowedListMW } from './middlewares/allowedListMW.js';
import { currentDateMW } from './middlewares/currentDateMW.js';
import { askImageMW } from './middlewares/askImageMW.js';
import { askRecordTextMW } from './middlewares/askRecordTextMW.js';
import { createNotionRecordCommandMW } from './middlewares/createNotionRecordCommandMW.js';
import { createNotionTodoMW } from './middlewares/createNotionTodoMW.js';
import { createTextCompletionMW } from './middlewares/createTextCompletionMW.js';
import { changeId } from './middlewares/changeId.js';

export const startMW = (bot) => {
  bot.use(changeId); // смена id
  bot.use(session()); // подключаем мидлвеир, который умеет работать с сессиями

  bot.use(allowedListMW); // проверка разрешенного чек-листа
  bot.use(currentDateMW); // добавление системного времени в контекст разговора
  bot.use(askImageMW); // обработка того, задан ли вопрос пользователю по поводу описания картинки
  bot.use(askRecordTextMW); // обработка того, задан ли вопрос пользователю по поводу записи текста
  bot.use(createNotionRecordCommandMW); // обработка того, задан ли вопрос пользователю по поводу записи текста в notion-блокнот
  bot.use(createNotionTodoMW); // обработка того, задан ли вопрос пользователю по поводу записи текста в notion TODO List
  bot.use(createTextCompletionMW); // обработка того, задан ли вопрос пользователю по поводу дополнения текста
};
