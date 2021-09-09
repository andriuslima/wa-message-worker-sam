import parsePhoneNumber from 'libphonenumber-js';

export class Formatter {
  phPrefix = '{';
  phSuffix = '}';

  hasPlaceholders(message: string): boolean {
    const matches = message.match(new RegExp(this.phPrefix + '\\w+' + this.phSuffix, 'g'));
    return matches !== null && matches.length > 0;
  }

  replace(data: string[], str = ''): string {
    Object.keys(data).forEach((key) => {
      const regexp = new RegExp(this.phPrefix + key + this.phSuffix, 'g');
      const value = data[key] || 'N/A';
      str = str.replace(regexp, value);
    });

    return str;
  }

  phone(phone: string): string {
    const formattedPhone = phone.length === 8 ? '9' + phone : phone;
    const phoneNumber = parsePhoneNumber(formattedPhone, 'BR')?.format('E.164').replace('+', '');

    if (!phoneNumber) {
      throw Error('Parse phone number resulted in undefined string');
    }

    return phoneNumber;
  }
}
