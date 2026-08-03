const LOCATION_QUERY_PATTERN =
  /\b(near me|nearby|nearest|closest|distance|directions?|around me|open now)\b/i;

const locationErrorMessage = (error) => {
  if (error?.code === 1) {
    return 'Location permission is blocked. Click the tune/site icon beside the address bar, allow Location, then try again.';
  }
  if (error?.code === 2) {
    return 'Your current location is unavailable. Check that device location services are turned on and try again.';
  }
  if (error?.code === 3) {
    return 'Location detection timed out. Move to an area with a better GPS or network signal and try again.';
  }

  return error?.message || 'Unable to determine your current location.';
};

export const queryNeedsLocation = (query) =>
  LOCATION_QUERY_PATTERN.test(String(query || ''));

export const getCurrentBrowserLocation = async () => {
  if (!window.isSecureContext && window.location.hostname !== 'localhost') {
    throw new Error('Location requires HTTPS. Open MedFinder using a secure HTTPS address.');
  }

  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by this browser.');
  }

  if (navigator.permissions?.query) {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'denied') {
        const deniedError = new Error();
        deniedError.code = 1;
        throw deniedError;
      }
    } catch (error) {
      if (error?.code === 1) {
        throw new Error(locationErrorMessage(error));
      }
      // Some browsers do not support querying geolocation permission.
    }
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude);
        const longitude = Number(position.coords.longitude);

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180
        ) {
          reject(new Error('The browser returned invalid location coordinates.'));
          return;
        }

        resolve({
          latitude,
          longitude,
          accuracy: Number(position.coords.accuracy) || null,
        });
      },
      (error) => reject(new Error(locationErrorMessage(error))),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  });
};
