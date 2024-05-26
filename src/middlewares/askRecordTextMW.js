import { commandList } from '../commandList.js';

export const askRecordTextMW = async (ctx, next) => {
  try {
    if (ctx?.session?.askRecordText === true) {
      await commandList.createRecord(ctx, 'button');
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
