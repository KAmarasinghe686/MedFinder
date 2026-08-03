import {
  getCurrentBrowserLocation,
  queryNeedsLocation,
} from './geolocation';

afterEach(() => {
  jest.restoreAllMocks();
});

test.each([
  'Find nearest pharmacy',
  'Which pharmacies are near me?',
  'Show nearby pharmacies',
  'Which pharmacy is open now?',
])('recognizes a location-dependent query: %s', (query) => {
  expect(queryNeedsLocation(query)).toBe(true);
});

test('does not request location for an ordinary medicine question', () => {
  expect(queryNeedsLocation('What is Paracetamol?')).toBe(false);
});

test('returns validated high-accuracy browser coordinates', async () => {
  const getCurrentPosition = jest.fn((success) =>
    success({
      coords: {
        latitude: 7.4697,
        longitude: 80.0402,
        accuracy: 12,
      },
    }),
  );

  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition },
  });
  Object.defineProperty(navigator, 'permissions', {
    configurable: true,
    value: {
      query: jest.fn().mockResolvedValue({ state: 'granted' }),
    },
  });

  await expect(getCurrentBrowserLocation()).resolves.toEqual({
    latitude: 7.4697,
    longitude: 80.0402,
    accuracy: 12,
  });
  expect(getCurrentPosition).toHaveBeenCalledWith(
    expect.any(Function),
    expect.any(Function),
    expect.objectContaining({
      enableHighAccuracy: true,
      maximumAge: 0,
    }),
  );
});
