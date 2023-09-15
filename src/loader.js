export class Loader {
  constructor(ctx) {
    this.ctx = ctx;
    this.icons = ['🕛', '🕑', '🕒', '🕓', '🕕', '🕖', '🕘', '🕙'];
    this.message = null;
    this.interval = null;
  }

  async show() {
    try {
      let index = 0;
      this.message = await this.ctx.reply(this.icons[index]);

      this.interval = setInterval(() => {
        index = this.icons.length - 1 <= index ? 0 : index + 1;
        // index = index < this.icons.length - 1 ? index + 1 : 0
        console.log(index);

        this.ctx.telegram.editMessageText( // метод который позволяет менять сообщение, которое уже существует в чате телеграмма
          this.ctx.chat.id, // чат в котором мы работаем
          this.message.message_id, // сообщение которое мы хотим поменять
          null,
          this.icons[index],
        );
      }, 500);
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
