import { CategoryColorVO } from '@modules/lead/domain/valueObject'

describe('CategoryColorVO', () => {
  describe('create', () => {
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
        const colorVO = CategoryColorVO.create(color)

        expect(colorVO.value).toBe(color)
      })
    })

    it('should normalize color to lowercase', () => {
      const colorVO = CategoryColorVO.create('RED')

      expect(colorVO.value).toBe('red')
    })

    it('should normalize mixed case color', () => {
      const colorVO = CategoryColorVO.create('Blue')

      expect(colorVO.value).toBe('blue')
    })

    it('should throw error for invalid color', () => {
      expect(() => CategoryColorVO.create('invalid')).toThrow(
        'Invalid color. Must be one of:'
      )
    })

    it('should throw error for hex color', () => {
      expect(() => CategoryColorVO.create('#FF0000')).toThrow(
        'Invalid color. Must be one of:'
      )
    })

    it('should throw error for empty string', () => {
      expect(() => CategoryColorVO.create('')).toThrow(
        'Invalid color. Must be one of:'
      )
    })
  })

  describe('default', () => {
    it('should return gray as default color', () => {
      const colorVO = CategoryColorVO.default()

      expect(colorVO.value).toBe('gray')
    })
  })
})
