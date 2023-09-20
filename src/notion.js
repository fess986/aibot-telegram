import { Client } from '@notionhq/client';
import config from 'config';

const notion = new Client({
  auth: config.get('NOTION_RECORDS_KEY'),
});

export async function createNotionRecord() {
  const response = await notion.pages.create({
    parent: { database_id: config.get('NOTION_RECORDS_DB_ID') },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: 'shortText',
            },
          },
        ],
      },
      Date: {
        date: {
          start: new Date().toISOString(),
        },
      },
    },
  });

  return response;
}
