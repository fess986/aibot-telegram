import { commandList } from '../commandList.js';
import stateManagerApp from '../statemanagers/application/stateManager.js';
import { stateApplication } from '../const/const.js';
import { getUserId } from '../utils/utils.js';

export const createNotionTodoMW = async (ctx, next) => {
  try {
    const userId = getUserId(ctx);

    if (stateManagerApp.getState(userId) === stateApplication.notionTODO) {
      console.log('создаётся запись в TODO для пользователя', userId);
      await commandList.createNotionRecordCommand(ctx, 'button', 'todo');
    }
    await next();
  } catch (err) {
    await commandList.rebootBot(
      ctx,
      'ошибка MW обработки вопроса о создании записи в TODO: ',
      err,
    );
  }
};
