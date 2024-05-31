import { stateApplication } from '../../const/const.js';

class StateManager {
  constructor() {
    this.state = {};
  }

  setState(userId, newState) {
    this.state[userId] = newState;
  }

  getState(userId) {
    return this.state[userId] || stateApplication.default;
  }

  resetState(userId) {
    this.state[userId] = stateApplication.default;
  }

  // Additional methods can be added as needed
}

const stateManagerApp = new StateManager();
export default stateManagerApp;
