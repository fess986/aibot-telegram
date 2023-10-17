import { Client } from '@notionhq/client';
import config from 'config';

const notion = new Client({
  auth: config.get('NOTION_REMINDERS_KEY'),
});

export async function getNotionReminders() {
  try {
    const response = await notion.search({});
    const textList = response.results.map((item) => `${item.properties.title.title[0].plain_text} --- ${item.url}`);
    return textList;
    // console.log(textList);
  } catch (err) {
    console.log('Ошибка выгрузки данных из notion-блокнота: ', err.message);
    return null;
  }
}
