import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

let Accelerometer: any = null;
if (Platform.OS !== "web") {
  try {
    Accelerometer = require("expo-sensors").Accelerometer;
  } catch {}
}

const SHAKE_THRESHOLD = 1.8;
const SHAKE_COOLDOWN = 2000;

export function useShakeDetection(onShake: () => void) {
  const lastShake = useRef(0);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("shake_enabled").then((val) => {
      setEnabled(val !== "false");
    });
  }, []);

  useEffect(() => {
    if (!enabled || !Accelerometer || Platform.OS === "web") return;

    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener(
      (data: { x: number; y: number; z: number }) => {
        const totalForce = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
        const now = Date.now();
        if (totalForce > SHAKE_THRESHOLD && now - lastShake.current > SHAKE_COOLDOWN) {
          lastShake.current = now;
          onShake();
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [enabled, onShake]);

  return enabled;
}
