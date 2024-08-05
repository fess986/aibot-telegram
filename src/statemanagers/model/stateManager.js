import { DEFAULT_MODEL_STATE } from '../../const/const.js';

class StateManager {
  constructor() {
    this.state = {};
  }

  initializeState(userId) {
    if (!userId) return;

    if (!this.state[userId]) {
      this.state[userId] = {
        model: DEFAULT_MODEL_STATE.model,
        temperature: DEFAULT_MODEL_STATE.temperature,
      };
    }
  }

  getState(userId) {
    this.initializeState(userId); // если нет стейта, создаем
    return this.state[userId];
  }

  setState(userId, newState) {
    this.initializeState(userId);
    this.state[userId] = { ...this.state[userId], ...newState }; // меняем стейт на newState
  }
}

const stateManagerModel = new StateManager();
export default stateManagerModel;
