import sjcl from 'sjcl'

type EncryptedData = string | object
type DecryptedData = string | object | null

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
      const { validationHash, creationDate } = JSON.parse(
        sjcl.decrypt(passwordHash, encryptedCipherString)
      )

      if (hash(passwordHash) !== validationHash) {
        throw 'Invalid Cipher Contents'
      }

      return {
        encrypt(data) {
          const dataString = JSON.stringify({ value: data })

          const encryptedCipherData = String(
            sjcl.encrypt(passwordHash, dataString, { salt, iv })
          )

          const { ct } = JSON.parse(encryptedCipherData)

          return ct
        },

        decrypt(encryptedData) {
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

        creationDate,
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

  const value = {
    creationDate: Date.now(),
    validationHash: hash(passwordHash),
  }

  const encryptedCipher = String(
    // this automatically generates random salt and random IV, and returns an object with these values
    sjcl.encrypt(
      passwordHash,
      JSON.stringify(value)
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
