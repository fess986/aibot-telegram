import { commandList } from '../commandList.js';
import stateManagerApp from '../statemanagers/application/stateManager.js';
import { getUserId } from '../utils/utils.js';
import { stateApplication } from '../const/const.js';

export const createNotionRecordCommandMW = async (ctx, next) => {
  try {
    const userId = getUserId(ctx);

    if (stateManagerApp.getState(userId) === stateApplication.askNotionRecord) {
      console.log('создаётся запись для пользователя', userId);
      await commandList.createNotionRecordCommand(ctx, 'button');
    }
    await next();
  } catch (err) {
    await commandList.rebootBot(
      ctx,
      'ошибка MW обработки вопроса о создании записи в ноушн: ',
      err,
    );
  }
};
