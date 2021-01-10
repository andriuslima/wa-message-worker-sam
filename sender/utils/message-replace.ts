export default function (str: string, data: Map<string, string>, delimiter = ['{{ ', ' }}']): string {
  Object.keys(data).forEach((key) => {
    const regexp = new RegExp(delimiter[0] + key + delimiter[1], 'g')
    const value = data.get(key) || 'N/A'

    str = str.replace(regexp, value)
  })

  return str
}
