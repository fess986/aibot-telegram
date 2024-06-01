import { commandList } from '../commandList.js';
import stateManagerApp from '../statemanagers/application/stateManager.js';
import { stateApplication } from '../const/const.js';
import { getUserId } from '../utils/utils.js';

export const createNotionTodoMW = async (ctx, next) => {
  try {
    const userId = getUserId(ctx);
    console.log(stateManagerApp.getState(userId));
    console.log(stateApplication.notionTODO);

    if (stateManagerApp.getState(userId) === stateApplication.notionTODO) {
      await commandList.createNotionRecordCommand(ctx, 'button', 'todo');
    }
    await next();
  } catch (err) {
    await commandList.rebootBot(
      ctx,
      'ошибка MW обработки вопроса о создании записи в TODO: ',
      err,
    );
    // await next();
  }
};
