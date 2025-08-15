import { parseAddressComponents } from './addressHelpers';

describe('parseAddressComponents', () => {
  it('should return empty strings for null/undefined location', () => {
    expect(parseAddressComponents(null)).toEqual({
      city: '',
      state: '',
      postalCode: '',
    });
    expect(parseAddressComponents(undefined)).toEqual({
      city: '',
      state: '',
      postalCode: '',
    });
    expect(parseAddressComponents({})).toEqual({
      city: '',
      state: '',
      postalCode: '',
    });
  });

  it('should return empty strings for location without address', () => {
    const location = { selectedPlace: {} };
    expect(parseAddressComponents(location)).toEqual({
      city: '',
      state: '',
      postalCode: '',
    });
  });

  it('should parse "Street Address, City, State ZIP" format', () => {
    const location = {
      selectedPlace: {
        address: '123 Main St, New York, NY 10001',
      },
    };
    expect(parseAddressComponents(location)).toEqual({
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
    });
  });

  it('should parse "City, State ZIP" format', () => {
    const location = {
      selectedPlace: {
        address: 'Los Angeles, CA 90210',
      },
    };
    expect(parseAddressComponents(location)).toEqual({
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90210',
    });
  });

  it('should parse "City, State" format', () => {
    const location = {
      selectedPlace: {
        address: 'Chicago, IL',
      },
    };
    expect(parseAddressComponents(location)).toEqual({
      city: 'Chicago',
      state: 'IL',
      postalCode: '',
    });
  });

  it('should parse "Street Address, City, State" format', () => {
    const location = {
      selectedPlace: {
        address: '456 Oak Ave, Miami, FL',
      },
    };
    expect(parseAddressComponents(location)).toEqual({
      city: 'Miami',
      state: 'FL',
      postalCode: '',
    });
  });

  it('should parse ZIP+4 format', () => {
    const location = {
      selectedPlace: {
        address: '789 Pine St, Seattle, WA 98101-1234',
      },
    };
    expect(parseAddressComponents(location)).toEqual({
      city: 'Seattle',
      state: 'WA',
      postalCode: '98101-1234',
    });
  });

  it('should parse single city with state', () => {
    const location = {
      selectedPlace: {
        address: 'Boston MA',
      },
    };
    expect(parseAddressComponents(location)).toEqual({
      city: 'Boston',
      state: 'MA',
      postalCode: '',
    });
  });

  it('should parse single city with ZIP', () => {
    const location = {
      selectedPlace: {
        address: 'Denver 80202',
      },
    };
    expect(parseAddressComponents(location)).toEqual({
      city: 'Denver',
      state: '',
      postalCode: '80202',
    });
  });

  it('should handle international addresses', () => {
    const location = {
      selectedPlace: {
        address: 'London, United Kingdom',
      },
    };
    expect(parseAddressComponents(location)).toEqual({
      city: 'London',
      state: 'United Kingdom',
      postalCode: '',
    });
  });

  it('should clean up extra commas and spaces', () => {
    const location = {
      selectedPlace: {
        address: '  San Francisco  ,  CA  ,  94102  ',
      },
    };
    expect(parseAddressComponents(location)).toEqual({
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
    });
  });
});
