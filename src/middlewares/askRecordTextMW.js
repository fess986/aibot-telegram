import { commandList } from '../commandList.js';
import stateManagerApp from '../statemanagers/application/stateManager.js';
import { stateApplication } from '../const/const.js';
import { getUserId } from '../utils/utils.js';

export const askRecordTextMW = async (ctx, next) => {
  try {
    const userId = getUserId(ctx);

    if (stateManagerApp.getState(userId) === stateApplication.askRecordText) {
      console.log('создаётся запись для пользователя', userId);
      await commandList.createRecord(ctx, 'button');
    }

    await next();
  } catch (err) {
    await commandList.rebootBot(
      ctx,
      'ошибка MW обработки вопроса о создании записи в файл: ',
      err,
    );
  }
};
