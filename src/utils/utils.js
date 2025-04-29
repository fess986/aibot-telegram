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
  return allowedUsersSet.has(id);
}

export function fromWho(id) {
  if (!id) {
    return 'пользователь без id';
  }

  // console.log('Проверяемый id - ', id);

  let userName = '';

  switch (id) {
    case 525755965: // добавлен
      userName = 'Андрей Симкин';
      break;

    case 230201671: // добавлен
      userName = 'Андрей Симкин новый';
      break;

    case 386148581: // добавлен
      userName = 'Максим Карпов';
      break;

    case 283344125: // добавлен
      userName = 'Царьков Cанёк';
      break;

    case 675796197: // добавлен
      userName = 'Есин Вячеслав';
      break;

    case 310804454: // добавлен
      userName = 'Максим Фролов';
      break;

    case 384095037: // добавлен
      userName = 'Роман Комаров';
      break;

    case 1003035110: // добавлен
      userName = 'Маша Комарова';
      break;

    case 5237689093: // добавлен
      userName = 'Маша Царькова';
      break;

    case 5284245542: // добавлен
      userName = 'Серега Королёв';
      break;

    default:
      userName = `неизвестный id = ${id}`;
  }

  return userName;
}

export function getUserId(ctx) {
  return (
    ctx?.message?.from?.id
		?? ctx?.update?.callback_query?.from?.id
		?? ctx?.from?.id
		?? null
  );
}
