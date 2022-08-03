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
}
