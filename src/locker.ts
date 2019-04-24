import sjcl from 'sjcl'

export default function locker({
  password,
  encryptedCipherBase64String,
}: {
  password?: string
  encryptedCipherBase64String?: string
}) {
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
      const { validationHash } = JSON.parse(
        sjcl.decrypt(passwordHash, encryptedCipherString)
      )

      if (hash(passwordHash) !== validationHash) {
        throw 'Invalid Cipher Contents'
      }

      return {
        encrypt(data: string): string {
          const encryptedCipherData = String(
            sjcl.encrypt(passwordHash, data, { salt, iv })
          )

          const { ct } = JSON.parse(encryptedCipherData)

          return ct
        },

        decrypt(ct: string): string {
          const decryptValue = sjcl.decrypt(
            passwordHash,
            JSON.stringify({ ct }),
            {
              salt,
              iv,
            }
          )

          return decryptValue
        },

        isEncrypted: true,
      }
    } catch (e) {
      throw 'Incorrect password'
    }
  }
  return {
    encrypt: (message: string) => message,
    decrypt: (ciphertext: string) => ciphertext,
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
