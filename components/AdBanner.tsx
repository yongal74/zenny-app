import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AdBannerProps {
  variant?: "small" | "medium";
}

export function AdBanner({ variant = "small" }: AdBannerProps) {
  return (
    <View style={[styles.container, variant === "medium" && styles.containerMedium]}>
      <View style={styles.inner}>
        <View style={styles.adLabel}>
          <Text style={styles.adLabelText}>AD</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Your Ad Here</Text>
          <Text style={styles.desc}>Promote wellness products & services</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#B0ABC0" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 14,
    backgroundColor: "#F5F1FF",
    borderWidth: 1,
    borderColor: "#EDE8F5",
    overflow: "hidden",
  },
  containerMedium: {
    marginHorizontal: 0,
    marginVertical: 12,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  adLabel: {
    backgroundColor: "#D8D2EA",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adLabelText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#7C6DC5",
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2D2B3D",
  },
  desc: {
    fontSize: 11,
    color: "#9B97B0",
    marginTop: 1,
  },
});
