import {
  writeFile, existsSync, mkdirSync, createWriteStream,
} from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

// eslint-disable-next-line no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url));

class Files {
  // функционал записи текста в папку records, который вызывается из голосового сообщения, которое начинается с фразы "запись на тему ..."
  writeRecord(user, time, theme, data) {
    try {
      // формируем имя папки, в котором будет сохранено сообщение, исходя из текущего пользователя и заданной темы
      const recordsPath = path.join(__dirname, '../', 'records');

      if (!existsSync(recordsPath)) {
        mkdirSync(recordsPath); // если нет то создаем новую, при этом нельзя сразу несколько вложений сделать
      }

      const userRecordsPath = path.join(recordsPath, user);

      if (!existsSync(userRecordsPath)) {
        mkdirSync(userRecordsPath);
      }

      const userThemePath = path.join(userRecordsPath, theme);

      if (!existsSync(userThemePath)) {
        mkdirSync(userThemePath);
      }

      // формируем имя файла, исходя из текущего времени
      const month = String(time.getMonth() + 1).length === 1 ? `0${String(time.getMonth() + 1)}` : String(time.getMonth() + 1);

      const day = String(time.getDate()).length === 1 ? `0${String(time.getDate())}` : String(time.getDate());

      const hour = String(time.getHours()).length === 1 ? `0${String(time.getHours())}` : String(time.getHours());

      const minutes = String(time.getMinutes()).length === 1 ? `0${String(time.getMinutes())}` : String(time.getMinutes());

      const seconds = String(time.getSeconds()).length === 1 ? `0${String(time.getSeconds())}` : String(time.getSeconds());

      const fileName = `${time.getFullYear()}-${month}-${day} ${hour}:${minutes}:${seconds}.txt`;

      const filePath = path.join(userThemePath, fileName);

      writeFile(filePath, data, (err) => {
        // полностью перетирает файл
        if (err) {
          // если ошибку не обработать, то мы тупо не узнаем о ее существовании - скрипт как бы выполнится, на самом деле нет
          throw err;
        }

        console.log(`writting file, ${filePath}`);
      });
    } catch (err) {
      console.log('ошибка записи файла');
    }
  }

  areRecordsExists(user) {
    const folderPath = path.join(__dirname, '../', 'records', user);

    if (!existsSync(folderPath)) {
      console.log('У вас нет ни одной записи!');
      return false;
    }
    return true;
  }

  recordsPath(user) {
    const folderPath = path.join(__dirname, '../', 'records', user);
    return folderPath;
  }

  async archiveRecords(user) {
    try {
      const recordsExist = this.areRecordsExists(user);

      const folderPath = this.recordsPath(user);

      if (!recordsExist) {
        console.log('У вас нет ни одной записи!');
        return;
      }

      const zipFilename = path.join(folderPath, '../', `${user}.zip`);

      const output = createWriteStream(zipFilename);
      const archive = archiver('zip', { zlib: { level: 9 } });

      // eslint-disable-next-line
      return new Promise((resolve) => {
        output.on('close', () => {
          console.log(
            `${zipFilename} created: ${archive.pointer()} total bytes`,
          );
          resolve(zipFilename);
        });

        archive.on('warning', (err) => {
          if (err.code === 'ENOENT') {
            console.warn('Warning', err);
          } else {
            throw err;
          }
        });

        archive.on('error', (err) => {
          throw err;
        });

        archive.pipe(output);
        archive.directory(folderPath, false);
        archive.finalize();
      });
    } catch (err) {
      console.log('ошибка архивирования папки', err.message);
    }
  }

  // будущий функционал чтения контекста из файла
  // read(path) {}
}

export const files = new Files();
