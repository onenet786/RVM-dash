import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dashboardPath = path.join(__dirname, '..', 'mobile_app', 'screens', 'DashboardScreen.jsx');

let code = fs.readFileSync(dashboardPath, 'utf8');

// 1. Add corporate state variables
const stateAnchor = "const [savingProfile, setSavingProfile] = useState(false);";
const corporateStateCode = `const [savingProfile, setSavingProfile] = useState(false);

  // Corporate Workplace & Employee ID State
  const [showCorporateModal, setShowCorporateModal] = useState(false);
  const [corpCompanyCode, setCorpCompanyCode] = useState('');
  const [corpEmployeeId, setCorpEmployeeId] = useState('');
  const [corpDepartment, setCorpDepartment] = useState('');
  const [corpLoading, setCorpLoading] = useState(false);
  const [availableOrgs, setAvailableOrgs] = useState([
    { org_id: 'ORG_ENGRO', name: 'Engro Corporation', code: 'ENGRO' },
    { org_id: 'ORG_ALFALAH', name: 'Bank Alfalah', code: 'ALFALAH' },
    { org_id: 'ORG_UCP', name: 'Univ. of Central Punjab', code: 'UCP' },
    { org_id: 'ORG_METRO', name: 'Metro Cash & Carry', code: 'METRO' }
  ]);`;

if (!code.includes("showCorporateModal")) {
  code = code.replace(stateAnchor, corporateStateCode);
}

// 2. Add corporate organizations fetch in useEffect
const effectAnchor = "fetchLastBackup();\n  }, []);";
const corporateEffectCode = `fetchLastBackup();

    // Fetch active corporate partner list
    axios.get(\`\${API_BASE_URL}/corporate/organizations\`)
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.organizations) && res.data.organizations.length > 0) {
          setAvailableOrgs(res.data.organizations.map(o => ({
            ...o,
            code: o.org_id ? o.org_id.replace('ORG_', '') : o.name
          })));
        }
      })
      .catch(() => {});
  }, []);`;

if (!code.includes("/corporate/organizations")) {
  code = code.replace(effectAnchor, corporateEffectCode);
}

// 3. Add handleLinkCorporateAccount & handleUnlinkCorporateAccount handlers
const handlersAnchor = "const handleSaveProfile = async () => {";
const corporateHandlersCode = `const handleLinkCorporateAccount = async () => {
    const cleanCode = corpCompanyCode.trim();
    if (!cleanCode) {
      Alert.alert('Company Code Required', 'Please enter your Company Code (e.g., ENGRO, ALFALAH, UCP, METRO) or tap a partner button.');
      return;
    }

    const userId = localUser?.id || localUser?.userId || localUser?.email || localUser?.mobile || localUser?.username;
    if (!userId) {
      Alert.alert('Session Required', 'Please log in again to link your corporate account.');
      return;
    }

    setCorpLoading(true);
    try {
      const res = await axios.post(\`\${API_BASE_URL}/user/link-corporate\`, {
        userId,
        companyCode: cleanCode,
        employeeId: corpEmployeeId.trim(),
        department: corpDepartment.trim()
      }, { timeout: 12000 });

      if (res.data?.success && res.data?.user) {
        const mergedUser = {
          ...localUser,
          ...res.data.user,
          userType: 'ENTERPRISE',
          orgId: res.data.user.orgId,
          orgName: res.data.user.orgName,
          department: res.data.user.department,
          employeeId: res.data.user.employeeId
        };
        setLocalUser(mergedUser);
        await AsyncStorage.setItem('user', JSON.stringify(mergedUser));
        setShowCorporateModal(false);
        setCorpCompanyCode('');
        setCorpEmployeeId('');
        setCorpDepartment('');
        if (Platform.OS === 'android') {
          ToastAndroid.show(\`🎉 Verified! Linked to \${res.data.user.orgName}\`, ToastAndroid.LONG);
        } else {
          Alert.alert('Corporate Verified', res.data.message || 'Corporate account linked successfully!');
        }
      } else {
        Alert.alert('Corporate Link Notice', res.data?.message || 'Could not verify company code.');
      }
    } catch (err) {
      console.warn('Link corporate error:', err);
      Alert.alert('Verification Notice', err.response?.data?.message || err.message || 'Could not link corporate account.');
    } finally {
      setCorpLoading(false);
    }
  };

  const handleUnlinkCorporateAccount = async () => {
    Alert.alert(
      'Unlink Corporate Account',
      'Are you sure you want to disconnect your corporate membership and return to standard Citizen status?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            const userId = localUser?.id || localUser?.userId || localUser?.email || localUser?.mobile || localUser?.username;
            setCorpLoading(true);
            try {
              const res = await axios.post(\`\${API_BASE_URL}/user/unlink-corporate\`, { userId });
              if (res.data?.success) {
                const mergedUser = {
                  ...localUser,
                  userType: 'CITIZEN',
                  orgId: null,
                  orgName: null,
                  department: null,
                  employeeId: null,
                  organization: null
                };
                setLocalUser(mergedUser);
                await AsyncStorage.setItem('user', JSON.stringify(mergedUser));
                setShowCorporateModal(false);
                if (Platform.OS === 'android') {
                  ToastAndroid.show('Switched to Citizen account', ToastAndroid.SHORT);
                }
              }
            } catch (err) {
              Alert.alert('Notice', err.response?.data?.message || err.message);
            } finally {
              setCorpLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSaveProfile = async () => {`;

if (!code.includes("handleLinkCorporateAccount")) {
  code = code.replace(handlersAnchor, corporateHandlersCode);
}

// 4. Update the Corporate Banner area on the dashboard
const bannerTarget = `{/* Corporate Affiliation Card if Enterprise */}
          {isEnterprise && (
            <View style={styles.corporateBanner}>
              <View style={styles.corporateLogoBox}>
                <MaterialCommunityIcons name="domain" size={24} color="#0284C7" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.corporateOrgName} numberOfLines={1}>{orgName}</Text>
                <Text style={styles.corporateMetaText}>
                  {employeeId ? \`Staff ID: \${employeeId}\` : 'Campus Member'}{department ? \` • \${department}\` : ''}
                </Text>
              </View>
              <View style={styles.corporateKioskTag}>
                <MaterialCommunityIcons name="laptop" size={12} color="#0284C7" style={{ marginRight: 3 }} />
                <Text style={styles.corporateKioskTagText}>PecoDrop</Text>
              </View>
            </View>
          )}`;

const newBannerCode = `{/* Corporate Affiliation / Workplace Link Card */}
          {isEnterprise ? (
            <TouchableOpacity 
              style={styles.corporateBanner} 
              onPress={() => setShowCorporateModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.corporateLogoBox}>
                <MaterialCommunityIcons name="domain" size={24} color="#0284C7" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.corporateOrgName} numberOfLines={1}>{orgName}</Text>
                  <MaterialCommunityIcons name="check-decagram" size={14} color="#0284C7" style={{ marginLeft: 4 }} />
                </View>
                <Text style={styles.corporateMetaText}>
                  {employeeId ? \`Staff ID: \${employeeId}\` : 'Campus Member'}{department ? \` • \${department}\` : ''}
                </Text>
              </View>
              <View style={styles.corporateKioskTag}>
                <MaterialCommunityIcons name="laptop" size={12} color="#0284C7" style={{ marginRight: 3 }} />
                <Text style={styles.corporateKioskTagText}>PecoDrop</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.corporateLinkBanner}
              onPress={() => {
                setCorpCompanyCode('');
                setCorpEmployeeId('');
                setCorpDepartment('');
                setShowCorporateModal(true);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.corporateLinkIconBox}>
                <MaterialCommunityIcons name="office-building-cog" size={24} color="#0284C7" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.corporateLinkTitle}>Corporate Workplace Membership</Text>
                  <View style={styles.corporateNewPill}>
                    <Text style={styles.corporateNewPillText}>LINK</Text>
                  </View>
                </View>
                <Text style={styles.corporateLinkSubtitle} numberOfLines={1}>
                  Enter Company Code & Staff ID for PecoDrop perks
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#0284C7" />
            </TouchableOpacity>
          )}`;

if (code.includes(bannerTarget)) {
  code = code.replace(bannerTarget, newBannerCode);
} else {
  console.warn("Banner target not matched exactly, checking regex...");
  const bannerRegex = /\{\/\* Corporate Affiliation Card if Enterprise \*\/\}[\s\S]*?\{\/\* User Information Section/;
  if (bannerRegex.test(code)) {
    code = code.replace(bannerRegex, newBannerCode + "\n\n          {/* User Information Section");
  }
}

// 5. Add Corporate Section inside the Edit Eco Profile modal
const editModalEmailAnchor = `<Text style={styles.modalLabel}>Email Address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter Email"
                placeholderTextColor="#94A3B8"
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />`;

const corporateInEditModal = `<Text style={styles.modalLabel}>Email Address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter Email"
                placeholderTextColor="#94A3B8"
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Corporate Workplace Status & Link Shortcut */}
              <View style={styles.modalCorpSection}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <MaterialCommunityIcons 
                    name={isEnterprise ? "domain" : "office-building"} 
                    size={18} 
                    color={isEnterprise ? "#0284C7" : "#64748B"} 
                    style={{ marginRight: 6 }} 
                  />
                  <Text style={styles.modalCorpSectionTitle}>Corporate / Campus Affiliation</Text>
                </View>
                {isEnterprise ? (
                  <View style={styles.modalCorpLinkedRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalCorpOrgText}>{orgName}</Text>
                      <Text style={styles.modalCorpMetaText}>
                        {employeeId ? \`Staff ID: \${employeeId}\` : 'Verified Staff'}{department ? \` • \${department}\` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.modalCorpManageBtn}
                      onPress={() => {
                        setShowEditModal(false);
                        setShowCorporateModal(true);
                      }}
                    >
                      <Text style={styles.modalCorpManageText}>Manage</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.modalCorpUnlinkedRow}>
                    <Text style={styles.modalCorpUnlinkedText}>
                      Connect your corporate employee code to unlock PecoDrop smart kiosks & cafeteria discounts.
                    </Text>
                    <TouchableOpacity 
                      style={styles.modalCorpLinkBtn}
                      onPress={() => {
                        setShowEditModal(false);
                        setShowCorporateModal(true);
                      }}
                    >
                      <MaterialCommunityIcons name="link-variant" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.modalCorpLinkBtnText}>Link Company Code</Text>
                    </TouchableOpacity>
                  </View>
                )}`;

if (!code.includes("modalCorpSection")) {
  code = code.replace(editModalEmailAnchor, corporateInEditModal);
}

// 6. Add the Dedicated Corporate Workplace Membership Modal
const modalCloseAnchor = `</Modal>\n\n    </SafeAreaView>`;
const corporateModalCode = `</Modal>

      {/* Corporate Workplace & Employee ID Verification Modal */}
      <Modal
        visible={showCorporateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCorporateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '88%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.corporateLogoBox, { width: 34, height: 34, marginRight: 8 }]}>
                  <MaterialCommunityIcons name="domain" size={20} color="#0284C7" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Corporate Membership</Text>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>PecoDrop Campus Recycling</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowCorporateModal(false)} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {isEnterprise ? (
                /* Already Verified Enterprise Member View */
                <View>
                  <View style={styles.corpVerifiedBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <MaterialCommunityIcons name="shield-check" size={22} color="#10B981" style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#065F46' }}>
                        Verified Corporate Account
                      </Text>
                    </View>

                    <View style={styles.corpVerifiedRow}>
                      <Text style={styles.corpVerifiedLabel}>Organization:</Text>
                      <Text style={styles.corpVerifiedVal}>{orgName}</Text>
                    </View>

                    <View style={styles.corpVerifiedRow}>
                      <Text style={styles.corpVerifiedLabel}>Staff ID:</Text>
                      <Text style={styles.corpVerifiedVal}>{employeeId || 'Active Member'}</Text>
                    </View>

                    {department ? (
                      <View style={styles.corpVerifiedRow}>
                        <Text style={styles.corpVerifiedLabel}>Department:</Text>
                        <Text style={styles.corpVerifiedVal}>{department}</Text>
                      </View>
                    ) : null}

                    <View style={styles.corpVerifiedRow}>
                      <Text style={styles.corpVerifiedLabel}>Kiosk Access:</Text>
                      <Text style={[styles.corpVerifiedVal, { color: '#0284C7' }]}>
                        PecoDrop (⭕ Plastic, 🔺 Cans, 🟦 Paper)
                      </Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 12, color: '#64748B', lineHeight: 17, marginBottom: 16 }}>
                    Your recycling contributions are synchronized with {orgName}'s corporate ESG dashboard and cafeteria discount perks.
                  </Text>

                  <TouchableOpacity
                    style={styles.corpUnlinkBtn}
                    onPress={handleUnlinkCorporateAccount}
                    disabled={corpLoading}
                  >
                    {corpLoading ? (
                      <ActivityIndicator size="small" color="#DC2626" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="link-off" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                        <Text style={styles.corpUnlinkText}>Disconnect Corporate Workplace</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                /* Citizen Linking View */
                <View>
                  <Text style={{ fontSize: 13, color: '#475569', lineHeight: 18, marginBottom: 12 }}>
                    Working at a registered corporate campus? Enter your company code and employee ID to unlock exclusive cafeteria perks and PecoDrop smart kiosks.
                  </Text>

                  {/* Partner Quick-Select Chips */}
                  <Text style={styles.modalLabel}>Select Partner Company:</Text>
                  <View style={styles.corpChipGrid}>
                    {availableOrgs.map(org => {
                      const isSelected = corpCompanyCode.toUpperCase() === (org.code || '').toUpperCase() ||
                                         corpCompanyCode.toUpperCase() === (org.org_id || '').toUpperCase();
                      return (
                        <TouchableOpacity
                          key={org.org_id || org.name}
                          style={[styles.corpChip, isSelected && styles.corpChipSelected]}
                          onPress={() => setCorpCompanyCode(org.code || org.org_id.replace('ORG_', ''))}
                        >
                          <MaterialCommunityIcons 
                            name="domain" 
                            size={14} 
                            color={isSelected ? "#0284C7" : "#64748B"} 
                            style={{ marginRight: 4 }} 
                          />
                          <Text style={[styles.corpChipText, isSelected && styles.corpChipTextSelected]}>
                            {org.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Company Code Input */}
                  <Text style={styles.modalLabel}>Company Code or Corporate Domain *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. ENGRO, ALFALAH, UCP, METRO or engro.com"
                    placeholderTextColor="#94A3B8"
                    value={corpCompanyCode}
                    onChangeText={setCorpCompanyCode}
                    autoCapitalize="characters"
                  />

                  {/* Employee ID Input */}
                  <Text style={styles.modalLabel}>Employee / Staff ID *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. EMP-1042 or Staff Badge ID"
                    placeholderTextColor="#94A3B8"
                    value={corpEmployeeId}
                    onChangeText={setCorpEmployeeId}
                  />

                  {/* Department (Optional) */}
                  <Text style={styles.modalLabel}>Department (Optional)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Finance, Operations, IT, HR"
                    placeholderTextColor="#94A3B8"
                    value={corpDepartment}
                    onChangeText={setCorpDepartment}
                  />

                  <View style={styles.modalButtonsRow}>
                    <TouchableOpacity
                      style={styles.modalCancelBtn}
                      onPress={() => setShowCorporateModal(false)}
                      disabled={corpLoading}
                    >
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalSaveBtn, { backgroundColor: '#0284C7' }]}
                      onPress={handleLinkCorporateAccount}
                      disabled={corpLoading}
                    >
                      {corpLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <MaterialCommunityIcons name="check-decagram" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.modalSaveText}>Verify & Link</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>`;

if (!code.includes("showCorporateModal")) {
  code = code.replace(modalCloseAnchor, corporateModalCode);
} else if (!code.includes("Corporate Membership & PecoDrop")) {
  code = code.replace(modalCloseAnchor, corporateModalCode);
}

// 7. Add Styles
const stylesAnchor = "backupButtonText: {\n    color: '#FFFFFF',\n    fontSize: 14,\n    fontWeight: '600',\n  },";
const newStyles = `backupButtonText: {\n    color: '#FFFFFF',\n    fontSize: 14,\n    fontWeight: '600',\n  },
  corporateLinkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  corporateLinkIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  corporateLinkTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  corporateLinkSubtitle: {
    fontSize: 11,
    color: '#059669',
    marginTop: 1,
  },
  corporateNewPill: {
    backgroundColor: '#059669',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  corporateNewPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalCorpSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCorpSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  modalCorpLinkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  modalCorpOrgText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
  },
  modalCorpMetaText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalCorpManageBtn: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  modalCorpManageText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  modalCorpUnlinkedRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCorpUnlinkedText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  modalCorpLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 7,
    borderRadius: 6,
  },
  modalCorpLinkBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  corpChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 10,
  },
  corpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  corpChipSelected: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  corpChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  corpChipTextSelected: {
    color: '#0284C7',
    fontWeight: '700',
  },
  corpVerifiedBox: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  corpVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  corpVerifiedLabel: {
    fontSize: 12,
    color: '#4B5563',
    width: 95,
  },
  corpVerifiedVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  corpUnlinkBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
  },
  corpUnlinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },`;

if (!code.includes("corporateLinkBanner:")) {
  code = code.replace(stylesAnchor, newStyles);
}

fs.writeFileSync(dashboardPath, code, 'utf8');
console.log("Successfully patched mobile_app/screens/DashboardScreen.jsx! New length:", fs.statSync(dashboardPath).size);
