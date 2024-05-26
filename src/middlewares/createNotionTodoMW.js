import { commandList } from '../commandList.js';

export const createNotionTodoMW = async (ctx, next) => {
  try {
    if (ctx?.session?.askNotionTODO === true) {
      await commandList.createNotionRecordCommand(ctx, 'button', 'todo');
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
