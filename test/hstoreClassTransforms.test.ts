import {
  stringSecondsTimestampToDate,
  stringToBoolean,
  stringToDate,
} from '../src/utils/hstoreClassTransforms';

describe('hstoreClassTransforms', () => {
  describe('stringToBoolean', () => {
    it('transforms a string to a boolean', () => {
      expect(stringToBoolean({ value: 'true' })).toEqual(true);
      expect(stringToBoolean({ value: 'false' })).toEqual(false);
      expect(stringToBoolean({ value: null })).toEqual(null);
    });
  });

  describe('stringToDate', () => {
    it('transforms a string to a date', () => {
      expect(stringToDate({ value: '2020-01-01' })).toEqual(
        new Date('2020-01-01'),
      );
      expect(stringToDate({ value: '2023-05-19T20:40:08.481Z' })).toEqual(
        new Date('2023-05-19T20:40:08.481Z'),
      );
      expect(stringToDate({ value: null })).toEqual(null);
    });
  });

  describe('stringSecondsTimestampToDate', () => {
    it('transforms a second timestamp string to a Date', () => {
      expect(stringSecondsTimestampToDate({ value: '1684528988' })).toEqual(
        new Date('2023-05-19T20:43:08.000Z'),
      );
      expect(stringSecondsTimestampToDate({ value: null })).toEqual(null);
    });
  });
});
