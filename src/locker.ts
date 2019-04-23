import sjcl from 'sjcl'

const btoa = (s: string) => Buffer.from(s).toString('base64')
const atob = (b64encoded: string) =>
  Buffer.from(b64encoded, 'base64').toString()

export default function locker(
  encryptedCipherBase64String: string = null,
  password: string = null
) {
  console.log({ encryptedCipherBase64: encryptedCipherBase64String, password })
  if (encryptedCipherBase64String !== null) {
    if (!password) throw 'Password is required'

    const encryptedCipherString = atob(encryptedCipherBase64String)

    console.log({ encryptedCipherString }) /*?*/

    let encryptedCipher: sjcl.SjclCipherEncrypted

    try {
      encryptedCipher = JSON.parse(encryptedCipherString)
    } catch (e) {
      throw 'Invalid Cipher'
    }

    const { salt, iv } = encryptedCipher
    try {
      sjcl.decrypt(password, encryptedCipherString)

      return {
        encrypt(data: string): string {
          const encryptedCipherData = String(
            sjcl.encrypt(password, data, { salt, iv })
          )

          const { ct } = JSON.parse(encryptedCipherData)

          return ct
        },
        decrypt(ct: string) {
          const decryptValue = sjcl.decrypt(password, JSON.stringify({ ct }), {
            salt,
            iv,
          })

          return decryptValue
        },
      }
    } catch (e) {
      throw 'Incorrect password'
    }
  }
  return {
    encrypt: (message: string) => message,
    decrypt: (ciphertext: string) => ciphertext,
  }
}

export function createdValidationCipher(newPassword: string): string {
  if (!newPassword) throw 'Cannot generate cipher without a password'
  const value = { creationDate: Date.now() }
  const encryptedCipher = String(
    sjcl.encrypt(newPassword, JSON.stringify(value))
  )
  return btoa(encryptedCipher)
}

// locker(null) /*?*/
// const correctPassword = 'password'
// const validationCipher = createdValidationCipher(correctPassword) /*?*/

// try {
//   locker(validationCipher) /*?*/
// } catch (e) {
//   console.log({ e }) // password required error
// }

// try {
//   locker(validationCipher, 'wrong password') /*?*/
// } catch (e) {
//   console.log({ e }) // incorrect password error
// }

// try {
//   const { encrypt, decrypt } = locker(validationCipher, correctPassword) /*?*/

//   const encrypted = encrypt('some data') /*?*/

//   const decrypted = decrypt(encrypted) /*?*/

//   console.log({ decrypted })
// } catch (e) {
//   console.log({ e })
// }
