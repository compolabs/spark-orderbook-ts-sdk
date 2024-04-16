"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getUnixTime(time) {
    const date = new Date(time);
    return Math.floor(date.getTime() / 1000);
}
exports.default = getUnixTime;
//# sourceMappingURL=getUnixTime.js.map