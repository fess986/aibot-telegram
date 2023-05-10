import { unlink } from 'fs/promises'

// функция для удаления файла по его пути в файловой системе
export default async function removeFile(path) {
  try {
    unlink(path);
  } catch(error) {
    console.log('error deleting file', error.message)
  }
}