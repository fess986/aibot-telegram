import { unlink } from 'fs/promises';
import fs from 'fs';
import config from 'config';

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

export function accessIsAllowed(id) {
  const allowedUsers = config.get('ALLOWED_USERS');
  const allowedUsersSet = new Set(allowedUsers);
  console.log('Проверяемый id - ', id);
  return allowedUsersSet.has(id);
}

export function fromWho(id) {
  if (!id) {
    return 'пользователь без id';
  }

  let userName = '';

  switch (id) {
    case 525755965: // добавлен
      userName = 'Андрей Симкин';
      break;

    case 1052290682:
      userName = 'Какой то - Kinet AI';
      break;

    case 386148581:// добавлен
      userName = 'Максим Карпов';
      break;

    case 283344125:// добавлен
      userName = 'Царьков Cанёк';
      break;

    default:
      userName = `неизвестный id = ${id}`;
  }

  return userName;
}
