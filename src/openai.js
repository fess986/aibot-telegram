import { Configuration, OpenAIApi } from "openai";
import config from 'config';
import { createReadStream } from 'fs'

class openAI {

  roles = {
    ASSISTANT: 'assistant',
    USER: 'user',
    SYSTEM: 'system',
  }

  constructor(apiKey) {
    const configuration = new Configuration({
      apiKey,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async transcription(filePath) {
    try {
      // метод createTranscription принимает сам файл, так что мы в него засовываем не путь, а именно стрим, который читает файл. whisper-1  - это модель обработки
      const response = await this.openai.createTranscription(
        createReadStream(filePath), 'whisper-1'
      );
      return response.data.text;
    } catch(e) {
      console.log('Error from transcription', e.message)
    }
  }

  async chat(messages) {
    try {
      // ждем ответа от чата. 
      const response = await this.openai.createChatCompletion({
        model: 'gpt-3.5-turbo', // модель. в будущем будет доступна еще версия с 4 чатом
        messages, // заданный массив запроса, где кроме самого запроса еще есть роль, контекст и тд
      })
      return response.data.choices[0].message;
    } catch(err) {
      console.log('error chating with gpt', err.message);
    }
  }

}

export const openAi = new openAI(config.get('OPENAI_KEY'));