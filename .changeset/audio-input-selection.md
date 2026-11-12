---
"@audiolab/core": minor
"@audiolab/react": minor
---

Choose the audio input. Core: `openMicrophone({ deviceId })` pins an input (`{ exact }`), `listAudioInputs()` lists the capture devices (optionally revealing hidden labels), `findAudioInput()` matches one by id or name while skipping Chrome's `default` / `communications` aliases, `withDeviceId()` merges the id into constraints, and a vanished input fails with the new `device-unavailable` error code. React: `useMicrophone({ deviceId })` reopens the session when the input changes, `useAudioInputs()` lists the inputs and follows `devicechange`, and `InputPicker` is a compact selector for the top bar (the lab now has one).
