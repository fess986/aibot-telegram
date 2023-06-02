import {writeFile, existsSync, mkdirSync} from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
console.log(__dirname)

class Files {

  // функционал записи текста в папку records, который вызывается из голосового сообщения, которое начинается с фразы "запись на тему ..."
  writeRecord(user, time, theme, data) {

    try {

    // формируем имя папки, в котором будет сохранено сообщение, исходя из текущего пользователя и заданной темы
    const recordsPath = path.join(__dirname, "../", "records")

    if (!existsSync(recordsPath)) {
      mkdirSync(recordsPath); // если нет то создаем новую, при этом нельзя сразу несколько вложений сделать
    }

    const userRecordsPath = path.join(recordsPath, user)

    if (!existsSync(userRecordsPath)) {
      mkdirSync(userRecordsPath); 
    }

    const userThemePath = path.join(userRecordsPath, theme)

    if (!existsSync(userThemePath)) {
      mkdirSync(userThemePath); 
    }

    // формируем имя файла, исходя из текущего времени
    const month = String(time.getMonth()).length === 1 ? '0' + String(time.getMonth()) : String(time.getMonth())

    const day = String(time.getDate()).length === 1 ? '0' + String(time.getDate()) : String(time.getDate());

    const hour = String(time.getHours()).length === 1 ? '0' + String(time.getHours()) : String(time.getHours())

    const minutes = String(time.getMinutes()).length === 1 ? '0' + String(time.getMinutes()) : String(time.getMinutes())

    const seconds = String(time.getSeconds()).length === 1 ? '0' + String(time.getSeconds()) : String(time.getSeconds())

    const fileName = `${time.getFullYear()}-${month}-${day} ${hour}:${minutes}:${seconds}.txt`

    const filePath = path.join(userThemePath, fileName)

    writeFile(filePath, data, (err) => {  // полностью перетирает файл
      if (err) {  // если ошибку не обработать, то мы тупо не узнаем о ее существовании - скрипт как бы выполнится, на самом деле нет
        throw err
      };
    
      console.log(`writting file, ${filePath}`)
    })
  } catch(err) {
    console.log('ошибка записи файла');
  }


  }

  // будущий функционал чтения контекста из файла
  read(path) {

  }

}

export const files = new Files()