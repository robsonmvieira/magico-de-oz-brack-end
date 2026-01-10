import {
  CreateLeadDto,
  CreateLeadDtoValidator,
  AddressDto
} from '@modules/lead/application/dtos/create-lead.dto'
import { LeadSource } from '@modules/lead/domain/enums'

describe('CreateLeadDto', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000'

  describe('validation', () => {
    it('should pass validation with valid required fields', () => {
      const errors = CreateLeadDtoValidator.validate({
        leadCategoryId: validUUID,
        companyName: 'Empresa ABC LTDA',
        source: LeadSource.MANUAL
      })

      expect(Object.keys(errors)).toHaveLength(0)
    })

    it('should pass validation with all fields', () => {
      const errors = CreateLeadDtoValidator.validate({
        leadCategoryId: validUUID,
        companyName: 'Empresa ABC LTDA',
        source: LeadSource.MANUAL,
        tradeName: 'ABC Tecnologia',
        phone: '11987654321',
        email: 'contato@empresa.com.br',
        website: 'https://www.empresa.com.br',
        address: {
          street: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
          neighborhood: 'Centro',
          latitude: -23.5505,
          longitude: -46.6333
        }
      })

      expect(Object.keys(errors)).toHaveLength(0)
    })

    describe('leadCategoryId validation', () => {
      it('should fail when leadCategoryId is empty', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: '',
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL
        })

        expect(errors['leadCategoryId']).toBeDefined()
      })

      it('should fail when leadCategoryId is not a valid UUID', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: 'invalid-uuid',
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL
        })

        expect(errors['leadCategoryId']).toBeDefined()
      })
    })

    describe('companyName validation', () => {
      it('should fail when companyName is empty', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: '',
          source: LeadSource.MANUAL
        })

        expect(errors['companyName']).toBeDefined()
      })

      it('should fail when companyName is too short', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'A',
          source: LeadSource.MANUAL
        })

        expect(errors['companyName']).toBeDefined()
      })

      it('should fail when companyName is too long', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'A'.repeat(201),
          source: LeadSource.MANUAL
        })

        expect(errors['companyName']).toBeDefined()
      })

      it('should accept companyName with minimum length', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'AB',
          source: LeadSource.MANUAL
        })

        expect(errors['companyName']).toBeUndefined()
      })

      it('should accept companyName with maximum length', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'A'.repeat(200),
          source: LeadSource.MANUAL
        })

        expect(errors['companyName']).toBeUndefined()
      })
    })

    describe('source validation', () => {
      it('should fail when source is empty', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: '' as LeadSource
        })

        expect(errors['source']).toBeDefined()
      })

      it('should fail when source is invalid', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: 'invalid_source' as LeadSource
        })

        expect(errors['source']).toBeDefined()
      })

      it('should accept all valid sources', () => {
        const validSources = Object.values(LeadSource)

        validSources.forEach(source => {
          const errors = CreateLeadDtoValidator.validate({
            leadCategoryId: validUUID,
            companyName: 'Empresa ABC',
            source
          })

          expect(errors['source']).toBeUndefined()
        })
      })
    })

    describe('tradeName validation', () => {
      it('should accept undefined tradeName', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL
        })

        expect(errors['tradeName']).toBeUndefined()
      })

      it('should fail when tradeName is too short', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL,
          tradeName: 'A'
        })

        expect(errors['tradeName']).toBeDefined()
      })

      it('should fail when tradeName is too long', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL,
          tradeName: 'A'.repeat(201)
        })

        expect(errors['tradeName']).toBeDefined()
      })
    })

    describe('phone validation', () => {
      it('should accept undefined phone', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL
        })

        expect(errors['phone']).toBeUndefined()
      })

      it('should accept valid phone with 10 digits', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL,
          phone: '1198765432'
        })

        expect(errors['phone']).toBeUndefined()
      })

      it('should accept valid phone with 11 digits', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL,
          phone: '11987654321'
        })

        expect(errors['phone']).toBeUndefined()
      })

      it('should fail when phone has less than 10 digits', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL,
          phone: '123456789'
        })

        expect(errors['phone']).toBeDefined()
      })

      it('should fail when phone has more than 11 digits', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL,
          phone: '123456789012'
        })

        expect(errors['phone']).toBeDefined()
      })

      it('should fail when phone contains non-digits', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL,
          phone: '(11) 98765-4321'
        })

        expect(errors['phone']).toBeDefined()
      })
    })

    describe('email validation', () => {
      it('should accept undefined email', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL
        })

        expect(errors['email']).toBeUndefined()
      })

      it('should accept valid email', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL,
          email: 'contato@empresa.com.br'
        })

        expect(errors['email']).toBeUndefined()
      })

      it('should fail when email is invalid', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL,
          email: 'invalid-email'
        })

        expect(errors['email']).toBeDefined()
      })
    })

    describe('website validation', () => {
      it('should accept undefined website', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL
        })

        expect(errors['website']).toBeUndefined()
      })

      it('should accept valid website URL', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL,
          website: 'https://www.empresa.com.br'
        })

        expect(errors['website']).toBeUndefined()
      })

      it('should fail when website is invalid', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL,
          website: 'not-a-url'
        })

        expect(errors['website']).toBeDefined()
      })
    })

    describe('address validation', () => {
      it('should accept undefined address', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL
        })

        expect(
          Object.keys(errors).filter(k => k.startsWith('address'))
        ).toHaveLength(0)
      })

      it('should accept valid address with required fields only', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL,
          address: {
            street: 'Rua das Flores, 123',
            city: 'São Paulo',
            state: 'SP'
          }
        })

        expect(
          Object.keys(errors).filter(k => k.startsWith('address'))
        ).toHaveLength(0)
      })

      it('should accept valid address with optional fields', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL,
          address: {
            street: 'Rua das Flores, 123',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01234-567',
            neighborhood: 'Centro',
            latitude: -23.5505,
            longitude: -46.6333
          }
        })

        expect(
          Object.keys(errors).filter(k => k.startsWith('address'))
        ).toHaveLength(0)
      })

      it('should accept valid zipCode formats', () => {
        const validZipCodes = ['01234567', '01234-567']

        validZipCodes.forEach(zipCode => {
          const errors = CreateLeadDtoValidator.validate({
            leadCategoryId: validUUID,
            companyName: 'Empresa ABC',
            source: LeadSource.MANUAL,
            address: {
              street: 'Rua das Flores, 123',
              city: 'São Paulo',
              state: 'SP',
              zipCode
            }
          })

          expect(errors['address.zipCode']).toBeUndefined()
        })
      })

      it('should fail when address.street is empty', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL,
          address: {
            street: '',
            city: 'São Paulo',
            state: 'SP'
          }
        })

        expect(errors['address.street']).toBeDefined()
      })

      it('should fail when address.city is empty', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL,
          address: {
            street: 'Rua das Flores, 123',
            city: '',
            state: 'SP'
          }
        })

        expect(errors['address.city']).toBeDefined()
      })

      it('should fail when address.state is invalid length', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL,
          address: {
            street: 'Rua das Flores, 123',
            city: 'São Paulo',
            state: 'São Paulo'
          }
        })

        expect(errors['address.state']).toBeDefined()
      })

      it('should fail when address.zipCode is invalid format', () => {
        const errors = CreateLeadDtoValidator.validate({
          leadCategoryId: validUUID,
          companyName: 'Empresa ABC',
          source: LeadSource.MANUAL,
          address: {
            street: 'Rua das Flores, 123',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '1234567'
          }
        })

        expect(errors['address.zipCode']).toBeDefined()
      })
    })
  })

  describe('constructor', () => {
    it('should create instance with props', () => {
      const dto = new CreateLeadDto({
        leadCategoryId: validUUID,
        companyName: 'Empresa ABC LTDA',
        source: LeadSource.MANUAL,
        tradeName: 'ABC Tecnologia',
        phone: '11987654321',
        email: 'contato@empresa.com.br',
        website: 'https://www.empresa.com.br',
        address: {
          street: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP'
        }
      })

      expect(dto.leadCategoryId).toBe(validUUID)
      expect(dto.companyName).toBe('Empresa ABC LTDA')
      expect(dto.source).toBe(LeadSource.MANUAL)
      expect(dto.tradeName).toBe('ABC Tecnologia')
      expect(dto.phone).toBe('11987654321')
      expect(dto.email).toBe('contato@empresa.com.br')
      expect(dto.website).toBe('https://www.empresa.com.br')
      expect(dto.address).toBeDefined()
      expect(dto.address?.street).toBe('Rua das Flores, 123')
    })

    it('should create empty instance without props', () => {
      const dto = new CreateLeadDto()

      expect(dto.leadCategoryId).toBeUndefined()
      expect(dto.companyName).toBeUndefined()
      expect(dto.source).toBeUndefined()
    })

    it('should create AddressDto instance for nested address', () => {
      const dto = new CreateLeadDto({
        leadCategoryId: validUUID,
        companyName: 'Empresa ABC',
        source: LeadSource.MANUAL,
        address: {
          street: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP'
        }
      })

      expect(dto.address).toBeInstanceOf(AddressDto)
    })
  })
})
