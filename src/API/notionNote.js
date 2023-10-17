import { Client } from '@notionhq/client';
import config from 'config';

const notion = new Client({
  auth: config.get('NOTION_RECORDS_KEY'),
});

const createShortText = (text, maxLength) => ((text.length > maxLength) ? `${text.slice(0, maxLength)}...` : text);

export async function createNotionRecord(text) {
  const shortText = createShortText(text, 120);

  const table = await notion.pages.create({
    parent: { database_id: config.get('NOTION_RECORDS_DB_ID') },
    properties: {
      'Сокращенная запись': { // обращаемся к нужному полю по имени
        title: [
          {
            text: {
              content: shortText,
            },
          },
        ],
      },
      Date: { // обращаемся к нужному полю по имени
        date: {
          start: new Date().toISOString(),
        },
      },
    },
  });

  await notion.blocks.children.append({
    block_id: table.id, // обратились созданному нами блоку в таблице
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

  return table;
}

// поиск страниц и баз данных. Параметры поиска и сортировки изрядно отсасывают у notion.databases.query, поэтому использовать не будем. Из фишек - не подключаемся конкретно к базе
// https://developers.notion.com/reference/post-search
export async function getNotionPageSeach() {
  try {
    const response = await notion.search({
    // query: 'External tasks',
    // filter: {
    //   value: 'database',
    //   property: 'object'
    // },
      sort: {
        direction: 'ascending',
        timestamp: 'last_edited_time',
      },
    });
    console.log(response);
  } catch (err) {
    console.log('Ошибка выгрузки данных из notion-блокнота: ', err.message);
  }
}

export async function queryNote() {
  try {
    console.log('Querying database List...');
    const pagesList = await notion.databases.query({
      database_id: config.get('NOTION_RECORDS_DB_ID'),

      sorts: [
        {
          property: 'Date',
          direction: 'descending',
        },
      ],
      page_size: 10, // Лимит записей
    });

    const textList = pagesList.results.map((item) => `${item.properties['Сокращенная запись'].title[0].plain_text} --- ${item.url}`);
    return textList;
  } catch (error) {
    console.log('Ошибка выгрузки данных из notion-TODO list :', error.message);
    return 'error';
  }
}
