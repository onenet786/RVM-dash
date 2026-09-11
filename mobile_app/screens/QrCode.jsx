import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  ToastAndroid,
  SafeAreaView,
  StatusBar,
  PermissionsAndroid,
  Platform,
  Linking,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const { width } = Dimensions.get('window');

export default function QrCode({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionInput, setSessionInput] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [manualPhone, setManualPhone] = useState('');
  const [activeKioskSession, setActiveKioskSession] = useState(null);
  const webViewRef = useRef(null);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'Eco App needs camera access to scan QR codes on the kiosk screen.',
            buttonNeutral: 'Ask Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'Allow',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Camera permission request error:', err);
        return false;
      }
    }
    return true;
  };

  const handleOpenScanner = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        'Camera Permission Needed',
        'Please grant camera permission to scan kiosk screen QR codes, or enter your session PIN manually below.'
      );
      return;
    }
    setShowScannerModal(true);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        setCurrentUser(u);
        setManualPhone(u.mobile || u.phone || u.username || '');
      }
    } catch (err) {
      console.error('Error loading user in QrCode:', err);
    }
  };

  // Helper to extract startToken from raw scanned URL or string
  const parseStartToken = (scannedText) => {
    if (!scannedText) return '';
    try {
      if (scannedText.includes('startToken=')) {
        const urlObj = new URL(scannedText);
        return urlObj.searchParams.get('startToken') || '';
      }
    } catch {
      const match = scannedText.match(/[?&]startToken=([^&]+)/);
      if (match && match[1]) return decodeURIComponent(match[1]);
    }
    return '';
  };

  // Helper to extract session ID from raw scanned URL or string
  const parseSessionId = (scannedText) => {
    if (!scannedText) return '';
    try {
      if (scannedText.includes('session=')) {
        const urlObj = new URL(scannedText);
        return urlObj.searchParams.get('session') || '';
      }
    } catch {
      // If not a full URL, try regex
      const match = scannedText.match(/[?&]session=([^&]+)/);
      if (match && match[1]) return decodeURIComponent(match[1]);
    }
    return scannedText.trim();
  };

  const handleStartKiosk = async (startToken) => {
    const phoneToUse = manualPhone.trim() || currentUser?.mobile || currentUser?.phone || currentUser?.username;
    if (!phoneToUse) {
      Alert.alert('Phone Number Required', 'Please enter your mobile phone number or sign in to start recycling.');
      return;
    }

    setClaiming(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/session/kiosk-handshake/claim-start`, {
        startToken,
        mobileNumber: phoneToUse,
        fullName: currentUser?.fullName || currentUser?.username || 'Eco Citizen'
      }, { timeout: 10000 });

      if (res.data && res.data.success) {
        setShowScannerModal(false);
        const machineKey = res.data.machineId || 'RVM-RWP-INIT';
        setActiveKioskSession({
          machineId: machineKey,
          mobileNumber: phoneToUse,
          startedAt: Date.now()
        });
        ToastAndroid?.show('🚀 Kiosk Started! Insert containers now.', ToastAndroid.LONG);
      } else {
        Alert.alert('Activation Failed', res.data?.error || 'Could not start kiosk session. The QR code may be expired.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Network error activating kiosk.';
      Alert.alert('Activation Error', errMsg);
    } finally {
      setClaiming(false);
    }
  };

  const handleRequestFinish = async () => {
    if (!activeKioskSession) return;
    setClaiming(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/session/kiosk-handshake/request-finish`, {
        machineId: activeKioskSession.machineId,
        mobileNumber: activeKioskSession.mobileNumber
      }, { timeout: 10000 });

      if (res.data && res.data.success) {
        const finishedMachine = activeKioskSession.machineId;
        setActiveKioskSession(null);
        setClaimSuccess({
          points: 0,
          message: `🎉 Kiosk session finished! Machine ${finishedMachine} is saving your containers and crediting points to your wallet.`
        });
        ToastAndroid?.show('🎉 Kiosk session finished! Points credited.', ToastAndroid.LONG);
      } else {
        Alert.alert('Finish Request Failed', res.data?.error || 'Could not send finish signal to kiosk.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Error finishing session.';
      Alert.alert('Finish Error', errMsg);
    } finally {
      setClaiming(false);
    }
  };

  const handleClaim = async (targetSessionId) => {
    const rawId = targetSessionId || sessionInput;
    const token = parseStartToken(rawId);
    if (token) {
      handleStartKiosk(token);
      return;
    }

    const cleanSessionId = parseSessionId(rawId);

    if (!cleanSessionId) {
      Alert.alert('Session Required', 'Please scan a valid RVM QR code or enter the session ID.');
      return;
    }

    const phoneToUse = manualPhone.trim() || currentUser?.mobile || currentUser?.phone || currentUser?.username;
    if (!phoneToUse) {
      Alert.alert('Phone Number Required', 'Please enter your mobile phone number to credit points.');
      return;
    }

    setClaiming(true);
    try {
      // Post claim directly to backend
      const res = await axios.post(`${API_BASE_URL}/session/claim-points`, {
        sessionId: cleanSessionId,
        mobileNumber: phoneToUse,
        fullName: currentUser?.fullName || currentUser?.username || 'Eco Citizen'
      }, { timeout: 10000 });

      if (res.data && res.data.success) {
        setClaimSuccess({
          points: res.data.pointsEarned || 0,
          newBalance: res.data.newPointsBalance,
          message: res.data.message || 'Points credited successfully!'
        });
        setShowScannerModal(false);
        setSessionInput('');
        ToastAndroid?.show('🎉 Points claimed successfully!', ToastAndroid.LONG);
      } else {
        Alert.alert('Claim Failed', res.data?.error || 'Could not claim this session. It may be expired or already claimed.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Network error claiming points.';
      Alert.alert('Claim Error', errMsg);
    } finally {
      setClaiming(false);
    }
  };

  // Embedded Camera QR Scanner rendered directly inside WebView
  const scannerHtml = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0B1329; color: #FFFFFF; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 16px; overflow: hidden; }
    .header { text-align: center; margin-top: 8px; width: 100%; }
    .title { font-size: 17px; font-weight: 800; color: #38BDF8; letter-spacing: 0.5px; }
    .subtitle { font-size: 12.5px; color: #94A3B8; margin-top: 4px; }
    .scanner-box { position: relative; width: 100%; max-width: 340px; aspect-ratio: 1; border-radius: 20px; overflow: hidden; background: #000; box-shadow: 0 8px 32px rgba(56, 189, 248, 0.2); border: 2px solid #38BDF8; margin: auto 0; }
    video { width: 100%; height: 100%; object-fit: cover; }
    .reticle { position: absolute; inset: 0; pointer-events: none; border-radius: 20px; box-shadow: inset 0 0 0 2px rgba(56, 189, 248, 0.6); }
    .scan-line { position: absolute; left: 10%; right: 10%; height: 2px; background: linear-gradient(90deg, transparent, #38BDF8, #22C55E, transparent); box-shadow: 0 0 12px #38BDF8; animation: scanAnim 2s infinite ease-in-out; }
    @keyframes scanAnim {
      0% { top: 15%; opacity: 0; }
      20% { opacity: 1; }
      80% { opacity: 1; }
      100% { top: 85%; opacity: 0; }
    }
    .status-box { background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(8px); border: 1px solid #334155; border-radius: 14px; padding: 12px 16px; width: 100%; max-width: 340px; text-align: center; margin-bottom: 10px; }
    .status-text { font-size: 13px; color: #E2E8F0; font-weight: 600; }
    .error-text { color: #F87171; font-size: 12px; margin-top: 6px; display: none; line-height: 1.4; }
    .btn-retry { display: none; margin: 8px auto 0; background: #0284C7; color: white; border: none; border-radius: 8px; padding: 6px 14px; font-size: 12px; font-weight: 700; cursor: pointer; }
    .fallback-row { display: none; flex-direction: column; gap: 8px; margin-top: 10px; }
    .btn-fb-manual { background: #10B981; color: white; border: none; border-radius: 10px; padding: 10px 14px; font-size: 13px; font-weight: 700; cursor: pointer; }
    .btn-fb-browser { background: #0284C7; color: white; border: none; border-radius: 10px; padding: 10px 14px; font-size: 13px; font-weight: 700; cursor: pointer; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
</head>
<body>
  <div class="header">
    <div class="title">RVM KIOSK SCANNER</div>
    <div class="subtitle">Align the QR code on the kiosk screen • کیوسک کا کیو آر کوڈ اسکین کریں</div>
  </div>

  <div class="scanner-box">
    <video id="video" autoplay playsinline muted></video>
    <div class="reticle"></div>
    <div class="scan-line"></div>
  </div>

  <div class="status-box">
    <div id="statusText" class="status-text">Accessing Camera... • کیمرہ آن ہو رہا ہے</div>
    <div id="errorText" class="error-text"></div>
    <button id="retryBtn" class="btn-retry" onclick="startCamera()">Retry Camera</button>
    <div id="fallbackRow" class="fallback-row">
      <button class="btn-fb-manual" onclick="notifyParent({ type: 'SWITCH_TO_MANUAL' })">Enter PIN Code Manually</button>
      <button class="btn-fb-browser" onclick="notifyParent({ type: 'OPEN_BROWSER_SCANNER' })">Scan via Phone Chrome Browser</button>
    </div>
  </div>

  <script>
    let scanned = false;
    let stream = null;
    let animId = null;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    function notifyParent(data) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    function onFound(code) {
      if (scanned) return;
      scanned = true;
      document.getElementById('statusText').innerText = "✓ Scanned! Crediting points...";
      document.getElementById('statusText').style.color = "#34D399";
      if (animId) cancelAnimationFrame(animId);
      if (stream) {
        try { stream.getTracks().forEach(t => t.stop()); } catch(e){}
      }
      notifyParent({ type: 'QR_SCANNED', text: code });
    }

    function getMediaDevices() {
      if (window.navigator && window.navigator.mediaDevices && typeof window.navigator.mediaDevices.getUserMedia === 'function') {
        return window.navigator.mediaDevices;
      }
      const legacy = window.navigator && (window.navigator.webkitGetUserMedia || window.navigator.mozGetUserMedia || window.navigator.getUserMedia);
      if (legacy) {
        return {
          getUserMedia: (constraints) => new Promise((resolve, reject) => legacy.call(window.navigator, constraints, resolve, reject))
        };
      }
      return null;
    }

    async function startCamera() {
      const statusEl = document.getElementById('statusText');
      const errEl = document.getElementById('errorText');
      const retryBtn = document.getElementById('retryBtn');
      const fallbackRow = document.getElementById('fallbackRow');
      const video = document.getElementById('video');

      errEl.style.display = 'none';
      retryBtn.style.display = 'none';
      if (fallbackRow) fallbackRow.style.display = 'none';
      statusEl.innerText = 'Starting Camera...';
      statusEl.style.color = '#E2E8F0';

      const md = getMediaDevices();
      if (!md) {
        statusEl.innerText = 'Camera Access Restricted by Phone';
        statusEl.style.color = '#F87171';
        errEl.innerText = 'Android WebView camera blocked by device security policy. Choose an option below:';
        errEl.style.display = 'block';
        if (fallbackRow) fallbackRow.style.display = 'flex';
        notifyParent({ type: 'CAMERA_UNSUPPORTED' });
        return;
      }

      try {
        stream = await md.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });

        video.srcObject = stream;
        await video.play();

        statusEl.innerText = 'Point camera at kiosk display • کیوسک کی اسکرین پر فوکس کریں';
        notifyParent({ type: 'CAMERA_READY' });

        let detector = null;
        if ('BarcodeDetector' in window) {
          try {
            detector = new BarcodeDetector({ formats: ['qr_code'] });
          } catch(e) {}
        }

        async function processFrame() {
          if (scanned) return;
          try {
            if (video.readyState >= 2 && video.videoWidth > 0) {
              if (detector) {
                const barcodes = await detector.detect(video);
                if (barcodes && barcodes.length > 0) {
                  onFound(barcodes[0].rawValue);
                  return;
                }
              }
              if (window.jsQR) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imgData.data, imgData.width, imgData.height, {
                  inversionAttempts: 'dontInvert'
                });
                if (code && code.data) {
                  onFound(code.data);
                  return;
                }
              }
            }
          } catch (e) {
            console.warn('Frame scan err:', e);
          }
          animId = requestAnimationFrame(processFrame);
        }

        animId = requestAnimationFrame(processFrame);
      } catch (err) {
        console.error('Camera access error:', err);
        statusEl.innerText = 'Camera Access Blocked';
        statusEl.style.color = '#F87171';
        errEl.innerText = String(err.message || err);
        errEl.style.display = 'block';
        retryBtn.style.display = 'inline-block';
        if (fallbackRow) fallbackRow.style.display = 'flex';
        notifyParent({ type: 'CAMERA_ERROR', error: String(err.message || err) });
      }
    }

    window.addEventListener('load', () => {
      setTimeout(startCamera, 150);
    });
  </script>
</body>
</html>`;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.title}>Scan & Claim Points</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Claim Success Celebration Card */}
        {claimSuccess ? (
          <View style={styles.successCard}>
            <MaterialCommunityIcons name="check-decagram" size={64} color="#10B981" />
            <Text style={styles.successTitle}>Points Claimed!</Text>
            <Text style={styles.successPts}>+{claimSuccess.points} PTS</Text>
            <Text style={styles.successDesc}>{claimSuccess.message}</Text>
            {claimSuccess.newBalance !== undefined && (
              <Text style={styles.newBalanceText}>New Balance: {claimSuccess.newBalance} pts</Text>
            )}
            <View style={styles.successBtnRow}>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => {
                  setClaimSuccess(null);
                  navigation?.navigate('Dashboard');
                }}
              >
                <Text style={styles.doneBtnText}>View Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.anotherBtn}
                onPress={() => setClaimSuccess(null)}
              >
                <Text style={styles.anotherBtnText}>Scan Another</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Active Touchless Kiosk Session Card */}
            {activeKioskSession && (
              <View style={styles.activeSessionCard}>
                <View style={styles.activeHeaderRow}>
                  <View style={styles.pulsingDot} />
                  <Text style={styles.activeHeaderTitle}>KIOSK SESSION IN PROGRESS</Text>
                </View>
                <Text style={styles.activeMachineText}>Connected: {activeKioskSession.machineId}</Text>
                <Text style={styles.activeInstructions}>
                  The kiosk aperture is unlocked! Insert all your containers now. When done, tap below to finish without touching the keypad:
                </Text>
                <TouchableOpacity
                  style={styles.finishBtn}
                  onPress={handleRequestFinish}
                  disabled={claiming}
                  activeOpacity={0.85}
                >
                  {claiming ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="check-circle" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.finishBtnText}>FINISH &amp; CLAIM POINTS</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Primary Action: Open Camera Scanner */}
            <View style={styles.mainCard}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="qrcode-scan" size={48} color="#0284C7" />
              </View>
              <Text style={styles.cardHeader}>Scan Kiosk QR Code</Text>
              <Text style={styles.cardSub}>
                After inserting containers into the RVM kiosk, tap below to scan the QR code on the kiosk screen.
              </Text>

              <TouchableOpacity
                style={styles.scanBtn}
                onPress={handleOpenScanner}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="camera" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.scanBtnText}>Open Camera Scanner</Text>
              </TouchableOpacity>

              {/* Secondary Option: Direct Phone Browser Scanner */}
              <TouchableOpacity
                style={styles.browserScanBtn}
                onPress={() => Linking.openURL('https://isprvm.binishaqsoft.com/claim')}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="google-chrome" size={18} color="#0284C7" style={{ marginRight: 6 }} />
                <Text style={styles.browserScanBtnText}>Open in Phone Browser / Camera</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR ENTER MANUALLY</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Manual Code / Session Input */}
            <View style={styles.manualCard}>
              <Text style={styles.manualLabel}>Session Code / Claim Link</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="numeric" size={22} color="#64748B" style={{ marginLeft: 12 }} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. qr_RVM-001_63892..."
                  placeholderTextColor="#94A3B8"
                  value={sessionInput}
                  onChangeText={setSessionInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {sessionInput.length > 0 && (
                  <TouchableOpacity onPress={() => setSessionInput('')} style={{ padding: 8 }}>
                    <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={[styles.manualLabel, { marginTop: 14 }]}>Wallet Mobile Number</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="phone" size={22} color="#64748B" style={{ marginLeft: 12 }} />
                <TextInput
                  style={styles.input}
                  placeholder="0300 1234567"
                  placeholderTextColor="#94A3B8"
                  value={manualPhone}
                  onChangeText={setManualPhone}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>

              <TouchableOpacity
                style={[styles.claimManualBtn, (!sessionInput.trim() || claiming) && styles.claimBtnDisabled]}
                onPress={() => handleClaim()}
                disabled={!sessionInput.trim() || claiming}
                activeOpacity={0.85}
              >
                {claiming ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="hand-coin" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.claimManualBtnText}>Claim Points Instantly</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* User Phone Badge Note */}
            <View style={styles.infoBanner}>
              <MaterialCommunityIcons name="information-outline" size={20} color="#0284C7" style={{ marginRight: 8 }} />
              <Text style={styles.infoBannerText}>
                Points claimed via QR or kiosk keypad sync immediately across your mobile app, wallet balance, and kiosk screen.
              </Text>
            </View>
          </>
        )}

      </ScrollView>

      {/* Full-Screen Camera Scanner Modal */}
      <Modal
        visible={showScannerModal}
        animationType="slide"
        onRequestClose={() => setShowScannerModal(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowScannerModal(false)} style={styles.modalCloseBtn}>
              <MaterialCommunityIcons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Scan Kiosk Screen</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.webViewContainer}>
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: scannerHtml, baseUrl: 'https://isprvm.binishaqsoft.com' }}
              onPermissionRequest={(event) => {
                try {
                  event.grant(event.resources);
                } catch (e) {
                  console.warn('WebView onPermissionRequest err:', e);
                }
              }}
              mediaCapturePermissionGrantType="grant"
              androidCameraPermissionOptions={{
                title: 'Camera Permission',
                message: 'Eco App needs camera access to scan QR codes on the kiosk screen.',
                buttonPositive: 'Allow',
                buttonNegative: 'Deny',
              }}
              mediaPlaybackRequiresUserAction={false}
              allowsInlineMediaPlayback={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowFileAccess={true}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === 'QR_SCANNED' && data.text) {
                    handleClaim(data.text);
                  } else if (data.type === 'SWITCH_TO_MANUAL') {
                    setShowScannerModal(false);
                  } else if (data.type === 'OPEN_BROWSER_SCANNER') {
                    setShowScannerModal(false);
                    Linking.openURL('https://isprvm.binishaqsoft.com/claim');
                  }
                } catch (e) {
                  console.warn('WebView QR parse error:', e);
                }
              }}
              style={{ flex: 1, backgroundColor: '#0B1329' }}
            />
          </View>

          <View style={styles.modalFooter}>
            <Text style={styles.modalFooterText}>
              Align camera with the QR code displayed on the RVM or PecoDrop machine.
            </Text>
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#BAE6FD',
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  cardSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 14,
    width: '100%',
    paddingVertical: 14,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  scanBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  browserScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1.5,
    borderRadius: 14,
    width: '100%',
    paddingVertical: 12,
    marginTop: 10,
  },
  browserScanBtnText: {
    color: '#0284C7',
    fontSize: 14,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    marginHorizontal: 12,
    letterSpacing: 0.5,
  },
  manualCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  manualLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  claimManualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 18,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  claimBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  claimManualBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 17,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#065F46',
    marginTop: 12,
  },
  successPts: {
    fontSize: 36,
    fontWeight: '900',
    color: '#10B981',
    marginVertical: 8,
  },
  successDesc: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 6,
  },
  newBalanceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
    marginBottom: 20,
  },
  successBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 10,
  },
  doneBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  anotherBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  anotherBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  modalSafe: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  webViewContainer: {
    flex: 1,
  },
  modalFooter: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  modalFooterText: {
    fontSize: 12.5,
    color: '#94A3B8',
    textAlign: 'center',
  },
  activeSessionCard: {
    backgroundColor: '#064E3B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  activeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34D399',
    marginRight: 8,
  },
  activeHeaderTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#A7F3D0',
    letterSpacing: 0.8,
  },
  activeMachineText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  activeInstructions: {
    fontSize: 13,
    color: '#D1FAE5',
    lineHeight: 18,
    marginBottom: 16,
  },
  finishBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});