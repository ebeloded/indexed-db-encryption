import lf from 'lovefield'
import locker from './locker'

const schemaBuilder = lf.schema.create('yoroi-encryptable', 1)

schemaBuilder
  .createTable('Security')
  .addColumn('id', lf.Type.STRING)
  .addColumn('value', lf.Type.STRING)
  .addPrimaryKey(['id'])

schemaBuilder
  .createTable('Wallets')
  .addColumn('id', lf.Type.STRING)
  .addColumn('name', lf.Type.STRING)
  .addColumn('value', lf.Type.OBJECT)
  .addPrimaryKey(['id'])

const walletEncryptColumns = ['name', 'id']

schemaBuilder
  .createTable('Transactions')
  .addColumn('id', lf.Type.STRING)
  .addColumn('walletId', lf.Type.STRING)
  .addColumn('date', lf.Type.DATE_TIME)
  .addColumn('type', lf.Type.STRING)
  .addPrimaryKey(['id'])
  .addIndex('idxDate', ['date'], false, lf.Order.DESC)
  .addForeignKey('fkWalletId', {
    local: 'walletId',
    ref: 'Wallets.id',
    action: lf.ConstraintAction.CASCADE,
  })

const transactionEncryptColumns = ['id', 'name', 'walletId', 'type']

let dbPromise = schemaBuilder.connect()

export default async function getDatabase(passcode?: string) {
  const db = await dbPromise
  const wallets = db.getSchema().table('Wallets')
  const transactions = db.getSchema().table('Transactions')

  return {
    async addWallet(id: string, name: string) {
      const walletRow = wallets.createRow({
        id,
        name,
      })

      const [savedWallet] = await db
        .insertOrReplace()
        .into(wallets)
        .values([walletRow])
        .exec()

      return savedWallet
    },

    async removeWallet(id: string) {
      return db
        .delete()
        .from(wallets)
        .where(wallets.id.eq(id))
        .exec()
    },

    async getWallets(): Promise<any[]> {
      return db
        .select()
        .from(wallets)
        .exec()
    },

    async addTransaction(walletId: string, id: string, type: string) {
      const transactionRow = transactions.createRow({
        id,
        walletId,
        type,
        date: new Date(),
      })

      const [savedTransaction] = await db
        .insertOrReplace()
        .into(transactions)
        .values([transactionRow])
        .exec()

      return savedTransaction
    },

    async getTransactions(walletId: string) {
      return db
        .select()
        .from(transactions)
        .where(transactions['walletId'].eq(walletId))
        .exec()
    },

    async isEncrypted() {
      return false
    },

    async encryptDatabase(passcode: string) {
      console.log('encryptDatabase', passcode)
      if (!(await this.isEncrypted())) {
        const { encrypt } = locker(passcode)

        const collections = {
          transactions: await db
            .select()
            .from(transactions)
            .exec(),
          wallets: await db
            .select()
            .from(wallets)
            .exec(),
        }

        console.log('collections', collections)

        const encryptedTransactions = collections.transactions.map(
          (transaction: any) => {
            const encryptedTransaction = { ...transaction }
            transactionEncryptColumns.forEach(column => {
              // encryptedTransaction[column] = encrypt(transaction[column])
            })
            console.log({ transaction, encryptedTransaction })
            return encryptedTransaction
          }
        )

        const encryptionTransaction = db.createTransaction()
      }
    },

    async decryptDatabase(key: string) {
      if (await this.isEncrypted()) {
      }
    },
  }
}
