import stateManager from './stateManager.js';

export const setModel = async (ctx, model) => {
  const userId = await ctx.message.from.id;
  stateManager.setState(userId, { model });
  stateManager.getState(userId);
  await ctx.reply(`Модель изменена на ${model}`);
};

export const setTemperature = async (ctx, temperature) => {
  const userId = await ctx.message.from.id;
  stateManager.setState(userId, { temperature });
  stateManager.getState(userId);
  await ctx.reply(`Температура изменена на ${temperature}`);
};
