import {
  IdParamDto,
  IdParamDtoValidator
} from '@modules/lead/application/dtos'

describe('IdParamDto', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000'

  describe('validation', () => {
    it('should pass validation with valid UUID', () => {
      const errors = IdParamDtoValidator.validate({ id: validUUID })

      expect(Object.keys(errors)).toHaveLength(0)
    })

    it('should fail when id is empty', () => {
      const errors = IdParamDtoValidator.validate({ id: '' })

      expect(errors.id).toBeDefined()
      expect(errors.id.length).toBeGreaterThan(0)
    })

    it('should fail when id is not a valid UUID', () => {
      const errors = IdParamDtoValidator.validate({ id: 'invalid-uuid' })

      expect(errors.id).toBeDefined()
      expect(errors.id).toContain('Invalid UUID format')
    })

    it('should fail when id is a random string', () => {
      const errors = IdParamDtoValidator.validate({ id: 'abc123' })

      expect(errors.id).toBeDefined()
    })

    it('should fail when id has wrong format', () => {
      const errors = IdParamDtoValidator.validate({
        id: '550e8400-e29b-41d4-a716'
      })

      expect(errors.id).toBeDefined()
    })

    it('should accept UUID v4 format', () => {
      const uuidV4 = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
      const errors = IdParamDtoValidator.validate({ id: uuidV4 })

      expect(Object.keys(errors)).toHaveLength(0)
    })

    it('should accept uppercase UUID', () => {
      const uppercaseUUID = '550E8400-E29B-41D4-A716-446655440000'
      const errors = IdParamDtoValidator.validate({ id: uppercaseUUID })

      expect(Object.keys(errors)).toHaveLength(0)
    })
  })

  describe('constructor', () => {
    it('should create instance with props', () => {
      const dto = new IdParamDto({ id: validUUID })

      expect(dto.id).toBe(validUUID)
    })

    it('should create empty instance without props', () => {
      const dto = new IdParamDto()

      expect(dto.id).toBeUndefined()
    })
  })
})
