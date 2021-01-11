export default function (str: string, data: string[], delimiters: string[]): string {
  Object.keys(data).forEach((key) => {
    const regexp = new RegExp(delimiters[0] + key + delimiters[1], 'g')
    const value = data[key] || 'N/A'

    str = str.replace(regexp, value)
  })

  return str
}
