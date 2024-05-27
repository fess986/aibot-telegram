// import { DEFAULT_MODEL_STATE } from "../const/const";
import { MODELS } from '../const/const.js';

class StateManager {
  constructor() {
    this.state = {};
  }

  initializeState(userId) {
    if (!this.state[userId]) {
      this.state[userId] = {
        model: MODELS.gpt4o,
        temperature: 0.4,
      };
    }
  }

  getState(userId) {
    this.initializeState(userId); // если нет стейта, создаем
    console.log('Получаем стейт пользователя - ', this.state[userId]);
    return this.state[userId];
  }

  setState(userId, newState) {
    this.initializeState(userId);
    this.state[userId] = { ...this.state[userId], ...newState }; // меняем стейт на newState
  }
}

const stateManager = new StateManager();
export default stateManager;
