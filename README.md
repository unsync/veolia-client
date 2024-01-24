# veolia-client

### usage

```ts 
const client = new VeoliaClient({
    password: 'string',
    mail: 'string',
    pdl: 'string'
})

// all history
const allEnergyData = await client.getEnergyData(null)

// all history from a date
const partialEnergyData = await client.getEnergyData(dayjs('2024-01-01'))
```