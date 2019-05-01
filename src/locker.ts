import sjcl from 'sjcl'

type EncryptedData = string | object | number
type DecryptedData = string | object | number | null

type Locker = {
  encrypt: (data: DecryptedData) => EncryptedData
  decrypt: (encryptedData: EncryptedData) => DecryptedData
  isEncrypted: boolean
  creationDate?: Date
}

export function createLocker({
  password,
  encryptedCipherBase64String,
}: LockerParams): Locker {
  if (encryptedCipherBase64String) {
    if (!password) throw 'Password is required'

    const passwordHash = hash(password)
    const encryptedCipherString = atob(encryptedCipherBase64String)

    let encryptedCipher: sjcl.SjclCipherEncrypted

    try {
      encryptedCipher = JSON.parse(encryptedCipherString)
    } catch (e) {
      throw 'Invalid Cipher'
    }

    const { salt, iv } = encryptedCipher

    try {
      const {
        validationHash,
        creationDate,
        numberObfuscationOffset,
      } = JSON.parse(sjcl.decrypt(passwordHash, encryptedCipherString))

      if (hash(passwordHash) !== validationHash) {
        throw 'Invalid Cipher Contents'
      }

      return {
        encrypt(data) {
          let value = data
          if (typeof value === 'number') {
            return value - numberObfuscationOffset
          }
          const dataString = JSON.stringify({ value })

          const encryptedCipherData = String(
            sjcl.encrypt(passwordHash, dataString, { salt, iv })
          )

          const { ct } = JSON.parse(encryptedCipherData)

          return ct
        },

        decrypt(encryptedData) {

          if (typeof encryptedData === 'number') {
            return encryptedData + numberObfuscationOffset
          }

          const decryptedMessageString = sjcl.decrypt(
            passwordHash,
            JSON.stringify({ ct: encryptedData }),
            {
              salt,
              iv,
            }
          )

          const { value } = JSON.parse(decryptedMessageString)

          return value
        },

        isEncrypted: true,

        creationDate: new Date(creationDate),
      }
    } catch (e) {
      throw 'Incorrect password'
    }
  }
  return {
    encrypt: data => data,
    decrypt: encryptedData => encryptedData,
    isEncrypted: false,
  }
}

export function createValidationCipher(newPassword: string): string {
  if (!newPassword) throw 'Cannot generate cipher without a password'

  const passwordHash = hash(newPassword)
  const DATE_OBFUSCATION_MAX = Date.now() - new Date('2017/10/1').getTime()

  const cipherContents = {
    creationDate: Date.now(),
    numberObfuscationOffset: Math.floor((Math.random() * DATE_OBFUSCATION_MAX)),
    validationHash: hash(passwordHash),
  }

  const encryptedCipher = String(
    // this automatically generates random salt and random IV, and returns an object with these values
    sjcl.encrypt(
      passwordHash,
      JSON.stringify(cipherContents)
    ) as sjcl.SjclCipherEncrypted
  )

  return btoa(encryptedCipher)
}

function hash(data: string): string {
  const hashBits = sjcl.hash.sha256.hash(data)
  return sjcl.codec.hex.fromBits(hashBits)
}

type LockerParams = {
  password?: string
  encryptedCipherBase64String?: string
}
