"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PhoneNumberUtils {
    static normalizPhoneNumber(phoneNumber) {
        let stripped = phoneNumber.replace(this.phoneNumberRegex, "");
        if (stripped.length > 10) {
            stripped = stripped.substring(0, 10);
        }
        return stripped;
    }
}
PhoneNumberUtils.phoneNumberRegex = /(\+|-|\s|\(|\))+/g;
exports.PhoneNumberUtils = PhoneNumberUtils;
//# sourceMappingURL=phoneNumberUtils.js.map