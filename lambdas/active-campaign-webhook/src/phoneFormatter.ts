import parsePhoneNumber from 'libphonenumber-js';

export class PhoneFormatter {
  format(phone: string): string {
    let formattedPhone = phone;

    // Phone is BR and does not have an 9 in front.
    if (phone.length === 8) {
      formattedPhone = '9' + phone;
    }

    // Phone is BR and has a DDD without a 9.
    if (phone.length === 10) {
      formattedPhone = phone.substring(0, 2) + '9' + phone.substring(2);
    }

    const phoneNumber = parsePhoneNumber(formattedPhone, 'BR')?.format('E.164').replace('+', '');

    if (!phoneNumber) {
      throw Error('Parse phone number resulted in undefined string');
    }

    console.log(`Phone formatted from ${phone} to ${formattedPhone}`);

    return phoneNumber;
  }
}
