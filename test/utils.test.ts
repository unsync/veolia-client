import { expect, it } from '@jest/globals'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone.js'
import utc from 'dayjs/plugin/utc.js'

dayjs.extend(utc)
dayjs.extend(timezone)

it('should get date', async () => {
  // regexp to extract date from string
  const date = '2023-10-26T00:00:00+02:00'
  const dateRegex = /(\d{4}-\d{2}-\d{2})T.*/
  const res = dateRegex.exec(date)?.[1]

  expect(res).toEqual('2023-10-26')
})
