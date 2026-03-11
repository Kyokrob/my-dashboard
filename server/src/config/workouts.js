export const defaultWorkoutTypes = [
  "Running",
  "Weight Training",
  "HIIT",
  "Swim",
  "Golf range",
  "Golf course",
  "Rest",
];

export const defaultWorkoutTypePrefs = defaultWorkoutTypes.map((label) => ({
  label,
  enabled: true,
}));
