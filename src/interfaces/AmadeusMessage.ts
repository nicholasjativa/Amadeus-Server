export interface AmadeusMessage {
    amadeusId: string;
    fromPhoneNumber: string;
    toPhoneNumber: string;
    textMessageBody: string;
    phone_num_clean: string;
    timestamp: number;
    userId: number;
    msgid_phone_db?: string;
}