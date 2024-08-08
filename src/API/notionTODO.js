import { Client } from '@notionhq/client';
import config from 'config';
import logger from './logger.js';

const notionTODO = new Client({
  auth: config.get('NOTION_TODO_LIST_KEY'),
});

const createShortText = (text, maxLength) => ((text.length > maxLength) ? `${text.slice(0, maxLength)}...` : text);

export async function createNotionTODO(text) {
  const shortText = createShortText(text, 68);

  const response = await notionTODO.pages.create({
    parent: { database_id: config.get('NOTION_TODO_LIST_DB_ID') },
    properties: {
      Задача: { // обращаемся к нужному полю по имени
        title: [
          {
            text: {
              content: shortText,
            },
          },
        ],
      },
      'Дата создания': { // обращаемся к нужному полю по имени
        date: {
          start: new Date().toISOString(),
        },
      },
    },
  });

  await notionTODO.blocks.children.append({
    block_id: response.id, // обратились созданному нами респонсу
    children: [
      {
        object: 'block',
        type: 'paragraph', // тут можно что угодно вплоть до аудио, но нам нужен именно текст
        paragraph: {
          rich_text: [ // обозначение для большого текста
            {
              type: 'text',
              text: {
                content: text,
              },
            },
          ],
        },
      },

    ],
  });

  return response;
}

// описание функции https://developers.notion.com/reference/post-database-query
// возможные сортировки https://developers.notion.com/reference/post-database-query-filter
export async function queryTODO() {
  try {
    // console.log('Querying database TODO...');
    logger.info('Querying database TODO...');
    const pagesList = await notionTODO.databases.query({
      database_id: config.get('NOTION_TODO_LIST_DB_ID'),
      // filter: {
      //   property: 'Дата создания',
      //   date: {
      //     after: '2022-12-31',
      //   },
      // },
      filter: {
        property: 'Выполнение', // Замени на имя свойства чекбокса
        checkbox: {
          equals: false, // Фильтр для невыполненных записей
        },
      },

      sorts: [
        {
          property: 'Дата создания',
          direction: 'descending',
        },
      ],
      page_size: 10, // Лимит записей
    });

    // console.log(lastOrderedIn2023.results[0].url);

    const textList = pagesList.results.map((item) => `${item.properties['Задача'].title[0].plain_text} --- ${item.url}`);
    return textList;
  } catch (error) {
    // console.log('Ошибка выгрузки данных из notion-TODO list :', error.message);
    logger.error(`Ошибка выгрузки данных из notion-TODO list : ${error.message}`);
    return 'error';
  }
}
