import { createReadStream } from 'fs';
// import { Configuration, OpenAIApi } from 'openai';
import OpenAI from 'openai';
import config from 'config';
import { MODELS } from '../const/const.js';

class OpenAIClass {
  constructor(apiKey) {
    // обычное создание бота с использованием OpenAI
    this.openai = new OpenAI({
      apiKey, // This is also the default, can be omitted
    });

    // локальный бот с использованием OpenAI
    console.log(apiKey);
  }

  async transcription(filePath) {
    try {
      // метод createTranscription принимает сам файл, так что мы в него засовываем не путь, а именно стрим, который читает файл. whisper-1  - это модель обработки

      const timePromise = new Promise((resolve) => {
        setTimeout(() => resolve('ошибка'), 60000);
      });

      const responsePromise = this.openai.audio.transcriptions.create({
        model: MODELS.whisper,
        file: createReadStream(filePath),
      });

      const response = await Promise.race([responsePromise, timePromise]);

      const responseText = response === 'ошибка' ? 'ошибка' : response.text;

      return responseText;
    } catch (err) {
      // await ctx.reply('Ошибка перевода голоса в текст в аи, текст ошибки: ', err.message)
      console.log(
        'Ошибка перевода голоса в текст в аи, текст ошибки: ',
        err.message,
      );
      return null;
    }
  }

  async chat(messages) {
    try {
      // для исключения ошибки по таймауту, мы будем проводить "гонку" между нашим сетевым запросом и промисом-заглушкой с обычным таймером на нужную нам величину. Обычно он падает после запроса на 90000ms (90 сек), но мы поставим поменьше, например на 60 сек

      const timePromise = new Promise((resolve) => {
        setTimeout(() => resolve('ошибка'), 85000);
      });

      const responsePromise = this.openai.chat.completions.create({
        model: MODELS.gpt4o, // модель. в будущем будет доступна еще версия с 4 чатом
        // model: 'gpt-3.5-turbo', // модель. в будущем будет доступна еще версия с 4 чатом
        messages, // заданный массив запроса, где кроме самого запроса еще есть роль, контекст и тд
        temperature: 0.4,
      });

      console.log(messages);

      // ждем ответа от чата.
      const response = await Promise.race([responsePromise, timePromise]);
      console.log(response);

      const responseText = typeof response === 'string' ? 'ошибка' : response.choices[0].message;

      return responseText;
    } catch (err) {
      console.log('error chating with gpt', err.message);
      return null; // Возвращаем null или другое значение по умолчанию в случае ошибки
    }
  }

  async completion(message) {
    const temperature = 0.5;
    const maxTokens = 300;
    // const stop = '\n';

    try {
      const timePromise = new Promise((resolve) => {
        setTimeout(() => resolve('ошибка'), 70000);
      });

      const responsePromise = this.openai.completions.create({
        // model: MODELS.davinci, - раньше пользовались этой моделью
        model: MODELS.gpt_instruct,
        prompt: message,
        temperature,
        max_tokens: maxTokens,
        n: 1,
      });

      // ждем ответа от чата.
      const response = await Promise.race([responsePromise, timePromise]);

      return response;
    } catch (err) {
      console.log('error AI completion', err.message);
      return null;
    }
  }

  async image(text) {
    try {
      console.log('ass ........................................');

      const timePromise = new Promise((resolve) => {
        setTimeout(() => resolve('ошибка'), 60000);
      });

      const responsePromise = this.openai.images.generate({
        prompt: text,
        size: '256x256',
        n: 1,
      });

      const response = await Promise.race([timePromise, responsePromise]);

      const responseData =				response === 'ошибка' ? 'ошибка' : response.data[0].url;

      return responseData;
    } catch (err) {
      console.log('ошибка при создании изображения', err.message);
      return null;
    }
  }
}

export const openAi = new OpenAIClass(config.get('OPENAI_KEY'));
