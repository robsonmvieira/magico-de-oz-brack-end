import {
  CreateLeadCategoryDto,
  CreateLeadCategoryDtoValidator
} from '@modules/lead/application/dto'

describe('CreateLeadCategoryDto', () => {
  describe('validation', () => {
    it('should pass validation with valid required fields', () => {
      const errors = CreateLeadCategoryDtoValidator.validate({
        name: 'Marketing Digital'
      })

      expect(Object.keys(errors)).toHaveLength(0)
    })

    it('should pass validation with all fields', () => {
      const errors = CreateLeadCategoryDtoValidator.validate({
        name: 'Marketing Digital',
        description: 'Leads interested in digital marketing',
        priority: 5,
        scoreBonus: 25,
        keywords: ['marketing', 'digital', 'ads'],
        color: 'blue'
      })

      expect(Object.keys(errors)).toHaveLength(0)
    })

    describe('name validation', () => {
      it('should fail when name is empty', () => {
        const errors = CreateLeadCategoryDtoValidator.validate({
          name: ''
        })

        expect(errors.name).toBeDefined()
        expect(errors.name.length).toBeGreaterThan(0)
      })

      it('should fail when name is too short', () => {
        const errors = CreateLeadCategoryDtoValidator.validate({
          name: 'A'
        })

        expect(errors.name).toBeDefined()
      })

      it('should fail when name is too long', () => {
        const errors = CreateLeadCategoryDtoValidator.validate({
          name: 'A'.repeat(101)
        })

        expect(errors.name).toBeDefined()
      })

      it('should accept name with minimum length', () => {
        const errors = CreateLeadCategoryDtoValidator.validate({
          name: 'AB'
        })

        expect(errors.name).toBeUndefined()
      })

      it('should accept name with maximum length', () => {
        const errors = CreateLeadCategoryDtoValidator.validate({
          name: 'A'.repeat(100)
        })

        expect(errors.name).toBeUndefined()
      })
    })

    describe('description validation', () => {
      it('should accept undefined description', () => {
        const errors = CreateLeadCategoryDtoValidator.validate({
          name: 'Valid Name'
        })

        expect(errors.description).toBeUndefined()
      })

      it('should fail when description is too long', () => {
        const errors = CreateLeadCategoryDtoValidator.validate({
          name: 'Valid Name',
          description: 'A'.repeat(501)
        })

        expect(errors.description).toBeDefined()
      })
    })

    describe('priority validation', () => {
      it('should accept undefined priority', () => {
        const errors = CreateLeadCategoryDtoValidator.validate({
          name: 'Valid Name'
        })

        expect(errors.priority).toBeUndefined()
      })

      it('should accept priority within range', () => {
        for (let i = 1; i <= 5; i++) {
          const errors = CreateLeadCategoryDtoValidator.validate({
            name: 'Valid Name',
            priority: i
          })

          expect(errors.priority).toBeUndefined()
        }
      })

      it('should fail when priority is below minimum', () => {
        const errors = CreateLeadCategoryDtoValidator.validate({
          name: 'Valid Name',
          priority: 0
        })

        expect(errors.priority).toBeDefined()
      })

      it('should fail when priority is above maximum', () => {
        const errors = CreateLeadCategoryDtoValidator.validate({
          name: 'Valid Name',
          priority: 6
        })

        expect(errors.priority).toBeDefined()
      })
    })

    describe('scoreBonus validation', () => {
      it('should accept undefined scoreBonus', () => {
        const errors = CreateLeadCategoryDtoValidator.validate({
          name: 'Valid Name'
        })

        expect(errors.scoreBonus).toBeUndefined()
      })

      it('should accept scoreBonus within range', () => {
        const validValues = [-50, -25, 0, 25, 50]
        validValues.forEach(value => {
          const errors = CreateLeadCategoryDtoValidator.validate({
            name: 'Valid Name',
            scoreBonus: value
          })

          expect(errors.scoreBonus).toBeUndefined()
        })
      })

      it('should fail when scoreBonus is below minimum', () => {
        const errors = CreateLeadCategoryDtoValidator.validate({
          name: 'Valid Name',
          scoreBonus: -51
        })

        expect(errors.scoreBonus).toBeDefined()
      })

      it('should fail when scoreBonus is above maximum', () => {
        const errors = CreateLeadCategoryDtoValidator.validate({
          name: 'Valid Name',
          scoreBonus: 51
        })

        expect(errors.scoreBonus).toBeDefined()
      })
    })

    describe('keywords validation', () => {
      it('should accept undefined keywords', () => {
        const errors = CreateLeadCategoryDtoValidator.validate({
          name: 'Valid Name'
        })

        expect(errors.keywords).toBeUndefined()
      })

      it('should accept valid keywords array', () => {
        const errors = CreateLeadCategoryDtoValidator.validate({
          name: 'Valid Name',
          keywords: ['marketing', 'digital']
        })

        expect(errors.keywords).toBeUndefined()
      })

      it('should accept empty keywords array', () => {
        const errors = CreateLeadCategoryDtoValidator.validate({
          name: 'Valid Name',
          keywords: []
        })

        expect(errors.keywords).toBeUndefined()
      })

      it('should fail when keyword is too short', () => {
        const errors = CreateLeadCategoryDtoValidator.validate({
          name: 'Valid Name',
          keywords: ['a']
        })

        expect(errors.keywords).toBeDefined()
      })

      it('should fail when keyword is too long', () => {
        const errors = CreateLeadCategoryDtoValidator.validate({
          name: 'Valid Name',
          keywords: ['a'.repeat(51)]
        })

        expect(errors.keywords).toBeDefined()
      })
    })

    describe('color validation', () => {
      it('should accept undefined color', () => {
        const errors = CreateLeadCategoryDtoValidator.validate({
          name: 'Valid Name'
        })

        expect(errors.color).toBeUndefined()
      })

      const validColors = [
        'gray',
        'red',
        'orange',
        'yellow',
        'green',
        'teal',
        'blue',
        'indigo',
        'purple',
        'pink'
      ]

      validColors.forEach(color => {
        it(`should accept valid color: ${color}`, () => {
          const errors = CreateLeadCategoryDtoValidator.validate({
            name: 'Valid Name',
            color: color as any
          })

          expect(errors.color).toBeUndefined()
        })
      })

      it('should fail when color is invalid', () => {
        const errors = CreateLeadCategoryDtoValidator.validate({
          name: 'Valid Name',
          color: 'invalid' as any
        })

        expect(errors.color).toBeDefined()
      })

      it('should fail when color is a hex value', () => {
        const errors = CreateLeadCategoryDtoValidator.validate({
          name: 'Valid Name',
          color: '#FF0000' as any
        })

        expect(errors.color).toBeDefined()
      })
    })
  })

  describe('constructor', () => {
    it('should create instance with props', () => {
      const dto = new CreateLeadCategoryDto({
        name: 'Test Category',
        description: 'Test description',
        priority: 3,
        scoreBonus: 10,
        keywords: ['test'],
        color: 'blue'
      })

      expect(dto.name).toBe('Test Category')
      expect(dto.description).toBe('Test description')
      expect(dto.priority).toBe(3)
      expect(dto.scoreBonus).toBe(10)
      expect(dto.keywords).toEqual(['test'])
      expect(dto.color).toBe('blue')
    })

    it('should create empty instance without props', () => {
      const dto = new CreateLeadCategoryDto()

      expect(dto.name).toBeUndefined()
    })
  })
})
