import { unlink } from 'fs/promises';
import fs from 'fs';

// функция для удаления файла по его пути в файловой системе
export default async function removeFile(path) {
  try {
    unlink(path);
  } catch (error) {
    console.log('error deleting file', error.message);
  }
}

export function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file) => {
      const curPath = `${path}/${file}`;
      if (fs.lstatSync(curPath).isDirectory()) {
        // рекурсивно вызываем функцию для удаления содержимого папки
        deleteFolderRecursive(curPath);
      } else {
        // удаляем файл
        fs.unlinkSync(curPath);
      }
    });
    // удаляем саму папку
    fs.rmdirSync(path);
  }
}
