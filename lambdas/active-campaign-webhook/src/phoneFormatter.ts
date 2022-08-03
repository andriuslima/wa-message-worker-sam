import parsePhoneNumber from 'libphonenumber-js';

export class PhoneFormatter {
  format(phone: string): string {
    const formattedPhone = phone.length === 8 ? '9' + phone : phone;
    const phoneNumber = parsePhoneNumber(formattedPhone, 'BR')?.format('E.164').replace('+', '');

    if (!phoneNumber) {
      throw Error('Parse phone number resulted in undefined string');
    }

    return phoneNumber;
  }
}
