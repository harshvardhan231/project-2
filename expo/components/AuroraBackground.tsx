import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export function AuroraBackground({ children }: { children: React.ReactNode }) {
  const animatedValue1 = useRef(new Animated.Value(0)).current;
  const animatedValue2 = useRef(new Animated.Value(0)).current;
  const animatedValue3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (animatedValue: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation1 = createAnimation(animatedValue1, 60000);
    const animation2 = createAnimation(animatedValue2, 75000);
    const animation3 = createAnimation(animatedValue3, 90000);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, [animatedValue1, animatedValue2, animatedValue3]);

  const blob1Transform = animatedValue1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, width * 0.3, width * 0.1],
  });

  const blob2Transform = animatedValue2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [height * 0.2, height * 0.7, height * 0.1],
  });

  const blob3Transform = animatedValue3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [width * 0.8, width * 0.2, width * 0.9],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        // Happier, warmer base gradient
        colors={["#F0F8FF", "#FFF0F5", "#E6E6FA"]} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.baseGradient}
      />
      
      <Animated.View
        style={[
          styles.blob,
          styles.blob1,
          {
            transform: [
              { translateX: blob1Transform },
              { translateY: animatedValue1.interpolate({
                inputRange: [0, 1],
                outputRange: [0, height * 0.2],
              })},
            ],
          },
        ]}
      >
        <LinearGradient
          // Warm pink/peach for happiness
          colors={["rgba(255, 182, 193, 0.5)", "rgba(255, 182, 193, 0.1)"]}
          style={styles.blobGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.blob,
          styles.blob2,
          {
            transform: [
              { translateX: animatedValue2.interpolate({
                inputRange: [0, 1],
                outputRange: [width * 0.6, width * 0.1],
              })},
              { translateY: blob2Transform },
            ],
          },
        ]}
      >
        <LinearGradient
          // Calming blue
          colors={["rgba(173, 216, 230, 0.5)", "rgba(173, 216, 230, 0.1)"]}
          style={styles.blobGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.blob,
          styles.blob3,
          {
            transform: [
              { translateX: blob3Transform },
              { translateY: animatedValue3.interpolate({
                inputRange: [0, 1],
                outputRange: [height * 0.6, height * 0.3],
              })},
            ],
          },
        ]}
      >
        <LinearGradient
          // Uplifting sunny peach
          colors={["rgba(255, 218, 185, 0.5)", "rgba(255, 218, 185, 0.1)"]}
          style={styles.blobGradient}
        />
      </Animated.View>

      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  baseGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blob: {
    position: "absolute",
    borderRadius: 200,
  },
  blob1: {
    width: 300,
    height: 300,
    top: -100,
    left: -50,
  },
  blob2: {
    width: 250,
    height: 250,
    top: height * 0.3,
    right: -75,
  },
  blob3: {
    width: 200,
    height: 200,
    bottom: -50,
    left: width * 0.2,
  },
  blobGradient: {
    flex: 1,
    borderRadius: 200,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});
