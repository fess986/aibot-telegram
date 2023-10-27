import { commandList } from '../commandList.js';
import { ERROR_MESSAGES } from '../const/const.js';
import { files } from './files.js';

export const checkLength = async (ctx, length) => {
  console.log(length);
  if (length === 4) {
    await ctx.reply('Текущая длинна сессии = 4. Просьба не увеличивать её размер без необходимости, это вызывает более длительные ответы бота.  Для обнуления сессии при смене темы общения с ботом - напишите /new или сделайте это через меню контекста');
    return false;
  }

  if (length === 6) {
    await ctx.reply('Текущая длинна сессии = 6... При достижении значения 8 - бот автоматически перезапустит сессию, если вы это не сделаете сами');
    return false;
  }

  if (length === 8) {
    await ctx.reply('Текущая длинна сессии = 8. Бот перезапускается!!!');
    await commandList.newSession(ctx);
    return true;
  }

  return false;
};

export const checkVoice = async (ctx, text) => {
  if (!text) {
    await ctx.replyWithHTML(ERROR_MESSAGES.noResponse);
    console.log('ошибка ответа chatGPT');
    return true;
  }

  const splitedText = text.split(' ');
  const [firstWord, secondWord, thirdWord, forthWord, ...rest] = splitedText;

  // проверим, ожидается ли печать текста
  if (ctx?.session?.createTextFromVoice === true) {
    await ctx.replyWithHTML('<b>Ваш текст:</b>');
    await ctx.reply(`${text}`);

    ctx.session.createTextFromVoice ??= false; // если в настройках линтера мы прописываем стандарт ECMAScript 2021, то такая конструкция начинает работать, иначе пишем как внизу указано
    // ctx.session.createTextFromVoice = ctx.session.createTextFromVoice || false;
    ctx.session.createTextFromVoice = false;
    return true;
  }

  // await ctx.reply(`<b>${firstWord}</b>`, { parse_mode: "HTML" }); // если хотим форматированный текст в ответе бота. При этом не все теги можно использовать, например h1 будет выдавать ошибку

  // добавление контекста
  if (firstWord.toLowerCase().startsWith('контекст')) {
    if (secondWord) {
      if (secondWord.toLowerCase().startsWith('макс')) {
        commandList.contentMax(ctx);
        return true;
      }

      if (secondWord.toLowerCase().startsWith('нов')) {
        commandList.newSession(ctx);
        return true;
      }
    }
  }

  // "Голосовой набор ..."
  if (firstWord.toLowerCase().startsWith('голос')) {
    if (secondWord) {
      if (secondWord.toLowerCase().startsWith('набор')) {
        await ctx.replyWithHTML('<b>Ваш текст:</b>');
        await ctx.reply(`${thirdWord} ${forthWord} ${rest.join(' ')}`);
        return true;
      }
    }
  }

  // погода
  if (firstWord.toLowerCase().startsWith('погода')) {
    if (secondWord) {
      return false;
    }

    commandList.weatherRequest(ctx);
    return true;
  }

  // запись сообщения в папку records, который вызывается из голосового сообщения, которое начинается с фразы "запись на тему ...".
  if (firstWord.toLowerCase().startsWith('запис')) {
    if ((thirdWord).toLowerCase().startsWith('тем')) {
      const pattern = /[A-Za-zА-Яа-яЁё0-9]+/g; // убираем лишние знаки из строки запроса
      const theme = forthWord.match(pattern) !== null ? forthWord.match(pattern)[0].toLowerCase() : 'default';
      const user = ctx.message.from.last_name;
      const time = ctx.session.currentDate;

      files.writeRecord(user, time, theme, text);

      ctx.reply(`Ваша запись <b>${text}</b> сохранена в папку <b>${theme}</b>`, {
        parse_mode: 'HTML',
      });

      return true;
    }
  }

  // запись сообщения в notion, которое начинается с фразы "ЗАПИСЬ В БЛОКНОТ ...".
  if (firstWord.toLowerCase().startsWith('запис')) {
    if ((thirdWord).toLowerCase().startsWith('блок')) {
      const notionText = `${forthWord} ${rest.join(' ')}`;
      await commandList.createNotionVoiceCommand(ctx, notionText);
      await ctx.reply(notionText);
      return true;
    }
  }

  // запись сообщения в notion, которое начинается с фразы "ЗАПИСЬ В БЛОКНОТ ...".
  if (firstWord.toLowerCase().startsWith('запис')) {
    if ((thirdWord).toLowerCase().startsWith('спис')) {
      const notionText = `${forthWord} ${rest.join(' ')}`;
      await commandList.createNotionTODOVoiceCommand(ctx, notionText);
      return true;
    }
  }

  //   // если ни одна проверка не сработала, возвращаем false для дальнейшей передачи сообщения АИ
  return false;
};
