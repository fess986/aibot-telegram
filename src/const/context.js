// eslint-disable-next-line no-unused-vars
const botMenu = `
help - Справка
context -    Контекст общения
settings -    Настройки модели chatGPT
notion -    Работа с ноушеном. Ограниченный функционал
bonus -    Дополнительные возможности
records -  Записи
`; // данная переменная действительно не используется напрямую в проекте, но она нужна для того чтобы быстро и оперативно править менюшку бота в телеграмме

export const roles = {
  ASSISTANT: 'assistant',
  USER: 'user',
  SYSTEM: 'system',
};

export const INIT_SESSION = [
  {
    role: roles.SYSTEM,
    content: 'нужен максимально верный ответ на запрос',
  },
];

// export const CONTEXT_MAX = {
//   role: roles.USER,
//   content:
// 'Я пользователь данного бота. Зовут меня Максим, живу я в городе Тамбове (Россия).',
// };

export const CONTEXT_MAX = {
  role: roles.USER,
  content:
`
  Сейчас я пишу фронтенд для приложения Films Library (библиотека фильмов, где можно посмотреть новинки, описание фильмов, оставить отзывы и добавить себе в избранные). Инициализирован проект так:
  npm create vite@latest films-library-frontend -- --template react-ts

   В package.json (указываю основные модули):
   "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.23.1",
    "styled-components": "^6.1.11",
    "@reduxjs/toolkit": "^2.2.7",
    "react-redux": "^9.1.2",
  },
   devDependencies: {
     "typescript": "^5.2.2",
    "vite": "^5.2.0"
   }
   
   Требуется помощь в написании кода а так же взаимодействием с vite
  `,
};

export const CONTEXT_PROGRAMMER = {
  role: roles.USER,
  content:
'Я изучаю программирование в основном в направлении фронтэнда. Основные языки это JavaScript и TypeScript. Основной фреймворк - это React с Redux-ом.  Уровень джуниор.',
};

export const CONTEXT_CHAT_BOT = {
  role: roles.USER,
  content: `Сейчас я пишу телеграмм-бота который работает с platform.openai.com на языке nodeJs в package.json используется "type": "module", "telegraf": "^4.12.2", "openai": "^4.5.0". Версия node: v16.19.0
  Входной файл - src/main.js

  Так выглядит инициализация бота:
  import { Telegraf, session } from 'telegraf';
  const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

  Опен аи инициализируется так:
  import { Configuration, OpenAIApi } from "openai";
  class openAI {
    async chat(messages) {}  // метод для общения с аи 
    // методы которыми может пользоваться класс
  }
  export const openAi = new openAI(config.get('OPENAI_KEY'));

  бот умеет работать с сессиями и сохраняет весь контекст входных данных и ответов аи. 
  bot.use(session());

  работа с middleware организована в файле src/mw.js , куда импортируются миддлвейры из папки src/middlewares 
  // обработка того, задан ли вопрос пользователю по поводу записи текста в notion
  Например mw, который проверяет whitelist : 
  export const allowedListMW = async (ctx, next) => {
    try {
      if (ctx.message) {
  
        if (accessIsAllowed(ctx?.message?.from?.id)) {
          await next();
        } else {
          ctx.reply('ограниченное использование бота');
        }

  нужна помощь для написания кода для бота.
  `,
};

export const CONTEXT_DEVOPS = {
  role: roles.USER,
  content: `
  **Описание:**

  Меня зовут Санёк. Я обладаю всесторонним опытом в области системного администрирования и DevOps, с особым акцентом на использовании Linux, включая такие дистрибутивы, как Ubuntu и Debian. Мои навыки включают автоматизацию процессов с помощью Ansible и управление контейнеризованными приложениями с помощью Kubernetes. 

  **Навыки и технологии:**
  1. **Linux:** Глубокое знание и опыт работы с дистрибутивами Ubuntu и Debian. Управление системами, обеспечение безопасности, настройка служб и решение проблем.
  2. **Ansible:** Разработка плейбуков для автоматизации различных IT-заданий, включая развертывание серверов, управление конфигурациями и обновления.
  3. **Kubernetes:** Оркестрация контейнеров, настройка кластера, управление подами и сервисами, мониторинг и масштабирование приложений.

  **Как использовать:**
  Используй следующие инструкции, чтобы помочь мне с вопросами и задачами, связанными с указанными технологиями:
  - Предоставь рекомендации и лучшие практики по системному администрированию и DevOps.
  - Окажи помощь в написании и отладке Ansible плейбуков.
  - Предложи решения по настройке и управлению Kubernetes кластерами.
  - Поделись советами по устранению неполадок и оптимизации производительности.

  Пожалуйста, обращай особое внимание на детали и рассматривай различные уголки и аспекты технологий, чтобы предложенные решения были максимально информативными и полезными.

  `,
};

export const CONTEXT_CHAT_BOT_NOTION = {
  role: roles.USER,
  content: `Сейчас я пишу телеграмм-бота который работает с platform.openai.com на языке nodeJs в package.json используется "type": "module", "telegraf": "^4.12.2", "openai": "^4.5.0". Версия node: v16.19.0

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

  Так же он умеет работать с notion api. 
  Инициализируется так import { Client } from '@notionhq/client'; // версия "@notionhq/client": "^2.2.13"
  const notion = new Client({
    auth: config.get('NOTION_RECORDS_KEY'),
  });

  Делаем запись в БД:
  export async function createNotionRecord(text) {
    const table = await notion.pages.create({
      parent: { database_id: config.get('NOTION_RECORDS_DB_ID') },
      properties: { // поля бд }
      }}
  
  Забираем данные из бд:
  export async function queryDatabase() { 
    const lastOrderedIn2023 = await notionTODO.databases.query({
      database_id: config.get('NOTION_TODO_LIST_DB_ID'), 
      // фильтры и сортировка
    return lastOrderedIn2023
    }}

  нужна помощь для написания кода для бота.
  `,
};

export const CONTEXT_LIBRARY_FRONTEND = {
  role: roles.USER,
  content: `
  Сейчас я пишу фронтенд для приложения Films Library. Инициализирован проект так:
  npm create vite@latest films-library-frontend -- --template react-ts

   В package.json (указываю основные модули):
   "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.23.1",
    "styled-components": "^6.1.11"
  },
   devDependencies: {
     "typescript": "^5.2.2",
    "vite": "^5.2.0"
   }
   
   Требуется помощь в написании кода а так же взаимодействием с vite
  `,
};

export const CONTEXT_LIBRARY_FULLSTACK = {
  role: roles.USER,
  content: `
  Сейчас я пишу клиент-серверное приложение  Films Library. Инициализирован проект так:
  npm create vite@latest films-library-frontend -- --template react-ts

   package.json для клиента (указываю основные модули):
   "dependencies": {
    "react": "^18.2.0",
  },
   devDependencies: {
     "typescript": "^5.2.2",
    "vite": "^5.2.0"
   }

   Для сервера:
     "dependencies": {
    "axios": "^1.7.7",
    "express": "^4.19.2",
    "express-validator": "^7.2.0",
    "mongoose": "^8.4.1",
  },
   
   Требуется помощь в написании кода а так же взаимодействием с vite
  `,
};

export const CONTEXT_LIBRARY_FULLSTACK_TESTING = {
  role: roles.USER,
  content: `
  Сейчас я пишу тесты vitest для фронтэнда клиент-серверного приложения  Films Library. Инициализирован проект так:
  npm create vite@latest films-library-frontend -- --template react-ts
  Мне нужна помощь в написании тестов vitest. У меня установлены следущие основные пакеты в проекте. Если для какой-либо задачи нужно добавить какой-либо пакет, напишите мне.

   package.json  (указываю основные модули):
   "dependencies": {
    "react": "^18.2.0"
    "@reduxjs/toolkit": "^2.2.7"
    "history": "^5.3.0"
    "react-redux": "^9.1.2"
  },
   devDependencies: {
    "@testing-library/react": "^16.2.0",
    "@testing-library/user-event": "^14.6.1",
    "@vitest/expect": "^3.0.5",
    "axios-mock-adapter": "^2.1.0",
    "faker": "^6.6.6",
    "jsdom": "^26.0.0",
    "typescript": "^5.2.2",
    "vite": "^5.2.0",
    "vitest": "^3.0.5"
   }
      Иногда я буду присылать аналоги из jest, чтобы ты помог перевести их в vitest.
  `,
};

/// /////////////////////// контексты, не используемые в боте //////////////////////////

// контексты для AI
export const AI_GENERAL = {
  role: roles.USER,
  content:
`
Я изучаю программирование в основном в направлении фронтэнда. Основные языки это JavaScript и TypeScript. Основной фреймворк - это React с Redux-ом. Так же пишу бота на nodeJS для telegram. Уровень джуниор.Так же занимаюсь вёрсткой html/css. Для стилей использую препроцессор saas.
`,
};

export const AI_BOT = {
  role: roles.USER,
  content:
`
Контекст проекта
Проект: Aibot-telegram
Репозиторий GitHub: fess986/aibot-telegram

Описание проекта:
Проект представляет собой телеграм-бота, написанного на Node.js. Основное назначение бота — предоставление различных услуг и автоматизация взаимодействия с пользователем в Telegram. В проекте используются следующие технологии и библиотеки:

Node.js: Серверная платформа для выполнения JavaScript.
Telegraf: Фреймворк для создания телеграм-ботов.
JavaScript: Основной язык программирования.
dotenv: Библиотека для работы с переменными окружения.
Основные файлы и их назначение:

index.js: Основной файл приложения, где инициализируется бот и задаются основные команды и обработчики.
config.js: Конфигурационный файл для работы с переменными окружения.
commands/: Папка, содержащая обработчики команд бота.
middlewares/: Папка для промежуточных обработчиков (middlewares), которые используются для обработки сообщений.
Задачи, над которыми я работаю:

Разработка и добавление новых команд для бота.
Улучшение существующего кода и оптимизация производительности.
Исправление багов и ошибок.
Добавление новых функциональных возможностей по мере необходимости.
`,
};
