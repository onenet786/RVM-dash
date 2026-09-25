import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Image,
  Easing,
  Platform,
} from 'react-native';
import recycleImg from '../assets/images/recycle.png';

const { width, height } = Dimensions.get('window');

const SmartSplashScreen = ({ isReady = true, onFinish }) => {
  // Animation values
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const containerScale = useRef(new Animated.Value(1)).current;

  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(24)).current;

  const pulseRing1 = useRef(new Animated.Value(1)).current;
  const pulseOpacity1 = useRef(new Animated.Value(0.6)).current;

  const pulseRing2 = useRef(new Animated.Value(1)).current;
  const pulseOpacity2 = useRef(new Animated.Value(0.4)).current;

  const progressAnim = useRef(new Animated.Value(0)).current;
  const orbScale = useRef(new Animated.Value(1)).current;

  const [statusMessage, setStatusMessage] = useState('Initializing Smart Eco Engine...');

  useEffect(() => {
    // 1. Entrance animation for the logo
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 45,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Entrance for title & subtitles
    Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 800,
        delay: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Ambient Breathing Orb
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbScale, {
          toValue: 1.25,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(orbScale, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 4. Looping Pulse Wave 1
    Animated.loop(
      Animated.parallel([
        Animated.timing(pulseRing1, {
          toValue: 1.55,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity1, {
          toValue: 0,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 5. Looping Pulse Wave 2 (delayed offset)
    const ring2Timer = setTimeout(() => {
      Animated.loop(
        Animated.parallel([
          Animated.timing(pulseRing2, {
            toValue: 1.75,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity2, {
            toValue: 0,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 600);

    // 6. Smooth Progress Bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    // 7. Dynamic high-tech status steps
    const t1 = setTimeout(() => setStatusMessage('Connecting to Smart Kiosks...'), 700);
    const t2 = setTimeout(() => setStatusMessage('Synchronizing Eco Credentials...'), 1400);
    const t3 = setTimeout(() => setStatusMessage('Ready • Welcome to Smart Recycling'), 1900);

    // 8. Exit transition after minimum display time
    const exitTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 450,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(containerScale, {
          toValue: 1.05,
          duration: 450,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onFinish) onFinish();
      });
    }, 2400);

    return () => {
      clearTimeout(ring2Timer);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(exitTimer);
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.fullScreen,
        {
          opacity: containerOpacity,
          transform: [{ scale: containerScale }],
        },
      ]}
      pointerEvents="none"
    >
      <StatusBar
        backgroundColor="#061811"
        barStyle="light-content"
        translucent
      />

      {/* Ambient background glowing orbs */}
      <Animated.View
        style={[
          styles.ambientOrb,
          {
            transform: [{ scale: orbScale }],
          },
        ]}
      />
      <View style={styles.ambientOrbSecondary} />

      {/* Main Center Content */}
      <View style={styles.centerContainer}>
        {/* Animated Pulse Rings & Logo Emblem */}
        <View style={styles.emblemContainer}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseRing2 }],
                opacity: pulseOpacity2,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseRing1 }],
                opacity: pulseOpacity1,
              },
            ]}
          />

          <Animated.View
            style={[
              styles.logoCircle,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Image
              source={recycleImg}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* Brand Titles & Tagline */}
        <Animated.View
          style={[
            styles.brandBlock,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <View style={styles.badgePill}>
            <View style={styles.badgeLiveDot} />
            <Text style={styles.badgePillText}>REVERSE VENDING NETWORK</Text>
          </View>

          <Text style={styles.titleMain}>
            SMART <Text style={styles.titleHighlight}>RECYCLING</Text>
          </Text>

          <Text style={styles.tagline}>
            Deposit • Earn Rewards • Protect Nature
          </Text>

          {/* High-Tech Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarTrack}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  { width: progressWidth },
                ]}
              />
            </View>
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Institutional & Security Footer */}
      <Animated.View
        style={[
          styles.footerContainer,
          { opacity: textOpacity },
        ]}
      >
        <Text style={styles.partnerHeading}>POWERED BY SMART ECO INITIATIVE</Text>
        <View style={styles.partnerRow}>
          <Text style={styles.partnerTag}>SACEP</Text>
          <Text style={styles.partnerDot}>•</Text>
          <Text style={styles.partnerTag}>WORLD BANK</Text>
          <Text style={styles.partnerDot}>•</Text>
          <Text style={styles.partnerTag}>UNOPS</Text>
          <Text style={styles.partnerDot}>•</Text>
          <Text style={styles.partnerTag}>PLEASE</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.secureBadge}>
            <View style={styles.secureDot} />
            <Text style={styles.secureText}>Eco Cloud Active</Text>
          </View>
          <Text style={styles.versionText}>v2.0.5</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

export default SmartSplashScreen;

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#061811',
    zIndex: 99999,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 50 : 36,
  },
  ambientOrb: {
    position: 'absolute',
    top: height * 0.22,
    alignSelf: 'center',
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: (width * 0.85) / 2,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  ambientOrbSecondary: {
    position: 'absolute',
    bottom: height * 0.15,
    alignSelf: 'center',
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: (width * 0.65) / 2,
    backgroundColor: 'rgba(6, 95, 70, 0.12)',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  emblemContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  pulseRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    borderColor: '#34D399',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  logoCircle: {
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: 'rgba(6, 78, 59, 0.75)',
    borderWidth: 2,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  logoImage: {
    width: 66,
    height: 66,
  },
  brandBlock: {
    alignItems: 'center',
    width: '100%',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
    marginRight: 7,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 1.2,
  },
  titleMain: {
    fontSize: 27,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.8,
    textAlign: 'center',
  },
  titleHighlight: {
    color: '#34D399',
  },
  tagline: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  progressContainer: {
    width: '80%',
    maxWidth: 240,
    alignItems: 'center',
    marginTop: 34,
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 11,
    color: '#6EE7B7',
    marginTop: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  footerContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  partnerHeading: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  partnerTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  partnerDot: {
    fontSize: 11,
    color: '#334155',
    marginHorizontal: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  secureText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  versionText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
});
