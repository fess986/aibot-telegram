// eslint-disable-next-line no-unused-vars
const botMenu = `
help - Справка
context -    Контекст общения
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
  content: `Сейчас я пишу телеграмм-бота который работает с platform.openai.com на языке nodeJs в package.json используется "type": "module", "telegraf": "^4.12.2", "openai": "^4.5.0". Версия node: v16.19.0

  Так выглядит инициализация бота:
  import { Telegraf, session } from 'telegraf';
  const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

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

export const CONTEXT_TZARKOV = {
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
