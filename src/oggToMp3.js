import axios from "axios";
import ffmpeg from "fluent-ffmpeg"; // ядро кодека
import installer from '@ffmpeg-installer/ffmpeg'; // для установки кодека
import { createWriteStream } from 'fs';
import {dirname, resolve} from 'path';
import { fileURLToPath } from 'url';
import removeFile from "./utils.js"; // обязательно нужно указать расширение js, иначе словим ошибку

// console.log(import.meta.url) // путь до файла, вызвавшего скрипт

const __dirname = dirname(fileURLToPath(import.meta.url))

console.log(__dirname);

class OggConverter {
  constructor() {
    ffmpeg.setFfmpegPath(installer.path); // прописываем путь кодеку
  }

  // получение огг-файла по его url и fileName и отправка его в папку voices
  async create(url, fileName) {
    try {

      const oggPath = resolve(__dirname, '../voices', `${fileName}.ogg`);
      const response = await axios({
        method: 'get',
        url,
        responseType: 'stream', // будем получать ответ в качестве стрима
      });

      //так как мы работаем в асинхронной функции, её итогом мы можем вернуть промис выполнения наших задач
      return new Promise((resolve) => {  
      const stream = createWriteStream(oggPath);
      response.data.pipe(stream); // направляет хтпп-данные из аксиос-запроса в поток createWriteStream по заданному пути, то есть
      stream.on('finish', () => resolve(oggPath)); // по итогу возвращаем наш огг файл и отправляем его в папку voices
      })

      // const stream = createWriteStream(oggPath);
      // response.data.pipe(stream); // это я не понял
      // stream.on('finish', () => {
      //   return oggPath;  // так тоже работает без всяких промисов. хз - оставим таки версию с промисом
      // });
      
    } catch(e) {
      console.log('error creating ogg file', e.message);
    }
}

toMp3(inputPath, outputName) {
  console.log(inputPath)
  
  try {
    const outputPath = resolve(dirname(inputPath), `${outputName}.mp3`)
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath) // запускаем конвертер для нашего огг-файла, указывая путь до него
        .inputOption('-t 30') // настройка кодека, не вникаем
        .output(outputPath) // куда он будет отправлен
        .on('end', () => {
          removeFile(inputPath); // удаляем ogg файл в конце трансформации
          resolve(outputPath)
        }) // по выполнению передаем в промис путь до mp3
        .on('error', (err) => reject(err.message)) 
        .run() // запускаем кодек
    })
  } catch(err) {
    console.log('error transform ogg file to mp3', err.message);
  }
}

}

export const ogg = new OggConverter()