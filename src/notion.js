import { Client } from '@notionhq/client';
import config from 'config';

const notion = new Client({
  auth: config.get('NOTION_RECORDS_KEY'),
});

const createShortText = (text, maxLength) => ((text.length > maxLength) ? `${text.slice(0, maxLength)}...` : text);

export async function createNotionRecord(text) {
  const shortText = createShortText(text, 68);

  const response = await notion.pages.create({
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
