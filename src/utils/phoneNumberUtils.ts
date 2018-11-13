
export class PhoneNumberUtils {
    private static phoneNumberRegex: RegExp = /(\+|-|\s|\(|\))+/g;

    public static normalizPhoneNumber(phoneNumber: string): string {
        let stripped: string = phoneNumber.replace(this.phoneNumberRegex, "");

        if (stripped.length > 10) {
            stripped = stripped.substring(0, 10);
        }

        return stripped;
    }
}