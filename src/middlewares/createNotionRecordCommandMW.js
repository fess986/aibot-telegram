import { commandList } from '../commandList.js';

export const createNotionRecordCommandMW = async (ctx, next) => {
  try {
    if (ctx?.session?.askNotionRecord === true) {
      await commandList.createNotionRecordCommand(ctx, 'button');
    }
    await next();
  } catch (err) {
    await commandList.rebootBot(
      ctx,
      'ошибка MW обработки вопроса о создании записи: ',
      err,
    );
    await next();
  }
};
