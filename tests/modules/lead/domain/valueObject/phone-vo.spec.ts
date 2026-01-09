import { PhoneVO } from '@modules/lead/domain/valueObject'

describe('PhoneVO', () => {
  describe('create', () => {
    it('should create a phone with valid mobile number (11 digits)', () => {
      const phone = PhoneVO.create('11987654321')

      expect(phone.value).toBe('11987654321')
    })

    it('should create a phone with valid landline number (10 digits)', () => {
      const phone = PhoneVO.create('1134567890')

      expect(phone.value).toBe('1134567890')
    })

    it('should throw an error for invalid phone number', () => {
      expect(() => PhoneVO.create('123')).toThrow('Invalid phone number')
    })

    it('should throw an error for phone number too long', () => {
      expect(() => PhoneVO.create('12345678901234')).toThrow(
        'Invalid phone number'
      )
    })
  })

  describe('isValid', () => {
    it('should return true for valid mobile number (11 digits)', () => {
      expect(PhoneVO.isValid('11987654321')).toBe(true)
    })

    it('should return true for valid landline number (10 digits)', () => {
      expect(PhoneVO.isValid('1134567890')).toBe(true)
    })

    it('should return true for formatted mobile number', () => {
      expect(PhoneVO.isValid('(11) 98765-4321')).toBe(true)
    })

    it('should return true for formatted landline number', () => {
      expect(PhoneVO.isValid('(11) 3456-7890')).toBe(true)
    })

    it('should throw an error for number with less than 10 digits', () => {
      expect(() => PhoneVO.isValid('123456789')).toThrow('Invalid phone number')
    })

    it('should throw an error for number with more than 13 digits', () => {
      expect(() => PhoneVO.isValid('12345678901234')).toThrow(
        'Invalid phone number'
      )
    })

    it('should return true for number matching pattern even with zeros', () => {
      expect(PhoneVO.isValid('00000000000')).toBe(true)
    })
  })

  describe('formatted', () => {
    it('should format mobile number correctly', () => {
      const phone = PhoneVO.create('11987654321')

      expect(phone.formatted()).toBe('(11) 98765-4321')
    })
  })
})
