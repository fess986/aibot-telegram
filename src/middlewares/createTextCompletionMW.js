import { openAi } from '../API/openai.js';
import { commandList } from '../commandList.js';

export const createTextCompletionMW = async (ctx, next) => {
  try {
    if (ctx?.session?.createTextCompletion === true) {
      const userText = ctx?.update?.message?.text || 'no text';

      if (!ctx?.update?.message?.text) {
        ctx.reply('Вы должны были ввести какой-либо текст, в следущий раз будьте чуть внимательнее!');
        ctx.session.createTextCompletion = false;
        return;
      }

      ctx.replyWithHTML(`создаётся продолжение вашего текста <b> ${userText} </b>`);
      const response = await openAi.completion(userText);

      if (response === 'ошибка') {
        await ctx.reply('Вылет по таймауту. Повторите свой запрос позже');

        await next();
        return;
      }

      // eslint-disable-next-line
    const responseText = response?.choices[0]?.text || 'По какой то причине текст не был сформирован';

      await ctx.reply(responseText);
      console.log(responseText);
    }
    await next();
  } catch (err) {
    await commandList.rebootBot(
      ctx,
      'ошибка MW обработки дополнения текста ',
      err,
    );
    await next();
  }
};
