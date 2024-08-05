import { INIT_SESSION, roles } from '../const/context.js';
import { commandList } from '../commandList.js';

export const currentDateMW = async (ctx, next) => {
  try {
    const currentDate = new Date(); // получаем текущую дату и время

    if (!ctx.session) {
      ctx.session = {};
    }
    ctx.session.currentDate = currentDate; // сохраняем дату и время в сессионное хранилище
    ctx.session.messages ??= JSON.parse(JSON.stringify(INIT_SESSION)); // инициируем новый контекст, если его не было

    ctx.session.messages.push({
      role: roles.SYSTEM,
      content: `Системное время: ${currentDate}`,
    });
    console.log(`Системное время: ${currentDate}`);
    // console.log(ctx.session);

    // console.time(`Processing update ${ctx.update.update_id}`); - запуск счетчика времени выполнения процессов

    await next(); // передаем управление следующему обработчику

    // console.timeEnd(`Processing update ${ctx.update.update_id}`); // завершение счётчика и показ времени выполнения всех мидлвеиров
  } catch (err) {
    await commandList.rebootBot(
      ctx,
      'ошибка MW добавления системного времени в контекст разговора: ',
      err,
    );
  }
};
