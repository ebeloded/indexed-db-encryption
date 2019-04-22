import React, { useState, useEffect } from 'react'
import getDatabase from '../database'

type AppState = 'LOADING' | 'LOCKED' | 'UNLOCKED'

export default function App() {
  const [state, setState] = useState('LOADING' as AppState)

  useEffect(() => {
    getDatabase()
      .then(db => {
        console.log('created new database', { db })
        setState('UNLOCKED')
      })
      .catch(e => {
        console.log('catch', e)
        setState('LOCKED')
      })
  }, [])

  switch (state) {
    case 'LOADING':
      console.log('show loading screen')
      return <div>Loading</div>
    case 'UNLOCKED':
      console.log('show unlocked screen')
      return <div>Unlocked</div>
    case 'LOCKED':
      console.log('show locked screen')
      return <div>Lock Screen</div>
  }
}
