import { encrypt, decrypt, SjclCipherEncrypted, cipher } from 'sjcl'

export default function locker(password: string) {
  const encryptMemo: { [key: string]: any } = {}
  const decryptMemo: { [key: string]: string } = {}
  return {
    encrypt(value: string) {
      if (!encryptMemo[value]) {
        encryptMemo[value] = encrypt(password, value)
      }

      return encryptMemo[value]
    },
    decrypt(ciphertext: any) {
      if (!decryptMemo[ciphertext]) {
        decryptMemo[ciphertext] = decrypt(password, ciphertext)
      }
      return decryptMemo[ciphertext]
    },
  }
}
