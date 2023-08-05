import { Configuration, OpenAIApi } from "openai";
import config from "config";
import { createReadStream } from "fs";
import { resolve } from "path";

class openAI {
	constructor(apiKey) {
		const configuration = new Configuration({
			apiKey,
			models: ["davinci"],
			temperature: 0.5,
		});
		this.openai = new OpenAIApi(configuration);
	}

	async transcription(filePath) {
		try {
			// метод createTranscription принимает сам файл, так что мы в него засовываем не путь, а именно стрим, который читает файл. whisper-1  - это модель обработки
			
      const timePromise = new Promise((resolve) => {
				setTimeout(() => resolve('ошибка'), 60000);
			});
      
      const responsePromise = this.openai.createTranscription(
				createReadStream(filePath),
				"whisper-1"
			);

      const response = await Promise.race([responsePromise, timePromise]);

      const responseText = (response === 'ошибка') ? 'ошибка' : response.data.text;

      console.log(responseText)

			return responseText;

		} catch (e) {
			// await ctx.reply('Ошибка перевода голоса в текст в аи, текст ошибки: ', err.message)
			console.log(
				"Ошибка перевода голоса в текст в аи, текст ошибки: ",
				err.message
			);
		}
	}

	async chat(messages) {
		try {
			// для исключения ошибки по таймауту, мы будем проводить "гонку" между нашим сетевым запросом и промисом-заглушкой с обычным таймером на нужную нам величину. Обычно он падает после запроса на 90000ms (90 сек), но мы поставим поменьше, например на 60 сек

			const timePromise = new Promise((resolve) => {
				setTimeout(() => resolve('ошибка'), 80000);
			});

			const responsePromise = this.openai.createChatCompletion({
				model: "gpt-3.5-turbo", // модель. в будущем будет доступна еще версия с 4 чатом
				messages, // заданный массив запроса, где кроме самого запроса еще есть роль, контекст и тд
			});

			// ждем ответа от чата.
			const response = await Promise.race([responsePromise, timePromise]);

      const responseText = typeof response === 'string' ? 'ошибка' : response.data.choices[0].message;

			return responseText;

		} catch (err) {
			// await ctx.reply('Ошибка ответа от чата-аи, текст ошибки: ', err.message)
			console.log("error chating with gpt", err.message);
			return null; // Возвращаем null или другое значение по умолчанию в случае ошибки
		}
	}

	async image(text) {
		try {

      console.log('ass ........................................')

      const timePromise = new Promise((resolve) => {
				setTimeout(() => resolve('ошибка'), 60000);
			});

			const responsePromise = this.openai.createImage({
				prompt: text,
				size: "256x256",
				n: 1,
			});

      const response = await Promise.race([timePromise, responsePromise]);

      const responseData = response === 'ошибка' ? 'ошибка' : response.data.data[0].url;

			return responseData;
			// console.log(response.data.data)
		} catch (err) {
			console.log("ошибка при создании изображения", err.message);
		}
	}
}

export const openAi = new openAI(config.get("OPENAI_KEY"));
