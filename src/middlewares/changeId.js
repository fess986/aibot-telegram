import { changeIdConst } from '../const/const.js';

export const changeId = async (ctx, next) => {
  try {
    if ((ctx.message.from.id !== 3861485810) && (ctx.message.from.id !== 111)) {
      await next();
      return;
    }

    if (changeIdConst.isChanged === true) {
      ctx.message.from.id = 111;
      ctx.from.id = 111; // Изменение ctx.from.id
      await ctx.reply('id сейчас 111');
    }

    if (changeIdConst.isChanged === false) {
      ctx.message.from.id = 386148581;
      ctx.from.id = 386148581; // Изменение ctx.from.id
    }
    await next();
  } catch (err) {
    console.log('ошибка MW смены id: ', err);
    next();
  }
};
