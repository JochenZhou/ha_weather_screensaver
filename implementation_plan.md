# Implementation Plan - Enhanced Weather Visuals

## Goal
Upgrade the `SmartDisplay` component to support "Pro" level weather effects, specifically:
1.  **Yellow Crescent Moon**: Replace the current moon with a golden/yellow crescent.
2.  **Weather Intensity**: Distinguish between Light, Moderate, Heavy, and Storm conditions for Rain and Snow.
3.  **Dynamic Backgrounds**: Ensure every weather state has an appropriate, high-quality background gradient.

## User Review Required
> [!NOTE]
> I will be modifying the `normalizeWeatherState` function to return more granular states (e.g., `HEAVY_RAIN` instead of just `RAIN`). This might affect other parts of the app if they rely on the generic keys, but currently, only `WeatherBackground` and `getWeatherIcon` seem to use them, which I will also update.

## Proposed Changes

### `src/components/SmartDisplay.jsx`

#### [MODIFY] `normalizeWeatherState`
-   Update logic to preserve intensity prefixes (`light_`, `moderate_`, `heavy_`, `storm_`) instead of flattening them.
-   Ensure fallback to generic types if specific ones aren't found.

#### [MODIFY] `WeatherBackground` component
-   **`getGradient`**: Add specific cases for:
    -   `STORM_*`: Darker, more purple/deep blue gradients.
    -   `HEAVY_*`: Deeper tones than moderate.
    -   `LIGHT_*`: Lighter, airier tones.
    -   `DUST`/`SAND`: Orange/brownish misty gradients.
-   **`renderCelestialBody`**:
    -   Update `CLEAR_NIGHT` to render a **Yellow Crescent Moon** using updated CSS gradients/shapes.
-   **`renderPrecipitation`**:
    -   Refactor to accept `intensity` (derived from weather key).
    -   **Light**: 20-30 particles, slow speed.
    -   **Moderate**: 60 particles, normal speed.
    -   **Heavy**: 100+ particles, fast speed.
    -   **Storm**: 150+ particles, very fast, high wind angle.
-   **`renderClouds`**:
    -   Adjust cloud opacity and count based on weather type (e.g., `OVERCAST` vs `PARTLY_CLOUDY`).

#### [MODIFY] `SmartDisplay` (Demo Section)
-   Ensure the demo dropdown includes all the new granular weather keys for easy verification.

## Verification Plan

### Manual Verification
1.  **Run Development Server**: `npm run dev`
2.  **Use Demo Mode**:
    -   Toggle "Demo Mode" ON.
    -   Select **Clear Night**: Verify the moon is now a yellow crescent.
    -   Select **Light Rain**: Verify light rain particles.
    -   Select **Heavy Rain**: Verify heavy rain particles and darker background.
    -   Select **Storm**: Verify intense rain, lightning, and dark background.
    -   Select **Snow** variants: Verify similar intensity differences.
    -   Select **Dust/Sand**: Verify the specific background color.
