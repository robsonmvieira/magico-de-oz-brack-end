import { EmailVO } from '@modules/lead/domain/valueObject'

describe('EmailVO', () => {
  describe('create', () => {
    it('should create an email with a valid value', () => {
      const email = EmailVO.create('test@example.com')

      expect(email.value).toBe('test@example.com')
    })

    it('should convert email to lowercase', () => {
      const email = EmailVO.create('TEST@EXAMPLE.COM')

      expect(email.value).toBe('test@example.com')
    })

    it('should throw error for email with leading/trailing whitespace', () => {
      expect(() => EmailVO.create('  test@example.com  ')).toThrow(
        'Invalid email'
      )
    })

    it('should throw an error for invalid email without @', () => {
      expect(() => EmailVO.create('invalid-email')).toThrow('Invalid email')
    })

    it('should throw an error for email without domain', () => {
      expect(() => EmailVO.create('test@')).toThrow('Invalid email')
    })

    it('should throw an error for email without local part', () => {
      expect(() => EmailVO.create('@example.com')).toThrow('Invalid email')
    })

    it('should throw an error for email without TLD', () => {
      expect(() => EmailVO.create('test@example')).toThrow('Invalid email')
    })

    it('should throw an error for email with spaces', () => {
      expect(() => EmailVO.create('test @example.com')).toThrow('Invalid email')
    })
  })

  describe('isValid', () => {
    it('should return true for valid email', () => {
      expect(EmailVO.isValid('user@domain.com')).toBe(true)
    })

    it('should return true for email with subdomain', () => {
      expect(EmailVO.isValid('user@sub.domain.com')).toBe(true)
    })

    it('should return true for email with plus sign', () => {
      expect(EmailVO.isValid('user+tag@domain.com')).toBe(true)
    })

    it('should return true for email with dots in local part', () => {
      expect(EmailVO.isValid('user.name@domain.com')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(EmailVO.isValid('')).toBe(false)
    })

    it('should return false for invalid email', () => {
      expect(EmailVO.isValid('invalid')).toBe(false)
    })
  })
})
