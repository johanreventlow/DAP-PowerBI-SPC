import qbinom from "../../src/Functions/qbinom";

// Reference values computed via R 4.5.2:
//   qbinom(0.05, n - 1, 0.5) for n in {10, 20, 50, 100, 500, 1000}
// These values lock the implementation against R's qbinom for the
// Anhøj few-crossings use-case (n_useful - 1 trials, prob = 0.5).
describe("qbinom", () => {
    describe("R-reference parity (prob = 0.5)", () => {
        it("matches R: qbinom(0.05, 9, 0.5) === 2", () => {
            expect(qbinom(0.05, 9, 0.5)).toBe(2);
        });

        it("matches R: qbinom(0.05, 19, 0.5) === 6", () => {
            expect(qbinom(0.05, 19, 0.5)).toBe(6);
        });

        it("matches R: qbinom(0.05, 49, 0.5) === 19", () => {
            expect(qbinom(0.05, 49, 0.5)).toBe(19);
        });

        it("matches R: qbinom(0.05, 99, 0.5) === 41", () => {
            expect(qbinom(0.05, 99, 0.5)).toBe(41);
        });

        it("matches R: qbinom(0.05, 499, 0.5) === 231", () => {
            expect(qbinom(0.05, 499, 0.5)).toBe(231);
        });

        it("matches R: qbinom(0.05, 999, 0.5) === 474", () => {
            expect(qbinom(0.05, 999, 0.5)).toBe(474);
        });
    });

    describe("edge cases", () => {
        it("returns 0 when n = 0", () => {
            expect(qbinom(0.5, 0, 0.5)).toBe(0);
        });

        it("returns 0 when prob = 0", () => {
            expect(qbinom(0.5, 10, 0)).toBe(0);
        });

        it("returns n when prob = 1", () => {
            expect(qbinom(0.5, 10, 1)).toBe(10);
        });

        it("handles small p (low quantile)", () => {
            // qbinom(0.001, 99, 0.5) = 34 (R reference)
            expect(qbinom(0.001, 99, 0.5)).toBe(34);
        });

        it("handles p close to 1 (upper quantile)", () => {
            // qbinom(0.95, 19, 0.5) = 13 (R reference)
            expect(qbinom(0.95, 19, 0.5)).toBe(13);
        });
    });

    describe("input validation", () => {
        it("throws RangeError for p = 0", () => {
            expect(() => qbinom(0, 10, 0.5)).toThrowError(RangeError);
        });

        it("throws RangeError for p = 1", () => {
            expect(() => qbinom(1, 10, 0.5)).toThrowError(RangeError);
        });

        it("throws RangeError for negative n", () => {
            expect(() => qbinom(0.5, -1, 0.5)).toThrowError(RangeError);
        });

        it("throws RangeError for non-integer n", () => {
            expect(() => qbinom(0.5, 1.5, 0.5)).toThrowError(RangeError);
        });

        it("throws RangeError for prob outside [0, 1]", () => {
            expect(() => qbinom(0.5, 10, 1.5)).toThrowError(RangeError);
            expect(() => qbinom(0.5, 10, -0.1)).toThrowError(RangeError);
        });

        it("throws RangeError for NaN inputs", () => {
            expect(() => qbinom(NaN, 10, 0.5)).toThrowError(RangeError);
            expect(() => qbinom(0.5, 10, NaN)).toThrowError(RangeError);
        });
    });
});
