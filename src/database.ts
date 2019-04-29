import lf from 'lovefield'
import { createLocker, createValidationCipher } from './locker'

// * during migration: increment version
const schemaBuilder = lf.schema.create('yoroi-encryptable', 4)

schemaBuilder
  .createTable('Security')
  .addColumn('id', lf.Type.STRING)
  .addColumn('value', lf.Type.STRING)
  .addPrimaryKey(['id'])

const EncryptionID = 'Encryption'

schemaBuilder
  .createTable('Wallets')
  .addColumn('id', lf.Type.INTEGER)
  .addColumn('uid', lf.Type.STRING)
  .addColumn('name', lf.Type.STRING)
  .addColumn('value', lf.Type.OBJECT)
  .addUnique('uniqueUID', ['uid'])
  .addPrimaryKey(['id'], true)

schemaBuilder
  .createTable('Transactions')
  .addColumn('id', lf.Type.INTEGER)
  .addColumn('uid', lf.Type.STRING)
  .addColumn('walletUid', lf.Type.STRING)
  .addColumn('date', lf.Type.DATE_TIME)
  .addColumn('type', lf.Type.STRING)
  .addPrimaryKey(['id'], true)
  .addUnique('uniqueUID', ['uid'])
  .addIndex('idxDate', ['date'], false, lf.Order.DESC)
  .addForeignKey('fkWalletUid', {
    local: 'walletUid',
    ref: 'Wallets.uid',
    action: lf.ConstraintAction.CASCADE,
  })

let dbPromise = schemaBuilder.connect()

export default async function getDatabase(password?: string) {
  const db = await dbPromise

  //#region Security Check

  const security = db.getSchema().table('Security')

  const [encryption]: any = await db
    .select()
    .from(security)
    .where(security.id.eq(EncryptionID))
    .exec()

  const encryptedCipherBase64String = encryption && encryption.value

  const { decrypt, encrypt, isEncrypted } = createLocker({
    password,
    encryptedCipherBase64String,
  })

  //#endregion

  const wallets = db.getSchema().table('Wallets')
  const transactions = db.getSchema().table('Transactions')

  return {
    async addWallet(uid: string, name: string, value: object = null) {
      const walletRow = wallets.createRow({
        uid: encrypt(uid),
        name: encrypt(name),
        value: encrypt(value),
      })

      const [savedWallet] = await db
        .insertOrReplace()
        .into(wallets)
        .values([walletRow])
        .exec()

      return savedWallet
    },

    async removeWallet(uid: string) {
      return db
        .delete()
        .from(wallets)
        .where(wallets.uid.eq(uid))
        .exec()
    },

    async updateWallet(uid, newProps) {
      return db
        .update(wallets)
        .set(wallets.uid, newProps.uid)
        .set(wallets.name, newProps.name)
        .where(wallets.id.eq(uid))
        .exec()
    },

    async getWallets(): Promise<any[]> {
      const encryptedWallets = await db
        .select()
        .from(wallets)
        .exec()

      return encryptedWallets.map((w: any) => ({
        ...w,
        name: decrypt(w.name),
        uid: decrypt(w.uid),
        value: decrypt(w.value),
      }))
    },

    async addTransaction(walletUid: string, uid: string, type: string) {
      const transactionRow = transactions.createRow({
        uid: encrypt(uid),
        walletUid: encrypt(walletUid),
        type: encrypt(uid),
        date: new Date(),
      })

      const [savedTransaction] = await db
        .insertOrReplace()
        .into(transactions)
        .values([transactionRow])
        .exec()

      return savedTransaction
    },

    async getTransactions(walletUid: string) {
      const encryptedTransactions = await db
        .select()
        .from(transactions)
        .where(transactions['walletUid'].eq(walletUid))
        .exec()

      return encryptedTransactions.map((t: any) => ({
        ...t,
        type: decrypt(t.type),
        uid: decrypt(t.uid),
      }))
    },

    isEncrypted() {
      return isEncrypted
    },

    async encryptDatabase(password: string) {
      const encryptedCipherBase64String = createValidationCipher(password)
      const { encrypt: newEncrypt } = createLocker({
        password,
        encryptedCipherBase64String,
      })
      const decryptEncrypt = v => newEncrypt(decrypt(v))

      const encryptTransaction = db.createTransaction()

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

      console.log({ collections })

      // TODO: investigate whether insertOrReplace has downsides, compared to calling .update(wallets).set([...]).set([...])

      const encryptedWallets = collections.wallets.map((wallet: any) =>
        wallets.createRow({
          ...wallet,
          uid: decryptEncrypt(wallet.uid),
          value: decryptEncrypt(wallet.value),
          name: decryptEncrypt(wallet.name),
        })
      )

      const encryptWalletsQuery = db
        .insertOrReplace()
        .into(wallets)
        .values(encryptedWallets)

      const encryptedTransactions = collections.transactions.map(
        (transaction: any) =>
          transactions.createRow({
            ...transaction,
            uid: decryptEncrypt(transaction.uid),
            type: decryptEncrypt(transaction.type),
          })
      )

      const encryptTransactionsQuery = db
        .insertOrReplace()
        .into(transactions)
        .values(encryptedTransactions)

      const updateSecurityRecordsQuery = db
        .insertOrReplace()
        .into(security)
        .values([
          security.createRow({
            id: EncryptionID,
            value: encryptedCipherBase64String,
          }),
        ])

      await updateSecurityRecordsQuery.exec()

      await encryptTransaction.exec([
        encryptWalletsQuery,
        encryptTransactionsQuery,
        updateSecurityRecordsQuery,
      ])

      const encryptedCollections = {
        transactions: await db
          .select()
          .from(transactions)
          .exec(),
        wallets: await db
          .select()
          .from(wallets)
          .exec(),
      }

      console.log({ encryptedCollections })
    },

    async decryptDatabase(password: string) {
      if (this.isEncrypted()) {
      }
    },
  }
}
