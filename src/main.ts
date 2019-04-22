import React from 'react'
import { render } from 'react-dom'
import App from './components/App'
import getDatabase from './database'
import faker from 'faker'
import locker from './locker'

async function main() {
  // render(React.createElement(App), document.getElementById('root'));

  const db = await getDatabase()

  console.log({ db })

  const [id, name] = [
    faker.finance.bitcoinAddress(),
    faker.finance.accountName(),
  ]

  // const newWallet = await db.addWallet(id, name);

  // console.log({ newWallet })

  const wallets = await db.getWallets()

  // console.table(wallets)

  // console.table(await db.getWallets())

  const { id: walletId } = wallets[1]

  // console.log({ walletId })

  // db.addTransaction(walletId, id, 'INCOME')

  const transactions = await db.getTransactions(walletId)
  // console.table(transactions)

  db.encryptDatabase('password')

}

main()
