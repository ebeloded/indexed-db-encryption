import React from 'react'
import { render } from 'react-dom'
import App from './components/App'
import getDatabase from './database'
import faker from 'faker'
import locker from './locker'

const uid = () => faker.finance.bitcoinAddress()

async function main() {
  // render(React.createElement(App), document.getElementById('root'));

  const db = await getDatabase('password')

  // console.log({ db })

  // const newWallet = await db.addWallet(uid(), faker.finance.accountName())

  const wallets = await db.getWallets()

  if (wallets.length) {
    console.table(wallets)

    const wallet = wallets[0]

    // db.updateWallet(wallet.uid, {uid: 'uid2', name:'name2'})

    // db.addTransaction(wallet.uid, uid(), 'OTHER')
    // db.addTransaction(wallet.uid, uid(), 'INCOME')
    const transactions = await db.getTransactions(wallet.uid)
    console.table(transactions)
  }

  // db.encryptDatabase('password')
}

main()
