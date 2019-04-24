import locker, { createValidationCipher } from './locker'
import faker from 'faker'

describe('locker', () => {

  it('should create a locker without encryption', () => {
    const { decrypt, encrypt, isEncrypted } = locker({})

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

    expect(() => locker({ encryptedCipherBase64String })).toThrow()
    expect(() =>
      locker({ encryptedCipherBase64String, password: 'incorrect password' })
    ).toThrow()
  })

  it('should open the locker with correct password', () => {
    const password = faker.internet.password()

    const encryptedCipherBase64String = createValidationCipher(password)

    const { encrypt, decrypt, isEncrypted, creationDate } = locker({
      encryptedCipherBase64String,
      password,
    })

    const testValue = faker.lorem.sentence()
    const encrypted = encrypt(testValue)

    expect(isEncrypted).toEqual(true)
    expect(creationDate).toBeDefined()
    expect(encrypted).not.toEqual(testValue)
    expect(decrypt(encrypted)).toEqual(testValue)
  })
})
