/* native-shell renderer: poll playback and push status through the loader host. */
export const activate = (api) => {
  const timer = setInterval(() => {
    void api?.refresh?.();
  }, 1000);
  return () => clearInterval(timer);
};
