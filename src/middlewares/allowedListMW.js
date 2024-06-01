import { commandList } from '../commandList.js';
import { accessIsAllowed } from '../utils/utils.js';

export const allowedListMW = async (ctx, next) => {
  try {
    if (ctx.message) {
      console.log(`Пользователь в разрешенном списке? - ${accessIsAllowed(ctx?.message?.from?.id)}`);

      if (accessIsAllowed(ctx?.message?.from?.id)) {
        await next();
      } else {
        ctx.reply('ограниченное использование бота');
      }
    }

    if (ctx.update.callback_query) {
      if (accessIsAllowed(ctx?.from.id)) {
        await next();
      } else {
        ctx.reply('ограниченное использование бота');
      }
    }
  } catch (err) {
    await commandList.rebootBot(
      ctx,
      'ошибка MW ограничения бот-листа: ',
      err,
    );
  }
};
