export const haptics = {
  light:     () => navigator.vibrate?.(10),
  medium:    () => navigator.vibrate?.(25),
  heavy:     () => navigator.vibrate?.(50),
  error:     () => navigator.vibrate?.([30, 20, 30]),
  success:   () => navigator.vibrate?.([10, 10, 10]),
  sideQuest: () => navigator.vibrate?.([20, 10, 20, 10, 60]),
};
