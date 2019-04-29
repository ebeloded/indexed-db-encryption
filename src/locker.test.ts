import { createLocker, createValidationCipher } from './locker'
import faker from 'faker'

describe('locker', () => {
  it('should create a locker without encryption', () => {
    const { decrypt, encrypt, isEncrypted } = createLocker({})

    const value = faker.lorem.sentence()

    expect(isEncrypted).toEqual(false)
    expect(encrypt(value)).toEqual(value)
    expect(decrypt(value)).toEqual(value)
  })

  it('should fail to create validation cipher without password', () => {
    expect(() => createValidationCipher('')).toThrow()
    expect(() => createValidationCipher(null)).toThrow()
  })

  it('should create validation cipher with a password', () => {
    const password = faker.internet.password()

    const validationCipher = createValidationCipher(password)

    expect(validationCipher).toBeDefined()

    const cipherJSON = JSON.parse(atob(validationCipher))

    expect(cipherJSON).toHaveProperty('salt')
    expect(cipherJSON).toHaveProperty('iv')
  })

  it('should fail to create locker without a password or with incorrect password', () => {
    const password = 'password'

    const encryptedCipherBase64String = createValidationCipher(password)

    expect(() =>
      createLocker({ encryptedCipherBase64String, password: undefined })
    ).toThrow()

    expect(() =>
      createLocker({
        encryptedCipherBase64String,
        password: 'incorrect password',
      })
    ).toThrow()
  })

  it('should create the locker with correct password', () => {
    const password = faker.internet.password()

    const encryptedCipherBase64String = createValidationCipher(password)

    const { isEncrypted, creationDate } = createLocker({
      encryptedCipherBase64String,
      password,
    })

    expect(isEncrypted).toEqual(true)
    expect(creationDate).toBeDefined()
  })

  describe('encryption/decryption', () => {
    let encrypt, decrypt

    beforeAll(() => {
      const password = faker.internet.password()

      const encryptedCipherBase64String = createValidationCipher(password)

      const locker = createLocker({
        encryptedCipherBase64String,
        password,
      })
      ;(encrypt = locker.encrypt), (decrypt = locker.decrypt)
    })

    it('should decrypt/encrypt string values', () => {
      const testValue = faker.lorem.sentence()
      const encrypted = encrypt(testValue)

      expect(encrypted).not.toEqual(testValue)
      expect(decrypt(encrypted)).toEqual(testValue)
    })

    it('should decrypt/encrypt objects and nulls', () => {
      const testObject = {
        string: faker.lorem.sentence(),
        number: 123,
        anotherObject: { x: 'asdf' },
      }

      const encrypted = encrypt(testObject)

      expect(encrypted).not.toEqual(testObject)
      expect(decrypt(encrypted)).toEqual(testObject)

      expect(decrypt(encrypt(null))).toEqual(null)
    })
  })
})
