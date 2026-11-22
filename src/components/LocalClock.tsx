import { useEffect, useState } from 'react'

const ZONE = 'America/Toronto'

function read() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date())
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00'
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00'
  return { hour, minute }
}

/** What time it is for Peter, so a visitor knows whether a reply is likely soon. */
export function LocalClock() {
  const [now, setNow] = useState(read)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(read()), 15_000)
    return () => window.clearInterval(timer)
  }, [])

  const h = Number(now.hour)
  const guess = h < 7 ? 'probably asleep' : h >= 23 ? 'should be asleep' : 'probably awake'

  return (
    <p className="contact-clock">
      <span className="sr-only">{`It is ${now.hour}:${now.minute} for me right now, so I am ${guess}.`}</span>
      <span aria-hidden="true">
        <span className="contact-clock-time">
          {now.hour}
          <span className="contact-clock-colon">:</span>
          {now.minute}
        </span>{' '}
        my time, {guess}
      </span>
    </p>
  )
}
