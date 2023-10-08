import { Client } from '@notionhq/client';
import config from 'config';

const notion = new Client({
  auth: config.get('NOTION_RECORDS_KEY'),
});

const createShortText = (text, maxLength) => ((text.length > maxLength) ? `${text.slice(0, maxLength)}...` : text);

export async function createNotionRecord(text) {
  const shortText = createShortText(text, 68);

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

// поиск страниц и баз данных. Параметры поиска и сортировки изрядно отсасывают у notion.databases.query, поэтому использовать не будем
// https://developers.notion.com/reference/post-search
export async function getNotionPageSeach() {
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
}