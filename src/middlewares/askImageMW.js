import { Input } from 'telegraf';

import { openAi } from '../API/openai.js';
import { ERROR_MESSAGES, stateApplication } from '../const/const.js';
import { commandList } from '../commandList.js';
import stateManagerApp from '../statemanagers/application/stateManager.js';
import { getUserId } from '../utils/utils.js';

export const askImageMW = async (ctx, next) => {
  try {
    const userId = getUserId(ctx);
    // if (ctx?.session?.askImageDiscription === true) {
    if (stateManagerApp.getState(userId) === stateApplication.askImageDiscription) {
      console.log('обработка запроса описания картинки');

      await ctx.replyWithHTML(
        `Картинка по вашему запросу: <b>"${ctx.message.text}"</b> - создается, подождите немного... `,
      );

      const url = await openAi.image(ctx.message.text);

      if (url === 'ошибка') {
        await ctx.reply(ERROR_MESSAGES.timeOutImage);
        stateManagerApp.resetState(userId);
        return;
      }

      await ctx.replyWithPhoto(Input.fromURL(url)); // используем специальный объект Input для того чтобы не было проблем с загрузкой картинки по url
    }
    await next();
  } catch (err) {
    await commandList.rebootBot(
      ctx,
      'ошибка MW обработки вопроса об описании текста картинки: ',
      err,
    );
    await next();
  }
};
