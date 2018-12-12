"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const log_1 = require("./utils/log");
class State {
    constructor() {
        this.assets = undefined;
        this.buildHash = undefined;
        this.error = undefined;
        this.isLaunched = false;
        this.universalAppPath = undefined;
        this.updatedAt = undefined;
    }
    update(obj = {}) {
        const time = new Date();
        log_1.log(`[state] state will ${chalk_1.default.green('update')} at %s with:\n%o`, time, obj);
        for (let key in obj) {
            if (this.hasOwnProperty(key)) {
                this[key] = obj[key];
            }
        }
        this.updatedAt = time;
    }
}
exports.State = State;
exports.default = new State();
