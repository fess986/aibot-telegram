import { openAi } from '../API/openai.js';
import { commandList } from '../commandList.js';
import { stateApplication } from '../const/const.js';
import stateManagerApp from '../statemanagers/application/stateManager.js';
import { getUserId } from '../utils/utils.js';

export const createTextCompletionMW = async (ctx, next) => {
  try {
    const userId = getUserId(ctx);

    if (stateManagerApp.getState(userId) === stateApplication.createTextCompletion) {
      const userText = ctx?.update?.message?.text || 'no text';

      if (!ctx?.update?.message?.text) {
        ctx.reply('Вы должны были ввести какой-либо текст, в следущий раз будьте чуть внимательнее!');
        stateManagerApp.resetState(userId);

        return;
      }

      ctx.replyWithHTML(`создаётся продолжение вашего текста <b> ${userText} </b>`);
      const response = await openAi.completion(userText);

      if (response === 'ошибка') {
        await ctx.reply('Вылет по таймауту. Повторите свой запрос позже');

        return;
      }

      // eslint-disable-next-line
    const responseText = response?.choices[0]?.text || 'По какой то причине текст не был сформирован';

      await ctx.reply(responseText);
      console.log('дополнение текста: ', responseText);
    }
    await next();
  } catch (err) {
    await commandList.rebootBot(
      ctx,
      'ошибка MW обработки дополнения текста ',
      err,
    );
  }
};
