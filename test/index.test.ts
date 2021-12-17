import { sum } from "../src/index"

describe('sum', () => {
    it('should calculate sum', () => {
        expect(sum(1,2)).toBe(3)
    })
})