export const ICONS = {
  clock: ['🕛', '🕑', '🕒', '🕓', '🕕', '🕖', '🕘', '🕙'],
  love: ['😊', '😍', '😘', '💋', '❤️'],
  story: ['🌞', '🌻', '🌳', '🐦', '🥪', '🏖️', '📚', '🌙', '🛏️'],
};

export function getRandomEmoji() {
  const rndNumber = Math.floor(Math.random() * 3) + 1;
  let emoji;

  switch (rndNumber) {
    case 1:
      emoji = 'clock';
      break;
    case 2:
      emoji = 'love';
      break;
    default:
      emoji = 'love';
      break;
  }

  return emoji;
}

export class Loader {
  constructor(ctx) {
    this.ctx = ctx;
    this.icons = ICONS;
    this.message = null;
    this.interval = null;
  }

  async show() {
    try {
      let index = 0;
      const emoji = getRandomEmoji();

      console.log(this.icons[emoji][index]);

      this.message = await this.ctx.reply(this.icons[emoji][index]);

      this.interval = setInterval(() => {
        index = this.icons.length - 1 <= index ? 0 : index + 1;

        this.ctx.telegram.editMessageText( // метод который позволяет менять сообщение, которое уже существует в чате телеграмма
          this.ctx.chat.id, // чат в котором мы работаем
          this.message.message_id, // сообщение которое мы хотим поменять
          null,
          this.icons[emoji][index],
        );
      }, 1000);
    } catch (err) {
      console.log('Ошибка отображения лоадера - ', err.message);
    }
  }

  hide() {
    try {
      clearInterval(this.interval);
      this.ctx.telegram.deleteMessage(this.ctx.chat.id, this.message.message_id);
    } catch (err) {
      console.log('ошибка в удалении лоадера - ', err.message);
    }
  }
}
